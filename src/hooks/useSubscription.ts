import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface Subscription {
  id: string;
  user_id: string;
  seller_id: string;
  tier: "start" | "basico" | "premium" | "vip" | "essencial_empresa" | "premium_empresa" | "prime_empresa" | "black";
  max_items: number;
  started_at: string;
  expires_at: string;
  is_active: boolean;
  payment_method: string | null;
  payment_status: string | null;
  notes: string | null;
}

export const PACKAGE_CONFIG = {
  start: {
    name: "Start",
    price: 24.99,
    setupFee: 299,
    maxItems: 25,
    aiGenerationsPerDay: 10,
    color: "from-emerald-500 to-teal-600",
    borderColor: "border-emerald-400",
    badgeColor: "bg-gradient-to-r from-emerald-500 to-teal-500 text-white",
    benefits: [
      "Até 25 anúncios ativos",
      "Vitrine Lvl 1 — mais visibilidade",
      "1 Layout (Showcase) + 3 Temas",
      "CRM Kanban completo",
      "Stories (estilo Instagram)",
      "Página de Captação de imóveis",
      "Todos os modelos de contrato",
      "Simulador de Financiamento",
      "PDF de Proposta profissional",
      "Selo Start + Hero Banner",
      "Destaque na listagem",
      "Push: 1 envio por dia",
      "Gerador de Texto IA: 10/dia",
    ],
  },
  basico: {
    name: "Básico",
    price: 0,
    setupFee: 0,
    maxItems: 5,
    aiGenerationsPerDay: 5,
    color: "from-slate-500 to-slate-600",
    borderColor: "border-slate-400",
    badgeColor: "bg-slate-500 text-white",
    benefits: [
      "Até 5 anúncios ativos",
      "Vitrine própria (sua loja online)",
      "URL personalizada /seu-nome",
      "1 Layout (Showcase) + 1 Tema",
      "Painel do vendedor completo",
      "Estatísticas básicas",
      "Gerador de contratos (1 modelo)",
      "QR Code dos anúncios e propostas PDF",
      "Calculadora de Lucro (ROI)",
      "Sistema de Parcerias entre corretores",
      "Push: 1 envio por dia",
      "Gerador de Texto IA: 5/dia",
    ],
  },
  premium: {
    name: "VIP",
    price: 59.99,
    setupFee: 719,
    maxItems: 60,
    aiGenerationsPerDay: 20,
    color: "from-amber-500 to-orange-600",
    borderColor: "border-amber-400",
    badgeColor: "bg-gradient-to-r from-amber-500 to-orange-500 text-white",
    benefits: [
      "Até 60 anúncios ativos",
      "Vitrine Lvl 2 — destaque superior",
      "4 Layouts + 6 Temas",
      "Tudo do Start +",
      "Bot de Captação (fluxo fixo)",
      "Push Notifications: 2 envios por dia",
      "Vídeo banner hero (autoplay)",
      "Modo Cinema imersivo",
      "Efeitos visuais na loja",
      "Gestão de Aluguéis completa",
      "Sistema de ADS integrado",
      "Estatísticas avançadas",
      "Selo VIP nos anúncios",
      "Suporte prioritário",
      "Gerador de Texto IA: 20/dia",
    ],
  },
  vip: {
    name: "Premium",
    price: 114.99,
    setupFee: 1379,
    maxItems: 115,
    aiGenerationsPerDay: 50,
    color: "from-purple-600 to-indigo-700",
    borderColor: "border-purple-500",
    badgeColor: "bg-gradient-to-r from-purple-600 to-indigo-600 text-white",
    benefits: [
      "Até 115 anúncios ativos",
      "Vitrine Lvl 3 — máximo individual",
      "Todos os 7 Layouts + Temas",
      "Tudo do VIP +",
      "Captação com IA Inteligente",
      "Instagram na loja",
      "SEO otimizado (cidade/bairro)",
      "Destaque Épico (até 5 imóveis)",
      "Galeria Showroom + Copywriting",
      "Selo Premium exclusivo",
      "Push Notifications: 3 envios por dia",
      "Suporte VIP dedicado",
      "Gerador de Texto IA: 50/dia",
    ],
  },
  essencial_empresa: {
    name: "Exclusive",
    price: 199.99,
    setupFee: 0,
    maxItems: 9999,
    aiGenerationsPerDay: 100,
    color: "from-rose-600 to-red-700",
    borderColor: "border-rose-500",
    badgeColor: "bg-gradient-to-r from-rose-600 to-red-600 text-white",
    benefits: [
      "Anúncios ilimitados",
      "Vitrine Lvl 4 — prioridade empresa",
      "Todos os layouts + temas",
      "Tudo do Premium +",
      "Até 5 corretores vinculados",
      "Lojas espelho por corretor",
      "WhatsApp Team Picker",
      "Analytics por corretor",
      "Selo Exclusive",
      "Push Notifications: 4 envios por dia",
      "Suporte dedicado",
      "Gerador de Texto IA: 100/dia",
    ],
  },
  premium_empresa: {
    name: "Prime",
    price: 349.99,
    setupFee: 0,
    maxItems: 9999,
    aiGenerationsPerDay: 200,
    color: "from-sky-600 to-blue-700",
    borderColor: "border-sky-500",
    badgeColor: "bg-gradient-to-r from-sky-600 to-blue-700 text-white",
    benefits: [
      "Anúncios ilimitados",
      "Vitrine Lvl 5 — destaque premium",
      "Tudo do Exclusive +",
      "Até 10 corretores vinculados",
      "Domínio personalizado",
      "Selo Prime",
      "Push Notifications: 5 envios por dia",
      "Suporte premium dedicado",
      "Gerador de Texto IA: 200/dia",
    ],
  },
  prime_empresa: {
    name: "Black",
    price: 599.99,
    setupFee: 0,
    maxItems: 9999,
    aiGenerationsPerDay: 400,
    color: "from-zinc-800 to-zinc-950",
    borderColor: "border-zinc-500",
    badgeColor: "bg-gradient-to-r from-zinc-800 to-zinc-950 text-white",
    benefits: [
      "Anúncios ilimitados",
      "Vitrine Lvl 6 — máximo absoluto",
      "Tudo do Prime +",
      "Corretores ilimitados",
      "Gerente de conta VIP dedicado",
      "Selo Black ★ exclusivo",
      "Push Notifications: 6 envios por dia",
      "Suporte 24/7 prioritário",
      "Gerador de Texto IA: 400/dia",
    ],
  },
  black: {
    name: "Black",
    price: 899.99,
    setupFee: 0,
    maxItems: 9999,
    aiGenerationsPerDay: 400,
    color: "from-zinc-900 to-black",
    borderColor: "border-yellow-500",
    badgeColor: "bg-gradient-to-r from-zinc-900 to-black text-yellow-400 border border-yellow-500/50",
    benefits: [
      "Anúncios ilimitados",
      "Vitrine Lvl 6 — máximo absoluto",
      "Tudo do Prime +",
      "Corretores ilimitados",
      "Gerente de conta VIP dedicado",
      "Selo Black ★ exclusivo",
      "Push Notifications: 6 envios por dia",
      "Suporte 24/7 prioritário",
      "Gerador de Texto IA: 400/dia",
    ],
  },
} as const;

