import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { BRAZIL_STATES } from "@/data/brazilStates";
import { Plus, Trash2, Edit, Search, DollarSign, History } from "lucide-react";

const TIPOS = ["Casa", "Apartamento", "Terreno", "Comercial", "Rural"];

type Row = {
  id: string;
  estado: string;
  cidade: string | null;
  bairro: string | null;
  tipo: string;
  preco_m2: number;
  notes: string | null;
  updated_at: string;
};

type Valuation = {
  id: string;
  cidade: string;
  bairro: string;
  tipo: string;
  area_total: number;
  valor_estimado: number;
  created_at: string;
};

export default function AdminValuationPricesTab() {
  const { toast } = useToast();
  const [view, setView] = useState<"prices" | "history">("prices");
  const [rows, setRows] = useState<Row[]>([]);
  const [valuations, setValuations] = useState<Valuation[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterEstado, setFilterEstado] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Row | null>(null);
  const [form, setForm] = useState({ estado: "ES", cidade: "", bairro: "", tipo: "Casa", preco_m2: "", notes: "" });

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("valuation_price_table")
      .select("*")
      .order("estado", { ascending: true })
      .order("cidade", { ascending: true, nullsFirst: true })
      .order("bairro", { ascending: true, nullsFirst: true })
      .limit(2000);
    setRows((data as any) || []);
    const { data: v } = await supabase
      .from("property_valuations")
      .select("id, cidade, bairro, tipo, area_total, valor_estimado, created_at")
      .order("created_at", { ascending: false })
      .limit(200);
    setValuations((v as any) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openNew = () => {
    setEditing(null);
    setForm({ estado: "ES", cidade: "", bairro: "", tipo: "Casa", preco_m2: "", notes: "" });
    setDialogOpen(true);
  };

  const openEdit = (r: Row) => {
    setEditing(r);
    setForm({
      estado: r.estado, cidade: r.cidade || "", bairro: r.bairro || "",
      tipo: r.tipo, preco_m2: String(r.preco_m2), notes: r.notes || "",
    });
    setDialogOpen(true);
  };

  const save = async () => {
    if (!form.estado || !form.tipo || !form.preco_m2) {
      toast({ title: "Estado, tipo e preço são obrigatórios", variant: "destructive" });
      return;
    }
    const payload = {
      estado: form.estado,
      cidade: form.cidade.trim() || null,
      bairro: form.bairro.trim() || null,
      tipo: form.tipo,
      preco_m2: Number(form.preco_m2),
      notes: form.notes.trim() || null,
    };
    const { error } = editing
      ? await supabase.from("valuation_price_table").update(payload).eq("id", editing.id)
      : await supabase.from("valuation_price_table").insert(payload);
    if (error) {
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: editing ? "Atualizado" : "Adicionado" });
    setDialogOpen(false);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Remover este preço?")) return;
    const { error } = await supabase.from("valuation_price_table").delete().eq("id", id);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
      return;
    }
    load();
  };

  const filtered = rows.filter((r) => {
    if (filterEstado && r.estado !== filterEstado) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (r.cidade || "").toLowerCase().includes(q) ||
      (r.bairro || "").toLowerCase().includes(q) ||
      r.tipo.toLowerCase().includes(q)
    );
  });

  const fmtBRL = (v: number) =>
    v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2 text-foreground">
            <DollarSign className="h-6 w-6 text-primary" /> Avaliação IA — Preços por m²
          </h2>
          <p className="text-sm text-muted-foreground">
            Configure o preço base por estado, cidade e bairro. O sistema usa fallback automático.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant={view === "prices" ? "default" : "secondary"} size="sm" onClick={() => setView("prices")}>
            <DollarSign className="h-4 w-4 mr-1" /> Preços ({rows.length})
          </Button>
          <Button variant={view === "history" ? "default" : "secondary"} size="sm" onClick={() => setView("history")}>
            <History className="h-4 w-4 mr-1" /> Histórico ({valuations.length})
          </Button>
        </div>
      </div>

      {view === "prices" && (
        <>
          <div className="flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input className="pl-9" placeholder="Buscar cidade/bairro/tipo..." value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <Select value={filterEstado || "all"} onValueChange={(v) => setFilterEstado(v === "all" ? "" : v)}>
              <SelectTrigger className="w-[200px]"><SelectValue placeholder="Filtrar estado" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os estados</SelectItem>
                <SelectItem value="_DEFAULT">Fallback nacional</SelectItem>
                {BRAZIL_STATES.map((s) => <SelectItem key={s.uf} value={s.uf}>{s.uf} — {s.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button onClick={openNew}><Plus className="h-4 w-4 mr-1" /> Novo preço</Button>
          </div>

          <Card className="overflow-hidden">
            <div className="overflow-x-auto max-h-[600px]">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 sticky top-0">
                  <tr>
                    <th className="text-left p-3">Estado</th>
                    <th className="text-left p-3">Cidade</th>
                    <th className="text-left p-3">Bairro</th>
                    <th className="text-left p-3">Tipo</th>
                    <th className="text-right p-3">Preço/m²</th>
                    <th className="text-right p-3">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">Carregando...</td></tr>
                  ) : filtered.length === 0 ? (
                    <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">Nenhum preço encontrado</td></tr>
                  ) : filtered.map((r) => (
                    <tr key={r.id} className="border-t hover:bg-muted/30">
                      <td className="p-3 font-mono text-xs">{r.estado}</td>
                      <td className="p-3">{r.cidade || <em className="text-muted-foreground">média estado</em>}</td>
                      <td className="p-3">{r.bairro || <em className="text-muted-foreground">média cidade</em>}</td>
                      <td className="p-3">{r.tipo}</td>
                      <td className="p-3 text-right font-semibold">{fmtBRL(r.preco_m2)}</td>
                      <td className="p-3 text-right">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(r)}><Edit className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => remove(r.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}

      {view === "history" && (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto max-h-[700px]">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 sticky top-0">
                <tr>
                  <th className="text-left p-3">Data</th>
                  <th className="text-left p-3">Cidade</th>
                  <th className="text-left p-3">Bairro</th>
                  <th className="text-left p-3">Tipo</th>
                  <th className="text-right p-3">Área</th>
                  <th className="text-right p-3">Valor estimado</th>
                </tr>
              </thead>
              <tbody>
                {valuations.length === 0 ? (
                  <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">Nenhuma avaliação ainda</td></tr>
                ) : valuations.map((v) => (
                  <tr key={v.id} className="border-t">
                    <td className="p-3 text-xs">{new Date(v.created_at).toLocaleString("pt-BR")}</td>
                    <td className="p-3">{v.cidade}</td>
                    <td className="p-3">{v.bairro}</td>
                    <td className="p-3">{v.tipo}</td>
                    <td className="p-3 text-right">{v.area_total}m²</td>
                    <td className="p-3 text-right font-semibold text-primary">{fmtBRL(v.valor_estimado)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Editar preço" : "Novo preço por m²"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Estado *</Label>
                <Select value={form.estado} onValueChange={(v) => setForm({ ...form, estado: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_DEFAULT">Fallback nacional</SelectItem>
                    {BRAZIL_STATES.map((s) => <SelectItem key={s.uf} value={s.uf}>{s.uf} — {s.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Tipo *</Label>
                <Select value={form.tipo} onValueChange={(v) => setForm({ ...form, tipo: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TIPOS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Cidade <span className="text-xs text-muted-foreground">(vazio = média do estado)</span></Label>
                <Input value={form.cidade} onChange={(e) => setForm({ ...form, cidade: e.target.value })} placeholder="Ex: Vitória" />
              </div>
              <div>
                <Label>Bairro <span className="text-xs text-muted-foreground">(vazio = média da cidade)</span></Label>
                <Input value={form.bairro} onChange={(e) => setForm({ ...form, bairro: e.target.value })} placeholder="Ex: Praia do Canto" />
              </div>
            </div>
            <div>
              <Label>Preço por m² (R$) *</Label>
              <Input type="number" value={form.preco_m2} onChange={(e) => setForm({ ...form, preco_m2: e.target.value })} placeholder="4500" />
            </div>
            <div>
              <Label>Observações</Label>
              <Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
              <Button onClick={save}>Salvar</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
