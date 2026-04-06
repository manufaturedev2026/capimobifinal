import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Image, X, ChevronLeft, ChevronRight, Eye, Share2, Copy, CheckCircle2, Sparkles, Download, Palette } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

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

type ImageFormat = "card" | "banner" | "story";
type ImageStyle = "verde" | "azul" | "vermelho" | "rosa" | "gold" | "roxo";

const FORMAT_CONFIG: Record<ImageFormat, { label: string; width: number; height: number; description: string }> = {
  card: { label: "Post (1:1)", width: 1080, height: 1080, description: "Instagram / Facebook" },
  banner: { label: "Banner (16:9)", width: 1920, height: 1080, description: "Facebook Ads / WhatsApp" },
  story: { label: "Story (9:16)", width: 1080, height: 1920, description: "Instagram Stories / Status" },
};

function makeStyle(
  label: string,
  accent: string,
  accentRgba: string,
  bgClass: string,
): typeof STYLE_CONFIG[ImageStyle] {
  return {
    label,
    priceBg: accent,
    priceFg: "#ffffff",
    gradientStops: ["rgba(0,0,0,0)", "rgba(0,0,0,0.65)", "rgba(0,0,0,0.95)"],
    titleColor: "#f0f0f0",
    detailColor: accentRgba,
    sellerColor: "rgba(255,255,255,0.5)",
    locationColor: "rgba(255,255,255,0.75)",
    accentBar: accent,
    fontFamily: "'Trebuchet MS', 'Helvetica Neue', Arial, sans-serif",
    preview: { bg: bgClass },
  };
}

const STYLE_CONFIG: Record<ImageStyle, {
  label: string;
  priceBg: string;
  priceFg: string;
  gradientStops: [string, string, string];
  titleColor: string;
  detailColor: string;
  sellerColor: string;
  locationColor: string;
  accentBar: string | null;
  fontFamily: string;
  preview: { bg: string };
}> = {
  verde: makeStyle("Verde", "#10b981", "rgba(16,185,129,0.8)", "bg-emerald-500"),
  azul: makeStyle("Azul", "#2563eb", "rgba(37,99,235,0.8)", "bg-blue-600"),
  vermelho: makeStyle("Vermelho", "#ef4444", "rgba(239,68,68,0.8)", "bg-red-500"),
  rosa: makeStyle("Rosa", "#ec4899", "rgba(236,72,153,0.8)", "bg-pink-500"),
  gold: makeStyle("Gold", "#d97706", "rgba(217,119,6,0.8)", "bg-amber-600"),
  roxo: makeStyle("Roxo", "#8b5cf6", "rgba(139,92,246,0.8)", "bg-violet-500"),
};

