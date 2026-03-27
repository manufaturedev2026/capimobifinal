import { useState, useEffect } from "react";
import { Search } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice } from "@/data/products";

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (query.length < 2) { setResults([]); return; }
    const timeout = setTimeout(async () => {
      setLoading(true);
      const { data } = await supabase
        .from("seller_items")
        .select("id, title, price, photos, city, neighborhood, category, status")
        .eq("status", "ativo")
        .ilike("title", `%${query}%`)
        .limit(30);
      setResults(data || []);
      setLoading(false);
    }, 300);
    return () => clearTimeout(timeout);
  }, [query]);

  return (
    <div className="container max-w-6xl mx-auto px-4 py-8">
      <h1 className="font-display font-bold text-3xl text-foreground mb-6">Buscar Imóveis</h1>

      <div className="relative max-w-xl">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar imóveis, corretores, localização..."
          className="w-full pl-11 pr-4 py-3 rounded-xl bg-secondary text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          autoFocus
        />
      </div>

      <div className="mt-8">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
        ) : query.length < 2 ? (
          <p className="text-muted-foreground text-center py-16">Digite pelo menos 2 caracteres para buscar</p>
        ) : results.length > 0 ? (
          <>
            <p className="text-sm text-muted-foreground mb-4">{results.length} resultado(s) para "{query}"</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {results.map((item) => (
                <Link key={item.id} to={`/imoveis/produto/${item.id}`} className="group bg-card border border-border rounded-2xl overflow-hidden hover:shadow-lg transition-all">
                  <div className="aspect-[4/3] overflow-hidden">
                    <img src={item.photos?.[0] || ""} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  </div>
                  <div className="p-3">
                    <h3 className="font-semibold text-sm text-foreground line-clamp-2">{item.title}</h3>
                    <p className="text-primary font-bold text-sm mt-1">{formatPrice(item.price || 0)}</p>
                    <p className="text-xs text-muted-foreground mt-1">{[item.neighborhood, item.city].filter(Boolean).join(", ")}</p>
                  </div>
                </Link>
              ))}
            </div>
          </>
        ) : (
          <p className="text-muted-foreground text-center py-16">Nenhum resultado para "{query}"</p>
        )}
      </div>
    </div>
  );
}
