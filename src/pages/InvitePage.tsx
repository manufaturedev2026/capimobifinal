import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCheck, ArrowLeft, Phone, Video, MoreVertical, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { SITE_URL } from "@/lib/siteUrl";

/* ─── Types ─── */
interface VisibleBubble {
  id: string;
  text: string;
  sender: "attendant" | "user";
}

interface StepBase {
  id: string;
}

/** Bot sends one or more messages, then auto-advances */
interface BotStep extends StepBase {
  type: "bot";
  messages: string[];
  next: string;
}

/** Ask for free-text input (name) */
interface InputStep extends StepBase {
  type: "input";
  placeholder: string;
  next: string;
}

/** Show choice buttons */
interface ChoiceStep extends StepBase {
  type: "choice";
  options: { label: string; next: string }[];
}

/** Show CTA */
interface CtaStep extends StepBase {
  type: "cta";
}

type Step = BotStep | InputStep | ChoiceStep | CtaStep;

/* ─── Default Flow ─── */
function buildDefaultFlow(): Step[] {
  return [
    {
      id: "start",
      type: "bot",
      messages: [
        "Olá! 👋 Seja bem-vindo(a) à Capimobi!",
        "Eu sou a Ana, sua consultora digital 😊",
        "Antes de tudo, qual é o seu nome?",
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
        "Que prazer, {{nome}}! 🎉",
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

    // ── Corretor path ──
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

    // ── Iniciante path ──
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

    // ── Empresa path ──
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

    // ── Benefit branches ──
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

    // ── Pricing ──
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

    // ── Doubts ──
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

    // ── Final CTA ──
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
  ];
}

/* ─── Attendant defaults ─── */
const DEFAULT_ATTENDANT = { name: "Ana • Capimobi", avatar: "" };

/* ─── Component ─── */
export default function InvitePage() {
  const [flow, setFlow] = useState<Step[]>([]);
  const [bubbles, setBubbles] = useState<VisibleBubble[]>([]);
  const [typing, setTyping] = useState(false);
  const [currentStepId, setCurrentStepId] = useState<string | null>(null);
  const [interactionReady, setInteractionReady] = useState(false);
  const [showCta, setShowCta] = useState(false);
  const [userName, setUserName] = useState("");
  const [nameInput, setNameInput] = useState("");
  const [attendantName, setAttendantName] = useState(DEFAULT_ATTENDANT.name);
  const [attendantAvatar, setAttendantAvatar] = useState(DEFAULT_ATTENDANT.avatar);
  const [ctaText, setCtaText] = useState("🚀 Criar Minha Conta Grátis");
  const [ctaUrl, setCtaUrl] = useState("/login");
  const [ctaType, setCtaType] = useState<"internal" | "whatsapp" | "whatsapp_group" | "url">("internal");
  const chatRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const playingRef = useRef(false);

  // Load config
  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("platform_settings")
        .select("value")
        .eq("key", "invite_chat_config")
        .maybeSingle();

      if (data?.value) {
        try {
          const c = JSON.parse(data.value);
          if (c.attendantName) setAttendantName(c.attendantName);
          if (c.attendantAvatar) setAttendantAvatar(c.attendantAvatar);
          if (c.ctaText) setCtaText(c.ctaText);
          if (c.ctaUrl) setCtaUrl(c.ctaUrl);
          if (c.ctaType) setCtaType(c.ctaType);
        } catch {}
      }
      const f = buildDefaultFlow();
      setFlow(f);
      setCurrentStepId(f[0].id);
    })();
  }, []);

  const resolve = useCallback((t: string) => t.replace(/\{\{nome\}\}/gi, userName || "você"), [userName]);

  const getStep = useCallback((id: string) => flow.find((s) => s.id === id), [flow]);

  const addBubble = useCallback((text: string, sender: "attendant" | "user") => {
    setBubbles((prev) => [...prev, { id: `${Date.now()}_${Math.random()}`, text, sender }]);
  }, []);

  // Play a bot step: type + reveal messages sequentially
  const playBotStep = useCallback(
    (step: BotStep, nameOverride?: string) => {
      if (playingRef.current) return;
      playingRef.current = true;
      setInteractionReady(false);
      setTyping(true);

      const msgs = step.messages;
      let i = 0;
      const total = msgs.length;

      const showNext = () => {
        if (i < total) {
          const raw = msgs[i];
          const text = nameOverride
            ? raw.replace(/\{\{nome\}\}/gi, nameOverride)
            : resolve(raw);
          addBubble(text, "attendant");
          i++;
          if (i < total) {
            setTimeout(showNext, 1000 + Math.min(raw.length * 15, 1500));
          } else {
            setTimeout(() => {
              setTyping(false);
              playingRef.current = false;
              // Advance to next step
              const nextStep = getStep(step.next);
              if (nextStep) {
                setCurrentStepId(nextStep.id);
                if (nextStep.type === "bot") {
                  setTimeout(() => playBotStep(nextStep as BotStep, nameOverride), 600);
                } else if (nextStep.type === "cta") {
                  setShowCta(true);
                } else {
                  setInteractionReady(true);
                }
              }
            }, 500);
          }
        }
      };

      setTimeout(showNext, 800);
    },
    [resolve, getStep, addBubble]
  );

  // Start flow
  useEffect(() => {
    if (flow.length > 0 && currentStepId === flow[0].id && bubbles.length === 0) {
      const first = flow[0];
      if (first.type === "bot") playBotStep(first as BotStep);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flow]);

  // Handle choice click
  const handleChoice = (option: { label: string; next: string }) => {
    addBubble(option.label, "user");
    setInteractionReady(false);
    const nextStep = getStep(option.next);
    if (!nextStep) return;
    setCurrentStepId(nextStep.id);

    setTimeout(() => {
      if (nextStep.type === "bot") {
        playBotStep(nextStep as BotStep);
      } else if (nextStep.type === "cta") {
        setShowCta(true);
      } else {
        setInteractionReady(true);
      }
    }, 400);
  };

  // Handle name submit
  const handleNameSubmit = () => {
    const name = nameInput.trim();
    if (!name) return;
    setUserName(name);
    setNameInput("");
    addBubble(name, "user");
    setInteractionReady(false);

    const step = currentStepId ? getStep(currentStepId) : null;
    if (step?.type === "input") {
      const nextStep = getStep((step as InputStep).next);
      if (nextStep) {
        setCurrentStepId(nextStep.id);
        setTimeout(() => {
          if (nextStep.type === "bot") {
            playBotStep(nextStep as BotStep, name);
          } else {
            setInteractionReady(true);
          }
        }, 500);
      }
    }
  };

  // Focus input
  useEffect(() => {
    if (interactionReady && currentStepId) {
      const step = getStep(currentStepId);
      if (step?.type === "input") {
        setTimeout(() => inputRef.current?.focus(), 100);
      }
    }
  }, [interactionReady, currentStepId, getStep]);

  // Auto-scroll
  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [bubbles, typing, interactionReady, showCta]);

  const now = new Date();
  const timeStr = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;

  const currentStep = currentStepId ? getStep(currentStepId) : null;
  const showInput = interactionReady && currentStep?.type === "input";
  const showChoices = interactionReady && currentStep?.type === "choice";

  return (
    <>
      <Helmet>
        <title>Crie sua loja de imóveis grátis | Capimobi</title>
        <meta name="description" content="Cadastre-se gratuitamente na Capimobi e tenha sua loja de imóveis online em minutos!" />
        <link rel="canonical" href={`${SITE_URL}/convite`} />
      </Helmet>

      <div className="min-h-screen flex flex-col" style={{ background: "#e5ddd5" }}>
        {/* Header */}
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

        {/* Chat */}
        <div ref={chatRef} className="flex-1 overflow-y-auto px-3 py-4 space-y-1" style={{ background: "#e5ddd5" }}>
          <div className="flex justify-center mb-3">
            <span className="bg-white/80 text-[#667781] text-[11px] px-3 py-1 rounded-lg shadow-sm font-medium">Hoje</span>
          </div>

          <AnimatePresence>
            {bubbles.map((b) => (
              <motion.div
                key={b.id}
                initial={{ opacity: 0, y: 12, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className={`flex ${b.sender === "user" ? "justify-end" : "justify-start"} mb-1`}
              >
                <div
                  className={`relative max-w-[85%] px-3 py-1.5 rounded-lg shadow-sm text-[14.5px] leading-[19px] ${
                    b.sender === "user"
                      ? "bg-[#d9fdd3] text-[#111b21] rounded-tr-none"
                      : "bg-white text-[#111b21] rounded-tl-none"
                  }`}
                >
                  <span className="whitespace-pre-wrap">{b.text}</span>
                  <span className="float-right mt-1 ml-2 flex items-center gap-0.5 text-[11px] text-[#667781]">
                    {timeStr}
                    {b.sender === "user" && <CheckCheck size={14} className="text-[#53bdeb] ml-0.5" />}
                  </span>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

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

          {/* Choice buttons */}
          <AnimatePresence>
            {showChoices && currentStep?.type === "choice" && (
              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center gap-2 pt-3 pb-2 px-2"
              >
                {(currentStep as ChoiceStep).options.map((opt, i) => (
                  <motion.button
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.12 }}
                    onClick={() => handleChoice(opt)}
                    className="w-full max-w-sm px-4 py-3 rounded-xl text-sm font-semibold shadow-md transition-all active:scale-95 border border-[#00a884]/30 hover:border-[#00a884]"
                    style={{ background: "white", color: "#075e54" }}
                  >
                    {opt.label}
                  </motion.button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* CTA */}
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
                    if (ctaType === "internal") navigate(ctaUrl);
                    else window.open(ctaUrl, "_blank", "noopener");
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

        {/* Input bar */}
        <div className="sticky bottom-0 flex items-center gap-2 px-2 py-2" style={{ background: "#f0f2f5" }}>
          {showInput ? (
            <>
              <input
                ref={inputRef}
                type="text"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleNameSubmit()}
                placeholder={(currentStep as InputStep).placeholder}
                className="flex-1 bg-white rounded-full px-4 py-2.5 text-sm text-[#111b21] outline-none focus:ring-2 focus:ring-[#00a884]/40 placeholder:text-[#667781]"
                maxLength={50}
              />
              <button
                onClick={handleNameSubmit}
                disabled={!nameInput.trim()}
                className="w-10 h-10 rounded-full flex items-center justify-center text-white transition-colors disabled:opacity-40"
                style={{ background: "#00a884" }}
              >
                <Send size={18} />
              </button>
            </>
          ) : (
            <>
              <div className="flex-1 bg-white rounded-full px-4 py-2.5 text-sm text-[#667781]">Mensagem</div>
              <div className="w-10 h-10 rounded-full bg-[#00a884] flex items-center justify-center text-white">
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
