import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface Story {
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
}

export interface SellerWithStories {
  sellerId: string;
  sellerName: string;
  sellerLogo: string | null;
  stories: Story[];
}

const STORY_LIMITS: Record<string, number> = {
  basico: 1,
  start: 2,
  premium: 3,
  vip: 4,
  essencial_empresa: 5,
  premium_empresa: 6,
  prime_empresa: 10,
};

export function getStoryLimit(tier: string): number {
  return STORY_LIMITS[tier] ?? 1;
}

export function useStories() {
  const [sellerStories, setSellerStories] = useState<SellerWithStories[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchStories = useCallback(async () => {
    const { data: stories } = await supabase
      .from("seller_stories")
      .select("*")
      .gt("expires_at", new Date().toISOString())
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (!stories || stories.length === 0) {
      setSellerStories([]);
      setLoading(false);
      return;
    }

    const sellerIds = [...new Set(stories.map((s: any) => s.seller_id))];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name, company_name, logo_url")
      .in("id", sellerIds);

    const profileMap: Record<string, any> = {};
    (profiles || []).forEach((p: any) => {
      profileMap[p.id] = p;
    });

    const grouped: Record<string, SellerWithStories> = {};
    stories.forEach((s: any) => {
      if (!grouped[s.seller_id]) {
        const profile = profileMap[s.seller_id];
        grouped[s.seller_id] = {
          sellerId: s.seller_id,
          sellerName: profile?.company_name || profile?.full_name || "Vendedor",
          sellerLogo: profile?.logo_url,
          stories: [],
        };
      }
      grouped[s.seller_id].stories.push({
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
      });
    });

    setSellerStories(Object.values(grouped));
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchStories();
  }, [fetchStories]);

  return { sellerStories, loading, refetch: fetchStories };
}

export function useMyStoryCount(userId?: string) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!userId) return;
    supabase
      .from("seller_stories")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("is_active", true)
      .gt("expires_at", new Date().toISOString())
      .then(({ count: c }) => {
        setCount(c ?? 0);
      });
  }, [userId]);

  return count;
}
