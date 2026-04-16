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

export type CtaType = "internal" | "whatsapp" | "whatsapp_group" | "url" | "crm";

export interface InviteChatConfig {
  attendantName: string;
  attendantAvatar: string;
  ctaText: string;
  ctaUrl: string;
  ctaType: CtaType;
  crmRedirectUrl: string;
  crmButtonText: string;
  chatMode: "flow" | "ai";
  /** @deprecated Use flows instead */
  flow: FlowStep[];
  /** Per-CTA-type flows */
  flows: Record<CtaType, FlowStep[]>;
}

// ─── Default flows per CTA type ───

const SHARED_INTRO: FlowStep[] = [
  { id: "start", type: "bot", messages: ["Antes de tudo, qual é o seu nome? 😊"], next: "ask_name" },
  { id: "ask_name", type: "input", placeholder: "Digite seu nome...", next: "greet" },
];

const FLOW_INTERNAL: FlowStep[] = [
  ...SHARED_INTRO,
  { id: "greet", type: "bot", messages: ["Prazer, {{nome}}! 😊", "Eu sou a Ana, consultora digital da Capimobi!", "Me conta, você já trabalha com imóveis?"], next: "choice_experience" },
  { id: "choice_experience", type: "choice", options: [
    { label: "Sim, sou corretor(a) 🏠", next: "path_corretor" },
    { label: "Ainda não, quero começar 🚀", next: "path_iniciante" },
    { label: "Sou imobiliária/construtora 🏢", next: "path_empresa" },
  ]},
  { id: "path_corretor", type: "bot", messages: ["Excelente, {{nome}}! 💪", "A Capimobi foi feita pra corretores como você!", "O que mais te interessa?"], next: "choice_corretor_interest" },
  { id: "choice_corretor_interest", type: "choice", options: [
    { label: "Ter minha loja online 🛍️", next: "benefit_loja" },
    { label: "Captar mais leads 📈", next: "benefit_leads" },
    { label: "Ver tudo que oferecemos ✨", next: "benefit_all" },
  ]},
  { id: "path_iniciante", type: "bot", messages: ["Que ótimo, {{nome}}! O mercado imobiliário é incrível! 🌟", "Com a Capimobi, você começa do zero e já sai com sua loja profissional pronta!", "O que te atraiu pra essa área?"], next: "choice_iniciante_reason" },
  { id: "choice_iniciante_reason", type: "choice", options: [
    { label: "Renda extra 💰", next: "benefit_all" },
    { label: "Carreira nova 🎯", next: "benefit_all" },
    { label: "Já tenho imóveis pra vender 🏡", next: "benefit_loja" },
  ]},
  { id: "path_empresa", type: "bot", messages: ["Perfeito, {{nome}}! 🏢", "Temos planos especiais para imobiliárias e construtoras com CRM completo, gestão de equipe e lojas individuais por corretor!", "Quer saber mais?"], next: "choice_empresa" },
  { id: "choice_empresa", type: "choice", options: [
    { label: "Sim, quero detalhes! 📋", next: "benefit_all" },
    { label: "Quanto custa? 💳", next: "pricing" },
  ]},
  { id: "benefit_loja", type: "bot", messages: ["Com a Capimobi você tem sua loja online em minutos! 🛍️", "✅ Página profissional com seu nome\n✅ Layouts exclusivos (Netflix, Magazine, Elegant...)\n✅ Compartilhamento por WhatsApp\n✅ QR Code personalizado", "Quer saber mais sobre outros benefícios?"], next: "choice_more" },
  { id: "benefit_leads", type: "bot", messages: ["Captação de leads é nosso forte! 📈", "✅ CRM integrado com funil de vendas\n✅ Bot de captação por WhatsApp\n✅ Landing page para atrair proprietários\n✅ Notificações push para engajar visitantes", "Quer saber mais?"], next: "choice_more" },
  { id: "benefit_all", type: "bot", messages: ["Olha tudo que você ganha com a Capimobi, {{nome}}! ✨", "🛍️ Loja online personalizada\n📈 CRM de leads integrado\n📱 Tudo pelo celular\n🔔 Notificações push\n📄 Propostas em PDF\n🤖 Bot de captação WhatsApp\n🎬 Stories profissionais\n📊 Analytics de visitas", "E o melhor de tudo..."], next: "pricing" },
  { id: "choice_more", type: "choice", options: [
    { label: "Ver todos os benefícios ✨", next: "benefit_all" },
    { label: "Quanto custa? 💰", next: "pricing" },
    { label: "Quero me cadastrar! 🚀", next: "final_cta" },
  ]},
  { id: "pricing", type: "bot", messages: ["O cadastro é 100% GRATUITO! 🎉", "Você já começa com:\n\n🆓 Loja completa\n🆓 Cadastro de imóveis ilimitado\n🆓 CRM básico\n🆓 Compartilhamento WhatsApp", "Se quiser turbinar, temos planos a partir de R$29/mês! 💎", "Pronto(a) pra começar, {{nome}}? 😄"], next: "choice_final" },
  { id: "choice_final", type: "choice", options: [
    { label: "Quero criar minha conta! 🚀", next: "final_cta" },
    { label: "Tenho mais dúvidas 🤔", next: "doubts" },
  ]},
  { id: "doubts", type: "bot", messages: ["Claro, {{nome}}! Estamos aqui pra te ajudar 😊", "Você pode criar sua conta gratuitamente e explorar tudo sem compromisso. Se tiver dúvidas depois, nossa equipe te ajuda pelo WhatsApp!", "Bora começar? 👇"], next: "final_cta" },
  { id: "final_cta", type: "bot", messages: ["Perfeito, {{nome}}! 🎯", "Clica no botão abaixo e cria sua conta em menos de 2 minutos! 👇"], next: "cta" },
  { id: "cta", type: "cta" },
];

