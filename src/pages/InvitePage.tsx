import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCheck, ArrowLeft, Phone, Video, MoreVertical, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { SITE_URL } from "@/lib/siteUrl";

interface ChatMessage {
  id: string;
  text: string;
  sender: "attendant" | "user";
  delay: number;
}

const DEFAULT_MESSAGES: ChatMessage[] = [
  { id: "1", text: "Olá! 👋 Seja bem-vindo(a) à Capimobi!", sender: "attendant", delay: 800 },
  { id: "2", text: "Eu sou a Ana, sua consultora digital 😊", sender: "attendant", delay: 2200 },
  { id: "3", text: "Você sabia que pode criar sua loja de imóveis 100% GRÁTIS? 🏠✨", sender: "attendant", delay: 3800 },
  { id: "4", text: "Sério?! Como funciona?", sender: "user", delay: 5500 },
  { id: "5", text: "Sim! Com a Capimobi você tem:\n\n✅ Loja online personalizada\n✅ CRM de leads integrado\n✅ Compartilhamento por WhatsApp\n✅ Página profissional com seu nome\n✅ Cadastro de imóveis ilimitado no plano gratuito", sender: "attendant", delay: 7000 },
  { id: "6", text: "E o melhor: é tudo pelo celular! 📱", sender: "attendant", delay: 9500 },
  { id: "7", text: "Quanto custa?", sender: "user", delay: 11000 },
  { id: "8", text: "O cadastro é GRATUITO! 🎉\n\nVocê já começa com acesso ao painel completo, pode cadastrar seus imóveis e compartilhar sua loja.\n\nSe quiser turbinar, temos planos a partir de R$29/mês com funcionalidades premium!", sender: "attendant", delay: 12500 },
  { id: "9", text: "Quero criar minha conta! 🚀", sender: "user", delay: 15000 },
  { id: "10", text: "Perfeito! Clica no botão abaixo e cria sua conta em menos de 2 minutos! 👇", sender: "attendant", delay: 16500 },
];

/** Group messages into steps: each group = consecutive messages from the same sender */
function buildSteps(msgs: ChatMessage[]): ChatMessage[][] {
  const steps: ChatMessage[][] = [];
  let current: ChatMessage[] = [];
  for (const msg of msgs) {
    if (current.length > 0 && current[0].sender !== msg.sender) {
      steps.push(current);
      current = [];
    }
    current.push(msg);
  }
  if (current.length) steps.push(current);
  return steps;
}

const DEFAULT_ATTENDANT = {
  name: "Ana • Capimobi",
  avatar: "",
};

