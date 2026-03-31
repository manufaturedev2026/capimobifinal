import { useState } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { Search, Clock, BookOpen, ArrowRight } from "lucide-react";

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
    title: "Como Comprar Seu Primeiro Imóvel no ES",
    description: "Guia completo para quem quer realizar o sonho da casa própria no Espírito Santo, desde o planejamento até a entrega das chaves.",
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
    description: "Lista completa de todos os documentos necessários para comprar um imóvel com segurança no Espírito Santo.",
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

  const filtered = blogArticles.filter(a => {
    const matchesSearch = !searchQuery || a.title.toLowerCase().includes(searchQuery.toLowerCase()) || a.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = activeCategory === "Todos" || a.category === activeCategory;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="min-h-screen bg-secondary/50">
      <Helmet>
        <title>Blog | ES Corretores - Dicas e Notícias do Mercado Imobiliário</title>
        <meta name="description" content="Blog sobre mercado imobiliário do Espírito Santo. Dicas de compra, investimento, decoração e tendências." />
      </Helmet>

      {/* Hero */}
      <section className="relative bg-gradient-to-r from-primary to-primary/80 py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="font-display font-bold text-3xl md:text-5xl text-primary-foreground">Blog Imobiliário</h1>
          <p className="text-primary-foreground/80 mt-3 text-sm md:text-lg">Dicas, tendências e guias do mercado imobiliário do Espírito Santo</p>
          <div className="mt-6 max-w-xl mx-auto flex bg-card rounded-2xl shadow-xl overflow-hidden">
            <div className="flex-1 flex items-center px-4 gap-3">
              <Search size={20} className="text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Buscar artigos..."
                className="w-full py-3 bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none text-sm"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="px-4 md:px-8 mt-6">
        <div className="max-w-6xl mx-auto flex gap-2 overflow-x-auto scrollbar-hide pb-1">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${
                activeCategory === cat ? "bg-primary text-primary-foreground" : "bg-card border border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </section>

      {/* Articles Grid */}
      <section className="px-4 md:px-8 mt-6 pb-12">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((article, i) => (
            <motion.div
              key={article.slug}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Link to={`/blog/${article.slug}`} className="group block bg-card border border-border rounded-2xl overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                <div className="relative aspect-[16/9] overflow-hidden">
                  <img src={article.cover} alt={article.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
                  <span className="absolute top-3 left-3 px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs font-bold">{article.category}</span>
                </div>
                <div className="p-5">
                  <h2 className="font-display font-bold text-lg text-foreground line-clamp-2 group-hover:text-primary transition-colors">{article.title}</h2>
                  <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{article.description}</p>
                  <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Clock size={12} />{article.readTime}</span>
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
      </section>
    </div>
  );
}
