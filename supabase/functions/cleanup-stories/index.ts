import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // 1) Delete expired stories (past expires_at)
    const { data: expiredStories, error: err1 } = await supabase
      .from("seller_stories")
      .delete()
      .lt("expires_at", new Date().toISOString())
      .select("id, image_url");

    if (err1) throw err1;

    // 2) Delete inactive stories older than 30 days
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const { data: inactiveStories, error: err2 } = await supabase
      .from("seller_stories")
      .delete()
      .eq("is_active", false)
      .lt("created_at", thirtyDaysAgo)
      .select("id, image_url");

    if (err2) throw err2;

    // Combine all deleted stories for storage cleanup
    const allDeleted = [...(expiredStories || []), ...(inactiveStories || [])];

    // Clean up storage files
    if (allDeleted.length > 0) {
      const paths = allDeleted
        .map((s: any) => {
          const url = s.image_url as string;
          const match = url.match(/seller-uploads\/(.+)$/);
          return match ? match[1] : null;
        })
        .filter(Boolean) as string[];

      if (paths.length > 0) {
        await supabase.storage.from("seller-uploads").remove(paths);
      }
    }

    return new Response(
      JSON.stringify({
        deleted_expired: expiredStories?.length ?? 0,
        deleted_inactive_30d: inactiveStories?.length ?? 0,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
