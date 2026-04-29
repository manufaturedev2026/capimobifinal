import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Heart, Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useFavorites } from "@/hooks/useFavorites";
import { formatPrice } from "@/data/products";
import PropertyCardSkeleton from "@/components/PropertyCardSkeleton";
import { useSiteSettings } from "@/hooks/useSiteSettings";

export default function FavoritesPage() {
  const { user } = useAuth();
  const { toggleFavorite, favoriteIds } = useFavorites();
  const { site_name } = useSiteSettings();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchItems = async () => {
      if (favoriteIds.size === 0) { setItems([]); setLoading(false); return; }
      const ids = Array.from(favoriteIds);
      const { data } = await supabase.from("seller_items").select("id, title, price, photos, thumbnail_url, city, neighborhood, category, status, slug").in("id", ids);
      setItems(data || []);
      setLoading(false);
    };
    fetchItems();
  }, [favoriteIds]);

  // Removed login gate — favorites work via localStorage for guests

  return (
    <div className="min-h-screen bg-secondary/50">
      <Helmet>
        <title>Meus Favoritos | {site_name}</title>
      </Helmet>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="font-display font-bold text-2xl text-foreground flex items-center gap-2">
          <Heart size={24} className="text-red-500 fill-red-500" /> Meus Favoritos
          <span className="text-sm font-normal text-muted-foreground ml-2">({favoriteIds.size})</span>
        </h1>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 mt-6">
            {Array.from({ length: 4 }).map((_, i) => <PropertyCardSkeleton key={i} />)}
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-20">
            <Heart size={48} className="mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Você ainda não favoritou nenhum imóvel</p>
            <Link to="/imoveis" className="mt-4 inline-block px-6 py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm">Ver Imóveis</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 mt-6">
            {items.map((item, i) => (
              <motion.div key={item.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                <div className="group bg-card border border-border rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                  <Link to={`/imoveis/produto/${item.slug || item.id}`}>
                    <div className="relative aspect-[4/3] overflow-hidden">
                      <img src={item.photos?.[0] || "/placeholder.svg"} alt={item.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" loading="lazy" />
                    </div>
                    <div className="p-4">
                      <h3 className="font-display font-bold text-base text-foreground line-clamp-1">{item.title}</h3>
                      <p className="text-lg font-bold text-emerald-500 mt-1">{formatPrice(item.price)}</p>
                      {(item.city || item.neighborhood) && (
                        <p className="text-xs text-muted-foreground mt-1">{[item.neighborhood, item.city].filter(Boolean).join(", ")}</p>
                      )}
                    </div>
                  </Link>
                  <div className="px-4 pb-4">
                    <button
                      onClick={() => toggleFavorite(item.id)}
                      className="w-full flex items-center justify-center gap-2 py-2 rounded-xl border border-border text-sm text-muted-foreground hover:text-red-500 hover:border-red-500/30 transition-colors"
                    >
                      <Trash2 size={14} /> Remover
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
