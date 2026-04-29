import jsPDF from "jspdf";

interface ProposalData {
  id: string;
  title: string;
  price: number;
  image: string;
  images?: string[];
  location: string;
  description: string;
  tags: string[];
  status: string;
  sellerName: string;
  sellerPhone: string;
  sellerCategory: string;
  sellerLogo: string;
  propertyUrl: string;
  bedrooms?: number;
  bathrooms?: number;
  area?: number;
  suites?: number;
  parking_spots?: number;
  sellerInstagram?: string;
  sellerSiteUrl?: string;
}

// ─── CAPIMOBI Premium Palette ───────────────────────────────────────────
const C = {
  white:        [255, 255, 255] as [number, number, number],
  bg:           [248, 250, 252] as [number, number, number],
  ink:          [10, 15, 30]    as [number, number, number],   // preto premium
  ink2:         [30, 41, 59]    as [number, number, number],
  navy:         [12, 32, 64]    as [number, number, number],   // azul escuro pro
  navyDeep:     [6, 18, 42]     as [number, number, number],
  blue:         [30, 64, 175]   as [number, number, number],
  blueSoft:     [219, 234, 254] as [number, number, number],
  green:        [16, 163, 96]   as [number, number, number],
  greenSoft:    [220, 252, 231] as [number, number, number],
  gold:         [193, 154, 73]  as [number, number, number],
  grayLine:     [226, 232, 240] as [number, number, number],
  grayMute:     [100, 116, 139] as [number, number, number],
  grayCard:     [241, 245, 249] as [number, number, number],
  red:          [220, 38, 38]   as [number, number, number],
};

const W = 210;
const H = 297;
const M = 16;

function fmtPrice(price: number): string {
  return price.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
}

function fmtPriceShort(price: number): string {
  if (price >= 1_000_000) return `R$ ${(price / 1_000_000).toFixed(price % 1_000_000 === 0 ? 0 : 2).replace(".", ",")}M`;
  if (price >= 1_000) return `R$ ${Math.round(price / 1_000)}k`;
  return fmtPrice(price);
}

async function loadImg(url: string): Promise<string | null> {
  if (!url) return null;
  try {
    return await new Promise<string | null>((resolve) => {
      const img = new window.Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext("2d");
        if (!ctx) { resolve(null); return; }
        ctx.drawImage(img, 0, 0);
        try { resolve(canvas.toDataURL("image/jpeg", 0.88)); } catch { resolve(null); }
      };
      img.onerror = () => resolve(null);
      img.src = url;
    });
  } catch { return null; }
}

function rr(pdf: jsPDF, x: number, y: number, w: number, h: number, r: number, style: "F" | "S" | "FD") {
  pdf.roundedRect(x, y, w, h, r, r, style);
}

function setFill(pdf: jsPDF, c: [number, number, number]) { pdf.setFillColor(c[0], c[1], c[2]); }
function setDraw(pdf: jsPDF, c: [number, number, number]) { pdf.setDrawColor(c[0], c[1], c[2]); }
function setText(pdf: jsPDF, c: [number, number, number]) { pdf.setTextColor(c[0], c[1], c[2]); }

// ─── Footer / Header ───────────────────────────────────────────────────
function drawFooter(pdf: jsPDF, pageNum: number, totalPages: number) {
  // Hairline
  setDraw(pdf, C.grayLine);
  pdf.setLineWidth(0.2);
  pdf.line(M, H - 14, W - M, H - 14);

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(7.5);
  setText(pdf, C.ink);
  pdf.text("CAPIMOBI", M, H - 8);

  pdf.setFont("helvetica", "normal");
  setText(pdf, C.grayMute);
  pdf.text("  ·  Inteligência Imobiliária", M + pdf.getTextWidth("CAPIMOBI"), H - 8);

  pdf.text(`${pageNum} / ${totalPages}`, W - M, H - 8, { align: "right" });
}

function drawTopBar(pdf: jsPDF, label: string) {
  // very subtle top brand strip
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(8);
  setText(pdf, C.ink);
  pdf.text("CAPIMOBI", M, M);
  setFill(pdf, C.gold);
  pdf.rect(M + pdf.getTextWidth("CAPIMOBI") + 2, M - 2.4, 1.2, 1.2, "F");

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(7.5);
  setText(pdf, C.grayMute);
  pdf.text(label.toUpperCase(), W - M, M, { align: "right" });

  setDraw(pdf, C.grayLine);
  pdf.setLineWidth(0.2);
  pdf.line(M, M + 3, W - M, M + 3);
}

function sectionTitle(pdf: jsPDF, eyebrow: string, title: string, y: number): number {
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(7.5);
  setText(pdf, C.gold);
  pdf.text(eyebrow.toUpperCase(), M, y);

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(22);
  setText(pdf, C.ink);
  pdf.text(title, M, y + 9);

  setFill(pdf, C.ink);
  pdf.rect(M, y + 12, 14, 0.8, "F");
  return y + 20;
}

