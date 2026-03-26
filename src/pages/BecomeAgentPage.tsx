import { motion } from "framer-motion";
import { Link } from "react-router-dom";
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
  DollarSign,
  MapPin,
  Clock,
  CheckCircle2,
  GraduationCap,
  Building2,
} from "lucide-react";
import heroImg from "@/assets/hero-corretor.jpg";

const fadeIn = {
  hidden: { opacity: 0 },
  visible: (i: number) => ({
    opacity: 1,
    transition: { delay: i * 0.08, duration: 0.5 },
  }),
};

interface CardItem {
  icon: React.ElementType;
  title: string;
  description: string;
  accent?: boolean;
}

function HorizontalRow({
  title,
  subtitle,
  items,
}: {
  title: string;
  subtitle?: string;
  items: CardItem[];
}) {
  return (
    <section className="py-10">
      <div className="container max-w-6xl mx-auto px-4 mb-6">
        <h2 className="font-display font-bold text-2xl md:text-3xl text-white">
          {title}
        </h2>
        {subtitle && (
          <p className="text-white/50 mt-1 text-sm md:text-base">{subtitle}</p>
        )}
      </div>
      <div className="flex gap-4 overflow-x-auto px-4 md:px-[calc((100%-72rem)/2+1rem)] py-4 scrollbar-hide snap-x snap-mandatory">
        {items.map((item, i) => (
          <motion.div
            key={item.title}
            custom={i}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeIn}
            className={`min-w-[280px] md:min-w-[320px] snap-start rounded-2xl p-6 border transition-all hover:scale-[1.03] hover:shadow-2xl cursor-default ${
              item.accent
                ? "bg-gradient-to-br from-accent/20 to-accent/5 border-accent/30"
                : "bg-white/5 border-white/10 hover:border-primary/40"
            }`}
          >
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${
                item.accent
                  ? "bg-accent/20 text-accent"
                  : "bg-primary/20 text-primary"
              }`}
            >
              <item.icon size={24} />
            </div>
            <h3 className="font-display font-bold text-lg text-white mb-2">
              {item.title}
            </h3>
            <p className="text-white/60 text-sm leading-relaxed">
              {item.description}
            </p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

const whyItems: CardItem[] = [
  {
    icon: DollarSign,
    title: "Renda Ilimitada",
    description:
      "Sem teto salarial. Quanto mais você vende, mais você ganha. Comissões de 5% a 6% sobre cada venda.",
    accent: true,
  },
  {
    icon: Clock,
    title: "Flexibilidade Total",
    description:
      "Defina seus próprios horários. Trabalhe de casa, do escritório ou diretamente nos imóveis.",
  },
  {
    icon: TrendingUp,
    title: "Mercado em Alta",
    description:
      "O mercado imobiliário do ES cresceu 18% em 2025. Demanda por profissionais qualificados só aumenta.",
  },
  {
    icon: Users,
    title: "Networking Poderoso",
    description:
      "Conecte-se com construtoras, investidores e compradores. Amplie sua rede de contatos profissionais.",
  },
  {
    icon: MapPin,
    title: "Atuação Local",
    description:
      "Conheça cada bairro, cada oportunidade. Torne-se referência na sua cidade no Espírito Santo.",
  },
];

const stepsItems: CardItem[] = [
  {
    icon: GraduationCap,
    title: "1. Curso TTI",
    description:
      "Faça o curso de Técnico em Transações Imobiliárias (TTI) em uma escola credenciada. Duração média de 6 a 12 meses.",
    accent: true,
  },
  {
    icon: BookOpen,
    title: "2. Estágio Obrigatório",
    description:
      "Complete o estágio supervisionado em uma imobiliária para adquirir experiência prática no mercado.",
  },
  {
    icon: ShieldCheck,
    title: "3. Registro no CRECI",
    description:
      "Solicite seu registro no CRECI-ES. Com ele, você está habilitado a exercer a profissão legalmente.",
  },
  {
    icon: Briefcase,
    title: "4. Comece a Atuar",
    description:
      "Cadastre-se no ES Corretores, crie seu perfil profissional e comece a anunciar e vender imóveis.",
  },
];

const skillsItems: CardItem[] = [
  {
    icon: Target,
    title: "Negociação",
    description:
      "Domine a arte da negociação. Saber ouvir, argumentar e fechar acordos é essencial.",
  },
  {
    icon: Lightbulb,
    title: "Marketing Digital",
    description:
      "Aprenda a usar redes sociais, portais e plataformas como o ES Corretores para atrair clientes.",
    accent: true,
  },
  {
    icon: Star,
    title: "Conhecimento Jurídico",
    description:
      "Entenda contratos, documentação e legislação imobiliária para transmitir segurança ao cliente.",
  },
  {
    icon: Award,
    title: "Atendimento Premium",
    description:
      "Ofereça uma experiência personalizada. O cliente satisfeito é sua melhor propaganda.",
  },
  {
    icon: Building2,
    title: "Avaliação de Imóveis",
    description:
      "Saiba precificar imóveis com base em localização, estado de conservação e tendências de mercado.",
  },
];

const benefitsItems: CardItem[] = [
  {
    icon: CheckCircle2,
    title: "Perfil Profissional",
    description:
      "Tenha sua loja virtual no ES Corretores com logo, dados de contato e portfólio de imóveis.",
    accent: true,
  },
  {
    icon: TrendingUp,
    title: "Visibilidade no ES",
    description:
      "Alcance compradores em todas as cidades do Espírito Santo através da nossa plataforma.",
  },
  {
    icon: Star,
    title: "Selo de Verificação",
    description:
      "Perfis com CRECI verificado recebem selo de confiança, aumentando a credibilidade.",
  },
  {
    icon: Award,
    title: "Planos Acessíveis",
    description:
      "Comece grátis e evolua conforme cresce. Planos a partir de R$ 0 com até 3 anúncios.",
  },
];

export default function BecomeAgentPage() {
  return (
    <div className="min-h-screen bg-[hsl(212,100%,8%)]">
      {/* Hero Banner */}
      <div className="relative h-[70vh] md:h-[80vh] overflow-hidden">
        <img
          src={heroImg}
          alt="Torne-se um Corretor de Imóveis"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[hsl(212,100%,8%)] via-[hsl(212,100%,8%)]/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[hsl(212,100%,8%)]/80 to-transparent" />

        <div className="absolute bottom-0 left-0 right-0 pb-16 md:pb-24">
          <div className="container max-w-6xl mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent/20 text-accent text-xs font-bold uppercase tracking-wider mb-6">
                <Award size={14} /> Carreira no Mercado Imobiliário
              </span>
              <h1 className="font-display font-black text-4xl md:text-6xl lg:text-7xl text-white leading-[1.1] mb-4">
                Torne-se um
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">
                  Corretor de Imóveis
                </span>
              </h1>
              <p className="text-white/60 text-lg md:text-xl max-w-2xl mb-8">
                Descubra como iniciar uma carreira de sucesso no mercado
                imobiliário do Espírito Santo. Liberdade financeira, flexibilidade
                e crescimento profissional.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link
                  to="/anunciar"
                  className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-accent text-accent-foreground font-bold text-sm hover:bg-accent/90 transition-all shadow-lg shadow-accent/20"
                >
                  Começar Agora <ArrowRight size={16} />
                </Link>
                <a
                  href="#passos"
                  className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-white/10 text-white font-bold text-sm hover:bg-white/20 transition-all border border-white/10"
                >
                  Como Funciona
                </a>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Scrollable Sections */}
      <HorizontalRow
        title="Por que ser Corretor?"
        subtitle="Vantagens da profissão que mais cresce no ES"
        items={whyItems}
      />

      <div id="passos">
        <HorizontalRow
          title="Passo a Passo"
          subtitle="Como tirar seu CRECI e começar a atuar"
          items={stepsItems}
        />
      </div>

      <HorizontalRow
        title="Habilidades Essenciais"
        subtitle="O que diferencia um corretor de sucesso"
        items={skillsItems}
      />

      <HorizontalRow
        title="Vantagens no ES Corretores"
        subtitle="Por que anunciar na nossa plataforma"
        items={benefitsItems}
      />

      {/* CTA Final */}
      <section className="py-20">
        <div className="container max-w-4xl mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="bg-gradient-to-br from-primary/20 via-white/5 to-accent/20 rounded-3xl p-10 md:p-16 border border-white/10"
          >
            <h2 className="font-display font-bold text-3xl md:text-4xl text-white mb-4">
              Pronto para começar sua{" "}
              <span className="text-accent">carreira</span>?
            </h2>
            <p className="text-white/60 mb-8 max-w-lg mx-auto">
              Crie sua conta gratuita no ES Corretores e comece a construir seu
              portfólio de imóveis hoje mesmo.
            </p>
            <Link
              to="/anunciar"
              className="inline-flex items-center gap-2 px-10 py-4 rounded-xl bg-accent text-accent-foreground font-bold hover:bg-accent/90 transition-all shadow-lg shadow-accent/20"
            >
              Criar Conta Grátis <ArrowRight size={16} />
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
