/* Updated images v2 */
import { useEffect, useRef, useState } from "react";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { Link } from "react-router-dom";
import { motion, useInView } from "framer-motion";
import {
  Award,
  TrendingUp,
  Users,
  BookOpen,
  ShieldCheck,
  Briefcase,
  ArrowRight,
  Star,
  Target,
  Lightbulb,
  Sparkles,
  DollarSign,
  MapPin,
  Clock,
  CheckCircle2,
  GraduationCap,
  Building2,
  Quote,
  ChevronDown,
  Zap,
  Phone,
  MessageCircle,
} from "lucide-react";
import heroImg from "@/assets/hero-corretor-epic.jpg";
import lojaNetflixImg from "@/assets/loja-netflix-mockup.jpg";
import successImg from "@/assets/corretor-success.jpg";
import teamImg from "@/assets/corretor-team.jpg";

/* ─── Animated Counter ─── */
function AnimatedNumber({ target, suffix = "" }: { target: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!isInView) return;
    let start = 0;
    const duration = 2000;
    const step = target / (duration / 16);
    const interval = setInterval(() => {
      start += step;
      if (start >= target) {
        setValue(target);
        clearInterval(interval);
      } else {
        setValue(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(interval);
  }, [isInView, target]);

  return (
    <span ref={ref} className="tabular-nums">
      {value.toLocaleString("pt-BR")}
      {suffix}
    </span>
  );
}

/* ─── Animations ─── */
const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.6 } as const,
  }),
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.6 } },
};

/* ─── Data ─── */
const stats = [
  { value: 25, suffix: "%", label: "Crescimento do mercado ES em 2025" },
  { value: 500, suffix: "+", label: "Corretores cadastrados" },
  { value: 15000, suffix: "", label: "Reais de comissão média por venda" },
  { value: 78, suffix: "", label: "Cidades atendidas no ES" },
];

const whyItems = [
  {
    icon: DollarSign,
    title: "Renda Ilimitada",
    description: "Sem teto salarial. Comissões de 5% a 6% sobre cada venda. Um imóvel de R$ 500 mil gera R$ 25 mil em comissão.",
    accent: true,
  },
  {
    icon: Clock,
    title: "Flexibilidade Total",
    description: "Defina seus próprios horários. Trabalhe de qualquer lugar: casa, escritório ou diretamente nos imóveis.",
  },
  {
    icon: TrendingUp,
    title: "Mercado em Alta",
    description: "O mercado imobiliário do ES cresceu 18% em 2025. A demanda por profissionais qualificados só aumenta.",
  },
  {
    icon: Users,
    title: "Networking Poderoso",
    description: "Conecte-se com construtoras, investidores e compradores. Amplie sua rede de contatos profissionais.",
  },
  {
    icon: MapPin,
    title: "Atuação Local",
    description: "Conheça cada bairro, cada oportunidade. Torne-se referência na sua cidade em qualquer estado do Brasil.",
  },
  {
    icon: Zap,
    title: "Crescimento Rápido",
    description: "Com dedicação, é possível fazer sua primeira venda em menos de 60 dias e escalar a partir daí.",
  },
];

const steps = [
  {
    icon: GraduationCap,
    title: "Curso TTI",
    description: "Faça o curso de Técnico em Transações Imobiliárias (TTI) em uma escola credenciada. Duração de 6 a 12 meses. Investimento médio acessível, podendo variar de acordo com a modalidade de estudo.",
    detail: "Presencial ou a distância (EAD)",
    detailSub: undefined,
  },
  {
    icon: BookOpen,
    title: "Estágio Obrigatório",
    description: "Temos uma lista de imobiliárias em sua cidade para lhe oferecer o estágio dentro de suas disponibilidades de tempo.",
    detail: "Flexibilidade",
  },
  {
    icon: ShieldCheck,
    title: "Registro no CRECI",
    description: "Taxa — O valor integral de R$ 918,00 reflete o desconto para pagamento antecipado (conforme as normas do CRECI para 2026). Caso você esteja realizando o seu registro profissional ao longo do ano, o cálculo é feito de forma proporcional.",
    detail: "R$ 918,00 (valor integral 2026)",
  },
  {
    icon: Briefcase,
    title: "Comece a Atuar",
    description: "Cadastre-se no {{site}}, crie seu perfil profissional e comece a captar clientes e fechar negócios.",
    detail: "Cadastro gratuito na plataforma",
  },
];

