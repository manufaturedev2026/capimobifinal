// Gerador de Laudo de Avaliação Imobiliária PDF — versão profissional v2
import jsPDF from "jspdf";

export type ValuationReportData = {
  // Localização
  estado: string;
  cidade: string;
  bairro: string;
  rua?: string;
  cep?: string;
  // Imóvel
  tipo: string;
  tipoEstrutura?: string;
  // Áreas (todas como string p/ vir do form)
  areaTerreno?: string | number;
  areaTerreo?: string | number;
  areaSuperior?: string | number;
  areaConstruidaTotal?: number;
  // Internos
  quartos?: string | number;
  banheiros?: string | number;
  suites?: string | number;
  garagem?: string | number;
  salas?: string | number;
  cozinhas?: string | number;
  escritorios?: string | number;
  extras: string[];
  acabamento: string;
  conservacao: string;
  documentacao: string[];
  // Resultado
  result: {
    valor_estimado: number;
    faixa_min: number;
    faixa_max: number;
    venda_rapida: number;
    venda_premium: number;
    aluguel_estimado?: number;
    potencial_valorizacao_pct: number;
    tempo_medio_venda_dias: number;
    justificativa: string;
    pontos_fortes: string[];
    pontos_atencao: string[];
    sugestoes_valorizacao?: string[];
    score_geral?: number;
    scores?: { localizacao: number; estrutura: number; acabamento: number; liquidez: number; documentacao: number };
    comparaveis?: Array<{ titulo: string; bairro: string; area: number; quartos: number | null; preco: number }>;
    comparaveis_externos?: Array<{ titulo: string; bairro?: string; area?: number; quartos?: number; preco?: number; preco_m2?: number; fonte?: string; url?: string }>;
    mercado_externo?: {
      total: number;
      preco_medio: number;
      preco_mediano: number;
      preco_m2_medio: number;
      preco_m2_mediano: number;
      preco_provavel_fechamento: number;
      fontes_consultadas: string[];
      resumo: string;
      aviso?: string;
    } | null;
    meta?: {
      preco_m2: number;
      ajuste_total_pct: number;
      breakdown: Array<{ label: string; pct: number }>;
      market?: {
        comparaveis: number;
        media_dormitorios: number;
        media_banheiros: number;
        media_area_m2: number;
        media_preco: number;
      };
    };
  };
  avaliadorNome?: string;
  avaliadorCreci?: string;
  avaliadorEmail?: string;
  empresaNome?: string;
  /** Optional valuation row id used to derive a stable laudo code */
  valuationId?: string;
  analiseVisual?: {
    scores: {
      visual_externo: number;
      interior: number;
      acabamento_visual: number;
      conservacao_aparente: number;
      liquidez_visual: number;
    };
    score_visual_geral: number;
    ajuste_total_pct: number;
    resumo_externo: string;
    resumo_interno: string;
    resumo_conservacao: string;
    resumo_geral: string;
    sugestoes_melhorias: string[];
    total_fotos_analisadas: number;
    ambientes_identificados?: Array<{ foto_index: number; ambiente_detectado: string; observacao: string }>;
  };
  /** Fotos enviadas pelo usuário (para incluir galeria no PDF) */
  fotos?: Array<{ dataUrl: string; categoria: string }>;
};

/** Classificação de padrão construtivo (Baixo/Médio/Alto) */
function classificarPadrao(d: ValuationReportData): { label: string; cor: [number, number, number]; descricao: string } {
  const acabPct: Record<string, number> = { "Simples": 1, "Médio": 2, "Bom": 3, "Alto padrão": 4, "Luxo": 5 };
  const baseAcab = acabPct[d.acabamento] ?? 2;
  const visual = d.analiseVisual?.scores.acabamento_visual ?? d.analiseVisual?.score_visual_geral ?? 0;
  // Combina declarado + visual (se houver) — escala 0-10
  const visualNorm = visual > 0 ? visual : baseAcab * 2;
  const score = (baseAcab * 2 + visualNorm) / 2;
  if (score >= 8) return { label: "ALTO PADRÃO", cor: [110, 60, 160], descricao: "Imóvel com materiais nobres, acabamento refinado e atributos diferenciados." };
  if (score >= 5.5) return { label: "MÉDIO PADRÃO", cor: [20, 30, 70], descricao: "Imóvel dentro da média comercial regional, com acabamentos funcionais e bom estado." };
  return { label: "BAIXO PADRÃO", cor: [200, 130, 20], descricao: "Imóvel com acabamentos simples e econômicos, voltado a perfil popular." };
}

const fmtBRL = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

const NAVY: [number, number, number] = [20, 30, 70];
const GOLD: [number, number, number] = [180, 145, 60];
const GRAY: [number, number, number] = [110, 110, 120];
const LIGHT: [number, number, number] = [245, 247, 252];
const GREEN: [number, number, number] = [34, 130, 80];
const AMBER: [number, number, number] = [200, 130, 20];
const VIOLET: [number, number, number] = [110, 60, 160];

function shortCode(seed?: string): string {
  if (seed) {
    // Derived deterministic code from id (UUID): take first 8 hex chars of hash
    const hex = seed.replace(/[^a-z0-9]/gi, "").slice(0, 12).toUpperCase();
    return `LAU-${hex.slice(0, 8)}-${hex.slice(8, 12) || "0000"}`;
  }
  const ts = Date.now().toString(36).toUpperCase();
  const r = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `LAU-${ts}-${r}`;
}

/** Deterministic laudo code derived from a valuation row id */
export function getLaudoCode(id: string): string {
  return shortCode(id);
}

function liquidezLabel(dias: number): string {
  if (dias <= 60) return "Alta — venda rápida esperada (30-60 dias)";
  if (dias <= 120) return "Média — alinhada à média de mercado (60-120 dias)";
  if (dias <= 180) return "Moderada — perfil paciente (120-180 dias)";
  return "Baixa — exige estratégia de marketing (180+ dias)";
}

