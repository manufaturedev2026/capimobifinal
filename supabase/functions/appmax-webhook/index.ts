import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type, x-appmax-signature",
};

/**
 * Webhook público da AppMax.
 * Eventos: OrderApproved, OrderPaid, OrderPaidByPix, OrderAuthorized, OrderRefunded, OrderCancelled, etc.
 */
async function activateFromWebhook(supabaseAdmin: any, orderId: string) {
  const { data: payment } = await supabaseAdmin
    .from("appmax_payments" as any).select("*").eq("order_id", orderId).maybeSingle();
  if (!payment) return { ok: false, reason: "payment_not_found" };
  if (payment.status === "approved" && payment.activated_at) {
    return { ok: true, already_processed: true };
  }

  const meta = payment.metadata || {};
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
      .from("founder_lots").select("inherited_tier, ia_credits, ia_credits_monthly")
      .eq("id", founderLotId).maybeSingle();
    if (!lot) throw new Error("Lote não encontrado");
    inheritedTier = lot.inherited_tier;
    founderIaCredits = billingPeriod === "monthly" ? (lot.ia_credits_monthly ?? 0) : (lot.ia_credits as number);
    const { data: consumed } = await supabaseAdmin.rpc("consume_founder_slot", { p_lot_id: founderLotId });
    if (!consumed) throw new Error("Lote esgotado");
    if (inheritedTier) tier = inheritedTier;
  }

  await supabaseAdmin.from("seller_subscriptions")
    .update({ is_active: false }).eq("user_id", payment.user_id).eq("is_active", true);

  const days = billingPeriod === "annual" ? 365 : 30;
  const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
  const effectiveBillingPeriod = isFounder
    ? (billingPeriod === "annual" ? "founder" : "monthly") : billingPeriod;

  await supabaseAdmin.from("seller_subscriptions").insert({
    user_id: payment.user_id,
    seller_id: profile.id,
    tier,
    max_items: maxItems,
    is_active: true,
    expires_at: expiresAt,
    payment_method: "appmax",
    payment_status: "confirmado",
    payment_reference: `appmax_${payment.order_id}`,
    started_at: new Date().toISOString(),
    billing_period: effectiveBillingPeriod,
  });

  if (isFounder && founderIaCredits && founderIaCredits > 0) {
    await supabaseAdmin.rpc("add_ai_credits", {
      p_user_id: payment.user_id, p_amount: founderIaCredits,
      p_transaction_type: "monthly_credit", p_tool_key: "founder_lot_grant",
      p_seller_id: profile.id, p_external_reference: `appmax_${payment.order_id}`,
      p_notes: `Créditos do lote Fundador (${tier})`,
      p_metadata: { source: "founder_lot_webhook", lot_id: founderLotId, tier },
    });
  } else {
    await supabaseAdmin.rpc("grant_plan_credits", {
      p_user_id: payment.user_id, p_seller_id: profile.id,
      p_tier: tier, p_billing_period: effectiveBillingPeriod,
    });
  }

  await supabaseAdmin.from("appmax_payments" as any)
    .update({ status: "approved", activated_at: new Date().toISOString() })
    .eq("order_id", payment.order_id);

  return { ok: true, tier };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    const payload = await req.json();
    console.log("[appmax-webhook] event:", payload?.event, "order:", payload?.data?.id);

    // Log do evento
    await supabaseAdmin.from("appmax_webhook_logs" as any).insert({
      event: payload?.event || "unknown",
      order_id: String(payload?.data?.id || ""),
      payload,
    });

    const event = String(payload?.event || "");
    const orderId = String(payload?.data?.id || "");
    if (!orderId) {
      return new Response(JSON.stringify({ ok: true, ignored: "no_order_id" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200,
      });
    }

    const approveEvents = ["OrderApproved", "OrderPaid", "OrderPaidByPix", "OrderAuthorized", "PaymentApproved"];
    if (approveEvents.includes(event)) {
      const result = await activateFromWebhook(supabaseAdmin, orderId);
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200,
      });
    }

    const cancelEvents = ["OrderRefunded", "OrderCancelled", "OrderChargeback"];
    if (cancelEvents.includes(event)) {
      await supabaseAdmin.from("appmax_payments" as any)
        .update({ status: event === "OrderRefunded" ? "refunded" : "cancelled" })
        .eq("order_id", orderId);
    }

    return new Response(JSON.stringify({ ok: true, event }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[appmax-webhook]", msg);
    // Retorna 200 mesmo em erro para AppMax não ficar reentregando indefinidamente
    return new Response(JSON.stringify({ ok: false, error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200,
    });
  }
});