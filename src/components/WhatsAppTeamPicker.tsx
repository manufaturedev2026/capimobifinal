import { useState, useEffect, useMemo, createContext, useContext, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type TeamMember = {
  id: string;
  full_name: string;
  phone: string | null;
  creci: string | null;
  photo_url: string | null;
};

type PickerRequest = {
  sellerId: string;
  sellerName: string;
  sellerPhone: string;
  title: string;
  link: string;
};

interface WhatsAppTeamPickerContextType {
  openWhatsApp: (params: {
    sellerId: string;
    sellerName: string;
    sellerPhone: string;
    title: string;
    link?: string;
  }) => void;
}

const WhatsAppTeamPickerContext = createContext<WhatsAppTeamPickerContextType | undefined>(undefined);

export function useWhatsAppPicker() {
  const ctx = useContext(WhatsAppTeamPickerContext);
  if (!ctx) throw new Error("useWhatsAppPicker must be used within WhatsAppTeamPickerProvider");
  return ctx;
}

// Cache team members per seller to avoid repeated fetches
const teamCache = new Map<string, { members: TeamMember[]; ts: number }>();
const whatsappModeCache = new Map<string, { mode: string; ts: number }>();
const CACHE_TTL = 60_000; // 1 minute

async function fetchWhatsAppMode(sellerId: string): Promise<string> {
  const cached = whatsappModeCache.get(sellerId);
  if (cached && Date.now() - cached.ts < CACHE_TTL) return cached.mode;

  const { data } = await supabase
    .from("profiles")
    .select("whatsapp_mode")
    .eq("id", sellerId)
    .single();

  const mode = (data as any)?.whatsapp_mode || "team";
  whatsappModeCache.set(sellerId, { mode, ts: Date.now() });
  return mode;
}

async function fetchTeamMembers(sellerId: string): Promise<TeamMember[]> {
  const cached = teamCache.get(sellerId);
  if (cached && Date.now() - cached.ts < CACHE_TTL) return cached.members;

  const { data } = await supabase
    .from("team_members")
    .select("id, full_name, phone, creci, photo_url")
    .eq("company_id", sellerId)
    .eq("is_active", true);

  const members = (data || []) as TeamMember[];
  teamCache.set(sellerId, { members, ts: Date.now() });
  return members;
}

function sendToWhatsApp(phone: string, name: string, title: string, link: string) {
  const msg = `Olá ${name}! 🏠 Vi o imóvel *${title}* no Capimobi e gostaria de mais informações.\n\n🔗 ${link}`;
  const url = `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
  const isStandalone = window.matchMedia("(display-mode: standalone)").matches
    || (navigator as any).standalone === true;
  if (isStandalone) {
    window.location.href = url;
    return;
  }
  window.location.assign(url);
}

export function WhatsAppTeamPickerProvider({ children }: { children: React.ReactNode }) {
  const [showPicker, setShowPicker] = useState(false);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [request, setRequest] = useState<PickerRequest | null>(null);

  const shuffled = useMemo(() => {
    return [...members].sort(() => Math.random() - 0.5);
  }, [members, showPicker]);

  const openWhatsApp = useCallback(async (params: {
    sellerId: string;
    sellerName: string;
    sellerPhone: string;
    title: string;
    link?: string;
  }) => {
    const link = params.link || window.location.href;
    const mode = await fetchWhatsAppMode(params.sellerId);

    // If agency chose "direct", skip team picker
    if (mode === "direct") {
      sendToWhatsApp(params.sellerPhone, params.sellerName, params.title, link);
      return;
    }

    const teamMembers = await fetchTeamMembers(params.sellerId);

    if (teamMembers.length > 0) {
      setMembers(teamMembers);
      setRequest({
        sellerId: params.sellerId,
        sellerName: params.sellerName,
        sellerPhone: params.sellerPhone,
        title: params.title,
        link,
      });
      setShowPicker(true);
    } else {
      sendToWhatsApp(params.sellerPhone, params.sellerName, params.title, link);
    }
  }, []);

  return (
    <WhatsAppTeamPickerContext.Provider value={{ openWhatsApp }}>
      {children}

      <AnimatePresence>
        {showPicker && request && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setShowPicker(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-card border border-border rounded-2xl p-6 w-full max-w-md max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-display font-bold text-lg text-foreground flex items-center gap-2">
                  <Users size={20} className="text-primary" /> Fale com um corretor
                </h3>
                <button onClick={() => setShowPicker(false)} className="p-1.5 rounded-lg hover:bg-secondary transition-colors">
                  <X size={18} className="text-muted-foreground" />
                </button>
              </div>
              <p className="text-muted-foreground text-sm mb-5">Escolha o corretor para atendimento via WhatsApp</p>
              <div className="space-y-3">
                {shuffled.map((member) => (
                  <button
                    key={member.id}
                    onClick={() => {
                      setShowPicker(false);
                      sendToWhatsApp(
                        member.phone || request.sellerPhone,
                        member.full_name,
                        request.title,
                        request.link
                      );
                    }}
                    className="w-full flex items-center gap-3 p-3 rounded-xl border border-border hover:border-primary hover:bg-primary/5 transition-all group"
                  >
                    <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center overflow-hidden flex-shrink-0">
                      {member.photo_url ? (
                        <img loading="lazy" decoding="async" src={member.photo_url} alt={member.full_name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="font-bold text-lg text-muted-foreground">{member.full_name.charAt(0)}</span>
                      )}
                    </div>
                    <div className="flex-1 text-left">
                      <p className="font-display font-bold text-sm text-foreground group-hover:text-primary transition-colors">{member.full_name}</p>
                      {member.creci && <p className="text-xs text-muted-foreground">{member.creci}</p>}
                    </div>
                    <MessageCircle size={18} className="text-emerald-500 flex-shrink-0" />
                  </button>
                ))}
              </div>
              <button
                onClick={() => setShowPicker(false)}
                className="w-full mt-4 py-2.5 rounded-xl bg-secondary text-secondary-foreground text-sm font-medium hover:bg-secondary/80 transition-colors"
              >
                Cancelar
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </WhatsAppTeamPickerContext.Provider>
  );
}
