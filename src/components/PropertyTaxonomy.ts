// Taxonomia profissional Categoria → Subtipo → Estrutura
// Usada no Avaliador IA para seleção em cascata e cálculo inteligente.

export type CategoriaImovel = "Residencial" | "Terreno" | "Comercial" | "Rural" | "Especial";

export const CATEGORIAS: CategoriaImovel[] = ["Residencial", "Terreno", "Comercial", "Rural", "Especial"];

// Subtipos por categoria
export const SUBTIPOS_POR_CATEGORIA: Record<CategoriaImovel, string[]> = {
  Residencial: [
    "Casa", "Sobrado", "Apartamento", "Cobertura", "Studio", "Kitnet",
    "Loft", "Flat", "Condomínio fechado", "Townhouse", "Duplex residencial", "Triplex residencial",
  ],
  Terreno: [
    "Terreno residencial", "Terreno comercial", "Lote condomínio", "Área incorporação",
    "Industrial", "Chácara urbana", "Rural pequeno porte",
  ],
  Comercial: [
    "Loja", "Sala comercial", "Galpão", "Depósito", "Escritório", "Clínica",
    "Restaurante", "Ponto comercial", "Prédio comercial", "Coworking", "Quiosque",
  ],
  Rural: [
    "Sítio", "Chácara", "Fazenda pecuária", "Fazenda agrícola", "Haras",
    "Rancho", "Terra nua", "Reflorestamento", "Área mista",
  ],
  Especial: [
    "Imóvel misto", "Luxo", "Na planta", "Leilão", "Multipropriedade",
    "Imóvel renda", "Prédio kitnets",
  ],
};

// Estruturas por subtipo
export const ESTRUTURAS_POR_SUBTIPO: Record<string, string[]> = {
  // Residencial
  Casa: ["Térrea", "Geminada", "Pavimento superior", "Duas moradias no lote", "Vila", "Condomínio", "Alto padrão", "Uso misto residencial/comercial"],
  Sobrado: ["Integrado", "Independente", "Geminado", "Triplex", "Com terraço"],
  Apartamento: ["Padrão", "Térreo", "Garden", "Frente rua", "Fundos", "Lateral", "Torre única", "Condomínio clube"],
  Cobertura: ["Simples", "Duplex", "Triplex", "Terraço gourmet", "Piscina privativa"],
  Studio: ["Compacto", "Mobiliado", "Investidor", "Airbnb"],
  Kitnet: ["Compacto", "Mobiliado", "Investidor", "Airbnb"],
  Loft: ["Pé direito duplo", "Industrial", "Moderno"],
  Flat: ["Pool hoteleiro", "Gestão própria", "Serviços inclusos"],
  "Condomínio fechado": ["Casa térrea", "Sobrado", "Alto padrão", "Garden"],
  Townhouse: ["Padrão", "Alto padrão", "Geminado"],
  "Duplex residencial": ["Padrão", "Alto padrão"],
  "Triplex residencial": ["Padrão", "Alto padrão"],

  // Terreno
  "Terreno residencial": ["Plano", "Aclive", "Declive", "Esquina", "Meio de quadra", "Frente dupla", "Frente mar/rio/lago", "Condomínio fechado", "Zoneamento misto", "Área ampla para desmembrar"],
  "Terreno comercial": ["Plano", "Esquina", "Meio de quadra", "Frente dupla", "Zoneamento misto"],
  "Lote condomínio": ["Plano", "Aclive", "Declive", "Frente mar/rio/lago"],
  "Área incorporação": ["Plano", "Esquina", "Área ampla para desmembrar", "Zoneamento misto"],
  Industrial: ["Plano", "Esquina", "Frente dupla", "Zoneamento misto"],
  "Chácara urbana": ["Plano", "Aclive", "Declive", "Frente mar/rio/lago"],
  "Rural pequeno porte": ["Plano", "Aclive", "Declive", "Frente mar/rio/lago"],

  // Comercial
  Loja: ["Rua movimentada", "Shopping", "Galeria", "Esquina"],
  "Sala comercial": ["Empresarial", "Centro comercial", "Consultório"],
  Galpão: ["Logístico", "Industrial", "Pé direito alto", "Com doca", "Modular"],
  Depósito: ["Logístico", "Industrial", "Modular"],
  Escritório: ["Empresarial", "Centro comercial"],
  Clínica: ["Consultório", "Centro comercial", "Empresarial"],
  Restaurante: ["Rua movimentada", "Shopping", "Galeria", "Esquina"],
  "Ponto comercial": ["Rua movimentada", "Esquina", "Galeria"],
  "Prédio comercial": ["Multi salas", "Monousuário", "Renda locatícia"],
  Coworking: ["Empresarial", "Centro comercial"],
  Quiosque: ["Shopping", "Galeria", "Rua movimentada"],

  // Rural
  Sítio: ["Beira rio", "Com nascente", "Pastagem", "Plantio", "Mata nativa", "Benfeitorias completas", "Casa sede", "Curral", "Irrigada", "Acesso asfaltado", "Acesso terra"],
  Chácara: ["Beira rio", "Com nascente", "Pastagem", "Mata nativa", "Casa sede", "Acesso asfaltado", "Acesso terra"],
  "Fazenda pecuária": ["Pastagem", "Curral", "Casa sede", "Benfeitorias completas", "Acesso asfaltado", "Acesso terra"],
  "Fazenda agrícola": ["Plantio", "Irrigada", "Casa sede", "Benfeitorias completas", "Acesso asfaltado", "Acesso terra"],
  Haras: ["Pastagem", "Curral", "Benfeitorias completas", "Casa sede", "Acesso asfaltado"],
  Rancho: ["Beira rio", "Com nascente", "Casa sede", "Acesso asfaltado", "Acesso terra"],
  "Terra nua": ["Pastagem", "Plantio", "Mata nativa", "Acesso asfaltado", "Acesso terra"],
  Reflorestamento: ["Plantio", "Mata nativa", "Acesso asfaltado", "Acesso terra"],
  "Área mista": ["Pastagem", "Plantio", "Mata nativa", "Benfeitorias completas", "Casa sede"],

  // Especial
  "Imóvel misto": ["Residencial/comercial", "Comercial/industrial", "Renda locatícia"],
  Luxo: ["Frente mar", "Condomínio premium", "Alto padrão urbano"],
  "Na planta": ["Lançamento", "Em obra", "Pré-lançamento"],
  Leilão: ["Judicial", "Extrajudicial", "Banco"],
  Multipropriedade: ["Resort", "Condomínio premium"],
  "Imóvel renda": ["Kitnets", "Casas alugadas", "Salas alugadas"],
  "Prédio kitnets": ["Kitnets", "Renda locatícia"],
};

