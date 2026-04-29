import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Monthly recurring price IDs (assinaturas mensais base do Stripe)
const TIER_PRICES: Record<string, string> = {
  start: "price_1THCtiA3teTHF5ONpr1FStDh",
  premium: "price_1THCuCA3teTHF5ONI7IKoAdr",
  vip: "price_1THDpbA3teTHF5ONdXA10lcs",
  essencial_empresa: "price_1THDq0A3teTHF5ONdo5k2dSk",
  premium_empresa: "price_1THDqLA3teTHF5ONtDLVuFVT",
  prime_empresa: "price_1THDqhA3teTHF5ONtDLVuFVT",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Cliente público (para auth) e cliente admin (para inserts auditados)
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
    if (!tier || !TIER_PRICES[tier]) {
      throw new Error(`Plano inválido: ${tier}`);
    }

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

    // Limite de segurança: não passa de 95% de desconto
    if (totalDiscount > 95) totalDiscount = 95;

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

    // ==== Cria coupon dinâmico no Stripe se houver desconto ====
    const sessionParams: any = {
      customer: customerId,
      line_items: [{ price: TIER_PRICES[tier], quantity: 1 }],
      mode: "subscription",
      success_url: `${req.headers.get("origin")}/painel?checkout=success&tier=${tier}`,
      cancel_url: `${req.headers.get("origin")}/pacotes?checkout=cancelled`,
      metadata: {
        user_id: user.id,
        tier,
        billing_period,
        applied_coupon_code: appliedCouponCode || "",
        applied_coupon_id: appliedCouponId || "",
        total_discount_percent: String(totalDiscount),
      },
    };

    if (totalDiscount > 0) {
      const stripeCoupon = await stripe.coupons.create({
        percent_off: totalDiscount,
        duration: "forever", // desconto vitalício enquanto manter assinatura
        name: couponDescription.slice(0, 40),
        metadata: {
          user_id: user.id,
          tier,
          billing_period,
        },
      });
      sessionParams.discounts = [{ coupon: stripeCoupon.id }];
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    // ==== Registra uso do cupom (auditoria) ====
    if (appliedCouponId) {
      await supabaseAdmin.from("coupon_redemptions").insert({
        coupon_id: appliedCouponId,
        user_id: user.id,
        tier,
        billing_period,
        discount_percent: totalDiscount,
        stripe_session_id: session.id,
      });

      // Incrementa uses_count
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
