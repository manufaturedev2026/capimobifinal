import { Helmet } from "react-helmet-async";
import { useAuth } from "@/hooks/useAuth";
import { useMyCaptures } from "@/hooks/useCaptures";
import { Badge } from "@/components/ui/badge";
import { Home, MapPin, Phone, Loader2, ExternalLink } from "lucide-react";
import { motion } from "framer-motion";

function statusLabel(s: string) {
  const map: Record<string, { label: string; color: string }> = {
    disponivel: { label: "Disponível", color: "bg-emerald-500" },
    em_negociacao: { label: "Em Negociação", color: "bg-amber-500" },
    vendido: { label: "Vendido", color: "bg-red-500" },
  };
  return map[s] || map.em_negociacao;
}

export default function MyCapturesPage() {
  const { user } = useAuth();
  const { captures, loading } = useMyCaptures(user?.id);

  return (
    <div className="min-h-screen bg-secondary/50 py-8 px-4">
      <Helmet>
        <title>Minhas Captações | ES Corretores</title>
      </Helmet>

      <div className="max-w-4xl mx-auto">
        <h1 className="font-display font-bold text-2xl text-foreground mb-6">Minhas Captações</h1>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary" size={32} /></div>
        ) : captures.length === 0 ? (
          <div className="text-center py-20 bg-card border border-border rounded-2xl">
            <Home size={48} className="mx-auto text-muted-foreground mb-4" />
            <h3 className="font-display font-bold text-lg">Nenhuma captação ainda</h3>
            <p className="text-muted-foreground mt-1">Acesse a área de captação para encontrar imóveis disponíveis.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {captures.map((cap, i) => {
              const st = statusLabel(cap.status);
              const item = cap.item;
              return (
                <motion.div
                  key={cap.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-card border border-border rounded-2xl p-4 flex gap-4"
                >
                  <div className="w-24 h-24 rounded-xl overflow-hidden bg-muted flex-shrink-0">
                    {item?.photos?.[0] ? (
                      <img src={item.photos[0]} alt={item.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center"><Home size={24} className="text-muted-foreground" /></div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-display font-bold text-foreground line-clamp-1">{item?.title || "Imóvel"}</h3>
                      <Badge className={`${st.color} text-white border-none text-xs flex-shrink-0`}>{st.label}</Badge>
                    </div>
                    {item?.city && (
                      <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                        <MapPin size={12} /> {item.neighborhood ? `${item.neighborhood}, ` : ""}{item.city}
                      </p>
                    )}
                    {item?.price && (
                      <p className="font-bold text-emerald-500 mt-1">
                        {item.price.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 })}
                      </p>
                    )}
                    {/* Owner contact */}
                    <div className="mt-2 flex items-center gap-3 flex-wrap">
                      {item?.owner_phone && (
                        <a
                          href={`https://wa.me/55${item.owner_phone.replace(/\D/g, "")}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-sm text-primary font-semibold hover:underline"
                        >
                          <Phone size={14} /> {item.owner_phone}
                          <ExternalLink size={12} />
                        </a>
                      )}
                      {item?.profiles?.full_name && (
                        <span className="text-xs text-muted-foreground">Proprietário: {item.profiles.full_name}</span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Captado em {new Date(cap.captured_at).toLocaleDateString("pt-BR")}
                    </p>
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