function localizacaoTexto(d: ValuationReportData): string {
  const parts = [`Imóvel localizado em ${d.bairro}, ${d.cidade}/${d.estado}`];
  if (d.rua) parts.push(`com endereço na ${d.rua}`);
  const precoM2 = Number(d.result.meta?.preco_m2) || 0;
  if (precoM2 > 0) {
    parts.push(`região com preço médio de ${fmtBRL(precoM2)} por m² aplicado como base de cálculo`);
  } else {
    parts.push("valor calculado por base comparativa regional");
  }
  return parts.join(", ") + ".";
}

function conservacaoTexto(c: string): string {
  const map: Record<string, string> = {
    "Novo": "Imóvel em estado novo, sem necessidade de intervenções estruturais ou estéticas.",
    "Reformado": "Imóvel reformado recentemente, com elementos atualizados e em pleno funcionamento.",
    "Bom": "Imóvel em bom estado geral de conservação, manutenção em dia.",
    "Bom estado": "Imóvel em bom estado geral de conservação, manutenção em dia.",
    "Antigo": "Imóvel com sinais de envelhecimento natural, podendo demandar atualizações pontuais.",
    "Precisa reforma": "Imóvel necessita de reforma para alcançar pleno valor de mercado.",
  };
  return map[c] ?? "Estado de conservação compatível com a média da região.";
}

function acabamentoTexto(a: string): string {
  const map: Record<string, string> = {
    "Simples": "Padrão construtivo simples, com materiais funcionais e econômicos.",
    "Médio": "Padrão construtivo dentro da média regional, com materiais comerciais de boa procedência.",
    "Bom": "Padrão acima da média regional, com materiais selecionados e bom acabamento.",
    "Alto padrão": "Acabamentos superiores à média, com materiais nobres e detalhes diferenciados.",
    "Luxo": "Padrão luxo, com materiais premium, projeto refinado e atributos exclusivos.",
  };
  return map[a] ?? "Padrão construtivo compatível com a média regional.";
}

function estruturaTexto(d: ValuationReportData): string {
  if (!d.tipoEstrutura) return "";
  const t = Number(d.areaTerreo) || 0;
  const s = Number(d.areaSuperior) || 0;
  const map: Record<string, string> = {
    "Casa térrea": `Estrutura em pavimento único${t > 0 ? ` com ${t}m² de área construída` : ""}, distribuição horizontal funcional.`,
    "Sobrado integrado": `Sobrado com dois pavimentos integrados${t > 0 && s > 0 ? ` (térreo ${t}m² + superior ${s}m²)` : ""}, otimizando o aproveitamento do lote.`,
    "Casa com pavimento superior": `Casa com pavimento superior${t > 0 && s > 0 ? ` (térreo ${t}m² + superior ${s}m²)` : ""}, ampliando a metragem útil.`,
    "Duas moradias no lote": "Lote com duas moradias independentes, configurando potencial de renda dupla ou uso multifamiliar.",
    "Uso misto residencial/comercial": "Estrutura com uso misto, combinando função residencial e comercial — versatilidade de ocupação.",
  };
  return map[d.tipoEstrutura] ?? "";
}

function documentacaoTexto(docs: string[]): string {
  if (!docs.length) return "Documentação não informada — recomenda-se análise pelo cartório competente.";
  if (docs.includes("Pendências") || docs.includes("Pendente")) {
    return "Há pendências documentais relevantes — orienta-se regularização antes da comercialização.";
  }
  const ok = docs.filter((d) => /OK|ok|Financiável/i.test(d));
  if (ok.length) return `Documentação favorável: ${ok.join(", ")}. Imóvel apto à comercialização.`;
  return `Situação documental informada: ${docs.join(", ")}.`;
}

function analiseTecnicaParagrafo(d: ValuationReportData): string {
  const r = d.result;
  const ajuste = r.meta?.ajuste_total_pct ?? 0;
  const tendencia = ajuste > 5
    ? "valorização acima da média comparável da região"
    : ajuste < -5
      ? "ajuste para baixo justificado por características específicas do imóvel"
      : "alinhamento técnico com a média comparável da região";

  const fatoresAnalisados: string[] = [];
  if (d.areaTerreno || d.areaConstruidaTotal) fatoresAnalisados.push("metragem");
  if (d.tipoEstrutura) fatoresAnalisados.push("tipo de estrutura");
  if (d.acabamento) fatoresAnalisados.push("padrão de acabamento");
  if (d.conservacao) fatoresAnalisados.push("estado de conservação");
  if (d.extras?.length) fatoresAnalisados.push(`${d.extras.length} diferencial(is)`);
  if (d.documentacao?.length) fatoresAnalisados.push("situação documental");
  fatoresAnalisados.push("estrutura interna");

  return [
    `O imóvel apresenta ${tendencia}, considerando metragem útil, padrão construtivo e atributos diferenciais.`,
    `A análise considerou ${fatoresAnalisados.length} fatores objetivos (${fatoresAnalisados.join(", ")}).`,
    `O resultado de ${fmtBRL(r.valor_estimado)} reflete o equilíbrio entre o preço base regional e os atributos específicos da propriedade.`,
  ].join(" ");
}

