import { Helmet } from "react-helmet-async";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { useAuth } from "@/hooks/useAuth";
import MarketplaceNavbar from "@/components/MarketplaceNavbar";
import FooterSimple from "@/components/FooterSimple";
import { getMarketplaceTheme } from "@/lib/marketplaceThemes";
import { getMarketplaceThemeCssVars } from "@/lib/marketplaceThemeCssVars";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const DEFAULT_TERMS = `
<section><h2>1. Aceitação dos Termos</h2><p>Ao acessar ou utilizar a plataforma, você concorda com estes Termos de Uso. Caso não concorde, não utilize a plataforma.</p></section>
<section><h2>2. Descrição do Serviço</h2><p>A plataforma conecta vendedores e compradores de imóveis em todo o Brasil. Atuamos como intermediários, fornecendo a plataforma para publicação e busca de anúncios.</p></section>
<section><h2>3. Cadastro e Conta</h2><ul><li>Para anunciar, é necessário criar uma conta com informações verdadeiras</li><li>Você é responsável por manter a segurança de sua conta e senha</li><li>Cada pessoa/empresa pode ter apenas uma conta ativa</li><li>Menores de 18 anos não podem utilizar a plataforma</li></ul></section>
<section><h2>4. Regras de Publicação</h2><ul><li>Os anúncios devem conter informações verídicas e atualizadas</li><li>É proibido anunciar itens ilegais, roubados ou com restrições judiciais</li><li>Fotos devem ser reais e do produto/imóvel anunciado</li><li>Reservamo-nos o direito de remover anúncios que violem estas regras</li></ul></section>
<section><h2>5. Planos e Pagamentos</h2><ul><li>A plataforma oferece planos gratuitos e pagos para anunciantes</li><li>Pagamentos são processados conforme acordado com o gerente de conta</li><li>Não há reembolso após a ativação do plano</li></ul></section>
<section><h2>6. Responsabilidades</h2><p>A plataforma não se responsabiliza por negociações entre compradores e vendedores, veracidade das informações fornecidas, ou problemas decorrentes de transações financeiras entre as partes.</p></section>
<section><h2>7. Legislação Aplicável</h2><p>Estes termos são regidos pelas leis da República Federativa do Brasil, em especial o Código de Defesa do Consumidor, o Marco Civil da Internet e a LGPD.</p></section>
`;

export default function TermsPage() {
  const { site_name, site_terms_html } = useSiteSettings();
  const { user } = useAuth();
  const content = site_terms_html || DEFAULT_TERMS;

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
        <title>Termos de Uso | {site_name}</title>
        <meta name="description" content={`Termos de Uso do ${site_name}. Conheça as condições de uso da nossa plataforma.`} />
      </Helmet>

      <MarketplaceNavbar theme={theme} user={user} showImoveisScroll={false} />

      <main className="flex-1 pt-20 pb-16 px-4">
        <div className="max-w-3xl mx-auto">
          <h1 className="font-display font-bold text-3xl mb-4" style={{ color: theme.text }}>Termos de Uso</h1>
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
