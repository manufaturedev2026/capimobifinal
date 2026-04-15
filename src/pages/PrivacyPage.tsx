import { Helmet } from "react-helmet-async";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { useAuth } from "@/hooks/useAuth";
import MarketplaceNavbar from "@/components/MarketplaceNavbar";
import FooterSimple from "@/components/FooterSimple";
import { getMarketplaceTheme } from "@/lib/marketplaceThemes";
import { getMarketplaceThemeCssVars } from "@/lib/marketplaceThemeCssVars";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const DEFAULT_PRIVACY = `
<section><h2>1. Introdução</h2><p>Esta política descreve como coletamos, usamos e protegemos suas informações pessoais quando você utiliza nosso marketplace de imóveis.</p></section>
<section><h2>2. Dados que Coletamos</h2><ul><li>Nome completo e e-mail ao criar uma conta</li><li>Telefone (opcional) para contato via WhatsApp</li><li>Informações de anúncios publicados</li><li>Dados de navegação (cookies, endereço IP)</li><li>Localização aproximada para exibição de anúncios regionais</li></ul></section>
<section><h2>3. Como Usamos seus Dados</h2><ul><li>Fornecer e manter nossos serviços</li><li>Permitir publicação e busca de anúncios</li><li>Enviar notificações sobre sua conta</li><li>Melhorar a experiência do usuário</li></ul></section>
<section><h2>4. Compartilhamento de Dados</h2><p>Não vendemos seus dados pessoais. Podemos compartilhar informações com provedores de infraestrutura, serviços de análise (de forma anonimizada), e autoridades legais quando exigido por lei.</p></section>
<section><h2>5. Seus Direitos (LGPD)</h2><ul><li>Acessar seus dados pessoais</li><li>Corrigir dados incompletos ou desatualizados</li><li>Solicitar a exclusão dos seus dados</li><li>Revogar consentimento a qualquer momento</li><li>Solicitar a portabilidade dos dados</li></ul></section>
`;

export default function PrivacyPage() {
  const { site_name, site_privacy_html } = useSiteSettings();
  const { user } = useAuth();
  const content = site_privacy_html || DEFAULT_PRIVACY;

  const [themeId, setThemeId] = useState("midnight");
  useEffect(() => {
    supabase.from("platform_settings").select("value").eq("key", "marketplace_theme").maybeSingle().then(({ data }) => {
      if (data?.value) setThemeId(data.value);
    });
  }, []);
  const theme = getMarketplaceTheme(themeId);
  const themeVars = getMarketplaceThemeCssVars(theme);

  return (
    <div className="min-h-screen flex flex-col" style={{ ...themeVars, background: theme.darkBase, color: theme.text }}>
      <Helmet>
        <title>Política de Privacidade | {site_name}</title>
        <meta name="description" content={`Política de Privacidade do ${site_name}. Saiba como coletamos, usamos e protegemos seus dados pessoais.`} />
      </Helmet>

      <MarketplaceNavbar theme={theme} user={user} showImoveisScroll={false} />

      <main className="flex-1 pt-20 pb-16 px-4">
        <div className="max-w-3xl mx-auto">
          <h1 className="font-display font-bold text-3xl mb-4" style={{ color: theme.text }}>Política de Privacidade</h1>
          <p className="text-sm mb-8" style={{ color: theme.textMuted }}>Última atualização: {new Date().toLocaleDateString("pt-BR")}</p>
          <div
            className="prose prose-invert prose-sm max-w-none space-y-6 [&_h2]:font-display [&_h2]:font-bold [&_h2]:text-xl [&_h2]:mb-3 [&_p]:leading-relaxed [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:space-y-1 [&_li]:leading-relaxed"
            style={{ color: theme.textMuted }}
            dangerouslySetInnerHTML={{ __html: content }}
          />
        </div>
      </main>

      <FooterSimple />
    </div>
  );
}
