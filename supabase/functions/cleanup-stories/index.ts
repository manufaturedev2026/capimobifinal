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
      .select("id, image_url, is_auto, item_id");

    if (err1) throw err1;

    // 2) Delete inactive stories older than 30 days
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const { data: inactiveStories, error: err2 } = await supabase
      .from("seller_stories")
      .delete()
      .eq("is_active", false)
      .lt("created_at", thirtyDaysAgo)
      .select("id, image_url, is_auto, item_id");

    if (err2) throw err2;

    const allDeleted = [...(expiredStories || []), ...(inactiveStories || [])];

    // ⚠️ IMPORTANTE: Stories automáticas (is_auto=true) reutilizam fotos dos anúncios.
    // NUNCA deletar a foto do storage nesse caso, senão o anúncio perde a imagem.
    // Stories manuais (is_auto=false) também podem reutilizar fotos — vamos checar
    // se a URL ainda é referenciada em qualquer seller_item antes de remover.

    let removedFiles = 0;
    let skippedShared = 0;

    if (allDeleted.length > 0) {
      // Filtra somente stories manuais (auto NUNCA deve apagar arquivo)
      const candidates = allDeleted.filter((s: any) => !s.is_auto);

      // Para cada candidata, verifica se a image_url ainda é usada em algum anúncio
      const safeToDelete: string[] = [];
      for (const s of candidates) {
        const url = s.image_url as string;
        if (!url) continue;

        // Verifica referência em seller_items.photos (array) ou outras colunas
        const { data: usedIn, error: checkErr } = await supabase
          .from("seller_items")
          .select("id")
          .or(`photos.cs.{${url}},video_url.eq.${url},thumbnail_url.eq.${url}`)
          .limit(1);

        if (checkErr) {
          console.warn("[cleanup-stories] check error:", checkErr.message);
          continue;
        }

        if (usedIn && usedIn.length > 0) {
          skippedShared++;
          continue; // ainda em uso por um anúncio, NÃO apaga
        }

        // Extrai path do bucket seller-uploads
        const match = url.match(/seller-uploads\/(.+?)(?:\?|$)/);
        if (match) safeToDelete.push(match[1]);
      }

      if (safeToDelete.length > 0) {
        const { error: rmErr } = await supabase.storage
          .from("seller-uploads")
          .remove(safeToDelete);
        if (!rmErr) removedFiles = safeToDelete.length;
        else console.warn("[cleanup-stories] remove error:", rmErr.message);
      }
    }

    return new Response(
      JSON.stringify({
        deleted_expired: expiredStories?.length ?? 0,
        deleted_inactive_30d: inactiveStories?.length ?? 0,
        files_removed: removedFiles,
        files_skipped_shared_with_listings: skippedShared,
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
