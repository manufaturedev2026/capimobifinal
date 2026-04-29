import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Image, X, ChevronLeft, ChevronRight, Eye, Share2, Copy, CheckCircle2, Sparkles,
  Download, Palette, FileText, Layers, Wand2, Loader2, Package, Type, Sliders,
  Award, Crown, Building2, Home, Trees, Store, ShieldCheck, Zap,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import jsPDF from "jspdf";

/* ═══════════════════════════════════════════════════════════════
   GALERIA DE ANÚNCIOS — CENTRAL PREMIUM DE ARTES IMOBILIÁRIAS
   ═══════════════════════════════════════════════════════════════ */

interface GalleryItem {
  id: string;
  title: string;
  photos: string[] | null;
  price: number | null;
  city: string | null;
  neighborhood: string | null;
  category: string;
  bedrooms: number | null;
  bathrooms: number | null;
  area: number | null;
  description: string | null;
  suites: number | null;
  parking_spots: number | null;
  built_area: number | null;
  finality: string | null;
  address: string | null;
  condo_fee: number | null;
  iptu: number | null;
  pool: boolean | null;
  furnished: boolean | null;
  balcony: boolean | null;
  barbecue: boolean | null;
  garden: boolean | null;
  accepts_financing: boolean | null;
  slug: string | null;
}

interface Props {
  userId: string;
  sellerId: string;
  sellerSlug: string | null;
  sellerName: string;
  sellerPhone: string | null;
  sellerLogo: string | null;
  sellerCreci: string | null;
}

/* ── Formatos ─────────────────────────────────────────────────── */
type ImageFormat = "post" | "feed45" | "banner" | "story" | "a4";

const FORMAT_CONFIG: Record<ImageFormat, {
  label: string; short: string; width: number; height: number;
  description: string; icon: string; ratio: string;
}> = {
  post:    { label: "Post Quadrado",       short: "1:1",  width: 1080, height: 1080, description: "Instagram Feed / Facebook", icon: "▢", ratio: "aspect-square" },
  feed45:  { label: "Feed Premium",        short: "4:5",  width: 1080, height: 1350, description: "Maior alcance no Instagram", icon: "▯", ratio: "aspect-[4/5]" },
  banner:  { label: "Banner Horizontal",   short: "16:9", width: 1920, height: 1080, description: "Facebook Ads / Site / WhatsApp", icon: "▭", ratio: "aspect-video" },
  story:   { label: "Story Vertical",      short: "9:16", width: 1080, height: 1920, description: "Stories / Reels Cover / Status", icon: "▮", ratio: "aspect-[9/16]" },
  a4:      { label: "Flyer A4",            short: "A4",   width: 1240, height: 1754, description: "Impressão / PDF Profissional", icon: "▤", ratio: "aspect-[1240/1754]" },
};

/* ── Templates Profissionais ──────────────────────────────────── */
type TemplateId =
  | "moderno_premium" | "luxo_imobiliario" | "minimalista_clean" | "popular_vendas"
  | "black_gold" | "viral_instagram" | "construtora_lancamento" | "alto_padrao"
  | "apartamento_urbano" | "comercial_corporativo";

interface TemplateDef {
  id: TemplateId;
  name: string;
  emoji: string;
  description: string;
  /* Cores */
  accent: string;          // cor principal (preço/CTA)
  accentSoft: string;      // versão translúcida
  textTop: string;         // cor do título
  textSub: string;         // cor de subtítulos / detalhes
  textFooter: string;      // cor do rodapé
  /* Layout */
  gradientStart: string;   // topo do gradient inferior (transparente)
  gradientMid: string;
  gradientEnd: string;     // base
  topBarColor: string | null;     // barra superior decorativa
  bottomBarColor: string | null;  // barra inferior decorativa
  badgeStyle: "glass" | "solid" | "outline" | "luxury";
  priceStyle: "glass" | "solid" | "luxury" | "minimal";
  /* Filtros visuais aplicados na foto */
  filterBrightness: number; // 1 = neutro
  filterContrast: number;
  filterSaturate: number;
  /* Preview chip */
  previewBg: string;
  premium?: boolean;
}

const TEMPLATES: TemplateDef[] = [
  {
    id: "moderno_premium", name: "Moderno Premium", emoji: "🌟",
    description: "Layout limpo e contemporâneo com glass blur.",
    accent: "#0ea5e9", accentSoft: "rgba(14,165,233,0.85)",
    textTop: "#ffffff", textSub: "rgba(255,255,255,0.85)", textFooter: "rgba(255,255,255,0.6)",
    gradientStart: "rgba(0,0,0,0)", gradientMid: "rgba(8,15,30,0.55)", gradientEnd: "rgba(8,15,30,0.96)",
    topBarColor: null, bottomBarColor: "#0ea5e9",
    badgeStyle: "glass", priceStyle: "glass",
    filterBrightness: 1.05, filterContrast: 1.08, filterSaturate: 1.1,
    previewBg: "linear-gradient(135deg,#0ea5e9,#0369a1)",
  },
  {
    id: "luxo_imobiliario", name: "Luxo Imobiliário", emoji: "💎",
    description: "Tipografia serifada elegante, dourado discreto.",
    accent: "#c8a45c", accentSoft: "rgba(200,164,92,0.85)",
    textTop: "#fff8e7", textSub: "rgba(255,248,231,0.85)", textFooter: "rgba(255,248,231,0.55)",
    gradientStart: "rgba(0,0,0,0)", gradientMid: "rgba(20,15,5,0.6)", gradientEnd: "rgba(15,10,2,0.97)",
    topBarColor: "#c8a45c", bottomBarColor: "#c8a45c",
    badgeStyle: "luxury", priceStyle: "luxury",
    filterBrightness: 1.02, filterContrast: 1.12, filterSaturate: 0.95,
    previewBg: "linear-gradient(135deg,#1a1206,#c8a45c)",
    premium: true,
  },
  {
    id: "minimalista_clean", name: "Minimalista Clean", emoji: "⚪",
    description: "Branco premium, máximo respiro, foco na foto.",
    accent: "#0f172a", accentSoft: "rgba(15,23,42,0.92)",
    textTop: "#ffffff", textSub: "rgba(255,255,255,0.9)", textFooter: "rgba(255,255,255,0.7)",
    gradientStart: "rgba(0,0,0,0)", gradientMid: "rgba(0,0,0,0.65)", gradientEnd: "rgba(0,0,0,0.97)",
    topBarColor: null, bottomBarColor: null,
    badgeStyle: "outline", priceStyle: "minimal",
    filterBrightness: 1.06, filterContrast: 1.05, filterSaturate: 1.0,
    previewBg: "linear-gradient(135deg,#f8fafc,#0f172a)",
  },
  {
    id: "popular_vendas", name: "Popular Vendas Rápidas", emoji: "🔥",
    description: "Vermelho impactante para giro rápido de estoque.",
    accent: "#ef4444", accentSoft: "rgba(239,68,68,0.92)",
    textTop: "#ffffff", textSub: "rgba(255,255,255,0.92)", textFooter: "rgba(255,255,255,0.7)",
    gradientStart: "rgba(0,0,0,0)", gradientMid: "rgba(60,10,10,0.55)", gradientEnd: "rgba(40,5,5,0.97)",
    topBarColor: "#ef4444", bottomBarColor: "#ef4444",
    badgeStyle: "solid", priceStyle: "solid",
    filterBrightness: 1.08, filterContrast: 1.15, filterSaturate: 1.2,
    previewBg: "linear-gradient(135deg,#ef4444,#7f1d1d)",
  },
  {
    id: "black_gold", name: "Black Gold Luxury", emoji: "🏆",
    description: "Black absoluto com ouro vintage. Imóveis exclusivos.",
    accent: "#d4af37", accentSoft: "rgba(212,175,55,0.95)",
    textTop: "#fff7d6", textSub: "rgba(255,247,214,0.85)", textFooter: "rgba(212,175,55,0.85)",
    gradientStart: "rgba(0,0,0,0)", gradientMid: "rgba(0,0,0,0.7)", gradientEnd: "rgba(0,0,0,0.99)",
    topBarColor: "#d4af37", bottomBarColor: "#d4af37",
    badgeStyle: "luxury", priceStyle: "luxury",
    filterBrightness: 0.95, filterContrast: 1.18, filterSaturate: 0.85,
    previewBg: "linear-gradient(135deg,#000,#d4af37)",
    premium: true,
  },
  {
    id: "viral_instagram", name: "Viral Instagram", emoji: "💜",
    description: "Gradient roxo/rosa, ideal para engajamento.",
    accent: "#a855f7", accentSoft: "rgba(168,85,247,0.92)",
    textTop: "#ffffff", textSub: "rgba(255,255,255,0.92)", textFooter: "rgba(255,255,255,0.72)",
    gradientStart: "rgba(0,0,0,0)", gradientMid: "rgba(60,15,80,0.6)", gradientEnd: "rgba(40,5,60,0.97)",
    topBarColor: "#ec4899", bottomBarColor: "#a855f7",
    badgeStyle: "glass", priceStyle: "solid",
    filterBrightness: 1.1, filterContrast: 1.12, filterSaturate: 1.25,
    previewBg: "linear-gradient(135deg,#a855f7,#ec4899)",
  },
  {
    id: "construtora_lancamento", name: "Construtora Lançamento", emoji: "🏗️",
    description: "Azul corporativo para empreendimentos novos.",
    accent: "#2563eb", accentSoft: "rgba(37,99,235,0.92)",
    textTop: "#ffffff", textSub: "rgba(255,255,255,0.9)", textFooter: "rgba(255,255,255,0.7)",
    gradientStart: "rgba(0,0,0,0)", gradientMid: "rgba(10,25,55,0.6)", gradientEnd: "rgba(5,15,40,0.97)",
    topBarColor: "#2563eb", bottomBarColor: "#1e40af",
    badgeStyle: "solid", priceStyle: "solid",
    filterBrightness: 1.05, filterContrast: 1.1, filterSaturate: 1.05,
    previewBg: "linear-gradient(135deg,#2563eb,#1e3a8a)",
  },
  {
    id: "alto_padrao", name: "Alto Padrão Mansão", emoji: "🏰",
    description: "Verde escuro elite com tipografia serifada.",
    accent: "#0f766e", accentSoft: "rgba(15,118,110,0.92)",
    textTop: "#f0fdf4", textSub: "rgba(240,253,244,0.85)", textFooter: "rgba(240,253,244,0.65)",
    gradientStart: "rgba(0,0,0,0)", gradientMid: "rgba(5,30,25,0.6)", gradientEnd: "rgba(2,20,15,0.97)",
    topBarColor: "#0f766e", bottomBarColor: "#0f766e",
    badgeStyle: "luxury", priceStyle: "luxury",
    filterBrightness: 1.0, filterContrast: 1.12, filterSaturate: 1.0,
    previewBg: "linear-gradient(135deg,#064e3b,#0f766e)",
    premium: true,
  },
  {
    id: "apartamento_urbano", name: "Apartamento Urbano", emoji: "🏙️",
    description: "Cinza moderno e clean para city living.",
    accent: "#475569", accentSoft: "rgba(71,85,105,0.92)",
    textTop: "#ffffff", textSub: "rgba(255,255,255,0.88)", textFooter: "rgba(255,255,255,0.65)",
    gradientStart: "rgba(0,0,0,0)", gradientMid: "rgba(15,23,42,0.55)", gradientEnd: "rgba(10,15,25,0.96)",
    topBarColor: null, bottomBarColor: "#64748b",
    badgeStyle: "glass", priceStyle: "minimal",
    filterBrightness: 1.04, filterContrast: 1.08, filterSaturate: 1.05,
    previewBg: "linear-gradient(135deg,#334155,#0f172a)",
  },
  {
    id: "comercial_corporativo", name: "Comercial Corporativo", emoji: "🏢",
    description: "Identidade séria para lojas, salas e galpões.",
    accent: "#1e293b", accentSoft: "rgba(30,41,59,0.95)",
    textTop: "#ffffff", textSub: "rgba(255,255,255,0.9)", textFooter: "rgba(255,255,255,0.7)",
    gradientStart: "rgba(0,0,0,0)", gradientMid: "rgba(10,15,25,0.55)", gradientEnd: "rgba(5,10,20,0.97)",
    topBarColor: "#1e293b", bottomBarColor: "#334155",
    badgeStyle: "solid", priceStyle: "solid",
    filterBrightness: 1.02, filterContrast: 1.1, filterSaturate: 0.95,
    previewBg: "linear-gradient(135deg,#1e293b,#0f172a)",
  },
];

