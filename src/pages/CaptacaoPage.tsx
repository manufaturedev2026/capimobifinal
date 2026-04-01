import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { useCaptureCount, CAPTURE_LIMITS } from "@/hooks/useCaptures";
import { toast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, MapPin, Home, Bed, Bath, Ruler, Lock, CheckCircle, Phone, ArrowRight, Filter, Loader2 } from "lucide-react";

interface OwnerListing {
  id: string;
  title: string;
  description: string | null;
  price: number | null;
  city: string | null;
  neighborhood: string | null;
  category: string;
  photos: string[] | null;
  bedrooms: number | null;
  bathrooms: number | null;
  area: number | null;
  capture_status: string | null;
  owner_phone: string | null;
  created_at: string;
  profiles?: { full_name: string; logo_url: string | null } | null;
}

const CATEGORIES = [
  { value: "all", label: "Todos os tipos" },
  { value: "casa", label: "Casa" },
  { value: "apartamento", label: "Apartamento" },
  { value: "terreno", label: "Terreno" },
  { value: "comercial", label: "Comercial" },
  { value: "galpao", label: "Galpão" },
  { value: "flat", label: "Flat" },
];

function formatPrice(price: number | null) {
  if (!price) return "Sob consulta";
  return price.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
}

function categoryLabel(cat: string) {
  const map: Record<string, string> = { casa: "Casa", apartamento: "Apto", terreno: "Terreno", comercial: "Comercial", galpao: "Galpão", flat: "Flat" };
  return map[cat] || cat;
}

