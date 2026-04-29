import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const CATEGORIES = ["casas", "apartamentos", "terrenos", "comerciais", "alugueis", "flats"];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  const baseUrl = "https://capimobifinal.lovable.app";
  const now = new Date().toISOString().split("T")[0];

  // Fetch all profiles with slugs
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, slug, full_name, company_name, city, state, logo_url, seller_type, updated_at")
    .not("slug", "is", null);

  // Fetch all active items (paginated)
  let allItems: any[] = [];
  let page = 0;
  const pageSize = 1000;
  let hasMore = true;
  while (hasMore) {
    const { data } = await supabase
      .from("seller_items")
      .select("id, title, slug, seller_id, city, neighborhood, category, photos, price, updated_at, state")
      .eq("status", "ativo")
      .eq("seller_type", "imoveis")
      .range(page * pageSize, (page + 1) * pageSize - 1);
    if (data && data.length > 0) {
      allItems = [...allItems, ...data];
      hasMore = data.length === pageSize;
      page++;
    } else {
      hasMore = false;
    }
  }

  // Extract unique cities and neighborhoods
  const citySet = new Map<string, string>(); // slug -> name
  const neighborhoodSet = new Map<string, { city: string; citySlug: string; name: string }>();
  
  for (const item of allItems) {
    if (item.city) {
      const citySlug = slugify(item.city);
      if (!citySet.has(citySlug)) citySet.set(citySlug, item.city);
      
      if (item.neighborhood) {
        const nSlug = slugify(item.neighborhood);
        const key = `${citySlug}/${nSlug}`;
        if (!neighborhoodSet.has(key)) {
          neighborhoodSet.set(key, { city: item.city, citySlug, name: item.neighborhood });
        }
      }
    }
  }

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
  <!-- Sitemap global - Capimobi -->
  <!-- Gerado em: ${new Date().toISOString()} -->
  <!-- Corretores: ${(profiles || []).length} | Anúncios: ${allItems.length} | Cidades: ${citySet.size} | Bairros: ${neighborhoodSet.size} -->

  <!-- Páginas estáticas -->
  <url><loc>${baseUrl}/</loc><lastmod>${now}</lastmod><changefreq>daily</changefreq><priority>1.0</priority></url>
  <url><loc>${baseUrl}/imoveis</loc><lastmod>${now}</lastmod><changefreq>daily</changefreq><priority>0.9</priority></url>
  <url><loc>${baseUrl}/corretores</loc><lastmod>${now}</lastmod><changefreq>daily</changefreq><priority>0.9</priority></url>
  <url><loc>${baseUrl}/buscar</loc><lastmod>${now}</lastmod><changefreq>daily</changefreq><priority>0.8</priority></url>
  <url><loc>${baseUrl}/anunciar</loc><lastmod>${now}</lastmod><changefreq>weekly</changefreq><priority>0.7</priority></url>
  <url><loc>${baseUrl}/blog</loc><lastmod>${now}</lastmod><changefreq>weekly</changefreq><priority>0.7</priority></url>

  <!-- Páginas por categoria global -->`;

  for (const cat of CATEGORIES) {
    xml += `
  <url><loc>${baseUrl}/imoveis/categoria/${cat}</loc><lastmod>${now}</lastmod><changefreq>daily</changefreq><priority>0.85</priority></url>`;
  }

  // City pages
  xml += `\n\n  <!-- Páginas por cidade -->`;
  for (const [citySlug] of citySet) {
    xml += `
  <url><loc>${baseUrl}/imoveis/${esc(citySlug)}</loc><lastmod>${now}</lastmod><changefreq>daily</changefreq><priority>0.85</priority></url>`;
    
    // City + category pages
    for (const cat of CATEGORIES) {
      xml += `
  <url><loc>${baseUrl}/imoveis/${esc(citySlug)}/${cat}</loc><lastmod>${now}</lastmod><changefreq>daily</changefreq><priority>0.8</priority></url>`;
    }
  }

  // Neighborhood pages
  xml += `\n\n  <!-- Páginas por bairro -->`;
  for (const [, nb] of neighborhoodSet) {
    const nSlug = slugify(nb.name);
    xml += `
  <url><loc>${baseUrl}/imoveis/${esc(nb.citySlug)}/bairro/${esc(nSlug)}</loc><lastmod>${now}</lastmod><changefreq>weekly</changefreq><priority>0.75</priority></url>`;
  }

  // Broker store pages
  xml += `\n\n  <!-- Lojas de corretores -->`;
  for (const profile of (profiles || [])) {
    if (!profile.slug) continue;
    const storeName = profile.company_name || profile.full_name || "";
    const lastMod = profile.updated_at?.split("T")[0] || now;
    xml += `
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

  // Broker SEO pages by state and city
  xml += `\n\n  <!-- Páginas SEO de corretores por estado/cidade -->`;
  const brokerStateMap = new Map<string, Set<string>>();
  for (const profile of (profiles || [])) {
    if (profile.state) {
      const st = profile.state.toLowerCase();
      if (!brokerStateMap.has(st)) brokerStateMap.set(st, new Set());
      if (profile.city) brokerStateMap.get(st)!.add(profile.city);
    }
  }
  for (const [st, cities] of brokerStateMap) {
    xml += `
  <url><loc>${baseUrl}/corretores/${esc(st)}</loc><lastmod>${now}</lastmod><changefreq>daily</changefreq><priority>0.85</priority></url>`;
    for (const city of cities) {
      xml += `
  <url><loc>${baseUrl}/corretores/${esc(st)}/${esc(slugify(city))}</loc><lastmod>${now}</lastmod><changefreq>daily</changefreq><priority>0.8</priority></url>`;
    }
  }

  // Property pages
  xml += `\n\n  <!-- Anúncios de imóveis -->`;
  for (const item of allItems) {
    const lastMod = item.updated_at?.split("T")[0] || now;
    const itemSlug = item.slug || item.id;
    xml += `
  <url>
    <loc>${baseUrl}/imoveis/produto/${esc(itemSlug)}</loc>
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

  xml += `\n</urlset>`;

  return new Response(xml, {
    headers: {
      ...corsHeaders,
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
});

function slugify(str: string): string {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

function esc(str: string): string {
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
