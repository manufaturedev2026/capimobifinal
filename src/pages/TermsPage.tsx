import { Helmet } from "react-helmet-async";
import { useSiteSettings } from "@/hooks/useSiteSettings";

const DEFAULT_TERMS = `
<section><h2 class="font-display font-bold text-xl mb-3">1. Aceitação dos Termos</h2><p class="text-muted-foreground leading-relaxed">Ao acessar ou utilizar a plataforma, você concorda com estes Termos de Uso. Caso não concorde, não utilize a plataforma.</p></section>
<section><h2 class="font-display font-bold text-xl mb-3">2. Descrição do Serviço</h2><p class="text-muted-foreground leading-relaxed">A plataforma conecta vendedores e compradores de imóveis em todo o Brasil. Atuamos como intermediários, fornecendo a plataforma para publicação e busca de anúncios.</p></section>
<section><h2 class="font-display font-bold text-xl mb-3">3. Cadastro e Conta</h2><ul class="list-disc pl-6 text-muted-foreground space-y-1"><li>Para anunciar, é necessário criar uma conta com informações verdadeiras</li><li>Você é responsável por manter a segurança de sua conta e senha</li><li>Cada pessoa/empresa pode ter apenas uma conta ativa</li><li>Menores de 18 anos não podem utilizar a plataforma</li></ul></section>
<section><h2 class="font-display font-bold text-xl mb-3">4. Regras de Publicação</h2><ul class="list-disc pl-6 text-muted-foreground space-y-1"><li>Os anúncios devem conter informações verídicas e atualizadas</li><li>É proibido anunciar itens ilegais, roubados ou com restrições judiciais</li><li>Fotos devem ser reais e do produto/imóvel anunciado</li><li>Reservamo-nos o direito de remover anúncios que violem estas regras</li></ul></section>
<section><h2 class="font-display font-bold text-xl mb-3">5. Planos e Pagamentos</h2><ul class="list-disc pl-6 text-muted-foreground space-y-1"><li>A plataforma oferece planos gratuitos e pagos para anunciantes</li><li>Pagamentos são processados conforme acordado com o gerente de conta</li><li>Não há reembolso após a ativação do plano</li></ul></section>
<section><h2 class="font-display font-bold text-xl mb-3">6. Responsabilidades</h2><p class="text-muted-foreground leading-relaxed">A plataforma não se responsabiliza por negociações entre compradores e vendedores, veracidade das informações fornecidas, ou problemas decorrentes de transações financeiras entre as partes.</p></section>
<section><h2 class="font-display font-bold text-xl mb-3">7. Legislação Aplicável</h2><p class="text-muted-foreground leading-relaxed">Estes termos são regidos pelas leis da República Federativa do Brasil, em especial o Código de Defesa do Consumidor, o Marco Civil da Internet e a LGPD.</p></section>
`;

export default function TermsPage() {
  const { site_name, site_terms_html } = useSiteSettings();
  const content = site_terms_html || DEFAULT_TERMS;

  return (
    <>
      <Helmet>
        <title>Termos de Uso | {site_name}</title>
        <meta name="description" content={`Termos de Uso do ${site_name}. Conheça as condições de uso da nossa plataforma.`} />
      </Helmet>
      <div className="container max-w-3xl mx-auto px-4 py-12">
        <h1 className="font-display font-bold text-3xl text-foreground mb-8">Termos de Uso</h1>
        <p className="text-sm text-muted-foreground mb-6">Última atualização: {new Date().toLocaleDateString("pt-BR")}</p>
        <div
          className="prose prose-sm max-w-none text-foreground space-y-6"
          dangerouslySetInnerHTML={{ __html: content }}
        />
      </div>
    </>
  );
}
