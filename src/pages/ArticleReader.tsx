import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Clock, BookOpen } from "lucide-react";
import { articles } from "@/data/articles";
import ReactMarkdown from "react-markdown";

export default function ArticleReader() {
  const { slug } = useParams();
  const article = articles.find((a) => a.slug === slug);

  if (!article) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-foreground text-2xl font-bold mb-4">Tutorial não encontrado</h1>
          <Link to="/painel/estudo" className="text-primary hover:underline">Voltar aos Tutoriais</Link>
        </div>
      </div>
    );
  }

  const cleanContent = article.content.replace(/\[IMG\d+\]/g, "");

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <div className="relative h-[45vh] md:h-[55vh] overflow-hidden">
        <img src={article.cover} alt={article.title} className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 pb-10">
          <div className="container max-w-3xl mx-auto px-4">
            <Link to="/painel/estudo" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm mb-6 transition-colors">
              <ArrowLeft size={16} /> Voltar
            </Link>
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/20 text-accent text-xs font-bold uppercase tracking-wider mb-4">
              <BookOpen size={12} /> {article.category}
            </span>
            <h1 className="font-display font-black text-3xl md:text-5xl text-foreground leading-tight mb-4">{article.title}</h1>
            <div className="flex items-center gap-4 text-muted-foreground text-sm">
              <span className="flex items-center gap-1"><Clock size={14} /> {article.readTime} de leitura</span>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container max-w-3xl mx-auto px-4 py-12">
        <div className="prose prose-lg max-w-none dark:prose-invert
          prose-headings:font-display prose-headings:text-foreground
          prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-4 prose-h2:border-b prose-h2:border-border prose-h2:pb-3
          prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-3
          prose-p:text-foreground/90 prose-p:leading-relaxed
          prose-li:text-foreground/85
          prose-strong:text-foreground
          prose-a:text-primary prose-a:no-underline hover:prose-a:underline
          prose-blockquote:text-muted-foreground prose-blockquote:border-accent
          prose-code:bg-muted prose-code:text-foreground prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded
          prose-table:text-foreground/90
          prose-th:text-foreground prose-th:border-border
          prose-td:border-border
        ">
          <ReactMarkdown>{cleanContent}</ReactMarkdown>
        </div>

        <div className="mt-16 pt-8 border-t border-border">
          <Link to="/painel/estudo" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 transition-all">
            <ArrowLeft size={16} /> Ver Todos os Tutoriais
          </Link>
        </div>
      </div>
    </div>
  );
}
