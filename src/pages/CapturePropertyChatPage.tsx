import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCheck, ArrowLeft, Phone, Video, MoreVertical, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useParams, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { SITE_URL } from "@/lib/siteUrl";

type FlowType = "captacao" | "grupo_whatsapp" | "agendamento" | "avaliacao";

interface BotConfig {
  attendantName: string;
  attendantAvatar: string;
  openingMessage: string;
  chatMode: "flow" | "ai";
  flowType: FlowType;
  // Captação messages
  flowMsgName: string;
  flowMsgNameReply: string;
  flowMsgPhone: string;
  flowMsgType: string;
  flowMsgAddress: string;
  flowMsgPrice: string;
  flowMsgNotes: string;
  flowMsgSuccess: string;
  flowMsgSuccessEnd: string;
  // Grupo WhatsApp
  grupoMsgName: string;
  grupoMsgNameReply: string;
  grupoMsgPhone: string;
  grupoMsgSuccess: string;
  grupoMsgSuccessEnd: string;
  grupoWhatsappLink: string;
  // Agendamento
  agendMsgName: string;
  agendMsgNameReply: string;
  agendMsgPhone: string;
  agendMsgInterest: string;
  agendMsgDate: string;
  agendMsgTime: string;
  agendMsgSuccess: string;
  agendMsgSuccessEnd: string;
  // Avaliação
  avalMsgName: string;
  avalMsgNameReply: string;
  avalMsgPhone: string;
  avalMsgType: string;
  avalMsgAddress: string;
  avalMsgDetails: string;
  avalMsgSuccess: string;
  avalMsgSuccessEnd: string;
}

const DEFAULT_CONFIG: BotConfig = {
  attendantName: "Assistente Imobiliário",
  attendantAvatar: "",
  openingMessage: "Olá! 👋 Vou te ajudar a cadastrar seu imóvel para avaliação gratuita! É rápido e sem compromisso 🏡",
  chatMode: "flow",
  flowType: "captacao",
  // Captação
  flowMsgName: "Vamos começar? Me diz o seu nome completo 😊",
  flowMsgNameReply: "Prazer, {nome}! 🤝",
  flowMsgPhone: "Qual seu telefone ou WhatsApp? 📱",
  flowMsgType: "Perfeito! Agora me diz: qual o tipo do imóvel? 🏠",
  flowMsgAddress: "Ótimo! Qual o endereço ou localização do imóvel? 📍",
  flowMsgPrice: "Tem um valor em mente para o imóvel? 💰\n\n(Se não tiver, pode digitar 0 ou pular)",
  flowMsgNotes: "Alguma observação sobre o imóvel? 📝\n\n(Opcional - pode enviar vazio para pular)",
  flowMsgSuccess: "✅ Pronto! Suas informações foram enviadas com sucesso!",
  flowMsgSuccessEnd: "Em breve um corretor vai entrar em contato com você pelo WhatsApp. Obrigado! 🎉",
  // Grupo WhatsApp
  grupoMsgName: "Que bom ter você aqui! 🎉 Me diz seu nome para eu te conhecer melhor:",
  grupoMsgNameReply: "Prazer, {nome}! 🤝",
  grupoMsgPhone: "Qual seu WhatsApp? Assim eu te adiciono no nosso grupo exclusivo 📱",
  grupoMsgSuccess: "✅ Perfeito! Você está pronto para entrar no grupo!",
  grupoMsgSuccessEnd: "No nosso grupo você recebe as melhores oportunidades em primeira mão! 🏡🔥",
  grupoWhatsappLink: "",
  // Agendamento
  agendMsgName: "Olá! 👋 Vou te ajudar a agendar uma visita. Me diz seu nome completo:",
  agendMsgNameReply: "Prazer, {nome}! 🤝 Vamos agendar sua visita!",
  agendMsgPhone: "Qual seu telefone ou WhatsApp para confirmarmos? 📱",
  agendMsgInterest: "Qual imóvel ou região você tem interesse em visitar? 🏠📍",
  agendMsgDate: "Qual a melhor data para a visita? 📅\n\n(Ex: segunda-feira, 20/01, esta semana...)",
  agendMsgTime: "E qual o melhor horário? ⏰\n\n(Ex: manhã, 14h, final da tarde...)",
  agendMsgSuccess: "✅ Visita agendada com sucesso!",
  agendMsgSuccessEnd: "Um corretor vai confirmar o agendamento pelo WhatsApp. Até breve! 📋🎉",
  // Avaliação
  avalMsgName: "Olá! 👋 Vou te ajudar a solicitar uma avaliação GRATUITA do seu imóvel! Me diz seu nome:",
  avalMsgNameReply: "Prazer, {nome}! 🤝 Vamos avaliar seu imóvel!",
  avalMsgPhone: "Qual seu telefone ou WhatsApp? 📱",
  avalMsgType: "Qual o tipo do seu imóvel? 🏠",
  avalMsgAddress: "Qual o endereço completo do imóvel? 📍\n\n(Rua, número, bairro e cidade)",
  avalMsgDetails: "Conte mais sobre o imóvel! 📝\n\n(Ex: quantidade de quartos, tamanho, estado de conservação, reformas...)",
  avalMsgSuccess: "✅ Solicitação de avaliação enviada com sucesso!",
  avalMsgSuccessEnd: "Um especialista vai entrar em contato em até 24h para agendar a visita de avaliação. Obrigado! 🏡💎",
};

