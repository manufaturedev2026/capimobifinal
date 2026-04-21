// Avaliação imobiliária profissional v3 — pesos macro % diretos + modo avançado
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type Payload = {
  estado: string;
  cidade: string;
  bairro: string;
  rua?: string;
  numero?: string;
  cep?: string;
  tipo: string;
  tipoEstrutura?: string;
  // Áreas
  areaTerreno?: number | null;
  areaConstruidaTerreo?: number | null;
  areaConstruidaSuperior?: number | null;
  areaCobertaExterna?: number | null;
  areaUtil?: number | null;
  areaTotal: number;
  areaConstruida?: number | null;
  // Internos
  quartos?: number;
  suites?: number;
  banheiros?: number;
  lavabos?: number;
  garagem?: number;
  salas?: number;
  cozinhas?: number;
  escritorios?: number;
  // Ambientes (booleans modo avançado)
  salaEstar?: boolean;
  salaJantar?: boolean;
  salaTv?: boolean;
  copa?: boolean;
  lavanderia?: boolean;
  areaServico?: boolean;
  closet?: boolean;
  despensa?: boolean;
  varandaInterna?: boolean;
  // Listas / qualitativos
  extras?: string[];
  acabamento?: string;
  conservacao?: string;
  documentacao?: string[];
  // Localização avançada
  bairroValorizado?: boolean;
  ruaTranquila?: boolean;
  proximoComercio?: boolean;
  proximoEscola?: boolean;
  proximoHospital?: boolean;
  vistaPrivilegiada?: boolean;
  areaRisco?: boolean;
  // Acabamento item-a-item
  pisoQualidade?: string;       // simples | bom | premium
  banheiroQualidade?: string;   // antigo | bom | moderno
  cozinhaQualidade?: string;    // antiga | boa | moderna
  pinturaQualidade?: string;    // ruim | media | nova
  esquadriasQualidade?: string; // antigas | boas | premium
  telhadoQualidade?: string;    // ruim | ok | novo
  eletricaQualidade?: string;   // antiga | revisada | nova
  // Documentação avançada
  habiteSe?: boolean;
  financiavel?: boolean;
  semPendencias?: boolean;
  // Mercado
  liquidezMercado?: string;     // alta | media | baixa
  modoAvaliacao?: string;       // simples | avancado
};

// =============== TABELAS DE PESOS ===============
// Localização (35% macro)
const LOC_W = {
  bairroValorizado: 8,
  ruaTranquila: 4,
  proximoComercio: 3,
  proximoEscola: 3,
  proximoHospital: 2,
  vistaPrivilegiada: 4,
  areaRisco: -10,
};

// Estrutura vertical
const ESTRUTURA_PCT: Record<string, number> = {
  "Casa térrea": 0,
  "Sobrado integrado": 6,
  "Casa com pavimento superior": 4,
  "Duas moradias no lote": 12,
  "Uso misto residencial/comercial": 8,
};

// Acabamento padrão geral
const ACABAMENTO_PCT: Record<string, number> = {
  "Simples": -8, "Médio": 0, "Bom": 4, "Alto padrão": 10, "Luxo": 15,
};
const CONSERVACAO_PCT: Record<string, number> = {
  "Novo": 12, "Reformado": 8, "Bom": 0, "Bom estado": 0, "Antigo": -10, "Precisa reforma": -18,
};

// Item-a-item acabamento
const ITEM_QUAL: Record<string, Record<string, number>> = {
  piso:        { simples: -1, bom: 0, premium: 2 },
  banheiro:    { antigo: -2, bom: 0, moderno: 2 },
  cozinha:     { antiga: -2, boa: 0, moderna: 3 },
  pintura:     { ruim: -1, media: 0, nova: 1.5 },
  esquadrias:  { antigas: -1, boas: 0, premium: 2 },
  telhado:     { ruim: -2, ok: 0, novo: 1.5 },
  eletrica:    { antiga: -2, revisada: 0, nova: 1.5 },
};

const EXTRAS_PCT: Record<string, number> = {
  "Quintal": 2, "Jardim": 1, "Piscina": 5, "Área gourmet": 3,
  "Churrasqueira": 1.5, "Terraço": 2, "Sacada": 1, "Varanda": 2,
  "Vista": 3, "Vista privilegiada": 4, "Mobiliado": 3,
  "Portão eletrônico": 1, "Sistema segurança": 2, "Sistema de segurança": 2,
  "Portaria": 2, "Elevador": 3, "Energia solar": 4, "Edícula": 3,
};

const DOC_PCT: Record<string, number> = {
  "Financiável": 4, "Habite-se": 1.5,
  "Escritura ok": 1, "Escritura OK": 1,
  "Registro ok": 1, "Registro OK": 1,
  "Averbação ok": 1, "Averbação OK": 1,
  "Sem pendências": 1,
  "Pendências": -10, "Pendente": -8,
};

