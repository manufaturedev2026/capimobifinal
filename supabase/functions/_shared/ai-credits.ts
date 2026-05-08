import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

export const AI_CREDIT_COSTS: Record<string, number> = {
  capture_ad_copy: 2,
  property_valuation: 5,
  valuation_ad: 2,
  photo_analysis: 3,
  platform_help_chat: 1,
  whatsapp_ai_chat: 1,
  capture_bot_chat: 3,
  agenda_bot_chat: 3,
  invite_chat: 3,
};

const DEFAULT_SESSION_BASED_TOOLS = new Set(["whatsapp_ai_chat", "capture_bot_chat", "agenda_bot_chat", "invite_chat"]);
const DEFAULT_SESSION_WINDOW_MINUTES = 30;

// Cache em memória dos custos do DB (1 minuto)
let costsCache: { data: Record<string, { cost: number; is_session_based: boolean; session_window_minutes: number }>; expires: number } | null = null;

async function loadCosts(admin: ReturnType<typeof createClient>) {
  if (costsCache && costsCache.expires > Date.now()) return costsCache.data;
  try {
    const { data } = await (admin as any).from("ai_tool_costs").select("tool_key,cost,is_session_based,session_window_minutes");
    const map: Record<string, { cost: number; is_session_based: boolean; session_window_minutes: number }> = {};
    (data || []).forEach((r: any) => {
      map[r.tool_key] = {
        cost: Number(r.cost),
        is_session_based: !!r.is_session_based,
        session_window_minutes: Number(r.session_window_minutes ?? DEFAULT_SESSION_WINDOW_MINUTES),
      };
    });
    costsCache = { data: map, expires: Date.now() + 60_000 };
    return map;
  } catch {
    return {};
  }
}

async function getToolConfig(admin: ReturnType<typeof createClient>, toolKey: string) {
  const map = await loadCosts(admin);
  const fromDb = map[toolKey];
  if (fromDb) return fromDb;
  return {
    cost: AI_CREDIT_COSTS[toolKey] ?? 1,
    is_session_based: DEFAULT_SESSION_BASED_TOOLS.has(toolKey),
    session_window_minutes: DEFAULT_SESSION_WINDOW_MINUTES,
  };
}

async function shouldChargeForSession(
  admin: ReturnType<typeof createClient>,
  userId: string,
  sellerId: string | null,
  toolKey: string,
  visitorKey: string | null,
): Promise<boolean> {
  const cfg = await getToolConfig(admin, toolKey);
  if (!cfg.is_session_based) return true;
  if (!visitorKey) return true;

  const cutoff = new Date(Date.now() - cfg.session_window_minutes * 60 * 1000).toISOString();

  const { data: existing } = await (admin as any)
    .from("ai_chat_sessions")
    .select("id")
    .eq("user_id", userId)
    .eq("tool_key", toolKey)
    .eq("visitor_key", visitorKey)
    .gte("last_activity_at", cutoff)
    .order("last_activity_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existing?.id) {
    await (admin as any)
      .from("ai_chat_sessions")
      .update({ last_activity_at: new Date().toISOString() })
      .eq("id", existing.id);
    return false;
  }

  await (admin as any).from("ai_chat_sessions").insert({
    user_id: userId,
    seller_id: sellerId,
    tool_key: toolKey,
    visitor_key: visitorKey,
  });
  return true;
}

type CreditCheck = {
  ok: true;
  admin: ReturnType<typeof createClient>;
  userId: string;
  sellerId: string | null;
  cost: number;
  balance: number;
} | {
  ok: false;
  response: Response;
};

