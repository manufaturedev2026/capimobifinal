// Determines the professional title shown on the seller's storefront.
// Priority: custom title (professional_title) → fallback by seller_category.

const CATEGORY_DEFAULT_TITLE: Record<string, string> = {
  corretor: "Corretor de Imóveis",
  imobiliaria: "Imobiliária",
  proprietario: "Proprietário",
  loja_veiculos: "Loja de Veículos",
  autonomo: "Vendedor Autônomo",
  concessionaria: "Concessionária",
  construtora: "Construtora",
};

export function getSellerProfessionalTitle(profile: {
  professional_title?: string | null;
  seller_category?: string | null;
} | null | undefined): string {
  const custom = profile?.professional_title?.trim();
  if (custom) return custom;
  const cat = profile?.seller_category;
  if (cat && CATEGORY_DEFAULT_TITLE[cat]) return CATEGORY_DEFAULT_TITLE[cat];
  return "Corretor de Imóveis";
}