// ─── Public entry point ────────────────────────────────────────────────
export async function generateProposalPdf(data: ProposalData) {
  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4", compress: true });

  // Preload images
  const heroImg = await loadImg(data.image);
  const sellerLogoImg = await loadImg(data.sellerLogo);
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(data.propertyUrl)}&format=png&margin=2`;
  const qrImg = await loadImg(qrUrl);
  const mapImg = data.location
    ? await loadImg(`https://maps.googleapis.com/maps/api/staticmap?center=${encodeURIComponent(data.location)}&zoom=15&size=600x400&markers=color:0x1E40AF|${encodeURIComponent(data.location)}&scale=2&maptype=roadmap`)
    : null;

  const totalPagesPlanned = 7 + (mapImg || data.location ? 1 : 0);

  // ─── PAGE 1 — CAPA IMPACTANTE ─────────────────────────────────────────
  drawCover(pdf, data, heroImg);
  drawFooter(pdf, 1, totalPagesPlanned);

  // ─── PAGE 2 — RESUMO EXECUTIVO ────────────────────────────────────────
  pdf.addPage();
  drawTopBar(pdf, "Resumo Executivo");
  let y = 32;
  y = sectionTitle(pdf, "01 · Avaliação", "Resumo Executivo", y);
  drawExecutiveSummary(pdf, data, y);
  drawFooter(pdf, 2, totalPagesPlanned);

  // ─── PAGE 3 — POR QUE CAPIMOBI ────────────────────────────────────────
  pdf.addPage();
  drawTopBar(pdf, "Diferenciais");
  y = 32;
  y = sectionTitle(pdf, "02 · Por que nós", "Por que contratar a Capimobi", y);
  drawWhyUs(pdf, y);
  drawFooter(pdf, 3, totalPagesPlanned);

  // ─── PAGE 4 — PLANO DE MARKETING ──────────────────────────────────────
  pdf.addPage();
  drawTopBar(pdf, "Estratégia");
  y = 32;
  y = sectionTitle(pdf, "03 · Plano", "Estratégia de Marketing", y);
  drawMarketingTimeline(pdf, y);
  drawFooter(pdf, 4, totalPagesPlanned);

  // ─── PAGE 5 — COMPARATIVO DE PREÇO ────────────────────────────────────
  pdf.addPage();
  drawTopBar(pdf, "Pricing");
  y = 32;
  y = sectionTitle(pdf, "04 · Posicionamento", "Comparativo de Preço", y);
  drawPriceComparison(pdf, data, y);
  drawFooter(pdf, 5, totalPagesPlanned);

  // ─── PAGE 6 — OPORTUNIDADE DE VALORIZAÇÃO ─────────────────────────────
  pdf.addPage();
  drawTopBar(pdf, "Valorização");
  y = 32;
  y = sectionTitle(pdf, "05 · Oportunidade", "Potencial de Valorização", y);
  drawValuation(pdf, y);
  drawFooter(pdf, 6, totalPagesPlanned);

  // ─── PAGE 7 — LOCALIZAÇÃO (se houver) ────────────────────────────────
  let pageCount = 6;
  if (data.location) {
    pdf.addPage();
    drawTopBar(pdf, "Localização");
    y = 32;
    y = sectionTitle(pdf, "06 · Endereço", "Localização Estratégica", y);
    drawLocation(pdf, data, mapImg, y);
    pageCount++;
    drawFooter(pdf, pageCount, totalPagesPlanned);
  }

  // ─── PAGE FINAL — CTA FORTE ───────────────────────────────────────────
  pdf.addPage();
  pageCount++;
  drawClosingCta(pdf, data, qrImg);
  // closing page has its own footer in dark theme

  pdf.save(`proposta-capimobi-${data.id}.pdf`);
}

