import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Image, X, ChevronLeft, ChevronRight, Eye, Share2, Copy, CheckCircle2, Sparkles } from "lucide-react";
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
}

export default function SellerGalleryTab({ userId, sellerId, sellerSlug }: Props) {
  const { toast } = useToast();
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);

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
            <Sparkles size={20} className="text-primary" /> Criar Galeria / Showroom
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Selecione um imóvel para gerar uma galeria de fotos pronta para anunciar no Facebook Ads, Google Ads ou WhatsApp.
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

      {/* Hero Banner */}
      {photos.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative rounded-2xl overflow-hidden cursor-pointer group"
          onClick={() => setLightboxIndex(0)}
        >
          <img src={photos[0]} alt={selectedItem?.title} className="w-full aspect-[16/9] sm:aspect-[21/9] object-cover group-hover:scale-[1.02] transition-transform duration-700" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6">
            <h2 className="text-white font-extrabold text-lg sm:text-2xl leading-tight line-clamp-2">{selectedItem?.title}</h2>
            <div className="flex items-center gap-3 mt-2 flex-wrap">
              {selectedItem?.price && selectedItem.price > 0 && (
                <span className="text-white font-black text-base sm:text-xl">R$ {selectedItem.price.toLocaleString("pt-BR")}</span>
              )}
              {selectedItem?.city && (
                <span className="text-white/70 text-xs">📍 {selectedItem.neighborhood ? `${selectedItem.neighborhood}, ${selectedItem.city}` : selectedItem.city}</span>
              )}
            </div>
            <div className="flex items-center gap-3 mt-1.5 text-white/60 text-[11px]">
              {selectedItem?.bedrooms && <span>🛏 {selectedItem.bedrooms} quartos</span>}
              {selectedItem?.bathrooms && <span>🚿 {selectedItem.bathrooms} banheiros</span>}
              {selectedItem?.area && <span>📐 {selectedItem.area}m²</span>}
            </div>
          </div>
          <div className="absolute top-3 right-3 bg-black/50 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-1 rounded-lg flex items-center gap-1">
            <Eye size={12} /> Clique para ampliar
          </div>
        </motion.div>
      )}

      {/* Photo Grid */}
      {photos.length > 1 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
          {photos.slice(1).map((photo, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.03 }}
              className="aspect-square rounded-xl overflow-hidden cursor-pointer group relative"
              onClick={() => setLightboxIndex(i + 1)}
            >
              <img src={photo} alt={`Foto ${i + 2}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                <Eye size={20} className="text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" />
              </div>
            </motion.div>
          ))}
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