const skills = [
  { icon: Target, title: "Negociação", description: "Domine a arte de ouvir, argumentar e fechar acordos que satisfaçam todas as partes." },
  { icon: Lightbulb, title: "Marketing Digital", description: "Aprenda a usar redes sociais, portais e o {{site}} para atrair clientes qualificados.", accent: true },
  { icon: Star, title: "Conhecimento Jurídico", description: "Entenda contratos, documentação e legislação para transmitir segurança ao cliente." },
  { icon: Award, title: "Atendimento Premium", description: "Ofereça uma experiência personalizada. O cliente satisfeito indica 3 novos." },
  { icon: Building2, title: "Avaliação de Imóveis", description: "Saiba precificar com base em localização, conservação e tendências de mercado." },
  { icon: MessageCircle, title: "Comunicação", description: "Desenvolva comunicação clara e persuasiva para conquistar a confiança dos clientes." },
];

const testimonials = [
  {
    name: "Marcos Oliveira",
    role: "Corretor há 3 anos • Vitória",
    text: "Comecei do zero e hoje faturo mais de R$ 20 mil por mês. O {{site}} me deu visibilidade que eu não teria sozinho.",
    stars: 5,
  },
  {
    name: "Ana Carolina Silva",
    role: "Corretora há 2 anos • Vila Velha",
    text: "Larguei meu emprego CLT e nunca me arrependi. A liberdade de horário e a renda variável me motivam todos os dias. Já vendi mais de 40 imóveis pela plataforma.",
    stars: 5,
  },
  {
    name: "Roberto Santos",
    role: "Corretor há 5 anos • Serra",
    text: "O curso TTI mudou minha vida. Hoje tenho minha própria imobiliária e uma equipe de 8 corretores. Tudo começou com o primeiro passo.",
    stars: 5,
  },
];

const faqs = [
  {
    q: "Preciso ter faculdade para ser corretor?",
    a: "Não! Basta concluir o curso TTI (Técnico em Transações Imobiliárias), que é de nível médio, e obter o registro no CRECI.",
  },
  {
    q: "Quanto tempo leva para começar a ganhar dinheiro?",
    a: "Depende da dedicação, mas muitos corretores fazem sua primeira venda entre 30 e 90 dias após o início da atuação.",
  },
  {
    q: "Qual o investimento inicial?",
    a: "O curso TTI possui investimento médio acessível, variando conforme a modalidade (presencial ou EAD). O registro no CRECI custa cerca de R$ 600.",
  },
  {
    q: "Posso trabalhar como corretor e manter outro emprego?",
    a: "Sim! Muitos corretores começam atuando nos finais de semana e horários livres. A flexibilidade é uma das maiores vantagens.",
  },
  {
    q: "O {{site}} cobra para anunciar?",
    a: "O cadastro é gratuito com até 5 anúncios. Temos planos premium para quem deseja mais visibilidade e recursos.",
  },
];

const incomeComparison = [
  { role: "Emprego CLT médio", value: "R$ 2.500/mês", bar: 15 },
  { role: "Corretor iniciante", value: "R$ 5.000/mês", bar: 30 },
  { role: "Corretor intermediário", value: "R$ 12.000/mês", bar: 60 },
  { role: "Corretor top performer", value: "R$ 30.000+/mês", bar: 100 },
];