const FLOW_CRM: FlowStep[] = [
  ...SHARED_INTRO,
  { id: "greet", type: "bot", messages: ["Prazer, {{nome}}! 😊", "Sou a Ana, consultora da Capimobi!", "Temos uma oportunidade exclusiva para profissionais do mercado imobiliário 🏠", "Posso te contar mais?"], next: "choice_interest" },
  { id: "choice_interest", type: "choice", options: [
    { label: "Sim, quero saber! 🤩", next: "explain_opportunity" },
    { label: "O que é a Capimobi? 🤔", next: "explain_platform" },
  ]},
  { id: "explain_platform", type: "bot", messages: ["A Capimobi é a plataforma mais completa para corretores e imobiliárias! 🚀", "Loja online, CRM, bot de captação, stories, e muito mais!", "Temos uma proposta especial para novos membros..."], next: "explain_opportunity" },
  { id: "explain_opportunity", type: "bot", messages: ["{{nome}}, estamos selecionando profissionais para uma consultoria gratuita de posicionamento digital! 🎯", "Nosso time entra em contato pelo WhatsApp para uma conversa rápida de 5 minutos.", "É só deixar seu contato e um consultor te liga! 📲"], next: "choice_leave_data" },
  { id: "choice_leave_data", type: "choice", options: [
    { label: "Quero a consultoria grátis! 📋", next: "final_cta" },
    { label: "Tem algum custo? 💰", next: "no_cost" },
  ]},
  { id: "no_cost", type: "bot", messages: ["Sem custo nenhum, {{nome}}! 🆓", "A consultoria é 100% gratuita e sem compromisso.", "Aproveita essa oportunidade enquanto temos vagas! ⏳"], next: "final_cta" },
  { id: "final_cta", type: "bot", messages: ["Ótimo, {{nome}}! 🎉", "Preencha seus dados abaixo que entraremos em contato rapidinho! 👇"], next: "cta" },
  { id: "cta", type: "cta" },
];

const FLOW_WHATSAPP: FlowStep[] = [
  ...SHARED_INTRO,
  { id: "greet", type: "bot", messages: ["Oi, {{nome}}! Que bom te ver por aqui! 😊", "Sou a Ana da Capimobi!", "Posso te ajudar com o que precisa. O que te trouxe até aqui?"], next: "choice_reason" },
  { id: "choice_reason", type: "choice", options: [
    { label: "Quero anunciar imóveis 🏠", next: "path_anunciar" },
    { label: "Sou corretor e quero saber mais 📈", next: "path_corretor" },
    { label: "Preciso de ajuda rápida 🆘", next: "path_ajuda" },
  ]},
  { id: "path_anunciar", type: "bot", messages: ["Perfeito, {{nome}}! 🏡", "Na Capimobi você cria sua loja online e anuncia seus imóveis em minutos!", "Quer falar direto com nossa equipe pelo WhatsApp? É mais rápido! 💬"], next: "choice_whatsapp" },
  { id: "path_corretor", type: "bot", messages: ["Excelente, {{nome}}! 💪", "Temos CRM, bot de captação, layouts profissionais e muito mais!", "Nosso time pode te mostrar tudo pelo WhatsApp. Bora? 💬"], next: "choice_whatsapp" },
  { id: "path_ajuda", type: "bot", messages: ["Claro, {{nome}}! 😊", "Nosso time está pronto pra te atender agora mesmo pelo WhatsApp!", "É rápido e sem burocracia 🚀"], next: "choice_whatsapp" },
  { id: "choice_whatsapp", type: "choice", options: [
    { label: "Chamar no WhatsApp! 💬", next: "final_cta" },
    { label: "Quero saber mais antes 🤔", next: "more_info" },
  ]},
  { id: "more_info", type: "bot", messages: ["Sem problemas! 😊", "A Capimobi oferece:\n\n🛍️ Loja profissional online\n📈 CRM integrado\n🤖 Bot de captação\n📱 Tudo pelo celular\n🎬 Stories profissionais", "Nosso time pode tirar todas as suas dúvidas pelo WhatsApp! 👇"], next: "final_cta" },
  { id: "final_cta", type: "bot", messages: ["Beleza, {{nome}}! 🎯", "Clica no botão abaixo e fale direto com nossa equipe! 👇"], next: "cta" },
  { id: "cta", type: "cta" },
];

