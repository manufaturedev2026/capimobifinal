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
  team_member_id?: string | null;
  team_member_name?: string | null;
  team_member_photo?: string | null;
}

export interface SellerWithStories {
  sellerId: string;
  sellerName: string;
  sellerLogo: string | null;
  stories: Story[];
}

export function useStories(filterSellerId?: string) {
  const [sellerStories, setSellerStories] = useState<SellerWithStories[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchStories = useCallback(async () => {
    if (!filterSellerId) {
      setSellerStories([]);
      setLoading(false);
      return;
    }

    const { data: stories } = await supabase
      .from("seller_stories")
      .select("*")
      .eq("seller_id", filterSellerId)
      .gt("expires_at", new Date().toISOString())
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (!stories || stories.length === 0) {
      setSellerStories([]);
      setLoading(false);
      return;
    }

    // Get seller profiles
    const sellerIds = [...new Set(stories.map((s: any) => s.seller_id))];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name, company_name, logo_url")
      .in("id", sellerIds);

    const profileMap: Record<string, any> = {};
    (profiles || []).forEach((p: any) => { profileMap[p.id] = p; });

    // Get team member info for stories that have team_member_id
    const teamMemberIds = stories
      .map((s: any) => s.team_member_id)
      .filter(Boolean) as string[];
    
    const teamMemberMap: Record<string, any> = {};
    if (teamMemberIds.length > 0) {
      const { data: members } = await supabase
        .from("team_members")
        .select("id, full_name, photo_url")
        .in("id", teamMemberIds);
      (members || []).forEach((m: any) => { teamMemberMap[m.id] = m; });
    }

    // Each story is its own bubble (not grouped)
    const result: SellerWithStories[] = stories.map((s: any) => {
      const member = s.team_member_id ? teamMemberMap[s.team_member_id] : null;
      const profile = profileMap[s.seller_id];
      const name = member ? member.full_name : (profile?.company_name || profile?.full_name || "Vendedor");

      return {
        sellerId: s.seller_id,
        sellerName: name,
        sellerLogo: member ? member.photo_url : profile?.logo_url,
        stories: [{
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
          team_member_id: s.team_member_id,
          team_member_name: member?.full_name,
          team_member_photo: member?.photo_url,
        }],
      };
    });

    setSellerStories(result);
    setLoading(false);
  }, [filterSellerId]);

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
