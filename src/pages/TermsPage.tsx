import { Helmet } from "react-helmet-async";

export default function TermsPage() {
  return (
    <>
      <Helmet>
        <title>Termos de Uso | Brokers Bio</title>
        <meta name="description" content="Termos de Uso do Brokers Bio. Conheça as condições de uso da nossa plataforma de anúncios de imóveis." />
        <link rel="canonical" href="https://redeimoveisgb.lovable.app/termos" />
      </Helmet>
      <div className="container max-w-3xl mx-auto px-4 py-12">
        <h1 className="font-display font-bold text-3xl text-foreground mb-8">Termos de Uso</h1>
        <p className="text-sm text-muted-foreground mb-6">Última atualização: {new Date().toLocaleDateString("pt-BR")}</p>

        <div className="prose prose-sm max-w-none text-foreground space-y-6">
          <section>
            <h2 className="font-display font-bold text-xl mb-3">1. Aceitação dos Termos</h2>
            <p className="text-muted-foreground leading-relaxed">Ao acessar ou utilizar o ES Corretores, você concorda com estes Termos de Uso. Caso não concorde, não utilize a plataforma.</p>
          </section>

          <section>
            <h2 className="font-display font-bold text-xl mb-3">2. Descrição do Serviço</h2>
            <p className="text-muted-foreground leading-relaxed">O ES Corretores é um marketplace que conecta vendedores e compradores de imóveis e veículos no Espírito Santo. Atuamos como intermediários, fornecendo a plataforma para publicação e busca de anúncios.</p>
          </section>

          <section>
            <h2 className="font-display font-bold text-xl mb-3">3. Cadastro e Conta</h2>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1">
              <li>Para anunciar, é necessário criar uma conta com informações verdadeiras</li>
              <li>Você é responsável por manter a segurança de sua conta e senha</li>
              <li>Cada pessoa/empresa pode ter apenas uma conta ativa</li>
              <li>Menores de 18 anos não podem utilizar a plataforma</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display font-bold text-xl mb-3">4. Regras de Publicação</h2>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1">
              <li>Os anúncios devem conter informações verídicas e atualizadas</li>
              <li>É proibido anunciar itens ilegais, roubados ou com restrições judiciais</li>
              <li>Fotos devem ser reais e do produto/imóvel anunciado</li>
              <li>Reservamo-nos o direito de remover anúncios que violem estas regras</li>
              <li>Conteúdo ofensivo, discriminatório ou fraudulento será removido</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display font-bold text-xl mb-3">5. Planos e Pagamentos</h2>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1">
              <li>O ES Corretores oferece planos gratuitos e pagos para anunciantes</li>
              <li>Os planos pagos oferecem recursos adicionais conforme descrito na página de pacotes</li>
              <li>Pagamentos são processados conforme acordado com o gerente de conta</li>
              <li>Não há reembolso após a ativação do plano</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display font-bold text-xl mb-3">6. Responsabilidades</h2>
            <p className="text-muted-foreground leading-relaxed">O ES Corretores não se responsabiliza por:</p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1">
              <li>Negociações realizadas entre compradores e vendedores</li>
              <li>Veracidade das informações fornecidas pelos anunciantes</li>
              <li>Problemas decorrentes de transações financeiras entre as partes</li>
              <li>Danos diretos ou indiretos causados pelo uso da plataforma</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display font-bold text-xl mb-3">7. Propriedade Intelectual</h2>
            <p className="text-muted-foreground leading-relaxed">Todo o conteúdo da plataforma (design, código, marca, logotipos) é propriedade do ES Corretores. Os anunciantes mantêm os direitos sobre suas fotos e descrições.</p>
          </section>

          <section>
            <h2 className="font-display font-bold text-xl mb-3">8. Suspensão e Encerramento</h2>
            <p className="text-muted-foreground leading-relaxed">Podemos suspender ou encerrar contas que violem estes termos, sem aviso prévio. O usuário pode solicitar o encerramento de sua conta a qualquer momento.</p>
          </section>

          <section>
            <h2 className="font-display font-bold text-xl mb-3">9. Legislação Aplicável</h2>
            <p className="text-muted-foreground leading-relaxed">Estes termos são regidos pelas leis da República Federativa do Brasil, em especial o Código de Defesa do Consumidor, o Marco Civil da Internet e a LGPD. O foro da comarca de Colatina/ES será competente para dirimir quaisquer litígios.</p>
          </section>

          <section>
            <h2 className="font-display font-bold text-xl mb-3">10. Contato</h2>
            <p className="text-muted-foreground leading-relaxed">Dúvidas sobre estes termos? Entre em contato pelo WhatsApp: (27) 99505-5993.</p>
          </section>
        </div>
      </div>
    </>
  );
}
