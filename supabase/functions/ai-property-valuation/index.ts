// Avaliação imobiliária profissional v3 — pesos macro % diretos + modo avançado
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { consumeAiCredits, refundAiCredits } from "../_shared/ai-credits.ts";

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
  categoria?: string;
  subtipo?: string;
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
  proximoTransporte?: boolean;
  proximoParque?: boolean;
  proximoBancos?: boolean;
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
  // Apartamento (módulo específico)
  andarUnidade?: number | null;
  totalAndaresPredio?: number | null;
  possuiElevador?: boolean;
  qtdElevadores?: number | null;
  elevadorModerno?: boolean;
  condominioGrande?: boolean;
  escadasLargas?: boolean;
  vagasGaragem?: number | null;
  portaria24h?: boolean;
  lazerCompleto?: boolean;
  taxaCondominio?: number | null;
  vistaLivre?: boolean;
  solManha?: boolean;
  solTarde?: boolean;
  barulhoExterno?: boolean;
  acessibilidade?: boolean;
  publicoIdoso?: boolean;
  ultimoAndar?: boolean;
  garden?: boolean;
};

// =============== APARTAMENTO: regras contextuais ===============
function aplicaRegrasApartamento(
  p: Payload,
  aplica: (label: string, pct: number, categoria: any) => void,
  valorBase: number,
) {
  if (p.tipo !== "Apartamento") return;
  const andar = Number(p.andarUnidade) || 0;
  const total = Number(p.totalAndaresPredio) || 0;
  const elevadores = Number(p.qtdElevadores) || 0;
  const vagas = Number(p.vagasGaragem) || 0;
  const cond = Number(p.taxaCondominio) || 0;

  // ========== ELEVADOR ==========
  if (p.possuiElevador) {
    if (total >= 4) {
      // prédio com 4+ andares e elevador → bônus base
      const base = total >= 10 ? 8 : total >= 7 ? 6 : 4;
      aplica(`Elevador em prédio de ${total} andares`, base, "estrutura");
    }
    if (elevadores >= 2) aplica(`${elevadores} elevadores (alta capacidade)`, 2, "estrutura");
    if (p.elevadorModerno) aplica("Elevador moderno", 1, "estrutura");
  } else {
    // SEM elevador — analisar andar
    if (andar >= 4) {
      let pct = -8 - Math.min(10, (andar - 4) * 2.5); // 4º=-8, 5º=-10.5, 6º=-13, 7º=-15.5, 8º+=-18
      pct = Math.max(-18, pct);
      if (p.publicoIdoso) pct = Math.max(-22, pct - 4);
      aplica(`${andar}º andar sem elevador`, pct, "estrutura");
    } else if (andar === 3) {
      const pct = p.publicoIdoso ? -6 : -4;
      aplica("3º andar sem elevador", pct, "estrutura");
    } else if (andar === 2) {
      aplica("2º andar sem elevador", -1.5, "estrutura");
    } else if (andar === 1) {
      // pequeno bônus por acesso fácil
      aplica("1º andar (acesso facilitado)", 1, "estrutura");
    }
    // último andar sem elevador: penalização extra
    if (p.ultimoAndar && andar >= 3) {
      let extra = -3;
      if (p.vistaLivre) extra += 4; // compensa
      aplica("Último andar sem elevador", extra, "estrutura");
    }
  }

  // ========== ANDAR ALTO COM ELEVADOR ==========
  if (p.possuiElevador && andar >= 5) {
    let bonus = 3;
    if (p.vistaLivre) bonus += 3;
    if (andar >= 10) bonus += 2;
    aplica(`Andar alto (${andar}º) com elevador`, Math.min(8, bonus), "localizacao");
  }

  // ========== PRIMEIRO ANDAR — contexto ==========
  if (andar === 1) {
    if (p.barulhoExterno) aplica("1º andar com ruído externo", -3, "estrutura");
  }
  // Garden / térreo
  if (p.garden) aplica("Garden / térreo com quintal", 4, "diferenciais");

  // ========== VISTA / SOL / RUÍDO ==========
  if (p.vistaLivre && andar < 5) aplica("Vista livre", 3, "localizacao");
  if (p.solManha) aplica("Sol da manhã", 2, "localizacao");
  if (p.solTarde && !p.solManha) aplica("Sol da tarde", 0.5, "localizacao");
  if (p.barulhoExterno && andar !== 1) {
    const pct = andar >= 5 ? -2 : -5;
    aplica("Ruído externo (avenida)", pct, "localizacao");
  }

  // ========== VAGA GARAGEM (apartamento) ==========
  if (vagas === 0) {
    aplica("Sem vaga garagem (apartamento)", -7, "estrutura");
  } else if (vagas >= 2) {
    aplica(`${vagas} vagas garagem`, Math.min(10, 4 + (vagas - 1) * 3), "estrutura");
  } else {
    aplica("1 vaga garagem", 3, "estrutura");
  }

  // ========== CONDOMÍNIO ==========
  if (p.portaria24h) aplica("Portaria 24h e segurança", 3, "diferenciais");
  if (p.lazerCompleto) aplica("Área de lazer completa", 4, "diferenciais");
  if (p.acessibilidade === false) aplica("Baixa acessibilidade", -3, "estrutura");

  // Condomínio caro vs valor (>1.2% mensal do valor base é considerado alto)
  if (cond > 0 && valorBase > 0) {
    const ratio = (cond * 12) / valorBase; // anual / valor
    if (ratio > 0.012) aplica("Condomínio elevado p/ padrão", -4, "liquidez");
    else if (ratio > 0.008) aplica("Condomínio acima da média", -2, "liquidez");
  }
}

