import { useState, useEffect } from "react";
import { useCitiesByState } from "@/hooks/useCitiesByState";
import { Play } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import {
  Check, ArrowRight, Crown, Star, Zap, Rocket,
  User, Phone, Mail, Lock, Loader2,
  Globe, Brain, Megaphone, Wallet, FileText, Home,
  Smartphone, Camera, Target, Flame, Diamond, ChevronRight, MapPin,
  Shield, Users, TrendingUp, Award, MessageCircle, Film, Sparkles, Building2, BarChart3, Bot,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import MarketplaceNavbar from "@/components/MarketplaceNavbar";
import ThemeParticles from "@/components/ThemeParticles";
import { getMarketplaceTheme } from "@/lib/marketplaceThemes";
import { getMarketplaceThemeCssVars } from "@/lib/marketplaceThemeCssVars";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { BRAZIL_STATES } from "@/data/brazilStates";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { useRegistrationsClosed } from "@/hooks/useRegistrationsClosed";
import { useActivePlans } from "@/hooks/usePlans";
import RegistrationsClosedNotice from "@/components/RegistrationsClosedNotice";

const FEATURES = [
  {
    icon: Globe, emoji: "🌐", title: "Seu Próprio Site Profissional",
    items: [
      "Site moderno, rápido e otimizado para Google (SEO)",
      "Página exclusiva para cada imóvel",
      "Página personalizada para cada corretor",
      "Layout premium que transmite autoridade",
      "Totalmente responsivo (celular e desktop)",
    ],
  },
  {
    icon: Award, emoji: "🏅", title: "Avaliação Profissional de Imóveis",
    items: [
      "Gere laudos profissionais em PDF",
      "Inclua dados do avaliador com CRECI e CNAI",
      "Análise de fotos para apoiar padrão de acabamento e conservação",
      "Regenere o laudo sempre que precisar corrigir detalhes",
    ],
  },
  {
    icon: Home, emoji: "📐", title: "Calculadora de Tamanho do Imóvel",
    items: [
      "Calcule área total e ambientes do imóvel",
      "Organize medidas por cômodos e áreas externas",
      "Use os dados na avaliação e no cadastro do anúncio",
      "Mais precisão para venda, locação e laudos",
    ],
  },
  {
    icon: Brain, emoji: "🧠", title: "Gestão Completa para Corretores",
    items: [
      "Gestão completa de leads",
      "CRM Kanban com histórico de clientes",
      "Contratos, propostas, visitas e parcerias",
      "Organização total do funil de vendas",
    ],
  },
  {
    icon: Megaphone, emoji: "📢", title: "Gestor de Tráfego Integrado",
    items: [
      "Crie campanhas para Facebook e Google",
      "Direcione leads direto para o WhatsApp",
      "Acompanhe resultados em tempo real",
      "Gere mais contatos qualificados",
    ],
  },
  {
    icon: Wallet, emoji: "💰", title: "Gestão de Cobrança e Aluguéis",
    items: [
      "Controle de pagamentos de clientes",
      "Lembretes automáticos de vencimento",
      "Organização financeira completa",
      "Ideal para quem trabalha com locação",
    ],
  },
  {
    icon: FileText, emoji: "📄", title: "Gerador de Contratos Profissionais",
    items: [
      "Crie contratos prontos em segundos",
      "Modelos para venda, aluguel e captação",
      "Pronto para impressão ou envio digital",
      "Economize tempo e evite erros",
    ],
  },
  {
    icon: Home, emoji: "🏠", title: "Cadastro Profissional de Imóveis",
    items: [
      "Cadastre imóveis com fotos e detalhes completos",
      "Localize rua, bairro, cidade e estado pelo CEP",
      "Páginas otimizadas para aparecer no Google",
      "Filtros inteligentes (cidade, preço, tipo)",
      "Destaque seus melhores imóveis",
    ],
  },
  {
    icon: Smartphone, emoji: "📲", title: "App do Corretor + Notificações Push",
    items: [
      "Receba leads direto no seu celular",
      "Notificações em tempo real",
      "Responda clientes rapidamente",
      "Nunca perca uma oportunidade",
    ],
  },
  {
    icon: Camera, emoji: "📸", title: "Stories de Imóveis (Estilo Instagram)",
    items: [
      "Publique imóveis em formato de stories",
      "Destaque lançamentos e oportunidades",
      "Engajamento muito maior com clientes",
    ],
  },
  {
    icon: Target, emoji: "🎯", title: "Página de Captação de Imóveis",
    items: [
      "Receba imóveis de proprietários automaticamente",
      "Landing page pronta para captar novos anúncios",
      "Aumente seu estoque sem esforço",
    ],
  },
  {
    icon: Bot, emoji: "🤖", title: "Bot WhatsApp com IA Inteligente",
    items: [
      "Atende leads 24h por dia, 7 dias por semana",
      "Conversa natural usando IA generativa",
      "Captura nome, telefone e interesse automaticamente",
      "Encaminha o lead pronto direto pro seu CRM",
    ],
  },
  {
    icon: Film, emoji: "🎬", title: "Modo Cinema Imersivo",
    items: [
      "Apresentação fullscreen estilo Netflix dos seus imóveis",
      "Reverse-zoom automático em cada foto",
      "Wow factor instantâneo nas reuniões",
      "Compartilhe um link e impressione o cliente",
    ],
  },
  {
    icon: Sparkles, emoji: "✨", title: "Galeria Showroom + Copywriting IA",
    items: [
      "Landing cinematográfica para cada imóvel",
      "Copywriting automático gerado por IA",
      "Stories estilo Instagram com 24h de duração",
      "Auto-criação ao publicar novos imóveis",
    ],
  },
  {
    icon: BarChart3, emoji: "📊", title: "Analytics e Estatísticas Avançadas",
    items: [
      "Visitas por imóvel e por loja em tempo real",
      "Cliques no WhatsApp por corretor",
      "Origem do tráfego e conversões",
      "Relatórios para entender o que vende",
    ],
  },
  {
    icon: Building2, emoji: "🏢", title: "Gestão de Equipe (Imobiliárias)",
    items: [
      "Cadastre vários corretores em uma só conta",
      "Cada corretor com sua loja-espelho personalizada",
      "WhatsApp Team Picker — distribui leads aleatoriamente",
      "CRM compartilhado e analytics por corretor",
    ],
  },
];

const IDEAL_FOR = [
  { label: "Corretores autônomos", emoji: "👤" },
  { label: "Imobiliárias", emoji: "🏢" },
  { label: "Equipes de vendas", emoji: "👥" },
  { label: "Quem quer parar de depender de portais", emoji: "🚀" },
];

const STATS = [
  { value: "500+", label: "Imóveis Cadastrados", icon: Home },
  { value: "50+", label: "Corretores Ativos", icon: Users },
  { value: "24/7", label: "Disponibilidade", icon: Shield },
  { value: "100%", label: "Responsivo", icon: Smartphone },
];

// Estilo épico por tier (gradientes, glow e ícones) — aplicado dinamicamente sobre os planos do banco
const TIER_STYLES: Record<string, { gradient: string; glow: string; ring: string; icon: any; badge?: string; ctaGradient?: string; subtitle: string }> = {
  basico:            { gradient: "from-slate-500/20 to-slate-700/10",     glow: "shadow-slate-500/10",   ring: "border-white/10",                                                            icon: Rocket,    subtitle: "Para começar agora" },
  basico_empresa:    { gradient: "from-slate-500/20 to-blue-700/10",      glow: "shadow-blue-500/10",    ring: "border-white/10",                                                            icon: Building2, subtitle: "Para imobiliárias começarem" },
  start:             { gradient: "from-emerald-500/30 to-teal-700/10",    glow: "shadow-emerald-500/20", ring: "border-emerald-400/30",                                                      icon: Zap,       subtitle: "Para corretores em ascensão" },
  premium:           { gradient: "from-amber-500/40 to-orange-600/20",    glow: "shadow-amber-500/30",   ring: "border-amber-400/60 ring-1 ring-amber-400/40",                               icon: Star,      subtitle: "⭐ Mais popular",            badge: "Mais Popular", ctaGradient: "from-amber-500 to-orange-500" },
  vip:               { gradient: "from-fuchsia-500/30 to-purple-700/20",  glow: "shadow-fuchsia-500/30", ring: "border-fuchsia-400/50",                                                      icon: Crown,     subtitle: "Para dominar o mercado" },
  essencial_empresa: { gradient: "from-cyan-500/30 to-blue-700/20",       glow: "shadow-cyan-500/20",    ring: "border-cyan-400/40",                                                         icon: Building2, subtitle: "Para imobiliárias médias" },
  premium_empresa:   { gradient: "from-violet-500/30 to-indigo-700/20",   glow: "shadow-violet-500/30",  ring: "border-violet-400/50",                                                       icon: Diamond,   subtitle: "Para grandes imobiliárias" },
  prime_empresa:     { gradient: "from-yellow-500/30 to-amber-700/30",    glow: "shadow-yellow-500/30",  ring: "border-yellow-500/60 ring-1 ring-yellow-500/40",                             icon: Crown,     subtitle: "★ Para construtoras e redes", badge: "★ TOP",        ctaGradient: "from-zinc-800 to-black text-yellow-400 border border-yellow-500/40" },
};

const formatPrice = (price: number) => price === 0 ? "Gratuito" : `R$ ${price.toFixed(2).replace(".", ",")}`;
const getTierStyle = (tier: string) => TIER_STYLES[tier] || TIER_STYLES.basico;

export default function VenderPage() {
  const navigate = useNavigate();
  const { user, signUp } = useAuth();
  const { plans: dbPlans, loading: loadingPlans } = useActivePlans();
  const individualPlans = dbPlans.filter(p => p.category === "free" || p.category === "individual").sort((a, b) => a.sort_order - b.sort_order);
  const enterprisePlans = dbPlans.filter(p => p.category === "enterprise").sort((a, b) => a.sort_order - b.sort_order);
  const { site_name } = useSiteSettings();
  const { closed: registrationsClosed } = useRegistrationsClosed();
  const { toast } = useToast();
  const [themeId, setThemeId] = useState("azul");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
   const [city, setCity] = useState("");
   const [state, setState] = useState("ES");
   const [password, setPassword] = useState("");
   const [confirmPassword, setConfirmPassword] = useState("");
   const [submitting, setSubmitting] = useState(false);
   const [sellerCategory, setSellerCategory] = useState<"corretor" | "imobiliaria" | "construtora">("corretor");
   const [salesVideoUrl, setSalesVideoUrl] = useState("");
   const [salesVideoTitle, setSalesVideoTitle] = useState("");
   const { cities: stateCities, loading: loadingCities } = useCitiesByState(state);

  useEffect(() => {
    supabase.from("platform_settings").select("value").eq("key", "homepage_theme").maybeSingle().then(({ data }) => {
      if (data?.value) setThemeId(data.value);
    });
    supabase.from("platform_settings").select("value").eq("key", "sales_video_url").maybeSingle().then(({ data }) => {
      if (data?.value) setSalesVideoUrl(data.value);
    });
    supabase.from("platform_settings").select("value").eq("key", "sales_video_title").maybeSingle().then(({ data }) => {
      if (data?.value) setSalesVideoTitle(data.value);
    });
  }, []);
  const theme = getMarketplaceTheme(themeId);
  const themeVars = getMarketplaceThemeCssVars(theme);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (registrationsClosed) {
      toast({ title: "Cadastros encerrados", description: "Não estamos aceitando novos cadastros no momento.", variant: "destructive" });
      return;
    }
     if (!fullName.trim() || !email.trim() || !password.trim() || !city) {
       toast({ title: "Preencha todos os campos obrigatórios", variant: "destructive" });
       return;
     }
     if (password.length < 6) {
       toast({ title: "A senha deve ter pelo menos 6 caracteres", variant: "destructive" });
       return;
     }
     if (password !== confirmPassword) {
       toast({ title: "As senhas não coincidem", variant: "destructive" });
       return;
     }
    setSubmitting(true);
    try {
      const { error } = await signUp(
        email.trim(),
        password,
        fullName.trim(),
        phone.trim() || undefined,
        city.trim() || undefined,
        state || undefined,
      );
      if (error) throw error;

      const { data: { user: newUser } } = await supabase.auth.getUser();

      if (newUser?.id) {
        for (let i = 0; i < 10; i++) {
          const { data: prof } = await supabase.from("profiles").select("id").eq("user_id", newUser.id).maybeSingle();
          if (prof) {
            await supabase.from("profiles").update({ seller_category: sellerCategory }).eq("id", prof.id);
            break;
          }
          await new Promise(r => setTimeout(r, 500));
        }
      }

      toast({ title: "Conta criada com sucesso!", description: "Seu cadastro já entrou no CRM e vamos abrir seu painel." });
      navigate("/painel");
    } catch (err: any) {
      const msg = err?.message?.includes("already registered")
        ? "Este e-mail já possui uma conta. Faça login."
        : err?.message || "Erro ao criar conta";
      toast({ title: msg, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const scrollToForm = () => {
    document.getElementById("signup-form")?.scrollIntoView({ behavior: "smooth" });
  };

  const salesVideoId = salesVideoUrl
    ? salesVideoUrl.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([a-zA-Z0-9_-]{11})/)?.[1] || null
    : null;

  return (
    <>
      <Helmet>
        <title>Site Imobiliário com Gestão Completa | {site_name}</title>
        <meta name="description" content="Crie seu site imobiliário com CRM, avaliação profissional, laudos, cálculo de área, contratos, stories e gestão completa. Comece gratuitamente." />
      </Helmet>

      <div className="min-h-screen text-white overflow-x-hidden relative" style={{ ...themeVars, background: theme.darkBase }}>

        <MarketplaceNavbar theme={theme} user={user} showImoveisScroll={false} />

        {/* ═══ HERO ═══ */}
        <section className="relative overflow-hidden pt-14">
          {/* Particles confined to hero */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden z-[1]">
            <style>{`
              @keyframes heroParticleUp {
                0% { transform: translateY(0) translateX(0) scale(1); opacity: 0; }
                10% { opacity: var(--hp-opacity); }
                90% { opacity: 0.3; }
                100% { transform: translateY(-700px) translateX(var(--hp-drift)) scale(0.2); opacity: 0; }
              }
            `}</style>
            {Array.from({ length: 50 }).map((_, i) => {
              const left = Math.random() * 100;
              const delay = Math.random() * 8;
              const duration = 6 + Math.random() * 8;
              const size = 2 + Math.random() * 3;
              const opacity = 0.2 + Math.random() * 0.5;
              const drift = -30 + Math.random() * 60;
              return (
                <div
                  key={i}
                  className="absolute rounded-full"
                  style={{
                    left: `${left}%`,
                    bottom: "-4px",
                    width: size,
                    height: size,
                    background: `radial-gradient(circle, ${theme.primary} 0%, ${theme.primary}99 60%, transparent 100%)`,
                    boxShadow: `0 0 ${size + 2}px ${theme.primary}80`,
                    ["--hp-opacity" as any]: opacity,
                    ["--hp-drift" as any]: `${drift}px`,
                    animation: `heroParticleUp ${duration}s ${delay}s ease-in infinite`,
                  }}
                />
              );
            })}
          </div>

          {/* Background effects */}
          <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${theme.primary}18, transparent, ${theme.promoAccent || theme.primary}15)` }} />
          <div className="absolute top-20 left-1/4 w-64 md:w-96 h-64 md:h-96 rounded-full blur-[120px]" style={{ background: `${theme.primary}18` }} />
          <div className="absolute bottom-0 right-1/4 w-52 md:w-80 h-52 md:h-80 rounded-full blur-[100px]" style={{ background: `${theme.promoAccent || theme.primary}12` }} />
          {/* Grid pattern overlay */}
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

          <div className="relative max-w-6xl mx-auto px-4 py-12 md:py-24 lg:py-28 grid md:grid-cols-2 gap-8 md:gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
              className="space-y-5 md:space-y-6"
            >
              <div className="inline-flex items-center gap-2 px-3 md:px-4 py-1.5 rounded-full text-[11px] md:text-xs font-semibold" style={{ background: `${theme.primary}25`, border: `1px solid ${theme.primary}50`, color: theme.primary }}>
                <Rocket className="w-3 h-3 md:w-3.5 md:h-3.5" /> Plataforma para corretores e imobiliárias
              </div>

              <h1 className="font-display text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black leading-[1.1]">
                Crie Seu Site Imobiliário com{" "}
                <span className="text-transparent bg-clip-text" style={{ backgroundImage: `linear-gradient(to right, ${theme.primary}, ${theme.promoAccent || theme.primary})` }}>
                  Gestão Completa
                </span>
              </h1>

              <p className="text-sm md:text-base lg:text-lg text-white/60 max-w-lg leading-relaxed">
                Tenha site próprio, CRM, avaliação profissional, cálculo de área, contratos, propostas e controle total dos seus imóveis.
              </p>

              <div className="flex flex-row gap-2 sm:gap-3">
                <Button onClick={scrollToForm} size="lg" className="flex-1 sm:flex-none text-white font-bold rounded-xl px-3 sm:px-6 md:px-8 text-xs sm:text-sm md:text-base shadow-lg whitespace-nowrap" style={{ background: `linear-gradient(to right, ${theme.primary}, ${theme.promoAccent || theme.primary})`, boxShadow: `0 10px 25px ${theme.primary}40` }}>
                  Criar Meu Site <ArrowRight className="ml-1.5 sm:ml-2 w-4 h-4 md:w-5 md:h-5" />
                </Button>
                <Button onClick={() => document.getElementById("planos")?.scrollIntoView({ behavior: "smooth" })} variant="outline" className="flex-1 sm:flex-none rounded-xl border-white/20 text-white/70 hover:text-white hover:bg-white/5 text-xs sm:text-sm whitespace-nowrap">
                  Ver Planos <ChevronRight className="ml-1 w-4 h-4" />
                </Button>
              </div>

              {/* Trust badges */}
              <div className="flex items-center gap-4 pt-2">
                <div className="flex items-center gap-1.5 text-white/40 text-[11px] md:text-xs">
                  <Shield className="w-3.5 h-3.5" style={{ color: theme.primary }} />
                  <span>SSL Seguro</span>
                </div>
                <div className="flex items-center gap-1.5 text-white/40 text-[11px] md:text-xs">
                  <Zap className="w-3.5 h-3.5" style={{ color: theme.primary }} />
                  <span>Setup em 2 min</span>
                </div>
                <div className="flex items-center gap-1.5 text-white/40 text-[11px] md:text-xs">
                  <Award className="w-3.5 h-3.5" style={{ color: theme.primary }} />
                  <span>Sem contrato</span>
                </div>
              </div>
            </motion.div>

            {/* Signup Form */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
            >
              {registrationsClosed ? (
                <div id="signup-form" className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-5 md:p-8 shadow-2xl" style={{ boxShadow: `0 25px 60px ${theme.primary}10` }}>
                  <RegistrationsClosedNotice variant="inline" />
                </div>
              ) : (
              <form id="signup-form" onSubmit={handleSignup} className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-5 md:p-8 space-y-3 md:space-y-4 shadow-2xl" style={{ boxShadow: `0 25px 60px ${theme.primary}10` }}>
                <div className="text-center mb-1 md:mb-2">
                  <h2 className="font-display font-bold text-lg md:text-xl">Comece Gratuitamente</h2>
                  <p className="text-white/50 text-xs md:text-sm mt-1">Crie sua conta em menos de 1 minuto</p>
                </div>
                <div className="relative">
                  <User className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/60" />
                  <input type="text" placeholder="Seu nome completo *" value={fullName} onChange={(e) => setFullName(e.target.value)}
                    className="w-full pl-10 md:pl-11 pr-4 py-3 md:py-3.5 rounded-xl bg-black/40 border border-white/15 text-white placeholder:text-white/40 outline-none transition-colors text-sm focus:border-white/30" required />
                </div>
                <div className="relative">
                  <Mail className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/60" />
                  <input type="email" placeholder="Seu melhor e-mail *" value={email} onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 md:pl-11 pr-4 py-3 md:py-3.5 rounded-xl bg-black/40 border border-white/15 text-white placeholder:text-white/40 outline-none transition-colors text-sm focus:border-white/30" required />
                </div>
                <div className="relative">
                  <Phone className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/60" />
                  <input type="tel" required placeholder="WhatsApp *" value={phone} onChange={(e) => setPhone(e.target.value)}
                    className="w-full pl-10 md:pl-11 pr-4 py-3 md:py-3.5 rounded-xl bg-black/40 border border-white/15 text-white placeholder:text-white/40 outline-none transition-colors text-sm focus:border-white/30" />
                </div>
                <div className="relative">
                  <User className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/60" />
                  <select value={sellerCategory} onChange={(e) => setSellerCategory(e.target.value as any)} required
                    className="w-full pl-10 md:pl-11 pr-3 py-3 md:py-3.5 rounded-xl bg-black/40 border border-white/15 text-white outline-none transition-colors text-sm appearance-none focus:border-white/30">
                    <option value="corretor" className="bg-gray-900">Sou Corretor(a)</option>
                    <option value="imobiliaria" className="bg-gray-900">Sou Imobiliária</option>
                    <option value="construtora" className="bg-gray-900">Sou Construtora</option>
                  </select>
                </div>
                 <div className="grid grid-cols-2 gap-2 md:gap-3">
                   <div className="relative">
                     <MapPin className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/60" />
                     <select value={state} onChange={(e) => { setState(e.target.value); setCity(""); }}
                       className="w-full pl-10 md:pl-11 pr-3 py-3 md:py-3.5 rounded-xl bg-black/40 border border-white/15 text-white outline-none transition-colors text-sm appearance-none focus:border-white/30">
                       {BRAZIL_STATES.map(s => <option key={s.uf} value={s.uf} className="bg-gray-900">{s.uf}</option>)}
                     </select>
                   </div>
                   <div className="relative">
                     <MapPin className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/60" />
                     <select value={city} onChange={(e) => setCity(e.target.value)} required
                       className="w-full pl-10 md:pl-11 pr-3 py-3 md:py-3.5 rounded-xl bg-black/40 border border-white/15 text-white outline-none transition-colors text-sm appearance-none focus:border-white/30">
                       <option value="" className="bg-gray-900">{loadingCities ? "Carregando..." : "Sua cidade *"}</option>
                       {stateCities.map(c => <option key={c} value={c} className="bg-gray-900">{c}</option>)}
                     </select>
                   </div>
                 </div>
                 <div className="relative">
                   <Lock className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/60" />
                   <input type="password" placeholder="Crie uma senha (mín. 6 caracteres) *" value={password} onChange={(e) => setPassword(e.target.value)}
                     className="w-full pl-10 md:pl-11 pr-4 py-3 md:py-3.5 rounded-xl bg-black/40 border border-white/15 text-white placeholder:text-white/40 outline-none transition-colors text-sm focus:border-white/30" required minLength={6} />
                 </div>
                 <div className="relative">
                   <Lock className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/60" />
                   <input type="password" placeholder="Confirme sua senha *" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                     className={`w-full pl-10 md:pl-11 pr-4 py-3 md:py-3.5 rounded-xl bg-black/40 border text-white placeholder:text-white/40 outline-none transition-colors text-sm focus:border-white/30 ${confirmPassword && confirmPassword !== password ? "border-red-500/60" : "border-white/15"}`} required minLength={6} />
                   {confirmPassword && confirmPassword !== password && (
                     <p className="text-red-400 text-[11px] mt-1">As senhas não coincidem</p>
                   )}
                 </div>
                <Button type="submit" disabled={submitting} className="w-full text-white font-bold rounded-xl py-3 md:py-3.5 text-sm shadow-lg" style={{ background: `linear-gradient(to right, ${theme.primary}, ${theme.promoAccent || theme.primary})`, boxShadow: `0 10px 25px ${theme.primary}40` }}>
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  {submitting ? "Criando conta..." : "CRIAR MEU SITE AGORA"}
                  {!submitting && <ArrowRight className="ml-1.5 w-4 h-4" />}
                </Button>
                <p className="text-xs text-white/40 text-center">
                  Já tem uma conta? <Link to="/login" className="hover:underline" style={{ color: theme.primary }}>Faça login</Link>
                </p>
              </form>
              )}
            </motion.div>
          </div>
        </section>

        {/* ═══ STATS BAR ═══ */}
        <section className="border-y border-white/5 py-8 md:py-10" style={{ background: `${theme.primary}08` }}>
          <div className="max-w-5xl mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {STATS.map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="text-center"
                >
                  <stat.icon className="w-5 h-5 mx-auto mb-2" style={{ color: theme.primary }} />
                  <p className="font-display text-xl md:text-2xl font-black" style={{ color: theme.primary }}>{stat.value}</p>
                  <p className="text-[11px] md:text-xs text-white/50 mt-0.5">{stat.label}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══ INTRO ═══ */}
        <section className="bg-white/[0.02] py-12 md:py-16 lg:py-20">
          <div className="max-w-4xl mx-auto px-4 text-center space-y-3 md:space-y-4">
            <div className="inline-flex items-center gap-2 font-semibold text-xs md:text-sm" style={{ color: theme.primary }}>
              <Rocket className="w-4 h-4" /> Tudo que você precisa em um só lugar
            </div>
            <h2 className="font-display text-xl sm:text-2xl md:text-3xl font-black">
              Com nossa plataforma, você anuncia, avalia e gerencia imóveis em um só lugar
            </h2>
            <p className="text-white/50 text-sm md:text-base max-w-2xl mx-auto">
              Ferramentas avançadas para corretores e imobiliárias venderem, alugarem, captarem e entregarem laudos profissionais.
            </p>
          </div>
        </section>

        {/* ═══ FEATURES GRID ═══ */}
        <section className="py-12 md:py-16 lg:py-24">
          <div className="max-w-6xl mx-auto px-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="bg-white/[0.03] hover:bg-white/[0.06] border border-white/8 hover:border-white/15 rounded-2xl p-5 md:p-6 transition-all group"
              >
                <div className="flex items-center gap-3 mb-3 md:mb-4">
                  <span className="text-xl md:text-2xl">{f.emoji}</span>
                  <h3 className="font-display font-bold text-sm md:text-base">{f.title}</h3>
                </div>
                <ul className="space-y-1.5 md:space-y-2">
                  {f.items.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-xs md:text-sm text-white/60">
                      <Check className="w-3 h-3 md:w-3.5 md:h-3.5 mt-0.5 shrink-0" style={{ color: theme.primary }} />
                      {item}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ═══ VIDEO SECTION ═══ */}
        {salesVideoId && (
          <section className="py-12 md:py-16 lg:py-24 border-y border-white/5">
            <div className="max-w-4xl mx-auto px-4">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-center mb-6 md:mb-8"
              >
                <div className="inline-flex items-center gap-2 font-semibold text-xs md:text-sm mb-3" style={{ color: theme.primary }}>
                  <Play className="w-4 h-4" /> Veja como funciona
                </div>
                {salesVideoTitle && (
                  <h2 className="font-display text-xl sm:text-2xl md:text-3xl font-black">{salesVideoTitle}</h2>
                )}
              </motion.div>
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                className="aspect-video rounded-2xl overflow-hidden border border-white/10 shadow-2xl"
                style={{ boxShadow: `0 25px 60px ${theme.primary}20` }}
              >
                <iframe
                  src={`https://www.youtube.com/embed/${salesVideoId}`}
                  title={salesVideoTitle || "Vídeo"}
                  allow="autoplay; encrypted-media"
                  allowFullScreen
                  className="w-full h-full"
                />
              </motion.div>
            </div>
          </section>
        )}

        {/* ═══ IDEAL FOR ═══ */}
        <section className="py-12 md:py-16 lg:py-20" style={{ background: `linear-gradient(135deg, ${theme.primary}12, ${theme.promoAccent || theme.primary}08)` }}>
          <div className="max-w-4xl mx-auto px-4 text-center">
            <div className="inline-flex items-center gap-2 text-orange-400 font-semibold text-xs md:text-sm mb-6">
              <Flame className="w-4 h-4" /> Ideal para
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
              {IDEAL_FOR.map((item, i) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                  className="flex flex-col items-center gap-2 px-4 py-5 md:py-6 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 transition-all"
                >
                  <span className="text-2xl md:text-3xl">{item.emoji}</span>
                  <span className="text-white/80 text-xs md:text-sm font-medium text-center leading-snug">{item.label}</span>
                </motion.div>
              ))}
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mt-10 md:mt-12 max-w-xl mx-auto"
            >
              <div className="flex items-center gap-3 mb-3 justify-center">
                <Diamond className="w-5 h-5" style={{ color: theme.primary }} />
                <h3 className="font-display font-bold text-base md:text-lg">Vantagem Competitiva</h3>
              </div>
              <p className="text-white/50 text-xs md:text-sm leading-relaxed">
                Enquanto outros corretores pagam caro para anunciar…
                <br />
                <span className="text-white/80 font-medium">
                  Você constrói um ativo digital próprio que trabalha para você todos os dias.
                </span>
              </p>
            </motion.div>
          </div>
        </section>

        {/* ═══ PRICING ═══ */}
        <section id="planos" className="py-16 md:py-20 lg:py-28">
          <div className="max-w-6xl mx-auto px-4">
            <div className="text-center max-w-2xl mx-auto mb-10 md:mb-14">
              <p className="font-semibold text-xs md:text-sm uppercase tracking-wide mb-3" style={{ color: theme.primary }}>Planos e preços</p>
              <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-black">
                Comece de graça ou escolha seu plano
              </h2>
              <p className="text-white/40 mt-3 md:mt-4 text-sm md:text-base">
                Todos os planos incluem 7 dias de teste gratuito
              </p>
            </div>

            {loadingPlans ? (
              <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-white/30" /></div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
                {individualPlans.map((plan, i) => {
                  const style = getTierStyle(plan.tier);
                  const Icon = style.icon;
                  const isPopular = plan.is_popular || !!style.badge;
                  return (
                    <motion.div
                      key={plan.id}
                      initial={{ opacity: 0, y: 30 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.08, duration: 0.5 }}
                      whileHover={{ y: -6, transition: { duration: 0.2 } }}
                      className={`group relative bg-gradient-to-br ${style.gradient} backdrop-blur-xl rounded-2xl border ${style.ring} ${style.glow} shadow-2xl p-5 md:p-6 flex flex-col`}
                    >
                      {/* Glow ambient */}
                      <div className="absolute -top-20 -right-20 w-40 h-40 bg-white/5 rounded-full blur-3xl group-hover:bg-white/10 transition-all duration-500 overflow-hidden" />

                      {style.badge && (
                        <span className={`absolute -top-3 left-1/2 -translate-x-1/2 z-10 ${style.ctaGradient ? `bg-gradient-to-r ${style.ctaGradient}` : "bg-gradient-to-r from-amber-500 to-orange-500"} text-white text-[10px] font-black uppercase px-4 py-1 rounded-full tracking-widest shadow-lg`}>
                          {style.badge}
                        </span>
                      )}

                      <div className="relative z-10 flex flex-col h-full">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="p-2 bg-white/10 rounded-lg backdrop-blur">
                            <Icon className="w-5 h-5 text-white" />
                          </div>
                          <h3 className="font-display font-black text-xl md:text-2xl">{plan.name}</h3>
                        </div>
                        <p className="text-[11px] md:text-xs text-white/50 mb-4">{style.subtitle}</p>

                        <div className="mb-4">
                          {plan.price === 0 ? (
                            <p className="text-3xl md:text-4xl font-black bg-gradient-to-br from-white to-white/60 bg-clip-text text-transparent">Gratuito</p>
                          ) : (
                            <>
                              <div className="flex items-baseline gap-1">
                                <span className="text-3xl md:text-4xl font-black bg-gradient-to-br from-white to-white/60 bg-clip-text text-transparent">{formatPrice(plan.price)}</span>
                                <span className="text-xs md:text-sm font-normal text-white/40">/mês</span>
                              </div>
                              <p className="text-[10px] md:text-[11px] font-bold mt-1.5 flex items-center gap-1" style={{ color: theme.primary }}>
                                <Sparkles className="w-3 h-3" /> 7 dias grátis
                              </p>
                            </>
                          )}
                        </div>

                        <div className="mb-4 px-3 py-2 rounded-lg bg-black/30 border border-white/5">
                          <p className="text-[10px] uppercase tracking-wider text-white/40 mb-0.5">Limite de anúncios</p>
                          <p className="text-sm font-bold text-white">{plan.max_items >= 9999 ? "Ilimitado" : `Até ${plan.max_items} imóveis`}</p>
                        </div>

                        <ul className="space-y-1.5 md:space-y-2 flex-1 mb-5">
                          {plan.benefits.slice(0, 12).map((b) => (
                            <li key={b} className="flex items-start gap-2 text-xs md:text-[13px] text-white/70">
                              <Check className="w-3.5 h-3.5 mt-0.5 shrink-0" style={{ color: theme.primary }} />
                              <span>{b}</span>
                            </li>
                          ))}
                          {plan.benefits.length > 12 && (
                            <li className="text-[11px] text-white/40 italic pl-5">+ {plan.benefits.length - 12} recursos adicionais</li>
                          )}
                        </ul>

                        <Button
                          onClick={scrollToForm}
                          className={`w-full rounded-xl font-bold text-sm transition-all ${
                            style.ctaGradient
                              ? `bg-gradient-to-r ${style.ctaGradient} hover:brightness-110 text-white shadow-lg`
                              : "bg-white/10 hover:bg-white/20 text-white border border-white/10"
                          }`}
                        >
                          {plan.price === 0 ? "Criar conta grátis" : `Assinar ${plan.name}`}
                          <ArrowRight className="w-4 h-4 ml-1" />
                        </Button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}

            {/* Enterprise Plans */}
            {enterprisePlans.length > 0 && (
              <div className="mt-16 md:mt-24">
                <div className="text-center mb-10">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-cyan-500/10 to-violet-500/10 border border-white/10 mb-4"
                  >
                    <Building2 className="w-3.5 h-3.5 text-cyan-300" />
                    <span className="text-[11px] font-bold uppercase tracking-widest bg-gradient-to-r from-cyan-300 to-violet-300 bg-clip-text text-transparent">Para Empresas</span>
                  </motion.div>
                  <h3 className="font-display text-2xl sm:text-3xl md:text-4xl font-black bg-gradient-to-br from-white to-white/60 bg-clip-text text-transparent">
                    Planos para Imobiliárias e Construtoras
                  </h3>
                  <p className="text-white/40 mt-3 text-sm md:text-base max-w-xl mx-auto">
                    Múltiplos corretores, lojas-espelho, CRM compartilhado e analytics por equipe
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
                  {enterprisePlans.map((plan, i) => {
                    const style = getTierStyle(plan.tier);
                    const Icon = style.icon;
                    return (
                      <motion.div
                        key={plan.id}
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.08, duration: 0.5 }}
                        whileHover={{ y: -6, transition: { duration: 0.2 } }}
                        className={`group relative overflow-hidden bg-gradient-to-br ${style.gradient} backdrop-blur-xl rounded-2xl border ${style.ring} ${style.glow} shadow-2xl p-5 md:p-6 flex flex-col`}
                      >
                        <div className="absolute -top-20 -right-20 w-40 h-40 bg-white/5 rounded-full blur-3xl group-hover:bg-white/10 transition-all duration-500" />

                        {style.badge && (
                          <span className={`absolute -top-3 left-1/2 -translate-x-1/2 z-10 ${style.ctaGradient ? `bg-gradient-to-r ${style.ctaGradient}` : "bg-gradient-to-r from-violet-500 to-fuchsia-500"} text-white text-[10px] font-black uppercase px-4 py-1 rounded-full tracking-widest shadow-lg`}>
                            {style.badge}
                          </span>
                        )}

                        <div className="relative z-10 flex flex-col h-full">
                          <div className="flex items-center gap-2 mb-3">
                            <div className="p-2 bg-white/10 rounded-lg backdrop-blur">
                              <Icon className="w-5 h-5 text-white" />
                            </div>
                            <h3 className="font-display font-black text-xl md:text-2xl">{plan.name}</h3>
                          </div>
                          <p className="text-[11px] md:text-xs text-white/50 mb-4">{style.subtitle}</p>

                          <div className="mb-4">
                            {plan.price === 0 ? (
                              <p className="text-3xl md:text-4xl font-black bg-gradient-to-br from-white to-white/60 bg-clip-text text-transparent">Gratuito</p>
                            ) : (
                              <>
                                <div className="flex items-baseline gap-1">
                                  <span className="text-3xl md:text-4xl font-black bg-gradient-to-br from-white to-white/60 bg-clip-text text-transparent">{formatPrice(plan.price)}</span>
                                  <span className="text-xs md:text-sm font-normal text-white/40">/mês</span>
                                </div>
                                <p className="text-[10px] md:text-[11px] font-bold mt-1.5 flex items-center gap-1" style={{ color: theme.primary }}>
                                  <Sparkles className="w-3 h-3" /> 7 dias grátis
                                </p>
                              </>
                            )}
                          </div>

                          <div className="mb-4 px-3 py-2 rounded-lg bg-black/30 border border-white/5">
                            <p className="text-[10px] uppercase tracking-wider text-white/40 mb-0.5">Limite de anúncios</p>
                            <p className="text-sm font-bold text-white">{plan.max_items >= 9999 ? "Ilimitado" : `Até ${plan.max_items} imóveis`}</p>
                          </div>

                          <ul className="space-y-1.5 md:space-y-2 flex-1 mb-5">
                            {plan.benefits.slice(0, 12).map((b) => (
                              <li key={b} className="flex items-start gap-2 text-xs md:text-[13px] text-white/70">
                                <Check className="w-3.5 h-3.5 mt-0.5 shrink-0" style={{ color: theme.primary }} />
                                <span>{b}</span>
                              </li>
                            ))}
                            {plan.benefits.length > 12 && (
                              <li className="text-[11px] text-white/40 italic pl-5">+ {plan.benefits.length - 12} recursos adicionais</li>
                            )}
                          </ul>

                          <Button
                            onClick={scrollToForm}
                            className={`w-full rounded-xl font-bold text-sm transition-all ${
                              style.ctaGradient
                                ? `bg-gradient-to-r ${style.ctaGradient} hover:brightness-110 shadow-lg`
                                : "bg-white/10 hover:bg-white/20 text-white border border-white/10"
                            }`}
                          >
                            {plan.price === 0 ? "Criar conta grátis" : `Assinar ${plan.name}`}
                            <ArrowRight className="w-4 h-4 ml-1" />
                          </Button>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* ═══ CTA FINAL ═══ */}
        <section className="border-t border-white/5 py-16 md:py-20 lg:py-28" style={{ background: `linear-gradient(135deg, ${theme.primary}30, ${theme.promoAccent || theme.primary}18)` }}>
          <div className="max-w-3xl mx-auto px-4 text-center space-y-5 md:space-y-6">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              <Zap className="w-10 h-10 md:w-12 md:h-12 mx-auto mb-3 md:mb-4" style={{ color: theme.primary }} />
              <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-black">
                Comece Agora
              </h2>
              <p className="text-white/50 text-sm md:text-lg mt-3 md:mt-4 max-w-xl mx-auto">
                Crie seu site imobiliário completo em poucos minutos e comece a gerar leads todos os dias.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center mt-6 md:mt-8">
                <Button onClick={scrollToForm} size="lg" className="text-white font-bold rounded-xl px-8 md:px-10 text-sm md:text-base shadow-lg" style={{ background: `linear-gradient(to right, ${theme.primary}, ${theme.promoAccent || theme.primary})`, boxShadow: `0 10px 25px ${theme.primary}40` }}>
                  CRIAR MEU SITE AGORA <ArrowRight className="ml-2 w-4 h-4 md:w-5 md:h-5" />
                </Button>
                <Link to="/login">
                  <Button variant="outline" size="lg" className="w-full sm:w-auto rounded-xl border-white/20 text-white/70 hover:text-white hover:bg-white/5 px-8 text-sm md:text-base font-semibold">
                    Já tenho conta
                  </Button>
                </Link>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-black/30 border-t border-white/5 py-6 md:py-8">
          <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-3 md:gap-4 text-xs text-white/30">
            <p>© {new Date().getFullYear()} {site_name}. Todos os direitos reservados.</p>
            <div className="flex gap-4">
              <Link to="/privacidade" className="hover:text-white/60 transition-colors">Privacidade</Link>
              <Link to="/termos" className="hover:text-white/60 transition-colors">Termos</Link>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