const LIQUIDEZ_PCT: Record<string, number> = {
  alta: 3, media: 0, baixa: -4,
};

type Comparable = {
  bedrooms: number | null; bathrooms: number | null; suites: number | null;
  area: number | null; built_area: number | null; price: number | null;
  title?: string | null; city?: string | null; neighborhood?: string | null;
};

type MarketContext = {
  total: number;
  avgBedrooms: number; avgBathrooms: number; avgArea: number; avgPrice: number;
  pricePerM2Market: number;
  garagePenaltyWeight: number;
  modernizationPenaltyWeight: number;
  bedroomExpectation: number;
  topComparables: Comparable[];
};

async function fetchMarketContext(
  supabase: any, estado: string, cidade: string, bairro: string, tipo: string, areaRef: number
): Promise<MarketContext> {
  const categoryMap: Record<string, string> = {
    "Casa": "casa", "Apartamento": "apartamento", "Terreno": "terreno",
    "Comercial": "comercial", "Rural": "rural",
  };
  const category = categoryMap[tipo] ?? tipo.toLowerCase();

  let { data: items } = await supabase
    .from("seller_items")
    .select("title,city,neighborhood,bedrooms,bathrooms,suites,area,built_area,price")
    .eq("state", estado).ilike("city", cidade).ilike("neighborhood", bairro)
    .eq("category", category).eq("status", "ativo").limit(50);

  if (!items || items.length < 3) {
    const fb = await supabase.from("seller_items")
      .select("title,city,neighborhood,bedrooms,bathrooms,suites,area,built_area,price")
      .eq("state", estado).ilike("city", cidade)
      .eq("category", category).eq("status", "ativo").limit(80);
    items = fb.data ?? [];
  }

  const list: Comparable[] = items ?? [];
  const total = list.length;

  if (total === 0) {
    return {
      total: 0, avgBedrooms: 3, avgBathrooms: 2, avgArea: areaRef, avgPrice: 0,
      pricePerM2Market: 0,
      garagePenaltyWeight: 0.6, modernizationPenaltyWeight: 0.6,
      bedroomExpectation: 3, topComparables: [],
    };
  }

  const avg = (arr: number[]) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
  const beds = list.map(c => Number(c.bedrooms) || 0).filter(n => n > 0);
  const baths = list.map(c => Number(c.bathrooms) || 0).filter(n => n > 0);
  const areas = list.map(c => Number(c.built_area || c.area) || 0).filter(n => n > 0);
  const prices = list.map(c => Number(c.price) || 0).filter(n => n > 0);

  const avgBedrooms = avg(beds) || 3;
  const avgBathrooms = avg(baths) || 2;
  const avgArea = avg(areas) || areaRef;
  const avgPrice = avg(prices);
  const pricePerM2Market = avgPrice && avgArea ? avgPrice / avgArea : 0;

  const garageEssential = (tipo === "Casa" || tipo === "Apartamento") && avgArea >= 80;
  const garagePenaltyWeight = garageEssential ? Math.min(1, total / 10) : 0.2;
  const modernizationPenaltyWeight = pricePerM2Market > 4000 ? 0.9 : pricePerM2Market > 2500 ? 0.7 : 0.4;

  const topComparables = [...list]
    .filter(c => (c.built_area || c.area) && c.price)
    .sort((a, b) => Math.abs((Number(a.built_area || a.area) || 0) - areaRef) - Math.abs((Number(b.built_area || b.area) || 0) - areaRef))
    .slice(0, 3);

  return {
    total, avgBedrooms, avgBathrooms, avgArea, avgPrice, pricePerM2Market,
    garagePenaltyWeight, modernizationPenaltyWeight,
    bedroomExpectation: Math.round(avgBedrooms),
    topComparables,
  };
}

async function resolvePrecoM2(
  supabase: any, p: Payload, market: MarketContext
): Promise<{ precoM2: number; source: string }> {
  const { data, error } = await supabase.rpc("resolve_price_per_sqm", {
    p_estado: p.estado, p_cidade: p.cidade, p_bairro: p.bairro, p_tipo: p.tipo,
  });
  if (!error) {
    const v = Number(data?.[0]?.preco_m2) || 0;
    const src = data?.[0]?.source || "default";
    if (v > 0) return { precoM2: v, source: src };
  }
  if (market.pricePerM2Market > 0) {
    return { precoM2: Math.round(market.pricePerM2Market), source: "comparativo_regional" };
  }
  const fallback: Record<string, number> = {
    "Casa": 3800, "Apartamento": 6500, "Terreno": 1200,
    "Comercial": 5500, "Rural": 80,
  };
  return { precoM2: fallback[p.tipo] ?? 3500, source: "media_nacional" };
}