// ═══════════════════════════════════════════════════════════════════════
// PAGE 1 — COVER
// ═══════════════════════════════════════════════════════════════════════
function drawCover(pdf: jsPDF, data: ProposalData, heroImg: string | null) {
  // Full-bleed hero image area (top 60%)
  const heroH = 175;
  if (heroImg) {
    try { pdf.addImage(heroImg, "JPEG", 0, 0, W, heroH, undefined, "FAST"); }
    catch { setFill(pdf, C.navy); pdf.rect(0, 0, W, heroH, "F"); }
  } else {
    setFill(pdf, C.navy); pdf.rect(0, 0, W, heroH, "F");
  }

  // Dark gradient overlay (simulated with stacked translucent rects)
  for (let i = 0; i < 14; i++) {
    pdf.setFillColor(6, 18, 42);
    pdf.setGState(pdf.GState({ opacity: 0.06 }));
    pdf.rect(0, heroH - 60 + i * 4, W, 8, "F");
  }
  pdf.setGState(pdf.GState({ opacity: 1 }));

  // Brand chip (top)
  setFill(pdf, C.white);
  rr(pdf, M, 16, 38, 9, 1.5, "F");
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(9);
  setText(pdf, C.ink);
  pdf.text("CAPIMOBI", M + 4, 22);
  setFill(pdf, C.gold);
  pdf.rect(M + 4 + pdf.getTextWidth("CAPIMOBI") + 1.5, 19, 1.5, 1.5, "F");

  // Date chip (top right)
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(8);
  setText(pdf, C.white);
  pdf.text(new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" }), W - M, 22, { align: "right" });

  // Eyebrow
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(8);
  setText(pdf, C.gold);
  pdf.text("PROPOSTA PROFISSIONAL", M, heroH - 32);

  // Big title
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(26);
  setText(pdf, C.white);
  const titleLines = pdf.splitTextToSize(data.title, W - M * 2 - 10);
  pdf.text(titleLines.slice(0, 2), M, heroH - 22);

  // Location chip
  if (data.location) {
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9.5);
    setText(pdf, C.white);
    pdf.text(`◆  ${data.location}`, M, heroH - 10);
  }

  // White info panel (bottom 40%)
  setFill(pdf, C.white);
  pdf.rect(0, heroH, W, H - heroH, "F");

  // Eyebrow
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(7.5);
  setText(pdf, C.gold);
  pdf.text("VENDA IMOBILIÁRIA", M, heroH + 14);

  // Headline
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(15);
  setText(pdf, C.ink);
  const head = pdf.splitTextToSize(
    "Estratégia completa para vender seu imóvel com velocidade e valorização.",
    W - M * 2
  );
  pdf.text(head, M, heroH + 22);

  // Stat row (3 columns)
  const statY = heroH + 48;
  const colW = (W - M * 2 - 8) / 3;
  drawStatChip(pdf, M, statY, colW, "VALOR ESTIMADO", fmtPrice(data.price), C.green);
  drawStatChip(pdf, M + colW + 4, statY, colW, "TIPO", catLabel(data.sellerCategory), C.blue);
  const specsCount = [data.bedrooms, data.bathrooms, data.area].filter(Boolean).length;
  drawStatChip(pdf, M + (colW + 4) * 2, statY, colW, "REFERÊNCIA", `#${data.id.slice(0, 6).toUpperCase()}`, C.ink);

  // Seller bar at bottom
  const sbY = H - 38;
  setFill(pdf, C.bg);
  rr(pdf, M, sbY, W - M * 2, 22, 2.5, "F");

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(7);
  setText(pdf, C.grayMute);
  pdf.text("APRESENTADO POR", M + 5, sbY + 6);

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(11);
  setText(pdf, C.ink);
  pdf.text(data.sellerName, M + 5, sbY + 13);

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(8);
  setText(pdf, C.grayMute);
  const subParts = [catLabel(data.sellerCategory)];
  if (data.sellerPhone) subParts.push(data.sellerPhone);
  pdf.text(subParts.join("  ·  "), M + 5, sbY + 18.5);

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(8);
  setText(pdf, C.gold);
  pdf.text("PROPOSTA #" + data.id.slice(0, 6).toUpperCase(), W - M - 5, sbY + 13, { align: "right" });
}

function drawStatChip(
  pdf: jsPDF, x: number, y: number, w: number,
  label: string, value: string, accent: [number, number, number]
) {
  setFill(pdf, C.bg);
  rr(pdf, x, y, w, 22, 2.5, "F");
  setFill(pdf, accent);
  pdf.rect(x, y, 1.4, 22, "F");

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(6.5);
  setText(pdf, C.grayMute);
  pdf.text(label, x + 5, y + 6);

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(11);
  setText(pdf, C.ink);
  // Auto-fit
  let fit = value;
  while (pdf.getTextWidth(fit) > w - 8 && pdf.getFontSize() > 7) {
    pdf.setFontSize(pdf.getFontSize() - 0.5);
  }
  pdf.text(fit, x + 5, y + 15);
}

function catLabel(cat: string): string {
  const m: Record<string, string> = {
    imobiliaria: "Imobiliária",
    corretor: "Corretor(a)",
    construtora: "Construtora",
    proprietario: "Proprietário",
  };
  return m[cat] || "Corretor(a)";
}

