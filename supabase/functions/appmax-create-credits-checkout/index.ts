import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const APPMAX_BASE = "https://admin.appmax.com.br/api/v3";

/**
 * Cria pedido na AppMax para compra de CRÉDITOS DE IA (somente PIX).
 * Body: { amount: number, credits: number }
 * Retorna { url: "/checkout-appmax/<orderId>" }
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

    const { amount, credits } = await req.json();
    const amountNum = Number(amount);
    const creditsNum = Math.floor(Number(credits));
    if (!amountNum || amountNum < 15 || amountNum > 500) {
      throw new Error("Valor inválido (mín R$ 15, máx R$ 500)");
    }
    if (!creditsNum || creditsNum < 1) throw new Error("Quantidade de créditos inválida");

    // Profile
    const { data: profile } = await supabaseAdmin
      .from("profiles").select("id, full_name, phone").eq("user_id", user.id).maybeSingle();

    const fullName = (profile?.full_name || user.email.split("@")[0] || "Cliente").trim();
    const [firstName, ...rest] = fullName.split(/\s+/);
    const lastName = rest.join(" ") || firstName;
    const phoneDigits = (profile?.phone || "").replace(/\D/g, "") || "27999999999";

    // Cliente AppMax
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

    // Pedido AppMax
    const productName = `${creditsNum} créditos de IA`;
    const orderRes = await fetch(`${APPMAX_BASE}/order`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        "access-token": apiKey,
        total: Number(amountNum.toFixed(2)),
        products: [{
          sku: "ai-credits",
          name: productName,
          qty: 1,
          price: Number(amountNum.toFixed(2)),
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

    await supabaseAdmin.from("appmax_payments" as any).insert({
      user_id: user.id,
      order_id: orderId,
      customer_id: String(customerId),
      tier: "credits_purchase",
      billing_period: "one_time",
      amount: Number(amountNum.toFixed(2)),
      status: "pending",
      metadata: {
        kind: "credits",
        credits: creditsNum,
        seller_id: profile?.id || null,
        product_name: productName,
      },
    });

    return new Response(
      JSON.stringify({
        url: `/checkout-appmax/${orderId}`,
        order_id: orderId,
        amount: Number(amountNum.toFixed(2)),
        product_name: productName,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[appmax-create-credits-checkout]", msg);
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});