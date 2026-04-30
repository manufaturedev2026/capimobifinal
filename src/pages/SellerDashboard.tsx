import { useState, useEffect, useRef, useCallback } from "react";
import { getStoreUrl, getStoreFullUrl } from "@/lib/storeUrl";
import { getMarketplaceTheme } from "@/lib/marketplaceThemes";
import { getMarketplaceThemeCssVars, getStoreThemeCssVars } from "@/lib/marketplaceThemeCssVars";
import { getStoreTheme } from "@/components/StoreThemePicker";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Package, Eye, Plus, Settings, Edit, Trash2, Copy, ToggleLeft, ToggleRight, Search, Image, LogOut, BarChart3, Star, Crown, Zap, AlertTriangle, Shield, MessageCircle, Home, UserCircle, Headphones, Globe, ExternalLink, CheckCircle2, ClipboardCopy, Lock, Clapperboard, Menu, X, Building2, Users, BadgeCheck, GripVertical, ChevronRight, ChevronDown, Sparkles, FileText, Magnet, Camera, Bell, Download, Calculator, Palette, Handshake, Megaphone, Calendar as CalendarIcon, Ruler, Coins } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import SoldCountdown from "@/components/SoldCountdown";
import StoreEffectsPicker from "@/components/StoreEffectsPicker";
import BrokerAnalytics from "@/components/BrokerAnalytics";

import SellerCrmTab from "@/components/SellerCrmTab";
import SellerGalleryTab from "@/components/SellerGalleryTab";
import RentalManagementTab from "@/components/RentalManagementTab";
import ContractsTab from "@/components/ContractsTab";
import CaptacaoOnlineTab from "@/components/CaptacaoOnlineTab";
import StoriesTab from "@/components/StoriesTab";
import NotificationsTab from "@/components/NotificationsTab";
import ProfitCalculatorTab from "@/components/ProfitCalculatorTab";
import PropertyMeterTab from "@/components/PropertyMeterTab";
import PartnerBrokerTab from "@/components/PartnerBrokerTab";
import PropertyPartnershipsTab from "@/components/PropertyPartnershipsTab";
import SellerAdsTab from "@/components/SellerAdsTab";
import PartnerAgencyTab from "@/components/PartnerAgencyTab";
import { Suspense } from "react";
import SellerCustomization from "@/pages/SellerCustomization";
import SellerProfile from "@/pages/SellerProfile";
import { getTagStyle, getTagLabel } from "@/data/products";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { useSubscription, useIsAdmin, PACKAGE_CONFIG } from "@/hooks/useSubscription";
import PackageBadge from "@/components/PackageBadge";
import { useSellerAnalytics } from "@/hooks/useSellerAnalytics";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, CartesianGrid } from "recharts";
import gabrielImg from "@/assets/gabriel-gerente.jpg";
import PwaInstallGuide from "@/components/PwaInstallGuide";
import { usePwaInstall } from "@/hooks/usePwaInstall";
import OnboardingTour from "@/components/OnboardingTour";
import { usePushSubscription } from "@/hooks/usePushSubscription";
import WelcomePushPopup from "@/components/WelcomePushPopup";
import AiHelpChat from "@/components/AiHelpChat";
import AiCreditsCard from "@/components/AiCreditsCard";
import { useAiCredits } from "@/hooks/useAiCredits";
import PlanLimitsCard from "@/components/PlanLimitsCard";
import PlanLimitWarningPopup from "@/components/PlanLimitWarningPopup";

type SellerItem = {
  id: string;
  title: string;
  category: string;
  price: number | null;
  status: string;
  photos: string[] | null;
  tags: string[] | null;
  views_count: number | null;
  city: string | null;
  created_at: string;
  seller_type: string;
  sold_at: string | null;
};

type DashboardTab = "overview" | "items" | "stats" | "domain" | "loja-espelhada" | "events" | "referral" | "crm" | "gallery" | "rentals" | "contracts" | "captacao" | "stories" | "notifications" | "profit" | "meter" | "customization" | "profile" | "imobiliarias" | "ads" | "parcerias";
type SidebarNavItem =
  | { type: "tab"; id: DashboardTab; label: string; icon: any; locked?: boolean; tourId?: string }
  | { type: "link"; href: string; label: string; icon: any; className?: string; tourId?: string; badge?: string }
  | { type: "action"; key: string; label: string; icon: any; onClick: () => void | Promise<void>; disabled?: boolean; className?: string };
type SidebarGroup = { key: string; title: string; emoji: string; items: SidebarNavItem[] };