// ═══════════════════════════════════════════════════════════════════════
// PAGE 2 — EXECUTIVE SUMMARY
// ═══════════════════════════════════════════════════════════════════════
function drawExecutiveSummary(pdf: jsPDF, data: ProposalData, y: number) {
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9.5);
  setText(pdf, C.grayMute);
  const intro = pdf.splitTextToSize(
    "Análise estratégica de pricing baseada em comportamento de mercado, perfil do imóvel e velocidade desejada de fechamento.",
    W - M * 2
  );
  pdf.text(intro, M, y);
  y += intro.length * 5 + 6;

  const base = data.price;
  const cards = [
    { label: "VENDA RÁPIDA", value: base * 0.92,  hint: "Liquidez em até 30 dias",  accent: C.blue,  badge: "—8%" },
    { label: "VENDA IDEAL",  value: base,         hint: "Equilíbrio mercado x lucro", accent: C.green, badge: "MERCADO" },
    { label: "VENDA PREMIUM",value: base * 1.08,  hint: "Maior margem · prazo +90d", accent: C.gold,  badge: "+8%" },
  ];

  const cw = (W - M * 2 - 8) / 3;
  cards.forEach((c, i) => {
    const x = M + i * (cw + 4);
    drawPriceCard(pdf, x, y, cw, 50, c.label, fmtPrice(c.value), c.hint, c.accent, c.badge);
  });
  y += 56;

  // Secondary row: aluguel estimado + tempo médio
  const sw = (W - M * 2 - 4) / 2;
  drawInfoCard(
    pdf, M, y, sw, 32,
    "ALUGUEL ESTIMADO",
    fmtPrice(base * 0.0045),
    "≈ 0,45% do valor de venda · referência regional",
    C.green
  );
  drawInfoCard(
    pdf, M + sw + 4, y, sw, 32,
    "TEMPO MÉDIO DE VENDA",
    "45 a 90 dias",
    "Com plano de marketing Capimobi ativo",
    C.blue
  );
  y += 38;

  // Specs strip
  const specs: { k: string; v: string }[] = [];
  if (data.bedrooms) specs.push({ k: "Quartos", v: String(data.bedrooms) });
  if (data.suites) specs.push({ k: "Suítes", v: String(data.suites) });
  if (data.bathrooms) specs.push({ k: "Banheiros", v: String(data.bathrooms) });
  if (data.parking_spots) specs.push({ k: "Vagas", v: String(data.parking_spots) });
  if (data.area) specs.push({ k: "Área", v: `${data.area} m²` });

  if (specs.length > 0) {
    setFill(pdf, C.navy);
    rr(pdf, M, y, W - M * 2, 26, 2.5, "F");

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(7);
    setText(pdf, C.gold);
    pdf.text("FICHA DO IMÓVEL", M + 6, y + 7);

    const sx0 = M + 6;
    const sw2 = (W - M * 2 - 12) / specs.length;
    specs.forEach((s, i) => {
      const sx = sx0 + i * sw2;
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(13);
      setText(pdf, C.white);
      pdf.text(s.v, sx, y + 17);
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(7);
      setText(pdf, [148, 163, 184]);
      pdf.text(s.k.toUpperCase(), sx, y + 22);
    });
  }
}

function drawPriceCard(
  pdf: jsPDF, x: number, y: number, w: number, h: number,
  label: string, value: string, hint: string, accent: [number, number, number], badge: string
) {
  setFill(pdf, C.white);
  rr(pdf, x, y, w, h, 3, "F");
  setDraw(pdf, C.grayLine);
  pdf.setLineWidth(0.3);
  rr(pdf, x, y, w, h, 3, "S");

  // Top accent bar
  setFill(pdf, accent);
  rr(pdf, x, y, w, 1.5, 1, "F");

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(7);
  setText(pdf, C.grayMute);
  pdf.text(label, x + 5, y + 9);

  // Badge
  setFill(pdf, accent);
  const bw = pdf.getStringUnitWidth(badge) * 6.5 / pdf.internal.scaleFactor + 4;
  rr(pdf, x + w - bw - 5, y + 5, bw, 5, 1, "F");
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(6.5);
  setText(pdf, C.white);
  pdf.text(badge, x + w - bw - 5 + bw / 2, y + 8.5, { align: "center" });

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(15);
  setText(pdf, C.ink);
  // auto-fit
  let fit = value;
  while (pdf.getTextWidth(fit) > w - 10) { pdf.setFontSize(pdf.getFontSize() - 0.5); }
  pdf.text(fit, x + 5, y + 25);

  // Divider
  setDraw(pdf, C.grayLine);
  pdf.setLineWidth(0.2);
  pdf.line(x + 5, y + 30, x + w - 5, y + 30);

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(7.5);
  setText(pdf, C.grayMute);
  const lines = pdf.splitTextToSize(hint, w - 10);
  pdf.text(lines, x + 5, y + 36);
}

function drawInfoCard(
  pdf: jsPDF, x: number, y: number, w: number, h: number,
  label: string, value: string, hint: string, accent: [number, number, number]
) {
  setFill(pdf, C.bg);
  rr(pdf, x, y, w, h, 3, "F");
  setFill(pdf, accent);
  pdf.rect(x, y, 1.5, h, "F");

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(7);
  setText(pdf, C.grayMute);
  pdf.text(label, x + 6, y + 8);

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(14);
  setText(pdf, C.ink);
  let fit = value;
  while (pdf.getTextWidth(fit) > w - 12) { pdf.setFontSize(pdf.getFontSize() - 0.5); }
  pdf.text(fit, x + 6, y + 18);

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(7.5);
  setText(pdf, C.grayMute);
  const lines = pdf.splitTextToSize(hint, w - 12);
  pdf.text(lines, x + 6, y + 25);
}