function calcular(p: Payload, precoM2: number, market: MarketContext) {
  type BItem = { label: string; pct: number; categoria: string };
  const breakdown: BItem[] = [];
  let bonusTotal = 0, descontoTotal = 0;
  // somatório por categoria macro (para score)
  const macro = { localizacao: 0, tamanho: 0, estrutura: 0, acabamento: 0, diferenciais: 0, documentacao: 0, liquidez: 0 };

  const aplica = (label: string, pct: number, categoria: keyof typeof macro) => {
    if (!pct) return;
    breakdown.push({ label, pct: Math.round(pct * 10) / 10, categoria });
    if (pct > 0) bonusTotal += pct; else descontoTotal += pct;
    macro[categoria] += pct;
  };

  const isTerreno = p.tipo === "Terreno";
  const terreoArea = Number(p.areaConstruidaTerreo) || 0;
  const superiorArea = Number(p.areaConstruidaSuperior) || 0;
  const construidaSeparada = terreoArea + superiorArea;
  const construidaInformada = Number(p.areaConstruida) || 0;
  const areaConstruidaTotal = construidaSeparada > 0 ? construidaSeparada : construidaInformada;
  const areaTerreno = Number(p.areaTerreno) || Number(p.areaTotal) || 0;
  const areaCalc = isTerreno
    ? (areaTerreno || Number(p.areaTotal))
    : (areaConstruidaTotal > 0 ? areaConstruidaTotal : Number(p.areaTotal));

  const valorBase = precoM2 * areaCalc;

  // ============ LOCALIZAÇÃO (35%) ============
  if (p.bairroValorizado) aplica("Bairro valorizado", LOC_W.bairroValorizado, "localizacao");
  if (p.ruaTranquila) aplica("Rua tranquila", LOC_W.ruaTranquila, "localizacao");
  if (p.proximoComercio) aplica("Próximo a comércio", LOC_W.proximoComercio, "localizacao");
  if (p.proximoEscola) aplica("Próximo a escola", LOC_W.proximoEscola, "localizacao");
  if (p.proximoHospital) aplica("Próximo a hospital", LOC_W.proximoHospital, "localizacao");
  if (p.vistaPrivilegiada) aplica("Vista privilegiada", LOC_W.vistaPrivilegiada, "localizacao");
  if (p.areaRisco) aplica("Área de risco/alagamento", LOC_W.areaRisco, "localizacao");

  // ============ ESTRUTURA VERTICAL ============
  if (!isTerreno && p.tipoEstrutura) {
    const pct = ESTRUTURA_PCT[p.tipoEstrutura] ?? 0;
    if (pct) aplica(`Tipo: ${p.tipoEstrutura}`, pct, "estrutura");
  }

  // ============ ESTRUTURA INTERNA (15%) ============
  if (!isTerreno) {
    const suites = p.suites ?? 0;
    if (suites > 0) aplica(`${suites} suíte(s)`, suites * 1.5, "estrutura");

    const garagem = p.garagem ?? 0;
    if (garagem === 0) {
      const pct = -Math.round(3 + market.garagePenaltyWeight * 9);
      if (pct < 0) aplica("Sem garagem (mercado local exige)", pct, "estrutura");
    } else if (garagem > 1) {
      aplica(`Vagas extras (+${garagem - 1})`, (garagem - 1) * 1.2, "estrutura");
    }

    const banheiros = p.banheiros ?? 0;
    if (banheiros > 1) aplica(`Banheiros extras (+${banheiros - 1})`, (banheiros - 1) * 0.8, "estrutura");
    if ((p.lavabos ?? 0) > 0) aplica(`${p.lavabos} lavabo(s)`, (p.lavabos ?? 0) * 1, "estrutura");

    const quartos = p.quartos ?? 0;
    const areaRef = areaConstruidaTotal > 0 ? areaConstruidaTotal : Number(p.areaTotal);
    const expected = market.bedroomExpectation;
    if (quartos > 0 && areaRef >= 150 && quartos <= 2 && quartos < expected) {
      const gap = expected - quartos;
      aplica(`${quartos} dormitórios p/ ${areaRef}m² (mercado espera ~${expected})`, -Math.min(10, 4 + gap * 2), "estrutura");
    } else if (quartos > 0 && quartos < expected - 1 && areaRef >= 100) {
      aplica(`Dormitórios abaixo da média (${quartos} vs ~${expected})`, -3, "estrutura");
    } else if (quartos >= 4) {
      aplica(`${quartos} dormitórios`, 2, "estrutura");
    }

    if ((p.salas ?? 0) >= 2) aplica("2+ salas (living amplo)", 1.5, "estrutura");
    if ((p.escritorios ?? 0) >= 1) aplica("Escritório/home office", 1.5, "estrutura");
    // Ambientes extras
    let ambExtra = 0;
    const ambs: Array<[boolean | undefined, string]> = [
      [p.salaJantar, "sala de jantar"], [p.salaTv, "sala de TV"], [p.copa, "copa"],
      [p.lavanderia, "lavanderia"], [p.areaServico, "área de serviço"],
      [p.closet, "closet"], [p.despensa, "despensa"], [p.varandaInterna, "varanda interna"],
    ];
    const ambNames: string[] = [];
    for (const [v, name] of ambs) if (v) { ambExtra += 0.4; ambNames.push(name); }
    if (ambExtra > 0) aplica(`Ambientes extras: ${ambNames.join(", ")}`, Math.min(3, ambExtra), "estrutura");
  }

  // ============ TAMANHO ============
  if (!isTerreno && areaConstruidaTotal > 0 && areaTerreno > areaConstruidaTotal * 1.5) {
    aplica("Lote generoso (> 1.5x área construída)", 2, "tamanho");
  }
  const areaUtil = Number(p.areaUtil) || 0;
  const areaCoberta = Number(p.areaCobertaExterna) || 0;
  if (areaCoberta > 0) aplica(`${areaCoberta}m² cobertos externos`, Math.min(3, areaCoberta * 0.02), "tamanho");
  if (areaUtil > 0 && areaConstruidaTotal && areaUtil >= areaConstruidaTotal * 0.85) {
    aplica("Alto aproveitamento de área útil", 1.5, "tamanho");
  }

  // ============ ACABAMENTO (15%) ============
  const acabBase = ACABAMENTO_PCT[p.acabamento ?? "Médio"] ?? 0;
  if (acabBase !== 0) {
    const ajustado = (acabBase < 0)
      ? Math.round(acabBase * (0.8 + market.modernizationPenaltyWeight * 0.6))
      : acabBase;
    aplica(`Acabamento: ${p.acabamento}`, ajustado, "acabamento");
  }
  const consBase = CONSERVACAO_PCT[p.conservacao ?? "Bom"] ?? 0;
  if (consBase !== 0) {
    const ajustado = (consBase < 0)
      ? Math.round(consBase * (0.8 + market.modernizationPenaltyWeight * 0.6))
      : consBase;
    aplica(`Conservação: ${p.conservacao}`, ajustado, "acabamento");
  }
  // Item-a-item
  const itemKeys: Array<[string, string | undefined, string]> = [
    ["piso", p.pisoQualidade, "Piso"],
    ["banheiro", p.banheiroQualidade, "Banheiros"],
    ["cozinha", p.cozinhaQualidade, "Cozinha"],
    ["pintura", p.pinturaQualidade, "Pintura"],
    ["esquadrias", p.esquadriasQualidade, "Esquadrias"],
    ["telhado", p.telhadoQualidade, "Telhado"],
    ["eletrica", p.eletricaQualidade, "Elétrica"],
  ];
  for (const [k, val, label] of itemKeys) {
    if (!val) continue;
    const pct = ITEM_QUAL[k]?.[val.toLowerCase()];
    if (pct) aplica(`${label}: ${val}`, pct, "acabamento");
  }

  // ============ DIFERENCIAIS (10%) ============
  for (const ex of p.extras ?? []) {
    const pct = EXTRAS_PCT[ex];
    if (pct) aplica(ex, pct, "diferenciais");
  }

  // ============ DOCUMENTAÇÃO (5%) ============
  for (const doc of p.documentacao ?? []) {
    const pct = DOC_PCT[doc];
    if (pct) aplica(doc, pct, "documentacao");
  }
  if (p.habiteSe) aplica("Habite-se", DOC_PCT["Habite-se"], "documentacao");
  if (p.financiavel && !(p.documentacao ?? []).includes("Financiável")) aplica("Financiável", DOC_PCT["Financiável"], "documentacao");
  if (p.semPendencias) aplica("Sem pendências judiciais", DOC_PCT["Sem pendências"], "documentacao");

  // ============ LIQUIDEZ (5%) ============
  if (p.liquidezMercado) {
    const pct = LIQUIDEZ_PCT[p.liquidezMercado];
    if (pct) aplica(`Liquidez do mercado: ${p.liquidezMercado}`, pct, "liquidez");
  }

  // ============ LIMITADORES ============
  bonusTotal = Math.min(bonusTotal, 35);
  descontoTotal = Math.max(descontoTotal, -30);
  const ajusteTotal = Math.round((bonusTotal + descontoTotal) * 10) / 10;

  let valorFinal = valorBase * (1 + ajusteTotal / 100);
  valorFinal = Math.round(valorFinal / 1000) * 1000;

  const faixa_min = Math.round((valorFinal * 0.95) / 1000) * 1000;
  const faixa_max = Math.round((valorFinal * 1.05) / 1000) * 1000;
  const venda_rapida = Math.round((valorFinal * 0.92) / 1000) * 1000;
  const venda_premium = Math.round((valorFinal * 1.10) / 1000) * 1000;

  // ============ SCORES 0-10 derivados dos macro ============
  // Cada categoria parte de 6.0 e oscila conforme o impacto % aplicado
  // Localização: cap ±15 -> ±4 pontos
  const scoreFrom = (pct: number, cap: number) => {
    const norm = Math.max(-cap, Math.min(cap, pct)) / cap; // -1..1
    return Math.max(2, Math.min(10, 6 + norm * 4));
  };
  const scoreLocalizacao = scoreFrom(macro.localizacao, 15);
  const scoreEstrutura = scoreFrom(macro.estrutura, 12);
  const scoreAcabamento = scoreFrom(macro.acabamento, 18);
  const scoreDiferenciais = scoreFrom(macro.diferenciais, 12);
  const scoreDocumentacao = scoreFrom(macro.documentacao + (p.financiavel ? 1 : 0), 6);

  // Liquidez derivada
  let liquidezScore = 5 + macro.liquidez * 0.5;
  if (ajusteTotal >= 10) liquidezScore += 1;
  if (ajusteTotal <= -10) liquidezScore -= 1;
  if (p.acabamento === "Alto padrão" || p.acabamento === "Luxo") liquidezScore += 1;
  if (p.conservacao === "Precisa reforma") liquidezScore -= 2;
  if (p.financiavel || p.documentacao?.includes("Financiável")) liquidezScore += 1;
  liquidezScore = Math.max(2, Math.min(10, liquidezScore));

  const tempo_medio_venda_dias = liquidezScore >= 8 ? 45 : liquidezScore >= 6 ? 90 : liquidezScore >= 4 ? 150 : 210;
  const aluguelPct = liquidezScore >= 7 ? 0.006 : liquidezScore >= 5 ? 0.005 : 0.004;
  const aluguel_estimado = Math.round((valorFinal * aluguelPct) / 50) * 50;

  let potencial = 5;
  if (p.bairroValorizado) potencial += 2;
  if (p.acabamento === "Alto padrão" || p.acabamento === "Luxo") potencial += 1;
  if (p.conservacao === "Novo" || p.conservacao === "Reformado") potencial += 1;
  if (p.areaRisco) potencial -= 2;
  potencial = Math.max(2, Math.min(15, potencial));

  const scores = {
    localizacao: Math.round(scoreLocalizacao * 10) / 10,
    estrutura: Math.round(scoreEstrutura * 10) / 10,
    acabamento: Math.round(scoreAcabamento * 10) / 10,
    diferenciais: Math.round(scoreDiferenciais * 10) / 10,
    liquidez: Math.round(liquidezScore * 10) / 10,
    documentacao: Math.round(scoreDocumentacao * 10) / 10,
  };
  // Nota geral ponderada conforme pesos macro (35/15/15/15/10/5/5)
  const scoreGeralRaw =
    scores.localizacao * 0.35 +
    scoreFrom(0, 1) * 0 + // tamanho não impacta score (só calc)
    scores.estrutura * 0.15 +
    scores.acabamento * 0.15 +
    scores.diferenciais * 0.10 +
    scores.documentacao * 0.05 +
    scores.liquidez * 0.05;
  // Como tamanho (15%) ficou de fora, normalizamos apenas pelos pesos efetivos (85%)
  const scoreGeral = Number((scoreGeralRaw / 0.85).toFixed(1));

  // Macro % por categoria para visualização
  const macroPercents = {
    localizacao: Math.round(macro.localizacao * 10) / 10,
    tamanho: Math.round(macro.tamanho * 10) / 10,
    estrutura: Math.round(macro.estrutura * 10) / 10,
    acabamento: Math.round(macro.acabamento * 10) / 10,
    diferenciais: Math.round(macro.diferenciais * 10) / 10,
    documentacao: Math.round(macro.documentacao * 10) / 10,
    liquidez: Math.round(macro.liquidez * 10) / 10,
  };

  return {
    valorBase: Math.round(valorBase),
    bonusTotal: Math.round(bonusTotal * 10) / 10,
    descontoTotal: Math.round(descontoTotal * 10) / 10,
    ajusteTotal,
    valorFinal,
    faixa_min, faixa_max, venda_rapida, venda_premium,
    tempo_medio_venda_dias, potencial_valorizacao_pct: potencial,
    aluguel_estimado,
    breakdown, areaCalc, areaConstruidaTotal, areaTerreno,
    scores, scoreGeral, macroPercents,
  };
}

