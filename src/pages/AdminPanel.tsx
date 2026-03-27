import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Shield, Users, Package, DollarSign, Search, Check, X, RefreshCw, ArrowLeft, Crown, Star, Zap, Globe, Plus, Trash2, ExternalLink, Copy, Megaphone, LayoutDashboard, Building2, Rocket, FileText, UserCog, Filter, Camera, Phone } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useIsAdmin, PACKAGE_CONFIG } from "@/hooks/useSubscription";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface SellerWithSub {
  id: string;
  user_id: string;
  full_name: string;
  company_name: string | null;
  email: string;
  phone: string | null;
  seller_type: string;
  city: string | null;
  account_manager: string | null;
  manager_phone: string | null;
  manager_photo: string | null;
  subscription?: {
    id: string;
    tier: string;
    expires_at: string;
    is_active: boolean;
    payment_status: string | null;
  };
}

interface StoreDomain {
  id: string;
  seller_id: string;
  domain: string;
  is_active: boolean;
  created_at: string;
}

const tierIcons: Record<string, React.ElementType> = { basico: Zap, premium: Star, vip: Crown };

export default function AdminPanel() {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: adminLoading } = useIsAdmin(user?.id);
  const navigate = useNavigate();
  const { toast } = useToast();
  const [sellers, setSellers] = useState<SellerWithSub[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [tierFilter, setTierFilter] = useState<string>("todos");
  const [tab, setTab] = useState<"sellers" | "billing" | "domains" | "ads">("sellers");
  const [adRequests, setAdRequests] = useState<any[]>([]);
  const [adsLoading, setAdsLoading] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectAdId, setRejectAdId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  // Manager edit dialog state
  const [managerDialogOpen, setManagerDialogOpen] = useState(false);
  const [managerEditSellerId, setManagerEditSellerId] = useState<string | null>(null);
  const [managerName, setManagerName] = useState("");
  const [managerPhoneVal, setManagerPhoneVal] = useState("");
  const [managerPhotoUrl, setManagerPhotoUrl] = useState("");
  const [managerPhotoUploading, setManagerPhotoUploading] = useState(false);
  const managerPhotoRef = useRef<HTMLInputElement>(null);

  // Domain management state
  const [domains, setDomains] = useState<StoreDomain[]>([]);
  const [domainsLoading, setDomainsLoading] = useState(false);
  const [newDomain, setNewDomain] = useState("");
  const [selectedSellerId, setSelectedSellerId] = useState("");

  useEffect(() => {
    if (!authLoading && !adminLoading) {
      if (!user || !isAdmin) navigate("/painel");
    }
  }, [user, isAdmin, authLoading, adminLoading]);

  useEffect(() => {
    if (isAdmin) {
      fetchSellers();
      fetchDomains();
      fetchAdRequests();
    }
  }, [isAdmin]);

  const fetchAdRequests = async () => {
    setAdsLoading(true);
    const { data } = await supabase.from("ad_requests").select("*").order("created_at", { ascending: false });
    setAdRequests(data || []);
    setAdsLoading(false);
  };

  const updateAdStatus = async (id: string, status: string, reason?: string) => {
    const updateData: any = { status, updated_at: new Date().toISOString() };
    if (reason) updateData.details = reason;
    const { error } = await supabase.from("ad_requests").update(updateData).eq("id", id);
    if (error) {
      toast({ title: "Erro ao atualizar", variant: "destructive" });
    } else {
      toast({ title: `Solicitação ${status}` });
      fetchAdRequests();
    }
  };

  const handleRejectClick = (adId: string) => {
    setRejectAdId(adId);
    setRejectReason("");
    setRejectDialogOpen(true);
  };

  const confirmReject = async () => {
    if (!rejectAdId || !rejectReason.trim()) {
      toast({ title: "Informe o motivo da rejeição", variant: "destructive" });
      return;
    }
    await updateAdStatus(rejectAdId, "rejeitado", rejectReason.trim());
    setRejectDialogOpen(false);
    setRejectAdId(null);
    setRejectReason("");
  };

  const deleteAdRequest = async (id: string) => {
    const { error } = await supabase.from("ad_requests").delete().eq("id", id);
    if (error) {
      toast({ title: "Erro ao apagar", variant: "destructive" });
    } else {
      toast({ title: "Solicitação apagada" });
      fetchAdRequests();
    }
  };

  const fetchSellers = async () => {
    setLoading(true);
    const { data: profiles } = await supabase.from("profiles").select("*");
    const { data: subs } = await supabase.from("seller_subscriptions").select("*").eq("is_active", true);

    const subsMap = new Map<string, any>();
    (subs || []).forEach((s: any) => subsMap.set(s.user_id, s));

    const mapped: SellerWithSub[] = (profiles || []).map((p: any) => ({
      id: p.id,
      user_id: p.user_id,
      full_name: p.full_name,
      company_name: p.company_name,
      email: p.email,
      phone: p.phone,
      seller_type: p.seller_type,
      city: p.city,
      account_manager: p.account_manager || null,
      manager_phone: p.manager_phone || null,
      manager_photo: p.manager_photo || null,
      subscription: subsMap.get(p.user_id)
        ? {
            id: subsMap.get(p.user_id).id,
            tier: subsMap.get(p.user_id).tier,
            expires_at: subsMap.get(p.user_id).expires_at,
            is_active: subsMap.get(p.user_id).is_active,
            payment_status: subsMap.get(p.user_id).payment_status,
          }
        : undefined,
    }));

    setSellers(mapped);
    setLoading(false);
  };

  const fetchDomains = async () => {
    setDomainsLoading(true);
    const { data } = await supabase.from("store_domains").select("*").order("created_at", { ascending: false });
    setDomains((data as StoreDomain[]) || []);
    setDomainsLoading(false);
  };

  const addDomain = async () => {
    if (!newDomain.trim() || !selectedSellerId) {
      toast({ title: "Preencha o domínio e selecione um vendedor", variant: "destructive" });
      return;
    }
    const cleanDomain = newDomain.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/$/, "");
    const { error } = await supabase.from("store_domains").insert({
      seller_id: selectedSellerId,
      domain: cleanDomain,
    } as any);
    if (error) {
      toast({ title: "Erro ao adicionar domínio", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Domínio adicionado!" });
      setNewDomain("");
      setSelectedSellerId("");
      fetchDomains();
    }
  };

  const removeDomain = async (id: string) => {
    const { error } = await supabase.from("store_domains").delete().eq("id", id);
    if (!error) {
      toast({ title: "Domínio removido" });
      fetchDomains();
    }
  };

  const toggleDomain = async (id: string, currentActive: boolean) => {
    const { error } = await supabase.from("store_domains").update({ is_active: !currentActive } as any).eq("id", id);
    if (!error) {
      fetchDomains();
    }
  };

  const getSellerStoreUrl = (seller: SellerWithSub) => {
    return `/imoveis/empresa/${seller.id}`;
  };

  const copyRedirectUrl = (seller: SellerWithSub) => {
    const baseUrl = window.location.origin;
    const storeUrl = `${baseUrl}${getSellerStoreUrl(seller)}`;
    navigator.clipboard.writeText(storeUrl);
    toast({ title: "URL copiada!", description: storeUrl });
  };

  const approvePayment = async (subId: string) => {
    const { error } = await supabase
      .from("seller_subscriptions")
      .update({ payment_status: "confirmado" } as any)
      .eq("id", subId);
    if (!error) {
      toast({ title: "Pagamento aprovado!" });
      fetchSellers();
    }
  };

  const cancelSubscription = async (subId: string) => {
    const { error } = await supabase
      .from("seller_subscriptions")
      .update({ is_active: false } as any)
      .eq("id", subId);
    if (!error) {
      toast({ title: "Assinatura cancelada" });
      fetchSellers();
    }
  };

  const renewSubscription = async (subId: string) => {
    const newExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    const { error } = await supabase
      .from("seller_subscriptions")
      .update({ expires_at: newExpiry, is_active: true, payment_status: "confirmado" } as any)
      .eq("id", subId);
    if (!error) {
      toast({ title: "Assinatura renovada por +30 dias!" });
      fetchSellers();
    }
  };

  const filteredSellers = sellers.filter((s) => {
    const matchesSearch =
      s.full_name.toLowerCase().includes(search.toLowerCase()) ||
      s.email.toLowerCase().includes(search.toLowerCase()) ||
      s.company_name?.toLowerCase().includes(search.toLowerCase());
    const matchesTier =
      tierFilter === "todos" ||
      (tierFilter === "sem_pacote" && !s.subscription) ||
      s.subscription?.tier === tierFilter;
    return matchesSearch && matchesTier;
  });

  const openManagerDialog = (seller: SellerWithSub) => {
    setManagerEditSellerId(seller.id);
    setManagerName(seller.account_manager || "");
    setManagerPhoneVal(seller.manager_phone || "");
    setManagerPhotoUrl(seller.manager_photo || "");
    setManagerDialogOpen(true);
  };

  const handleManagerPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !managerEditSellerId) return;
    setManagerPhotoUploading(true);
    const ext = file.name.split(".").pop();
    const path = `managers/${managerEditSellerId}-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("seller-uploads").upload(path, file, { upsert: true });
    if (error) {
      toast({ title: "Erro ao enviar foto", variant: "destructive" });
      setManagerPhotoUploading(false);
      return;
    }
    const { data: urlData } = supabase.storage.from("seller-uploads").getPublicUrl(path);
    setManagerPhotoUrl(urlData.publicUrl);
    setManagerPhotoUploading(false);
  };

  const saveManager = async () => {
    if (!managerEditSellerId) return;
    const updateData: any = {
      account_manager: managerName || null,
      manager_phone: managerPhoneVal || null,
      manager_photo: managerPhotoUrl || null,
    };
    const { error } = await supabase.from("profiles").update(updateData).eq("id", managerEditSellerId);
    if (!error) {
      setSellers((prev) =>
        prev.map((s) => (s.id === managerEditSellerId ? { ...s, ...updateData } : s))
      );
      toast({ title: "Gerente de conta atualizado!" });
      setManagerDialogOpen(false);
    } else {
      toast({ title: "Erro ao salvar", variant: "destructive" });
    }
  };

  const totalByTier = {
    start: sellers.filter((s) => s.subscription?.tier === "start").length,
    basico: sellers.filter((s) => s.subscription?.tier === "basico").length,
    premium: sellers.filter((s) => s.subscription?.tier === "premium").length,
    vip: sellers.filter((s) => s.subscription?.tier === "vip").length,
    essencial_empresa: sellers.filter((s) => s.subscription?.tier === "essencial_empresa").length,
    premium_empresa: sellers.filter((s) => s.subscription?.tier === "premium_empresa").length,
    prime_empresa: sellers.filter((s) => s.subscription?.tier === "prime_empresa").length,
    sem_pacote: sellers.filter((s) => !s.subscription).length,
  };

  const getSellerName = (sellerId: string) => {
    const s = sellers.find((s) => s.id === sellerId);
    return s?.company_name || s?.full_name || "Desconhecido";
  };

  if (authLoading || adminLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const pendingAdsCount = adRequests.filter(a => a.status === "pendente").length;

  const sidebarItems = [
    { key: "sellers" as const, label: "Vendedores", icon: Users },
    { key: "billing" as const, label: "Faturamento", icon: DollarSign },
    { key: "domains" as const, label: "Domínios", icon: Globe },
    { key: "ads" as const, label: "Solicitações ADS", icon: Megaphone, badge: pendingAdsCount },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="gradient-hero py-5 shrink-0">
        <div className="container max-w-7xl mx-auto px-4">
          <Link to="/painel" className="inline-flex items-center gap-2 text-white/70 text-sm mb-2 hover:text-white">
            <ArrowLeft size={16} /> Voltar
          </Link>
          <div className="flex items-center gap-3">
            <Shield size={28} className="text-white" />
            <h1 className="font-display font-extrabold text-2xl text-white">Painel Administrativo</h1>
          </div>
        </div>
      </div>

      <div className="flex-1 flex">
        {/* Sidebar - Desktop */}
        <aside className="hidden md:flex flex-col w-64 shrink-0 border-r border-border bg-card p-4 gap-1">
          {/* Stats mini */}
          <div className="grid grid-cols-2 gap-2 mb-4">
            {[
              { label: "Total", value: sellers.length, icon: Users, color: "text-primary" },
              { label: "Start", value: totalByTier.start, icon: Rocket, color: "text-emerald-500" },
              { label: "Básico", value: totalByTier.basico, icon: Zap, color: "text-muted-foreground" },
              { label: "Premium", value: totalByTier.premium, icon: Star, color: "text-amber-500" },
              { label: "VIP", value: totalByTier.vip, icon: Crown, color: "text-purple-500" },
              { label: "Ess. Empresa", value: totalByTier.essencial_empresa, icon: Building2, color: "text-blue-500" },
              { label: "Prem. Empresa", value: totalByTier.premium_empresa, icon: Building2, color: "text-indigo-500" },
              { label: "Black Empresa", value: totalByTier.prime_empresa, icon: Crown, color: "text-zinc-400" },
            ].map((s) => (
              <div key={s.label} className="bg-secondary rounded-xl p-2.5 text-center">
                <s.icon size={14} className={`${s.color} mx-auto mb-0.5`} />
                <p className="font-bold text-lg text-foreground leading-none">{s.value}</p>
                <p className="text-[10px] text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Nav items */}
          <nav className="space-y-1">
            {sidebarItems.map((item) => (
              <button
                key={item.key}
                onClick={() => setTab(item.key)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  tab === item.key
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                }`}
              >
                <item.icon size={18} />
                <span className="flex-1 text-left">{item.label}</span>
                {item.badge && item.badge > 0 && (
                  <span className="bg-destructive text-destructive-foreground text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                    {item.badge}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </aside>

        {/* Mobile tabs */}
        <div className="md:hidden flex gap-2 p-3 overflow-x-auto border-b border-border bg-card shrink-0">
          {sidebarItems.map((item) => (
            <button
              key={item.key}
              onClick={() => setTab(item.key)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                tab === item.key ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
              }`}
            >
              <item.icon size={14} />
              {item.label}
              {item.badge && item.badge > 0 && (
                <span className="bg-destructive text-destructive-foreground text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                  {item.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 max-w-5xl">

        {/* Search */}
        {tab !== "domains" && (
          <div className="relative mb-4">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar vendedor..."
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-input bg-background text-foreground text-sm focus:ring-2 focus:ring-ring focus:outline-none" />
          </div>
        )}

        {tab === "sellers" && (
          <div className="space-y-3">
            {/* Tier Filter */}
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <Filter size={14} className="text-muted-foreground" />
              <span className="text-xs text-muted-foreground font-semibold">Filtrar por plano:</span>
              {[
                { key: "todos", label: "Todos" },
                { key: "sem_pacote", label: "Sem Pacote" },
                { key: "basico", label: "Básico" },
                { key: "start", label: "Start" },
                { key: "premium", label: "Premium" },
                { key: "vip", label: "VIP" },
                { key: "essencial_empresa", label: "Ess. Empresa" },
                { key: "premium_empresa", label: "Prem. Empresa" },
                { key: "prime_empresa", label: "Black Empresa" },
              ].map((f) => (
                <button
                  key={f.key}
                  onClick={() => setTierFilter(f.key)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                    tierFilter === f.key
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {filteredSellers.map((seller) => {
              const sub = seller.subscription;
              const TierIcon = sub ? tierIcons[sub.tier] || Zap : Zap;
              const tierConfig = sub ? PACKAGE_CONFIG[sub.tier as keyof typeof PACKAGE_CONFIG] : null;
              const daysLeft = sub ? Math.ceil((new Date(sub.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null;

              return (
                <div key={seller.id} className="bg-card border border-border rounded-2xl p-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-display font-bold text-foreground">{seller.company_name || seller.full_name}</h3>
                        {sub && (
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${tierConfig?.badgeColor}`}>
                            <TierIcon size={10} className="inline mr-0.5" />
                            {tierConfig?.name}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">{seller.email} • {seller.seller_type} • {seller.city || "—"}</p>
                      {sub && (
                        <p className="text-xs mt-1">
                          {sub.payment_status === "pendente" && <span className="text-amber-500 font-semibold">⏳ Pagamento pendente</span>}
                          {sub.payment_status === "confirmado" && <span className="text-green-500 font-semibold">✅ Pago</span>}
                          {daysLeft !== null && (
                            <span className={`ml-2 ${daysLeft <= 7 ? "text-red-500" : "text-muted-foreground"}`}>
                              • {daysLeft > 0 ? `${daysLeft} dias restantes` : "Expirado"}
                            </span>
                          )}
                        </p>
                      )}

                      {/* Account Manager */}
                      <div className="flex items-center gap-2 mt-2">
                        <button
                          onClick={() => openManagerDialog(seller)}
                          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-input bg-background text-xs font-medium text-foreground hover:bg-secondary transition-colors"
                        >
                          {seller.manager_photo ? (
                            <img src={seller.manager_photo} alt="" className="w-5 h-5 rounded-full object-cover" />
                          ) : (
                            <UserCog size={14} className="text-muted-foreground" />
                          )}
                          {seller.account_manager || "Definir gerente"}
                        </button>
                      </div>
                    </div>

                    <div className="flex gap-1.5 flex-wrap">
                      {sub?.payment_status === "pendente" && (
                        <button onClick={() => approvePayment(sub.id)}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-green-500/10 text-green-600 text-xs font-semibold hover:bg-green-500/20">
                          <Check size={12} /> Aprovar
                        </button>
                      )}
                      {sub && (
                        <>
                          <button onClick={() => renewSubscription(sub.id)}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-semibold hover:bg-primary/20">
                            <RefreshCw size={12} /> Renovar
                          </button>
                          <button onClick={() => cancelSubscription(sub.id)}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-destructive/10 text-destructive text-xs font-semibold hover:bg-destructive/20">
                            <X size={12} /> Cancelar
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {filteredSellers.length === 0 && (
              <div className="text-center py-8 text-muted-foreground text-sm">Nenhum vendedor encontrado.</div>
            )}
          </div>
        )}

        {tab === "billing" && (
          <div className="bg-card border border-border rounded-2xl p-6">
            <h3 className="font-display font-bold text-lg text-foreground mb-4">Resumo de Faturamento</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {(["start", "basico", "premium", "vip", "essencial_empresa", "premium_empresa", "prime_empresa"] as const).map((tier) => {
                const config = PACKAGE_CONFIG[tier];
                const count = totalByTier[tier];
                const revenue = count * config.price;
                return (
                  <div key={tier} className={`rounded-xl border-2 ${config.borderColor} p-4`}>
                    <h4 className="font-display font-bold text-foreground">{config.name}</h4>
                    <p className="text-2xl font-bold text-foreground mt-1">{count} <span className="text-sm font-normal text-muted-foreground">assinantes</span></p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Receita mensal: <strong className="text-green-500">R$ {revenue.toFixed(2).replace(".", ",")}</strong>
                    </p>
                  </div>
                );
              })}
            </div>
            <div className="mt-4 p-4 bg-secondary rounded-xl">
              <p className="text-sm text-foreground">
                <strong>Receita mensal total estimada: </strong>
                <span className="text-green-500 font-bold text-lg">
                  R$ {(
                    totalByTier.start * PACKAGE_CONFIG.start.price +
                    totalByTier.premium * PACKAGE_CONFIG.premium.price +
                    totalByTier.vip * PACKAGE_CONFIG.vip.price +
                    totalByTier.essencial_empresa * PACKAGE_CONFIG.essencial_empresa.price +
                    totalByTier.premium_empresa * PACKAGE_CONFIG.premium_empresa.price +
                    totalByTier.prime_empresa * PACKAGE_CONFIG.prime_empresa.price
                  ).toFixed(2).replace(".", ",")}
                </span>
              </p>
            </div>
          </div>
        )}

        {tab === "domains" && (
          <div className="space-y-4">
            {/* Add domain form */}
            <div className="bg-card border border-border rounded-2xl p-6">
              <h3 className="font-display font-bold text-lg text-foreground mb-4 flex items-center gap-2">
                <Globe size={20} className="text-primary" /> Adicionar Domínio Custom
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground font-semibold mb-1 block">Domínio</label>
                  <input
                    value={newDomain}
                    onChange={(e) => setNewDomain(e.target.value)}
                    placeholder="manufature.com.br"
                    className="w-full px-4 py-2.5 rounded-xl border border-input bg-background text-foreground text-sm focus:ring-2 focus:ring-ring focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground font-semibold mb-1 block">Vendedor</label>
                  <select
                    value={selectedSellerId}
                    onChange={(e) => setSelectedSellerId(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-input bg-background text-foreground text-sm focus:ring-2 focus:ring-ring focus:outline-none"
                  >
                    <option value="">Selecione o vendedor...</option>
                    {sellers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.company_name || s.full_name} ({s.seller_type})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-end">
                  <button
                    onClick={addDomain}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-all"
                  >
                    <Plus size={16} /> Adicionar
                  </button>
                </div>
              </div>
            </div>

            {/* Passo a passo */}
            <div className="bg-card border border-border rounded-2xl p-6">
              <h3 className="font-display font-bold text-lg text-foreground mb-4 flex items-center gap-2">
                📋 Passo a Passo para Configurar Domínio do Lojista
              </h3>
              <div className="space-y-4 text-sm text-muted-foreground">
                <div className="flex gap-3">
                  <span className="flex-shrink-0 w-7 h-7 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-xs">1</span>
                  <div>
                    <p className="font-semibold text-foreground">Cadastrar o domínio aqui no Admin</p>
                    <p>Preencha o domínio e selecione o vendedor acima, depois clique em "Adicionar".</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <span className="flex-shrink-0 w-7 h-7 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-xs">2</span>
                  <div>
                    <p className="font-semibold text-foreground">Adicionar o domínio no Lovable</p>
                    <p>Vá em <strong>Settings → Domains → Connect Domain</strong> no projeto Lovable e adicione o mesmo domínio. Isso faz o Lovable servir o site naquele endereço.</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <span className="flex-shrink-0 w-7 h-7 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-xs">3</span>
                  <div>
                    <p className="font-semibold text-foreground">Configurar DNS no registrador do domínio</p>
                    <p>O lojista (ou você) deve configurar no provedor de DNS:</p>
                    <div className="mt-2 bg-muted/50 rounded-xl p-3 space-y-1 font-mono text-xs">
                      <div className="flex gap-4"><span className="text-muted-foreground w-12">Tipo:</span><span className="text-foreground font-semibold">A</span></div>
                      <div className="flex gap-4"><span className="text-muted-foreground w-12">Nome:</span><span className="text-foreground font-semibold">@ (raiz)</span></div>
                      <div className="flex gap-4"><span className="text-muted-foreground w-12">Valor:</span><span className="text-primary font-semibold">185.158.133.1</span></div>
                    </div>
                    <div className="mt-2 bg-muted/50 rounded-xl p-3 space-y-1 font-mono text-xs">
                      <div className="flex gap-4"><span className="text-muted-foreground w-12">Tipo:</span><span className="text-foreground font-semibold">A</span></div>
                      <div className="flex gap-4"><span className="text-muted-foreground w-12">Nome:</span><span className="text-foreground font-semibold">www</span></div>
                      <div className="flex gap-4"><span className="text-muted-foreground w-12">Valor:</span><span className="text-primary font-semibold">185.158.133.1</span></div>
                    </div>
                    <div className="mt-2 bg-amber-500/10 rounded-xl p-3 space-y-1 font-mono text-xs border border-amber-500/20">
                      <div className="flex gap-4"><span className="text-muted-foreground w-12">Tipo:</span><span className="text-foreground font-semibold">TXT</span></div>
                      <div className="flex gap-4"><span className="text-muted-foreground w-12">Nome:</span><span className="text-foreground font-semibold">@</span></div>
                      <div className="flex gap-4"><span className="text-muted-foreground w-12">Valor:</span><span className="text-amber-600 font-semibold break-all">lovable_verify=... (copie o código do Lovable em Settings → Domains)</span></div>
                    </div>
                    <p className="mt-2 text-xs text-amber-600 font-semibold">⚠️ O registro TXT é obrigatório! Sem ele, o Lovable não valida o domínio e dá erro DNS.</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <span className="flex-shrink-0 w-7 h-7 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-xs">4</span>
                  <div>
                    <p className="font-semibold text-foreground">Aguardar propagação DNS</p>
                    <p>A propagação pode levar até <strong>48-72 horas</strong>. O SSL (HTTPS) será provisionado automaticamente pelo Lovable.</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <span className="flex-shrink-0 w-7 h-7 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-xs">5</span>
                  <div>
                    <p className="font-semibold text-foreground">Testar o acesso</p>
                    <p>Acesse o domínio no navegador. O sistema detectará automaticamente o domínio e mostrará apenas a loja do vendedor vinculado.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Domain list */}
            <div className="bg-card border border-border rounded-2xl p-6">
              <h3 className="font-display font-bold text-lg text-foreground mb-4">Domínios Configurados</h3>
              {domainsLoading ? (
                <div className="text-center py-8 text-muted-foreground text-sm">Carregando...</div>
              ) : domains.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">Nenhum domínio configurado ainda.</div>
              ) : (
                <div className="space-y-3">
                  {domains.map((d) => {
                    const seller = sellers.find((s) => s.id === d.seller_id);
                    return (
                      <div key={d.id} className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-4 rounded-xl bg-secondary/50 border border-border">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <Globe size={16} className={d.is_active ? "text-green-500" : "text-muted-foreground"} />
                            <span className="font-semibold text-foreground">{d.domain}</span>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${d.is_active ? "bg-green-500/10 text-green-500" : "bg-muted text-muted-foreground"}`}>
                              {d.is_active ? "Ativo" : "Inativo"}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            → {seller?.company_name || seller?.full_name || "Vendedor não encontrado"}
                          </p>
                        </div>
                        <div className="flex gap-1.5">
                          {seller && (
                            <button
                              onClick={() => copyRedirectUrl(seller)}
                              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-semibold hover:bg-primary/20"
                            >
                              <Copy size={12} /> Copiar URL
                            </button>
                          )}
                          <button
                            onClick={() => toggleDomain(d.id, d.is_active)}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-500/10 text-amber-600 text-xs font-semibold hover:bg-amber-500/20"
                          >
                            {d.is_active ? "Desativar" : "Ativar"}
                          </button>
                          <button
                            onClick={() => removeDomain(d.id)}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-destructive/10 text-destructive text-xs font-semibold hover:bg-destructive/20"
                          >
                            <Trash2 size={12} /> Remover
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {tab === "ads" && (
          <div className="space-y-3">
            {adsLoading ? (
              <div className="text-center py-8 text-muted-foreground text-sm">Carregando...</div>
            ) : adRequests.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">Nenhuma solicitação de ADS ainda.</div>
            ) : (
              adRequests.map((ad) => {
                const seller = sellers.find(s => s.id === ad.seller_id || s.user_id === ad.user_id);
                return (
                  <div key={ad.id} className="bg-card border border-border rounded-2xl p-4">
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-display font-bold text-foreground">
                            {seller?.company_name || "Vendedor"}
                          </h3>
                          {seller?.company_name && seller?.full_name && (
                            <span className="text-xs text-muted-foreground">({seller.full_name})</span>
                          )}
                          {!seller?.company_name && seller?.full_name && (
                            <h3 className="font-display font-bold text-foreground">{seller.full_name}</h3>
                          )}
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                            ad.status === "pendente" ? "bg-amber-500/10 text-amber-500" :
                            ad.status === "aprovado" ? "bg-green-500/10 text-green-500" :
                            "bg-destructive/10 text-destructive"
                          }`}>
                            {ad.status}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {seller?.email || "—"} • {seller?.city || "—"} • {seller?.seller_type || "—"}
                        </p>
                        {seller?.phone && (
                          <p className="text-xs text-muted-foreground flex items-center gap-2 flex-wrap">
                            📞 {seller.phone}
                            {(() => {
                              const nome = seller.full_name || "cliente";
                              const loja = seller.company_name || "";
                              const plataforma = "ADS Interno";
                              const cidade = seller.city || "";
                              const nicho = seller.seller_type === "automoveis" ? "Automóveis" : "Imóveis";
                              const total = `R$ ${Number(ad.total).toFixed(2).replace(".", ",")}`;
                              
                              const msgAprovado = `Olá ${nome}! 🎉 É com grande alegria que viemos lhe informar que a sua solicitação de anúncio foi *APROVADA*! ✅\n\n📋 *Detalhes do seu pedido:*\n🏪 Loja: ${loja}\n📍 Cidade: ${cidade}\n🏷️ Nicho: ${nicho}\n💰 Valor total: ${total}\n\nEntraremos em contato em breve para dar início à sua campanha. Obrigado por confiar na Manufature! 🚀`;
                              const msgPendente = `Olá ${nome}! 👋 Recebemos a sua solicitação de anúncio.\n\n📋 *Detalhes:*\n🏪 Loja: ${loja}\n📍 Cidade: ${cidade}\n🏷️ Nicho: ${nicho}\n💰 Valor total: ${total}\n\nEstamos analisando o seu pedido e em breve retornaremos com uma resposta. 😊`;
                              const motivoRejeicao = ad.details ? `\n\n📝 *Motivo:* ${ad.details}` : "";
                              const msgRejeitado = `Olá ${nome}! 👋 Infelizmente sua solicitação de anúncio não foi aprovada desta vez.\n\n📋 *Detalhes:*\n🏪 Loja: ${loja}\n💰 Valor: ${total}${motivoRejeicao}\n\nEntre em contato conosco para mais informações. Estamos à disposição! 🤝`;
                              
                              const msg = ad.status === "aprovado" ? msgAprovado : ad.status === "rejeitado" ? msgRejeitado : msgPendente;
                              const phone = seller.phone.replace(/\D/g, '');
                              const waUrl = `https://wa.me/55${phone}?text=${encodeURIComponent(msg)}`;
                              
                              return (
                                <a href={waUrl} target="_blank" rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-green-500/10 text-green-600 text-[10px] font-semibold hover:bg-green-500/20">
                                  WhatsApp
                                </a>
                              );
                            })()}
                          </p>
                        )}
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                          <div className="bg-secondary rounded-lg p-2 text-center">
                            <p className="text-[10px] text-muted-foreground">Diário</p>
                            <p className="text-sm font-bold text-foreground">R$ {Number(ad.daily_budget).toFixed(2)}</p>
                          </div>
                          <div className="bg-secondary rounded-lg p-2 text-center">
                            <p className="text-[10px] text-muted-foreground">Dias</p>
                            <p className="text-sm font-bold text-foreground">{ad.duration_days}</p>
                          </div>
                          <div className="bg-secondary rounded-lg p-2 text-center">
                            <p className="text-[10px] text-muted-foreground">Total</p>
                            <p className="text-sm font-bold text-green-500">R$ {Number(ad.total).toFixed(2)}</p>
                          </div>
                        </div>
                        {ad.details && (
                          <p className="text-xs text-muted-foreground mt-2 bg-secondary/50 p-2 rounded-lg">
                            💬 {ad.details}
                          </p>
                        )}
                        <p className="text-[10px] text-muted-foreground mt-1">
                          {new Date(ad.created_at).toLocaleDateString("pt-BR")} às {new Date(ad.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                      <div className="flex gap-1.5 flex-wrap">
                        {seller && (() => {
                          const customDomain = domains.find(d => d.seller_id === seller.id && d.is_active);
                          const storeUrl = customDomain 
                            ? `https://${customDomain.domain}` 
                            : `/loja/${seller.id}`;
                          const isExternal = !!customDomain;
                          return isExternal ? (
                            <a href={storeUrl} target="_blank" rel="noopener noreferrer"
                              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-semibold hover:bg-primary/20">
                              <ExternalLink size={12} /> Ver Loja ({customDomain.domain})
                            </a>
                          ) : (
                            <Link to={storeUrl} target="_blank"
                              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-semibold hover:bg-primary/20">
                              <ExternalLink size={12} /> Ver Loja
                            </Link>
                          );
                        })()}
                        {ad.status === "aprovado" && seller && (() => {
                          const sitemapUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/seller-sitemap?seller_id=${seller.id}&format=google`;
                          return (
                            <>
                              <a href={sitemapUrl} target="_blank" rel="noopener noreferrer"
                                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-500/10 text-amber-600 text-xs font-semibold hover:bg-amber-500/20">
                                <FileText size={12} /> Sitemap
                              </a>
                              <button onClick={() => {
                                navigator.clipboard.writeText(sitemapUrl);
                                toast({ title: "URL do sitemap copiada!" });
                              }}
                                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-secondary text-foreground text-xs font-semibold hover:bg-secondary/80">
                                <Copy size={12} /> Copiar URL
                              </button>
                            </>
                          );
                        })()}
                        {ad.status === "pendente" && (
                          <>
                            <button onClick={() => updateAdStatus(ad.id, "aprovado")}
                              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-green-500/10 text-green-600 text-xs font-semibold hover:bg-green-500/20">
                              <Check size={12} /> Aprovar
                            </button>
                            <button onClick={() => handleRejectClick(ad.id)}
                              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-destructive/10 text-destructive text-xs font-semibold hover:bg-destructive/20">
                              <X size={12} /> Rejeitar
                            </button>
                          </>
                        )}
                        <button onClick={() => deleteAdRequest(ad.id)}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-destructive/10 text-destructive text-xs font-semibold hover:bg-destructive/20">
                          <Trash2 size={12} /> Apagar
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
        </main>
      </div>

      {/* Reject Reason Dialog */}
      {rejectDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-md mx-4 shadow-xl">
            <h3 className="font-display font-bold text-lg text-foreground mb-2">Motivo da Rejeição</h3>
            <p className="text-sm text-muted-foreground mb-4">Informe o motivo para que o solicitante possa visualizar.</p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Ex: Sua loja não atende aos requisitos mínimos para campanhas..."
              className="w-full px-4 py-3 rounded-xl bg-secondary text-foreground text-sm border border-border focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none h-28"
              maxLength={500}
            />
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => { setRejectDialogOpen(false); setRejectAdId(null); }}
                className="px-4 py-2 rounded-xl text-sm font-medium text-muted-foreground hover:bg-secondary transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={confirmReject}
                className="px-4 py-2 rounded-xl bg-destructive text-destructive-foreground text-sm font-bold hover:opacity-90 transition-opacity"
              >
                Confirmar Rejeição
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manager Edit Dialog */}
      <Dialog open={managerDialogOpen} onOpenChange={setManagerDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><UserCog size={18} /> Gerente de Conta</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            {/* Photo */}
            <div className="flex flex-col items-center gap-2">
              <div
                onClick={() => managerPhotoRef.current?.click()}
                className="w-20 h-20 rounded-full bg-secondary border-2 border-dashed border-border flex items-center justify-center cursor-pointer hover:border-primary transition-colors overflow-hidden"
              >
                {managerPhotoUrl ? (
                  <img src={managerPhotoUrl} alt="Gerente" className="w-full h-full object-cover" />
                ) : (
                  <Camera size={24} className="text-muted-foreground" />
                )}
              </div>
              <input ref={managerPhotoRef} type="file" accept="image/*" className="hidden" onChange={handleManagerPhotoUpload} />
              <p className="text-[10px] text-muted-foreground">
                {managerPhotoUploading ? "Enviando..." : "Clique para enviar foto"}
              </p>
            </div>

            {/* Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Nome do Gerente</label>
              <input
                value={managerName}
                onChange={(e) => setManagerName(e.target.value)}
                placeholder="Ex: Gabriel"
                className="w-full px-3 py-2 rounded-xl border border-input bg-background text-foreground text-sm focus:ring-2 focus:ring-ring focus:outline-none"
              />
            </div>

            {/* WhatsApp */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1"><Phone size={12} /> WhatsApp</label>
              <input
                value={managerPhoneVal}
                onChange={(e) => setManagerPhoneVal(e.target.value)}
                placeholder="5527999999999"
                className="w-full px-3 py-2 rounded-xl border border-input bg-background text-foreground text-sm focus:ring-2 focus:ring-ring focus:outline-none"
              />
              <p className="text-[10px] text-muted-foreground">Formato: DDI + DDD + número (ex: 5527999999999)</p>
            </div>

            <button
              onClick={saveManager}
              disabled={managerPhotoUploading}
              className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              Salvar
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