function formatPrice(price: number): string {
  return `R$ ${price.toLocaleString("pt-BR")}`;
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

async function generateMarketingImage(
  item: GalleryItem,
  format: ImageFormat,
  sellerName: string,
  sellerPhone: string | null,
  sellerCreci: string | null,
  sellerLogo: string | null,
  style: ImageStyle = "verde",
  photoUrl?: string,
): Promise<string> {
  const { width, height } = FORMAT_CONFIG[format];
  const s = STYLE_CONFIG[style];
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;

  // Draw background photo
  const imgSrc = photoUrl || item.photos?.[0];
  if (imgSrc) {
    try {
      const img = await loadImage(imgSrc);
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
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, width, height);
    } catch {
      ctx.fillStyle = "#1a1a2e";
      ctx.fillRect(0, 0, width, height);
    }
  } else {
    ctx.fillStyle = "#1a1a2e";
    ctx.fillRect(0, 0, width, height);
  }

  // Gradient overlay using style
  const gradH = height * 0.55;
  const grad = ctx.createLinearGradient(0, height - gradH, 0, height);
  grad.addColorStop(0, s.gradientStops[0]);
  grad.addColorStop(0.3, s.gradientStops[1]);
  grad.addColorStop(1, s.gradientStops[2]);
  ctx.fillStyle = grad;
  ctx.fillRect(0, height - gradH, width, gradH);

  // Top gradient for branding
  const topGrad = ctx.createLinearGradient(0, 0, 0, height * 0.15);
  topGrad.addColorStop(0, "rgba(0,0,0,0.6)");
  topGrad.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = topGrad;
  ctx.fillRect(0, 0, width, height * 0.15);

  // Accent bar at bottom (for gold/moderno styles)
  if (s.accentBar) {
    ctx.fillStyle = s.accentBar;
    ctx.fillRect(0, height - Math.round(4 * (width / 1080)), width, Math.round(4 * (width / 1080)));
  }

  const pad = Math.round(width * 0.045);
  const isStory = format === "story";
  const scale = width / 1080;
  const font = s.fontFamily;

  // Seller logo (top-left)
  if (sellerLogo) {
    try {
      const logoImg = await loadImage(sellerLogo);
      const logoSize = Math.round(48 * scale);
      ctx.save();
      drawRoundedRect(ctx, pad, pad, logoSize, logoSize, Math.round(8 * scale));
      ctx.clip();
      ctx.drawImage(logoImg, pad, pad, logoSize, logoSize);
      ctx.restore();
    } catch { /* skip logo */ }
  }

  // Price badge (top-right)
  if (item.price && item.price > 0) {
    const priceText = formatPrice(item.price);
    const priceFontSize = Math.round(28 * scale);
    ctx.font = `900 ${priceFontSize}px ${font}`;
    const priceMetrics = ctx.measureText(priceText);
    const badgePad = Math.round(16 * scale);
    const badgeW = priceMetrics.width + badgePad * 2;
    const badgeH = priceFontSize + badgePad * 1.2;
    const badgeX = width - pad - badgeW;
    const badgeY = pad;

    ctx.fillStyle = s.priceBg;
    drawRoundedRect(ctx, badgeX, badgeY, badgeW, badgeH, Math.round(10 * scale));
    ctx.fill();

    ctx.fillStyle = s.priceFg;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(priceText, badgeX + badgeW / 2, badgeY + badgeH / 2);
  }

  // Bottom content area
  let y = height - pad - (s.accentBar ? Math.round(6 * scale) : 0);

  // Seller info
  const sellerFontSize = Math.round(16 * scale);
  ctx.font = `600 ${sellerFontSize}px ${font}`;
  ctx.fillStyle = s.sellerColor;
  ctx.textAlign = "left";
  ctx.textBaseline = "bottom";

  let sellerLine = sellerName;
  if (sellerCreci) sellerLine += ` • CRECI ${sellerCreci}`;
  if (sellerPhone) sellerLine += ` • ${sellerPhone}`;
  ctx.fillText(sellerLine, pad, y);
  y -= sellerFontSize + Math.round(12 * scale);

  // Details row
  const details: string[] = [];
  if (item.bedrooms) details.push(`🛏 ${item.bedrooms} quartos`);
  if (item.bathrooms) details.push(`🚿 ${item.bathrooms} banheiros`);
  if (item.area) details.push(`📐 ${item.area}m²`);

  if (details.length > 0) {
    const detailFontSize = Math.round(18 * scale);
    ctx.font = `500 ${detailFontSize}px ${font}`;
    ctx.fillStyle = s.detailColor;
    ctx.fillText(details.join("   "), pad, y);
    y -= detailFontSize + Math.round(8 * scale);
  }

  // Location
  const location = item.neighborhood ? `📍 ${item.neighborhood}, ${item.city}` : item.city ? `📍 ${item.city}` : "";
  if (location) {
    const locFontSize = Math.round(20 * scale);
    ctx.font = `600 ${locFontSize}px ${font}`;
    ctx.fillStyle = s.locationColor;
    ctx.fillText(location, pad, y);
    y -= locFontSize + Math.round(10 * scale);
  }

  // Title
  const titleFontSize = Math.round((isStory ? 36 : 32) * scale);
  ctx.font = `800 ${titleFontSize}px ${font}`;
  ctx.fillStyle = s.titleColor;
  const maxTitleWidth = width - pad * 2;
  const words = item.title.split(" ");
  const titleLines: string[] = [];
  let currentLine = "";
  for (const word of words) {
    const test = currentLine ? `${currentLine} ${word}` : word;
    if (ctx.measureText(test).width > maxTitleWidth && currentLine) {
      titleLines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = test;
    }
  }
  if (currentLine) titleLines.push(currentLine);
  const maxLines = isStory ? 4 : 3;
  const visibleLines = titleLines.slice(0, maxLines);

  for (let i = visibleLines.length - 1; i >= 0; i--) {
    ctx.fillText(visibleLines[i], pad, y);
    y -= titleFontSize + Math.round(4 * scale);
  }

  return canvas.toDataURL("image/jpeg", 0.92);
}