/* ── Fontes Premium (Google Fonts) ─────────────────────────────── */
type FontId = "playfair" | "montserrat" | "poppins" | "inter" | "lora" | "dmsans";

const FONTS: Record<FontId, { label: string; family: string; weight: number; serif: boolean }> = {
  playfair:   { label: "Playfair Display", family: "'Playfair Display', Georgia, serif",       weight: 800, serif: true },
  montserrat: { label: "Montserrat",       family: "'Montserrat', 'Helvetica Neue', sans-serif", weight: 800, serif: false },
  poppins:    { label: "Poppins",          family: "'Poppins', sans-serif",                     weight: 800, serif: false },
  inter:      { label: "Inter",            family: "'Inter', sans-serif",                       weight: 800, serif: false },
  lora:       { label: "Lora",             family: "'Lora', Georgia, serif",                    weight: 700, serif: true },
  dmsans:     { label: "DM Sans",          family: "'DM Sans', sans-serif",                     weight: 700, serif: false },
};

/* ── Selos / Tags ─────────────────────────────────────────────── */
type BadgeKind = "venda" | "aluguel" | "exclusivo" | "oportunidade" | "lancamento" | "auto";
const BADGE_LABELS: Record<Exclude<BadgeKind, "auto">, string> = {
  venda: "VENDA",
  aluguel: "ALUGUEL",
  exclusivo: "EXCLUSIVO",
  oportunidade: "OPORTUNIDADE",
  lancamento: "LANÇAMENTO",
};

/* ── Densidade de texto ───────────────────────────────────────── */
type TextDensity = "minimal" | "medium" | "complete" | "aggressive";

const DENSITY_LABEL: Record<TextDensity, string> = {
  minimal: "Minimalista",
  medium: "Médio",
  complete: "Completo",
  aggressive: "Agressivo Vendas",
};

/* ── Helpers ──────────────────────────────────────────────────── */
function formatPrice(price: number, isRent = false): string {
  return `R$ ${price.toLocaleString("pt-BR")}${isRent ? "/mês" : ""}`;
}

async function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function drawRoundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function wrapCanvasText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, maxLines: number): string[] {
  const words = text.trim().split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";

  const pushLongWord = (word: string) => {
    let chunk = "";
    for (const char of word) {
      const test = chunk + char;
      if (ctx.measureText(test).width > maxWidth && chunk) {
        lines.push(chunk);
        chunk = char;
      } else {
        chunk = test;
      }
      if (lines.length >= maxLines) break;
    }
    return chunk;
  };

  for (const word of words) {
    if (lines.length >= maxLines) break;
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width <= maxWidth) {
      line = test;
      continue;
    }
    if (line) lines.push(line);
    line = ctx.measureText(word).width > maxWidth ? pushLongWord(word) : word;
  }
  if (line && lines.length < maxLines) lines.push(line);

  if (lines.length === maxLines) {
    let last = lines[maxLines - 1];
    while (last.length > 1 && ctx.measureText(`${last}…`).width > maxWidth) last = last.slice(0, -1);
    lines[maxLines - 1] = `${last}…`;
  }

  return lines;
}

function fitCanvasTextLines(
  ctx: CanvasRenderingContext2D,
  text: string,
  fontFamily: string,
  weight: number,
  startSize: number,
  minSize: number,
  maxWidth: number,
  maxLines: number,
) {
  for (let size = startSize; size >= minSize; size -= 2) {
    ctx.font = `${weight} ${size}px ${fontFamily}`;
    const lines = wrapCanvasText(ctx, text, maxWidth, maxLines);
    if (lines.every((l) => ctx.measureText(l).width <= maxWidth)) return { size, lines };
  }
  ctx.font = `${weight} ${minSize}px ${fontFamily}`;
  return { size: minSize, lines: wrapCanvasText(ctx, text, maxWidth, maxLines) };
}

function autoBadge(item: GalleryItem): Exclude<BadgeKind, "auto"> {
  const isRent = item.finality === "aluguel" || item.category === "aluguel";
  if (isRent) return "aluguel";
  if (item.price && item.price > 1500000) return "exclusivo";
  if (item.price && item.price < 250000) return "oportunidade";
  return "venda";
}

