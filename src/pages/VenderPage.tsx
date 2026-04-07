import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import {
  Check, ArrowRight, Crown, Star, Zap, Rocket,
  User, Phone, Mail, Lock, Loader2,
  Globe, Brain, Megaphone, Wallet, FileText, Home,
  Smartphone, Camera, Target, Flame, Diamond, ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import MarketplaceNavbar from "@/components/MarketplaceNavbar";
import { getMarketplaceTheme } from "@/lib/marketplaceThemes";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

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
  "Corretores autônomos",
  "Imobiliárias",
  "Equipes de vendas",
  "Quem quer parar de depender de portais",
];

const PLANS = [
  {
    key: "basico", name: "Gratuito", subtitle: "Para quem quer validar", price: 0, priceLabel: "Gratuito",
    setupFee: null, color: "border-slate-400", popular: false,
    benefits: ["Até 5 anúncios ativos", "1 Layout profissional", "Painel completo", "Estatísticas básicas"],
    cta: "Criar conta grátis",
  },
  {
    key: "start", name: "Start", subtitle: "Para corretores iniciantes", price: 24.99, priceLabel: "R$24,99",
    setupFee: 299, color: "border-emerald-400", popular: false,
    benefits: ["Até 25 anúncios", "CRM + Galeria", "Destaque na listagem", "Estatísticas avançadas"],
    cta: "Começar agora",
  },
  {
    key: "premium", name: "Premium", subtitle: "Para profissionais", price: 49.99, priceLabel: "R$49,99",
    setupFee: 499, color: "border-amber-400", popular: true,
    benefits: ["Até 100 anúncios", "4 Layouts exclusivos", "Stories + Push", "Vídeo banner", "6 temas", "Destaque máximo"],
    cta: "Assinar Premium",
  },
  {
    key: "vip", name: "VIP", subtitle: "Para imobiliárias", price: 99.99, priceLabel: "R$99,99",
    setupFee: 999, color: "border-purple-400", popular: false,
    benefits: ["Anúncios ilimitados", "Todos os recursos", "Equipe de corretores", "Domínio próprio", "Suporte prioritário"],
    cta: "Falar com consultor",
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
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    supabase.from("platform_settings").select("value").eq("key", "homepage_theme").maybeSingle().then(({ data }) => {
      if (data?.value) setThemeId(data.value);
    });
  }, []);
  const theme = getMarketplaceTheme(themeId);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim() || !password.trim()) {
      toast({ title: "Preencha todos os campos obrigatórios", variant: "destructive" });
      return;
    }
    if (password.length < 6) {
      toast({ title: "A senha deve ter pelo menos 6 caracteres", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: { data: { full_name: fullName.trim(), phone: phone.trim() || undefined } },
      });
      if (authError) throw authError;

      try {
        await supabase.from("crm_contacts").insert({
          full_name: fullName.trim(),
          email: email.trim(),
          phone: phone.trim() || null,
          funnel_stage: "novo",
          notes: "Lead via /anunciar — cadastro de corretor",
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

  return (
    <>
      <Helmet>
        <title>Site Imobiliário Profissional com CRM | Brokers App</title>
        <meta name="description" content="Crie seu site imobiliário profissional com CRM completo, gestão de leads, contratos, stories e muito mais. Comece gratuitamente." />
      </Helmet>

      <div className="min-h-screen bg-[#0a0f1a] text-white overflow-x-hidden">

        <MarketplaceNavbar theme={theme} user={user} showImoveisScroll={false} />

        {/* ═══ HERO ═══ */}
        <section className="relative overflow-hidden pt-14">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 via-transparent to-pink-600/10" />
          <div className="absolute top-20 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[120px]" />
          <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-pink-500/8 rounded-full blur-[100px]" />

          <div className="relative max-w-6xl mx-auto px-4 py-20 md:py-28 grid md:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
              className="space-y-6"
            >
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/15 border border-blue-500/30 text-blue-300 text-xs font-semibold">
                <Rocket className="w-3.5 h-3.5" /> Plataforma para corretores e imobiliárias
              </div>

              <h1 className="font-display text-3xl md:text-4xl lg:text-5xl font-black leading-[1.1]">
                Crie Seu Site Imobiliário Profissional com{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-300">
                  CRM Completo
                </span>
              </h1>

              <p className="text-base md:text-lg text-white/60 max-w-lg leading-relaxed">
                Pare de depender de plataformas como OLX e portais caros.
                Tenha seu próprio site, seus próprios clientes e controle total das suas vendas.
              </p>

              <Button onClick={scrollToForm} size="lg" className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-bold rounded-xl px-8 text-base shadow-lg shadow-blue-500/25">
                Criar Meu Site Agora <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </motion.div>

            {/* Signup Form */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
            >
              <form id="signup-form" onSubmit={handleSignup} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 md:p-8 space-y-4">
                <div className="text-center mb-2">
                  <h2 className="font-display font-bold text-xl">Comece Gratuitamente</h2>
                  <p className="text-white/50 text-sm mt-1">Crie sua conta em menos de 1 minuto</p>
                </div>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                  <input type="text" placeholder="Seu nome completo *" value={fullName} onChange={(e) => setFullName(e.target.value)}
                    className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-white/8 border border-white/15 text-white placeholder:text-white/35 outline-none focus:border-blue-400 transition-colors text-sm" required />
                </div>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                  <input type="email" placeholder="Seu melhor e-mail *" value={email} onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-white/8 border border-white/15 text-white placeholder:text-white/35 outline-none focus:border-blue-400 transition-colors text-sm" required />
                </div>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                  <input type="tel" placeholder="WhatsApp (opcional)" value={phone} onChange={(e) => setPhone(e.target.value)}
                    className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-white/8 border border-white/15 text-white placeholder:text-white/35 outline-none focus:border-blue-400 transition-colors text-sm" />
                </div>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                  <input type="password" placeholder="Crie uma senha (mín. 6 caracteres) *" value={password} onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-white/8 border border-white/15 text-white placeholder:text-white/35 outline-none focus:border-blue-400 transition-colors text-sm" required minLength={6} />
                </div>
                <Button type="submit" disabled={submitting} className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-bold rounded-xl py-3.5 text-sm shadow-lg shadow-blue-500/25">
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  {submitting ? "Criando conta..." : "CRIAR MEU SITE AGORA"}
                  {!submitting && <ArrowRight className="ml-1.5 w-4 h-4" />}
                </Button>
                <p className="text-xs text-white/40 text-center">
                  Já tem uma conta? <Link to="/login" className="text-blue-400 hover:underline">Faça login</Link>
                </p>
              </form>
            </motion.div>
          </div>
        </section>

        {/* ═══ INTRO ═══ */}
        <section className="bg-white/[0.02] border-y border-white/5 py-16 md:py-20">
          <div className="max-w-4xl mx-auto px-4 text-center space-y-4">
            <div className="inline-flex items-center gap-2 text-blue-400 font-semibold text-sm">
              <Rocket className="w-4 h-4" /> Tudo que você precisa em um só lugar
            </div>
            <h2 className="font-display text-2xl md:text-3xl font-black">
              Com nossa plataforma, você cria um site imobiliário completo
            </h2>
            <p className="text-white/50 text-base max-w-2xl mx-auto">
              Ferramentas avançadas para corretores e imobiliárias crescerem de verdade.
            </p>
          </div>
        </section>

        {/* ═══ FEATURES GRID ═══ */}
        <section className="py-16 md:py-24">
          <div className="max-w-6xl mx-auto px-4 grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
                className="bg-white/[0.03] hover:bg-white/[0.06] border border-white/8 hover:border-white/15 rounded-2xl p-6 transition-all group"
              >
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-2xl">{f.emoji}</span>
                  <h3 className="font-display font-bold text-base">{f.title}</h3>
                </div>
                <ul className="space-y-2">
                  {f.items.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm text-white/60">
                      <Check className="w-3.5 h-3.5 text-blue-400 mt-0.5 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ═══ IDEAL FOR ═══ */}
        <section className="bg-gradient-to-br from-blue-600/10 to-pink-600/5 border-y border-white/5 py-16 md:py-20">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <div className="inline-flex items-center gap-2 text-orange-400 font-semibold text-sm mb-4">
              <Flame className="w-4 h-4" /> Ideal para
            </div>
            <div className="flex flex-wrap justify-center gap-3 mt-6">
              {IDEAL_FOR.map((item) => (
                <motion.div
                  key={item}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  className="px-5 py-3 rounded-xl bg-white/5 border border-white/10 text-white/80 text-sm font-medium"
                >
                  {item}
                </motion.div>
              ))}
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mt-12 max-w-xl mx-auto"
            >
              <div className="flex items-center gap-3 mb-3 justify-center">
                <Diamond className="w-5 h-5 text-blue-400" />
                <h3 className="font-display font-bold text-lg">Vantagem Competitiva</h3>
              </div>
              <p className="text-white/50 text-sm leading-relaxed">
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
        <section id="planos" className="py-20 md:py-28">
          <div className="max-w-6xl mx-auto px-4">
            <div className="text-center max-w-2xl mx-auto mb-14">
              <p className="text-blue-400 font-semibold text-sm uppercase tracking-wide mb-3">Planos e preços</p>
              <h2 className="font-display text-3xl md:text-4xl font-black">
                Comece de graça ou escolha seu plano
              </h2>
              <p className="text-white/40 mt-4 text-base">
                Todos os planos incluem 7 dias de teste gratuito
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {PLANS.map((plan, i) => (
                <motion.div
                  key={plan.key}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className={`relative bg-white/[0.04] backdrop-blur rounded-2xl border ${plan.popular ? "border-amber-400/60 ring-1 ring-amber-400/30 shadow-xl shadow-amber-500/10" : "border-white/10"} p-6 flex flex-col`}
                >
                  {plan.popular && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[10px] font-bold uppercase px-4 py-1 rounded-full tracking-wide">
                      Recomendado
                    </span>
                  )}

                  <h3 className="font-display font-bold text-xl">{plan.name}</h3>
                  <p className="text-xs text-white/40 mt-1">{plan.subtitle}</p>

                  <div className="mt-5 mb-4">
                    {plan.price === 0 ? (
                      <p className="text-3xl font-black">Gratuito</p>
                    ) : (
                      <>
                        <p className="text-3xl font-black">
                          {plan.priceLabel}<span className="text-sm font-normal text-white/40">/mês</span>
                        </p>
                        {plan.setupFee && (
                          <p className="text-[11px] text-white/30 mt-1">
                            + R${plan.setupFee.toLocaleString("pt-BR")} de implementação
                          </p>
                        )}
                      </>
                    )}
                  </div>

                  <ul className="space-y-2.5 flex-1 mb-6">
                    {plan.benefits.map((b) => (
                      <li key={b} className="flex items-start gap-2 text-sm text-white/60">
                        <Check className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
                        {b}
                      </li>
                    ))}
                  </ul>

                  <Button
                    onClick={scrollToForm}
                    className={`w-full rounded-xl font-bold ${
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
          </div>
        </section>

        {/* ═══ CTA FINAL ═══ */}
        <section className="bg-gradient-to-br from-blue-600/20 to-cyan-600/10 border-t border-white/5 py-20 md:py-28">
          <div className="max-w-3xl mx-auto px-4 text-center space-y-6">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              <Zap className="w-12 h-12 text-blue-400 mx-auto mb-4" />
              <h2 className="font-display text-3xl md:text-4xl font-black">
                Comece Agora
              </h2>
              <p className="text-white/50 text-lg mt-4 max-w-xl mx-auto">
                Crie seu site imobiliário completo em poucos minutos e comece a gerar leads todos os dias.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center mt-8">
                <Button onClick={scrollToForm} size="lg" className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-bold rounded-xl px-10 text-base shadow-lg shadow-blue-500/25">
                  CRIAR MEU SITE AGORA <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
                <Link to="/login">
                  <Button variant="outline" size="lg" className="rounded-xl border-white/20 text-white hover:bg-white/10 px-8 text-base font-semibold">
                    Já tenho conta
                  </Button>
                </Link>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-black/30 border-t border-white/5 py-8">
          <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-white/30">
            <p>© {new Date().getFullYear()} Brokers App. Todos os direitos reservados.</p>
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
