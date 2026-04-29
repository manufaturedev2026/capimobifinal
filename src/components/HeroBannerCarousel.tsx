import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { formatPrice } from "@/data/products";
import type { RealItem, RealSeller } from "@/hooks/useRealListings";
import PackageBadge from "@/components/PackageBadge";



interface HeroItem {
  id: string;
  sellerTier?: string;
  sellerId?: string;
  companyId?: string;
  city?: string;
  location?: string;
  title?: string;
  description?: string;
  price?: number;
  image?: string;
  images?: string[];
  realCategory?: string;
}

interface HeroBannerCarouselProps {
  items: HeroItem[];
  sellers: Record<string, { id: string; name: string; logo: string }>;
  featuredItemIds?: Set<string>;
  type: "imoveis";
  filterCity?: string;
  filterCategory?: string;
  fallbackImage: string;
  accentColor?: string;
}

const PAID_TIERS = ["start", "premium", "prime", "essencial_empresa", "premium_empresa", "prime_empresa"];
const INTERVAL = 6000;

export default function HeroBannerCarousel({
  items,
  sellers,
  featuredItemIds,
  type,
  filterCity,
  filterCategory,
  fallbackImage,
  accentColor = "text-primary",
}: HeroBannerCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Filter: only paid sellers, optionally by city, shuffle
  const heroItems = useMemo(() => {
    // First try: featured items from paid sellers
    let filtered = items.filter((item) => {
      const tier = item.sellerTier || "basico";
      if (!PAID_TIERS.includes(tier)) return false;
      if (featuredItemIds && featuredItemIds.size > 0) {
        return featuredItemIds.has(item.id);
      }
      return true;
    });

    // Fallback: if too few featured items, show all paid items
    if (filtered.length < 3) {
      filtered = items.filter((item) => {
        const tier = item.sellerTier || "basico";
        return PAID_TIERS.includes(tier);
      });
    }

    if (filterCity) {
      const cityLower = filterCity.toLowerCase();
      filtered = filtered.filter(
        (item) => (item.city || (item as any).location || "").toLowerCase() === cityLower
      );
    }

    // Filter by category if active
    if (filterCategory) {
      filtered = filtered.filter((item) => item.realCategory === filterCategory);
    }

    // Shuffle
    const shuffled = [...filtered].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 20);
  }, [items, filterCity, filterCategory, featuredItemIds]);

  // Auto-rotate
  useEffect(() => {
    if (heroItems.length <= 1 || isPaused) return;
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % heroItems.length);
    }, INTERVAL);
    return () => clearInterval(timer);
  }, [heroItems.length, isPaused]);

  // Reset index when items change
  useEffect(() => {
    setActiveIndex(0);
  }, [heroItems.length]);

  const currentItem = heroItems[activeIndex];
  const currentSeller = currentItem ? sellers[currentItem.sellerId || currentItem.companyId || ""] : undefined;

  const goNext = () => setActiveIndex((prev) => (prev + 1) % heroItems.length);
  const goPrev = () => setActiveIndex((prev) => (prev - 1 + heroItems.length) % heroItems.length);

  const getItemSegment = () => "imoveis";

  const productUrl = currentItem
    ? `/imoveis/produto/${currentItem.id}`
    : "";

  return (
    <div
      className="relative h-[55vh] md:h-[85vh] overflow-hidden"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Background Image */}
      <AnimatePresence mode="wait">
        <motion.img
          key={currentItem?.id || "fallback"}
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
          src={currentItem?.images?.[0] || currentItem?.image || fallbackImage}
          alt={currentItem?.title || ""}
          className="w-full h-full object-cover absolute inset-0"
        />
      </AnimatePresence>

      {/* Gradients */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/20" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/30 to-transparent" />

      {/* Back button */}
      <div className="absolute top-4 left-4 z-20">
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-card/60 backdrop-blur-md text-foreground text-sm font-medium hover:bg-card/80 transition-colors"
        >
          <ArrowLeft size={16} /> Voltar
        </Link>
      </div>

      {/* Content */}
      <div className="absolute bottom-0 left-0 right-0 p-6 md:p-12 z-10">
        <div className="container max-w-6xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentItem?.id || "empty"}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.5 }}
              className="max-w-2xl"
            >
              {currentSeller && (
                <div className="flex items-center gap-3 mb-3">
                  {currentSeller.logo ? (
                    <img
                      src={currentSeller.logo}
                      alt={currentSeller.name}
                      className="w-10 h-10 rounded-full object-cover border-2 border-white/30"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white font-bold">
                      {currentSeller.name.charAt(0)}
                    </div>
                  )}
                  <span className="text-sm font-semibold text-white/90">
                    {currentSeller.name}
                  </span>
                  {currentItem?.sellerTier && currentItem.sellerTier !== "basico" && (
                    <PackageBadge tier={currentItem.sellerTier as any} />
                  )}
                </div>
              )}
              <h1 className="font-display font-bold text-3xl md:text-5xl text-white drop-shadow-lg leading-tight">
                {currentItem?.title || (type === "imoveis" ? "Imóveis" : "Veículos")}
              </h1>
              <p className="text-white/75 mt-2 text-sm md:text-base line-clamp-2 max-w-lg">
                {currentItem?.description || `Encontre os melhores ${type === "imoveis" ? "imóveis" : "veículos"}`}
              </p>
              {currentItem && (
                <p className={`font-display font-bold text-2xl md:text-3xl mt-3 drop-shadow ${accentColor}`}>
                  {formatPrice(currentItem.price)}
                  {type === "imoveis" && currentItem.price < 20000 && (
                    <span className="text-base text-white/60 font-normal">/mês</span>
                  )}
                </p>
              )}
              {currentItem && (
                <Link
                  to={productUrl}
                  className="inline-flex items-center gap-2 mt-4 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:opacity-90 transition-opacity shadow-lg"
                >
                  Ver Anúncio <ArrowRight size={16} />
                </Link>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Navigation arrows */}
      {heroItems.length > 1 && (
        <>
          <button
            onClick={goPrev}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-card/40 backdrop-blur flex items-center justify-center text-white hover:bg-card/60 transition-colors"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={goNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-card/40 backdrop-blur flex items-center justify-center text-white hover:bg-card/60 transition-colors"
          >
            <ChevronRight size={20} />
          </button>

        </>
      )}
    </div>
  );
}