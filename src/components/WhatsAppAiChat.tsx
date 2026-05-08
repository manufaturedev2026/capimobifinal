import { useState, useRef, useEffect, useCallback } from "react";
import { X, Send, Bot, Loader2, MessageCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";

type Msg = { role: "user" | "assistant"; content: string };

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  sellerId: string;
  sellerUserId: string;
  sellerWhatsapp?: string | null;
  attendantName?: string | null;
  attendantAvatar?: string | null;
  themePrimary?: string;
  /** Optional context to attach to the WhatsApp redirect message */
  contextTitle?: string;
  /** Slug of the team member (mirror/partner store). Edge function uses it to decide who pays for credits */
  corretorSlug?: string;
}

export default function WhatsAppAiChat({
  open,
  onOpenChange,
  sellerId,
  sellerUserId,
  sellerWhatsapp,
  attendantName,
  attendantAvatar,
  themePrimary,
  contextTitle,
  corretorSlug,
}: Props) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [leadSaved, setLeadSaved] = useState<{ name: string; phone: string } | null>(null);
  const [leadSummary, setLeadSummary] = useState<string>("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  // Greeting on open
  useEffect(() => {
    if (!open || messages.length > 0) return;
    let cancelled = false;
    (async () => {
      try {
        const { data } = await supabase.functions.invoke("whatsapp-ai-chat", {
          body: { sellerId, messages: [], corretorSlug },
        });
        if (!cancelled && data?.reply) {
          setMessages([{ role: "assistant", content: data.reply }]);
        }
      } catch {}
    })();
    return () => {
      cancelled = true;
    };
  }, [open, sellerId, messages.length, corretorSlug]);

  const send = useCallback(async () => {
    const text = input.trim();
    if (!text || loading) return;
    const userMsg: Msg = { role: "user", content: text };
    const all = [...messages, userMsg];
    setMessages(all);
    setInput("");
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("whatsapp-ai-chat", {
        body: { sellerId, messages: all, corretorSlug },
      });
      if (error) throw error;
      if (data?.reply) {
        setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
      }
      const ed = data?.extractedData;
      const normalizedLead = ed?.full_name && ed?.phone
        ? { name: String(ed.full_name), phone: String(ed.phone) }
        : null;
      if (normalizedLead && !leadSaved) {
        const resolvedSellerId = corretorSlug ? (data?.leadTarget?.sellerId || sellerId) : sellerId;
        const resolvedUserId = corretorSlug ? (data?.leadTarget?.userId || sellerUserId) : sellerUserId;
        // Save in CRM and notify the broker
        const notes = [
          ed.finality ? `🎯 Intenção: ${ed.finality}` : null,
          ed.property_type ? `🏠 Tipo: ${ed.property_type}` : null,
          ed.address ? `📍 ${ed.address}` : null,
          ed.desired_price ? `💰 Faixa: ${ed.desired_price}` : null,
          ed.notes ? `📝 ${ed.notes}` : null,
          contextTitle ? `🔗 Contexto: ${contextTitle}` : null,
          `🤖 Lead capturado pela atendente IA do WhatsApp`,
          `🌐 ${typeof window !== "undefined" ? window.location.href : ""}`,
        ]
          .filter(Boolean)
          .join("\n");
        try {
          await supabase.from("seller_crm_contacts").insert({
            seller_id: resolvedSellerId,
            user_id: resolvedUserId,
            full_name: normalizedLead.name.trim().slice(0, 100),
            phone: normalizedLead.phone.trim().slice(0, 20),
            funnel_stage: "novo",
            lead_source: "whatsapp_ai",
            notes,
          } as any);
          supabase.functions
            .invoke("notify-new-lead", {
              body: {
                target_user_id: resolvedUserId,
                title: "Novo lead da atendente IA 🤖",
                body: `${ed.full_name} foi qualificado(a) pela ${attendantName || "atendente IA"} no WhatsApp.`,
                url: "/painel?tab=crm",
              },
            })
            .catch((pushError) => console.error("notify-new-lead error", pushError));
        } catch (e) {
          console.error("crm insert error", e);
        }
        setLeadSaved(normalizedLead);
        const summaryParts = [
          ed.finality ? `Intenção: ${ed.finality}` : null,
          ed.property_type ? `Tipo: ${ed.property_type}` : null,
          ed.address ? `Local: ${ed.address}` : null,
          ed.desired_price ? `Faixa: ${ed.desired_price}` : null,
        ].filter(Boolean);
        setLeadSummary(summaryParts.join(" • "));
      } else if (normalizedLead) {
        setLeadSaved(normalizedLead);
      }
    } catch (e: any) {
      const msg =
        e?.message?.includes("402") || e?.message?.includes("Créditos")
          ? "O atendimento por IA está temporariamente indisponível. Fale direto pelo WhatsApp 😊"
          : "Tive um probleminha agora. Pode tentar novamente?";
      setMessages((prev) => [...prev, { role: "assistant", content: msg }]);
    } finally {
      setLoading(false);
    }
  }, [input, loading, messages, sellerId, sellerUserId, leadSaved, attendantName, contextTitle, corretorSlug]);

  const goWhatsApp = () => {
    if (!sellerWhatsapp) return;
    const phone = sellerWhatsapp.replace(/\D/g, "");
    let intro: string;
    if (leadSaved) {
      intro = `Olá! Sou ${leadSaved.name}. Acabei de conversar com a ${attendantName || "atendente"} no site.`;
      if (leadSummary) intro += `\n\nResumo do meu interesse: ${leadSummary}`;
    } else {
      intro = `Olá! Vim do site${contextTitle ? ` (estava vendo: ${contextTitle})` : ""}.`;
    }
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(intro)}`, "_blank", "noopener,noreferrer");
  };

  const primary = themePrimary || "#25D366";

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 40, scale: 0.95 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="fixed bottom-4 right-2 left-2 z-[200] lg:bottom-6 lg:right-6 lg:left-auto lg:w-[400px] flex flex-col bg-background border border-border rounded-2xl shadow-2xl overflow-hidden"
          style={{ maxHeight: "min(75vh, 620px)" }}
        >
          {/* Header */}
          <div
            className="flex items-center gap-3 px-4 py-3 text-white shrink-0"
            style={{ background: `linear-gradient(135deg, ${primary}, #128C7E)` }}
          >
            <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center overflow-hidden">
              {attendantAvatar ? (
                <img src={attendantAvatar} alt={attendantName || "Atendente"} className="w-full h-full object-cover" />
              ) : (
                <Bot size={20} />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm truncate">{attendantName || "Atendente IA"}</p>
              <p className="text-[11px] opacity-90 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-green-300 animate-pulse" /> online agora
              </p>
            </div>
            <button
              onClick={() => onOpenChange(false)}
              className="p-1 rounded-full hover:bg-white/20 transition"
              aria-label="Fechar"
            >
              <X size={18} />
            </button>
          </div>

          {/* Messages */}
          <div
            className="flex-1 overflow-y-auto px-3 py-3 space-y-3 bg-muted/30"
            style={{ minHeight: 220 }}
          >
            {messages.length === 0 && (
              <div className="text-center text-muted-foreground text-sm py-10">
                <Loader2 size={20} className="animate-spin mx-auto opacity-60" />
              </div>
            )}
            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap ${
                    m.role === "user"
                      ? "rounded-br-md text-white"
                      : "bg-background text-foreground rounded-bl-md shadow-sm border border-border"
                  }`}
                  style={m.role === "user" ? { background: primary } : undefined}
                >
                  {m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-background border border-border rounded-2xl rounded-bl-md px-4 py-2 shadow-sm">
                  <Loader2 size={16} className="animate-spin text-muted-foreground" />
                </div>
              </div>
            )}
            {leadSaved && sellerWhatsapp && (
              <div className="flex justify-center pt-2">
                <button
                  onClick={goWhatsApp}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-full text-white font-bold text-sm shadow-lg hover:scale-[1.02] transition-transform"
                  style={{ background: "#25D366" }}
                >
                  <MessageCircle size={16} /> Continuar no WhatsApp
                </button>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="shrink-0 border-t border-border px-3 py-2 flex gap-2 items-center bg-background">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder="Digite uma mensagem..."
              className="flex-1 bg-muted text-foreground placeholder:text-muted-foreground rounded-full px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
              disabled={loading}
              maxLength={500}
            />
            <button
              onClick={send}
              disabled={!input.trim() || loading}
              className="p-2 rounded-full text-white disabled:opacity-40 hover:scale-105 transition-transform"
              style={{ background: primary }}
              aria-label="Enviar"
            >
              <Send size={16} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}