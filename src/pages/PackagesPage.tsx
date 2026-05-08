import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Crown, Star, Zap, ArrowLeft, Shield, Gem, Diamond, Coins, Ticket, X, Sparkles, CheckCircle2, Home, Camera, HardDrive, Rocket, Building2, Bot, ArrowRight, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { useActivePlans, type Plan } from "@/hooks/usePlans";
import { ActivePlansPanel } from "@/components/ActivePlansPanel";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import PlanCheckoutModal from "@/components/PlanCheckoutModal";

const tierIcons: Record<string, any> = {
  basico: Zap, start: Zap, premium: Star, prime: Crown,
  imob_basico: Zap, imob_start: Shield, imob_pro: Gem, imob_elite: Diamond,
  const_basico: Zap, const_start: Shield, const_pro: Gem, const_master: Diamond,
};

const aiMonthlyCredits: Record<string, number> = {
  basico: 25,
  start: 250,
  premium: 600,
  prime: 1500,
  fundador_corretor: 500,
  fundador_empresa: 1750,
  fundador_construtora: 2500,
  imob_basico: 25,
  imob_start: 1500,
  imob_pro: 3000,
  imob_elite: 6000,
  const_basico: 25,
  const_start: 1500,
  const_pro: 3000,
  const_master: 6000,
};

interface FounderLot {
  id: string;
  category: "corretor" | "empresa" | "construtora";
  lot_number: number;
  price: number;
  monthly_price: number | null;
  total_slots: number;
  used_slots: number;
  is_active: boolean;
  inherited_tier: string;
  ia_credits: number;
  ia_credits_monthly?: number;
}

const TIER_LABEL: Record<string, string> = {
  start: "Start",
  premium: "Premium",
  prime: "Prime",
  imob_start: "Imob Start",
  imob_pro: "Imob Pro",
  imob_elite: "Imob Elite",
  const_start: "Construtora Start",
  const_pro: "Construtora Pro",
  const_master: "Construtora Master",
};

const formatCredits = (credits: number) => credits.toLocaleString("pt-BR");

// ============================================================
// Estilo épico por tier (replicado de /anunciar para unificar visual)
// ============================================================
const TIER_STYLES: Record<string, { gradient: string; glow: string; ring: string; icon: any; badge?: string; ctaGradient?: string; subtitle: string }> = {
  basico:            { gradient: "from-amber-500/10 via-zinc-900 to-black",  glow: "shadow-amber-500/10", ring: "border-amber-500/20",                                          icon: Rocket,    subtitle: "Para começar agora" },
  basico_empresa:    { gradient: "from-amber-500/10 via-zinc-900 to-black",  glow: "shadow-amber-500/10", ring: "border-amber-500/20",                                          icon: Building2, subtitle: "Para imobiliárias começarem" },
  start:             { gradient: "from-amber-500/15 via-zinc-900 to-black",  glow: "shadow-amber-500/20", ring: "border-amber-400/30",                                          icon: Zap,       subtitle: "Para corretores em ascensão" },
  premium:           { gradient: "from-amber-400/30 via-zinc-900 to-black",  glow: "shadow-amber-500/40", ring: "border-amber-300/60 ring-1 ring-amber-400/40",                 icon: Star,      subtitle: "⭐ Mais popular",            badge: "Mais Popular", ctaGradient: "from-amber-400 via-yellow-500 to-amber-600" },
  prime:             { gradient: "from-amber-400/25 via-zinc-900 to-black",  glow: "shadow-amber-500/40", ring: "border-amber-400/50",                                          icon: Crown,     subtitle: "Para dominar o mercado" },
  vip:               { gradient: "from-amber-400/25 via-zinc-900 to-black",  glow: "shadow-amber-500/40", ring: "border-amber-400/50",                                          icon: Crown,     subtitle: "Para dominar o mercado" },
  imob_basico:       { gradient: "from-amber-500/10 via-zinc-900 to-black",  glow: "shadow-amber-500/10", ring: "border-amber-500/20",                                          icon: Building2, subtitle: "Para imobiliárias começarem" },
  imob_start:        { gradient: "from-amber-500/15 via-zinc-900 to-black",  glow: "shadow-amber-500/20", ring: "border-amber-400/30",                                          icon: Shield,    subtitle: "Para imobiliárias em crescimento" },
  imob_pro:          { gradient: "from-amber-400/25 via-zinc-900 to-black",  glow: "shadow-amber-500/30", ring: "border-amber-400/50",                                          icon: Gem,       subtitle: "Para imobiliárias estabelecidas" },
  imob_elite:        { gradient: "from-yellow-300/40 via-zinc-900 to-black", glow: "shadow-yellow-500/50", ring: "border-yellow-300/70 ring-1 ring-yellow-400/50",              icon: Diamond,   subtitle: "★ Top imobiliária",          badge: "★ TOP",        ctaGradient: "from-yellow-400 via-amber-500 to-yellow-600 text-black" },
  const_basico:      { gradient: "from-amber-500/10 via-zinc-900 to-black",  glow: "shadow-amber-500/10", ring: "border-amber-500/20",                                          icon: Building2, subtitle: "Para construtoras iniciantes" },
  const_start:       { gradient: "from-amber-500/15 via-zinc-900 to-black",  glow: "shadow-amber-500/20", ring: "border-amber-400/30",                                          icon: Shield,    subtitle: "Para construtoras em ascensão" },
  const_pro:         { gradient: "from-amber-400/25 via-zinc-900 to-black",  glow: "shadow-amber-500/30", ring: "border-amber-400/50",                                          icon: Gem,       subtitle: "Para construtoras consolidadas" },
  const_master:      { gradient: "from-yellow-300/40 via-zinc-900 to-black", glow: "shadow-yellow-500/50", ring: "border-yellow-300/70 ring-1 ring-yellow-400/50",              icon: Diamond,   subtitle: "★ Top construtora",          badge: "★ TOP",        ctaGradient: "from-yellow-400 via-amber-500 to-yellow-600 text-black" },
};
const getTierStyle = (tier: string) => TIER_STYLES[tier] || TIER_STYLES.basico;

// Bots de IA inclusos: TODOS os planos pagos têm os 4 bots base.
const BASE_BOTS = [
  { emoji: "💰", name: "Avaliador IA" },
  { emoji: "✍️", name: "Copywriter IA" },
  { emoji: "📸", name: "Analisador de Fotos IA" },
  { emoji: "🤖", name: "Bot de Captação" },
];
const AGENDA_BOT = { emoji: "📅", name: "Agenda Bot IA" };
const SUPORTE_BOT = { emoji: "🎓", name: "Suporte IA" };
const AGENDA_TIERS = new Set([
  "vip", "premium", "prime",
  "imob_pro", "imob_elite", "const_pro", "const_master",
  "fundador_corretor", "fundador_empresa", "fundador_construtora",
]);
const SUPORTE_TIERS = new Set([
  "prime", "imob_elite", "const_master",
  "fundador_empresa", "fundador_construtora",
]);
const getAiBots = (tier: string) => {
  const bots = [...BASE_BOTS];
  if (AGENDA_TIERS.has(tier)) bots.push(AGENDA_BOT);
  if (SUPORTE_TIERS.has(tier)) bots.push(SUPORTE_BOT);
  return bots;
};

const getBaseColor = (colorStr: string) => {
  const m = colorStr.match(/from-([a-z]+)-\d+/);
  return m ? m[1] : "amber";
};

