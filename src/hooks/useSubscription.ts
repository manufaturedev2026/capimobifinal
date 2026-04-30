import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface Subscription {
  id: string;
  user_id: string;
  seller_id: string;
  tier: "start" | "basico" | "premium" | "prime" | "basico_empresa" | "essencial_empresa" | "premium_empresa" | "prime_empresa" | "fundador_corretor" | "fundador_empresa" | "fundador_construtora" | "imob_basico" | "imob_start" | "imob_pro" | "imob_elite" | "const_basico" | "const_start" | "const_pro" | "const_master";
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
    price: 49.99,
    setupFee: 0,
    maxItems: 30,
    color: "from-emerald-500 to-teal-600",
    borderColor: "border-emerald-400",
    badgeColor: "bg-gradient-to-r from-emerald-500 to-teal-500 text-white",
    benefits: [
      "Até 30 anúncios ativos",
      "Vitrine Lvl 1 — mais visibilidade",
      "1 Layout (Showcase) + 3 Temas",
      "URL personalizada /seu-nome",
      "Painel do vendedor completo",
      "CRM Kanban completo",
      "Stories (estilo Instagram)",
      "Página de Captação de imóveis",
      "Todos os modelos de contrato",
      "Simulador de Financiamento",
      "PDF de Proposta profissional",
      "QR Code dos anúncios",
      "Calculadora de Lucro (ROI)",
      "Sistema de Parcerias entre corretores",
      "Estatísticas básicas",
      "Selo Start + Hero Banner",
      "Destaque na listagem",
      "Push: 1 envio por dia",
    ],
  },
  basico: {
    name: "Básico",
    price: 0,
    setupFee: 0,
    maxItems: 5,
    color: "from-slate-500 to-slate-600",
    borderColor: "border-slate-400",
    badgeColor: "bg-slate-500 text-white",
    benefits: [
      "Até 5 anúncios ativos",
      "Vitrine própria (sua loja online)",
      "URL personalizada /seu-nome",
      "1 Layout (Marketplace) + 1 Tema",
      "Painel do vendedor completo",
      "Estatísticas básicas",
      "Gerador de contratos (1 modelo)",
      "QR Code dos anúncios e propostas PDF",
      "Calculadora de Lucro (ROI)",
      "Sistema de Parcerias entre corretores",
      "Push: 1 envio por dia",
    ],
  },
  premium: {
    name: "Premium",
    price: 59.90,
    setupFee: 0,
    maxItems: 75,
    color: "from-amber-500 to-orange-600",
    borderColor: "border-amber-400",
    badgeColor: "bg-gradient-to-r from-amber-500 to-orange-500 text-white",
    benefits: [
      "Até 75 anúncios ativos",
      "Até 10 fotos por anúncio",
      "Vitrine Lvl 2 — destaque superior",
      "4 Layouts + 6 Temas",
      "URL personalizada /seu-nome",
      "Painel do vendedor completo",
      "CRM Kanban completo",
      "Stories (estilo Instagram)",
      "Bot de Captação (fluxo fixo)",
      "Página de Captação de imóveis",
      "Todos os modelos de contrato",
      "Simulador de Financiamento",
      "PDF de Proposta profissional",
      "Calculadora de Lucro (ROI)",
      "Sistema de Parcerias entre corretores",
      "Vídeo banner hero (autoplay)",
      "Modo Cinema imersivo",
      "Efeitos visuais na loja",
      "Gestão de Aluguéis completa",
      "Sistema de ADS integrado",
      "Estatísticas avançadas",
      "Selo Premium nos anúncios",
      "Hero Banner",
      "Push Notifications: 2 envios por dia",
      "Suporte prioritário",
    ],
  },
  prime: {
    name: "Prime",
    price: 119.90,
    setupFee: 0,
    maxItems: 150,
    color: "from-purple-600 to-indigo-700",
    borderColor: "border-purple-500",
    badgeColor: "bg-gradient-to-r from-purple-600 to-indigo-600 text-white",
    benefits: [
      "Até 150 anúncios ativos",
      "Até 20 fotos por anúncio",
      "Vitrine Lvl 3 — máximo individual",
      "Todos os 7 Layouts + Temas",
      "URL personalizada /seu-nome",
      "Painel do vendedor completo",
      "CRM Kanban completo",
      "Stories (estilo Instagram)",
      "Bot de Captação com IA Inteligente",
      "Página de Captação de imóveis",
      "Todos os modelos de contrato",
      "Simulador de Financiamento",
      "PDF de Proposta profissional",
      "Calculadora de Lucro (ROI)",
      "Sistema de Parcerias entre corretores",
      "Vídeo banner hero (autoplay)",
      "Modo Cinema imersivo",
      "Efeitos visuais na loja",
      "Gestão de Aluguéis completa",
      "Sistema de ADS integrado",
      "Instagram na loja",
      "SEO otimizado (cidade/bairro)",
      "Destaque Épico (até 5 imóveis)",
      "Galeria Showroom + Copywriting",
      "Estatísticas avançadas",
      "Selo Premium exclusivo",
      "Hero Banner",
      "Push Notifications: 3 envios por dia",
      "Suporte VIP dedicado",
    ],
  },
  basico_empresa: {
    name: "Básico Empresa",
    price: 0,
    setupFee: 0,
    maxItems: 5,
    color: "from-slate-500 to-slate-600",
    borderColor: "border-slate-400",
    badgeColor: "bg-slate-500 text-white",
    benefits: [
      "Até 5 anúncios ativos",
      "Vitrine própria empresarial",
      "Selo de Empresa Verificada",
      "Até 1 corretor vinculado",
      "Lojas espelho por corretor",
      "CRM Kanban completo",
      "1 Layout (Marketplace) + 1 Tema",
      "Estatísticas básicas",
      "Sistema de Parcerias entre corretores",
      "Push: 1 envio por dia",
    ],
  },
  essencial_empresa: {
    name: "Exclusive",
    price: 399.99,
    setupFee: 0,
    maxItems: 9999,
    color: "from-rose-600 to-red-700",
    borderColor: "border-rose-500",
    badgeColor: "bg-gradient-to-r from-rose-600 to-red-600 text-white",
    benefits: [
      "Anúncios ilimitados",
      "Vitrine Lvl 1 — pareada com Start",
      "Todos os 7 Layouts + Temas",
      "Até 5 corretores vinculados",
      "Lojas espelho por corretor",
      "WhatsApp Team Picker",
      "CRM Kanban completo",
      "Analytics por corretor",
      "Bot de Captação com IA Inteligente",
      "Sistema de ADS integrado",
      "Vídeo banner hero (autoplay)",
      "Modo Cinema imersivo",
      "Efeitos visuais na loja",
      "Gestão de Aluguéis completa",
      "Instagram na loja",
      "SEO otimizado (cidade/bairro)",
      "Destaque Épico (até 5 imóveis)",
      "Galeria Showroom + Copywriting",
      "Gerador de contratos + propostas PDF",
      "Calculadora de Lucro (ROI)",
      "Sistema de Parcerias entre corretores",
      "Selo Exclusive",
      "Push Notifications: 4 envios por dia",
      "Suporte dedicado",
    ],
  },
  premium_empresa: {
    name: "Prime",
    price: 699.99,
    setupFee: 0,
    maxItems: 9999,
    color: "from-sky-600 to-blue-700",
    borderColor: "border-sky-500",
    badgeColor: "bg-gradient-to-r from-sky-600 to-blue-700 text-white",
    benefits: [
      "Anúncios ilimitados",
      "Vitrine Lvl 2 — pareada com VIP",
      "Todos os 7 Layouts + Temas",
      "URL personalizada /seu-nome",
      "Painel do vendedor completo",
      "Até 10 corretores vinculados",
      "Lojas espelho por corretor",
      "WhatsApp Team Picker",
      "CRM Kanban completo",
      "Stories (estilo Instagram)",
      "Analytics avançado por corretor",
      "Bot de Captação com IA Inteligente",
      "Página de Captação de imóveis",
      "Sistema de ADS integrado",
      "Vídeo banner hero (autoplay)",
      "Modo Cinema imersivo",
      "Efeitos visuais na loja",
      "Gestão de Aluguéis completa",
      "Instagram na loja",
      "SEO otimizado (cidade/bairro)",
      "Destaque Épico (até 5 imóveis)",
      "Galeria Showroom + Copywriting",
      "Hero Banner",
      "Todos os modelos de contrato",
      "Simulador de Financiamento",
      "PDF de Proposta profissional",
      "QR Code dos anúncios",
      "Calculadora de Lucro (ROI)",
      "Sistema de Parcerias entre corretores",
      "Estatísticas avançadas",
      "Domínio personalizado",
      "Selo Prime",
      "Push Notifications: 5 envios por dia",
      "Suporte premium dedicado",
    ],
  },
  prime_empresa: {
    name: "Black",
    price: 1199.99,
    setupFee: 0,
    maxItems: 9999,
    color: "from-zinc-800 to-zinc-950",
    borderColor: "border-zinc-500",
    badgeColor: "bg-gradient-to-r from-zinc-800 to-zinc-950 text-white",
    benefits: [
      "Anúncios ilimitados",
      "Vitrine Lvl 3 — pareada com Premium",
      "Todos os 7 Layouts + Temas",
      "URL personalizada /seu-nome",
      "Painel do vendedor completo",
      "Até 30 corretores vinculados",
      "Lojas espelho por corretor",
      "WhatsApp Team Picker",
      "CRM Kanban completo",
      "Stories (estilo Instagram)",
      "Analytics avançado por corretor",
      "Bot de Captação com IA Inteligente",
      "Página de Captação de imóveis",
      "Sistema de ADS integrado",
      "Vídeo banner hero (autoplay)",
      "Modo Cinema imersivo",
      "Efeitos visuais na loja",
      "Gestão de Aluguéis completa",
      "Instagram na loja",
      "SEO otimizado (cidade/bairro)",
      "Destaque Épico (até 5 imóveis)",
      "Galeria Showroom + Copywriting",
      "Hero Banner",
      "Todos os modelos de contrato",
      "Simulador de Financiamento",
      "PDF de Proposta profissional",
      "QR Code dos anúncios",
      "Calculadora de Lucro (ROI)",
      "Sistema de Parcerias entre corretores",
      "Estatísticas avançadas",
      "Domínio personalizado",
      "Gerente de conta VIP dedicado",
      "Selo Black ★ exclusivo",
      "Push Notifications: 6 envios por dia",
      "Suporte 24/7 prioritário",
    ],
  },
  fundador_corretor: {
    name: "Fundador",
    price: 97,
    setupFee: 0,
    maxItems: 150,
    color: "from-amber-500 to-orange-600",
    borderColor: "border-amber-400",
    badgeColor: "bg-gradient-to-r from-amber-500 to-orange-500 text-white",
    benefits: [
      "Pagamento único — válido por 12 meses",
      "Equivalente ao plano Prime",
      "750 créditos IA por mês (50% do Prime)",
      "Todos os benefícios do Prime incluídos",
      "Selo Fundador exclusivo",
      "Lote limitado por preço promocional",
    ],
  },
  fundador_empresa: {
    name: "Fundador Empresa",
    price: 97,
    setupFee: 0,
    maxItems: 5000,
    color: "from-amber-600 to-yellow-700",
    borderColor: "border-amber-500",
    badgeColor: "bg-gradient-to-r from-amber-600 to-yellow-700 text-white",
    benefits: [
      "Pagamento único — válido por 12 meses",
      "Equivalente ao plano Imob Elite",
      "3.000 créditos IA por mês (50% do Imob Elite)",
      "Todos os benefícios do Imob Elite incluídos",
      "Selo Fundador Empresa exclusivo",
      "Lote limitado por preço promocional",
    ],
  },
  fundador_construtora: {
    name: "Fundador Construtora",
    price: 397,
    setupFee: 0,
    maxItems: 10000,
    color: "from-orange-600 to-red-700",
    borderColor: "border-orange-500",
    badgeColor: "bg-gradient-to-r from-orange-600 to-red-700 text-white",
    benefits: [
      "Pagamento único — válido por 12 meses",
      "Equivalente ao plano Construtora Master",
      "5.000 créditos IA por mês (50% do Construtora Master)",
      "Todos os benefícios do Construtora Master incluídos",
      "Selo Fundador Construtora exclusivo",
      "Lote limitado por preço promocional",
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
  const config = PACKAGE_CONFIG[currentTier as keyof typeof PACKAGE_CONFIG] || PACKAGE_CONFIG.basico;

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
  const [tier, setTier] = useState<Subscription["tier"]>("basico");

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
