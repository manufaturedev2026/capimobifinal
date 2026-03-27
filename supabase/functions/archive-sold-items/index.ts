import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Find items marked as vendido more than 24 hours ago
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const { data: expiredItems, error: fetchError } = await supabase
      .from("seller_items")
      .select("id, seller_id, title")
      .eq("status", "vendido")
      .lt("sold_at", cutoff);

    if (fetchError) {
      throw fetchError;
    }

    if (!expiredItems || expiredItems.length === 0) {
      return new Response(
        JSON.stringify({ message: "No items to archive", count: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const ids = expiredItems.map((i: any) => i.id);

    // Set status to inativo (archived)
    const { error: updateError } = await supabase
      .from("seller_items")
      .update({ status: "inativo" })
      .in("id", ids);

    if (updateError) {
      throw updateError;
    }

    return new Response(
      JSON.stringify({
        message: `Archived ${ids.length} sold items`,
        count: ids.length,
        ids,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
