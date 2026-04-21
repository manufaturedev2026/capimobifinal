import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { getNextAdVariant } from "@/data/aiPregeneratedAds";
import CaptureBotsManagerTab from "@/components/CaptureBotsManagerTab";
import {
  Link2, Copy, ExternalLink, User, Phone, MapPin, Home, DollarSign, Clock,
  Loader2, Inbox, Sparkles, Image as ImageIcon, Trash2, Video,
  MessageCircle, Save, Megaphone, Lock, Bot, Zap, Users, Calendar,
  Gem, ArrowRight, Eye, MoreHorizontal
} from "lucide-react";

interface CaptacaoOnlineTabProps {
  userId: string;
  sellerId: string;
  sellerSlug: string | null;
  sellerName: string;
  currentTier?: string;
  onUnreadCountChange?: (count: number) => void;
}

type Lead = {
  id: string;
  full_name: string;
  phone: string;
  property_type: string;
  address: string | null;
  desired_price: number | null;
  photos: string[] | null;
  description: string | null;
  status: string;
  created_at: string;
};

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  novo: { label: "Novo", color: "text-blue-600", bg: "bg-blue-500/10 border-blue-500/20" },
  em_contato: { label: "Em contato", color: "text-yellow-600", bg: "bg-yellow-500/10 border-yellow-500/20" },
  captado: { label: "Captado", color: "text-green-600", bg: "bg-green-500/10 border-green-500/20" },
  perdido: { label: "Perdido", color: "text-red-600", bg: "bg-red-500/10 border-red-500/20" },
};

const PROPERTY_TYPE_LABELS: Record<string, string> = {
  casa: "Casa", apartamento: "Apartamento", terreno: "Terreno",
  comercial: "Comercial", galpao: "Galpão", flat: "Flat", outros: "Outros",
};

type MainTab = "links" | "bot" | "leads" | "gerador";
type FlowType = "captacao" | "grupo_whatsapp" | "agendamento" | "avaliacao";
type AdTemplate = { id: string; label: string; emoji: string; category: string; generate: (url: string, name: string) => string };

const AD_TEMPLATES: AdTemplate[] = [
  {
    id: "captacao_geral",
    label: "Captação Geral",
    emoji: "🏡",
    category: "Captação",
    generate: (url, name) =>
      `🏡 Quer vender ou alugar seu imóvel MAIS RÁPIDO e pelo melhor valor?\n\nEu posso te ajudar 👇\n\n🚀 Cadastre seu imóvel 100% GRÁTIS e receba propostas reais de compradores interessados!\n\n✨ O que você ganha:\n✔ Avaliação profissional do seu imóvel\n✔ Divulgação em vários sites e redes sociais\n✔ Atendimento rápido e personalizado\n✔ Estratégia para vender ou alugar mais rápido\n\n💰 Sem burocracia. Sem complicação. Mais resultado!\n\n👉 Cadastre agora:\n${url}\n\n📲 Clique no link ou fale comigo no WhatsApp!\n\n⚠️ Vagas limitadas para novos imóveis essa semana\n\n#imoveis #venderimovel #aluguel #corretordeimoveis #oportunidade #mercadoimobiliario`,
  },
  {
    id: "urgencia",
    label: "Senso de Urgência",
    emoji: "⏰",
    category: "Captação",
    generate: (url, name) =>
      `⏰ ATENÇÃO proprietários!\n\nEstou selecionando apenas 5 imóveis esta semana para um trabalho exclusivo de divulgação.\n\n🔥 Se você quer vender ou alugar RÁPIDO, essa é sua chance!\n\n✅ Fotos profissionais\n✅ Divulgação em +10 portais\n✅ Atendimento VIP\n\n📋 Cadastre seu imóvel agora (é grátis):\n${url}\n\n⚠️ Restam poucas vagas!\n\n— ${name}`,
  },
  {
    id: "avaliacao_profissional",
    label: "Avaliação Profissional",
    emoji: "💎",
    category: "Avaliação",
    generate: (url, name) =>
      `💎 Você sabe quanto vale o seu imóvel HOJE?\n\n🏠 Sou avaliador profissional e posso te ajudar a entender o valor real do seu patrimônio.\n\n📊 Como funciona:\n• Análise comparativa da região\n• Avaliação de mercado atualizada\n• Critérios técnicos profissionais\n• Orientação sobre o melhor momento para vender\n\n👉 Cadastre os dados do imóvel:\n${url}\n\n📲 Em seguida entro em contato pelo WhatsApp para alinhar tudo com você.\n\n— ${name} | Avaliador(a) de Imóveis`,
  },
  {
    id: "stories_instagram",
    label: "Stories Instagram",
    emoji: "📱",
    category: "Redes Sociais",
    generate: (url, name) =>
      `📱 DESLIZA PRA CIMA!\n\n🏡 Quer vender seu imóvel?\n\n✅ Cadastro GRÁTIS\n✅ Divulgação profissional\n✅ Propostas reais\n\n🔗 ${url}\n\n#imoveis #venda #corretor`,
  },
  {
    id: "grupo_whatsapp",
    label: "Grupo WhatsApp",
    emoji: "💬",
    category: "WhatsApp",
    generate: (url, name) =>
      `👋 Olá! Sou ${name}.\n\n🏡 Você tem um imóvel para vender ou alugar?\n\nEstou fazendo um trabalho especial de captação e posso te ajudar a encontrar o comprador ou inquilino ideal!\n\n✨ Benefícios:\n🔹 Cadastro 100% gratuito\n🔹 Fotos e divulgação profissional\n🔹 Atendimento personalizado\n\n📋 Cadastre aqui:\n${url}\n\nQualquer dúvida, me chame! 😊`,
  },
  {
    id: "facebook_post",
    label: "Post Facebook",
    emoji: "👥",
    category: "Redes Sociais",
    generate: (url, name) =>
      `🏠 PROPRIETÁRIOS DE IMÓVEIS, LEIAM ISSO! 👇\n\nVocê sabia que a maioria dos imóveis demora meses para ser vendido por falta de uma boa estratégia de divulgação?\n\n💡 Eu posso mudar isso!\n\nSou ${name} e ofereço um serviço completo de venda e locação com:\n\n📸 Fotos profissionais do seu imóvel\n📣 Divulgação em múltiplas plataformas\n🤝 Negociação especializada\n📊 Acompanhamento em tempo real\n\nE o melhor: o cadastro é 100% GRATUITO!\n\n👉 Comece agora: ${url}\n\nMarque aqui nos comentários alguém que precisa vender ou alugar um imóvel! 👇\n\n#imobiliaria #vendadeimoveis #aluguel #corretor #investimento`,
  },
  {
    id: "investidores",
    label: "Para Investidores",
    emoji: "📈",
    category: "Captação",
    generate: (url, name) =>
      `📈 INVESTIDORES: Você tem imóveis parados no seu portfólio?\n\nTransforme seus imóveis em renda AGORA!\n\n💰 Serviço profissional de venda e locação:\n\n🔹 Análise de rentabilidade\n🔹 Precificação estratégica\n🔹 Divulgação premium\n🔹 Filtro de inquilinos/compradores\n\n🏢 Atendo casas, apartamentos, salas comerciais e terrenos.\n\n📋 Cadastre seus imóveis:\n${url}\n\n— ${name}`,
  },
  {
    id: "aluguel",
    label: "Foco em Aluguel",
    emoji: "🔑",
    category: "Captação",
    generate: (url, name) =>
      `🔑 Quer ALUGAR seu imóvel com segurança e rapidez?\n\n🏠 Eu cuido de TUDO pra você:\n\n✅ Análise de crédito dos candidatos\n✅ Contrato seguro\n✅ Divulgação em múltiplos canais\n✅ Vistoria completa\n✅ Garantia de recebimento\n\n💡 Sem dor de cabeça. Você recebe, eu administro.\n\n👉 Cadastre seu imóvel gratuitamente:\n${url}\n\n📲 Fale comigo e tire suas dúvidas!\n\n— ${name}`,
  },
  {
    id: "depoimento",
    label: "Prova Social",
    emoji: "⭐",
    category: "Marketing",
    generate: (url, name) =>
      `⭐⭐⭐⭐⭐\n\n"Consegui vender meu apartamento em apenas 3 semanas! Super recomendo o trabalho do(a) ${name}." — Cliente satisfeito(a)\n\n🏡 Quer ter o mesmo resultado?\n\nCadastro GRATUITO e sem compromisso!\n\n✅ Avaliação profissional\n✅ Divulgação estratégica\n✅ Propostas reais e qualificadas\n\n👉 Cadastre agora:\n${url}\n\n📲 Me chame no WhatsApp para mais detalhes!\n\n#resultados #imoveis #venda #depoimento`,
  },
  {
    id: "video_script",
    label: "Roteiro de Vídeo",
    emoji: "🎬",
    category: "Vídeo",
    generate: (url, name) =>
      `🎬 ROTEIRO PARA VÍDEO / REELS:\n\n[GANCHO - 3s]\n"Você quer vender seu imóvel rápido? Então presta atenção!"\n\n[PROBLEMA - 5s]\n"A maioria dos proprietários perde tempo e dinheiro tentando vender sozinho..."\n\n[SOLUÇÃO - 7s]\n"Eu sou ${name} e ofereço um serviço COMPLETO de venda e divulgação. O cadastro é 100% gratuito!"\n\n[CTA - 5s]\n"Clica no link da bio ou me chama no WhatsApp agora!"\n\n---\n🔗 Link: ${url}\n📝 Dica: grave com boa iluminação e fale olhando para a câmera!`,
  },
];

