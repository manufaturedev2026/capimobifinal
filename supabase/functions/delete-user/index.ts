import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { user_id } = await req.json();
    if (!user_id) {
      return new Response(JSON.stringify({ error: "user_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Delete related data first
    await supabase.from("seller_subscriptions").delete().eq("user_id", user_id);
    await supabase.from("seller_items").delete().eq("user_id", user_id);
    await supabase.from("seller_stories").delete().eq("user_id", user_id);
    await supabase.from("seller_analytics").delete().eq("seller_id", user_id);
    await supabase.from("seller_crm_contacts").delete().eq("user_id", user_id);
    await supabase.from("store_effects").delete().eq("user_id", user_id);
    await supabase.from("favorites").delete().eq("user_id", user_id);
    await supabase.from("generated_contracts").delete().eq("user_id", user_id);
    await supabase.from("rental_contracts").delete().eq("user_id", user_id);
    await supabase.from("rental_properties").delete().eq("user_id", user_id);
    await supabase.from("user_bans").delete().eq("user_id", user_id);
    await supabase.from("user_roles").delete().eq("user_id", user_id);
    await supabase.from("profiles").delete().eq("user_id", user_id);

    // Delete auth user
    const { error } = await supabase.auth.admin.deleteUser(user_id);

    return new Response(JSON.stringify({ success: !error, error: error?.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
