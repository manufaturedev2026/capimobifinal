import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Eye, MessageCircle, Users, TrendingUp, Home, ChevronDown, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

type BrokerStat = {
  id: string;
  full_name: string;
  photo_url: string | null;
  phone: string | null;
  views: number;
  whatsapp_clicks: number;
  top_items: { id: string; title: string; views: number; clicks: number }[];
};

type Props = {
  sellerId: string;
  teamMembers: { id: string; full_name: string; photo_url: string | null; phone: string | null; is_active: boolean }[];
};

export default function BrokerAnalytics({ sellerId, teamMembers }: Props) {
  const [brokerStats, setBrokerStats] = useState<BrokerStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedBroker, setExpandedBroker] = useState<string | null>(null);
  const [sellerItems, setSellerItems] = useState<{ id: string; title: string }[]>([]);

  useEffect(() => {
    fetchData();
  }, [sellerId, teamMembers]);

  const fetchData = async () => {
    setLoading(true);

    // Fetch analytics for this seller with team_member_id
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [analyticsRes, itemsRes] = await Promise.all([
      supabase
        .from("seller_analytics")
        .select("event_type, team_member_id, item_id")
        .eq("seller_id", sellerId)
        .gte("created_at", thirtyDaysAgo.toISOString()),
      supabase
        .from("seller_items")
        .select("id, title")
        .eq("seller_id", sellerId),
    ]);

    const analytics = (analyticsRes.data || []) as any[];
    const items = (itemsRes.data || []) as { id: string; title: string }[];
    setSellerItems(items);

    const itemMap = new Map(items.map((i) => [i.id, i.title]));

    // Aggregate per broker
    const stats: BrokerStat[] = teamMembers.map((m) => {
      const memberEvents = analytics.filter((a: any) => a.team_member_id === m.id);
      const views = memberEvents.filter((a: any) => a.event_type === "view").length;
      const clicks = memberEvents.filter((a: any) => a.event_type === "whatsapp_click").length;

      // Top items for this broker
      const itemCounts: Record<string, { views: number; clicks: number }> = {};
      memberEvents.forEach((a: any) => {
        if (!a.item_id) return;
        if (!itemCounts[a.item_id]) itemCounts[a.item_id] = { views: 0, clicks: 0 };
        if (a.event_type === "view") itemCounts[a.item_id].views++;
        else itemCounts[a.item_id].clicks++;
      });

      const topItems = Object.entries(itemCounts)
        .map(([id, c]) => ({ id, title: itemMap.get(id) || "Imóvel removido", views: c.views, clicks: c.clicks }))
        .sort((a, b) => (b.views + b.clicks) - (a.views + a.clicks))
        .slice(0, 5);

      return {
        id: m.id,
        full_name: m.full_name,
        photo_url: m.photo_url,
        phone: m.phone,
        views,
        whatsapp_clicks: clicks,
        top_items: topItems,
      };
    });

    // Sort by total interactions desc
    stats.sort((a, b) => (b.views + b.whatsapp_clicks) - (a.views + a.whatsapp_clicks));
    setBrokerStats(stats);
    setLoading(false);
  };

  // Also compute most viewed items overall
  const [topItems, setTopItems] = useState<{ title: string; views: number; clicks: number }[]>([]);

  useEffect(() => {
    if (!brokerStats.length) return;
    // Aggregate items across all brokers
    const itemAgg: Record<string, { title: string; views: number; clicks: number }> = {};
    brokerStats.forEach((b) => {
      b.top_items.forEach((item) => {
        if (!itemAgg[item.id]) itemAgg[item.id] = { title: item.title, views: 0, clicks: 0 };
        itemAgg[item.id].views += item.views;
        itemAgg[item.id].clicks += item.clicks;
      });
    });
    setTopItems(
      Object.values(itemAgg)
        .sort((a, b) => (b.views + b.clicks) - (a.views + a.clicks))
        .slice(0, 5)
    );
  }, [brokerStats]);

  const chartData = brokerStats.map((b) => ({
    name: b.full_name.split(" ")[0],
    visitas: b.views,
    whatsapp: b.whatsapp_clicks,
  }));

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!teamMembers.length) return null;

  const totalViews = brokerStats.reduce((s, b) => s + b.views, 0);
  const totalClicks = brokerStats.reduce((s, b) => s + b.whatsapp_clicks, 0);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-card border border-border rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
            <Users size={18} className="text-primary" />
          </div>
          <div>
            <h3 className="font-display font-bold text-foreground">Desempenho dos Corretores</h3>
            <p className="text-xs text-muted-foreground">Últimos 30 dias • {teamMembers.length} corretores</p>
          </div>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-5">
          <div className="stat-card-premium">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                <Eye size={14} className="text-primary" />
              </div>
              <span className="text-xs text-muted-foreground">Visitas (corretores)</span>
            </div>
            <span className="font-display font-extrabold text-xl text-foreground">{totalViews}</span>
          </div>
          <div className="stat-card-premium">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-7 h-7 rounded-lg bg-green-500/10 flex items-center justify-center">
                <MessageCircle size={14} className="text-green-500" />
              </div>
              <span className="text-xs text-muted-foreground">WhatsApp (corretores)</span>
            </div>
            <span className="font-display font-extrabold text-xl text-foreground">{totalClicks}</span>
          </div>
          <div className="stat-card-premium col-span-2 sm:col-span-1">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-7 h-7 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <TrendingUp size={14} className="text-amber-500" />
              </div>
              <span className="text-xs text-muted-foreground">Conversão</span>
            </div>
            <span className="font-display font-extrabold text-xl text-foreground">
              {totalViews > 0 ? ((totalClicks / totalViews) * 100).toFixed(1) : "0"}%
            </span>
          </div>
        </div>

        {/* Chart */}
        {chartData.length > 0 && (
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">Comparativo por Corretor</p>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "12px",
                    fontSize: "12px",
                  }}
                />
                <Bar dataKey="visitas" name="Visitas" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="whatsapp" name="WhatsApp" fill="hsl(142 71% 45%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Broker cards */}
      <div className="space-y-3">
        {brokerStats.map((broker, idx) => (
          <motion.div
            key={broker.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="bg-card border border-border rounded-2xl overflow-hidden"
          >
            <button
              onClick={() => setExpandedBroker(expandedBroker === broker.id ? null : broker.id)}
              className="w-full p-4 flex items-center gap-3 hover:bg-secondary/30 transition-colors"
            >
              <div className="w-11 h-11 rounded-xl bg-secondary flex items-center justify-center overflow-hidden flex-shrink-0">
                {broker.photo_url ? (
                  <img loading="lazy" decoding="async" src={broker.photo_url} alt={broker.full_name} className="w-full h-full object-cover" />
                ) : (
                  <span className="font-bold text-sm text-muted-foreground">{broker.full_name.charAt(0)}</span>
                )}
              </div>
              <div className="flex-1 min-w-0 text-left">
                <h4 className="font-display font-bold text-sm text-foreground truncate">
                  {idx === 0 && brokerStats.length > 1 && (broker.views + broker.whatsapp_clicks) > 0 && (
                    <span className="text-amber-500 mr-1">🏆</span>
                  )}
                  {broker.full_name}
                </h4>
                <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                  <span className="flex items-center gap-1">
                    <Eye size={12} className="text-primary" /> {broker.views}
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageCircle size={12} className="text-green-500" /> {broker.whatsapp_clicks}
                  </span>
                  <span className="text-[10px]">
                    {broker.views > 0 ? ((broker.whatsapp_clicks / broker.views) * 100).toFixed(0) : "0"}% conv.
                  </span>
                </div>
              </div>
              {expandedBroker === broker.id ? (
                <ChevronUp size={16} className="text-muted-foreground" />
              ) : (
                <ChevronDown size={16} className="text-muted-foreground" />
              )}
            </button>

            <AnimatePresence>
              {expandedBroker === broker.id && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="px-4 pb-4 border-t border-border pt-3">
                    {broker.top_items.length > 0 ? (
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1.5">
                          <Home size={12} /> Imóveis mais acessados
                        </p>
                        <div className="space-y-2">
                          {broker.top_items.map((item) => (
                            <div key={item.id} className="flex items-center justify-between bg-secondary/50 rounded-xl px-3 py-2">
                              <span className="text-xs text-foreground font-medium truncate flex-1 mr-3">{item.title}</span>
                              <div className="flex items-center gap-3 text-[11px] text-muted-foreground flex-shrink-0">
                                <span className="flex items-center gap-1">
                                  <Eye size={10} className="text-primary" /> {item.views}
                                </span>
                                <span className="flex items-center gap-1">
                                  <MessageCircle size={10} className="text-green-500" /> {item.clicks}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground text-center py-3">
                        Nenhuma interação registrada nos últimos 30 dias
                      </p>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>

      {/* Top Items Overall */}
      {topItems.length > 0 && (
        <div className="bg-card border border-border rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <Home size={16} className="text-amber-500" />
            </div>
            <h3 className="font-display font-bold text-foreground text-sm">Imóveis Mais Acessados (via corretores)</h3>
          </div>
          <div className="space-y-2">
            {topItems.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between bg-secondary/50 rounded-xl px-3 py-2.5">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span className="w-5 h-5 rounded-md bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                    {idx + 1}
                  </span>
                  <span className="text-xs text-foreground font-medium truncate">{item.title}</span>
                </div>
                <div className="flex items-center gap-3 text-[11px] text-muted-foreground flex-shrink-0 ml-2">
                  <span className="flex items-center gap-1">
                    <Eye size={10} className="text-primary" /> {item.views}
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageCircle size={10} className="text-green-500" /> {item.clicks}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
