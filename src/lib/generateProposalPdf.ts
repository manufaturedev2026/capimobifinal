import jsPDF from "jspdf";
import { supabase } from "@/integrations/supabase/client";

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
  cep?: string | null;
}

// ─── CAPIMOBI Premium Palette ───────────────────────────────────────────
const C = {
  white:        [255, 255, 255] as [number, number, number],
  bg:           [248, 250, 252] as [number, number, number],
  ink:          [10, 15, 30]    as [number, number, number],
  ink2:         [30, 41, 59]    as [number, number, number],
  navy:         [12, 32, 64]    as [number, number, number],
  navyDeep:     [6, 18, 42]     as [number, number, number],
  blue:         [30, 64, 175]   as [number, number, number],
  blueSoft:     [219, 234, 254] as [number, number, number],
  green:        [16, 163, 96]   as [number, number, number],
  greenSoft:    [220, 252, 231] as [number, number, number],
  gold:         [193, 154, 73]  as [number, number, number],
  goldSoft:     [253, 246, 227] as [number, number, number],
  grayLine:     [226, 232, 240] as [number, number, number],
  grayMute:     [100, 116, 139] as [number, number, number],
  grayCard:     [241, 245, 249] as [number, number, number],
  grayDark:     [148, 163, 184] as [number, number, number],
};

const W = 210;
const H = 297;
const M = 16;

function fmtPrice(price: number): string {
  return price.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
}

async function loadImg(url: string): Promise<string | null> {
  if (!url) return null;
  try {
    return await new Promise<string | null>((resolve) => {
      const img = new window.Image();
      let settled = false;
      const finish = (value: string | null) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        resolve(value);
      };
      const timer = window.setTimeout(() => finish(null), 9000);
      img.crossOrigin = "anonymous";
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext("2d");
        if (!ctx) { finish(null); return; }
        ctx.drawImage(img, 0, 0);
        try { finish(canvas.toDataURL("image/jpeg", 0.88)); } catch { finish(null); }
      };
      img.onerror = () => finish(null);
      img.src = url;
    });
  } catch { return null; }
}

type MapCoords = { lat: number; lng: number };

function normalizeAddressForGeocoding(address: string) {
  return address
    .replace(/\bAv\.?\b/gi, "Avenida")
    .replace(/\bR\.?\b/gi, "Rua")
    .replace(/\bRod\.?\b/gi, "Rodovia")
    .replace(/\bTv\.?\b/gi, "Travessa")
    .replace(/\bAl\.?\b/gi, "Alameda")
    .replace(/\bEst\.?\b/gi, "Estrada")
    .replace(/\bES\b/gi, "Espírito Santo")
    .replace(/\s+/g, " ")
    .trim();
}

async function buildMapCandidates(location: string, cep?: string | null): Promise<string[]> {
  const normalized = normalizeAddressForGeocoding(location);
  const parts = normalized.split(",").map((part) => part.trim()).filter(Boolean);
  const [street, number, neighborhood, city, state] = parts;
  const cleanCep = (cep || "").replace(/\D/g, "");
  const candidates: string[] = [];
  const add = (value: string) => {
    const clean = value.replace(/\s+/g, " ").trim();
    if (clean && !candidates.includes(clean)) candidates.push(clean);
  };
  const br = (value: string) => value.toLowerCase().includes("brasil") ? value : `${value}, Brasil`;

  if (cleanCep.length === 8) {
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
      if (res.ok) {
        const viaCep = await res.json();
        if (!viaCep.erro && viaCep.logradouro) {
          const cepStreet = viaCep.logradouro as string;
          const cepDistrict = (viaCep.bairro as string) || neighborhood || "";
          const cepCity = (viaCep.localidade as string) || city || "";
          const cepState = (viaCep.uf as string) || state || "";
          const cepFmt = `${cleanCep.slice(0, 5)}-${cleanCep.slice(5)}`;
          const streetWithNumber = number ? `${cepStreet}, ${number}` : cepStreet;
          add(br([streetWithNumber, cepDistrict, cepCity, cepState, cepFmt].filter(Boolean).join(", ")));
          add(br([cepStreet, cepDistrict, cepCity, cepState].filter(Boolean).join(", ")));
        }
      }
    } catch {
      /* CEP lookup is only a fallback source */
    }
  }

  add(br(normalized));
  add(br([street, number, neighborhood, city, state].filter(Boolean).join(", ")));
  add(br([street, neighborhood, city, state].filter(Boolean).join(", ")));
  add(br([neighborhood, city, state].filter(Boolean).join(", ")));
  add(br([city, state].filter(Boolean).join(", ")));
  return candidates;
}

async function geocodeWithGoogle(candidate: string): Promise<MapCoords | null> {
  try {
    const { data } = await supabase.functions.invoke("geocode-address", { body: { address: candidate } });
    const lat = Number((data as { lat?: number | string })?.lat);
    const lng = Number((data as { lng?: number | string })?.lng);
    return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null;
  } catch {
    return null;
  }
}