// Mapeamento Subtipo → Tipo legado (usado pela edge function de avaliação)
// Mantém compatibilidade com módulos Apartamento/Terreno/Comercial/Rural existentes.
export const SUBTIPO_TO_LEGACY_TIPO: Record<string, "Casa" | "Apartamento" | "Terreno" | "Comercial" | "Rural"> = {
  // Residencial → Casa ou Apartamento
  Casa: "Casa", Sobrado: "Casa", Townhouse: "Casa",
  "Condomínio fechado": "Casa",
  Apartamento: "Apartamento", Cobertura: "Apartamento", Studio: "Apartamento",
  Kitnet: "Apartamento", Loft: "Apartamento", Flat: "Apartamento",
  "Duplex residencial": "Apartamento", "Triplex residencial": "Apartamento",
  // Terreno
  "Terreno residencial": "Terreno", "Terreno comercial": "Terreno",
  "Lote condomínio": "Terreno", "Área incorporação": "Terreno",
  Industrial: "Terreno", "Chácara urbana": "Terreno", "Rural pequeno porte": "Terreno",
  // Comercial
  Loja: "Comercial", "Sala comercial": "Comercial", Galpão: "Comercial",
  Depósito: "Comercial", Escritório: "Comercial", Clínica: "Comercial",
  Restaurante: "Comercial", "Ponto comercial": "Comercial",
  "Prédio comercial": "Comercial", Coworking: "Comercial", Quiosque: "Comercial",
  // Rural
  Sítio: "Rural", Chácara: "Rural", "Fazenda pecuária": "Rural",
  "Fazenda agrícola": "Rural", Haras: "Rural", Rancho: "Rural",
  "Terra nua": "Rural", Reflorestamento: "Rural", "Área mista": "Rural",
  // Especial → mapear pelo perfil mais próximo (default Casa)
  "Imóvel misto": "Comercial", Luxo: "Casa", "Na planta": "Apartamento",
  Leilão: "Casa", Multipropriedade: "Apartamento",
  "Imóvel renda": "Comercial", "Prédio kitnets": "Comercial",
};

export function getSubtiposByCategoria(cat: CategoriaImovel): string[] {
  return SUBTIPOS_POR_CATEGORIA[cat] || [];
}
export function getEstruturasBySubtipo(sub: string): string[] {
  return ESTRUTURAS_POR_SUBTIPO[sub] || [];
}
export function legacyTipoFromSubtipo(sub: string): "Casa" | "Apartamento" | "Terreno" | "Comercial" | "Rural" {
  return SUBTIPO_TO_LEGACY_TIPO[sub] || "Casa";
}