export async function consumeAiCredits(
  req: Request,
  toolKey: keyof typeof AI_CREDIT_COSTS,
  corsHeaders: Record<string, string>,
  visitorKey?: string | null,
): Promise<CreditCheck> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return {
      ok: false,
      response: new Response(JSON.stringify({ error: "Faça login para usar a IA." }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }),
    };
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseAnon = Deno.env.get("SUPABASE_ANON_KEY")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const userClient = createClient(supabaseUrl, supabaseAnon, {
    global: { headers: { Authorization: authHeader } },
  });
  const admin = createClient(supabaseUrl, serviceKey);
  const { data: userData } = await userClient.auth.getUser();
  const userId = userData?.user?.id;

  if (!userId) {
    return {
      ok: false,
      response: new Response(JSON.stringify({ error: "Sessão inválida." }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }),
    };
  }

  const { data: subRows } = await admin
    .from("seller_subscriptions")
    .select("seller_id")
    .eq("user_id", userId)
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(1);
  const sellerId = (subRows?.[0]?.seller_id as string | undefined) || null;
  const cost = (await getToolConfig(admin, toolKey)).cost;

  await admin.rpc("refresh_ai_monthly_credits", {
    p_user_id: userId,
    p_seller_id: sellerId,
  });

  // Cobrança por janela de atendimento (apenas para bots de chat)
  const charge = await shouldChargeForSession(admin, userId, sellerId, toolKey, visitorKey ?? null);
  if (!charge) {
    // Janela ainda aberta — sem cobrança
    const { data: walletRow } = await (admin as any)
      .from("ai_credit_wallets")
      .select("balance")
      .eq("user_id", userId)
      .maybeSingle();
    return { ok: true, admin, userId, sellerId, cost: 0, balance: Number(walletRow?.balance ?? 0) };
  }

  const { data: debit, error } = await admin.rpc("consume_ai_credits", {
    p_user_id: userId,
    p_amount: cost,
    p_tool_key: toolKey,
    p_seller_id: sellerId,
    p_notes: `Uso de ${toolKey}`,
    p_metadata: { source: "edge_function" },
  });

  if (error || !debit?.success) {
    return {
      ok: false,
      response: new Response(JSON.stringify({
        error: "Créditos IA insuficientes. Compre mais créditos ou aguarde a renovação mensal.",
        aiCredits: { balance: debit?.balance ?? 0, required: cost },
      }), {
        status: 402,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }),
    };
  }

  return { ok: true, admin, userId, sellerId, cost, balance: Number(debit.balance ?? 0) };
}

export async function refundAiCredits(
  admin: ReturnType<typeof createClient>,
  userId: string,
  sellerId: string | null,
  amount: number,
  toolKey: string,
) {
  if (!amount || amount <= 0) return; // sem cobrança, sem estorno
  await admin.rpc("refund_ai_credits", {
    p_user_id: userId,
    p_amount: amount,
    p_tool_key: toolKey,
    p_seller_id: sellerId,
    p_notes: "Estorno automático: a IA não concluiu a solicitação.",
    p_metadata: { source: "edge_function" },
  });
}

export async function consumeAiCreditsForUser(
  admin: ReturnType<typeof createClient>,
  userId: string,
  sellerId: string | null,
  toolKey: keyof typeof AI_CREDIT_COSTS,
  corsHeaders: Record<string, string>,
  visitorKey?: string | null,
): Promise<CreditCheck> {
  const cost = (await getToolConfig(admin, toolKey)).cost;
  await admin.rpc("refresh_ai_monthly_credits", { p_user_id: userId, p_seller_id: sellerId });

  const charge = await shouldChargeForSession(admin, userId, sellerId, toolKey, visitorKey ?? null);
  if (!charge) {
    const { data: walletRow } = await (admin as any)
      .from("ai_credit_wallets")
      .select("balance")
      .eq("user_id", userId)
      .maybeSingle();
    return { ok: true, admin, userId, sellerId, cost: 0, balance: Number(walletRow?.balance ?? 0) };
  }

  const { data: debit, error } = await admin.rpc("consume_ai_credits", {
    p_user_id: userId,
    p_amount: cost,
    p_tool_key: toolKey,
    p_seller_id: sellerId,
    p_notes: `Uso de ${toolKey}`,
    p_metadata: { source: "edge_function" },
  });

  if (error || !debit?.success) {
    return {
      ok: false,
      response: new Response(JSON.stringify({
        error: "Créditos IA insuficientes. Compre mais créditos ou aguarde a renovação mensal.",
        aiCredits: { balance: debit?.balance ?? 0, required: cost },
      }), {
        status: 402,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }),
    };
  }

  return { ok: true, admin, userId, sellerId, cost, balance: Number(debit.balance ?? 0) };
}