async function geocodeWithNominatim(candidate: string): Promise<MapCoords | null> {
  try {
    const geo = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=br&q=${encodeURIComponent(candidate)}`,
      { headers: { Accept: "application/json" } },
    );
    if (!geo.ok) return null;
    const arr = await geo.json();
    if (!Array.isArray(arr) || arr.length === 0) return null;
    const lat = parseFloat(arr[0].lat);
    const lng = parseFloat(arr[0].lon);
    return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null;
  } catch {
    return null;
  }
}

async function resolveMapCoords(location: string, cep?: string | null): Promise<MapCoords | null> {
  const candidates = await buildMapCandidates(location, cep);
  for (const candidate of candidates) {
    const coords = await geocodeWithGoogle(candidate);
    if (coords) return coords;
  }
  for (const candidate of candidates) {
    const coords = await geocodeWithNominatim(candidate);
    if (coords) return coords;
  }
  return null;
}

function loadTile(url: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new window.Image();
    let settled = false;
    const finish = (value: HTMLImageElement | null) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve(value);
    };
    const timer = window.setTimeout(() => finish(null), 7000);
    img.crossOrigin = "anonymous";
    img.onload = () => finish(img);
    img.onerror = () => finish(null);
    img.src = url;
  });
}

async function renderOsmTileMap({ lat, lng }: MapCoords): Promise<string | null> {
  try {
    const zoom = 15;
    const tileSize = 256;
    const width = 1200;
    const height = 720;
    const scale = 2 ** zoom;
    const lonToX = (lon: number) => ((lon + 180) / 360) * tileSize * scale;
    const latToY = (la: number) => {
      const sin = Math.sin((la * Math.PI) / 180);
      return (0.5 - Math.log((1 + sin) / (1 - sin)) / (4 * Math.PI)) * tileSize * scale;
    };
    const centerX = lonToX(lng);
    const centerY = latToY(lat);
    const startX = Math.floor((centerX - width / 2) / tileSize);
    const endX = Math.floor((centerX + width / 2) / tileSize);
    const startY = Math.floor((centerY - height / 2) / tileSize);
    const endY = Math.floor((centerY + height / 2) / tileSize);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.fillStyle = "#eef2f7";
    ctx.fillRect(0, 0, width, height);

    let loaded = 0;
    const maxTile = scale - 1;
    const jobs: Promise<void>[] = [];
    for (let x = startX; x <= endX; x++) {
      for (let y = startY; y <= endY; y++) {
        if (y < 0 || y > maxTile) continue;
        const wrappedX = ((x % scale) + scale) % scale;
        const drawX = Math.round(x * tileSize - (centerX - width / 2));
        const drawY = Math.round(y * tileSize - (centerY - height / 2));
        jobs.push(loadTile(`https://tile.openstreetmap.org/${zoom}/${wrappedX}/${y}.png`).then((tile) => {
          if (!tile) return;
          loaded += 1;
          ctx.drawImage(tile, drawX, drawY, tileSize, tileSize);
        }));
      }
    }
    await Promise.all(jobs);
    if (loaded === 0) return null;

    const pinX = width / 2;
    const pinY = height / 2;
    ctx.fillStyle = "rgba(10, 15, 30, 0.18)";
    ctx.beginPath();
    ctx.ellipse(pinX, pinY + 54, 34, 11, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#dc2626";
    ctx.beginPath();
    ctx.arc(pinX, pinY - 18, 31, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(pinX - 20, pinY + 2);
    ctx.lineTo(pinX + 20, pinY + 2);
    ctx.lineTo(pinX, pinY + 54);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(pinX, pinY - 18, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.86)";
    ctx.fillRect(16, height - 38, 188, 24);
    ctx.fillStyle = "#475569";
    ctx.font = "18px Arial";
    ctx.fillText("© OpenStreetMap", 28, height - 18);
    return canvas.toDataURL("image/jpeg", 0.88);
  } catch {
    return null;
  }
}

function rr(pdf: jsPDF, x: number, y: number, w: number, h: number, r: number, style: "F" | "S" | "FD") {
  pdf.roundedRect(x, y, w, h, r, r, style);
}

async function loadStaticMap(data: ProposalData): Promise<string | null> {
  if (!data.location) return null;
  const coords = await resolveMapCoords(data.location, data.cep);
  if (!coords) return null;

  try {
    const { data: keyData } = await supabase.functions.invoke("get-maps-key");
    const key = (keyData as { key?: string })?.key || "";
    if (key) {
      const googleUrl = `https://maps.googleapis.com/maps/api/staticmap?center=${coords.lat},${coords.lng}&zoom=15&size=1200x720&scale=2&maptype=roadmap&markers=color:red%7C${coords.lat},${coords.lng}&key=${encodeURIComponent(key)}`;
      const googleMap = await loadImg(googleUrl);
      if (googleMap) return googleMap;
    }
  } catch {
    /* OSM tile render below is the resilient fallback */
  }

  return await renderOsmTileMap(coords);
}

