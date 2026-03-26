import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { BookOpen, Clock, ArrowRight, ArrowLeft } from "lucide-react";
import { articles } from "@/data/articles";

const categories = ["Todos", ...Array.from(new Set(articles.map((a) => a.category)))];

export default function StudyMaterial() {
  const [activeCategory, setActiveCategory] = useState("Todos");
  const filtered = activeCategory === "Todos" ? articles : articles.filter((a) => a.category === activeCategory);
  const hero = articles[0];

  return (
    <div className="min-h-screen bg-[hsl(212,100%,8%)]">
      {/* Hero */}
      <div className="relative h-[60vh] md:h-[70vh] overflow-hidden">
        <img src={hero.cover} alt={hero.title} className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-[hsl(212,100%,8%)] via-[hsl(212,100%,8%)]/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[hsl(212,100%,8%)]/80 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 pb-12 md:pb-20">
          <div className="container max-w-6xl mx-auto px-4">
            <Link to="/painel" className="inline-flex items-center gap-2 text-white/60 hover:text-white text-sm mb-6 transition-colors">
              <ArrowLeft size={16} /> Voltar ao Painel
            </Link>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/20 text-accent text-xs font-bold uppercase tracking-wider mb-4">
                <BookOpen size={12} /> {hero.category}
              </span>
              <h1 className="font-display font-black text-3xl md:text-5xl text-white leading-tight mb-3 max-w-2xl">{hero.title}</h1>
              <p className="text-white/60 max-w-xl mb-6">{hero.description}</p>
              <Link to={`/painel/estudo/${hero.slug}`} className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-accent text-accent-foreground font-bold text-sm hover:bg-accent/90 transition-all">
                Ler Artigo <ArrowRight size={16} />
              </Link>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Categories */}
      <div className="container max-w-6xl mx-auto px-4 py-6">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {categories.map((cat) => (
            <button key={cat} onClick={() => setActiveCategory(cat)} className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${activeCategory === cat ? "bg-primary text-primary-foreground" : "bg-white/10 text-white/60 hover:bg-white/20"}`}>
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="container max-w-6xl mx-auto px-4 pb-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((article, i) => (
            <motion.div key={article.slug} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}>
              <Link to={`/painel/estudo/${article.slug}`} className="group block rounded-2xl overflow-hidden bg-white/5 border border-white/10 hover:border-primary/40 transition-all hover:shadow-xl">
                <div className="relative aspect-video overflow-hidden">
                  <img src={article.cover} alt={article.title} loading="lazy" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <span className="absolute top-3 left-3 px-2 py-1 rounded-lg bg-primary/80 text-white text-xs font-bold">{article.category}</span>
                </div>
                <div className="p-5">
                  <h3 className="font-display font-bold text-white text-lg mb-2 group-hover:text-primary transition-colors line-clamp-2">{article.title}</h3>
                  <p className="text-white/50 text-sm line-clamp-2 mb-3">{article.description}</p>
                  <div className="flex items-center gap-2 text-white/40 text-xs">
                    <Clock size={12} /> {article.readTime} de leitura
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
