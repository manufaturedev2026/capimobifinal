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

  const url = new URL(req.url);
  const sellerId = url.searchParams.get("seller_id");
  const format = url.searchParams.get("format") || "google";

  if (!sellerId) {
    return new Response("Missing seller_id", { status: 400, headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", sellerId)
    .single();

  if (!profile) {
    return new Response("Seller not found", { status: 404, headers: corsHeaders });
  }

  const { data: items } = await supabase
    .from("seller_items")
    .select("*")
    .eq("seller_id", sellerId)
    .eq("status", "ativo");

  const { data: domainData } = await supabase
    .from("store_domains")
    .select("domain")
    .eq("seller_id", sellerId)
    .eq("is_active", true)
    .limit(1);

  const customDomain = domainData?.[0]?.domain;
  const baseUrl = customDomain
    ? `https://${customDomain}`
    : `https://capimobi.com.br`;

  const storeUrl = `${baseUrl}/loja/${sellerId}`;

  if (format === "facebook") {
    return generateFacebookFeed(profile, items || [], baseUrl, sellerId);
  }

  return generateGoogleSitemap(profile, items || [], baseUrl, sellerId, storeUrl);
});

function generateGoogleSitemap(
  profile: any,
  items: any[],
  baseUrl: string,
  sellerId: string,
  storeUrl: string
) {
  const now = new Date().toISOString().split("T")[0];
  const storeName = profile.company_name || profile.full_name || "Loja";
  const city = profile.city || "";
  const state = profile.state || "ES";
  const nicho = profile.seller_type === "automoveis" ? "Automóveis" : "Imóveis";
  const phone = profile.phone || "";
  const email = profile.email || "";

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<!-- Sitemap gerado para: ${esc(storeName)} -->
<!-- Responsável: ${esc(profile.full_name || "")} -->
<!-- Contato: ${esc(phone)} | ${esc(email)} -->
<!-- Cidade: ${esc(city)} - ${esc(state)} -->
<!-- Nicho: ${esc(nicho)} -->
<!-- Total de anúncios ativos: ${items.length} -->
<!-- Gerado em: ${new Date().toISOString()} -->
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
  <url>
    <loc>${storeUrl}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>${profile.logo_url ? `
    <image:image>
      <image:loc>${esc(profile.logo_url)}</image:loc>
      <image:title>Logo - ${esc(storeName)}</image:title>
    </image:image>` : ""}
  </url>`;

  for (const item of items) {
    const price = item.price ? `R$ ${Number(item.price).toFixed(2).replace(".", ",")}` : "";
    const itemCity = item.city || city;
    const categoryLabel = getCategoryLabel(item.category, item.seller_type);

    xml += `
  <!-- ${esc(item.title)} | ${price} | ${esc(itemCity)} | ${esc(categoryLabel)} -->
  <url>
    <loc>${baseUrl}/anuncio/${item.id}</loc>
    <lastmod>${item.updated_at?.split("T")[0] || now}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>`;

    if (item.photos && item.photos.length > 0) {
      for (const photo of item.photos.slice(0, 10)) {
        xml += `
    <image:image>
      <image:loc>${esc(photo)}</image:loc>
      <image:title>${esc(item.title)} - ${esc(storeName)}</image:title>
      <image:caption>${esc(item.description || item.title)} - ${esc(itemCity)}, ${esc(state)}</image:caption>
    </image:image>`;
      }
    }

    xml += `
  </url>`;
  }

  xml += `
</urlset>`;

  return new Response(xml, {
    headers: { ...corsHeaders, "Content-Type": "application/xml; charset=utf-8" },
  });
}

function generateFacebookFeed(
  profile: any,
  items: any[],
  baseUrl: string,
  sellerId: string
) {
  const storeName = profile.company_name || profile.full_name || "Loja";
  const city = profile.city || "";
  const state = profile.state || "ES";
  const phone = profile.phone || "";

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
<channel>
  <title>${esc(storeName)}</title>
  <link>${baseUrl}/loja/${sellerId}</link>
  <description>Catálogo de produtos - ${esc(storeName)} - ${esc(city)}, ${esc(state)} - Tel: ${esc(phone)}</description>`;

  for (const item of items) {
    const photo = item.photos?.[0] || "";
    const price = item.price ? `${Number(item.price).toFixed(2)} BRL` : "0.00 BRL";
    const category = getCategoryLabel(item.category, item.seller_type);
    const condition = item.seller_type === "automoveis" ? "used" : "new";
    const itemCity = item.city || city;

    let desc = item.description || item.title;
    if (item.seller_type === "automoveis") {
      const parts = [item.brand, item.model, item.year, item.fuel, item.transmission, item.color, item.mileage ? `${item.mileage}km` : ""].filter(Boolean);
      if (parts.length) desc += ` | ${parts.join(" | ")}`;
    } else {
      const parts = [item.bedrooms ? `${item.bedrooms} quartos` : "", item.bathrooms ? `${item.bathrooms} banheiros` : "", item.area ? `${item.area}m²` : "", item.parking_spots ? `${item.parking_spots} vagas` : ""].filter(Boolean);
      if (parts.length) desc += ` | ${parts.join(" | ")}`;
    }

    xml += `
  <item>
    <g:id>${item.id}</g:id>
    <g:title>${esc(item.title)} - ${esc(storeName)}</g:title>
    <g:description>${esc(desc)}</g:description>
    <g:link>${baseUrl}/anuncio/${item.id}</g:link>
    <g:image_link>${esc(photo)}</g:image_link>
    <g:price>${price}</g:price>
    <g:condition>${condition}</g:condition>
    <g:availability>in stock</g:availability>
    <g:brand>${esc(item.brand || storeName)}</g:brand>
    <g:google_product_category>${esc(category)}</g:google_product_category>
    <g:custom_label_0>${esc(itemCity)}</g:custom_label_0>
    <g:custom_label_1>${esc(storeName)}</g:custom_label_1>
    <g:custom_label_2>${esc(profile.full_name || "")}</g:custom_label_2>`;

    if (item.photos && item.photos.length > 1) {
      for (let i = 1; i < Math.min(item.photos.length, 10); i++) {
        xml += `
    <g:additional_image_link>${esc(item.photos[i])}</g:additional_image_link>`;
      }
    }

    if (item.neighborhood) {
      xml += `
    <g:custom_label_3>${esc(item.neighborhood)}</g:custom_label_3>`;
    }

    xml += `
  </item>`;
  }

  xml += `
</channel>
</rss>`;

  return new Response(xml, {
    headers: { ...corsHeaders, "Content-Type": "application/xml; charset=utf-8" },
  });
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

function getCategoryLabel(category: string, sellerType: string): string {
  if (sellerType === "automoveis") {
    const map: Record<string, string> = {
      carro: "Vehicles & Parts > Motor Vehicles > Cars",
      moto: "Vehicles & Parts > Motor Vehicles > Motorcycles",
      caminhao: "Vehicles & Parts > Motor Vehicles > Trucks",
      van: "Vehicles & Parts > Motor Vehicles > Vans",
      utilitario: "Vehicles & Parts > Motor Vehicles",
    };
    return map[category] || "Vehicles & Parts > Motor Vehicles";
  }
  const map: Record<string, string> = {
    casa: "Real Estate > Residential",
    apartamento: "Real Estate > Residential > Apartments",
    terreno: "Real Estate > Land",
    comercial: "Real Estate > Commercial",
    galpao: "Real Estate > Commercial > Warehouses",
    flat: "Real Estate > Residential > Apartments",
    aluguel: "Real Estate > Rental",
  };
  return map[category] || "Real Estate";
}