// =============== TABELAS DE PESOS ===============
// Localização (35% macro)
const LOC_W = {
  bairroValorizado: 8,
  ruaTranquila: 4,
  proximoComercio: 3,
  proximoEscola: 3,
  proximoHospital: 2,
  proximoTransporte: 2,
  proximoParque: 2,
  proximoBancos: 1.5,
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
  listing_status?: string | null; finality?: string | null;
};

type MarketContext = {
  total: number;
  avgBedrooms: number; avgBathrooms: number; avgArea: number; avgPrice: number;
  pricePerM2Market: number;
  garagePenaltyWeight: number;
  modernizationPenaltyWeight: number;
  bedroomExpectation: number;
  topComparables: Comparable[];
  comparaveis_origem: string;
  comparaveis_aviso: string | null;
};

// Faixas mínimas/máximas plausíveis de R$/m² por tipo (filtro anti-anúncio incoerente)
const PRECO_M2_RANGE: Record<string, [number, number]> = {
  "Casa":        [800, 25000],
  "Apartamento": [1500, 35000],
  "Comercial":   [1000, 30000],
  "Terreno":     [50, 8000],
  "Rural":       [5, 2000],
};

function isComparavelValido(c: Comparable, tipo: string, areaRef: number, finalidade: "venda"|"aluguel"): boolean {
  const price = Number(c.price) || 0;
  const area = Number(c.built_area || c.area) || 0;
  if (price <= 0 || area <= 0) return false;
  // Finalidade (no banco interno usamos seller_items.finality quando disponível)
  if (c.finality && c.finality !== finalidade) return false;
  // Faixa de área ±30%
  if (areaRef > 0) {
    const ratio = area / areaRef;
    if (ratio < 0.7 || ratio > 1.3) return false;
  }
  // Preço/m² dentro da faixa plausível do tipo
  const ppm2 = price / area;
  const [pmin, pmax] = PRECO_M2_RANGE[tipo] ?? [100, 50000];
  // Para aluguel, divide por ~120 (proxy) — descartamos se ainda assim absurdo
  const refMin = finalidade === "aluguel" ? pmin / 200 : pmin;
  const refMax = finalidade === "aluguel" ? pmax / 50  : pmax;
  if (ppm2 < refMin || ppm2 > refMax) return false;
  return true;
}

