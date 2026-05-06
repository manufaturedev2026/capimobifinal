import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type AiCreditTransaction = {
  id: string;
  tool_key: string;
  amount: number;
  transaction_type: string;
  status: string;
  notes: string | null;
  created_at: string;
};

type AiCreditsState = {
  balance: number;
  monthlyPlanCredits: number;
  tier: string;
  loading: boolean;
  transactions: AiCreditTransaction[];
};

export function useAiCredits(userId?: string, sellerId?: string) {
  const [state, setState] = useState<AiCreditsState>({
    balance: 0,
    monthlyPlanCredits: 0,
    tier: "basico",
    loading: true,
    transactions: [],
  });

  const refresh = useCallback(async () => {
    if (!userId) return;
    setState((prev) => ({ ...prev, loading: true }));

    const { data, error } = await (supabase as any).rpc("refresh_ai_monthly_credits", {
      p_user_id: userId,
      p_seller_id: sellerId || null,
    });

    // Soma os créditos mensais de TODOS os planos ativos (acumulado)
    const { data: effective } = await (supabase as any).rpc("get_effective_plan_limits", {
      p_user_id: userId,
    });
    const aggregatedMonthly = Number(effective?.aggregate?.ai_credits_per_month ?? 0);

    const { data: transactions } = await (supabase as any)
      .from("ai_credit_transactions")
      .select("id, tool_key, amount, transaction_type, status, notes, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(6);

    if (!error && data) {
      setState({
        balance: Number(data.balance ?? 0),
        monthlyPlanCredits: aggregatedMonthly || Number(data.monthly_plan_credits ?? 0),
        tier: String(data.tier ?? "basico"),
        loading: false,
        transactions: (transactions || []) as AiCreditTransaction[],
      });
      return;
    }

    setState((prev) => ({ ...prev, loading: false }));
  }, [sellerId, userId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { ...state, refresh, creditPriceCents: 25 };
}
