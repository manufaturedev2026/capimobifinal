// Avaliação imobiliária profissional v2 — determinística + IA contextual
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
  areaTotal: number;            // legado (compat)
  areaConstruida?: number | null; // legado (compat) — total construída
  // Internos
  quartos?: number;
  suites?: number;
  banheiros?: number;
  garagem?: number;
  salas?: number;
  cozinhas?: number;
  escritorios?: number;
  // Listas
  extras?: string[];
  acabamento?: string;
  conservacao?: string;
  documentacao?: string[];
  // Sinalizadores opcionais
  bairroValorizado?: boolean;
  ruaExcelente?: boolean;
  ruaRuim?: boolean;
  areaRisco?: boolean;
  proximoComercio?: boolean;
};

// Tabelas de pesos
const ACABAMENTO_PCT: Record<string, number> = {
  "Simples": -8, "Médio": 0, "Bom": 3, "Alto padrão": 10, "Luxo": 15,
};
const CONSERVACAO_PCT: Record<string, number> = {
  "Novo": 12, "Reformado": 8, "Bom": 0, "Bom estado": 0, "Antigo": -10, "Precisa reforma": -18,
};
const EXTRAS_PCT: Record<string, number> = {
  "Quintal": 3, "Piscina": 6, "Área gourmet": 4, "Varanda": 2,
  "Vista": 4, "Vista privilegiada": 4, "Mobiliado": 3, "Portaria": 2,
  "Elevador": 3, "Energia solar": 4,
};
const DOC_PCT: Record<string, number> = {
  "Financiável": 4, "Escritura OK": 1, "Escritura ok": 1,
  "Registro OK": 1, "Registro ok": 1,
  "Averbação OK": 1, "Averbação ok": 1,
  "Escritura pendente": -8, "Averbação pendente": -6,
  "Pendências": -10, "Pendente": -8,
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

  // Top 3 comparáveis: ordenar por proximidade de área
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

// Resolve preço/m² com fallback EM CASCATA — nunca devolve 0
async function resolvePrecoM2(
  supabase: any, p: Payload, market: MarketContext
): Promise<{ precoM2: number; source: string }> {
  // 1. Tentar RPC tradicional (bairro → cidade → estado → nacional)
  const { data, error } = await supabase.rpc("resolve_price_per_sqm", {
    p_estado: p.estado, p_cidade: p.cidade, p_bairro: p.bairro, p_tipo: p.tipo,
  });
  if (!error) {
    const v = Number(data?.[0]?.preco_m2) || 0;
    const src = data?.[0]?.source || "default";
    if (v > 0) return { precoM2: v, source: src };
  }

  // 2. Se mercado local tem preço médio, usar
  if (market.pricePerM2Market > 0) {
    return { precoM2: Math.round(market.pricePerM2Market), source: "comparativo_regional" };
  }

  // 3. Fallback nacional por tipo (médias seguras)
  const fallback: Record<string, number> = {
    "Casa": 3800, "Apartamento": 6500, "Terreno": 1200,
    "Comercial": 5500, "Rural": 80,
  };
  return { precoM2: fallback[p.tipo] ?? 3500, source: "media_nacional" };
}

function calcular(p: Payload, precoM2: number, market: MarketContext) {
  const breakdown: Array<{ label: string; pct: number }> = [];
  let bonusTotal = 0, descontoTotal = 0;
  const aplica = (label: string, pct: number) => {
    if (pct === 0) return;
    breakdown.push({ label, pct });
    if (pct > 0) bonusTotal += pct; else descontoTotal += pct;
  };

  const isTerreno = p.tipo === "Terreno";

  // Calcular área construída total
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

  // Localização
  if (p.bairroValorizado) aplica("Bairro valorizado", 8);
  if (p.ruaExcelente) aplica("Rua excelente", 5);
  if (p.proximoComercio) aplica("Próximo a comércio/escola", 3);
  if (p.ruaRuim) aplica("Rua ruim/barulho", -5);
  if (p.areaRisco) aplica("Área de risco/alagamento", -8);

  // Estrutura — sobrado / duas moradias
  if (!isTerreno && p.tipoEstrutura) {
    if (p.tipoEstrutura === "Sobrado integrado" || p.tipoEstrutura === "Casa com pavimento superior") {
      if (superiorArea > 0) aplica("Sobrado bem distribuído (2 pavimentos)", 6);
    } else if (p.tipoEstrutura === "Duas moradias no lote") {
      aplica("Duas moradias independentes no lote", 10);
    } else if (p.tipoEstrutura === "Uso misto residencial/comercial") {
      aplica("Uso misto (residencial + comercial)", 5);
    }
  }

  if (!isTerreno) {
    const suites = p.suites ?? 0;
    if (suites > 0) aplica(`${suites} suíte(s)`, suites * 2);

    const garagem = p.garagem ?? 0;
    if (garagem === 0) {
      const pct = -Math.round(3 + market.garagePenaltyWeight * 9);
      if (pct < 0) aplica(`Sem garagem (mercado local exige)`, pct);
    } else if (garagem > 1) {
      aplica(`Vagas extras (+${garagem - 1})`, (garagem - 1) * 1.5);
    }

    const banheiros = p.banheiros ?? 0;
    if (banheiros > 1) aplica(`Banheiros extras (+${banheiros - 1})`, (banheiros - 1) * 1);

    const quartos = p.quartos ?? 0;
    const areaRef = areaConstruidaTotal > 0 ? areaConstruidaTotal : Number(p.areaTotal);
    const expected = market.bedroomExpectation;
    if (quartos > 0 && areaRef >= 150 && quartos <= 2 && quartos < expected) {
      const gap = expected - quartos;
      const pct = -Math.min(10, 4 + gap * 2);
      aplica(`${quartos} dormitório(s) p/ ${areaRef}m² (mercado espera ~${expected})`, pct);
    } else if (quartos > 0 && quartos < expected - 1 && areaRef >= 100) {
      aplica(`Dormitórios abaixo da média do bairro (${quartos} vs ~${expected})`, -3);
    } else if (quartos >= 4) {
      aplica(`${quartos} dormitórios`, 3);
    }

    if ((p.salas ?? 0) >= 2) aplica("2+ salas (living amplo)", 2);
    if ((p.escritorios ?? 0) >= 1) aplica("Escritório/home office", 2);
  }

  // Extras
  for (const ex of p.extras ?? []) {
    const pct = EXTRAS_PCT[ex];
    if (pct) aplica(ex, pct);
  }

  // Acabamento (sensível ao mercado)
  const acabBase = ACABAMENTO_PCT[p.acabamento ?? "Médio"] ?? 0;
  if (acabBase !== 0) {
    const ajustado = (acabBase < 0)
      ? Math.round(acabBase * (0.8 + market.modernizationPenaltyWeight * 0.6))
      : acabBase;
    aplica(`Acabamento: ${p.acabamento}`, ajustado);
  }

  const consBase = CONSERVACAO_PCT[p.conservacao ?? "Bom"] ?? 0;
  if (consBase !== 0) {
    const ajustado = (consBase < 0)
      ? Math.round(consBase * (0.8 + market.modernizationPenaltyWeight * 0.6))
      : consBase;
    aplica(`Conservação: ${p.conservacao}`, ajustado);
  }

  for (const doc of p.documentacao ?? []) {
    const pct = DOC_PCT[doc];
    if (pct) aplica(doc, pct);
  }

  // Limitadores
  bonusTotal = Math.min(bonusTotal, 35);
  descontoTotal = Math.max(descontoTotal, -30);
  const ajusteTotal = bonusTotal + descontoTotal;

  let valorFinal = valorBase * (1 + ajusteTotal / 100);
  valorFinal = Math.round(valorFinal / 1000) * 1000;

  const faixa_min = Math.round((valorFinal * 0.95) / 1000) * 1000;
  const faixa_max = Math.round((valorFinal * 1.05) / 1000) * 1000;
  const venda_rapida = Math.round((valorFinal * 0.92) / 1000) * 1000;
  const venda_premium = Math.round((valorFinal * 1.10) / 1000) * 1000;

  // Tempo de venda baseado em liquidez (ajuste + acabamento + doc)
  let liquidezScore = 5;
  if (ajusteTotal >= 10) liquidezScore += 2;
  if (ajusteTotal <= -10) liquidezScore -= 2;
  if (p.acabamento === "Alto padrão" || p.acabamento === "Luxo") liquidezScore += 1;
  if (p.conservacao === "Precisa reforma") liquidezScore -= 2;
  if (p.documentacao?.includes("Financiável")) liquidezScore += 1;
  liquidezScore = Math.max(2, Math.min(10, liquidezScore));

  const tempo_medio_venda_dias = liquidezScore >= 8 ? 45 : liquidezScore >= 6 ? 90 : liquidezScore >= 4 ? 150 : 210;

  // Aluguel estimado (0.4% a 0.7% do valor conforme liquidez)
  const aluguelPct = liquidezScore >= 7 ? 0.006 : liquidezScore >= 5 ? 0.005 : 0.004;
  const aluguel_estimado = Math.round((valorFinal * aluguelPct) / 50) * 50;

  // Potencial valorização
  let potencial = 5;
  if (p.bairroValorizado) potencial += 2;
  if (p.acabamento === "Alto padrão" || p.acabamento === "Luxo") potencial += 1;
  if (p.conservacao === "Novo" || p.conservacao === "Reformado") potencial += 1;
  if (p.areaRisco) potencial -= 2;
  potencial = Math.max(2, Math.min(15, potencial));

  // Scores 0-10
  const scores = {
    localizacao: Math.max(2, Math.min(10, 6 + (p.bairroValorizado ? 2 : 0) + (p.ruaExcelente ? 1 : 0) + (p.proximoComercio ? 1 : 0) - (p.ruaRuim ? 2 : 0) - (p.areaRisco ? 3 : 0))),
    estrutura: Math.max(2, Math.min(10, 5 + ((p.suites ?? 0) > 0 ? 1 : 0) + ((p.garagem ?? 0) >= 1 ? 1 : -2) + ((p.quartos ?? 0) >= 3 ? 1 : 0) + (superiorArea > 0 ? 1 : 0))),
    acabamento: Math.max(2, Math.min(10,
      p.acabamento === "Luxo" ? 10 :
      p.acabamento === "Alto padrão" ? 9 :
      p.acabamento === "Bom" ? 7 :
      p.acabamento === "Médio" ? 6 : 4
    )),
    liquidez: liquidezScore,
    documentacao: Math.max(2, Math.min(10,
      (p.documentacao?.includes("Pendências") || p.documentacao?.includes("Pendente")) ? 3 :
      (p.documentacao?.includes("Financiável") ? 10 :
      (p.documentacao?.length ?? 0) >= 3 ? 9 :
      (p.documentacao?.length ?? 0) >= 1 ? 7 : 5)
    )),
  };
  const scoreGeral = Number((
    (scores.localizacao + scores.estrutura + scores.acabamento + scores.liquidez + scores.documentacao) / 5
  ).toFixed(1));

  return {
    valorBase: Math.round(valorBase),
    bonusTotal, descontoTotal, ajusteTotal, valorFinal,
    faixa_min, faixa_max, venda_rapida, venda_premium,
    tempo_medio_venda_dias, potencial_valorizacao_pct: potencial,
    aluguel_estimado,
    breakdown, areaCalc, areaConstruidaTotal, areaTerreno,
    scores, scoreGeral,
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
    bairro: "do próprio bairro",
    cidade: "da média da cidade",
    estado: "da média do estado",
    nacional: "do parâmetro nacional",
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
📐 Área terreno: ${calc.areaTerreno || "—"}m² | Área construída total: ${calc.areaConstruidaTotal || "—"}m²
🛏 Quartos: ${p.quartos ?? 0} (${p.suites ?? 0} suítes) | Banheiros: ${p.banheiros ?? 0} | Vagas: ${p.garagem ?? 0}
🛋 Salas: ${p.salas ?? 0} | Cozinhas: ${p.cozinhas ?? 0} | Escritórios: ${p.escritorios ?? 0}
✨ Extras: ${p.extras?.join(", ") || "—"}
🎨 Acabamento: ${p.acabamento} | 🔧 Conservação: ${p.conservacao}
📄 Documentação: ${p.documentacao?.join(", ") || "—"}

📊 MERCADO LOCAL: ${marketBlock}

CÁLCULO:
- Preço base: R$ ${precoM2}/m² (referência ${sourceLabel[source] ?? source})
- Valor base: R$ ${calc.valorBase.toLocaleString("pt-BR")}
- Bônus: +${calc.bonusTotal}% | Descontos: ${calc.descontoTotal}%
- Valor final: R$ ${calc.valorFinal.toLocaleString("pt-BR")}
- Ajustes: ${calc.breakdown.map(b => `${b.label} (${b.pct > 0 ? "+" : ""}${b.pct}%)`).join("; ") || "nenhum"}
- Score geral: ${calc.scoreGeral}/10

REGRAS PARA PONTOS DE ATENÇÃO (contextuais ao mercado, NUNCA genéricos):
1. GARAGEM: critique apenas se essencial neste mercado (ver flag).
2. DORMITÓRIOS: critique apenas se abaixo da média local p/ a metragem. Cite a média.
3. ACABAMENTO: critique apenas se mercado exige padrão acima.
4. Se for loft/studio/proposta diferenciada, NÃO aplique críticas tradicionais.
5. Cite SEMPRE números comparativos do bairro.

Retorne via tool:
- justificativa: 3-4 parágrafos com comparação real ao mercado.
- pontos_fortes: 3-5 itens objetivos.
- pontos_atencao: 2-4 itens contextuais (não genéricos). Se nenhum problema real, retorne array vazio.
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
    else pontos_atencao.push(`${b.label} reduz valor (${b.pct}%) na comparação local`);
  }
  if (pontos_fortes.length === 0) pontos_fortes.push("Imóvel em padrão de mercado para a região");

  if (p.acabamento === "Simples" && market.modernizationPenaltyWeight > 0.6) {
    sugestoes_valorizacao.push("Modernizar pintura, piso e iluminação pode elevar valor em 5-8%");
  }
  if ((p.garagem ?? 0) === 0 && market.garagePenaltyWeight > 0.5) {
    sugestoes_valorizacao.push("Adaptar vaga coberta recupera 3-6% do valor");
  }
  if (!p.documentacao?.includes("Financiável")) {
    sugestoes_valorizacao.push("Regularizar para financiamento amplia público em ~30%");
  }
  if (sugestoes_valorizacao.length === 0) {
    sugestoes_valorizacao.push("Imóvel em condições competitivas para o mercado atual");
  }

  const justificativa = `Avaliação técnica para ${p.tipo.toLowerCase()} em ${p.bairro}, ${p.cidade}/${p.estado}. ${market.total > 0 ? `Comparada com ${market.total} imóvel(is) similares (média ${market.avgBedrooms.toFixed(1)} dorm. e ${Math.round(market.avgArea)}m²).` : "Sem comparáveis cadastrados — usados parâmetros regionais."}

Aplicamos preço base de mercado e ajustamos por características: ${calc.bonusTotal > 0 ? `+${calc.bonusTotal}% em bônus` : "sem bônus"} e ${calc.descontoTotal < 0 ? `${calc.descontoTotal}% em descontos` : "sem descontos"}, ajuste líquido ${calc.ajusteTotal > 0 ? "+" : ""}${calc.ajusteTotal}%.

Valor de ${calc.valorFinal.toLocaleString("pt-BR")} reflete metragem, padrão construtivo, conservação, atributos e realidade competitiva da região.`;

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

    // 1. Contexto de mercado
    const areaRefForMarket =
      (Number(data.areaConstruidaTerreo) || 0) + (Number(data.areaConstruidaSuperior) || 0) ||
      (Number(data.areaConstruida) || 0) || data.areaTotal;
    const market = await fetchMarketContext(supabase, data.estado, data.cidade, data.bairro, data.tipo, areaRefForMarket);

    // 2. Resolver preço/m² (sempre > 0)
    const { precoM2, source } = await resolvePrecoM2(supabase, data, market);

    // 3. Cálculo determinístico contextual
    const calc = calcular(data, precoM2, market);

    // 4. IA enriquecida
    const ai = await aiEnrich(data, calc, precoM2, source, market) ?? fallbackAnalysis(data, calc, market);

    // 5. Persistir histórico
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
      quartos: data.quartos, banheiros: data.banheiros, suites: data.suites, garagem: data.garagem,
      salas: data.salas ?? null, cozinhas: data.cozinhas ?? null, escritorios: data.escritorios ?? null,
      extras: data.extras ?? [], acabamento: data.acabamento, conservacao: data.conservacao,
      documentacao: data.documentacao ?? [],
      preco_m2_usado: precoM2, valor_base: calc.valorBase, ajuste_total_pct: calc.ajusteTotal,
      valor_estimado: calc.valorFinal, faixa_min: calc.faixa_min, faixa_max: calc.faixa_max,
      venda_rapida: calc.venda_rapida, venda_premium: calc.venda_premium,
      tempo_medio_venda_dias: calc.tempo_medio_venda_dias,
      aluguel_estimado: calc.aluguel_estimado,
      score_localizacao: calc.scores.localizacao,
      score_estrutura: calc.scores.estrutura,
      score_acabamento: calc.scores.acabamento,
      score_liquidez: calc.scores.liquidez,
      score_documentacao: calc.scores.documentacao,
      score_geral: calc.scoreGeral,
      pontos_fortes: ai.pontos_fortes,
      pontos_atencao: ai.pontos_atencao,
      sugestoes_valorizacao: ai.sugestoes_valorizacao,
      comparaveis: comparaveisOut,
      justificativa: ai.justificativa,
      breakdown: { items: calc.breakdown, bonus: calc.bonusTotal, desconto: calc.descontoTotal, source, market_total: market.total },
    });

    return new Response(JSON.stringify({
      valor_estimado: calc.valorFinal,
      faixa_min: calc.faixa_min,
      faixa_max: calc.faixa_max,
      venda_rapida: calc.venda_rapida,
      venda_premium: calc.venda_premium,
      aluguel_estimado: calc.aluguel_estimado,
      potencial_valorizacao_pct: calc.potencial_valorizacao_pct,
      tempo_medio_venda_dias: calc.tempo_medio_venda_dias,
      justificativa: ai.justificativa,
      pontos_fortes: ai.pontos_fortes,
      pontos_atencao: ai.pontos_atencao,
      sugestoes_valorizacao: ai.sugestoes_valorizacao,
      scores: calc.scores,
      score_geral: calc.scoreGeral,
      comparaveis: comparaveisOut,
      meta: {
        preco_m2: precoM2, source,
        valor_base: calc.valorBase,
        area_calc: calc.areaCalc,
        area_construida_total: calc.areaConstruidaTotal,
        area_terreno: calc.areaTerreno,
        ajuste_total_pct: calc.ajusteTotal,
        bonus_total_pct: calc.bonusTotal,
        desconto_total_pct: calc.descontoTotal,
        breakdown: calc.breakdown,
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