async function aiEnrich(
  p: Payload, calc: ReturnType<typeof calcular>, precoM2: number, source: string, market: MarketContext
): Promise<{
  justificativa: string;
  pontos_fortes: string[];
  pontos_atencao: string[];
  sugestoes_valorizacao: string[];
} | null> {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) return null;

  const sourceLabel: Record<string, string> = {
    bairro: "do próprio bairro", cidade: "da média da cidade",
    estado: "da média do estado", nacional: "do parâmetro nacional",
    comparativo_regional: "calculada a partir de imóveis similares na região",
    media_nacional: "da média nacional por tipo de imóvel",
    default: "padrão de referência",
  };

  const marketBlock = market.total > 0
    ? `${market.total} imóvel(is) similares analisados.
- Média de dormitórios: ${market.avgBedrooms.toFixed(1)}
- Média de banheiros: ${market.avgBathrooms.toFixed(1)}
- Área média: ${Math.round(market.avgArea)}m²
- Preço médio: R$ ${Math.round(market.avgPrice).toLocaleString("pt-BR")}
- Garagem essencial neste mercado: ${market.garagePenaltyWeight > 0.5 ? "SIM" : "NÃO"}
- Mercado exige acabamento moderno: ${market.modernizationPenaltyWeight > 0.6 ? "SIM" : "NÃO"}`
    : `Sem comparáveis cadastrados no bairro.`;

  const userPrompt = `Você é avaliador imobiliário sênior. Análise comparativa REAL ao mercado local. Nunca frases genéricas.

📍 ${p.bairro}, ${p.cidade}/${p.estado}${p.rua ? ` — ${p.rua}${p.numero ? `, ${p.numero}` : ""}` : ""}
🏠 ${p.tipo}${p.tipoEstrutura ? ` (${p.tipoEstrutura})` : ""}
📐 Terreno: ${calc.areaTerreno || "—"}m² | Construída total: ${calc.areaConstruidaTotal || "—"}m²
🛏 Quartos: ${p.quartos ?? 0} (${p.suites ?? 0} suítes) | Banheiros: ${p.banheiros ?? 0}${p.lavabos ? ` (+${p.lavabos} lavabos)` : ""} | Vagas: ${p.garagem ?? 0}
🛋 Salas: ${p.salas ?? 0} | Cozinhas: ${p.cozinhas ?? 0} | Escritórios: ${p.escritorios ?? 0}
✨ Extras: ${p.extras?.join(", ") || "—"}
🎨 Acabamento: ${p.acabamento} | 🔧 Conservação: ${p.conservacao}
📄 Documentação: ${p.documentacao?.join(", ") || "—"}${p.financiavel ? " · financiável" : ""}${p.habiteSe ? " · habite-se" : ""}

📊 MERCADO LOCAL: ${marketBlock}

CÁLCULO:
- Preço base: R$ ${precoM2}/m² (referência ${sourceLabel[source] ?? source})
- Valor base: R$ ${calc.valorBase.toLocaleString("pt-BR")}
- Bônus: +${calc.bonusTotal}% | Descontos: ${calc.descontoTotal}%
- Valor final: R$ ${calc.valorFinal.toLocaleString("pt-BR")}
- Ajustes aplicados: ${calc.breakdown.map(b => `${b.label} (${b.pct > 0 ? "+" : ""}${b.pct}%)`).join("; ") || "nenhum"}
- Score geral: ${calc.scoreGeral}/10
- Score por dimensão: Loc ${calc.scores.localizacao} · Estrut ${calc.scores.estrutura} · Acab ${calc.scores.acabamento} · Difer ${calc.scores.diferenciais} · Liquidez ${calc.scores.liquidez} · Doc ${calc.scores.documentacao}

REGRAS PARA PONTOS DE ATENÇÃO (contextuais ao mercado, NUNCA genéricos):
1. GARAGEM: critique apenas se essencial neste mercado.
2. DORMITÓRIOS: critique apenas se abaixo da média local p/ a metragem. Cite a média.
3. ACABAMENTO: critique apenas se mercado exige padrão acima.
4. Cite SEMPRE números comparativos do bairro.

Retorne via tool:
- justificativa: 3-4 parágrafos com comparação real.
- pontos_fortes: 3-5 itens objetivos baseados nos ajustes positivos e scores altos.
- pontos_atencao: 2-4 itens contextuais. Se nada relevante, array vazio.
- sugestoes_valorizacao: 2-4 ações concretas com impacto % estimado.
NÃO invente valores diferentes dos calculados.`;

  try {
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "user", content: userPrompt }],
        tools: [{
          type: "function",
          function: {
            name: "return_analysis",
            parameters: {
              type: "object",
              properties: {
                justificativa: { type: "string" },
                pontos_fortes: { type: "array", items: { type: "string" } },
                pontos_atencao: { type: "array", items: { type: "string" } },
                sugestoes_valorizacao: { type: "array", items: { type: "string" } },
              },
              required: ["justificativa", "pontos_fortes", "pontos_atencao", "sugestoes_valorizacao"],
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "return_analysis" } },
      }),
    });
    if (!response.ok) return null;
    const result = await response.json();
    const tc = result.choices?.[0]?.message?.tool_calls?.[0];
    if (!tc) return null;
    return JSON.parse(tc.function.arguments);
  } catch (e) {
    console.error("AI enrich failed:", e);
    return null;
  }
}

