export interface Product {
  id: string;
  companyId: string;
  title: string;
  price: number;
  image: string;
  images: string[];
  tag?: string;
  description: string;
  type: "imovel" | "automovel";
  specs: Record<string, string>;
  location?: string;
}

// Tag categories for organized display
export const TAG_CATEGORIES = {
  valor: {
    label: "Valor",
    color: "amber",
    tags: ["premium", "luxo", "alto_padrao", "exclusivo"],
  },
  destaque: {
    label: "Destaque / Venda",
    color: "red",
    tags: ["em_destaque", "oferta", "oportunidade", "ultimas_unidades"],
  },
  status: {
    label: "Status do Imóvel",
    color: "blue",
    tags: ["lancamento", "novo", "pronto_para_morar"],
  },
  diferenciais: {
    label: "Diferenciais",
    color: "green",
    tags: ["vista_panoramica", "cobertura", "area_lazer", "piscina_tag"],
  },
  facilidade: {
    label: "Facilidade",
    color: "purple",
    tags: ["aluguel_flex", "aceita_financiamento_tag"],
  },
} as const;

export function getTagLabel(tag: string): string {
  const labels: Record<string, string> = {
    premium: "Premium",
    luxo: "Luxo",
    alto_padrao: "Alto Padrão",
    exclusivo: "Exclusivo",
    em_destaque: "Em Destaque",
    oferta: "Oferta",
    oportunidade: "Oportunidade",
    ultimas_unidades: "Últimas Unidades",
    lancamento: "Lançamento",
    novo: "Novo",
    pronto_para_morar: "Pronto p/ Morar",
    vista_panoramica: "Vista Panorâmica",
    cobertura: "Cobertura",
    area_lazer: "Área de Lazer",
    piscina_tag: "Piscina",
    aluguel_flex: "Aluguel Facilitado",
    aceita_financiamento_tag: "Aceita Financiamento",
    // Legacy
    prime: "Prime",
    top: "Top",
    limited: "Limited",
  };
  return labels[tag] || tag;
}

export function getTagEmoji(tag: string): string {
  const emojis: Record<string, string> = {
    premium: "👑",
    luxo: "💎",
    alto_padrao: "🏆",
    exclusivo: "🔒",
    em_destaque: "🔥",
    oferta: "🏷️",
    oportunidade: "🚨",
    ultimas_unidades: "⏳",
    lancamento: "🆕",
    novo: "✨",
    pronto_para_morar: "🏡",
    vista_panoramica: "🌅",
    cobertura: "🏙️",
    area_lazer: "🌴",
    piscina_tag: "🏊",
    aluguel_flex: "🔄",
    aceita_financiamento_tag: "💳",
  };
  return emojis[tag] || "🏷️";
}

