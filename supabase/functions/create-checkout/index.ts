import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Monthly recurring price IDs
const TIER_PRICES: Record<string, string> = {
  start: "price_1THCtiA3teTHF5ONpr1FStDh",
  premium: "price_1THCuCA3teTHF5ONI7IKoAdr",
  vip: "price_1THDpbA3teTHF5ONdXA10lcs",
  essencial_empresa: "price_1THDq0A3teTHF5ONdo5k2dSk",
  premium_empresa: "price_1THDqLA3teTHF5ON7B1e6zlI",
  prime_empresa: "price_1THDqhA3teTHF5ONtDLVuFVT",
};

// Setup fees removidos - apenas mensalidade recorrente
const SETUP_FEES: Record<string, number> = {
  start: 0,
  premium: 0,
  vip: 0,
  essencial_empresa: 0,
  premium_empresa: 0,
  prime_empresa: 0,
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  try {
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;
    if (!user?.email) throw new Error("Usuário não autenticado");

    const { tier } = await req.json();
    if (!tier || !TIER_PRICES[tier]) {
      throw new Error(`Plano inválido: ${tier}`);
    }

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    // Find or create customer
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

    const setupFee = SETUP_FEES[tier] || 0;

    // Create checkout session with subscription + optional one-time setup fee
    const lineItems: any[] = [
      { price: TIER_PRICES[tier], quantity: 1 },
    ];

    const sessionParams: any = {
      customer: customerId,
      line_items: lineItems,
      mode: "subscription",
      success_url: `${req.headers.get("origin")}/painel?checkout=success&tier=${tier}`,
      cancel_url: `${req.headers.get("origin")}/pacotes?checkout=cancelled`,
      metadata: {
        user_id: user.id,
        tier,
      },
    };

    // Add setup fee as a one-time charge on the first invoice
    if (setupFee > 0) {
      sessionParams.subscription_data = {
        metadata: {
          user_id: user.id,
          tier,
        },
      };

      // Create an invoice item for the setup fee before the checkout
      // This will be added to the first subscription invoice
      await stripe.invoiceItems.create({
        customer: customerId,
        amount: setupFee,
        currency: "brl",
        description: `Taxa de implementação - Plano ${tier.charAt(0).toUpperCase() + tier.slice(1)}`,
      });
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

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
