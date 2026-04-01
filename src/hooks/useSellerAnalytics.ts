import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

// Track an event (view or whatsapp_click) for a seller
export async function trackSellerEvent(sellerId: string, eventType: "view" | "whatsapp_click", itemId?: string, teamMemberId?: string) {
  await supabase.from("seller_analytics").insert({
    seller_id: sellerId,
    event_type: eventType,
    item_id: itemId || null,
    team_member_id: teamMemberId || null,
  } as any);
}

export interface DailyAnalytics {
  date: string;
  views: number;
  whatsapp_clicks: number;
}

export function useSellerAnalytics(sellerId?: string) {
  const [dailyData, setDailyData] = useState<DailyAnalytics[]>([]);
  const [totals, setTotals] = useState({ views: 0, whatsapp_clicks: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!sellerId) { setLoading(false); return; }
    fetchAnalytics(sellerId);

    // Realtime subscription
    const channel = supabase
      .channel(`seller-analytics-${sellerId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "seller_analytics",
          filter: `seller_id=eq.${sellerId}`,
        },
        () => {
          fetchAnalytics(sellerId);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sellerId]);

  const fetchAnalytics = async (sid: string) => {
    // Get last 30 days of events
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data } = await supabase
      .from("seller_analytics")
      .select("event_type, created_at")
      .eq("seller_id", sid)
      .gte("created_at", thirtyDaysAgo.toISOString())
      .order("created_at", { ascending: true });

    if (!data) { setLoading(false); return; }

    // Group by date
    const grouped: Record<string, { views: number; whatsapp_clicks: number }> = {};
    let totalViews = 0;
    let totalClicks = 0;

    // Pre-fill last 30 days
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split("T")[0];
      grouped[key] = { views: 0, whatsapp_clicks: 0 };
    }

    data.forEach((row: any) => {
      const date = new Date(row.created_at).toISOString().split("T")[0];
      if (!grouped[date]) grouped[date] = { views: 0, whatsapp_clicks: 0 };
      if (row.event_type === "view") {
        grouped[date].views++;
        totalViews++;
      } else {
        grouped[date].whatsapp_clicks++;
        totalClicks++;
      }
    });

    const daily = Object.entries(grouped)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, counts]) => ({
        date: new Date(date + "T12:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
        views: counts.views,
        whatsapp_clicks: counts.whatsapp_clicks,
      }));

    setDailyData(daily);
    setTotals({ views: totalViews, whatsapp_clicks: totalClicks });
    setLoading(false);
  };

  // Weekly aggregation
  const weeklyData = dailyData.reduce<DailyAnalytics[]>((acc, day, i) => {
    const weekIdx = Math.floor(i / 7);
    if (!acc[weekIdx]) acc[weekIdx] = { date: day.date, views: 0, whatsapp_clicks: 0 };
    acc[weekIdx].views += day.views;
    acc[weekIdx].whatsapp_clicks += day.whatsapp_clicks;
    // Update label to show week range
    if (i % 7 === 6 || i === dailyData.length - 1) {
      acc[weekIdx].date = `${acc[weekIdx].date}-${day.date}`;
    }
    return acc;
  }, []);

  return { dailyData, weeklyData, totals, loading, refetch: () => sellerId && fetchAnalytics(sellerId) };
}