export function useSubscription(userId?: string) {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) { setLoading(false); return; }
    // First sync with Stripe, then fetch local
    syncWithStripe().then(() => fetchSubscription());
  }, [userId]);

  const syncWithStripe = async () => {
    try {
      await supabase.functions.invoke("check-subscription");
    } catch {
      // Silently fail - local data will be used
    }
  };

  const fetchSubscription = async () => {
    if (!userId) return;
    const { data } = await supabase
      .from("seller_subscriptions")
      .select("*")
      .eq("user_id", userId)
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(1);

    if (data && data.length > 0) {
      const sub = data[0] as any;
      setSubscription({
        id: sub.id,
        user_id: sub.user_id,
        seller_id: sub.seller_id,
        tier: sub.tier,
        max_items: sub.max_items,
        started_at: sub.started_at,
        expires_at: sub.expires_at,
        is_active: sub.is_active,
        payment_method: sub.payment_method,
        payment_status: sub.payment_status,
        notes: sub.notes,
      });
    }
    setLoading(false);
  };

  const refetch = async () => {
    await syncWithStripe();
    await fetchSubscription();
  };

  const daysUntilExpiry = subscription
    ? Math.ceil((new Date(subscription.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  const isExpired = daysUntilExpiry !== null && daysUntilExpiry <= 0;
  const isExpiringSoon = daysUntilExpiry !== null && daysUntilExpiry > 0 && daysUntilExpiry <= 7;

  const currentTier = subscription?.tier || "basico";
  const config = PACKAGE_CONFIG[currentTier];

  return {
    subscription,
    loading,
    daysUntilExpiry,
    isExpired,
    isExpiringSoon,
    currentTier,
    config,
    refetch,
  };
}

export function useSellerSubscription(sellerId?: string) {
  const [tier, setTier] = useState<"start" | "basico" | "premium" | "vip" | "essencial_empresa" | "premium_empresa" | "prime_empresa" | "black">("basico");

  useEffect(() => {
    if (!sellerId) return;
    supabase
      .from("seller_subscriptions")
      .select("tier")
      .eq("seller_id", sellerId)
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .then(({ data }) => {
        if (data && data.length > 0) setTier((data[0] as any).tier);
      });
  }, [sellerId]);

  return tier;
}

export function useIsAdmin(userId?: string) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) { setLoading(false); return; }
    supabase.rpc("has_role", { _user_id: userId, _role: "admin" }).then(({ data }) => {
      setIsAdmin(!!data);
      setLoading(false);
    });
  }, [userId]);

  return { isAdmin, loading };
}
