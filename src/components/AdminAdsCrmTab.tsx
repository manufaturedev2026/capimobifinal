import { useState, useEffect } from "react";
import { Megaphone, Search, Clock, MessageCircle, Loader2, RefreshCw, DollarSign, ExternalLink, ImageIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AdRequest {
  id: string;
  user_id: string;
  seller_id: string;
  item_id: string | null;
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
  itemTitle?: string;
  itemCity?: string;
  itemNeighborhood?: string;
  itemPrice?: number | null;
  itemPhoto?: string | null;
  itemSlug?: string | null;
  itemCategory?: string;
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
  const [expandedId, setExpandedId] = useState<string | null>(null);

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

    const sellerIds = [...new Set(ads.map((a: any) => a.seller_id))];
    const itemIds = [...new Set(ads.map((a: any) => a.item_id).filter(Boolean))];

    const [{ data: profiles }, { data: items }] = await Promise.all([
      supabase.from("profiles").select("id, full_name, company_name, phone, email").in("id", sellerIds),
      itemIds.length > 0
        ? supabase.from("seller_items").select("id, title, city, neighborhood, price, photos, slug, category").in("id", itemIds)
        : Promise.resolve({ data: [] }),
    ]);

    const profileMap: Record<string, any> = {};
    (profiles || []).forEach((p) => { profileMap[p.id] = p; });

    const itemMap: Record<string, any> = {};
    (items || []).forEach((i) => { itemMap[i.id] = i; });

    const enriched: AdRequest[] = ads.map((a: any) => {
      const p = profileMap[a.seller_id];
      const item = a.item_id ? itemMap[a.item_id] : null;
      return {
        ...a,
        sellerName: p?.company_name || p?.full_name || "Corretor",
        sellerPhone: p?.phone,
        sellerEmail: p?.email,
        itemTitle: item?.title || null,
        itemCity: item?.city || null,
        itemNeighborhood: item?.neighborhood || null,
        itemPrice: item?.price || null,
        itemPhoto: item?.photos?.[0] || null,
        itemSlug: item?.slug || null,
        itemCategory: item?.category || null,
      };
    });

    setRequests(enriched);
    setLoading(false);
  };

  useEffect(() => { fetchRequests(); }, []);

  const updateStatus = async (id: string, newStatus: string) => {
    const req = requests.find((r) => r.id === id);
    const { error } = await supabase
      .from("ad_requests")
      .update({ status: newStatus } as any)
      .eq("id", id);
    if (error) {
      toast({ title: "Erro ao atualizar", variant: "destructive" });
      return;
    }
    setRequests((prev) => prev.map((r) => r.id === id ? { ...r, status: newStatus } : r));
    const stageLabel = STAGES.find((s) => s.key === newStatus)?.label || newStatus;
    toast({ title: `Status atualizado para "${stageLabel}"` });

    // Push notification to broker about ADS status change
    if (req && ["pendente", "em_analise", "aprovado", "ativo", "concluido"].includes(newStatus)) {
      const messages: Record<string, { title: string; body: string }> = {
        pendente: { title: "Solicitação de ADS recebida ⏳", body: `Sua solicitação ${req.itemTitle ? `para "${req.itemTitle}"` : ""} está pendente.` },
        em_analise: { title: "ADS em análise 🔍", body: `Estamos analisando sua solicitação${req.itemTitle ? ` para "${req.itemTitle}"` : ""}.` },
        aprovado: { title: "ADS aprovado ✅", body: `Sua solicitação${req.itemTitle ? ` para "${req.itemTitle}"` : ""} foi aprovada!` },
        ativo: { title: "Seu ADS está ativo 🚀", body: `Sua campanha${req.itemTitle ? ` de "${req.itemTitle}"` : ""} está rodando.` },
        concluido: { title: "ADS concluído 🎉", body: `Sua campanha${req.itemTitle ? ` de "${req.itemTitle}"` : ""} foi concluída.` },
      };
      const msg = messages[newStatus];
      supabase.functions.invoke("notify-new-lead", {
        body: {
          target_user_id: req.user_id,
          title: msg.title,
          body: msg.body,
          url: "/painel?tab=ads",
        },
      }).catch(() => {});
    }
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
        r.sellerEmail?.toLowerCase().includes(q) ||
        r.itemTitle?.toLowerCase().includes(q)
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
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6 gap-4 pb-4">
        {STAGES.map((stage) => {
          const stageRequests = filtered.filter((r) => r.status === stage.key);
          return (
            <div
              key={stage.key}
              className="min-w-0"
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
                    <AdCard
                      key={req.id}
                      req={req}
                      draggedId={draggedId}
                      setDraggedId={setDraggedId}
                      expanded={expandedId === req.id}
                      onToggle={() => setExpandedId(expandedId === req.id ? null : req.id)}
                      onStatusChange={updateStatus}
                    />
                  ))}
                </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Ad Card ─────────────────────────────────── */

function AdCard({
  req, draggedId, setDraggedId, expanded, onToggle, onStatusChange,
}: {
  req: AdRequest;
  draggedId: string | null;
  setDraggedId: (id: string | null) => void;
  expanded: boolean;
  onToggle: () => void;
  onStatusChange: (id: string, status: string) => void;
}) {
  const itemLink = req.itemSlug ? `/imovel/${req.itemSlug}` : req.item_id ? `/imovel/${req.item_id}` : null;

  return (
    <div
      draggable
      onDragStart={(e) => { e.dataTransfer.setData("text/plain", req.id); setDraggedId(req.id); }}
      onDragEnd={() => setDraggedId(null)}
      onClick={onToggle}
      className={`bg-card border border-border rounded-xl p-3 cursor-grab active:cursor-grabbing transition-opacity ${
        draggedId === req.id ? "opacity-50" : ""
      }`}
    >
      {/* Seller + Platform badge */}
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold text-foreground truncate">{req.sellerName}</p>
        <PlatformBadge platform={req.platform} />
      </div>

      {/* Item thumbnail + title */}
      {req.itemTitle && (
        <div className="flex items-center gap-2 mt-1.5 bg-secondary/60 rounded-lg p-1.5">
          {req.itemPhoto ? (
            <img loading="lazy" decoding="async" src={req.itemPhoto} alt="" className="w-10 h-10 rounded-md object-cover shrink-0" />
          ) : (
            <div className="w-10 h-10 rounded-md bg-muted flex items-center justify-center shrink-0">
              <ImageIcon size={14} className="text-muted-foreground" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold text-foreground truncate">{req.itemTitle}</p>
            <p className="text-[10px] text-muted-foreground truncate">
              {[req.itemNeighborhood, req.itemCity].filter(Boolean).join(", ") || "—"}
            </p>
          </div>
        </div>
      )}

      {/* Price & date row */}
      <div className="flex items-center justify-between mt-2">
        <span className="text-xs font-bold text-primary">
          R${Number(req.total).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
        </span>
        <span className="text-[10px] text-muted-foreground">
          {new Date(req.created_at).toLocaleDateString("pt-BR")}
        </span>
      </div>

      {/* Budget summary */}
      <div className="flex gap-3 mt-1.5 text-[10px] text-muted-foreground">
        <span>R${req.daily_budget}/dia</span>
        <span>{req.duration_days}d</span>
        <span className="text-emerald-400">Taxa: R${Number(req.service_fee).toFixed(0)}</span>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div className="mt-3 pt-3 border-t border-border space-y-2 text-[11px]" onClick={(e) => e.stopPropagation()}>
          {req.itemPrice != null && (
            <p className="text-muted-foreground">
              <span className="font-semibold text-foreground">Preço do imóvel:</span>{" "}
              R${Number(req.itemPrice).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </p>
          )}
          {req.itemCategory && (
            <p className="text-muted-foreground">
              <span className="font-semibold text-foreground">Categoria:</span> {req.itemCategory}
            </p>
          )}
          {req.details && (
            <div>
              <span className="font-semibold text-foreground">Observações do cliente:</span>
              <p className="text-muted-foreground mt-0.5 whitespace-pre-wrap">{req.details}</p>
            </div>
          )}
          {req.sellerEmail && (
            <p className="text-muted-foreground">
              <span className="font-semibold text-foreground">Email:</span> {req.sellerEmail}
            </p>
          )}
          <div className="flex items-center justify-between text-muted-foreground">
            <span><span className="font-semibold text-foreground">Subtotal:</span> R${Number(req.subtotal).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
          </div>
          {itemLink && (
            <a
              href={itemLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-primary hover:underline text-[11px] font-semibold"
            >
              <ExternalLink size={12} /> Ver imóvel
            </a>
          )}
        </div>
      )}

      {/* Quick Actions */}
      <div className="flex gap-1.5 mt-2 flex-wrap" onClick={(e) => e.stopPropagation()}>
        {itemLink && (
          <a
            href={itemLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-primary/20 text-primary text-[10px] font-semibold hover:bg-primary/30 transition-colors"
          >
            <ExternalLink size={10} /> Ver imóvel
          </a>
        )}
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
          onChange={(e) => onStatusChange(req.id, e.target.value)}
          className="px-2 py-1 rounded-lg bg-secondary text-foreground text-[10px] border-0 focus:ring-1 focus:ring-ring appearance-none cursor-pointer"
        >
          {STAGES.map((s) => (
            <option key={s.key} value={s.key}>{s.label}</option>
          ))}
        </select>
      </div>
    </div>
  );
}

/* ── Stat Card ───────────────────────────────── */

function StatCard({ label, value, icon: Icon, color }: { label: string; value: string; icon: any; color: string }) {
  return (
    <div className="bg-card border border-border rounded-xl p-3 text-center">
      <Icon size={16} className={`${color} mx-auto mb-1`} />
      <p className="font-bold text-lg text-foreground leading-none">{value}</p>
      <p className="text-[10px] text-muted-foreground mt-0.5">{label}</p>
    </div>
  );
}

/* ── Platform Badge ──────────────────────────── */

function PlatformBadge({ platform }: { platform: string }) {
  const isFb = platform === "facebook";
  const label = isFb ? "Facebook ADS" : "Google ADS";
  const cls = isFb
    ? "bg-blue-600/20 text-blue-400 border-blue-600/40"
    : "bg-amber-500/20 text-amber-400 border-amber-500/40";
  return (
    <span className={`shrink-0 px-1.5 py-0.5 rounded-md border text-[9px] font-bold uppercase tracking-wide ${cls}`}>
      {label}
    </span>
  );
}