export default function CaptacaoPage() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const { subscription, currentTier } = useSubscription(user?.id);
  const { count: monthlyCaptures } = useCaptureCount(user?.id);

  const [listings, setListings] = useState<OwnerListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [capturing, setCapturing] = useState<string | null>(null);
  const [revealedPhones, setRevealedPhones] = useState<Record<string, string>>({});

  // Filters
  const [search, setSearch] = useState("");
  const [cityFilter, setCityFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");

  const captureLimit = CAPTURE_LIMITS[currentTier] || 1;
  const canCapture = monthlyCaptures < captureLimit;

  useEffect(() => {
    fetchListings();
  }, []);

  const fetchListings = async () => {
    setLoading(true);
    let query = supabase
      .from("seller_items")
      .select("*, profiles!seller_items_seller_id_fkey(full_name, logo_url)")
      .eq("is_owner_listing", true)
      .eq("status", "ativo")
      .eq("capture_status", "disponivel" as any)
      .order("created_at", { ascending: false });

    const { data } = await query;
    setListings((data as any) || []);
    setLoading(false);
  };

  const filteredListings = listings.filter((l) => {
    if (search && !l.title.toLowerCase().includes(search.toLowerCase())) return false;
    if (cityFilter && cityFilter !== "all" && l.city?.toLowerCase() !== cityFilter.toLowerCase()) return false;
    if (categoryFilter && categoryFilter !== "all" && l.category !== categoryFilter) return false;
    if (priceMin && l.price && l.price < parseFloat(priceMin)) return false;
    if (priceMax && l.price && l.price > parseFloat(priceMax)) return false;
    return true;
  });

  const handleCapture = async (item: OwnerListing) => {
    if (!user || !profile) {
      toast({ title: "Faça login como corretor", variant: "destructive" });
      navigate("/entrar");
      return;
    }

    if (!canCapture) {
      toast({
        title: "Limite de captação atingido",
        description: `Seu plano ${currentTier} permite ${captureLimit} captação(ões) por mês. Faça upgrade para captar mais.`,
        variant: "destructive",
      });
      navigate("/pacotes");
      return;
    }

    setCapturing(item.id);
    try {
      const { error } = await supabase.from("property_captures").insert({
        item_id: item.id,
        broker_id: profile.id,
        broker_user_id: user.id,
        status: "em_negociacao" as any,
      });

      if (error) {
        if (error.code === "23505") {
          toast({ title: "Você já captou este imóvel", variant: "destructive" });
        } else {
          throw error;
        }
      } else {
        // Reveal owner phone
        setRevealedPhones((prev) => ({ ...prev, [item.id]: item.owner_phone || "Não informado" }));
        toast({
          title: "Imóvel captado com sucesso!",
          description: "O contato do proprietário foi liberado.",
        });
      }
    } catch (err: any) {
      toast({ title: "Erro ao captar", description: err.message, variant: "destructive" });
    } finally {
      setCapturing(null);
    }
  };

  const cities = [...new Set(listings.map((l) => l.city).filter(Boolean))];

  return (
    <div className="min-h-screen bg-secondary/50">
      <Helmet>
        <title>Captação de Imóveis | ES Corretores</title>
        <meta name="description" content="Encontre imóveis disponíveis para captação. Corretores, amplie seu portfólio captando imóveis de proprietários." />
      </Helmet>

      {/* Header */}
      <section className="bg-gradient-to-br from-primary via-primary to-[hsl(var(--navy))] text-primary-foreground py-10 px-4">
        <div className="max-w-6xl mx-auto">
          <h1 className="font-display font-bold text-2xl md:text-4xl">Captação de Imóveis</h1>
          <p className="text-primary-foreground/80 mt-2 text-sm md:text-base">
            Encontre imóveis disponíveis e amplie seu portfólio
          </p>
          {user && (
            <div className="mt-4 flex items-center gap-3 flex-wrap">
              <Badge variant="secondary" className="bg-white/20 text-white border-none">
                Plano: {currentTier.charAt(0).toUpperCase() + currentTier.slice(1)}
              </Badge>
              <Badge variant="secondary" className="bg-white/20 text-white border-none">
                Captações: {monthlyCaptures}/{captureLimit === 9999 ? "∞" : captureLimit} este mês
              </Badge>
            </div>
          )}
        </div>
      </section>

      {/* Filters */}
      <section className="px-4 py-4 border-b border-border bg-card sticky top-0 z-30">
        <div className="max-w-6xl mx-auto flex flex-wrap gap-3 items-center">
          <div className="flex-1 min-w-[200px] flex items-center gap-2 bg-secondary rounded-xl px-3">
            <Search size={18} className="text-muted-foreground" />
            <Input
              placeholder="Buscar imóveis..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="border-0 bg-transparent shadow-none focus-visible:ring-0"
            />
          </div>
          <Select value={cityFilter} onValueChange={setCityFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Cidade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todas as cidades</SelectItem>
              {cities.map((c) => (
                <SelectItem key={c} value={c!}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((c) => (
                <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </section>

      {/* Listings */}
      <section className="px-4 py-6">
        <div className="max-w-6xl mx-auto">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="animate-spin text-primary" size={32} />
            </div>
          ) : filteredListings.length === 0 ? (
            <div className="text-center py-20">
              <Home size={48} className="mx-auto text-muted-foreground mb-4" />
              <h3 className="font-display font-bold text-lg text-foreground">Nenhum imóvel disponível</h3>
              <p className="text-muted-foreground mt-1">Novos imóveis são adicionados diariamente.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredListings.map((item, i) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-card border border-border rounded-2xl overflow-hidden hover:shadow-lg transition-shadow"
                >
                  {/* Photo */}
                  <div className="relative aspect-[16/10] bg-muted">
                    {item.photos && item.photos.length > 0 ? (
                      <img src={item.photos[0]} alt={item.title} className="w-full h-full object-cover" loading="lazy" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Home size={40} className="text-muted-foreground" />
                      </div>
                    )}
                    <Badge className="absolute top-3 left-3 bg-emerald-500 text-white border-none">
                      Disponível
                    </Badge>
                    <Badge className="absolute top-3 right-3 bg-card/80 text-foreground border-none backdrop-blur-sm">
                      {categoryLabel(item.category)}
                    </Badge>
                  </div>

                  {/* Content */}
                  <div className="p-4 space-y-3">
                    <h3 className="font-display font-bold text-foreground line-clamp-1">{item.title}</h3>

                    {item.city && (
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <MapPin size={14} /> {item.neighborhood ? `${item.neighborhood}, ` : ""}{item.city} - {item.profiles?.full_name}
                      </p>
                    )}

                    <p className="font-display font-bold text-lg text-emerald-500">{formatPrice(item.price)}</p>

                    {/* Details */}
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      {item.bedrooms && (
                        <span className="flex items-center gap-1"><Bed size={14} /> {item.bedrooms}</span>
                      )}
                      {item.bathrooms && (
                        <span className="flex items-center gap-1"><Bath size={14} /> {item.bathrooms}</span>
                      )}
                      {item.area && (
                        <span className="flex items-center gap-1"><Ruler size={14} /> {item.area}m²</span>
                      )}
                    </div>

                    {/* Capture Button or Revealed Phone */}
                    {revealedPhones[item.id] ? (
                      <div className="bg-emerald-50 dark:bg-emerald-500/10 rounded-xl p-3 space-y-1">
                        <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                          <CheckCircle size={14} /> Imóvel captado!
                        </p>
                        <a
                          href={`https://wa.me/55${revealedPhones[item.id].replace(/\D/g, "")}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-sm font-bold text-foreground"
                        >
                          <Phone size={16} className="text-primary" />
                          {revealedPhones[item.id]}
                        </a>
                      </div>
                    ) : (
                      <Button
                        onClick={() => handleCapture(item)}
                        disabled={capturing === item.id}
                        className="w-full gap-2"
                        variant={canCapture ? "default" : "outline"}
                      >
                        {capturing === item.id ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : canCapture ? (
                          <>
                            <Home size={16} /> Quero vender este imóvel
                          </>
                        ) : (
                          <>
                            <Lock size={16} /> Fazer upgrade para captar
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
