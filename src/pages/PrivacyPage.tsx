import { Helmet } from "react-helmet-async";
import { useSiteSettings } from "@/hooks/useSiteSettings";

const DEFAULT_PRIVACY = `
<section><h2 class="font-display font-bold text-xl mb-3">1. Introdução</h2><p class="text-muted-foreground leading-relaxed">Esta política descreve como coletamos, usamos e protegemos suas informações pessoais quando você utiliza nosso marketplace de imóveis.</p></section>
<section><h2 class="font-display font-bold text-xl mb-3">2. Dados que Coletamos</h2><ul class="list-disc pl-6 text-muted-foreground space-y-1"><li>Nome completo e e-mail ao criar uma conta</li><li>Telefone (opcional) para contato via WhatsApp</li><li>Informações de anúncios publicados</li><li>Dados de navegação (cookies, endereço IP)</li><li>Localização aproximada para exibição de anúncios regionais</li></ul></section>
<section><h2 class="font-display font-bold text-xl mb-3">3. Como Usamos seus Dados</h2><ul class="list-disc pl-6 text-muted-foreground space-y-1"><li>Fornecer e manter nossos serviços</li><li>Permitir publicação e busca de anúncios</li><li>Enviar notificações sobre sua conta</li><li>Melhorar a experiência do usuário</li></ul></section>
<section><h2 class="font-display font-bold text-xl mb-3">4. Compartilhamento de Dados</h2><p class="text-muted-foreground leading-relaxed">Não vendemos seus dados pessoais. Podemos compartilhar informações com provedores de infraestrutura, serviços de análise (de forma anonimizada), e autoridades legais quando exigido por lei.</p></section>
<section><h2 class="font-display font-bold text-xl mb-3">5. Seus Direitos (LGPD)</h2><ul class="list-disc pl-6 text-muted-foreground space-y-1"><li>Acessar seus dados pessoais</li><li>Corrigir dados incompletos ou desatualizados</li><li>Solicitar a exclusão dos seus dados</li><li>Revogar consentimento a qualquer momento</li><li>Solicitar a portabilidade dos dados</li></ul></section>
`;

export default function PrivacyPage() {
  const { site_name, site_privacy_html } = useSiteSettings();
  const content = site_privacy_html || DEFAULT_PRIVACY;

  return (
    <>
      <Helmet>
        <title>Política de Privacidade | {site_name}</title>
        <meta name="description" content={`Política de Privacidade do ${site_name}. Saiba como coletamos, usamos e protegemos seus dados pessoais.`} />
      </Helmet>
      <div className="container max-w-3xl mx-auto px-4 py-12">
        <h1 className="font-display font-bold text-3xl text-foreground mb-8">Política de Privacidade</h1>
        <p className="text-sm text-muted-foreground mb-6">Última atualização: {new Date().toLocaleDateString("pt-BR")}</p>
        <div
          className="prose prose-sm max-w-none text-foreground space-y-6"
          dangerouslySetInnerHTML={{ __html: content }}
        />
      </div>
    </>
  );
}
