import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCheck, ArrowLeft, Phone, Video, MoreVertical, Send, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, useParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { SITE_URL } from "@/lib/siteUrl";
import { DEFAULT_CONFIG, DEFAULT_FLOWS, type FlowStep, type BotStep, type InputStep, type ChoiceStep, type InviteChatConfig } from "@/data/inviteFlow";

const resolveInviteConfig = (parsed: any, botSlug?: string): InviteChatConfig => {
  const base = { ...DEFAULT_CONFIG };
  if (Array.isArray(parsed?.bots) && parsed.bots.length > 0) {
    const selected = parsed.bots.find((bot: any) => bot.slug === botSlug) || parsed.bots.find((bot: any) => bot.slug === "principal") || parsed.bots[0];
    const ctaType = selected.ctaType || base.ctaType;
    const flows = selected.flows ? { ...DEFAULT_FLOWS, ...selected.flows } : { ...DEFAULT_FLOWS };
    return { ...base, ...selected, ctaType, flows, flow: flows[ctaType] || DEFAULT_FLOWS[ctaType] };
  }

  const ctaType = parsed?.ctaType || base.ctaType;
  const flows = parsed?.flows ? { ...DEFAULT_FLOWS, ...parsed.flows } : parsed?.flow?.length ? { ...DEFAULT_FLOWS, [ctaType]: parsed.flow } : { ...DEFAULT_FLOWS };
  return { ...base, ...parsed, ctaType, flows, flow: flows[ctaType] || DEFAULT_FLOWS[ctaType] };
};

interface VisibleBubble {
  id: string;
  text: string;
  sender: "attendant" | "user";
}

