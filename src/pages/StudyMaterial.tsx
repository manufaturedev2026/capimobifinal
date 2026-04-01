import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { BookOpen, Clock, ArrowRight, ArrowLeft, GraduationCap } from "lucide-react";
import { articles } from "@/data/articles";

const categories = ["Todos", ...Array.from(new Set(articles.map((a) => a.category)))];

export default function StudyMaterial() {
  const [activeCategory, setActiveCategory] = useState("Todos");
  const filtered = activeCategory === "Todos" ? articles : articles.filter((a) => a.category === activeCategory);
  const hero = articles[0];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <div className="relative h-[55vh] md:h-[70vh] overflow-hidden">
        <img src={hero.cover} alt={hero.title} className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/80 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 pb-10 md:pb-16">
          <div className="container max-w-6xl mx-auto px-4">
            <Link to="/painel" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm mb-6 transition-colors">
              <ArrowLeft size={16} /> Voltar ao Painel
            </Link>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/20 text-accent text-xs font-bold uppercase tracking-wider mb-4">
                <GraduationCap size={12} /> Tutoriais
              </span>
              <h1 className="font-display font-black text-3xl md:text-5xl text-foreground leading-tight mb-3 max-w-2xl">{hero.title}</h1>
              <p className="text-muted-foreground max-w-xl mb-6">{hero.description}</p>
              <Link to={`/painel/estudo/${hero.slug}`} className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-accent text-accent-foreground font-bold text-sm hover:bg-accent/90 transition-all">
                Começar <ArrowRight size={16} />
              </Link>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Categories */}
      <div className="container max-w-6xl mx-auto px-4 py-6">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {categories.map((cat) => (
            <button key={cat} onClick={() => setActiveCategory(cat)} className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${activeCategory === cat ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"}`}>
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="container max-w-6xl mx-auto px-4 pb-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((article, i) => (
            <motion.div key={article.slug} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Link to={`/painel/estudo/${article.slug}`} className="group block rounded-2xl overflow-hidden bg-card border border-border hover:border-primary/40 transition-all hover:shadow-xl hover:-translate-y-1 duration-300">
                <div className="relative aspect-video overflow-hidden">
                  <img src={article.cover} alt={article.title} loading="lazy" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                  <span className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-primary/80 text-primary-foreground text-xs font-bold">{article.category}</span>
                </div>
                <div className="p-5">
                  <h3 className="font-display font-bold text-foreground text-lg mb-2 group-hover:text-primary transition-colors line-clamp-2">{article.title}</h3>
                  <p className="text-muted-foreground text-sm line-clamp-2 mb-3">{article.description}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-muted-foreground text-xs">
                      <Clock size={12} /> {article.readTime} de leitura
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
      </div>
    </div>
  );
}