function setFill(pdf: jsPDF, c: [number, number, number]) { pdf.setFillColor(c[0], c[1], c[2]); }
function setDraw(pdf: jsPDF, c: [number, number, number]) { pdf.setDrawColor(c[0], c[1], c[2]); }
function setText(pdf: jsPDF, c: [number, number, number]) { pdf.setTextColor(c[0], c[1], c[2]); }

function isRental(data: ProposalData): boolean {
  const t = (data.tags || []).join(" ").toLowerCase();
  return t.includes("alug") || t.includes("locação") || t.includes("locacao");
}

function priceLabel(data: ProposalData): string {
  return isRental(data) ? `${fmtPrice(data.price)} / mês` : fmtPrice(data.price);
}

function propertyTypeLabel(data: ProposalData): string {
  const t = (data.tags || []).map(x => x.toLowerCase());
  const known = ["casa", "apartamento", "terreno", "cobertura", "sítio", "sitio", "chácara", "chacara", "fazenda", "sala comercial", "loja", "galpão", "galpao", "kitnet", "studio", "sobrado", "lote"];
  for (const k of known) {
    if (t.some(x => x.includes(k))) return k.charAt(0).toUpperCase() + k.slice(1);
  }
  // try title
  const titleLower = (data.title || "").toLowerCase();
  for (const k of known) {
    if (titleLower.includes(k)) return k.charAt(0).toUpperCase() + k.slice(1);
  }
  return "Imóvel";
}

function splitLocation(loc: string): { neighborhood: string; city: string } {
  if (!loc) return { neighborhood: "", city: "" };
  const parts = loc.split(/[·,•|-]/).map(p => p.trim()).filter(Boolean);
  if (parts.length >= 2) return { neighborhood: parts[0], city: parts.slice(1).join(", ") };
  return { neighborhood: "", city: parts[0] || loc };
}

// ─── Footer / Header ───────────────────────────────────────────────────
function drawFooter(pdf: jsPDF, pageNum: number, totalPages: number, dark = false) {
  const muted = dark ? C.grayDark : C.grayMute;
  const lineCol = dark ? [55, 78, 120] as [number, number, number] : C.grayLine;

  setDraw(pdf, lineCol);
  pdf.setLineWidth(0.2);
  pdf.line(M, H - 14, W - M, H - 14);

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(7.5);
  setText(pdf, dark ? C.white : C.ink);
  pdf.text("CAPIMOBI", M, H - 8);

  pdf.setFont("helvetica", "normal");
  setText(pdf, muted);
  pdf.text("  ·  Inteligência Imobiliária", M + pdf.getTextWidth("CAPIMOBI"), H - 8);

  setText(pdf, muted);
  pdf.text(`${pageNum} / ${totalPages}`, W - M, H - 8, { align: "right" });
}

