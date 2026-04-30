import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const APPMAX_BASE = "https://admin.appmax.com.br/api/v3";

/**
 * Cria um pedido na AppMax para checkout via PIX ou Cartão.
 * Reproduz a mesma lógica de preço/cupom/founder do create-checkout (Stripe).
 * Retorna { url: "/checkout-appmax/<orderId>" } para que o frontend abra a página interna de pagamento.
 */
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
    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;
    if (!user?.email) throw new Error("Usuário não autenticado");

    const {
      tier,
      billing_period = "monthly",
      coupon_code = null,
      founder_lot_id = null,
      is_founder_upgrade = false,
    } = await req.json();
    if (!tier) throw new Error("Plano inválido");
    if (!["monthly", "annual"].includes(billing_period)) throw new Error("Período inválido");

    const isFounder =
      tier === "fundador_corretor" || tier === "fundador_empresa" || tier === "fundador_construtora";

    const { data: plan, error: planErr } = await supabaseAdmin
      .from("subscription_plans")
      .select("tier, name, price, max_items, is_active, category")
      .eq("tier", tier)
      .maybeSingle();
    if (planErr) throw planErr;
    if (!plan) throw new Error(`Plano ${tier} não encontrado`);
    if (!isFounder && !plan.is_active) throw new Error(`Plano ${tier} indisponível`);
    if (!isFounder && Number(plan.price) <= 0) throw new Error("Plano gratuito não exige checkout");

    // ==== Founder lot ====
    let founderLot: any = null;
    let upgradeCreditCents = 0;
    if (isFounder) {
      if (!founder_lot_id) throw new Error("Lote Fundador não informado");
      const { data: lot, error: lotErr } = await supabaseAdmin
        .from("founder_lots")
        .select("id, category, lot_number, price, monthly_price, total_slots, used_slots, is_active")
        .eq("id", founder_lot_id)
        .maybeSingle();
      if (lotErr) throw lotErr;
      if (!lot) throw new Error("Lote Fundador não encontrado");
      if (!lot.is_active) throw new Error("Lote Fundador desativado");
      if (lot.used_slots >= lot.total_slots) throw new Error("Lote Fundador esgotado");
      const expectedCat =
        tier === "fundador_corretor" ? "corretor" :
        tier === "fundador_empresa" ? "empresa" : "construtora";
      if (lot.category !== expectedCat) throw new Error("Lote não corresponde ao plano");
      founderLot = lot;
      if (billing_period === "monthly" && (!lot.monthly_price || Number(lot.monthly_price) <= 0)) {
        throw new Error("Este lote não tem preço mensal cadastrado");
      }
      if (is_founder_upgrade) {
        const { data: currentSub } = await supabaseAdmin
          .from("seller_subscriptions")
          .select("id, tier, started_at, expires_at, payment_reference, notes")
          .eq("user_id", user.id)
          .eq("is_active", true)
          .maybeSingle();
        if (!currentSub) throw new Error("Sem assinatura Fundador ativa para upgrade");
        if (currentSub.tier !== tier) throw new Error("Upgrade só na mesma categoria");
        const refMatch = (currentSub.payment_reference || currentSub.notes || "").match(/lot[_:]?([a-f0-9-]{8,})/i);
        let prevPrice = Math.max(0, Number(founderLot.price) - 100);
        if (refMatch?.[1]) {
          const { data: prevLot } = await supabaseAdmin
            .from("founder_lots").select("price").eq("id", refMatch[1]).maybeSingle();
          if (prevLot) prevPrice = Number(prevLot.price);
        }
        const startMs = new Date(currentSub.started_at).getTime();
        const endMs = new Date(currentSub.expires_at).getTime();
        const remainingRatio = endMs > startMs ? Math.max(0, endMs - Date.now()) / (endMs - startMs) : 0;
        upgradeCreditCents = Math.round(prevPrice * remainingRatio * 100);
        if (Number(founderLot.price) <= prevPrice) throw new Error("Upgrade só para lote superior");
      }
    }

    // ==== Discount calculation ====
    let totalDiscount = 0;
    let appliedCouponId: string | null = null;
    let appliedCouponCode: string | null = null;
    let couponDescription = "";

    if (billing_period === "annual" && !isFounder) {
      const { data: setting } = await supabaseAdmin
        .from("platform_settings").select("value").eq("key", "annual_discount_percent").maybeSingle();
      const annualPct = parseInt(setting?.value || "20") || 0;
      totalDiscount += annualPct;
      if (annualPct > 0) couponDescription = `Anual (-${annualPct}%)`;
    }
    if (coupon_code && !isFounder) {
      const { data: cpn } = await supabaseAdmin
        .from("discount_coupons").select("*")
        .eq("code", String(coupon_code).toUpperCase()).eq("is_active", true).maybeSingle();
      if (!cpn) throw new Error("Cupom inválido");
      if (cpn.valid_until && new Date(cpn.valid_until) < new Date()) throw new Error("Cupom expirado");
      if (cpn.max_uses && cpn.uses_count >= cpn.max_uses) throw new Error("Cupom esgotado");
      if (cpn.applicable_tiers?.length && !cpn.applicable_tiers.includes(tier)) throw new Error("Cupom não vale para este plano");
      if (cpn.applies_to === "monthly" && billing_period === "annual") throw new Error("Cupom só para mensais");
      if (cpn.applies_to === "annual" && billing_period === "monthly") throw new Error("Cupom só para anuais");
      totalDiscount += cpn.discount_percent;
      appliedCouponId = cpn.id;
      appliedCouponCode = cpn.code;
      couponDescription = couponDescription
        ? `${couponDescription} + Cupom ${cpn.code} (-${cpn.discount_percent}%)`
        : `Cupom ${cpn.code} (-${cpn.discount_percent}%)`;
    }
    if (totalDiscount > 95) totalDiscount = 95;

    // ==== Total ====
    let grossTotal: number;
    let finalTotal: number;
    let periodLabel: string;
    if (isFounder) {
      const isMonthly = billing_period === "monthly";
      grossTotal = isMonthly ? Number(founderLot.monthly_price) : Number(founderLot.price);
      finalTotal = is_founder_upgrade ? Math.max(0.5, grossTotal - upgradeCreditCents / 100) : grossTotal;
      periodLabel = is_founder_upgrade
        ? `Upgrade Fundador → Lote ${founderLot.lot_number}`
        : isMonthly ? `Fundador Lote ${founderLot.lot_number} · 30 dias` : `Fundador Lote ${founderLot.lot_number} · 1 ano`;
    } else {
      const months = billing_period === "annual" ? 12 : 1;
      grossTotal = Number(plan.price) * months;
      finalTotal = grossTotal * (1 - totalDiscount / 100);
      periodLabel = billing_period === "annual" ? "Anual (12 meses)" : "Mensal (30 dias)";
    }
    if (finalTotal < 1) throw new Error("Valor mínimo R$ 1,00");

    // ==== Profile data for AppMax customer ====
    const { data: profile } = await supabaseAdmin
      .from("profiles").select("full_name, phone, city, state").eq("user_id", user.id).maybeSingle();

    const fullName = (profile?.full_name || user.email.split("@")[0] || "Cliente").trim();
    const [firstName, ...rest] = fullName.split(/\s+/);
    const lastName = rest.join(" ") || firstName;
    const phoneDigits = (profile?.phone || "").replace(/\D/g, "") || "27999999999";

    // ==== Create AppMax customer ====
    const customerRes = await fetch(`${APPMAX_BASE}/customer`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        "access-token": apiKey,
        firstname: firstName,
        lastname: lastName,
        email: user.email,
        telephone: phoneDigits,
        ip: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1",
        custom_txt: user.id,
      }),
    });
    const customerJson = await customerRes.json();
    if (!customerRes.ok || !customerJson?.data?.id) {
      throw new Error(`AppMax customer falhou: ${JSON.stringify(customerJson)}`);
    }
    const customerId = customerJson.data.id;

    // ==== Create AppMax order ====
    const productName = `${plan.name} - ${periodLabel}`;
    const orderRes = await fetch(`${APPMAX_BASE}/order`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        "access-token": apiKey,
        total: Number(finalTotal.toFixed(2)),
        products: [{
          sku: tier,
          name: productName,
          qty: 1,
          price: Number(finalTotal.toFixed(2)),
          digital_product: 1,
        }],
        customer_id: customerId,
        freight_type: "PAC",
        freight_value: 0,
      }),
    });
    const orderJson = await orderRes.json();
    if (!orderRes.ok || !orderJson?.data?.id) {
      throw new Error(`AppMax order falhou: ${JSON.stringify(orderJson)}`);
    }
    const orderId = String(orderJson.data.id);

    // ==== Persist pending payment in our DB for webhook reconciliation ====
    await supabaseAdmin.from("appmax_payments" as any).insert({
      user_id: user.id,
      order_id: orderId,
      customer_id: String(customerId),
      tier,
      billing_period,
      amount: Number(finalTotal.toFixed(2)),
      status: "pending",
      metadata: {
        is_founder: isFounder,
        is_founder_upgrade,
        founder_lot_id: isFounder ? founderLot.id : null,
        applied_coupon_id: appliedCouponId,
        applied_coupon_code: appliedCouponCode,
        total_discount_percent: totalDiscount,
        max_items: plan.max_items,
        gross_total: Number(grossTotal.toFixed(2)),
        upgrade_credit_brl: is_founder_upgrade ? upgradeCreditCents / 100 : 0,
        coupon_description: couponDescription,
      },
    });

    // Coupon auditing
    if (appliedCouponId) {
      await supabaseAdmin.from("coupon_redemptions").insert({
        coupon_id: appliedCouponId,
        user_id: user.id,
        tier,
        billing_period,
        discount_percent: totalDiscount,
        stripe_session_id: `appmax_${orderId}`,
      });
      const { data: current } = await supabaseAdmin
        .from("discount_coupons").select("uses_count").eq("id", appliedCouponId).maybeSingle();
      await supabaseAdmin.from("discount_coupons")
        .update({ uses_count: (current?.uses_count || 0) + 1 }).eq("id", appliedCouponId);
    }

    return new Response(
      JSON.stringify({
        url: `/checkout-appmax/${orderId}`,
        order_id: orderId,
        customer_id: customerId,
        amount: Number(finalTotal.toFixed(2)),
        product_name: productName,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[appmax-create-checkout]", msg);
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});