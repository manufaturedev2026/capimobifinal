import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface Plan {
  id: string;
  tier: string;
  name: string;
  price: number;
  setup_fee: number;
  max_items: number;
  max_photos_per_listing: number;
  storage_mb: number;
  ai_credits_per_month: number;
  ai_generations_per_day: number;
  max_team_members: number;
  color: string;
  border_color: string;
  badge_color: string;
  benefits: string[];
  category: "individual" | "enterprise" | "free" | "corretor" | "imobiliaria" | "construtora";
  is_active: boolean;
  is_popular: boolean;
  sort_order: number;
}

function normalize(row: any): Plan {
  return {
    id: row.id,
    tier: row.tier,
    name: row.name,
    price: Number(row.price) || 0,
    setup_fee: Number(row.setup_fee) || 0,
    max_items: row.max_items ?? 5,
    max_photos_per_listing: row.max_photos_per_listing ?? 10,
    storage_mb: row.storage_mb ?? 50,
    ai_credits_per_month: row.ai_credits_per_month ?? 25,
    ai_generations_per_day: row.ai_generations_per_day ?? 0,
    max_team_members: row.max_team_members ?? 0,
    color: row.color || "from-slate-500 to-slate-600",
    border_color: row.border_color || "border-slate-400",
    badge_color: row.badge_color || "bg-slate-500 text-white",
    benefits: Array.isArray(row.benefits) ? row.benefits : [],
    category: row.category || "individual",
    is_active: !!row.is_active,
    is_popular: !!row.is_popular,
    sort_order: row.sort_order ?? 0,
  };
}

/** Fetches all plans (admin scope, includes inactive). */
export function useAllPlans() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    setLoading(true);
    const { data } = await (supabase as any)
      .from("subscription_plans")
      .select("*")
      .order("sort_order", { ascending: true });
    setPlans(((data as any[]) || []).map(normalize));
    setLoading(false);
  }, []);

  useEffect(() => { refetch(); }, [refetch]);

  return { plans, loading, refetch };
}

/** Fetches only active plans (public scope). */
export function useActivePlans() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await (supabase as any)
        .from("subscription_plans")
        .select("*")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });
      setPlans(((data as any[]) || []).map(normalize));
      setLoading(false);
    })();
  }, []);

  return { plans, loading };
}