/* ── Detecção automática do template (IA simples baseada em metadata) ── */
function autoDetectTemplate(item: GalleryItem): TemplateId {
  const cat = (item.category || "").toLowerCase();
  const title = (item.title || "").toLowerCase();
  const price = item.price || 0;

  if (cat.includes("comercial") || cat.includes("loja") || cat.includes("sala") || cat.includes("galpao")) return "comercial_corporativo";
  if (cat.includes("terreno") || cat.includes("lote")) return "minimalista_clean";
  if (title.includes("lançamento") || title.includes("lancamento") || cat.includes("lancamento")) return "construtora_lancamento";
  if (price >= 2500000 || title.includes("mansão") || title.includes("mansao") || title.includes("alto padrão")) return "alto_padrao";
  if (price >= 1500000 || title.includes("luxo") || title.includes("cobertura")) return "luxo_imobiliario";
  if (cat.includes("apartamento")) return "apartamento_urbano";
  if (price < 250000) return "popular_vendas";
  return "moderno_premium";
}

/* ═══════════════════════════════════════════════════════════════
   GERADOR DE IMAGENS
   ═══════════════════════════════════════════════════════════════ */

interface GenOpts {
  item: GalleryItem;
  format: ImageFormat;
  template: TemplateDef;
  font: FontId;
  density: TextDensity;
  badge: Exclude<BadgeKind, "auto"> | null;
  photoUrl: string;
  showLogo: boolean;
  showWatermark: boolean;
  sellerName: string;
  sellerPhone: string | null;
  sellerCreci: string | null;
  sellerLogo: string | null;
  // Ajustes de imagem
  brightness: number;
  contrast: number;
  saturate: number;
  hdr: boolean;
  // Override do título (headline gerada por IA)
  titleOverride?: string | null;
}

