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

    const { tier, billing_period = "monthly", coupon_code = null, founder_lot_id = null, is_founder_upgrade = false } = await req.json();
    if (!tier) throw new Error("Plano inválido");
    if (!["monthly", "annual"].includes(billing_period)) throw new Error("Período inválido");

    const isFounder = tier === "fundador_corretor" || tier === "fundador_empresa";

    // Busca o plano no banco (planos Fundador são is_active=false, então não filtramos por isso)
    const { data: plan, error: planErr } = await supabaseAdmin
      .from("subscription_plans")
      .select("tier, name, price, max_items, is_active, category")
      .eq("tier", tier)
      .maybeSingle();
    if (planErr) throw planErr;
    if (!plan) throw new Error(`Plano ${tier} não encontrado`);
    if (!isFounder && !plan.is_active) throw new Error(`Plano ${tier} indisponível`);
    if (!isFounder && Number(plan.price) <= 0) throw new Error("Plano gratuito não exige checkout");

    // ==== Validação especial para Fundador ====
    let founderLot: any = null;
    let upgradeCreditCents = 0; // crédito proporcional do lote anterior (em centavos)
    let previousFounderLot: any = null;
    if (isFounder) {
      if (!founder_lot_id) throw new Error("Lote do plano Fundador não informado");
      const { data: lot, error: lotErr } = await supabaseAdmin
        .from("founder_lots")
        .select("id, category, lot_number, price, total_slots, used_slots, is_active")
        .eq("id", founder_lot_id)
        .maybeSingle();
      if (lotErr) throw lotErr;
      if (!lot) throw new Error("Lote Fundador não encontrado");
      if (!lot.is_active) throw new Error("Lote Fundador desativado");
      if (lot.used_slots >= lot.total_slots) throw new Error("Lote Fundador esgotado");

      const expectedCat = tier === "fundador_corretor" ? "individual" : "enterprise";
      if (lot.category !== expectedCat) throw new Error("Lote não corresponde ao plano");
      founderLot = lot;

      // ==== UPGRADE entre lotes Fundador: calcula crédito proporcional ====
      if (is_founder_upgrade) {
        const { data: currentSub } = await supabaseAdmin
          .from("seller_subscriptions")
          .select("id, tier, started_at, expires_at, notes, payment_reference")
          .eq("user_id", user.id)
          .eq("is_active", true)
          .maybeSingle();
        if (!currentSub) throw new Error("Você não possui assinatura Fundador ativa para fazer upgrade");
        if (currentSub.tier !== tier) {
          throw new Error("Upgrade Fundador só é permitido para a mesma categoria (corretor ou empresa)");
        }

        // Tenta extrair o lote anterior pelo notes/payment_reference
        const refMatch = (currentSub.payment_reference || currentSub.notes || "").match(/lot[_:]?([a-f0-9-]{8,})/i);
        if (refMatch?.[1]) {
          const { data: prevLot } = await supabaseAdmin
            .from("founder_lots")
            .select("id, lot_number, price")
            .eq("id", refMatch[1])
            .maybeSingle();
          if (prevLot) previousFounderLot = prevLot;
        }

        // Calcula valor proporcional do tempo restante
        const now = Date.now();
        const startMs = new Date(currentSub.started_at).getTime();
        const endMs = new Date(currentSub.expires_at).getTime();
        const totalMs = endMs - startMs;
        const remainingMs = Math.max(0, endMs - now);
        const remainingRatio = totalMs > 0 ? remainingMs / totalMs : 0;

        // Se temos o lote anterior, usa o preço dele; senão estima pelo lote atual menos 1
        const previousPrice = previousFounderLot?.price
          ?? Math.max(0, Number(founderLot.price) - 100); // fallback conservador

        upgradeCreditCents = Math.round(Number(previousPrice) * remainingRatio * 100);

        // Garante que o upgrade só é permitido para um lote SUPERIOR (preço maior)
        if (Number(founderLot.price) <= Number(previousPrice)) {
          throw new Error("Upgrade só é permitido para um lote Fundador de valor superior");
        }
      }
    }


    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    // ==== Calcula desconto total (anual + cupom) ====
    let totalDiscount = 0;
    let appliedCouponId: string | null = null;
    let appliedCouponCode: string | null = null;
    let couponDescription = "";

    if (billing_period === "annual" && !isFounder) {
      const { data: setting } = await supabaseAdmin
        .from("platform_settings")
        .select("value")
        .eq("key", "annual_discount_percent")
        .maybeSingle();
      const annualPct = parseInt(setting?.value || "20") || 0;
      totalDiscount += annualPct;
      if (annualPct > 0) couponDescription = `Plano Anual (-${annualPct}%)`;
    }

    if (coupon_code && !isFounder) {
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
    let grossTotal: number;
    let finalTotal: number;
    let periodLabel: string;

    if (isFounder) {
      // Fundador: preço fixo do lote, sem desconto, vale 1 ano
      grossTotal = Number(founderLot.price);
      finalTotal = grossTotal;
      periodLabel = `Fundador Lote ${founderLot.lot_number} · 1 ano`;
    } else {
      const basePrice = Number(plan.price);
      const months = billing_period === "annual" ? 12 : 1;
      grossTotal = basePrice * months;
      finalTotal = grossTotal * (1 - totalDiscount / 100);
      periodLabel = billing_period === "annual" ? "Anual (12 meses)" : "Mensal (30 dias)";
    }
    const amountCents = Math.round(finalTotal * 100);

    if (amountCents < 50) throw new Error("Valor final muito baixo para checkout (mínimo R$ 0,50)");

    const productName = `${plan.name} - ${periodLabel}`;
    const productDescription = isFounder
      ? `🏆 Membro Fundador · Acesso por 1 ano · Pagamento único, sem renovação automática.`
      : (totalDiscount > 0
        ? `${couponDescription} aplicado. Pagamento único, sem renovação automática.`
        : `Pagamento único, sem renovação automática.`);

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
        billing_period: isFounder ? "annual" : billing_period,
        is_founder: isFounder ? "1" : "0",
        founder_lot_id: isFounder ? founderLot.id : "",
        founder_lot_number: isFounder ? String(founderLot.lot_number) : "",
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