// ═══════════════════════════════════════════════════════════════════════
// PAGE 3 — WHY US
// ═══════════════════════════════════════════════════════════════════════
function drawWhyUs(pdf: jsPDF, y: number) {
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9.5);
  setText(pdf, C.grayMute);
  const intro = pdf.splitTextToSize(
    "Estrutura de venda completa: tecnologia, mídia paga, atendimento humano-IA e equipe especializada em fechamento.",
    W - M * 2
  );
  pdf.text(intro, M, y);
  y += intro.length * 5 + 8;

  const items = [
    { t: "Divulgação Multi-Portal",   d: "Anúncio sincronizado nos maiores portais imobiliários e marketplace Capimobi." },
    { t: "Tráfego Pago Estratégico",  d: "Campanhas Meta Ads e Google Ads segmentadas por perfil do comprador ideal." },
    { t: "Atendimento Inteligente IA",d: "Bot Capimobi qualifica leads 24/7 antes do corretor humano entrar em ação." },
    { t: "Captação de Compradores",   d: "Base ativa de compradores reais filtrada por região, ticket e intenção." },
    { t: "Negociação Profissional",   d: "Corretores treinados para condução de propostas, contraproposta e fechamento." },
    { t: "Acompanhamento Completo",   d: "Do primeiro lead à assinatura: relatórios, visitas e suporte jurídico." },
  ];

  const colW = (W - M * 2 - 6) / 2;
  const rowH = 32;
  items.forEach((it, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = M + col * (colW + 6);
    const cy = y + row * (rowH + 6);

    setFill(pdf, C.white);
    rr(pdf, x, cy, colW, rowH, 2.5, "F");
    setDraw(pdf, C.grayLine);
    pdf.setLineWidth(0.3);
    rr(pdf, x, cy, colW, rowH, 2.5, "S");

    // Check icon disc
    setFill(pdf, C.green);
    pdf.circle(x + 8, cy + 10, 3.5, "F");
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(8);
    setText(pdf, C.white);
    pdf.text("✓", x + 8, cy + 11.5, { align: "center" });

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(10);
    setText(pdf, C.ink);
    pdf.text(it.t, x + 15, cy + 9);

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8);
    setText(pdf, C.grayMute);
    const lines = pdf.splitTextToSize(it.d, colW - 18);
    pdf.text(lines.slice(0, 3), x + 15, cy + 15);
  });

  // Trust banner
  const banY = y + Math.ceil(items.length / 2) * (rowH + 6) + 6;
  setFill(pdf, C.navy);
  rr(pdf, M, banY, W - M * 2, 22, 2.5, "F");

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(7.5);
  setText(pdf, C.gold);
  pdf.text("RESULTADO COMPROVADO", M + 8, banY + 8);

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(11);
  setText(pdf, C.white);
  pdf.text("Tecnologia + Pessoas + Estratégia = Vendas mais rápidas", M + 8, banY + 16);
}

// ═══════════════════════════════════════════════════════════════════════
// PAGE 4 — MARKETING TIMELINE
// ═══════════════════════════════════════════════════════════════════════
function drawMarketingTimeline(pdf: jsPDF, y: number) {
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9.5);
  setText(pdf, C.grayMute);
  const intro = pdf.splitTextToSize(
    "7 etapas executadas em sequência por times especializados — do clique inicial à assinatura do contrato.",
    W - M * 2
  );
  pdf.text(intro, M, y);
  y += intro.length * 5 + 8;

  const steps = [
    { n: "01", t: "Fotos Profissionais",      d: "Sessão fotográfica HDR + drone quando aplicável." },
    { n: "02", t: "Anúncio Premium",          d: "Copywriting, ficha técnica e SEO local." },
    { n: "03", t: "Redes Sociais",            d: "Post, Reels e Stories no Instagram + Facebook." },
    { n: "04", t: "Google + Meta Ads",        d: "Tráfego pago segmentado por intenção de compra." },
    { n: "05", t: "WhatsApp Leads",           d: "Bot IA qualifica e distribui ao corretor responsável." },
    { n: "06", t: "Visitas Agendadas",        d: "Agenda automatizada, lembretes e check-in." },
    { n: "07", t: "Fechamento",               d: "Negociação, contrato e suporte pós-venda." },
  ];

  const lineX = M + 16;
  // Vertical timeline line
  setFill(pdf, C.grayLine);
  pdf.rect(lineX, y, 0.6, steps.length * 18 - 6, "F");

  steps.forEach((s, i) => {
    const cy = y + i * 18;

    // Number disc
    setFill(pdf, i === steps.length - 1 ? C.green : C.navy);
    pdf.circle(lineX + 0.3, cy + 3, 5.5, "F");
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(8);
    setText(pdf, C.white);
    pdf.text(s.n, lineX + 0.3, cy + 4.6, { align: "center" });

    // Card
    const cardX = lineX + 10;
    const cardW = W - M - cardX;
    setFill(pdf, C.white);
    rr(pdf, cardX, cy - 2, cardW, 14, 2, "F");
    setDraw(pdf, C.grayLine);
    pdf.setLineWidth(0.25);
    rr(pdf, cardX, cy - 2, cardW, 14, 2, "S");

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(10);
    setText(pdf, C.ink);
    pdf.text(s.t, cardX + 5, cy + 3);

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8);
    setText(pdf, C.grayMute);
    pdf.text(s.d, cardX + 5, cy + 8.5);
  });
}

