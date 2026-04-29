import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface PlanUsage {
  tier: string;
  plan_name: string;
  usage: {
    active_items: number;
    total_photos: number;
    storage_mb: number;
    ai_credits_balance: number;
    monthly_visits: number;
  };
  limits: {
    max_items: number;
    max_photos_per_listing: number;
    storage_mb: number;
    ai_credits_per_month: number;
    monthly_visits_limit: number;
  };
}

export function usePlanUsage(userId?: string) {
  const [usage, setUsage] = useState<PlanUsage | null>(null);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await (supabase as any).rpc("get_user_plan_usage", { p_user_id: userId });
    if (data) setUsage(data as PlanUsage);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { usage, loading, refetch };
}

export function getUsagePercent(used: number, limit: number): number {
  if (!limit || limit >= 9999) return 0;
  return Math.min(100, Math.round((used / limit) * 100));
}

export function getUsageColor(percent: number): string {
  if (percent >= 95) return "bg-red-500";
  if (percent >= 80) return "bg-amber-500";
  return "bg-emerald-500";
}