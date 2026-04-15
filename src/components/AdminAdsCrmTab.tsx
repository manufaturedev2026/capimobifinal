import { useState, useEffect } from "react";
import { Megaphone, Search, Check, X, Clock, MessageCircle, Phone, Eye, ChevronDown, Loader2, Filter, RefreshCw, ExternalLink, DollarSign } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AdRequest {
  id: string;
  user_id: string;
  seller_id: string;
  platform: string;
  daily_budget: number;
  duration_days: number;
  subtotal: number;
  service_fee: number;
  tax_amount: number;
  total: number;
  details: string | null;
  status: string;
  created_at: string;
  sellerName?: string;
  sellerPhone?: string;
  sellerEmail?: string;
}

const STAGES = [
  { key: "pendente", label: "Pendente", color: "bg-amber-500", textColor: "text-amber-400" },
  { key: "em_analise", label: "Em Análise", color: "bg-blue-500", textColor: "text-blue-400" },
  { key: "aprovado", label: "Aprovado", color: "bg-emerald-500", textColor: "text-emerald-400" },
  { key: "ativo", label: "Ativo", color: "bg-green-500", textColor: "text-green-400" },
  { key: "concluido", label: "Concluído", color: "bg-slate-500", textColor: "text-slate-400" },
  { key: "rejeitado", label: "Rejeitado", color: "bg-red-500", textColor: "text-red-400" },
];

