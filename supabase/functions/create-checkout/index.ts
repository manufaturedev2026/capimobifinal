import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;
    if (!user?.email) throw new Error("Usuário não autenticado");

    const { tier, billing_period = "monthly", coupon_code = null } = await req.json();
    if (!tier) throw new Error("Plano inválido");
    if (!["monthly", "annual"].includes(billing_period)) throw new Error("Período inválido");

    // Busca o plano no banco
    const { data: plan, error: planErr } = await supabaseAdmin
      .from("subscription_plans")
      .select("tier, name, price, max_items, is_active")
      .eq("tier", tier)
      .eq("is_active", true)
      .maybeSingle();
    if (planErr) throw planErr;
    if (!plan) throw new Error(`Plano ${tier} não encontrado`);
    if (Number(plan.price) <= 0) throw new Error("Plano gratuito não exige checkout");

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    // ==== Calcula desconto total (anual + cupom) ====
    let totalDiscount = 0;
    let appliedCouponId: string | null = null;
    let appliedCouponCode: string | null = null;
    let couponDescription = "";

    if (billing_period === "annual") {
      const { data: setting } = await supabaseAdmin
        .from("platform_settings")
        .select("value")
        .eq("key", "annual_discount_percent")
        .maybeSingle();
      const annualPct = parseInt(setting?.value || "20") || 0;
      totalDiscount += annualPct;
      if (annualPct > 0) couponDescription = `Plano Anual (-${annualPct}%)`;
    }

    if (coupon_code) {
      const { data: cpn, error: cpnErr } = await supabaseAdmin
        .from("discount_coupons")
        .select("*")
        .eq("code", String(coupon_code).toUpperCase())
        .eq("is_active", true)
        .maybeSingle();

      if (cpnErr) throw cpnErr;
      if (!cpn) throw new Error("Cupom inválido ou inativo");
      if (cpn.valid_until && new Date(cpn.valid_until) < new Date()) {
        throw new Error("Cupom expirado");
      }
      if (cpn.max_uses && cpn.uses_count >= cpn.max_uses) {
        throw new Error("Cupom esgotado");
      }
      if (cpn.applicable_tiers && cpn.applicable_tiers.length > 0 && !cpn.applicable_tiers.includes(tier)) {
        throw new Error("Cupom não vale para este plano");
      }
      if (cpn.applies_to === "monthly" && billing_period === "annual") {
        throw new Error("Cupom só vale para planos mensais");
      }
      if (cpn.applies_to === "annual" && billing_period === "monthly") {
        throw new Error("Cupom só vale para planos anuais");
      }

      totalDiscount += cpn.discount_percent;
      appliedCouponId = cpn.id;
      appliedCouponCode = cpn.code;
      couponDescription = couponDescription
        ? `${couponDescription} + Cupom ${cpn.code} (-${cpn.discount_percent}%)`
        : `Cupom ${cpn.code} (-${cpn.discount_percent}%)`;
    }

    if (totalDiscount > 95) totalDiscount = 95;

    // ==== Calcula valor total da compra (one-time payment) ====
    const basePrice = Number(plan.price); // preço mensal base
    const months = billing_period === "annual" ? 12 : 1;
    const grossTotal = basePrice * months; // total bruto antes do desconto
    const finalTotal = grossTotal * (1 - totalDiscount / 100);
    const amountCents = Math.round(finalTotal * 100);

    if (amountCents < 50) throw new Error("Valor final muito baixo para checkout (mínimo R$ 0,50)");

    const periodLabel = billing_period === "annual" ? "Anual (12 meses)" : "Mensal (30 dias)";
    const productName = `${plan.name} - ${periodLabel}`;
    const productDescription = totalDiscount > 0
      ? `${couponDescription} aplicado. Pagamento único, sem renovação automática.`
      : `Pagamento único, sem renovação automática.`;

    // ==== Find or create customer ====
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId: string;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    } else {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { user_id: user.id },
      });
      customerId = customer.id;
    }

    // ==== One-time payment session (sem renovação) ====
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [
        {
          price_data: {
            currency: "brl",
            product_data: {
              name: productName,
              description: productDescription,
            },
            unit_amount: amountCents,
          },
          quantity: 1,
        },
      ],
      mode: "payment", // 🔑 pagamento único, sem renovação automática
      success_url: `${req.headers.get("origin")}/pacotes?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get("origin")}/pacotes?checkout=cancelled`,
      metadata: {
        user_id: user.id,
        tier,
        billing_period,
        applied_coupon_code: appliedCouponCode || "",
        applied_coupon_id: appliedCouponId || "",
        total_discount_percent: String(totalDiscount),
        max_items: String(plan.max_items),
        gross_total: String(grossTotal.toFixed(2)),
        final_total: String(finalTotal.toFixed(2)),
      },
    });

    // ==== Auditoria do cupom ====
    if (appliedCouponId) {
      await supabaseAdmin.from("coupon_redemptions").insert({
        coupon_id: appliedCouponId,
        user_id: user.id,
        tier,
        billing_period,
        discount_percent: totalDiscount,
        stripe_session_id: session.id,
      });

      const { data: current } = await supabaseAdmin
        .from("discount_coupons")
        .select("uses_count")
        .eq("id", appliedCouponId)
        .maybeSingle();
      await supabaseAdmin
        .from("discount_coupons")
        .update({ uses_count: (current?.uses_count || 0) + 1 })
        .eq("id", appliedCouponId);
    }

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
