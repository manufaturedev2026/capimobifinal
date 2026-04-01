import { useState, useEffect, useRef, useCallback } from "react";
import { getStoreUrl, getStoreFullUrl } from "@/lib/storeUrl";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Package, Eye, Plus, Settings, Edit, Trash2, Copy, ToggleLeft, ToggleRight, Search, Image, LogOut, BarChart3, Star, Crown, Zap, AlertTriangle, Shield, MessageCircle, Home, UserCircle, Headphones, Globe, ExternalLink, CheckCircle2, ClipboardCopy, Megaphone, Send, Calculator, Lock, Clapperboard, Menu, X, Building2, BookOpen, Users, Trophy, BadgeCheck, GripVertical, ChevronRight, Gift } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import SoldCountdown from "@/components/SoldCountdown";
import TeamMembersTab from "@/components/TeamMembersTab";
import GamificationTab from "@/components/GamificationTab";
import BrokerAnalytics from "@/components/BrokerAnalytics";
import ReferralTab from "@/components/ReferralTab";
import { getTagStyle, getTagLabel } from "@/data/products";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { useSubscription, useIsAdmin, PACKAGE_CONFIG } from "@/hooks/useSubscription";
import PackageBadge from "@/components/PackageBadge";
import { useSellerAnalytics } from "@/hooks/useSellerAnalytics";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, CartesianGrid } from "recharts";
import gabrielImg from "@/assets/gabriel-gerente.jpg";

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

type DashboardTab = "overview" | "items" | "stats" | "domain" | "ads" | "study" | "team" | "events" | "referral";

