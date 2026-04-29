import { Helmet } from "react-helmet-async";
import { SITE_URL } from "@/lib/siteUrl";
import { useSiteSettings } from "@/hooks/useSiteSettings";

interface CitySEOProps {
  city: string;
  segment?: "imoveis";
  itemCount: number;
  items?: Array<{ id: string; title: string; price: number; image: string }>;
}

function capitalize(str: string) {
  return str.replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function CitySEO({ city, segment = "imoveis", itemCount, items = [] }: CitySEOProps) {
  const { site_name } = useSiteSettings();
  const cityName = capitalize(city);
  const baseUrl = SITE_URL;

  const title = `Imóveis em ${cityName} - Casas e Apartamentos à Venda | ${site_name}`;
  const description = `Encontre ${itemCount}+ imóveis em ${cityName}. Casas, apartamentos, terrenos e comerciais à venda e para alugar. Os melhores preços de ${cityName}.`;

  const slug = city.toLowerCase().replace(/\s+/g, "-");
  const canonicalUrl = `${baseUrl}/${slug}/imoveis`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: title,
    description,
    url: canonicalUrl,
    numberOfItems: itemCount,
    itemListElement: items.slice(0, 20).map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url: `${baseUrl}/imoveis/produto/${(item as any).slug || item.id}`,
      name: item.title,
      image: item.image,
    })),
  };

  const localBusinessLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: title,
    description,
    url: canonicalUrl,
    about: {
      "@type": "Place",
      name: cityName,
      address: {
        "@type": "PostalAddress",
        addressLocality: cityName,
        addressRegion: "",
        addressCountry: "BR",
      },
    },
  };

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={`imóveis ${cityName}, casas ${cityName}, apartamentos ${cityName}, terrenos ${cityName}, aluguel ${cityName}, comprar imóvel ${cityName}`} />
      <link rel="canonical" href={canonicalUrl} />

      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:type" content="website" />

      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />

      <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      <script type="application/ld+json">{JSON.stringify(localBusinessLd)}</script>
    </Helmet>
  );
}
