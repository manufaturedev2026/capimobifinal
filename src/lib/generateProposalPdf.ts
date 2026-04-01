import jsPDF from "jspdf";

interface ProposalData {
  id: string;
  title: string;
  price: number;
  image: string;
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
}

function fmtPrice(price: number): string {
  return price.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function getTagInfo(tag: string): { label: string; color: [number, number, number] } {
  const map: Record<string, { label: string; color: [number, number, number] }> = {
    premium: { label: "Premium", color: [139, 92, 246] },
    luxo: { label: "Luxo", color: [139, 92, 246] },
    em_destaque: { label: "Destaque", color: [249, 115, 22] },
    novo: { label: "Novo", color: [34, 197, 94] },
    oferta: { label: "Oferta", color: [239, 68, 68] },
    exclusivo: { label: "Exclusivo", color: [168, 85, 247] },
    lancamento: { label: "Lançamento", color: [59, 130, 246] },
    pronto_para_morar: { label: "Pronto p/ Morar", color: [34, 197, 94] },
    oportunidade: { label: "Oportunidade", color: [234, 179, 8] },
    alto_padrao: { label: "Alto Padrão", color: [168, 85, 247] },
    aceita_financiamento_tag: { label: "Aceita Financ.", color: [59, 130, 246] },
  };
  return map[tag] || { label: tag.replace(/_/g, " "), color: [107, 114, 128] };
}

async function loadImg(url: string): Promise<string | null> {
  if (!url) return null;
  try {
    // Try loading via Image element (handles CORS better for same-origin/allowed origins)
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
        try {
          resolve(canvas.toDataURL("image/jpeg", 0.85));
        } catch {
          resolve(null);
        }
      };
      img.onerror = () => resolve(null);
      img.src = url;
    });
  } catch {
    return null;
  }
}

function drawRoundedRect(pdf: jsPDF, x: number, y: number, w: number, h: number, r: number, style: "F" | "S" | "FD") {
  pdf.roundedRect(x, y, w, h, r, r, style);
}

