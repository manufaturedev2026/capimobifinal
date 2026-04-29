import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Shield, Users, Package, DollarSign, Search, Check, X, RefreshCw, ArrowLeft, Crown, Star, Zap, Globe, Plus, Trash2, ExternalLink, Copy, Megaphone, LayoutDashboard, Building2, Rocket, FileText, UserCog, Filter, Camera, Phone, Ban, ShieldOff, Clock, MessageCircle, MapPin, Palette, Bell, Video, Save, Eye, BarChart3, Mail, Send, Database, Brain, Ticket } from "lucide-react";
import { Link } from "react-router-dom";
import { MARKETPLACE_THEMES } from "@/lib/marketplaceThemes";
import { getMarketplaceThemeCssVars } from "@/lib/marketplaceThemeCssVars";
import { useAuth } from "@/hooks/useAuth";
import { useIsAdmin, PACKAGE_CONFIG } from "@/hooks/useSubscription";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

import AdminCrmTab from "@/components/AdminCrmTab";
import AdminPushTab from "@/components/AdminPushTab";
import AdminSiteTab from "@/components/AdminSiteTab";
import AdminAdsCrmTab from "@/components/AdminAdsCrmTab";
import AdminInviteTab from "@/components/AdminInviteTab";
import AdminDashboardTab from "@/components/AdminDashboardTab";
import AdminSmtpTab from "@/components/AdminSmtpTab";
import AdminFunnelTab from "@/components/AdminFunnelTab";
import AdminBroadcastTab from "@/components/AdminBroadcastTab";
import AdminApifyLeadsTab from "@/components/AdminApifyLeadsTab";
import AdminPlansTab from "@/components/AdminPlansTab";
import AdminManagersTab from "@/components/AdminManagersTab";
import AdminValuationPricesTab from "@/components/AdminValuationPricesTab";
import AdminReceivePushTab from "@/components/AdminReceivePushTab";
import AdminAiCostsTab from "@/components/AdminAiCostsTab";
import AdminFoundersTab from "@/components/AdminFoundersTab";
import AdminCouponsTab from "@/components/AdminCouponsTab";
import { LOGIN_HERO_PRESETS, normalizeLoginHeroSetting, resolveLoginHeroImage } from "@/data/loginHeroPresets";
import { invalidateRegistrationsClosed } from "@/hooks/useRegistrationsClosed";

interface SellerWithSub {
  id: string;
  user_id: string;
  full_name: string;
  company_name: string | null;
  email: string;
  phone: string | null;
  seller_type: string;
  seller_category: string | null;
  city: string | null;
  slug: string | null;
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
  const [tab, setTab] = useState<"dashboard" | "clientes" | "managers" | "billing" | "plans" | "coupons" | "founders" | "referrals" | "crm" | "seo" | "vendas" | "config" | "push" | "receivePush" | "site" | "smtp" | "funnel" | "broadcast" | "ads" | "invite" | "apify" | "valuation" | "aiCosts">("dashboard");
  const [managersList, setManagersList] = useState<Array<{ id: string; name: string; phone: string | null; photo_url: string | null }>>([]);
  // Category edit dialog
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [categorySeller, setCategorySeller] = useState<SellerWithSub | null>(null);
  const [categoryValue, setCategoryValue] = useState<string>("corretor");
  const [categorySaving, setCategorySaving] = useState(false);
  const [homepageMode, setHomepageMode] = useState<string>("single");
  const [homepageTheme, setHomepageTheme] = useState<string>("azul");
  const [loginHeroUrl, setLoginHeroUrl] = useState<string>("");
  const [salesVideoUrl, setSalesVideoUrl] = useState<string>("");
  const [salesVideoTitle, setSalesVideoTitle] = useState<string>("");
  const [savingSalesVideo, setSavingSalesVideo] = useState(false);
  const [registrationsClosed, setRegistrationsClosed] = useState<boolean>(false);
  const [savingRegClosed, setSavingRegClosed] = useState(false);
  const [loginHeroUploading, setLoginHeroUploading] = useState(false);
  const loginHeroRef = useRef<HTMLInputElement>(null);
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

  // Delete user dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteSeller, setDeleteSeller] = useState<SellerWithSub | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Manager edit dialog state
  const [managerDialogOpen, setManagerDialogOpen] = useState(false);
  const [managerEditSellerId, setManagerEditSellerId] = useState<string | null>(null);
  const [managerName, setManagerName] = useState("");
  const [managerPhoneVal, setManagerPhoneVal] = useState("");
  const [managerPhotoUrl, setManagerPhotoUrl] = useState("");
  const [managerPhotoUploading, setManagerPhotoUploading] = useState(false);
  const managerPhotoRef = useRef<HTMLInputElement>(null);