function drawTopBar(pdf: jsPDF, label: string) {
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

  const heroImg = await loadImg(data.image);
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(data.propertyUrl)}&format=png&margin=2`;
  const qrImg = await loadImg(qrUrl);
  const mapImg = data.location ? await loadStaticMap(data) : null;

  const rental = isRental(data);
  // Pages: Cover, Specs, Differentials, (Financial only for sale), Location, CTA
  const totalPages = rental ? 5 : 6;

  let page = 1;

  // PAGE 1 — Cover
  drawCoverImpl(pdf, data, heroImg);
  drawFooter(pdf, page++, totalPages);

  // PAGE 2 — Specs
  pdf.addPage();
  drawTopBar(pdf, "Ficha Técnica");
  let y = 32;
  y = sectionTitle(pdf, "01 · O Imóvel", "Ficha Técnica", y);
  drawSpecs(pdf, data, y);
  drawFooter(pdf, page++, totalPages);

  // PAGE 3 — Differentials
  pdf.addPage();
  drawTopBar(pdf, "Diferenciais");
  y = 32;
  y = sectionTitle(pdf, "02 · Pontos Fortes", "Diferenciais do Imóvel", y);
  drawDifferentials(pdf, data, y);
  drawFooter(pdf, page++, totalPages);

  // PAGE 4 — Financial Simulation (only for sale)
  if (!rental) {
    pdf.addPage();
    drawTopBar(pdf, "Simulação Financeira");
    y = 32;
    y = sectionTitle(pdf, "03 · Financeiro", "Simulação de Financiamento", y);
    drawFinancing(pdf, data, y);
    drawFooter(pdf, page++, totalPages);
  }

  // PAGE 5 — Location
  pdf.addPage();
  drawTopBar(pdf, "Localização");
  y = 32;
  const stepNum = rental ? "03" : "04";
  y = sectionTitle(pdf, `${stepNum} · Localização`, "Localização Estratégica", y);
  drawLocation(pdf, data, mapImg, y);
  drawFooter(pdf, page++, totalPages);

  // PAGE FINAL — CTA
  pdf.addPage();
  drawClosingCta(pdf, data, qrImg);
  drawFooter(pdf, page++, totalPages, true);

  pdf.save(`imovel-capimobi-${data.id}.pdf`);
}

// ═══════════════════════════════════════════════════════════════════════
// PAGE 1 — COVER (Buyer-focused)
// ═══════════════════════════════════════════════════════════════════════
function drawCoverImpl(pdf: jsPDF, data: ProposalData, heroImg: string | null) {
  const heroH = 185;
  if (heroImg) {
    try { pdf.addImage(heroImg, "JPEG", 0, 0, W, heroH, undefined, "FAST"); }
    catch { setFill(pdf, C.navy); pdf.rect(0, 0, W, heroH, "F"); }
  } else {
    setFill(pdf, C.navy); pdf.rect(0, 0, W, heroH, "F");
  }

  // Dark gradient overlay (bottom)
  for (let i = 0; i < 18; i++) {
    pdf.setFillColor(6, 18, 42);
    pdf.setGState(pdf.GState({ opacity: 0.05 }));
    pdf.rect(0, heroH - 70 + i * 4, W, 8, "F");
  }
  pdf.setGState(pdf.GState({ opacity: 1 }));

  // Brand chip (top left)
  setFill(pdf, C.white);
  rr(pdf, M, 16, 38, 9, 1.5, "F");
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(9);
  setText(pdf, C.ink);
  pdf.text("CAPIMOBI", M + 4, 22);
  setFill(pdf, C.gold);
  pdf.rect(M + 4 + pdf.getTextWidth("CAPIMOBI") + 1.5, 19, 1.5, 1.5, "F");

  // "Oportunidade exclusiva" badge top right
  setFill(pdf, C.gold);
  rr(pdf, W - M - 56, 16, 56, 9, 1.5, "F");
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(8);
  setText(pdf, C.white);
  pdf.text("OPORTUNIDADE EXCLUSIVA", W - M - 28, 22, { align: "center" });

  // Property type chip on hero
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(8);
  setFill(pdf, C.white);
  const ptype = propertyTypeLabel(data);
  const tw = pdf.getTextWidth(ptype.toUpperCase()) + 8;
  rr(pdf, M, heroH - 50, tw, 7, 1.2, "F");
  setText(pdf, C.ink);
  pdf.text(ptype.toUpperCase(), M + 4, heroH - 45);

  // Title
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(24);
  setText(pdf, C.white);
  const titleLines = pdf.splitTextToSize(data.title, W - M * 2);
  pdf.text(titleLines.slice(0, 2), M, heroH - 30);

  // Location line
  if (data.location) {
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(10);
    setText(pdf, C.white);
    pdf.text(`${data.location}`, M, heroH - 14);
  }

  // White info panel below
  setFill(pdf, C.white);
  pdf.rect(0, heroH, W, H - heroH, "F");

  // Price block
  const priceY = heroH + 18;
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(7.5);
  setText(pdf, C.gold);
  pdf.text(isRental(data) ? "VALOR DO ALUGUEL" : "VALOR DE VENDA", M, priceY);

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(28);
  setText(pdf, C.ink);
  let val = priceLabel(data);
  pdf.text(val, M, priceY + 12);

  // Reference chip
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(7);
  setText(pdf, C.grayMute);
  pdf.text(`REF #${data.id.slice(0, 6).toUpperCase()}`, W - M, priceY + 12, { align: "right" });

  // Specs strip
  const stripY = priceY + 22;
  const specs: { k: string; v: string }[] = [];
  if (data.bedrooms) specs.push({ k: "Quartos", v: String(data.bedrooms) });
  if (data.bathrooms) specs.push({ k: "Banheiros", v: String(data.bathrooms) });
  if (data.parking_spots) specs.push({ k: "Vagas", v: String(data.parking_spots) });
  if (data.area) specs.push({ k: "Área", v: `${data.area} m²` });

  if (specs.length > 0) {
    setFill(pdf, C.bg);
    rr(pdf, M, stripY, W - M * 2, 22, 2.5, "F");
    const sw = (W - M * 2) / specs.length;
    specs.forEach((s, i) => {
      const sx = M + i * sw + sw / 2;
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(13);
      setText(pdf, C.ink);
      pdf.text(s.v, sx, stripY + 11, { align: "center" });
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(7.5);
      setText(pdf, C.grayMute);
      pdf.text(s.k.toUpperCase(), sx, stripY + 17, { align: "center" });
      // divider
      if (i < specs.length - 1) {
        setDraw(pdf, C.grayLine);
        pdf.setLineWidth(0.3);
        pdf.line(M + (i + 1) * sw, stripY + 5, M + (i + 1) * sw, stripY + 17);
      }
    });
  }

  // Footer tagline
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);
  setText(pdf, C.grayMute);
  pdf.text("Apresentação completa do imóvel · 6 páginas a seguir", M, H - 22);
}

