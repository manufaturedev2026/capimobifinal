import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface ActivePlanSummary {
  id: string;
  tier: string;
  name: string | null;
  expires_at: string | null;
  started_at: string | null;
  billing_period: string | null;
  max_items: number;
  max_photos_per_listing: number;
  storage_mb: number;
  ai_credits_per_month: number;
  monthly_visits_limit: number;
  max_team_members: number;
}

export interface AggregateLimits {
  max_items: number;
  max_photos_per_listing: number;
  storage_mb: number;
  ai_credits_per_month: number;
  monthly_visits_limit: number;
  max_team_members: number;
}

export interface EffectivePlanData {
  count: number;
  effective_tier: string;
  subscriptions: ActivePlanSummary[];
  aggregate: AggregateLimits;
}

const EMPTY: EffectivePlanData = {
  count: 0,
  effective_tier: "basico",
  subscriptions: [],
  aggregate: {
    max_items: 0,
    max_photos_per_listing: 0,
    storage_mb: 0,
    ai_credits_per_month: 0,
    monthly_visits_limit: 0,
    max_team_members: 0,
  },
};

export function useActiveSubscriptions(userId?: string) {
  const [data, setData] = useState<EffectivePlanData>(EMPTY);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!userId) {
      setData(EMPTY);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data: rpc } = await supabase.rpc("get_effective_plan_limits" as any, {
      p_user_id: userId,
    });
    if (rpc && typeof rpc === "object") {
      setData(rpc as unknown as EffectivePlanData);
    } else {
      setData(EMPTY);
    }
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { ...data, loading, refetch: fetchData };
}