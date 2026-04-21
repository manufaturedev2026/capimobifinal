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

function calcular(p: Payload, precoM2: number) {
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

  // Estrutura (só p/ não-terreno)
  if (!isTerreno) {
    const suites = p.suites ?? 0;
    if (suites > 0) aplica(`${suites} suíte(s)`, suites * 2);

    const garagem = p.garagem ?? 0;
    if (garagem === 0) aplica("Sem vaga de garagem", -6);
    else if (garagem > 1) aplica(`Vagas extras (+${garagem - 1})`, (garagem - 1) * 1.5);

    const banheiros = p.banheiros ?? 0;
    if (banheiros > 1) aplica(`Banheiros extras (+${banheiros - 1})`, (banheiros - 1) * 1);

    // Quartos: penaliza poucos dormitórios para imóveis maiores
    const quartos = p.quartos ?? 0;
    const areaRef = (p.areaConstruida && p.areaConstruida > 0) ? p.areaConstruida : p.areaTotal;
    if (quartos > 0 && quartos <= 2 && areaRef >= 120) {
      aplica(`Apenas ${quartos} dormitório(s) p/ ${areaRef}m²`, -4);
    } else if (quartos >= 4) {
      aplica(`${quartos} dormitórios`, 3);
    }
  }

  // Extras
  for (const ex of p.extras ?? []) {
    const pct = EXTRAS_PCT[ex];
    if (pct) aplica(ex, pct);
  }
  // Vista privilegiada via flag
  if (p.extras?.includes("Vista privilegiada")) {
    // já contabilizado acima — evita duplicar
  }

  // Acabamento
  const acab = ACABAMENTO_PCT[p.acabamento ?? "Médio"] ?? 0;
  if (acab !== 0) aplica(`Acabamento: ${p.acabamento}`, acab);

  // Conservação
  const cons = CONSERVACAO_PCT[p.conservacao ?? "Bom"] ?? 0;
  if (cons !== 0) aplica(`Conservação: ${p.conservacao}`, cons);

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
  // Arredondar para o milhar
  valorFinal = Math.round(valorFinal / 1000) * 1000;

  const faixa_min = Math.round((valorFinal * 0.95) / 1000) * 1000;
  const faixa_max = Math.round((valorFinal * 1.05) / 1000) * 1000;
  const venda_rapida = Math.round((valorFinal * 0.92) / 1000) * 1000;
  const venda_premium = Math.round((valorFinal * 1.10) / 1000) * 1000;

  // Tempo estimado por agressividade
  const tempo_medio_venda_dias = ajusteTotal <= -5 ? 45 : ajusteTotal >= 15 ? 150 : 90;

  // Potencial de valorização (heurística)
  let potencial = 5;
  if (p.bairroValorizado) potencial += 2;
  if (p.acabamento === "Alto padrão" || p.acabamento === "Luxo") potencial += 1;
  if (p.conservacao === "Novo" || p.conservacao === "Reformado") potencial += 1;
  if (p.areaRisco) potencial -= 2;
  potencial = Math.max(2, Math.min(15, potencial));

  return {
    valorBase: Math.round(valorBase),
    bonusTotal,
    descontoTotal,
    ajusteTotal,
    valorFinal,
    faixa_min,
    faixa_max,
    venda_rapida,
    venda_premium,
    tempo_medio_venda_dias,
    potencial_valorizacao_pct: potencial,
    breakdown,
    areaCalc,
  };
}

async function aiEnrich(p: Payload, calc: ReturnType<typeof calcular>, precoM2: number, source: string): Promise<{
  justificativa: string;
  pontos_fortes: string[];
  pontos_atencao: string[];
} | null> {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) return null;

  const sourceLabel = source === "bairro" ? "do próprio bairro" :
                      source === "cidade" ? "da média da cidade" :
                      source === "estado" ? "da média do estado" : "do parâmetro nacional";

  const userPrompt = `Você é um avaliador imobiliário sênior. Gere uma análise técnica realista e profissional para o imóvel:

📍 ${p.bairro}, ${p.cidade}/${p.estado}${p.rua ? ` — ${p.rua}` : ""}
🏠 ${p.tipo} | Área: ${calc.areaCalc}m² | Quartos: ${p.quartos ?? 0} (${p.suites ?? 0} suítes) | Banheiros: ${p.banheiros ?? 0} | Vagas: ${p.garagem ?? 0}
✨ Extras: ${p.extras?.join(", ") || "—"}
🎨 Acabamento: ${p.acabamento} | 🔧 Conservação: ${p.conservacao}
📄 Documentação: ${p.documentacao?.join(", ") || "—"}

Cálculo aplicado:
- Preço base: R$ ${precoM2}/m² (referência ${sourceLabel})
- Valor base: R$ ${calc.valorBase.toLocaleString("pt-BR")}
- Bônus aplicados: +${calc.bonusTotal}% | Descontos: ${calc.descontoTotal}%
- Valor final: R$ ${calc.valorFinal.toLocaleString("pt-BR")}
- Ajustes: ${calc.breakdown.map(b => `${b.label} (${b.pct > 0 ? "+" : ""}${b.pct}%)`).join("; ") || "nenhum"}

Retorne SOMENTE via tool: justificativa (3-4 parágrafos profissionais explicando o resultado e o mercado da região), 3-5 pontos_fortes e 2-4 pontos_atencao. Não invente valores diferentes dos calculados.`;

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
              },
              required: ["justificativa", "pontos_fortes", "pontos_atencao"],
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

function fallbackAnalysis(p: Payload, calc: ReturnType<typeof calcular>) {
  const pontos_fortes: string[] = [];
  const pontos_atencao: string[] = [];

  for (const b of calc.breakdown) {
    if (b.pct > 0) pontos_fortes.push(`${b.label} agrega valor (+${b.pct}%)`);
    else pontos_atencao.push(`${b.label} reduz valor (${b.pct}%)`);
  }
  if (pontos_fortes.length === 0) pontos_fortes.push("Imóvel em padrão de mercado para a região");
  if (pontos_atencao.length === 0) pontos_atencao.push("Sem pontos críticos identificados");

  const justificativa = `Avaliação técnica para ${p.tipo.toLowerCase()} em ${p.bairro}, ${p.cidade}/${p.estado}.

Aplicamos preço base de mercado para a região e ajustamos por características do imóvel: ${calc.bonusTotal > 0 ? `+${calc.bonusTotal}% em bônus` : "sem bônus"} e ${calc.descontoTotal < 0 ? `${calc.descontoTotal}% em descontos` : "sem descontos"}, resultando em ${calc.ajusteTotal > 0 ? "+" : ""}${calc.ajusteTotal}% de ajuste líquido.

O valor final de R$ ${calc.valorFinal.toLocaleString("pt-BR")} reflete metragem, padrão construtivo, conservação e atributos diferenciais. A faixa de venda recomendada considera margem de negociação realista para o mercado atual.`;

  return { justificativa, pontos_fortes: pontos_fortes.slice(0, 5), pontos_atencao: pontos_atencao.slice(0, 4) };
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
