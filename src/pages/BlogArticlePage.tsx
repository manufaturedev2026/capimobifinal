import { useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { ArrowLeft, Clock, Share2 } from "lucide-react";
import { toast } from "sonner";
import { SITE_URL } from "@/lib/siteUrl";
import { useSiteSettings } from "@/hooks/useSiteSettings";

const blogContent: Record<string, { title: string; category: string; readTime: string; date: string; cover: string; body: string }> = {
  "como-comprar-primeiro-imovel": {
    title: "Como Comprar Seu Primeiro Imóvel",
    category: "Guias", readTime: "8 min", date: "2026-03-25",
    cover: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1200&h=500&fit=crop",
    body: `## Planejamento Financeiro\n\nAntes de tudo, organize suas finanças. Tenha pelo menos 20% do valor do imóvel para entrada e mantenha uma reserva de emergência.\n\n## Escolha da Região\n\nCada região do Brasil tem suas particularidades. Pesquise bem a localidade, infraestrutura e valorização antes de decidir.\n\n## Documentação\n\nReúna seus documentos: RG, CPF, comprovante de renda, extrato bancário dos últimos 3 meses e declaração de IR.\n\n## Financiamento\n\nCompare taxas entre os bancos. A Caixa Econômica costuma oferecer as melhores condições para primeira moradia.\n\n## Vistoria\n\nNunca dispense a vistoria. Verifique instalações elétricas, hidráulicas, acabamentos e estrutura.\n\n## Escritura e Registro\n\nApós a compra, faça a escritura no cartório e registre o imóvel em seu nome. Isso garante sua propriedade legalmente.`,
  },
  "bairros-mais-valorizados-vitoria": {
    title: "Os 10 Bairros Mais Valorizados de Vitória em 2026",
    category: "Investimento", readTime: "6 min", date: "2026-03-20",
    cover: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200&h=500&fit=crop",
    body: `## 1. Enseada do Suá\n\nCom valorização de 15% ao ano, é o bairro mais procurado por investidores.\n\n## 2. Praia do Canto\n\nTradição e infraestrutura completa mantêm os preços em alta.\n\n## 3. Jardim Camburi\n\nO bairro mais populoso cresce com novos empreendimentos de alto padrão.\n\n## 4. Mata da Praia\n\nProximidade com a natureza e segurança são os grandes atrativos.\n\n## 5. Bento Ferreira\n\nLocalização central e tranquilidade residencial.\n\n## 6-10\n\nSanta Lúcia, Jardim da Penha, Ilha do Boi, Praia de Santa Helena e Goiabeiras completam a lista.`,
  },
  "financiamento-imobiliario-guia": {
    title: "Financiamento Imobiliário: Tudo o Que Você Precisa Saber",
    category: "Finanças", readTime: "10 min", date: "2026-03-15",
    cover: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=1200&h=500&fit=crop",
    body: `## Tipos de Financiamento\n\n**SAC (Sistema de Amortização Constante):** Parcelas decrescentes. Ideal para quem pode pagar mais no início.\n\n**PRICE (Tabela Price):** Parcelas fixas. Mais previsibilidade no orçamento.\n\n## Taxas de Juros em 2026\n\nAs taxas variam entre 8% e 12% ao ano. Compare entre Caixa, BB, Bradesco, Itaú e Santander.\n\n## Simulação\n\nSempre faça simulações em pelo menos 3 bancos antes de decidir.\n\n## Dicas para Aprovação\n\n- Mantenha seu nome limpo\n- Comprove renda estável\n- Tenha relacionamento com o banco\n- Use o FGTS quando possível`,
  },
  "decoracao-apartamento-pequeno": {
    title: "Dicas de Decoração para Apartamentos Pequenos",
    category: "Decoração", readTime: "5 min", date: "2026-03-10",
    cover: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=1200&h=500&fit=crop",
    body: `## Móveis Multifuncionais\n\nInvista em sofás-cama, mesas retráteis e camas com gavetas.\n\n## Cores Claras\n\nParedes claras ampliam visualmente o ambiente.\n\n## Espelhos Estratégicos\n\nEspelhos criam a ilusão de profundidade e iluminação.\n\n## Organização Vertical\n\nUse prateleiras altas e nichos para aproveitar o espaço vertical.\n\n## Iluminação\n\nLuz indireta e luminárias de piso criam aconchego sem ocupar espaço.`,
  },
  "mercado-imobiliario-es-2026": {
    title: "Tendências do Mercado Imobiliário do ES em 2026",
    category: "Mercado", readTime: "7 min", date: "2026-03-05",
    cover: "https://images.unsplash.com/photo-1460317442991-0ec209397118?w=1200&h=500&fit=crop",
    body: `## Crescimento Sustentável\n\nO mercado capixaba continua em expansão, com destaque para imóveis de médio padrão.\n\n## Tecnologia\n\nTours virtuais e assinatura digital de contratos são o novo normal.\n\n## Sustentabilidade\n\nEmpreendimentos com certificação verde ganham preferência dos compradores.\n\n## Interior em Alta\n\nCidades como Colatina, Linhares e Cachoeiro crescem no radar dos investidores.\n\n## Home Office\n\nImóveis com espaço para escritório continuam valorizados.`,
  },
  "documentacao-compra-imovel": {
    title: "Documentação para Compra de Imóvel: Checklist Completo",
    category: "Legal", readTime: "6 min", date: "2026-02-28",
    cover: "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=1200&h=500&fit=crop",
    body: `## Documentos do Comprador\n\n- RG e CPF\n- Comprovante de renda\n- Extrato bancário (3 meses)\n- Declaração de Imposto de Renda\n- Certidão de estado civil\n\n## Documentos do Imóvel\n\n- Matrícula atualizada\n- Certidão negativa de ônus\n- IPTU quitado\n- Habite-se\n- Planta aprovada\n\n## Documentos do Vendedor\n\n- Certidões negativas (federal, estadual, municipal)\n- Certidão de ações trabalhistas\n- Comprovante de quitação do condomínio\n\n## Após a Compra\n\n- Escritura pública\n- Registro no cartório de imóveis\n- Transferência de IPTU`,
  },
};

export default function BlogArticlePage() {
  const { slug } = useParams<{ slug: string }>();
  const { site_name } = useSiteSettings();
  const article = slug ? blogContent[slug] : null;

  if (!article) {
    return (
      <div className="min-h-screen bg-secondary/50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="font-display font-bold text-2xl text-foreground">Artigo não encontrado</h1>
          <Link to="/blog" className="text-primary mt-4 inline-block">← Voltar ao blog</Link>
        </div>
      </div>
    );
  }

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Link copiado!");
  };

  return (
    <div className="min-h-screen bg-secondary/50">
      <Helmet>
        <title>{article.title} | Blog Capimobi</title>
        <meta name="description" content={article.body.substring(0, 155)} />
        <link rel="canonical" href={`${SITE_URL}/blog/${slug}`} />
        <meta property="og:title" content={`${article.title} | Blog Capimobi`} />
        <meta property="og:description" content={article.body.substring(0, 155)} />
        <meta property="og:url" content={`${SITE_URL}/blog/${slug}`} />
        <meta property="og:image" content={article.cover} />
      </Helmet>

      <div className="relative h-[300px] md:h-[400px] overflow-hidden">
        <img src={article.cover} alt={article.title} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-12 max-w-4xl mx-auto">
          <span className="px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs font-bold">{article.category}</span>
          <h1 className="font-display font-bold text-2xl md:text-4xl text-white mt-3">{article.title}</h1>
          <div className="flex items-center gap-4 mt-3 text-white/70 text-sm">
            <span className="flex items-center gap-1"><Clock size={14} />{article.readTime}</span>
            <span>{new Date(article.date).toLocaleDateString("pt-BR")}</span>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-8">
          <Link to="/blog" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft size={16} />
            Voltar ao blog
          </Link>
          <button onClick={handleShare} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-card border border-border text-sm text-muted-foreground hover:text-foreground transition-colors">
            <Share2 size={16} />
            Compartilhar
          </button>
        </div>

        <article className="prose prose-lg dark:prose-invert max-w-none">
          {article.body.split("\n\n").map((block, i) => {
            if (block.startsWith("## ")) return <h2 key={i} className="font-display font-bold text-xl text-foreground mt-8 mb-4">{block.replace("## ", "")}</h2>;
            if (block.startsWith("**") && block.endsWith("**")) return <p key={i} className="font-bold text-foreground">{block.replace(/\*\*/g, "")}</p>;
            if (block.startsWith("- ")) return <ul key={i} className="list-disc list-inside space-y-1 text-muted-foreground">{block.split("\n").map((li, j) => <li key={j}>{li.replace("- ", "")}</li>)}</ul>;
            return <p key={i} className="text-muted-foreground leading-relaxed">{block.replace(/\*\*/g, "")}</p>;
          })}
        </article>
      </div>
    </div>
  );
}