export default function AdminAdsCrmTab() {
  const { toast } = useToast();
  const [requests, setRequests] = useState<AdRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState("todos");
  const [draggedId, setDraggedId] = useState<string | null>(null);

  const fetchRequests = async () => {
    setLoading(true);
    const { data: ads } = await supabase
      .from("ad_requests")
      .select("*")
      .order("created_at", { ascending: false });

    if (!ads || ads.length === 0) {
      setRequests([]);
      setLoading(false);
      return;
    }

    const sellerIds = [...new Set(ads.map((a) => a.seller_id))];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name, company_name, phone, email")
      .in("id", sellerIds);

    const profileMap: Record<string, any> = {};
    (profiles || []).forEach((p) => { profileMap[p.id] = p; });

    const enriched: AdRequest[] = ads.map((a) => {
      const p = profileMap[a.seller_id];
      return {
        ...a,
        sellerName: p?.company_name || p?.full_name || "Corretor",
        sellerPhone: p?.phone,
        sellerEmail: p?.email,
      };
    });

    setRequests(enriched);
    setLoading(false);
  };

  useEffect(() => { fetchRequests(); }, []);

  const updateStatus = async (id: string, newStatus: string) => {
    const { error } = await supabase
      .from("ad_requests")
      .update({ status: newStatus } as any)
      .eq("id", id);
    if (error) {
      toast({ title: "Erro ao atualizar", variant: "destructive" });
      return;
    }
    setRequests((prev) => prev.map((r) => r.id === id ? { ...r, status: newStatus } : r));
    toast({ title: `Status atualizado para "${STAGES.find((s) => s.key === newStatus)?.label}"` });
  };

  const handleDrop = (e: React.DragEvent, stageKey: string) => {
    e.preventDefault();
    const id = e.dataTransfer.getData("text/plain");
    if (id) updateStatus(id, stageKey);
    setDraggedId(null);
  };

  const filtered = requests.filter((r) => {
    if (stageFilter !== "todos" && r.status !== stageFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        r.sellerName?.toLowerCase().includes(q) ||
        r.details?.toLowerCase().includes(q) ||
        r.sellerEmail?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const totalRevenue = requests.filter((r) => ["aprovado", "ativo", "concluido"].includes(r.status)).reduce((sum, r) => sum + Number(r.service_fee), 0);
  const totalInvestment = requests.filter((r) => ["aprovado", "ativo", "concluido"].includes(r.status)).reduce((sum, r) => sum + Number(r.subtotal), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="font-display font-bold text-lg text-foreground flex items-center gap-2">
            <Megaphone className="text-primary" size={20} /> CRM de ADS
          </h2>
          <p className="text-xs text-muted-foreground">Gerencie solicitações de anúncios dos corretores</p>
        </div>
        <button onClick={fetchRequests} className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-secondary text-secondary-foreground text-xs font-medium hover:bg-secondary/80 transition-colors">
          <RefreshCw size={14} /> Atualizar
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Total Solicitações" value={requests.length.toString()} icon={Megaphone} color="text-primary" />
        <StatCard label="Pendentes" value={requests.filter((r) => r.status === "pendente").length.toString()} icon={Clock} color="text-amber-400" />
        <StatCard label="Receita Taxa" value={`R$${totalRevenue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`} icon={DollarSign} color="text-emerald-400" />
        <StatCard label="Total Investido" value={`R$${totalInvestment.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`} icon={DollarSign} color="text-blue-400" />
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por corretor, imóvel..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-secondary text-foreground text-sm border border-border focus:ring-2 focus:ring-ring focus:outline-none"
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          <button
            onClick={() => setStageFilter("todos")}
            className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all ${stageFilter === "todos" ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"}`}
          >
            Todos
          </button>
          {STAGES.map((s) => (
            <button
              key={s.key}
              onClick={() => setStageFilter(s.key)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all ${stageFilter === s.key ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"}`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Kanban Pipeline */}
      <div className="overflow-x-auto pb-4">
        <div className="flex gap-3 min-w-[900px]">
          {STAGES.map((stage) => {
            const stageRequests = filtered.filter((r) => r.status === stage.key);
            return (
              <div
                key={stage.key}
                className="flex-1 min-w-[200px]"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => handleDrop(e, stage.key)}
              >
                <div className="flex items-center gap-2 mb-3">
                  <div className={`w-2.5 h-2.5 rounded-full ${stage.color}`} />
                  <span className="text-xs font-bold text-foreground">{stage.label}</span>
                  <span className="text-[10px] bg-secondary px-1.5 py-0.5 rounded-full text-muted-foreground font-bold">
                    {stageRequests.length}
                  </span>
                </div>

                <div className="space-y-2 min-h-[100px] bg-secondary/30 rounded-xl p-2">
                  {stageRequests.map((req) => (
                    <div
                      key={req.id}
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData("text/plain", req.id);
                        setDraggedId(req.id);
                      }}
                      onDragEnd={() => setDraggedId(null)}
                      className={`bg-card border border-border rounded-xl p-3 cursor-grab active:cursor-grabbing transition-opacity ${
                        draggedId === req.id ? "opacity-50" : ""
                      }`}
                    >
                      <p className="text-sm font-semibold text-foreground truncate">{req.sellerName}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-2">{req.details}</p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs font-bold text-primary">
                          R${Number(req.total).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(req.created_at).toLocaleDateString("pt-BR")}
                        </span>
                      </div>
                      <div className="flex gap-3 mt-2 text-[10px] text-muted-foreground">
                        <span>R${req.daily_budget}/dia</span>
                        <span>{req.duration_days}d</span>
                        <span className="text-emerald-400">Taxa: R${Number(req.service_fee).toFixed(0)}</span>
                      </div>

                      {/* Quick Actions */}
                      <div className="flex gap-1.5 mt-2">
                        {req.sellerPhone && (
                          <a
                            href={`https://wa.me/55${req.sellerPhone.replace(/\D/g, "")}?text=${encodeURIComponent(`Olá ${req.sellerName}! Sobre sua solicitação de ADS...`)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-500/20 text-emerald-400 text-[10px] font-semibold hover:bg-emerald-500/30 transition-colors"
                          >
                            <MessageCircle size={10} /> WhatsApp
                          </a>
                        )}
                        <select
                          value={req.status}
                          onChange={(e) => updateStatus(req.id, e.target.value)}
                          className="px-2 py-1 rounded-lg bg-secondary text-foreground text-[10px] border-0 focus:ring-1 focus:ring-ring appearance-none cursor-pointer"
                        >
                          {STAGES.map((s) => (
                            <option key={s.key} value={s.key}>{s.label}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, color }: { label: string; value: string; icon: any; color: string }) {
  return (
    <div className="bg-card border border-border rounded-xl p-3 text-center">
      <Icon size={16} className={`${color} mx-auto mb-1`} />
      <p className="font-bold text-lg text-foreground leading-none">{value}</p>
      <p className="text-[10px] text-muted-foreground mt-0.5">{label}</p>
    </div>
  );
}