export async function generateProposalPdf(data: ProposalData) {
  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const W = 210;
  const H = 297;
  const M = 14; // margin
  const cX = M;
  const cW = W - M * 2;

  // ── Page background ──
  pdf.setFillColor(240, 242, 245);
  pdf.rect(0, 0, W, H, "F");

  // ── Dark header ──
  pdf.setFillColor(15, 23, 42);
  pdf.rect(0, 0, W, 26, "F");

  // Accent line under header
  pdf.setFillColor(16, 185, 129);
  pdf.rect(0, 26, W, 1.2, "F");

  // Header text
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(16);
  pdf.setTextColor(255, 255, 255);
  pdf.text("ES Corretores", M + 2, 16);

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(8);
  pdf.setTextColor(148, 163, 184);
  pdf.text("Proposta Comercial", W - M - 2, 16, { align: "right" });

  // ── Main white card ──
  let y = 32;
  const cardTop = y;
  // We'll draw the card at the end so we know the height

  y += 5; // padding top

  // ── Property image ──
  const imgH = 72;
  const imgX = cX + 5;
  const imgW = cW - 10;
  const propertyImg = await loadImg(data.image);

  if (propertyImg) {
    try {
      // Clip with rounded corners by drawing a white rect first as mask
      pdf.addImage(propertyImg, "JPEG", imgX, y, imgW, imgH, undefined, "MEDIUM");
    } catch { /* skip */ }
  } else {
    pdf.setFillColor(226, 232, 240);
    drawRoundedRect(pdf, imgX, y, imgW, imgH, 3, "F");
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(10);
    pdf.setTextColor(148, 163, 184);
    pdf.text("Imagem não disponível", imgX + imgW / 2, y + imgH / 2, { align: "center" });
  }

  y += imgH + 6;

  // ── Badges row ──
  let bx = cX + 6;
  const by = y;

  // Status
  if (data.status === "vendido") {
    pdf.setFillColor(239, 68, 68);
    const lbl = "VENDIDO";
    const lw = pdf.getStringUnitWidth(lbl) * 7 / pdf.internal.scaleFactor + 5;
    drawRoundedRect(pdf, bx, by, lw, 6.5, 1.5, "F");
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(7);
    pdf.setTextColor(255, 255, 255);
    pdf.text(lbl, bx + 2.5, by + 4.5);
    bx += lw + 2.5;
  } else {
    pdf.setFillColor(34, 197, 94);
    const lbl = "DISPONÍVEL";
    const lw = pdf.getStringUnitWidth(lbl) * 7 / pdf.internal.scaleFactor + 5;
    drawRoundedRect(pdf, bx, by, lw, 6.5, 1.5, "F");
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(7);
    pdf.setTextColor(255, 255, 255);
    pdf.text(lbl, bx + 2.5, by + 4.5);
    bx += lw + 2.5;
  }

  (data.tags || []).slice(0, 3).forEach((tag) => {
    const info = getTagInfo(tag);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(7);
    const lw = pdf.getStringUnitWidth(info.label) * 7 / pdf.internal.scaleFactor + 5;
    pdf.setFillColor(...info.color);
    drawRoundedRect(pdf, bx, by, lw, 6.5, 1.5, "F");
    pdf.setTextColor(255, 255, 255);
    pdf.text(info.label, bx + 2.5, by + 4.5);
    bx += lw + 2.5;
  });

  y += 11;

  // ── Title ──
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(15);
  pdf.setTextColor(15, 23, 42);
  const titleLines = pdf.splitTextToSize(data.title, cW - 12);
  pdf.text(titleLines, cX + 6, y);
  y += titleLines.length * 6.5 + 3;

  // ── Price ──
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(18);
  pdf.setTextColor(16, 185, 129);
  pdf.text(fmtPrice(data.price), cX + 6, y);
  y += 8;

  // ── Location ──
  if (data.location) {
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9);
    pdf.setTextColor(100, 116, 139);
    pdf.text(data.location, cX + 6, y);
    y += 5.5;
  }

  // ── Specs pills ──
  const specs: string[] = [];
  if (data.bedrooms) specs.push(`${data.bedrooms} Quartos`);
  if (data.suites) specs.push(`${data.suites} Suítes`);
  if (data.bathrooms) specs.push(`${data.bathrooms} Banheiros`);
  if (data.parking_spots) specs.push(`${data.parking_spots} Vagas`);
  if (data.area) specs.push(`${data.area} m²`);

  if (specs.length > 0) {
    y += 2;
    let sx = cX + 6;
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8);
    specs.forEach((spec) => {
      const sw = pdf.getStringUnitWidth(spec) * 8 / pdf.internal.scaleFactor + 6;
      pdf.setFillColor(241, 245, 249);
      drawRoundedRect(pdf, sx, y, sw, 7, 2, "F");
      pdf.setTextColor(51, 65, 85);
      pdf.text(spec, sx + 3, y + 5);
      sx += sw + 2.5;
    });
    y += 11;
  }

  // ── Divider ──
  y += 1;
  pdf.setDrawColor(226, 232, 240);
  pdf.setLineWidth(0.3);
  pdf.line(cX + 6, y, cX + cW - 6, y);
  y += 5;

  // ── Description ──
  if (data.description) {
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(10);
    pdf.setTextColor(15, 23, 42);
    pdf.text("Descrição", cX + 6, y);
    y += 5;

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8.5);
    pdf.setTextColor(71, 85, 105);
    const descLines = pdf.splitTextToSize(data.description.slice(0, 500), cW - 12);
    const maxLines = Math.min(descLines.length, 7);
    pdf.text(descLines.slice(0, maxLines), cX + 6, y);
    y += maxLines * 4 + 4;
  }

  // ── Divider ──
  pdf.setDrawColor(226, 232, 240);
  pdf.line(cX + 6, y, cX + cW - 6, y);
  y += 5;

  // ── Seller section ──
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(10);
  pdf.setTextColor(15, 23, 42);
  pdf.text("Corretor / Imobiliária", cX + 6, y);
  y += 6;

  // Seller card mini
  const sellerCardY = y;
  pdf.setFillColor(248, 250, 252);
  drawRoundedRect(pdf, cX + 6, sellerCardY, cW - 12, 22, 3, "F");
  pdf.setDrawColor(226, 232, 240);
  pdf.setLineWidth(0.2);
  drawRoundedRect(pdf, cX + 6, sellerCardY, cW - 12, 22, 3, "S");

  // Seller logo
  const logoSize = 14;
  const logoX = cX + 10;
  const logoY = sellerCardY + 4;
  const sellerLogoImg = await loadImg(data.sellerLogo);

  if (sellerLogoImg) {
    try {
      pdf.addImage(sellerLogoImg, "JPEG", logoX, logoY, logoSize, logoSize, undefined, "MEDIUM");
    } catch {
      // Fallback initial
      pdf.setFillColor(226, 232, 240);
      drawRoundedRect(pdf, logoX, logoY, logoSize, logoSize, 2, "F");
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(11);
      pdf.setTextColor(100, 116, 139);
      pdf.text(data.sellerName.charAt(0).toUpperCase(), logoX + 4.5, logoY + 10);
    }
  } else {
    pdf.setFillColor(226, 232, 240);
    drawRoundedRect(pdf, logoX, logoY, logoSize, logoSize, 2, "F");
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(11);
    pdf.setTextColor(100, 116, 139);
    pdf.text(data.sellerName.charAt(0).toUpperCase(), logoX + 4.5, logoY + 10);
  }

  const stX = logoX + logoSize + 4;
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(10);
  pdf.setTextColor(15, 23, 42);
  pdf.text(data.sellerName, stX, sellerCardY + 10);

  const catLabels: Record<string, string> = {
    imobiliaria: "Imobiliária",
    corretor: "Corretor(a) de Imóveis",
    proprietario: "Proprietário",
    autonomo: "Autônomo",
  };
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(8);
  pdf.setTextColor(100, 116, 139);
  const catLabel = catLabels[data.sellerCategory] || "Corretor";
  const phoneLabel = data.sellerPhone ? `  •  ${data.sellerPhone}` : "";
  pdf.text(catLabel + phoneLabel, stX, sellerCardY + 16);

  y = sellerCardY + 27;

  // ── WhatsApp button ──
  if (data.sellerPhone) {
    const whatsMsg = encodeURIComponent(`Olá! Tenho interesse no imóvel: ${data.title}`);
    const whatsPhone = data.sellerPhone.replace(/\D/g, "");
    const whatsUrl = `https://wa.me/55${whatsPhone}?text=${whatsMsg}`;

    pdf.setFillColor(37, 211, 102);
    drawRoundedRect(pdf, cX + 6, y, cW - 12, 11, 3, "F");
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(10);
    pdf.setTextColor(255, 255, 255);
    pdf.textWithLink("Chamar no WhatsApp", cX + cW / 2 - 18, y + 7.5, { url: whatsUrl });
    y += 15;
  }

  // ── QR Code footer ──
  pdf.setDrawColor(226, 232, 240);
  pdf.line(cX + 6, y, cX + cW - 6, y);
  y += 4;

  const qrSize = 28;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(data.propertyUrl)}&format=png&margin=4`;
  const qrImg = await loadImg(qrUrl);

  const qrX = cX + cW - 6 - qrSize;
  if (qrImg) {
    try {
      pdf.addImage(qrImg, "PNG", qrX, y, qrSize, qrSize);
    } catch { /* skip */ }
  }

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(9);
  pdf.setTextColor(15, 23, 42);
  pdf.text("Acesse o anúncio online", cX + 6, y + 5);

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(7);
  pdf.setTextColor(100, 116, 139);
  const urlLines = pdf.splitTextToSize(data.propertyUrl, cW - qrSize - 20);
  pdf.text(urlLines, cX + 6, y + 10);
  pdf.text("Escaneie o QR Code", cX + 6, y + 18);

  y += qrSize + 4;

  // ── Now draw the white card background BEHIND everything ──
  // We need to redraw, so instead we draw it first. Since jsPDF doesn't support z-index,
  // we rebuild the approach: draw card bg first, then content.
  // Actually let's just compute cardHeight and redraw.

  const cardH = y - cardTop + 4;

  // Create a new PDF with proper layering
  const final = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  // Page bg
  final.setFillColor(240, 242, 245);
  final.rect(0, 0, W, H, "F");

  // Header
  final.setFillColor(15, 23, 42);
  final.rect(0, 0, W, 26, "F");
  final.setFillColor(16, 185, 129);
  final.rect(0, 26, W, 1.2, "F");

  final.setFont("helvetica", "bold");
  final.setFontSize(16);
  final.setTextColor(255, 255, 255);
  final.text("LojaES", M + 2, 16);
  final.setFont("helvetica", "normal");
  final.setFontSize(8);
  final.setTextColor(148, 163, 184);
  final.text("Proposta Comercial", W - M - 2, 16, { align: "right" });

  // White card with shadow
  final.setFillColor(255, 255, 255);
  drawRoundedRect(final, cX, cardTop, cW, cardH, 4, "F");
  // Shadow border
  final.setDrawColor(203, 213, 225);
  final.setLineWidth(0.25);
  drawRoundedRect(final, cX, cardTop, cW, cardH, 4, "S");

  // Copy all content from pdf's internal pages to final
  // Actually, let's just use the first pdf directly and insert the card bg at the right layer.
  // Since jsPDF doesn't support layers, the simplest fix: generate everything in correct order.

  // Let me just regenerate all content on `final` directly:
  let fy = cardTop + 5;

  // Property image
  if (propertyImg) {
    try {
      final.addImage(propertyImg, "JPEG", imgX, fy, imgW, imgH, undefined, "MEDIUM");
    } catch { /* skip */ }
  } else {
    final.setFillColor(226, 232, 240);
    drawRoundedRect(final, imgX, fy, imgW, imgH, 3, "F");
    final.setFont("helvetica", "normal");
    final.setFontSize(10);
    final.setTextColor(148, 163, 184);
    final.text("Imagem não disponível", imgX + imgW / 2, fy + imgH / 2, { align: "center" });
  }
  fy += imgH + 6;

  // Badges
  let fbx = cX + 6;
  if (data.status === "vendido") {
    final.setFillColor(239, 68, 68);
    final.setFont("helvetica", "bold"); final.setFontSize(7);
    const lbl = "VENDIDO";
    const lw = final.getStringUnitWidth(lbl) * 7 / final.internal.scaleFactor + 5;
    drawRoundedRect(final, fbx, fy, lw, 6.5, 1.5, "F");
    final.setTextColor(255, 255, 255);
    final.text(lbl, fbx + 2.5, fy + 4.5);
    fbx += lw + 2.5;
  } else {
    final.setFillColor(34, 197, 94);
    final.setFont("helvetica", "bold"); final.setFontSize(7);
    const lbl = "DISPONÍVEL";
    const lw = final.getStringUnitWidth(lbl) * 7 / final.internal.scaleFactor + 5;
    drawRoundedRect(final, fbx, fy, lw, 6.5, 1.5, "F");
    final.setTextColor(255, 255, 255);
    final.text(lbl, fbx + 2.5, fy + 4.5);
    fbx += lw + 2.5;
  }
  (data.tags || []).slice(0, 3).forEach((tag) => {
    const info = getTagInfo(tag);
    final.setFont("helvetica", "bold"); final.setFontSize(7);
    const lw = final.getStringUnitWidth(info.label) * 7 / final.internal.scaleFactor + 5;
    final.setFillColor(...info.color);
    drawRoundedRect(final, fbx, fy, lw, 6.5, 1.5, "F");
    final.setTextColor(255, 255, 255);
    final.text(info.label, fbx + 2.5, fy + 4.5);
    fbx += lw + 2.5;
  });
  fy += 11;

  // Title
  final.setFont("helvetica", "bold"); final.setFontSize(15);
  final.setTextColor(15, 23, 42);
  const tLines = final.splitTextToSize(data.title, cW - 12);
  final.text(tLines, cX + 6, fy);
  fy += tLines.length * 6.5 + 3;

  // Price
  final.setFont("helvetica", "bold"); final.setFontSize(18);
  final.setTextColor(16, 185, 129);
  final.text(fmtPrice(data.price), cX + 6, fy);
  fy += 8;

  // Location
  if (data.location) {
    final.setFont("helvetica", "normal"); final.setFontSize(9);
    final.setTextColor(100, 116, 139);
    final.text(data.location, cX + 6, fy);
    fy += 5.5;
  }

  // Specs
  if (specs.length > 0) {
    fy += 2;
    let sx = cX + 6;
    final.setFont("helvetica", "normal"); final.setFontSize(8);
    specs.forEach((spec) => {
      const sw = final.getStringUnitWidth(spec) * 8 / final.internal.scaleFactor + 6;
      final.setFillColor(241, 245, 249);
      drawRoundedRect(final, sx, fy, sw, 7, 2, "F");
      final.setTextColor(51, 65, 85);
      final.text(spec, sx + 3, fy + 5);
      sx += sw + 2.5;
    });
    fy += 11;
  }

  // Divider
  fy += 1;
  final.setDrawColor(226, 232, 240); final.setLineWidth(0.3);
  final.line(cX + 6, fy, cX + cW - 6, fy);
  fy += 5;

  // Description
  if (data.description) {
    final.setFont("helvetica", "bold"); final.setFontSize(10);
    final.setTextColor(15, 23, 42);
    final.text("Descrição", cX + 6, fy);
    fy += 5;
    final.setFont("helvetica", "normal"); final.setFontSize(8.5);
    final.setTextColor(71, 85, 105);
    const dLines = final.splitTextToSize(data.description.slice(0, 500), cW - 12);
    const mx = Math.min(dLines.length, 7);
    final.text(dLines.slice(0, mx), cX + 6, fy);
    fy += mx * 4 + 4;
  }

  // Divider
  final.setDrawColor(226, 232, 240);
  final.line(cX + 6, fy, cX + cW - 6, fy);
  fy += 5;

  // Seller
  final.setFont("helvetica", "bold"); final.setFontSize(10);
  final.setTextColor(15, 23, 42);
  final.text("Corretor / Imobiliária", cX + 6, fy);
  fy += 6;

  const scY = fy;
  final.setFillColor(248, 250, 252);
  drawRoundedRect(final, cX + 6, scY, cW - 12, 22, 3, "F");
  final.setDrawColor(226, 232, 240); final.setLineWidth(0.2);
  drawRoundedRect(final, cX + 6, scY, cW - 12, 22, 3, "S");

  const fLogoX = cX + 10;
  const fLogoY = scY + 4;
  if (sellerLogoImg) {
    try {
      final.addImage(sellerLogoImg, "JPEG", fLogoX, fLogoY, logoSize, logoSize, undefined, "MEDIUM");
    } catch {
      final.setFillColor(226, 232, 240);
      drawRoundedRect(final, fLogoX, fLogoY, logoSize, logoSize, 2, "F");
      final.setFont("helvetica", "bold"); final.setFontSize(11);
      final.setTextColor(100, 116, 139);
      final.text(data.sellerName.charAt(0).toUpperCase(), fLogoX + 4.5, fLogoY + 10);
    }
  } else {
    final.setFillColor(226, 232, 240);
    drawRoundedRect(final, fLogoX, fLogoY, logoSize, logoSize, 2, "F");
    final.setFont("helvetica", "bold"); final.setFontSize(11);
    final.setTextColor(100, 116, 139);
    final.text(data.sellerName.charAt(0).toUpperCase(), fLogoX + 4.5, fLogoY + 10);
  }

  const fsX = fLogoX + logoSize + 4;
  final.setFont("helvetica", "bold"); final.setFontSize(10);
  final.setTextColor(15, 23, 42);
  final.text(data.sellerName, fsX, scY + 10);

  final.setFont("helvetica", "normal"); final.setFontSize(8);
  final.setTextColor(100, 116, 139);
  const catL = catLabels[data.sellerCategory] || "Corretor";
  const phL = data.sellerPhone ? `  •  ${data.sellerPhone}` : "";
  final.text(catL + phL, fsX, scY + 16);

  fy = scY + 27;

  // WhatsApp
  if (data.sellerPhone) {
    const whatsMsg = encodeURIComponent(`Olá! Tenho interesse no imóvel: ${data.title}`);
    const whatsPhone = data.sellerPhone.replace(/\D/g, "");
    const whatsUrl = `https://wa.me/55${whatsPhone}?text=${whatsMsg}`;
    final.setFillColor(37, 211, 102);
    drawRoundedRect(final, cX + 6, fy, cW - 12, 11, 3, "F");
    final.setFont("helvetica", "bold"); final.setFontSize(10);
    final.setTextColor(255, 255, 255);
    final.textWithLink("Chamar no WhatsApp", cX + cW / 2 - 18, fy + 7.5, { url: whatsUrl });
    fy += 15;
  }

  // QR
  final.setDrawColor(226, 232, 240);
  final.line(cX + 6, fy, cX + cW - 6, fy);
  fy += 4;

  const fqrX = cX + cW - 6 - qrSize;
  if (qrImg) {
    try {
      final.addImage(qrImg, "PNG", fqrX, fy, qrSize, qrSize);
    } catch { /* skip */ }
  }

  final.setFont("helvetica", "bold"); final.setFontSize(9);
  final.setTextColor(15, 23, 42);
  final.text("Acesse o anúncio online", cX + 6, fy + 5);
  final.setFont("helvetica", "normal"); final.setFontSize(7);
  final.setTextColor(100, 116, 139);
  const furlLines = final.splitTextToSize(data.propertyUrl, cW - qrSize - 20);
  final.text(furlLines, cX + 6, fy + 10);
  final.text("Escaneie o QR Code", cX + 6, fy + 18);

  // Footer
  final.setFont("helvetica", "normal"); final.setFontSize(7);
  final.setTextColor(156, 163, 175);
  final.text(`Proposta gerada em ${new Date().toLocaleDateString("pt-BR")}  •  LojaES`, W / 2, H - 8, { align: "center" });

  final.save(`proposta-${data.id}.pdf`);
}
