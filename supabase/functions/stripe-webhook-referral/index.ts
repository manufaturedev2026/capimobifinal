import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const DEFAULT_COMMISSION_RATE = 0.10; // fallback 10%

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
  if (!stripeKey) {
    return new Response(JSON.stringify({ error: "STRIPE_SECRET_KEY not set" }), { status: 500, headers: corsHeaders });
  }

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    const body = await req.json();
    const event = body;

    // We handle invoice.paid
    if (event.type !== "invoice.paid") {
      return new Response(JSON.stringify({ received: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const invoice = event.data.object;
    const customerEmail = invoice.customer_email;
    const amountPaid = (invoice.amount_paid || 0) / 100; // cents to reais

    if (!customerEmail || amountPaid <= 0) {
      console.log("[REFERRAL-WEBHOOK] No email or zero amount, skipping");
      return new Response(JSON.stringify({ received: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    console.log(`[REFERRAL-WEBHOOK] invoice.paid for ${customerEmail}, amount: ${amountPaid}`);

    // Find the paying user's profile
    const { data: payerProfile } = await supabaseAdmin
      .from("profiles")
      .select("id, user_id, referred_by")
      .eq("email", customerEmail)
      .maybeSingle();

    if (!payerProfile) {
      console.log("[REFERRAL-WEBHOOK] No profile found for", customerEmail);
      return new Response(JSON.stringify({ received: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (!payerProfile.referred_by) {
      console.log("[REFERRAL-WEBHOOK] User was not referred, skipping");
      return new Response(JSON.stringify({ received: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Find the referrer by code
    const { data: referrerProfile } = await supabaseAdmin
      .from("profiles")
      .select("id, user_id, referral_balance, referral_total_earned")
      .eq("referral_code", payerProfile.referred_by)
      .maybeSingle();

    if (!referrerProfile) {
      console.log("[REFERRAL-WEBHOOK] Referrer not found for code", payerProfile.referred_by);
      return new Response(JSON.stringify({ received: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Block self-referral
    if (referrerProfile.user_id === payerProfile.user_id) {
      console.log("[REFERRAL-WEBHOOK] Self-referral blocked");
      return new Response(JSON.stringify({ received: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Check for duplicate commission (same invoice)
    const invoiceId = invoice.id;
    const { data: existing } = await supabaseAdmin
      .from("commissions")
      .select("id")
      .eq("user_id", referrerProfile.user_id)
      .eq("referred_id", payerProfile.user_id)
      .gte("created_at", new Date(Date.now() - 60 * 1000).toISOString()) // within last minute
      .limit(1);

    if (existing && existing.length > 0) {
      console.log("[REFERRAL-WEBHOOK] Duplicate commission detected, skipping");
      return new Response(JSON.stringify({ received: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const commission = amountPaid * COMMISSION_RATE;

    // Insert commission
    await supabaseAdmin.from("commissions").insert({
      user_id: referrerProfile.user_id,
      referred_id: payerProfile.user_id,
      amount: commission,
      type: "recorrente",
      status: "aprovado",
    });

    // Update referrer balance and total
    const newBalance = Number(referrerProfile.referral_balance || 0) + commission;
    const newTotal = Number(referrerProfile.referral_total_earned || 0) + commission;

    await supabaseAdmin.from("profiles").update({
      referral_balance: newBalance,
      referral_total_earned: newTotal,
    }).eq("user_id", referrerProfile.user_id);

    console.log(`[REFERRAL-WEBHOOK] Commission of R$${commission.toFixed(2)} created for referrer ${referrerProfile.user_id}`);

    return new Response(JSON.stringify({ received: true, commission }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[REFERRAL-WEBHOOK] Error:", error);
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
