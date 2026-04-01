import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Home, Plus, MapPin, Eye, Users, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

function statusLabel(s: string | null) {
  const map: Record<string, { label: string; color: string }> = {
    disponivel: { label: "Disponível", color: "bg-emerald-500" },
    em_negociacao: { label: "Em Negociação", color: "bg-amber-500" },
    vendido: { label: "Vendido", color: "bg-red-500" },
  };
  return map[s || "disponivel"] || map.disponivel;
}

export default function MyListingsPage() {
  const { user, profile } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [captures, setCaptures] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !profile) return;

    const fetch = async () => {
      const { data } = await supabase
        .from("seller_items")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_owner_listing", true)
        .order("created_at", { ascending: false });

      setItems(data || []);

      // Count captures per item
      if (data && data.length > 0) {
        const ids = data.map((i: any) => i.id);
        const { data: capData } = await supabase
          .from("property_captures")
          .select("item_id")
          .in("item_id", ids);

        const counts: Record<string, number> = {};
        (capData || []).forEach((c: any) => {
          counts[c.item_id] = (counts[c.item_id] || 0) + 1;
        });
        setCaptures(counts);
      }

      setLoading(false);
    };

    fetch();
  }, [user, profile]);

  return (
    <div className="min-h-screen bg-secondary/50 py-8 px-4">
      <Helmet>
        <title>Meus Imóveis | ES Corretores</title>
      </Helmet>

      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="font-display font-bold text-2xl text-foreground">Meus Imóveis</h1>
          <Button asChild>
            <Link to="/anunciar-proprietario"><Plus size={18} /> Novo Anúncio</Link>
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary" size={32} /></div>
        ) : items.length === 0 ? (
          <div className="text-center py-20 bg-card border border-border rounded-2xl">
            <Home size={48} className="mx-auto text-muted-foreground mb-4" />
            <h3 className="font-display font-bold text-lg">Nenhum imóvel cadastrado</h3>
            <p className="text-muted-foreground mt-1 mb-4">Cadastre seu primeiro imóvel gratuitamente</p>
            <Button asChild><Link to="/anunciar-proprietario">Cadastrar Imóvel</Link></Button>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((item, i) => {
              const st = statusLabel(item.capture_status);
              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-card border border-border rounded-2xl p-4 flex gap-4"
                >
                  <div className="w-24 h-24 rounded-xl overflow-hidden bg-muted flex-shrink-0">
                    {item.photos?.[0] ? (
                      <img src={item.photos[0]} alt={item.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center"><Home size={24} className="text-muted-foreground" /></div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-display font-bold text-foreground line-clamp-1">{item.title}</h3>
                      <Badge className={`${st.color} text-white border-none text-xs flex-shrink-0`}>{st.label}</Badge>
                    </div>
                    {item.city && (
                      <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                        <MapPin size={12} /> {item.city}
                      </p>
                    )}
                    <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1"><Users size={14} /> {captures[item.id] || 0} corretores</span>
                      <span className="flex items-center gap-1"><Eye size={14} /> {item.views_count || 0} views</span>
                    </div>
                    {item.price && (
                      <p className="font-bold text-emerald-500 mt-1">
                        {item.price.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 })}
                      </p>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