export default function SellerGalleryTab({ userId, sellerId, sellerSlug, sellerName, sellerPhone, sellerLogo, sellerCreci }: Props) {
  const { toast } = useToast();
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  const [generating, setGenerating] = useState<ImageFormat | null>(null);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);
  const [selectedStyle, setSelectedStyle] = useState<ImageStyle>("verde");

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("seller_items")
        .select("id, title, photos, price, city, neighborhood, category, bedrooms, bathrooms, area")
        .eq("seller_id", sellerId)
        .eq("status", "ativo")
        .order("created_at", { ascending: false });
      setItems((data as GalleryItem[]) || []);
      setLoading(false);
    })();
  }, [sellerId]);

  useEffect(() => setSelectedPhotoIndex(0), [selectedItemId]);

  const selectedItem = items.find((i) => i.id === selectedItemId);
  const photos = selectedItem?.photos || [];

  const galleryUrl = selectedItem
    ? `${window.location.origin}/imoveis/produto/${selectedItem.id}${sellerSlug ? `?corretor=${sellerSlug}` : ""}`
    : "";

  const copyLink = () => {
    navigator.clipboard.writeText(galleryUrl);
    setCopied(true);
    toast({ title: "Link copiado!", description: "Cole no Facebook Ads, Google Ads ou WhatsApp." });
    setTimeout(() => setCopied(false), 2000);
  };

  const shareWhatsApp = () => {
    const text = `🏠 Confira este imóvel: *${selectedItem?.title}*\n\n📍 ${selectedItem?.city || ""}\n💰 ${selectedItem?.price ? `R$ ${selectedItem.price.toLocaleString("pt-BR")}` : "Consulte"}\n\n👉 ${galleryUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  const handleDownload = useCallback(async (format: ImageFormat) => {
    if (!selectedItem) return;
    setGenerating(format);
    try {
      const chosenPhoto = photos[selectedPhotoIndex] || photos[0];
      const dataUrl = await generateMarketingImage(selectedItem, format, sellerName, sellerPhone, sellerCreci, sellerLogo, selectedStyle, chosenPhoto);
      const link = document.createElement("a");
      link.download = `${selectedItem.title.replace(/[^a-zA-Z0-9À-ÿ ]/g, "").trim().replace(/\s+/g, "-")}_${format}.jpg`;
      link.href = dataUrl;
      link.click();
      toast({ title: "Imagem gerada! 📸", description: `Formato ${FORMAT_CONFIG[format].label} baixado com sucesso.` });
    } catch (err) {
      console.error("Error generating image:", err);
      toast({ title: "Erro ao gerar imagem", variant: "destructive" });
    } finally {
      setGenerating(null);
    }
  }, [selectedItem, sellerName, sellerPhone, sellerCreci, sellerLogo, selectedStyle, toast, photos, selectedPhotoIndex]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  /* ── Step 1: Select a property ── */
  if (!selectedItemId) {
    return (
      <div className="space-y-5">
        <div>
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <Sparkles size={20} className="text-primary" /> Galeria de Anúncios
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Crie imagens profissionais prontas para anunciar seus imóveis. Selecione um imóvel, escolha a foto e o formato ideal para Facebook Ads, Google Ads, Instagram ou WhatsApp — tudo com seus dados de corretor já incluídos.
          </p>
        </div>

        {items.length === 0 ? (
          <div className="text-center py-16 rounded-2xl border border-dashed border-border">
            <Image size={40} className="mx-auto mb-3 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">Você ainda não possui anúncios ativos.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {items.map((item) => (
              <button
                key={item.id}
                onClick={() => setSelectedItemId(item.id)}
                className="group text-left rounded-xl overflow-hidden border border-border hover:border-primary/50 hover:shadow-lg transition-all bg-card"
              >
                <div className="aspect-[4/3] relative overflow-hidden">
                  {item.photos?.[0] ? (
                    <img src={item.photos[0]} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-muted">
                      <Image size={24} className="text-muted-foreground/40" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  {item.photos && item.photos.length > 0 && (
                    <span className="absolute bottom-2 right-2 bg-black/60 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md backdrop-blur-sm">
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
        )}
      </div>
    );
  }

  /* ── Step 2: Gallery showroom ── */
  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button onClick={() => setSelectedItemId(null)} className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
          <ChevronLeft size={16} /> Voltar
        </button>
        <div className="flex items-center gap-2">
          <button onClick={copyLink} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-secondary text-foreground hover:bg-secondary/80 transition-colors">
            {copied ? <CheckCircle2 size={14} className="text-green-500" /> : <Copy size={14} />}
            {copied ? "Copiado!" : "Copiar Link"}
          </button>
          <button onClick={shareWhatsApp} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-green-500 text-white hover:bg-green-600 transition-colors">
            <Share2 size={14} /> WhatsApp
          </button>
        </div>
      </div>

      {/* Hero Banner — preview da foto selecionada com estilo */}
      {photos.length > 0 && (() => {
        const stylePreview = STYLE_CONFIG[selectedStyle];
        const titleStyle = { color: stylePreview.titleColor, fontFamily: stylePreview.fontFamily };
        return (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative rounded-2xl overflow-hidden cursor-pointer group"
            onClick={() => setLightboxIndex(selectedPhotoIndex)}
          >
            <AnimatePresence mode="wait">
              <motion.img
                key={`${selectedPhotoIndex}-${selectedStyle}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                src={photos[selectedPhotoIndex]}
                alt={selectedItem?.title}
                className="w-full aspect-[16/9] sm:aspect-[21/9] object-cover group-hover:scale-[1.02] transition-transform duration-700"
              />
            </AnimatePresence>
            <div className="absolute inset-0" style={{
              background: `linear-gradient(to top, ${stylePreview.gradientStops[2]}, ${stylePreview.gradientStops[1]} 50%, ${stylePreview.gradientStops[0]})`
            }} />
            {stylePreview.accentBar && (
              <div className="absolute bottom-0 left-0 right-0 h-1" style={{ backgroundColor: stylePreview.accentBar }} />
            )}
            <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6">
              {sellerLogo && (
                <img src={sellerLogo} alt="" className="w-8 h-8 rounded-lg object-cover mb-2 border border-white/20" />
              )}
              <h2 className="font-extrabold text-lg sm:text-2xl leading-tight line-clamp-2" style={titleStyle}>{selectedItem?.title}</h2>
              <div className="flex items-center gap-3 mt-2 flex-wrap">
                {selectedItem?.price && selectedItem.price > 0 && (
                  <span className="font-black text-base sm:text-xl" style={{ color: stylePreview.titleColor }}>R$ {selectedItem.price.toLocaleString("pt-BR")}</span>
                )}
                {selectedItem?.city && (
                  <span className="text-xs" style={{ color: stylePreview.locationColor }}>📍 {selectedItem.neighborhood ? `${selectedItem.neighborhood}, ${selectedItem.city}` : selectedItem.city}</span>
                )}
              </div>
              <div className="flex items-center gap-3 mt-1.5 text-[11px]" style={{ color: stylePreview.detailColor }}>
                {selectedItem?.bedrooms && <span>🛏 {selectedItem.bedrooms} quartos</span>}
                {selectedItem?.bathrooms && <span>🚿 {selectedItem.bathrooms} banheiros</span>}
                {selectedItem?.area && <span>📐 {selectedItem.area}m²</span>}
              </div>
              <p className="mt-1.5 text-[10px]" style={{ color: stylePreview.sellerColor }}>
                {sellerName}{sellerCreci ? ` • CRECI ${sellerCreci}` : ""}{sellerPhone ? ` • ${sellerPhone}` : ""}
              </p>
            </div>
            {selectedItem?.price && selectedItem.price > 0 && (
              <div className="absolute top-3 right-3 text-xs font-black px-3 py-1.5 rounded-lg" style={{ backgroundColor: stylePreview.priceBg, color: stylePreview.priceFg }}>
                {formatPrice(selectedItem.price)}
              </div>
            )}
            <div className="absolute top-3 left-3 bg-black/50 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-1 rounded-lg flex items-center gap-1">
              <Eye size={12} /> Preview — {stylePreview.label}
            </div>
          </motion.div>
        );
      })()}

      {/* Download Marketing Images */}
      {photos.length > 0 && selectedItem && (
        <div className="rounded-2xl border border-border p-4 sm:p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Download size={18} className="text-primary" />
            <h3 className="font-bold text-sm text-foreground">Baixar Imagem para Anúncio</h3>
          </div>
          <p className="text-xs text-muted-foreground">
            Selecione a foto e o formato para gerar uma imagem profissional com preço, localização e seus dados.
          </p>

          {/* Photo selector */}
          {photos.length > 1 && (
            <div className="space-y-1.5">
              <p className="text-[11px] font-semibold text-muted-foreground">Selecione a foto:</p>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {photos.map((photo, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedPhotoIndex(i)}
                    className={`relative flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                      selectedPhotoIndex === i
                        ? "border-primary ring-2 ring-primary/30"
                        : "border-border hover:border-primary/40"
                    }`}
                  >
                    <img src={photo} alt={`Foto ${i + 1}`} className="w-full h-full object-cover" loading="lazy" />
                    {selectedPhotoIndex === i && (
                      <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                        <CheckCircle2 size={16} className="text-primary-foreground drop-shadow-md" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Style selector */}
          <div className="space-y-1.5">
            <p className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1">
              <Palette size={12} /> Estilo do anúncio:
            </p>
            <div className="flex gap-2 flex-wrap">
              {(Object.keys(STYLE_CONFIG) as ImageStyle[]).map((key) => {
                const cfg = STYLE_CONFIG[key];
                const isActive = selectedStyle === key;
                return (
                  <button
                    key={key}
                    onClick={() => setSelectedStyle(key)}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border-2 transition-all ${
                      isActive
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/40"
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-full ${cfg.preview.bg}`} />
                    <span className="text-[11px] font-bold text-foreground">{cfg.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {(Object.keys(FORMAT_CONFIG) as ImageFormat[]).map((fmt) => {
              const cfg = FORMAT_CONFIG[fmt];
              const isGenerating = generating === fmt;
              return (
                <button
                  key={fmt}
                  onClick={() => handleDownload(fmt)}
                  disabled={!!generating}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl border border-border hover:border-primary/50 hover:bg-primary/5 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-left"
                >
                  <div className="flex-shrink-0">
                    {isGenerating ? (
                      <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Download size={18} className="text-primary" />
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-foreground">{cfg.label}</p>
                    <p className="text-[10px] text-muted-foreground">{cfg.description}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}


      {photos.length === 0 && (
        <div className="text-center py-16 rounded-2xl border border-dashed border-border">
          <Image size={40} className="mx-auto mb-3 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">Este imóvel não possui fotos.</p>
        </div>
      )}

      {/* Share CTA */}
      <div className="rounded-2xl p-4 sm:p-6 text-center" style={{ background: "linear-gradient(135deg, hsl(var(--primary) / 0.08), hsl(var(--accent) / 0.06))" }}>
        <Sparkles size={24} className="mx-auto mb-2 text-primary" />
        <h3 className="font-bold text-sm text-foreground mb-1">Pronto para anunciar!</h3>
        <p className="text-xs text-muted-foreground mb-3">Copie o link e cole no Facebook Ads, Google Ads ou envie pelo WhatsApp.</p>
        <div className="flex items-center gap-2 justify-center flex-wrap">
          <button onClick={copyLink} className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-primary text-primary-foreground hover:opacity-90 transition-opacity">
            <Copy size={14} /> Copiar Link da Galeria
          </button>
          <button onClick={shareWhatsApp} className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-green-500 text-white hover:bg-green-600 transition-colors">
            <Share2 size={14} /> Compartilhar no WhatsApp
          </button>
        </div>
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxIndex !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center"
            onClick={() => setLightboxIndex(null)}
          >
            <button className="absolute top-4 right-4 text-white/70 hover:text-white z-10" onClick={() => setLightboxIndex(null)}>
              <X size={28} />
            </button>

            {lightboxIndex > 0 && (
              <button
                className="absolute left-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white bg-white/10 rounded-full p-2 backdrop-blur-sm z-10"
                onClick={(e) => { e.stopPropagation(); setLightboxIndex(lightboxIndex - 1); }}
              >
                <ChevronLeft size={24} />
              </button>
            )}

            {lightboxIndex < photos.length - 1 && (
              <button
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white bg-white/10 rounded-full p-2 backdrop-blur-sm z-10"
                onClick={(e) => { e.stopPropagation(); setLightboxIndex(lightboxIndex + 1); }}
              >
                <ChevronRight size={24} />
              </button>
            )}

            <motion.img
              key={lightboxIndex}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              src={photos[lightboxIndex]}
              alt=""
              className="max-w-[90vw] max-h-[85vh] object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />

            <p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/50 text-xs font-medium">
              {lightboxIndex + 1} / {photos.length}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
