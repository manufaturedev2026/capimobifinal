import { Helmet } from "react-helmet-async";

export default function PrivacyPage() {
  return (
    <>
      <Helmet>
        <title>Política de Privacidade | Brokers App</title>
        <meta name="description" content="Política de Privacidade do Brokers App. Saiba como coletamos, usamos e protegemos seus dados pessoais." />
        <link rel="canonical" href="https://redeimoveisgb.lovable.app/privacidade" />
      </Helmet>
      <div className="container max-w-3xl mx-auto px-4 py-12">
        <h1 className="font-display font-bold text-3xl text-foreground mb-8">Política de Privacidade</h1>
        <p className="text-sm text-muted-foreground mb-6">Última atualização: {new Date().toLocaleDateString("pt-BR")}</p>

        <div className="prose prose-sm max-w-none text-foreground space-y-6">
          <section>
            <h2 className="font-display font-bold text-xl mb-3">1. Introdução</h2>
            <p className="text-muted-foreground leading-relaxed">A Brokers App ("nós", "nosso") opera o site redeimoveisgb.lovable.app. Esta política descreve como coletamos, usamos e protegemos suas informações pessoais quando você utiliza nosso marketplace de imóveis.</p>
          </section>

          <section>
            <h2 className="font-display font-bold text-xl mb-3">2. Dados que Coletamos</h2>
            <p className="text-muted-foreground leading-relaxed">Coletamos as seguintes informações:</p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1">
              <li>Nome completo e e-mail ao criar uma conta</li>
              <li>Telefone (opcional) para contato via WhatsApp</li>
              <li>Informações de anúncios publicados (fotos, descrições, preços)</li>
              <li>Dados de navegação (cookies, endereço IP, tipo de navegador)</li>
              <li>Localização aproximada para exibição de anúncios regionais</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display font-bold text-xl mb-3">3. Como Usamos seus Dados</h2>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1">
              <li>Fornecer e manter nossos serviços de marketplace</li>
              <li>Permitir a publicação e busca de anúncios</li>
              <li>Enviar notificações relacionadas à sua conta</li>
              <li>Melhorar a experiência do usuário e personalizar conteúdo</li>
              <li>Análises internas e estatísticas de uso</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display font-bold text-xl mb-3">4. Compartilhamento de Dados</h2>
            <p className="text-muted-foreground leading-relaxed">Não vendemos seus dados pessoais. Podemos compartilhar informações com:</p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1">
              <li>Provedores de infraestrutura e hospedagem</li>
              <li>Serviços de análise (de forma anonimizada)</li>
              <li>Autoridades legais quando exigido por lei</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display font-bold text-xl mb-3">5. Cookies</h2>
            <p className="text-muted-foreground leading-relaxed">Utilizamos cookies essenciais para funcionamento do site e cookies analíticos para entender como nossos usuários interagem com a plataforma. Você pode desabilitar cookies nas configurações do seu navegador.</p>
          </section>

          <section>
            <h2 className="font-display font-bold text-xl mb-3">6. Segurança</h2>
            <p className="text-muted-foreground leading-relaxed">Adotamos medidas de segurança técnicas e organizacionais para proteger suas informações, incluindo criptografia de dados em trânsito (HTTPS) e armazenamento seguro.</p>
          </section>

          <section>
            <h2 className="font-display font-bold text-xl mb-3">7. Seus Direitos (LGPD)</h2>
            <p className="text-muted-foreground leading-relaxed">De acordo com a Lei Geral de Proteção de Dados (LGPD), você tem direito a:</p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1">
              <li>Acessar seus dados pessoais</li>
              <li>Corrigir dados incompletos ou desatualizados</li>
              <li>Solicitar a exclusão dos seus dados</li>
              <li>Revogar consentimento a qualquer momento</li>
              <li>Solicitar a portabilidade dos dados</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display font-bold text-xl mb-3">8. Contato</h2>
            <p className="text-muted-foreground leading-relaxed">Para exercer seus direitos ou tirar dúvidas, entre em contato pelo WhatsApp: (27) 99505-5993 ou envie um e-mail para nosso suporte.</p>
          </section>
        </div>
      </div>
    </>
  );
}