const getColorClasses = (baseColor: string) => {
  const map: Record<string, { text: string; iconBg: string; iconBorder: string; iconText: string; statBg: string; statBorder: string; statHighlightBg: string; statHighlightBorder: string; botBg: string; botBorder: string; check: string; glow: string; ring: string; shadow: string; ctaFrom: string; ctaTo: string }> = {
    amber: { text: "text-amber-400", iconBg: "from-amber-400/30 to-yellow-600/20", iconBorder: "border-amber-400/30", iconText: "text-amber-300", statBg: "bg-amber-500/5", statBorder: "border-amber-500/20", statHighlightBg: "from-amber-500/20 to-yellow-500/5", statHighlightBorder: "border-amber-400/30", botBg: "from-amber-500/15 via-yellow-500/5 to-transparent", botBorder: "border-amber-400/25", check: "text-amber-400", glow: "bg-amber-400/10", ring: "ring-amber-400", shadow: "rgba(245,158,11,0.25)", ctaFrom: "from-amber-500", ctaTo: "to-yellow-600" },
    yellow: { text: "text-yellow-400", iconBg: "from-yellow-400/30 to-amber-600/20", iconBorder: "border-yellow-400/30", iconText: "text-yellow-300", statBg: "bg-yellow-500/5", statBorder: "border-yellow-500/20", statHighlightBg: "from-yellow-500/20 to-amber-500/5", statHighlightBorder: "border-yellow-400/30", botBg: "from-yellow-500/15 via-amber-500/5 to-transparent", botBorder: "border-yellow-400/25", check: "text-yellow-400", glow: "bg-yellow-400/10", ring: "ring-yellow-400", shadow: "rgba(234,179,8,0.25)", ctaFrom: "from-yellow-500", ctaTo: "to-amber-600" },
    emerald: { text: "text-emerald-400", iconBg: "from-emerald-400/30 to-teal-600/20", iconBorder: "border-emerald-400/30", iconText: "text-emerald-300", statBg: "bg-emerald-500/5", statBorder: "border-emerald-500/20", statHighlightBg: "from-emerald-500/20 to-teal-500/5", statHighlightBorder: "border-emerald-400/30", botBg: "from-emerald-500/15 via-teal-500/5 to-transparent", botBorder: "border-emerald-400/25", check: "text-emerald-400", glow: "bg-emerald-400/10", ring: "ring-emerald-400", shadow: "rgba(16,185,129,0.25)", ctaFrom: "from-emerald-500", ctaTo: "to-teal-600" },
    teal: { text: "text-teal-400", iconBg: "from-teal-400/30 to-emerald-600/20", iconBorder: "border-teal-400/30", iconText: "text-teal-300", statBg: "bg-teal-500/5", statBorder: "border-teal-500/20", statHighlightBg: "from-teal-500/20 to-emerald-500/5", statHighlightBorder: "border-teal-400/30", botBg: "from-teal-500/15 via-emerald-500/5 to-transparent", botBorder: "border-teal-400/25", check: "text-teal-400", glow: "bg-teal-400/10", ring: "ring-teal-400", shadow: "rgba(20,184,166,0.25)", ctaFrom: "from-teal-500", ctaTo: "to-emerald-600" },
    blue: { text: "text-blue-400", iconBg: "from-blue-400/30 to-indigo-600/20", iconBorder: "border-blue-400/30", iconText: "text-blue-300", statBg: "bg-blue-500/5", statBorder: "border-blue-500/20", statHighlightBg: "from-blue-500/20 to-indigo-500/5", statHighlightBorder: "border-blue-400/30", botBg: "from-blue-500/15 via-indigo-500/5 to-transparent", botBorder: "border-blue-400/25", check: "text-blue-400", glow: "bg-blue-400/10", ring: "ring-blue-400", shadow: "rgba(59,130,246,0.25)", ctaFrom: "from-blue-500", ctaTo: "to-indigo-600" },
    indigo: { text: "text-indigo-400", iconBg: "from-indigo-400/30 to-blue-600/20", iconBorder: "border-indigo-400/30", iconText: "text-indigo-300", statBg: "bg-indigo-500/5", statBorder: "border-indigo-500/20", statHighlightBg: "from-indigo-500/20 to-blue-500/5", statHighlightBorder: "border-indigo-400/30", botBg: "from-indigo-500/15 via-blue-500/5 to-transparent", botBorder: "border-indigo-400/25", check: "text-indigo-400", glow: "bg-indigo-400/10", ring: "ring-indigo-400", shadow: "rgba(99,102,241,0.25)", ctaFrom: "from-indigo-500", ctaTo: "to-blue-600" },
    purple: { text: "text-purple-400", iconBg: "from-purple-400/30 to-fuchsia-600/20", iconBorder: "border-purple-400/30", iconText: "text-purple-300", statBg: "bg-purple-500/5", statBorder: "border-purple-500/20", statHighlightBg: "from-purple-500/20 to-fuchsia-500/5", statHighlightBorder: "border-purple-400/30", botBg: "from-purple-500/15 via-fuchsia-500/5 to-transparent", botBorder: "border-purple-400/25", check: "text-purple-400", glow: "bg-purple-400/10", ring: "ring-purple-400", shadow: "rgba(168,85,247,0.25)", ctaFrom: "from-purple-500", ctaTo: "to-fuchsia-600" },
    fuchsia: { text: "text-fuchsia-400", iconBg: "from-fuchsia-400/30 to-purple-600/20", iconBorder: "border-fuchsia-400/30", iconText: "text-fuchsia-300", statBg: "bg-fuchsia-500/5", statBorder: "border-fuchsia-500/20", statHighlightBg: "from-fuchsia-500/20 to-purple-500/5", statHighlightBorder: "border-fuchsia-400/30", botBg: "from-fuchsia-500/15 via-purple-500/5 to-transparent", botBorder: "border-fuchsia-400/25", check: "text-fuchsia-400", glow: "bg-fuchsia-400/10", ring: "ring-fuchsia-400", shadow: "rgba(192,38,211,0.25)", ctaFrom: "from-fuchsia-500", ctaTo: "to-purple-600" },
    pink: { text: "text-pink-400", iconBg: "from-pink-400/30 to-rose-600/20", iconBorder: "border-pink-400/30", iconText: "text-pink-300", statBg: "bg-pink-500/5", statBorder: "border-pink-500/20", statHighlightBg: "from-pink-500/20 to-rose-500/5", statHighlightBorder: "border-pink-400/30", botBg: "from-pink-500/15 via-rose-500/5 to-transparent", botBorder: "border-pink-400/25", check: "text-pink-400", glow: "bg-pink-400/10", ring: "ring-pink-400", shadow: "rgba(236,72,153,0.25)", ctaFrom: "from-pink-500", ctaTo: "to-rose-600" },
    rose: { text: "text-rose-400", iconBg: "from-rose-400/30 to-pink-600/20", iconBorder: "border-rose-400/30", iconText: "text-rose-300", statBg: "bg-rose-500/5", statBorder: "border-rose-500/20", statHighlightBg: "from-rose-500/20 to-pink-500/5", statHighlightBorder: "border-rose-400/30", botBg: "from-rose-500/15 via-pink-500/5 to-transparent", botBorder: "border-rose-400/25", check: "text-rose-400", glow: "bg-rose-400/10", ring: "ring-rose-400", shadow: "rgba(244,63,94,0.25)", ctaFrom: "from-rose-500", ctaTo: "to-pink-600" },
    orange: { text: "text-orange-400", iconBg: "from-orange-400/30 to-amber-600/20", iconBorder: "border-orange-400/30", iconText: "text-orange-300", statBg: "bg-orange-500/5", statBorder: "border-orange-500/20", statHighlightBg: "from-orange-500/20 to-amber-500/5", statHighlightBorder: "border-orange-400/30", botBg: "from-orange-500/15 via-amber-500/5 to-transparent", botBorder: "border-orange-400/25", check: "text-orange-400", glow: "bg-orange-400/10", ring: "ring-orange-400", shadow: "rgba(249,115,22,0.25)", ctaFrom: "from-orange-500", ctaTo: "to-amber-600" },
    red: { text: "text-red-400", iconBg: "from-red-400/30 to-rose-600/20", iconBorder: "border-red-400/30", iconText: "text-red-300", statBg: "bg-red-500/5", statBorder: "border-red-500/20", statHighlightBg: "from-red-500/20 to-rose-500/5", statHighlightBorder: "border-red-400/30", botBg: "from-red-500/15 via-rose-500/5 to-transparent", botBorder: "border-red-400/25", check: "text-red-400", glow: "bg-red-400/10", ring: "ring-red-400", shadow: "rgba(239,68,68,0.25)", ctaFrom: "from-red-500", ctaTo: "to-rose-600" },
    cyan: { text: "text-cyan-400", iconBg: "from-cyan-400/30 to-sky-600/20", iconBorder: "border-cyan-400/30", iconText: "text-cyan-300", statBg: "bg-cyan-500/5", statBorder: "border-cyan-500/20", statHighlightBg: "from-cyan-500/20 to-sky-500/5", statHighlightBorder: "border-cyan-400/30", botBg: "from-cyan-500/15 via-sky-500/5 to-transparent", botBorder: "border-cyan-400/25", check: "text-cyan-400", glow: "bg-cyan-400/10", ring: "ring-cyan-400", shadow: "rgba(6,182,212,0.25)", ctaFrom: "from-cyan-500", ctaTo: "to-sky-600" },
    sky: { text: "text-sky-400", iconBg: "from-sky-400/30 to-cyan-600/20", iconBorder: "border-sky-400/30", iconText: "text-sky-300", statBg: "bg-sky-500/5", statBorder: "border-sky-500/20", statHighlightBg: "from-sky-500/20 to-cyan-500/5", statHighlightBorder: "border-sky-400/30", botBg: "from-sky-500/15 via-cyan-500/5 to-transparent", botBorder: "border-sky-400/25", check: "text-sky-400", glow: "bg-sky-400/10", ring: "ring-sky-400", shadow: "rgba(14,165,233,0.25)", ctaFrom: "from-sky-500", ctaTo: "to-cyan-600" },
    slate: { text: "text-slate-400", iconBg: "from-slate-400/30 to-gray-600/20", iconBorder: "border-slate-400/30", iconText: "text-slate-300", statBg: "bg-slate-500/5", statBorder: "border-slate-500/20", statHighlightBg: "from-slate-500/20 to-gray-500/5", statHighlightBorder: "border-slate-400/30", botBg: "from-slate-500/15 via-gray-500/5 to-transparent", botBorder: "border-slate-400/25", check: "text-slate-400", glow: "bg-slate-400/10", ring: "ring-slate-400", shadow: "rgba(148,163,184,0.25)", ctaFrom: "from-slate-500", ctaTo: "to-gray-600" },
    zinc: { text: "text-zinc-400", iconBg: "from-zinc-400/30 to-neutral-600/20", iconBorder: "border-zinc-400/30", iconText: "text-zinc-300", statBg: "bg-zinc-500/5", statBorder: "border-zinc-500/20", statHighlightBg: "from-zinc-500/20 to-neutral-500/5", statHighlightBorder: "border-zinc-400/30", botBg: "from-zinc-500/15 via-neutral-500/5 to-transparent", botBorder: "border-zinc-400/25", check: "text-zinc-400", glow: "bg-zinc-400/10", ring: "ring-zinc-400", shadow: "rgba(161,161,170,0.25)", ctaFrom: "from-zinc-500", ctaTo: "to-neutral-600" },
    lime: { text: "text-lime-400", iconBg: "from-lime-400/30 to-green-600/20", iconBorder: "border-lime-400/30", iconText: "text-lime-300", statBg: "bg-lime-500/5", statBorder: "border-lime-500/20", statHighlightBg: "from-lime-500/20 to-green-500/5", statHighlightBorder: "border-lime-400/30", botBg: "from-lime-500/15 via-green-500/5 to-transparent", botBorder: "border-lime-400/25", check: "text-lime-400", glow: "bg-lime-400/10", ring: "ring-lime-400", shadow: "rgba(132,204,22,0.25)", ctaFrom: "from-lime-500", ctaTo: "to-green-600" },
    green: { text: "text-green-400", iconBg: "from-green-400/30 to-lime-600/20", iconBorder: "border-green-400/30", iconText: "text-green-300", statBg: "bg-green-500/5", statBorder: "border-green-500/20", statHighlightBg: "from-green-500/20 to-lime-500/5", statHighlightBorder: "border-green-400/30", botBg: "from-green-500/15 via-lime-500/5 to-transparent", botBorder: "border-green-400/25", check: "text-green-400", glow: "bg-green-400/10", ring: "ring-green-400", shadow: "rgba(34,197,94,0.25)", ctaFrom: "from-green-500", ctaTo: "to-lime-600" },
    violet: { text: "text-violet-400", iconBg: "from-violet-400/30 to-purple-600/20", iconBorder: "border-violet-400/30", iconText: "text-violet-300", statBg: "bg-violet-500/5", statBorder: "border-violet-500/20", statHighlightBg: "from-violet-500/20 to-purple-500/5", statHighlightBorder: "border-violet-400/30", botBg: "from-violet-500/15 via-purple-500/5 to-transparent", botBorder: "border-violet-400/25", check: "text-violet-400", glow: "bg-violet-400/10", ring: "ring-violet-400", shadow: "rgba(139,92,246,0.25)", ctaFrom: "from-violet-500", ctaTo: "to-purple-600" },
  };
  return map[baseColor] || map.amber;
};