// ═══════════════════════════════════════════════════════════════════════
// PAGE 5 — PRICE COMPARISON
// ═══════════════════════════════════════════════════════════════════════
function drawPriceComparison(pdf: jsPDF, data: ProposalData, y: number) {
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9.5);
  setText(pdf, C.grayMute);
  const intro = pdf.splitTextToSize(
    "Como o preço de anúncio impacta sua receita final e o tempo de venda. Análise visual comparativa.",
    W - M * 2
  );
  pdf.text(intro, M, y);
  y += intro.length * 5 + 8;

  const base = data.price;
  const rows = [
    { label: "Abaixo do mercado", value: base * 0.85, time: "15 dias", color: C.red,   pct: 65, note: "Perde dinheiro · venda rápida demais" },
    { label: "Preço correto",     value: base,        time: "60 dias", color: C.green, pct: 88, note: "Equilíbrio entre tempo e lucro" },
    { label: "Preço premium",     value: base * 1.10, time: "120 dias",time2: "",      color: C.gold,  pct: 100, note: "Maior margem · requer paciência" },
  ];

  const tableX = M;
  const tableW = W - M * 2;

  // Header
  setFill(pdf, C.ink);
  rr(pdf, tableX, y, tableW, 9, 2, "F");
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(7.5);
  setText(pdf, C.white);
  pdf.text("ESTRATÉGIA",     tableX + 5, y + 5.8);
  pdf.text("VALOR ANÚNCIO",  tableX + 70, y + 5.8);
  pdf.text("TEMPO MÉDIO",    tableX + 110, y + 5.8);
  pdf.text("VISIBILIDADE",   tableX + tableW - 5, y + 5.8, { align: "right" });
  y += 13;

  rows.forEach((r) => {
    setFill(pdf, C.white);
    rr(pdf, tableX, y, tableW, 22, 2, "F");
    setDraw(pdf, C.grayLine);
    pdf.setLineWidth(0.3);
    rr(pdf, tableX, y, tableW, 22, 2, "S");

    setFill(pdf, r.color);
    pdf.rect(tableX, y, 1.5, 22, "F");

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(10);
    setText(pdf, C.ink);
    pdf.text(r.label, tableX + 6, y + 8);

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(7.5);
    setText(pdf, C.grayMute);
    pdf.text(r.note, tableX + 6, y + 14);

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(11);
    setText(pdf, C.ink);
    pdf.text(fmtPriceShort(r.value), tableX + 70, y + 11);

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9);
    setText(pdf, C.ink2);
    pdf.text(r.time, tableX + 110, y + 11);

    // Horizontal bar (visibility)
    const barX = tableX + 145;
    const barMaxW = tableW - 145 - 8;
    const barH = 4;
    setFill(pdf, C.grayLine);
    rr(pdf, barX, y + 9, barMaxW, barH, 1, "F");
    setFill(pdf, r.color);
    rr(pdf, barX, y + 9, barMaxW * (r.pct / 100), barH, 1, "F");
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(7.5);
    setText(pdf, r.color);
    pdf.text(`${r.pct}%`, tableX + tableW - 5, y + 17, { align: "right" });

    y += 25;
  });

  // Recommendation footer
  setFill(pdf, C.greenSoft);
  rr(pdf, M, y + 4, W - M * 2, 22, 2.5, "F");
  setFill(pdf, C.green);
  pdf.rect(M, y + 4, 1.5, 22, "F");

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(8);
  setText(pdf, C.green);
  pdf.text("RECOMENDAÇÃO CAPIMOBI", M + 6, y + 12);

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);
  setText(pdf, C.ink);
  pdf.text(`Anunciar em ${fmtPrice(base)} — preço alinhado ao mercado regional para maximizar liquidez e lucro.`, M + 6, y + 19);
}

