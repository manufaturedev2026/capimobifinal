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

function formatPrice(price: number): string {
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
  };
  return map[tag] || { label: tag.replace(/_/g, " "), color: [107, 114, 128] };
}

async function loadImageAsBase64(url: string): Promise<string | null> {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

export async function generateProposalPdf(data: ProposalData) {
  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageW = 210;
  const pageH = 297;
  const margin = 15;
  const cardX = margin;
  const cardW = pageW - margin * 2;

  // Background
  pdf.setFillColor(243, 244, 246);
  pdf.rect(0, 0, pageW, pageH, "F");

  // Header bar
  pdf.setFillColor(17, 24, 39);
  pdf.rect(0, 0, pageW, 28, "F");

  // Site name in header
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(18);
  pdf.setTextColor(255, 255, 255);
  pdf.text("LojaES", margin, 18);

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);
  pdf.setTextColor(200, 200, 200);
  pdf.text("Proposta Comercial de Imóvel", pageW - margin, 18, { align: "right" });

  let y = 36;

  // Main card
  const cardStartY = y;
  // We'll draw the card background after calculating height
  const cardContentStartY = y;

  // Property image
  const imgW = cardW;
  const imgH = 70;
  const propertyImg = await loadImageAsBase64(data.image);
  
  // Card background (will extend to bottom)
  pdf.setFillColor(255, 255, 255);
  
  if (propertyImg) {
    // Draw card bg first chunk
    pdf.roundedRect(cardX, cardStartY, cardW, imgH + 8, 4, 4, "F");
    try {
      pdf.addImage(propertyImg, "JPEG", cardX + 4, cardStartY + 4, imgW - 8, imgH, undefined, "MEDIUM");
    } catch {
      pdf.setFillColor(229, 231, 235);
      pdf.rect(cardX + 4, cardStartY + 4, imgW - 8, imgH, "F");
    }
  }

  y = cardStartY + imgH + 14;

  // Full card white bg
  const cardEndEstimate = 260;
  pdf.setFillColor(255, 255, 255);
  pdf.roundedRect(cardX, cardStartY, cardW, cardEndEstimate - cardStartY, 4, 4, "F");

  // Re-draw image on top of card
  if (propertyImg) {
    try {
      pdf.addImage(propertyImg, "JPEG", cardX + 4, cardStartY + 4, imgW - 8, imgH, undefined, "MEDIUM");
    } catch { /* skip */ }
  }

  // Shadow effect (subtle line)
  pdf.setDrawColor(220, 220, 220);
  pdf.setLineWidth(0.3);
  pdf.roundedRect(cardX, cardStartY, cardW, cardEndEstimate - cardStartY, 4, 4, "S");

  // Tags / Badges
  let tagX = cardX + 8;
  const tagY = y;
  
  // Status badge
  if (data.status === "vendido") {
    pdf.setFillColor(239, 68, 68);
    pdf.roundedRect(tagX, tagY - 4, 22, 7, 2, 2, "F");
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(7);
    pdf.setTextColor(255, 255, 255);
    pdf.text("VENDIDO", tagX + 2, tagY + 1);
    tagX += 25;
  } else {
    pdf.setFillColor(34, 197, 94);
    pdf.roundedRect(tagX, tagY - 4, 25, 7, 2, 2, "F");
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(7);
    pdf.setTextColor(255, 255, 255);
    pdf.text("Disponível", tagX + 2, tagY + 1);
    tagX += 28;
  }

  // Dynamic tags
  (data.tags || []).slice(0, 3).forEach((tag) => {
    const info = getTagInfo(tag);
    const [r, g, b] = info.color;
    const labelW = pdf.getTextWidth(info.label) + 4;
    pdf.setFillColor(r, g, b);
    pdf.roundedRect(tagX, tagY - 4, labelW, 7, 2, 2, "F");
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(7);
    pdf.text(info.label, tagX + 2, tagY + 1);
    tagX += labelW + 3;
  });

  y += 8;

  // Title
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(16);
  pdf.setTextColor(17, 24, 39);
  const titleLines = pdf.splitTextToSize(data.title, cardW - 16);
  pdf.text(titleLines, cardX + 8, y);
  y += titleLines.length * 7 + 2;

  // Price
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(20);
  pdf.setTextColor(16, 185, 129);
  pdf.text(formatPrice(data.price), cardX + 8, y);
  y += 10;

  // Location
  if (data.location) {
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(10);
    pdf.setTextColor(107, 114, 128);
    pdf.text(`📍 ${data.location}`, cardX + 8, y);
    y += 7;
  }

  // Specs
  const specs: string[] = [];
  if (data.bedrooms) specs.push(`${data.bedrooms} quarto(s)`);
  if (data.suites) specs.push(`${data.suites} suíte(s)`);
  if (data.bathrooms) specs.push(`${data.bathrooms} banheiro(s)`);
  if (data.parking_spots) specs.push(`${data.parking_spots} vaga(s)`);
  if (data.area) specs.push(`${data.area}m²`);

  if (specs.length > 0) {
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9);
    pdf.setTextColor(75, 85, 99);
    pdf.text(specs.join("  •  "), cardX + 8, y);
    y += 7;
  }

  // Separator
  y += 2;
  pdf.setDrawColor(229, 231, 235);
  pdf.setLineWidth(0.3);
  pdf.line(cardX + 8, y, cardX + cardW - 8, y);
  y += 6;

  // Description
  if (data.description) {
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9);
    pdf.setTextColor(55, 65, 81);
    const descLines = pdf.splitTextToSize(data.description.slice(0, 600), cardW - 16);
    pdf.text(descLines.slice(0, 8), cardX + 8, y);
    y += Math.min(descLines.length, 8) * 4.5 + 4;
  }

  // Separator
  pdf.setDrawColor(229, 231, 235);
  pdf.line(cardX + 8, y, cardX + cardW - 8, y);
  y += 6;

  // Seller info section
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(11);
  pdf.setTextColor(17, 24, 39);
  pdf.text("Informações do Corretor", cardX + 8, y);
  y += 7;

  // Seller logo
  const sellerLogoImg = data.sellerLogo ? await loadImageAsBase64(data.sellerLogo) : null;
  if (sellerLogoImg) {
    try {
      pdf.addImage(sellerLogoImg, "JPEG", cardX + 8, y, 14, 14, undefined, "MEDIUM");
    } catch { /* skip */ }
  } else {
    pdf.setFillColor(229, 231, 235);
    pdf.roundedRect(cardX + 8, y, 14, 14, 2, 2, "F");
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(10);
    pdf.setTextColor(107, 114, 128);
    pdf.text(data.sellerName.charAt(0).toUpperCase(), cardX + 12, y + 9);
  }

  const sellerTextX = cardX + 26;
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(10);
  pdf.setTextColor(17, 24, 39);
  pdf.text(data.sellerName, sellerTextX, y + 5);

  const categoryLabels: Record<string, string> = {
    imobiliaria: "Imobiliária",
    corretor: "Corretor(a)",
    proprietario: "Proprietário",
    autonomo: "Autônomo",
  };
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(8);
  pdf.setTextColor(107, 114, 128);
  pdf.text(categoryLabels[data.sellerCategory] || data.sellerCategory || "Corretor", sellerTextX, y + 10);

  if (data.sellerPhone) {
    pdf.setFontSize(9);
    pdf.setTextColor(75, 85, 99);
    pdf.text(`📞 ${data.sellerPhone}`, sellerTextX, y + 15);
  }

  y += 22;

  // WhatsApp button
  const whatsMsg = encodeURIComponent(`Olá! Tenho interesse no imóvel: ${data.title}`);
  const whatsPhone = (data.sellerPhone || "").replace(/\D/g, "");
  const whatsUrl = `https://wa.me/55${whatsPhone}?text=${whatsMsg}`;

  pdf.setFillColor(37, 211, 102);
  pdf.roundedRect(cardX + 8, y, cardW - 16, 12, 3, 3, "F");
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(11);
  pdf.setTextColor(255, 255, 255);
  pdf.textWithLink("💬  Chamar no WhatsApp", cardX + (cardW / 2) - 22, y + 8, { url: whatsUrl });

  y += 18;

  // QR Code section
  const qrSize = 30;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(data.propertyUrl)}&format=png&margin=4`;
  const qrImg = await loadImageAsBase64(qrUrl);

  pdf.setDrawColor(229, 231, 235);
  pdf.line(cardX + 8, y, cardX + cardW - 8, y);
  y += 6;

  if (qrImg) {
    try {
      pdf.addImage(qrImg, "PNG", cardX + cardW - 8 - qrSize, y, qrSize, qrSize);
    } catch { /* skip */ }
  }

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(9);
  pdf.setTextColor(17, 24, 39);
  pdf.text("Acesse o anúncio online", cardX + 8, y + 6);

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(7);
  pdf.setTextColor(107, 114, 128);
  const urlLines = pdf.splitTextToSize(data.propertyUrl, cardW - qrSize - 24);
  pdf.text(urlLines, cardX + 8, y + 12);

  pdf.setFontSize(7);
  pdf.text("Escaneie o QR Code ao lado", cardX + 8, y + 20);

  // Footer
  const footerY = pageH - 10;
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(7);
  pdf.setTextColor(156, 163, 175);
  pdf.text(`Proposta gerada em ${new Date().toLocaleDateString("pt-BR")} • LojaES`, pageW / 2, footerY, { align: "center" });

  // Save
  pdf.save(`proposta-${data.id}.pdf`);
}
