// Gerador de Laudo de Avaliação Imobiliária PDF (multi-página, profissional)
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
  areaTotal: string | number;
  areaConstruida?: string | number;
  quartos?: string | number;
  banheiros?: string | number;
  suites?: string | number;
  garagem?: string | number;
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
    potencial_valorizacao_pct: number;
    tempo_medio_venda_dias: number;
    justificativa: string;
    pontos_fortes: string[];
    pontos_atencao: string[];
    meta?: {
      preco_m2: number;
      ajuste_total_pct: number;
      breakdown: Array<{ label: string; pct: number }>;
    };
  };
  // Avaliador
  avaliadorNome?: string;
  avaliadorEmail?: string;
  empresaNome?: string;
  empresaLogo?: string; // dataURL ou URL
};

const fmtBRL = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

const NAVY: [number, number, number] = [20, 30, 70];
const GOLD: [number, number, number] = [180, 145, 60];
const GRAY: [number, number, number] = [110, 110, 120];
const LIGHT: [number, number, number] = [245, 247, 252];
const GREEN: [number, number, number] = [34, 130, 80];
const AMBER: [number, number, number] = [200, 130, 20];

function shortCode(): string {
  const ts = Date.now().toString(36).toUpperCase();
  const r = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `LAU-${ts}-${r}`;
}

function liquidezLabel(dias: number): string {
  if (dias <= 60) return "Alta — venda rápida esperada";
  if (dias <= 120) return "Média — alinhada à média de mercado";
  return "Baixa — perfil de venda paciente";
}

function localizacaoTexto(d: ValuationReportData): string {
  const parts = [`Imóvel localizado em ${d.bairro}, ${d.cidade}/${d.estado}`];
  if (d.rua) parts.push(`com endereço na ${d.rua}`);
  // Fallback: se preco_m2 vier 0/ausente, calcula a partir do valor estimado e área total
  const area = Number(d.areaTotal) || 0;
  let precoM2 = Number(d.result.meta?.preco_m2) || 0;
  if (!precoM2 && area > 0 && d.result.valor_estimado > 0) {
    precoM2 = Math.round(d.result.valor_estimado / area);
  }
  if (precoM2 > 0) {
    parts.push(`região com preço médio de ${fmtBRL(precoM2)} por m² aplicado como base de cálculo`);
  } else {
    parts.push("região analisada com base em comparáveis de mercado");
  }
  return parts.join(", ") + ".";
}

function conservacaoTexto(c: string): string {
  const map: Record<string, string> = {
    "Novo": "Imóvel em estado novo, sem necessidade de intervenções estruturais ou estéticas.",
    "Reformado": "Imóvel reformado recentemente, com elementos atualizados e em pleno funcionamento.",
    "Bom": "Imóvel em bom estado geral de conservação, manutenção em dia.",
    "Antigo": "Imóvel com sinais de envelhecimento natural, podendo demandar atualizações pontuais.",
    "Precisa reforma": "Imóvel necessita de reforma para alcançar pleno valor de mercado.",
  };
  return map[c] ?? "Estado de conservação compatível com a média da região.";
}

function acabamentoTexto(a: string): string {
  const map: Record<string, string> = {
    "Simples": "Padrão construtivo simples, com materiais funcionais e econômicos.",
    "Médio": "Padrão construtivo dentro da média regional, com materiais comerciais de boa procedência.",
    "Alto padrão": "Acabamentos superiores à média, com materiais nobres e detalhes diferenciados.",
    "Luxo": "Padrão luxo, com materiais premium, projeto refinado e atributos exclusivos.",
  };
  return map[a] ?? "Padrão construtivo compatível com a média regional.";
}