// ═══════════════════════════════════════════════════════════════════════
// PAGE 6 — VALUATION OPPORTUNITIES
// ═══════════════════════════════════════════════════════════════════════
function drawValuation(pdf: jsPDF, y: number) {
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9.5);
  setText(pdf, C.grayMute);
  const intro = pdf.splitTextToSize(
    "Pequenas intervenções com retorno mensurável. Investimentos inteligentes que aumentam o valor percebido pelo comprador.",
    W - M * 2
  );
  pdf.text(intro, M, y);
  y += intro.length * 5 + 8;

  const items = [
    { t: "Pintura nova",        pct: 8,  d: "Paredes claras valorizam a percepção de espaço." },
    { t: "Reforma simples",     pct: 12, d: "Atualização de pisos, louças e bancadas." },
    { t: "Organização",         pct: 4,  d: "Home staging básico — remove excesso visual." },
    { t: "Fotos profissionais", pct: 6,  d: "Aumenta cliques no anúncio em até 3x." },
    { t: "Pequenos reparos",    pct: 5,  d: "Vazamentos, pintura, fechaduras, portas." },
  ];

  const totalPct = items.reduce((s, i) => s + i.pct, 0);

  const rowH = 22;
  items.forEach((it, i) => {
    const cy = y + i * (rowH + 4);
    setFill(pdf, C.white);
    rr(pdf, M, cy, W - M * 2, rowH, 2.5, "F");
    setDraw(pdf, C.grayLine);
    pdf.setLineWidth(0.3);
    rr(pdf, M, cy, W - M * 2, rowH, 2.5, "S");

    // % chip
    setFill(pdf, C.green);
    rr(pdf, M + 5, cy + 5, 18, 12, 2, "F");
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(10);
    setText(pdf, C.white);
    pdf.text(`+${it.pct}%`, M + 14, cy + 13, { align: "center" });

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(10);
    setText(pdf, C.ink);
    pdf.text(it.t, M + 28, cy + 9);

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8);
    setText(pdf, C.grayMute);
    pdf.text(it.d, M + 28, cy + 15);
  });

  y += items.length * (rowH + 4) + 6;

  // Total potential
  setFill(pdf, C.navy);
  rr(pdf, M, y, W - M * 2, 26, 2.5, "F");

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(7.5);
  setText(pdf, C.gold);
  pdf.text("POTENCIAL TOTAL DE VALORIZAÇÃO", M + 8, y + 9);

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(20);
  setText(pdf, C.white);
  pdf.text(`Até +${totalPct}%`, M + 8, y + 20);

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(8.5);
  setText(pdf, [203, 213, 225]);
  pdf.text("Combinando todas as melhorias acima · estimativa de mercado", W - M - 8, y + 16, { align: "right" });
}

