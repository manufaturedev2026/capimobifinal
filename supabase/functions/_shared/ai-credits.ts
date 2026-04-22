import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

export const AI_CREDIT_COSTS: Record<string, number> = {
  capture_ad_copy: 2,
  property_valuation: 5,
  valuation_ad: 2,
  photo_analysis: 3,
  platform_help_chat: 1,
  capture_bot_chat: 1,
  agenda_bot_chat: 1,
  invite_chat: 1,
};

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
  const cost = AI_CREDIT_COSTS[toolKey];

  await admin.rpc("refresh_ai_monthly_credits", {
    p_user_id: userId,
    p_seller_id: sellerId,
  });

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
): Promise<CreditCheck> {
  const cost = AI_CREDIT_COSTS[toolKey];
  await admin.rpc("refresh_ai_monthly_credits", { p_user_id: userId, p_seller_id: sellerId });
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
