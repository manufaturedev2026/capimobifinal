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

const VERIFIED_LABELS: Record<string, { title: string; full: string; active: string; premium: string; role: string; subtitleVerified: string; subtitleActive: string }> = {
  corretor: { title: "Corretor(a) Verificado(a)", full: "Corretor(a) verificado(a)", active: "Corretor(a) ativo(a) na plataforma", premium: "Corretor(a) verificado(a) e premium", role: "Corretor(a)", subtitleVerified: "Profissional Verificado(a)", subtitleActive: "Profissional Ativo(a)" },
  imobiliaria: { title: "Imobiliária Verificada", full: "Imobiliária verificada", active: "Imobiliária ativa na plataforma", premium: "Imobiliária verificada e premium", role: "Imobiliária", subtitleVerified: "Profissional Verificada", subtitleActive: "Profissional Ativa" },
  construtora: { title: "Construtora Verificada", full: "Construtora verificada", active: "Construtora ativa na plataforma", premium: "Construtora verificada e premium", role: "Construtora", subtitleVerified: "Profissional Verificada", subtitleActive: "Profissional Ativa" },
  proprietario: { title: "Proprietário Verificado", full: "Proprietário verificado", active: "Proprietário ativo na plataforma", premium: "Proprietário verificado e premium", role: "Proprietário", subtitleVerified: "Profissional Verificado", subtitleActive: "Profissional Ativo" },
  loja_veiculos: { title: "Loja Verificada", full: "Loja verificada", active: "Loja ativa na plataforma", premium: "Loja verificada e premium", role: "Loja", subtitleVerified: "Profissional Verificada", subtitleActive: "Profissional Ativa" },
  autonomo: { title: "Vendedor Verificado", full: "Vendedor verificado", active: "Vendedor ativo na plataforma", premium: "Vendedor verificado e premium", role: "Vendedor", subtitleVerified: "Profissional Verificado", subtitleActive: "Profissional Ativo" },
  concessionaria: { title: "Concessionária Verificada", full: "Concessionária verificada", active: "Concessionária ativa na plataforma", premium: "Concessionária verificada e premium", role: "Concessionária", subtitleVerified: "Profissional Verificada", subtitleActive: "Profissional Ativa" },
};

export function getSellerVerifiedLabel(
  category: string | null | undefined,
  variant: "title" | "full" | "active" | "premium" | "role" | "subtitleVerified" | "subtitleActive" = "full"
): string {
  const labels = VERIFIED_LABELS[category || "autonomo"] || VERIFIED_LABELS.autonomo;
  return labels[variant];
}
