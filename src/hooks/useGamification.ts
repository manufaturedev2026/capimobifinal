import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface SellerReward {
  id: string;
  seller_id: string;
  user_id: string;
  reward_type: string;
  trigger_type: string;
  trigger_value: string | null;
  granted_at: string;
  expires_at: string;
  is_active: boolean;
  claimed: boolean;
  created_at: string;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  trigger_type: string;
  threshold: number;
  reward_type: string;
  reward_label: string;
  reward_duration_ms: number;
  current: number;
  completed: boolean;
  claimed: boolean;
  rewardId?: string;
}

const ACHIEVEMENTS_CONFIG = [
  {
    id: "listings_10",
    title: "10 Anúncios Ativos",
    description: "Tenha 10 anúncios ativos publicados",
    icon: "📦",
    trigger_type: "listings_milestone",
    threshold: 10,
    reward_type: "destaque_10min",
    reward_label: "Destaque grátis por 10 min",
    reward_duration_ms: 10 * 60 * 1000,
  },
  {
    id: "listings_25",
    title: "25 Anúncios Ativos",
    description: "Tenha 25 anúncios ativos publicados",
    icon: "🏆",
    trigger_type: "listings_milestone",
    threshold: 25,
    reward_type: "destaque_10min",
    reward_label: "Destaque grátis por 10 min",
    reward_duration_ms: 10 * 60 * 1000,
  },
  {
    id: "listings_50",
    title: "50 Anúncios Ativos",
    description: "Tenha 50 anúncios ativos publicados",
    icon: "💎",
    trigger_type: "listings_milestone",
    threshold: 50,
    reward_type: "destaque_10min",
    reward_label: "Destaque grátis por 10 min",
    reward_duration_ms: 10 * 60 * 1000,
  },
  {
    id: "views_100",
    title: "100 Visualizações",
    description: "Seus anúncios atingiram 100 visualizações",
    icon: "👀",
    trigger_type: "views_milestone",
    threshold: 100,
    reward_type: "destaque_10min",
    reward_label: "Destaque grátis por 10 min",
    reward_duration_ms: 10 * 60 * 1000,
  },
  {
    id: "views_350",
    title: "350 Visualizações",
    description: "Seus anúncios atingiram 350 visualizações",
    icon: "🔥",
    trigger_type: "views_milestone",
    threshold: 350,
    reward_type: "destaque_10min",
    reward_label: "Destaque grátis por 10 min",
    reward_duration_ms: 10 * 60 * 1000,
  },
  {
    id: "views_700",
    title: "700 Visualizações",
    description: "Seus anúncios atingiram 700 visualizações",
    icon: "⭐",
    trigger_type: "views_milestone",
    threshold: 700,
    reward_type: "destaque_10min",
    reward_label: "Destaque grátis por 10 min",
    reward_duration_ms: 10 * 60 * 1000,
  },
  {
    id: "views_1500",
    title: "1500 Visualizações",
    description: "Seus anúncios atingiram 1500 visualizações",
    icon: "💎",
    trigger_type: "views_milestone",
    threshold: 1500,
    reward_type: "destaque_10min",
    reward_label: "Destaque grátis por 10 min",
    reward_duration_ms: 10 * 60 * 1000,
  },
];