  // Plan change dialog state
  const [planDialogOpen, setPlanDialogOpen] = useState(false);
  const [planSeller, setPlanSeller] = useState<SellerWithSub | null>(null);
  const [planTier, setPlanTier] = useState<string>("start");
  const [planDuration, setPlanDuration] = useState<string>("30");
  const [planCustomDays, setPlanCustomDays] = useState<string>("");
  const [planSaving, setPlanSaving] = useState(false);

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
      fetchManagersList();
      // Fetch homepage mode
      supabase.from("platform_settings").select("value").eq("key", "homepage_mode").maybeSingle().then(({ data }) => {
        if (data?.value) setHomepageMode(data.value);
      });
      supabase.from("platform_settings").select("value").eq("key", "homepage_theme").maybeSingle().then(({ data }) => {
        if (data?.value) setHomepageTheme(data.value);
      });
      supabase.from("platform_settings").select("value").eq("key", "login_hero_image").maybeSingle().then(({ data }) => {
        if (data?.value) setLoginHeroUrl(normalizeLoginHeroSetting(data.value));
      });
      supabase.from("platform_settings").select("value").eq("key", "sales_video_url").maybeSingle().then(({ data }) => {
        if (data?.value) setSalesVideoUrl(data.value);
      });
      supabase.from("platform_settings").select("value").eq("key", "sales_video_title").maybeSingle().then(({ data }) => {
        if (data?.value) setSalesVideoTitle(data.value);
      });
      supabase.from("platform_settings").select("value").eq("key", "registrations_closed").maybeSingle().then(({ data }) => {
        setRegistrationsClosed(String((data as any)?.value || "false").toLowerCase() === "true");
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

  const confirmDeleteUser = async () => {
    if (!deleteSeller) return;
    setDeleting(true);
    try {
      const { data, error } = await supabase.functions.invoke("delete-user", {
        body: { user_id: deleteSeller.user_id },
      });
      if (error || !data?.success) throw new Error(data?.error || error?.message || "Erro desconhecido");
      toast({ title: "Usuário excluído!", description: `${deleteSeller.company_name || deleteSeller.full_name} foi removido. Ele poderá se cadastrar novamente.` });
      setSellers(prev => prev.filter(s => s.id !== deleteSeller.id));
    } catch (err: any) {
      toast({ title: "Erro ao excluir", description: err.message, variant: "destructive" });
    }
    setDeleting(false);
    setDeleteDialogOpen(false);
    setDeleteSeller(null);
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

  const fetchManagersList = async () => {
    const { data } = await supabase
      .from("account_managers")
      .select("id, name, phone, photo_url")
      .eq("is_active", true)
      .order("name");
    setManagersList((data as any[]) || []);
  };

  const fetchSellers = async () => {
    setLoading(true);
    const { data: profiles } = await supabase.from("profiles").select("*");
    const { data: subs } = await supabase.from("seller_subscriptions").select("*").eq("is_active", true).order("created_at", { ascending: false });

    const subsMap = new Map<string, any>();
    (subs || []).forEach((s: any) => {
      if (!subsMap.has(s.user_id)) subsMap.set(s.user_id, s);
    });

    const mapped: SellerWithSub[] = (profiles || []).map((p: any) => ({
      id: p.id,
      user_id: p.user_id,
      full_name: p.full_name,
      company_name: p.company_name,
      email: p.email,
      phone: p.phone,
      seller_type: p.seller_type,
      seller_category: p.seller_category || null,
      city: p.city,
      slug: p.slug || null,
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

  const openPlanDialog = (seller: SellerWithSub) => {
    setPlanSeller(seller);
    setPlanTier(seller.subscription?.tier || "start");
    setPlanDuration("30");
    setPlanCustomDays("");
    setPlanDialogOpen(true);
  };

  const confirmPlanChange = async () => {
    if (!planSeller) return;
    setPlanSaving(true);
    const days = planDuration === "custom" ? parseInt(planCustomDays || "0", 10) : parseInt(planDuration, 10);
    if (!days || days < 1) {
      toast({ title: "Informe a quantidade de dias", variant: "destructive" });
      setPlanSaving(false);
      return;
    }
    const tierConfig = PACKAGE_CONFIG[planTier as keyof typeof PACKAGE_CONFIG];
    const maxItems = (tierConfig as any)?.maxItems ?? 5;
    const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();

    await supabase
      .from("seller_subscriptions")
      .update({ is_active: false } as any)
      .eq("seller_id", planSeller.id)
      .eq("is_active", true);

    const { error } = await supabase.from("seller_subscriptions").insert({
      user_id: planSeller.user_id,
      seller_id: planSeller.id,
      tier: planTier,
      max_items: maxItems,
      started_at: new Date().toISOString(),
      expires_at: expiresAt,
      is_active: true,
      payment_method: "admin",
      payment_status: "confirmado",
    } as any);

    setPlanSaving(false);
    if (error) {
      toast({ title: "Erro ao alterar plano", description: error.message, variant: "destructive" });
    } else {
      toast({ title: `Plano atualizado para ${(tierConfig as any)?.name || planTier} por ${days} dias!` });
      setPlanDialogOpen(false);
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
    // Se cliente já tem gerente, mantém. Senão, pré-seleciona o gerente padrão (primeiro ativo da lista).
    if (seller.account_manager) {
      setManagerName(seller.account_manager);
      setManagerPhoneVal(seller.manager_phone || "");
      setManagerPhotoUrl(seller.manager_photo || "");
    } else if (managersList.length > 0) {
      const def = managersList[0];
      setManagerName(def.name);
      setManagerPhoneVal(def.phone || "");
      setManagerPhotoUrl(def.photo_url || "");
    } else {
      setManagerName("");
      setManagerPhoneVal("");
      setManagerPhotoUrl("");
    }
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

  const totalByTier: Record<string, number> = {};
  (Object.keys(PACKAGE_CONFIG) as string[]).forEach((t) => {
    totalByTier[t] = sellers.filter((s) => s.subscription?.tier === t).length;
  });
  totalByTier.sem_pacote = sellers.filter((s) => !s.subscription).length;

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
  const adminTheme = MARKETPLACE_THEMES.find((theme) => theme.id === homepageTheme) || MARKETPLACE_THEMES[0];
  const adminThemeVars = getMarketplaceThemeCssVars(adminTheme);

  const sidebarItems = [
    { key: "dashboard" as const, label: "Dashboard", icon: BarChart3 },
    { key: "clientes" as const, label: "Clientes", icon: Users },
    { key: "managers" as const, label: "Gerentes", icon: UserCog },
    { key: "billing" as const, label: "Faturamento", icon: DollarSign },
    { key: "plans" as const, label: "Planos", icon: Package },
    { key: "coupons" as const, label: "Cupons & Anual", icon: Ticket },
    
    { key: "crm" as const, label: "CRM WhatsApp", icon: MessageCircle },
    { key: "ads" as const, label: "CRM de ADS", icon: Megaphone },
    { key: "push" as const, label: "Push Broadcast", icon: Bell },
    { key: "seo" as const, label: "SEO / Sitemaps", icon: Globe },
    { key: "vendas" as const, label: "Página de Vendas", icon: Rocket },
    { key: "config" as const, label: "Configurações", icon: LayoutDashboard },
    { key: "site" as const, label: "Dados do Site", icon: Globe },
    { key: "smtp" as const, label: "E-mail SMTP", icon: Mail },
    { key: "funnel" as const, label: "Funil de E-mails", icon: Send },
    { key: "broadcast" as const, label: "Broadcast E-mail", icon: Megaphone },
    { key: "apify" as const, label: "Apify Leads", icon: Database },
    { key: "valuation" as const, label: "Avaliação de Imóveis — Preços", icon: DollarSign },
    { key: "invite" as const, label: "Convite", icon: MessageCircle },
    { key: "receivePush" as const, label: "Receber Push", icon: Bell },
    { key: "aiCosts" as const, label: "Custos de IA", icon: Brain },
  ];
  const activeSidebarItem = sidebarItems.find((item) => item.key === tab) || sidebarItems[0];
  const ActiveSidebarIcon = activeSidebarItem.icon;

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ ...adminThemeVars, background: `linear-gradient(180deg, ${adminTheme.darkBase} 0%, ${adminTheme.darkMid} 18%, hsl(var(--background)) 42%)` }}
    >
      {/* Header */}
      <div className="py-4 md:py-5 shrink-0 transition-all duration-300" style={{ background: adminTheme.dashboardGradient }}>
        <div className="container max-w-7xl mx-auto px-4">
          <Link to="/painel" className="inline-flex items-center gap-2 text-white/70 text-sm mb-2 hover:text-white">
            <ArrowLeft size={16} /> Voltar
          </Link>
          <div className="flex items-center gap-3">
            <Shield size={26} className="text-white shrink-0" />
            <div className="min-w-0">
              <h1 className="font-display font-extrabold text-xl md:text-2xl text-white truncate">Painel Administrativo</h1>
              <p className="text-xs text-white/70 mt-1">Tema ativo: {adminTheme.icon} {adminTheme.name}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col md:flex-row min-h-0">
        {/* Sidebar - Desktop */}
        <aside className="hidden md:flex flex-col w-64 shrink-0 border-r border-border bg-card p-4 gap-1">
          {/* Stats mini */}
          <div className="grid grid-cols-2 gap-2 mb-4">
            {[
              { label: "Total", value: sellers.length, icon: Users, color: "text-primary" },
              { label: "Start", value: totalByTier["start"] || 0, icon: Rocket, color: "text-emerald-500" },
              { label: "VIP", value: totalByTier["premium"] || 0, icon: Star, color: "text-amber-500" },
              { label: "Premium", value: totalByTier["vip"] || 0, icon: Crown, color: "text-purple-500" },
              { label: "Empresa", value: (totalByTier["essencial_empresa"] || 0) + (totalByTier["premium_empresa"] || 0) + (totalByTier["prime_empresa"] || 0), icon: Building2, color: "text-rose-500" },
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
        <div className="md:hidden sticky top-0 z-30 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80 shrink-0">
          <div className="p-3 space-y-3">
            <div className="flex items-center gap-2">
              <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <ActiveSidebarIcon size={18} />
              </div>
              <label className="sr-only" htmlFor="admin-mobile-tab">Selecionar seção</label>
              <select
                id="admin-mobile-tab"
                value={tab}
                onChange={(e) => setTab(e.target.value as typeof tab)}
                className="min-w-0 flex-1 h-10 rounded-xl border border-input bg-background px-3 text-sm font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {sidebarItems.map((item) => (
                  <option key={item.key} value={item.key}>{item.label}</option>
                ))}
              </select>
            </div>
            <div className="-mx-3 overflow-x-auto px-3 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <div className="flex w-max gap-2">
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
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-3 md:p-6 w-full min-w-0">


        {tab === "clientes" && (
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
                        {(() => {
                          const cat = seller.seller_category;
                          const catLabel = cat === "imobiliaria" ? "Imobiliária" : cat === "construtora" ? "Construtora" : cat === "corretor" ? "Corretor(a)" : "Sem categoria";
                          const catColor = cat === "imobiliaria" ? "bg-blue-500/15 text-blue-600" : cat === "construtora" ? "bg-orange-500/15 text-orange-600" : cat === "corretor" ? "bg-purple-500/15 text-purple-600" : "bg-muted text-muted-foreground";
                          return (
                            <button
                              onClick={() => { setCategorySeller(seller); setCategoryValue(cat || "corretor"); setCategoryDialogOpen(true); }}
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${catColor} hover:opacity-80 transition`}
                              title="Clique para alterar a categoria"
                            >
                              {catLabel}
                            </button>
                          );
                        })()}
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
                            <img loading="lazy" decoding="async" src={seller.manager_photo} alt="" className="w-5 h-5 rounded-full object-cover" />
                          ) : (
                            <UserCog size={14} className="text-muted-foreground" />
                          )}
                          {seller.account_manager || "Definir gerente"}
                        </button>
                        {seller.phone && (
                          <a
                            href={`https://wa.me/55${seller.phone.replace(/\D/g, '')}?text=${encodeURIComponent(`Olá ${seller.company_name || seller.full_name}! 👋 Seja bem-vindo(a) ao Capimobi! Sou da equipe de suporte e estou aqui para te ajudar com qualquer dúvida sobre a plataforma. Como posso te ajudar?`)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-green-500/10 text-green-600 text-xs font-medium hover:bg-green-500/20 transition-colors border border-green-500/20"
                          >
                            <Phone size={14} /> WhatsApp
                          </a>
                        )}
                      </div>
                    </div>

                    <div className="flex w-full flex-col gap-1.5 sm:w-auto sm:flex-row sm:flex-wrap sm:justify-end">
                      <Link
                        to={getSellerStoreUrl(seller)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-1 px-3 py-2 sm:py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-semibold hover:bg-primary/20"
                      >
                        <Eye size={12} /> Ver Loja
                      </Link>
                       {sub?.payment_status === "pendente" && (
                        <button onClick={() => approvePayment(sub.id)}
                          className="flex items-center justify-center gap-1 px-3 py-2 sm:py-1.5 rounded-lg bg-green-500/10 text-green-600 text-xs font-semibold hover:bg-green-500/20">
                          <Check size={12} /> Aprovar
                        </button>
                      )}
                      <button onClick={() => openPlanDialog(seller)}
                        className="flex items-center justify-center gap-1 px-3 py-2 sm:py-1.5 rounded-lg bg-amber-500/10 text-amber-600 text-xs font-semibold hover:bg-amber-500/20">
                        <Crown size={12} /> Plano
                      </button>
                       {sub && (
                        <>
                          <button onClick={() => renewSubscription(sub.id)}
                            className="flex items-center justify-center gap-1 px-3 py-2 sm:py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-semibold hover:bg-primary/20">
                            <RefreshCw size={12} /> Renovar
                          </button>
                          <button onClick={() => cancelSubscription(sub.id)}
                            className="flex items-center justify-center gap-1 px-3 py-2 sm:py-1.5 rounded-lg bg-destructive/10 text-destructive text-xs font-semibold hover:bg-destructive/20">
                            <X size={12} /> Cancelar
                          </button>
                        </>
                      )}
                      {bans[seller.user_id] ? (
                        <button onClick={() => unbanUser(seller.user_id)}
                          className="flex items-center justify-center gap-1 px-3 py-2 sm:py-1.5 rounded-lg bg-green-500/10 text-green-600 text-xs font-semibold hover:bg-green-500/20">
                          <ShieldOff size={12} /> Desbanir
                        </button>
                      ) : (
                        <button onClick={() => openBanDialog(seller)}
                          className="flex items-center justify-center gap-1 px-3 py-2 sm:py-1.5 rounded-lg bg-destructive/10 text-destructive text-xs font-semibold hover:bg-destructive/20">
                          <Ban size={12} /> Banir
                        </button>
                      )}
                      <button onClick={() => { setDeleteSeller(seller); setDeleteDialogOpen(true); }}
                        className="flex items-center justify-center gap-1 px-3 py-2 sm:py-1.5 rounded-lg bg-destructive/10 text-destructive text-xs font-semibold hover:bg-destructive/20">
                        <Trash2 size={12} /> Excluir
                      </button>
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

        {tab === "billing" && (() => {
          const BILLING_ORDER = ["basico", "start", "premium", "vip", "essencial_empresa", "premium_empresa", "prime_empresa"] as const;
          const BILLING_LABEL_OVERRIDES: Record<string, string> = { prime_empresa: "Black Empresa" };
          const orderedTiers = BILLING_ORDER.filter((t) => (PACKAGE_CONFIG as any)[t]);
          return (
          <div className="bg-card border border-border rounded-2xl p-6">
            <h3 className="font-display font-bold text-lg text-foreground mb-4">Resumo de Faturamento</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {orderedTiers.map((tier) => {
                const config = PACKAGE_CONFIG[tier as keyof typeof PACKAGE_CONFIG];
                const count = totalByTier[tier] || 0;
                const revenue = count * (config.price ?? 0);
                return (
                  <div key={tier} className={`rounded-xl border-2 ${config.borderColor} p-4`}>
                    <h4 className="font-display font-bold text-foreground">{BILLING_LABEL_OVERRIDES[tier] || config.name}</h4>
                    <p className="text-2xl font-bold text-foreground mt-1">{count} <span className="text-sm font-normal text-muted-foreground">assinantes</span></p>
                    {config.price > 0 ? (
                      <p className="text-sm text-muted-foreground mt-1">
                        Receita mensal: <strong className="text-green-500">R$ {revenue.toFixed(2).replace(".", ",")}</strong>
                      </p>
                    ) : (
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
                    orderedTiers.reduce((sum, t) => sum + (totalByTier[t] || 0) * PACKAGE_CONFIG[t as keyof typeof PACKAGE_CONFIG].price, 0)
                  ).toFixed(2).replace(".", ",")}
                </span>
              </p>
            </div>
          </div>
          );
        })()}

        {tab === "plans" && (
          <AdminPlansTab />
        )}

        {tab === "coupons" && (
          <AdminCouponsTab />
        )}


        {tab === "crm" && (
          <AdminCrmTab />
        )}

        {tab === "push" && user && (
          <AdminPushTab userId={user.id} />
        )}

        {tab === "receivePush" && user && (
          <AdminReceivePushTab userId={user.id} />
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

              {/* Facebook / Meta Catalog Feed */}
              <div className="rounded-xl border border-border p-4 mb-4 bg-gradient-to-br from-[#1877F2]/5 to-transparent">
                <h4 className="font-bold text-sm text-foreground mb-2">📘 Catálogo Facebook / Instagram (Meta)</h4>
                <p className="text-xs text-muted-foreground mb-2">
                  Feed RSS 2.0 no padrão Meta Catalog. Cole esta URL em <strong>Meta Business → Comércio → Catálogos → Fonte de Dados → Feed Programado</strong> para alimentar Anúncios Dinâmicos no Facebook e Instagram.
                </p>
                <div className="flex items-center gap-2 flex-wrap">
                  <code className="text-xs bg-secondary px-3 py-1.5 rounded-lg text-foreground break-all">
                    {`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/facebook-catalog-feed`}
                  </code>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/facebook-catalog-feed`);
                      toast({ title: "Link copiado!" });
                    }}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold bg-primary text-primary-foreground hover:opacity-90"
                  >
                    <Copy size={12} className="inline mr-1" /> Copiar
                  </button>
                  <a
                    href={`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/facebook-catalog-feed`}
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
              <div className="relative mb-3">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar corretor por nome, empresa ou cidade..."
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-secondary text-foreground text-sm border border-border focus:ring-2 focus:ring-ring focus:outline-none"
                />
              </div>
              <div className="space-y-2 max-h-[500px] overflow-y-auto">
                {sellers.filter((s) => {
                  // Apenas corretores com slug entram no sitemap global
                  if (!s.slug) return false;
                  if (!search.trim()) return true;
                  const q = search.toLowerCase();
                  return (s.full_name?.toLowerCase().includes(q) || s.company_name?.toLowerCase().includes(q) || s.email?.toLowerCase().includes(q) || s.city?.toLowerCase().includes(q));
                }).map((seller) => {
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

      {/* Dashboard Tab */}
      {tab === "dashboard" && (
        <AdminDashboardTab />
      )}

      {/* Invite Tab */}
      {tab === "invite" && (
        <AdminInviteTab />
      )}

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
            <DialogTitle className="flex items-center gap-2"><UserCog size={18} /> Atribuir Gerente</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            {managersList.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-sm text-muted-foreground mb-3">Nenhum gerente cadastrado.</p>
                <button
                  onClick={() => { setManagerDialogOpen(false); setTab("managers"); }}
                  className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold"
                >
                  Cadastrar gerentes
                </button>
              </div>
            ) : (
              <>
                <p className="text-xs text-muted-foreground">Selecione um gerente cadastrado:</p>
                <div className="space-y-2 max-h-72 overflow-y-auto">
                  <button
                    onClick={() => { setManagerName(""); setManagerPhoneVal(""); setManagerPhotoUrl(""); }}
                    className={`w-full flex items-center gap-3 p-2 rounded-lg border-2 transition ${
                      !managerName ? "border-primary bg-primary/5" : "border-input hover:border-primary/50"
                    }`}
                  >
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                      <X size={16} className="text-muted-foreground" />
                    </div>
                    <span className="text-sm font-medium text-foreground">Sem gerente</span>
                  </button>
                  {managersList.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => {
                        setManagerName(m.name);
                        setManagerPhoneVal(m.phone || "");
                        setManagerPhotoUrl(m.photo_url || "");
                      }}
                      className={`w-full flex items-center gap-3 p-2 rounded-lg border-2 transition ${
                        managerName === m.name ? "border-primary bg-primary/5" : "border-input hover:border-primary/50"
                      }`}
                    >
                      {m.photo_url ? (
                        <img loading="lazy" decoding="async" src={m.photo_url} alt="" className="w-10 h-10 rounded-full object-cover" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                          <UserCog size={16} className="text-muted-foreground" />
                        </div>
                      )}
                      <div className="flex-1 text-left">
                        <p className="text-sm font-semibold text-foreground">{m.name}</p>
                        {m.phone && <p className="text-[10px] text-muted-foreground">{m.phone}</p>}
                      </div>
                      {managerName === m.name && <Check size={16} className="text-primary" />}
                    </button>
                  ))}
                </div>
                <button
                  onClick={saveManager}
                  className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/90 transition-colors"
                >
                  Salvar
                </button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Managers Tab */}
      {tab === "managers" && (
        <AdminManagersTab />
      )}

      {/* Vendas Tab */}
      {tab === "vendas" && (
        <div className="space-y-4">
          <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-display font-bold text-lg text-foreground flex items-center gap-2">
                  <Rocket size={20} className="text-primary" /> Página de Vendas
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Configure o vídeo e visualize a página de vendas (/anunciar).
                </p>
              </div>
              <button
                onClick={() => window.open("/anunciar", "_blank")}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/90 transition-colors"
              >
                <Eye size={16} /> Visualizar Página
              </button>
            </div>
          </div>

          <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Video size={18} className="text-primary" />
              <h3 className="font-display font-bold text-foreground">Vídeo da Página de Vendas</h3>
            </div>
            <p className="text-xs text-muted-foreground">
              Cole o link de um vídeo do YouTube. Ele aparecerá na página de vendas (/anunciar) logo após a seção de funcionalidades.
            </p>

            <div className="space-y-3">
              <input
                value={salesVideoUrl}
                onChange={(e) => setSalesVideoUrl(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-input bg-background text-foreground text-sm focus:ring-2 focus:ring-ring focus:outline-none"
                placeholder="https://www.youtube.com/watch?v=..."
              />
              <input
                value={salesVideoTitle}
                onChange={(e) => setSalesVideoTitle(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-input bg-background text-foreground text-sm focus:ring-2 focus:ring-ring focus:outline-none"
                placeholder="Título do vídeo (ex: Conheça a Plataforma)"
                maxLength={100}
              />

              {salesVideoUrl && (() => {
                const match = salesVideoUrl.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([a-zA-Z0-9_-]{11})/);
                const vid = match ? match[1] : null;
                return vid ? (
                  <div className="aspect-video rounded-xl overflow-hidden border border-border">
                    <iframe
                      src={`https://www.youtube.com/embed/${vid}`}
                      title="Preview"
                      allow="encrypted-media"
                      allowFullScreen
                      className="w-full h-full"
                    />
                  </div>
                ) : (
                  <p className="text-xs text-destructive">Link inválido — use um link do YouTube</p>
                );
              })()}

              <button
                onClick={async () => {
                  setSavingSalesVideo(true);
                  await supabase.from("platform_settings" as any).upsert({ key: "sales_video_url", value: salesVideoUrl } as any, { onConflict: "key" });
                  await supabase.from("platform_settings" as any).upsert({ key: "sales_video_title", value: salesVideoTitle } as any, { onConflict: "key" });
                  toast({ title: "Vídeo da página de vendas salvo!" });
                  setSavingSalesVideo(false);
                }}
                disabled={savingSalesVideo}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {savingSalesVideo ? <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" /> : <Save size={16} />}
                {savingSalesVideo ? "Salvando..." : "Salvar Vídeo"}
              </button>
            </div>
          </div>
        </div>
      )}

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
                  title: "👤 Loja Principal",
                  desc: "Redireciona a raiz do site para a loja do primeiro corretor cadastrado.",
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

          {/* Cadastros Fechados toggle */}
          <div className="bg-card border border-border rounded-2xl p-5">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="flex-1 min-w-[240px]">
                <h3 className="font-display font-bold text-lg text-foreground mb-1 flex items-center gap-2">
                  <Shield size={20} className="text-primary" /> Cadastros Fechados
                </h3>
                <p className="text-sm text-muted-foreground">
                  Quando ativado, <strong>nenhum novo corretor poderá se cadastrar</strong> no site.
                  As páginas <code className="text-xs bg-secondary px-1.5 py-0.5 rounded">/anunciar</code>,
                  {" "}<code className="text-xs bg-secondary px-1.5 py-0.5 rounded">/login</code> (aba cadastro)
                  e <code className="text-xs bg-secondary px-1.5 py-0.5 rounded">/auth</code> mostrarão um aviso.
                  Os corretores já cadastrados continuam funcionando normalmente.
                </p>
              </div>
              <button
                onClick={async () => {
                  setSavingRegClosed(true);
                  const next = !registrationsClosed;
                  setRegistrationsClosed(next);
                  await supabase
                    .from("platform_settings" as any)
                    .upsert({ key: "registrations_closed", value: next ? "true" : "false" } as any, { onConflict: "key" });
                  invalidateRegistrationsClosed();
                  toast({
                    title: next ? "Cadastros fechados" : "Cadastros reabertos",
                    description: next
                      ? "Novos corretores não poderão se cadastrar."
                      : "Novos corretores podem se cadastrar normalmente.",
                  });
                  setSavingRegClosed(false);
                }}
                disabled={savingRegClosed}
                className={`relative inline-flex h-9 w-16 items-center rounded-full transition-colors disabled:opacity-50 ${
                  registrationsClosed ? "bg-primary" : "bg-secondary border border-border"
                }`}
                aria-pressed={registrationsClosed}
              >
                <span
                  className={`inline-block h-7 w-7 transform rounded-full bg-background shadow transition-transform ${
                    registrationsClosed ? "translate-x-8" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
            {registrationsClosed && (
              <div className="mt-4 p-3 rounded-xl bg-primary/5 border border-primary/20 text-xs text-foreground/80 flex items-start gap-2">
                <Check size={14} className="text-primary mt-0.5 shrink-0" />
                <span>
                  Cadastros fechados. Apenas os corretores já existentes têm acesso. Reative quando quiser permitir novos cadastros.
                </span>
              </div>
            )}
          </div>

          {/* Theme Picker */}
          <div className="bg-card border border-border rounded-2xl p-5">
            <h3 className="font-display font-bold text-lg text-foreground mb-1 flex items-center gap-2">
              <Palette size={20} className="text-primary" /> Tema da Página Inicial
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Escolha o tema visual do Marketplace, login e painel dos corretores.
            </p>

            <div
              className="rounded-2xl overflow-hidden border mb-4 transition-all duration-300"
              style={{ borderColor: adminTheme.border, background: adminTheme.cardBg }}
            >
              <div className="p-4" style={{ background: adminTheme.dashboardGradient }}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-white/70">Preview ao vivo</p>
                    <h4 className="font-display font-black text-xl text-white mt-1">
                      {adminTheme.icon} {adminTheme.name}
                    </h4>
                    <p className="text-xs text-white/80 mt-1">Agora a troca aparece aqui no admin assim que você clicar.</p>
                  </div>
                  <div className="flex gap-2">
                    <div className="w-7 h-7 rounded-full border border-white/25" style={{ background: adminTheme.primary }} title="Principal" />
                    <div className="w-7 h-7 rounded-full border border-white/25" style={{ background: adminTheme.promoAccent || adminTheme.primary }} title="Secundária" />
                    <div className="w-7 h-7 rounded-full border border-white/25" style={{ background: adminTheme.promoExploreColor || adminTheme.textMuted }} title="Terceira" />
                    {adminTheme.promoExtra && (
                      <div className="w-7 h-7 rounded-full border border-white/25" style={{ background: adminTheme.promoExtra }} title="Quarta" />
                    )}
                  </div>
                </div>
              </div>
              <div className={`grid grid-cols-1 ${adminTheme.promoExtra ? 'md:grid-cols-4' : 'md:grid-cols-3'} gap-3 p-4`} style={{ background: adminTheme.darkBase }}>
                <div className="rounded-xl p-3" style={{ background: adminTheme.cardBg, border: `1px solid ${adminTheme.border}` }}>
                  <div className="w-9 h-9 rounded-xl mb-2" style={{ background: adminTheme.primary }} />
                  <p className="text-xs font-bold" style={{ color: adminTheme.text }}>Cor principal</p>
                  <p className="text-[11px] mt-1" style={{ color: adminTheme.textMuted }}>Botões e destaques</p>
                </div>
                <div className="rounded-xl p-3" style={{ background: adminTheme.cardBg, border: `1px solid ${adminTheme.border}` }}>
                  <div className="w-9 h-9 rounded-xl mb-2" style={{ background: adminTheme.promoAccent || adminTheme.primary }} />
                  <p className="text-xs font-bold" style={{ color: adminTheme.text }}>Cor secundária</p>
                  <p className="text-[11px] mt-1" style={{ color: adminTheme.textMuted }}>Faixas e promoções</p>
                </div>
                <div className="rounded-xl p-3" style={{ background: adminTheme.cardBg, border: `1px solid ${adminTheme.border}` }}>
                  <div className="w-9 h-9 rounded-xl mb-2" style={{ background: adminTheme.promoExploreColor || adminTheme.textMuted }} />
                  <p className="text-xs font-bold" style={{ color: adminTheme.text }}>Terceira cor</p>
                  <p className="text-[11px] mt-1" style={{ color: adminTheme.textMuted }}>Chamada de ação</p>
                </div>
                {adminTheme.promoExtra && (
                  <div className="rounded-xl p-3" style={{ background: adminTheme.cardBg, border: `1px solid ${adminTheme.border}` }}>
                    <div className="w-9 h-9 rounded-xl mb-2" style={{ background: adminTheme.promoExtra }} />
                    <p className="text-xs font-bold" style={{ color: adminTheme.text }}>Quarta cor</p>
                    <p className="text-[11px] mt-1" style={{ color: adminTheme.textMuted }}>Detalhe extra</p>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {MARKETPLACE_THEMES.map((t) => (
                <button
                  key={t.id}
                  onClick={async () => {
                    setHomepageTheme(t.id);
                    localStorage.setItem("marketplace_theme", t.id);
                    await supabase
                      .from("platform_settings" as any)
                      .upsert({ key: "homepage_theme", value: t.id } as any, { onConflict: "key" });
                    toast({ title: "Tema atualizado!", description: `Tema: ${t.icon} ${t.name}` });
                  }}
                  className={`text-left rounded-xl border-2 overflow-hidden transition-all ${
                    homepageTheme === t.id
                      ? "border-primary ring-2 ring-primary/30"
                      : "border-border hover:border-primary/30"
                  }`}
                >
                  <div className="h-16 w-full relative" style={{ background: t.dashboardGradient }}>
                    <div className="absolute bottom-2 left-3 flex items-center gap-1">
                      <div className="w-3 h-3 rounded-full" style={{ background: t.primary }} />
                      <div className="w-3 h-3 rounded-full" style={{ background: t.promoAccent || t.primary }} />
                      <div className="w-3 h-3 rounded-full" style={{ background: t.promoExploreColor || t.primary }} />
                      {t.promoExtra && <div className="w-3 h-3 rounded-full" style={{ background: t.promoExtra }} />}
                    </div>
                  </div>
                  <div className="p-3" style={{ background: t.darkBase }}>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold" style={{ color: t.text }}>
                        {t.icon} {t.name}
                      </span>
                      {homepageTheme === t.id && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-primary">
                          <Check size={12} /> Ativo
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
          {/* Login Hero Image */}
          <div className="bg-card border border-border rounded-2xl p-5">
            <h3 className="font-display font-bold text-lg text-foreground mb-1 flex items-center gap-2">
              <Camera size={20} className="text-primary" /> Foto da Tela de Login
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Escolha uma das opções prontas ou envie sua própria imagem.
            </p>

            {/* Preset gallery */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 mb-4">
              {LOGIN_HERO_PRESETS.map((preset) => {
                
                return (
                  <button
                    key={preset.id}
                    onClick={async () => {
                      setLoginHeroUrl(preset.id);
                      await supabase.from("platform_settings" as any).upsert({ key: "login_hero_image", value: preset.id } as any, { onConflict: "key" });
                      toast({ title: `Imagem "${preset.label}" aplicada!` });
                    }}
                    className={`relative rounded-xl overflow-hidden border-2 transition-all aspect-video group ${loginHeroUrl === preset.id ? "border-primary ring-2 ring-primary/40" : "border-border hover:border-primary/50"}`}
                  >
                    <img src={preset.src} alt={preset.label} className="w-full h-full object-cover" loading="lazy" />
                    {loginHeroUrl === preset.id && (
                      <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                        <Check size={20} className="text-white drop-shadow-lg" />
                      </div>
                    )}
                    <span className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[10px] px-1 py-0.5 text-center truncate opacity-0 group-hover:opacity-100 transition-opacity">
                      {preset.label}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Current + upload */}
            <div className="flex flex-col sm:flex-row items-start gap-4">
              {loginHeroUrl && (
                <div className="relative w-40 h-28 rounded-xl overflow-hidden border border-border shrink-0">
                  <img loading="lazy" decoding="async" src={resolveLoginHeroImage(loginHeroUrl) || ""} alt="Login hero" className="w-full h-full object-cover" />
                  <button
                    onClick={async () => {
                      setLoginHeroUrl("");
                      await supabase.from("platform_settings" as any).upsert({ key: "login_hero_image", value: "" } as any, { onConflict: "key" });
                      toast({ title: "Imagem removida" });
                    }}
                    className="absolute top-1 right-1 p-1 rounded-full bg-black/60 text-white hover:bg-destructive transition-colors"
                  >
                    <X size={14} />
                  </button>
                </div>
              )}
              <div className="flex-1 space-y-2">
                <input type="file" ref={loginHeroRef} accept="image/*" className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    setLoginHeroUploading(true);
                    try {
                      const ext = file.name.split(".").pop() || "jpg";
                      const path = `login-hero/hero-${Date.now()}.${ext}`;
                      const { error: upErr } = await supabase.storage.from("seller-assets").upload(path, file, { upsert: true });
                      if (upErr) throw upErr;
                      const { data: urlData } = supabase.storage.from("seller-assets").getPublicUrl(path);
                      setLoginHeroUrl(urlData.publicUrl);
                      await supabase.from("platform_settings" as any).upsert({ key: "login_hero_image", value: urlData.publicUrl } as any, { onConflict: "key" });
                      toast({ title: "Imagem atualizada!" });
                    } catch (err: any) {
                      toast({ title: "Erro", description: err.message, variant: "destructive" });
                    }
                    setLoginHeroUploading(false);
                  }}
                />
                <button onClick={() => loginHeroRef.current?.click()} disabled={loginHeroUploading}
                  className="px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:opacity-90 disabled:opacity-50 flex items-center gap-2">
                  {loginHeroUploading ? <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" /> : <Camera size={16} />}
                  Enviar Imagem Própria
                </button>
                <p className="text-xs text-muted-foreground">Ou envie uma imagem personalizada (1920×1080px)</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Site Tab */}
      {tab === "site" && (
        <AdminSiteTab />
      )}

      {/* SMTP Tab */}
      {tab === "smtp" && (
        <AdminSmtpTab />
      )}

      {/* Funnel Tab */}
      {tab === "funnel" && (
        <div className="px-4 lg:px-8 py-6">
          <AdminFunnelTab />
        </div>
      )}

      {/* Broadcast Tab */}
      {tab === "broadcast" && (
        <div className="px-4 lg:px-8 py-6">
          <AdminBroadcastTab />
        </div>
      )}

      {/* Apify Leads Tab */}
      {tab === "apify" && (
        <div className="px-4 lg:px-8 py-6">
          <AdminApifyLeadsTab />
        </div>
      )}

      {/* Valuation Prices Tab */}
      {tab === "valuation" && (
        <div className="px-4 lg:px-8 py-6">
          <AdminValuationPricesTab />
        </div>
      )}

      {/* ADS CRM Tab */}
      {tab === "ads" && (
        <div className="px-4 lg:px-8 py-6">
          <AdminAdsCrmTab />
        </div>
      )}

      {/* AI Costs Tab */}
      {tab === "aiCosts" && (
        <div className="px-4 lg:px-8 py-6">
          <AdminAiCostsTab />
        </div>
      )}

      {/* Founders Tab */}
      {tab === "founders" && (
        <div className="px-4 lg:px-8 py-6">
          <AdminFoundersTab />
        </div>
      )}

        </main>
      </div>

      {/* Plan Change Dialog */}
      <Dialog open={planDialogOpen} onOpenChange={setPlanDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Crown size={18} className="text-amber-500" /> Alterar Plano
            </DialogTitle>
          </DialogHeader>
          {planSeller && (
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">{planSeller.company_name || planSeller.full_name}</span>
                <br />
                <span className="text-xs">{planSeller.email}</span>
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground mb-2 block">Plano</label>
                <select
                  value={planTier}
                  onChange={(e) => setPlanTier(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm text-foreground"
                >
                  {(Object.keys(PACKAGE_CONFIG) as (keyof typeof PACKAGE_CONFIG)[]).map((t) => (
                    <option key={t} value={t}>
                      {(PACKAGE_CONFIG[t] as any).name} — até {(PACKAGE_CONFIG[t] as any).maxItems} anúncios
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground mb-2 block">Duração</label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { v: "7", l: "7 dias" },
                    { v: "30", l: "30 dias" },
                    { v: "90", l: "90 dias" },
                    { v: "365", l: "1 ano" },
                  ].map((opt) => (
                    <button
                      key={opt.v}
                      type="button"
                      onClick={() => setPlanDuration(opt.v)}
                      className={`px-2 py-2 rounded-lg text-xs font-semibold border transition-colors ${
                        planDuration === opt.v
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-background text-foreground border-input hover:bg-secondary"
                      }`}
                    >
                      {opt.l}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => setPlanDuration("custom")}
                  className={`mt-2 w-full px-3 py-2 rounded-lg text-xs font-semibold border transition-colors ${
                    planDuration === "custom"
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background text-foreground border-input hover:bg-secondary"
                  }`}
                >
                  Personalizado
                </button>
                {planDuration === "custom" && (
                  <input
                    type="number"
                    min={1}
                    placeholder="Quantidade de dias"
                    value={planCustomDays}
                    onChange={(e) => setPlanCustomDays(e.target.value)}
                    className="mt-2 w-full px-3 py-2 rounded-lg border border-input bg-background text-sm text-foreground"
                  />
                )}
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setPlanDialogOpen(false)}
                  className="flex-1 px-3 py-2 rounded-lg border border-input bg-background text-sm font-semibold text-foreground hover:bg-secondary"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmPlanChange}
                  disabled={planSaving}
                  className="flex-1 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-60"
                >
                  {planSaving ? "Salvando..." : "Confirmar"}
                </button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Category Dialog */}
      <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Alterar categoria do cliente</DialogTitle>
          </DialogHeader>
          {categorySeller && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                <strong>{categorySeller.company_name || categorySeller.full_name}</strong>
              </p>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Categoria</label>
                <div className="grid grid-cols-1 gap-2">
                  {[
                    { value: "corretor", label: "Corretor(a)" },
                    { value: "imobiliaria", label: "Imobiliária" },
                    { value: "construtora", label: "Construtora" },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setCategoryValue(opt.value)}
                      className={`flex items-center justify-between px-4 py-3 rounded-lg border-2 transition ${
                        categoryValue === opt.value
                          ? "border-primary bg-primary/5"
                          : "border-input hover:border-primary/50"
                      }`}
                    >
                      <span className="font-medium text-foreground">{opt.label}</span>
                      {categoryValue === opt.value && <Check size={16} className="text-primary" />}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <button
                  onClick={() => setCategoryDialogOpen(false)}
                  className="px-4 py-2 rounded-lg border border-input bg-background text-sm font-medium hover:bg-secondary"
                >
                  Cancelar
                </button>
                <button
                  disabled={categorySaving}
                  onClick={async () => {
                    if (!categorySeller) return;
                    setCategorySaving(true);
                    const { error } = await supabase
                      .from("profiles")
                      .update({ seller_category: categoryValue as any })
                      .eq("id", categorySeller.id);
                    setCategorySaving(false);
                    if (error) {
                      toast({ title: "Erro ao atualizar", description: error.message, variant: "destructive" });
                    } else {
                      toast({ title: "Categoria atualizada!" });
                      setSellers((prev) => prev.map((s) => s.id === categorySeller.id ? { ...s, seller_category: categoryValue } : s));
                      setCategoryDialogOpen(false);
                    }
                  }}
                  className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 disabled:opacity-50"
                >
                  {categorySaving ? "Salvando..." : "Salvar"}
                </button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

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

      {/* Delete User Dialog */}
      {deleteDialogOpen && deleteSeller && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-md mx-4 shadow-xl">
            <div className="flex items-center gap-2 mb-2">
              <Trash2 size={20} className="text-destructive" />
              <h3 className="font-display font-bold text-lg text-foreground">Excluir Usuário</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-2">
              Tem certeza que deseja excluir permanentemente <strong className="text-foreground">{deleteSeller.company_name || deleteSeller.full_name}</strong>?
            </p>
            <p className="text-xs text-muted-foreground mb-1">• E-mail: {deleteSeller.email}</p>
            <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-3 mt-3 mb-4">
              <p className="text-xs text-destructive font-semibold">⚠️ Esta ação é irreversível!</p>
              <p className="text-xs text-muted-foreground mt-1">
                Todos os dados do usuário serão removidos (perfil, imóveis, assinatura, analytics, contratos). O usuário poderá se cadastrar novamente com o mesmo e-mail.
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => { setDeleteDialogOpen(false); setDeleteSeller(null); }}
                className="px-4 py-2 rounded-xl text-sm font-medium text-muted-foreground hover:bg-secondary transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={confirmDeleteUser}
                disabled={deleting}
                className="px-4 py-2 rounded-xl bg-destructive text-destructive-foreground text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2"
              >
                {deleting ? <div className="w-4 h-4 border-2 border-destructive-foreground/30 border-t-destructive-foreground rounded-full animate-spin" /> : <Trash2 size={14} />}
                Excluir Permanentemente
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
