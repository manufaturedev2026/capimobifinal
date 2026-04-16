import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCheck, ArrowLeft, Phone, Video, MoreVertical, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useParams, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { SITE_URL } from "@/lib/siteUrl";

interface BotConfig {
  attendantName: string;
  attendantAvatar: string;
  openingMessage: string;
  chatMode: "flow" | "ai";
  flowMsgName: string;
  flowMsgNameReply: string;
  flowMsgPhone: string;
  flowMsgType: string;
  flowMsgAddress: string;
  flowMsgPrice: string;
  flowMsgNotes: string;
  flowMsgSuccess: string;
  flowMsgSuccessEnd: string;
}

const DEFAULT_CONFIG: BotConfig = {
  attendantName: "Assistente Imobiliário",
  attendantAvatar: "",
  openingMessage: "Olá! 👋 Vou te ajudar a cadastrar seu imóvel para avaliação gratuita! É rápido e sem compromisso 🏡",
  chatMode: "flow",
  flowMsgName: "Vamos começar? Me diz o seu nome completo 😊",
  flowMsgNameReply: "Prazer, {nome}! 🤝",
  flowMsgPhone: "Qual seu telefone ou WhatsApp? 📱",
  flowMsgType: "Perfeito! Agora me diz: qual o tipo do imóvel? 🏠",
  flowMsgAddress: "Ótimo! Qual o endereço ou localização do imóvel? 📍",
  flowMsgPrice: "Tem um valor em mente para o imóvel? 💰\n\n(Se não tiver, pode digitar 0 ou pular)",
  flowMsgNotes: "Alguma observação sobre o imóvel? 📝\n\n(Opcional - pode enviar vazio para pular)",
  flowMsgSuccess: "✅ Pronto! Suas informações foram enviadas com sucesso!",
  flowMsgSuccessEnd: "Em breve um corretor vai entrar em contato com você pelo WhatsApp. Obrigado! 🎉",
};

type Step = "opening" | "name" | "phone" | "type" | "address" | "price" | "notes" | "done";

const PROPERTY_TYPES = [
  { value: "casa", label: "🏠 Casa" },
  { value: "apartamento", label: "🏢 Apartamento" },
  { value: "terreno", label: "🌳 Terreno" },
  { value: "comercial", label: "🏪 Comercial" },
  { value: "galpao", label: "🏭 Galpão" },
  { value: "outros", label: "📦 Outros" },
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

  // Collected data (flow mode)
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [propertyType, setPropertyType] = useState("");
  const [address, setAddress] = useState("");
  const [desiredPrice, setDesiredPrice] = useState("");
  const [notes, setNotes] = useState("");
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

      // Check if AI is suggesting form submission
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
      // Also auto-show form after 6+ user messages (enough data collected)
      const userMsgCount = updatedMessages.filter(m => m.role === "user").length;
      if (shouldShowForm || userMsgCount >= 6) {
        setTimeout(() => setShowCrmForm(true), 500);
      }
    } catch (e) {
      console.error("AI error:", e);
      addBotMsgInstant("Ops! Algo deu errado. Tente novamente 😊");
    }
    setAiLoading(false);
    setTyping(false);
  };

  // ─── Flow Mode Logic ───
  useEffect(() => {
   if (!isAiMode && !loading && sellerProfile && step === "opening" && messages.length === 0) {
      (async () => {
        await addBotMsg(config.openingMessage);
        await addBotMsg(config.flowMsgName);
        setStep("name");
        setInputVisible(true);
      })();
    }
  }, [loading, sellerProfile, step, messages.length, addBotMsg, config.openingMessage, config.flowMsgName, isAiMode]);

  // Auto-scroll
  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [messages, typing, inputVisible, showCrmForm]);

  useEffect(() => {
    if (inputVisible && inputRef.current) setTimeout(() => inputRef.current?.focus(), 100);
  }, [inputVisible, step]);

  const handleSend = async () => {
    const val = inputValue.trim();
    if (!val && step !== "price" && step !== "notes") return;
    setInputVisible(false);
    setInputValue("");

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
        await submitLead(fullName, phone, propertyType, address, desiredPrice || "0", notesVal);
        break;
    }
  };

  const handleTypeSelect = async (type: string, label: string) => {
    setPropertyType(type);
    addUserMsg(label);
    await addBotMsg(config.flowMsgAddress);
    setStep("address");
    setInputVisible(true);
  };

  const submitLead = async (name: string, ph: string, type: string, addr: string, price: string, obs: string) => {
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
    await addBotMsg("✅ Pronto! Suas informações foram enviadas com sucesso!");
    await addBotMsg("Em breve um corretor vai entrar em contato com você pelo WhatsApp. Obrigado! 🎉");
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
    const msg = encodeURIComponent(
      `Olá! Acabei de cadastrar meu imóvel pelo chat:\n\n` +
      `📋 Nome: ${fullName || crmName}\n` +
      `🏠 Tipo: ${propertyType || crmPropertyType || "Não informado"}\n` +
      `📍 Endereço: ${address || crmAddress || "Não informado"}\n` +
      `💰 Valor: ${desiredPrice && desiredPrice !== "0" ? `R$ ${desiredPrice}` : "A definir"}\n\n` +
      `Aguardo retorno!`
    );
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
  const showAiInput = isAiMode && !showCrmForm;
  const showFlowInput = !isAiMode && inputVisible && step !== "done" && step !== "type";
  const isDone = isAiMode ? crmSaved : step === "done";

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

          {/* Flow: Property type buttons */}
          <AnimatePresence>
            {!isAiMode && step === "type" && !typing && (
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

          {/* AI mode: CRM form */}
          <AnimatePresence>
            {isAiMode && showCrmForm && !crmSaved && (
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
                {sellerProfile.phone && (
                  <Button
                    onClick={handleWhatsAppRedirect}
                    className="bg-[#25d366] hover:bg-[#22c55e] text-white font-bold text-base px-8 py-6 rounded-full shadow-lg animate-pulse"
                    size="lg"
                  >
                    💬 Falar no WhatsApp
                  </Button>
                )}
                <p className="text-[#667781] text-xs text-center">
                  Seus dados foram salvos • O corretor entrará em contato
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
                placeholder={
                  step === "name" ? "Seu nome completo..." :
                  step === "phone" ? "Seu WhatsApp..." :
                  step === "address" ? "Endereço ou localização..." :
                  step === "price" ? "Valor desejado (R$)..." :
                  step === "notes" ? "Observações (opcional)..." :
                  "Digite..."
                }
                type={step === "phone" ? "tel" : step === "price" ? "number" : "text"}
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
                {!isAiMode && step === "type" ? "Selecione o tipo acima..." : "Mensagem"}
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