export function useGamification(userId?: string, sellerId?: string) {
  const [rewards, setRewards] = useState<SellerReward[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalViews: 0, totalListings: 0, profileComplete: false });

  const fetchRewards = useCallback(async () => {
    if (!sellerId) return;
    const { data } = await supabase
      .from("seller_rewards" as any)
      .select("*")
      .eq("seller_id", sellerId)
      .order("created_at", { ascending: false });
    if (data) setRewards(data as any[]);
  }, [sellerId]);

  const fetchStats = useCallback(async () => {
    if (!userId || !sellerId) return;

    // Count active listings
    const { data: items } = await supabase
      .from("seller_items")
      .select("id")
      .eq("seller_id", sellerId)
      .eq("status", "ativo");
    const totalListings = (items || []).length;

    // Count views from seller_analytics (the actual source of truth)
    const { count } = await supabase
      .from("seller_analytics")
      .select("id", { count: "exact", head: true })
      .eq("seller_id", sellerId)
      .eq("event_type", "view");
    const totalViews = count || 0;

    setStats({ totalViews, totalListings, profileComplete: false });
  }, [userId, sellerId]);

  const buildAchievements = useCallback(() => {
    const built: Achievement[] = ACHIEVEMENTS_CONFIG.map((cfg) => {
      let current = 0;
      if (cfg.trigger_type === "listings_milestone") current = stats.totalListings;
      else if (cfg.trigger_type === "views_milestone") current = stats.totalViews;

      const completed = current >= cfg.threshold;
      const existingReward = rewards.find(
        (r) => r.trigger_type === cfg.trigger_type && (r as any).trigger_value === String(cfg.threshold)
      );

      return {
        ...cfg,
        current: Math.min(current, cfg.threshold),
        completed,
        claimed: !!existingReward,
        rewardId: existingReward?.id,
      };
    });
    setAchievements(built);
  }, [stats, rewards]);

  useEffect(() => {
    if (!userId || !sellerId) { setLoading(false); return; }
    Promise.all([fetchRewards(), fetchStats()]).then(() => setLoading(false));
  }, [userId, sellerId, fetchRewards, fetchStats]);

  useEffect(() => {
    buildAchievements();
  }, [buildAchievements]);

  // Check if any reward is currently active (not expired)
  const hasAnyActiveReward = rewards.some(
    (r) => r.is_active && new Date(r.expires_at) > new Date()
  );

  const claimReward = async (achievement: Achievement) => {
    if (!userId || !sellerId || achievement.claimed || !achievement.completed) return false;

    // Block if another reward is still active
    if (hasAnyActiveReward) return "conflict";

    const cfg = ACHIEVEMENTS_CONFIG.find((c) => c.id === achievement.id);
    const durationMs = cfg?.reward_duration_ms ?? 10 * 60 * 1000;
    const expiresAt = new Date(Date.now() + durationMs).toISOString();

    const { error } = await supabase.from("seller_rewards" as any).insert({
      seller_id: sellerId,
      user_id: userId,
      reward_type: achievement.reward_type,
      trigger_type: achievement.trigger_type,
      trigger_value: String(achievement.threshold),
      expires_at: expiresAt,
      is_active: true,
      claimed: true,
    } as any);

    if (error) return false;

    await fetchRewards();
    await fetchStats();
    return true;
  };

  const hasActiveBlackTag = rewards.some(
    (r) => (r.reward_type === "black_tag_24h" || r.reward_type === "black_tag_1h") && r.is_active && new Date(r.expires_at) > new Date()
  );

  const hasActiveDestaque = rewards.some(
    (r) => (r.reward_type === "destaque_24h" || r.reward_type === "destaque_10min") && r.is_active && new Date(r.expires_at) > new Date()
  );

  const activeRewards = rewards.filter((r) => r.is_active && new Date(r.expires_at) > new Date());

  return {
    rewards,
    achievements,
    loading,
    stats,
    claimReward,
    hasActiveBlackTag,
    hasActiveDestaque,
    activeRewards,
    refetch: () => Promise.all([fetchRewards(), fetchStats()]),
  };
}

// Hook to check if a specific seller has active gamification rewards (for listing display)
export function useSellerActiveRewards(sellerId?: string) {
  const [hasBlackTag, setHasBlackTag] = useState(false);
  const [hasDestaque, setHasDestaque] = useState(false);

  useEffect(() => {
    if (!sellerId) return;
    supabase
      .from("seller_rewards" as any)
      .select("reward_type, expires_at, is_active")
      .eq("seller_id", sellerId)
      .eq("is_active", true)
      .then(({ data }) => {
        if (!data) return;
        const now = new Date();
        setHasBlackTag((data as any[]).some((r) => (r.reward_type === "black_tag_24h" || r.reward_type === "black_tag_1h") && new Date(r.expires_at) > now));
        setHasDestaque((data as any[]).some((r) => (r.reward_type === "destaque_24h" || r.reward_type === "destaque_10min") && new Date(r.expires_at) > now));
      });
  }, [sellerId]);

  return { hasBlackTag, hasDestaque };
}
