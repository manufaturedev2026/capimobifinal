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
  reward_duration: string;
  current: number;
  completed: boolean;
  claimed: boolean;
  rewardId?: string;
}

const ACHIEVEMENTS_CONFIG = [
  {
    id: "first_listing",
    title: "Primeiro Anúncio",
    description: "Publique seu primeiro anúncio",
    icon: "🏠",
    trigger_type: "first_listing",
    threshold: 1,
    reward_type: "destaque_24h",
    reward_label: "Destaque grátis por 24h",
    reward_duration: "24h",
  },
  {
    id: "profile_complete",
    title: "Perfil Completo",
    description: "Preencha todas as informações do perfil (nome, telefone, bio, logo, cidade)",
    icon: "✅",
    trigger_type: "profile_complete",
    threshold: 1,
    reward_type: "black_tag_24h",
    reward_label: "Tag Black por 24h",
    reward_duration: "24h",
  },
  {
    id: "views_50",
    title: "50 Visualizações",
    description: "Seus anúncios atingiram 50 visualizações",
    icon: "👀",
    trigger_type: "views_milestone",
    threshold: 50,
    reward_type: "destaque_24h",
    reward_label: "Destaque grátis por 24h",
    reward_duration: "24h",
  },
  {
    id: "views_200",
    title: "200 Visualizações",
    description: "Seus anúncios atingiram 200 visualizações",
    icon: "🔥",
    trigger_type: "views_milestone",
    threshold: 200,
    reward_type: "black_tag_24h",
    reward_label: "Tag Black por 24h",
    reward_duration: "24h",
  },
  {
    id: "views_500",
    title: "500 Visualizações",
    description: "Seus anúncios atingiram 500 visualizações",
    icon: "⭐",
    trigger_type: "views_milestone",
    threshold: 500,
    reward_type: "black_tag_24h",
    reward_label: "Tag Black por 24h",
    reward_duration: "24h",
  },
  {
    id: "listings_5",
    title: "5 Anúncios",
    description: "Publique 5 anúncios ativos",
    icon: "📦",
    trigger_type: "listings_milestone",
    threshold: 5,
    reward_type: "destaque_24h",
    reward_label: "Destaque grátis por 24h",
    reward_duration: "24h",
  },
  {
    id: "listings_10",
    title: "10 Anúncios",
    description: "Publique 10 anúncios ativos",
    icon: "🏆",
    trigger_type: "listings_milestone",
    threshold: 10,
    reward_type: "black_tag_24h",
    reward_label: "Tag Black por 24h",
    reward_duration: "24h",
  },
  {
    id: "views_1000",
    title: "1000 Visualizações",
    description: "Seus anúncios atingiram 1000 visualizações",
    icon: "💎",
    trigger_type: "views_milestone",
    threshold: 1000,
    reward_type: "black_tag_24h",
    reward_label: "Tag Black por 24h",
    reward_duration: "24h",
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

    // Total views
    const { data: items } = await supabase
      .from("seller_items")
      .select("views_count")
      .eq("seller_id", sellerId)
      .eq("status", "ativo");
    const totalViews = (items || []).reduce((sum, i) => sum + (i.views_count || 0), 0);
    const totalListings = (items || []).length;

    // Profile completeness
    const { data: prof } = await supabase
      .from("profiles")
      .select("full_name, phone, bio, logo_url, city")
      .eq("user_id", userId)
      .single();
    const profileComplete = !!(prof?.full_name && prof?.phone && prof?.bio && prof?.logo_url && prof?.city);

    setStats({ totalViews, totalListings, profileComplete });
  }, [userId, sellerId]);

  const buildAchievements = useCallback(() => {
    const built: Achievement[] = ACHIEVEMENTS_CONFIG.map((cfg) => {
      let current = 0;
      if (cfg.trigger_type === "views_milestone") current = stats.totalViews;
      else if (cfg.trigger_type === "listings_milestone") current = stats.totalListings;
      else if (cfg.trigger_type === "profile_complete") current = stats.profileComplete ? 1 : 0;
      else if (cfg.trigger_type === "first_listing") current = stats.totalListings >= 1 ? 1 : 0;

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

  const claimReward = async (achievement: Achievement) => {
    if (!userId || !sellerId || achievement.claimed || !achievement.completed) return false;

    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

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

  // Check if seller has active black_tag_24h reward
  const hasActiveBlackTag = rewards.some(
    (r) => r.reward_type === "black_tag_24h" && r.is_active && new Date(r.expires_at) > new Date()
  );

  const hasActiveDestaque = rewards.some(
    (r) => r.reward_type === "destaque_24h" && r.is_active && new Date(r.expires_at) > new Date()
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
        setHasBlackTag((data as any[]).some((r) => r.reward_type === "black_tag_24h" && new Date(r.expires_at) > now));
        setHasDestaque((data as any[]).some((r) => r.reward_type === "destaque_24h" && new Date(r.expires_at) > now));
      });
  }, [sellerId]);

  return { hasBlackTag, hasDestaque };
}
