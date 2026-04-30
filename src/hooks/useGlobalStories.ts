import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface GlobalStory {
  id: string;
  seller_id: string;
  user_id: string;
  image_url: string;
  created_at: string;
  expires_at: string;
  title?: string | null;
  description?: string | null;
  button_text?: string | null;
  button_url?: string | null;
  item_id?: string | null;
  sellerName: string;
  sellerLogo: string | null;
  itemCity?: string | null;
}

export function useGlobalStories(city?: string) {
  const [stories, setStories] = useState<GlobalStory[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchStories = useCallback(async () => {
    setLoading(true);
    // Fetch all active, non-expired stories from all sellers (manual + auto)
    const { data: rawStories } = await supabase
      .from("seller_stories")
      .select("*")
      .eq("is_active", true)
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(50);

    if (!rawStories || rawStories.length === 0) {
      setStories([]);
      setLoading(false);
      return;
    }

    // Fetch item cities for filtering
    const itemIds = rawStories.map((s) => s.item_id).filter(Boolean) as string[];
    let itemCityMap: Record<string, string> = {};
    if (itemIds.length > 0) {
      const { data: items } = await supabase
        .from("seller_items")
        .select("id, city")
        .in("id", itemIds);
      (items || []).forEach((i) => {
        if (i.city) itemCityMap[i.id] = i.city.trim();
      });
    }

    const sellerIds = [...new Set(rawStories.map((s) => s.seller_id))];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name, company_name, logo_url")
      .in("id", sellerIds);

    const profileMap: Record<string, any> = {};
    (profiles || []).forEach((p) => { profileMap[p.id] = p; });

    let result: GlobalStory[] = rawStories.map((s) => {
      const profile = profileMap[s.seller_id];
      return {
        id: s.id,
        seller_id: s.seller_id,
        user_id: s.user_id,
        image_url: s.image_url,
        created_at: s.created_at,
        expires_at: s.expires_at,
        title: s.title,
        description: s.description,
        button_text: s.button_text,
        button_url: s.button_url,
        item_id: s.item_id,
        sellerName: profile?.company_name || profile?.full_name || "Corretor",
        sellerLogo: profile?.logo_url,
        itemCity: s.item_id ? itemCityMap[s.item_id] || null : null,
      };
    });

    // Filter by city if provided.
    // Stories with a linked item: must match the item's city.
    // Stories without a linked item: fall back to the seller's city.
    if (city) {
      const normalizedCity = city.trim().toLowerCase();
      const sellerCityMap: Record<string, string> = {};
      (profiles || []).forEach((p: any) => {
        if (p.city) sellerCityMap[p.id] = String(p.city).trim().toLowerCase();
      });
      result = result.filter((s) => {
        if (s.itemCity) return s.itemCity.toLowerCase() === normalizedCity;
        return sellerCityMap[s.seller_id] === normalizedCity;
      });
    }

    setStories(result);
    setLoading(false);
  }, [city]);

  useEffect(() => {
    fetchStories();
  }, [fetchStories]);

  return { stories, loading };
}
