import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const PRICE_TO_TIER: Record<string, string> = {
  "prod_UFiKCOcfdqtboH": "start",
  "prod_UFiK9MV350xHFE": "premium",
  "prod_UFjI3ssdg0uaLS": "vip",
  "prod_UFjIEGPYlK8Gkc": "essencial_empresa",
  "prod_UFjIVk91zVkQ7S": "premium_empresa",
  "prod_UFjJrJgiUvvjvm": "prime_empresa",
};

const TIER_MAX_ITEMS: Record<string, number> = {
  start: 25,
  premium: 60,
  vip: 115,
  essencial_empresa: 9999,
  premium_empresa: 9999,
  prime_empresa: 9999,
};

const logStep = (step: string, details?: any) => {
  console.log(`[CHECK-SUBSCRIPTION] ${step}${details ? ` - ${JSON.stringify(details)}` : ""}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      logStep("STRIPE_SECRET_KEY not set, skipping Stripe sync");
      return new Response(JSON.stringify({ subscribed: false, skipped: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ subscribed: false }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
    if (userError || !userData?.user?.email) {
      logStep("User not authenticated, returning unsubscribed");
      return new Response(JSON.stringify({ subscribed: false }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }
    const user = userData.user;
    logStep("User authenticated", { userId: user.id, email: user.email });

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });

    if (customers.data.length === 0) {
      logStep("No Stripe customer found");
      return new Response(JSON.stringify({ subscribed: false }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const customerId = customers.data[0].id;
    logStep("Found customer", { customerId });

    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 1,
    });

    if (subscriptions.data.length === 0) {
      logStep("No active subscription");
      // Deactivate any local subscriptions
      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (profile) {
        // Deactivate ONLY stripe-paid subscriptions (preserve manual/admin/appmax activations)
        await supabaseAdmin
          .from("seller_subscriptions")
          .update({ is_active: false })
          .eq("user_id", user.id)
          .eq("is_active", true)
          .eq("payment_method", "stripe")
          .neq("tier", "basico");

        // Check if user already has an active basico plan
        const { data: existingBasico } = await supabaseAdmin
          .from("seller_subscriptions")
          .select("id")
          .eq("user_id", user.id)
          .eq("tier", "basico")
          .eq("is_active", true)
          .limit(1);

        // Auto-create basico plan if none exists
        if (!existingBasico || existingBasico.length === 0) {
          await supabaseAdmin.from("seller_subscriptions").insert({
            user_id: user.id,
            seller_id: profile.id,
            tier: "basico",
            max_items: 5,
            is_active: true,
            expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
            payment_method: "gratis",
            payment_status: "confirmado",
          });
          logStep("Auto-downgraded to basico");
        }
      }

      return new Response(JSON.stringify({ subscribed: false, tier: "basico" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const sub = subscriptions.data[0];
    const productId = sub.items.data[0].price.product as string;
    const tier = PRICE_TO_TIER[productId] || null;
    const subscriptionEnd = new Date(sub.current_period_end * 1000).toISOString();
    logStep("Active subscription found", { tier, productId, end: subscriptionEnd });

    if (tier) {
      // Get profile
      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (profile) {
        // Deactivate old stripe subscriptions only (preserve manual/accumulated plans)
        await supabaseAdmin
          .from("seller_subscriptions")
          .update({ is_active: false })
          .eq("user_id", user.id)
          .eq("is_active", true)
          .eq("payment_method", "stripe");

        // Upsert current subscription
        await supabaseAdmin
          .from("seller_subscriptions")
          .upsert({
            user_id: user.id,
            seller_id: profile.id,
            tier,
            max_items: TIER_MAX_ITEMS[tier] || 10,
            is_active: true,
            expires_at: subscriptionEnd,
            payment_method: "stripe",
            payment_status: "confirmado",
            started_at: new Date(sub.start_date * 1000).toISOString(),
          }, { onConflict: "id" });

        logStep("Local subscription synced", { tier });
      }
    }

    return new Response(JSON.stringify({
      subscribed: true,
      tier,
      subscription_end: subscriptionEnd,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: msg });
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