// ═══════════════════════════════════════════════════════════════════════
// PAGE 2 — SPECS (Ficha Técnica)
// ═══════════════════════════════════════════════════════════════════════
function drawSpecs(pdf: jsPDF, data: ProposalData, y: number) {
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9.5);
  setText(pdf, C.grayMute);
  const intro = pdf.splitTextToSize(
    "Todos os detalhes técnicos para você avaliar o imóvel com clareza e tomar a melhor decisão.",
    W - M * 2
  );
  pdf.text(intro, M, y);
  y += intro.length * 5 + 8;

  // Big specs grid (2 columns x 3 rows)
  const items: { k: string; v: string; icon?: string }[] = [
    { k: "Tipo do Imóvel", v: propertyTypeLabel(data) },
    { k: "Área Construída", v: data.area ? `${data.area} m²` : "—" },
    { k: "Quartos", v: data.bedrooms ? String(data.bedrooms) : "—" },
    { k: "Suítes", v: data.suites ? String(data.suites) : "—" },
    { k: "Banheiros", v: data.bathrooms ? String(data.bathrooms) : "—" },
    { k: "Vagas de Garagem", v: data.parking_spots ? String(data.parking_spots) : "—" },
  ];

  const cols = 2;
  const cardW = (W - M * 2 - 6) / cols;
  const cardH = 28;
  items.forEach((it, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = M + col * (cardW + 6);
    const cy = y + row * (cardH + 6);

    setFill(pdf, C.white);
    rr(pdf, x, cy, cardW, cardH, 2.5, "F");
    setDraw(pdf, C.grayLine);
    pdf.setLineWidth(0.3);
    rr(pdf, x, cy, cardW, cardH, 2.5, "S");

    setFill(pdf, C.gold);
    pdf.rect(x, cy, 1.4, cardH, "F");

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(7);
    setText(pdf, C.grayMute);
    pdf.text(it.k.toUpperCase(), x + 6, cy + 8);

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(16);
    setText(pdf, C.ink);
    pdf.text(it.v, x + 6, cy + 20);
  });

  y += Math.ceil(items.length / cols) * (cardH + 6) + 6;

  // Financing acceptance highlight (only for sale)
  if (!isRental(data)) {
    setFill(pdf, C.greenSoft);
    rr(pdf, M, y, W - M * 2, 22, 2.5, "F");
    setFill(pdf, C.green);
    pdf.rect(M, y, 1.5, 22, "F");

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(7.5);
    setText(pdf, C.green);
    pdf.text("FINANCIAMENTO", M + 6, y + 8);

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(11);
    setText(pdf, C.ink);
    pdf.text("Aceita financiamento bancário e uso de FGTS", M + 6, y + 16);
    y += 28;
  }

  // Description block
  if (data.description && data.description.trim()) {
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(9);
    setText(pdf, C.ink);
    pdf.text("SOBRE O IMÓVEL", M, y + 4);
    setFill(pdf, C.gold);
    pdf.rect(M, y + 6, 8, 0.6, "F");

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9);
    setText(pdf, C.ink2);
    const desc = data.description.replace(/\s+/g, " ").trim();
    const lines = pdf.splitTextToSize(desc, W - M * 2);
    const maxLines = Math.max(0, Math.floor((H - 30 - (y + 12)) / 5));
    pdf.text(lines.slice(0, maxLines), M, y + 14);
  }
}