// Opening messages per flow type
const FLOW_OPENINGS: Record<FlowType, string> = {
  captacao: "Olá! 👋 Vou te ajudar a cadastrar seu imóvel para avaliação gratuita! É rápido e sem compromisso 🏡",
  grupo_whatsapp: "Olá! 👋 Entre no nosso grupo exclusivo de imóveis e receba as melhores oportunidades! 🏡🔥",
  agendamento: "Olá! 👋 Vou te ajudar a agendar uma visita a um imóvel! É rápido e fácil 🏠📅",
  avaliacao: "Olá! 👋 Solicite uma avaliação GRATUITA do seu imóvel! Descubra quanto ele vale no mercado 💎🏡",
};

type CaptacaoStep = "opening" | "name" | "phone" | "type" | "address" | "price" | "notes" | "done";
type GrupoStep = "opening" | "name" | "phone" | "done";
type AgendStep = "opening" | "name" | "phone" | "interest" | "date" | "time" | "done";
type AvalStep = "opening" | "name" | "phone" | "type" | "address" | "details" | "done";
type Step = CaptacaoStep | GrupoStep | AgendStep | AvalStep;

const PROPERTY_TYPES = [
  { value: "casa", label: "🏠 Casa" },
  { value: "apartamento", label: "🏢 Apartamento" },
  { value: "terreno", label: "🌳 Terreno" },
  { value: "comercial", label: "🏪 Comercial" },
  { value: "galpao", label: "🏭 Galpão" },
  { value: "outros", label: "📦 Outros" },
];

const TIME_OPTIONS = [
  { value: "manha", label: "☀️ Manhã (8h-12h)" },
  { value: "tarde", label: "🌤️ Tarde (13h-17h)" },
  { value: "noite", label: "🌙 Noite (18h-20h)" },
];

interface ChatMsg {
  id: string;
  text: string;
  sender: "bot" | "user";
}

