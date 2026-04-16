import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Handshake, Search, Phone, CheckCircle2, XCircle, Clock, ExternalLink, DollarSign, Home, Filter } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type PartnershipItem = {
  id: string;
  title: string;
  price: number | null;
  photos: string[] | null;
  city: string | null;
  finality: string | null;
  commission_percent: number | null;
  partner_percent: number | null;
  partnership_enabled: boolean;
  seller_id: string;
  user_id: string;
  category: string;
};

type PartnershipRequest = {
  id: string;
  item_id: string;
  requester_profile_id: string;
  requester_user_id: string;
  owner_user_id: string;
  status: string;
  message: string | null;
  created_at: string;
};

type SellerProfile = {
  id: string;
  full_name: string;
  phone: string | null;
  logo_url: string | null;
  company_name: string | null;
  creci: string | null;
};

type SubTab = "disponivel" | "minhas" | "recebidas";

export default function PropertyPartnershipsTab({ profileId, userId }: { profileId: string; userId: string }) {
  const { toast } = useToast();
  const [subTab, setSubTab] = useState<SubTab>("disponivel");
  const [availableItems, setAvailableItems] = useState<(PartnershipItem & { seller: SellerProfile | null })[]>([]);
  const [myRequests, setMyRequests] = useState<(PartnershipRequest & { item: PartnershipItem | null; owner: SellerProfile | null })[]>([]);
  const [receivedRequests, setReceivedRequests] = useState<(PartnershipRequest & { item: PartnershipItem | null; requester: SellerProfile | null })[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    loadData();
  }, [profileId, userId]);

  const loadData = async () => {
    setLoading(true);
    await Promise.all([loadAvailable(), loadMyRequests(), loadReceivedRequests()]);
    setLoading(false);
  };

  const loadAvailable = async () => {
    const { data: items } = await supabase
      .from("seller_items")
      .select("id, title, price, photos, city, finality, commission_percent, partner_percent, partnership_enabled, seller_id, user_id, category")
      .eq("partnership_enabled", true)
      .eq("status", "ativo")
      .neq("user_id", userId);

    if (!items?.length) { setAvailableItems([]); return; }

    const sellerIds = [...new Set(items.map(i => i.seller_id))];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name, phone, logo_url, company_name, creci")
      .in("id", sellerIds);

    const profileMap = new Map((profiles || []).map(p => [p.id, p]));
    setAvailableItems(items.map(i => ({ ...i, seller: profileMap.get(i.seller_id) || null })));
  };

  const loadMyRequests = async () => {
    const { data: requests } = await supabase
      .from("property_partnerships")
      .select("*")
      .eq("requester_user_id", userId)
      .order("created_at", { ascending: false });

    if (!requests?.length) { setMyRequests([]); return; }

    const itemIds = [...new Set(requests.map(r => r.item_id))];
    const ownerIds = [...new Set(requests.map(r => r.owner_user_id))];

    const [{ data: items }, { data: profiles }] = await Promise.all([
      supabase.from("seller_items").select("id, title, price, photos, city, finality, commission_percent, partner_percent, partnership_enabled, seller_id, user_id, category").in("id", itemIds),
      supabase.from("profiles").select("id, user_id, full_name, phone, logo_url, company_name, creci").in("user_id", ownerIds),
    ]);

    const itemMap = new Map((items || []).map(i => [i.id, i]));
    const profileMap = new Map((profiles || []).map(p => [p.user_id, p]));

    setMyRequests(requests.map(r => ({
      ...r,
      item: itemMap.get(r.item_id) || null,
      owner: profileMap.get(r.owner_user_id) || null,
    })));
  };

  const loadReceivedRequests = async () => {
    const { data: requests } = await supabase
      .from("property_partnerships")
      .select("*")
      .eq("owner_user_id", userId)
      .order("created_at", { ascending: false });

    if (!requests?.length) { setReceivedRequests([]); return; }

    const itemIds = [...new Set(requests.map(r => r.item_id))];
    const requesterProfileIds = [...new Set(requests.map(r => r.requester_profile_id))];

    const [{ data: items }, { data: profiles }] = await Promise.all([
      supabase.from("seller_items").select("id, title, price, photos, city, finality, commission_percent, partner_percent, partnership_enabled, seller_id, user_id, category").in("id", itemIds),
      supabase.from("profiles").select("id, full_name, phone, logo_url, company_name, creci").in("id", requesterProfileIds),
    ]);

    const itemMap = new Map((items || []).map(i => [i.id, i]));
    const profileMap = new Map((profiles || []).map(p => [p.id, p]));

    setReceivedRequests(requests.map(r => ({
      ...r,
      item: itemMap.get(r.item_id) || null,
      requester: profileMap.get(r.requester_profile_id) || null,
    })));
  };

  const requestPartnership = async (item: PartnershipItem) => {
    const { error } = await supabase.from("property_partnerships").insert({
      item_id: item.id,
      requester_profile_id: profileId,
      requester_user_id: userId,
      owner_user_id: item.user_id,
    });

    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Solicitação enviada! 🤝" });
      loadData();
    }
  };

  const updateRequestStatus = async (requestId: string, status: string) => {
    const { error } = await supabase
      .from("property_partnerships")
      .update({ status })
      .eq("id", requestId);

    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      toast({ title: status === "aprovado" ? "Parceria aprovada! ✅" : "Parceria recusada" });
      loadData();
    }
  };

  const openWhatsApp = (phone: string | null, itemTitle: string, finality: string | null) => {
    if (!phone) { toast({ title: "Telefone não disponível", variant: "destructive" }); return; }
    const cleanPhone = phone.replace(/\D/g, "");
    const tipo = finality === "aluguel" ? "aluguel" : "venda";
    const msg = encodeURIComponent(`Olá, vi seu imóvel "${itemTitle}" no sistema e tenho interesse em fazer parceria na ${tipo}. Podemos conversar?`);
    window.open(`https://wa.me/55${cleanPhone}?text=${msg}`, "_blank");
  };

  const calcPartnerGain = (price: number | null, commissionPct: number | null, partnerPct: number | null, finality: string | null) => {
    if (!commissionPct || !partnerPct) return { total: 0, partner: 0, owner: 0 };
    const base = finality === "aluguel" ? (price || 0) : (price || 0);
    const total = base * (commissionPct / 100);
    const partner = total * (partnerPct / 100);
    const owner = total - partner;
    return { total, partner, owner };
  };

  const formatCurrency = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
    pendente: { label: "Pendente", color: "text-amber-500 bg-amber-500/10", icon: Clock },
    aprovado: { label: "Aprovado", color: "text-green-500 bg-green-500/10", icon: CheckCircle2 },
    recusado: { label: "Recusado", color: "text-red-500 bg-red-500/10", icon: XCircle },
    finalizado: { label: "Finalizado", color: "text-blue-500 bg-blue-500/10", icon: CheckCircle2 },
  };

  const filteredItems = availableItems.filter(i =>
    !searchTerm || i.title.toLowerCase().includes(searchTerm.toLowerCase()) || i.city?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const alreadyRequested = new Set(myRequests.map(r => r.item_id));

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display font-bold text-xl text-foreground flex items-center gap-2">
          <Handshake size={22} className="text-primary" /> Parcerias de Imóveis
        </h2>
        <p className="text-sm text-muted-foreground mt-1">Compartilhe e encontre imóveis para parceria com outros corretores.</p>
      </div>

      {/* Sub-tabs */}
      <div className="flex gap-1 bg-secondary/50 rounded-xl p-1">
        {([
          { id: "disponivel" as SubTab, label: "Disponíveis", count: filteredItems.length },
          { id: "minhas" as SubTab, label: "Minhas Solicitações", count: myRequests.length },
          { id: "recebidas" as SubTab, label: "Recebidas", count: receivedRequests.length },
        ]).map(tab => (
          <button
            key={tab.id}
            onClick={() => setSubTab(tab.id)}
            className={`flex-1 px-3 py-2 rounded-lg text-xs font-bold transition-all ${
              subTab === tab.id ? "bg-primary text-primary-foreground shadow-md" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label} {tab.count > 0 && <span className="ml-1 opacity-70">({tab.count})</span>}
          </button>
        ))}
      </div>

      {/* Disponíveis */}
      {subTab === "disponivel" && (
        <div className="space-y-4">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Buscar imóvel ou cidade..."
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-input bg-background text-foreground text-sm focus:ring-2 focus:ring-ring focus:outline-none"
            />
          </div>

          {filteredItems.length === 0 ? (
            <div className="text-center py-16 space-y-3">
              <Home size={40} className="mx-auto text-muted-foreground/30" />
              <p className="text-muted-foreground text-sm">Nenhum imóvel disponível para parceria no momento.</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {filteredItems.map(item => {
                const gains = calcPartnerGain(item.price, item.commission_percent, item.partner_percent, item.finality);
                const requested = alreadyRequested.has(item.id);
                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-card border border-border rounded-2xl overflow-hidden hover:border-primary/30 transition-colors"
                  >
                    {/* Photo */}
                    <div className="relative aspect-[16/9] bg-muted">
                      {item.photos?.[0] ? (
                        <img src={item.photos[0]} alt={item.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center"><Home size={32} className="text-muted-foreground/30" /></div>
                      )}
                      <div className="absolute top-2 left-2 px-2 py-1 rounded-lg bg-black/60 text-white text-[10px] font-bold uppercase">
                        {item.finality === "aluguel" ? "Aluguel" : "Venda"}
                      </div>
                      {item.partner_percent && (
                        <div className="absolute top-2 right-2 px-2 py-1 rounded-lg bg-primary text-primary-foreground text-[10px] font-bold">
                          {item.partner_percent}% para você
                        </div>
                      )}
                    </div>

                    <div className="p-4 space-y-3">
                      <div>
                        <h3 className="font-display font-bold text-sm text-foreground line-clamp-1">{item.title}</h3>
                        <p className="text-xs text-muted-foreground">{item.city || "Cidade não informada"}</p>
                      </div>

                      {item.price && (
                        <p className="font-display font-extrabold text-lg text-primary">
                          {formatCurrency(item.price)}{item.finality === "aluguel" ? "/mês" : ""}
                        </p>
                      )}

                      {/* Commission breakdown */}
                      <div className="bg-secondary/50 rounded-xl p-3 space-y-1.5">
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <DollarSign size={12} /> Simulação de Comissão
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="text-center bg-green-500/10 rounded-lg p-2">
                            <p className="text-[10px] text-muted-foreground">Seu ganho</p>
                            <p className="font-bold text-sm text-green-600">{formatCurrency(gains.partner)}</p>
                          </div>
                          <div className="text-center bg-primary/10 rounded-lg p-2">
                            <p className="text-[10px] text-muted-foreground">Ganho do dono</p>
                            <p className="font-bold text-sm text-primary">{formatCurrency(gains.owner)}</p>
                          </div>
                        </div>
                      </div>

                      {/* Seller info */}
                      {item.seller && (
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                            {item.seller.logo_url ? (
                              <img src={item.seller.logo_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-xs font-bold text-primary">{item.seller.full_name.charAt(0)}</span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-foreground truncate">{item.seller.full_name}</p>
                            {item.seller.creci && <p className="text-[10px] text-muted-foreground">CRECI: {item.seller.creci}</p>}
                          </div>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex gap-2">
                        <button
                          onClick={() => requestPartnership(item)}
                          disabled={requested}
                          className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 ${
                            requested
                              ? "bg-muted text-muted-foreground cursor-not-allowed"
                              : "bg-primary text-primary-foreground hover:bg-primary/90"
                          }`}
                        >
                          <Handshake size={14} /> {requested ? "Solicitado" : "Solicitar Parceria"}
                        </button>
                        <button
                          onClick={() => openWhatsApp(item.seller?.phone || null, item.title, item.finality)}
                          className="px-3 py-2.5 rounded-xl bg-green-500 text-white text-xs font-bold hover:bg-green-600 transition-colors flex items-center gap-1.5"
                        >
                          <Phone size={14} /> WhatsApp
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Minhas Solicitações */}
      {subTab === "minhas" && (
        <div className="space-y-3">
          {myRequests.length === 0 ? (
            <div className="text-center py-16 space-y-3">
              <Handshake size={40} className="mx-auto text-muted-foreground/30" />
              <p className="text-muted-foreground text-sm">Você ainda não solicitou nenhuma parceria.</p>
            </div>
          ) : (
            myRequests.map(req => {
              const st = statusConfig[req.status] || statusConfig.pendente;
              const gains = req.item ? calcPartnerGain(req.item.price, req.item.commission_percent, req.item.partner_percent, req.item.finality) : null;
              return (
                <motion.div
                  key={req.id}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-card border border-border rounded-2xl p-4 flex gap-3"
                >
                  <div className="w-16 h-16 rounded-xl bg-muted overflow-hidden flex-shrink-0">
                    {req.item?.photos?.[0] ? (
                      <img src={req.item.photos[0]} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center"><Home size={20} className="text-muted-foreground/30" /></div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0 space-y-1">
                    <h3 className="font-bold text-sm text-foreground truncate">{req.item?.title || "Imóvel"}</h3>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${st.color}`}>
                        <st.icon size={10} /> {st.label}
                      </span>
                      {gains && (
                        <span className="text-[10px] text-green-600 font-bold">Ganho estimado: {formatCurrency(gains.partner)}</span>
                      )}
                    </div>
                    {req.owner && (
                      <p className="text-[10px] text-muted-foreground">Corretor: {req.owner.full_name}</p>
                    )}
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      )}

      {/* Recebidas */}
      {subTab === "recebidas" && (
        <div className="space-y-3">
          {receivedRequests.length === 0 ? (
            <div className="text-center py-16 space-y-3">
              <Handshake size={40} className="mx-auto text-muted-foreground/30" />
              <p className="text-muted-foreground text-sm">Nenhuma solicitação de parceria recebida.</p>
              <p className="text-xs text-muted-foreground">Ative a parceria nos seus imóveis para receber solicitações.</p>
            </div>
          ) : (
            receivedRequests.map(req => {
              const st = statusConfig[req.status] || statusConfig.pendente;
              return (
                <motion.div
                  key={req.id}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-card border border-border rounded-2xl p-4 space-y-3"
                >
                  <div className="flex gap-3">
                    <div className="w-16 h-16 rounded-xl bg-muted overflow-hidden flex-shrink-0">
                      {req.item?.photos?.[0] ? (
                        <img src={req.item.photos[0]} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center"><Home size={20} className="text-muted-foreground/30" /></div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0 space-y-1">
                      <h3 className="font-bold text-sm text-foreground truncate">{req.item?.title || "Imóvel"}</h3>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${st.color}`}>
                        <st.icon size={10} /> {st.label}
                      </span>
                    </div>
                  </div>

                  {/* Requester info */}
                  {req.requester && (
                    <div className="flex items-center gap-2 bg-secondary/50 rounded-xl p-2.5">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                        {req.requester.logo_url ? (
                          <img src={req.requester.logo_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-xs font-bold text-primary">{req.requester.full_name.charAt(0)}</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-foreground truncate">{req.requester.full_name}</p>
                        {req.requester.creci && <p className="text-[10px] text-muted-foreground">CRECI: {req.requester.creci}</p>}
                      </div>
                      {req.requester.phone && (
                        <button
                          onClick={() => openWhatsApp(req.requester!.phone, req.item?.title || "Imóvel", req.item?.finality || null)}
                          className="px-2.5 py-1.5 rounded-lg bg-green-500 text-white text-[10px] font-bold hover:bg-green-600 transition-colors"
                        >
                          <Phone size={12} />
                        </button>
                      )}
                    </div>
                  )}

                  {/* Actions for pending */}
                  {req.status === "pendente" && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => updateRequestStatus(req.id, "aprovado")}
                        className="flex-1 py-2 rounded-xl bg-green-500 text-white text-xs font-bold hover:bg-green-600 transition-colors flex items-center justify-center gap-1.5"
                      >
                        <CheckCircle2 size={14} /> Aprovar
                      </button>
                      <button
                        onClick={() => updateRequestStatus(req.id, "recusado")}
                        className="flex-1 py-2 rounded-xl bg-red-500/10 text-red-500 text-xs font-bold hover:bg-red-500/20 transition-colors flex items-center justify-center gap-1.5"
                      >
                        <XCircle size={14} /> Recusar
                      </button>
                    </div>
                  )}
                </motion.div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