function fallbackAnalysis(p: Payload, calc: ReturnType<typeof calcular>, market: MarketContext) {
  const pontos_fortes: string[] = [];
  const pontos_atencao: string[] = [];
  const sugestoes_valorizacao: string[] = [];

  for (const b of calc.breakdown) {
    if (b.pct > 0) pontos_fortes.push(`${b.label} agrega valor (+${b.pct}%)`);
    else pontos_atencao.push(`${b.label} reduz valor (${b.pct}%)`);
  }
  if (pontos_fortes.length === 0) pontos_fortes.push("Imóvel em padrão de mercado para a região");

  if (p.acabamento === "Simples" && market.modernizationPenaltyWeight > 0.6)
    sugestoes_valorizacao.push("Modernizar pintura, piso e iluminação pode elevar valor em 5-8%");
  if ((p.garagem ?? 0) === 0 && market.garagePenaltyWeight > 0.5)
    sugestoes_valorizacao.push("Adaptar vaga coberta recupera 3-6% do valor");
  if (!p.financiavel && !p.documentacao?.includes("Financiável"))
    sugestoes_valorizacao.push("Regularizar para financiamento amplia público em ~30%");
  if (sugestoes_valorizacao.length === 0)
    sugestoes_valorizacao.push("Imóvel em condições competitivas para o mercado atual");

  const justificativa = `Avaliação técnica para ${p.tipo.toLowerCase()} em ${p.bairro}, ${p.cidade}/${p.estado}. ${market.total > 0 ? `Comparada com ${market.total} imóvel(is) similares (média ${market.avgBedrooms.toFixed(1)} dorm. e ${Math.round(market.avgArea)}m²).` : "Sem comparáveis cadastrados — usados parâmetros regionais."}

Aplicamos preço base de mercado e ajustamos por características: ${calc.bonusTotal > 0 ? `+${calc.bonusTotal}% em bônus` : "sem bônus"} e ${calc.descontoTotal < 0 ? `${calc.descontoTotal}% em descontos` : "sem descontos"}, ajuste líquido ${calc.ajusteTotal > 0 ? "+" : ""}${calc.ajusteTotal}%.

Valor de R$ ${calc.valorFinal.toLocaleString("pt-BR")} reflete metragem, padrão construtivo, conservação, atributos e realidade competitiva da região.`;

  return {
    justificativa,
    pontos_fortes: pontos_fortes.slice(0, 5),
    pontos_atencao: pontos_atencao.slice(0, 4),
    sugestoes_valorizacao: sugestoes_valorizacao.slice(0, 4),
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

    const data = await req.json() as Payload;

    if (!data.estado || !data.cidade || !data.bairro || !data.tipo || !data.areaTotal) {
      return new Response(JSON.stringify({ error: "Campos obrigatórios faltando" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const areaRefForMarket =
      (Number(data.areaConstruidaTerreo) || 0) + (Number(data.areaConstruidaSuperior) || 0) ||
      (Number(data.areaConstruida) || 0) || data.areaTotal;
    const market = await fetchMarketContext(supabase, data.estado, data.cidade, data.bairro, data.tipo, areaRefForMarket);
    const { precoM2, source } = await resolvePrecoM2(supabase, data, market);
    const calc = calcular(data, precoM2, market);
    const ai = await aiEnrich(data, calc, precoM2, source, market) ?? fallbackAnalysis(data, calc, market);

    const authHeader = req.headers.get("Authorization");
    let userId: string | null = null;
    if (authHeader) {
      try {
        const token = authHeader.replace("Bearer ", "");
        const { data: { user } } = await supabase.auth.getUser(token);
        userId = user?.id ?? null;
      } catch {}
    }

    const comparaveisOut = market.topComparables.map(c => ({
      titulo: c.title ?? "Imóvel similar",
      bairro: c.neighborhood ?? "",
      area: Number(c.built_area || c.area) || 0,
      quartos: Number(c.bedrooms) || null,
      preco: Number(c.price) || 0,
    }));

    await supabase.from("property_valuations").insert({
      user_id: userId,
      estado: data.estado, cidade: data.cidade, bairro: data.bairro,
      rua: data.rua, numero: data.numero, cep: data.cep,
      tipo: data.tipo, tipo_estrutura: data.tipoEstrutura,
      area_total: data.areaTotal,
      area_terreno: data.areaTerreno ?? null,
      area_construida: calc.areaConstruidaTotal || data.areaConstruida || null,
      area_construida_terreo: data.areaConstruidaTerreo ?? null,
      area_construida_superior: data.areaConstruidaSuperior ?? null,
      area_coberta_externa: data.areaCobertaExterna ?? null,
      area_util: data.areaUtil ?? null,
      quartos: data.quartos, banheiros: data.banheiros, suites: data.suites, garagem: data.garagem,
      lavabos: data.lavabos ?? null,
      salas: data.salas ?? null, cozinhas: data.cozinhas ?? null, escritorios: data.escritorios ?? null,
      sala_estar: data.salaEstar ?? false, sala_jantar: data.salaJantar ?? false, sala_tv: data.salaTv ?? false,
      copa: data.copa ?? false, lavanderia: data.lavanderia ?? false, area_servico: data.areaServico ?? false,
      closet: data.closet ?? false, despensa: data.despensa ?? false, varanda_interna: data.varandaInterna ?? false,
      regiao_valorizada: data.bairroValorizado ?? false, rua_tranquila: data.ruaTranquila ?? false,
      proximo_comercio: data.proximoComercio ?? false, proximo_escola: data.proximoEscola ?? false,
      proximo_hospital: data.proximoHospital ?? false, vista_privilegiada: data.vistaPrivilegiada ?? false,
      area_risco: data.areaRisco ?? false,
      piso_qualidade: data.pisoQualidade ?? null, banheiro_qualidade: data.banheiroQualidade ?? null,
      cozinha_qualidade: data.cozinhaQualidade ?? null, pintura_qualidade: data.pinturaQualidade ?? null,
      esquadrias_qualidade: data.esquadriasQualidade ?? null, telhado_qualidade: data.telhadoQualidade ?? null,
      eletrica_qualidade: data.eletricaQualidade ?? null,
      habite_se: data.habiteSe ?? false, financiavel: data.financiavel ?? false,
      sem_pendencias: data.semPendencias ?? false,
      liquidez_mercado: data.liquidezMercado ?? null,
      modo_avaliacao: data.modoAvaliacao ?? "simples",
      inputs: data as any,
      extras: data.extras ?? [], acabamento: data.acabamento, conservacao: data.conservacao,
      documentacao: data.documentacao ?? [],
      preco_m2_usado: precoM2, valor_base: calc.valorBase, ajuste_total_pct: calc.ajusteTotal,
      valor_estimado: calc.valorFinal, faixa_min: calc.faixa_min, faixa_max: calc.faixa_max,
      venda_rapida: calc.venda_rapida, venda_premium: calc.venda_premium,
      tempo_medio_venda_dias: calc.tempo_medio_venda_dias,
      aluguel_estimado: calc.aluguel_estimado,
      score_localizacao: calc.scores.localizacao, score_estrutura: calc.scores.estrutura,
      score_acabamento: calc.scores.acabamento, score_diferenciais: calc.scores.diferenciais,
      score_liquidez: calc.scores.liquidez, score_documentacao: calc.scores.documentacao,
      score_geral: calc.scoreGeral,
      pontos_fortes: ai.pontos_fortes, pontos_atencao: ai.pontos_atencao,
      sugestoes_valorizacao: ai.sugestoes_valorizacao, comparaveis: comparaveisOut,
      justificativa: ai.justificativa,
      breakdown: { items: calc.breakdown, bonus: calc.bonusTotal, desconto: calc.descontoTotal, source, market_total: market.total, macro: calc.macroPercents },
    });

    return new Response(JSON.stringify({
      valor_estimado: calc.valorFinal,
      faixa_min: calc.faixa_min, faixa_max: calc.faixa_max,
      venda_rapida: calc.venda_rapida, venda_premium: calc.venda_premium,
      aluguel_estimado: calc.aluguel_estimado,
      potencial_valorizacao_pct: calc.potencial_valorizacao_pct,
      tempo_medio_venda_dias: calc.tempo_medio_venda_dias,
      justificativa: ai.justificativa,
      pontos_fortes: ai.pontos_fortes, pontos_atencao: ai.pontos_atencao,
      sugestoes_valorizacao: ai.sugestoes_valorizacao,
      scores: calc.scores, score_geral: calc.scoreGeral,
      macro_percents: calc.macroPercents,
      comparaveis: comparaveisOut,
      meta: {
        preco_m2: precoM2, source,
        valor_base: calc.valorBase, area_calc: calc.areaCalc,
        area_construida_total: calc.areaConstruidaTotal, area_terreno: calc.areaTerreno,
        ajuste_total_pct: calc.ajusteTotal,
        bonus_total_pct: calc.bonusTotal, desconto_total_pct: calc.descontoTotal,
        breakdown: calc.breakdown,
        macro: calc.macroPercents,
        market: {
          comparaveis: market.total,
          media_dormitorios: Number(market.avgBedrooms.toFixed(1)),
          media_banheiros: Number(market.avgBathrooms.toFixed(1)),
          media_area_m2: Math.round(market.avgArea),
          media_preco: Math.round(market.avgPrice),
        },
      },
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("valuation error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
