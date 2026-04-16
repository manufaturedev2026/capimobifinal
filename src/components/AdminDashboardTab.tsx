import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import {
  Users, Eye, MessageCircle, UserPlus, TrendingUp, BarChart3,
  ArrowUpRight, ArrowDownRight, Calendar, Filter
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend, Area, AreaChart
} from "recharts";

interface FunnelEvent {
  event_type: string;
  session_id: string;
  created_at: string;
}

interface ProfileRow {
  created_at: string;
  seller_category: string | null;
}

interface SubRow {
  tier: string;
  is_active: boolean;
}

const EVENT_LABELS: Record<string, string> = {
  page_view: "Visitou a Página",
  chat_started: "Iniciou o Chat",
  message_sent: "Enviou Mensagem",
  cta_shown: "Viu o CTA",
  crm_submitted: "Enviou Dados (CRM)",
  signup_clicked: "Clicou em Cadastrar",
};

const CHART_COLORS = ["#00AEEF", "#D4708F", "#10b981", "#f59e0b", "#8b5cf6", "#ef4444"];

export default function AdminDashboardTab() {
  const [events, setEvents] = useState<FunnelEvent[]>([]);
  const [profiles, setProfiles] = useState<ProfileRow[]>([]);
  const [subs, setSubs] = useState<SubRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<"7d" | "30d" | "90d" | "all">("30d");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [evRes, profRes, subRes] = await Promise.all([
      supabase.from("invite_funnel_events").select("event_type, session_id, created_at").order("created_at", { ascending: false }).limit(5000),
      supabase.from("profiles").select("created_at, seller_category").order("created_at", { ascending: false }),
      supabase.from("seller_subscriptions").select("tier, is_active"),
    ]);
    setEvents((evRes.data as FunnelEvent[]) || []);
    setProfiles((profRes.data as ProfileRow[]) || []);
    setSubs((subRes.data as SubRow[]) || []);
    setLoading(false);
  };

  const filteredEvents = useMemo(() => {
    if (period === "all") return events;
    const days = period === "7d" ? 7 : period === "30d" ? 30 : 90;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    return events.filter(e => new Date(e.created_at) >= cutoff);
  }, [events, period]);

  const filteredProfiles = useMemo(() => {
    if (period === "all") return profiles;
    const days = period === "7d" ? 7 : period === "30d" ? 30 : 90;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    return profiles.filter(p => new Date(p.created_at) >= cutoff);
  }, [profiles, period]);

  // Funnel counts
  const funnelData = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredEvents.forEach(e => {
      counts[e.event_type] = (counts[e.event_type] || 0) + 1;
    });
    const order = ["page_view", "chat_started", "message_sent", "cta_shown", "crm_submitted", "signup_clicked"];
    return order.map(key => ({
      name: EVENT_LABELS[key] || key,
      value: counts[key] || 0,
      key,
    }));
  }, [filteredEvents]);

  // Unique sessions
  const uniqueSessions = useMemo(() => {
    return new Set(filteredEvents.map(e => e.session_id)).size;
  }, [filteredEvents]);

  // Conversion rate
  const conversionRate = useMemo(() => {
    const views = funnelData.find(f => f.key === "page_view")?.value || 0;
    const signups = funnelData.find(f => f.key === "signup_clicked")?.value || 0;
    if (views === 0) return 0;
    return Math.round((signups / views) * 100);
  }, [funnelData]);

  // Daily chart data
  const dailyData = useMemo(() => {
    const days = period === "7d" ? 7 : period === "30d" ? 30 : period === "90d" ? 90 : 60;
    const result: { date: string; visitas: number; cadastros: number; leads: number }[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      const label = `${d.getDate()}/${d.getMonth() + 1}`;
      const visitas = filteredEvents.filter(e => e.event_type === "page_view" && e.created_at.startsWith(dateStr)).length;
      const cadastros = filteredProfiles.filter(p => p.created_at.startsWith(dateStr)).length;
      const leads = filteredEvents.filter(e => e.event_type === "crm_submitted" && e.created_at.startsWith(dateStr)).length;
      result.push({ date: label, visitas, cadastros, leads });
    }
    return result;
  }, [filteredEvents, filteredProfiles, period]);

  // Tier distribution
  const tierData = useMemo(() => {
    const counts: Record<string, number> = {};
    subs.forEach(s => {
      if (s.is_active) counts[s.tier] = (counts[s.tier] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), value }));
  }, [subs]);

  // Category distribution
  const categoryData = useMemo(() => {
    const counts: Record<string, number> = {};
    profiles.forEach(p => {
      const cat = p.seller_category || "Sem categoria";
      counts[cat] = (counts[cat] || 0) + 1;
    });
    const labels: Record<string, string> = {
      corretor: "Corretor(a)",
      imobiliaria: "Imobiliária",
      construtora: "Construtora",
      "Sem categoria": "Sem categoria",
    };
    return Object.entries(counts).map(([name, value]) => ({ name: labels[name] || name, value }));
  }, [profiles]);

  const statCards = [
    { label: "Total de Membros", value: profiles.length, icon: Users, color: "#00AEEF" },
    { label: "Visitas ao Convite", value: funnelData.find(f => f.key === "page_view")?.value || 0, icon: Eye, color: "#8b5cf6" },
    { label: "Leads CRM", value: funnelData.find(f => f.key === "crm_submitted")?.value || 0, icon: MessageCircle, color: "#10b981" },
    { label: "Sessões Únicas", value: uniqueSessions, icon: BarChart3, color: "#f59e0b" },
    { label: "Novos Cadastros (período)", value: filteredProfiles.length, icon: UserPlus, color: "#D4708F" },
    { label: "Taxa de Conversão", value: `${conversionRate}%`, icon: TrendingUp, color: "#ef4444" },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Period Filter */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter size={16} className="text-muted-foreground" />
        {(["7d", "30d", "90d", "all"] as const).map(p => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              period === p
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-muted-foreground hover:text-foreground"
            }`}
          >
            {p === "7d" ? "7 dias" : p === "30d" ? "30 dias" : p === "90d" ? "90 dias" : "Tudo"}
          </button>
        ))}
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {statCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="stat-card-premium"
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${card.color}20` }}>
                  <Icon size={16} style={{ color: card.color }} />
                </div>
              </div>
              <p className="text-2xl font-bold text-foreground">{card.value}</p>
              <p className="text-[10px] text-muted-foreground font-medium mt-1">{card.label}</p>
            </motion.div>
          );
        })}
      </div>

      {/* Funnel Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-2xl border border-border bg-card p-5"
        >
          <h3 className="font-display font-bold text-sm text-foreground mb-4">📊 Funil de Convite</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={funnelData} layout="vertical" margin={{ left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis type="number" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
              <YAxis
                dataKey="name"
                type="category"
                width={130}
                tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
              />
              <Tooltip
                cursor={{ fill: "hsl(var(--muted) / 0.3)" }}
                contentStyle={{
                  background: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: 12,
                  fontSize: 12,
                  color: "hsl(var(--foreground))",
                }}
                labelStyle={{ color: "hsl(var(--foreground))", fontWeight: 600 }}
                itemStyle={{ color: "hsl(var(--foreground))" }}
              />
              <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                {funnelData.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Daily Trends */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-2xl border border-border bg-card p-5"
        >
          <h3 className="font-display font-bold text-sm text-foreground mb-4">📈 Tendência Diária</h3>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={dailyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
              <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
              <Tooltip
                cursor={{ stroke: "hsl(var(--muted-foreground))", strokeOpacity: 0.3 }}
                contentStyle={{
                  background: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: 12,
                  fontSize: 12,
                  color: "hsl(var(--foreground))",
                }}
                labelStyle={{ color: "hsl(var(--foreground))", fontWeight: 600 }}
                itemStyle={{ color: "hsl(var(--foreground))" }}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Area type="monotone" dataKey="visitas" name="Visitas" stroke="#00AEEF" fill="#00AEEF" fillOpacity={0.15} strokeWidth={2} />
              <Area type="monotone" dataKey="cadastros" name="Cadastros" stroke="#10b981" fill="#10b981" fillOpacity={0.15} strokeWidth={2} />
              <Area type="monotone" dataKey="leads" name="Leads" stroke="#D4708F" fill="#D4708F" fillOpacity={0.15} strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Pie Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="rounded-2xl border border-border bg-card p-5"
        >
          <h3 className="font-display font-bold text-sm text-foreground mb-4">🏷️ Distribuição por Plano</h3>
          {tierData.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={tierData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={90}
                  paddingAngle={3}
                  dataKey="value"
                  label={({ name, value }) => `${name} (${value})`}
                >
                  {tierData.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-muted-foreground text-sm text-center py-10">Sem dados</p>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="rounded-2xl border border-border bg-card p-5"
        >
          <h3 className="font-display font-bold text-sm text-foreground mb-4">👤 Distribuição por Categoria</h3>
          {categoryData.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={90}
                  paddingAngle={3}
                  dataKey="value"
                  label={({ name, value }) => `${name} (${value})`}
                >
                  {categoryData.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[(i + 2) % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-muted-foreground text-sm text-center py-10">Sem dados</p>
          )}
        </motion.div>
      </div>

      {/* Funnel step-by-step conversion */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="rounded-2xl border border-border bg-card p-5"
      >
        <h3 className="font-display font-bold text-sm text-foreground mb-4">🔄 Conversão Etapa a Etapa</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {funnelData.map((step, i) => {
            const prev = i > 0 ? funnelData[i - 1].value : step.value;
            const rate = prev > 0 ? Math.round((step.value / prev) * 100) : 0;
            const isUp = rate >= 50;
            return (
              <div key={step.key} className="text-center p-3 rounded-xl bg-secondary/50">
                <p className="text-lg font-bold text-foreground">{step.value}</p>
                <p className="text-[10px] text-muted-foreground font-medium mb-1">{step.name}</p>
                {i > 0 && (
                  <div className={`flex items-center justify-center gap-1 text-xs font-bold ${isUp ? "text-emerald-500" : "text-red-400"}`}>
                    {isUp ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                    {rate}%
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}
