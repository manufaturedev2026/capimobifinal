import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCheck, ArrowLeft, Phone, Video, MoreVertical, ChevronDown } from "lucide-react";
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
}

const DEFAULT_CONFIG: BotConfig = {
  attendantName: "Assistente Imobiliário",
  attendantAvatar: "",
  openingMessage: "Olá! 👋 Vou te ajudar a cadastrar seu imóvel para avaliação gratuita! É rápido e sem compromisso 🏡",
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

  // Collected data
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [propertyType, setPropertyType] = useState("");
  const [address, setAddress] = useState("");
  const [desiredPrice, setDesiredPrice] = useState("");
  const [notes, setNotes] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  // Load seller + bot config
  useEffect(() => {
    const load = async () => {
      if (!slug) return;

      // Find seller by slug or id
      let profile: any = null;
      const { data: bySlug } = await supabase
        .from("profiles")
        .select("*")
        .eq("slug", slug)
        .maybeSingle();
      profile = bySlug;

      if (!profile) {
        const { data: byId } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", slug)
          .maybeSingle();
        profile = byId;
      }

      if (profile) {
        setSellerProfile(profile);

        // Load bot config from platform_settings
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

  const addUserMsg = useCallback((text: string) => {
    setMessages((prev) => [...prev, { id: `user-${Date.now()}`, text, sender: "user" }]);
  }, []);

  // Start conversation
  useEffect(() => {
    if (!loading && sellerProfile && step === "opening" && messages.length === 0) {
      (async () => {
        await addBotMsg(config.openingMessage);
        await addBotMsg("Vamos começar? Me diz o seu nome completo 😊");
        setStep("name");
        setInputVisible(true);
      })();
    }
  }, [loading, sellerProfile, step, messages.length, addBotMsg, config.openingMessage]);

  // Auto-scroll
  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages, typing, inputVisible]);

  // Focus input when visible
  useEffect(() => {
    if (inputVisible && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
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
        await addBotMsg(`Prazer, ${val}! 🤝`);
        await addBotMsg("Qual seu telefone ou WhatsApp? 📱");
        setStep("phone");
        setInputVisible(true);
        break;

      case "phone":
        setPhone(val);
        addUserMsg(val);
        await addBotMsg("Perfeito! Agora me diz: qual o tipo do imóvel? 🏠");
        setStep("type");
        // type uses buttons, no input
        break;

      case "address":
        setAddress(val);
        addUserMsg(val);
        await addBotMsg("Tem um valor em mente para o imóvel? 💰\n\n(Se não tiver, pode digitar 0 ou pular)");
        setStep("price");
        setInputVisible(true);
        break;

      case "price":
        const priceVal = val || "0";
        setDesiredPrice(priceVal);
        addUserMsg(priceVal === "0" || !val ? "Sem valor definido" : `R$ ${priceVal}`);
        await addBotMsg("Alguma observação sobre o imóvel? 📝\n\n(Opcional - pode enviar vazio para pular)");
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
    await addBotMsg("Ótimo! Qual o endereço ou localização do imóvel? 📍");
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

  const handleWhatsAppRedirect = () => {
    if (!sellerProfile?.phone) return;
    const cleanPhone = sellerProfile.phone.replace(/\D/g, "");
    const msg = encodeURIComponent(
      `Olá! Acabei de cadastrar meu imóvel pelo chat:\n\n` +
      `📋 Nome: ${fullName}\n` +
      `🏠 Tipo: ${propertyType}\n` +
      `📍 Endereço: ${address || "Não informado"}\n` +
      `💰 Valor: ${desiredPrice && desiredPrice !== "0" ? `R$ ${desiredPrice}` : "A definir"}\n` +
      `📝 Obs: ${notes || "Nenhuma"}\n\n` +
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
            <Video size={20} />
            <Phone size={20} />
            <MoreVertical size={20} />
          </div>
        </div>

        {/* Chat area */}
        <div ref={chatRef} className="flex-1 overflow-y-auto px-3 py-4 space-y-1" style={{ background: "#e5ddd5" }}>
          {/* Date chip */}
          <div className="flex justify-center mb-3">
            <span className="bg-white/80 text-[#667781] text-[11px] px-3 py-1 rounded-lg shadow-sm font-medium">
              Hoje
            </span>
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
                <div
                  className={`relative max-w-[85%] px-3 py-1.5 rounded-lg shadow-sm text-[14.5px] leading-[19px] ${
                    msg.sender === "user"
                      ? "bg-[#d9fdd3] text-[#111b21] rounded-tr-none"
                      : "bg-white text-[#111b21] rounded-tl-none"
                  }`}
                >
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

          {/* Property type buttons */}
          <AnimatePresence>
            {step === "type" && !typing && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex flex-wrap gap-2 pt-3 pb-2 justify-center"
              >
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

          {/* Done - WhatsApp redirect */}
          <AnimatePresence>
            {step === "done" && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="flex flex-col items-center gap-3 pt-4 pb-8"
              >
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
        {inputVisible && step !== "done" && step !== "type" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="sticky bottom-0 flex items-center gap-2 px-2 py-2"
            style={{ background: "#f0f2f5" }}
          >
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
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M1.101 21.757L23.8 12.028 1.101 2.3l.011 7.912 13.239 1.816-13.239 1.817-.011 7.912z" />
              </svg>
            </button>
          </motion.div>
        )}

        {/* Static input bar for non-input steps */}
        {(!inputVisible || step === "type") && step !== "done" && (
          <div className="sticky bottom-0 flex items-center gap-2 px-2 py-2" style={{ background: "#f0f2f5" }}>
            <div className="flex-1 bg-white rounded-full px-4 py-2.5 text-sm text-[#667781]">
              {step === "type" ? "Selecione o tipo acima..." : "Mensagem"}
            </div>
            <div className="w-10 h-10 rounded-full bg-[#00a884]/50 flex items-center justify-center text-white">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M1.101 21.757L23.8 12.028 1.101 2.3l.011 7.912 13.239 1.816-13.239 1.817-.011 7.912z" />
              </svg>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
