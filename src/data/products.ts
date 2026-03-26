export interface Product {
  id: string;
  companyId: string;
  title: string;
  price: number;
  image: string;
  images: string[];
  tag?: string;
  description: string;
  type: "imovel";
  specs: Record<string, string>;
  location?: string;
}

export const allProducts: Product[] = [];

export function getProductsByCompany(companyId: string): Product[] {
  return allProducts.filter((p) => p.companyId === companyId);
}

export function getProductById(id: string): Product | undefined {
  return allProducts.find((p) => p.id === id);
}

export function formatPrice(price: number): string {
  return price.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function getTagLabel(tag: string): string {
  const labels: Record<string, string> = {
    premium: "Premium",
    luxo: "Luxo",
    prime: "Prime",
    novo: "Novo",
    em_destaque: "Em Destaque",
    oferta: "Oferta",
    exclusivo: "Exclusivo",
    top: "Top",
    limited: "Limited",
    lancamento: "Lançamento",
    pronto_para_morar: "Pronto p/ Morar",
    cobertura: "Cobertura",
    vista_panoramica: "Vista Panorâmica",
    aluguel_flex: "Aluguel Flex",
  };
  return labels[tag] || tag;
}

export function getTagStyle(tag: string): string {
  const styles: Record<string, string> = {
    "Limpo": "bg-emerald-500 text-white",
    "Premium": "bg-gradient-to-r from-[#FFD100] to-[#e5bc00] text-[#002F6C]",
    "Luxo": "bg-gradient-to-r from-purple-600 to-purple-800 text-white",
    "Prime": "bg-gradient-to-r from-[#002F6C] to-[#00AEEF] text-white",
    "Novo": "bg-green-500 text-white",
    "Em destaque": "bg-gradient-to-r from-orange-500 to-red-500 text-white",
    "Oferta": "bg-red-600 text-white",
    "Exclusivo": "bg-gradient-to-r from-indigo-600 to-violet-600 text-white",
    "Top": "bg-[#00AEEF] text-white",
    "Limited": "bg-gradient-to-r from-rose-600 to-pink-600 text-white",
    "Lançamento": "bg-gradient-to-r from-cyan-500 to-blue-600 text-white",
    "Pronto para morar": "bg-gradient-to-r from-emerald-500 to-teal-600 text-white",
    "Cobertura": "bg-gradient-to-r from-amber-500 to-orange-600 text-white",
    "Vista Mar": "bg-gradient-to-r from-sky-400 to-blue-500 text-white",
    "Vista Panorâmica": "bg-gradient-to-r from-indigo-400 to-blue-600 text-white",
    "Aluguel Flex": "bg-gradient-to-r from-violet-500 to-fuchsia-600 text-white",
    "Destaque": "bg-gradient-to-r from-orange-500 to-red-500 text-white",
    "Aluguel": "bg-[#002F6C] text-white",
    "premium": "bg-gradient-to-r from-[#FFD100] to-[#e5bc00] text-[#002F6C]",
    "luxo": "bg-gradient-to-r from-purple-600 to-purple-800 text-white",
    "prime": "bg-gradient-to-r from-[#002F6C] to-[#00AEEF] text-white",
    "novo": "bg-green-500 text-white",
    "em_destaque": "bg-gradient-to-r from-orange-500 to-red-500 text-white",
    "oferta": "bg-red-600 text-white",
    "exclusivo": "bg-gradient-to-r from-indigo-600 to-violet-600 text-white",
    "top": "bg-[#00AEEF] text-white",
    "limited": "bg-gradient-to-r from-rose-600 to-pink-600 text-white",
    "lancamento": "bg-gradient-to-r from-cyan-500 to-blue-600 text-white",
    "pronto_para_morar": "bg-gradient-to-r from-emerald-500 to-teal-600 text-white",
    "cobertura": "bg-gradient-to-r from-amber-500 to-orange-600 text-white",
    "vista_panoramica": "bg-gradient-to-r from-indigo-400 to-blue-600 text-white",
    "aluguel_flex": "bg-gradient-to-r from-violet-500 to-fuchsia-600 text-white",
  };
  return styles[tag] || "bg-primary text-primary-foreground";
}
