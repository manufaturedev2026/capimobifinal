import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { MapPin, Image, Bed, Bath, Ruler, Car, ChevronRight, Building2, Home, Search } from "lucide-react";
import type { StoreLayoutProps } from "./types";

/**
 * Elegant Layout — Real estate agency / corretora style
 */
export default function StoreLayoutElegant({
  filteredProducts, subcategories, activeCategory, setActiveCategory,
  categoryCounts, storeTheme, corretorSlug, getTagStyle, getTagLabel,
  formatPrice,
}: StoreLayoutProps) {

  const getSpecIcons = (product: any) => {
    const specs: { icon: React.ReactNode; label: string }[] = [];
    if (product.bedrooms) specs.push({ icon: <Bed size={13} />, label: `${product.bedrooms}` });
    if (product.bathrooms) specs.push({ icon: <Bath size={13} />, label: `${product.bathrooms}` });
    if (product.area) specs.push({ icon: <Ruler size={13} />, label: `${product.area}m²` });
    if (product.parking_spots) specs.push({ icon: <Car size={13} />, label: `${product.parking_spots}` });
    return specs;
  };

  return (
    <div>
      {/* Category filter bar */}
      <div className="mb-8">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-4 px-4 pb-3">
          {subcategories.map((cat) => {
            const isActive = activeCategory === cat.slug;
            const count = categoryCounts[cat.slug] || 0;
            const isDisabled = cat.slug !== "todos" && count === 0;
            return (
              <button
                key={cat.slug}
                onClick={() => setActiveCategory(cat.slug)}
                disabled={isDisabled}
                className="flex-shrink-0 px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all border"
                style={{
                  background: isActive ? storeTheme.primary : "transparent",
                  color: isActive ? "#fff" : storeTheme.textMuted,
                  borderColor: isActive ? storeTheme.primary : storeTheme.border,
                  opacity: isDisabled ? 0.3 : 1,
                }}
              >
                {cat.name}
                {count > 0 && (
                  <span className="ml-1.5 opacity-70">({count})</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Property grid */}
      {filteredProducts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredProducts.map((product: any, i: number) => {
            const productLink = `/imoveis/produto/${product.id}${corretorSlug ? `?corretor=${corretorSlug}` : ""}`;
            const specs = getSpecIcons(product);
            const hasPrice = product.price > 0;

            return (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04, duration: 0.4 }}
              >
                <Link
                  to={productLink}
                  className="group block rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-2xl"
                  style={{
                    background: storeTheme.card,
                    border: `1px solid ${storeTheme.border}`,
                  }}
                >
                  {/* Image */}
                  <div className="relative aspect-[4/3] overflow-hidden">
                    {product.image ? (
                      <img
                        src={product.image}
                        alt={product.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center" style={{ background: `${storeTheme.border}` }}>
                        <Image size={32} style={{ color: storeTheme.textMuted }} />
                      </div>
                    )}

                    {/* Gradient overlay bottom */}
                    <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/50 to-transparent" />

                    {/* Tags */}
                    {product.tag && (
                      <span className={`absolute top-3 left-3 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wide ${getTagStyle(product.tag)}`}>
                        {getTagLabel(product.tag)}
                      </span>
                    )}

                    {/* Price on image */}
                    {hasPrice && (
                      <div className="absolute bottom-3 left-3">
                        <p className="text-white font-bold text-lg drop-shadow-lg" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                          R$ {product.price.toLocaleString("pt-BR")}
                        </p>
                      </div>
                    )}

                    {/* Category badge */}
                    <div
                      className="absolute top-3 right-3 px-2.5 py-1 rounded-md text-[9px] font-bold uppercase tracking-widest backdrop-blur-sm"
                      style={{
                        background: `${storeTheme.primary}cc`,
                        color: "#fff",
                      }}
                    >
                      {product.category === "casa" ? "Casa" :
                       product.category === "apartamento" ? "Apto" :
                       product.category === "terreno" ? "Terreno" :
                       product.category === "comercial" ? "Comercial" :
                       product.category}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-4">
                    <h3
                      className="font-bold text-sm line-clamp-2 leading-snug mb-2"
                      style={{ color: storeTheme.text }}
                    >
                      {product.title}
                    </h3>

                    {/* Location */}
                    {product.city && (
                      <p className="text-[11px] flex items-center gap-1 mb-3" style={{ color: storeTheme.textMuted }}>
                        <MapPin size={11} />
                        {product.neighborhood ? `${product.neighborhood}, ${product.city}` : product.city}
                      </p>
                    )}

                    {/* Specs row */}
                    {specs.length > 0 && (
                      <div
                        className="flex items-center gap-3 pt-3 border-t"
                        style={{ borderColor: storeTheme.border }}
                      >
                        {specs.map((spec, idx) => (
                          <div
                            key={idx}
                            className="flex items-center gap-1 text-[11px] font-medium"
                            style={{ color: storeTheme.textMuted }}
                          >
                            <span style={{ color: storeTheme.primary }}>{spec.icon}</span>
                            {spec.label}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* CTA */}
                    <div
                      className="mt-3 flex items-center justify-between text-[11px] font-bold uppercase tracking-wide"
                      style={{ color: storeTheme.primary }}
                    >
                      <span>Ver detalhes</span>
                      <ChevronRight size={14} />
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-24">
          <Building2 size={40} className="mx-auto mb-3 opacity-30" style={{ color: storeTheme.textMuted }} />
          <p className="text-sm font-medium" style={{ color: storeTheme.textMuted }}>Nenhum imóvel encontrado</p>
          <p className="text-xs mt-1 opacity-60" style={{ color: storeTheme.textMuted }}>Tente outra categoria</p>
        </div>
      )}
    </div>
  );
}
