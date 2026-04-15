/** Shared types and default flow for the Invite Chat page */

export interface StepBase {
  id: string;
}

export interface BotStep extends StepBase {
  type: "bot";
  messages: string[];
  next: string;
}

export interface InputStep extends StepBase {
  type: "input";
  placeholder: string;
  next: string;
}

export interface ChoiceStep extends StepBase {
  type: "choice";
  options: { label: string; next: string }[];
}

export interface CtaStep extends StepBase {
  type: "cta";
}

export type FlowStep = BotStep | InputStep | ChoiceStep | CtaStep;

export interface InviteChatConfig {
  attendantName: string;
  attendantAvatar: string;
  ctaText: string;
  ctaUrl: string;
  ctaType: "internal" | "whatsapp" | "whatsapp_group" | "url" | "crm";
  chatMode: "flow" | "ai";
  flow: FlowStep[];
}

export const DEFAULT_CONFIG: InviteChatConfig = {
  attendantName: "Ana • Capimobi",
  attendantAvatar: "",
  ctaText: "🚀 Criar Minha Conta Grátis",
  ctaUrl: "/login",
  ctaType: "internal",
  chatMode: "flow",
  flow: [
    {
      id: "start",
      type: "bot",
      messages: [
        "Antes de tudo, qual é o seu nome? 😊",
      ],
      next: "ask_name",
    },
    {
      id: "ask_name",
      type: "input",
      placeholder: "Digite seu nome...",
      next: "greet",
    },
    {
      id: "greet",
      type: "bot",
      messages: [
        "Prazer, {{nome}}! 😊",
        "Eu sou a Ana, consultora digital da Capimobi!",
        "Me conta, você já trabalha com imóveis?",
      ],
      next: "choice_experience",
    },
    {
      id: "choice_experience",
      type: "choice",
      options: [
        { label: "Sim, sou corretor(a) 🏠", next: "path_corretor" },
        { label: "Ainda não, quero começar 🚀", next: "path_iniciante" },
        { label: "Sou imobiliária/construtora 🏢", next: "path_empresa" },
      ],
    },
    {
      id: "path_corretor",
      type: "bot",
      messages: [
        "Excelente, {{nome}}! 💪",
        "A Capimobi foi feita pra corretores como você!",
        "O que mais te interessa?",
      ],
      next: "choice_corretor_interest",
    },
    {
      id: "choice_corretor_interest",
      type: "choice",
      options: [
        { label: "Ter minha loja online 🛍️", next: "benefit_loja" },
        { label: "Captar mais leads 📈", next: "benefit_leads" },
        { label: "Ver tudo que oferecemos ✨", next: "benefit_all" },
      ],
    },
    {
      id: "path_iniciante",
      type: "bot",
      messages: [
        "Que ótimo, {{nome}}! O mercado imobiliário é incrível! 🌟",
        "Com a Capimobi, você começa do zero e já sai com sua loja profissional pronta!",
        "O que te atraiu pra essa área?",
      ],
      next: "choice_iniciante_reason",
    },
    {
      id: "choice_iniciante_reason",
      type: "choice",
      options: [
        { label: "Renda extra 💰", next: "benefit_all" },
        { label: "Carreira nova 🎯", next: "benefit_all" },
        { label: "Já tenho imóveis pra vender 🏡", next: "benefit_loja" },
      ],
    },
    {
      id: "path_empresa",
      type: "bot",
      messages: [
        "Perfeito, {{nome}}! 🏢",
        "Temos planos especiais para imobiliárias e construtoras com CRM completo, gestão de equipe e lojas individuais por corretor!",
        "Quer saber mais?",
      ],
      next: "choice_empresa",
    },
    {
      id: "choice_empresa",
      type: "choice",
      options: [
        { label: "Sim, quero detalhes! 📋", next: "benefit_all" },
        { label: "Quanto custa? 💳", next: "pricing" },
      ],
    },
    {
      id: "benefit_loja",
      type: "bot",
      messages: [
        "Com a Capimobi você tem sua loja online em minutos! 🛍️",
        "✅ Página profissional com seu nome\n✅ Layouts exclusivos (Netflix, Magazine, Elegant...)\n✅ Compartilhamento por WhatsApp\n✅ QR Code personalizado",
        "Quer saber mais sobre outros benefícios?",
      ],
      next: "choice_more",
    },
    {
      id: "benefit_leads",
      type: "bot",
      messages: [
        "Captação de leads é nosso forte! 📈",
        "✅ CRM integrado com funil de vendas\n✅ Bot de captação por WhatsApp\n✅ Landing page para atrair proprietários\n✅ Notificações push para engajar visitantes",
        "Quer saber mais?",
      ],
      next: "choice_more",
    },
    {
      id: "benefit_all",
      type: "bot",
      messages: [
        "Olha tudo que você ganha com a Capimobi, {{nome}}! ✨",
        "🛍️ Loja online personalizada\n📈 CRM de leads integrado\n📱 Tudo pelo celular\n🔔 Notificações push\n📄 Propostas em PDF\n🤖 Bot de captação WhatsApp\n🎬 Stories profissionais\n📊 Analytics de visitas",
        "E o melhor de tudo...",
      ],
      next: "pricing",
    },
    {
      id: "choice_more",
      type: "choice",
      options: [
        { label: "Ver todos os benefícios ✨", next: "benefit_all" },
        { label: "Quanto custa? 💰", next: "pricing" },
        { label: "Quero me cadastrar! 🚀", next: "final_cta" },
      ],
    },
    {
      id: "pricing",
      type: "bot",
      messages: [
        "O cadastro é 100% GRATUITO! 🎉",
        "Você já começa com:\n\n🆓 Loja completa\n🆓 Cadastro de imóveis ilimitado\n🆓 CRM básico\n🆓 Compartilhamento WhatsApp",
        "Se quiser turbinar, temos planos a partir de R$29/mês! 💎",
        "Pronto(a) pra começar, {{nome}}? 😄",
      ],
      next: "choice_final",
    },
    {
      id: "choice_final",
      type: "choice",
      options: [
        { label: "Quero criar minha conta! 🚀", next: "final_cta" },
        { label: "Tenho mais dúvidas 🤔", next: "doubts" },
      ],
    },
    {
      id: "doubts",
      type: "bot",
      messages: [
        "Claro, {{nome}}! Estamos aqui pra te ajudar 😊",
        "Você pode criar sua conta gratuitamente e explorar tudo sem compromisso. Se tiver dúvidas depois, nossa equipe te ajuda pelo WhatsApp!",
        "Bora começar? 👇",
      ],
      next: "final_cta",
    },
    {
      id: "final_cta",
      type: "bot",
      messages: [
        "Perfeito, {{nome}}! 🎯",
        "Clica no botão abaixo e cria sua conta em menos de 2 minutos! 👇",
      ],
      next: "cta",
    },
    {
      id: "cta",
      type: "cta",
    },
  ],
};

/** Step type labels for admin UI */
export const STEP_TYPE_LABELS: Record<string, { emoji: string; label: string }> = {
  bot: { emoji: "🟢", label: "Bot" },
  input: { emoji: "✍️", label: "Input" },
  choice: { emoji: "🔘", label: "Escolhas" },
  cta: { emoji: "🎯", label: "CTA Final" },
};

/** Human-readable step names for admin */
export const STEP_NAMES: Record<string, string> = {
  start: "Boas-vindas",
  ask_name: "Pedir nome",
  greet: "Saudação personalizada",
  choice_experience: "Perfil do visitante",
  path_corretor: "Caminho: Corretor",
  choice_corretor_interest: "Interesse do corretor",
  path_iniciante: "Caminho: Iniciante",
  choice_iniciante_reason: "Motivo do iniciante",
  path_empresa: "Caminho: Empresa",
  choice_empresa: "Interesse da empresa",
  benefit_loja: "Benefícios: Loja",
  benefit_leads: "Benefícios: Leads",
  benefit_all: "Todos os benefícios",
  choice_more: "Ver mais opções",
  pricing: "Preços",
  choice_final: "Decisão final",
  doubts: "Dúvidas",
  final_cta: "Mensagem final",
  cta: "Botão CTA",
};