const FLOW_WHATSAPP_GROUP: FlowStep[] = [
  ...SHARED_INTRO,
  { id: "greet", type: "bot", messages: ["Prazer, {{nome}}! 😊", "Sou a Ana da Capimobi!", "Sabia que temos um grupo exclusivo de corretores no WhatsApp? 👥"], next: "choice_know_more" },
  { id: "choice_know_more", type: "choice", options: [
    { label: "Conta mais! 🤩", next: "group_benefits" },
    { label: "O que rola no grupo? 🤔", next: "group_benefits" },
    { label: "Quero entrar agora! 🚀", next: "final_cta" },
  ]},
  { id: "group_benefits", type: "bot", messages: [
    "No nosso grupo você encontra: 🔥",
    "👥 Networking com outros corretores\n📢 Dicas exclusivas de vendas\n🏠 Imóveis para parcerias\n📈 Estratégias de captação\n🎯 Oportunidades em primeira mão\n💡 Conteúdo que não postamos em lugar nenhum",
    "E o melhor: é 100% gratuito! 🆓",
    "Mas atenção: as vagas são limitadas para manter a qualidade! ⏳"
  ], next: "choice_join" },
  { id: "choice_join", type: "choice", options: [
    { label: "Quero entrar! 🙋", next: "final_cta" },
    { label: "Quantas vagas restam? 👀", next: "urgency" },
  ]},
  { id: "urgency", type: "bot", messages: ["Temos poucas vagas abertas, {{nome}}! ⚡", "O grupo é curado — só entra quem realmente quer crescer no mercado imobiliário.", "Garante sua vaga enquanto tem! 👇"], next: "final_cta" },
  { id: "final_cta", type: "bot", messages: ["Perfeito, {{nome}}! 🎉", "Clica no botão abaixo para entrar no nosso grupo exclusivo! 👇"], next: "cta" },
  { id: "cta", type: "cta" },
];

const FLOW_URL: FlowStep[] = [
  ...SHARED_INTRO,
  { id: "greet", type: "bot", messages: ["Prazer, {{nome}}! 😊", "Sou a Ana da Capimobi!", "Tenho algo especial pra te mostrar! 🎁"], next: "choice_interest" },
  { id: "choice_interest", type: "choice", options: [
    { label: "Quero ver! 🤩", next: "present_offer" },
    { label: "O que é? 🤔", next: "present_offer" },
  ]},
  { id: "present_offer", type: "bot", messages: [
    "{{nome}}, preparamos um conteúdo exclusivo pra você! ✨",
    "É uma oportunidade única que pode transformar a sua carreira no mercado imobiliário! 🏠",
    "Milhares de profissionais já aproveitaram e estão colhendo resultados! 📈"
  ], next: "choice_access" },
  { id: "choice_access", type: "choice", options: [
    { label: "Quero acessar agora! 🚀", next: "final_cta" },
    { label: "Me conta mais 🤔", next: "more_details" },
  ]},
  { id: "more_details", type: "bot", messages: ["Claro, {{nome}}! 😊", "Este conteúdo foi criado por especialistas do mercado imobiliário.", "É gratuito, rápido e pode mudar sua forma de trabalhar! 💎", "Bora conferir? 👇"], next: "final_cta" },
  { id: "final_cta", type: "bot", messages: ["Beleza, {{nome}}! 🎯", "Clica no botão abaixo para acessar! 👇"], next: "cta" },
  { id: "cta", type: "cta" },
];

export const DEFAULT_FLOWS: Record<CtaType, FlowStep[]> = {
  internal: FLOW_INTERNAL,
  crm: FLOW_CRM,
  whatsapp: FLOW_WHATSAPP,
  whatsapp_group: FLOW_WHATSAPP_GROUP,
  url: FLOW_URL,
};

export const DEFAULT_CONFIG: InviteChatConfig = {
  attendantName: "Ana • Capimobi",
  attendantAvatar: "",
  ctaText: "🚀 Criar Minha Conta Grátis",
  ctaUrl: "/login",
  ctaType: "internal",
  crmRedirectUrl: "",
  crmButtonText: "🚀 Criar Minha Conta Agora",
  chatMode: "flow",
  flow: FLOW_INTERNAL,
  flows: { ...DEFAULT_FLOWS },
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
  choice_interest: "Interesse",
  explain_opportunity: "Apresentar oportunidade",
  explain_platform: "Explicar plataforma",
  choice_leave_data: "Deixar dados",
  no_cost: "Sem custo",
  choice_reason: "Motivo da visita",
  path_anunciar: "Caminho: Anunciar",
  path_ajuda: "Caminho: Ajuda",
  choice_whatsapp: "Ir pro WhatsApp",
  more_info: "Mais informações",
  choice_know_more: "Saber mais do grupo",
  group_benefits: "Benefícios do grupo",
  choice_join: "Entrar no grupo",
  urgency: "Urgência vagas",
  present_offer: "Apresentar oferta",
  choice_access: "Acessar conteúdo",
  more_details: "Mais detalhes",
};
