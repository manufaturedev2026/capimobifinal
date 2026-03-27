import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface Subscription {
  id: string;
  user_id: string;
  seller_id: string;
  tier: "start" | "basico" | "premium" | "vip" | "essencial_empresa" | "premium_empresa";
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
    maxItems: 10,
    color: "from-emerald-500 to-teal-600",
    borderColor: "border-emerald-400",
    badgeColor: "bg-gradient-to-r from-emerald-500 to-teal-500 text-white",
    benefits: [
      "Até 10 anúncios ativos",
      "Loja estilo Netflix",
      "Destaque normal na listagem",
      "Painel do vendedor completo",
      "Estatísticas básicas",
    ],
  },
  basico: {
    name: "Básico",
    price: 0,
    maxItems: 3,
    color: "from-slate-500 to-slate-600",
    borderColor: "border-slate-400",
    badgeColor: "bg-slate-500 text-white",
    benefits: [
      "Até 3 anúncios ativos",
      "Loja estilo Netflix",
      "Painel do vendedor completo",
      "Estatísticas básicas",
    ],
  },
  premium: {
    name: "VIP",
    price: 59.99,
    maxItems: 15,
    color: "from-amber-500 to-orange-600",
    borderColor: "border-amber-400",
    badgeColor: "bg-gradient-to-r from-amber-500 to-orange-500 text-white",
    benefits: [
      "Até 15 anúncios ativos",
      "Loja estilo Netflix",
      "Selo Premium nos anúncios",
      "Destaque no topo da listagem",
      "Estatísticas avançadas",
      "Suporte prioritário",
    ],
  },
  vip: {
    name: "Premium",
    price: 114.99,
    maxItems: 50,
    color: "from-purple-600 to-indigo-700",
    borderColor: "border-purple-500",
    badgeColor: "bg-gradient-to-r from-purple-600 to-indigo-600 text-white",
    benefits: [
      "Até 50 anúncios ativos",
      "Loja estilo Netflix",
      "Selo VIP exclusivo",
      "Destaque no topo da listagem",
      "Estatísticas completas",
      "Suporte VIP dedicado",
      "Anúncios via Google Ads",
      "Instagram na loja",
    ],
  },
  essencial_empresa: {
    name: "Essencial Empresa",
    price: 539.90,
    maxItems: 9999,
    color: "from-rose-600 to-red-700",
    borderColor: "border-rose-500",
    badgeColor: "bg-gradient-to-r from-rose-600 to-red-600 text-white",
    benefits: [
      "Anúncios ilimitados",
      "Loja estilo Netflix",
      "Selo Empresa Verificada",
      "Destaque na homepage",
      "Destaque no topo da listagem",
      "Estatísticas completas",
      "Campanha dedicada de Google Ads",
      "Gerente de conta dedicado",
      "Suporte VIP dedicado",
      "Instagram na loja",
      "Até 5 Corretores vinculados",
    ],
  },
  premium_empresa: {
    name: "Premium Empresa",
    price: 999.90,
    maxItems: 9999,
    color: "from-sky-600 to-blue-800",
    borderColor: "border-sky-500",
    badgeColor: "bg-gradient-to-r from-sky-600 to-blue-700 text-white",
    benefits: [
      "Anúncios ilimitados",
      "Loja estilo Netflix",
      "Selo Empresa Verificada",
      "Destaque na homepage",
      "Destaque no topo da listagem",
      "Estatísticas completas",
      "Campanha Google Ads ampliada",
      "Anúncios Dinâmicos Google ADS",
      "Gerente de conta dedicado",
      "Suporte VIP dedicado",
      "Instagram na loja",
      "Até 10 Corretores vinculados",
    ],
  },
} as const;

export function useSubscription(userId?: string) {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) { setLoading(false); return; }
    fetchSubscription();
  }, [userId]);

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
    refetch: fetchSubscription,
  };
}

export function useSellerSubscription(sellerId?: string) {
  const [tier, setTier] = useState<"start" | "basico" | "premium" | "vip" | "essencial_empresa" | "premium_empresa">("basico");

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
