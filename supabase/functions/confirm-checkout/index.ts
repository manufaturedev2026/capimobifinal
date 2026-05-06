import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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
 * Confirma um checkout one-time concluído:
 * - Verifica o pagamento no Stripe
 * - Substitui o plano ativo do usuário (mensal=30d, anual=365d)
 * - Concede créditos IA do novo plano (acumula com saldo atual)
 */
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );
  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Não autenticado");
    const token = authHeader.replace("Bearer ", "");
    const { data: userData } = await supabaseClient.auth.getUser(token);
    const user = userData.user;
    if (!user) throw new Error("Não autenticado");

    const { session_id } = await req.json();
    if (!session_id || typeof session_id !== "string") {
      throw new Error("session_id obrigatório");
    }

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    const session = await stripe.checkout.sessions.retrieve(session_id);
    if (session.payment_status !== "paid") {
      return new Response(
        JSON.stringify({ ok: false, status: session.payment_status }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    const meta = session.metadata || {};
    if (meta.user_id !== user.id) {
      throw new Error("Sessão não pertence a este usuário");
    }
    let tier = String(meta.tier || "");
    const billingPeriod = String(meta.billing_period || "monthly");
    const maxItems = parseInt(String(meta.max_items || "5")) || 5;
    const isFounder = String(meta.is_founder || "0") === "1";
    const founderLotId = String(meta.founder_lot_id || "");

    if (!tier) throw new Error("Tier ausente na sessão");

    // Idempotência
    const { data: existingForSession } = await supabaseAdmin
      .from("seller_subscriptions")
      .select("id")
      .eq("user_id", user.id)
      .eq("payment_reference", session.id)
      .limit(1);
    if (existingForSession && existingForSession.length > 0) {
      return new Response(
        JSON.stringify({ ok: true, already_processed: true, tier }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();
    if (!profile) throw new Error("Perfil não encontrado");

    // Carrega config do lote ANTES de consumir, para herdar tier + créditos
    let inheritedTier: string | null = null;
    let founderIaCredits: number | null = null;
    if (isFounder && founderLotId) {
      const { data: lot, error: lotErr } = await supabaseAdmin
        .from("founder_lots")
        .select("inherited_tier, ia_credits, ia_credits_monthly")
        .eq("id", founderLotId)
        .maybeSingle();
      if (lotErr) throw lotErr;
      if (!lot) throw new Error("Lote Fundador não encontrado");
      inheritedTier = lot.inherited_tier as string;
      // Mensal: usa ia_credits_monthly (créditos do plano base × 0.5).
      // Anual: usa ia_credits (12× o valor mensal).
      founderIaCredits = billingPeriod === "monthly"
        ? ((lot as { ia_credits_monthly?: number }).ia_credits_monthly ?? 0)
        : (lot.ia_credits as number);

      const { data: consumed, error: consErr } = await supabaseAdmin.rpc("consume_founder_slot", {
        p_lot_id: founderLotId,
      });
      if (consErr) throw consErr;
      if (!consumed) throw new Error("Lote Fundador esgotado ou desativado");

      // Substitui o tier da assinatura pelo plano herdado, garantindo que
      // os benefícios da plataforma sigam o plano (ex: VIP, Prime Empresa).
      // O tier "fundador_*" original fica registrado nos metadados do checkout.
      if (inheritedTier) tier = inheritedTier;
    }

    // Acúmulo de planos: NÃO desativa assinaturas ativas anteriores.
    // Cada compra cria uma nova linha com sua própria validade.
    // Limpa apenas assinaturas já vencidas para manter a base limpa.
    await supabaseAdmin
      .from("seller_subscriptions")
      .update({ is_active: false })
      .eq("user_id", user.id)
      .eq("is_active", true)
      .lt("expires_at", new Date().toISOString());

    // Fundador anual = 365 dias; Fundador mensal = 30 dias
    const days = ((isFounder && billingPeriod === "annual") || (!isFounder && billingPeriod === "annual")) ? 365 : 30;
    const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();

    // Fundador anual usa 'founder' (entrega créditos de uma vez); Fundador mensal usa 'monthly' (recarga mensal)
    const effectiveBillingPeriod = isFounder
      ? (billingPeriod === "annual" ? "founder" : "monthly")
      : billingPeriod;

    const { error: insErr } = await supabaseAdmin
      .from("seller_subscriptions")
      .insert({
        user_id: user.id,
        seller_id: profile.id,
        tier,
        max_items: maxItems,
        is_active: true,
        expires_at: expiresAt,
        payment_method: "stripe",
        payment_status: "confirmado",
        payment_reference: session.id,
        started_at: new Date().toISOString(),
        billing_period: effectiveBillingPeriod,
      });
    if (insErr) throw insErr;

    // Créditos IA:
    // - Fundador: usa quantidade configurada no lote (uma única vez)
    // - Anual: grant_plan_credits entrega 12× o valor mensal de uma vez
    // - Mensal: grant_plan_credits entrega o valor mensal e recarrega todo mês
    let creditsResult: unknown = null;
    if (isFounder && founderIaCredits && founderIaCredits > 0) {
      const { data } = await supabaseAdmin.rpc("add_ai_credits", {
        p_user_id: user.id,
        p_amount: founderIaCredits,
        p_transaction_type: "monthly_credit",
        p_tool_key: "founder_lot_grant",
        p_seller_id: profile.id,
        p_external_reference: session.id,
        p_notes: `Créditos do lote Fundador (${tier})`,
        p_metadata: { source: "founder_lot", lot_id: founderLotId, tier },
      });
      creditsResult = data;
    } else {
      const { data } = await supabaseAdmin.rpc("grant_plan_credits", {
        p_user_id: user.id,
        p_seller_id: profile.id,
        p_tier: tier,
        p_billing_period: effectiveBillingPeriod,
      });
      creditsResult = data;
    }

    await notifyAdmin({
      kind: "plan",
      tier,
      amount: session.amount_total ? session.amount_total / 100 : null,
      user_id: user.id,
      billing_period: effectiveBillingPeriod,
    });

    return new Response(
      JSON.stringify({
        ok: true,
        tier,
        billing_period: billingPeriod,
        expires_at: expiresAt,
        credits: creditsResult,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
