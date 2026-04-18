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
  Shield, Users, TrendingUp, Award,
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
    icon: Brain, emoji: "🧠", title: "CRM Inteligente para Corretores",
    items: [
      "Gestão completa de leads",
      "Histórico de clientes",
      "Lembretes automáticos de follow-up",
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
    icon: Home, emoji: "🏠", title: "Galeria de Imóveis Profissional",
    items: [
      "Cadastre imóveis com fotos e detalhes completos",
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

const PLANS = [
  {
    key: "basico", name: "Básico", subtitle: "Para experimentar", price: 0, priceLabel: "Gratuito",
    setupFee: null, popular: false,
    benefits: ["Até 5 anúncios ativos", "Vitrine própria (sua loja online)", "URL personalizada /seu-nome", "1 Layout (Marketplace) + 1 Tema", "Painel do vendedor completo", "Estatísticas básicas", "Gerador de contratos (1 modelo)", "QR Code dos anúncios e propostas PDF", "Calculadora de Lucro (ROI)", "Sistema de Parcerias entre corretores", "Push: 1 envio por dia", "Gerador de Texto IA: 5/dia"],
    cta: "Criar conta grátis",
  },
  {
    key: "start", name: "Start", subtitle: "Para corretores iniciantes", price: 24.99, priceLabel: "R$24,99",
    setupFee: 299, popular: false,
    benefits: ["Até 25 anúncios ativos", "Vitrine Lvl 1 — mais visibilidade", "1 Layout (Showcase) + 3 Temas", "CRM Kanban completo", "Stories (estilo Instagram)", "Página de Captação de imóveis", "Todos os modelos de contrato", "Simulador de Financiamento", "PDF de Proposta profissional", "Selo Start + Hero Banner", "Destaque na listagem", "Push: 1 envio por dia", "Gerador de Texto IA: 10/dia"],
    cta: "Começar agora",
  },
  {
    key: "premium", name: "VIP", subtitle: "⭐ Mais popular", price: 59.99, priceLabel: "R$59,99",
    setupFee: 719, popular: true,
    benefits: ["Até 60 anúncios ativos", "Vitrine Lvl 2 — destaque superior", "4 Layouts + 6 Temas", "Tudo do Start +", "Bot de Captação (fluxo fixo)", "Push Notifications: 2 envios por dia", "Vídeo banner hero (autoplay)", "Modo Cinema imersivo", "Efeitos visuais na loja", "Gestão de Aluguéis completa", "Sistema de ADS integrado", "Estatísticas avançadas", "Selo VIP nos anúncios", "Suporte prioritário", "Gerador de Texto IA: 20/dia"],
    cta: "Assinar VIP",
  },
  {
    key: "vip", name: "Premium", subtitle: "Para dominar o mercado", price: 114.99, priceLabel: "R$114,99",
    setupFee: 1379, popular: false,
    benefits: ["Até 115 anúncios ativos", "Vitrine Lvl 3 — máximo individual", "Todos os 7 Layouts + Temas", "Tudo do VIP +", "Captação com IA Inteligente", "Instagram na loja", "SEO otimizado (cidade/bairro)", "Destaque Épico (até 5 imóveis)", "Galeria Showroom + Copywriting", "Selo Premium exclusivo", "Push Notifications: 3 envios por dia", "Suporte VIP dedicado", "Gerador de Texto IA: 50/dia"],
    cta: "Assinar Premium",
  },
];

const ENTERPRISE_PLANS = [
  {
    key: "essencial_empresa", name: "Exclusive", subtitle: "Para imobiliárias", price: 199.99, priceLabel: "R$199,99",
    benefits: ["Anúncios ilimitados", "Vitrine Lvl 4 — prioridade empresa", "Todos os layouts + temas", "Tudo do Premium +", "Até 5 corretores vinculados", "Lojas espelho por corretor", "WhatsApp Team Picker", "Analytics por corretor", "Selo Exclusive", "Push Notifications: 4 envios por dia", "Suporte dedicado", "Gerador de Texto IA: 100/dia"],
    cta: "Assinar Exclusive",
  },
  {
    key: "premium_empresa", name: "Prime", subtitle: "Para grandes imobiliárias", price: 349.99, priceLabel: "R$349,99",
    benefits: ["Anúncios ilimitados", "Vitrine Lvl 5 — destaque premium", "Tudo do Exclusive +", "Até 10 corretores vinculados", "Domínio personalizado", "Selo Prime", "Push Notifications: 5 envios por dia", "Suporte premium dedicado", "Gerador de Texto IA: 200/dia"],
    cta: "Assinar Prime",
  },
  {
    key: "prime_empresa", name: "Black", subtitle: "★ Para construtoras e redes", price: 599.99, priceLabel: "R$599,99",
    benefits: ["Anúncios ilimitados", "Vitrine Lvl 6 — máximo absoluto", "Tudo do Prime +", "Corretores ilimitados", "Gerente de conta VIP dedicado", "Selo Black ★ exclusivo", "Push Notifications: 6 envios por dia", "Suporte 24/7 prioritário", "Gerador de Texto IA: 400/dia"],
    cta: "Assinar Black",
  },
];

export default function VenderPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
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
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: { data: { full_name: fullName.trim(), phone: phone.trim() || undefined, city: city.trim() || undefined, state: state || undefined } },
      });
      if (authError) throw authError;

      // Save seller_category to profile (wait for trigger to create it)
      if (authData.user?.id) {
        for (let i = 0; i < 10; i++) {
          const { data: prof } = await supabase.from("profiles").select("id").eq("user_id", authData.user.id).maybeSingle();
          if (prof) {
            await supabase.from("profiles").update({ seller_category: sellerCategory }).eq("id", prof.id);
            break;
          }
          await new Promise(r => setTimeout(r, 500));
        }
      }

      try {
        await supabase.from("crm_contacts").insert({
          full_name: fullName.trim(),
          email: email.trim(),
          phone: phone.trim() || null,
          funnel_stage: "novo",
          notes: `Lead via /anunciar — ${sellerCategory}`,
          profile_id: authData.user?.id || "",
          user_id: authData.user?.id || "",
        } as any);
      } catch { /* non-critical */ }

      toast({ title: "Conta criada com sucesso!", description: "Verifique seu e-mail para confirmar o cadastro." });
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
        <title>Site Imobiliário Profissional com CRM | Capimobi</title>
        <meta name="description" content="Crie seu site imobiliário profissional com CRM completo, gestão de leads, contratos, stories e muito mais. Comece gratuitamente." />
      </Helmet>

      <div className="min-h-screen text-white overflow-x-hidden" style={{ ...themeVars, background: theme.darkBase }}>

        <MarketplaceNavbar theme={theme} user={user} showImoveisScroll={false} />

        {/* ═══ HERO ═══ */}
        <section className="relative overflow-hidden pt-14">
          <ThemeParticles color={theme.primary} count={45} />
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
                Crie Seu Site Imobiliário Profissional com{" "}
                <span className="text-transparent bg-clip-text" style={{ backgroundImage: `linear-gradient(to right, ${theme.primary}, ${theme.promoAccent || theme.primary})` }}>
                  CRM Completo
                </span>
              </h1>

              <p className="text-sm md:text-base lg:text-lg text-white/60 max-w-lg leading-relaxed">
                Pare de depender de plataformas e portais caros.
                Tenha seu próprio site, seus próprios clientes e controle total das suas vendas.
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
              Com nossa plataforma, você cria um site imobiliário completo
            </h2>
            <p className="text-white/50 text-sm md:text-base max-w-2xl mx-auto">
              Ferramentas avançadas para corretores e imobiliárias crescerem de verdade.
            </p>
          </div>
        </section>

        {/* ═══ FEATURES GRID ═══ */}
        <section className="py-12 md:py-16 lg:py-24">
          <div className="max-w-6xl mx-auto px-4 grid sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
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

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
              {PLANS.map((plan, i) => (
                <motion.div
                  key={plan.key}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className={`relative bg-white/[0.04] backdrop-blur rounded-2xl border ${plan.popular ? "border-amber-400/60 ring-1 ring-amber-400/30 shadow-xl shadow-amber-500/10" : "border-white/10"} p-5 md:p-6 flex flex-col`}
                >
                  {plan.popular && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[10px] font-bold uppercase px-4 py-1 rounded-full tracking-wide">
                      Recomendado
                    </span>
                  )}

                  <h3 className="font-display font-bold text-lg md:text-xl">{plan.name}</h3>
                  <p className="text-[11px] md:text-xs text-white/40 mt-1">{plan.subtitle}</p>

                  <div className="mt-4 md:mt-5 mb-3 md:mb-4">
                    {plan.price === 0 ? (
                      <p className="text-2xl md:text-3xl font-black">Gratuito</p>
                    ) : (
                      <>
                        <p className="text-2xl md:text-3xl font-black">
                          {plan.priceLabel}<span className="text-xs md:text-sm font-normal text-white/40">/mês</span>
                        </p>
                        {plan.setupFee && (
                          <p className="text-[10px] md:text-[11px] text-white/30 mt-1">
                            + R${plan.setupFee.toLocaleString("pt-BR")} de implementação
                          </p>
                        )}
                      </>
                    )}
                  </div>

                  <ul className="space-y-2 md:space-y-2.5 flex-1 mb-5 md:mb-6">
                    {plan.benefits.map((b) => (
                      <li key={b} className="flex items-start gap-2 text-xs md:text-sm text-white/60">
                        <Check className="w-3.5 h-3.5 md:w-4 md:h-4 mt-0.5 shrink-0" style={{ color: theme.primary }} />
                        {b}
                      </li>
                    ))}
                  </ul>

                  <Button
                    onClick={scrollToForm}
                    className={`w-full rounded-xl font-bold text-sm ${
                      plan.popular
                        ? "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
                        : "bg-white/10 hover:bg-white/15 text-white"
                    }`}
                  >
                    {plan.cta}
                  </Button>
                </motion.div>
              ))}
            </div>

            {/* Enterprise Plans */}
            <div className="mt-12 md:mt-16">
              <div className="text-center mb-8">
                <p className="font-semibold text-xs md:text-sm uppercase tracking-wide mb-2" style={{ color: theme.primary }}>Para Empresas</p>
                <h3 className="font-display text-xl sm:text-2xl md:text-3xl font-black">
                  Planos para Imobiliárias e Construtoras
                </h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-5">
                {ENTERPRISE_PLANS.map((plan, i) => (
                  <motion.div
                    key={plan.key}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className={`relative bg-white/[0.04] backdrop-blur rounded-2xl border ${plan.key === "prime_empresa" ? "border-yellow-500/60 ring-1 ring-yellow-500/30 shadow-xl shadow-yellow-500/10" : "border-white/10"} p-5 md:p-6 flex flex-col`}
                  >
                    {plan.key === "prime_empresa" && (
                      <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-zinc-800 to-black text-yellow-400 text-[10px] font-bold uppercase px-4 py-1 rounded-full tracking-wide border border-yellow-500/50">
                        ★ Top
                      </span>
                    )}

                    <h3 className="font-display font-bold text-lg md:text-xl">{plan.name}</h3>
                    <p className="text-[11px] md:text-xs text-white/40 mt-1">{plan.subtitle}</p>

                    <div className="mt-4 md:mt-5 mb-3 md:mb-4">
                      <p className="text-2xl md:text-3xl font-black">
                        {plan.priceLabel}<span className="text-xs md:text-sm font-normal text-white/40">/mês</span>
                      </p>
                    </div>

                    <ul className="space-y-2 md:space-y-2.5 flex-1 mb-5 md:mb-6">
                      {plan.benefits.map((b) => (
                        <li key={b} className="flex items-start gap-2 text-xs md:text-sm text-white/60">
                          <Check className="w-3.5 h-3.5 md:w-4 md:h-4 mt-0.5 shrink-0" style={{ color: theme.primary }} />
                          {b}
                        </li>
                      ))}
                    </ul>

                    <Button
                      onClick={scrollToForm}
                      className={`w-full rounded-xl font-bold text-sm ${
                        plan.key === "prime_empresa"
                          ? "bg-gradient-to-r from-zinc-800 to-black text-yellow-400 border border-yellow-500/30 hover:from-zinc-700 hover:to-zinc-900"
                          : "bg-white/10 hover:bg-white/15 text-white"
                      }`}
                    >
                      {plan.cta}
                    </Button>
                  </motion.div>
                ))}
              </div>
            </div>
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
            <p>© {new Date().getFullYear()} Capimobi. Todos os direitos reservados.</p>
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
