import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Package, Eye, Plus, Settings, Edit, Trash2, Copy, ToggleLeft, ToggleRight, Search, Image, LogOut, BarChart3, Star, Crown, Zap, AlertTriangle, Shield, MessageCircle, Home, UserCircle, Headphones, Globe, ExternalLink, CheckCircle2, ClipboardCopy, Megaphone, Send, Calculator, Lock, Clapperboard, Menu, X, Building2, BookOpen, Users, Trophy } from "lucide-react";
import TeamMembersTab from "@/components/TeamMembersTab";
import GamificationTab from "@/components/GamificationTab";
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
};

type DashboardTab = "overview" | "items" | "stats" | "domain" | "ads" | "study" | "team";

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

  const fetchItems = async () => {
    const { data, error } = await supabase
      .from("seller_items")
      .select("id, title, category, price, status, photos, tags, views_count, city, created_at, seller_type")
      .eq("user_id", user!.id)
      .order("created_at", { ascending: false });
    if (!error && data) setItems(data);
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

  const filtered = items.filter((i) => {
    const matchesSearch = i.title.toLowerCase().includes(filter.toLowerCase());
    const matchesStatus = statusFilter === "todos" || i.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

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

  const storeUrl = profile?.id
    ? `${window.location.origin}/imoveis/empresa/${profile.id}`
    : "";

  const copyStoreUrl = () => {
    navigator.clipboard.writeText(storeUrl);
    toast({ title: "URL copiada!", description: storeUrl });
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
      {/* Mobile Header */}
      <div className="gradient-hero py-6 lg:py-4">
        <div className="container max-w-6xl mx-auto px-4 lg:hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center overflow-hidden">
                {profile?.logo_url ? (
                  <img src={profile.logo_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-white font-bold text-lg">{profile?.full_name?.charAt(0) || "V"}</span>
                )}
              </div>
              <div>
                <h1 className="font-display font-bold text-lg text-white">Olá, {profile?.full_name || "Vendedor"}!</h1>
                <p className="text-white/70 text-xs">{profile?.company_name || profile?.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              {profile?.id && (
                <Link to={`/imoveis/empresa/${profile.id}`}
                  className="p-2.5 rounded-xl bg-white/20 text-white hover:bg-white/30 transition-colors">
                  <Eye size={16} />
                </Link>
              )}
              <Link to="/painel/perfil" className="p-2.5 rounded-xl bg-white/20 text-white hover:bg-white/30 transition-colors">
                <Settings size={16} />
              </Link>
              <button onClick={() => { signOut(); navigate("/"); }} className="p-2.5 rounded-xl bg-white/20 text-white hover:bg-white/30 transition-colors">
                <LogOut size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:flex flex-col w-[260px] min-h-[calc(100vh-64px)] bg-card border-r border-border sticky top-16 flex-shrink-0">
          {/* Profile */}
          <div className="p-5 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center overflow-hidden">
                {profile?.logo_url ? (
                  <img src={profile.logo_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-foreground font-bold text-lg">{profile?.full_name?.charAt(0) || "V"}</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="font-display font-bold text-sm text-foreground truncate">{profile?.full_name || "Vendedor"}</h2>
                <p className="text-xs text-muted-foreground truncate">{profile?.company_name || profile?.email}</p>
              </div>
            </div>
            <div className="mt-3">
              <PackageBadge tier={currentTier} />
            </div>
          </div>

          {/* Nav */}
          <nav className="flex-1 p-3 space-y-1">
            {sidebarNav.map((nav) => (
              <button key={nav.id} onClick={() => handleTabClick(nav.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${nav.locked ? "text-muted-foreground/50 cursor-not-allowed" : activeTab === nav.id ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground hover:bg-secondary"}`}>
                <nav.icon size={18} /> {nav.label}
                {nav.locked && <Lock size={14} className="ml-auto text-muted-foreground/50" />}
              </button>
            ))}

            <div className="pt-2 border-t border-border mt-3">
              <Link to="/painel/novo"
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-all">
                <Plus size={18} /> Novo Anúncio
              </Link>
              {profile?.id && (
                <Link to={`/imoveis/empresa/${profile.id}`}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-all">
                  <Eye size={18} /> Ver Minha Loja
                </Link>
              )}
              <Link to="/painel/perfil"
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-all">
                <UserCircle size={18} /> Meu Perfil
              </Link>
              <Link to="/pacotes"
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-all">
                <Package size={18} /> Pacotes
              </Link>
              {isAdmin && (
                <Link to="/admin"
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-purple-500 hover:bg-purple-500/10 transition-all">
                  <Shield size={18} /> Painel Admin
                </Link>
              )}
            </div>
          </nav>

          {/* Gerente Card */}
          <div className="p-4 border-t border-border">
            <div className="bg-gradient-to-br from-primary/10 to-accent/10 rounded-2xl p-4">
              <div className="flex items-center gap-3 mb-3">
                <img src={(profile as any)?.manager_photo || gabrielImg} alt={profile?.account_manager || "Gabriel"} className="w-10 h-10 rounded-full object-cover ring-2 ring-primary/30" width={40} height={40} />
                <div>
                  <p className="text-xs font-bold text-foreground">{profile?.account_manager || "Gabriel"}</p>
                  <p className="text-[10px] text-muted-foreground">Seu Gerente de Conta</p>
                </div>
              </div>
              <a
                href={`https://wa.me/${((profile as any)?.manager_phone || "5527995055993").replace(/\D/g, "")}?text=Olá%20${encodeURIComponent(profile?.account_manager || "Gabriel")}!%20Preciso%20de%20ajuda%20com%20minha%20loja.`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-green-500 text-white text-xs font-bold hover:bg-green-600 transition-colors"
              >
                <Headphones size={14} /> Falar com seu Gerente
              </a>
            </div>
          </div>

          {/* Logout */}
          <div className="p-3 border-t border-border">
            <button onClick={() => { signOut(); navigate("/"); }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-destructive hover:bg-destructive/10 transition-all">
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
                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { label: "Total", value: items.length, icon: Package, color: "text-primary" },
                    { label: "Ativos", value: totalActive, icon: ToggleRight, color: "text-green-500" },
                    { label: "Inativos", value: totalInactive, icon: ToggleLeft, color: "text-muted-foreground" },
                    { label: "Visualizações", value: totalViews, icon: Eye, color: "text-accent" },
                  ].map((s, i) => (
                    <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                      className="bg-card border border-border rounded-2xl p-4">
                      <div className="flex items-center gap-2 mb-1">
                        <s.icon size={16} className={s.color} />
                        <span className="text-xs text-muted-foreground">{s.label}</span>
                      </div>
                      <p className="font-display font-bold text-2xl text-foreground">{s.value}</p>
                    </motion.div>
                  ))}
                </div>

                {/* Package Info */}
                <div className={`rounded-2xl border-2 p-4 ${isExpired ? "border-destructive bg-destructive/5" : isExpiringSoon ? "border-amber-400 bg-amber-400/5" : "border-border bg-card"}`}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${pkgConfig.color} flex items-center justify-center`}>
                        {currentTier === "vip" ? <Crown size={20} className="text-white" /> : currentTier === "premium" ? <Star size={20} className="text-white" /> : <Zap size={20} className="text-white" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-display font-bold text-foreground">Pacote {pkgConfig.name}</span>
                          <PackageBadge tier={currentTier} />
                        </div>
                        {subscription ? (
                          <p className="text-xs text-muted-foreground">
                            {isExpired ? (
                              <span className="text-destructive font-semibold">Expirado!</span>
                            ) : (
                              <>Expira em {daysUntilExpiry} dias • {totalActive}/{pkgConfig.maxItems >= 9999 ? "∞" : pkgConfig.maxItems} anúncios</>
                            )}
                          </p>
                        ) : (
                          <p className="text-xs text-muted-foreground">{totalActive}/{pkgConfig.maxItems} anúncios ativos</p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {(isExpired || isExpiringSoon) && (
                        <Link to="/pacotes" className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 text-white text-xs font-bold hover:bg-amber-600 transition-colors">
                          <AlertTriangle size={14} /> Renovar
                        </Link>
                      )}
                      <Link to="/pacotes" className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary/10 text-primary text-xs font-bold hover:bg-primary/20 transition-colors">
                        <Package size={14} /> {subscription ? "Alterar Plano" : "Ver Pacotes"}
                      </Link>
                    </div>
                  </div>
                </div>

                {/* Admin Link - mobile */}
                {isAdmin && (
                  <Link to="/admin" className="lg:hidden flex items-center gap-2 px-4 py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold text-sm hover:opacity-90 transition-opacity shadow-lg">
                    <Shield size={16} /> Painel Administrativo
                  </Link>
                )}

                {/* Quick Actions */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <Link to="/painel/novo"
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 transition-colors shadow-md">
                    <Plus size={16} /> Adicionar Novo Item
                  </Link>
                  <button onClick={() => setActiveTab("items")}
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-secondary text-secondary-foreground font-bold text-sm hover:bg-secondary/80 transition-colors">
                    <Package size={16} /> Ver Meus Anúncios
                  </button>
                </div>

                {/* Mini Chart */}
                <div className="bg-card border border-border rounded-2xl p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <BarChart3 size={18} className="text-primary" />
                      <h3 className="font-display font-bold text-foreground">Resumo Rápido</h3>
                    </div>
                    <button onClick={() => setActiveTab("stats")} className="text-xs text-primary font-semibold hover:underline">
                      Ver completo →
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="p-3 rounded-xl bg-secondary/50">
                      <div className="flex items-center gap-1.5 mb-1">
                        <Eye size={14} className="text-primary" />
                        <span className="text-xs text-muted-foreground">Visitas</span>
                      </div>
                      <p className="font-display font-bold text-xl text-foreground">{analyticsTotals.views}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-secondary/50">
                      <div className="flex items-center gap-1.5 mb-1">
                        <MessageCircle size={14} className="text-green-500" />
                        <span className="text-xs text-muted-foreground">WhatsApp</span>
                      </div>
                      <p className="font-display font-bold text-xl text-foreground">{analyticsTotals.whatsapp_clicks}</p>
                    </div>
                  </div>
                </div>

                {/* Mobile Gerente Card */}
                <div className="lg:hidden bg-gradient-to-br from-primary/10 to-accent/10 rounded-2xl p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <img src={(profile as any)?.manager_photo || gabrielImg} alt={profile?.account_manager || "Gabriel"} className="w-10 h-10 rounded-full object-cover ring-2 ring-primary/30" width={40} height={40} />
                    <div>
                      <p className="text-sm font-bold text-foreground">{profile?.account_manager || "Gabriel"}</p>
                      <p className="text-xs text-muted-foreground">Seu Gerente de Conta</p>
                    </div>
                  </div>
                  <a
                    href={`https://wa.me/${((profile as any)?.manager_phone || "5527995055993").replace(/\D/g, "")}?text=Olá%20${encodeURIComponent(profile?.account_manager || "Gabriel")}!%20Preciso%20de%20ajuda%20com%20minha%20loja.`}
                    target="_blank" rel="noopener noreferrer"
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-green-500 text-white text-xs font-bold hover:bg-green-600 transition-colors">
                    <Headphones size={14} /> Falar com seu Gerente
                  </a>
                </div>
              </div>
            )}

            {/* Items Tab */}
            {activeTab === "items" && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-3">
                  <Link to="/painel/novo"
                    className="flex items-center justify-center gap-2 py-3 px-6 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 transition-colors shadow-md">
                    <Plus size={16} /> Novo Item
                  </Link>
                  <div className="flex-1 relative">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input type="text" value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Buscar itens..."
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-input bg-background text-foreground text-sm focus:ring-2 focus:ring-ring focus:outline-none" />
                  </div>
                  <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-4 py-3 rounded-xl border border-input bg-background text-foreground text-sm focus:ring-2 focus:ring-ring focus:outline-none">
                    <option value="todos">Todos</option>
                    <option value="ativo">Ativos</option>
                    <option value="inativo">Inativos</option>
                  </select>
                </div>

                {filtered.length === 0 ? (
                  <div className="bg-card border border-border rounded-2xl p-12 text-center">
                    <Package size={48} className="mx-auto text-muted-foreground mb-4" />
                    <h3 className="font-display font-bold text-lg text-foreground mb-2">Nenhum item encontrado</h3>
                    <p className="text-muted-foreground text-sm mb-4">Comece adicionando seu primeiro item!</p>
                    <Link to="/painel/novo" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm">
                      <Plus size={16} /> Adicionar Item
                    </Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 pb-10">
                    {filtered.map((item, i) => (
                      <motion.div key={item.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                        className="bg-card border border-border rounded-2xl overflow-hidden group hover:shadow-lg transition-shadow">
                        <div className="relative aspect-video bg-muted">
                          {item.photos && item.photos.length > 0 ? (
                            <img src={item.photos[0]} alt={item.title} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Image size={32} className="text-muted-foreground" />
                            </div>
                          )}
                          <div className="absolute top-2 right-2 flex gap-1">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${item.status === "ativo" ? "bg-green-500/90 text-white" : "bg-muted-foreground/80 text-white"}`}>
                              {item.status === "ativo" ? "Ativo" : "Inativo"}
                            </span>
                          </div>
                          {item.tags && item.tags.length > 0 && (
                            <div className="absolute top-2 left-2 flex gap-1 flex-wrap">
                              {item.tags.slice(0, 2).map((tag) => (
                                <span key={tag} className={`px-2 py-0.5 rounded-full text-xs font-bold ${getTagStyle(tag)}`}>
                                  {getTagLabel(tag)}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="p-4">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h3 className="font-display font-bold text-foreground line-clamp-1">{item.title}</h3>
                              <p className="text-xs text-muted-foreground mt-0.5">{item.category} • {item.city || "Sem cidade"}</p>
                            </div>
                            {item.price && (
                              <span className="font-bold text-green-600 text-sm whitespace-nowrap">R$ {item.price.toLocaleString("pt-BR")}</span>
                            )}
                          </div>
                          <div className="flex items-center gap-1 mt-3 pt-3 border-t border-border flex-wrap">
                            <Link to={`/painel/editar/${item.id}`}
                              className="flex-1 flex items-center justify-center gap-1 py-2 rounded-lg bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 transition-colors">
                              <Edit size={12} /> Editar
                            </Link>
                            <button onClick={() => duplicateItem(item)}
                              className="flex-1 flex items-center justify-center gap-1 py-2 rounded-lg bg-secondary text-secondary-foreground text-xs font-medium hover:bg-secondary/80 transition-colors">
                              <Copy size={12} /> Duplicar
                            </button>
                            <button onClick={() => toggleStatus(item.id, item.status)}
                              className="p-2 rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors">
                              {item.status === "ativo" ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
                            </button>
                            <button onClick={() => setFeatured(item.id)} title="Definir como destaque do banner"
                              className={`p-2 rounded-lg transition-colors ${profile?.featured_item_id === item.id ? "bg-yellow-500/20 text-yellow-500" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"}`}>
                              <Star size={14} fill={profile?.featured_item_id === item.id ? "currentColor" : "none"} />
                            </button>
                            <button onClick={() => toggleHeroCover(item.id)} title="Capa da Loja"
                              className={`p-2 rounded-lg transition-colors ${((profile as any)?.hero_item_ids || []).includes(item.id) ? "bg-primary/20 text-primary" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"}`}>
                              <Clapperboard size={14} />
                            </button>
                            <button onClick={() => deleteItem(item.id)}
                              className="p-2 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors">
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
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
                        <p className="font-semibold text-sm text-foreground">Fale com seu gerente</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Envie o nome do domínio para seu gerente de conta pelo botão abaixo.
                          Ele fará a configuração técnica para você.
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">3</div>
                      <div>
                        <p className="font-semibold text-sm text-foreground">Configure o DNS</p>
                        <p className="text-xs text-muted-foreground mt-1">Seu gerente irá orientá-lo a adicionar estes registros DNS no seu provedor:</p>
                        <div className="mt-2 bg-muted rounded-lg p-3 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">Tipo:</span>
                            <code className="text-xs font-mono text-foreground bg-background px-2 py-1 rounded">A</code>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">Nome:</span>
                            <code className="text-xs font-mono text-foreground bg-background px-2 py-1 rounded">@ (raiz) e www</code>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">Valor:</span>
                            <code className="text-xs font-mono text-primary bg-primary/10 px-2 py-1 rounded">185.158.133.1</code>
                          </div>
                        </div>
                        <div className="mt-2 bg-amber-500/10 rounded-lg p-3 space-y-2 border border-amber-500/20">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">Tipo:</span>
                            <code className="text-xs font-mono text-foreground bg-background px-2 py-1 rounded">TXT</code>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">Nome:</span>
                            <code className="text-xs font-mono text-foreground bg-background px-2 py-1 rounded">@</code>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">Valor:</span>
                            <code className="text-xs font-mono text-amber-600 bg-amber-500/10 px-2 py-1 rounded">lovable_verify=... (copie do Lovable)</code>
                          </div>
                          <p className="text-[10px] text-amber-600 font-semibold">⚠️ Obrigatório! Peça o código ao seu gerente.</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">4</div>
                      <div>
                        <p className="font-semibold text-sm text-foreground">Pronto!</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Após a configuração (pode levar até <strong>48 horas</strong> para propagar),
                          seu domínio abrirá <strong>diretamente sua loja</strong> — sem redirecionamento visível!
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
                      <li>• Configure os <strong>3 registros</strong>: A (raiz), A (www) e <strong>TXT</strong> (verificação)</li>
                      <li>• O registro TXT é <strong>obrigatório</strong> — sem ele o domínio não funciona</li>
                      <li>• A propagação do DNS pode levar até <strong>48 horas</strong></li>
                      <li>• Compartilhe o seu domínio nas redes sociais e cartão de visita</li>
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

      {/* Mobile Bottom Nav */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-xl border-t border-border safe-area-bottom">
        <div className="flex items-center justify-around h-16">
          {sidebarNav.slice(0, 3).map((nav) => (
            <button
              key={nav.id}
              onClick={() => { handleTabClick(nav.id); setMobileMenuOpen(false); }}
              className={`flex flex-col items-center justify-center gap-0.5 px-2 py-1 rounded-lg transition-colors min-w-0 ${
                nav.locked
                  ? "text-muted-foreground/40"
                  : activeTab === nav.id
                    ? "text-primary"
                    : "text-muted-foreground"
              }`}
            >
              {nav.locked ? <Lock size={20} /> : <nav.icon size={20} />}
              <span className="text-[10px] font-medium truncate">{nav.label}</span>
            </button>
          ))}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className={`flex flex-col items-center justify-center gap-0.5 px-2 py-1 rounded-lg transition-colors ${mobileMenuOpen ? "text-primary" : "text-muted-foreground"}`}
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            <span className="text-[10px] font-medium">Mais</span>
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
                    <Link to={`/imoveis/empresa/${profile.id}`} onClick={() => setMobileMenuOpen(false)}
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