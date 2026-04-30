// Facebook / Meta Catalog Feed (RSS 2.0)
// Spec: https://developers.facebook.com/docs/marketing-api/catalog/reference
// Public endpoint — no auth — so the Meta Business Manager can crawl it.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const BASE_URL = "https://capimobi.com.br";
const BRAND = "Capimobi";

const CATEGORY_LABEL: Record<string, string> = {
  casa: "Casa",
  apartamento: "Apartamento",
  terreno: "Terreno",
  comercial: "Comercial",
  flat: "Flat",
  cobertura: "Cobertura",
  rural: "Imóvel Rural",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Pull every active listing (paginated to bypass 1k row cap)
    let allItems: any[] = [];
    let page = 0;
    const pageSize = 1000;
    while (true) {
      const { data, error } = await supabase
        .from("seller_items")
        .select("id, slug, title, description, price, photos, category, city, state, neighborhood, updated_at, status")
        .eq("status", "ativo")
        .eq("seller_type", "imoveis")
        .range(page * pageSize, (page + 1) * pageSize - 1);
      if (error) throw error;
      if (!data || data.length === 0) break;
      allItems = allItems.concat(data);
      if (data.length < pageSize) break;
      page++;
    }

    const now = new Date().toUTCString();

    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>${esc(BRAND)} — Catálogo de Imóveis</title>
    <link>${BASE_URL}</link>
    <description>Catálogo de imóveis disponíveis na ${esc(BRAND)} para Facebook / Instagram Ads.</description>
    <lastBuildDate>${now}</lastBuildDate>
    <!-- Total de itens: ${allItems.length} -->
`;

    for (const item of allItems) {
      const slug = item.slug || item.id;
      const link = `${BASE_URL}/imoveis/produto/${esc(slug)}`;
      const image = (item.photos && item.photos[0]) || "";
      if (!image) continue; // Facebook requires image_link
      const priceNum = Number(item.price || 0);
      if (!priceNum || priceNum <= 0) continue; // Facebook requires a positive price
      const price = `${priceNum.toFixed(2)} BRL`;
      const title = item.title || "Imóvel";
      const desc = (item.description || title).replace(/\s+/g, " ").trim().slice(0, 5000);
      const productType = CATEGORY_LABEL[item.category] || "Imóvel";
      const location = [item.neighborhood, item.city, item.state].filter(Boolean).join(", ");

      xml += `
    <item>
      <g:id>${esc(item.id)}</g:id>
      <g:title>${esc(title)}</g:title>
      <g:description>${esc(desc || `${productType} em ${location || "Brasil"}`)}</g:description>
      <g:link>${link}</g:link>
      <g:image_link>${esc(image)}</g:image_link>${(item.photos || []).slice(1, 10).map((p: string) => `
      <g:additional_image_link>${esc(p)}</g:additional_image_link>`).join("")}
      <g:availability>in stock</g:availability>
      <g:condition>new</g:condition>
      <g:price>${price}</g:price>
      <g:brand>${esc(BRAND)}</g:brand>
      <g:product_type>${esc(productType)}</g:product_type>
      <g:google_product_category>Real Estate</g:google_product_category>${location ? `
      <g:custom_label_0>${esc(location)}</g:custom_label_0>` : ""}${item.city ? `
      <g:custom_label_1>${esc(item.city)}</g:custom_label_1>` : ""}${item.state ? `
      <g:custom_label_2>${esc(item.state)}</g:custom_label_2>` : ""}
    </item>`;
    }

    xml += `
  </channel>
</rss>`;

    return new Response(xml, {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (err) {
    console.error("facebook-catalog-feed error:", err);
    return new Response(`<?xml version="1.0"?><error>${String(err)}</error>`, {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/xml" },
    });
  }
});

function esc(str: string | number | null | undefined): string {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
