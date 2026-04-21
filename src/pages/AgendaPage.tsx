import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useVisitAppointments, STATUS_META, VisitStatus, VisitAppointment } from "@/hooks/useVisitAppointments";
import VisitFormDialog from "@/components/VisitFormDialog";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Helmet } from "react-helmet-async";
import {
  Calendar as CalendarIcon, Plus, MessageCircle, MapPin, Edit3, CheckCircle2, ArrowLeft,
  Download, Phone, Clock, Trash2, Flame, TrendingUp, Home as HomeIcon, DollarSign
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const todayISO = () => new Date().toISOString().slice(0, 10);
const weekRange = () => {
  const d = new Date();
  const day = d.getDay();
  const start = new Date(d); start.setDate(d.getDate() - day);
  const end = new Date(start); end.setDate(start.getDate() + 6);
  return { start: start.toISOString().slice(0, 10), end: end.toISOString().slice(0, 10) };
};
const monthRange = () => {
  const d = new Date();
  const start = new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
  const end = new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().slice(0, 10);
  return { start, end };
};

type Quick = "todas" | "hoje" | "amanha" | "semana" | "mes";

export default function AgendaPage() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { visits, loading, createVisit, updateVisit, deleteVisit } = useVisitAppointments(user?.id, profile?.id);

  const [quick, setQuick] = useState<Quick>("hoje");
  const [statusFilter, setStatusFilter] = useState<VisitStatus | "todos">("todos");
  const [cityFilter, setCityFilter] = useState("");
  const [responsibleFilter, setResponsibleFilter] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [openForm, setOpenForm] = useState(false);
  const [editing, setEditing] = useState<VisitAppointment | null>(null);

  const filtered = useMemo(() => {
    let list = [...visits];

    if (quick === "hoje") {
      const t = todayISO();
      list = list.filter((v) => v.visit_date === t);
    } else if (quick === "amanha") {
      const d = new Date(); d.setDate(d.getDate() + 1);
      const t = d.toISOString().slice(0, 10);
      list = list.filter((v) => v.visit_date === t);
    } else if (quick === "semana") {
      const r = weekRange();
      list = list.filter((v) => v.visit_date >= r.start && v.visit_date <= r.end);
    } else if (quick === "mes") {
      const r = monthRange();
      list = list.filter((v) => v.visit_date >= r.start && v.visit_date <= r.end);
    }

    if (selectedDate && quick === "todas") {
      const iso = selectedDate.toISOString().slice(0, 10);
      list = list.filter((v) => v.visit_date === iso);
    }

    if (statusFilter !== "todos") list = list.filter((v) => v.status === statusFilter);
    if (cityFilter.trim()) list = list.filter((v) => (v.city || "").toLowerCase().includes(cityFilter.toLowerCase()));
    if (responsibleFilter.trim()) list = list.filter((v) => (v.responsible_name || "").toLowerCase().includes(responsibleFilter.toLowerCase()));

    return list;
  }, [visits, quick, statusFilter, cityFilter, responsibleFilter, selectedDate]);

  const stats = useMemo(() => {
    const t = todayISO();
    const wk = weekRange();
    return {
      hoje: visits.filter((v) => v.visit_date === t).length,
      semana: visits.filter((v) => v.visit_date >= wk.start && v.visit_date <= wk.end).length,
      quentes: visits.filter((v) => v.outcome === "quente").length,
      visitados: visits.filter((v) => v.status === "fechada" || v.status === "confirmada").length,
      fechamentos: visits.filter((v) => v.status === "fechada").length,
    };
  }, [visits]);

  const datesWithVisits = useMemo(() => {
    const set = new Set(visits.map((v) => v.visit_date));
    return Array.from(set).map((d) => new Date(d + "T00:00:00"));
  }, [visits]);

  const openWhatsApp = (phone?: string | null, name?: string) => {
    if (!phone) { toast({ title: "Cliente sem telefone", variant: "destructive" }); return; }
    const clean = phone.replace(/\D/g, "");
    const msg = encodeURIComponent(`Olá ${name || ""}, sobre nossa visita agendada.`);
    window.open(`https://wa.me/55${clean}?text=${msg}`, "_blank");
  };

  const openMaps = (address?: string | null) => {
    if (!address) { toast({ title: "Sem endereço cadastrado", variant: "destructive" }); return; }
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`, "_blank");
  };

  const finalize = async (v: VisitAppointment) => {
    try {
      await updateVisit(v.id, { status: "fechada" });
      toast({ title: "Visita finalizada" });
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    }
  };

  const remove = async (v: VisitAppointment) => {
    if (!confirm("Excluir esta visita?")) return;
    try {
      await deleteVisit(v.id);
      toast({ title: "Visita removida" });
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    }
  };

  const exportCsv = () => {
    const header = ["Data", "Hora", "Cliente", "Telefone", "Imóvel", "Endereço", "Cidade", "Responsável", "Status"];
    const rows = filtered.map((v) => [
      v.visit_date, v.visit_time, v.client_name, v.client_phone || "", v.property_type || "",
      v.address || "", v.city || "", v.responsible_name || "", v.status,
    ]);
    const csv = [header, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `agenda-visitas-${todayISO()}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Agenda de Visitas — Capimobi</title>
        <meta name="description" content="Organize visitas a imóveis, leads e compromissos imobiliários em um só lugar." />
      </Helmet>

      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground py-6">
        <div className="container max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <button onClick={() => navigate("/painel")} className="p-2 rounded-lg hover:bg-white/10">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                  <CalendarIcon className="w-6 h-6" /> Agenda de Visitas
                </h1>
                <p className="text-sm text-primary-foreground/80">Organize visitas, leads e compromissos imobiliários.</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => { setEditing(null); setOpenForm(true); }} className="bg-white text-primary hover:bg-white/90">
                <Plus className="w-4 h-4 mr-1" /> Nova Visita
              </Button>
              <Button variant="secondary" size="sm" onClick={() => setQuick("hoje")}>Hoje</Button>
              <Button variant="secondary" size="sm" onClick={() => setQuick("semana")}>Semana</Button>
              <Button variant="secondary" size="sm" onClick={() => setQuick("mes")}>Mês</Button>
              <Button variant="secondary" size="sm" onClick={exportCsv}>
                <Download className="w-4 h-4 mr-1" /> Exportar
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <StatCard icon={<CalendarIcon className="w-5 h-5" />} label="Visitas Hoje" value={stats.hoje} color="bg-blue-500" />
          <StatCard icon={<TrendingUp className="w-5 h-5" />} label="Semana" value={stats.semana} color="bg-emerald-500" />
          <StatCard icon={<Flame className="w-5 h-5" />} label="Leads Quentes" value={stats.quentes} color="bg-orange-500" />
          <StatCard icon={<HomeIcon className="w-5 h-5" />} label="Visitados" value={stats.visitados} color="bg-indigo-500" />
          <StatCard icon={<DollarSign className="w-5 h-5" />} label="Fechamentos" value={stats.fechamentos} color="bg-purple-500" />
        </div>

        {/* Filters */}
        <div className="bg-card border border-border rounded-xl p-3 flex flex-wrap gap-2 items-center shadow-sm">
          <Select value={quick} onValueChange={(v) => setQuick(v as Quick)}>
            <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas</SelectItem>
              <SelectItem value="hoje">Hoje</SelectItem>
              <SelectItem value="amanha">Amanhã</SelectItem>
              <SelectItem value="semana">Esta semana</SelectItem>
              <SelectItem value="mes">Este mês</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
            <SelectTrigger className="w-[160px]"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos status</SelectItem>
              {(Object.keys(STATUS_META) as VisitStatus[]).map((s) => (
                <SelectItem key={s} value={s}>{STATUS_META[s].label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input placeholder="Cidade" className="w-[160px]" value={cityFilter} onChange={(e) => setCityFilter(e.target.value)} />
          <Input placeholder="Corretor responsável" className="w-[200px]" value={responsibleFilter} onChange={(e) => setResponsibleFilter(e.target.value)} />
        </div>

        {/* Two columns */}
        <div className="grid grid-cols-1 lg:grid-cols-[420px_1fr] gap-6">
          {/* Calendar */}
          <div className="bg-card border border-border rounded-xl p-4 shadow-sm h-fit">
            <h3 className="font-semibold mb-3 flex items-center gap-2"><CalendarIcon className="w-4 h-4 text-primary" /> Calendário</h3>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(d) => { setSelectedDate(d); setQuick("todas"); }}
              modifiers={{ withVisit: datesWithVisits }}
              modifiersClassNames={{ withVisit: "bg-primary/15 text-primary font-bold" }}
              className="p-0 pointer-events-auto"
            />
            <div className="mt-4 space-y-1.5 text-xs">
              <p className="font-semibold text-muted-foreground mb-2">Legenda</p>
              {(Object.keys(STATUS_META) as VisitStatus[]).map((s) => (
                <div key={s} className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${STATUS_META[s].dot}`} />
                  <span className="text-foreground">{STATUS_META[s].label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Visit list */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg">
                {filtered.length} visita{filtered.length !== 1 ? "s" : ""}
              </h3>
            </div>

            {loading ? (
              <div className="text-center py-12 text-muted-foreground">Carregando...</div>
            ) : filtered.length === 0 ? (
              <div className="bg-card border border-dashed border-border rounded-xl p-12 text-center">
                <CalendarIcon className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50" />
                <p className="text-muted-foreground mb-4">Nenhuma visita encontrada para o filtro atual.</p>
                <Button onClick={() => { setEditing(null); setOpenForm(true); }}>
                  <Plus className="w-4 h-4 mr-1" /> Agendar primeira visita
                </Button>
              </div>
            ) : (
              filtered.map((v) => {
                const meta = STATUS_META[v.status];
                return (
                  <div key={v.id} className="bg-card border border-border rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${meta.bg} ${meta.color}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
                            {meta.label}
                          </span>
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(v.visit_date + "T00:00:00").toLocaleDateString("pt-BR")} às {v.visit_time?.slice(0, 5)}
                          </span>
                        </div>
                        <h4 className="font-bold text-foreground">{v.client_name}</h4>
                        {v.client_phone && <p className="text-sm text-muted-foreground flex items-center gap-1"><Phone className="w-3 h-3" /> {v.client_phone}</p>}
                        {(v.property_type || v.address) && (
                          <p className="text-sm text-foreground mt-1">
                            {v.property_type && <span className="font-medium">{v.property_type}</span>}
                            {v.property_type && v.address && " • "}
                            {v.address}{v.city ? `, ${v.city}` : ""}
                          </p>
                        )}
                        {v.responsible_name && <p className="text-xs text-muted-foreground mt-1">Responsável: {v.responsible_name}</p>}
                        {v.notes && <p className="text-xs text-muted-foreground mt-1 italic">"{v.notes}"</p>}
                      </div>

                      <div className="flex flex-wrap gap-1.5">
                        <Button size="sm" variant="outline" onClick={() => openWhatsApp(v.client_phone, v.client_name)} title="WhatsApp">
                          <MessageCircle className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => openMaps(v.address)} title="Maps">
                          <MapPin className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => { setEditing(v); setOpenForm(true); }} title="Editar">
                          <Edit3 className="w-4 h-4" />
                        </Button>
                        {v.status !== "fechada" && (
                          <Button size="sm" onClick={() => finalize(v)} title="Finalizar">
                            <CheckCircle2 className="w-4 h-4" />
                          </Button>
                        )}
                        <Button size="sm" variant="outline" onClick={() => remove(v)} title="Excluir" className="text-destructive hover:bg-destructive/10">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {user && profile && (
        <VisitFormDialog
          open={openForm}
          onOpenChange={(o) => { setOpenForm(o); if (!o) setEditing(null); }}
          initial={editing}
          userId={user.id}
          onSubmit={async (input) => {
            if (editing) await updateVisit(editing.id, input);
            else await createVisit(input);
          }}
        />
      )}
    </div>
  );
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number; color: string }) {
  return (
    <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-lg ${color} text-white flex items-center justify-center`}>{icon}</div>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-2xl font-bold text-foreground">{value}</p>
        </div>
      </div>
    </div>
  );
}