export default function SellerDashboard() {
  const { user, profile, signOut, refreshProfile, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [items, setItems] = useState<SellerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("todos");
  const { subscription, currentTier, config: pkgConfigRaw, daysUntilExpiry, isExpiringSoon, isExpired } = useSubscription(user?.id);
  const pkgConfig = pkgConfigRaw || PACKAGE_CONFIG.basico;
  const { isAdmin } = useIsAdmin(user?.id);
  const { dailyData, weeklyData, totals: analyticsTotals, loading: analyticsLoading } = useSellerAnalytics(profile?.id);
  const [chartView, setChartView] = useState<"diario" | "semanal">("diario");
  const [activeTab, setActiveTab] = useState<DashboardTab>("overview");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openSidebarGroups, setOpenSidebarGroups] = useState<Record<string, boolean>>({
    principal: true,
    imoveis: true,
    marketing: true,
    network: true,
    loja: true,
    financeiro: true,
    conta: true,
    admin: true,
  });
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);
  const [dragOverItemId, setDragOverItemId] = useState<string | null>(null);
  const [teamMembers, setTeamMembers] = useState<{ id: string; full_name: string; photo_url: string | null; phone: string | null; is_active: boolean }[]>([]);
  const [showInstallGuide, setShowInstallGuide] = useState(false);
  const [dashThemeId, setDashThemeId] = useState("azul");
  const [defaultManager, setDefaultManager] = useState<{ name: string; phone: string | null; photo_url: string | null } | null>(null);
  const { guideMode, installed, requestInstall } = usePwaInstall();
  const pushSub = usePushSubscription(profile?.id);
  const aiCredits = useAiCredits(user?.id, profile?.id);
  const [newCaptureCount, setNewCaptureCount] = useState(0);
  const [newCrmCount, setNewCrmCount] = useState(0);
  const [newPartnershipCount, setNewPartnershipCount] = useState(0);

  // Fetch new capture leads count + new CRM contacts count
  useEffect(() => {
    if (!user?.id) return;
    const fetchCaptureCount = async () => {
      const { count } = await supabase
        .from("property_capture_leads")
        .select("*", { count: "exact", head: true })
        .eq("seller_user_id", user.id)
        .eq("status", "novo");
      setNewCaptureCount(count ?? 0);
    };
    const fetchCrmCount = async () => {
      const { count } = await supabase
        .from("seller_crm_contacts")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("funnel_stage", "novo");
      setNewCrmCount(count ?? 0);
    };
    const fetchPartnershipCount = async () => {
      const [{ count: c1 }, { count: c2 }] = await Promise.all([
        supabase
          .from("property_partnerships")
          .select("*", { count: "exact", head: true })
          .eq("owner_user_id", user.id)
          .eq("status", "pendente"),
        supabase
          .from("partnership_requests")
          .select("*", { count: "exact", head: true })
          .eq("agency_user_id", user.id)
          .eq("status", "pendente"),
      ]);
      setNewPartnershipCount((c1 ?? 0) + (c2 ?? 0));
    };
    fetchCaptureCount();
    fetchCrmCount();
    fetchPartnershipCount();
    // Cloud cost optimization: replaced 4 always-on Realtime channels with
    // a refresh on tab visibility change. Badges still update reliably when
    // the user returns to the dashboard, without keeping live websockets open.
    const onVisible = () => {
      if (document.visibilityState !== "visible") return;
      fetchCaptureCount();
      fetchCrmCount();
      fetchPartnershipCount();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [user?.id]);

  useEffect(() => {
    supabase.from("platform_settings").select("value").eq("key", "homepage_theme").maybeSingle().then(({ data }) => {
      if (data?.value) setDashThemeId(data.value);
    });
    supabase.from("account_managers").select("name, phone, photo_url").eq("is_active", true).order("created_at", { ascending: true }).limit(1).maybeSingle().then(({ data }) => {
      if (data) setDefaultManager(data as any);
    });
  }, []);
  const dashTheme = getMarketplaceTheme(dashThemeId);

  // Use broker's own store_theme for dashboard if set, otherwise fall back to global marketplace theme
  const brokerStoreTheme = getStoreTheme((profile as any)?.store_theme);
  const hasBrokerTheme = !!(profile as any)?.store_theme && (profile as any)?.store_theme !== "default";
  const dashThemeVars = hasBrokerTheme
    ? getStoreThemeCssVars(brokerStoreTheme)
    : getMarketplaceThemeCssVars(dashTheme);
  const dashGradient = hasBrokerTheme
    ? brokerStoreTheme.preview.heroBg
    : dashTheme.dashboardGradient;

  // Resolve account manager: profile-assigned > default active manager > hardcoded fallback
  const managerName = (profile as any)?.account_manager || defaultManager?.name || "Gabriel";
  const managerPhoto = (profile as any)?.manager_photo || defaultManager?.photo_url || gabrielImg;
  const managerPhone = (profile as any)?.manager_phone || defaultManager?.phone || "5527995055993";
  useEffect(() => {
    if (!authLoading && !user) navigate("/login");
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) fetchItems();
  }, [user]);


  useEffect(() => {
    if (profile?.id) {
      supabase
        .from("team_members")
        .select("id, full_name, photo_url, phone, is_active")
        .eq("company_id", profile.id)
        .order("created_at", { ascending: true })
        .then(({ data }) => {
          if (data) setTeamMembers(data as any);
        });
    }
  }, [profile?.id]);

  const fetchItems = async () => {
    const { data, error } = await supabase
      .from("seller_items")
      .select("id, title, category, price, status, photos, tags, views_count, city, created_at, seller_type, sold_at")
      .eq("user_id", user!.id)
      .order("created_at", { ascending: false });
    if (!error && data) setItems(data as any);
    setLoading(false);
  };

  const toggleStatus = async (id: string, current: string) => {
    const newStatus = current === "ativo" ? "inativo" : "ativo";
    const { error } = await supabase.from("seller_items").update({ status: newStatus }).eq("id", id);
    if (!error) {
      setItems((prev) => prev.map((i) => (i.id === id ? { ...i, status: newStatus } : i)));
      toast({ title: `Item ${newStatus === "ativo" ? "ativado" : "desativado"}` });
    }
  };

  const deleteItem = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este item?")) return;
    const { error } = await supabase.from("seller_items").delete().eq("id", id);
    if (!error) {
      setItems((prev) => prev.filter((i) => i.id !== id));
      toast({ title: "Item excluído" });
    }
  };

  const setFeatured = async (itemId: string) => {
    if (!user || !profile) return;
    const newId = profile.featured_item_id === itemId ? null : itemId;
    const { error } = await supabase.from("profiles").update({ featured_item_id: newId } as any).eq("user_id", user.id);
    if (!error) {
      await refreshProfile();
      toast({ title: newId ? "Destaque definido!" : "Destaque removido" });
    }
  };

  const toggleDestaque = async (itemId: string) => {
    if (!user || !profile) return;
    const allIds: string[] = (profile as any).destaque_item_ids || [];
    const activeItemIds = new Set(items.map((i: any) => i.id));
    const current = allIds.filter((id: string) => activeItemIds.has(id));
    const isSelected = current.includes(itemId);
    if (!isSelected && current.length >= 5) {
      toast({ title: "Máximo de 5 destaques", description: "Remova um destaque antes de adicionar outro", variant: "destructive" });
      return;
    }
    const updated = isSelected ? current.filter((id: string) => id !== itemId) : [...current, itemId];
    const { error } = await supabase.from("profiles").update({ destaque_item_ids: updated } as any).eq("user_id", user.id);
    if (!error) {
      await refreshProfile();
      toast({ title: isSelected ? "Destaque removido" : `⭐ Destaque ativado! (${updated.length}/5)` });
    }
  };

  const toggleHeroCover = async (itemId: string) => {
    if (!user || !profile) return;
    const current: string[] = (profile as any).hero_item_ids || [];
    const isSelected = current.includes(itemId);
    const updated = isSelected ? current.filter((id: string) => id !== itemId) : [...current, itemId];
    const { error } = await supabase.from("profiles").update({ hero_item_ids: updated } as any).eq("user_id", user.id);
    if (!error) {
      await refreshProfile();
      toast({ title: isSelected ? "Removido da capa da loja" : "Adicionado à capa da loja!" });
    }
  };

  const duplicateItem = async (item: SellerItem) => {
    const { data: original } = await supabase.from("seller_items").select("*").eq("id", item.id).single();
    if (!original) return;
    const { id, created_at, updated_at, views_count, ...rest } = original;
    const { error } = await supabase.from("seller_items").insert({ ...rest, title: `${rest.title} (cópia)` });
    if (!error) {
      fetchItems();
      toast({ title: "Item duplicado!" });
    }
  };

  // Sort items by saved order from profile
  const itemOrder: string[] = (profile as any)?.item_order || [];
  const sortedItems = [...items].sort((a, b) => {
    const ai = itemOrder.indexOf(a.id);
    const bi = itemOrder.indexOf(b.id);
    if (ai === -1 && bi === -1) return 0;
    if (ai === -1) return 1;
    if (bi === -1) return -1;
    return ai - bi;
  });

  const filtered = sortedItems.filter((i) => {
    const matchesSearch = i.title.toLowerCase().includes(filter.toLowerCase());
    const matchesStatus = statusFilter === "todos" || i.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const saveItemOrder = async (newOrder: string[]) => {
    if (!user) return;
    await supabase.from("profiles").update({ item_order: newOrder } as any).eq("user_id", user.id);
    await refreshProfile();
  };

  const handleDragStart = (itemId: string) => {
    setDraggedItemId(itemId);
  };

  const handleDragOver = (e: React.DragEvent, itemId: string) => {
    e.preventDefault();
    if (itemId !== draggedItemId) setDragOverItemId(itemId);
  };

  const handleDrop = (targetItemId: string) => {
    if (!draggedItemId || draggedItemId === targetItemId) {
      setDraggedItemId(null);
      setDragOverItemId(null);
      return;
    }
    const currentOrder = sortedItems.map(i => i.id);
    const fromIdx = currentOrder.indexOf(draggedItemId);
    const toIdx = currentOrder.indexOf(targetItemId);
    if (fromIdx === -1 || toIdx === -1) return;
    currentOrder.splice(fromIdx, 1);
    currentOrder.splice(toIdx, 0, draggedItemId);
    // Update local items order immediately
    const reordered = currentOrder.map(id => items.find(i => i.id === id)!).filter(Boolean);
    setItems(reordered);
    saveItemOrder(currentOrder);
    setDraggedItemId(null);
    setDragOverItemId(null);
    toast({ title: "Ordem atualizada!", description: "A nova ordem será exibida na sua loja." });
  };

  const totalActive = items.filter((i) => i.status === "ativo").length;
  const totalInactive = items.filter((i) => i.status === "inativo").length;
  const totalViews = items.reduce((sum, i) => sum + (i.views_count || 0), 0);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const storeUrl = profile
    ? getStoreFullUrl(profile)
    : "";

  const copyStoreUrl = () => {
    navigator.clipboard.writeText(storeUrl);
    toast({ title: "URL copiada!", description: storeUrl });
  };

  const markAsSold = async (id: string) => {
    const now = new Date().toISOString();
    const { error } = await supabase
      .from("seller_items")
      .update({ status: "vendido" as any, sold_at: now })
      .eq("id", id);
    if (!error) {
      setItems((prev) => prev.map((i) => (i.id === id ? { ...i, status: "vendido", sold_at: now } : i)));
      toast({ title: "💰 Imóvel marcado como vendido!", description: "Será removido automaticamente em 24 horas." });
    }
  };



  const isFreePlan = currentTier === "basico";
  const isImobiliaria = profile?.seller_category === "imobiliaria" || profile?.seller_category === "construtora";
  const isEmpresaPlan = ["essencial_empresa", "premium_empresa", "prime_empresa"].includes(currentTier);
  const showTeamTab = isEmpresaPlan || isImobiliaria;
  const maxTeamMembers =
    currentTier === "prime_empresa" ? 25 :
    currentTier === "premium_empresa" ? 15 :
    currentTier === "essencial_empresa" ? 8 :
    currentTier === "basico_empresa" ? 1 :
    currentTier === "prime" ? 999 :
    currentTier === "imob_elite" || currentTier === "const_master" ? 999 :
    currentTier === "imob_pro" ? 15 :
    currentTier === "imob_start" ? 5 :
    currentTier === "const_pro" ? 30 :
    currentTier === "const_start" ? 10 :
    isImobiliaria ? 1 : 0;
  // Todos os recursos do dashboard liberados em qualquer plano. Diferença = só limites numéricos.
  const lockedTabs: DashboardTab[] = [];

  const tabNav = (id: DashboardTab, label: string, icon: any, options: { locked?: boolean; tourId?: string } = {}): SidebarNavItem => ({ type: "tab", id, label, icon, ...options });
  const linkNav = (href: string, label: string, icon: any, options: { className?: string; tourId?: string; badge?: string } = {}): SidebarNavItem => ({ type: "link", href, label, icon, ...options });
  const actionNav = (key: string, label: string, icon: any, onClick: () => void | Promise<void>, options: { disabled?: boolean; className?: string } = {}): SidebarNavItem => ({ type: "action", key, label, icon, onClick, ...options });

  const sidebarGroups: SidebarGroup[] = [
    { key: "principal", title: "Principal", emoji: "🏠", items: [tabNav("overview", "Visão Geral", Home, { tourId: "tour-overview" }), ...(profile?.id ? [linkNav(getStoreUrl(profile), "Ver Minha Loja", Eye, { tourId: "tour-store" })] : []), tabNav("customization", "Personalização", Palette, { tourId: "tour-customization" }), tabNav("stats", "Estatísticas", BarChart3, { tourId: "tour-stats" }), linkNav("/agenda", "Agenda", CalendarIcon), tabNav("crm" as DashboardTab, "Meu CRM", MessageCircle, { tourId: "tour-crm" })] },
    { key: "imoveis", title: "Imóveis", emoji: "🏘️", items: [tabNav("items", "Meus Anúncios", Package), linkNav("/painel/novo", "Novo Anúncio", Plus, { tourId: "tour-new-listing" }), tabNav("gallery" as DashboardTab, "Galeria de Anúncios", Image), tabNav("rentals" as DashboardTab, "Aluguéis", Building2), tabNav("contracts" as DashboardTab, "Contratos", FileText), linkNav("/avaliacao-ia", "Avaliação de Imóveis", Sparkles, { badge: "NEW" }), tabNav("meter" as DashboardTab, "Medidor de Imóveis", Ruler)] },
    { key: "marketing", title: "Marketing", emoji: "🚀", items: [tabNav("stories" as DashboardTab, "Stories", Camera), tabNav("notifications" as DashboardTab, "Push", Bell), tabNav("ads" as DashboardTab, "Fazer ADS", Megaphone, { tourId: "tour-ads" }), tabNav("events", "Efeitos", Sparkles), tabNav("captacao" as DashboardTab, "Captação", Magnet)] },
    { key: "network", title: "Network", emoji: "🤝", items: [tabNav("parcerias" as DashboardTab, "Parcerias", Handshake), tabNav("imobiliarias" as DashboardTab, "Imobiliárias", Building2)] },
    { key: "loja", title: "Loja/Site", emoji: "🛒", items: [tabNav("domain", "Meu Domínio", Globe, { locked: lockedTabs.includes("domain") })] },
    { key: "financeiro", title: "Financeiro", emoji: "💰", items: [tabNav("profit" as DashboardTab, "Calculadora de Lucro", Calculator), linkNav("/pacotes", "Pacotes", Package)] },
    { key: "conta", title: "Conta", emoji: "👤", items: [tabNav("profile", "Meu Perfil", UserCircle), ...(!installed ? [actionNav("install", "Instalar APP", Download, async () => { const result = await requestInstall(); if (result.outcome === "unavailable") setShowInstallGuide(true); })] : []), ...(!pushSub.isSubscribed ? [actionNav("push", pushSub.loading ? "Ativando..." : "Ativar Notificações", Bell, async () => { if (!pushSub.isSupported) { toast({ title: "Notificações não suportadas", description: pushSub.unsupportedReason || "Este navegador não suporta push notifications. Tente pelo app instalado.", variant: "destructive" }); return; } if (pushSub.permission === "denied") { toast({ title: "Notificações bloqueadas", description: "Desbloqueie nas configurações do navegador.", variant: "destructive" }); return; } await pushSub.subscribe(); }, { disabled: pushSub.loading })] : [actionNav("push-active", "Notificações ativas ✓", Bell, () => {}, { disabled: true })])] },
    ...(isAdmin ? [{ key: "admin", title: "Admin", emoji: "⚙️", items: [linkNav("/admin", "Painel Admin", Shield)] }] : []),
  ];

  const sidebarNav = sidebarGroups.flatMap((group) => group.items).filter((item): item is Extract<SidebarNavItem, { type: "tab" }> => item.type === "tab");

  const getSidebarBadge = (id?: DashboardTab) => {
    if (id === "crm" && newCrmCount > 0) return newCrmCount;
    if (id === "captacao" && newCaptureCount > 0) return newCaptureCount;
    if (id === "parcerias" && newPartnershipCount > 0) return newPartnershipCount;
    return null;
  };

  const handleTabClick = (tabId: DashboardTab) => {
    if (lockedTabs.includes(tabId)) {
      toast({
        title: "Recurso bloqueado 🔒",
        description: "Faça upgrade do seu plano para acessar este recurso.",
        variant: "destructive",
      });
      navigate("/pacotes");
      return;
    }
    setActiveTab(tabId);
  };

  return (
    <div className="min-h-screen bg-background overflow-x-hidden" style={dashThemeVars}>
      {/* Mobile Header — Premium Gradient */}
      <div className="py-6 lg:py-4" style={{ background: dashGradient }}>
        <div className="container max-w-6xl mx-auto px-4 lg:hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center overflow-hidden ring-2 ring-white/20">
                {profile?.logo_url ? (
                  <img loading="lazy" decoding="async" src={profile.logo_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-white font-bold text-lg">{profile?.full_name?.charAt(0) || "V"}</span>
                )}
              </div>
              <div>
                <h1 className="font-display font-bold text-lg text-white">Olá, {profile?.full_name || "Vendedor"}!</h1>
                <p className="text-white/60 text-xs">{profile?.company_name || profile?.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              {profile?.id && (
                <Link to={getStoreUrl(profile)}
                  className="p-2.5 rounded-xl bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 transition-colors">
                  <Eye size={16} />
                </Link>
              )}
              <button onClick={() => setActiveTab("profile")} className="p-2.5 rounded-xl bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 transition-colors">
                <Settings size={16} />
              </button>
              <button onClick={() => { signOut(); navigate("/"); }} className="p-2.5 rounded-xl bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 transition-colors">
                <LogOut size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex">
        {/* Desktop Sidebar — Premium */}
        <aside className="hidden lg:flex flex-col w-[280px] min-h-[calc(100vh-64px)] sidebar-premium border-r border-border sticky top-16 flex-shrink-0">
          {/* Profile Card */}
          <div className="p-5 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center overflow-hidden ring-2 ring-primary/20">
                  {profile?.logo_url ? (
                    <img loading="lazy" decoding="async" src={profile.logo_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-foreground font-bold text-xl">{profile?.full_name?.charAt(0) || "V"}</span>
                  )}
                </div>
                <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-green-500 border-2 border-card" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="font-display font-bold text-sm text-foreground truncate">{profile?.full_name || "Vendedor"}</h2>
                <p className="text-xs text-muted-foreground truncate">{profile?.company_name || profile?.email}</p>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <PackageBadge tier={currentTier} />
              {isExpired && (
                <span className="px-2 py-0.5 rounded-full bg-destructive/10 text-destructive text-[10px] font-bold">Expirado</span>
              )}
            </div>

            <div className="mt-4 overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 via-card to-accent/10 p-3 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
                    <Coins size={16} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Créditos IA</p>
                    <p className="text-xs text-muted-foreground truncate">Uso nas ferramentas de IA</p>
                  </div>
                </div>
                <span className="font-display text-xl font-extrabold text-foreground">
                  {aiCredits.loading ? "..." : aiCredits.balance}
                </span>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-all duration-500"
                  style={{ width: `${Math.min(100, Math.max(6, (aiCredits.balance / Math.max(aiCredits.monthlyPlanCredits || 10, aiCredits.balance || 1)) * 100))}%` }}
                />
              </div>
            </div>
          </div>

          {/* Nav */}
          <nav className="flex-1 overflow-y-auto p-3 space-y-2">
            {sidebarGroups.map((group) => {
              const open = openSidebarGroups[group.key] ?? true;
              return (
                <div key={group.key} className="rounded-2xl border border-border/70 bg-card/40 overflow-hidden animate-fade-in">
                  <button
                    type="button"
                    onClick={() => setOpenSidebarGroups((prev) => ({ ...prev, [group.key]: !open }))}
                    className="w-full flex items-center justify-between gap-2 px-3 py-2.5 text-xs font-extrabold uppercase tracking-wider text-muted-foreground hover:bg-secondary/70 transition-colors"
                  >
                    <span className="flex items-center gap-2"><span className="text-sm">{group.emoji}</span>{group.title}</span>
                    <ChevronDown size={14} className={`transition-transform duration-200 ${open ? "rotate-0" : "-rotate-90"}`} />
                  </button>
                  {open && (
                    <div className="px-2 pb-2 space-y-1 animate-accordion-down">
                      {group.items.map((item) => {
                        const Icon = item.icon;
                        const key = item.type === "tab" ? item.id : item.type === "link" ? item.href : item.key;
                        const badge = item.type === "tab" ? getSidebarBadge(item.id) : null;
                        const baseClass = "sidebar-nav-item text-muted-foreground hover:text-foreground hover:bg-secondary/80 w-full text-left transition-all duration-200 hover:translate-x-0.5";

                        if (item.type === "link") {
                          return (
                            <Link key={key} to={item.href} id={item.tourId} className={`${baseClass} ${item.className || ""}`}>
                              <Icon size={18} /> {item.label}
                              {item.badge && <span className="ml-auto text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-primary/15 text-primary">{item.badge}</span>}
                            </Link>
                          );
                        }

                        if (item.type === "action") {
                          return (
                            <button key={key} type="button" onClick={item.onClick} disabled={item.disabled} className={`${baseClass} ${item.disabled ? "opacity-60 cursor-default" : ""} ${item.className || ""}`}>
                              <Icon size={18} /> {item.label}
                            </button>
                          );
                        }

                        return (
                          <button key={key} id={item.tourId} onClick={() => handleTabClick(item.id)} className={`sidebar-nav-item w-full text-left transition-all duration-200 ${item.locked ? "text-muted-foreground/40 cursor-not-allowed" : activeTab === item.id ? "active shadow-sm" : "text-muted-foreground hover:text-foreground hover:bg-secondary/80 hover:translate-x-0.5"}`}>
                            {item.locked ? <Lock size={18} /> : <Icon size={18} />} {item.label}
                            {badge && <span className="ml-auto bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">{badge}</span>}
                            {item.locked && <Lock size={14} className="ml-auto text-muted-foreground/40" />}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>

          {/* Gerente Card — Premium */}
          <div className="p-4 border-t border-border">
            <div className="relative overflow-hidden rounded-2xl p-4" style={{ background: 'linear-gradient(135deg, hsl(var(--primary) / 0.08) 0%, hsl(var(--accent) / 0.08) 100%)' }}>
              <div className="absolute top-0 right-0 w-20 h-20 rounded-full bg-primary/5 -translate-y-1/2 translate-x-1/2" />
              <div className="flex items-center gap-3 mb-3 relative">
                <img loading="lazy" decoding="async" src={managerPhoto} alt={managerName} className="w-11 h-11 rounded-full object-cover ring-2 ring-primary/30 shadow-lg" width={44} height={44} />
                <div>
                  <p className="text-xs font-bold text-foreground">{managerName}</p>
                  <p className="text-[10px] text-muted-foreground">Seu Gerente de Conta</p>
                </div>
              </div>
              <a
                href={`https://wa.me/${managerPhone.replace(/\D/g, "")}?text=Olá%20${encodeURIComponent(managerName)}!%20Preciso%20de%20ajuda%20com%20minha%20loja.`}
                target="_blank"
                rel="noopener noreferrer"
                className="relative w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-green-500 text-white text-xs font-bold hover:bg-green-600 transition-colors shadow-md"
              >
                <Headphones size={14} /> Falar com seu Gerente
              </a>
            </div>
          </div>

          {/* Logout */}
          <div className="p-3 border-t border-border">
            <button onClick={() => { signOut(); navigate("/"); }}
              className="sidebar-nav-item text-destructive hover:bg-destructive/10">
              <LogOut size={18} /> Sair
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-w-0">
          <div className="max-w-5xl mx-auto px-3 md:px-4 py-4 md:py-6 pb-20 lg:pb-6">
            {/* Overview Tab */}
            {activeTab === "overview" && (
              <div className="space-y-6">
                {/* Welcome Banner - Desktop */}
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                  className="hidden lg:block rounded-2xl p-6 relative overflow-hidden" style={{ background: dashGradient }}>
                  <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-white/5 -translate-y-1/2 translate-x-1/4" />
                  <div className="absolute bottom-0 left-1/3 w-24 h-24 rounded-full bg-white/5 translate-y-1/2" />
                  <div className="relative">
                    <h1 className="font-display font-bold text-2xl text-white">Bem-vindo, {profile?.full_name?.split(" ")[0] || "Vendedor"}! 👋</h1>
                    <p className="text-white/60 text-sm mt-1">Gerencie seus imóveis e acompanhe seu desempenho.</p>
                  </div>
                </motion.div>

                {user?.id && profile?.id && (
                  <AiCreditsCard userId={user.id} sellerId={profile.id} themeVars={dashThemeVars} onPurchased={aiCredits.refresh} />
                )}

                {user?.id && (
                  <PlanLimitsCard userId={user.id} />
                )}

                {/* Stats Grid — Premium Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                  {[
                    { label: "Total de Imóveis", value: items.length, icon: Package, gradient: "from-primary/10 to-primary/5", iconBg: "bg-primary/15", iconColor: "text-primary", borderColor: "border-primary/20" },
                    { label: "Ativos", value: totalActive, icon: ToggleRight, gradient: "from-green-500/10 to-green-500/5", iconBg: "bg-green-500/15", iconColor: "text-green-500", borderColor: "border-green-500/20" },
                    { label: "Inativos", value: totalInactive, icon: ToggleLeft, gradient: "from-muted/50 to-muted/30", iconBg: "bg-muted", iconColor: "text-muted-foreground", borderColor: "border-border" },
                    { label: "Visualizações", value: totalViews, icon: Eye, gradient: "from-accent/10 to-accent/5", iconBg: "bg-accent/15", iconColor: "text-accent", borderColor: "border-accent/20" },
                  ].map((s, i) => (
                    <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                      className={`stat-card-premium bg-gradient-to-br ${s.gradient} border ${s.borderColor}`}>
                      <div className={`w-10 h-10 rounded-xl ${s.iconBg} flex items-center justify-center mb-3`}>
                        <s.icon size={20} className={s.iconColor} />
                      </div>
                      <p className="font-display font-extrabold text-3xl text-foreground tracking-tight">{s.value}</p>
                      <p className="text-xs text-muted-foreground font-medium mt-1">{s.label}</p>
                    </motion.div>
                  ))}
                </div>

                {/* Package Info — Premium */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                  className={`rounded-2xl border-2 p-5 relative overflow-hidden ${isExpired ? "border-destructive bg-destructive/5" : isExpiringSoon ? "border-amber-400 bg-amber-400/5" : "border-primary/20 bg-gradient-to-r from-primary/5 via-card to-accent/5"}`}>
                  <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-primary/5 -translate-y-1/2 translate-x-1/2" />
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${pkgConfig.color} flex items-center justify-center shadow-lg`}>
                        {currentTier === "prime" ? <Crown size={22} className="text-white" /> : currentTier === "premium" ? <Star size={22} className="text-white" /> : <Zap size={22} className="text-white" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-display font-bold text-foreground text-lg">Pacote {pkgConfig.name}</span>
                          <PackageBadge tier={currentTier} />
                        </div>
                        {subscription ? (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {isExpired ? (
                              <span className="text-destructive font-semibold">⚠️ Expirado — renove agora!</span>
                            ) : (
                              <>Expira em <strong>{daysUntilExpiry} dias</strong> • {totalActive}/{pkgConfig.maxItems >= 9999 ? "∞" : pkgConfig.maxItems} anúncios</>
                            )}
                          </p>
                        ) : (
                          <p className="text-xs text-muted-foreground">{totalActive}/{pkgConfig.maxItems} anúncios ativos</p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {(isExpired || isExpiringSoon) && (
                        <Link to="/pacotes" className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-amber-500 text-white text-xs font-bold hover:bg-amber-600 transition-colors shadow-md">
                          <AlertTriangle size={14} /> Renovar
                        </Link>
                      )}
                      <Link to="/pacotes" className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-primary/10 text-primary text-xs font-bold hover:bg-primary/20 transition-colors">
                        <Package size={14} /> {subscription ? "Alterar Plano" : "Ver Pacotes"}
                      </Link>
                    </div>
                  </div>
                </motion.div>

                {/* Admin Link - mobile */}
                {isAdmin && (
                  <Link to="/admin" className="lg:hidden flex items-center gap-2 px-4 py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold text-sm hover:opacity-90 transition-opacity shadow-lg">
                    <Shield size={16} /> Painel Administrativo
                  </Link>
                )}

                {/* Quick Actions — Premium */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <Link to="/painel/novo"
                    className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gradient-to-r from-primary to-primary/80 text-primary-foreground font-bold text-sm hover:shadow-lg hover:shadow-primary/25 transition-all">
                    <Plus size={18} /> Adicionar Novo Imóvel
                  </Link>
                  <button onClick={() => setActiveTab("items")}
                    className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl bg-card border border-border text-foreground font-bold text-sm hover:bg-secondary hover:shadow-md transition-all">
                    <Package size={18} /> Ver Meus Anúncios
                  </button>
                </div>

                {/* Mini Chart — Premium */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                  className="bg-card border border-border rounded-2xl p-5 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 rounded-full bg-primary/3 -translate-y-1/2 translate-x-1/2" />
                  <div className="flex items-center justify-between mb-5 relative">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                        <BarChart3 size={20} className="text-primary" />
                      </div>
                      <div>
                        <h3 className="font-display font-bold text-foreground">Resumo Rápido</h3>
                        <p className="text-[11px] text-muted-foreground">Últimos 30 dias</p>
                      </div>
                    </div>
                    <button onClick={() => setActiveTab("stats")} className="text-xs text-primary font-semibold hover:underline flex items-center gap-1">
                      Ver completo <ChevronRight size={14} />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="p-4 rounded-xl bg-gradient-to-br from-primary/8 to-primary/3 border border-primary/10">
                      <div className="flex items-center gap-2 mb-2">
                        <Eye size={16} className="text-primary" />
                        <span className="text-xs text-muted-foreground font-medium">Visitas</span>
                      </div>
                      <p className="font-display font-extrabold text-2xl text-foreground">{analyticsTotals.views}</p>
                    </div>
                    <div className="p-4 rounded-xl bg-gradient-to-br from-green-500/8 to-green-500/3 border border-green-500/10">
                      <div className="flex items-center gap-2 mb-2">
                        <MessageCircle size={16} className="text-green-500" />
                        <span className="text-xs text-muted-foreground font-medium">WhatsApp</span>
                      </div>
                      <p className="font-display font-extrabold text-2xl text-foreground">{analyticsTotals.whatsapp_clicks}</p>
                    </div>
                  </div>
                </motion.div>

                {/* Mobile Gerente Card — Premium */}
                <div className="lg:hidden relative overflow-hidden rounded-2xl p-5" style={{ background: 'linear-gradient(135deg, hsl(var(--primary) / 0.08) 0%, hsl(var(--accent) / 0.08) 100%)' }}>
                  <div className="absolute top-0 right-0 w-20 h-20 rounded-full bg-primary/5 -translate-y-1/2 translate-x-1/2" />
                  <div className="flex items-center gap-3 mb-3 relative">
                    <img loading="lazy" decoding="async" src={managerPhoto} alt={managerName} className="w-12 h-12 rounded-full object-cover ring-2 ring-primary/30 shadow-lg" width={48} height={48} />
                    <div>
                      <p className="text-sm font-bold text-foreground">{managerName}</p>
                      <p className="text-xs text-muted-foreground">Seu Gerente de Conta</p>
                    </div>
                  </div>
                  <a
                    href={`https://wa.me/${managerPhone.replace(/\D/g, "")}?text=Olá%20${encodeURIComponent(managerName)}!%20Preciso%20de%20ajuda%20com%20minha%20loja.`}
                    target="_blank" rel="noopener noreferrer"
                    className="relative w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-green-500 text-white text-sm font-bold hover:bg-green-600 transition-colors shadow-md">
                    <Headphones size={16} /> Falar com seu Gerente
                  </a>
                </div>
              </div>
            )}

            {/* Items Tab */}
            {activeTab === "items" && (
              <div className="space-y-5">
                {/* Header + Search — Premium */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <Link to="/painel/novo"
                    className="flex items-center justify-center gap-2 py-3 px-6 rounded-xl bg-gradient-to-r from-primary to-primary/80 text-primary-foreground font-bold text-sm hover:shadow-lg hover:shadow-primary/25 transition-all">
                    <Plus size={16} /> Novo Imóvel
                  </Link>
                  <div className="flex-1 relative">
                    <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input type="text" value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Buscar imóveis..."
                      className="w-full pl-11 pr-4 py-3 rounded-xl border border-input bg-card text-foreground text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary/50 focus:outline-none transition-all" />
                  </div>
                  <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-4 py-3 rounded-xl border border-input bg-card text-foreground text-sm focus:ring-2 focus:ring-primary/30 focus:outline-none">
                    <option value="todos">Todos</option>
                    <option value="ativo">Ativos</option>
                    <option value="inativo">Inativos</option>
                    <option value="vendido">Vendidos</option>
                  </select>
                </div>

                {filtered.length === 0 ? (
                  <div className="bg-card border border-border rounded-2xl p-16 text-center relative overflow-hidden">
                    <div className="absolute top-0 left-1/2 w-40 h-40 rounded-full bg-primary/5 -translate-x-1/2 -translate-y-1/2" />
                    <Package size={56} className="mx-auto text-muted-foreground/30 mb-4 relative" />
                    <h3 className="font-display font-bold text-xl text-foreground mb-2 relative">Nenhum imóvel encontrado</h3>
                    <p className="text-muted-foreground text-sm mb-6 relative">Comece adicionando seu primeiro imóvel!</p>
                    <Link to="/painel/novo" className="relative inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-gradient-to-r from-primary to-primary/80 text-primary-foreground font-bold text-sm shadow-lg shadow-primary/20">
                      <Plus size={16} /> Adicionar Imóvel
                    </Link>
                  </div>
                ) : (
                  <>
                  <div className="space-y-2 mb-3">
                    <p className="text-xs text-muted-foreground flex items-center gap-1.5 bg-card border border-border rounded-xl px-3 py-2">
                      <GripVertical size={14} className="text-primary" /> Arraste os cards para reordenar a exibição na sua loja
                    </p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 pb-10">
                    {filtered.map((item, i) => (
                      <motion.div key={item.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                        draggable
                        onDragStart={() => handleDragStart(item.id)}
                        onDragOver={(e) => handleDragOver(e, item.id)}
                        onDrop={() => handleDrop(item.id)}
                        onDragEnd={() => { setDraggedItemId(null); setDragOverItemId(null); }}
                        className={`bg-card border rounded-2xl overflow-hidden group hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-grab active:cursor-grabbing ${
                          draggedItemId === item.id ? "opacity-50 scale-95 border-primary shadow-2xl" :
                          dragOverItemId === item.id ? "border-primary ring-2 ring-primary/30 scale-[1.02] shadow-xl" : "border-border"
                        }`}>
                        <div className="relative aspect-video bg-muted overflow-hidden">
                          <div className="absolute top-2 left-2 z-10 p-1.5 rounded-lg bg-black/50 backdrop-blur-sm text-white cursor-grab active:cursor-grabbing">
                            <GripVertical size={14} />
                          </div>
                          {item.photos && item.photos.length > 0 ? (
                            <img loading="lazy" decoding="async" src={item.photos[0]} alt={item.title} className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 ${item.status === "vendido" ? "brightness-50 blur-[1px]" : ""}`} />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted/50">
                              <Image size={36} className="text-muted-foreground/40" />
                            </div>
                          )}
                          <div className="absolute top-2 right-2 flex gap-1.5">
                            <span className={`px-2.5 py-1 rounded-lg text-[11px] font-bold shadow-sm backdrop-blur-sm ${
                              item.status === "ativo" ? "bg-green-500/90 text-white" 
                              : item.status === "vendido" ? "bg-red-500/90 text-white"
                              : "bg-muted-foreground/70 text-white"
                            }`}>
                              {item.status === "ativo" ? "● Ativo" : item.status === "vendido" ? "❌ Vendido" : "● Inativo"}
                            </span>
                          </div>
                          {item.status === "vendido" && item.sold_at && (
                            <div className="absolute bottom-2 left-2 right-2">
                              <SoldCountdown soldAt={item.sold_at} />
                            </div>
                          )}
                          {item.tags && item.tags.length > 0 && (
                            <div className="absolute top-2 left-12 flex gap-1 flex-wrap">
                              {item.tags.slice(0, 2).map((tag) => (
                                <span key={tag} className={`px-2.5 py-1 rounded-lg text-[11px] font-bold shadow-sm ${getTagStyle(tag)}`}>
                                  {getTagLabel(tag)}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="p-4">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <h3 className="font-display font-bold text-foreground line-clamp-1 text-sm">{item.title}</h3>
                              <p className="text-[11px] text-muted-foreground mt-0.5">{item.category} • {item.city || "Sem cidade"}</p>
                            </div>
                            {item.price && (
                              <span className="font-display font-extrabold text-green-600 text-sm whitespace-nowrap bg-green-500/8 px-2.5 py-1 rounded-lg">R$ {item.price.toLocaleString("pt-BR")}</span>
                            )}
                          </div>
                          {/* Views count */}
                          {item.views_count != null && item.views_count > 0 && (
                            <div className="flex items-center gap-1.5 mt-2 text-[11px] text-muted-foreground">
                              <Eye size={12} /> {item.views_count} visualizações
                            </div>
                          )}
                          <div className="flex items-center gap-1 mt-3 pt-3 border-t border-border flex-wrap">
                            <Link to={`/painel/editar/${item.id}`}
                              className="flex-1 flex items-center justify-center gap-1 py-2 rounded-lg bg-primary/10 text-primary text-xs font-semibold hover:bg-primary/20 transition-all">
                              <Edit size={12} /> Editar
                            </Link>
                            <button onClick={() => duplicateItem(item)}
                              className="flex-1 flex items-center justify-center gap-1 py-2 rounded-lg bg-secondary text-secondary-foreground text-xs font-medium hover:bg-secondary/80 transition-all">
                              <Copy size={12} /> Duplicar
                            </button>
                            <button onClick={() => toggleStatus(item.id, item.status)}
                              className={`p-2 rounded-lg transition-all ${item.status === "ativo" ? "bg-green-500/10 text-green-600 hover:bg-green-500/20" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"}`}>
                              {item.status === "ativo" ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
                            </button>
                            <button onClick={() => toggleDestaque(item.id)} title="Destaque na loja (até 5)"
                              className={`p-2 rounded-lg transition-all ${((profile as any)?.destaque_item_ids || []).includes(item.id) ? "bg-amber-500/20 text-amber-500 shadow-sm shadow-amber-500/10" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"}`}>
                              <Star size={14} fill={((profile as any)?.destaque_item_ids || []).includes(item.id) ? "currentColor" : "none"} />
                            </button>
                            <button onClick={() => toggleHeroCover(item.id)} title="Capa da Loja"
                              className={`p-2 rounded-lg transition-all ${((profile as any)?.hero_item_ids || []).includes(item.id) ? "bg-primary/20 text-primary shadow-sm shadow-primary/10" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"}`}>
                              <Clapperboard size={14} />
                            </button>
                            {item.status === "ativo" && (
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <button title="Marcar como vendido"
                                    className="p-2 rounded-lg bg-green-500/10 text-green-600 hover:bg-green-500/20 transition-all">
                                    <BadgeCheck size={14} />
                                  </button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Marcar como vendido?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Tem certeza que deseja marcar "{item.title}" como vendido? O imóvel ficará visível por 24 horas com etiqueta de vendido e depois será removido automaticamente.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => markAsSold(item.id)} className="bg-green-600 hover:bg-green-700">
                                      Sim, marcar como vendido
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            )}
                            <button onClick={() => deleteItem(item.id)}
                              className="p-2 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 transition-all">
                              <Trash2 size={14} />
                            </button>
                          </div>
                          <Link
                            to={`/avaliacao-ia?listing=${item.id}`}
                            title="Importar este anúncio para o Avaliador IA"
                            className="mt-2 w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-gradient-to-r from-violet-500/15 via-fuchsia-500/15 to-violet-500/15 hover:from-violet-500/25 hover:via-fuchsia-500/25 hover:to-violet-500/25 text-violet-700 dark:text-violet-300 text-sm font-semibold border border-violet-500/30 shadow-sm transition-all"
                          >
                            <Sparkles size={16} /> Avaliar com IA
                          </Link>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                  </>
                )}
              </div>
            )}

            {/* Stats Tab */}
            {activeTab === "stats" && (
              <div className="space-y-4">
                <div className="bg-card border border-border rounded-2xl p-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                    <div className="flex items-center gap-2">
                      <BarChart3 size={20} className="text-primary" />
                      <h2 className="font-display font-bold text-lg text-foreground">Estatísticas</h2>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                      <div className="flex items-center gap-3 text-sm flex-wrap">
                        <span className="flex items-center gap-1.5">
                          <Eye size={14} className="text-primary" />
                          <span className="text-muted-foreground text-xs">{analyticsTotals.views} visitas</span>
                        </span>
                        <span className="flex items-center gap-1.5">
                          <MessageCircle size={14} className="text-green-500" />
                          <span className="text-muted-foreground text-xs">{analyticsTotals.whatsapp_clicks} cliques WhatsApp</span>
                        </span>
                      </div>
                      <div className="flex rounded-lg border border-input overflow-hidden self-start">
                        <button onClick={() => setChartView("diario")}
                          className={`px-3 py-1.5 text-xs font-medium transition-colors ${chartView === "diario" ? "bg-primary text-primary-foreground" : "bg-background text-muted-foreground hover:text-foreground"}`}>
                          Diário
                        </button>
                        <button onClick={() => setChartView("semanal")}
                          className={`px-3 py-1.5 text-xs font-medium transition-colors ${chartView === "semanal" ? "bg-primary text-primary-foreground" : "bg-background text-muted-foreground hover:text-foreground"}`}>
                          Semanal
                        </button>
                      </div>
                    </div>
                  </div>

                  {analyticsLoading ? (
                    <div className="h-[250px] flex items-center justify-center">
                      <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-2">Visitantes (últimos 30 dias)</p>
                        <ResponsiveContainer width="100%" height={220}>
                          <AreaChart data={chartView === "diario" ? dailyData : weeklyData}>
                            <defs>
                              <linearGradient id="viewsGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                            <XAxis dataKey="date" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} interval={chartView === "diario" ? 4 : 0} />
                            <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} allowDecimals={false} />
                            <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "12px", fontSize: "12px" }} />
                            <Area type="monotone" dataKey="views" name="Visitas" stroke="hsl(var(--primary))" fill="url(#viewsGrad)" strokeWidth={2} />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-2">Cliques no WhatsApp (últimos 30 dias)</p>
                        <ResponsiveContainer width="100%" height={220}>
                          <BarChart data={chartView === "diario" ? dailyData : weeklyData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                            <XAxis dataKey="date" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} interval={chartView === "diario" ? 4 : 0} />
                            <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} allowDecimals={false} />
                            <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "12px", fontSize: "12px" }} />
                            <Bar dataKey="whatsapp_clicks" name="WhatsApp" fill="hsl(142 71% 45%)" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  )}
                </div>

                {/* Broker Analytics - only for companies with team members */}
                {teamMembers.length > 0 && profile?.id && (
                  <BrokerAnalytics sellerId={profile.id} teamMembers={teamMembers} />
                )}
              </div>
            )}


            {/* Domain Tab */}
            {activeTab === "domain" && (
              <div className="space-y-6">
                <div className="bg-card border border-border rounded-2xl p-6">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Globe size={20} className="text-primary" />
                    </div>
                    <div>
                      <h2 className="font-display font-bold text-lg text-foreground">Domínio Personalizado</h2>
                      <p className="text-xs text-muted-foreground">Tenha seu próprio endereço na internet</p>
                    </div>
                  </div>

                  {/* Store URL */}
                  <div className="bg-muted rounded-xl p-4 mb-6">
                    <p className="text-xs font-semibold text-muted-foreground mb-2">URL atual da sua loja:</p>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 bg-background px-3 py-2 rounded-lg text-xs text-foreground border border-border break-all">
                        {storeUrl}
                      </code>
                      <button onClick={copyStoreUrl}
                        className="flex-shrink-0 p-2.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
                        <ClipboardCopy size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Tutorial Hostinger */}
                  <h3 className="font-display font-bold text-foreground mb-4 flex items-center gap-2">
                    🌐 Como ter seu próprio domínio
                  </h3>

                  <div className="space-y-5">
                    {/* Step 1 */}
                    <div className="flex gap-3">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">1</div>
                      <div>
                        <p className="font-semibold text-sm text-foreground">Acesse a Hostinger</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Entre no site da Hostinger e clique em <strong>"Domínios"</strong> no menu superior.
                        </p>
                        <a
                          href="https://www.hostinger.com.br/registro-de-dominio"
                          target="_blank" rel="noopener noreferrer"
                          className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
                        >
                          <ExternalLink size={12} /> Ir para Hostinger Domínios
                        </a>
                      </div>
                    </div>

                    {/* Step 2 */}
                    <div className="flex gap-3">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">2</div>
                      <div>
                        <p className="font-semibold text-sm text-foreground">Pesquise o domínio desejado</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Digite o nome que deseja (ex: <strong>seudominio.com.br</strong>) e veja se está disponível. Dê preferência para domínios <strong>.com.br</strong> — são mais confiáveis para clientes brasileiros.
                        </p>
                      </div>
                    </div>

                    {/* Step 3 */}
                    <div className="flex gap-3">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">3</div>
                      <div>
                        <p className="font-semibold text-sm text-foreground">Finalize a compra</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Adicione ao carrinho, crie sua conta na Hostinger (se ainda não tiver) e conclua o pagamento. 
                          O valor do domínio <strong>.com.br</strong> geralmente fica entre <strong>R$ 20 ~ R$ 40/ano</strong>.
                        </p>
                      </div>
                    </div>

                    {/* Step 4 */}
                    <div className="flex gap-3">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center text-sm font-bold">4</div>
                      <div>
                        <p className="font-semibold text-sm text-foreground">Entre em contato com seu gerente</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Após comprar o domínio, <strong>envie os dados de acesso da Hostinger</strong> (e-mail e senha) para o seu gerente pelo WhatsApp. Ele vai configurar tudo e conectar o domínio à sua loja — <strong>sem custo adicional!</strong>
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Info box */}
                  <div className="mt-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30">
                    <p className="text-sm font-bold text-foreground flex items-center gap-2 mb-2">
                      ⚠️ Importante
                    </p>
                    <ul className="text-xs text-muted-foreground space-y-1.5">
                      <li>• <strong>Não tente configurar sozinho</strong> — envie os dados de acesso ao seu gerente para que ele faça a instalação correta</li>
                      <li>• A configuração leva em média <strong>1 a 2 horas</strong> após o contato</li>
                      <li>• Depois de configurado, quem acessar <strong>seudominio.com.br</strong> cairá direto na sua loja</li>
                      <li>• Coloque o domínio no seu cartão de visita, redes sociais e materiais de divulgação</li>
                    </ul>
                  </div>

                  {/* Tips */}
                  <div className="mt-4 p-4 rounded-xl bg-primary/5 border border-primary/20">
                    <p className="text-sm font-bold text-foreground flex items-center gap-2 mb-2">
                      <CheckCircle2 size={16} className="text-green-500" /> Dicas para escolher seu domínio
                    </p>
                    <ul className="text-xs text-muted-foreground space-y-1.5">
                      <li>• Use seu <strong>nome profissional</strong> ou <strong>nome da imobiliária</strong> (ex: gabrielcorretor.com.br)</li>
                      <li>• Quanto mais curto e fácil de lembrar, melhor</li>
                      <li>• Evite números e hifens desnecessários</li>
                      <li>• Prefira <strong>.com.br</strong> para o mercado brasileiro</li>
                    </ul>
                  </div>

                  {/* CTA Gerente */}
                  <a
                    href={`https://wa.me/${managerPhone.replace(/\D/g, "")}?text=Olá%20${encodeURIComponent(managerName)}!%20Comprei%20meu%20domínio%20na%20Hostinger%20e%20preciso%20que%20você%20configure%20na%20minha%20loja.%20Posso%20enviar%20os%20dados%20de%20acesso%3F`}
                    target="_blank" rel="noopener noreferrer"
                    className="mt-5 w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-green-500 text-white font-bold text-sm hover:bg-green-600 transition-colors"
                  >
                    <Headphones size={16} /> Já comprei! Falar com {managerName}
                  </a>

                  <p className="text-center text-[11px] text-muted-foreground mt-2">
                    Seu gerente vai configurar tudo para você sem custo adicional
                  </p>
                </div>
              </div>
            )}

            {/* Effects Tab */}
            {activeTab === "events" && user?.id && profile?.id && (
              <StoreEffectsPicker userId={user.id} sellerId={profile.id} />
            )}


            {/* CRM Tab */}
            {activeTab === "crm" && user?.id && profile?.id && (
              <SellerCrmTab userId={user.id} sellerId={profile.id} />
            )}

            {/* Gallery Tab */}
            {activeTab === "gallery" && user?.id && profile?.id && (
              <SellerGalleryTab userId={user.id} sellerId={profile.id} sellerSlug={profile.slug || null} sellerName={profile.company_name || profile.full_name} sellerPhone={profile.phone || null} sellerLogo={profile.logo_url || null} sellerCreci={profile.creci || null} />
            )}

            {/* Rentals Tab */}
            {activeTab === "rentals" && user?.id && profile?.id && (
              <RentalManagementTab userId={user.id} sellerId={profile.id} />
            )}

            {/* Contracts Tab */}
            {activeTab === "contracts" && user?.id && profile?.id && (
              <ContractsTab userId={user.id} sellerId={profile.id} />
            )}

            {/* Captação Online Tab */}
            {activeTab === "captacao" && user?.id && profile?.id && (
              <CaptacaoOnlineTab
                userId={user.id}
                sellerId={profile.id}
                sellerSlug={profile.slug || null}
                sellerName={profile.company_name || profile.full_name || "Corretor"}
                currentTier={currentTier}
                onUnreadCountChange={setNewCaptureCount}
              />
            )}

            {/* Stories Tab */}
            {activeTab === "stories" && user?.id && profile?.id && (
              <StoriesTab userId={user.id} sellerId={profile.id} />
            )}

            {/* Notifications Tab */}
            {activeTab === "notifications" && user?.id && profile?.id && (
              <NotificationsTab userId={user.id} sellerId={profile.id} />
            )}

            {/* Profit Calculator Tab */}
            {activeTab === "profit" && (
              <ProfitCalculatorTab />
            )}

            {activeTab === "meter" && user?.id && (
              <PropertyMeterTab userId={user.id} themeVars={dashThemeVars} />
            )}

            {/* Customization Tab */}
            {activeTab === "customization" && (
              <Suspense fallback={<div className="flex items-center justify-center py-12"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary/20 border-t-primary" /></div>}>
                <SellerCustomization embedded />
              </Suspense>
            )}

            {activeTab === "profile" && (
              <Suspense fallback={<div className="flex items-center justify-center py-12"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary/20 border-t-primary" /></div>}>
                <SellerProfile embedded />
              </Suspense>
            )}


            {activeTab === "ads" && profile?.id && (
              <SellerAdsTab profileId={profile.id} userId={user!.id} />
            )}

            {activeTab === "imobiliarias" && profile?.id && (
              isImobiliaria ? (
                <PartnerAgencyTab profileId={profile.id} userId={user!.id} maxMembers={maxTeamMembers} />
              ) : (
                <PartnerBrokerTab profileId={profile.id} userId={user!.id} />
              )
            )}

            {activeTab === "parcerias" && profile?.id && (
              <PropertyPartnershipsTab profileId={profile.id} userId={user!.id} />
            )}
          </div>
        </main>
      </div>

      {/* Mobile Bottom Nav — Premium */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-xl border-t border-border safe-area-bottom shadow-[0_-4px_20px_-4px_rgba(0,0,0,0.1)]">
        <div className="flex items-center justify-around h-[68px]">
          {sidebarNav.slice(0, 2).map((nav) => (
            <button
              key={nav.id}
              onClick={() => { handleTabClick(nav.id); setMobileMenuOpen(false); }}
              className={`flex flex-col items-center justify-center gap-0.5 px-2 py-1.5 rounded-xl transition-all duration-200 min-w-0 ${
                nav.locked
                  ? "text-muted-foreground/40"
                  : activeTab === nav.id
                    ? "text-primary scale-105"
                    : "text-muted-foreground"
              }`}
            >
              {nav.locked ? <Lock size={20} /> : <nav.icon size={20} />}
              <span className="text-[10px] font-semibold truncate">{nav.label}</span>
              {activeTab === nav.id && (
                <div className="w-1.5 h-1.5 rounded-full bg-primary mt-0.5" />
              )}
            </button>
          ))}

          {/* Ver Minha Loja — Destacado */}
          {profile?.id && (
            <Link
              to={getStoreUrl(profile)}
              className="flex flex-col items-center justify-center gap-0.5 -mt-5"
            >
              <div className="w-14 h-14 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg ring-4 ring-card">
                <Eye size={24} />
              </div>
              <span className="text-[10px] font-bold text-primary mt-0.5">Minha Loja</span>
            </Link>
          )}

          {sidebarNav.length > 2 && (() => {
            const nav3 = sidebarNav[2];
            const Icon3 = nav3.icon;
            return (
              <button
                onClick={() => { handleTabClick(nav3.id); setMobileMenuOpen(false); }}
                className={`flex flex-col items-center justify-center gap-0.5 px-2 py-1.5 rounded-xl transition-all duration-200 min-w-0 ${
                  nav3.locked
                    ? "text-muted-foreground/40"
                    : activeTab === nav3.id
                      ? "text-primary scale-105"
                      : "text-muted-foreground"
                }`}
              >
                {nav3.locked ? <Lock size={20} /> : <Icon3 size={20} />}
                <span className="text-[10px] font-semibold truncate">{nav3.label}</span>
                {activeTab === nav3.id && (
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-0.5" />
                )}
              </button>
            );
          })()}

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className={`flex flex-col items-center justify-center gap-0.5 px-2 py-1.5 rounded-xl transition-all duration-200 ${mobileMenuOpen ? "text-primary scale-105" : "text-muted-foreground"}`}
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            <span className="text-[10px] font-semibold">Mais</span>
          </button>
        </div>
      </nav>

      {/* Mobile Menu Popup */}
      {mobileMenuOpen && (
        <>
          <div className="lg:hidden fixed inset-0 z-40 bg-black/40" onClick={() => setMobileMenuOpen(false)} />
          <div className="lg:hidden fixed bottom-16 left-2 right-2 z-50 bg-card rounded-2xl border border-border shadow-2xl animate-fade-in overflow-hidden safe-area-bottom max-h-[70vh] overflow-y-auto">
            <div className="p-3 space-y-3">
              {/* Remaining dashboard tabs */}
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5 px-2">Painel</p>
                <div className="space-y-0.5">
                  {sidebarNav.slice(3).map((nav) => (
                    <button
                      key={nav.id}
                      onClick={() => { handleTabClick(nav.id); setMobileMenuOpen(false); }}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                        nav.locked
                          ? "text-muted-foreground/50"
                          : activeTab === nav.id
                            ? "bg-primary text-primary-foreground"
                            : "text-foreground hover:bg-secondary"
                      }`}
                    >
                      {nav.locked ? <Lock size={16} /> : <nav.icon size={16} />}
                      {nav.label}
                      {nav.id === "crm" && newCrmCount > 0 && (
                        <span className="ml-auto bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                          {newCrmCount}
                        </span>
                      )}
                      {nav.id === "captacao" && newCaptureCount > 0 && (
                        <span className="ml-auto bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                          {newCaptureCount}
                        </span>
                      )}
                      {nav.id === "parcerias" && newPartnershipCount > 0 && (
                        <span className="ml-auto bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                          {newPartnershipCount}
                        </span>
                      )}
                      {nav.locked && <Lock size={14} className="ml-auto text-muted-foreground/40" />}
                    </button>
                  ))}
                  <Link to="/painel/novo" onClick={() => setMobileMenuOpen(false)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-foreground hover:bg-secondary transition-all">
                    <Plus size={16} /> Novo Anúncio
                  </Link>
                  {profile?.id && (
                    <Link to={getStoreUrl(profile)} onClick={() => setMobileMenuOpen(false)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-foreground hover:bg-secondary transition-all">
                      <Eye size={16} /> Ver Minha Loja
                    </Link>
                  )}
                  <button onClick={() => { setActiveTab("profile"); setMobileMenuOpen(false); }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-foreground hover:bg-secondary transition-all">
                    <UserCircle size={16} /> Meu Perfil
                  </button>
                  <button onClick={() => { setActiveTab("customization"); setMobileMenuOpen(false); }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-foreground hover:bg-secondary transition-all">
                    <Palette size={16} /> Personalização
                  </button>
                  <Link to="/pacotes" onClick={() => setMobileMenuOpen(false)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-foreground hover:bg-secondary transition-all">
                    <Package size={16} /> Pacotes
                  </Link>
                  {isAdmin && (
                    <Link to="/admin" onClick={() => setMobileMenuOpen(false)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-purple-500 hover:bg-purple-500/10 transition-all">
                      <Shield size={16} /> Painel Admin
                    </Link>
                  )}
                  {!installed && (
                    <button
                      onClick={async () => {
                        setMobileMenuOpen(false);
                        const result = await requestInstall();
                        if (result.outcome === "unavailable") setShowInstallGuide(true);
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-emerald-500 hover:bg-emerald-500/10 transition-all"
                    >
                      <Download size={16} /> Instalar APP
                    </button>
                  )}
                  {!pushSub.isSubscribed && (
                    <button
                      onClick={async () => {
                        if (!pushSub.isSupported) {
                          toast({ title: "Notificações não suportadas", description: pushSub.unsupportedReason || "Tente pelo app instalado.", variant: "destructive" });
                          setMobileMenuOpen(false);
                          return;
                        }
                        if (pushSub.permission === "denied") {
                          toast({ title: "Notificações bloqueadas", description: "Desbloqueie nas configurações do navegador.", variant: "destructive" });
                          setMobileMenuOpen(false);
                          return;
                        }
                        await pushSub.subscribe();
                        setMobileMenuOpen(false);
                      }}
                      disabled={pushSub.loading}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-amber-500 hover:bg-amber-500/10 transition-all"
                    >
                      <Bell size={16} /> {pushSub.loading ? "Ativando..." : "Ativar Notificações"}
                    </button>
                  )}
                  {pushSub.isSubscribed && (
                    <div className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground opacity-70">
                      <Bell size={16} /> Notificações ativas ✓
                    </div>
                  )}
                </div>
              </div>

              <div className="border-t border-border" />

              {/* Site categories */}
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5 px-2">Navegar</p>
                <div className="space-y-0.5">
                  <Link to="/" onClick={() => setMobileMenuOpen(false)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-foreground hover:bg-secondary transition-all">
                    <Home size={16} /> Início
                  </Link>
                  <Link to="/imoveis" onClick={() => setMobileMenuOpen(false)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-foreground hover:bg-secondary transition-all">
                    <Building2 size={16} /> Imóveis
                  </Link>


                  <Link to="/buscar" onClick={() => setMobileMenuOpen(false)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-foreground hover:bg-secondary transition-all">
                    <Search size={16} /> Buscar
                  </Link>
                </div>
              </div>

              <div className="border-t border-border" />

              {/* Gerente + Logout */}
              <div className="flex items-center gap-2">
                <a href="https://wa.me/5527995055993?text=Olá%20Gabriel!%20Preciso%20de%20ajuda%20com%20minha%20loja." target="_blank" rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-green-500 text-white text-xs font-bold hover:bg-green-600 transition-colors">
                  <Headphones size={14} /> Falar com Gerente
                </a>
                <button onClick={() => { signOut(); navigate("/"); setMobileMenuOpen(false); }}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-medium text-destructive hover:bg-destructive/10 transition-all">
                  <LogOut size={14} /> Sair
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Spacer for bottom nav on mobile */}
      <div className="lg:hidden h-16" />
      <PwaInstallGuide open={showInstallGuide} onClose={() => setShowInstallGuide(false)} mode={guideMode} />
      <OnboardingTour />
      {user?.id && profile?.id && (
        <WelcomePushPopup sellerId={profile.id} userId={user.id} userName={profile.full_name || profile.company_name} />
      )}
      {(user?.id || (typeof window !== "undefined" && window.location.search.includes("previewLimitPopup=1"))) && (
        <PlanLimitWarningPopup
          userId={user?.id || "preview"}
          userName={profile?.full_name || profile?.company_name}
          planName={pkgConfig?.name}
          threshold={80}
        />
      )}
      <AiHelpChat themeVars={dashThemeVars} />
    </div>
  );
}