export default function SellerDashboard() {
  const { user, profile, signOut, refreshProfile, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [items, setItems] = useState<SellerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("todos");
  const { subscription, currentTier, config: pkgConfig, daysUntilExpiry, isExpiringSoon, isExpired } = useSubscription(user?.id);
  const { isAdmin } = useIsAdmin(user?.id);
  const { dailyData, weeklyData, totals: analyticsTotals, loading: analyticsLoading } = useSellerAnalytics(profile?.id);
  const [chartView, setChartView] = useState<"diario" | "semanal">("diario");
  const [activeTab, setActiveTab] = useState<DashboardTab>("overview");
  const [adDailyBudget, setAdDailyBudget] = useState<string>("10");
  const [adDuration, setAdDuration] = useState<string>("4");
  const [adDetails, setAdDetails] = useState("");
  const [adSubmitting, setAdSubmitting] = useState(false);
  const [adHistory, setAdHistory] = useState<any[]>([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);
  const [dragOverItemId, setDragOverItemId] = useState<string | null>(null);
  const [teamMembers, setTeamMembers] = useState<{ id: string; full_name: string; photo_url: string | null; phone: string | null; is_active: boolean }[]>([]);
  useEffect(() => {
    if (!authLoading && !user) navigate("/entrar");
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) fetchItems();
  }, [user]);

  const fetchAdHistory = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("ad_requests")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (data) setAdHistory(data);
  };

  useEffect(() => {
    if (user) fetchAdHistory();
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
    const current: string[] = (profile as any).destaque_item_ids || [];
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


  const adBudget = parseFloat(adDailyBudget) || 0;
  const adDays = parseInt(adDuration) || 0;
  const adSubtotal = adBudget * adDays;
  const adServiceFee = Math.ceil(adSubtotal / 44) * 10;
  const adTotal = adSubtotal + adServiceFee;
  // Estimativa: a cada R$8.64 = 1.661 impressões
  const adDailyImpressions = Math.floor((adBudget / 8.64) * 1661);
  const adTotalImpressions = adDailyImpressions * adDays;

  const submitAdRequest = async () => {
    if (!user || !profile || adSubtotal <= 0) return;
    if (adBudget < 10) {
      toast({ title: "Valor mínimo é R$ 10,00/dia", variant: "destructive" });
      return;
    }
    if (adDays < 4) {
      toast({ title: "Mínimo de 4 dias (depósito mínimo R$ 40,00)", variant: "destructive" });
      return;
    }
    setAdSubmitting(true);
    const { error } = await supabase.from("ad_requests").insert({
      seller_id: profile.id,
      user_id: user.id,
      platform: "ads_interno",
      daily_budget: adBudget,
      duration_days: adDays,
      details: adDetails || null,
      subtotal: adSubtotal,
      tax_amount: 0,
      service_fee: adServiceFee,
      total: adTotal,
    } as any);
    setAdSubmitting(false);
    if (!error) {
      toast({ title: "Solicitação enviada!", description: "O admin receberá sua solicitação de ADS." });
      setAdDailyBudget("");
      setAdDuration("");
      setAdDetails("");
      fetchAdHistory();
    } else {
      toast({ title: "Erro ao enviar", description: error.message, variant: "destructive" });
    }
  };

  const isFreePlan = currentTier === "basico";
  const isImobiliaria = profile?.seller_category === "imobiliaria";
  const isEmpresaPlan = ["essencial_empresa", "premium_empresa", "prime_empresa"].includes(currentTier);
  const showTeamTab = isEmpresaPlan || isImobiliaria;
  const maxTeamMembers = currentTier === ("prime_empresa" as any) ? 30 : currentTier === "premium_empresa" ? 15 : currentTier === "essencial_empresa" ? 6 : isImobiliaria ? 3 : 0;
  const lockedTabs: DashboardTab[] = isFreePlan ? ["domain", "ads"] : [];

  const sidebarNav: { id: DashboardTab; label: string; icon: any; locked?: boolean }[] = [
    { id: "overview", label: "Visão Geral", icon: Home },
    { id: "items", label: "Meus Anúncios", icon: Package },
    { id: "stats", label: "Estatísticas", icon: BarChart3 },
    { id: "events", label: "Eventos", icon: Trophy },
    { id: "referral" as DashboardTab, label: "Indique e Ganhe", icon: Gift },
    { id: "ads", label: "Fazer ADS", icon: Megaphone, locked: lockedTabs.includes("ads") },
    { id: "domain", label: "Meu Domínio", icon: Globe, locked: lockedTabs.includes("domain") },
    ...(showTeamTab ? [{ id: "team" as DashboardTab, label: "Empresa", icon: Users }] : []),
    { id: "study", label: "Material de Estudo", icon: BookOpen },
  ];

  const handleTabClick = (tabId: DashboardTab) => {
    if (tabId === "study") {
      navigate("/painel/estudo");
      return;
    }
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
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* Mobile Header — Premium Gradient */}
      <div className="dashboard-header-gradient py-6 lg:py-4">
        <div className="container max-w-6xl mx-auto px-4 lg:hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center overflow-hidden ring-2 ring-white/20">
                {profile?.logo_url ? (
                  <img src={profile.logo_url} alt="" className="w-full h-full object-cover" />
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
              <Link to="/painel/perfil" className="p-2.5 rounded-xl bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 transition-colors">
                <Settings size={16} />
              </Link>
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
                    <img src={profile.logo_url} alt="" className="w-full h-full object-cover" />
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
          </div>

          {/* Nav */}
          <nav className="flex-1 p-3 space-y-1">
            {sidebarNav.map((nav) => (
              <button key={nav.id} onClick={() => handleTabClick(nav.id)}
                className={`sidebar-nav-item ${nav.locked ? "text-muted-foreground/40 cursor-not-allowed" : activeTab === nav.id ? "active" : ""}`}>
                <nav.icon size={18} /> {nav.label}
                {nav.locked && <Lock size={14} className="ml-auto text-muted-foreground/40" />}
              </button>
            ))}

            <div className="pt-3 mt-3 border-t border-border space-y-0.5">
              <Link to="/painel/novo"
                className="sidebar-nav-item text-muted-foreground hover:text-foreground hover:bg-secondary">
                <Plus size={18} /> Novo Anúncio
              </Link>
              {profile?.id && (
                <Link to={getStoreUrl(profile)}
                  className="sidebar-nav-item text-muted-foreground hover:text-foreground hover:bg-secondary">
                  <Eye size={18} /> Ver Minha Loja
                </Link>
              )}
              <Link to="/painel/perfil"
                className="sidebar-nav-item text-muted-foreground hover:text-foreground hover:bg-secondary">
                <UserCircle size={18} /> Meu Perfil
              </Link>
              <Link to="/pacotes"
                className="sidebar-nav-item text-muted-foreground hover:text-foreground hover:bg-secondary">
                <Package size={18} /> Pacotes
              </Link>
              {isAdmin && (
                <Link to="/admin"
                  className="sidebar-nav-item text-purple-500 hover:bg-purple-500/10">
                  <Shield size={18} /> Painel Admin
                </Link>
              )}
            </div>
          </nav>

          {/* Gerente Card — Premium */}
          <div className="p-4 border-t border-border">
            <div className="relative overflow-hidden rounded-2xl p-4" style={{ background: 'linear-gradient(135deg, hsl(var(--primary) / 0.08) 0%, hsl(var(--accent) / 0.08) 100%)' }}>
              <div className="absolute top-0 right-0 w-20 h-20 rounded-full bg-primary/5 -translate-y-1/2 translate-x-1/2" />
              <div className="flex items-center gap-3 mb-3 relative">
                <img src={(profile as any)?.manager_photo || gabrielImg} alt={profile?.account_manager || "Gabriel"} className="w-11 h-11 rounded-full object-cover ring-2 ring-primary/30 shadow-lg" width={44} height={44} />
                <div>
                  <p className="text-xs font-bold text-foreground">{profile?.account_manager || "Gabriel"}</p>
                  <p className="text-[10px] text-muted-foreground">Seu Gerente de Conta</p>
                </div>
              </div>
              <a
                href={`https://wa.me/${((profile as any)?.manager_phone || "5527995055993").replace(/\D/g, "")}?text=Olá%20${encodeURIComponent(profile?.account_manager || "Gabriel")}!%20Preciso%20de%20ajuda%20com%20minha%20loja.`}
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
                  className="hidden lg:block dashboard-header-gradient rounded-2xl p-6 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-white/5 -translate-y-1/2 translate-x-1/4" />
                  <div className="absolute bottom-0 left-1/3 w-24 h-24 rounded-full bg-white/5 translate-y-1/2" />
                  <div className="relative">
                    <h1 className="font-display font-bold text-2xl text-white">Bem-vindo, {profile?.full_name?.split(" ")[0] || "Vendedor"}! 👋</h1>
                    <p className="text-white/60 text-sm mt-1">Gerencie seus imóveis e acompanhe seu desempenho.</p>
                  </div>
                </motion.div>

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
                        {currentTier === "vip" ? <Crown size={22} className="text-white" /> : currentTier === "premium" ? <Star size={22} className="text-white" /> : <Zap size={22} className="text-white" />}
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
                    <img src={(profile as any)?.manager_photo || gabrielImg} alt={profile?.account_manager || "Gabriel"} className="w-12 h-12 rounded-full object-cover ring-2 ring-primary/30 shadow-lg" width={48} height={48} />
                    <div>
                      <p className="text-sm font-bold text-foreground">{profile?.account_manager || "Gabriel"}</p>
                      <p className="text-xs text-muted-foreground">Seu Gerente de Conta</p>
                    </div>
                  </div>
                  <a
                    href={`https://wa.me/${((profile as any)?.manager_phone || "5527995055993").replace(/\D/g, "")}?text=Olá%20${encodeURIComponent(profile?.account_manager || "Gabriel")}!%20Preciso%20de%20ajuda%20com%20minha%20loja.`}
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
                            <img src={item.photos[0]} alt={item.title} className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 ${item.status === "vendido" ? "brightness-50 blur-[1px]" : ""}`} />
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

            {/* ADS Tab */}
            {activeTab === "ads" && (
              <div className="space-y-6">
                <div className="bg-card border border-border rounded-2xl p-6">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Megaphone size={20} className="text-primary" />
                    </div>
                    <div>
                      <h2 className="font-display font-bold text-lg text-foreground">Fazer ADS</h2>
                      <p className="text-xs text-muted-foreground">Iremos procurar clientes selecionados para o seu negócio e trazê-los para a sua Loja. Entrarei em contato com você através do seu WhatsApp para fecharmos o negócio.</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {/* Budget & Duration */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-sm font-semibold text-foreground mb-1.5 block">Valor diário (R$)</label>
                        <input type="number" min="10" value={adDailyBudget} onChange={(e) => setAdDailyBudget(e.target.value)}
                          placeholder="Mínimo R$ 10" className="w-full px-4 py-3 rounded-xl border border-input bg-background text-foreground text-sm focus:ring-2 focus:ring-ring focus:outline-none" />
                      </div>
                      <div>
                        <label className="text-sm font-semibold text-foreground mb-1.5 block">Durante quantos dias?</label>
                        <input type="number" min="4" value={adDuration} onChange={(e) => setAdDuration(e.target.value)}
                          placeholder="Mínimo 4 dias" className="w-full px-4 py-3 rounded-xl border border-input bg-background text-foreground text-sm focus:ring-2 focus:ring-ring focus:outline-none" />
                      </div>
                    </div>

                    {/* Details */}
                    <div>
                      <label className="text-sm font-semibold text-foreground mb-1.5 block">Detalhes (opcional)</label>
                      <textarea value={adDetails} onChange={(e) => setAdDetails(e.target.value)} rows={3} maxLength={500}
                        placeholder="Descreva o que deseja divulgar, público-alvo, região..."
                        className="w-full px-4 py-3 rounded-xl border border-input bg-background text-foreground text-sm focus:ring-2 focus:ring-ring focus:outline-none resize-none" />
                    </div>

                    {/* Pricing Breakdown */}
                    {adSubtotal > 0 && (
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                        className="bg-muted rounded-2xl p-5 space-y-3">
                        <div className="flex items-center gap-2 mb-2">
                          <Calculator size={16} className="text-primary" />
                          <span className="font-display font-bold text-foreground">Resumo do Investimento</span>
                        </div>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Valor por dia</span>
                            <span className="text-foreground font-medium">R$ {adBudget.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Impressões estimadas/dia</span>
                            <span className="text-foreground font-medium">~{adDailyImpressions.toLocaleString("pt-BR")}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Subtotal ({adDays} dias)</span>
                            <span className="text-foreground font-medium">R$ {adSubtotal.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Imposto e Taxa de serviço</span>
                            <span className="text-foreground font-medium">R$ {adServiceFee.toFixed(2)}</span>
                          </div>
                          <div className="border-t border-border pt-2 flex justify-between">
                            <span className="font-display font-bold text-foreground">Total</span>
                            <span className="font-display font-bold text-xl text-primary">R$ {adTotal.toFixed(2)}</span>
                          </div>
                          <div className="flex items-center gap-2 pt-2 text-xs text-muted-foreground bg-primary/5 rounded-xl p-3">
                            <Zap size={14} className="text-primary" />
                            <span>Estimativa total: <strong className="text-foreground">~{adTotalImpressions.toLocaleString("pt-BR")} impressões</strong> em {adDays} dias</span>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* Submit */}
                    <button onClick={submitAdRequest} disabled={adSubmitting || adSubtotal <= 0}
                      className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md">
                      <Send size={16} /> {adSubmitting ? "Enviando..." : "Enviar Solicitação"}
                    </button>
                  </div>
                </div>

                {/* History */}
                {adHistory.length > 0 && (
                  <div className="bg-card border border-border rounded-2xl p-6">
                    <h3 className="font-display font-bold text-foreground mb-4">Histórico de Solicitações</h3>
                    <div className="space-y-3">
                      {adHistory.map((req) => (
                        <div key={req.id} className="p-3 rounded-xl bg-muted">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <span className="text-lg">📢</span>
                              <div>
                                <p className="text-sm font-semibold text-foreground">
                                  Campanha ADS — {req.duration_days} dias
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  R$ {Number(req.daily_budget).toFixed(2)}/dia • Total: R$ {Number(req.total).toFixed(2)}
                                </p>
                              </div>
                            </div>
                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                              req.status === "aprovado" ? "bg-green-500/20 text-green-600" :
                              req.status === "rejeitado" ? "bg-destructive/20 text-destructive" :
                              "bg-amber-500/20 text-amber-600"
                            }`}>
                              {req.status === "aprovado" ? "Aprovado" : req.status === "rejeitado" ? "Rejeitado" : "Pendente"}
                            </span>
                          </div>
                          {req.status === "rejeitado" && req.details && (
                            <div className="mt-2 p-2.5 rounded-lg bg-destructive/5 border border-destructive/20">
                              <p className="text-xs font-semibold text-destructive mb-0.5">Motivo da rejeição:</p>
                              <p className="text-xs text-muted-foreground">{req.details}</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
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
                      <p className="text-xs text-muted-foreground">Aponte seu domínio para sua loja</p>
                    </div>
                  </div>

                  {/* Store URL */}
                  <div className="bg-muted rounded-xl p-4 mb-6">
                    <p className="text-xs font-semibold text-muted-foreground mb-2">URL da sua loja:</p>
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

                  {/* Instructions */}
                  <h3 className="font-display font-bold text-foreground mb-4 flex items-center gap-2">
                    📋 Como configurar seu domínio
                  </h3>

                  <div className="space-y-4">
                    <div className="flex gap-3">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">1</div>
                      <div>
                        <p className="font-semibold text-sm text-foreground">Compre seu domínio</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Registre seu domínio em um provedor como{" "}
                          <a href="https://registro.br" target="_blank" rel="noopener noreferrer" className="text-primary underline">Registro.br</a>,{" "}
                          <a href="https://hostinger.com.br" target="_blank" rel="noopener noreferrer" className="text-primary underline">Hostinger</a> ou{" "}
                          <a href="https://godaddy.com" target="_blank" rel="noopener noreferrer" className="text-primary underline">GoDaddy</a>.
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">2</div>
                      <div>
                        <p className="font-semibold text-sm text-foreground">Copie a URL da sua loja</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Copie o link acima (URL da sua loja). Esse é o endereço para onde seu domínio vai redirecionar.
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">3</div>
                      <div>
                        <p className="font-semibold text-sm text-foreground">Configure o Redirecionamento 301</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          No painel do seu provedor de domínio, procure a opção <strong>"Redirecionamento de URL"</strong> ou <strong>"URL Forwarding"</strong> e configure assim:
                        </p>
                        <div className="mt-2 bg-muted rounded-lg p-3 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">Tipo:</span>
                            <code className="text-xs font-mono text-foreground bg-background px-2 py-1 rounded">Redirecionamento 301 (Permanente)</code>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">De:</span>
                            <code className="text-xs font-mono text-foreground bg-background px-2 py-1 rounded">seudominio.com.br</code>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">Para:</span>
                            <code className="text-xs font-mono text-primary bg-primary/10 px-2 py-1 rounded break-all">{storeUrl}</code>
                          </div>
                        </div>

                        <div className="mt-3 space-y-2">
                          <p className="text-xs font-semibold text-foreground">📌 Como fazer em cada provedor:</p>
                          <div className="bg-muted rounded-lg p-3 space-y-3">
                            <div>
                              <p className="text-xs font-bold text-foreground">GoDaddy:</p>
                              <p className="text-[11px] text-muted-foreground">Domínios → Gerenciar DNS → Encaminhamento → Adicionar encaminhamento → Cole a URL da loja → Tipo: Permanente (301)</p>
                            </div>
                            <div>
                              <p className="text-xs font-bold text-foreground">Hostinger:</p>
                              <p className="text-[11px] text-muted-foreground">Domínios → Gerenciar → Redirecionamentos → Novo redirecionamento → Cole a URL da loja → Tipo: 301</p>
                            </div>
                            <div>
                              <p className="text-xs font-bold text-foreground">Registro.br:</p>
                              <p className="text-[11px] text-muted-foreground">Domínios → Editar → Publicação web → Redirecionar → Cole a URL da loja</p>
                            </div>
                            <div>
                              <p className="text-xs font-bold text-foreground">Cloudflare:</p>
                              <p className="text-[11px] text-muted-foreground">Rules → Page Rules → URL: seudominio.com/* → Forwarding URL → 301 → Cole a URL da loja</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">4</div>
                      <div>
                        <p className="font-semibold text-sm text-foreground">Pronto!</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Após configurar, quem acessar <strong>seudominio.com.br</strong> será redirecionado automaticamente para sua loja. A propagação pode levar até <strong>24 horas</strong>.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Tips */}
                  <div className="mt-6 p-4 rounded-xl bg-primary/5 border border-primary/20">
                    <p className="text-sm font-bold text-foreground flex items-center gap-2 mb-2">
                      <CheckCircle2 size={16} className="text-green-500" /> Dicas importantes
                    </p>
                    <ul className="text-xs text-muted-foreground space-y-1.5">
                      <li>• Escolha <strong>Redirecionamento 301 (Permanente)</strong> — é melhor para SEO</li>
                      <li>• Configure tanto <strong>seudominio.com</strong> quanto <strong>www.seudominio.com</strong></li>
                      <li>• A propagação pode levar até <strong>24 horas</strong></li>
                      <li>• Compartilhe seu domínio nas redes sociais e cartão de visita</li>
                      <li>• Se tiver dúvidas, fale com seu gerente clicando no botão abaixo</li>
                    </ul>
                  </div>

                  {/* CTA Gerente */}
                  <a
                    href={`https://wa.me/${((profile as any)?.manager_phone || "5527995055993").replace(/\D/g, "")}?text=Olá%20${encodeURIComponent(profile?.account_manager || "Gabriel")}!%20Preciso%20de%20ajuda%20para%20configurar%20meu%20domínio%20personalizado.`}
                    target="_blank" rel="noopener noreferrer"
                    className="mt-4 w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-green-500 text-white font-bold text-sm hover:bg-green-600 transition-colors"
                  >
                    <Headphones size={16} /> Fale com seu Gerente{profile?.account_manager ? ` ${profile.account_manager}` : ""}
                  </a>
                </div>
              </div>
            )}

            {/* Events/Gamification Tab */}
            {activeTab === "events" && user?.id && profile?.id && (
              <GamificationTab userId={user.id} sellerId={profile.id} />
            )}

            {/* Referral Tab */}
            {activeTab === "referral" && (
              <ReferralTab />
            )}

            {/* Team Tab */}
            {activeTab === "team" && showTeamTab && profile?.id && (
              <TeamMembersTab
                profileId={profile.id}
                userId={user!.id}
                maxMembers={maxTeamMembers}
              />
            )}
          </div>
        </main>
      </div>

      {/* Mobile Bottom Nav — Premium */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-xl border-t border-border safe-area-bottom shadow-[0_-4px_20px_-4px_rgba(0,0,0,0.1)]">
        <div className="flex items-center justify-around h-[68px]">
          {sidebarNav.slice(0, 3).map((nav) => (
            <button
              key={nav.id}
              onClick={() => { handleTabClick(nav.id); setMobileMenuOpen(false); }}
              className={`flex flex-col items-center justify-center gap-0.5 px-3 py-1.5 rounded-xl transition-all duration-200 min-w-0 ${
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
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className={`flex flex-col items-center justify-center gap-0.5 px-3 py-1.5 rounded-xl transition-all duration-200 ${mobileMenuOpen ? "text-primary scale-105" : "text-muted-foreground"}`}
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
                  <Link to="/painel/perfil" onClick={() => setMobileMenuOpen(false)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-foreground hover:bg-secondary transition-all">
                    <UserCircle size={16} /> Meu Perfil
                  </Link>
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
    </div>
  );
}