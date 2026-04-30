import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const APPMAX_BASE = "https://admin.appmax.com.br/api/v3";

async function notifyAdmin(payload: Record<string, unknown>) {
  try {
    const url = `${Deno.env.get("SUPABASE_URL")}/functions/v1/notify-admin-purchase`;
    await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
      },
      body: JSON.stringify(payload),
    });
  } catch (e) { console.error("notifyAdmin error:", e); }
}

/**
 * Confirma um pedido AppMax: consulta status e se aprovado, ativa o plano.
 * Pode ser chamado pelo frontend (polling do PIX ou após cartão) e pelo webhook.
 */
async function activateSubscription(supabaseAdmin: any, payment: any) {
  if (payment.status === "approved" && payment.activated_at) {
    return { ok: true, already_processed: true, tier: payment.tier };
  }

  const meta = payment.metadata || {};

  // ==== Compra de créditos de IA (PIX) ====
  if (meta.kind === "credits") {
    const credits = parseInt(String(meta.credits || "0")) || 0;
    if (credits <= 0) throw new Error("Quantidade de créditos inválida");

    const { data: profile } = await supabaseAdmin
      .from("profiles").select("id").eq("user_id", payment.user_id).maybeSingle();

    await supabaseAdmin.rpc("add_ai_credits", {
      p_user_id: payment.user_id,
      p_amount: credits,
      p_transaction_type: "purchase",
      p_tool_key: "credit_purchase",
      p_seller_id: meta.seller_id || profile?.id || null,
      p_external_reference: `appmax_${payment.order_id}`,
      p_notes: `Compra de ${credits} créditos via AppMax PIX (R$ ${Number(payment.amount).toFixed(2).replace(".", ",")})`,
      p_metadata: { source: "appmax_credits", order_id: payment.order_id, amount: payment.amount },
    });

    await supabaseAdmin.from("appmax_payments" as any)
      .update({ status: "approved", activated_at: new Date().toISOString() })
      .eq("order_id", payment.order_id);

    await notifyAdmin({ kind: "credits", credits, amount: payment.amount, user_id: payment.user_id });

    return { ok: true, kind: "credits", credits };
  }

  let tier = String(payment.tier);
  const billingPeriod = String(payment.billing_period || "monthly");
  const isFounder = !!meta.is_founder;
  const founderLotId = meta.founder_lot_id || null;
  const maxItems = parseInt(String(meta.max_items || "5")) || 5;

  const { data: profile } = await supabaseAdmin
    .from("profiles").select("id").eq("user_id", payment.user_id).maybeSingle();
  if (!profile) throw new Error("Perfil não encontrado");

  let inheritedTier: string | null = null;
  let founderIaCredits: number | null = null;
  if (isFounder && founderLotId) {
    const { data: lot } = await supabaseAdmin
      .from("founder_lots")
      .select("inherited_tier, ia_credits, ia_credits_monthly")
      .eq("id", founderLotId).maybeSingle();
    if (!lot) throw new Error("Lote Fundador não encontrado");
    inheritedTier = lot.inherited_tier;
    founderIaCredits = billingPeriod === "monthly"
      ? (lot.ia_credits_monthly ?? 0)
      : (lot.ia_credits as number);

    const { data: consumed } = await supabaseAdmin.rpc("consume_founder_slot", { p_lot_id: founderLotId });
    if (!consumed) throw new Error("Lote Fundador esgotado");
    if (inheritedTier) tier = inheritedTier;
  }

  await supabaseAdmin.from("seller_subscriptions")
    .update({ is_active: false }).eq("user_id", payment.user_id).eq("is_active", true);

  const days = billingPeriod === "annual" ? 365 : 30;
  const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
  const effectiveBillingPeriod = isFounder
    ? (billingPeriod === "annual" ? "founder" : "monthly")
    : billingPeriod;

  await supabaseAdmin.from("seller_subscriptions").insert({
    user_id: payment.user_id,
    seller_id: profile.id,
    tier,
    max_items: maxItems,
    is_active: true,
    expires_at: expiresAt,
    payment_method: "appmax",
    payment_status: "confirmado",
    payment_reference: `appmax_${payment.order_id}${isFounder && founderLotId ? `_lot_${founderLotId}` : ""}`,
    started_at: new Date().toISOString(),
    billing_period: effectiveBillingPeriod,
  });

  if (isFounder && founderIaCredits && founderIaCredits > 0) {
    await supabaseAdmin.rpc("add_ai_credits", {
      p_user_id: payment.user_id,
      p_amount: founderIaCredits,
      p_transaction_type: "monthly_credit",
      p_tool_key: "founder_lot_grant",
      p_seller_id: profile.id,
      p_external_reference: `appmax_${payment.order_id}`,
      p_notes: `Créditos do lote Fundador (${tier})`,
      p_metadata: { source: "founder_lot", lot_id: founderLotId, tier },
    });
  } else {
    await supabaseAdmin.rpc("grant_plan_credits", {
      p_user_id: payment.user_id,
      p_seller_id: profile.id,
      p_tier: tier,
      p_billing_period: effectiveBillingPeriod,
    });
  }

  await supabaseAdmin.from("appmax_payments" as any)
    .update({ status: "approved", activated_at: new Date().toISOString() })
    .eq("order_id", payment.order_id);

  await notifyAdmin({
    kind: "plan", tier, amount: payment.amount, user_id: payment.user_id,
    billing_period: effectiveBillingPeriod,
  });

  return { ok: true, tier, expires_at: expiresAt };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );
  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    const apiKey = Deno.env.get("APPMAX_API_KEY");
    if (!apiKey) throw new Error("APPMAX_API_KEY não configurada");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Não autenticado");
    const { data: udata } = await supabaseClient.auth.getUser(authHeader.replace("Bearer ", ""));
    const user = udata.user;
    if (!user) throw new Error("Não autenticado");

    const { order_id } = await req.json();
    if (!order_id) throw new Error("order_id obrigatório");

    const { data: payment } = await supabaseAdmin
      .from("appmax_payments" as any)
      .select("*").eq("order_id", String(order_id)).eq("user_id", user.id).maybeSingle();
    if (!payment) throw new Error("Pedido não encontrado");

    // Consulta status real na AppMax
    const statusRes = await fetch(`${APPMAX_BASE}/order/${order_id}?access-token=${encodeURIComponent(apiKey)}`, {
      method: "GET",
    });
    const statusJson = await statusRes.json();
    const remoteStatus = String(statusJson?.data?.status || "").toLowerCase();

    const isApproved = ["aprovado", "approved", "paid", "pago"].includes(remoteStatus);

    if (isApproved) {
      const result = await activateSubscription(supabaseAdmin, payment);
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200,
      });
    }

    return new Response(JSON.stringify({ ok: false, status: remoteStatus || "pending" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[appmax-confirm]", msg);
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500,
    });
  }
});