// Avaliação imobiliária determinística + IA enriquece justificativa
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
  cep?: string;
  tipo: string;
  areaTotal: number;
  areaConstruida?: number | null;
  quartos?: number;
  banheiros?: number;
  suites?: number;
  garagem?: number;
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
  "Simples": -6, "Médio": 0, "Alto padrão": 8, "Luxo": 15,
};
const CONSERVACAO_PCT: Record<string, number> = {
  "Novo": 10, "Reformado": 6, "Bom": 0, "Bom estado": 0, "Antigo": -7, "Precisa reforma": -15,
};
const EXTRAS_PCT: Record<string, number> = {
  "Quintal": 3, "Piscina": 6, "Área gourmet": 4, "Varanda": 2,
  "Vista privilegiada": 4, "Mobiliado": 3, "Portaria": 2,
  "Elevador": 3, "Energia solar": 4,
};
const DOC_PCT: Record<string, number> = {
  "Financiável": 4, "Escritura OK": 0, "Averbação OK": 0,
  "Escritura pendente": -8, "Averbação pendente": -6, "Pendente": -8,
};

// Comparáveis do mercado local
type Comparable = {
  bedrooms: number | null;
  bathrooms: number | null;
  suites: number | null;
  area: number | null;
  built_area: number | null;
  price: number | null;
};

type MarketContext = {
  total: number;
  avgBedrooms: number;
  avgBathrooms: number;
  avgArea: number;
  avgPrice: number;
  // Heurísticas inferidas
  garagePenaltyWeight: number;       // 0..1 — quão crítica é a falta de garagem
  modernizationPenaltyWeight: number; // 0..1 — quão importante é acabamento
  bedroomExpectation: number;         // qtde média de dormitórios esperada
};

