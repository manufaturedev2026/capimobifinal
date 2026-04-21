import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Handshake, Search, Phone, CheckCircle2, XCircle, Clock, DollarSign, Home, Package, X,
  MapPin, BedDouble, Bath, Car, Maximize, FileText, ExternalLink, Store, Eye, EyeOff,
  Sparkles, TrendingUp, Users
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { productUrl } from "@/lib/productUrl";

type PartnershipItem = {
  id: string;
  title: string;
  price: number | null;
  photos: string[] | null;
  city: string | null;
  state: string | null;
  neighborhood: string | null;
  finality: string | null;
  commission_percent: number | null;
  partner_percent: number | null;
  partnership_enabled: boolean;
  seller_id: string;
  user_id: string;
  category: string;
  description: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  parking_spots: number | null;
  area: number | null;
  status: string;
  slug?: string | null;
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
  city?: string | null;
  state?: string | null;
  slug?: string | null;
};

type StoreListing = {
  id: string;
  partnership_id: string;
  item_id: string;
  is_visible: boolean;
};

type SubTab = "meus" | "disponivel" | "vigentes" | "minhas" | "recebidas";

const ITEM_FIELDS = "id, title, slug, price, photos, city, state, neighborhood, finality, commission_percent, partner_percent, partnership_enabled, seller_id, user_id, category, description, bedrooms, bathrooms, parking_spots, area, status";