export default function CapturePropertyChatPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const chatRef = useRef<HTMLDivElement>(null);

  const [config, setConfig] = useState<BotConfig>(DEFAULT_CONFIG);
  const [sellerProfile, setSellerProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [step, setStep] = useState<Step>("opening");
  const [typing, setTyping] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [inputVisible, setInputVisible] = useState(false);

  // Collected data
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [propertyType, setPropertyType] = useState("");
  const [address, setAddress] = useState("");
  const [desiredPrice, setDesiredPrice] = useState("");
  const [notes, setNotes] = useState("");
  const [interest, setInterest] = useState("");
  const [visitDate, setVisitDate] = useState("");
  const [visitTime, setVisitTime] = useState("");
  const [details, setDetails] = useState("");
  const [submitted, setSubmitted] = useState(false);

  // AI mode state
  const [aiMessages, setAiMessages] = useState<{ role: "user" | "assistant"; content: string }[]>([]);
  const [aiInput, setAiInput] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [showCrmForm, setShowCrmForm] = useState(false);
  const [crmName, setCrmName] = useState("");
  const [crmPhone, setCrmPhone] = useState("");
  const [crmPropertyType, setCrmPropertyType] = useState("");
  const [crmAddress, setCrmAddress] = useState("");
  const [crmSaving, setCrmSaving] = useState(false);
  const [crmSaved, setCrmSaved] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  const isAiMode = config.chatMode === "ai";
  const flowType = config.flowType || "captacao";

  // Load seller + bot config
  useEffect(() => {
    const load = async () => {
      if (!slug) return;
      let profile: any = null;
      const { data: bySlug } = await supabase.from("profiles").select("*").eq("slug", slug).maybeSingle();
      profile = bySlug;
      if (!profile) {
        const { data: byId } = await supabase.from("profiles").select("*").eq("id", slug).maybeSingle();
        profile = byId;
      }
      if (profile) {
        setSellerProfile(profile);
        const { data: cfgData } = await supabase
          .from("platform_settings")
          .select("value")
          .eq("key", `capture_bot_config_${profile.id}`)
          .maybeSingle();
        if (cfgData?.value) {
          try {
            const parsed = JSON.parse(cfgData.value);
            setConfig({ ...DEFAULT_CONFIG, ...parsed });
          } catch {}
        }
      }
      setLoading(false);
    };
    load();
  }, [slug]);

  const addBotMsg = useCallback((text: string): Promise<void> => {
    return new Promise((resolve) => {
      setTyping(true);
      setTimeout(() => {
        setTyping(false);
        setMessages((prev) => [...prev, { id: `bot-${Date.now()}-${Math.random()}`, text, sender: "bot" }]);
        resolve();
      }, 800 + Math.random() * 600);
    });
  }, []);

  const addBotMsgInstant = useCallback((text: string) => {
    setMessages((prev) => [...prev, { id: `bot-${Date.now()}-${Math.random()}`, text, sender: "bot" }]);
  }, []);

  const addUserMsg = useCallback((text: string) => {
    setMessages((prev) => [...prev, { id: `user-${Date.now()}`, text, sender: "user" }]);
  }, []);

  // ─── AI Mode Logic ───
  // Extracted lead data from AI tool calling
  const [aiExtractedData, setAiExtractedData] = useState<{
    full_name?: string;
    phone?: string;
    property_type?: string;
    address?: string;
    desired_price?: string;
    notes?: string;
    finality?: string;
  } | null>(null);
  const [aiLeadSaved, setAiLeadSaved] = useState(false);

  const startAiChat = useCallback(async () => {
    setTyping(true);
    try {
      const sellerName = sellerProfile?.company_name || sellerProfile?.full_name || "";
      const { data, error } = await supabase.functions.invoke("capture-chat", {
        body: { messages: [], sellerName },
      });
      if (error) throw error;
      const reply = data?.reply || "Olá! 👋 Vou te ajudar a cadastrar seu imóvel. Qual é o seu nome? 😊";
      setAiMessages([{ role: "assistant", content: reply }]);
      addBotMsgInstant(reply);
    } catch (e) {
      console.error("AI start error:", e);
      const fallback = "Olá! 👋 Vou te ajudar a cadastrar seu imóvel. Qual é o seu nome? 😊";
      addBotMsgInstant(fallback);
      setAiMessages([{ role: "assistant", content: fallback }]);
    }
    setTyping(false);
  }, [sellerProfile, addBotMsgInstant]);

  useEffect(() => {
    if (isAiMode && !loading && sellerProfile && messages.length === 0) {
      startAiChat();
    }
  }, [isAiMode, loading, sellerProfile, startAiChat]);

  // Auto-save extracted lead to CRM
  const saveExtractedLeadRef = useRef(false);
  const saveExtractedLead = useCallback(async (extracted: { full_name?: string; phone?: string; property_type?: string; address?: string; desired_price?: string; notes?: string; finality?: string }) => {
    if (!sellerProfile || saveExtractedLeadRef.current) return;
    saveExtractedLeadRef.current = true;
    setAiLeadSaved(true);
    try {
      const priceNum = extracted.desired_price ? parseFloat(extracted.desired_price.replace(/\D/g, "")) || null : null;
      await supabase.from("property_capture_leads" as any).insert({
        seller_id: sellerProfile.id,
        seller_user_id: sellerProfile.user_id,
        full_name: (extracted.full_name || "").slice(0, 100),
        phone: (extracted.phone || "").slice(0, 20),
        property_type: extracted.property_type || "outros",
        address: extracted.address || null,
        desired_price: priceNum,
        description: [
          extracted.finality ? `Finalidade: ${extracted.finality}` : null,
          extracted.notes || null,
          "Lead capturado via chat IA de captação",
        ].filter(Boolean).join("\n"),
        status: "novo",
      });
    } catch (e) {
      console.error("Auto-save lead error:", e);
    }
  }, [sellerProfile]);

  const sendAiMessage = async () => {
    const text = aiInput.trim();
    if (!text || aiLoading) return;
    setAiInput("");
    addUserMsg(text);

    const updatedMessages = [...aiMessages, { role: "user" as const, content: text }];
    setAiMessages(updatedMessages);
    setAiLoading(true);
    setTyping(true);

    try {
      const sellerName = sellerProfile?.company_name || sellerProfile?.full_name || "";
      const { data, error } = await supabase.functions.invoke("capture-chat", {
        body: { messages: updatedMessages, sellerName },
      });
      if (error) throw error;
      const reply = data?.reply || "Desculpe, tente novamente!";
      setAiMessages((prev) => [...prev, { role: "assistant", content: reply }]);
      addBotMsgInstant(reply);

      // Check for extracted data from AI tool calling
      if (data?.extractedData) {
        const extracted = data.extractedData;
        setAiExtractedData(prev => ({ ...prev, ...extracted }));
        // Auto-save to CRM
        await saveExtractedLead(extracted);
        // Update local state for WhatsApp redirect
        if (extracted.full_name) setFullName(extracted.full_name);
        if (extracted.phone) setPhone(extracted.phone);
        if (extracted.property_type) setPropertyType(extracted.property_type);
        if (extracted.address) setAddress(extracted.address);
        if (extracted.desired_price) setDesiredPrice(extracted.desired_price);
        if (extracted.notes) setNotes(extracted.notes);
        // Show WhatsApp button directly (no form needed)
        setTimeout(() => {
          setCrmSaved(true);
          setShowCrmForm(true);
        }, 800);
      } else {
        // Fallback: detect trigger phrases
        const lower = reply.toLowerCase();
        const triggerPhrases = [
          "botão abaixo", "clica no botão", "enviar seus dados",
          "preencha o formulário", "formulário abaixo", "dados foram coletados",
          "confirmar seus dados", "confirme seus dados", "enviar as informações",
          "pronto para enviar", "envie seus dados", "cadastrar seus dados",
          "clique abaixo", "finalize o cadastro", "concluir o cadastro",
          "dados de contato", "salvar seus dados", "registrar seus dados",
        ];
        const shouldShowForm = triggerPhrases.some(p => lower.includes(p));
        const userMsgCount = updatedMessages.filter(m => m.role === "user").length;
        if (shouldShowForm || userMsgCount >= 6) {
          setTimeout(() => setShowCrmForm(true), 500);
        }
      }
    } catch (e) {
      console.error("AI error:", e);
      addBotMsgInstant("Ops! Algo deu errado. Tente novamente 😊");
    }
    setAiLoading(false);
    setTyping(false);
  };

  // ─── Flow Mode Logic ───
  const getOpeningMessage = () => {
    if (config.openingMessage !== DEFAULT_CONFIG.openingMessage) return config.openingMessage;
    return FLOW_OPENINGS[flowType] || config.openingMessage;
  };

  const getFirstQuestion = () => {
    switch (flowType) {
      case "grupo_whatsapp": return config.grupoMsgName;
      case "agendamento": return config.agendMsgName;
      case "avaliacao": return config.avalMsgName;
      default: return config.flowMsgName;
    }
  };

  useEffect(() => {
    if (!isAiMode && !loading && sellerProfile && step === "opening" && messages.length === 0) {
      (async () => {
        await addBotMsg(getOpeningMessage());
        await addBotMsg(getFirstQuestion());
        setStep("name");
        setInputVisible(true);
      })();
    }
  }, [loading, sellerProfile, step, messages.length, addBotMsg, isAiMode]);

  // Auto-scroll
  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [messages, typing, inputVisible, showCrmForm]);

  useEffect(() => {
    if (inputVisible && inputRef.current) setTimeout(() => inputRef.current?.focus(), 100);
  }, [inputVisible, step]);

  // ─── Captação Flow ───
  const handleCaptacaoFlow = async (val: string) => {
    switch (step) {
      case "name":
        setFullName(val);
        addUserMsg(val);
        await addBotMsg(config.flowMsgNameReply.replace("{nome}", val));
        await addBotMsg(config.flowMsgPhone);
        setStep("phone");
        setInputVisible(true);
        break;
      case "phone":
        setPhone(val);
        addUserMsg(val);
        await addBotMsg(config.flowMsgType);
        setStep("type");
        break;
      case "address":
        setAddress(val);
        addUserMsg(val);
        await addBotMsg(config.flowMsgPrice);
        setStep("price");
        setInputVisible(true);
        break;
      case "price":
        const priceVal = val || "0";
        setDesiredPrice(priceVal);
        addUserMsg(priceVal === "0" || !val ? "Sem valor definido" : `R$ ${priceVal}`);
        await addBotMsg(config.flowMsgNotes);
        setStep("notes");
        setInputVisible(true);
        break;
      case "notes":
        const notesVal = val || "";
        setNotes(notesVal);
        if (notesVal) addUserMsg(notesVal);
        else addUserMsg("Sem observações");
        await submitCaptacaoLead(fullName, phone, propertyType, address, desiredPrice || "0", notesVal);
        break;
    }
  };

  // ─── Grupo WhatsApp Flow ───
  const handleGrupoFlow = async (val: string) => {
    switch (step) {
      case "name":
        setFullName(val);
        addUserMsg(val);
        await addBotMsg(config.grupoMsgNameReply.replace("{nome}", val));
        await addBotMsg(config.grupoMsgPhone);
        setStep("phone");
        setInputVisible(true);
        break;
      case "phone":
        setPhone(val);
        addUserMsg(val);
        await submitGrupoLead(fullName, val);
        break;
    }
  };

  // ─── Agendamento Flow ───
  const handleAgendamentoFlow = async (val: string) => {
    switch (step) {
      case "name":
        setFullName(val);
        addUserMsg(val);
        await addBotMsg(config.agendMsgNameReply.replace("{nome}", val));
        await addBotMsg(config.agendMsgPhone);
        setStep("phone");
        setInputVisible(true);
        break;
      case "phone":
        setPhone(val);
        addUserMsg(val);
        await addBotMsg(config.agendMsgInterest);
        setStep("interest" as Step);
        setInputVisible(true);
        break;
      case "interest":
        setInterest(val);
        addUserMsg(val);
        await addBotMsg(config.agendMsgDate);
        setStep("date" as Step);
        setInputVisible(true);
        break;
      case "date":
        setVisitDate(val);
        addUserMsg(val);
        await addBotMsg(config.agendMsgTime);
        setStep("time" as Step);
        break;
      case "time":
        setVisitTime(val);
        addUserMsg(val);
        await submitAgendLead(fullName, phone, interest, visitDate, val);
        break;
    }
  };

  // ─── Avaliação Flow ───
  const handleAvaliacaoFlow = async (val: string) => {
    switch (step) {
      case "name":
        setFullName(val);
        addUserMsg(val);
        await addBotMsg(config.avalMsgNameReply.replace("{nome}", val));
        await addBotMsg(config.avalMsgPhone);
        setStep("phone");
        setInputVisible(true);
        break;
      case "phone":
        setPhone(val);
        addUserMsg(val);
        await addBotMsg(config.avalMsgType);
        setStep("type");
        break;
      case "address":
        setAddress(val);
        addUserMsg(val);
        await addBotMsg(config.avalMsgDetails);
        setStep("details" as Step);
        setInputVisible(true);
        break;
      case "details":
        setDetails(val || "");
        if (val) addUserMsg(val);
        else addUserMsg("Sem detalhes adicionais");
        await submitAvalLead(fullName, phone, propertyType, address, val || "");
        break;
    }
  };

  const handleSend = async () => {
    const val = inputValue.trim();
    // Allow empty for optional fields
    const optionalSteps = ["price", "notes", "details"];
    if (!val && !optionalSteps.includes(step)) return;
    setInputVisible(false);
    setInputValue("");

    switch (flowType) {
      case "captacao": await handleCaptacaoFlow(val); break;
      case "grupo_whatsapp": await handleGrupoFlow(val); break;
      case "agendamento": await handleAgendamentoFlow(val); break;
      case "avaliacao": await handleAvaliacaoFlow(val); break;
    }
  };

  const handleTypeSelect = async (type: string, label: string) => {
    setPropertyType(type);
    addUserMsg(label);
    if (flowType === "captacao") {
      await addBotMsg(config.flowMsgAddress);
      setStep("address");
    } else if (flowType === "avaliacao") {
      await addBotMsg(config.avalMsgAddress);
      setStep("address");
    }
    setInputVisible(true);
  };

  const handleTimeSelect = async (time: string, label: string) => {
    setVisitTime(time);
    addUserMsg(label);
    await submitAgendLead(fullName, phone, interest, visitDate, time);
  };

  // ─── Submit functions ───
  const submitCaptacaoLead = async (name: string, ph: string, type: string, addr: string, price: string, obs: string) => {
    if (!sellerProfile || submitted) return;
    setSubmitted(true);
    const priceNum = parseFloat(price.replace(/\D/g, "")) || null;
    await supabase.from("property_capture_leads" as any).insert({
      seller_id: sellerProfile.id,
      seller_user_id: sellerProfile.user_id,
      full_name: name,
      phone: ph,
      property_type: type,
      address: addr || null,
      desired_price: priceNum,
      description: obs || null,
      status: "novo",
    });
    await addBotMsg(config.flowMsgSuccess);
    await addBotMsg(config.flowMsgSuccessEnd);
    setStep("done");
  };

  const submitGrupoLead = async (name: string, ph: string) => {
    if (!sellerProfile || submitted) return;
    setSubmitted(true);
    await supabase.from("property_capture_leads" as any).insert({
      seller_id: sellerProfile.id,
      seller_user_id: sellerProfile.user_id,
      full_name: name,
      phone: ph,
      property_type: "outros",
      description: "Lead via fluxo Grupo de WhatsApp",
      status: "novo",
    });
    await addBotMsg(config.grupoMsgSuccess);
    await addBotMsg(config.grupoMsgSuccessEnd);
    setStep("done");
  };

  const submitAgendLead = async (name: string, ph: string, interestVal: string, date: string, time: string) => {
    if (!sellerProfile || submitted) return;
    setSubmitted(true);
    await supabase.from("property_capture_leads" as any).insert({
      seller_id: sellerProfile.id,
      seller_user_id: sellerProfile.user_id,
      full_name: name,
      phone: ph,
      property_type: "outros",
      address: interestVal || null,
      description: `Agendamento de visita\n📅 Data: ${date}\n⏰ Horário: ${time}\n🏠 Interesse: ${interestVal}`,
      status: "novo",
    });
    await addBotMsg(config.agendMsgSuccess);
    await addBotMsg(config.agendMsgSuccessEnd);
    setStep("done");
  };

  const submitAvalLead = async (name: string, ph: string, type: string, addr: string, detailsVal: string) => {
    if (!sellerProfile || submitted) return;
    setSubmitted(true);
    await supabase.from("property_capture_leads" as any).insert({
      seller_id: sellerProfile.id,
      seller_user_id: sellerProfile.user_id,
      full_name: name,
      phone: ph,
      property_type: type,
      address: addr || null,
      description: `Solicitação de avaliação gratuita\n📝 Detalhes: ${detailsVal || "Não informado"}`,
      status: "novo",
    });
    await addBotMsg(config.avalMsgSuccess);
    await addBotMsg(config.avalMsgSuccessEnd);
    setStep("done");
  };

  const handleCrmSubmit = async () => {
    if (!crmName.trim() || !crmPhone.trim() || !sellerProfile) return;
    setCrmSaving(true);
    try {
      await supabase.from("property_capture_leads" as any).insert({
        seller_id: sellerProfile.id,
        seller_user_id: sellerProfile.user_id,
        full_name: crmName.trim(),
        phone: crmPhone.trim(),
        property_type: crmPropertyType || "outros",
        address: crmAddress || null,
        desired_price: null,
        description: "Lead capturado via chat IA de captação",
        status: "novo",
      });
      setCrmSaved(true);
      addBotMsgInstant("✅ Seus dados foram enviados com sucesso! Em breve entraremos em contato 🤝");
    } catch (e) {
      console.error("CRM save error:", e);
    }
    setCrmSaving(false);
  };

  const handleWhatsAppRedirect = () => {
    if (!sellerProfile?.phone) return;
    const cleanPhone = sellerProfile.phone.replace(/\D/g, "");

    // AI mode: use extracted data or local state
    const leadName = fullName || crmName || aiExtractedData?.full_name || "";
    const leadPhone = phone || aiExtractedData?.phone || "";
    const leadType = propertyType || crmPropertyType || aiExtractedData?.property_type || "";
    const leadAddress = address || crmAddress || aiExtractedData?.address || "";
    const leadPrice = desiredPrice || aiExtractedData?.desired_price || "";
    const leadNotes = notes || aiExtractedData?.notes || "";
    const leadFinality = aiExtractedData?.finality || "";

    let msg = "";
    if (isAiMode) {
      // AI mode: comprehensive pre-filled message
      const parts = [
        `Olá! Acabei de cadastrar meu imóvel pelo chat com IA:\n`,
        `📋 Nome: ${leadName}`,
        leadPhone ? `📱 WhatsApp: ${leadPhone}` : null,
        leadType ? `🏠 Tipo: ${leadType}` : null,
        leadAddress ? `📍 Endereço: ${leadAddress}` : null,
        leadFinality ? `📌 Finalidade: ${leadFinality}` : null,
        leadPrice && leadPrice !== "0" ? `💰 Valor: R$ ${leadPrice}` : null,
        leadNotes ? `📝 Obs: ${leadNotes}` : null,
        `\nAguardo retorno!`,
      ].filter(Boolean).join("\n");
      msg = encodeURIComponent(parts);
    } else {
      switch (flowType) {
        case "captacao":
          msg = encodeURIComponent(
            `Olá! Acabei de cadastrar meu imóvel pelo chat:\n\n` +
            `📋 Nome: ${leadName}\n` +
            `🏠 Tipo: ${leadType || "Não informado"}\n` +
            `📍 Endereço: ${leadAddress || "Não informado"}\n` +
            `💰 Valor: ${leadPrice && leadPrice !== "0" ? `R$ ${leadPrice}` : "A definir"}\n\n` +
            `Aguardo retorno!`
          );
          break;
        case "grupo_whatsapp":
          if (config.grupoWhatsappLink) {
            window.open(config.grupoWhatsappLink, "_blank", "noopener");
            return;
          }
          msg = encodeURIComponent(
            `Olá! Me cadastrei pelo chat e gostaria de entrar no grupo de imóveis!\n\n` +
            `📋 Nome: ${fullName}\n📱 WhatsApp: ${phone}`
          );
          break;
        case "agendamento":
          msg = encodeURIComponent(
            `Olá! Acabei de agendar uma visita pelo chat:\n\n` +
            `📋 Nome: ${fullName}\n` +
            `🏠 Interesse: ${interest || "Não informado"}\n` +
            `📅 Data: ${visitDate || "Não informado"}\n` +
            `⏰ Horário: ${visitTime || "Não informado"}\n\n` +
            `Aguardo confirmação!`
          );
          break;
        case "avaliacao":
          msg = encodeURIComponent(
            `Olá! Solicitei uma avaliação gratuita pelo chat:\n\n` +
            `📋 Nome: ${fullName}\n` +
            `🏠 Tipo: ${propertyType || "Não informado"}\n` +
            `📍 Endereço: ${address || "Não informado"}\n` +
            `📝 Detalhes: ${details || "Não informado"}\n\n` +
            `Aguardo retorno!`
          );
          break;
      }
    }
    window.open(`https://wa.me/${cleanPhone}?text=${msg}`, "_blank", "noopener");
  };

  const now = new Date();
  const timeStr = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#e5ddd5" }}>
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#25d366]/30 border-t-[#25d366]" />
      </div>
    );
  }

  if (!sellerProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#e5ddd5" }}>
        <p className="text-[#667781]">Corretor não encontrado</p>
      </div>
    );
  }

  const displayName = sellerProfile.company_name || sellerProfile.full_name || config.attendantName;
  const showAiInput = isAiMode && !showCrmForm && !aiLeadSaved;
  const showFlowInput = !isAiMode && inputVisible && step !== "done" && step !== "type" && step !== "time";
  const isDone = isAiMode ? (aiLeadSaved || crmSaved) : step === "done";

  const getCtaLabel = () => {
    switch (flowType) {
      case "grupo_whatsapp": return config.grupoWhatsappLink ? "🔗 Entrar no Grupo" : "💬 Falar no WhatsApp";
      case "agendamento": return "💬 Confirmar Agendamento";
      case "avaliacao": return "💬 Falar com Especialista";
      default: return "💬 Falar no WhatsApp";
    }
  };

  const getInputPlaceholder = () => {
    switch (step) {
      case "name": return "Seu nome completo...";
      case "phone": return "Seu WhatsApp...";
      case "address": return "Endereço ou localização...";
      case "price": return "Valor desejado (R$)...";
      case "notes": return "Observações (opcional)...";
      case "interest": return "Imóvel ou região de interesse...";
      case "date": return "Data preferida (ex: 20/01)...";
      case "details": return "Detalhes do imóvel...";
      default: return "Digite...";
    }
  };

  const getInputType = () => {
    if (step === "phone") return "tel";
    if (step === "price") return "number";
    return "text";
  };

  return (
    <>
      <Helmet>
        <title>Cadastre seu imóvel | {displayName}</title>
        <meta name="description" content={`Cadastre seu imóvel gratuitamente com ${displayName}. Avaliação profissional e divulgação em múltiplas plataformas.`} />
        <link rel="canonical" href={`${SITE_URL}/captar-imovel/${slug}/chat`} />
      </Helmet>

      <div className="min-h-screen flex flex-col" style={{ background: "#e5ddd5" }}>
        {/* Header */}
        <div className="sticky top-0 z-50 flex items-center gap-3 px-3 py-2" style={{ background: "#075e54" }}>
          <button onClick={() => navigate(-1)} className="text-white/80 hover:text-white">
            <ArrowLeft size={22} />
          </button>
          <div className="w-10 h-10 rounded-full bg-[#128c7e] flex items-center justify-center text-white font-bold text-lg overflow-hidden shrink-0">
            {config.attendantAvatar ? (
              <img src={config.attendantAvatar} alt="" className="w-full h-full object-cover" />
            ) : sellerProfile.logo_url ? (
              <img src={sellerProfile.logo_url} alt="" className="w-full h-full object-cover" />
            ) : (
              displayName.charAt(0).toUpperCase()
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white font-semibold text-sm truncate">{config.attendantName || displayName}</p>
            <p className="text-[#8eddd4] text-xs">online</p>
          </div>
          <div className="flex items-center gap-4 text-white/80">
            <Video size={20} /><Phone size={20} /><MoreVertical size={20} />
          </div>
        </div>

        {/* Chat area */}
        <div ref={chatRef} className="flex-1 overflow-y-auto px-3 py-4 space-y-1" style={{ background: "#e5ddd5" }}>
          <div className="flex justify-center mb-3">
            <span className="bg-white/80 text-[#667781] text-[11px] px-3 py-1 rounded-lg shadow-sm font-medium">Hoje</span>
          </div>

          <AnimatePresence>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 12, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"} mb-1`}
              >
                <div className={`relative max-w-[85%] px-3 py-1.5 rounded-lg shadow-sm text-[14.5px] leading-[19px] ${
                  msg.sender === "user"
                    ? "bg-[#d9fdd3] text-[#111b21] rounded-tr-none"
                    : "bg-white text-[#111b21] rounded-tl-none"
                }`}>
                  <span className="whitespace-pre-wrap">{msg.text}</span>
                  <span className="float-right mt-1 ml-2 flex items-center gap-0.5 text-[11px] text-[#667781]">
                    {timeStr}
                    {msg.sender === "user" && <CheckCheck size={14} className="text-[#53bdeb] ml-0.5" />}
                  </span>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Typing indicator */}
          {typing && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start mb-1">
              <div className="bg-white px-4 py-2 rounded-lg rounded-tl-none shadow-sm">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-[#9e9e9e] rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-2 h-2 bg-[#9e9e9e] rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-2 h-2 bg-[#9e9e9e] rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </motion.div>
          )}

          {/* Flow: Property type buttons (Captação + Avaliação) */}
          <AnimatePresence>
            {!isAiMode && step === "type" && !typing && (flowType === "captacao" || flowType === "avaliacao") && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex flex-wrap gap-2 pt-3 pb-2 justify-center">
                {PROPERTY_TYPES.map((t) => (
                  <button
                    key={t.value}
                    onClick={() => handleTypeSelect(t.value, t.label)}
                    className="px-4 py-2.5 rounded-full shadow-md text-sm font-medium transition-all active:scale-95"
                    style={{ background: "#00a884", color: "white" }}
                  >
                    {t.label}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Flow: Time buttons (Agendamento) */}
          <AnimatePresence>
            {!isAiMode && step === "time" && !typing && flowType === "agendamento" && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex flex-wrap gap-2 pt-3 pb-2 justify-center">
                {TIME_OPTIONS.map((t) => (
                  <button
                    key={t.value}
                    onClick={() => handleTimeSelect(t.value, t.label)}
                    className="px-4 py-2.5 rounded-full shadow-md text-sm font-medium transition-all active:scale-95"
                    style={{ background: "#00a884", color: "white" }}
                  >
                    {t.label}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* AI mode: CRM form (fallback) or WhatsApp button (when AI extracted data) */}
          <AnimatePresence>
            {isAiMode && showCrmForm && !aiLeadSaved && !crmSaved && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="flex flex-col items-center gap-3 pt-4 pb-8 px-4">
                <div className="bg-white rounded-2xl shadow-lg p-5 w-full max-w-sm space-y-3">
                  <p className="text-sm font-semibold text-[#075e54] text-center">📋 Confirme seus dados para contato!</p>
                  <input
                    type="text"
                    value={crmName}
                    onChange={(e) => setCrmName(e.target.value)}
                    placeholder="Seu nome"
                    className="w-full bg-[#f0f2f5] rounded-full px-4 py-2.5 text-sm text-[#111b21] outline-none focus:ring-2 focus:ring-[#00a884]/40 placeholder:text-[#667781]"
                  />
                  <input
                    type="tel"
                    value={crmPhone}
                    onChange={(e) => setCrmPhone(e.target.value)}
                    placeholder="WhatsApp (ex: 27999999999)"
                    className="w-full bg-[#f0f2f5] rounded-full px-4 py-2.5 text-sm text-[#111b21] outline-none focus:ring-2 focus:ring-[#00a884]/40 placeholder:text-[#667781]"
                    maxLength={15}
                  />
                  <select
                    value={crmPropertyType}
                    onChange={(e) => setCrmPropertyType(e.target.value)}
                    className="w-full bg-[#f0f2f5] rounded-full px-4 py-2.5 text-sm text-[#111b21] outline-none focus:ring-2 focus:ring-[#00a884]/40"
                  >
                    <option value="">Tipo do imóvel (opcional)</option>
                    {PROPERTY_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={crmAddress}
                    onChange={(e) => setCrmAddress(e.target.value)}
                    placeholder="Endereço ou localização (opcional)"
                    className="w-full bg-[#f0f2f5] rounded-full px-4 py-2.5 text-sm text-[#111b21] outline-none focus:ring-2 focus:ring-[#00a884]/40 placeholder:text-[#667781]"
                  />
                  <Button
                    onClick={handleCrmSubmit}
                    disabled={!crmName.trim() || !crmPhone.trim() || crmSaving}
                    className="w-full bg-[#25d366] hover:bg-[#22c55e] text-white font-bold rounded-full py-5"
                  >
                    {crmSaving ? "Enviando..." : "Enviar meus dados 🚀"}
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Done state (both modes) */}
          <AnimatePresence>
            {isDone && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: "easeOut" }} className="flex flex-col items-center gap-3 pt-4 pb-8">
                {(sellerProfile.phone || (flowType === "grupo_whatsapp" && config.grupoWhatsappLink)) && (
                  <Button
                    onClick={handleWhatsAppRedirect}
                    className="bg-[#25d366] hover:bg-[#22c55e] text-white font-bold text-base px-8 py-6 rounded-full shadow-lg animate-pulse"
                    size="lg"
                  >
                    {getCtaLabel()}
                  </Button>
                )}
                <p className="text-[#667781] text-xs text-center">
                  {flowType === "grupo_whatsapp"
                    ? "Seus dados foram salvos • Clique acima para entrar no grupo"
                    : flowType === "agendamento"
                    ? "Seus dados foram salvos • Aguarde a confirmação do agendamento"
                    : flowType === "avaliacao"
                    ? "Seus dados foram salvos • Um especialista entrará em contato"
                    : "Seus dados foram salvos • O corretor entrará em contato"
                  }
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Input bar */}
        <div className="sticky bottom-0 flex items-center gap-2 px-2 py-2" style={{ background: "#f0f2f5" }}>
          {showAiInput ? (
            <>
              {aiMessages.filter(m => m.role === "user").length >= 4 && !showCrmForm && (
                <button
                  onClick={() => setShowCrmForm(true)}
                  className="px-3 py-2.5 rounded-full text-xs font-semibold text-white shrink-0"
                  style={{ background: "#25d366" }}
                >
                  📋 Enviar dados
                </button>
              )}
              <input
                ref={inputRef}
                type="text"
                value={aiInput}
                onChange={(e) => setAiInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendAiMessage()}
                placeholder="Digite sua mensagem..."
                className="flex-1 bg-white rounded-full px-4 py-2.5 text-sm text-[#111b21] outline-none focus:ring-2 focus:ring-[#00a884]/40 placeholder:text-[#667781]"
                maxLength={500}
                disabled={aiLoading}
              />
              <button
                onClick={sendAiMessage}
                disabled={!aiInput.trim() || aiLoading}
                className="w-10 h-10 rounded-full flex items-center justify-center text-white transition-colors disabled:opacity-40"
                style={{ background: "#00a884" }}
              >
                <Send size={18} />
              </button>
            </>
          ) : showFlowInput ? (
            <>
              <Input
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder={getInputPlaceholder()}
                type={getInputType()}
                className="flex-1 rounded-full border-0 bg-white px-4 py-2.5 text-sm text-[#111b21] shadow-sm focus-visible:ring-0"
              />
              <button
                onClick={handleSend}
                className="w-10 h-10 rounded-full bg-[#00a884] flex items-center justify-center text-white shrink-0 active:scale-95 transition-transform"
              >
                <Send size={18} />
              </button>
            </>
          ) : (
            <>
              <div className="flex-1 bg-white rounded-full px-4 py-2.5 text-sm text-[#667781]">
                {!isAiMode && step === "type" ? "Selecione o tipo acima..." :
                 !isAiMode && step === "time" ? "Selecione o horário acima..." :
                 "Mensagem"}
              </div>
              <div className="w-10 h-10 rounded-full bg-[#00a884]/50 flex items-center justify-center text-white">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M1.101 21.757L23.8 12.028 1.101 2.3l.011 7.912 13.239 1.816-13.239 1.817-.011 7.912z" />
                </svg>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