function documentacaoTexto(docs: string[]): string {
  if (!docs.length) return "Documentação não informada — recomenda-se análise pelo cartório competente.";
  if (docs.includes("Pendente")) return "Há pendências documentais relevantes — orienta-se regularização antes da comercialização.";
  const ok = docs.filter((d) => /OK|Financiável/i.test(d));
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

  // Contar fatores reais analisados (não só os com ajuste != 0)
  const fatoresAnalisados: string[] = [];
  if (d.areaTotal) fatoresAnalisados.push("metragem");
  if (d.acabamento) fatoresAnalisados.push("padrão de acabamento");
  if (d.conservacao) fatoresAnalisados.push("estado de conservação");
  if (d.extras?.length) fatoresAnalisados.push(`${d.extras.length} diferencial(is)`);
  if (d.documentacao?.length) fatoresAnalisados.push("situação documental");
  if ((Number(d.quartos) || 0) + (Number(d.suites) || 0) + (Number(d.banheiros) || 0) + (Number(d.garagem) || 0) > 0) {
    fatoresAnalisados.push("estrutura interna");
  }
  const totalFatores = fatoresAnalisados.length || 5;
  const ajustesAplicados = r.meta?.breakdown.length ?? 0;

  return [
    `O imóvel apresenta ${tendencia}, considerando metragem útil, padrão construtivo e atributos diferenciais.`,
    `A análise considerou ${totalFatores} fatores objetivos (${fatoresAnalisados.join(", ")}), dos quais ${ajustesAplicados} resultaram em ajuste percentual sobre o preço base regional.`,
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
  const codigo = shortCode();
  const dataEmissao = new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });

  // ======= Helpers =======
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

  const dataRow = (label: string, value: string, y: number): number => {
    setColor(GRAY);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(label.toUpperCase(), 14, y);
    setColor([20, 20, 30]);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10.5);
    doc.text(value || "—", 14, y + 5);
    setFill([225, 225, 235]);
    doc.rect(14, y + 7.5, W - 28, 0.2, "F");
    return y + 12;
  };

  // =========================================
  // PÁGINA 1 — CAPA
  // =========================================
  setFill(NAVY);
  doc.rect(0, 0, W, H, "F");
  // detalhe ouro topo
  setFill(GOLD);
  doc.rect(0, 0, W, 4, "F");
  // detalhe ouro base
  doc.rect(0, H - 4, W, 4, "F");

  // marca/logo
  setColor([255, 255, 255]);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text((d.empresaNome ?? "AVALIAÇÃO IMOBILIÁRIA").toUpperCase(), W / 2, 30, { align: "center" });

  // título
  setColor([255, 255, 255]);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(28);
  doc.text("Laudo de Avaliação", W / 2, H / 2 - 25, { align: "center" });
  doc.setFontSize(28);
  doc.text("Imobiliária", W / 2, H / 2 - 12, { align: "center" });

  // linha ouro
  setFill(GOLD);
  doc.rect(W / 2 - 25, H / 2 - 4, 50, 0.8, "F");

  // dados do imóvel resumo
  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  setColor([220, 220, 230]);
  doc.text(`${d.tipo} • ${d.bairro}`, W / 2, H / 2 + 8, { align: "center" });
  doc.text(`${d.cidade} / ${d.estado}`, W / 2, H / 2 + 16, { align: "center" });

  // bloco inferior info
  const blockY = H - 70;
  setFill([255, 255, 255]);
  doc.setDrawColor(GOLD[0], GOLD[1], GOLD[2]);
  doc.setLineWidth(0.4);
  doc.roundedRect(20, blockY, W - 40, 45, 3, 3, "S");

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
  if (d.avaliadorEmail) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text(d.avaliadorEmail, W - 26, blockY + 22, { align: "right" });
  }

  // =========================================
  // PÁGINA 2 — DADOS DO IMÓVEL
  // =========================================
  doc.addPage();
  headerStrip("Página 2 — Identificação do Imóvel");
  let y = sectionTitle("Dados do Imóvel", 38);

  // Endereço em destaque
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

  // Grid 2 colunas
  const colW = (W - 36) / 2;
  const col2X = 14 + colW + 8;
  let yL = y;
  let yR = y;

  const rowL = (label: string, val: string) => {
    setColor(GRAY);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text(label.toUpperCase(), 14, yL);
    setColor([20, 20, 30]);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10.5);
    doc.text(val || "—", 14, yL + 5);
    doc.setDrawColor(225, 225, 235);
    doc.line(14, yL + 8, 14 + colW, yL + 8);
    yL += 13;
  };
  const rowR = (label: string, val: string) => {
    setColor(GRAY);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text(label.toUpperCase(), col2X, yR);
    setColor([20, 20, 30]);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10.5);
    doc.text(val || "—", col2X, yR + 5);
    doc.setDrawColor(225, 225, 235);
    doc.line(col2X, yR + 8, col2X + colW, yR + 8);
    yR += 13;
  };

  rowL("Tipo do imóvel", d.tipo);
  rowR("Padrão de acabamento", d.acabamento);
  rowL("Área total", `${d.areaTotal} m²`);
  rowR("Área construída", d.areaConstruida ? `${d.areaConstruida} m²` : "—");
  rowL("Quartos", String(d.quartos ?? "—"));
  rowR("Suítes", String(d.suites ?? "—"));
  rowL("Banheiros", String(d.banheiros ?? "—"));
  rowR("Vagas garagem", String(d.garagem ?? "—"));
  rowL("Conservação", d.conservacao);
  rowR("CEP", d.cep || "—");

  y = Math.max(yL, yR) + 4;
  // Diferenciais
  y = sectionTitle("Diferenciais", y);
  if (d.extras.length === 0) {
    y = para("Nenhum diferencial declarado.", y, { color: GRAY });
  } else {
    let cx = 14;
    let cy = y;
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

  // Documentação
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
  ];

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
  // PÁGINA 4 — RESULTADO FINANCEIRO
  // =========================================
  doc.addPage();
  headerStrip("Página 4 — Resultado Financeiro");
  y = sectionTitle("Resultado da Avaliação", 38);

  // valor estimado destaque
  setFill(NAVY);
  doc.roundedRect(14, y, W - 28, 38, 3, 3, "F");
  setColor([255, 255, 255]);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text("VALOR ESTIMADO JUSTO DE MERCADO", W / 2, y + 9, { align: "center" });
  doc.setFont("helvetica", "bold");
  doc.setFontSize(28);
  doc.text(fmtBRL(d.result.valor_estimado), W / 2, y + 24, { align: "center" });
  setColor(GOLD);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(`Faixa ideal: ${fmtBRL(d.result.faixa_min)} — ${fmtBRL(d.result.faixa_max)}`, W / 2, y + 33, { align: "center" });
  y += 46;

  // 3 cards estratégias
  const cardW = (W - 28 - 12) / 3;
  const cards: Array<{ label: string; value: string; sub: string }> = [
    { label: "Venda Rápida", value: fmtBRL(d.result.venda_rapida), sub: "até 30-60 dias" },
    { label: "Venda Premium", value: fmtBRL(d.result.venda_premium), sub: "vendedor paciente" },
    { label: "Tempo Médio", value: `${d.result.tempo_medio_venda_dias} dias`, sub: "no preço justo" },
  ];
  cards.forEach((c, i) => {
    const x = 14 + i * (cardW + 6);
    setFill(LIGHT);
    doc.roundedRect(x, y, cardW, 28, 2, 2, "F");
    setColor(GRAY);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text(c.label.toUpperCase(), x + 5, y + 7);
    setColor(NAVY);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text(c.value, x + 5, y + 17);
    setColor(GRAY);
    doc.setFont("helvetica", "italic");
    doc.setFontSize(8);
    doc.text(c.sub, x + 5, y + 23);
  });
  y += 36;

  // Potencial valorização + locação estimada
  setFill([240, 246, 240]);
  doc.roundedRect(14, y, (W - 28) / 2 - 4, 24, 2, 2, "F");
  setColor(GREEN);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text("POTENCIAL DE VALORIZAÇÃO", 18, y + 7);
  doc.setFontSize(18);
  doc.text(`+${d.result.potencial_valorizacao_pct}% a.a.`, 18, y + 18);

  // Locação estimada (regra: 0,4-0,6% do valor / mês)
  const aluguelEst = Math.round((d.result.valor_estimado * 0.005) / 50) * 50;
  const x2 = 14 + (W - 28) / 2 + 4;
  setFill([245, 240, 252]);
  doc.roundedRect(x2, y, (W - 28) / 2 - 4, 24, 2, 2, "F");
  setColor([90, 50, 130]);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text("POTENCIAL DE LOCAÇÃO MENSAL", x2 + 4, y + 7);
  doc.setFontSize(18);
  doc.text(fmtBRL(aluguelEst), x2 + 4, y + 18);
  y += 32;

  // Gráfico de barras (4 estratégias)
  setColor(NAVY);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("COMPARATIVO DE ESTRATÉGIAS", 14, y);
  y += 4;

  const max = d.result.venda_premium;
  const barAreaW = W - 28 - 50;
  const bars = [
    { label: "Rápida", val: d.result.venda_rapida, color: AMBER },
    { label: "Mínima", val: d.result.faixa_min, color: GRAY },
    { label: "Justa", val: d.result.valor_estimado, color: NAVY },
    { label: "Máxima", val: d.result.faixa_max, color: GOLD },
    { label: "Premium", val: d.result.venda_premium, color: GREEN },
  ];
  bars.forEach((b) => {
    y += 8;
    setColor([60, 60, 70]);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.text(b.label, 14, y);
    const wpx = (b.val / max) * barAreaW;
    setFill(b.color);
    doc.roundedRect(36, y - 4, Math.max(2, wpx), 5, 1, 1, "F");
    setColor([40, 40, 50]);
    doc.setFontSize(8);
    doc.text(fmtBRL(b.val), 36 + wpx + 2, y);
  });

  footer("Página 4 de 6");

  // =========================================
  // PÁGINA 5 — PARECER TÉCNICO
  // =========================================
  doc.addPage();
  headerStrip("Página 5 — Parecer Técnico");
  y = sectionTitle("Parecer Técnico do Avaliador", 38);

  y = para(analiseTecnicaParagrafo(d), y);
  y += 2;

  // Texto da IA (justificativa)
  setColor(NAVY);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.5);
  doc.text("FUNDAMENTAÇÃO COMPARATIVA", 14, y);
  setFill(GOLD);
  doc.rect(14, y + 1.5, 8, 0.5, "F");
  y += 7;
  y = para(d.result.justificativa, y);
  y += 2;

  // Breakdown
  if (d.result.meta?.breakdown.length) {
    if (y > H - 60) { footer("Página 5 de 6"); doc.addPage(); headerStrip("Página 5 — Parecer Técnico (cont.)"); y = 38; }
    setColor(NAVY);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10.5);
    doc.text("AJUSTES APLICADOS", 14, y);
    setFill(GOLD);
    doc.rect(14, y + 1.5, 8, 0.5, "F");
    y += 7;

    d.result.meta.breakdown.forEach((b) => {
      if (y > H - 24) { footer("Página 5 de 6"); doc.addPage(); headerStrip("Página 5 — Parecer Técnico (cont.)"); y = 38; }
      setColor([40, 40, 50]);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9.5);
      doc.text(`• ${b.label}`, 18, y);
      setColor(b.pct > 0 ? GREEN : AMBER);
      doc.setFont("helvetica", "bold");
      doc.text(`${b.pct > 0 ? "+" : ""}${b.pct}%`, W - 18, y, { align: "right" });
      y += 5.5;
    });
  }

  footer("Página 5 de 6");

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
  renderList("Pontos de Atenção", d.result.pontos_atencao, AMBER, "-");

  // Melhorias sugeridas (heurísticas)
  const melhorias: string[] = [];
  if (d.conservacao === "Antigo" || d.conservacao === "Precisa reforma") melhorias.push("Reforma de pintura, piso e elétrica para captar valorização imediata.");
  if (!d.extras.includes("Energia solar")) melhorias.push("Avaliar instalação de energia solar como diferencial de valorização.");
  if (d.acabamento === "Simples") melhorias.push("Substituição de revestimentos por padrão médio pode elevar o valor percebido.");
  if (!d.documentacao.includes("Financiável")) melhorias.push("Regularizar documentação para tornar o imóvel financiável amplia o público comprador.");
  if (melhorias.length === 0) melhorias.push("Imóvel já em condições competitivas para o mercado atual.");
  renderList("Melhorias Sugeridas", melhorias, NAVY, ">");

  // Riscos documentais
  const riscos: string[] = [];
  if (d.documentacao.includes("Pendente")) riscos.push("Há pendências documentais — risco de inviabilizar transação até regularização.");
  if (d.documentacao.includes("Escritura pendente")) riscos.push("Escritura pendente reduz liquidez e poder de negociação.");
  if (d.documentacao.includes("Averbação pendente")) riscos.push("Averbação pendente impede financiamento bancário.");
  if (riscos.length === 0) riscos.push("Não foram identificados riscos documentais relevantes nas informações fornecidas.");
  renderList("Riscos Documentais", riscos, AMBER, "!");

  footer("Página 6 de 6");

  return doc;
}