// ═══════════════════════════════════════════════════════════════════════
// PAGE 3 — DIFFERENTIALS
// ═══════════════════════════════════════════════════════════════════════
function drawDifferentials(pdf: jsPDF, data: ProposalData, y: number) {
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9.5);
  setText(pdf, C.grayMute);
  const intro = pdf.splitTextToSize(
    "Os pontos fortes que tornam este imóvel uma escolha inteligente para morar ou investir.",
    W - M * 2
  );
  pdf.text(intro, M, y);
  y += intro.length * 5 + 8;

  const rental = isRental(data);

  const items: { t: string; d: string }[] = [
    { t: "Localização privilegiada", d: "Região consolidada com fácil acesso a comércio, serviços e vias principais." },
    { t: "Pronto para morar", d: "Imóvel em condições de uso imediato — sem reformas necessárias." },
    { t: "Boa distribuição interna", d: "Ambientes funcionais que aproveitam cada metro com inteligência." },
    { t: "Iluminação e ventilação", d: "Espaços bem iluminados e arejados, com conforto durante o dia inteiro." },
    rental
      ? { t: "Pronto para alugar", d: "Documentação organizada e processo de locação simplificado." }
      : { t: "Aceita financiamento", d: "Compatível com financiamento bancário e uso de FGTS." },
    { t: "Ideal para família e investimento", d: "Perfil versátil — ótimo para morar ou gerar renda com locação." },
  ];

  const colW = (W - M * 2 - 6) / 2;
  const rowH = 30;
  items.forEach((it, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = M + col * (colW + 6);
    const cy = y + row * (rowH + 5);

    setFill(pdf, C.white);
    rr(pdf, x, cy, colW, rowH, 2.5, "F");
    setDraw(pdf, C.grayLine);
    pdf.setLineWidth(0.3);
    rr(pdf, x, cy, colW, rowH, 2.5, "S");

    // Check disc with drawn checkmark
    setFill(pdf, C.green);
    pdf.circle(x + 9, cy + 9, 3.5, "F");
    setDraw(pdf, C.white);
    pdf.setLineWidth(0.7);
    pdf.line(x + 7.2, cy + 9.2, x + 8.5, cy + 10.4);
    pdf.line(x + 8.5, cy + 10.4, x + 10.8, cy + 7.8);

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(10);
    setText(pdf, C.ink);
    pdf.text(it.t, x + 16, cy + 9);

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8);
    setText(pdf, C.grayMute);
    const lines = pdf.splitTextToSize(it.d, colW - 20);
    pdf.text(lines.slice(0, 3), x + 16, cy + 15);
  });

  y += Math.ceil(items.length / 2) * (rowH + 5) + 8;

  // Profile banner
  setFill(pdf, C.navy);
  rr(pdf, M, y, W - M * 2, 26, 2.5, "F");

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(7.5);
  setText(pdf, C.gold);
  pdf.text("PERFIL DO IMÓVEL", M + 8, y + 9);

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(12);
  setText(pdf, C.white);
  pdf.text(rental ? "Ideal para quem busca conforto e praticidade." : "Ideal para família, primeira moradia ou investimento.", M + 8, y + 18);
}

// ═══════════════════════════════════════════════════════════════════════
// PAGE 4 — FINANCIAL SIMULATION
// ═══════════════════════════════════════════════════════════════════════
function drawFinancing(pdf: jsPDF, data: ProposalData, y: number) {
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9.5);
  setText(pdf, C.grayMute);
  const intro = pdf.splitTextToSize(
    "Simulação aproximada para você visualizar o investimento. Valores podem variar conforme banco, perfil e prazo aprovado.",
    W - M * 2
  );
  pdf.text(intro, M, y);
  y += intro.length * 5 + 8;

  const price = data.price;

  // Three down-payment scenarios
  const scenarios = [
    { label: "ENTRADA 20%", down: price * 0.20, finance: price * 0.80, accent: C.blue, hint: "Mínimo aceito pela maioria dos bancos" },
    { label: "ENTRADA 30%", down: price * 0.30, finance: price * 0.70, accent: C.green, hint: "Recomendado · parcela menor" },
    { label: "ENTRADA 50%", down: price * 0.50, finance: price * 0.50, accent: C.gold, hint: "Maior poupança em juros" },
  ];

  const cw = (W - M * 2 - 8) / 3;
  scenarios.forEach((s, i) => {
    const x = M + i * (cw + 4);
    setFill(pdf, C.white);
    rr(pdf, x, y, cw, 56, 3, "F");
    setDraw(pdf, C.grayLine);
    pdf.setLineWidth(0.3);
    rr(pdf, x, y, cw, 56, 3, "S");

    setFill(pdf, s.accent);
    rr(pdf, x, y, cw, 1.5, 1, "F");

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(7);
    setText(pdf, C.grayMute);
    pdf.text(s.label, x + 5, y + 9);

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(7);
    setText(pdf, C.gold);
    pdf.text("ENTRADA", x + 5, y + 17);

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(13);
    setText(pdf, C.ink);
    let dv = fmtPrice(s.down);
    let fs = 13;
    pdf.setFontSize(fs);
    while (pdf.getTextWidth(dv) > cw - 10 && fs > 8) { fs -= 0.5; pdf.setFontSize(fs); }
    pdf.text(dv, x + 5, y + 24);

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(7);
    setText(pdf, C.gold);
    pdf.text("FINANCIA", x + 5, y + 32);

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(11);
    setText(pdf, C.ink2);
    let fv = fmtPrice(s.finance);
    fs = 11;
    pdf.setFontSize(fs);
    while (pdf.getTextWidth(fv) > cw - 10 && fs > 7) { fs -= 0.5; pdf.setFontSize(fs); }
    pdf.text(fv, x + 5, y + 39);

    setDraw(pdf, C.grayLine);
    pdf.setLineWidth(0.2);
    pdf.line(x + 5, y + 43, x + cw - 5, y + 43);

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(7.5);
    setText(pdf, C.grayMute);
    const hl = pdf.splitTextToSize(s.hint, cw - 10);
    pdf.text(hl, x + 5, y + 49);
  });

  y += 64;

  // Monthly installment table (simulated SAC-style approximations)
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(11);
  setText(pdf, C.ink);
  pdf.text("Parcelas aproximadas — entrada de 20%", M, y);
  y += 5;

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(8);
  setText(pdf, C.grayMute);
  pdf.text("Cálculo simplificado para fins ilustrativos · taxa média 10,5% a.a.", M, y);
  y += 6;

  // Header
  setFill(pdf, C.ink);
  rr(pdf, M, y, W - M * 2, 9, 2, "F");
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(8);
  setText(pdf, C.white);
  pdf.text("PRAZO", M + 6, y + 5.8);
  pdf.text("PARCELA APROXIMADA", M + 60, y + 5.8);
  pdf.text("RENDA SUGERIDA", W - M - 6, y + 5.8, { align: "right" });
  y += 12;

  const financed = price * 0.80;
  const rate = 0.105 / 12; // monthly
  const terms = [
    { years: 15, label: "180 meses (15 anos)" },
    { years: 20, label: "240 meses (20 anos)" },
    { years: 30, label: "360 meses (30 anos)" },
  ];

  terms.forEach((t) => {
    const n = t.years * 12;
    // PRICE formula
    const pmt = (financed * rate) / (1 - Math.pow(1 + rate, -n));
    const income = pmt / 0.30; // 30% commitment

    setFill(pdf, C.white);
    rr(pdf, M, y, W - M * 2, 14, 2, "F");
    setDraw(pdf, C.grayLine);
    pdf.setLineWidth(0.25);
    rr(pdf, M, y, W - M * 2, 14, 2, "S");

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(9.5);
    setText(pdf, C.ink);
    pdf.text(t.label, M + 6, y + 9);

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(11);
    setText(pdf, C.green);
    pdf.text(fmtPrice(pmt), M + 60, y + 9);

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9);
    setText(pdf, C.ink2);
    pdf.text(fmtPrice(income), W - M - 6, y + 9, { align: "right" });

    y += 17;
  });

  // Disclaimer
  y += 2;
  setFill(pdf, C.bg);
  rr(pdf, M, y, W - M * 2, 14, 2, "F");
  pdf.setFont("helvetica", "italic");
  pdf.setFontSize(7.5);
  setText(pdf, C.grayMute);
  const dis = pdf.splitTextToSize(
    "Valores estimados. Aprovação, taxa real e condições finais dependem da análise de crédito do banco escolhido.",
    W - M * 2 - 8
  );
  pdf.text(dis, M + 4, y + 6);
}

