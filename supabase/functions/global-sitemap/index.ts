import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  const baseUrl = "https://brokergb.lovable.app";
  const now = new Date().toISOString().split("T")[0];

  // Fetch all profiles with slugs
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, slug, full_name, company_name, city, state, logo_url, seller_type, updated_at")
    .not("slug", "is", null);

  // Fetch all active items
  const { data: items } = await supabase
    .from("seller_items")
    .select("id, title, seller_id, city, neighborhood, category, photos, price, updated_at")
    .eq("status", "ativo");

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
  <!-- Sitemap global - Brokers App -->
  <!-- Gerado em: ${new Date().toISOString()} -->
  <!-- Total de corretores: ${(profiles || []).length} -->
  <!-- Total de anúncios: ${(items || []).length} -->

  <!-- Páginas estáticas -->
  <url>
    <loc>${baseUrl}/</loc>
    <lastmod>${now}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${baseUrl}/imoveis</loc>
    <lastmod>${now}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${baseUrl}/buscar</loc>
    <lastmod>${now}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${baseUrl}/blog</loc>
    <lastmod>${now}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`;

  // Broker store pages
  for (const profile of (profiles || [])) {
    if (!profile.slug) continue;
    const storeName = profile.company_name || profile.full_name || "";
    const lastMod = profile.updated_at?.split("T")[0] || now;

    xml += `
  <!-- Corretor: ${esc(storeName)} -->
  <url>
    <loc>${baseUrl}/empresa/${esc(profile.slug)}</loc>
    <lastmod>${lastMod}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>${profile.logo_url ? `
    <image:image>
      <image:loc>${esc(profile.logo_url)}</image:loc>
      <image:title>Logo - ${esc(storeName)}</image:title>
    </image:image>` : ""}
  </url>`;
  }

  // Property pages
  for (const item of (items || [])) {
    const lastMod = item.updated_at?.split("T")[0] || now;

    xml += `
  <url>
    <loc>${baseUrl}/imoveis/produto/${item.id}</loc>
    <lastmod>${lastMod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>`;

    if (item.photos && item.photos.length > 0) {
      for (const photo of item.photos.slice(0, 5)) {
        xml += `
    <image:image>
      <image:loc>${esc(photo)}</image:loc>
      <image:title>${esc(item.title)}</image:title>
    </image:image>`;
      }
    }

    xml += `
  </url>`;
  }

  xml += `
</urlset>`;

  return new Response(xml, {
    headers: {
      ...corsHeaders,
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
});

function esc(str: string): string {
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
