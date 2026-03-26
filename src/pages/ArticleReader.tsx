import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Clock, BookOpen } from "lucide-react";
import { articles } from "@/data/articles";
import ReactMarkdown from "react-markdown";

export default function ArticleReader() {
  const { slug } = useParams();
  const article = articles.find((a) => a.slug === slug);

  if (!article) {
    return (
      <div className="min-h-screen bg-[hsl(212,100%,8%)] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-white text-2xl font-bold mb-4">Artigo não encontrado</h1>
          <Link to="/painel/estudo" className="text-primary hover:underline">Voltar ao Material de Estudo</Link>
        </div>
      </div>
    );
  }

  // Remove [IMG] markers from content
  const cleanContent = article.content.replace(/\[IMG\d+\]/g, "");

  return (
    <div className="min-h-screen bg-[hsl(212,100%,8%)]">
      {/* Hero */}
      <div className="relative h-[50vh] md:h-[60vh] overflow-hidden">
        <img src={article.cover} alt={article.title} className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-[hsl(212,100%,8%)] via-[hsl(212,100%,8%)]/70 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 pb-12">
          <div className="container max-w-3xl mx-auto px-4">
            <Link to="/painel/estudo" className="inline-flex items-center gap-2 text-white/60 hover:text-white text-sm mb-6 transition-colors">
              <ArrowLeft size={16} /> Voltar
            </Link>
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/20 text-accent text-xs font-bold uppercase tracking-wider mb-4">
              <BookOpen size={12} /> {article.category}
            </span>
            <h1 className="font-display font-black text-3xl md:text-5xl text-white leading-tight mb-4">{article.title}</h1>
            <div className="flex items-center gap-4 text-white/50 text-sm">
              <span className="flex items-center gap-1"><Clock size={14} /> {article.readTime} de leitura</span>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container max-w-3xl mx-auto px-4 py-12">
        <div className="prose prose-invert prose-lg max-w-none
          prose-headings:font-display prose-headings:text-white
          prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-4 prose-h2:border-b prose-h2:border-white/10 prose-h2:pb-3
          prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-3
          prose-p:text-white/70 prose-p:leading-relaxed
          prose-li:text-white/70
          prose-strong:text-white
          prose-a:text-primary prose-a:no-underline hover:prose-a:underline
        ">
          <ReactMarkdown>{cleanContent}</ReactMarkdown>
        </div>

        <div className="mt-16 pt-8 border-t border-white/10">
          <Link to="/painel/estudo" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 transition-all">
            <ArrowLeft size={16} /> Ver Todos os Artigos
          </Link>
        </div>
      </div>
    </div>
  );
}