async function generateMarketingImage(o: GenOpts): Promise<string> {
  const { width, height } = FORMAT_CONFIG[o.format];
  const t = o.template;
  const fontDef = FONTS[o.font];
  const titleFont = fontDef.family;
  const baseFont = "'Inter', 'Helvetica Neue', Arial, sans-serif";
  const isStory = o.format === "story" || o.format === "feed45";
  const isA4 = o.format === "a4";
  const scale = width / 1080;
  const isRent = o.item.finality === "aluguel" || o.item.category === "aluguel";

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;

  /* ── 1. Foto de fundo com filtros ── */
  if (o.photoUrl) {
    try {
      const img = await loadImage(o.photoUrl);
      const imgRatio = img.width / img.height;
      const canvasRatio = width / height;
      let sx = 0, sy = 0, sw = img.width, sh = img.height;
      if (imgRatio > canvasRatio) {
        sw = img.height * canvasRatio;
        sx = (img.width - sw) / 2;
      } else {
        sh = img.width / canvasRatio;
        sy = (img.height - sh) / 2;
      }
      const bright = o.brightness * t.filterBrightness;
      const cont   = o.contrast   * t.filterContrast;
      const sat    = o.saturate   * t.filterSaturate;
      ctx.filter = `brightness(${bright}) contrast(${cont}) saturate(${sat})`;
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, width, height);
      // HDR leve = segunda passada com blend overlay
      if (o.hdr) {
        ctx.globalAlpha = 0.15;
        ctx.globalCompositeOperation = "overlay";
        ctx.drawImage(img, sx, sy, sw, sh, 0, 0, width, height);
        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = "source-over";
      }
      ctx.filter = "none";
    } catch {
      ctx.fillStyle = "#1a1a2e"; ctx.fillRect(0, 0, width, height);
    }
  } else {
    ctx.fillStyle = "#1a1a2e"; ctx.fillRect(0, 0, width, height);
  }

  /* ── 2. Top bar decorativa ── */
  if (t.topBarColor) {
    ctx.fillStyle = t.topBarColor;
    ctx.fillRect(0, 0, width, Math.round(6 * scale));
  }

  /* ── 3. Gradient inferior (mais alto para garantir backdrop do título) ── */
  const gradH = isA4 ? height * 0.55 : height * (isStory ? 0.7 : 0.68);
  const grad = ctx.createLinearGradient(0, height - gradH, 0, height);
  grad.addColorStop(0, t.gradientStart);
  grad.addColorStop(0.45, t.gradientMid);
  grad.addColorStop(1, t.gradientEnd);
  ctx.fillStyle = grad;
  ctx.fillRect(0, height - gradH, width, gradH);

  /* ── 4. Top gradient suave (para selo/logo) ── */
  const topGrad = ctx.createLinearGradient(0, 0, 0, height * 0.18);
  topGrad.addColorStop(0, "rgba(0,0,0,0.55)");
  topGrad.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = topGrad;
  ctx.fillRect(0, 0, width, height * 0.18);

  /* ── 5. Bottom decorative bar ── */
  if (t.bottomBarColor) {
    ctx.fillStyle = t.bottomBarColor;
    ctx.fillRect(0, height - Math.round(6 * scale), width, Math.round(6 * scale));
  }

  const pad = Math.round(width * 0.045);

  /* ── 6. Logo do corretor (top-left) ── */
  let logoOffset = 0;
  if (o.showLogo && o.sellerLogo) {
    try {
      const logoImg = await loadImage(o.sellerLogo);
      const logoSize = Math.round(64 * scale);
      const lx = pad, ly = pad + Math.round(8 * scale);
      ctx.save();
      ctx.beginPath();
      ctx.arc(lx + logoSize / 2, ly + logoSize / 2, logoSize / 2, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(logoImg, lx, ly, logoSize, logoSize);
      ctx.restore();
      ctx.strokeStyle = "rgba(255,255,255,0.55)";
      ctx.lineWidth = Math.round(2.5 * scale);
      ctx.beginPath();
      ctx.arc(lx + logoSize / 2, ly + logoSize / 2, logoSize / 2, 0, Math.PI * 2);
      ctx.stroke();
      logoOffset = logoSize + Math.round(14 * scale);
    } catch {/* ignore */}
  }

  /* ── 7. Selo / Badge (top-left ao lado do logo) ── */
  if (o.badge) {
    const label = BADGE_LABELS[o.badge];
    const badgeFontSize = Math.round(26 * scale);
    ctx.font = `900 ${badgeFontSize}px ${baseFont}`;
    const m = ctx.measureText(label);
    const bp = Math.round(14 * scale);
    const bw = m.width + bp * 2;
    const bh = badgeFontSize + bp;
    const bx = pad + logoOffset;
    const by = pad + Math.round(12 * scale);

    if (t.badgeStyle === "glass") {
      ctx.fillStyle = "rgba(255,255,255,0.18)";
      drawRoundedRect(ctx, bx, by, bw, bh, Math.round(8 * scale));
      ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.4)";
      ctx.lineWidth = Math.round(1.5 * scale);
      drawRoundedRect(ctx, bx, by, bw, bh, Math.round(8 * scale));
      ctx.stroke();
      ctx.fillStyle = "#ffffff";
    } else if (t.badgeStyle === "outline") {
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = Math.round(2 * scale);
      drawRoundedRect(ctx, bx, by, bw, bh, Math.round(6 * scale));
      ctx.stroke();
      ctx.fillStyle = "#ffffff";
    } else if (t.badgeStyle === "luxury") {
      ctx.fillStyle = "rgba(0,0,0,0.55)";
      drawRoundedRect(ctx, bx, by, bw, bh, Math.round(6 * scale));
      ctx.fill();
      ctx.strokeStyle = t.accent;
      ctx.lineWidth = Math.round(1.5 * scale);
      drawRoundedRect(ctx, bx, by, bw, bh, Math.round(6 * scale));
      ctx.stroke();
      ctx.fillStyle = t.accent;
    } else { // solid
      ctx.fillStyle = t.accent;
      drawRoundedRect(ctx, bx, by, bw, bh, Math.round(8 * scale));
      ctx.fill();
      ctx.fillStyle = "#ffffff";
    }
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(label, bx + bw / 2, by + bh / 2);
  }

  /* ── 8. Preço (top-right) ── */
  if (o.item.price && o.item.price > 0) {
    const priceText = formatPrice(o.item.price, isRent);
    const priceFontSize = Math.round((isStory ? 56 : isA4 ? 48 : 46) * scale);
    ctx.font = `900 ${priceFontSize}px ${baseFont}`;
    const pm = ctx.measureText(priceText);
    const pp = Math.round(20 * scale);
    const pw = pm.width + pp * 2;
    const ph = priceFontSize + pp * 1.2;
    const px = width - pad - pw;
    const py = pad + Math.round(12 * scale);

    if (t.priceStyle === "glass") {
      ctx.fillStyle = "rgba(0,0,0,0.42)";
      drawRoundedRect(ctx, px, py, pw, ph, Math.round(14 * scale));
      ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.35)";
      ctx.lineWidth = Math.round(1.5 * scale);
      drawRoundedRect(ctx, px, py, pw, ph, Math.round(14 * scale));
      ctx.stroke();
      ctx.fillStyle = "#ffffff";
    } else if (t.priceStyle === "luxury") {
      ctx.fillStyle = "rgba(0,0,0,0.7)";
      drawRoundedRect(ctx, px, py, pw, ph, Math.round(8 * scale));
      ctx.fill();
      ctx.strokeStyle = t.accent;
      ctx.lineWidth = Math.round(2 * scale);
      drawRoundedRect(ctx, px, py, pw, ph, Math.round(8 * scale));
      ctx.stroke();
      ctx.fillStyle = t.accent;
    } else if (t.priceStyle === "minimal") {
      ctx.fillStyle = "#ffffff";
      drawRoundedRect(ctx, px, py, pw, ph, Math.round(6 * scale));
      ctx.fill();
      ctx.fillStyle = t.accent;
    } else { // solid
      ctx.fillStyle = t.accent;
      drawRoundedRect(ctx, px, py, pw, ph, Math.round(12 * scale));
      ctx.fill();
      ctx.fillStyle = "#ffffff";
    }
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(priceText, px + pw / 2, py + ph / 2);
  }

  /* ── 9. Bottom area (footer + details + location + title) ── */
  const bottomBarOffset = t.bottomBarColor ? Math.round(10 * scale) : 0;
  let y = height - pad - bottomBarOffset;

  // Footer (corretor)
  if (o.density !== "minimal") {
    const footerFontSize = Math.round((isStory ? 32 : 26) * scale);
    ctx.font = `600 ${footerFontSize}px ${baseFont}`;
    ctx.fillStyle = t.textFooter;
    ctx.textAlign = "left";
    ctx.textBaseline = "bottom";
    let footerLine = o.sellerName;
    if (o.sellerCreci) footerLine += ` • CRECI ${o.sellerCreci}`;
    if (o.sellerPhone) footerLine += ` • ${o.sellerPhone}`;
    ctx.fillText(footerLine, pad, y);
    y -= footerFontSize + Math.round(16 * scale);
  }

  // Detalhes (ícones)
  if (o.density !== "minimal") {
    const details: string[] = [];
    if (o.item.bedrooms) details.push(`🛏 ${o.item.bedrooms}`);
    if (o.item.bathrooms) details.push(`🚿 ${o.item.bathrooms}`);
    if (o.item.parking_spots) details.push(`🚗 ${o.item.parking_spots}`);
    if (o.item.area) details.push(`📐 ${o.item.area}m²`);
    if (details.length > 0) {
      const dfs = Math.round((isStory ? 44 : 36) * scale);
      ctx.font = `700 ${dfs}px ${baseFont}`;
      ctx.fillStyle = t.textSub;
      ctx.textAlign = "left";
      ctx.textBaseline = "bottom";
      ctx.fillText(details.join("   "), pad, y);
      y -= dfs + Math.round(12 * scale);
    }
  }

  // Localização (oculta no modo minimal)
  if (o.density !== "minimal") {
    const location = o.item.neighborhood ? `📍 ${o.item.neighborhood}, ${o.item.city}` : o.item.city ? `📍 ${o.item.city}` : "";
    if (location) {
      const lfs = Math.round((isStory ? 44 : 36) * scale);
      ctx.font = `600 ${lfs}px ${baseFont}`;
      ctx.fillStyle = t.textSub;
      ctx.textAlign = "left";
      ctx.textBaseline = "bottom";
      ctx.fillText(location, pad, y);
      y -= lfs + Math.round(14 * scale);
    }
  }

  // Título (negrito grande, com encaixe automático para não cortar)
  // Tamanho idêntico em todos os modos (minimal/medium/complete/aggressive)
  // para que o título fique sempre alinhado no mesmo ponto inferior esquerdo.
  const isMinimalTemplate = t.id === "minimalista_clean";
  const titleFontSize = Math.round((isStory ? 76 : isA4 ? 64 : 60) * scale);
  ctx.fillStyle = t.textTop;
  const maxTitleWidth = width - pad * (isMinimalTemplate ? 2.35 : 2);
  const maxLines = isMinimalTemplate ? (isStory ? 3 : 2) : (isStory ? 4 : 3);
  const minTitleSize = Math.round((isStory ? 48 : isA4 ? 42 : 38) * scale);
  const fittedTitle = fitCanvasTextLines(
    ctx,
    (o.titleOverride && o.titleOverride.trim()) || o.item.title,
    titleFont,
    fontDef.weight,
    titleFontSize,
    minTitleSize,
    maxTitleWidth,
    maxLines,
  );
  const titleLineGap = Math.round((isMinimalTemplate ? 12 : 6) * scale);
  ctx.font = `${fontDef.weight} ${fittedTitle.size}px ${titleFont}`;
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  // Margem de descender (g/p/ç/y) — evita que letras com perna sejam
  // cortadas pela borda inferior do canvas.
  const descenderMargin = Math.round(fittedTitle.size * 0.22);
  let titleY = y - descenderMargin;
  for (let i = fittedTitle.lines.length - 1; i >= 0; i--) {
    ctx.fillText(fittedTitle.lines[i], pad, titleY);
    titleY -= fittedTitle.size + titleLineGap;
  }

  // Aggressive: CTA "FALE AGORA"
  if (o.density === "aggressive") {
    const cta = "👉 FALE AGORA";
    const ctaFs = Math.round(34 * scale);
    ctx.font = `900 ${ctaFs}px ${baseFont}`;
    const cm = ctx.measureText(cta);
    const cp = Math.round(18 * scale);
    const cw = cm.width + cp * 2;
    const ch = ctaFs + cp;
    const cx = pad;
    const cy = y - ch - Math.round(14 * scale);
    ctx.fillStyle = t.accent;
    drawRoundedRect(ctx, cx, cy, cw, ch, Math.round(10 * scale));
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(cta, cx + cw / 2, cy + ch / 2);
  }

  /* ── 10. Watermark sutil ── */
  if (o.showWatermark) {
    const wmFs = Math.round(22 * scale);
    ctx.font = `600 ${wmFs}px ${baseFont}`;
    ctx.fillStyle = "rgba(255,255,255,0.32)";
    ctx.textAlign = "right";
    ctx.textBaseline = "top";
    ctx.fillText("Capimobi", width - pad, pad - Math.round(2 * scale));
  }

  return canvas.toDataURL(o.format === "a4" ? "image/png" : "image/jpeg", 0.94);
}

/* ═══════════════════════════════════════════════════════════════
   FONT LOADER (carrega Google Fonts uma vez)
   ═══════════════════════════════════════════════════════════════ */
function ensureGoogleFonts() {
  if (typeof document === "undefined") return;
  if (document.getElementById("__capimobi_gallery_fonts")) return;
  const link = document.createElement("link");
  link.id = "__capimobi_gallery_fonts";
  link.rel = "stylesheet";
  link.href = "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800;900&family=Montserrat:wght@600;700;800;900&family=Poppins:wght@600;700;800&family=Inter:wght@600;700;800;900&family=Lora:wght@600;700&family=DM+Sans:wght@500;700&display=swap";
  document.head.appendChild(link);
}

/* ═══════════════════════════════════════════════════════════════
   COMPONENTE PRINCIPAL
   ═══════════════════════════════════════════════════════════════ */
