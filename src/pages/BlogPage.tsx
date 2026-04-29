import { useState } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { Search, Clock, BookOpen, ArrowRight } from "lucide-react";
import { SITE_URL } from "@/lib/siteUrl";
import { useSiteSettings } from "@/hooks/useSiteSettings";

interface BlogArticle {
  slug: string;
  title: string;
  description: string;
  cover: string;
  category: string;
  readTime: string;
  date: string;
}

const blogArticles: BlogArticle[] = [
  {
    slug: "como-comprar-primeiro-imovel",
    title: "Como Comprar Seu Primeiro Imóvel",
    description: "Guia completo para quem quer realizar o sonho da casa própria, desde o planejamento até a entrega das chaves.",
    cover: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&h=400&fit=crop",
    category: "Guias",
    readTime: "8 min",
    date: "2026-03-25",
  },
  {
    slug: "bairros-mais-valorizados-vitoria",
    title: "Os 10 Bairros Mais Valorizados de Vitória em 2026",
    description: "Descubra quais bairros da capital capixaba tiveram maior valorização e por que investir nessas regiões.",
    cover: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&h=400&fit=crop",
    category: "Investimento",
    readTime: "6 min",
    date: "2026-03-20",
  },
  {
    slug: "financiamento-imobiliario-guia",
    title: "Financiamento Imobiliário: Tudo o Que Você Precisa Saber",
    description: "Taxas de juros, simulações, documentação necessária e dicas para conseguir a melhor aprovação de crédito.",
    cover: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800&h=400&fit=crop",
    category: "Finanças",
    readTime: "10 min",
    date: "2026-03-15",
  },
  {
    slug: "decoracao-apartamento-pequeno",
    title: "Dicas de Decoração para Apartamentos Pequenos",
    description: "Maximize o espaço do seu apartamento com técnicas de decoração inteligente e móveis multifuncionais.",
    cover: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&h=400&fit=crop",
    category: "Decoração",
    readTime: "5 min",
    date: "2026-03-10",
  },
  {
    slug: "mercado-imobiliario-es-2026",
    title: "Tendências do Mercado Imobiliário do ES em 2026",
    description: "Análise das principais tendências e oportunidades do mercado imobiliário capixaba para este ano.",
    cover: "https://images.unsplash.com/photo-1460317442991-0ec209397118?w=800&h=400&fit=crop",
    category: "Mercado",
    readTime: "7 min",
    date: "2026-03-05",
  },
  {
    slug: "documentacao-compra-imovel",
    title: "Documentação para Compra de Imóvel: Checklist Completo",
    description: "Lista completa de todos os documentos necessários para comprar um imóvel com segurança no Brasil.",
    cover: "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=800&h=400&fit=crop",
    category: "Legal",
    readTime: "6 min",
    date: "2026-02-28",
  },
];

const categories = ["Todos", "Guias", "Investimento", "Finanças", "Decoração", "Mercado", "Legal"];

export default function BlogPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("Todos");
  const { site_name } = useSiteSettings();

  const filtered = blogArticles.filter((a) => {
    const matchesSearch =
      !searchQuery ||
      a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = activeCategory === "Todos" || a.category === activeCategory;
    return matchesSearch && matchesCat;
  });

  const hero = blogArticles[0];

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Blog | {site_name} - Dicas e Notícias do Mercado Imobiliário</title>
        <meta
          name="description"
          content="Blog sobre mercado imobiliário no Brasil. Dicas de compra, investimento, decoração e tendências."
        />
        <link rel="canonical" href={`${SITE_URL}/blog`} />
        <meta property="og:title" content={`Blog | ${site_name}`} />
        <meta property="og:description" content="Blog sobre mercado imobiliário no Brasil. Dicas de compra, investimento, decoração e tendências." />
        <meta property="og:url" content={`${SITE_URL}/blog`} />
      </Helmet>

      {/* Hero - Netflix style */}
      <div className="relative h-[55vh] md:h-[70vh] overflow-hidden">
        <img
          src={hero.cover}
          alt={hero.title}
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/80 to-transparent" />

        <div className="absolute bottom-0 left-0 right-0 pb-10 md:pb-16">
          <div className="container max-w-6xl mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/20 text-accent text-xs font-bold uppercase tracking-wider mb-4">
                <BookOpen size={12} /> {hero.category}
              </span>
              <h1 className="font-display font-black text-3xl md:text-5xl text-foreground leading-tight mb-3 max-w-2xl">
                {hero.title}
              </h1>
              <p className="text-muted-foreground max-w-xl mb-6">{hero.description}</p>

              {/* Search bar */}
              <div className="max-w-md flex bg-card/80 backdrop-blur-sm rounded-2xl border border-border shadow-xl overflow-hidden">
                <div className="flex-1 flex items-center px-4 gap-3">
                  <Search size={18} className="text-muted-foreground" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Buscar artigos..."
                    className="w-full py-3 bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none text-sm"
                  />
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Categories */}
      <div className="container max-w-6xl mx-auto px-4 py-6">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                activeCategory === cat
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Articles Grid */}
      <div className="container max-w-6xl mx-auto px-4 pb-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((article, i) => (
            <motion.div
              key={article.slug}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Link
                to={`/blog/${article.slug}`}
                className="group block rounded-2xl overflow-hidden bg-card border border-border hover:border-primary/40 transition-all hover:shadow-xl hover:-translate-y-1 duration-300"
              >
                <div className="relative aspect-video overflow-hidden">
                  <img
                    src={article.cover}
                    alt={article.title}
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                  <span className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-primary/80 text-primary-foreground text-xs font-bold">
                    {article.category}
                  </span>
                </div>
                <div className="p-5">
                  <h2 className="font-display font-bold text-foreground text-lg mb-2 group-hover:text-primary transition-colors line-clamp-2">
                    {article.title}
                  </h2>
                  <p className="text-muted-foreground text-sm line-clamp-2 mb-3">
                    {article.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock size={12} /> {article.readTime}
                      </span>
                      <span>{new Date(article.date).toLocaleDateString("pt-BR")}</span>
                    </div>
                    <span className="text-primary text-sm font-semibold flex items-center gap-1 group-hover:gap-2 transition-all">
                      Ler <ArrowRight size={14} />
                    </span>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
        {filtered.length === 0 && (
          <p className="text-center text-muted-foreground py-16">Nenhum artigo encontrado</p>
        )}
      </div>
    </div>
  );
}