export default function InvitePage() {
  const { botSlug } = useParams();
  const [config, setConfig] = useState<InviteChatConfig>(DEFAULT_CONFIG);
  const [flow, setFlow] = useState<FlowStep[]>([]);
  const [bubbles, setBubbles] = useState<VisibleBubble[]>([]);
  const [typing, setTyping] = useState(false);
  const [currentStepId, setCurrentStepId] = useState<string | null>(null);
  const [interactionReady, setInteractionReady] = useState(false);
  const [showCta, setShowCta] = useState(false);
  const [userName, setUserName] = useState("");
  const [nameInput, setNameInput] = useState("");

  // AI mode state
  const [aiMessages, setAiMessages] = useState<{ role: "user" | "assistant"; content: string }[]>([]);
  const [aiInput, setAiInput] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  // CRM mode state
  const [crmName, setCrmName] = useState("");
  const [crmPhone, setCrmPhone] = useState("");
  const [crmCategory, setCrmCategory] = useState("imobiliaria");
  const [crmSaving, setCrmSaving] = useState(false);
  const [crmSaved, setCrmSaved] = useState(false);

  const chatRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const playingRef = useRef(false);
  const sessionIdRef = useRef(`${Date.now()}_${Math.random().toString(36).slice(2, 9)}`);

  const trackEvent = useCallback((event_type: string) => {
    supabase.from("invite_funnel_events").insert({
      event_type,
      session_id: sessionIdRef.current,
      user_agent: navigator.userAgent,
      referrer: document.referrer || null,
    } as any).then(() => {});
  }, []);

  const notifyAdminLead = useCallback(async (leadName: string, leadPhone: string, notes: string) => {
    try {
      let adminUserId: string | null = null;
      const { data: pushSetting } = await supabase
        .from("platform_settings")
        .select("value")
        .eq("key", "admin_push_seller_id")
        .maybeSingle();

      if (pushSetting?.value) {
        const { data: adminProfile } = await supabase
          .from("profiles")
          .select("user_id")
          .eq("id", pushSetting.value)
          .maybeSingle();
        adminUserId = adminProfile?.user_id || null;
      }

      if (!adminUserId) {
        const { data: adminRole } = await supabase
          .from("user_roles")
          .select("user_id")
          .eq("role", "admin")
          .limit(1)
          .maybeSingle();
        adminUserId = adminRole?.user_id || null;
      }

      if (!adminUserId) return;

      await supabase.functions.invoke("notify-new-lead", {
        body: {
          target_user_id: adminUserId,
          title: "Novo lead do bot de convite",
          body: `${leadName} enviou WhatsApp ${leadPhone}`,
          url: "/admin",
          source: notes,
        },
      });
    } catch (error) {
      console.error("Admin lead push error:", error);
    }
  }, []);

  const isAiMode = config.chatMode === "ai";

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("platform_settings")
        .select("value")
        .eq("key", "invite_chat_config")
        .maybeSingle();

      let cfg = { ...DEFAULT_CONFIG };
      if (data?.value) {
        try {
          const parsed = JSON.parse(data.value);
          cfg = resolveInviteConfig(parsed, botSlug);
        } catch {}
      }
      setConfig(cfg);
      const activeFlow = cfg.flows[cfg.ctaType] || DEFAULT_FLOWS[cfg.ctaType];
      setFlow(activeFlow);
      setCurrentStepId(activeFlow[0]?.id ?? null);
    })();
  }, [botSlug]);

  // ─── AI Mode Logic ───
  const startAiChat = useCallback(async () => {
    setTyping(true);
    try {
      const { data, error } = await supabase.functions.invoke("invite-chat", {
        body: { messages: [], ctaType: config.ctaType, customPrompt: config.aiPrompt },
      });
      if (error) throw error;
      const reply = data?.reply || "Olá! 👋 Antes de tudo, qual é o seu nome? 😊";
      const aiMsg = { role: "assistant" as const, content: reply };
      setAiMessages([aiMsg]);
      addBubble(reply, "attendant");
    } catch (e) {
      console.error("AI start error:", e);
      addBubble("Olá! 👋 Antes de tudo, qual é o seu nome? 😊", "attendant");
      setAiMessages([{ role: "assistant", content: "Olá! 👋 Antes de tudo, qual é o seu nome? 😊" }]);
    }
    setTyping(false);
  }, [config.ctaType, config.aiPrompt]);

  // Track page view
  useEffect(() => {
    trackEvent("page_view");
  }, [trackEvent]);

  useEffect(() => {
    if (isAiMode && bubbles.length === 0) {
      startAiChat();
      trackEvent("chat_started");
    }
  }, [isAiMode, startAiChat, trackEvent]);

  const sendAiMessage = async () => {
    const text = aiInput.trim();
    if (!text || aiLoading) return;
    setAiInput("");
    addBubble(text, "user");
    trackEvent("message_sent");

    const updatedMessages = [...aiMessages, { role: "user" as const, content: text }];
    setAiMessages(updatedMessages);
    setAiLoading(true);
    setTyping(true);

    let retries = 0;
    const maxRetries = 2;
    let success = false;

    while (retries <= maxRetries && !success) {
      try {
        const { data, error } = await supabase.functions.invoke("invite-chat", {
          body: { messages: updatedMessages, ctaType: config.ctaType, customPrompt: config.aiPrompt },
        });

        if (error) {
          // Check for rate limit or payment errors in the response
          if (data?.error) {
            addBubble(data.error, "attendant");
            success = true;
            break;
          }
          throw error;
        }

        const reply = data?.reply || "Desculpe, tente novamente!";
        const aiMsg = { role: "assistant" as const, content: reply };
        setAiMessages((prev) => [...prev, aiMsg]);
        addBubble(reply, "attendant");
        success = true;

        // Check if AI is suggesting signup
        const lower = reply.toLowerCase();
        if (
          lower.includes("botão abaixo") ||
          lower.includes("clica no botão") ||
          lower.includes("criar sua conta") ||
          lower.includes("crie sua conta") ||
          lower.includes("cadastre-se")
        ) {
          trackEvent("cta_shown");
          setTimeout(() => setShowCta(true), 500);
        }
      } catch (e) {
        retries++;
        console.error(`AI error (attempt ${retries}/${maxRetries + 1}):`, e);
        if (retries <= maxRetries) {
          await new Promise(r => setTimeout(r, 1500 * retries));
        } else {
          addBubble("Estou com uma lentidão momentânea, mas já já volto! Tente enviar sua mensagem novamente em alguns segundos 😊", "attendant");
        }
      }
    }
    setAiLoading(false);
    setTyping(false);
  };

  // ─── Flow Mode Logic ───
  const resolve = useCallback((t: string) => t.replace(/\{\{nome\}\}/gi, userName || "você"), [userName]);
  const getStep = useCallback((id: string) => flow.find((s) => s.id === id), [flow]);
  const addBubble = useCallback((text: string, sender: "attendant" | "user") => {
    setBubbles((prev) => [...prev, { id: `${Date.now()}_${Math.random()}`, text, sender }]);
  }, []);

  const playBotStep = useCallback(
    (step: BotStep, nameOverride?: string) => {
      if (playingRef.current) return;
      playingRef.current = true;
      setInteractionReady(false);
      setTyping(true);
      const msgs = step.messages;
      let i = 0;
      const showNext = () => {
        if (i < msgs.length) {
          const raw = msgs[i];
          const text = nameOverride ? raw.replace(/\{\{nome\}\}/gi, nameOverride) : resolve(raw);
          addBubble(text, "attendant");
          i++;
          if (i < msgs.length) {
            setTimeout(showNext, 1000 + Math.min(raw.length * 15, 1500));
          } else {
            setTimeout(() => {
              setTyping(false);
              playingRef.current = false;
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

  useEffect(() => {
    if (!isAiMode && flow.length > 0 && currentStepId === flow[0].id && bubbles.length === 0) {
      const first = flow[0];
      if (first.type === "bot") playBotStep(first as BotStep);
    }
  }, [flow, isAiMode]);

  const handleChoice = (option: { label: string; next: string }) => {
    addBubble(option.label, "user");
    setInteractionReady(false);
    const nextStep = getStep(option.next);
    if (!nextStep) return;
    setCurrentStepId(nextStep.id);
    setTimeout(() => {
      if (nextStep.type === "bot") playBotStep(nextStep as BotStep);
      else if (nextStep.type === "cta") setShowCta(true);
      else setInteractionReady(true);
    }, 400);
  };

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
          if (nextStep.type === "bot") playBotStep(nextStep as BotStep, name);
          else setInteractionReady(true);
        }, 500);
      }
    }
  };

  useEffect(() => {
    if (interactionReady && currentStepId) {
      const step = getStep(currentStepId);
      if (step?.type === "input") setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [interactionReady, currentStepId, getStep]);

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [bubbles, typing, interactionReady, showCta]);

  // Pre-fill CRM name from chat
  useEffect(() => {
    if (showCta && config.ctaType === "crm" && userName && !crmName) {
      setCrmName(userName);
    }
  }, [showCta, config.ctaType, userName]);

  const now = new Date();
  const timeStr = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;
  const currentStep = currentStepId ? getStep(currentStepId) : null;
  const showFlowInput = !isAiMode && interactionReady && currentStep?.type === "input";
  const showChoices = !isAiMode && interactionReady && currentStep?.type === "choice";
  const showAiInput = isAiMode && !showCta;

  return (
    <>
      <Helmet>
        <title>Crie sua loja de imóveis grátis | Capimobi</title>
        <meta name="description" content="Cadastre-se gratuitamente na Capimobi e tenha sua loja de imóveis online em minutos!" />
        <link rel="canonical" href={`${SITE_URL}/convite`} />
      </Helmet>

      <div className="flex flex-col overflow-hidden" style={{ background: "#e5ddd5", height: "100dvh", maxHeight: "100dvh" }}>
        <div className="sticky top-0 z-50 flex items-center gap-3 px-3 py-2" style={{ background: "#075e54" }}>
          <button onClick={() => navigate(-1)} className="text-white/80 hover:text-white"><ArrowLeft size={22} /></button>
          <div className="w-10 h-10 rounded-full bg-[#128c7e] flex items-center justify-center text-white font-bold text-lg overflow-hidden shrink-0">
            {config.attendantAvatar ? <img src={config.attendantAvatar} alt="" className="w-full h-full object-cover" /> : config.attendantName.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white font-semibold text-sm truncate">{config.attendantName}</p>
            <p className="text-[#8eddd4] text-xs">online</p>
          </div>
          <div className="flex items-center gap-4 text-white/80">
            <Video size={20} /><Phone size={20} /><MoreVertical size={20} />
          </div>
        </div>

        <div ref={chatRef} className="flex-1 overflow-y-auto px-3 py-4 space-y-1" style={{ background: "#e5ddd5" }}>
          <div className="flex justify-center mb-3">
            <span className="bg-white/80 text-[#667781] text-[11px] px-3 py-1 rounded-lg shadow-sm font-medium">Hoje</span>
          </div>

          <AnimatePresence>
            {bubbles.map((b) => (
              <motion.div key={b.id} initial={{ opacity: 0, y: 12, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.3, ease: "easeOut" }} className={`flex ${b.sender === "user" ? "justify-end" : "justify-start"} mb-1`}>
                <div className={`relative max-w-[85%] px-3 py-1.5 rounded-lg shadow-sm text-[14.5px] leading-[19px] ${b.sender === "user" ? "bg-[#d9fdd3] text-[#111b21] rounded-tr-none" : "bg-white text-[#111b21] rounded-tl-none"}`}>
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

          {/* Flow: Choice buttons */}
          <AnimatePresence>
            {showChoices && currentStep?.type === "choice" && (
              <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex flex-col items-center gap-2 pt-3 pb-2 px-2">
                {(currentStep as ChoiceStep).options.map((opt, i) => (
                  <motion.button key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.12 }} onClick={() => handleChoice(opt)} className="w-full max-w-sm px-4 py-3 rounded-xl text-sm font-semibold shadow-md transition-all active:scale-95 border border-[#00a884]/30 hover:border-[#00a884]" style={{ background: "white", color: "#075e54" }}>
                    {opt.label}
                  </motion.button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* CTA: CRM or Captação Imobiliárias */}
          <AnimatePresence>
            {showCta && (config.ctaType === "crm" || config.ctaType === "captacao_imobiliaria") && !crmSaved && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="flex flex-col items-center gap-3 pt-4 pb-8 px-4">
                <div className="bg-white rounded-2xl shadow-lg p-5 w-full max-w-sm space-y-3">
                  <p className="text-sm font-semibold text-[#075e54] text-center">
                    {config.ctaType === "captacao_imobiliaria" ? "🏢 Deixe seus dados e fale com nosso consultor!" : "📋 Deixe seus dados que entraremos em contato!"}
                  </p>
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
                  {config.ctaType === "captacao_imobiliaria" && (
                    <select
                      value={crmCategory}
                      onChange={(e) => setCrmCategory(e.target.value)}
                      className="w-full bg-[#f0f2f5] rounded-full px-4 py-2.5 text-sm text-[#111b21] outline-none focus:ring-2 focus:ring-[#00a884]/40"
                    >
                      <option value="imobiliaria">🏢 Imobiliária</option>
                      <option value="construtora">🏗️ Construtora</option>
                      <option value="corretor">🏠 Corretor(a)</option>
                    </select>
                  )}
                  <Button
                    onClick={async () => {
                      if (!crmName.trim() || !crmPhone.trim()) return;
                      setCrmSaving(true);
                      try {
                        const categoryLabel = config.ctaType === "captacao_imobiliaria"
                          ? { imobiliaria: "Imobiliária", construtora: "Construtora", corretor: "Corretor(a)" }[crmCategory] || crmCategory
                          : "";
                        const notes = config.ctaType === "captacao_imobiliaria"
                          ? `Lead captado via chat de captação de imobiliárias | Categoria: ${categoryLabel}`
                          : "Lead capturado via chat de convite";
                        await supabase.from("crm_contacts").insert({
                          full_name: crmName.trim(),
                          phone: crmPhone.trim(),
                          email: "",
                          funnel_stage: "novo",
                          profile_id: "00000000-0000-0000-0000-000000000000",
                          user_id: "00000000-0000-0000-0000-000000000000",
                          notes,
                        });
                        await notifyAdminLead(crmName.trim(), crmPhone.trim(), notes);
                        setCrmSaved(true);
                        trackEvent("crm_submitted");
                        addBubble("Obrigado! Em breve entraremos em contato 🤝", "attendant");
                      } catch (e) {
                        console.error("CRM save error:", e);
                      }
                      setCrmSaving(false);
                    }}
                    disabled={!crmName.trim() || !crmPhone.trim() || crmSaving}
                    className="w-full bg-[#25d366] hover:bg-[#22c55e] text-white font-bold rounded-full py-5"
                  >
                    {crmSaving ? "Enviando..." : config.ctaType === "captacao_imobiliaria" ? "Enviar e falar no WhatsApp 💬" : "Enviar meus dados 🚀"}
                  </Button>
                </div>
              </motion.div>
            )}
            {showCta && (config.ctaType === "crm" || config.ctaType === "captacao_imobiliaria") && crmSaved && (
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center gap-3 pt-4 pb-8">
                <div className="w-16 h-16 rounded-full bg-[#25d366] flex items-center justify-center">
                  <Check size={32} className="text-white" />
                </div>
                <p className="text-[#075e54] font-semibold text-center">Dados enviados com sucesso!</p>
                <p className="text-[#667781] text-xs text-center">
                  {config.ctaType === "captacao_imobiliaria"
                    ? "Clique abaixo para falar direto com nosso consultor! 💬"
                    : "Em breve entraremos em contato pelo WhatsApp 📱"}
                </p>
                <Button
                  onClick={() => {
                    trackEvent("signup_clicked");
                    if (config.ctaType === "captacao_imobiliaria") {
                      const categoryLabel = { imobiliaria: "Imobiliária", construtora: "Construtora", corretor: "Corretor(a)" }[crmCategory] || crmCategory;
                      const msg = encodeURIComponent(
                        `Olá! Sou ${crmName.trim()}, ${categoryLabel}.\n\nTenho interesse em conhecer a Capimobi e criar minha loja online.\n\nWhatsApp: ${crmPhone.trim()}`
                      );
                      const url = config.crmRedirectUrl || config.ctaUrl || "https://wa.me/55";
                      const whatsappUrl = url.includes("wa.me") ? `${url}?text=${msg}` : url;
                      window.open(whatsappUrl, "_blank", "noopener");
                    } else {
                      const url = config.crmRedirectUrl || "/anunciar";
                      if (url.startsWith("/")) {
                        navigate(url);
                      } else {
                        window.open(url, "_blank", "noopener");
                      }
                    }
                  }}
                  className="mt-2 bg-[#25d366] hover:bg-[#22c55e] text-white font-bold rounded-full px-6 py-5 animate-pulse"
                >
                  {config.ctaType === "captacao_imobiliaria"
                    ? "💬 Falar com Consultor no WhatsApp"
                    : (config.crmButtonText || "🚀 Criar Minha Conta Agora")}
                </Button>
              </motion.div>
            )}
            {showCta && config.ctaType !== "crm" && config.ctaType !== "captacao_imobiliaria" && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="flex flex-col items-center gap-3 pt-4 pb-8">
                <Button onClick={() => { trackEvent("signup_clicked"); if (config.ctaType === "internal") navigate(config.ctaUrl); else window.open(config.ctaUrl, "_blank", "noopener"); }} className="bg-[#25d366] hover:bg-[#22c55e] text-white font-bold text-base px-8 py-6 rounded-full shadow-lg animate-pulse" size="lg">
                  {config.ctaText}
                </Button>
                <p className="text-[#667781] text-xs text-center">Cadastro rápido • 100% gratuito • Sem cartão de crédito</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Input bar */}
        <div className="sticky bottom-0 flex items-center gap-2 px-2 py-2" style={{ background: "#f0f2f5" }}>
          {/* AI mode: always show active input */}
          {showAiInput ? (
            <>
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
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M1.101 21.757L23.8 12.028 1.101 2.3l.011 7.912 13.239 1.816-13.239 1.817-.011 7.912z" /></svg>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