// ═══════════════════════════════════════════════════════════════════════
// PAGE 7 — LOCATION
// ═══════════════════════════════════════════════════════════════════════
function drawLocation(pdf: jsPDF, data: ProposalData, mapImg: string | null, y: number) {
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9.5);
  setText(pdf, C.grayMute);
  pdf.text(data.location, M, y);
  y += 8;

  // Map card
  const mapH = 130;
  setFill(pdf, C.white);
  rr(pdf, M, y, W - M * 2, mapH + 6, 3, "F");
  setDraw(pdf, C.grayLine);
  pdf.setLineWidth(0.3);
  rr(pdf, M, y, W - M * 2, mapH + 6, 3, "S");

  if (mapImg) {
    try { pdf.addImage(mapImg, "JPEG", M + 3, y + 3, W - M * 2 - 6, mapH, undefined, "FAST"); }
    catch { /* skip */ }
  } else {
    setFill(pdf, C.bg);
    rr(pdf, M + 3, y + 3, W - M * 2 - 6, mapH, 2, "F");
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9);
    setText(pdf, C.grayMute);
    pdf.text("Mapa indisponível", W / 2, y + 3 + mapH / 2, { align: "center" });
  }
  y += mapH + 12;

  // Open in Maps button
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(data.location)}`;
  setFill(pdf, C.blue);
  rr(pdf, M, y, W - M * 2, 12, 2.5, "F");
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(10);
  setText(pdf, C.white);
  pdf.text("Abrir no Google Maps  →", W / 2, y + 8, { align: "center" });
  pdf.link(M, y, W - M * 2, 12, { url: mapsUrl });
}

// ═══════════════════════════════════════════════════════════════════════
// PAGE FINAL — CTA
// ═══════════════════════════════════════════════════════════════════════
function drawClosingCta(pdf: jsPDF, data: ProposalData, qrImg: string | null) {
  // Full dark background
  setFill(pdf, C.navyDeep);
  pdf.rect(0, 0, W, H, "F");

  // Subtle gold corner mark
  setFill(pdf, C.gold);
  pdf.rect(M, M, 14, 0.8, "F");

  // Brand
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(8);
  setText(pdf, C.white);
  pdf.text("CAPIMOBI", M, M + 6);

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(7);
  setText(pdf, [148, 163, 184]);
  pdf.text("INTELIGÊNCIA IMOBILIÁRIA", M, M + 11);

  // Eyebrow
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(8);
  setText(pdf, C.gold);
  pdf.text("PRÓXIMO PASSO", M, 70);

  // Big headline
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(28);
  setText(pdf, C.white);
  pdf.text("Seu imóvel merece", M, 84);
  pdf.text("estratégia profissional.", M, 98);

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(11);
  setText(pdf, [203, 213, 225]);
  const sub = pdf.splitTextToSize(
    "Fale agora com a equipe Capimobi e comece o plano de venda em até 24 horas.",
    W - M * 2
  );
  pdf.text(sub, M, 110);

  // Contact card
  let cy = 130;
  setFill(pdf, [255, 255, 255]);
  pdf.setGState(pdf.GState({ opacity: 0.06 }));
  rr(pdf, M, cy, W - M * 2, 60, 3, "F");
  pdf.setGState(pdf.GState({ opacity: 1 }));
  setDraw(pdf, [55, 78, 120]);
  pdf.setLineWidth(0.3);
  rr(pdf, M, cy, W - M * 2, 60, 3, "S");

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(7);
  setText(pdf, C.gold);
  pdf.text("CORRETOR RESPONSÁVEL", M + 8, cy + 9);

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(15);
  setText(pdf, C.white);
  pdf.text(data.sellerName, M + 8, cy + 19);

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);
  setText(pdf, [148, 163, 184]);
  pdf.text(catLabel(data.sellerCategory), M + 8, cy + 25);

  // Contact rows
  let ry = cy + 35;
  if (data.sellerPhone) {
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(8);
    setText(pdf, [148, 163, 184]);
    pdf.text("WHATSAPP", M + 8, ry);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(11);
    setText(pdf, C.white);
    pdf.text(data.sellerPhone, M + 8, ry + 6);
  }

  if (data.sellerInstagram) {
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(8);
    setText(pdf, [148, 163, 184]);
    pdf.text("INSTAGRAM", M + 75, ry);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(11);
    setText(pdf, C.white);
    pdf.text(data.sellerInstagram, M + 75, ry + 6);
  }

  if (data.sellerSiteUrl || data.propertyUrl) {
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(8);
    setText(pdf, [148, 163, 184]);
    pdf.text("SITE", M + 130, ry);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(10);
    setText(pdf, C.white);
    const site = data.sellerSiteUrl || "capimobi.com.br";
    pdf.text(site.replace(/^https?:\/\//, "").slice(0, 22), M + 130, ry + 6);
  }

  // Action buttons
  const bY = 205;
  const bW = (W - M * 2 - 6) / 2;
  const bH = 14;

  // Solicitar visita (WhatsApp green)
  if (data.sellerPhone) {
    const msg = encodeURIComponent(`Olá! Quero solicitar uma visita ao imóvel: ${data.title}`);
    const phone = data.sellerPhone.replace(/\D/g, "");
    const url = `https://wa.me/55${phone}?text=${msg}`;
    setFill(pdf, [37, 211, 102]);
    rr(pdf, M, bY, bW, bH, 3, "F");
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(11);
    setText(pdf, C.white);
    pdf.text("Solicitar visita", M + bW / 2, bY + 9, { align: "center" });
    pdf.link(M, bY, bW, bH, { url });
  }

  // Anunciar agora (gold)
  setFill(pdf, C.gold);
  rr(pdf, M + bW + 6, bY, bW, bH, 3, "F");
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(11);
  setText(pdf, C.ink);
  pdf.text("Anunciar agora  →", M + bW + 6 + bW / 2, bY + 9, { align: "center" });
  pdf.link(M + bW + 6, bY, bW, bH, { url: "https://capimobi.com.br/anunciar" });

  // QR + URL
  const qrSize = 30;
  const qrY = 230;
  if (qrImg) {
    setFill(pdf, C.white);
    rr(pdf, W - M - qrSize - 4, qrY - 2, qrSize + 4, qrSize + 4, 2, "F");
    try { pdf.addImage(qrImg, "PNG", W - M - qrSize - 2, qrY, qrSize, qrSize); } catch {}
  }

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(8);
  setText(pdf, C.gold);
  pdf.text("VER ANÚNCIO ONLINE", M, qrY + 8);

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(8);
  setText(pdf, [203, 213, 225]);
  const urlLines = pdf.splitTextToSize(data.propertyUrl, W - M * 2 - qrSize - 14);
  pdf.text(urlLines.slice(0, 3), M, qrY + 14);
  pdf.link(M, qrY + 10, W - M * 2 - qrSize - 14, 10, { url: data.propertyUrl });

  // Bottom hairline
  setDraw(pdf, [55, 78, 120]);
  pdf.setLineWidth(0.3);
  pdf.line(M, H - 16, W - M, H - 16);

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(7);
  setText(pdf, C.white);
  pdf.text("CAPIMOBI", M, H - 9);
  pdf.setFont("helvetica", "normal");
  setText(pdf, [148, 163, 184]);
  pdf.text("  ·  Inteligência Imobiliária", M + pdf.getTextWidth("CAPIMOBI"), H - 9);

  pdf.setFont("helvetica", "normal");
  setText(pdf, [148, 163, 184]);
  pdf.text(`Proposta gerada em ${new Date().toLocaleDateString("pt-BR")}`, W - M, H - 9, { align: "right" });
}