// ═══════════════════════════════════════════════════════════════════════
// PAGE 5 — LOCATION
// ═══════════════════════════════════════════════════════════════════════
function drawLocation(pdf: jsPDF, data: ProposalData, mapImg: string | null, y: number) {
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9.5);
  setText(pdf, C.grayMute);
  const intro = pdf.splitTextToSize(
    "Região com excelente infraestrutura urbana — comércio, escolas e transporte ao alcance.",
    W - M * 2
  );
  pdf.text(intro, M, y);
  y += intro.length * 5 + 6;

  // Address line
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(11);
  setText(pdf, C.ink);
  pdf.text(`${data.location}`, M, y);
  y += 8;

  // Map card
  const mapH = 95;
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

  // Nearby amenities (3 cards)
  const items = [
    { t: "Comércio", d: "Mercados, padarias, farmácias e restaurantes nas proximidades." },
    { t: "Escolas", d: "Instituições de ensino infantil, fundamental e médio na região." },
    { t: "Transporte", d: "Acesso rápido a vias principais e transporte público." },
  ];
  const cw = (W - M * 2 - 8) / 3;
  items.forEach((it, i) => {
    const x = M + i * (cw + 4);
    setFill(pdf, C.white);
    rr(pdf, x, y, cw, 32, 2.5, "F");
    setDraw(pdf, C.grayLine);
    pdf.setLineWidth(0.3);
    rr(pdf, x, y, cw, 32, 2.5, "S");
    setFill(pdf, C.blue);
    pdf.rect(x, y, cw, 1.2, "F");

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(10);
    setText(pdf, C.ink);
    pdf.text(it.t, x + 5, y + 10);

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8);
    setText(pdf, C.grayMute);
    const ll = pdf.splitTextToSize(it.d, cw - 10);
    pdf.text(ll.slice(0, 4), x + 5, y + 16);
  });
  y += 38;

  // Open in Maps button
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(data.location)}`;
  setFill(pdf, C.blue);
  rr(pdf, M, y, W - M * 2, 12, 2.5, "F");
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(10);
  setText(pdf, C.white);
  pdf.text("Abrir no Google Maps  >", W / 2, y + 8, { align: "center" });
  pdf.link(M, y, W - M * 2, 12, { url: mapsUrl });
}

// ═══════════════════════════════════════════════════════════════════════
// PAGE FINAL — CTA (buyer focus)
// ═══════════════════════════════════════════════════════════════════════
function drawClosingCta(pdf: jsPDF, data: ProposalData, qrImg: string | null) {
  // Full dark background
  setFill(pdf, C.navyDeep);
  pdf.rect(0, 0, W, H, "F");

  // Gold corner mark
  setFill(pdf, C.gold);
  pdf.rect(M, M, 14, 0.8, "F");

  // Brand
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(8);
  setText(pdf, C.white);
  pdf.text("CAPIMOBI", M, M + 6);

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(7);
  setText(pdf, C.grayDark);
  pdf.text("INTELIGÊNCIA IMOBILIÁRIA", M, M + 11);

  // Eyebrow
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(8);
  setText(pdf, C.gold);
  pdf.text("GOSTOU DESTE IMÓVEL?", M, 70);

  // Big headline
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(30);
  setText(pdf, C.white);
  pdf.text("Agende sua visita", M, 86);
  pdf.text("agora mesmo.", M, 102);

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(11);
  setText(pdf, [203, 213, 225]);
  const sub = pdf.splitTextToSize(
    "Fale diretamente com o corretor responsável pelo imóvel. Atendimento rápido pelo WhatsApp.",
    W - M * 2
  );
  pdf.text(sub, M, 114);

  // Property mini-card
  let cy = 132;
  setFill(pdf, C.white);
  pdf.setGState(pdf.GState({ opacity: 0.06 }));
  rr(pdf, M, cy, W - M * 2, 30, 3, "F");
  pdf.setGState(pdf.GState({ opacity: 1 }));
  setDraw(pdf, [55, 78, 120]);
  pdf.setLineWidth(0.3);
  rr(pdf, M, cy, W - M * 2, 30, 3, "S");

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(7);
  setText(pdf, C.gold);
  pdf.text("IMÓVEL DE INTERESSE", M + 8, cy + 8);

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(12);
  setText(pdf, C.white);
  const tl = pdf.splitTextToSize(data.title, W - M * 2 - 80);
  pdf.text(tl[0], M + 8, cy + 16);

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(8.5);
  setText(pdf, C.grayDark);
  pdf.text(data.location || "—", M + 8, cy + 23);

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(13);
  setText(pdf, C.gold);
  pdf.text(priceLabel(data), W - M - 8, cy + 19, { align: "right" });

  // Broker card
  cy = 170;
  setFill(pdf, C.white);
  pdf.setGState(pdf.GState({ opacity: 0.06 }));
  rr(pdf, M, cy, W - M * 2, 50, 3, "F");
  pdf.setGState(pdf.GState({ opacity: 1 }));
  setDraw(pdf, [55, 78, 120]);
  pdf.setLineWidth(0.3);
  rr(pdf, M, cy, W - M * 2, 50, 3, "S");

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
  setText(pdf, C.grayDark);
  pdf.text(catLabel(data.sellerCategory), M + 8, cy + 25);

  if (data.sellerPhone) {
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(7);
    setText(pdf, C.grayDark);
    pdf.text("WHATSAPP", M + 8, cy + 35);

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(13);
    setText(pdf, C.white);
    pdf.text(data.sellerPhone, M + 8, cy + 43);
  }

  // QR code
  if (qrImg) {
    try {
      const qrSize = 32;
      setFill(pdf, C.white);
      rr(pdf, W - M - 8 - qrSize, cy + 9, qrSize, qrSize, 2, "F");
      pdf.addImage(qrImg, "PNG", W - M - 8 - qrSize + 2, cy + 11, qrSize - 4, qrSize - 4, undefined, "FAST");
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(6.5);
      setText(pdf, C.grayDark);
      pdf.text("Ver imóvel online", W - M - 8 - qrSize / 2, cy + 46, { align: "center" });
    } catch { /* skip */ }
  }

  // CTA Button — Schedule visit (WhatsApp)
  cy = 232;
  const wa = data.sellerPhone ? data.sellerPhone.replace(/\D/g, "") : "";
  const waMsg = encodeURIComponent(`Olá ${data.sellerName}, tenho interesse no imóvel: ${data.title} (${data.propertyUrl}). Posso agendar uma visita?`);
  const waUrl = wa ? `https://wa.me/${wa}?text=${waMsg}` : data.propertyUrl;

  setFill(pdf, C.green);
  rr(pdf, M, cy, W - M * 2, 16, 3, "F");
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(12);
  setText(pdf, C.white);
  pdf.text("Agendar visita pelo WhatsApp  >", W / 2, cy + 10.5, { align: "center" });
  pdf.link(M, cy, W - M * 2, 16, { url: waUrl });

  // Secondary button — view online
  cy += 20;
  setDraw(pdf, C.gold);
  pdf.setLineWidth(0.6);
  rr(pdf, M, cy, W - M * 2, 14, 3, "S");
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(10);
  setText(pdf, C.gold);
  pdf.text("Ver imóvel completo no site  >", W / 2, cy + 9, { align: "center" });
  pdf.link(M, cy, W - M * 2, 14, { url: data.propertyUrl });
}

function catLabel(cat: string): string {
  const m: Record<string, string> = {
    imobiliaria: "Imobiliária",
    corretor: "Corretor(a)",
    construtora: "Construtora",
    proprietario: "Proprietário(a)",
  };
  return m[cat] || "Corretor(a)";
}
