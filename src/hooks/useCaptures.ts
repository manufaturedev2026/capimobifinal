import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface Capture {
  id: string;
  item_id: string;
  broker_id: string;
  broker_user_id: string;
  status: "disponivel" | "em_negociacao" | "vendido";
  captured_at: string;
  notes: string | null;
  item?: any;
  broker?: any;
}

export function useMyCaptures(userId?: string) {
  const [captures, setCaptures] = useState<Capture[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCaptures = async () => {
    if (!userId) { setLoading(false); return; }

    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("user_id", userId)
      .single();

    if (!profile) { setLoading(false); return; }

    const { data } = await supabase
      .from("property_captures")
      .select("*")
      .eq("broker_id", profile.id)
      .order("captured_at", { ascending: false });

    if (data) {
      // Fetch related items
      const itemIds = data.map((c: any) => c.item_id);
      const { data: items } = await supabase
        .from("seller_items")
        .select("*, profiles!seller_items_seller_id_fkey(full_name, phone, company_name, logo_url)")
        .in("id", itemIds);

      const itemMap = new Map((items || []).map((i: any) => [i.id, i]));

      setCaptures(
        data.map((c: any) => ({
          ...c,
          item: itemMap.get(c.item_id),
        }))
      );
    }
    setLoading(false);
  };

  useEffect(() => { fetchCaptures(); }, [userId]);

  return { captures, loading, refetch: fetchCaptures };
}

export function useCaptureCount(userId?: string) {
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) { setLoading(false); return; }

    const fetchCount = async () => {
      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", userId)
        .single();

      if (!profile) { setLoading(false); return; }

      // Count captures this month
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { count: captureCount } = await supabase
        .from("property_captures")
        .select("*", { count: "exact", head: true })
        .eq("broker_id", profile.id)
        .gte("captured_at", startOfMonth.toISOString());

      setCount(captureCount || 0);
      setLoading(false);
    };

    fetchCount();
  }, [userId]);

  return { count, loading };
}

// Capture limits per plan tier
export const CAPTURE_LIMITS: Record<string, number> = {
  basico: 1,
  start: 20,
  premium: 50,
  vip: 100,
  essencial_empresa: 9999,
  premium_empresa: 9999,
  prime_empresa: 9999,
};