async function fetchMarketContext(
  supabase: any,
  estado: string,
  cidade: string,
  bairro: string,
  tipo: string,
  areaRef: number
): Promise<MarketContext> {
  // Mapear tipo do formulário → category de seller_items
  const categoryMap: Record<string, string> = {
    "Casa": "casa",
    "Apartamento": "apartamento",
    "Terreno": "terreno",
    "Comercial": "comercial",
    "Rural": "rural",
  };
  const category = categoryMap[tipo] ?? tipo.toLowerCase();

  // Tentar bairro primeiro, fallback cidade
  let { data: items } = await supabase
    .from("seller_items")
    .select("bedrooms,bathrooms,suites,area,built_area,price")
    .eq("state", estado)
    .ilike("city", cidade)
    .ilike("neighborhood", bairro)
    .eq("category", category)
    .eq("status", "ativo")
    .limit(50);

  if (!items || items.length < 3) {
    const fallback = await supabase
      .from("seller_items")
      .select("bedrooms,bathrooms,suites,area,built_area,price")
      .eq("state", estado)
      .ilike("city", cidade)
      .eq("category", category)
      .eq("status", "ativo")
      .limit(80);
    items = fallback.data ?? [];
  }

  const list: Comparable[] = items ?? [];
  const total = list.length;

  if (total === 0) {
    // Sem comparáveis — assume defaults conservadores
    return {
      total: 0,
      avgBedrooms: 3,
      avgBathrooms: 2,
      avgArea: areaRef,
      avgPrice: 0,
      garagePenaltyWeight: 0.6,
      modernizationPenaltyWeight: 0.6,
      bedroomExpectation: 3,
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

  // Garagem: heurística — área média alta + cidade indica padrão urbano com garagem essencial
  // (sem coluna garage, usamos proxy: avgArea>=80m² e tipo Casa/Apartamento → garagem é padrão)
  const garageEssential = (tipo === "Casa" || tipo === "Apartamento") && avgArea >= 80;
  const garagePenaltyWeight = garageEssential ? Math.min(1, total / 10) : 0.2;

  // Modernização: se preço médio é alto, mercado exige acabamento melhor
  const pricePerM2Market = avgPrice && avgArea ? avgPrice / avgArea : 0;
  const modernizationPenaltyWeight = pricePerM2Market > 4000 ? 0.9 : pricePerM2Market > 2500 ? 0.7 : 0.4;

  return {
    total,
    avgBedrooms,
    avgBathrooms,
    avgArea,
    avgPrice,
    garagePenaltyWeight,
    modernizationPenaltyWeight,
    bedroomExpectation: Math.round(avgBedrooms),
  };
}

function calcular(p: Payload, precoM2: number, market: MarketContext) {
  const breakdown: Array<{ label: string; pct: number }> = [];
  let bonusTotal = 0;
  let descontoTotal = 0;

  const aplica = (label: string, pct: number) => {
    if (pct === 0) return;
    breakdown.push({ label, pct });
    if (pct > 0) bonusTotal += pct;
    else descontoTotal += pct;
  };

  // Base: terreno usa areaTotal; demais usam construída (ou total como fallback)
  const isTerreno = p.tipo === "Terreno";
  const areaCalc = isTerreno
    ? p.areaTotal
    : (p.areaConstruida && p.areaConstruida > 0 ? p.areaConstruida : p.areaTotal);
  const valorBase = precoM2 * areaCalc;

  // Localização
  if (p.bairroValorizado) aplica("Bairro valorizado", 8);
  if (p.ruaExcelente) aplica("Rua excelente", 5);
  if (p.proximoComercio) aplica("Próximo a comércio/escola", 3);
  if (p.ruaRuim) aplica("Rua ruim/barulho", -5);
  if (p.areaRisco) aplica("Área de risco/alagamento", -8);

  // Estrutura (só p/ não-terreno) — agora COMPARATIVO ao mercado local
  if (!isTerreno) {
    const suites = p.suites ?? 0;
    if (suites > 0) aplica(`${suites} suíte(s)`, suites * 2);

    const garagem = p.garagem ?? 0;
    if (garagem === 0) {
      // Penalidade contextual: -3% a -12% baseado em quão essencial garagem é no mercado local
      const pct = -Math.round(3 + market.garagePenaltyWeight * 9);
      if (pct < 0) aplica(`Sem garagem (mercado local exige)`, pct);
    } else if (garagem > 1) {
      aplica(`Vagas extras (+${garagem - 1})`, (garagem - 1) * 1.5);
    }

    const banheiros = p.banheiros ?? 0;
    if (banheiros > 1) aplica(`Banheiros extras (+${banheiros - 1})`, (banheiros - 1) * 1);

    // Dormitórios x Metragem — comparativo ao esperado no mercado
    const quartos = p.quartos ?? 0;
    const areaRef = (p.areaConstruida && p.areaConstruida > 0) ? p.areaConstruida : p.areaTotal;
    const expected = market.bedroomExpectation;
    // Imóvel grande com poucos dormitórios em relação ao esperado pelo mercado
    if (quartos > 0 && areaRef >= 150 && quartos <= 2 && quartos < expected) {
      // -4% a -10% conforme gap
      const gap = expected - quartos;
      const pct = -Math.min(10, 4 + gap * 2);
      aplica(`${quartos} dormitório(s) p/ ${areaRef}m² (mercado espera ~${expected})`, pct);
    } else if (quartos > 0 && quartos < expected - 1 && areaRef >= 100) {
      aplica(`Dormitórios abaixo da média do bairro (${quartos} vs ~${expected})`, -3);
    } else if (quartos >= 4) {
      aplica(`${quartos} dormitórios`, 3);
    }
  }

  // Extras
  for (const ex of p.extras ?? []) {
    const pct = EXTRAS_PCT[ex];
    if (pct) aplica(ex, pct);
  }

  // Acabamento — agora com peso de modernização do mercado
  const acabBase = ACABAMENTO_PCT[p.acabamento ?? "Médio"] ?? 0;
  if (acabBase !== 0) {
    // Se mercado exige modernização e acabamento é simples, intensifica desconto
    const ajustado = (acabBase < 0)
      ? Math.round(acabBase * (0.8 + market.modernizationPenaltyWeight * 0.6))
      : acabBase;
    aplica(`Acabamento: ${p.acabamento}`, ajustado);
  }

  // Conservação — também sensível ao mercado
  const consBase = CONSERVACAO_PCT[p.conservacao ?? "Bom"] ?? 0;
  if (consBase !== 0) {
    const ajustado = (consBase < 0)
      ? Math.round(consBase * (0.8 + market.modernizationPenaltyWeight * 0.6))
      : consBase;
    aplica(`Conservação: ${p.conservacao}`, ajustado);
  }

  // Documentação
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

  const tempo_medio_venda_dias = ajusteTotal <= -5 ? 45 : ajusteTotal >= 15 ? 150 : 90;

  let potencial = 5;
  if (p.bairroValorizado) potencial += 2;
  if (p.acabamento === "Alto padrão" || p.acabamento === "Luxo") potencial += 1;
  if (p.conservacao === "Novo" || p.conservacao === "Reformado") potencial += 1;
  if (p.areaRisco) potencial -= 2;
  potencial = Math.max(2, Math.min(15, potencial));

  return {
    valorBase: Math.round(valorBase),
    bonusTotal, descontoTotal, ajusteTotal, valorFinal,
    faixa_min, faixa_max, venda_rapida, venda_premium,
    tempo_medio_venda_dias, potencial_valorizacao_pct: potencial,
    breakdown, areaCalc,
  };
}

async function aiEnrich(
  p: Payload,
  calc: ReturnType<typeof calcular>,
  precoM2: number,
  source: string,
  market: MarketContext
): Promise<{
  justificativa: string;
  pontos_fortes: string[];
  pontos_atencao: string[];
  sugestoes_valorizacao?: string[];
} | null> {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) return null;

  const sourceLabel = source === "bairro" ? "do próprio bairro" :
                      source === "cidade" ? "da média da cidade" :
                      source === "estado" ? "da média do estado" : "do parâmetro nacional";

  const marketBlock = market.total > 0
    ? `Comparáveis reais analisados: ${market.total} imóvel(is) similares no mercado local.
- Média de dormitórios na região: ${market.avgBedrooms.toFixed(1)}
- Média de banheiros: ${market.avgBathrooms.toFixed(1)}
- Área média (m²): ${Math.round(market.avgArea)}
- Preço médio: R$ ${Math.round(market.avgPrice).toLocaleString("pt-BR")}
- Garagem é considerada essencial neste mercado: ${market.garagePenaltyWeight > 0.5 ? "SIM" : "NÃO (mercado tolera ausência)"}
- Mercado exige acabamento moderno: ${market.modernizationPenaltyWeight > 0.6 ? "SIM" : "NÃO"}`
    : `Sem comparáveis reais cadastrados no bairro — use parâmetros conservadores e NÃO invente comparações.`;

  const userPrompt = `Você é um avaliador imobiliário sênior. Gere análise técnica COMPARATIVA com o mercado local — NUNCA frases genéricas.

📍 ${p.bairro}, ${p.cidade}/${p.estado}${p.rua ? ` — ${p.rua}` : ""}
🏠 ${p.tipo} | Área: ${calc.areaCalc}m² | Quartos: ${p.quartos ?? 0} (${p.suites ?? 0} suítes) | Banheiros: ${p.banheiros ?? 0} | Vagas: ${p.garagem ?? 0}
✨ Extras: ${p.extras?.join(", ") || "—"}
🎨 Acabamento: ${p.acabamento} | 🔧 Conservação: ${p.conservacao}
📄 Documentação: ${p.documentacao?.join(", ") || "—"}

📊 CONTEXTO DE MERCADO LOCAL:
${marketBlock}

Cálculo aplicado:
- Preço base: R$ ${precoM2}/m² (referência ${sourceLabel})
- Valor base: R$ ${calc.valorBase.toLocaleString("pt-BR")}
- Bônus: +${calc.bonusTotal}% | Descontos: ${calc.descontoTotal}%
- Valor final: R$ ${calc.valorFinal.toLocaleString("pt-BR")}
- Ajustes aplicados: ${calc.breakdown.map(b => `${b.label} (${b.pct > 0 ? "+" : ""}${b.pct}%)`).join("; ") || "nenhum"}

REGRAS PARA PONTOS DE ATENÇÃO (sejam contextuais ao mercado):
1. GARAGEM: só critique ausência de vagas se garagem for essencial neste mercado (ver flag acima). Se mercado tolera, NÃO mencione.
2. DORMITÓRIOS: só critique se a quantidade for nitidamente abaixo da média local para a metragem. Cite a média do bairro.
3. ACABAMENTO/MODERNIZAÇÃO: só critique se o mercado exige padrão acima. Se preço/m² regional é baixo, acabamento simples é compatível — NÃO critique.
4. Se o imóvel for loft, studio ou tiver proposta diferenciada, NÃO aplique críticas tradicionais.
5. Cite SEMPRE os números comparativos do bairro nos pontos de atenção (ex: "abaixo da média de X dormitórios da região").

Retorne via tool:
- justificativa: 3-4 parágrafos profissionais com comparação real ao mercado.
- pontos_fortes: 3-5 itens objetivos.
- pontos_atencao: 2-4 itens CONTEXTUAIS ao mercado local (não genéricos).
- sugestoes_valorizacao: 2-4 ações concretas que elevariam o valor (com impacto % estimado).
NÃO invente valores diferentes dos calculados.`;

  try {
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
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
  if (pontos_atencao.length === 0) pontos_atencao.push("Sem pontos críticos identificados frente ao mercado local");

  if (p.acabamento === "Simples" && market.modernizationPenaltyWeight > 0.6) {
    sugestoes_valorizacao.push("Modernizar pintura, piso e iluminação pode elevar valor em 5-8%");
  }
  if ((p.garagem ?? 0) === 0 && market.garagePenaltyWeight > 0.5) {
    sugestoes_valorizacao.push("Adaptar vaga coberta, mesmo que externa, recupera 3-6% do valor");
  }
  if (!p.documentacao?.includes("Financiável")) {
    sugestoes_valorizacao.push("Regularizar para financiamento bancário amplia público em ~30%");
  }
  if (sugestoes_valorizacao.length === 0) {
    sugestoes_valorizacao.push("Imóvel já em condições competitivas para o mercado atual");
  }

  const justificativa = `Avaliação técnica para ${p.tipo.toLowerCase()} em ${p.bairro}, ${p.cidade}/${p.estado}. ${market.total > 0 ? `Comparada com ${market.total} imóvel(is) similares no mercado local (média de ${market.avgBedrooms.toFixed(1)} dormitórios e ${Math.round(market.avgArea)}m²).` : "Sem comparáveis cadastrados — usados parâmetros de mercado regional."}

Aplicamos preço base de mercado e ajustamos por características: ${calc.bonusTotal > 0 ? `+${calc.bonusTotal}% em bônus` : "sem bônus"} e ${calc.descontoTotal < 0 ? `${calc.descontoTotal}% em descontos` : "sem descontos"}, resultando em ${calc.ajusteTotal > 0 ? "+" : ""}${calc.ajusteTotal}% de ajuste líquido.

O valor final de R$ ${calc.valorFinal.toLocaleString("pt-BR")} reflete metragem, padrão construtivo, conservação, atributos diferenciais e a realidade competitiva da região.`;

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

    // 1. Resolver preço por m²
    const { data: priceData, error: priceErr } = await supabase.rpc("resolve_price_per_sqm", {
      p_estado: data.estado, p_cidade: data.cidade, p_bairro: data.bairro, p_tipo: data.tipo,
    });
    if (priceErr) console.error("price err:", priceErr);
    const precoM2 = Number(priceData?.[0]?.preco_m2) || 3500;
    const source = priceData?.[0]?.source || "default";

    // 2. Calcular determinístico
    const calc = calcular(data, precoM2);

    // 3. Enriquecer com IA (com fallback)
    const ai = await aiEnrich(data, calc, precoM2, source) ?? fallbackAnalysis(data, calc);

    // 4. Salvar histórico
    const authHeader = req.headers.get("Authorization");
    let userId: string | null = null;
    if (authHeader) {
      try {
        const token = authHeader.replace("Bearer ", "");
        const { data: { user } } = await supabase.auth.getUser(token);
        userId = user?.id ?? null;
      } catch {}
    }

    await supabase.from("property_valuations").insert({
      user_id: userId,
      estado: data.estado, cidade: data.cidade, bairro: data.bairro, rua: data.rua, cep: data.cep,
      tipo: data.tipo, area_total: data.areaTotal, area_construida: data.areaConstruida,
      quartos: data.quartos, banheiros: data.banheiros, suites: data.suites, garagem: data.garagem,
      extras: data.extras ?? [], acabamento: data.acabamento, conservacao: data.conservacao,
      documentacao: data.documentacao ?? [],
      preco_m2_usado: precoM2, valor_base: calc.valorBase, ajuste_total_pct: calc.ajusteTotal,
      valor_estimado: calc.valorFinal, faixa_min: calc.faixa_min, faixa_max: calc.faixa_max,
      venda_rapida: calc.venda_rapida, venda_premium: calc.venda_premium,
      tempo_medio_venda_dias: calc.tempo_medio_venda_dias,
      justificativa: ai.justificativa,
      breakdown: { items: calc.breakdown, bonus: calc.bonusTotal, desconto: calc.descontoTotal, source },
    });

    return new Response(JSON.stringify({
      valor_estimado: calc.valorFinal,
      faixa_min: calc.faixa_min,
      faixa_max: calc.faixa_max,
      venda_rapida: calc.venda_rapida,
      venda_premium: calc.venda_premium,
      potencial_valorizacao_pct: calc.potencial_valorizacao_pct,
      tempo_medio_venda_dias: calc.tempo_medio_venda_dias,
      justificativa: ai.justificativa,
      pontos_fortes: ai.pontos_fortes,
      pontos_atencao: ai.pontos_atencao,
      meta: {
        preco_m2: precoM2,
        source,
        valor_base: calc.valorBase,
        ajuste_total_pct: calc.ajusteTotal,
        bonus_total_pct: calc.bonusTotal,
        desconto_total_pct: calc.descontoTotal,
        breakdown: calc.breakdown,
      },
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("valuation error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