// =========================================
//                  RENDER
// =========================================
export function generateValuationReport(d: ValuationReportData): jsPDF {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const codigo = shortCode(d.valuationId);
  const dataEmissao = new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });

  const setColor = (c: [number, number, number]) => doc.setTextColor(c[0], c[1], c[2]);
  const setFill = (c: [number, number, number]) => doc.setFillColor(c[0], c[1], c[2]);

  const footer = (pageLabel: string) => {
    setFill(LIGHT);
    doc.rect(0, H - 18, W, 18, "F");
    setColor(GRAY);
    doc.setFont("helvetica", "italic");
    doc.setFontSize(7.5);
    const txt = "Este laudo possui caráter estimativo, baseado em dados fornecidos e critérios comparativos de mercado.";
    doc.text(txt, W / 2, H - 11, { align: "center" });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.text(`Código ${codigo}`, 14, H - 5);
    doc.text(pageLabel, W - 14, H - 5, { align: "right" });
    if (d.empresaNome) doc.text(d.empresaNome, W / 2, H - 5, { align: "center" });
  };

  const headerStrip = (title: string) => {
    setFill(NAVY);
    doc.rect(0, 0, W, 22, "F");
    setColor([255, 255, 255]);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("LAUDO DE AVALIAÇÃO IMOBILIÁRIA", 14, 9);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text(title, 14, 16);
    doc.text(`Cód. ${codigo}`, W - 14, 16, { align: "right" });
    setFill(GOLD);
    doc.rect(0, 22, W, 0.8, "F");
  };

  const sectionTitle = (text: string, y: number): number => {
    setColor(NAVY);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text(text, 14, y);
    setFill(GOLD);
    doc.rect(14, y + 2, 22, 0.6, "F");
    return y + 10;
  };

  const para = (text: string, y: number, opts: { size?: number; color?: [number, number, number]; bold?: boolean } = {}): number => {
    setColor(opts.color ?? [40, 40, 50]);
    doc.setFont("helvetica", opts.bold ? "bold" : "normal");
    doc.setFontSize(opts.size ?? 10);
    const lines = doc.splitTextToSize(text, W - 28);
    lines.forEach((l: string) => {
      doc.text(l, 14, y);
      y += (opts.size ?? 10) * 0.42 + 1.2;
    });
    return y + 2;
  };

  // =========================================
  // PÁGINA 1 — CAPA
  // =========================================
  setFill(NAVY);
  doc.rect(0, 0, W, H, "F");
  setFill(GOLD);
  doc.rect(0, 0, W, 4, "F");
  doc.rect(0, H - 4, W, 4, "F");

  setColor([255, 255, 255]);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text((d.empresaNome ?? "AVALIAÇÃO IMOBILIÁRIA").toUpperCase(), W / 2, 30, { align: "center" });

  doc.setFontSize(28);
  doc.text("Laudo de Avaliação", W / 2, H / 2 - 25, { align: "center" });
  doc.text("Imobiliária", W / 2, H / 2 - 12, { align: "center" });

  setFill(GOLD);
  doc.rect(W / 2 - 25, H / 2 - 4, 50, 0.8, "F");

  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  setColor([220, 220, 230]);
  doc.text(`${d.tipo} • ${d.bairro}`, W / 2, H / 2 + 8, { align: "center" });
  doc.text(`${d.cidade} / ${d.estado}`, W / 2, H / 2 + 16, { align: "center" });

  // Score destaque na capa
  if (d.result.score_geral !== undefined) {
    setFill(GOLD);
    doc.circle(W / 2, H / 2 + 40, 14, "F");
    setColor(NAVY);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text(String(d.result.score_geral), W / 2, H / 2 + 43, { align: "center" });
    setColor([220, 220, 230]);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text("SCORE PROFISSIONAL /10", W / 2, H / 2 + 60, { align: "center" });
  }

  const blockY = H - 75;
  doc.setDrawColor(GOLD[0], GOLD[1], GOLD[2]);
  doc.setLineWidth(0.4);
  doc.roundedRect(20, blockY, W - 40, 55, 3, 3, "S");

  setColor([255, 255, 255]);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text("CÓDIGO DA AVALIAÇÃO", 26, blockY + 8);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text(codigo, 26, blockY + 14);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text("EMITIDO EM", 26, blockY + 24);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text(dataEmissao, 26, blockY + 30);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text("AVALIADOR RESPONSÁVEL", W - 26, blockY + 8, { align: "right" });
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text(d.avaliadorNome ?? "Sistema IA Capimobi", W - 26, blockY + 14, { align: "right" });
  let avalLineY = blockY + 22;
  if (d.avaliadorCreci && d.avaliadorCreci.trim().length > 0) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    setColor([220, 220, 230]);
    doc.text("CRECI", W - 26, avalLineY, { align: "right" });
    avalLineY += 5;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    setColor(GOLD);
    doc.text(d.avaliadorCreci.trim(), W - 26, avalLineY, { align: "right" });
    setColor([255, 255, 255]);
    avalLineY += 6;
  }
  if (d.avaliadorEmail) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text(d.avaliadorEmail, W - 26, avalLineY, { align: "right" });
  }

  // =========================================
  // PÁGINA 2 — DADOS DO IMÓVEL
  // =========================================
  doc.addPage();
  headerStrip("Página 2 — Identificação do Imóvel");
  let y = sectionTitle("Dados do Imóvel", 38);

  setFill(LIGHT);
  doc.roundedRect(14, y - 2, W - 28, 22, 2, 2, "F");
  setColor(NAVY);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("ENDEREÇO COMPLETO", 18, y + 4);
  setColor([20, 20, 30]);
  doc.setFontSize(11);
  const enderecoLinha = [d.rua, d.bairro, `${d.cidade}/${d.estado}`, d.cep].filter(Boolean).join(" • ");
  doc.text(doc.splitTextToSize(enderecoLinha, W - 36), 18, y + 11);
  y += 28;

  const colW = (W - 36) / 2;
  const col2X = 14 + colW + 8;
  let yL = y, yR = y;

  const rowL = (label: string, val: string) => {
    setColor(GRAY); doc.setFont("helvetica", "normal"); doc.setFontSize(8);
    doc.text(label.toUpperCase(), 14, yL);
    setColor([20, 20, 30]); doc.setFont("helvetica", "bold"); doc.setFontSize(10.5);
    doc.text(val || "—", 14, yL + 5);
    doc.setDrawColor(225, 225, 235); doc.line(14, yL + 8, 14 + colW, yL + 8);
    yL += 13;
  };
  const rowR = (label: string, val: string) => {
    setColor(GRAY); doc.setFont("helvetica", "normal"); doc.setFontSize(8);
    doc.text(label.toUpperCase(), col2X, yR);
    setColor([20, 20, 30]); doc.setFont("helvetica", "bold"); doc.setFontSize(10.5);
    doc.text(val || "—", col2X, yR + 5);
    doc.setDrawColor(225, 225, 235); doc.line(col2X, yR + 8, col2X + colW, yR + 8);
    yR += 13;
  };

  rowL("Tipo do imóvel", d.tipo);
  rowR("Estrutura", d.tipoEstrutura ?? "—");
  rowL("Área terreno", d.areaTerreno ? `${d.areaTerreno} m²` : "—");
  rowR("Construída total", d.areaConstruidaTotal ? `${d.areaConstruidaTotal} m²` : "—");
  rowL("Térreo", d.areaTerreo ? `${d.areaTerreo} m²` : "—");
  rowR("Pavimento superior", d.areaSuperior ? `${d.areaSuperior} m²` : "—");
  rowL("Dormitórios", String(d.quartos ?? "—"));
  rowR("Suítes", String(d.suites ?? "—"));
  rowL("Banheiros", String(d.banheiros ?? "—"));
  rowR("Vagas garagem", String(d.garagem ?? "—"));
  rowL("Salas", String(d.salas ?? "—"));
  rowR("Cozinhas", String(d.cozinhas ?? "—"));
  rowL("Escritórios", String(d.escritorios ?? "—"));
  rowR("Padrão de acabamento", d.acabamento);
  rowL("Conservação", d.conservacao);
  rowR("CEP", d.cep || "—");

  y = Math.max(yL, yR) + 4;

  y = sectionTitle("Diferenciais", y);
  if (d.extras.length === 0) {
    y = para("Nenhum diferencial declarado.", y, { color: GRAY });
  } else {
    let cx = 14, cy = y;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    d.extras.forEach((ex) => {
      const w = doc.getTextWidth(ex) + 8;
      if (cx + w > W - 14) { cx = 14; cy += 9; }
      setFill([235, 240, 252]);
      doc.roundedRect(cx, cy - 5, w, 7, 2, 2, "F");
      setColor(NAVY);
      doc.text(ex, cx + 4, cy);
      cx += w + 4;
    });
    y = cy + 8;
  }

  y = sectionTitle("Documentação", y);
  y = para(documentacaoTexto(d.documentacao), y);

  footer("Página 2 de 6");

  // =========================================
  // PÁGINA 3 — ANÁLISE TÉCNICA
  // =========================================
  doc.addPage();
  headerStrip("Página 3 — Análise Técnica");
  y = sectionTitle("Análise Técnica", 38);

  const blocks: Array<{ titulo: string; texto: string }> = [
    { titulo: "Localização", texto: localizacaoTexto(d) },
  ];
  const ed = estruturaTexto(d);
  if (ed) blocks.push({ titulo: "Estrutura", texto: ed });
  blocks.push(
    { titulo: "Conservação", texto: conservacaoTexto(d.conservacao) },
    { titulo: "Acabamento", texto: acabamentoTexto(d.acabamento) },
    {
      titulo: "Diferenciais",
      texto: d.extras.length
        ? `O imóvel possui ${d.extras.length} diferencial(is) que agregam valor: ${d.extras.join(", ")}.`
        : "Não foram declarados diferenciais relevantes além da estrutura padrão.",
    },
    { titulo: "Situação documental", texto: documentacaoTexto(d.documentacao) },
    {
      titulo: "Liquidez estimada",
      texto: `${liquidezLabel(d.result.tempo_medio_venda_dias)}. Tempo médio estimado para conclusão da venda: ${d.result.tempo_medio_venda_dias} dias.`,
    },
  );

  blocks.forEach((b) => {
    if (y > H - 40) { footer("Página 3 de 6"); doc.addPage(); headerStrip("Página 3 — Análise Técnica (cont.)"); y = 38; }
    setColor(NAVY);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10.5);
    doc.text(b.titulo.toUpperCase(), 14, y);
    setFill(GOLD);
    doc.rect(14, y + 1.5, 8, 0.5, "F");
    y += 7;
    y = para(b.texto, y);
    y += 2;
  });

  footer("Página 3 de 6");

  // =========================================
  // PÁGINA 4 — RESULTADO FINANCEIRO + COMPARÁVEIS
  // =========================================
  doc.addPage();
  headerStrip("Página 4 — Resultado Financeiro");
  y = sectionTitle("Resultado da Avaliação", 38);

  setFill(NAVY);
  doc.roundedRect(14, y, W - 28, 38, 3, 3, "F");
  setColor([255, 255, 255]);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text("VALOR JUSTO DE MERCADO", W / 2, y + 9, { align: "center" });
  doc.setFont("helvetica", "bold");
  doc.setFontSize(28);
  doc.text(fmtBRL(d.result.valor_estimado), W / 2, y + 24, { align: "center" });
  setColor(GOLD);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(`Faixa ideal: ${fmtBRL(d.result.faixa_min)} — ${fmtBRL(d.result.faixa_max)}`, W / 2, y + 33, { align: "center" });
  y += 46;

  // 4 cards estratégias
  const cardW = (W - 28 - 18) / 4;
  const cards: Array<{ label: string; value: string; sub: string; color: [number, number, number] }> = [
    { label: "Venda Rápida", value: fmtBRL(d.result.venda_rapida), sub: "30-60 dias", color: AMBER },
    { label: "Venda Premium", value: fmtBRL(d.result.venda_premium), sub: "vendedor paciente", color: VIOLET },
    { label: "Aluguel/mês", value: fmtBRL(d.result.aluguel_estimado ?? Math.round(d.result.valor_estimado * 0.005)), sub: "renda potencial", color: GREEN },
    { label: "Tempo Médio", value: `${d.result.tempo_medio_venda_dias} dias`, sub: "no preço justo", color: NAVY },
  ];
  cards.forEach((c, i) => {
    const x = 14 + i * (cardW + 6);
    setFill(LIGHT);
    doc.roundedRect(x, y, cardW, 30, 2, 2, "F");
    setFill(c.color);
    doc.rect(x, y, 2, 30, "F");
    setColor(GRAY);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.text(c.label.toUpperCase(), x + 5, y + 7);
    setColor(NAVY);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text(c.value, x + 5, y + 17);
    setColor(GRAY);
    doc.setFont("helvetica", "italic");
    doc.setFontSize(7.5);
    doc.text(c.sub, x + 5, y + 25);
  });
  y += 38;

  // ===== Classificação de padrão (Baixo / Médio / Alto) =====
  {
    const cls = classificarPadrao(d);
    if (y > H - 30) { footer("Página 4 de 6"); doc.addPage(); headerStrip("Página 4 — Resultado (cont.)"); y = 38; }
    setFill(cls.cor);
    doc.roundedRect(14, y, W - 28, 22, 3, 3, "F");
    setColor([255, 255, 255]);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text("CLASSIFICAÇÃO DE PADRÃO CONSTRUTIVO", 20, y + 7);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(15);
    doc.text(cls.label, 20, y + 15);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    const desc = doc.splitTextToSize(cls.descricao, W - 50);
    doc.text(desc[0] || "", W - 20, y + 13, { align: "right" });
    y += 28;
  }

  // Score profissional
  if (d.result.scores) {
    if (y > H - 70) { footer("Página 4 de 6"); doc.addPage(); headerStrip("Página 4 — Resultado (cont.)"); y = 38; }
    setColor(NAVY);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10.5);
    doc.text("SCORE PROFISSIONAL", 14, y);
    setColor(GOLD);
    doc.setFontSize(10);
    doc.text(`${d.result.score_geral}/10`, W - 14, y, { align: "right" });
    setFill(GOLD);
    doc.rect(14, y + 1.5, 8, 0.5, "F");
    y += 8;

    const scoreItems: Array<[string, number]> = [
      ["Localização", d.result.scores.localizacao],
      ["Estrutura", d.result.scores.estrutura],
      ["Acabamento", d.result.scores.acabamento],
      ["Liquidez", d.result.scores.liquidez],
      ["Documentação", d.result.scores.documentacao],
    ];
    scoreItems.forEach(([label, val]) => {
      setColor([60, 60, 70]);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.text(label, 14, y);
      doc.text(`${val}/10`, 60, y);
      // barra
      setFill([225, 225, 235]);
      doc.rect(75, y - 3, W - 89, 3.5, "F");
      const cor: [number, number, number] = val >= 8 ? GREEN : val >= 6 ? NAVY : val >= 4 ? AMBER : [200, 60, 60];
      setFill(cor);
      doc.rect(75, y - 3, ((W - 89) * val) / 10, 3.5, "F");
      y += 6;
    });
    y += 4;
  }

  // Comparáveis internos
  if (d.result.comparaveis && d.result.comparaveis.length > 0) {
    if (y > H - 50) { footer("Página 4 de 6"); doc.addPage(); headerStrip("Página 4 — Resultado (cont.)"); y = 38; }
    setColor(NAVY);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10.5);
    doc.text("IMÓVEIS COMPARÁVEIS NA REGIÃO", 14, y);
    setFill(GOLD);
    doc.rect(14, y + 1.5, 8, 0.5, "F");
    y += 7;

    d.result.comparaveis.forEach((c) => {
      if (y > H - 24) { footer("Página 4 de 6"); doc.addPage(); headerStrip("Página 4 — Resultado (cont.)"); y = 38; }
      setFill(LIGHT);
      doc.roundedRect(14, y - 4, W - 28, 11, 1.5, 1.5, "F");
      setColor([20, 20, 30]);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      const titulo = doc.splitTextToSize(c.titulo, W - 75)[0];
      doc.text(titulo, 18, y);
      setColor(GRAY);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      const meta = `${c.area}m²${c.quartos ? ` · ${c.quartos} dorm.` : ""}${c.bairro ? ` · ${c.bairro}` : ""}`;
      doc.text(meta, 18, y + 4);
      setColor(NAVY);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text(fmtBRL(c.preco), W - 18, y + 1, { align: "right" });
      y += 13;
    });
  }

  // Anúncios reais da internet
  if (d.result.mercado_externo) {
    if (y > H - 75) { footer("Página 4 de 6"); doc.addPage(); headerStrip("Página 4 — Resultado (cont.)"); y = 38; }
    setColor(GREEN);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10.5);
    doc.text("ANÚNCIOS REAIS DA INTERNET", 14, y);
    setFill(GREEN);
    doc.rect(14, y + 1.5, 8, 0.5, "F");
    y += 7;

    if (d.result.mercado_externo.fontes_consultadas?.length) {
      y = para(`Fontes consultadas: ${d.result.mercado_externo.fontes_consultadas.join(" · ")}.`, y, { size: 8.5, color: GRAY });
    }
    if (d.result.mercado_externo.resumo) {
      y = para(`Resumo: ${d.result.mercado_externo.resumo}`, y, { size: 8.8 });
    }

    if (d.result.mercado_externo.total > 0) {
      const stats = [
        `Preço médio: ${fmtBRL(d.result.mercado_externo.preco_medio)}`,
        `Preço mediano: ${fmtBRL(d.result.mercado_externo.preco_mediano)}`,
        `R$/m² mediano: ${fmtBRL(d.result.mercado_externo.preco_m2_mediano)}`,
        `Provável fechamento: ${fmtBRL(d.result.mercado_externo.preco_provavel_fechamento)}`,
      ];
      stats.forEach((line) => {
        if (y > H - 24) { footer("Página 4 de 6"); doc.addPage(); headerStrip("Página 4 — Resultado (cont.)"); y = 38; }
        setColor([40, 40, 50]);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.text(`• ${line}`, 18, y);
        y += 5.2;
      });

      if (d.result.comparaveis_externos?.length) {
        y += 2;
        d.result.comparaveis_externos.slice(0, 6).forEach((c) => {
          if (y > H - 24) { footer("Página 4 de 6"); doc.addPage(); headerStrip("Página 4 — Resultado (cont.)"); y = 38; }
          setFill([240, 248, 242]);
          doc.roundedRect(14, y - 4, W - 28, 12, 1.5, 1.5, "F");
          setColor([20, 20, 30]);
          doc.setFont("helvetica", "bold");
          doc.setFontSize(8.8);
          const titulo = doc.splitTextToSize(`${c.fonte ? `[${c.fonte}] ` : ""}${c.titulo}`, W - 82)[0];
          doc.text(titulo, 18, y);
          setColor(GRAY);
          doc.setFont("helvetica", "normal");
          doc.setFontSize(7.8);
          const meta = `${c.area ? `${c.area}m²` : ""}${c.quartos ? ` · ${c.quartos} dorm.` : ""}${c.bairro ? ` · ${c.bairro}` : ""}${c.preco_m2 ? ` · ${fmtBRL(c.preco_m2)}/m²` : ""}`;
          doc.text(doc.splitTextToSize(meta, W - 82), 18, y + 4);
          setColor(GREEN);
          doc.setFont("helvetica", "bold");
          doc.setFontSize(9.5);
          if (c.preco) doc.text(fmtBRL(c.preco), W - 18, y + 1, { align: "right" });
          y += 14;
        });
      }
    } else {
      y = para(d.result.mercado_externo.aviso || "Não foram encontrados anúncios externos confiáveis para este subtipo com os filtros atuais.", y, { size: 9, color: AMBER, bold: true });
    }
  }

  footer("Página 4 de 6");

  // =========================================
  // PÁGINA 5 — PARECER TÉCNICO
  // =========================================
  doc.addPage();
  headerStrip("Página 5 — Parecer Técnico");
  y = sectionTitle("Parecer Técnico do Avaliador", 38);

  y = para(analiseTecnicaParagrafo(d), y);
  y += 2;

  setColor(NAVY);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.5);
  doc.text("FUNDAMENTAÇÃO COMPARATIVA", 14, y);
  setFill(GOLD);
  doc.rect(14, y + 1.5, 8, 0.5, "F");
  y += 7;
  y = para(d.result.justificativa, y);
  y += 2;

  // ========== METODOLOGIA DE CÁLCULO ==========
  if (y > H - 90) { footer("Página 5 de 6"); doc.addPage(); headerStrip("Página 5 — Parecer (cont.)"); y = 38; }
  setColor(NAVY);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.5);
  doc.text("METODOLOGIA DE CÁLCULO", 14, y);
  setFill(GOLD);
  doc.rect(14, y + 1.5, 8, 0.5, "F");
  y += 7;

  const precoM2Base = Number(d.result.meta?.preco_m2) || 0;
  const areaUsada = Number(d.areaConstruidaTotal) || Number(d.areaTerreno) || 0;
  const ajustePct = Number(d.result.meta?.ajuste_total_pct) || 0;
  const valorBase = precoM2Base && areaUsada ? precoM2Base * areaUsada : 0;

  let fontePrecoM2 = "Base comparativa regional";
  let fonteDetalhe = "";
  if (d.result.mercado_externo && d.result.mercado_externo.total > 0 && d.result.mercado_externo.preco_m2_mediano > 0) {
    fontePrecoM2 = "Mediana de anúncios reais da internet";
    fonteDetalhe = `${d.result.mercado_externo.total} anúncios analisados em ${(d.result.mercado_externo.fontes_consultadas || []).join(", ")}`;
  } else if (d.result.comparaveis && d.result.comparaveis.length > 0) {
    fontePrecoM2 = "Mediana do banco de dados validado";
    fonteDetalhe = `${d.result.comparaveis.length} imóveis comparáveis na região`;
  } else {
    fontePrecoM2 = "Tabela administrativa por bairro/cidade";
    fonteDetalhe = "Preço de referência regional cadastrado pela curadoria";
  }

  y = para(
    `A avaliação utiliza o Método Comparativo Direto de Dados de Mercado (NBR 14653-2), partindo de um R$/m² de referência e aplicando ajustes percentuais ponderados conforme as características objetivas do imóvel.`,
    y, { size: 9.5 }
  );

  setFill(LIGHT);
  doc.roundedRect(14, y, W - 28, 26, 2, 2, "F");
  setFill(GOLD);
  doc.rect(14, y, 2, 26, "F");
  setColor(GRAY);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.text("FONTE DO R$/M² BASE", 19, y + 6);
  setColor(NAVY);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text(fontePrecoM2, 19, y + 12);
  setColor([60, 60, 70]);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.text(doc.splitTextToSize(fonteDetalhe, W - 70), 19, y + 18);
  setColor(NAVY);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text(precoM2Base > 0 ? `${fmtBRL(precoM2Base)}/m²` : "—", W - 18, y + 14, { align: "right" });
  y += 30;

  setColor(NAVY);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.text("FÓRMULA APLICADA", 14, y);
  y += 5;
  y = para(
    `Valor Final = (R$/m² base × Área) × (1 + Σ ajustes ponderados)`,
    y, { size: 9.5, bold: true }
  );

  if (precoM2Base > 0 && areaUsada > 0) {
    setFill([245, 247, 252]);
    doc.roundedRect(14, y - 2, W - 28, 16, 2, 2, "F");
    setColor([40, 40, 50]);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(`Valor base: ${fmtBRL(precoM2Base)} × ${areaUsada}m² = ${fmtBRL(valorBase)}`, 18, y + 3);
    doc.text(`Ajuste técnico total: ${ajustePct > 0 ? "+" : ""}${ajustePct.toFixed(1)}%`, 18, y + 9);
    setColor(NAVY);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text(`= ${fmtBRL(d.result.valor_estimado)}`, W - 18, y + 7, { align: "right" });
    y += 20;
  }

  if (y > H - 60) { footer("Página 5 de 6"); doc.addPage(); headerStrip("Página 5 — Parecer (cont.)"); y = 38; }
  setColor(NAVY);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.text("PESOS DOS CRITÉRIOS DE AJUSTE", 14, y);
  y += 5;
  const pesos: Array<[string, string]> = [
    ["Localização (bairro, vias, comércio próximo)", "até ±15%"],
    ["Estrutura e tipo construtivo", "até ±10%"],
    ["Padrão de acabamento", "até ±12%"],
    ["Estado de conservação", "até ±10%"],
    ["Documentação e regularidade", "até ±8%"],
    ["Diferenciais (piscina, garagem extra, vista)", "até ±10%"],
    ["Liquidez de mercado / tempo médio de venda", "até ±5%"],
  ];
  pesos.forEach(([crit, peso]) => {
    if (y > H - 24) { footer("Página 5 de 6"); doc.addPage(); headerStrip("Página 5 — Parecer (cont.)"); y = 38; }
    setColor([60, 60, 70]);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.8);
    doc.text(`• ${crit}`, 18, y);
    setColor(GOLD);
    doc.setFont("helvetica", "bold");
    doc.text(peso, W - 18, y, { align: "right" });
    y += 4.8;
  });
  y += 3;

  if (d.result.meta?.breakdown.length) {
    if (y > H - 60) { footer("Página 5 de 6"); doc.addPage(); headerStrip("Página 5 — Parecer (cont.)"); y = 38; }
    setColor(NAVY);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10.5);
    doc.text("AJUSTES APLICADOS A ESTE IMÓVEL", 14, y);
    setFill(GOLD);
    doc.rect(14, y + 1.5, 8, 0.5, "F");
    y += 7;

    d.result.meta.breakdown.forEach((b) => {
      if (y > H - 24) { footer("Página 5 de 6"); doc.addPage(); headerStrip("Página 5 — Parecer (cont.)"); y = 38; }
      const safeLabel = String(b.label ?? "")
        .replace(/[•●▪◦◆◇▶▷›»]/g, "-")
        .replace(/[^\x20-\xFF]/g, "")
        .trim();
      setColor([40, 40, 50]);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9.5);
      doc.text(`- ${safeLabel}`, 18, y);
      setColor(b.pct > 0 ? GREEN : AMBER);
      doc.setFont("helvetica", "bold");
      doc.text(`${b.pct > 0 ? "+" : ""}${b.pct}%`, W - 18, y, { align: "right" });
      y += 5.5;
    });
    y += 2;

    setFill(LIGHT);
    doc.roundedRect(14, y - 3, W - 28, 9, 1.5, 1.5, "F");
    setColor(NAVY);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("AJUSTE TÉCNICO TOTAL", 18, y + 3);
    setColor(ajustePct >= 0 ? GREEN : AMBER);
    doc.text(`${ajustePct > 0 ? "+" : ""}${ajustePct.toFixed(1)}%`, W - 18, y + 3, { align: "right" });
    y += 12;
  }

  footer("Página 5 de 6");

  // ========== GALERIA DE FOTOS (se houver) ==========
  if (d.fotos && d.fotos.length > 0) {
    doc.addPage();
    headerStrip("Galeria de Fotos Analisadas");
    let yg = sectionTitle("Fotos do Imóvel", 38);

    // Aviso se poucas fotos
    if (d.fotos.length < 3) {
      setFill([255, 245, 225]);
      doc.roundedRect(14, yg, W - 28, 14, 2, 2, "F");
      setFill(AMBER);
      doc.rect(14, yg, 2, 14, "F");
      setColor(AMBER);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.text("LIMITAÇÃO DE ANÁLISE VISUAL", 20, yg + 6);
      setColor([60, 60, 70]);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.text(
        `Apenas ${d.fotos.length} foto(s) enviada(s). Para análise visual mais robusta, recomenda-se ao menos 3 fotos cobrindo fachada, ambientes internos e área externa.`,
        20, yg + 11,
      );
      yg += 20;
    } else {
      yg = para(
        `${d.fotos.length} foto(s) enviada(s) e analisada(s) pela IA. As imagens foram utilizadas como base complementar para classificação visual e ajuste do valor.`,
        yg, { size: 9.5, color: GRAY }
      );
    }

    // Grid 3 colunas, miniatura ~58×58 mm
    const cols = 3;
    const gap = 6;
    const thumbW = (W - 28 - gap * (cols - 1)) / cols;
    const thumbH = thumbW * 0.75; // 4:3
    const labelH = 12;

    d.fotos.forEach((foto, idx) => {
      const col = idx % cols;
      const row = Math.floor(idx / cols);
      const x = 14 + col * (thumbW + gap);
      const yPos = yg + row * (thumbH + labelH + gap);

      // Quebra de página se necessário
      if (yPos + thumbH + labelH > H - 22) {
        footer("Galeria de Fotos");
        doc.addPage();
        headerStrip("Galeria de Fotos (cont.)");
        yg = 38;
        const newRow = 0;
        const newY = yg;
        try {
          doc.addImage(foto.dataUrl, "JPEG", x, newY, thumbW, thumbH, undefined, "FAST");
        } catch {
          setFill(LIGHT);
          doc.rect(x, newY, thumbW, thumbH, "F");
        }
        setColor(GRAY);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(7.5);
        doc.text(`${idx + 1}. ${foto.categoria || "outro"}`, x, newY + thumbH + 5);
        return;
      }

      try {
        doc.addImage(foto.dataUrl, "JPEG", x, yPos, thumbW, thumbH, undefined, "FAST");
      } catch {
        setFill(LIGHT);
        doc.rect(x, yPos, thumbW, thumbH, "F");
        setColor(GRAY);
        doc.setFontSize(8);
        doc.text("imagem", x + thumbW / 2, yPos + thumbH / 2, { align: "center" });
      }
      setColor([60, 60, 70]);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.8);
      const labelText = `${idx + 1}. ${foto.categoria || "outro"}`;
      doc.text(labelText, x, yPos + thumbH + 5);

      // Observação se houver ambiente identificado
      const amb = d.analiseVisual?.ambientes_identificados?.find((a) => a.foto_index === idx);
      if (amb?.observacao) {
        setColor(GRAY);
        doc.setFont("helvetica", "italic");
        doc.setFontSize(6.8);
        const obs = doc.splitTextToSize(amb.observacao, thumbW);
        doc.text(obs[0] || "", x, yPos + thumbH + 9);
      }
    });

    footer("Galeria de Fotos");
  }

  // ========== ANÁLISE VISUAL (se houver) ==========
  if (d.analiseVisual) {
    const av = d.analiseVisual;
    doc.addPage();
    headerStrip("Análise Visual");
    y = sectionTitle("Análise Visual", 38);

    y = para(
      `Avaliação complementar baseada em ${av.total_fotos_analisadas} foto(s) reais. Observa apenas características visuais aparentes — não substitui laudo de engenharia.`,
      y, { size: 9.5, color: GRAY }
    );
    y += 2;

    setFill(NAVY);
    doc.roundedRect(14, y, W - 28, 24, 3, 3, "F");
    setColor([255, 255, 255]);
    doc.setFont("helvetica", "normal"); doc.setFontSize(8.5);
    doc.text("SCORE VISUAL GERAL", 20, y + 9);
    doc.setFont("helvetica", "bold"); doc.setFontSize(20);
    doc.text(`${av.score_visual_geral.toFixed(1)}/10`, 20, y + 19);
    setColor(GOLD);
    doc.setFont("helvetica", "bold"); doc.setFontSize(13);
    doc.text(`Impacto no valor: ${av.ajuste_total_pct > 0 ? "+" : ""}${av.ajuste_total_pct.toFixed(1)}%`, W - 20, y + 15, { align: "right" });
    y += 30;

    const scoreItems: Array<[string, number]> = [
      ["Visual Externo", av.scores.visual_externo],
      ["Interior", av.scores.interior],
      ["Acabamento Visual", av.scores.acabamento_visual],
      ["Conservação Aparente", av.scores.conservacao_aparente],
      ["Liquidez Visual", av.scores.liquidez_visual],
    ];
    scoreItems.forEach(([label, val]) => {
      setColor([60, 60, 70]);
      doc.setFont("helvetica", "normal"); doc.setFontSize(9);
      doc.text(label, 14, y);
      doc.text(`${val.toFixed(1)}/10`, 70, y);
      setFill([225, 225, 235]);
      doc.rect(90, y - 3, W - 104, 3.5, "F");
      const cor: [number, number, number] = val >= 8 ? GREEN : val >= 6 ? NAVY : val >= 4 ? AMBER : [200, 60, 60];
      setFill(cor);
      doc.rect(90, y - 3, ((W - 104) * val) / 10, 3.5, "F");
      y += 6;
    });
    y += 4;

    const resumos: Array<[string, string]> = [
      ["Resumo Externo", av.resumo_externo],
      ["Resumo Interno", av.resumo_interno],
      ["Conservação Aparente", av.resumo_conservacao],
      ["Conclusão Visual", av.resumo_geral],
    ];
    resumos.forEach(([t, txt]) => {
      if (!txt) return;
      if (y > H - 30) { footer("Análise Visual"); doc.addPage(); headerStrip("Análise Visual (cont.)"); y = 38; }
      setColor(NAVY);
      doc.setFont("helvetica", "bold"); doc.setFontSize(9.5);
      doc.text(t.toUpperCase(), 14, y);
      y += 5;
      y = para(txt, y, { size: 9.5 });
      y += 1;
    });

    if (av.sugestoes_melhorias.length) {
      if (y > H - 50) { footer("Análise Visual"); doc.addPage(); headerStrip("Análise Visual (cont.)"); y = 38; }
      setColor(VIOLET);
      doc.setFont("helvetica", "bold"); doc.setFontSize(10.5);
      doc.text("SUGESTÕES DE VALORIZAÇÃO (BASEADAS NAS FOTOS)", 14, y);
      setFill(VIOLET);
      doc.rect(14, y + 1.5, 8, 0.5, "F");
      y += 7;
      av.sugestoes_melhorias.slice(0, 8).forEach((s) => {
        if (y > H - 24) { footer("Análise Visual"); doc.addPage(); headerStrip("Análise Visual (cont.)"); y = 38; }
        setColor([40, 40, 50]);
        doc.setFont("helvetica", "normal"); doc.setFontSize(9.5);
        const lines = doc.splitTextToSize(`›  ${s}`, W - 32);
        lines.forEach((l: string) => { doc.text(l, 18, y); y += 4.8; });
      });
    }

    footer("Análise Visual");
  }

  // =========================================
  // PÁGINA 6 — OBSERVAÇÕES
  // =========================================
  doc.addPage();
  headerStrip("Página 6 — Observações Finais");
  y = sectionTitle("Observações", 38);

  const renderList = (titulo: string, items: string[], cor: [number, number, number], simbolo: string) => {
    if (y > H - 40) { footer("Página 6 de 6"); doc.addPage(); headerStrip("Página 6 — Observações (cont.)"); y = 38; }
    setColor(cor);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10.5);
    doc.text(titulo.toUpperCase(), 14, y);
    setFill(cor);
    doc.rect(14, y + 1.5, 8, 0.5, "F");
    y += 7;
    if (!items.length) {
      y = para("Sem registros relevantes.", y, { color: GRAY });
      return;
    }
    items.forEach((it) => {
      if (y > H - 24) { footer("Página 6 de 6"); doc.addPage(); headerStrip("Página 6 — Observações (cont.)"); y = 38; }
      setColor([40, 40, 50]);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9.8);
      const lines = doc.splitTextToSize(`${simbolo}  ${it}`, W - 32);
      lines.forEach((l: string) => { doc.text(l, 18, y); y += 4.8; });
      y += 1;
    });
    y += 4;
  };

  renderList("Pontos Fortes", d.result.pontos_fortes, GREEN, "+");
  renderList("Pontos de Atenção", d.result.pontos_atencao, AMBER, "!");
  renderList("Sugestões de Valorização", d.result.sugestoes_valorizacao ?? [], VIOLET, ">");

  // Riscos documentais
  const riscos: string[] = [];
  if (d.documentacao.includes("Pendências") || d.documentacao.includes("Pendente")) {
    riscos.push("Há pendências documentais — risco de inviabilizar transação até regularização.");
  }
  if (riscos.length === 0) riscos.push("Não foram identificados riscos documentais relevantes nas informações fornecidas.");
  renderList("Riscos Documentais", riscos, AMBER, "!");

  footer("Página 6 de 6");

  return doc;
}