export default function InvitePage() {
  const [allMessages, setAllMessages] = useState<ChatMessage[]>([]);
  const [steps, setSteps] = useState<ChatMessage[][]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [visibleMessages, setVisibleMessages] = useState<ChatMessage[]>([]);
  const [typing, setTyping] = useState(false);
  const [animatingStep, setAnimatingStep] = useState(false);
  const [attendantName, setAttendantName] = useState(DEFAULT_ATTENDANT.name);
  const [attendantAvatar, setAttendantAvatar] = useState(DEFAULT_ATTENDANT.avatar);
  const [showCta, setShowCta] = useState(false);
  const [waitingForTap, setWaitingForTap] = useState(false);
  const [ctaText, setCtaText] = useState("🚀 Criar Minha Conta Grátis");
  const [ctaUrl, setCtaUrl] = useState("/login");
  const [ctaType, setCtaType] = useState<"internal" | "whatsapp" | "whatsapp_group" | "url">("internal");
  const chatRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Load custom messages
  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("platform_settings")
        .select("value")
        .eq("key", "invite_chat_config")
        .maybeSingle();

      let msgs = DEFAULT_MESSAGES;
      if (data?.value) {
        try {
          const config = JSON.parse(data.value);
          if (config.messages?.length) msgs = config.messages;
          if (config.attendantName) setAttendantName(config.attendantName);
          if (config.attendantAvatar) setAttendantAvatar(config.attendantAvatar);
          if (config.ctaText) setCtaText(config.ctaText);
          if (config.ctaUrl) setCtaUrl(config.ctaUrl);
          if (config.ctaType) setCtaType(config.ctaType);
        } catch {}
      }
      setAllMessages(msgs);
      setSteps(buildSteps(msgs));
    };
    load();
  }, []);

  // Play a step: show typing then reveal messages one by one
  const playStep = useCallback((stepIndex: number) => {
    if (stepIndex >= steps.length) {
      setShowCta(true);
      return;
    }
    setAnimatingStep(true);
    setWaitingForTap(false);
    const stepMsgs = steps[stepIndex];
    const isAttendant = stepMsgs[0].sender === "attendant";

    if (isAttendant) {
      setTyping(true);
      let totalDelay = 800;
      const timers: NodeJS.Timeout[] = [];

      stepMsgs.forEach((msg, i) => {
        timers.push(
          setTimeout(() => {
            setTyping(i < stepMsgs.length - 1);
            setVisibleMessages((prev) => [...prev, msg]);
          }, totalDelay)
        );
        totalDelay += 1200;
      });

      timers.push(
        setTimeout(() => {
          setTyping(false);
          setAnimatingStep(false);
          setCurrentStep(stepIndex + 1);
          if (stepIndex + 1 < steps.length) {
            setWaitingForTap(true);
          } else {
            setShowCta(true);
          }
        }, totalDelay)
      );

      return () => timers.forEach(clearTimeout);
    } else {
      // User messages: show instantly, then auto-play next attendant step
      setVisibleMessages((prev) => [...prev, ...stepMsgs]);
      const nextIndex = stepIndex + 1;
      setCurrentStep(nextIndex);

      if (nextIndex < steps.length) {
        // Auto-play the next step (attendant) after a short pause
        setTimeout(() => {
          playStep(nextIndex);
        }, 600);
      } else {
        setAnimatingStep(false);
        setShowCta(true);
      }
    }
  }, [steps]);

  // Start first step automatically
  useEffect(() => {
    if (steps.length > 0 && currentStep === 0 && visibleMessages.length === 0) {
      playStep(0);
    }
  }, [steps, playStep]);

  const handleContinue = () => {
    if (waitingForTap && !animatingStep) {
      playStep(currentStep);
    }
  };

  // Auto-scroll
  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [visibleMessages, typing, waitingForTap]);

  const now = new Date();
  const timeStr = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;

  return (
    <>
      <Helmet>
        <title>Crie sua loja de imóveis grátis | Capimobi</title>
        <meta name="description" content="Cadastre-se gratuitamente na Capimobi e tenha sua loja de imóveis online em minutos!" />
        <link rel="canonical" href={`${SITE_URL}/convite`} />
      </Helmet>

      <div className="min-h-screen flex flex-col" style={{ background: "#e5ddd5" }}>
        {/* WhatsApp-style header */}
        <div className="sticky top-0 z-50 flex items-center gap-3 px-3 py-2" style={{ background: "#075e54" }}>
          <button onClick={() => navigate(-1)} className="text-white/80 hover:text-white">
            <ArrowLeft size={22} />
          </button>
          <div className="w-10 h-10 rounded-full bg-[#128c7e] flex items-center justify-center text-white font-bold text-lg overflow-hidden shrink-0">
            {attendantAvatar ? (
              <img src={attendantAvatar} alt="" className="w-full h-full object-cover" />
            ) : (
              attendantName.charAt(0).toUpperCase()
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white font-semibold text-sm truncate">{attendantName}</p>
            <p className="text-[#8eddd4] text-xs">online</p>
          </div>
          <div className="flex items-center gap-4 text-white/80">
            <Video size={20} />
            <Phone size={20} />
            <MoreVertical size={20} />
          </div>
        </div>

        {/* Chat area */}
        <div
          ref={chatRef}
          className="flex-1 overflow-y-auto px-3 py-4 space-y-1"
          style={{ background: "#e5ddd5" }}
        >
          {/* Date chip */}
          <div className="flex justify-center mb-3">
            <span className="bg-white/80 text-[#667781] text-[11px] px-3 py-1 rounded-lg shadow-sm font-medium">
              Hoje
            </span>
          </div>

          <AnimatePresence>
            {visibleMessages.map((msg) => (
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
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-start mb-1"
            >
              <div className="bg-white px-4 py-2 rounded-lg rounded-tl-none shadow-sm">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-[#9e9e9e] rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-2 h-2 bg-[#9e9e9e] rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-2 h-2 bg-[#9e9e9e] rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </motion.div>
          )}

          {/* "Continue" prompt */}
          <AnimatePresence>
            {waitingForTap && !showCta && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex justify-center pt-4 pb-2"
              >
                <button
                  onClick={handleContinue}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-full shadow-md text-sm font-semibold transition-all active:scale-95"
                  style={{ background: "#00a884", color: "white" }}
                >
                  <ChevronDown size={16} className="animate-bounce" />
                  Continuar conversa
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* CTA Button */}
          <AnimatePresence>
            {showCta && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="flex flex-col items-center gap-3 pt-4 pb-8"
              >
                <Button
                  onClick={() => {
                    if (ctaType === "internal") {
                      navigate(ctaUrl);
                    } else {
                      window.open(ctaUrl, "_blank", "noopener");
                    }
                  }}
                  className="bg-[#25d366] hover:bg-[#22c55e] text-white font-bold text-base px-8 py-6 rounded-full shadow-lg animate-pulse"
                  size="lg"
                >
                  {ctaText}
                </Button>
                <p className="text-[#667781] text-xs text-center">
                  Cadastro rápido • 100% gratuito • Sem cartão de crédito
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Input bar (visual only) */}
        <div className="sticky bottom-0 flex items-center gap-2 px-2 py-2" style={{ background: "#f0f2f5" }}>
          <div className="flex-1 bg-white rounded-full px-4 py-2.5 text-sm text-[#667781]">
            Mensagem
          </div>
          <div className="w-10 h-10 rounded-full bg-[#00a884] flex items-center justify-center text-white">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M1.101 21.757L23.8 12.028 1.101 2.3l.011 7.912 13.239 1.816-13.239 1.817-.011 7.912z" />
            </svg>
          </div>
        </div>
      </div>
    </>
  );
}