export default function PropertyPartnershipsTab({ profileId, userId }: { profileId: string; userId: string }) {
  const { toast } = useToast();
  const [subTab, setSubTab] = useState<SubTab>("disponivel");
  const [availableItems, setAvailableItems] = useState<(PartnershipItem & { seller: SellerProfile | null })[]>([]);
  const [myRequests, setMyRequests] = useState<(PartnershipRequest & { item: PartnershipItem | null; owner: SellerProfile | null })[]>([]);
  const [myItems, setMyItems] = useState<PartnershipItem[]>([]);
  const [receivedRequests, setReceivedRequests] = useState<(PartnershipRequest & { item: PartnershipItem | null; requester: SellerProfile | null })[]>([]);
  const [activePartnerships, setActivePartnerships] = useState<(PartnershipRequest & { item: PartnershipItem | null; partner: SellerProfile | null; role: "owner" | "requester" })[]>([]);
  const [storeListings, setStoreListings] = useState<Map<string, StoreListing>>(new Map());
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [locationScope, setLocationScope] = useState<"proximos" | "estado" | "cidade" | "todos">("proximos");
  const [selectedState, setSelectedState] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [currentProfile, setCurrentProfile] = useState<SellerProfile | null>(null);

  // Dialog states
  const [configItem, setConfigItem] = useState<PartnershipItem | null>(null);
  const [configCommission, setConfigCommission] = useState("");
  const [configPartner, setConfigPartner] = useState("");
  const [configDescription, setConfigDescription] = useState("");

  const [detailItem, setDetailItem] = useState<(PartnershipItem & { seller: SellerProfile | null }) | null>(null);

  useEffect(() => {
    loadData();
  }, [profileId, userId]);

  const loadData = async () => {
    setLoading(true);
    await Promise.all([loadCurrentProfile(), loadMyItems(), loadAvailable(), loadMyRequests(), loadReceivedRequests(), loadActivePartnerships(), loadStoreListings()]);
    setLoading(false);
  };

  const loadCurrentProfile = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("id, full_name, phone, logo_url, company_name, creci, city, state, slug")
      .eq("id", profileId)
      .maybeSingle();
    setCurrentProfile(data || null);
    if (data?.state) setSelectedState((prev) => prev || data.state || "");
    if (data?.city) setSelectedCity((prev) => prev || data.city || "");
  };

  const loadMyItems = async () => {
    const { data } = await supabase
      .from("seller_items")
      .select(ITEM_FIELDS)
      .eq("user_id", userId)
      .eq("status", "ativo")
      .order("created_at", { ascending: false });
    setMyItems(data || []);
  };

  const loadAvailable = async () => {
    const { data: items } = await supabase
      .from("seller_items")
      .select(ITEM_FIELDS)
      .eq("partnership_enabled", true)
      .eq("status", "ativo")
      .neq("user_id", userId);

    if (!items?.length) { setAvailableItems([]); return; }

    const sellerIds = [...new Set(items.map(i => i.seller_id))];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name, phone, logo_url, company_name, creci, city, state, slug")
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
      supabase.from("seller_items").select(ITEM_FIELDS).in("id", itemIds),
      supabase.from("profiles").select("id, user_id, full_name, phone, logo_url, company_name, creci, slug").in("user_id", ownerIds),
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
      supabase.from("seller_items").select(ITEM_FIELDS).in("id", itemIds),
      supabase.from("profiles").select("id, full_name, phone, logo_url, company_name, creci, slug").in("id", requesterProfileIds),
    ]);

    const itemMap = new Map((items || []).map(i => [i.id, i]));
    const profileMap = new Map((profiles || []).map(p => [p.id, p]));

    setReceivedRequests(requests.map(r => ({
      ...r,
      item: itemMap.get(r.item_id) || null,
      requester: profileMap.get(r.requester_profile_id) || null,
    })));
  };

  const loadActivePartnerships = async () => {
    const [{ data: asRequester }, { data: asOwner }] = await Promise.all([
      supabase.from("property_partnerships").select("*").eq("requester_user_id", userId).eq("status", "aprovado"),
      supabase.from("property_partnerships").select("*").eq("owner_user_id", userId).eq("status", "aprovado"),
    ]);

    const all = [
      ...(asRequester || []).map(r => ({ ...r, _role: "requester" as const })),
      ...(asOwner || []).map(r => ({ ...r, _role: "owner" as const })),
    ];

    if (!all.length) { setActivePartnerships([]); return; }

    const itemIds = [...new Set(all.map(r => r.item_id))];
    const partnerUserIds = [...new Set(all.map(r => r._role === "owner" ? r.requester_user_id : r.owner_user_id))];

    const [{ data: items }, { data: profiles }] = await Promise.all([
      supabase.from("seller_items").select(ITEM_FIELDS).in("id", itemIds),
      supabase.from("profiles").select("id, user_id, full_name, phone, logo_url, company_name, creci, slug").in("user_id", partnerUserIds),
    ]);

    const itemMap = new Map((items || []).map(i => [i.id, i]));
    const profileMap = new Map((profiles || []).map(p => [p.user_id, p]));

    setActivePartnerships(all
      .filter(r => {
        const item = itemMap.get(r.item_id);
        return item && item.partnership_enabled;
      })
      .map(r => ({
        ...r,
        item: itemMap.get(r.item_id) || null,
        partner: profileMap.get(r._role === "owner" ? r.requester_user_id : r.owner_user_id) || null,
        role: r._role,
      })));
  };

  const loadStoreListings = async () => {
    const { data } = await supabase
      .from("partner_store_listings")
      .select("id, partnership_id, item_id, is_visible")
      .eq("partner_user_id", userId);
    const map = new Map<string, StoreListing>();
    (data || []).forEach(l => map.set(l.partnership_id, l));
    setStoreListings(map);
  };

  const sendPartnershipPush = async (targetUserId: string, title: string, body: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      await supabase.functions.invoke("send-push-partnership", {
        body: { target_user_id: targetUserId, title, body, url: "/painel" },
      });
    } catch (e) {
      console.error("Push notification error:", e);
    }
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
      setDetailItem(null);
      sendPartnershipPush(
        item.user_id,
        "Nova solicitação de parceria 🤝",
        `Alguém solicitou parceria no imóvel "${item.title}". Confira na aba Parcerias!`
      );
      loadData();
    }
  };

  const endPartnership = async (partnershipId: string, partnerUserId: string, itemTitle: string, role: "owner" | "requester") => {
    const confirmMsg = role === "owner"
      ? `Encerrar a parceria do imóvel "${itemTitle}"? O parceiro será notificado e o imóvel será removido da loja dele.`
      : `Sair da parceria do imóvel "${itemTitle}"? O dono será notificado e o imóvel será removido da sua loja.`;
    if (!window.confirm(confirmMsg)) return;

    setSavingId(partnershipId);
    const { error } = await supabase
      .from("property_partnerships")
      .update({ status: "finalizado" })
      .eq("id", partnershipId);

    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Parceria encerrada" });
      const title = role === "owner" ? "Parceria encerrada" : "Parceiro saiu da parceria";
      const body = role === "owner"
        ? `O dono encerrou a parceria do imóvel "${itemTitle}".`
        : `O parceiro saiu da parceria do imóvel "${itemTitle}".`;
      sendPartnershipPush(partnerUserId, title, body);
      await Promise.all([loadActivePartnerships(), loadStoreListings()]);
    }
    setSavingId(null);
  };

  const updateRequestStatus = async (requestId: string, status: string) => {
    const req = receivedRequests.find(r => r.id === requestId);
    const { error } = await supabase
      .from("property_partnerships")
      .update({ status })
      .eq("id", requestId);

    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      toast({ title: status === "aprovado" ? "Parceria aprovada! ✅" : "Parceria recusada" });
      if (req) {
        const title = status === "aprovado" ? "Parceria aprovada! ✅" : "Parceria recusada ❌";
        const body = status === "aprovado"
          ? `Sua solicitação de parceria no imóvel "${req.item?.title || "Imóvel"}" foi aprovada!`
          : `Sua solicitação de parceria no imóvel "${req.item?.title || "Imóvel"}" foi recusada.`;
        sendPartnershipPush(req.requester_user_id, title, body);
      }
      loadData();
    }
  };

  const openConfigDialog = (item: PartnershipItem) => {
    setConfigItem(item);
    setConfigCommission(item.commission_percent?.toString() || "");
    setConfigPartner(item.partner_percent?.toString() || "");
    setConfigDescription(item.description || "");
  };

  const savePartnershipConfig = async () => {
    if (!configItem) return;
    setSavingId(configItem.id);
    const commPct = configCommission ? parseFloat(configCommission) : null;
    const partPct = configPartner ? parseFloat(configPartner) : null;

    const { error } = await supabase.from("seller_items").update({
      partnership_enabled: true,
      commission_percent: commPct,
      partner_percent: partPct,
      description: configDescription || null,
    } as any).eq("id", configItem.id).eq("user_id", userId);

    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Parceria ativada! 🤝" });
      setConfigItem(null);
      await loadMyItems();
    }
    setSavingId(null);
  };

  const disablePartnership = async (itemId: string) => {
    setSavingId(itemId);
    const { error } = await supabase.from("seller_items").update({ partnership_enabled: false } as any).eq("id", itemId).eq("user_id", userId);
    if (!error) {
      toast({ title: "Parceria desativada" });
      await loadMyItems();
    }
    setSavingId(null);
  };

  const addToMyStore = async (partnershipId: string, itemId: string) => {
    setSavingId(partnershipId);
    const { error } = await supabase.from("partner_store_listings").insert({
      partnership_id: partnershipId,
      partner_user_id: userId,
      partner_profile_id: profileId,
      item_id: itemId,
      is_visible: true,
    });
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Imóvel adicionado à sua loja! 🏪" });
      await loadStoreListings();
    }
    setSavingId(null);
  };

  const toggleStoreVisibility = async (listing: StoreListing) => {
    setSavingId(listing.partnership_id);
    const { error } = await supabase
      .from("partner_store_listings")
      .update({ is_visible: !listing.is_visible })
      .eq("id", listing.id);
    if (!error) {
      toast({ title: listing.is_visible ? "Imóvel oculto na sua loja" : "Imóvel visível na sua loja" });
      await loadStoreListings();
    }
    setSavingId(null);
  };

  const removeFromStore = async (listing: StoreListing) => {
    if (!window.confirm("Remover este imóvel da sua loja? A parceria continua ativa.")) return;
    setSavingId(listing.partnership_id);
    const { error } = await supabase.from("partner_store_listings").delete().eq("id", listing.id);
    if (!error) {
      toast({ title: "Removido da sua loja" });
      await loadStoreListings();
    }
    setSavingId(null);
  };

  const openWhatsApp = (phone: string | null, itemTitle: string, finality: string | null) => {
    if (!phone) { toast({ title: "Telefone não disponível", variant: "destructive" }); return; }
    const cleanPhone = phone.replace(/\D/g, "");
    const tipo = finality === "aluguel" ? "aluguel" : "venda";
    const msg = encodeURIComponent(`Olá, vi seu imóvel "${itemTitle}" no sistema e tenho interesse em fazer parceria na ${tipo}. Podemos conversar?`);
    window.open(`https://wa.me/55${cleanPhone}?text=${msg}`, "_blank");
  };

  const calcPartnerGain = (price: number | null, commissionPct: number | null, partnerPct: number | null) => {
    if (!commissionPct || !partnerPct) return { total: 0, partner: 0, owner: 0 };
    const base = price || 0;
    const total = base * (commissionPct / 100);
    const partner = total * (partnerPct / 100);
    const owner = total - partner;
    return { total, partner, owner };
  };

  const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
    pendente: { label: "Pendente", color: "text-amber-500 bg-amber-500/10", icon: Clock },
    aprovado: { label: "Aprovado", color: "text-green-500 bg-green-500/10", icon: CheckCircle2 },
    recusado: { label: "Recusado", color: "text-red-500 bg-red-500/10", icon: XCircle },
    finalizado: { label: "Finalizado", color: "text-blue-500 bg-blue-500/10", icon: CheckCircle2 },
    cancelado: { label: "Cancelado", color: "text-muted-foreground bg-muted", icon: XCircle },
  };

  const normalizeText = (v?: string | null) => (v || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const nearbyCity = normalizeText(currentProfile?.city);
  const nearbyState = normalizeText(currentProfile?.state);
  const stateOptions = [...new Set(availableItems.map(i => i.state).filter(Boolean) as string[])].sort();
  const cityOptions = [...new Set(
    availableItems
      .filter(i => !selectedState || normalizeText(i.state) === normalizeText(selectedState))
      .map(i => i.city)
      .filter(Boolean) as string[]
  )].sort();

  const filteredItems = availableItems
    .filter(i => {
      const itemCity = normalizeText(i.city);
      const itemState = normalizeText(i.state);
      const scopeMatch =
        locationScope === "todos" ||
        (locationScope === "proximos" && ((nearbyCity && itemCity === nearbyCity) || (nearbyState && itemState === nearbyState))) ||
        (locationScope === "estado" && (!selectedState || itemState === normalizeText(selectedState))) ||
        (locationScope === "cidade" && (!selectedCity || itemCity === normalizeText(selectedCity)) && (!selectedState || itemState === normalizeText(selectedState)));
      if (!scopeMatch) return false;
      if (!searchTerm) return true;
      const q = normalizeText(searchTerm);
      const match = (v: string | null) => normalizeText(v).includes(q);
      return match(i.title) || match(i.city) || match(i.state) || match(i.neighborhood) || match(i.category) || match(i.seller?.full_name || null) || match(i.seller?.company_name || null);
    })
    .sort((a, b) => {
      const score = (i: PartnershipItem) => {
        if (nearbyCity && normalizeText(i.city) === nearbyCity) return 0;
        if (nearbyState && normalizeText(i.state) === nearbyState) return 1;
        return 2;
      };
      return score(a) - score(b);
    });

  const requestStatusByItem = new Map(
    myRequests
      .filter(r => r.status !== "recusado" && r.status !== "cancelado" && r.status !== "finalizado")
      .map(r => [r.item_id, r.status])
  );

  // Stats for hero
  const totalActivePartnerships = activePartnerships.length;
  const totalPotentialGain = activePartnerships.reduce((acc, p) => {
    if (!p.item) return acc;
    const g = calcPartnerGain(p.item.price, p.item.commission_percent, p.item.partner_percent);
    return acc + (p.role === "owner" ? g.owner : g.partner);
  }, 0);
  const totalAvailable = availableItems.length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ===== HERO ===== */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-primary to-primary/70 p-6 sm:p-8 text-primary-foreground shadow-xl">
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-white/30 blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-64 h-64 rounded-full bg-accent/40 blur-3xl" />
        </div>

        <div className="relative">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-2 rounded-xl bg-white/20 backdrop-blur-sm">
              <Handshake size={22} />
            </div>
            <span className="text-xs uppercase font-bold tracking-wider opacity-90">Rede de Parcerias</span>
          </div>

          <h2 className="font-display font-extrabold text-2xl sm:text-3xl mb-1.5 leading-tight">
            Multiplique suas vendas <Sparkles size={22} className="inline-block" />
          </h2>
          <p className="text-sm opacity-90 max-w-xl mb-5">
            Compartilhe seus imóveis e ganhe acesso ao portfólio de outros corretores. Mais imóveis na sua loja, mais clientes, mais comissões.
          </p>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-3 sm:p-4 border border-white/20">
              <div className="flex items-center gap-1.5 mb-1 opacity-90"><Handshake size={14} /><span className="text-[10px] sm:text-xs font-bold uppercase">Vigentes</span></div>
              <p className="font-display font-extrabold text-xl sm:text-3xl">{totalActivePartnerships}</p>
            </div>
            <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-3 sm:p-4 border border-white/20">
              <div className="flex items-center gap-1.5 mb-1 opacity-90"><TrendingUp size={14} /><span className="text-[10px] sm:text-xs font-bold uppercase">Potencial</span></div>
              <p className="font-display font-extrabold text-base sm:text-2xl truncate">{fmt(totalPotentialGain)}</p>
            </div>
            <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-3 sm:p-4 border border-white/20">
              <div className="flex items-center gap-1.5 mb-1 opacity-90"><Users size={14} /><span className="text-[10px] sm:text-xs font-bold uppercase">Na rede</span></div>
              <p className="font-display font-extrabold text-xl sm:text-3xl">{totalAvailable}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ===== TABS ===== */}
      <div className="flex gap-1 bg-secondary/50 rounded-2xl p-1.5 overflow-x-auto scrollbar-hide">
        {([
          { id: "meus" as SubTab, label: "Meus Imóveis", count: 0 },
          { id: "disponivel" as SubTab, label: "Disponíveis", count: 0 },
          { id: "vigentes" as SubTab, label: "Vigentes", count: activePartnerships.length },
          { id: "minhas" as SubTab, label: "Solicitações", count: myRequests.filter(r => r.status === "pendente").length },
          { id: "recebidas" as SubTab, label: "Recebidas", count: receivedRequests.filter(r => r.status === "pendente").length },
        ]).map(tab => (
          <button
            key={tab.id}
            onClick={() => setSubTab(tab.id)}
            className={`flex-shrink-0 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              subTab === tab.id ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30" : "text-muted-foreground hover:text-foreground hover:bg-background/60"
            }`}
          >
            {tab.label} {tab.count > 0 && <span className="ml-1 bg-red-500 text-white rounded-full px-1.5 py-0.5 text-[10px]">{tab.count}</span>}
          </button>
        ))}
      </div>

      {/* ===== MEUS IMÓVEIS ===== */}
      {subTab === "meus" && (
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">Seus imóveis ativos. Clique em "Procurar Parceria" para disponibilizar na rede.</p>
          {myItems.length === 0 ? (
            <div className="text-center py-16 space-y-3">
              <Package size={40} className="mx-auto text-muted-foreground/30" />
              <p className="text-muted-foreground text-sm">Você não tem imóveis ativos.</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {myItems.map(item => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-card border border-border rounded-2xl overflow-hidden hover:border-primary/40 hover:shadow-lg transition-all group"
                >
                  <div className="relative aspect-[16/10] bg-muted overflow-hidden">
                    {item.photos?.[0] ? (
                      <img src={item.photos[0]} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center"><Home size={32} className="text-muted-foreground/30" /></div>
                    )}
                    <div className="absolute top-2 left-2 px-2 py-1 rounded-lg bg-black/60 backdrop-blur-sm text-white text-[10px] font-bold uppercase">
                      {item.finality === "aluguel" ? "Aluguel" : "Venda"}
                    </div>
                    {item.partnership_enabled && (
                      <div className="absolute top-2 right-2 px-2 py-1 rounded-lg bg-green-500 text-white text-[10px] font-bold flex items-center gap-1 shadow-lg">
                        <Handshake size={10} /> Parceria Ativa
                      </div>
                    )}
                  </div>

                  <div className="p-4 space-y-3">
                    <div>
                      <h3 className="font-display font-bold text-sm text-foreground line-clamp-1">{item.title}</h3>
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                        <MapPin size={10} /> {item.city || "Sem cidade"}{item.neighborhood ? ` • ${item.neighborhood}` : ""}
                      </p>
                    </div>

                    {item.price ? (
                      <p className="font-display font-extrabold text-lg text-primary">
                        {fmt(item.price)}{item.finality === "aluguel" ? "/mês" : ""}
                      </p>
                    ) : (
                      <p className="text-sm text-muted-foreground">Preço não informado</p>
                    )}

                    <div className="flex gap-3 text-xs text-muted-foreground">
                      {item.bedrooms ? <span className="flex items-center gap-1"><BedDouble size={12} /> {item.bedrooms}</span> : null}
                      {item.bathrooms ? <span className="flex items-center gap-1"><Bath size={12} /> {item.bathrooms}</span> : null}
                      {item.parking_spots ? <span className="flex items-center gap-1"><Car size={12} /> {item.parking_spots}</span> : null}
                      {item.area ? <span className="flex items-center gap-1"><Maximize size={12} /> {item.area}m²</span> : null}
                    </div>

                    {item.partnership_enabled && item.commission_percent && item.partner_percent && (
                      <div className="bg-green-500/10 rounded-xl p-2.5 text-center">
                        <p className="text-[10px] text-muted-foreground">Comissão {item.commission_percent}% • Parceiro recebe {item.partner_percent}%</p>
                        <p className="font-bold text-xs text-green-600 mt-0.5">
                          Ganho do parceiro: {fmt(calcPartnerGain(item.price, item.commission_percent, item.partner_percent).partner)}
                        </p>
                      </div>
                    )}

                    <div className="flex gap-2">
                      {item.partnership_enabled ? (
                        <>
                          <button
                            onClick={() => openConfigDialog(item)}
                            className="flex-1 py-2.5 rounded-xl bg-primary/10 text-primary text-xs font-bold hover:bg-primary/20 transition-colors flex items-center justify-center gap-1.5"
                          >
                            <FileText size={14} /> Editar
                          </button>
                          <button
                            onClick={() => disablePartnership(item.id)}
                            disabled={savingId === item.id}
                            className="px-3 py-2.5 rounded-xl bg-red-500/10 text-red-500 text-xs font-bold hover:bg-red-500/20 transition-colors"
                          >
                            <X size={14} />
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => openConfigDialog(item)}
                          className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition-colors flex items-center justify-center gap-1.5 shadow-md shadow-primary/20"
                        >
                          <Handshake size={14} /> Procurar Parceria
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ===== CONFIG DIALOG ===== */}
      <Dialog open={!!configItem} onOpenChange={(open) => !open && setConfigItem(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <Handshake size={18} className="text-primary" /> Configurar Parceria
            </DialogTitle>
          </DialogHeader>

          {configItem && (
            <div className="space-y-4">
              <div className="flex gap-3 bg-secondary/50 rounded-xl p-3">
                <div className="w-16 h-16 rounded-xl bg-muted overflow-hidden flex-shrink-0">
                  {configItem.photos?.[0] ? (
                    <img src={configItem.photos[0]} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center"><Home size={20} className="text-muted-foreground/30" /></div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-sm text-foreground truncate">{configItem.title}</h3>
                  <p className="text-xs text-muted-foreground">{configItem.city || "Sem cidade"}</p>
                  {configItem.price && <p className="font-bold text-sm text-primary mt-0.5">{fmt(configItem.price)}</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-muted-foreground mb-1.5 block">Comissão Total (%)</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="100"
                    value={configCommission}
                    onChange={(e) => setConfigCommission(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-input bg-background text-foreground text-sm focus:ring-2 focus:ring-ring focus:outline-none"
                    placeholder="Ex: 6"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-muted-foreground mb-1.5 block">% do Parceiro</label>
                  <input
                    type="number"
                    step="5"
                    min="0"
                    max="100"
                    value={configPartner}
                    onChange={(e) => setConfigPartner(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-input bg-background text-foreground text-sm focus:ring-2 focus:ring-ring focus:outline-none"
                    placeholder="Ex: 50"
                  />
                </div>
              </div>

              {configCommission && configPartner && configItem.price && (() => {
                const gains = calcPartnerGain(configItem.price, parseFloat(configCommission), parseFloat(configPartner));
                return (
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-primary/10 rounded-xl p-2.5">
                      <p className="text-[10px] text-muted-foreground">Total</p>
                      <p className="font-bold text-xs text-primary">{fmt(gains.total)}</p>
                    </div>
                    <div className="bg-primary/10 rounded-xl p-2.5">
                      <p className="text-[10px] text-muted-foreground">Parceiro</p>
                      <p className="font-bold text-xs text-primary">{fmt(gains.partner)}</p>
                    </div>
                    <div className="bg-primary/10 rounded-xl p-2.5">
                      <p className="text-[10px] text-muted-foreground">Você</p>
                      <p className="font-bold text-xs text-primary">{fmt(gains.owner)}</p>
                    </div>
                  </div>
                );
              })()}

              <div>
                <label className="text-xs font-bold text-muted-foreground mb-1.5 block">Descrição para parceiros</label>
                <textarea
                  value={configDescription}
                  onChange={(e) => setConfigDescription(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2.5 rounded-xl border border-input bg-background text-foreground text-sm focus:ring-2 focus:ring-ring focus:outline-none resize-none"
                  placeholder="Informações adicionais para o parceiro..."
                />
              </div>

              <button
                onClick={savePartnershipConfig}
                disabled={savingId === configItem.id}
                className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
              >
                <Handshake size={16} /> {configItem.partnership_enabled ? "Salvar Alterações" : "Ativar Parceria"}
              </button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ===== DISPONÍVEIS ===== */}
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
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredItems.map(item => {
                const gains = calcPartnerGain(item.price, item.commission_percent, item.partner_percent);
                const requestStatus = requestStatusByItem.get(item.id);
                const requested = !!requestStatus;
                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    onClick={() => setDetailItem(item)}
                    className="bg-card border border-border rounded-2xl overflow-hidden hover:border-primary/40 hover:shadow-xl transition-all cursor-pointer group"
                  >
                    <div className="relative aspect-[16/10] bg-muted overflow-hidden">
                      {item.photos?.[0] ? (
                        <img src={item.photos[0]} alt={item.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center"><Home size={32} className="text-muted-foreground/30" /></div>
                      )}
                      <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-3 pt-10">
                        <p className="text-white font-bold text-sm line-clamp-1">{item.title}</p>
                        <p className="text-white/80 text-xs flex items-center gap-1">
                          <MapPin size={10} /> {item.city || "Cidade não informada"}
                        </p>
                      </div>
                      {item.partner_percent && (
                        <div className="absolute top-2 right-2 px-2 py-1 rounded-lg bg-green-500 text-white text-[10px] font-bold shadow-lg">
                          {item.partner_percent}% pra você
                        </div>
                      )}
                      {requested && (
                        <div className={`absolute top-2 left-2 px-2 py-1 rounded-lg text-white text-[10px] font-bold shadow-lg ${requestStatus === "aprovado" ? "bg-green-600" : "bg-amber-500"}`}>
                          {requestStatus === "aprovado" ? "Parceria Ativa" : "Aguardando"}
                        </div>
                      )}
                    </div>

                    <div className="p-3 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        {item.price ? (
                          <p className="font-display font-extrabold text-base text-primary">
                            {fmt(item.price)}{item.finality === "aluguel" ? "/mês" : ""}
                          </p>
                        ) : (
                          <p className="text-sm text-muted-foreground">Consulte</p>
                        )}
                        {gains.partner > 0 && (
                          <div className="text-right">
                            <p className="text-[10px] text-muted-foreground">Ganho/venda</p>
                            <p className="font-bold text-sm text-green-600">{fmt(gains.partner)}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ===== DETAIL DIALOG ===== */}
      <Dialog open={!!detailItem} onOpenChange={(open) => !open && setDetailItem(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          {detailItem && (() => {
            const gains = calcPartnerGain(detailItem.price, detailItem.commission_percent, detailItem.partner_percent);
            const detailRequestStatus = requestStatusByItem.get(detailItem.id);
            const requested = !!detailRequestStatus;
            const publicUrl = productUrl(detailItem, detailItem.seller?.slug);
            return (
              <>
                <DialogHeader>
                  <DialogTitle className="text-base">{detailItem.title}</DialogTitle>
                </DialogHeader>

                <div className="relative aspect-[16/10] bg-muted rounded-xl overflow-hidden -mx-2">
                  {detailItem.photos?.[0] ? (
                    <img src={detailItem.photos[0]} alt={detailItem.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center"><Home size={40} className="text-muted-foreground/30" /></div>
                  )}
                </div>

                <div className="space-y-2">
                  {detailItem.price && (
                    <p className="font-display font-extrabold text-2xl text-primary">
                      {fmt(detailItem.price)}{detailItem.finality === "aluguel" ? "/mês" : ""}
                    </p>
                  )}
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <MapPin size={14} /> {[detailItem.neighborhood, detailItem.city, detailItem.state].filter(Boolean).join(", ") || "Localização não informada"}
                  </p>
                </div>

                <div className="flex gap-4 text-sm text-muted-foreground flex-wrap">
                  {detailItem.bedrooms ? <span className="flex items-center gap-1"><BedDouble size={14} /> {detailItem.bedrooms} quartos</span> : null}
                  {detailItem.bathrooms ? <span className="flex items-center gap-1"><Bath size={14} /> {detailItem.bathrooms} banheiros</span> : null}
                  {detailItem.parking_spots ? <span className="flex items-center gap-1"><Car size={14} /> {detailItem.parking_spots} vagas</span> : null}
                  {detailItem.area ? <span className="flex items-center gap-1"><Maximize size={14} /> {detailItem.area}m²</span> : null}
                </div>

                {detailItem.description && (
                  <div>
                    <h4 className="text-xs font-bold text-muted-foreground uppercase mb-1">Descrição</h4>
                    <p className="text-sm text-foreground whitespace-pre-line">{detailItem.description}</p>
                  </div>
                )}

                <div className="bg-secondary/50 rounded-xl p-4 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground">
                    <DollarSign size={14} /> Simulação de Comissão
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-center">
                    <div className="bg-primary/10 rounded-xl p-2.5">
                      <p className="text-[10px] text-muted-foreground">Comissão Total</p>
                      <p className="font-bold text-sm text-primary">{fmt(gains.total)}</p>
                    </div>
                    <div className="bg-green-500/10 rounded-xl p-2.5">
                      <p className="text-[10px] text-muted-foreground">Seu ganho</p>
                      <p className="font-bold text-sm text-green-600">{fmt(gains.partner)}</p>
                    </div>
                  </div>
                </div>

                {detailItem.seller && (
                  <div className="flex items-center gap-3 bg-secondary/50 rounded-xl p-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                      {detailItem.seller.logo_url ? (
                        <img src={detailItem.seller.logo_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-sm font-bold text-primary">{detailItem.seller.full_name.charAt(0)}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-foreground truncate">{detailItem.seller.company_name || detailItem.seller.full_name}</p>
                      {detailItem.seller.creci && <p className="text-xs text-muted-foreground">CRECI: {detailItem.seller.creci}</p>}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2">
                  <a
                    href={publicUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-2.5 rounded-xl border border-input bg-background text-foreground text-xs font-bold hover:bg-secondary transition-colors flex items-center justify-center gap-1.5"
                  >
                    <ExternalLink size={14} /> Ver Anúncio
                  </a>
                  <button
                    onClick={() => openWhatsApp(detailItem.seller?.phone || null, detailItem.title, detailItem.finality)}
                    className="py-2.5 rounded-xl bg-green-500 text-white text-xs font-bold hover:bg-green-600 transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Phone size={14} /> WhatsApp
                  </button>
                </div>

                <button
                  onClick={() => requestPartnership(detailItem)}
                  disabled={requested}
                  className={`w-full py-3 rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-2 ${
                    requested
                      ? "bg-muted text-muted-foreground cursor-not-allowed"
                      : "bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20"
                  }`}
                >
                  <Handshake size={16} /> {requested ? (detailRequestStatus === "aprovado" ? "Parceria Ativa ✅" : "Aguardando aprovação") : "Solicitar Parceria"}
                </button>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* ===== VIGENTES ===== */}
      {subTab === "vigentes" && (
        <div className="space-y-4">
          {activePartnerships.length === 0 ? (
            <div className="text-center py-16 space-y-3">
              <Handshake size={40} className="mx-auto text-muted-foreground/30" />
              <p className="text-muted-foreground text-sm">Você ainda não tem parcerias vigentes.</p>
              <p className="text-xs text-muted-foreground">Parcerias aprovadas aparecerão aqui.</p>
            </div>
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              {activePartnerships.map(p => {
                const gains = p.item ? calcPartnerGain(p.item.price, p.item.commission_percent, p.item.partner_percent) : null;
                const publicUrl = p.item ? productUrl(p.item, p.role === "owner" ? null : (p.partner?.slug ?? null)) : "#";
                const ownerStoreUrl = p.item && p.partner?.slug && p.role === "requester" ? `/empresa/${p.partner.slug}` : null;
                const listing = storeListings.get(p.id);
                const inMyStore = !!listing;

                return (
                  <motion.div
                    key={p.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-card border border-green-500/30 rounded-2xl overflow-hidden hover:shadow-xl transition-shadow"
                  >
                    {/* Hero photo */}
                    <div className="relative aspect-[16/9] bg-muted overflow-hidden">
                      {p.item?.photos?.[0] ? (
                        <img src={p.item.photos[0]} alt={p.item.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center"><Home size={32} className="text-muted-foreground/30" /></div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                      <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-green-500 text-white text-[10px] font-bold shadow-lg flex items-center gap-1">
                        <CheckCircle2 size={11} /> {p.role === "owner" ? "Você é o dono" : "Você é o parceiro"}
                      </div>
                      <div className="absolute bottom-3 left-3 right-3">
                        <h3 className="font-display font-bold text-white text-base sm:text-lg line-clamp-1">{p.item?.title || "Imóvel"}</h3>
                        <p className="text-white/80 text-xs flex items-center gap-1">
                          <MapPin size={10} /> {p.item?.city || "Cidade não informada"}
                          {p.item?.neighborhood ? ` • ${p.item.neighborhood}` : ""}
                        </p>
                      </div>
                    </div>

                    <div className="p-4 space-y-3">
                      {/* Price + specs */}
                      <div className="flex items-center justify-between gap-3 flex-wrap">
                        {p.item?.price && (
                          <p className="font-display font-extrabold text-xl text-primary">
                            {fmt(p.item.price)}{p.item.finality === "aluguel" ? "/mês" : ""}
                          </p>
                        )}
                        <div className="flex gap-3 text-xs text-muted-foreground">
                          {p.item?.bedrooms ? <span className="flex items-center gap-1"><BedDouble size={12} /> {p.item.bedrooms}</span> : null}
                          {p.item?.bathrooms ? <span className="flex items-center gap-1"><Bath size={12} /> {p.item.bathrooms}</span> : null}
                          {p.item?.area ? <span className="flex items-center gap-1"><Maximize size={12} /> {p.item.area}m²</span> : null}
                        </div>
                      </div>

                      {/* Gains */}
                      {gains && gains.partner > 0 && (
                        <div className={`grid ${p.role === "owner" ? "grid-cols-2" : "grid-cols-1"} gap-2 text-center`}>
                          <div className="bg-green-500/10 rounded-xl p-2.5">
                            <p className="text-[10px] text-muted-foreground">{p.role === "owner" ? "Ganho do parceiro" : "Seu ganho estimado"}</p>
                            <p className="font-bold text-sm text-green-600">{fmt(gains.partner)}</p>
                          </div>
                          {p.role === "owner" && (
                            <div className="bg-primary/10 rounded-xl p-2.5">
                              <p className="text-[10px] text-muted-foreground">Seu ganho</p>
                              <p className="font-bold text-sm text-primary">{fmt(gains.owner)}</p>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Partner card */}
                      {p.partner && (
                        <div className="flex items-center gap-2.5 bg-secondary/50 rounded-xl p-2.5">
                          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden flex-shrink-0">
                            {p.partner.logo_url ? (
                              <img src={p.partner.logo_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-xs font-bold text-primary">{p.partner.full_name.charAt(0)}</span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-foreground truncate">{p.partner.company_name || p.partner.full_name}</p>
                            {p.partner.creci && <p className="text-[10px] text-muted-foreground">CRECI: {p.partner.creci}</p>}
                          </div>
                          {ownerStoreUrl && (
                            <a
                              href={ownerStoreUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-2.5 py-1.5 rounded-lg border border-input text-foreground text-[10px] font-bold hover:bg-secondary transition-colors flex items-center gap-1"
                            >
                              <Store size={11} /> Loja
                            </a>
                          )}
                          {p.partner.phone && (
                            <button
                              onClick={() => openWhatsApp(p.partner!.phone, p.item?.title || "Imóvel", p.item?.finality || null)}
                              className="px-2.5 py-1.5 rounded-lg bg-green-500 text-white text-[10px] font-bold hover:bg-green-600 transition-colors flex items-center gap-1"
                            >
                              <Phone size={11} />
                            </button>
                          )}
                        </div>
                      )}

                      {/* Action grid */}
                      <div className="grid grid-cols-2 gap-2">
                        <a
                          href={publicUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition-colors flex items-center justify-center gap-1.5 shadow-md shadow-primary/20"
                        >
                          <ExternalLink size={13} /> Ver Anúncio
                        </a>

                        {/* Add/manage in store — only for partner role */}
                        {p.role === "requester" && p.item && (
                          inMyStore ? (
                            <div className="flex gap-1">
                              <button
                                onClick={() => toggleStoreVisibility(listing!)}
                                disabled={savingId === p.id}
                                className="flex-1 py-2.5 rounded-xl bg-green-500/10 text-green-600 text-xs font-bold hover:bg-green-500/20 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
                                title={listing!.is_visible ? "Ocultar da loja" : "Mostrar na loja"}
                              >
                                {listing!.is_visible ? <Eye size={13} /> : <EyeOff size={13} />}
                                <span className="hidden sm:inline">{listing!.is_visible ? "Na loja" : "Oculto"}</span>
                              </button>
                              <button
                                onClick={() => removeFromStore(listing!)}
                                disabled={savingId === p.id}
                                className="px-2.5 py-2.5 rounded-xl bg-red-500/10 text-red-500 text-xs font-bold hover:bg-red-500/20 transition-colors disabled:opacity-50"
                                title="Remover da loja"
                              >
                                <X size={13} />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => addToMyStore(p.id, p.item!.id)}
                              disabled={savingId === p.id}
                              className="py-2.5 rounded-xl bg-accent/20 text-accent-foreground border border-accent/30 text-xs font-bold hover:bg-accent/30 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
                            >
                              <Store size={13} /> Adicionar à loja
                            </button>
                          )
                        )}

                        {p.role === "owner" && (
                          <span className="py-2.5 rounded-xl bg-secondary/50 text-muted-foreground text-[10px] font-bold flex items-center justify-center gap-1">
                            <Sparkles size={11} /> Parceiro pode promover
                          </span>
                        )}
                      </div>

                      <button
                        onClick={() => endPartnership(p.id, p.role === "owner" ? p.requester_user_id : p.owner_user_id, p.item?.title || "Imóvel", p.role)}
                        disabled={savingId === p.id}
                        className="w-full px-3 py-2 rounded-lg border border-red-500/40 text-red-500 text-xs font-bold hover:bg-red-500/10 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
                      >
                        <XCircle size={13} />
                        {p.role === "owner" ? "Encerrar parceria" : "Sair da parceria"}
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ===== MINHAS SOLICITAÇÕES ===== */}
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
              const removed = !req.item || req.item.status === "vendido" || req.item.status === "inativo";
              const removedLabel = !req.item ? "Imóvel removido" : req.item?.status === "vendido" ? "Imóvel vendido" : "Imóvel desativado";
              const gains = req.item ? calcPartnerGain(req.item.price, req.item.commission_percent, req.item.partner_percent) : null;
              return (
                <motion.div
                  key={req.id}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`bg-card border rounded-2xl p-4 flex gap-3 ${removed ? "border-red-500/30 opacity-70" : "border-border"}`}
                >
                  <div className="w-16 h-16 rounded-xl bg-muted overflow-hidden flex-shrink-0">
                    {removed ? (
                      <div className="w-full h-full flex items-center justify-center bg-red-500/10"><XCircle size={20} className="text-red-400" /></div>
                    ) : req.item?.photos?.[0] ? (
                      <img src={req.item.photos[0]} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center"><Home size={20} className="text-muted-foreground/30" /></div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0 space-y-1">
                    <h3 className="font-bold text-sm text-foreground truncate">
                      {removed ? removedLabel : req.item?.title || "Imóvel"}
                    </h3>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${st.color}`}>
                        <st.icon size={10} /> {st.label}
                      </span>
                      {removed && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold text-red-500 bg-red-500/10">
                          <XCircle size={10} /> {!req.item ? "Removido" : req.item?.status === "vendido" ? "Vendido" : "Desativado"}
                        </span>
                      )}
                      {!removed && gains && gains.partner > 0 && (
                        <span className="text-[10px] text-green-600 font-bold">Ganho: {fmt(gains.partner)}</span>
                      )}
                    </div>
                    {req.owner && (
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-[10px] text-muted-foreground">Corretor: {req.owner.full_name}</p>
                        {req.status === "aprovado" && req.owner.phone && (
                          <button
                            onClick={() => openWhatsApp(req.owner!.phone, req.item?.title || "Imóvel", req.item?.finality || null)}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-500 text-white hover:bg-green-600 transition-colors"
                          >
                            <Phone size={10} /> WhatsApp
                          </button>
                        )}
                        {!removed && req.item && (
                          <a
                            href={productUrl(req.item, req.owner.slug)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                          >
                            <ExternalLink size={10} /> Ver
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      )}

      {/* ===== RECEBIDAS ===== */}
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
              const removed = !req.item || req.item.status === "vendido" || req.item.status === "inativo";
              const removedLabel = !req.item ? "Imóvel removido" : req.item?.status === "vendido" ? "Imóvel vendido" : "Imóvel desativado";
              return (
                <motion.div
                  key={req.id}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`bg-card border rounded-2xl p-4 space-y-3 ${removed ? "border-red-500/30 opacity-70" : "border-border"}`}
                >
                  <div className="flex gap-3">
                    <div className="w-16 h-16 rounded-xl bg-muted overflow-hidden flex-shrink-0">
                      {removed ? (
                        <div className="w-full h-full flex items-center justify-center bg-red-500/10"><XCircle size={20} className="text-red-400" /></div>
                      ) : req.item?.photos?.[0] ? (
                        <img src={req.item.photos[0]} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center"><Home size={20} className="text-muted-foreground/30" /></div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0 space-y-1">
                      <h3 className="font-bold text-sm text-foreground truncate">
                        {removed ? removedLabel : req.item?.title || "Imóvel"}
                      </h3>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${st.color}`}>
                          <st.icon size={10} /> {st.label}
                        </span>
                        {removed && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold text-red-500 bg-red-500/10">
                            <XCircle size={10} /> {!req.item ? "Removido" : req.item?.status === "vendido" ? "Vendido" : "Desativado"}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

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
                      {req.requester.slug && (
                        <a
                          href={`/empresa/${req.requester.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1.5 rounded-lg border border-input text-foreground text-[10px] font-bold hover:bg-secondary transition-colors flex items-center gap-1"
                        >
                          <Store size={11} /> Loja
                        </a>
                      )}
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

                  {req.status === "pendente" && !removed && (
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

                  {req.status === "pendente" && removed && (
                    <p className="text-xs text-red-400 text-center py-1">Este imóvel foi removido. Não é possível aprovar esta solicitação.</p>
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