const whatsappUrl =
  "https://wa.me/5527999894321?text=Ol%C3%A1%20Jo%C3%A3o%20Paulo%20!%20tudo%20bem%20%3F%20eu%20vim%20pelo%20site%20ES%20Corretores%20e%20gostaria%20de%20saber%20mais%20como%20posso%20me%20tornar%20um%20Corretor(a)%20de%20im%C3%B3veis.";

export default function BecomeAgentPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const { site_name } = useSiteSettings();
  const r = (s: string) => s.replace(/\{\{site\}\}/gi, site_name);

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* ═══════════ HERO ═══════════ */}
      <div className="relative h-screen min-h-[600px] overflow-hidden">
        <img loading="lazy" decoding="async" src={heroImg} alt="Mercado imobiliário do Brasil" className="absolute inset-0 w-full h-full object-cover" width={1920} height={1080} />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-background/20" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-transparent to-transparent" />

        {/* Animated particles effect */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 rounded-full bg-primary/30"
              style={{ left: `${15 + i * 15}%`, top: `${20 + i * 10}%` }}
              animate={{ y: [0, -30, 0], opacity: [0.2, 0.6, 0.2] }}
              transition={{ duration: 3 + i, repeat: Infinity, ease: "easeInOut" }}
            />
          ))}
        </div>

        <div className="absolute bottom-0 left-0 right-0 pb-16 md:pb-24 lg:pb-32">
          <div className="container max-w-6xl mx-auto px-4">
            <motion.div initial={{ opacity: 0, y: 60 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, ease: "easeOut" }}>
              <motion.span
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-accent/15 text-accent text-xs font-bold uppercase tracking-widest mb-8 border border-accent/20 backdrop-blur-sm"
              >
                <Award size={14} /> Carreira no Mercado Imobiliário do ES
              </motion.span>

              <h1 className="font-display font-black text-5xl md:text-7xl lg:text-8xl leading-[0.95] mb-6">
                Torne-se um
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-primary-foreground to-accent">
                  Corretor de Imóveis
                </span>
              </h1>

              <p className="text-muted-foreground text-lg md:text-xl max-w-2xl mb-10 leading-relaxed">
                Descubra como iniciar uma carreira de sucesso no mercado imobiliário
                brasileiro. Liberdade financeira, flexibilidade e crescimento
                profissional ilimitado.
              </p>

              <div className="flex flex-wrap gap-3">
                <a
                  href="/login?trial=7"
                  className="group inline-flex items-center gap-2 px-5 py-3 md:px-8 md:py-4 rounded-2xl bg-accent text-accent-foreground font-bold text-xs md:text-sm hover:bg-accent/90 transition-all shadow-2xl shadow-accent/30 hover:shadow-accent/50 hover:scale-105"
                >
                  <Sparkles size={16} />
                  <span className="hidden sm:inline">7 Dias Grátis — Cadastre-se</span>
                  <span className="sm:hidden">7 Dias Grátis</span>
                  <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
                </a>
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-3 md:px-8 md:py-4 rounded-2xl bg-secondary text-foreground font-bold text-xs md:text-sm hover:bg-secondary/80 transition-all border border-border backdrop-blur-sm"
                >
                  <Phone size={16} />
                  <span className="hidden sm:inline">Quero Ser Corretor</span>
                  <span className="sm:hidden">WhatsApp</span>
                </a>
                <a
                  href="#por-que"
                  className="inline-flex items-center gap-2 px-5 py-3 md:px-6 md:py-4 rounded-2xl bg-secondary/50 text-muted-foreground font-bold text-xs md:text-sm hover:bg-secondary transition-all border border-border/50"
                >
                  Saiba Mais
                  <ChevronDown size={14} className="animate-bounce" />
                </a>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-6 left-1/2 -translate-x-1/2"
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <div className="w-6 h-10 rounded-full border-2 border-border flex justify-center pt-2">
            <div className="w-1 h-2 rounded-full bg-muted-foreground" />
          </div>
        </motion.div>
      </div>

      {/* ═══════════ STATS BAR ═══════════ */}
      <section className="relative -mt-1 z-10">
        <div className="container max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-secondary/50 backdrop-blur-xl rounded-3xl border border-border p-6 md:p-10">
            {stats.map((stat, i) => (
              <motion.div key={stat.label} custom={i} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-center">
                <div className="font-display font-black text-3xl md:text-4xl lg:text-5xl text-primary">
                  <AnimatedNumber target={stat.value} suffix={stat.suffix} />
                </div>
                <div className="text-muted-foreground text-xs md:text-sm mt-2">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ NETFLIX STORE PREVIEW ═══════════ */}
      <section className="py-20 md:py-28 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent pointer-events-none" />
        <div className="container max-w-6xl mx-auto px-4 relative">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={scaleIn}>
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent/15 text-accent text-xs font-bold uppercase tracking-widest mb-6 border border-accent/20">
                <Sparkles size={14} /> Exclusivo {site_name}
              </span>
              <h2 className="font-display font-black text-4xl md:text-5xl mt-2 mb-5">
                Sua <span className="text-accent">Loja</span> Estilo
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">Netflix</span>
              </h2>
              <p className="text-muted-foreground text-lg leading-relaxed mb-8">
                Cada corretor ganha uma loja personalizada com visual moderno e profissional.
                Seus imóveis exibidos em carrosséis elegantes, stories interativos e modo cinema.
              </p>
              <div className="space-y-4 mb-8">
                {[
                  "Carrosséis de imóveis com fotos em alta qualidade",
                  "Stories interativos com destaque para seus melhores anúncios",
                  "Modo Cinema para apresentação imersiva",
                  "Link exclusivo para compartilhar com clientes",
                  "Painel com estatísticas de visualizações e contatos",
                ].map((benefit, i) => (
                  <motion.div key={i} custom={i} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
                    className="flex items-center gap-3"
                  >
                    <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center shrink-0">
                      <CheckCircle2 size={14} className="text-accent" />
                    </div>
                    <span className="text-muted-foreground text-sm">{benefit}</span>
                  </motion.div>
                ))}
              </div>
              <a
                href="/login?trial=7"
                className="group inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-accent text-accent-foreground font-bold text-sm hover:bg-accent/90 transition-all shadow-2xl shadow-accent/30 hover:shadow-accent/50 hover:scale-105"
              >
                <Sparkles size={16} />
                Começar Grátis por 7 Dias
                <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
              </a>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 60 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="relative"
            >
              {/* Glow behind mockup */}
              <div className="absolute -inset-6 bg-gradient-to-br from-primary/20 via-accent/10 to-primary/20 rounded-[2rem] blur-3xl opacity-60" />
              <div className="relative rounded-2xl overflow-hidden shadow-2xl shadow-primary/20 border border-border">
                <img src={lojaNetflixImg} alt={`Loja estilo Netflix do ${site_name}`} loading="lazy" className="w-full h-auto" width={1440} height={960} />
              </div>
              {/* Floating badge */}
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -bottom-4 -right-4 md:bottom-4 md:right-4 bg-secondary backdrop-blur-xl rounded-2xl p-4 border border-border shadow-xl"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center">
                    <TrendingUp size={20} className="text-accent" />
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Visualizações hoje</div>
                    <div className="font-display font-black text-xl  text-foreground">+247</div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ═══════════ WHY SECTION ═══════════ */}
      <section id="por-que" className="py-20 md:py-32">
        <div className="container max-w-6xl mx-auto px-4">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={scaleIn} className="text-center mb-16">
            <span className="text-accent text-sm font-bold uppercase tracking-widest">Vantagens</span>
            <h2 className="font-display font-black text-4xl md:text-5xl mt-3 mb-4">
              Por que ser <span className="text-primary">Corretor</span>?
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">A profissão que mais cresce no Brasil oferece oportunidades únicas.</p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {whyItems.map((item, i) => (
              <motion.div
                key={item.title}
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                className={`group rounded-2xl p-7 border transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 ${
                  item.accent
                    ? "bg-gradient-to-br from-accent/15 to-accent/5 border-accent/25 hover:border-accent/50"
                    : "bg-secondary/30 border-border hover:border-primary/40 hover:bg-secondary/50"
                }`}
              >
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-5 transition-transform group-hover:scale-110 ${
                  item.accent ? "bg-accent/20 text-accent" : "bg-primary/15 text-primary"
                }`}>
                  <item.icon size={26} />
                </div>
                <h3 className="font-display font-bold text-xl text-foreground mb-2">{item.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{r(item.description)}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ INCOME COMPARISON ═══════════ */}
      <section className="py-20 md:py-28 bg-gradient-to-b from-transparent via-primary/5 to-transparent">
        <div className="container max-w-6xl mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={scaleIn}>
              <span className="text-accent text-sm font-bold uppercase tracking-widest">Potencial de Ganhos</span>
              <h2 className="font-display font-black text-4xl md:text-5xl mt-3 mb-4">
                Quanto ganha um <span className="text-accent">Corretor</span>?
              </h2>
              <p className="text-muted-foreground mb-8">
                Compare o potencial de renda de um corretor de imóveis com um emprego tradicional.
                Os valores são baseados em médias do mercado imobiliário brasileiro.
              </p>
              <div className="space-y-5">
                {incomeComparison.map((item, i) => (
                  <motion.div key={item.role} custom={i} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-foreground/80">{item.role}</span>
                      <span className="font-bold  text-foreground">{item.value}</span>
                    </div>
                    <div className="h-3 rounded-full bg-secondary overflow-hidden">
                      <motion.div
                        className={`h-full rounded-full ${item.bar === 100 ? "bg-gradient-to-r from-primary to-accent" : "bg-primary/60"}`}
                        initial={{ width: 0 }}
                        whileInView={{ width: `${item.bar}%` }}
                        viewport={{ once: true }}
                        transition={{ duration: 1.2, delay: i * 0.15, ease: "easeOut" }}
                      />
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, x: 40 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }}>
              <div className="relative rounded-3xl overflow-hidden shadow-2xl">
                <img src={successImg} alt="Corretor de sucesso" loading="lazy" className="w-full h-[500px] object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-8">
                  <div className="bg-secondary backdrop-blur-xl rounded-2xl p-5 border border-border">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center">
                        <DollarSign size={20} className="text-accent" />
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Comissão em uma venda de R$ 500 mil</div>
                        <div className="font-display font-black text-2xl text-accent">R$ 25.000</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ═══════════ STEPS TIMELINE ═══════════ */}
      <section id="passos" className="py-20 md:py-32">
        <div className="container max-w-6xl mx-auto px-4">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={scaleIn} className="text-center mb-16">
            <span className="text-accent text-sm font-bold uppercase tracking-widest">Passo a Passo</span>
            <h2 className="font-display font-black text-4xl md:text-5xl mt-3 mb-4">
              Como se tornar um <span className="text-primary">Corretor</span>
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">Siga estes 4 passos para iniciar sua carreira no mercado imobiliário.</p>
          </motion.div>

          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-8 md:left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-primary/50 via-accent/50 to-primary/50 hidden md:block" />
            <div className="absolute left-8 top-0 bottom-0 w-px bg-gradient-to-b from-primary/50 via-accent/50 to-primary/50 md:hidden" />

            <div className="space-y-12 md:space-y-16">
              {steps.map((step, i) => (
                <motion.div
                  key={step.title}
                  custom={i}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  variants={fadeUp}
                  className={`flex items-start gap-6 md:gap-0 ${i % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"}`}
                >
                  {/* Content */}
                  <div className={`flex-1 ${i % 2 === 0 ? "md:pr-16 md:text-right" : "md:pl-16"}`}>
                    <div className={`bg-secondary/30 rounded-2xl p-6 md:p-8 border border-border hover:border-primary/30 transition-all hover:shadow-xl ${i % 2 === 0 ? "md:ml-auto" : ""} max-w-lg`}>
                      <div className="flex items-center gap-3 mb-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${i === 0 ? "bg-accent/20 text-accent" : "bg-primary/15 text-primary"} md:hidden`}>
                          <step.icon size={20} />
                        </div>
                        <span className="text-xs font-bold text-primary uppercase tracking-wider">Passo {i + 1}</span>
                      </div>
                      <h3 className="font-display font-bold text-xl text-foreground mb-2">{step.title}</h3>
                      <p className="text-muted-foreground text-sm leading-relaxed mb-3">{r(step.description)}</p>
                      <span className="inline-flex items-center gap-2 text-xs text-accent font-semibold bg-accent/10 px-3 py-1.5 rounded-full">
                        <CheckCircle2 size={12} /> {step.detail}
                      </span>
                      {(step as any).detailSub && (
                        <span className="block text-xs text-muted-foreground mt-1.5 ml-1">
                          {(step as any).detailSub}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Center circle */}
                  <div className="hidden md:flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-primary to-accent shadow-lg shadow-primary/30 shrink-0 z-10 -ml-8 md:ml-0">
                    <step.icon size={24} className=" text-foreground" />
                  </div>

                  {/* Spacer */}
                  <div className="hidden md:block flex-1" />
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ SKILLS ═══════════ */}
      <section className="py-20 md:py-28 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-accent/5 to-transparent pointer-events-none" />
        <div className="container max-w-6xl mx-auto px-4 relative">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div initial={{ opacity: 0, x: -40 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }}>
              <div className="relative rounded-3xl overflow-hidden shadow-2xl">
                <img src={teamImg} alt="Equipe de corretores" loading="lazy" className="w-full h-[450px] object-cover" />
                <div className="absolute inset-0 bg-gradient-to-r from-background/50 to-transparent" />
              </div>
            </motion.div>

            <div>
              <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={scaleIn}>
                <span className="text-accent text-sm font-bold uppercase tracking-widest">Desenvolvimento</span>
                <h2 className="font-display font-black text-4xl md:text-5xl mt-3 mb-4">
                  Habilidades <span className="text-accent">Essenciais</span>
                </h2>
                <p className="text-muted-foreground mb-8">O que diferencia um corretor de sucesso dos demais.</p>
              </motion.div>

              <div className="space-y-4">
                {skills.map((skill, i) => (
                  <motion.div
                    key={skill.title}
                    custom={i}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    variants={fadeUp}
                    className={`flex items-start gap-4 p-4 rounded-xl border transition-all hover:-translate-y-0.5 ${
                      skill.accent
                        ? "bg-accent/10 border-accent/20 hover:border-accent/40"
                        : "bg-secondary/30 border-border hover:border-primary/30"
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${skill.accent ? "bg-accent/20 text-accent" : "bg-primary/15 text-primary"}`}>
                      <skill.icon size={20} />
                    </div>
                    <div>
                      <h3 className="font-display font-bold text-foreground mb-1">{skill.title}</h3>
                      <p className="text-muted-foreground text-sm leading-relaxed">{r(skill.description)}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ TESTIMONIALS ═══════════ */}
      <section className="py-20 md:py-28">
        <div className="container max-w-6xl mx-auto px-4">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={scaleIn} className="text-center mb-16">
            <span className="text-accent text-sm font-bold uppercase tracking-widest">Depoimentos</span>
            <h2 className="font-display font-black text-4xl md:text-5xl mt-3 mb-4">
              Histórias de <span className="text-accent">Sucesso</span>
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">Corretores que transformaram suas vidas no mercado imobiliário do ES.</p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <motion.div
                key={t.name}
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                className="bg-secondary/30 rounded-2xl p-7 border border-border hover:border-primary/30 transition-all hover:shadow-xl relative"
              >
                <Quote size={32} className="text-primary/20 absolute top-5 right-5" />
                <div className="flex gap-1 mb-4">
                  {[...Array(t.stars)].map((_, s) => (
                    <Star key={s} size={16} className="fill-accent text-accent" />
                  ))}
                </div>
                <p className="text-muted-foreground text-sm leading-relaxed mb-6 italic">"{r(t.text)}"</p>
                <div>
                  <div className="font-display font-bold  text-foreground">{t.name}</div>
                  <div className="text-muted-foreground text-xs">{t.role}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ FAQ ═══════════ */}
      <section className="py-20 md:py-28 bg-gradient-to-b from-transparent via-primary/5 to-transparent">
        <div className="container max-w-3xl mx-auto px-4">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={scaleIn} className="text-center mb-12">
            <span className="text-accent text-sm font-bold uppercase tracking-widest">Dúvidas</span>
            <h2 className="font-display font-black text-4xl md:text-5xl mt-3 mb-4">
              Perguntas <span className="text-primary">Frequentes</span>
            </h2>
          </motion.div>

          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <motion.div key={i} custom={i} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full text-left bg-secondary/30 hover:bg-secondary/50 border border-border rounded-2xl p-5 transition-all"
                >
                  <div className="flex items-center justify-between gap-4">
                    <span className="font-display font-bold text-foreground text-sm md:text-base">{r(faq.q)}</span>
                    <ChevronDown
                      size={18}
                      className={`text-muted-foreground shrink-0 transition-transform duration-300 ${openFaq === i ? "rotate-180" : ""}`}
                    />
                  </div>
                  {openFaq === i && (
                    <motion.p
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="text-muted-foreground text-sm mt-3 leading-relaxed"
                    >
                      {r(faq.a)}
                    </motion.p>
                  )}
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ FINAL CTA ═══════════ */}
      <section className="py-20 md:py-28">
        <div className="container max-w-5xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="relative rounded-[2rem] overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-card to-accent/30" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,hsl(var(--primary)/0.2),transparent_60%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,hsl(var(--accent)/0.15),transparent_50%)]" />
            <div className="absolute inset-0 border border-border rounded-[2rem]" />

            <div className="relative p-10 md:p-20 text-center">
              <motion.div animate={{ rotate: [0, 5, -5, 0] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}>
                <Award size={56} className="text-accent mx-auto mb-8" />
              </motion.div>

              <h2 className="font-display font-black text-4xl md:text-5xl lg:text-6xl mb-5">
                Pronto para começar sua
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">carreira</span>?
              </h2>
              <p className="text-muted-foreground text-lg mb-10 max-w-lg mx-auto">
                Fale conosco pelo WhatsApp e descubra como se tornar um corretor de
                imóveis de sucesso em todo o Brasil.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <a
                  href="/login?trial=7"
                  className="group inline-flex items-center gap-3 px-10 py-5 rounded-2xl bg-accent text-accent-foreground font-bold text-base hover:bg-accent/90 transition-all shadow-2xl shadow-accent/30 hover:shadow-accent/50 hover:scale-105"
                >
                  <Sparkles size={20} />
                  Cadastre-se e Ganhe 7 Dias Grátis
                  <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
                </a>
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-flex items-center gap-3 px-8 py-4 rounded-2xl bg-secondary text-foreground font-bold text-sm hover:bg-secondary/80 transition-all border border-border backdrop-blur-sm"
                >
                  <MessageCircle size={18} />
                  Falar pelo WhatsApp
                </a>
              </div>

              <p className="text-muted-foreground text-xs mt-6">
                Resposta rápida pelo WhatsApp • Atendimento personalizado
              </p>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