async function fetchMarketContext(
  supabase: any, estado: string, cidade: string, bairro: string, tipo: string, areaRef: number,
  finalidade: "venda" | "aluguel" = "venda",
): Promise<MarketContext> {
  const categoryMap: Record<string, string> = {
    "Casa": "casa", "Apartamento": "apartamento", "Terreno": "terreno",
    "Comercial": "comercial", "Rural": "rural",
  };
  const category = categoryMap[tipo] ?? tipo.toLowerCase();

  // Apenas comparáveis VÁLIDOS: publicado, vendido (venda) ou alugado (aluguel)
  // NUNCA: demo, teste, rascunho, oculto
  const validStatuses = finalidade === "aluguel"
    ? ["publicado", "alugado"]
    : ["publicado", "vendido"];

  const baseSelect = "title,city,neighborhood,bedrooms,bathrooms,suites,area,built_area,price,listing_status,finality";

  // 1) Bairro exato
  let { data: items } = await supabase
    .from("seller_items")
    .select(baseSelect)
    .eq("state", estado).ilike("city", cidade).ilike("neighborhood", bairro)
    .eq("category", category)
    .in("listing_status", validStatuses)
    .limit(80);

  let origem = "bairro";
  let aviso: string | null = null;

  // 2) Fallback: cidade
  if (!items || items.length < 3) {
    const fb = await supabase.from("seller_items")
      .select(baseSelect)
      .eq("state", estado).ilike("city", cidade)
      .eq("category", category)
      .in("listing_status", validStatuses)
      .limit(120);
    items = fb.data ?? [];
    origem = "cidade";
  }

  // 3) Fallback: estado (base regional ampliada)
  if (!items || items.length < 3) {
    const fb2 = await supabase.from("seller_items")
      .select(baseSelect)
      .eq("state", estado)
      .eq("category", category)
      .in("listing_status", validStatuses)
      .limit(150);
    items = fb2.data ?? [];
    origem = "regional_ampliado";
    aviso = "Comparativos locais insuficientes. Usando base regional ampliada.";
  }

  // Filtro anti-incoerência (preço, área, tipo, finalidade)
  const raw: Comparable[] = items ?? [];
  const list = raw.filter(c => isComparavelValido(c, tipo, areaRef, finalidade));
  const total = list.length;

  if (total === 0) {
    return {
      total: 0, avgBedrooms: 3, avgBathrooms: 2, avgArea: areaRef, avgPrice: 0,
      pricePerM2Market: 0,
      garagePenaltyWeight: 0.6, modernizationPenaltyWeight: 0.6,
      bedroomExpectation: 3, topComparables: [],
      comparaveis_origem: "indisponivel",
      comparaveis_aviso: "Sem comparativos locais confiáveis. Avaliação baseada em tabela regional de preços.",
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
    .sort((a, b) => Math.abs((Number(a.built_area || a.area) || 0) - areaRef) - Math.abs((Number(b.built_area || b.area) || 0) - areaRef))
    .slice(0, 3);

  return {
    total, avgBedrooms, avgBathrooms, avgArea, avgPrice, pricePerM2Market,
    garagePenaltyWeight, modernizationPenaltyWeight,
    bedroomExpectation: Math.round(avgBedrooms),
    topComparables,
    comparaveis_origem: origem,
    comparaveis_aviso: aviso,
  };
}

// =================== BUSCA EXTERNA (Gemini + Google Search Grounding) ===================
type ExternalComp = {
  titulo: string;
  bairro?: string;
  cidade?: string;
  area?: number;
  quartos?: number;
  preco?: number;
  preco_m2?: number;
  fonte?: string; // OLX, Zap, Viva Real, Imovelweb, imobiliária local
  url?: string;
};
type ExternalMarket = {
  total: number;
  comparaveis: ExternalComp[];
  preco_medio: number;
  preco_mediano: number;
  preco_m2_medio: number;
  preco_m2_mediano: number;
  preco_provavel_fechamento: number; // após desconto de negociação
  fontes_consultadas: string[];
  resumo: string;
  aviso?: string;
};

function median(nums: number[]): number {
  if (!nums.length) return 0;
  const s = [...nums].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

// Remove outliers usando IQR
function removeOutliers(nums: number[]): number[] {
  if (nums.length < 4) return nums;
  const s = [...nums].sort((a, b) => a - b);
  const q1 = s[Math.floor(s.length * 0.25)];
  const q3 = s[Math.floor(s.length * 0.75)];
  const iqr = q3 - q1;
  const lo = q1 - 1.5 * iqr;
  const hi = q3 + 1.5 * iqr;
  return nums.filter(n => n >= lo && n <= hi);
}

async function fetchExternalMarket(
  p: Payload, areaRef: number, finalidade: "venda" | "aluguel"
): Promise<ExternalMarket | null> {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  const FIRECRAWL_API_KEY = Deno.env.get("FIRECRAWL_API_KEY");
  if (!LOVABLE_API_KEY || !FIRECRAWL_API_KEY) {
    console.warn("[external] missing keys", { hasLovable: !!LOVABLE_API_KEY, hasFirecrawl: !!FIRECRAWL_API_KEY });
    return null;
  }

  const quartos = Number(p.quartos) || 0;
  const finalidadeLabel = finalidade === "aluguel" ? "para alugar" : "à venda";
  const termoBusca = (p.subtipo && p.subtipo.trim()) ? p.subtipo : p.tipo;
  const estruturaInfo = p.tipoEstrutura ? ` ${p.tipoEstrutura}` : "";
  const quartosTxt = quartos > 0 ? ` ${quartos} quartos` : "";

  const queryBase = `${termoBusca}${estruturaInfo}${quartosTxt} ${finalidadeLabel} ${p.bairro} ${p.cidade} ${p.estado}`;
  const targetSites = [
    "olx.com.br",
    "zapimoveis.com.br",
    "vivareal.com.br",
    "chavesnamao.com.br",
    "imovelweb.com.br",
    "wimoveis.com.br",
  ];
  // Queries hiper-locais: CEP e rua (quando disponíveis) ajudam a achar imóveis vizinhos
  const cepDigits = (p.cep || "").replace(/\D/g, "");
  const cepQ = cepDigits.length === 8 ? `${cepDigits.slice(0, 5)}-${cepDigits.slice(5)}` : "";
  const ruaQ = (p.rua || "").trim();
  const hyperLocal: string[] = [];
  if (ruaQ) hyperLocal.push(`${termoBusca}${finalidadeLabel ? " " + finalidadeLabel : ""} "${ruaQ}" ${p.bairro} ${p.cidade}`);
  if (cepQ) hyperLocal.push(`${termoBusca} ${finalidadeLabel} ${cepQ}`);
  const searchQueries = [
    queryBase,
    ...hyperLocal,
    ...targetSites.map((site) => `${queryBase} site:${site}`),
  ];

  console.log("[external] firecrawl search start", { queries: searchQueries });

  // 1) BUSCA REAL via Firecrawl (Google search + scrape do markdown de cada resultado)
  let searchResults: Array<{ url: string; title?: string; description?: string; markdown?: string }> = [];
  try {
    const batches = await Promise.allSettled(searchQueries.map(async (query, index) => {
      const ctrl = new AbortController();
      const timeoutId = setTimeout(() => ctrl.abort(), 14000);
      const fcResp = await fetch("https://api.firecrawl.dev/v2/search", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${FIRECRAWL_API_KEY}`,
          "Content-Type": "application/json",
        },
        signal: ctrl.signal,
        body: JSON.stringify({
          query,
          limit: index === 0 ? 8 : 4,
          lang: "pt",
          country: "br",
          scrapeOptions: { formats: ["markdown"], onlyMainContent: true },
        }),
      });
      clearTimeout(timeoutId);
      if (!fcResp.ok) {
        const errTxt = await fcResp.text().catch(() => "");
        console.error("[external] firecrawl error", fcResp.status, errTxt.slice(0, 500));
        return [];
      }
      const fcData = await fcResp.json();
      const raw = fcData?.data?.web ?? fcData?.data ?? [];
      return Array.isArray(raw) ? raw : [];
    }));
    const seenUrls = new Set<string>();
    searchResults = batches
      .flatMap((b) => b.status === "fulfilled" ? b.value : [])
      .filter((r) => {
        if (!r?.url || seenUrls.has(r.url)) return false;
        seenUrls.add(r.url);
        return true;
      })
      .slice(0, 22);
    console.log("[external] firecrawl results:", searchResults.length);
  } catch (e) {
    console.error("[external] firecrawl fetch failed", String(e));
    return null;
  }

  if (searchResults.length === 0) {
    return {
      total: 0, comparaveis: [], preco_medio: 0, preco_mediano: 0,
      preco_m2_medio: 0, preco_m2_mediano: 0, preco_provavel_fechamento: 0,
      fontes_consultadas: [], resumo: "Sem anúncios encontrados na web.",
      aviso: "Nenhum anúncio externo localizado para este perfil.",
    };
  }

  // 2) Monta um corpus enxuto pra IA extrair preço/área de cada URL real
  const corpus = searchResults.slice(0, 10).map((r, idx) => {
    const md = (r.markdown || "").slice(0, 1200); // limita pra não estourar contexto
    return `[${idx + 1}] URL: ${r.url}\nTITULO: ${r.title || ""}\nDESC: ${r.description || ""}\nCONTEUDO:\n${md}`;
  }).join("\n\n---\n\n");

  const prompt = `Você é um analista imobiliário. A partir dos anúncios REAIS abaixo (extraídos da web por scraping), extraia os dados estruturados de cada um.

ANÚNCIOS:
${corpus}

REGRAS:
1. Use APENAS os anúncios listados acima. Nunca invente URL ou preço.
2. Para cada anúncio, retorne: titulo, bairro, area (m², número), quartos (número), preco (R$ número sem pontuação), fonte (OLX/Zap/VivaReal/etc), url (URL exata da lista).
3. Se algum dado faltar no anúncio, omita aquele anúncio.
4. Descarte anúncios sem preço claro ou com preço absurdo.
5. Filtre apenas ${finalidade === "aluguel" ? "ALUGUEL" : "VENDA"}.
6. Retorne JSON puro:
{"comparaveis":[{"titulo":"","bairro":"","area":0,"quartos":0,"preco":0,"fonte":"","url":""}],"resumo":"breve descrição do mercado encontrado"}`;

  let parsed: any = null;
  try {
    const ctrl = new AbortController();
    const timeoutId = setTimeout(() => ctrl.abort(), 25000);
    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      signal: ctrl.signal,
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "user", content: prompt }],
      }),
    });
    clearTimeout(timeoutId);
    if (!resp.ok) {
      console.error("[external] extraction error", resp.status);
      return null;
    }
    const data = await resp.json();
    let content: string = data.choices?.[0]?.message?.content ?? "";
    content = content.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();
    const i = content.indexOf("{");
    const j = content.lastIndexOf("}");
    if (i < 0 || j < 0) return null;
    parsed = JSON.parse(content.slice(i, j + 1));
  } catch (e) {
    console.error("[external] extraction failed", String(e));
    return null;
  }

  const compsRaw: ExternalComp[] = Array.isArray(parsed?.comparaveis) ? parsed.comparaveis : [];
  console.log("[external] extracted from real ads:", compsRaw.length);

  // Validação anti-alucinação: URL precisa estar na lista real do Firecrawl
  const realUrls = new Set(searchResults.map(r => r.url));
  const realOnly = compsRaw.filter(c => c.url && realUrls.has(c.url));
  console.log("[external] após validação de URL real:", realOnly.length);

  // Filtragem anti-outlier
  const [pmin, pmax] = PRECO_M2_RANGE[p.tipo] ?? [100, 50000];
  const refMin = finalidade === "aluguel" ? pmin / 200 : pmin;
  const refMax = finalidade === "aluguel" ? pmax / 50 : pmax;

  const enriched = realOnly
    .map(c => {
      const area = Number(c.area) || 0;
      const preco = Number(c.preco) || 0;
      const ppm2 = area > 0 ? preco / area : 0;
      return { ...c, area, preco, preco_m2: Math.round(ppm2) };
    })
    .filter(c => c.preco > 0 && c.area > 0 && c.preco_m2! >= refMin && c.preco_m2! <= refMax);

  const seen = new Set<string>();
  const unique = enriched.filter(c => {
    const key = c.url || `${c.titulo}|${c.preco}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // ===== Scoring de proximidade: prioriza imóveis mais parecidos com o avaliado =====
  const norm = (s: string) =>
    (s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
  const bairroAlvo = norm(p.bairro);
  const cidadeAlvo = norm(p.cidade);
  const ruaAlvo = norm(p.rua || "");
  const cepAlvo = (p.cep || "").replace(/\D/g, "");
  const cepPrefixo = cepAlvo.slice(0, 5);

  const scored = unique.map(c => {
    const blob = norm(`${c.titulo || ""} ${c.bairro || ""} ${c.url || ""}`);
    let score = 0;
    if (bairroAlvo && blob.includes(bairroAlvo)) score += 40;
    if (cidadeAlvo && blob.includes(cidadeAlvo)) score += 15;
    if (ruaAlvo && ruaAlvo.length > 4 && blob.includes(ruaAlvo)) score += 30;
    if (cepPrefixo && blob.includes(cepPrefixo)) score += 20;
    // Similaridade de área (quanto mais perto da área de referência, mais pontos)
    if (areaRef > 0 && c.area) {
      const diffPct = Math.abs(c.area - areaRef) / areaRef;
      if (diffPct <= 0.10) score += 25;
      else if (diffPct <= 0.25) score += 15;
      else if (diffPct <= 0.50) score += 5;
    }
    // Similaridade de quartos
    if (quartos > 0 && c.quartos === quartos) score += 10;
    return { ...c, _score: score };
  }).sort((a, b) => (b._score || 0) - (a._score || 0));

  const TOP_N = 10;
  const top = scored.slice(0, TOP_N).map(({ _score, ...rest }) => rest);

  // Estatísticas calculadas SOBRE os top-N exibidos, garantindo coerência
  const precos = top.map(c => c.preco!).filter(n => n > 0);
  const ppm2s = top.map(c => c.preco_m2!).filter(n => n > 0);
  const precosClean = removeOutliers(precos);
  const ppm2sClean = removeOutliers(ppm2s);

  const preco_medio = precosClean.length ? Math.round(precosClean.reduce((a, b) => a + b, 0) / precosClean.length) : 0;
  const preco_mediano = Math.round(median(precosClean));
  const preco_m2_medio = ppm2sClean.length ? Math.round(ppm2sClean.reduce((a, b) => a + b, 0) / ppm2sClean.length) : 0;
  const preco_m2_mediano = Math.round(median(ppm2sClean));
  const preco_provavel_fechamento = preco_mediano ? Math.round(preco_mediano * 0.93) : 0;

  const fontes = Array.from(new Set(top.map(c => c.fonte).filter(Boolean))) as string[];

  return {
    total: top.length, // garantir que o número exibido bate com a lista
    comparaveis: top,
    preco_medio,
    preco_mediano,
    preco_m2_medio,
    preco_m2_mediano,
    preco_provavel_fechamento,
    fontes_consultadas: fontes,
    resumo: typeof parsed?.resumo === "string" ? parsed.resumo : `Análise baseada em ${top.length} anúncio(s) real(is) próximos do imóvel avaliado.`,
    aviso: top.length === 0 ? "Anúncios localizados, mas nenhum com dados estruturados completos." : undefined,
  };
}

async function resolvePrecoM2(
  supabase: any, p: Payload, market: MarketContext, external: ExternalMarket | null
): Promise<{ precoM2: number; source: string }> {
  // PRIORIDADE 1: mediana de preço/m² de anúncios externos REAIS (mercado vivo)
  if (external && external.preco_m2_mediano > 0) {
    return { precoM2: external.preco_m2_mediano, source: "mercado_externo" };
  }
  // PRIORIDADE 2: tabela administrativa por bairro/cidade
  const { data, error } = await supabase.rpc("resolve_price_per_sqm", {
    p_estado: p.estado, p_cidade: p.cidade, p_bairro: p.bairro, p_tipo: p.tipo,
  });
  if (!error) {
    const v = Number(data?.[0]?.preco_m2) || 0;
    const src = data?.[0]?.source || "default";
    if (v > 0) return { precoM2: v, source: src };
  }
  // PRIORIDADE 3: comparativo interno validado
  if (market.pricePerM2Market > 0) {
    return { precoM2: Math.round(market.pricePerM2Market), source: "comparativo_regional" };
  }
  // PRIORIDADE 4: média nacional
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
  if (p.proximoTransporte) aplica("Próximo a transporte público", LOC_W.proximoTransporte, "localizacao");
  if (p.proximoParque) aplica("Próximo a praças / parques", LOC_W.proximoParque, "localizacao");
  if (p.proximoBancos) aplica("Próximo a bancos / serviços", LOC_W.proximoBancos, "localizacao");
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
      [p.salaEstar, "sala de estar"], [p.salaJantar, "sala de jantar"], [p.salaTv, "sala de TV"], [p.copa, "copa"],
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

  // ============ APARTAMENTO (regras contextuais) ============
  aplicaRegrasApartamento(p, aplica, valorBase);

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
  let credit: Awaited<ReturnType<typeof consumeAiCredits>> | null = null;

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

    // Mescla checklist "Infraestrutura próxima do imóvel" (sempre disponível) com os
    // campos avançados proximo*. Garante que marcar os checks SEMPRE gere ajuste no laudo,
    // mesmo fora do modo avançado.
    const infra = (data as any).infraestrutura ?? {};
    if (infra.escola) data.proximoEscola = true;
    if (infra.hospital) data.proximoHospital = true;
    if (infra.comercio) data.proximoComercio = true;
    if (infra.transporte) data.proximoTransporte = true;
    if (infra.parque) data.proximoParque = true;
    if (infra.bancos) data.proximoBancos = true;

    credit = await consumeAiCredits(req, "property_valuation", corsHeaders);
    if (!credit.ok) return credit.response;

    const areaRefForMarket =
      (Number(data.areaConstruidaTerreo) || 0) + (Number(data.areaConstruidaSuperior) || 0) ||
      (Number(data.areaConstruida) || 0) || data.areaTotal;
    const finalidade: "venda" | "aluguel" = ((data as any).finalidade === "aluguel") ? "aluguel" : "venda";
    // Busca interna + externa em PARALELO. Externa tem hard timeout para nunca derrubar a função.
    const externalSafe = Promise.race([
      fetchExternalMarket(data, areaRefForMarket, finalidade).catch((e) => {
        console.error("[external] failed, continuing without it", String(e));
        return null;
      }),
      new Promise<null>((resolve) => setTimeout(() => {
        console.warn("[external] hard timeout 50s, continuing without it");
        resolve(null);
      }, 50000)),
    ]);
    const [market, external] = await Promise.all([
      fetchMarketContext(supabase, data.estado, data.cidade, data.bairro, data.tipo, areaRefForMarket, finalidade),
      externalSafe,
    ]);
    const { precoM2, source } = await resolvePrecoM2(supabase, data, market, external);
    const calc = calcular(data, precoM2, market);

    // ============ ANCORAGEM AO MERCADO REAL ============
    // Quando há anúncios externos reais, o valor final NÃO pode divergir mais que ±15%
    // da mediana do mercado para o mesmo tamanho de imóvel.
    if (external && external.preco_m2_mediano > 0 && calc.areaCalc > 0) {
      const valorMercadoMediano = external.preco_m2_mediano * calc.areaCalc;
      const tetoMercado = Math.round((valorMercadoMediano * 1.15) / 1000) * 1000;
      const pisoMercado = Math.round((valorMercadoMediano * 0.85) / 1000) * 1000;
      const ajustado = Math.max(pisoMercado, Math.min(tetoMercado, calc.valorFinal));
      if (ajustado !== calc.valorFinal) {
        calc.valorFinal = ajustado;
        calc.faixa_min = Math.round((ajustado * 0.95) / 1000) * 1000;
        calc.faixa_max = Math.round((ajustado * 1.05) / 1000) * 1000;
        calc.venda_rapida = Math.round((ajustado * 0.92) / 1000) * 1000;
        calc.venda_premium = Math.round((ajustado * 1.10) / 1000) * 1000;
        calc.aluguel_estimado = Math.round((ajustado * (calc.aluguel_estimado / (calc.valorFinal || 1))) / 50) * 50 || calc.aluguel_estimado;
      }
    }

    const ai = await aiEnrich(data, calc, precoM2, source, market) ?? fallbackAnalysis(data, calc, market);

    const comparaveisOut = market.topComparables.map(c => ({
      titulo: c.title ?? "Imóvel similar",
      bairro: c.neighborhood ?? "",
      area: Number(c.built_area || c.area) || 0,
      quartos: Number(c.bedrooms) || null,
      preco: Number(c.price) || 0,
      status: c.listing_status ?? "publicado",
    }));

    const internoLabel = market.comparaveis_origem === "bairro"
      ? "banco interno (mesmo bairro)"
      : market.comparaveis_origem === "cidade"
      ? "banco interno (mesma cidade)"
      : market.comparaveis_origem === "regional_ampliado"
      ? "banco interno (estado)"
      : "tabela regional";
    const externoCount = external?.total ?? 0;
    const origemLabel = externoCount > 0 && market.total > 0
      ? `Análise baseada em ${externoCount} anúncios externos + ${market.total} comparativos do ${internoLabel}`
      : externoCount > 0
      ? `Análise baseada em ${externoCount} anúncios externos ativos da região`
      : market.total > 0
      ? `Análise baseada em ${market.total} comparativos do ${internoLabel}`
      : "Tabela regional de preços";

    const { data: insertedValuation } = await supabase.from("property_valuations").insert({
      user_id: credit.userId,
      measured_property_id: data.measuredPropertyId ?? null,
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
    }).select("id").single();

    return new Response(JSON.stringify({
      id: insertedValuation?.id ?? null,
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
      comparaveis_origem: origemLabel,
      comparaveis_aviso: market.comparaveis_aviso ?? external?.aviso ?? null,
      comparaveis_externos: external?.comparaveis ?? [],
      mercado_externo: external ? {
        total: external.total,
        preco_medio: external.preco_medio,
        preco_mediano: external.preco_mediano,
        preco_m2_medio: external.preco_m2_medio,
        preco_m2_mediano: external.preco_m2_mediano,
        preco_provavel_fechamento: external.preco_provavel_fechamento,
        fontes_consultadas: external.fontes_consultadas,
        resumo: external.resumo,
      } : null,
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
        externo: external ? {
          total: external.total,
          fontes: external.fontes_consultadas,
          preco_m2_mediano: external.preco_m2_mediano,
        } : null,
      },
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("valuation error:", e);
    if (credit?.ok) await refundAiCredits(credit.admin, credit.userId, credit.sellerId, credit.cost, "property_valuation");
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