type BillingPeriod = "monthly" | "annual" | "founder";

interface AppliedCoupon {
  id: string;
  code: string;
  discount_percent: number;
  description: string | null;
  discount_type?: "percent" | "fixed";
  discount_amount_cents?: number | null;
}

export default function PackagesPage() {
  const { user, profile } = useAuth();
  const { subscription, currentTier, refetch } = useSubscription(user?.id);
  const { plans, loading: plansLoading } = useActivePlans();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selecting, setSelecting] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>("monthly");
  const [searchParams, setSearchParams] = useSearchParams();
  const confirmedSessionRef = useRef<string | null>(null);
  const [annualDiscount, setAnnualDiscount] = useState<number>(20);
  const [couponInput, setCouponInput] = useState("");
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null);
  const [founderLots, setFounderLots] = useState<FounderLot[]>([]);
  const [founderEnabled, setFounderEnabled] = useState<boolean>(true);
  const [founderBilling, setFounderBilling] = useState<"annual" | "monthly">("monthly");

  // Checkout modal state (PIX/Cartão direto na página)
  const [checkoutModal, setCheckoutModal] = useState<{
    open: boolean;
    orderId: string | null;
    amount: number;
    planName: string;
    description?: string;
  }>({ open: false, orderId: null, amount: 0, planName: "" });

  // Carrega o desconto anual configurado pelo admin
  useEffect(() => {
    (async () => {
      const { data } = await (supabase as any)
        .from("platform_settings")
        .select("value")
        .eq("key", "annual_discount_percent")
        .maybeSingle();
      if (data?.value) setAnnualDiscount(parseInt(data.value) || 20);
    })();
  }, []);

  // Remove cupom automaticamente ao sair da aba Mensal (cupons só valem para Mensal)
  useEffect(() => {
    if (billingPeriod !== "monthly" && appliedCoupon) {
      setAppliedCoupon(null);
    }
  }, [billingPeriod, appliedCoupon]);

  // Carrega lotes Fundador ativos + setting global
  useEffect(() => {
    (async () => {
      const [{ data: lots }, { data: settings }] = await Promise.all([
        (supabase as any)
          .from("founder_lots")
          .select("id, category, lot_number, price, monthly_price, total_slots, used_slots, is_active, inherited_tier, ia_credits, ia_credits_monthly")
          .order("category")
          .order("lot_number"),
        (supabase as any)
          .from("founder_settings")
          .select("is_enabled")
          .eq("id", 1)
          .maybeSingle(),
      ]);
      if (lots) setFounderLots(lots as FounderLot[]);
      if (settings) setFounderEnabled(settings.is_enabled !== false);
    })();
  }, []);

  const isImobiliaria = profile?.seller_category === "imobiliaria" || profile?.seller_category === "construtora";
  const isConstrutora = profile?.seller_category === "construtora";
  const isFounderTier = (t: string) => t === "fundador_corretor" || t === "fundador_empresa" || t === "fundador_construtora";
  // Categorias do banco: "corretor" / "imobiliaria" / "construtora" / "free" / "individual" / "enterprise"
  const isIndividualCat = (c: string) => c === "individual" || c === "corretor" || c === "free";
  const isEnterpriseCat = (c: string, sellerCat?: string) => {
    if (c === "enterprise") return true;
    if (sellerCat === "construtora") return c === "construtora";
    // imobiliária (default empresarial) vê planos de imobiliária
    return c === "imobiliaria";
  };
  const individualPlans = isImobiliaria || billingPeriod === "founder"
    ? []
    : plans.filter((p) =>
        !isFounderTier(p.tier) && (billingPeriod === "annual"
          ? isIndividualCat(p.category) && p.price > 0
          : isIndividualCat(p.category))
      );
  const enterprisePlans = isImobiliaria && billingPeriod !== "founder"
    ? plans.filter((p) => !isFounderTier(p.tier) && isEnterpriseCat(p.category, profile?.seller_category) && (billingPeriod === "monthly" || p.price > 0))
    : [];
  const activePlan = plans.find((p) => p.tier === currentTier);

  // Calcula preço final com descontos cumulativos
  const calculateFinalPrice = (basePrice: number, tier: string) => {
    let price = basePrice;
    let totalDiscount = 0;
    let fixedCents = 0;
    if (billingPeriod === "annual" && annualDiscount > 0) {
      totalDiscount += annualDiscount;
    }
    if (appliedCoupon && billingPeriod === "monthly") {
      // Cupons só são aplicados em planos Mensais
      if (appliedCoupon.discount_type === "fixed") {
        fixedCents += Number(appliedCoupon.discount_amount_cents || 0);
      } else {
        totalDiscount += appliedCoupon.discount_percent;
      }
    }
    if (totalDiscount > 0) {
      price = price * (1 - Math.min(totalDiscount, 95) / 100);
    }
    if (fixedCents > 0) {
      price = Math.max(1, price - fixedCents / 100);
    }
    return { final: price, discount: totalDiscount };
  };

  const validateCoupon = async () => {
    const code = couponInput.trim().toUpperCase();
    if (!code) {
      toast({ title: "Digite um código de cupom", variant: "destructive" });
      return;
    }
    if (billingPeriod !== "monthly") {
      toast({ title: "Cupons indisponíveis", description: "Cupons só podem ser aplicados em planos Mensais.", variant: "destructive" });
      setValidatingCoupon(false);
      return;
    }
    setValidatingCoupon(true);
    try {
      const { data, error } = await (supabase as any)
        .from("discount_coupons")
        .select("id, code, discount_percent, discount_type, discount_amount_cents, description, applies_to, applicable_tiers, max_uses, uses_count, valid_until, is_active")
        .eq("code", code)
        .eq("is_active", true)
        .maybeSingle();

      if (error) throw error;
      if (!data) {
        toast({ title: "Cupom inválido", description: "Esse código não existe ou foi desativado.", variant: "destructive" });
        return;
      }

      // Validações client-side
      if (data.valid_until && new Date(data.valid_until) < new Date()) {
        toast({ title: "Cupom expirado", description: "Esse cupom não está mais válido.", variant: "destructive" });
        return;
      }
      if (data.max_uses && data.uses_count >= data.max_uses) {
        toast({ title: "Cupom esgotado", description: "Esse cupom já atingiu o limite de usos.", variant: "destructive" });
        return;
      }
      if (data.applies_to === "annual") {
        toast({ title: "Cupom não aplicável", description: "Esse cupom é para planos anuais e cupons foram desabilitados nesse período.", variant: "destructive" });
        return;
      }

      setAppliedCoupon({
        id: data.id,
        code: data.code,
        discount_percent: data.discount_percent,
        description: data.description,
        discount_type: data.discount_type,
        discount_amount_cents: data.discount_amount_cents,
      });
      setCouponInput("");
      const descTxt = data.discount_type === "fixed"
        ? `R$ ${(Number(data.discount_amount_cents || 0) / 100).toFixed(2).replace(".", ",")} de desconto.`
        : `${data.discount_percent}% de desconto adicional.`;
      toast({ title: `🎉 Cupom aplicado!`, description: descTxt });
    } catch (err: any) {
      toast({ title: "Erro ao validar cupom", description: err.message, variant: "destructive" });
    }
    setValidatingCoupon(false);
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    toast({ title: "Cupom removido" });
  };

  // Handler de retorno do checkout: confirma pagamento e ativa o plano
  useEffect(() => {
    const status = searchParams.get("checkout");
    const sessionId = searchParams.get("session_id");
    if (status === "cancelled") {
      toast({ title: "Pagamento cancelado", description: "Você pode tentar novamente quando quiser." });
      searchParams.delete("checkout");
      setSearchParams(searchParams, { replace: true });
      return;
    }
    if (status !== "success" || !sessionId || !user) return;
    if (confirmedSessionRef.current === sessionId) return;
    confirmedSessionRef.current = sessionId;
    (async () => {
      setConfirming(true);
      try {
        const { data, error } = await supabase.functions.invoke("confirm-checkout", {
          body: { session_id: sessionId },
        });
        if (error) throw error;
        if (data?.ok) {
          await refetch();
          toast({
            title: data.already_processed ? "Plano já ativo" : "🎉 Plano ativado!",
            description: data.already_processed
              ? "Esta compra já havia sido processada."
              : `Seu novo plano está ativo até ${new Date(data.expires_at).toLocaleDateString("pt-BR")}. Créditos IA somados ao seu saldo.`,
          });
        } else {
          toast({ title: "Pagamento ainda processando", description: "Aguarde alguns instantes e atualize a página.", variant: "destructive" });
        }
      } catch (err: any) {
        toast({ title: "Erro ao confirmar pagamento", description: err.message, variant: "destructive" });
      } finally {
        setConfirming(false);
        searchParams.delete("checkout");
        searchParams.delete("session_id");
        setSearchParams(searchParams, { replace: true });
      }
    })();
  }, [searchParams, user]);

  const handleSelect = async (plan: Plan) => {
    if (!user || !profile) {
      navigate("/login");
      return;
    }

    // Se cupom aplicado restringe a planos específicos, validar aqui também
    if (appliedCoupon) {
      const { data: cpn } = await (supabase as any)
        .from("discount_coupons")
        .select("applicable_tiers")
        .eq("id", appliedCoupon.id)
        .maybeSingle();
      if (cpn?.applicable_tiers && cpn.applicable_tiers.length > 0 && !cpn.applicable_tiers.includes(plan.tier)) {
        toast({
          title: "Cupom não vale para este plano",
          description: `O cupom ${appliedCoupon.code} é válido apenas para: ${cpn.applicable_tiers.join(", ")}`,
          variant: "destructive",
        });
        return;
      }
    }

    setSelecting(plan.tier);
    try {
      if (plan.price === 0) {
        if (subscription) {
          await supabase
            .from("seller_subscriptions")
            .update({ is_active: false } as any)
            .eq("id", subscription.id);
        }
        const { error } = await supabase.from("seller_subscriptions").insert({
          user_id: user.id,
          seller_id: profile.id,
          tier: plan.tier,
          max_items: plan.max_items,
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          payment_method: "gratis",
          payment_status: "confirmado",
        } as any);
        if (error) throw error;
        await refetch();
        toast({ title: `Pacote ${plan.name} ativado!`, description: "Você pode começar a anunciar agora." });
      } else {
        const { data, error } = await supabase.functions.invoke("appmax-create-checkout", {
          body: {
            tier: plan.tier,
            billing_period: billingPeriod,
            coupon_code: appliedCoupon?.code || null,
          },
        });
        if (error) throw error;
        if (data?.order_id) {
          setCheckoutModal({
            open: true,
            orderId: String(data.order_id),
            amount: Number(data.amount ?? plan.price),
            planName: plan.name,
            description: appliedCoupon
              ? `Cupom ${appliedCoupon.code} aplicado · ${billingPeriod === "annual" ? "Anual" : "Mensal"}`
              : billingPeriod === "annual" ? "Pagamento anual à vista" : "Pagamento mensal único",
          });
        } else {
          throw new Error("Pedido não retornado");
        }
      }
    } catch (err: any) {
      toast({ title: "Erro ao processar", description: err.message || "Tente novamente.", variant: "destructive" });
    }
    setSelecting(null);
  };

  // Lote ativo (próximo a vender) e tier de Fundador para a categoria do usuário
  const founderCategory: "corretor" | "empresa" | "construtora" =
    isConstrutora ? "construtora" : isImobiliaria ? "empresa" : "corretor";
  const founderTier =
    isConstrutora ? "fundador_construtora" : isImobiliaria ? "fundador_empresa" : "fundador_corretor";
  const activeFounderLot = founderLots
    .filter((l) => l.category === founderCategory && l.is_active && l.used_slots < l.total_slots)
    .sort((a, b) => a.lot_number - b.lot_number)[0];
  // Plano herdado configurado no lote ativo (Start, VIP, Prime, etc.)
  const inheritedTier = activeFounderLot?.inherited_tier;
  // Prioriza a linha fundador_* em subscription_plans (editável no Admin → Planos).
  // Cai no plano herdado apenas se a linha Fundador não existir.
  const founderPlan = plans.find((p) => p.tier === founderTier) || plans.find((p) => p.tier === inheritedTier);

  const handleSelectFounder = async (asUpgrade = false) => {
    if (!user || !profile) {
      navigate("/auth");
      return;
    }
    if (!activeFounderLot || !founderPlan) {
      toast({ title: "Plano Fundador esgotado", description: "Todos os lotes foram vendidos.", variant: "destructive" });
      return;
    }
    if (founderBilling === "monthly" && (!activeFounderLot.monthly_price || Number(activeFounderLot.monthly_price) <= 0)) {
      toast({ title: "Mensalidade Fundador indisponível", description: "Este lote não possui preço mensal cadastrado.", variant: "destructive" });
      return;
    }
    setSelecting(founderTier);
    try {
      const { data, error } = await supabase.functions.invoke("appmax-create-checkout", {
        body: {
          tier: founderTier,
          billing_period: founderBilling,
          founder_lot_id: activeFounderLot.id,
          is_founder_upgrade: asUpgrade,
        },
      });
      if (error) throw error;
      if (data?.order_id) {
        setCheckoutModal({
          open: true,
          orderId: String(data.order_id),
          amount: Number(data.amount ?? (founderBilling === "monthly" ? Number(activeFounderLot.monthly_price) : Number(activeFounderLot.price))),
          planName: `Fundador ${founderCategory === "corretor" ? "Corretor" : founderCategory === "empresa" ? "Empresa" : "Construtora"}`,
          description: founderBilling === "monthly" ? "Mensalidade Fundador" : "Pagamento Fundador (12 meses)",
        });
      } else {
        throw new Error("Pedido não retornado");
      }
    } catch (err: any) {
      toast({ title: "Erro ao processar", description: err.message || "Tente novamente.", variant: "destructive" });
    }
    setSelecting(null);
  };

  if (plansLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  const renderCard = (plan: Plan, idx: number, opts: { showPartners?: boolean } = {}) => {
    const style = getTierStyle(plan.tier);
    const Icon = style.icon;
    const baseColor = getBaseColor(plan.color || style.gradient);
    const cc = getColorClasses(baseColor);
    // Considera plano atual somente quando tier E período de cobrança coincidem.
    // Assim, quem está no Mensal pode fazer upgrade para Anual do mesmo plano (e vice-versa).
    const currentBilling = (subscription as any)?.billing_period || "monthly";
    const isCurrent =
      currentTier === plan.tier &&
      (plan.price === 0 || currentBilling === billingPeriod);
    const isPopular = plan.is_popular || !!style.badge;
    const credits = (plan as any).ai_credits_per_month || (plan as any).ai_generations_per_day || aiMonthlyCredits[plan.tier] || 25;
    const { final, discount } = calculateFinalPrice(plan.price, plan.tier);
    const hasDiscount = discount > 0 && plan.price > 0;
    const maxItems = plan.max_items >= 9999 ? "Ilimitado" : plan.max_items.toLocaleString("pt-BR");
    const storageLabel = plan.storage_mb >= 1024 ? `${(plan.storage_mb / 1024).toFixed(1)} GB` : `${plan.storage_mb} MB`;

    const teamCount = (plan as any).max_team_members ?? 0;
    const teamLabel = opts.showPartners && teamCount > 0
      ? (teamCount >= 9999 ? "Ilimitado" : `Até ${teamCount}`)
      : null;

    return (
      <motion.div
        key={plan.id}
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: idx * 0.08, duration: 0.5 }}
        whileHover={{ y: -6, transition: { duration: 0.2 } }}
        className={`group relative bg-black bg-gradient-to-br ${plan.color || style.gradient} backdrop-blur-xl rounded-2xl border ${plan.border_color || style.ring} ${style.glow} shadow-[0_8px_40px_-12px_${cc.shadow}] p-5 md:p-6 flex flex-col text-white ${isCurrent ? `ring-2 ${cc.ring}` : ""}`}
      >
        {/* Glow ambient */}
        <div className={`absolute -top-20 -right-20 w-40 h-40 ${cc.glow} rounded-full blur-3xl group-hover:${cc.glow.replace("/10", "/20")} transition-all duration-500 overflow-hidden pointer-events-none`} />

        {isCurrent && (
          <span className="absolute -top-3 left-4 z-10 bg-primary text-primary-foreground text-[10px] font-black uppercase px-3 py-1 rounded-full tracking-widest shadow-lg">
            Plano Atual
          </span>
        )}
        {!isCurrent && style.badge && (
          <span className={`absolute -top-3 left-1/2 -translate-x-1/2 z-10 ${plan.badge_color || (style.ctaGradient ? `bg-gradient-to-r ${style.ctaGradient}` : "bg-gradient-to-r from-amber-500 to-orange-500")} text-white text-[10px] font-black uppercase px-4 py-1 rounded-full tracking-widest shadow-lg`}>
            {style.badge}
          </span>
        )}
        {hasDiscount && (
          <span className="absolute top-3 right-3 z-10 px-2.5 py-0.5 bg-emerald-500 text-white text-[10px] font-black rounded-full shadow-lg flex items-center gap-1">
            <Sparkles size={10} /> -{discount}%
          </span>
        )}

        <div className="relative z-10 flex flex-col h-full">
          <div className="flex items-center gap-2 mb-3">
            <div className={`p-2 bg-gradient-to-br ${cc.iconBg} rounded-lg backdrop-blur border ${cc.iconBorder}`}>
              <Icon className={`w-5 h-5 ${cc.iconText}`} />
            </div>
            <h3 className="font-display font-black text-xl md:text-2xl">{plan.name}</h3>
          </div>
          <p className="text-[11px] md:text-xs text-white/50 mb-4">{style.subtitle}</p>

          <div className="mb-4">
            {plan.price === 0 ? (
              <p className="text-3xl md:text-4xl font-black bg-gradient-to-br from-white to-white/60 bg-clip-text text-transparent">Gratuito</p>
            ) : (
              <>
                {hasDiscount && (
                  <div className="text-white/40 text-xs line-through">
                    R$ {plan.price.toFixed(2).replace(".", ",")}
                  </div>
                )}
                <div className="flex items-baseline gap-1 flex-nowrap whitespace-nowrap">
                  <span className="text-2xl md:text-3xl lg:text-4xl font-black bg-gradient-to-br from-white to-white/60 bg-clip-text text-transparent whitespace-nowrap">R$ {final.toFixed(2).replace(".", ",")}</span>
                  <span className="text-xs md:text-sm font-normal text-white/40">/mês</span>
                </div>
                {billingPeriod === "annual" && (
                  <p className="text-[10px] md:text-[11px] text-white/60 mt-1">
                    Cobrado anualmente · R$ {(final * 12).toFixed(2).replace(".", ",")}/ano
                  </p>
                )}
              </>
            )}
          </div>

          <div className="mb-3 grid grid-cols-2 gap-2">
            <div className="px-3 py-2 rounded-lg bg-amber-500/5 border border-amber-500/20">
              <p className="text-[9px] uppercase tracking-wider text-white/40 mb-0.5">Anúncios</p>
              <p className="text-xs md:text-sm font-bold text-white">{maxItems}</p>
            </div>
            <div className="px-3 py-2 rounded-lg bg-gradient-to-br from-amber-500/20 to-yellow-500/5 border border-amber-400/30">
              <p className="text-[9px] uppercase tracking-wider text-amber-200/80 mb-0.5 flex items-center gap-1"><Sparkles className="w-2.5 h-2.5" /> Créditos IA/mês</p>
              <p className="text-xs md:text-sm font-bold text-white">{formatCredits(credits)}</p>
            </div>
            <div className="px-3 py-2 rounded-lg bg-amber-500/5 border border-amber-500/20">
              <p className="text-[9px] uppercase tracking-wider text-white/40 mb-0.5">Fotos / Anúncio</p>
              <p className="text-xs md:text-sm font-bold text-white">Até {plan.max_photos_per_listing}</p>
            </div>
            <div className="px-3 py-2 rounded-lg bg-amber-500/5 border border-amber-500/20">
              <p className="text-[9px] uppercase tracking-wider text-white/40 mb-0.5">Storage</p>
              <p className="text-xs md:text-sm font-bold text-white">{storageLabel}</p>
            </div>
            {teamLabel && (
              <div className="col-span-2 px-3 py-2 rounded-lg bg-gradient-to-br from-amber-500/15 to-yellow-500/5 border border-amber-400/25">
                <p className="text-[9px] uppercase tracking-wider text-amber-200/80 mb-0.5 flex items-center gap-1"><Users className="w-2.5 h-2.5" /> Corretores na equipe</p>
                <p className="text-xs md:text-sm font-bold text-white">{teamLabel}</p>
              </div>
            )}
          </div>

          <div className="mb-4 px-3 py-2.5 rounded-lg bg-gradient-to-br from-amber-500/15 via-yellow-500/5 to-transparent border border-amber-400/25">
            <p className="text-[9px] uppercase tracking-wider text-amber-200/90 mb-1.5 flex items-center gap-1 font-bold">
              <Bot className="w-3 h-3" /> Bots de IA inclusos
            </p>
            <div className="flex flex-wrap gap-1">
              {getAiBots(plan.tier).map((bot) => (
                <span key={bot.name} className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-amber-500/10 border border-amber-400/20 text-[10px] text-white/90">
                  <span>{bot.emoji}</span>
                  <span className="font-medium">{bot.name}</span>
                </span>
              ))}
            </div>
          </div>

          <ul className="space-y-1.5 flex-1 mb-5">
            {plan.benefits.map((b, i) => {
              const itemsLabel = plan.max_items >= 9999 ? "ilimitados" : plan.max_items.toLocaleString("pt-BR");
              const teamLabel = teamCount >= 9999 ? "ilimitados" : String(teamCount);
              const text = b
                .replace(/Até\s+[\d.\s]+\s+(imóveis ativos|anúncios)/gi, `Até ${itemsLabel} $1`)
                .replace(/Até\s+\d+\s+fotos por (imóvel|anúncio)/gi, `Até ${plan.max_photos_per_listing} fotos por $1`)
                .replace(/[\d.,]+\s*(MB|GB)\s+de armazenamento/gi, storageLabel + " de armazenamento")
                .replace(/[\d.,]+\s+créditos de IA por mês/gi, `${formatCredits(credits)} créditos de IA por mês`)
                .replace(/Até\s+\d+\s+corretor(es)?/gi, teamCount > 0 ? `Até ${teamLabel} corretor${teamCount === 1 ? "" : "es"}` : "$&");
              return (
                <li key={i} className="flex items-start gap-2 text-[12px] md:text-[13px] text-white/70">
                  <Check className="w-3.5 h-3.5 mt-0.5 shrink-0 text-amber-400" />
                  <span>{text}</span>
                </li>
              );
            })}
          </ul>

          <button
            onClick={() => { if (plan.price === 0) return; handleSelect(plan); }}
            disabled={isCurrent || selecting === plan.tier || plan.price === 0}
            className={`w-full rounded-xl py-2.5 font-bold text-sm transition-all flex items-center justify-center gap-1 ${
              isCurrent
                ? "bg-white/5 text-white/50 cursor-default border border-white/10"
                : plan.price === 0
                  ? "bg-white/5 text-white/60 cursor-default border border-white/10"
                  : style.ctaGradient
                  ? `bg-gradient-to-r ${style.ctaGradient} hover:brightness-110 text-black shadow-[0_4px_20px_-4px_rgba(245,158,11,0.6)]`
                  : "bg-gradient-to-r from-amber-500 to-yellow-600 hover:brightness-110 text-black shadow-[0_4px_20px_-4px_rgba(245,158,11,0.5)]"
            }`}
          >
            {selecting === plan.tier
              ? "Processando..."
              : isCurrent
              ? "Plano Atual"
              : plan.price === 0
                ? "Plano Gratuito"
                : currentTier === plan.tier && billingPeriod === "annual"
                  ? `Mudar para Anual`
                  : currentTier === plan.tier && billingPeriod === "monthly"
                    ? `Mudar para Mensal`
                    : `Assinar ${plan.name}`}
            {!isCurrent && plan.price !== 0 && <ArrowRight className="w-4 h-4" />}
          </button>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      {confirming && (
        <div className="fixed inset-0 z-[200] bg-background/90 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-card border-2 border-primary/30 rounded-2xl p-8 shadow-2xl flex flex-col items-center gap-4 max-w-sm mx-4">
            <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full" />
            <h3 className="font-display font-extrabold text-xl text-foreground">Confirmando pagamento...</h3>
            <p className="text-sm text-muted-foreground text-center">Estamos ativando seu plano e somando os créditos IA ao seu saldo.</p>
          </div>
        </div>
      )}
      <div className="gradient-hero py-12">
        <div className="container max-w-6xl mx-auto px-4">
          <Link to="/painel" className="inline-flex items-center gap-2 text-white/70 text-sm mb-4 hover:text-white transition-colors">
            <ArrowLeft size={16} /> Voltar ao Painel
          </Link>
          <h1 className="font-display font-extrabold text-3xl md:text-4xl text-white">Pacotes Premium</h1>
          <p className="text-white/70 mt-2">Escolha o plano ideal para impulsionar seus anúncios</p>
        </div>
      </div>

      <div className="container max-w-6xl mx-auto px-4 -mt-8 relative z-10 pb-24 lg:pb-16">
        {/* Painel de planos vigentes (acúmulo) */}
        <ActivePlansPanel userId={user?.id} />

        {/* Toggle Mensal / Anual */}
        <div className="flex justify-center mb-6">
          <div className="inline-flex bg-card border-2 border-border rounded-2xl p-1.5 shadow-lg">
            <button
              onClick={() => setBillingPeriod("monthly")}
              className={`px-5 sm:px-8 py-2.5 rounded-xl font-bold text-sm transition-all ${
                billingPeriod === "monthly"
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Mensal
            </button>
            <button
              onClick={() => setBillingPeriod("annual")}
              className={`px-5 sm:px-8 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${
                billingPeriod === "annual"
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Anual
              {annualDiscount > 0 && (
                <span className={`px-2 py-0.5 rounded-full text-xs font-extrabold ${
                  billingPeriod === "annual" ? "bg-white/20 text-white" : "bg-emerald-500/15 text-emerald-600"
                }`}>
                  -{annualDiscount}%
                </span>
              )}
            </button>
            {founderEnabled && (
              <button
                onClick={() => setBillingPeriod("founder")}
                className={`px-5 sm:px-8 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${
                  billingPeriod === "founder"
                    ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md"
                    : "text-amber-600 hover:text-amber-700"
                }`}
              >
                <Crown size={14} />
                Fundador
              </button>
            )}
          </div>
        </div>

        {/* Campo de cupom (não se aplica ao Fundador) */}
        <div className={`max-w-md mx-auto mb-8 ${billingPeriod !== "monthly" ? "hidden" : ""}`}>
          <AnimatePresence mode="wait">
            {appliedCoupon ? (
              <motion.div
                key="applied"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex items-center gap-3 p-4 rounded-2xl bg-emerald-500/10 border-2 border-emerald-500/30"
              >
                <CheckCircle2 size={20} className="text-emerald-600 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm text-foreground">
                    Cupom <code className="font-mono text-emerald-600">{appliedCoupon.code}</code> aplicado
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {appliedCoupon.discount_type === "fixed"
                      ? `R$ ${(Number(appliedCoupon.discount_amount_cents || 0) / 100).toFixed(2).replace(".", ",")} de desconto`
                      : `${appliedCoupon.discount_percent}% de desconto`}
                    {appliedCoupon.description ? ` · ${appliedCoupon.description}` : ""}
                  </p>
                </div>
                <button
                  onClick={removeCoupon}
                  className="p-1.5 rounded-lg hover:bg-emerald-500/20 text-emerald-600"
                  title="Remover cupom"
                >
                  <X size={16} />
                </button>
              </motion.div>
            ) : (
              <motion.div
                key="input"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex items-stretch gap-2"
              >
                <div className="relative flex-1">
                  <Ticket size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                    onKeyDown={(e) => e.key === "Enter" && validateCoupon()}
                    placeholder="Tem um cupom? Digite aqui"
                    className="w-full pl-10 pr-3 py-2.5 rounded-xl border-2 border-border bg-card text-foreground text-sm font-mono uppercase tracking-wider focus:border-primary outline-none"
                  />
                </div>
                <button
                  onClick={validateCoupon}
                  disabled={validatingCoupon || !couponInput.trim()}
                  className="px-5 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:opacity-90 disabled:opacity-50"
                >
                  {validatingCoupon ? "..." : "Aplicar"}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {individualPlans.length > 0 && (
          <>
            <h2 className="font-display font-extrabold text-xl text-foreground mb-4">Planos Individuais</h2>
            <div className={`grid grid-cols-1 sm:grid-cols-2 ${individualPlans.length >= 4 ? "lg:grid-cols-4" : "lg:grid-cols-3"} gap-4 md:gap-5`}>
              {individualPlans.map((p, i) => renderCard(p, i))}
            </div>
          </>
        )}

        {enterprisePlans.length > 0 && (
          <>
            <h2 className="font-display font-extrabold text-xl text-foreground mt-10 mb-4">Planos Empresariais</h2>
            <div className={`grid grid-cols-1 sm:grid-cols-2 ${enterprisePlans.length >= 4 ? "lg:grid-cols-4" : "lg:grid-cols-3"} gap-4 md:gap-5`}>
              {enterprisePlans.map((p, i) => renderCard(p, i, { showPartners: true }))}
            </div>
          </>
        )}

        {/* ===== Plano Fundador (apenas na aba Fundador) ===== */}
        {billingPeriod === "founder" && activeFounderLot && founderPlan && (() => {
          const slotsLeft = activeFounderLot.total_slots - activeFounderLot.used_slots;
          const pct = (activeFounderLot.used_slots / activeFounderLot.total_slots) * 100;
          const annualCredits =
            activeFounderLot.ia_credits
            ?? (founderPlan as any)?.ai_credits_per_month
            ?? aiMonthlyCredits[founderTier];
          const monthlyCredits =
            activeFounderLot.ia_credits_monthly
            ?? Math.round(annualCredits / 12);
          const credits = founderBilling === "annual" ? annualCredits : monthlyCredits;
          const isCurrent = String(currentTier) === founderTier;
          const inheritedLabel = TIER_LABEL[activeFounderLot.inherited_tier] || (isImobiliaria ? "Black Empresa" : "VIP");

          // ==== Detecta lote atual do usuário (para upgrade entre Fundadores) ====
          const userFounderLot = isCurrent
            ? founderLots
                .filter((l) => l.category === founderCategory && l.id !== activeFounderLot.id)
                .sort((a, b) => a.lot_number - b.lot_number)
                .find((l) => l.inherited_tier !== activeFounderLot.inherited_tier)
              ?? founderLots
                .filter((l) => l.category === founderCategory)
                .sort((a, b) => a.lot_number - b.lot_number)[0]
            : null;
          const userInheritedPlan = userFounderLot?.inherited_tier
            ? plans.find((p) => p.tier === userFounderLot.inherited_tier)
            : null;
           const newInheritedPlan = plans.find((p) => p.tier === activeFounderLot.inherited_tier);
           // Cor do lote = cor do plano herdado (Start verde, VIP laranja, etc.)
           const founderColor = newInheritedPlan?.color || founderPlan.color || "from-amber-500 to-orange-600";
           // Cor do texto do botão (mapeamento estático para o Tailwind compilar as classes)
           const buttonTextColor = (() => {
             const m = founderColor.match(/from-([a-z]+)-/);
             const map: Record<string, string> = {
               emerald: "text-emerald-700",
               teal: "text-teal-700",
               amber: "text-amber-700",
               orange: "text-orange-700",
               purple: "text-purple-700",
               indigo: "text-indigo-700",
               rose: "text-rose-700",
               red: "text-red-700",
               sky: "text-sky-700",
               blue: "text-blue-700",
               slate: "text-slate-700",
               zinc: "text-zinc-800",
             };
             return (m && map[m[1]]) || "text-amber-700";
           })();
           const isUpgradeAvailable =
            isCurrent &&
            userFounderLot != null &&
            Number(activeFounderLot.price) > Number(userFounderLot.price);

          // Estimativa de crédito proporcional (front: assume validade restante de 1 ano cheio se sem subscription)
          const remainingYears = subscription?.expires_at
            ? Math.max(0, (new Date(subscription.expires_at).getTime() - Date.now()) / (365 * 24 * 3600 * 1000))
            : 1;
          const estimatedCredit = userFounderLot
            ? Number(userFounderLot.price) * Math.min(1, remainingYears)
            : 0;
          const upgradeDiff = Math.max(0, Number(activeFounderLot.price) - estimatedCredit);

          return (
             <motion.div
               initial={{ opacity: 0, y: 30 }}
               animate={{ opacity: 1, y: 0 }}
               className="mt-12 relative overflow-hidden rounded-3xl border-2 border-white/30 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.4)]"
             >
               <div className={`absolute inset-0 bg-gradient-to-br ${founderColor}`} />
               <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.25),transparent_60%)]" />
               <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(0,0,0,0.25),transparent_60%)]" />

              <div className="relative p-6 md:p-10 text-white">
                <div className="flex flex-wrap items-center gap-3 mb-4">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs font-extrabold uppercase tracking-wider">
                    <Crown size={14} /> {isUpgradeAvailable ? "Upgrade Fundador" : "Oferta Fundador"}
                  </span>
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-black/30 backdrop-blur-sm rounded-full text-xs font-bold">
                    Lote {activeFounderLot.lot_number}
                  </span>
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-500/90 rounded-full text-xs font-extrabold">
                    {slotsLeft} de {activeFounderLot.total_slots} vagas restantes
                  </span>
                </div>

                {/* Toggle Mensal / Anual do Fundador (apenas se houver monthly_price no lote) */}
                {!isUpgradeAvailable && activeFounderLot.monthly_price && Number(activeFounderLot.monthly_price) > 0 && (
                  <div className="mb-6 inline-flex p-1 rounded-full bg-black/30 backdrop-blur-sm border border-white/20">
                    <button
                      onClick={() => setFounderBilling("monthly")}
                      className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${founderBilling === "monthly" ? "bg-white text-black shadow" : "text-white/80 hover:text-white"}`}
                    >
                      Mensal · 30 dias
                    </button>
                    <button
                      onClick={() => setFounderBilling("annual")}
                      className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${founderBilling === "annual" ? "bg-white text-black shadow" : "text-white/80 hover:text-white"}`}
                    >
                      Anual · 12 meses
                    </button>
                  </div>
                )}

                {/* ===== MODO UPGRADE: Comparativo entre planos ===== */}
                {isUpgradeAvailable && userInheritedPlan && newInheritedPlan && (
                  <div className="mb-8 bg-black/25 backdrop-blur-md border border-white/20 rounded-2xl p-5">
                    <p className="text-white/80 text-xs uppercase font-extrabold tracking-wider mb-3">
                      ✨ Faça upgrade do seu plano Fundador
                    </p>
                    <div className="grid md:grid-cols-[1fr_auto_1fr] gap-4 items-center">
                      {/* Plano atual */}
                      <div className="bg-white/10 rounded-xl p-4 border border-white/20">
                        <p className="text-white/70 text-[11px] uppercase font-bold tracking-wider">Você tem hoje</p>
                        <h4 className="font-display font-extrabold text-xl text-white mt-1">
                          Fundador {userInheritedPlan.name}
                        </h4>
                        <p className="text-white/80 text-sm mt-2">
                          📦 {userInheritedPlan.max_items} anúncios<br/>
                          🪙 {formatCredits(aiMonthlyCredits[userInheritedPlan.tier] ?? 250)} créditos IA
                        </p>
                      </div>
                      {/* Seta */}
                      <div className="text-center text-white text-3xl font-bold hidden md:block">→</div>
                      <div className="text-center text-white text-2xl font-bold md:hidden">↓</div>
                      {/* Novo plano */}
                      <div className="bg-emerald-500/30 rounded-xl p-4 border-2 border-emerald-300">
                        <p className="text-emerald-100 text-[11px] uppercase font-bold tracking-wider">Você passa a ter</p>
                        <h4 className="font-display font-extrabold text-xl text-white mt-1">
                          Fundador {newInheritedPlan.name}
                        </h4>
                        <p className="text-white/95 text-sm mt-2">
                          📦 {newInheritedPlan.max_items} anúncios<br/>
                          🪙 {formatCredits(credits)} créditos IA
                        </p>
                      </div>
                    </div>

                    {/* Diferenças e benefícios extras */}
                    <div className="mt-4 grid sm:grid-cols-2 gap-2 text-sm">
                      {newInheritedPlan.benefits
                        .filter((b) => !userInheritedPlan.benefits.includes(b))
                        .slice(0, 6)
                        .map((b, i) => (
                          <div key={i} className="flex items-start gap-2 text-white/95">
                            <Sparkles size={14} className="text-emerald-200 mt-0.5 flex-shrink-0" />
                            <span><strong className="text-emerald-200">NOVO:</strong> {b}</span>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                <div className="grid lg:grid-cols-[1.2fr_1fr] gap-8 items-center">
                  <div>
                    <h2 className="font-display font-extrabold text-3xl md:text-4xl leading-tight">
                      {isUpgradeAvailable
                        ? `Suba para Fundador ${newInheritedPlan?.name || inheritedLabel}`
                        : `Seja um ${isConstrutora ? "Construtora" : isImobiliaria ? "Imobiliária" : "Corretor"} Fundador`}
                    </h2>
                    <p className="mt-3 text-white/90 text-base md:text-lg max-w-xl">
                      {isUpgradeAvailable ? (
                        <>
                          Migre do seu Fundador atual para o <strong>{inheritedLabel}</strong> pagando apenas a diferença proporcional.
                          Validade renovada por 1 ano completo a partir do upgrade.
                        </>
                      ) : (
                        <>
                          Pagamento único, acesso por <strong>{founderBilling === "annual" ? "1 ano completo" : "1 mês completo"}</strong> aos benefícios do plano{" "}
                          <strong>{inheritedLabel}</strong> + selo exclusivo de Membro Fundador.
                        </>
                      )}
                    </p>

                    <ul className="mt-5 grid sm:grid-cols-2 gap-2.5 text-sm">
                      {founderPlan.benefits.map((b, i) => {
                        const text = founderBilling === "monthly"
                          ? b
                              .replace(/válido por 12 meses/gi, "válido por 30 dias")
                              .replace(/12 meses/gi, "30 dias")
                              .replace(/1 ano/gi, "30 dias")
                              .replace(/anual/gi, "mensal")
                          : b;
                        return (
                          <li key={i} className="flex items-start gap-2">
                            <CheckCircle2 size={16} className="text-white mt-0.5 flex-shrink-0" />
                            <span className="text-white/95">{text}</span>
                          </li>
                        );
                      })}
                    </ul>

                    <div className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-black/30 backdrop-blur-sm">
                      <Coins size={18} className="text-amber-200" />
                      <span className="font-bold text-white">
                        {formatCredits(credits)} créditos IA
                      </span>
                      <span className="text-white/70 text-xs">· não renováveis</span>
                    </div>
                  </div>

                  <div className="bg-white/15 backdrop-blur-md border border-white/30 rounded-2xl p-6 text-center">
                    <p className="text-white/80 text-sm font-semibold uppercase tracking-wider">
                      {isUpgradeAvailable
                        ? "Diferença a pagar"
                        : founderBilling === "monthly"
                        ? "Mensalidade Fundador"
                        : "Pagamento único"}
                    </p>
                    {isUpgradeAvailable && (
                      <p className="text-white/70 text-xs line-through mt-1">
                        de R$ {Number(activeFounderLot.price).toFixed(0)}
                      </p>
                    )}
                    <div className="mt-2 flex items-baseline justify-center gap-1">
                      <span className="text-white/70 text-2xl font-bold">R$</span>
                      <span className="font-display font-extrabold text-6xl">
                        {isUpgradeAvailable
                          ? upgradeDiff.toFixed(0)
                          : founderBilling === "monthly" && activeFounderLot.monthly_price
                          ? Number(activeFounderLot.monthly_price).toFixed(2).replace(".", ",")
                          : Number(activeFounderLot.price).toFixed(0)}
                      </span>
                      <span className="text-white/70 text-sm">
                        {founderBilling === "monthly" && !isUpgradeAvailable ? "/mês" : "/ano"}
                      </span>
                    </div>
                    {isUpgradeAvailable && (
                      <p className="text-emerald-200 text-xs mt-1 font-bold">
                        ✓ Crédito de R$ {estimatedCredit.toFixed(0)} aplicado
                      </p>
                    )}
                    <p className="text-white/80 text-xs mt-1">
                      {founderBilling === "monthly" && !isUpgradeAvailable
                        ? "Renovado a cada 30 dias · cancele quando quiser"
                        : "à vista · sem renovação automática"}
                    </p>

                    <div className="mt-4">
                      <div className="h-2 w-full rounded-full bg-black/30 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-emerald-400 to-emerald-300 transition-all"
                          style={{ width: `${Math.max(pct, 4)}%` }}
                        />
                      </div>
                      <p className="text-white/80 text-xs mt-2">
                        {activeFounderLot.used_slots} fundadores já garantiram
                      </p>
                    </div>

                    <button
                      onClick={() => handleSelectFounder(isUpgradeAvailable)}
                      disabled={(isCurrent && !isUpgradeAvailable) || selecting === founderTier}
                      className={`mt-5 w-full py-3.5 rounded-xl bg-white ${buttonTextColor} font-extrabold text-base hover:bg-white/90 transition-all shadow-xl disabled:opacity-60`}
                    >
                      {selecting === founderTier
                        ? "Processando..."
                        : isUpgradeAvailable
                        ? `🚀 Fazer upgrade por R$ ${upgradeDiff.toFixed(0)}`
                        : isCurrent
                        ? "Você é Fundador 🏆"
                        : `🏆 Garantir minha vaga`}
                    </button>

                    {founderLots.filter((l) => l.category === founderCategory).length > 1 && (
                      <p className="text-white/70 text-[11px] mt-3">
                        Próximos lotes:{" "}
                        {founderLots
                          .filter((l) => l.category === founderCategory && l.lot_number > activeFounderLot.lot_number)
                          .map((l) => `Lote ${l.lot_number} R$ ${Number(l.price).toFixed(0)}`)
                          .join(" · ")}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })()}

        {billingPeriod === "founder" && !activeFounderLot && (
          <div className="mt-12 text-center bg-card border-2 border-dashed border-border rounded-3xl p-12">
            <Crown size={48} className="mx-auto text-muted-foreground mb-4" />
            <h3 className="font-display font-extrabold text-2xl text-foreground">Lotes Fundador esgotados</h3>
            <p className="text-muted-foreground mt-2">Todas as vagas de fundador foram preenchidas. Confira os planos Mensal ou Anual.</p>
          </div>
        )}

        {subscription && activePlan && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 bg-card border-2 border-primary/30 rounded-2xl p-6 shadow-lg"
          >
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl bg-gradient-to-br ${activePlan.color}`}>
                  {(() => { const ActiveIcon = tierIcons[currentTier] || Zap; return <ActiveIcon size={24} className="text-white" />; })()}
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Plano Ativo</p>
                  {(() => {
                    const isFounder = isFounderTier(currentTier);
                    // Para Fundador: busca o lote correspondente à categoria do usuário (preço e tier herdado)
                    const founderLotForUser = isFounder
                      ? founderLots
                          .filter((l) => l.category === founderCategory)
                          .sort((a, b) => b.lot_number - a.lot_number)[0]
                      : null;
                    const inheritedPlan = founderLotForUser?.inherited_tier
                      ? plans.find((p) => p.tier === founderLotForUser.inherited_tier)
                      : null;
                    const displayName = isFounder
                      ? `Fundador${inheritedPlan ? ` ${inheritedPlan.name}` : ""}`
                      : activePlan.name;
                    const displayPrice = isFounder
                      ? (founderLotForUser?.price ?? activePlan.price)
                      : activePlan.price;
                    const suffix = isFounder ? "/ano" : "/mês";
                    return (
                      <>
                        <h3 className="font-display font-extrabold text-xl text-foreground">{displayName}</h3>
                        <p className="text-sm text-muted-foreground">
                          {activePlan.price === 0 && !isFounder
                            ? "Grátis"
                            : `R$ ${Number(displayPrice).toFixed(2).replace(".", ",")}${suffix}`}
                          {subscription.expires_at && (
                            <span className="ml-2">
                              · Válido até {new Date(subscription.expires_at).toLocaleDateString("pt-BR")}
                            </span>
                          )}
                        </p>
                      </>
                    );
                  })()}
                  {activePlan.price > 0 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      ✨ Sem renovação automática · Troque de plano quando quiser
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground/80 mt-2 italic leading-relaxed">
                    ℹ️ Quando você tem mais de um plano ativo, exibimos aqui o <strong>plano principal</strong> (o de maior nível). Ele é o responsável pelas vantagens visuais como <strong>badge de destaque</strong>, <strong>melhor exposição nos resultados</strong> e prioridade nas vitrines. Os demais planos continuam ativos e seus limites (anúncios, créditos IA, etc.) <strong>somam ao principal</strong>.
                  </p>
                </div>

              </div>
            </div>
          </motion.div>
        )}

        <div className="mt-10 bg-card border border-border rounded-2xl p-6">
          <h3 className="font-display font-bold text-lg text-foreground mb-3">Como funciona?</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm text-muted-foreground">
            <div>
              <strong className="text-foreground">1. Escolha seu plano</strong>
              <p className="mt-1">Mensal (30 dias) ou Anual (12 meses), aplique cupom se tiver.</p>
            </div>
            <div>
              <strong className="text-foreground">2. Pagamento único</strong>
              <p className="mt-1">Pagamento via Appmax, no <strong>Pix</strong> ou <strong>cartão</strong>. <strong>Sem renovação automática.</strong></p>
            </div>
            <div>
              <strong className="text-foreground">3. Ativação instantânea</strong>
              <p className="mt-1">Plano ativo na hora e seus créditos IA somam ao saldo atual.</p>
            </div>
            <div>
              <strong className="text-foreground">4. Troque quando quiser</strong>
              <p className="mt-1">Sem amarrações. Compre outro plano e ele substitui o atual mantendo seus créditos.</p>
            </div>
          </div>
        </div>
      </div>
      <PlanCheckoutModal
        open={checkoutModal.open}
        orderId={checkoutModal.orderId}
        amount={checkoutModal.amount}
        planName={checkoutModal.planName}
        description={checkoutModal.description}
        onClose={() => setCheckoutModal((s) => ({ ...s, open: false }))}
        onPaid={() => { refetch(); }}
      />
    </div>
  );
}
