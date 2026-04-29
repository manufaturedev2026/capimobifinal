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

const VERIFIED_LABELS: Record<string, { title: string; full: string; active: string; premium: string }> = {
  corretor: { title: "Corretor(a) Verificado(a)", full: "Corretor(a) verificado(a)", active: "Corretor(a) ativo(a) na plataforma", premium: "Corretor(a) verificado(a) e premium" },
  imobiliaria: { title: "Imobiliária Verificada", full: "Imobiliária verificada", active: "Imobiliária ativa na plataforma", premium: "Imobiliária verificada e premium" },
  construtora: { title: "Construtora Verificada", full: "Construtora verificada", active: "Construtora ativa na plataforma", premium: "Construtora verificada e premium" },
  proprietario: { title: "Proprietário Verificado", full: "Proprietário verificado", active: "Proprietário ativo na plataforma", premium: "Proprietário verificado e premium" },
  loja_veiculos: { title: "Loja Verificada", full: "Loja verificada", active: "Loja ativa na plataforma", premium: "Loja verificada e premium" },
  autonomo: { title: "Vendedor Verificado", full: "Vendedor verificado", active: "Vendedor ativo na plataforma", premium: "Vendedor verificado e premium" },
  concessionaria: { title: "Concessionária Verificada", full: "Concessionária verificada", active: "Concessionária ativa na plataforma", premium: "Concessionária verificada e premium" },
};

export function getSellerVerifiedLabel(
  category: string | null | undefined,
  variant: "title" | "full" | "active" | "premium" = "full"
): string {
  const labels = VERIFIED_LABELS[category || "autonomo"] || VERIFIED_LABELS.autonomo;
  return labels[variant];
}
