import { useRef, useState } from "react";
import { motion, useMotionValue, useTransform, PanInfo } from "framer-motion";
import { Link } from "react-router-dom";
import { Star } from "lucide-react";
import { formatPrice, getTagStyle, getTagLabel, type Product } from "@/data/products";
import FavoriteButton from "@/components/FavoriteButton";
import CompareButton from "@/components/CompareButton";
import PackageBadge from "@/components/PackageBadge";
import SoldCountdown from "@/components/SoldCountdown";
import { useFavorites } from "@/hooks/useFavorites";
import { useCompare } from "@/hooks/useCompare";

interface SwipeableCardProps {
  product: Product & Record<string, any>;
  company?: { id: string; name: string; logo: string; address: string } | null;
  index: number;
}

export default function SwipeablePropertyCard({ product, company, index }: SwipeableCardProps) {
  const { toggleFavorite, isFavorite } = useFavorites();
  const { addItem, isInCompare } = useCompare();
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-5, 5]);
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0.5, 1, 1, 1, 0.5]);
  const [swiped, setSwiped] = useState<"left" | "right" | null>(null);

  const handleDragEnd = (_: any, info: PanInfo) => {
    if (Math.abs(info.offset.x) > 100) {
      if (info.offset.x > 0) {
        // Swipe right = favorite
        toggleFavorite(product.id);
        setSwiped("right");
      } else {
        // Swipe left = compare
        addItem({
          id: product.id, title: product.title, image: product.image, price: product.price,
          bedrooms: product.bedrooms, bathrooms: product.bathrooms, area: product.area,
          city: product.city, neighborhood: product.neighborhood, category: product.category,
        });
        setSwiped("left");
      }
      setTimeout(() => setSwiped(null), 600);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      style={{ x, rotate, opacity }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.3}
      onDragEnd={handleDragEnd}
      className="touch-pan-y cursor-grab active:cursor-grabbing"
    >
      <Link to={`/imoveis/produto/${product.slug || product.id}`} draggable={false}>
        <div className={`group bg-card border rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 relative ${
          product.hasDestaque ? "border-amber-400/60 ring-2 ring-amber-400/40 shadow-[0_0_24px_rgba(251,191,36,0.18)]" :
          product.sellerTier === "prime" ? "border-purple-500/50 ring-1 ring-purple-500/20" :
          product.sellerTier === "premium" ? "border-amber-400/50 ring-1 ring-amber-400/20" : "border-border"
        } ${swiped === "right" ? "ring-2 ring-red-400" : swiped === "left" ? "ring-2 ring-primary" : ""}`}>
          <div className="relative aspect-[4/3] overflow-hidden">
            <img
              src={product.image}
              alt={product.title}
              className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 ${product.status === "vendido" ? "brightness-50 blur-[1px]" : ""}`}
              loading="lazy"
              draggable={false}
            />
            {product.status === "vendido" && (
              <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
                <span className="px-4 py-2 rounded-xl bg-red-600/90 text-white font-bold text-sm shadow-lg">❌ Vendido</span>
              </div>
            )}
            {product.allTags?.length > 0 && (
              <div className="absolute top-3 left-3 flex flex-wrap gap-1 max-w-[70%]">
                {product.allTags.slice(0, 3).map((t: string) => (
                  <span key={t} className={`px-2 py-0.5 rounded-full text-[10px] font-bold shadow ${getTagStyle(t)}`}>{getTagLabel(t)}</span>
                ))}
              </div>
            )}
            <div className="absolute top-3 right-3 flex flex-col items-end gap-1">
              <div className="flex items-center gap-1">
                <CompareButton isInCompare={isInCompare(product.id)} onClick={(e) => { e.preventDefault(); e.stopPropagation(); addItem({ id: product.id, title: product.title, image: product.image, price: product.price, bedrooms: product.bedrooms, bathrooms: product.bathrooms, area: product.area, city: product.city, neighborhood: product.neighborhood, category: product.category }); }} />
                <FavoriteButton isFavorite={isFavorite(product.id)} onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleFavorite(product.id); }} />
              </div>
              {product.hasDestaque && <span className="w-6 h-6 flex items-center justify-center rounded-full bg-amber-500/90 shadow-lg shadow-amber-500/30"><Star size={12} className="text-white" fill="white" /></span>}
              {!product.hasDestaque && product.sellerTier && product.sellerTier !== "basico" && <PackageBadge tier={product.sellerTier} />}
            </div>
            {product.hasBlackTag && <span className="absolute bottom-3 right-3 px-2.5 py-1 rounded-md text-[11px] font-bold bg-gradient-to-r from-zinc-900 to-black text-white shadow-lg ring-1 ring-white/20 z-10">BLACK</span>}
            {product.isAluguel && (
              <span className="absolute bottom-3 left-3 px-2 py-0.5 rounded-lg text-[10px] font-bold shadow-md bg-primary text-primary-foreground z-10">
                🏠 Aluguel
              </span>
            )}
          </div>

          <div className="p-4">
            <h3 className="font-display font-bold text-base md:text-lg text-foreground line-clamp-1">{product.title}</h3>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-xl font-bold text-emerald-500">
                {formatPrice(product.price)}
                {product.isAluguel && <span className="text-sm font-normal text-muted-foreground"> /mês</span>}
              </p>
            </div>
            {company && (
              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border">
                <img loading="lazy" decoding="async" src={company.logo} alt={company.name} className="w-8 h-8 rounded-full object-cover" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{company.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{company.address}</p>
                </div>
              </div>
            )}
          </div>

          {/* Swipe hints - mobile only */}
          <div className="absolute bottom-1 left-0 right-0 flex justify-between px-4 py-1 text-[9px] text-muted-foreground/50 md:hidden pointer-events-none">
            <span>← comparar</span>
            <span>favoritar →</span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