export function getTagStyle(tag: string): string {
  // Valor - dourado
  const valor: Record<string, string> = {
    premium: "bg-gradient-to-r from-[#FFD100] to-[#e5bc00] text-[#002F6C]",
    luxo: "bg-gradient-to-r from-purple-600 to-purple-800 text-white",
    alto_padrao: "bg-gradient-to-r from-amber-600 to-yellow-500 text-white",
    exclusivo: "bg-gradient-to-r from-indigo-600 to-violet-600 text-white",
    Premium: "bg-gradient-to-r from-[#FFD100] to-[#e5bc00] text-[#002F6C]",
    Luxo: "bg-gradient-to-r from-purple-600 to-purple-800 text-white",
    "Alto Padrão": "bg-gradient-to-r from-amber-600 to-yellow-500 text-white",
    Exclusivo: "bg-gradient-to-r from-indigo-600 to-violet-600 text-white",
  };
  // Destaque - vermelho/laranja
  const destaque: Record<string, string> = {
    em_destaque: "bg-gradient-to-r from-orange-500 to-red-500 text-white",
    oferta: "bg-red-600 text-white",
    oportunidade: "bg-gradient-to-r from-rose-500 to-orange-500 text-white",
    ultimas_unidades: "bg-gradient-to-r from-red-600 to-rose-700 text-white",
    "Em Destaque": "bg-gradient-to-r from-orange-500 to-red-500 text-white",
    "Em destaque": "bg-gradient-to-r from-orange-500 to-red-500 text-white",
    Oferta: "bg-red-600 text-white",
    Oportunidade: "bg-gradient-to-r from-rose-500 to-orange-500 text-white",
    "Últimas Unidades": "bg-gradient-to-r from-red-600 to-rose-700 text-white",
    Destaque: "bg-gradient-to-r from-orange-500 to-red-500 text-white",
  };
  // Status - azul
  const status: Record<string, string> = {
    lancamento: "bg-gradient-to-r from-cyan-500 to-blue-600 text-white",
    novo: "bg-gradient-to-r from-sky-500 to-blue-500 text-white",
    pronto_para_morar: "bg-gradient-to-r from-blue-500 to-indigo-500 text-white",
    Lançamento: "bg-gradient-to-r from-cyan-500 to-blue-600 text-white",
    Novo: "bg-gradient-to-r from-sky-500 to-blue-500 text-white",
    "Pronto p/ Morar": "bg-gradient-to-r from-blue-500 to-indigo-500 text-white",
    "Pronto para morar": "bg-gradient-to-r from-blue-500 to-indigo-500 text-white",
  };
  // Diferenciais - verde
  const diferenciais: Record<string, string> = {
    vista_panoramica: "bg-gradient-to-r from-emerald-500 to-teal-500 text-white",
    cobertura: "bg-gradient-to-r from-green-600 to-emerald-600 text-white",
    area_lazer: "bg-gradient-to-r from-teal-500 to-green-500 text-white",
    piscina_tag: "bg-gradient-to-r from-emerald-400 to-cyan-500 text-white",
    "Vista Panorâmica": "bg-gradient-to-r from-emerald-500 to-teal-500 text-white",
    Cobertura: "bg-gradient-to-r from-green-600 to-emerald-600 text-white",
    "Área de Lazer": "bg-gradient-to-r from-teal-500 to-green-500 text-white",
    Piscina: "bg-gradient-to-r from-emerald-400 to-cyan-500 text-white",
  };
  // Facilidade - roxo
  const facilidade: Record<string, string> = {
    aluguel_flex: "bg-gradient-to-r from-violet-500 to-fuchsia-600 text-white",
    aceita_financiamento_tag: "bg-gradient-to-r from-purple-500 to-violet-600 text-white",
    "Aluguel Facilitado": "bg-gradient-to-r from-violet-500 to-fuchsia-600 text-white",
    "Aluguel Flex": "bg-gradient-to-r from-violet-500 to-fuchsia-600 text-white",
    "Aceita Financiamento": "bg-gradient-to-r from-purple-500 to-violet-600 text-white",
    Aluguel: "bg-[#002F6C] text-white",
  };
  // Legacy
  const legacy: Record<string, string> = {
    prime: "bg-gradient-to-r from-[#002F6C] to-[#00AEEF] text-white",
    Prime: "bg-gradient-to-r from-[#002F6C] to-[#00AEEF] text-white",
    top: "bg-[#00AEEF] text-white",
    Top: "bg-[#00AEEF] text-white",
    limited: "bg-gradient-to-r from-rose-600 to-pink-600 text-white",
    Limited: "bg-gradient-to-r from-rose-600 to-pink-600 text-white",
    Limpo: "bg-emerald-500 text-white",
    "Vista Mar": "bg-gradient-to-r from-sky-400 to-blue-500 text-white",
  };

  const all = { ...valor, ...destaque, ...status, ...diferenciais, ...facilidade, ...legacy };
  return all[tag] || "bg-primary text-primary-foreground";
}

export function formatPrice(price: number): string {
  return `R$ ${price.toLocaleString("pt-BR")}`;
}

export function getProductById(id: string): Product | undefined {
  return allProducts.find((p) => p.id === id);
}

export function getProductsByCompany(companyId: string): Product[] {
  return allProducts.filter((p) => p.companyId === companyId);
}

export const allProducts: Product[] = [];