export default function SellerGalleryTab({ userId, sellerId, sellerSlug, sellerName, sellerPhone, sellerLogo, sellerCreci }: Props) {
  const { toast } = useToast();
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);

  // Editor state
  const [selectedFormat, setSelectedFormat] = useState<ImageFormat>("post");
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateId>("moderno_premium");
  const [selectedFont, setSelectedFont] = useState<FontId>("montserrat");
  const [selectedDensity, setSelectedDensity] = useState<TextDensity>("medium");
  const [selectedBadge, setSelectedBadge] = useState<BadgeKind>("auto");
  const [showLogo, setShowLogo] = useState(true);
  const [showWatermark, setShowWatermark] = useState(false);
  const [autoTemplateUsed, setAutoTemplateUsed] = useState(false);

  // Image adjustments
  const [brightness, setBrightness] = useState(1);
  const [contrast, setContrast] = useState(1);
  const [saturate, setSaturate] = useState(1);
  const [hdr, setHdr] = useState(false);

  // Preview
  const [previewDataUrl, setPreviewDataUrl] = useState<string | null>(null);
  const [generatingPreview, setGeneratingPreview] = useState(false);
  const [batchGenerating, setBatchGenerating] = useState(false);
  const [batchResults, setBatchResults] = useState<{ format: ImageFormat; templateId: TemplateId; url: string; name: string }[]>([]);
  const batchResultsRef = useRef<HTMLDivElement | null>(null);
  const [batchHighlight, setBatchHighlight] = useState(false);
  const [copiedAdText, setCopiedAdText] = useState(false);
  const [showAdvancedAdjust, setShowAdvancedAdjust] = useState(false);
  const [aiHeadline, setAiHeadline] = useState<string | null>(null);
  const [aiHeadlineLoading, setAiHeadlineLoading] = useState(false);

  useEffect(() => { ensureGoogleFonts(); }, []);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("seller_items")
        .select("id, title, photos, price, city, neighborhood, category, bedrooms, bathrooms, area, description, suites, parking_spots, built_area, finality, address, condo_fee, iptu, pool, furnished, balcony, barbecue, garden, accepts_financing, slug")
        .eq("seller_id", sellerId)
        .eq("status", "ativo")
        .order("created_at", { ascending: false });
      setItems((data as GalleryItem[]) || []);
      setLoading(false);
    })();
  }, [sellerId]);

  useEffect(() => {
    setSelectedPhotoIndex(0);
    setBatchResults([]);
    if (selectedItemId) {
      const item = items.find(i => i.id === selectedItemId);
      if (item) {
        const auto = autoDetectTemplate(item);
        setSelectedTemplate(auto);
        setAutoTemplateUsed(true);
      }
    }
  }, [selectedItemId, items]);

  const selectedItem = items.find((i) => i.id === selectedItemId);
  const photos = useMemo(() => selectedItem?.photos || [], [selectedItem?.photos]);
  const template = useMemo(() => TEMPLATES.find(t => t.id === selectedTemplate)!, [selectedTemplate]);
  const effectiveBadge: Exclude<BadgeKind, "auto"> | null = useMemo(() => {
    if (selectedBadge === "auto") return selectedItem ? autoBadge(selectedItem) : null;
    return selectedBadge;
  }, [selectedBadge, selectedItem]);

  const galleryUrl = selectedItem
    ? `${window.location.origin}/imoveis/produto/${selectedItem.slug || selectedItem.id}${sellerSlug ? `?corretor=${sellerSlug}` : ""}`
    : "";

  const buildOpts = useCallback((overrides: Partial<GenOpts> = {}): GenOpts | null => {
    if (!selectedItem) return null;
    const photoUrl = photos[selectedPhotoIndex] || photos[0];
    if (!photoUrl) return null;
    return {
      item: selectedItem,
      format: selectedFormat,
      template,
      font: selectedFont,
      density: selectedDensity,
      badge: effectiveBadge,
      photoUrl,
      showLogo,
      showWatermark,
      sellerName, sellerPhone, sellerCreci, sellerLogo,
      brightness, contrast, saturate, hdr,
      titleOverride: aiHeadline,
      ...overrides,
    };
  }, [selectedItem, photos, selectedPhotoIndex, selectedFormat, template, selectedFont, selectedDensity, effectiveBadge, showLogo, showWatermark, sellerName, sellerPhone, sellerCreci, sellerLogo, brightness, contrast, saturate, hdr, aiHeadline]);

  /* ── Preview ao vivo (debounced) ── */
  useEffect(() => {
    if (!selectedItem) return;
    let cancelled = false;
    setGeneratingPreview(true);
    const timer = setTimeout(async () => {
      const opts = buildOpts();
      if (!opts) { setGeneratingPreview(false); return; }
      try {
        const url = await generateMarketingImage(opts);
        if (!cancelled) setPreviewDataUrl(url);
      } catch (e) {
        console.error(e);
        if (!cancelled) toast({ title: "Erro ao gerar preview", variant: "destructive" });
      } finally {
        if (!cancelled) setGeneratingPreview(false);
      }
    }, 250);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [buildOpts, selectedItem, toast]);

  /* ── Downloads ── */
  const downloadDataUrl = (url: string, name: string) => {
    const link = document.createElement("a");
    link.download = name;
    link.href = url;
    link.click();
  };

  const handleDownload = () => {
    if (!previewDataUrl || !selectedItem) return;
    const safe = selectedItem.title.replace(/[^a-zA-Z0-9À-ÿ ]/g, "").trim().replace(/\s+/g, "-");
    const ext = selectedFormat === "a4" ? "png" : "jpg";
    downloadDataUrl(previewDataUrl, `${safe}_${selectedFormat}.${ext}`);
    toast({ title: "Imagem baixada! 📸", description: `${FORMAT_CONFIG[selectedFormat].label} salvo com sucesso.` });
  };

  const handleDownloadPDF = async () => {
    if (!previewDataUrl || !selectedItem) return;
    try {
      const isLandscape = FORMAT_CONFIG[selectedFormat].width > FORMAT_CONFIG[selectedFormat].height;
      const pdf = new jsPDF({
        orientation: isLandscape ? "landscape" : "portrait",
        unit: "mm",
        format: selectedFormat === "a4" ? "a4" : [
          isLandscape ? 297 : 210,
          isLandscape ? 210 : 297,
        ],
      });
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const fmtCfg = FORMAT_CONFIG[selectedFormat];
      const ratio = fmtCfg.width / fmtCfg.height;
      let imgW = pageW, imgH = pageW / ratio;
      if (imgH > pageH) { imgH = pageH; imgW = pageH * ratio; }
      const x = (pageW - imgW) / 2;
      const y = (pageH - imgH) / 2;
      pdf.addImage(previewDataUrl, selectedFormat === "a4" ? "PNG" : "JPEG", x, y, imgW, imgH);
      const safe = selectedItem.title.replace(/[^a-zA-Z0-9À-ÿ ]/g, "").trim().replace(/\s+/g, "-");
      pdf.save(`${safe}_${selectedFormat}.pdf`);
      toast({ title: "PDF baixado! 📄", description: "Pronto para impressão ou WhatsApp." });
    } catch (e) {
      console.error(e);
      toast({ title: "Erro ao gerar PDF", variant: "destructive" });
    }
  };

  const handleShareWhatsApp = async () => {
    if (!selectedItem) return;
    const text = `🏠 *${selectedItem.title}*\n${selectedItem.price ? `💰 R$ ${selectedItem.price.toLocaleString("pt-BR")}` : ""}\n📍 ${selectedItem.neighborhood ? `${selectedItem.neighborhood}, ${selectedItem.city}` : selectedItem.city || ""}\n\n👉 ${galleryUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  /* ── Headline IA (chamada Lovable AI via edge function) ── */
  const handleGenerateAiHeadline = async () => {
    if (!selectedItem || aiHeadlineLoading) return;
    setAiHeadlineLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("gallery-ai-headline", {
        body: {
          title: selectedItem.title,
          category: selectedItem.category,
          location: selectedItem.neighborhood
            ? `${selectedItem.neighborhood}, ${selectedItem.city || ""}`
            : selectedItem.city || "",
          price: selectedItem.price,
          bedrooms: selectedItem.bedrooms,
          bathrooms: selectedItem.bathrooms,
          parking: selectedItem.parking_spots,
          area: selectedItem.area,
          operation: (selectedItem as any).operation || "venda",
        },
      });
      if (error) throw error;
      const headline: string | undefined = data?.headline;
      if (!headline) throw new Error("Sem retorno");
      setAiHeadline(headline);
      toast({ title: "Headline IA gerada ✨", description: headline });
    } catch (e: any) {
      const msg = e?.message || "Erro ao gerar headline";
      const isCredits = /402|cr\u00e9dito|credits/i.test(msg);
      toast({
        title: isCredits ? "Sem créditos IA" : "Erro ao gerar headline",
        description: isCredits ? "Recarregue créditos para usar a IA." : msg,
        variant: "destructive",
      });
    } finally {
      setAiHeadlineLoading(false);
    }
  };

  /* ── Geração em lote: 10 versões automáticas ── */
  const handleGenerate10Versions = async () => {
    if (!selectedItem) return;
    setBatchGenerating(true);
    setBatchResults([]);
    try {
      const opts = buildOpts();
      if (!opts) return;
      const tpls = TEMPLATES.slice(0, 10);
      const results: typeof batchResults = [];
      for (const tpl of tpls) {
        const url = await generateMarketingImage({ ...opts, template: tpl });
        results.push({ format: opts.format, templateId: tpl.id, url, name: tpl.name });
        setBatchResults([...results]);
      }
      toast({ title: "10 versões geradas! ✨", description: "Role para baixo para ver os resultados." });
      setBatchHighlight(true);
      setTimeout(() => batchResultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 120);
      setTimeout(() => setBatchHighlight(false), 2500);
    } catch (e) {
      console.error(e);
      toast({ title: "Erro ao gerar versões", variant: "destructive" });
    } finally {
      setBatchGenerating(false);
    }
  };

  /* ── Geração em lote: Pacote completo (todos os formatos) ── */
  const handleGenerateAllFormats = async () => {
    if (!selectedItem) return;
    setBatchGenerating(true);
    setBatchResults([]);
    try {
      const opts = buildOpts();
      if (!opts) return;
      const formats: ImageFormat[] = ["post", "feed45", "banner", "story", "a4"];
      const results: typeof batchResults = [];
      for (const fmt of formats) {
        const url = await generateMarketingImage({ ...opts, format: fmt });
        results.push({ format: fmt, templateId: template.id, url, name: FORMAT_CONFIG[fmt].label });
        setBatchResults([...results]);
      }
      toast({ title: "Pacote completo gerado! 🎁", description: "Role para baixo: Post, Story, Banner, Feed e Flyer prontos." });
      setBatchHighlight(true);
      setTimeout(() => batchResultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 120);
      setTimeout(() => setBatchHighlight(false), 2500);
    } catch (e) {
      console.error(e);
      toast({ title: "Erro ao gerar pacote", variant: "destructive" });
    } finally {
      setBatchGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  /* ─────────────────────────────────────────────────────────────
     STEP 1 — Seleção de imóvel
     ───────────────────────────────────────────────────────────── */
  if (!selectedItemId) {
    return (
      <div className="space-y-6">
        {/* Hero header */}
        <div className="relative overflow-hidden rounded-3xl p-6 sm:p-8 border border-border" style={{ background: "linear-gradient(135deg, hsl(var(--primary) / 0.12), hsl(var(--accent) / 0.08))" }}>
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/15 backdrop-blur-sm mb-3">
              <Sparkles size={14} className="text-primary" />
              <span className="text-[11px] font-bold text-primary tracking-wide uppercase">Central Premium</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
              Galeria de Anúncios
            </h2>
            <p className="text-sm text-muted-foreground mt-2 max-w-2xl">
              Crie artes profissionais para Instagram, Facebook, WhatsApp, Stories e Flyers PDF — em segundos. <strong className="text-foreground">10 templates premium</strong>, 5 formatos, IA de detecção automática e qualidade pronta para anúncios pagos.
            </p>
            <div className="flex flex-wrap gap-2 mt-4">
              {[
                { icon: Layers, label: "10 Templates" },
                { icon: Type, label: "5 Formatos" },
                { icon: Wand2, label: "IA Detecta o Estilo" },
                { icon: Package, label: "Pacote Completo" },
              ].map((b) => (
                <span key={b.label} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-background/60 border border-border text-[11px] font-bold text-foreground backdrop-blur-sm">
                  <b.icon size={12} className="text-primary" /> {b.label}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Grid de imóveis */}
        {items.length === 0 ? (
          <div className="text-center py-20 rounded-3xl border border-dashed border-border">
            <Image size={48} className="mx-auto mb-3 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">Você ainda não possui anúncios ativos.</p>
            <p className="text-xs text-muted-foreground/70 mt-1">Adicione um imóvel para começar a criar artes.</p>
          </div>
        ) : (
          <div>
            <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
              <Home size={16} className="text-primary" /> Selecione o imóvel
              <span className="text-[11px] font-medium text-muted-foreground">({items.length} disponíveis)</span>
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {items.map((item) => (
                <button
                  key={item.id}
                  onClick={() => { setSelectedItemId(item.id); setAiHeadline(null); }}
                  className="group text-left rounded-2xl overflow-hidden border border-border hover:border-primary/60 hover:shadow-xl transition-all bg-card"
                >
                  <div className="aspect-[4/3] relative overflow-hidden">
                    {item.photos?.[0] ? (
                      <img src={item.photos[0]} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" loading="lazy" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-muted">
                        <Image size={24} className="text-muted-foreground/40" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="absolute bottom-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-primary text-primary-foreground text-[10px] font-bold">
                        <Wand2 size={10} /> Criar Arte
                      </span>
                    </div>
                    {item.photos && item.photos.length > 0 && (
                      <span className="absolute bottom-2 right-2 bg-black/65 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md backdrop-blur-sm">
                        {item.photos.length} fotos
                      </span>
                    )}
                  </div>
                  <div className="p-2.5">
                    <h3 className="text-xs font-bold text-foreground line-clamp-2 leading-snug">{item.title}</h3>
                    {item.price && item.price > 0 && (
                      <p className="text-xs font-bold text-primary mt-1">R$ {item.price.toLocaleString("pt-BR")}</p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  /* ─────────────────────────────────────────────────────────────
     STEP 2 — Editor / Studio
     ───────────────────────────────────────────────────────────── */
  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <button onClick={() => setSelectedItemId(null)} className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
          <ChevronLeft size={16} /> Voltar
        </button>
        <div className="flex items-center gap-2 flex-wrap">
          {autoTemplateUsed && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-primary/10 text-primary border border-primary/20 text-[11px] font-bold">
              <Wand2 size={12} /> Template sugerido pela IA
            </span>
          )}
          <button onClick={() => { navigator.clipboard.writeText(galleryUrl); setCopied(true); toast({ title: "Link copiado!" }); setTimeout(() => setCopied(false), 2000); }} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-secondary text-foreground hover:bg-secondary/80 transition-colors">
            {copied ? <CheckCircle2 size={14} className="text-green-500" /> : <Copy size={14} />}
            {copied ? "Copiado!" : "Link"}
          </button>
          <button onClick={handleShareWhatsApp} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-green-500 text-white hover:bg-green-600 transition-colors">
            <Share2 size={14} /> WhatsApp
          </button>
        </div>
      </div>

      {/* ═══════════════════ STUDIO ═══════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr,360px] gap-5">
        {/* Preview ao vivo */}
        <div className="space-y-3">
          <div className="rounded-3xl border border-border bg-gradient-to-br from-muted/50 to-muted/20 p-4 sm:p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Eye size={16} className="text-primary" />
                <span className="text-sm font-bold text-foreground">Preview ao Vivo</span>
                <span className="text-[11px] text-muted-foreground">— {FORMAT_CONFIG[selectedFormat].label}</span>
              </div>
              {generatingPreview && <Loader2 size={14} className="animate-spin text-primary" />}
            </div>
            <div className="flex justify-center items-center min-h-[300px]">
              {previewDataUrl ? (
                <motion.img
                  key={previewDataUrl}
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  src={previewDataUrl}
                  alt="Preview"
                  className={`rounded-2xl shadow-2xl ${
                    selectedFormat === "story" || selectedFormat === "feed45" || selectedFormat === "a4" ? "max-h-[600px]" :
                    selectedFormat === "post" ? "max-h-[500px] max-w-[500px]" : "max-w-full"
                  }`}
                  style={{ objectFit: "contain" }}
                />
              ) : (
                <div className="flex flex-col items-center gap-2 py-10 text-muted-foreground">
                  <Loader2 size={24} className="animate-spin" />
                  <span className="text-xs">Gerando preview...</span>
                </div>
              )}
            </div>
          </div>

          {/* Botões de ação */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button onClick={handleDownload} disabled={!previewDataUrl} className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-xs hover:opacity-90 transition disabled:opacity-50">
              <Download size={14} /> PNG/JPG
            </button>
            <button onClick={handleDownloadPDF} disabled={!previewDataUrl} className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-secondary text-foreground border border-border font-bold text-xs hover:bg-secondary/70 transition disabled:opacity-50">
              <FileText size={14} /> PDF
            </button>
            <button onClick={handleGenerate10Versions} disabled={batchGenerating} className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 text-white font-bold text-xs hover:opacity-90 transition disabled:opacity-50">
              {batchGenerating ? <Loader2 size={14} className="animate-spin" /> : <Layers size={14} />} 10 Versões
            </button>
            <button onClick={handleGenerateAllFormats} disabled={batchGenerating} className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white font-bold text-xs hover:opacity-90 transition disabled:opacity-50">
              {batchGenerating ? <Loader2 size={14} className="animate-spin" /> : <Package size={14} />} Pacote
            </button>
          </div>

          {/* Headline IA — gerada por Lovable AI */}
          <div className="mt-3 rounded-xl border-2 border-dashed border-primary/30 bg-gradient-to-br from-violet-500/5 via-fuchsia-500/5 to-pink-500/5 p-3">
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-1.5">
                <Sparkles size={14} className="text-fuchsia-500" />
                <span className="text-xs font-bold text-foreground">Headline IA</span>
                <span className="text-[9px] font-bold text-fuchsia-600 bg-fuchsia-500/10 px-1.5 py-0.5 rounded">1 crédito</span>
              </div>
              {aiHeadline && (
                <button onClick={() => setAiHeadline(null)} className="text-[10px] text-muted-foreground hover:text-foreground">
                  Usar título original
                </button>
              )}
            </div>
            {aiHeadline ? (
              <div className="space-y-2">
                <p className="text-sm font-bold text-foreground leading-snug">"{aiHeadline}"</p>
                <button onClick={handleGenerateAiHeadline} disabled={aiHeadlineLoading} className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white font-bold text-[11px] hover:opacity-90 transition disabled:opacity-50">
                  {aiHeadlineLoading ? <Loader2 size={12} className="animate-spin" /> : <Wand2 size={12} />}
                  Gerar outra
                </button>
              </div>
            ) : (
              <button onClick={handleGenerateAiHeadline} disabled={aiHeadlineLoading || !selectedItem} className="w-full flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg bg-gradient-to-br from-violet-500 via-fuchsia-500 to-pink-500 text-white font-bold text-xs hover:opacity-90 transition disabled:opacity-50">
                {aiHeadlineLoading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                {aiHeadlineLoading ? "Criando chamada perfeita..." : "Gerar Headline com IA ✨"}
              </button>
            )}
            <p className="text-[10px] text-muted-foreground mt-1.5 leading-tight">
              Cria uma chamada de marketing curta e persuasiva para substituir o título cru do imóvel na arte.
            </p>
          </div>
        </div>

        {/* Painel de controles */}
        <div className="space-y-4">
          {/* Foto */}
          {photos.length > 1 && (
            <Section title="Foto" icon={Image}>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {photos.map((p, i) => (
                  <button key={i} onClick={() => setSelectedPhotoIndex(i)} className={`relative flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden border-2 transition-all ${selectedPhotoIndex === i ? "border-primary ring-2 ring-primary/30" : "border-border hover:border-primary/40"}`}>
                    <img src={p} alt="" className="w-full h-full object-cover" loading="lazy" />
                  </button>
                ))}
              </div>
            </Section>
          )}

          {/* Formato */}
          <Section title="Formato" icon={Layers}>
            <div className="grid grid-cols-5 gap-1.5">
              {(Object.keys(FORMAT_CONFIG) as ImageFormat[]).map((fmt) => {
                const cfg = FORMAT_CONFIG[fmt];
                const active = selectedFormat === fmt;
                return (
                  <button key={fmt} onClick={() => setSelectedFormat(fmt)} title={cfg.description} className={`flex flex-col items-center gap-1 p-2 rounded-lg border-2 transition-all ${active ? "border-primary bg-primary/10" : "border-border hover:border-primary/40"}`}>
                    <span className="text-base leading-none">{cfg.icon}</span>
                    <span className="text-[9px] font-bold text-foreground">{cfg.short}</span>
                  </button>
                );
              })}
            </div>
            <p className="text-[10px] text-muted-foreground mt-1.5">{FORMAT_CONFIG[selectedFormat].description}</p>
          </Section>

          {/* Templates */}
          <Section title="Template" icon={Award}>
            <div className="grid grid-cols-2 gap-1.5 max-h-72 overflow-y-auto pr-1">
              {TEMPLATES.map((tpl) => {
                const active = selectedTemplate === tpl.id;
                return (
                  <button key={tpl.id} onClick={() => { setSelectedTemplate(tpl.id); setAutoTemplateUsed(false); }} className={`relative text-left p-2 rounded-lg border-2 transition-all overflow-hidden ${active ? "border-primary ring-2 ring-primary/20" : "border-border hover:border-primary/40"}`}>
                    <div className="absolute inset-0 opacity-30" style={{ background: tpl.previewBg }} />
                    <div className="relative">
                      <div className="flex items-center gap-1">
                        <span className="text-sm">{tpl.emoji}</span>
                        {tpl.premium && <Crown size={9} className="text-amber-400" />}
                      </div>
                      <p className="text-[10px] font-bold text-foreground mt-0.5 leading-tight">{tpl.name}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </Section>

          {/* Selo */}
          <Section title="Selo" icon={ShieldCheck}>
            <div className="grid grid-cols-3 gap-1.5">
              {(["auto", "venda", "aluguel", "exclusivo", "oportunidade", "lancamento"] as BadgeKind[]).map((b) => {
                const active = selectedBadge === b;
                const label = b === "auto" ? "Auto" : BADGE_LABELS[b as Exclude<BadgeKind, "auto">];
                return (
                  <button key={b} onClick={() => setSelectedBadge(b)} className={`px-2 py-1.5 rounded-lg border-2 text-[10px] font-bold transition-all ${active ? "border-primary bg-primary/10 text-primary" : "border-border text-foreground hover:border-primary/40"}`}>
                    {label}
                  </button>
                );
              })}
            </div>
          </Section>

          {/* Fonte */}
          <Section title="Fonte" icon={Type}>
            <div className="grid grid-cols-3 gap-1.5">
              {(Object.keys(FONTS) as FontId[]).map((f) => {
                const active = selectedFont === f;
                const cfg = FONTS[f];
                return (
                  <button key={f} onClick={() => setSelectedFont(f)} className={`flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg border-2 transition-all ${active ? "border-primary bg-primary/10" : "border-border hover:border-primary/40"}`}>
                    <span className="text-base font-bold text-foreground" style={{ fontFamily: cfg.family }}>Aa</span>
                    <span className="text-[9px] font-bold text-foreground leading-none">{cfg.label}</span>
                  </button>
                );
              })}
            </div>
          </Section>

          {/* Densidade de texto */}
          <Section title="Texto" icon={FileText}>
            <div className="grid grid-cols-2 gap-1.5">
              {(Object.keys(DENSITY_LABEL) as TextDensity[]).map((d) => {
                const active = selectedDensity === d;
                return (
                  <button key={d} onClick={() => setSelectedDensity(d)} className={`px-2 py-1.5 rounded-lg border-2 text-[10px] font-bold transition-all ${active ? "border-primary bg-primary/10 text-primary" : "border-border text-foreground hover:border-primary/40"}`}>
                    {DENSITY_LABEL[d]}
                  </button>
                );
              })}
            </div>
          </Section>

          {/* Toggles */}
          <Section title="Identidade" icon={Crown}>
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={showLogo} onChange={(e) => setShowLogo(e.target.checked)} className="w-4 h-4 rounded border-border text-primary focus:ring-primary" />
                <span className="text-[11px] font-semibold text-foreground">Logo do corretor</span>
                {showLogo && sellerLogo && <img src={sellerLogo} alt="" className="w-5 h-5 rounded-full object-cover border border-border" />}
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={showWatermark} onChange={(e) => setShowWatermark(e.target.checked)} className="w-4 h-4 rounded border-border text-primary focus:ring-primary" />
                <span className="text-[11px] font-semibold text-foreground">Marca d'água Capimobi</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={hdr} onChange={(e) => setHdr(e.target.checked)} className="w-4 h-4 rounded border-border text-primary focus:ring-primary" />
                <span className="text-[11px] font-semibold text-foreground flex items-center gap-1"><Zap size={11} className="text-amber-500" /> HDR leve (valoriza fachada)</span>
              </label>
            </div>
          </Section>

          {/* Ajustes avançados */}
          <Section title="Ajustes de Imagem" icon={Sliders} extra={
            <button onClick={() => setShowAdvancedAdjust(v => !v)} className="text-[10px] font-bold text-primary hover:underline">
              {showAdvancedAdjust ? "Ocultar" : "Mostrar"}
            </button>
          }>
            {showAdvancedAdjust && (
              <div className="space-y-2.5">
                <Slider label="Brilho" value={brightness} min={0.7} max={1.4} step={0.05} onChange={setBrightness} />
                <Slider label="Contraste" value={contrast} min={0.7} max={1.4} step={0.05} onChange={setContrast} />
                <Slider label="Saturação" value={saturate} min={0.5} max={1.6} step={0.05} onChange={setSaturate} />
                <button onClick={() => { setBrightness(1); setContrast(1); setSaturate(1); setHdr(false); }} className="w-full text-[10px] font-bold text-muted-foreground hover:text-foreground py-1">
                  Resetar ajustes
                </button>
              </div>
            )}
          </Section>
        </div>
      </div>

      {/* ═══════════════════ Batch Results ═══════════════════ */}
      {batchResults.length > 0 && (
        <motion.div
          ref={batchResultsRef}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className={`rounded-3xl border-2 p-4 sm:p-5 transition-all ${batchHighlight ? "border-primary ring-4 ring-primary/30 shadow-2xl shadow-primary/20" : "border-border"}`}
        >
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Sparkles size={16} className="text-primary" /> Resultados ({batchResults.length})
              {batchGenerating && <Loader2 size={14} className="animate-spin text-primary" />}
            </h3>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  const safe = selectedItem!.title.replace(/[^a-zA-Z0-9À-ÿ ]/g, "").trim().replace(/\s+/g, "-");
                  batchResults.forEach((r, idx) => {
                    setTimeout(() => downloadDataUrl(r.url, `${safe}_${r.format}_${r.templateId}.jpg`), idx * 200);
                  });
                  toast({ title: `Baixando ${batchResults.length} imagens...` });
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-primary text-primary-foreground hover:opacity-90 transition"
              >
                <Download size={12} /> Baixar todas
              </button>
              <button onClick={() => setBatchResults([])} className="text-[11px] text-muted-foreground hover:text-foreground">✕ Limpar</button>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {batchResults.map((r, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                className="rounded-xl overflow-hidden border border-border group bg-card hover:shadow-lg transition"
              >
                <img src={r.url} alt={r.name} className="w-full aspect-square object-cover" />
                <div className="p-2">
                  <p className="text-[10px] font-bold text-foreground line-clamp-1">{r.name}</p>
                  <button onClick={() => {
                    const safe = selectedItem!.title.replace(/[^a-zA-Z0-9À-ÿ ]/g, "").trim().replace(/\s+/g, "-");
                    downloadDataUrl(r.url, `${safe}_${r.format}_${r.templateId}.jpg`);
                  }} className="mt-1 w-full flex items-center justify-center gap-1 px-2 py-1 rounded-md bg-primary text-primary-foreground text-[10px] font-bold hover:opacity-90">
                    <Download size={10} /> Baixar
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Indicador inline (acima do estudio) durante geração */}
      {batchGenerating && batchResults.length === 0 && (
        <div className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-primary/10 border border-primary/30 text-primary text-xs font-bold">
          <Loader2 size={14} className="animate-spin" /> Gerando imagens... aguarde alguns segundos.
        </div>
      )}


      {/* ═══════════════════ Texto pronto para anúncio ═══════════════════ */}
      {selectedItem && (() => {
        const item = selectedItem;
        const isRent = item.finality === "aluguel" || item.category === "aluguel";
        const priceLabel = isRent ? "/mês" : "";
        const lines: string[] = [];
        lines.push(`🏠 *${item.title}*`); lines.push("");
        if (item.price && item.price > 0) lines.push(`💰 *R$ ${item.price.toLocaleString("pt-BR")}${priceLabel}*`);
        const loc = [item.neighborhood, item.city].filter(Boolean).join(", ");
        if (loc) lines.push(`📍 ${loc}`);
        if (item.address) lines.push(`🗺️ ${item.address}`);
        lines.push("");
        const specs: string[] = [];
        if (item.bedrooms) specs.push(`🛏 ${item.bedrooms} quarto${item.bedrooms > 1 ? "s" : ""}`);
        if (item.suites) specs.push(`🛁 ${item.suites} suíte${item.suites > 1 ? "s" : ""}`);
        if (item.bathrooms) specs.push(`🚿 ${item.bathrooms} banheiro${item.bathrooms > 1 ? "s" : ""}`);
        if (item.parking_spots) specs.push(`🚗 ${item.parking_spots} vaga${item.parking_spots > 1 ? "s" : ""}`);
        if (item.area) specs.push(`📐 ${item.area}m² total`);
        if (item.built_area) specs.push(`🏗️ ${item.built_area}m² construída`);
        if (specs.length > 0) { lines.push("📋 *Detalhes:*"); specs.forEach(s => lines.push(`  ${s}`)); lines.push(""); }
        const feats: string[] = [];
        if (item.pool) feats.push("Piscina"); if (item.furnished) feats.push("Mobiliado"); if (item.balcony) feats.push("Varanda");
        if (item.barbecue) feats.push("Churrasqueira"); if (item.garden) feats.push("Jardim"); if (item.accepts_financing) feats.push("Aceita financiamento");
        if (feats.length > 0) { lines.push(`✅ ${feats.join(" • ")}`); lines.push(""); }
        if (item.description) { lines.push(item.description.length > 300 ? item.description.slice(0, 297) + "..." : item.description); lines.push(""); }
        const itemSlug = item.slug || item.id;
        lines.push(`👉 Veja mais: ${window.location.origin}/imoveis/produto/${itemSlug}${sellerSlug ? `?corretor=${sellerSlug}` : ""}`);
        lines.push("");
        lines.push(`📞 ${sellerName}${sellerCreci ? ` | CRECI ${sellerCreci}` : ""}${sellerPhone ? ` | ${sellerPhone}` : ""}`);
        const adText = lines.join("\n");
        const doCopy = () => {
          navigator.clipboard.writeText(adText);
          setCopiedAdText(true);
          toast({ title: "Texto copiado! 📋" });
          setTimeout(() => setCopiedAdText(false), 2500);
        };
        return (
          <div className="rounded-2xl border border-border p-4 sm:p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText size={18} className="text-primary" />
                <h3 className="font-bold text-sm text-foreground">Texto Pronto para Anúncio</h3>
              </div>
              <button onClick={doCopy} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${copiedAdText ? "bg-green-500 text-white" : "bg-primary text-primary-foreground hover:opacity-90"}`}>
                {copiedAdText ? <CheckCircle2 size={14} /> : <Copy size={14} />}
                {copiedAdText ? "Copiado!" : "Copiar Texto"}
              </button>
            </div>
            <pre className="whitespace-pre-wrap text-xs text-foreground/80 bg-secondary/50 rounded-xl p-4 border border-border max-h-60 overflow-y-auto font-sans leading-relaxed">{adText}</pre>
          </div>
        );
      })()}

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxIndex !== null && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center" onClick={() => setLightboxIndex(null)}>
            <button className="absolute top-4 right-4 text-white/70 hover:text-white z-10" onClick={() => setLightboxIndex(null)}><X size={28} /></button>
            <motion.img key={lightboxIndex} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} src={photos[lightboxIndex]} alt="" className="max-w-[90vw] max-h-[85vh] object-contain rounded-lg" onClick={(e) => e.stopPropagation()} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SUBCOMPONENTES
   ═══════════════════════════════════════════════════════════════ */

function Section({ title, icon: Icon, extra, children }: { title: string; icon: LucideIcon; extra?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border p-3 bg-card">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <Icon size={13} className="text-primary" />
          <span className="text-[11px] font-bold text-foreground uppercase tracking-wide">{title}</span>
        </div>
        {extra}
      </div>
      {children}
    </div>
  );
}

function Slider({ label, value, min, max, step, onChange }: { label: string; value: number; min: number; max: number; step: number; onChange: (n: number) => void }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] font-semibold text-muted-foreground">{label}</span>
        <span className="text-[10px] font-bold text-foreground tabular-nums">{value.toFixed(2)}x</span>
      </div>
      <input
        type="range"
        min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-1.5 rounded-full bg-secondary appearance-none cursor-pointer accent-primary"
      />
    </div>
  );
}
