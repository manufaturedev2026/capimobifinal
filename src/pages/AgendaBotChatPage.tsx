import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCheck, ArrowLeft, Send, Calendar as CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useParams, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";

interface ChatMsg { id: string; text: string; sender: "bot" | "user"; }

interface BotConfig {
  id: string | null;
  attendant_name: string;
  attendant_avatar: string | null;
  opening_message: string | null;
  success_cta_label: string;
  success_cta_url: string | null;
  item_id: string | null;
}

const FALLBACK: BotConfig = {
  id: null,
  attendant_name: "Assistente de Agendamento",
  attendant_avatar: null,
  opening_message: null,
  success_cta_label: "💬 Falar no WhatsApp",
  success_cta_url: null,
  item_id: null,
};

export default function AgendaBotChatPage() {
  const { slug, botSlug } = useParams<{ slug: string; botSlug?: string }>();
  const navigate = useNavigate();
  const chatRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [config, setConfig] = useState<BotConfig>(FALLBACK);
  const [sellerProfile, setSellerProfile] = useState<any>(null);
  const [prelinkedItem, setPrelinkedItem] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [aiMessages, setAiMessages] = useState<{ role: "user" | "assistant"; content: string }[]>([]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [savedVisit, setSavedVisit] = useState<any>(null);

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
      if (!profile) { setNotFound(true); setLoading(false); return; }
      setSellerProfile(profile);

      // Carrega bot específico se botSlug fornecido
      if (botSlug) {
        const { data: bot } = await supabase
          .from("agenda_bots")
          .select("*")
          .eq("seller_id", profile.id)
          .eq("slug", botSlug)
          .eq("is_active", true)
          .maybeSingle();
        if (!bot) { setNotFound(true); setLoading(false); return; }
        setConfig({
          id: bot.id,
          attendant_name: bot.attendant_name,
          attendant_avatar: bot.attendant_avatar,
          opening_message: bot.opening_message,
          success_cta_label: bot.success_cta_label,
          success_cta_url: bot.success_cta_url,
          item_id: bot.item_id,
        });
        if (bot.item_id) {
          const { data: itm } = await supabase
            .from("seller_items")
            .select("id, title, category, neighborhood, address, city, bedrooms, price, photos")
            .eq("id", bot.item_id).maybeSingle();
          if (itm) setPrelinkedItem(itm);
        }
      }
      setLoading(false);
    };
    load();
  }, [slug, botSlug]);

  const addBotMsg = useCallback((text: string) => {
    setMessages((p) => [...p, { id: `bot-${Date.now()}-${Math.random()}`, text, sender: "bot" }]);
  }, []);
  const addUserMsg = useCallback((text: string) => {
    setMessages((p) => [...p, { id: `user-${Date.now()}`, text, sender: "user" }]);
  }, []);

  const started = useRef(false);
  useEffect(() => {
    if (started.current || loading || !sellerProfile || notFound) return;
    started.current = true;
    setTyping(true);
    (async () => {
      try {
        const { data, error } = await supabase.functions.invoke("agenda-bot-chat", {
          body: {
            messages: [],
            sellerId: sellerProfile.id,
            sellerName: sellerProfile.company_name || sellerProfile.full_name || "",
            prelinkedItem: prelinkedItem ? {
              id: prelinkedItem.id, title: prelinkedItem.title, category: prelinkedItem.category,
              neighborhood: prelinkedItem.neighborhood, address: prelinkedItem.address,
              city: prelinkedItem.city, bedrooms: prelinkedItem.bedrooms, price: prelinkedItem.price,
            } : undefined,
            botId: config.id,
          },
        });
        if (error) throw error;
        const reply = data?.reply || config.opening_message || "Olá! Vou te ajudar a agendar uma visita. 👋";
        setAiMessages([{ role: "assistant", content: reply }]);
        addBotMsg(reply);
      } catch (e) {
        console.error("Bot start error:", e);
        addBotMsg(config.opening_message || "Olá! Vou te ajudar a agendar uma visita. 👋");
      }
      setTyping(false);
    })();
  }, [loading, sellerProfile, notFound, prelinkedItem, config.id]);

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [messages, typing]);

  const sendMessage = async () => {
    const txt = input.trim();
    if (!txt || aiLoading || savedVisit) return;
    setInput("");
    addUserMsg(txt);

    const updated = [...aiMessages, { role: "user" as const, content: txt }];
    setAiMessages(updated);
    setAiLoading(true);
    setTyping(true);

    try {
      const { data, error } = await supabase.functions.invoke("agenda-bot-chat", {
        body: {
          messages: updated,
          sellerId: sellerProfile.id,
          sellerName: sellerProfile.company_name || sellerProfile.full_name || "",
          prelinkedItem: prelinkedItem ? {
            id: prelinkedItem.id, title: prelinkedItem.title, category: prelinkedItem.category,
            neighborhood: prelinkedItem.neighborhood, address: prelinkedItem.address,
            city: prelinkedItem.city, bedrooms: prelinkedItem.bedrooms, price: prelinkedItem.price,
          } : undefined,
          botId: config.id,
        },
      });
      if (error) throw error;
      const reply = data?.reply || "Desculpe, tente novamente.";
      setAiMessages((p) => [...p, { role: "assistant", content: reply }]);
      addBotMsg(reply);
      if (data?.savedVisit) setSavedVisit(data.savedVisit);
    } catch (e) {
      console.error("AI error:", e);
      addBotMsg("Ops! Algo deu errado. Tente novamente 😊");
    }
    setAiLoading(false);
    setTyping(false);
  };

  const openWhatsApp = () => {
    if (config.success_cta_url?.trim()) { window.open(config.success_cta_url, "_blank"); return; }
    const phone = (sellerProfile?.phone || "").replace(/\D/g, "");
    if (!phone) return;
    const lines = [
      `Olá! Acabei de agendar uma visita pelo seu chat. 🏡`,
      savedVisit?.client_name ? `Nome: ${savedVisit.client_name}` : null,
      savedVisit?.visit_date ? `Data: ${new Date(savedVisit.visit_date + "T00:00:00").toLocaleDateString("pt-BR")} às ${savedVisit.visit_time?.slice(0, 5)}` : null,
      savedVisit?.ai_property_guess ? `Imóvel: ${savedVisit.ai_property_guess}` : null,
    ].filter(Boolean).join("\n");
    window.open(`https://wa.me/55${phone}?text=${encodeURIComponent(lines)}`, "_blank");
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-background"><div className="animate-pulse text-muted-foreground">Carregando...</div></div>;
  }
  if (notFound || !sellerProfile) {
    return <div className="min-h-screen flex items-center justify-center bg-background text-muted-foreground p-6 text-center">Bot ou loja não encontrado.</div>;
  }

  return (
    <div className="min-h-screen bg-[#e5ddd5] flex flex-col">
      <Helmet>
        <title>Agendar Visita — {sellerProfile.company_name || sellerProfile.full_name}</title>
      </Helmet>

      <div className="bg-[#075e54] text-white p-3 flex items-center gap-3 shadow-md">
        <button onClick={() => navigate(-1)} className="p-1 hover:bg-white/10 rounded">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center overflow-hidden shrink-0">
          {config.attendant_avatar ? (
            <img src={config.attendant_avatar} alt="" className="w-full h-full object-cover" />
          ) : (
            <CalendarIcon className="w-5 h-5" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold truncate">{config.attendant_name}</p>
          <p className="text-xs opacity-80">online agora</p>
        </div>
      </div>

      {prelinkedItem && (
        <div className="bg-white border-b px-3 py-2 flex items-center gap-2 text-xs">
          {prelinkedItem.photos?.[0] && (
            <img src={prelinkedItem.photos[0]} alt="" className="w-10 h-10 rounded object-cover" />
          )}
          <div className="flex-1 min-w-0">
            <p className="font-semibold truncate">🏡 {prelinkedItem.title}</p>
            <p className="text-muted-foreground truncate">
              {[prelinkedItem.neighborhood, prelinkedItem.city].filter(Boolean).join(", ")}
            </p>
          </div>
        </div>
      )}

      <div ref={chatRef} className="flex-1 overflow-y-auto p-3 space-y-2">
        <AnimatePresence>
          {messages.map((m) => (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${m.sender === "user" ? "justify-end" : "justify-start"}`}
            >
              <div className={`max-w-[80%] px-3 py-2 rounded-lg shadow-sm whitespace-pre-wrap text-sm ${
                m.sender === "user" ? "bg-[#dcf8c6] text-foreground" : "bg-white text-foreground"
              }`}>
                {m.text}
                {m.sender === "user" && <CheckCheck className="w-3 h-3 inline ml-1 text-blue-500" />}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {typing && (
          <div className="flex justify-start">
            <div className="bg-white px-4 py-3 rounded-lg shadow-sm flex gap-1">
              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" />
              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0.2s]" />
              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0.4s]" />
            </div>
          </div>
        )}
        {savedVisit && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-center pt-2">
            <Button onClick={openWhatsApp} className="bg-[#25d366] hover:bg-[#20b858] text-white shadow-lg">
              {config.success_cta_label}
            </Button>
          </motion.div>
        )}
      </div>

      {!savedVisit && (
        <div className="bg-[#f0f0f0] p-2 flex gap-2 items-center">
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") sendMessage(); }}
            placeholder="Digite uma mensagem..."
            className="bg-white rounded-full border-0"
            disabled={aiLoading}
          />
          <Button onClick={sendMessage} disabled={aiLoading || !input.trim()} className="bg-[#075e54] hover:bg-[#064e44] rounded-full w-10 h-10 p-0 shrink-0">
            <Send className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
