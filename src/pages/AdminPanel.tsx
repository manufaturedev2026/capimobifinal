import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Shield, Users, Package, DollarSign, Search, Check, X, RefreshCw, ArrowLeft, Crown, Star, Zap, Globe, Plus, Trash2, ExternalLink, Copy, Megaphone, LayoutDashboard, Building2, Rocket, FileText, UserCog, Filter, Camera, Phone, Ban, ShieldOff, Clock, MessageCircle, MapPin } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useIsAdmin, PACKAGE_CONFIG } from "@/hooks/useSubscription";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

import AdminCrmTab from "@/components/AdminCrmTab";

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
  const [tab, setTab] = useState<"sellers" | "billing" | "referrals" | "crm" | "seo" | "vendas" | "config">("sellers");
  const [homepageMode, setHomepageMode] = useState<string>("single");
  const [adRequests, setAdRequests] = useState<any[]>([]);
  const [adsLoading, setAdsLoading] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectAdId, setRejectAdId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  // Ban dialog state
  const [banDialogOpen, setBanDialogOpen] = useState(false);
  const [banSeller, setBanSeller] = useState<SellerWithSub | null>(null);
  const [banReason, setBanReason] = useState("");
  const [banDuration, setBanDuration] = useState<"7" | "30" | "90" | "permanent">("7");
  const [bans, setBans] = useState<Record<string, { id: string; reason: string | null; expires_at: string | null; is_permanent: boolean }>>({});

  // Manager edit dialog state
  const [managerDialogOpen, setManagerDialogOpen] = useState(false);
  const [managerEditSellerId, setManagerEditSellerId] = useState<string | null>(null);
  const [managerName, setManagerName] = useState("");
  const [managerPhoneVal, setManagerPhoneVal] = useState("");
  const [managerPhotoUrl, setManagerPhotoUrl] = useState("");
  const [managerPhotoUploading, setManagerPhotoUploading] = useState(false);
  const managerPhotoRef = useRef<HTMLInputElement>(null);


  useEffect(() => {
    if (!authLoading && !adminLoading) {
      if (!user || !isAdmin) navigate("/painel");
    }
  }, [user, isAdmin, authLoading, adminLoading]);

  useEffect(() => {
    if (isAdmin) {
      fetchSellers();
      fetchAdRequests();
      fetchBans();
      // Fetch homepage mode
      supabase.from("platform_settings").select("value").eq("key", "homepage_mode").maybeSingle().then(({ data }) => {
        if (data?.value) setHomepageMode(data.value);
      });
    }
  }, [isAdmin]);

  const fetchBans = async () => {
    const { data } = await supabase.from("user_bans").select("*").eq("is_active", true);
    const bansMap: Record<string, { id: string; reason: string | null; expires_at: string | null; is_permanent: boolean }> = {};
    (data || []).forEach((b: any) => {
      bansMap[b.user_id] = { id: b.id, reason: b.reason, expires_at: b.expires_at, is_permanent: b.is_permanent };
    });
    setBans(bansMap);
  };

  const openBanDialog = (seller: SellerWithSub) => {
    setBanSeller(seller);
    setBanReason("");
    setBanDuration("7");
    setBanDialogOpen(true);
  };

  const confirmBan = async () => {
    if (!banSeller || !user) return;
    const isPermanent = banDuration === "permanent";
    const expiresAt = isPermanent ? null : new Date(Date.now() + parseInt(banDuration) * 24 * 60 * 60 * 1000).toISOString();

    const { error } = await supabase.from("user_bans").insert({
      user_id: banSeller.user_id,
      banned_by: user.id,
      reason: banReason || null,
      expires_at: expiresAt,
      is_permanent: isPermanent,
    } as any);

    if (error) {
      toast({ title: "Erro ao banir", variant: "destructive" });
    } else {
      toast({ title: `Usuário banido ${isPermanent ? "permanentemente" : `por ${banDuration} dias`}!` });
      fetchBans();
    }
    setBanDialogOpen(false);
  };

  const unbanUser = async (userId: string) => {
    const ban = bans[userId];
    if (!ban) return;
    const { error } = await supabase.from("user_bans").update({ is_active: false } as any).eq("id", ban.id);
    if (error) {
      toast({ title: "Erro ao desbanir", variant: "destructive" });
    } else {
      toast({ title: "Usuário desbanido!" });
      fetchBans();
    }
  };

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


  const getSellerStoreUrl = (seller: SellerWithSub) => {
    return `/empresa/${(seller as any).slug || seller.id}`;
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
    { key: "crm" as const, label: "CRM WhatsApp", icon: MessageCircle },
    { key: "seo" as const, label: "SEO / Sitemaps", icon: Globe },
    { key: "vendas" as const, label: "Página de Vendas", icon: Rocket },
    { key: "config" as const, label: "Configurações", icon: LayoutDashboard },
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
                onClick={() => item.key === "vendas" ? window.open("/anunciar", "_blank") : setTab(item.key)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  tab === item.key
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                }`}
              >
                <item.icon size={18} />
                <span className="flex-1 text-left">{item.label}</span>
                {'badge' in item && (item as any).badge > 0 && (
                  <span className="bg-destructive text-destructive-foreground text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                    {(item as any).badge}
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
              onClick={() => item.key === "vendas" ? window.open("/anunciar", "_blank") : setTab(item.key)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                tab === item.key ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
              }`}
            >
              <item.icon size={14} />
              {item.label}
              {'badge' in item && (item as any).badge > 0 && (
                <span className="bg-destructive text-destructive-foreground text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                  {(item as any).badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 max-w-5xl">

        {/* Search */}
        {(
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
                        {bans[seller.user_id] && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-destructive/20 text-destructive">
                            <Ban size={10} className="inline mr-0.5" />
                            {bans[seller.user_id].is_permanent ? "BANIDO PERMANENTE" : `BANIDO até ${new Date(bans[seller.user_id].expires_at!).toLocaleDateString("pt-BR")}`}
                          </span>
                        )}
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

                      {/* Account Manager & WhatsApp */}
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
                        {seller.phone && (
                          <a
                            href={`https://wa.me/55${seller.phone.replace(/\D/g, '')}?text=${encodeURIComponent(`Olá ${seller.company_name || seller.full_name}! 👋 Seja bem-vindo(a) ao Brokers App! Sou da equipe de suporte e estou aqui para te ajudar com qualquer dúvida sobre a plataforma. Como posso te ajudar?`)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-green-500/10 text-green-600 text-xs font-medium hover:bg-green-500/20 transition-colors border border-green-500/20"
                          >
                            <Phone size={14} /> WhatsApp
                          </a>
                        )}
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
                      {bans[seller.user_id] ? (
                        <button onClick={() => unbanUser(seller.user_id)}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-green-500/10 text-green-600 text-xs font-semibold hover:bg-green-500/20">
                          <ShieldOff size={12} /> Desbanir
                        </button>
                      ) : (
                        <button onClick={() => openBanDialog(seller)}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-900/10 text-red-500 text-xs font-semibold hover:bg-red-900/20">
                          <Ban size={12} /> Banir
                        </button>
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
              {(["basico", "start", "premium", "vip"] as const).map((tier) => {
                const config = PACKAGE_CONFIG[tier as keyof typeof PACKAGE_CONFIG] ?? { name: tier, price: 0, borderColor: "border-border" };
                const count = totalByTier[tier] || 0;
                const revenue = count * (config.price ?? 0);
                return (
                  <div key={tier} className={`rounded-xl border-2 ${config.borderColor} p-4`}>
                    <h4 className="font-display font-bold text-foreground">{config.name}</h4>
                    <p className="text-2xl font-bold text-foreground mt-1">{count} <span className="text-sm font-normal text-muted-foreground">assinantes</span></p>
                    {tier !== "basico" && (
                      <p className="text-sm text-muted-foreground mt-1">
                        Receita mensal: <strong className="text-green-500">R$ {revenue.toFixed(2).replace(".", ",")}</strong>
                      </p>
                    )}
                    {tier === "basico" && (
                      <p className="text-xs text-muted-foreground mt-1">Plano gratuito</p>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="mt-4 p-4 bg-secondary rounded-xl">
              <p className="text-sm text-foreground">
                <strong>Receita mensal total estimada: </strong>
                <span className="text-green-500 font-bold text-lg">
                  R$ {(
                    (["start", "basico", "premium", "vip"] as const).reduce((sum, t) => sum + (totalByTier[t] || 0) * PACKAGE_CONFIG[t].price, 0)
                  ).toFixed(2).replace(".", ",")}
                </span>
              </p>
            </div>
          </div>
        )}




        {tab === "crm" && (
          <AdminCrmTab />
        )}

        {tab === "seo" && (
          <div className="space-y-4">
            <div className="bg-card border border-border rounded-2xl p-5">
              <h3 className="font-display font-bold text-lg text-foreground mb-1 flex items-center gap-2">
                <Globe size={20} className="text-primary" /> Sitemaps & SEO
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Links dos sitemaps para submeter ao Google Search Console. Cada corretor possui um sitemap individual com seus imóveis.
              </p>

              {/* Global Sitemap */}
              <div className="rounded-xl border border-border p-4 mb-4">
                <h4 className="font-bold text-sm text-foreground mb-2">🌐 Sitemap Global</h4>
                <p className="text-xs text-muted-foreground mb-2">Inclui todos os corretores e imóveis ativos da plataforma.</p>
                <div className="flex items-center gap-2 flex-wrap">
                  <code className="text-xs bg-secondary px-3 py-1.5 rounded-lg text-foreground break-all">
                    {`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/global-sitemap`}
                  </code>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/global-sitemap`);
                      toast({ title: "Link copiado!" });
                    }}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold bg-primary text-primary-foreground hover:opacity-90"
                  >
                    <Copy size={12} className="inline mr-1" /> Copiar
                  </button>
                  <a
                    href={`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/global-sitemap`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-lg text-xs font-bold bg-secondary text-foreground hover:bg-secondary/80"
                  >
                    <ExternalLink size={12} className="inline mr-1" /> Abrir
                  </a>
                </div>
              </div>

              {/* Per-seller sitemaps */}
              <h4 className="font-bold text-sm text-foreground mb-3">📋 Sitemaps por Corretor</h4>
              <div className="space-y-2 max-h-[500px] overflow-y-auto">
                {sellers.map((seller) => {
                  const sitemapUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/seller-sitemap?seller_id=${seller.id}`;
                  const fbFeedUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/seller-sitemap?seller_id=${seller.id}&format=facebook`;
                  const name = seller.company_name || seller.full_name;
                  const tierLabel = seller.subscription?.tier || "sem plano";

                  return (
                    <div key={seller.id} className="rounded-xl border border-border p-3 hover:border-primary/30 transition-colors">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <MapPin size={14} className="text-primary" />
                          <span className="text-sm font-bold text-foreground">{name}</span>
                          <span className="text-[10px] bg-secondary px-1.5 py-0.5 rounded-md text-muted-foreground">{tierLabel}</span>
                        </div>
                        {seller.city && <span className="text-[10px] text-muted-foreground">{seller.city}</span>}
                      </div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(sitemapUrl);
                            toast({ title: "Sitemap Google copiado!" });
                          }}
                          className="px-2 py-1 rounded-md text-[10px] font-bold bg-secondary text-foreground hover:bg-secondary/80"
                        >
                          <Copy size={10} className="inline mr-0.5" /> Google
                        </button>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(fbFeedUrl);
                            toast({ title: "Feed Facebook copiado!" });
                          }}
                          className="px-2 py-1 rounded-md text-[10px] font-bold bg-secondary text-foreground hover:bg-secondary/80"
                        >
                          <Copy size={10} className="inline mr-0.5" /> Facebook
                        </button>
                        <a href={sitemapUrl} target="_blank" rel="noopener noreferrer" className="px-2 py-1 rounded-md text-[10px] font-bold bg-secondary text-foreground hover:bg-secondary/80">
                          <ExternalLink size={10} className="inline mr-0.5" /> Abrir
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Google Search Console instructions */}
            <div className="bg-card border border-border rounded-2xl p-5">
              <h4 className="font-bold text-sm text-foreground mb-2">📖 Como submeter ao Google</h4>
              <ol className="text-xs text-muted-foreground space-y-1.5 list-decimal list-inside">
                <li>Acesse o <strong>Google Search Console</strong> e adicione a propriedade do domínio.</li>
                <li>Vá em <strong>Sitemaps</strong> no menu lateral.</li>
                <li>Cole o link do sitemap global ou individual e clique em <strong>Enviar</strong>.</li>
                <li>O Google vai indexar as páginas dos corretores e imóveis automaticamente.</li>
                <li>Para Facebook Ads, use o feed no formato Facebook no <strong>Gerenciador de Catálogos</strong>.</li>
              </ol>
            </div>
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

      {/* Config Tab */}
      {tab === "config" && (
        <div className="space-y-4">
          <div className="bg-card border border-border rounded-2xl p-5">
            <h3 className="font-display font-bold text-lg text-foreground mb-1 flex items-center gap-2">
              <LayoutDashboard size={20} className="text-primary" /> Página Inicial
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Escolha o que os visitantes veem ao acessar a raiz do site.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                {
                  value: "marketplace",
                  title: "🏪 Marketplace",
                  desc: "Mostra todos os imóveis de todos os corretores em uma vitrine única.",
                },
                {
                  value: "single",
                  title: "👤 Corretor Único",
                  desc: "Redireciona para a loja do primeiro corretor cadastrado.",
                },
              ].map((opt) => (
                <button
                  key={opt.value}
                  onClick={async () => {
                    setHomepageMode(opt.value);
                    await supabase
                      .from("platform_settings" as any)
                      .upsert({ key: "homepage_mode", value: opt.value } as any, { onConflict: "key" });
                    toast({ title: "Página inicial atualizada!", description: `Modo: ${opt.title}` });
                  }}
                  className={`text-left p-4 rounded-xl border-2 transition-all ${
                    homepageMode === opt.value
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/30"
                  }`}
                >
                  <p className="font-bold text-sm text-foreground">{opt.title}</p>
                  <p className="text-xs text-muted-foreground mt-1">{opt.desc}</p>
                  {homepageMode === opt.value && (
                    <span className="inline-flex items-center gap-1 mt-2 text-[10px] font-bold text-primary">
                      <Check size={12} /> Ativo
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Ban Dialog */}
      {banDialogOpen && banSeller && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-md mx-4 shadow-xl">
            <div className="flex items-center gap-2 mb-2">
              <Ban size={20} className="text-destructive" />
              <h3 className="font-display font-bold text-lg text-foreground">Banir Usuário</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Banir <strong>{banSeller.company_name || banSeller.full_name}</strong> ({banSeller.email})
            </p>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Duração do banimento</label>
                <div className="grid grid-cols-2 gap-2">
                  {([
                    { value: "7", label: "7 dias" },
                    { value: "30", label: "30 dias" },
                    { value: "90", label: "90 dias" },
                    { value: "permanent", label: "Permanente" },
                  ] as const).map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setBanDuration(opt.value)}
                      className={`px-3 py-2 rounded-xl text-sm font-semibold transition-all ${
                        banDuration === opt.value
                          ? opt.value === "permanent" ? "bg-destructive text-destructive-foreground" : "bg-primary text-primary-foreground"
                          : "bg-secondary text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {opt.value === "permanent" && <Ban size={12} className="inline mr-1" />}
                      {opt.value !== "permanent" && <Clock size={12} className="inline mr-1" />}
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Motivo (opcional)</label>
                <textarea
                  value={banReason}
                  onChange={(e) => setBanReason(e.target.value)}
                  placeholder="Ex: Violação dos termos de uso, conteúdo impróprio..."
                  className="w-full px-4 py-3 rounded-xl bg-secondary text-foreground text-sm border border-border focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none h-24"
                  maxLength={500}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setBanDialogOpen(false)}
                className="px-4 py-2 rounded-xl text-sm font-medium text-muted-foreground hover:bg-secondary transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={confirmBan}
                className="px-4 py-2 rounded-xl bg-destructive text-destructive-foreground text-sm font-bold hover:opacity-90 transition-opacity"
              >
                <Ban size={14} className="inline mr-1" />
                Confirmar Banimento
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