export default function CaptacaoOnlineTab({ userId, sellerId, sellerSlug, sellerName, currentTier = "basico", onUnreadCountChange }: CaptacaoOnlineTabProps) {
  const TIER_ORDER = ["basico", "start", "premium", "vip", "essencial_empresa", "premium_empresa", "prime_empresa", "black"];
  const tierLevel = TIER_ORDER.indexOf(currentTier);
  const hasLandingPage = tierLevel >= 1;
  const hasBot = tierLevel >= 2;
  const hasBotAI = tierLevel >= 3;
  const { toast } = useToast();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("todos");
  const [generatedAd, setGeneratedAd] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<string>("captacao_geral");
  const [generatingAI, setGeneratingAI] = useState(false);
  const [aiUsage, setAiUsage] = useState<{ used: number; limit: number } | null>(null);
  const [captureVideoUrl, setCaptureVideoUrl] = useState("");
  const [captureVideoTitle, setCaptureVideoTitle] = useState("");
  const [savingVideo, setSavingVideo] = useState(false);
  const [mainTab, setMainTab] = useState<MainTab>("leads");
  const [expandedLeadId, setExpandedLeadId] = useState<string | null>(null);
  const [leadsView, setLeadsView] = useState<"kanban" | "lista">("kanban");
  const [draggingLeadId, setDraggingLeadId] = useState<string | null>(null);

  // Bot config
  const [botAttendantName, setBotAttendantName] = useState("Assistente Imobiliário");
  const [botAttendantAvatar, setBotAttendantAvatar] = useState("");
  const [botOpeningMessage, setBotOpeningMessage] = useState("Olá! 👋 Vou te ajudar a cadastrar seu imóvel para avaliação gratuita! É rápido e sem compromisso 🏡");
  const [botChatMode, setBotChatMode] = useState<"flow" | "ai">("flow");
  const [botFlowType, setBotFlowType] = useState<FlowType>("captacao");
  const [savingBot, setSavingBot] = useState(false);

  // Captação messages
  const [flowMsgName, setFlowMsgName] = useState("Vamos começar? Me diz o seu nome completo 😊");
  const [flowMsgNameReply, setFlowMsgNameReply] = useState("Prazer, {nome}! 🤝");
  const [flowMsgPhone, setFlowMsgPhone] = useState("Qual seu telefone ou WhatsApp? 📱");
  const [flowMsgType, setFlowMsgType] = useState("Perfeito! Agora me diz: qual o tipo do imóvel? 🏠");
  const [flowMsgAddress, setFlowMsgAddress] = useState("Ótimo! Qual o endereço ou localização do imóvel? 📍");
  const [flowMsgPrice, setFlowMsgPrice] = useState("Tem um valor em mente para o imóvel? 💰\n\n(Se não tiver, pode digitar 0 ou pular)");
  const [flowMsgNotes, setFlowMsgNotes] = useState("Alguma observação sobre o imóvel? 📝\n\n(Opcional - pode enviar vazio para pular)");
  const [flowMsgSuccess, setFlowMsgSuccess] = useState("✅ Pronto! Suas informações foram enviadas com sucesso!");
  const [flowMsgSuccessEnd, setFlowMsgSuccessEnd] = useState("Em breve um corretor vai entrar em contato com você pelo WhatsApp. Obrigado! 🎉");

  // Grupo WhatsApp messages
  const [grupoMsgName, setGrupoMsgName] = useState("Que bom ter você aqui! 🎉 Me diz seu nome para eu te conhecer melhor:");
  const [grupoMsgNameReply, setGrupoMsgNameReply] = useState("Prazer, {nome}! 🤝");
  const [grupoMsgPhone, setGrupoMsgPhone] = useState("Qual seu WhatsApp? Assim eu te adiciono no nosso grupo exclusivo 📱");
  const [grupoMsgSuccess, setGrupoMsgSuccess] = useState("✅ Perfeito! Você está pronto para entrar no grupo!");
  const [grupoMsgSuccessEnd, setGrupoMsgSuccessEnd] = useState("No nosso grupo você recebe as melhores oportunidades em primeira mão! 🏡🔥");
  const [grupoWhatsappLink, setGrupoWhatsappLink] = useState("");

  // Agendamento messages
  const [agendMsgName, setAgendMsgName] = useState("Olá! 👋 Vou te ajudar a agendar uma visita. Me diz seu nome completo:");
  const [agendMsgNameReply, setAgendMsgNameReply] = useState("Prazer, {nome}! 🤝 Vamos agendar sua visita!");
  const [agendMsgPhone, setAgendMsgPhone] = useState("Qual seu telefone ou WhatsApp para confirmarmos? 📱");
  const [agendMsgInterest, setAgendMsgInterest] = useState("Qual imóvel ou região você tem interesse em visitar? 🏠📍");
  const [agendMsgDate, setAgendMsgDate] = useState("Qual a melhor data para a visita? 📅\n\n(Ex: segunda-feira, 20/01, esta semana...)");
  const [agendMsgTime, setAgendMsgTime] = useState("E qual o melhor horário? ⏰\n\n(Ex: manhã, 14h, final da tarde...)");
  const [agendMsgSuccess, setAgendMsgSuccess] = useState("✅ Visita agendada com sucesso!");
  const [agendMsgSuccessEnd, setAgendMsgSuccessEnd] = useState("Um corretor vai confirmar o agendamento pelo WhatsApp. Até breve! 📋🎉");

  // Avaliação messages
  const [avalMsgName, setAvalMsgName] = useState("Olá! 👋 Vou te ajudar a solicitar uma avaliação profissional do seu imóvel! Me diz seu nome:");
  const [avalMsgNameReply, setAvalMsgNameReply] = useState("Prazer, {nome}! 🤝 Vamos avaliar seu imóvel!");
  const [avalMsgPhone, setAvalMsgPhone] = useState("Qual seu telefone ou WhatsApp? 📱");
  const [avalMsgType, setAvalMsgType] = useState("Qual o tipo do seu imóvel? 🏠");
  const [avalMsgAddress, setAvalMsgAddress] = useState("Qual o endereço completo do imóvel? 📍\n\n(Rua, número, bairro e cidade)");
  const [avalMsgDetails, setAvalMsgDetails] = useState("Conte mais sobre o imóvel! 📝\n\n(Ex: quantidade de quartos, tamanho, estado de conservação, reformas...)");
  const [avalMsgSuccess, setAvalMsgSuccess] = useState("✅ Solicitação de avaliação enviada com sucesso!");
  const [avalMsgSuccessEnd, setAvalMsgSuccessEnd] = useState("Nosso avaliador profissional vai entrar em contato pelo WhatsApp em breve para alinhar a avaliação. Obrigado! 🏡💎");

  // CTA Buttons (texto + URL opcional) por fluxo
  const [captacaoCtaLabel, setCaptacaoCtaLabel] = useState("💬 Falar no WhatsApp");
  const [captacaoCtaUrl, setCaptacaoCtaUrl] = useState("");
  const [grupoCtaLabel, setGrupoCtaLabel] = useState("🔗 Entrar no Grupo");
  // grupoWhatsappLink já existe e funciona como CTA URL do fluxo Grupo
  const [agendCtaLabel, setAgendCtaLabel] = useState("💬 Confirmar Agendamento");
  const [agendCtaUrl, setAgendCtaUrl] = useState("");
  const [avalCtaLabel, setAvalCtaLabel] = useState("💬 Falar com Especialista");
  const [avalCtaUrl, setAvalCtaUrl] = useState("");
  // CTA do modo IA (usado quando chatMode === "ai")
  const [aiCtaLabel, setAiCtaLabel] = useState("💬 Falar no WhatsApp");
  const [aiCtaUrl, setAiCtaUrl] = useState("");

  // Mensagens de abertura pré-prontas por tipo de fluxo
  const FLOW_OPENING_MESSAGES: Record<FlowType, string> = {
    captacao: "Olá! 👋 Vou te ajudar a cadastrar seu imóvel para venda ou aluguel de forma rápida e 100% gratuita. 🏡\n\nFazemos a divulgação profissional, encontramos compradores/inquilinos qualificados e cuidamos de toda a negociação para você. Vamos começar?",
    grupo_whatsapp: "Olá! 👋 Que bom ter você por aqui!\n\nVou te adicionar ao nosso grupo VIP no WhatsApp 📲, onde compartilhamos em primeira mão as melhores oportunidades de imóveis: lançamentos, ofertas exclusivas e descontos especiais. 🏡🔥\n\nVamos garantir sua vaga?",
    agendamento: "Olá! 👋 Vou te ajudar a agendar uma visita ao imóvel de seu interesse. 📅\n\nÉ rápido, sem compromisso e você escolhe o melhor dia e horário. Nosso corretor especializado te acompanha pessoalmente para tirar todas as dúvidas. Vamos marcar?",
    avaliacao: "Olá! 👋 Vou te ajudar a solicitar uma avaliação profissional do seu imóvel. 💎\n\nNosso avaliador analisa o mercado atual da sua região, características do imóvel e tendências de preço com critérios técnicos para você entender o valor real do seu patrimônio. Vamos começar?",
  };

  // Detecta se a mensagem atual é uma das pré-prontas (assim podemos substituir sem perder customização do usuário)
  const isDefaultOpeningMessage = (msg: string) => {
    const defaults = Object.values(FLOW_OPENING_MESSAGES);
    return defaults.includes(msg.trim()) || msg.trim() === "Olá! 👋 Vou te ajudar a cadastrar seu imóvel para avaliação gratuita! É rápido e sem compromisso 🏡";
  };

  const handleFlowTypeChange = (newFlow: FlowType) => {
    setBotFlowType(newFlow);
    // Se a mensagem de abertura ainda é uma das pré-prontas, atualiza para a do novo fluxo
    if (isDefaultOpeningMessage(botOpeningMessage)) {
      setBotOpeningMessage(FLOW_OPENING_MESSAGES[newFlow]);
    }
  };

  const FLOW_HASH: Record<FlowType, string> = {
    captacao: "captacao",
    grupo_whatsapp: "grupo",
    agendamento: "agendamento",
    avaliacao: "avaliacao",
  };
  const captureUrl = `${window.location.origin}/captar-imovel/${sellerSlug || sellerId}`;
  const chatBotUrl = `${window.location.origin}/captar-imovel/${sellerSlug || sellerId}/chat#${FLOW_HASH[botFlowType] || "captacao"}`;

  useEffect(() => {
    fetchLeads();
    fetchCaptureVideo();
    fetchBotConfig();
  }, [sellerId]);

  const syncUnreadCount = (nextLeads: Lead[]) => {
    onUnreadCountChange?.(nextLeads.filter((lead) => lead.status === "novo").length);
  };

  const fetchCaptureVideo = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("capture_video_url, capture_video_title")
      .eq("id", sellerId)
      .maybeSingle();
    if (data?.capture_video_url) setCaptureVideoUrl(data.capture_video_url);
    if ((data as any)?.capture_video_title) setCaptureVideoTitle((data as any).capture_video_title);
  };

  const fetchBotConfig = async () => {
    const { data } = await supabase
      .from("platform_settings")
      .select("value")
      .eq("key", `capture_bot_config_${sellerId}`)
      .maybeSingle();
    if (data?.value) {
      try {
        const cfg = JSON.parse(data.value);
        if (cfg.attendantName) setBotAttendantName(cfg.attendantName);
        if (cfg.attendantAvatar) setBotAttendantAvatar(cfg.attendantAvatar);
        if (cfg.openingMessage) setBotOpeningMessage(cfg.openingMessage);
        if (cfg.chatMode) setBotChatMode(cfg.chatMode);
        if (cfg.flowType) setBotFlowType(cfg.flowType);
        if (cfg.flowMsgName) setFlowMsgName(cfg.flowMsgName);
        if (cfg.flowMsgNameReply) setFlowMsgNameReply(cfg.flowMsgNameReply);
        if (cfg.flowMsgPhone) setFlowMsgPhone(cfg.flowMsgPhone);
        if (cfg.flowMsgType) setFlowMsgType(cfg.flowMsgType);
        if (cfg.flowMsgAddress) setFlowMsgAddress(cfg.flowMsgAddress);
        if (cfg.flowMsgPrice) setFlowMsgPrice(cfg.flowMsgPrice);
        if (cfg.flowMsgNotes) setFlowMsgNotes(cfg.flowMsgNotes);
        if (cfg.flowMsgSuccess) setFlowMsgSuccess(cfg.flowMsgSuccess);
        if (cfg.flowMsgSuccessEnd) setFlowMsgSuccessEnd(cfg.flowMsgSuccessEnd);
        if (cfg.grupoMsgName) setGrupoMsgName(cfg.grupoMsgName);
        if (cfg.grupoMsgNameReply) setGrupoMsgNameReply(cfg.grupoMsgNameReply);
        if (cfg.grupoMsgPhone) setGrupoMsgPhone(cfg.grupoMsgPhone);
        if (cfg.grupoMsgSuccess) setGrupoMsgSuccess(cfg.grupoMsgSuccess);
        if (cfg.grupoMsgSuccessEnd) setGrupoMsgSuccessEnd(cfg.grupoMsgSuccessEnd);
        if (cfg.grupoWhatsappLink) setGrupoWhatsappLink(cfg.grupoWhatsappLink);
        if (cfg.agendMsgName) setAgendMsgName(cfg.agendMsgName);
        if (cfg.agendMsgNameReply) setAgendMsgNameReply(cfg.agendMsgNameReply);
        if (cfg.agendMsgPhone) setAgendMsgPhone(cfg.agendMsgPhone);
        if (cfg.agendMsgInterest) setAgendMsgInterest(cfg.agendMsgInterest);
        if (cfg.agendMsgDate) setAgendMsgDate(cfg.agendMsgDate);
        if (cfg.agendMsgTime) setAgendMsgTime(cfg.agendMsgTime);
        if (cfg.agendMsgSuccess) setAgendMsgSuccess(cfg.agendMsgSuccess);
        if (cfg.agendMsgSuccessEnd) setAgendMsgSuccessEnd(cfg.agendMsgSuccessEnd);
        if (cfg.avalMsgName) setAvalMsgName(cfg.avalMsgName);
        if (cfg.avalMsgNameReply) setAvalMsgNameReply(cfg.avalMsgNameReply);
        if (cfg.avalMsgPhone) setAvalMsgPhone(cfg.avalMsgPhone);
        if (cfg.avalMsgType) setAvalMsgType(cfg.avalMsgType);
        if (cfg.avalMsgAddress) setAvalMsgAddress(cfg.avalMsgAddress);
        if (cfg.avalMsgDetails) setAvalMsgDetails(cfg.avalMsgDetails);
        if (cfg.avalMsgSuccess) setAvalMsgSuccess(cfg.avalMsgSuccess);
        if (cfg.avalMsgSuccessEnd) setAvalMsgSuccessEnd(cfg.avalMsgSuccessEnd);
        if (cfg.captacaoCtaLabel) setCaptacaoCtaLabel(cfg.captacaoCtaLabel);
        if (cfg.captacaoCtaUrl) setCaptacaoCtaUrl(cfg.captacaoCtaUrl);
        if (cfg.grupoCtaLabel) setGrupoCtaLabel(cfg.grupoCtaLabel);
        if (cfg.agendCtaLabel) setAgendCtaLabel(cfg.agendCtaLabel);
        if (cfg.agendCtaUrl) setAgendCtaUrl(cfg.agendCtaUrl);
        if (cfg.avalCtaLabel) setAvalCtaLabel(cfg.avalCtaLabel);
        if (cfg.avalCtaUrl) setAvalCtaUrl(cfg.avalCtaUrl);
        if (cfg.aiCtaLabel) setAiCtaLabel(cfg.aiCtaLabel);
        if (cfg.aiCtaUrl) setAiCtaUrl(cfg.aiCtaUrl);
      } catch {}
    }
  };

  const saveBotConfig = async () => {
    setSavingBot(true);
    const configStr = JSON.stringify({
      attendantName: botAttendantName, attendantAvatar: botAttendantAvatar,
      openingMessage: botOpeningMessage, chatMode: botChatMode, flowType: botFlowType,
      flowMsgName, flowMsgNameReply, flowMsgPhone, flowMsgType,
      flowMsgAddress, flowMsgPrice, flowMsgNotes, flowMsgSuccess, flowMsgSuccessEnd,
      grupoMsgName, grupoMsgNameReply, grupoMsgPhone,
      grupoMsgSuccess, grupoMsgSuccessEnd, grupoWhatsappLink,
      agendMsgName, agendMsgNameReply, agendMsgPhone, agendMsgInterest,
      agendMsgDate, agendMsgTime, agendMsgSuccess, agendMsgSuccessEnd,
      avalMsgName, avalMsgNameReply, avalMsgPhone, avalMsgType,
      avalMsgAddress, avalMsgDetails, avalMsgSuccess, avalMsgSuccessEnd,
      captacaoCtaLabel, captacaoCtaUrl,
      grupoCtaLabel,
      agendCtaLabel, agendCtaUrl,
      avalCtaLabel, avalCtaUrl,
      aiCtaLabel, aiCtaUrl,
    });
    const { error } = await supabase
      .from("platform_settings")
      .upsert({ key: `capture_bot_config_${sellerId}`, value: configStr, updated_at: new Date().toISOString() } as any, { onConflict: "key" });
    setSavingBot(false);
    toast({ title: error ? "Erro ao salvar bot" : "Bot de captação salvo!", variant: error ? "destructive" : undefined });
  };

  const saveCaptureVideo = async () => {
    setSavingVideo(true);
    await supabase.from("profiles").update({ capture_video_url: captureVideoUrl || null, capture_video_title: captureVideoTitle || null } as any).eq("id", sellerId);
    toast({ title: "Vídeo salvo!" });
    setSavingVideo(false);
  };

  const fetchLeads = async () => {
    const { data } = await supabase
      .from("property_capture_leads" as any)
      .select("*")
      .eq("seller_id", sellerId)
      .order("created_at", { ascending: false });
    if (data) {
      const nextLeads = data as any;
      setLeads(nextLeads);
      syncUnreadCount(nextLeads);
    }
    setLoading(false);
  };

  const updateStatus = async (leadId: string, newStatus: string) => {
    await supabase.from("property_capture_leads" as any).update({ status: newStatus }).eq("id", leadId);
    setLeads(prev => {
      const nextLeads = prev.map(l => l.id === leadId ? { ...l, status: newStatus } : l);
      syncUnreadCount(nextLeads);
      return nextLeads;
    });
    toast({ title: `Status atualizado para "${STATUS_CONFIG[newStatus]?.label || newStatus}"` });
  };

  const deleteLead = async (leadId: string) => {
    await supabase.from("property_capture_leads" as any).delete().eq("id", leadId);
    setLeads(prev => {
      const nextLeads = prev.filter(l => l.id !== leadId);
      syncUnreadCount(nextLeads);
      return nextLeads;
    });
    toast({ title: "Lead removido" });
  };

  const copyLink = (url: string, label: string) => {
    navigator.clipboard.writeText(url);
    toast({ title: `${label} copiado!`, description: url });
  };

  const generateAdText = (templateId?: string) => {
    const id = templateId || selectedTemplate;
    // Rotate through the AI-pregenerated premium variants on each click
    const aiText = getNextAdVariant(id);
    if (aiText) {
      const filled = aiText
        .replace(/\{url\}/g, captureUrl || "")
        .replace(/\{name\}/g, sellerName || "Corretor");
      setGeneratedAd(filled);
      return;
    }
    // Fallback to the legacy template generator
    const tpl = AD_TEMPLATES.find(t => t.id === id);
    if (tpl) setGeneratedAd(tpl.generate(captureUrl, sellerName));
  };

  const generateAdWithAI = async () => {
    setGeneratingAI(true);
    try {
      const { data, error } = await supabase.functions.invoke("capture-chat", {
        body: {
          action: "generate_ad_copy",
          sellerName,
          captureUrl,
          templateHint: AD_TEMPLATES.find(t => t.id === selectedTemplate)?.label || "Captação",
        },
      });
      console.log("[generateAdWithAI] response:", { data, error });
      if (error) {
        // supabase.functions.invoke trata status != 2xx como error e não expõe o body diretamente
        const ctx: any = (error as any)?.context;
        let serverMsg = "";
        try {
          if (ctx && typeof ctx.json === "function") {
            const j = await ctx.json();
            serverMsg = j?.error || "";
          } else if (ctx && typeof ctx.text === "function") {
            serverMsg = await ctx.text();
          }
        } catch {}
        toast({
          title: "Erro ao gerar com IA",
          description: serverMsg || error.message || "Tente novamente.",
          variant: "destructive",
        });
        return;
      }
      if (data?.error) {
        toast({ title: "Erro", description: data.error, variant: "destructive" });
        return;
      }
      if (data?.text) {
        setGeneratedAd(data.text);
        if (typeof data.remaining === "number") {
          toast({ title: "Texto gerado!", description: `Restam ${data.remaining} gerações hoje.` });
        }
      } else {
        toast({ title: "Resposta vazia da IA", variant: "destructive" });
      }
    } catch (e: any) {
      console.error("[generateAdWithAI] exception:", e);
      toast({ title: "Erro ao gerar com IA", description: e?.message || "Falha de rede.", variant: "destructive" });
    } finally {
      setGeneratingAI(false);
    }
  };

  const copyAd = () => {
    navigator.clipboard.writeText(generatedAd);
    toast({ title: "Texto do anúncio copiado!" });
  };

  const filtered = leads.filter(l => statusFilter === "todos" || l.status === statusFilter);
  const counts = {
    todos: leads.length,
    novo: leads.filter(l => l.status === "novo").length,
    em_contato: leads.filter(l => l.status === "em_contato").length,
    captado: leads.filter(l => l.status === "captado").length,
    perdido: leads.filter(l => l.status === "perdido").length,
  };

  const FLOW_TYPES = [
    { value: "captacao" as const, label: "Captação", icon: Home, color: "text-primary", desc: "Coleta dados do imóvel" },
    { value: "grupo_whatsapp" as const, label: "Grupo", icon: Users, color: "text-[#25d366]", desc: "Convida para grupo" },
    { value: "avaliacao" as const, label: "Avaliação", icon: Gem, color: "text-amber-500", desc: "Agendar Avaliação" },
  ];

  const TAB_CONFIG: { key: MainTab; label: string; icon: any; count?: number }[] = [
    { key: "leads", label: "Leads", icon: Inbox, count: counts.novo },
    { key: "links", label: "Landing Page", icon: Link2 },
    { key: "gerador", label: "Gerador de Texto", icon: Megaphone },
    { key: "bot", label: "Bot WhatsApp", icon: Bot },
  ];

  return (
    <div className="space-y-5">
      {/* ─── Header with Stats ─── */}
      <div>
        <h2 className="font-display font-bold text-xl text-foreground">Captação Online</h2>
        <p className="text-sm text-muted-foreground">Capte imóveis automaticamente com links, bot interativo e IA</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total", value: counts.todos, icon: Inbox, color: "text-foreground" },
          { label: "Novos", value: counts.novo, icon: Zap, color: "text-blue-500" },
          { label: "Captados", value: counts.captado, icon: Home, color: "text-green-500" },
          { label: "Perdidos", value: counts.perdido, icon: ArrowRight, color: "text-red-500" },
        ].map((s, i) => (
          <div key={i} className="rounded-2xl border border-border bg-card p-3.5 flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl bg-secondary flex items-center justify-center ${s.color}`}>
              <s.icon size={16} />
            </div>
            <div>
              <p className="text-xl font-bold text-foreground leading-none">{s.value}</p>
              <p className="text-[10px] text-muted-foreground font-medium mt-0.5">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ─── Main Navigation Tabs ─── */}
      <div className="flex gap-1 bg-muted/50 rounded-2xl p-1">
        {TAB_CONFIG.map(tab => (
          <button
            key={tab.key}
            onClick={() => setMainTab(tab.key)}
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
              mainTab === tab.key
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            <tab.icon size={14} />
            <span className="hidden sm:inline">{tab.label}</span>
            {tab.count !== undefined && tab.count > 0 && (
              <span className="bg-primary-foreground text-primary text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">{tab.count}</span>
            )}
          </button>
        ))}
      </div>

      {/* ════════════════════════════════════════════════════════ */}
      {/* ─── LEADS TAB ─── */}
      {/* ════════════════════════════════════════════════════════ */}
      {mainTab === "leads" && (
        <div className="space-y-3">
          {/* Filter Chips */}
          <div className="flex flex-wrap gap-1.5">
            {(Object.entries(counts) as [string, number][]).map(([key, count]) => {
              const cfg = STATUS_CONFIG[key];
              return (
                <button
                  key={key}
                  onClick={() => setStatusFilter(key)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                    statusFilter === key
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-card text-muted-foreground border-border hover:border-primary/30"
                  }`}
                >
                  {key === "todos" ? "Todos" : cfg?.label || key} ({count})
                </button>
              );
            })}
          </div>

          {/* Leads List */}
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 size={24} className="animate-spin text-primary" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center rounded-2xl border border-dashed border-border bg-card/50">
              <div className="w-14 h-14 rounded-2xl bg-secondary flex items-center justify-center mb-4">
                <Inbox size={24} className="text-muted-foreground/40" />
              </div>
              <h3 className="text-base font-bold text-foreground mb-1">Nenhum lead ainda</h3>
              <p className="text-sm text-muted-foreground max-w-xs">
                Compartilhe seus links nas redes sociais para começar a receber leads.
              </p>
              <Button size="sm" variant="outline" className="mt-4 gap-1.5 text-xs" onClick={() => setMainTab("links")}>
                <Link2 size={12} /> Ver meus links
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map(lead => {
                const isExpanded = expandedLeadId === lead.id;
                const cfg = STATUS_CONFIG[lead.status] || { label: lead.status, color: "text-gray-500", bg: "bg-gray-500/10 border-gray-500/20" };
                const daysDiff = Math.floor((Date.now() - new Date(lead.created_at).getTime()) / (1000 * 60 * 60 * 24));
                const timeLabel = daysDiff === 0 ? "Hoje" : daysDiff === 1 ? "Ontem" : `${daysDiff}d atrás`;

                return (
                  <div key={lead.id} className={`rounded-2xl border overflow-hidden transition-all ${isExpanded ? "border-primary/20 bg-card shadow-sm" : "border-border bg-card hover:border-primary/10"}`}>
                    {/* Lead Row */}
                    <button
                      onClick={() => setExpandedLeadId(isExpanded ? null : lead.id)}
                      className="w-full flex items-center gap-3 p-3.5 text-left"
                    >
                      {/* Avatar */}
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center text-sm font-bold text-primary flex-shrink-0">
                        {lead.full_name.charAt(0).toUpperCase()}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm text-foreground truncate">{lead.full_name}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                          <span>{PROPERTY_TYPE_LABELS[lead.property_type] || lead.property_type}</span>
                          {lead.desired_price && <span>• R$ {lead.desired_price.toLocaleString("pt-BR")}</span>}
                        </div>
                      </div>

                      {/* Status + Time */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${cfg.bg} ${cfg.color}`}>
                          {cfg.label}
                        </span>
                        <span className="text-[10px] text-muted-foreground hidden sm:block">{timeLabel}</span>
                      </div>
                    </button>

                    {/* Expanded Details */}
                    {isExpanded && (
                      <div className="px-3.5 pb-3.5 space-y-3 border-t border-border pt-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-secondary/50">
                            <Phone size={14} className="text-green-500 flex-shrink-0" />
                            <a href={`https://wa.me/${lead.phone.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer"
                              className="text-sm text-green-600 font-medium hover:underline truncate">{lead.phone}</a>
                          </div>
                          {lead.address && (
                            <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-secondary/50">
                              <MapPin size={14} className="text-muted-foreground flex-shrink-0" />
                              <span className="text-sm text-foreground truncate">{lead.address}</span>
                            </div>
                          )}
                          {lead.desired_price && (
                            <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-secondary/50">
                              <DollarSign size={14} className="text-muted-foreground flex-shrink-0" />
                              <span className="text-sm text-foreground">R$ {lead.desired_price.toLocaleString("pt-BR")}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-secondary/50">
                            <Clock size={14} className="text-muted-foreground flex-shrink-0" />
                            <span className="text-sm text-foreground">{new Date(lead.created_at).toLocaleString("pt-BR")}</span>
                          </div>
                        </div>

                        {lead.description && (
                          <p className="text-sm text-muted-foreground bg-secondary/40 rounded-xl p-3 leading-relaxed">{lead.description}</p>
                        )}

                        {lead.photos && lead.photos.length > 0 && (
                          <div className="flex items-center gap-2 flex-wrap">
                            {lead.photos.map((url, i) => (
                              <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                                <img src={url} alt="" className="w-16 h-16 rounded-xl object-cover border border-border" />
                              </a>
                            ))}
                          </div>
                        )}

                        {/* Actions */}
                        <div className="flex items-center gap-2 flex-wrap pt-1">
                          <Select value={lead.status} onValueChange={v => updateStatus(lead.id, v)}>
                            <SelectTrigger className="w-[140px] h-8 text-xs bg-background text-foreground border-border rounded-xl">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-background text-foreground border-border">
                              {Object.entries(STATUS_CONFIG).map(([key, c]) => (
                                <SelectItem key={key} value={key} className="text-foreground">{c.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>

                          <a
                            href={`https://wa.me/${lead.phone.replace(/\D/g, "")}?text=Olá ${encodeURIComponent(lead.full_name)}! Recebi o cadastro do seu imóvel e gostaria de conversar sobre ele.`}
                            target="_blank" rel="noopener noreferrer"
                          >
                            <Button size="sm" className="gap-1.5 text-xs bg-[#25d366] hover:bg-[#22c55e] text-white rounded-xl h-8">
                              <Phone size={12} /> WhatsApp
                            </Button>
                          </a>

                          <Button size="sm" variant="ghost" className="text-destructive hover:bg-destructive/10 ml-auto h-8 rounded-xl"
                            onClick={() => deleteLead(lead.id)}>
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════ */}
      {/* ─── LINKS & MARKETING TAB ─── */}
      {/* ════════════════════════════════════════════════════════ */}
      {mainTab === "links" && (
        <div className="space-y-4">
          {/* Landing Page Link */}
          <div className={`rounded-2xl border p-4 relative overflow-hidden ${hasLandingPage ? "border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5" : "border-border bg-muted/30 opacity-60"}`}>
            {!hasLandingPage && (
              <div className="absolute inset-0 bg-background/60 backdrop-blur-sm z-10 flex items-center justify-center gap-2">
                <Lock size={14} className="text-muted-foreground" />
                <span className="text-xs font-semibold text-muted-foreground">Plano Start+</span>
              </div>
            )}
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-8 h-8 rounded-xl bg-primary/15 flex items-center justify-center">
                <Link2 size={14} className="text-primary" />
              </div>
              <p className="text-sm font-bold text-foreground">Landing Page</p>
            </div>
            <p className="text-xs font-mono text-muted-foreground truncate mb-3">{captureUrl}</p>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="flex-1 gap-1.5 text-xs h-8 rounded-xl bg-background text-foreground border-border hover:bg-accent hover:text-accent-foreground" onClick={() => copyLink(captureUrl, "Link da página")} disabled={!hasLandingPage}>
                <Copy size={11} /> Copiar
              </Button>
              <a href={hasLandingPage ? captureUrl : undefined} target="_blank" rel="noopener noreferrer" className="flex-1">
                <Button size="sm" variant="outline" className="w-full gap-1.5 text-xs h-8 rounded-xl bg-background text-foreground border-border hover:bg-accent hover:text-accent-foreground" disabled={!hasLandingPage}>
                  <Eye size={11} /> Abrir
                </Button>
              </a>
            </div>
          </div>

          {/* Video */}
          <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-secondary flex items-center justify-center">
                <Video size={14} className="text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-bold text-foreground">Vídeo da Captação</p>
                <p className="text-[10px] text-muted-foreground">YouTube para a página de captação</p>
              </div>
            </div>
            <Input value={captureVideoTitle} onChange={e => setCaptureVideoTitle(e.target.value)} placeholder="Título do vídeo" className="text-sm" />
            <div className="flex gap-2">
              <Input value={captureVideoUrl} onChange={e => setCaptureVideoUrl(e.target.value)} placeholder="https://youtube.com/watch?v=..." className="flex-1 text-sm" />
              <Button onClick={saveCaptureVideo} size="sm" disabled={savingVideo} className="gap-1.5 text-xs h-9 rounded-xl">
                {savingVideo ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />} Salvar
              </Button>
            </div>
            {captureVideoUrl && (
              <div className="aspect-video rounded-xl overflow-hidden border border-border">
                <iframe
                  src={captureVideoUrl.replace("watch?v=", "embed/").replace("youtu.be/", "youtube.com/embed/").split("&")[0]}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════ */}
      {/* ─── GERADOR DE TEXTO TAB ─── */}
      {/* ════════════════════════════════════════════════════════ */}
      {mainTab === "gerador" && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-border bg-card p-4 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-secondary flex items-center justify-center">
                <Megaphone size={14} className="text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-bold text-foreground">Gerador de Texto</p>
                <p className="text-[10px] text-muted-foreground">Escolha um modelo e personalize</p>
              </div>
            </div>

            {/* Template Categories */}
            {(() => {
              const categories = [...new Set(AD_TEMPLATES.map(t => t.category))];
              return (
                <div className="space-y-3">
                  {categories.map(cat => (
                    <div key={cat}>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">{cat}</p>
                      <div className="flex flex-wrap gap-1.5">
                        {AD_TEMPLATES.filter(t => t.category === cat).map(tpl => (
                          <button
                            key={tpl.id}
                            onClick={() => { setSelectedTemplate(tpl.id); generateAdText(tpl.id); }}
                            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5 ${
                              selectedTemplate === tpl.id
                                ? "bg-primary text-primary-foreground border-primary shadow-sm"
                                : "bg-card text-muted-foreground border-border hover:border-primary/30 hover:text-foreground"
                            }`}
                          >
                            <span>{tpl.emoji}</span> {tpl.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button onClick={() => generateAdText()} size="sm" variant="secondary" className="gap-1.5 text-xs rounded-xl border border-border flex-1">
                <Sparkles size={12} /> Gerar Modelo
              </Button>
              <Button
                onClick={generateAdWithAI}
                size="sm"
                disabled={generatingAI}
                className="gap-1.5 text-xs rounded-xl flex-1 bg-gradient-to-r from-violet-600 to-primary text-primary-foreground hover:opacity-90"
              >
                {generatingAI ? <Loader2 size={12} className="animate-spin" /> : <Bot size={12} />}
                {generatingAI ? "Gerando..." : "✨ Gerar com IA"}
              </Button>
            </div>

            {/* Generated Ad Output */}
            {generatedAd && (
              <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-semibold text-foreground uppercase tracking-wide">Texto gerado</p>
                  <Button onClick={copyAd} size="sm" variant="secondary" className="gap-1.5 text-xs rounded-xl h-8">
                    <Copy size={12} /> Copiar
                  </Button>
                </div>
                <Textarea
                  value={generatedAd}
                  onChange={e => setGeneratedAd(e.target.value)}
                  className="min-h-[260px] text-sm leading-relaxed font-mono whitespace-pre-wrap"
                />
              </div>
            )}

            {/* Daily Usage Indicator */}
            {aiUsage && (
              <p className="text-[11px] text-muted-foreground text-center">
                Uso de IA hoje: <span className="font-semibold text-foreground">{aiUsage.used}/{aiUsage.limit}</span>
                {aiUsage.used >= aiUsage.limit && (
                  <span className="ml-1 text-destructive font-semibold">— Limite atingido. Faça upgrade no plano.</span>
                )}
              </p>
            )}
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════ */}
      {/* ─── BOT TAB ─── */}
      {/* ════════════════════════════════════════════════════════ */}
      {mainTab === "bot" && (
        <div className="space-y-4">
          {!hasBot ? (
            <div className="rounded-2xl border border-border bg-card p-8 flex flex-col items-center text-center">
              <div className="w-14 h-14 rounded-2xl bg-secondary flex items-center justify-center mb-4">
                <Lock size={24} className="text-muted-foreground" />
              </div>
              <p className="text-base font-bold text-foreground mb-1">Bots de Captação</p>
              <p className="text-sm text-muted-foreground mb-4">Disponível a partir do plano VIP</p>
              <Button size="sm" variant="outline" className="gap-1.5 text-xs rounded-xl">Upgrade</Button>
            </div>
          ) : (
            <CaptureBotsManagerTab sellerId={sellerId} sellerSlug={sellerSlug} />
          )}
        </div>
      )}
    </div>
  );
}

/* ── Reusable Field ── */
function Field({ label, value, onChange, multiline }: {
  label: string; value: string; onChange: (v: string) => void; multiline?: boolean;
}) {
  return (
    <div>
      <label className="text-xs text-muted-foreground">{label}</label>
      {multiline ? (
        <Textarea value={value} onChange={e => onChange(e.target.value)} className="mt-1 min-h-[50px] text-sm" />
      ) : (
        <Input value={value} onChange={e => onChange(e.target.value)} className="mt-1 text-sm" />
      )}
    </div>
  );
}

/* ── CTA Button Editor (label + URL) ── */
function CtaFields({ label, url, onLabel, onUrl, hint, urlPlaceholder }: {
  label: string; url: string; onLabel: (v: string) => void; onUrl: (v: string) => void;
  hint?: string; urlPlaceholder?: string;
}) {
  return (
    <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 space-y-2">
      <p className="text-xs font-bold text-foreground">🎯 Botão de Ação Final (CTA)</p>
      <div>
        <label className="text-xs text-muted-foreground">Texto do botão</label>
        <Input value={label} onChange={e => onLabel(e.target.value)} placeholder="Ex: Falar no WhatsApp" className="mt-1 text-sm" />
      </div>
      <div>
        <label className="text-xs text-muted-foreground">Link do botão (opcional)</label>
        <Input value={url} onChange={e => onUrl(e.target.value)} placeholder={urlPlaceholder || "https://..."} className="mt-1 text-sm" />
        {hint && <p className="text-[10px] text-muted-foreground mt-1">{hint}</p>}
      </div>
    </div>
  );
}
