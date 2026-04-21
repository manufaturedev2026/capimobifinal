import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save, CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import type { VisitAppointment, VisitInput, VisitStatus } from "@/hooks/useVisitAppointments";

type SellerItemOpt = { id: string; title: string; address: string | null; city: string | null; category: string };

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initial?: VisitAppointment | null;
  userId: string;
  onSubmit: (input: VisitInput) => Promise<void>;
}

export default function VisitFormDialog({ open, onOpenChange, initial, userId, onSubmit }: Props) {
  const { toast } = useToast();
  const [items, setItems] = useState<SellerItemOpt[]>([]);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState<VisitInput>({
    client_name: "",
    client_phone: "",
    client_email: "",
    item_id: null,
    property_type: "",
    property_code: "",
    address: "",
    city: "",
    visit_date: new Date().toISOString().slice(0, 10),
    visit_time: "10:00",
    responsible_name: "",
    status: "pendente",
    notes: "",
  });

  useEffect(() => {
    if (!open || !userId) return;
    supabase
      .from("seller_items")
      .select("id, title, address, city, category")
      .eq("user_id", userId)
      .eq("status", "ativo")
      .order("created_at", { ascending: false })
      .limit(200)
      .then(({ data }) => setItems((data as SellerItemOpt[]) || []));
  }, [open, userId]);

  useEffect(() => {
    if (initial) {
      setForm({
        client_name: initial.client_name,
        client_phone: initial.client_phone || "",
        client_email: initial.client_email || "",
        item_id: initial.item_id,
        property_type: initial.property_type || "",
        property_code: initial.property_code || "",
        address: initial.address || "",
        city: initial.city || "",
        visit_date: initial.visit_date,
        visit_time: initial.visit_time?.slice(0, 5) || "10:00",
        responsible_name: initial.responsible_name || "",
        status: initial.status,
        notes: initial.notes || "",
      });
    } else {
      setForm({
        client_name: "", client_phone: "", client_email: "",
        item_id: null, property_type: "", property_code: "",
        address: "", city: "",
        visit_date: new Date().toISOString().slice(0, 10),
        visit_time: "10:00",
        responsible_name: "", status: "pendente", notes: "",
      });
    }
  }, [initial, open]);

  const handleItemChange = (id: string) => {
    if (id === "_none") {
      setForm((f) => ({ ...f, item_id: null }));
      return;
    }
    const it = items.find((i) => i.id === id);
    setForm((f) => ({
      ...f,
      item_id: id,
      property_type: it?.category || f.property_type,
      address: it?.address || f.address,
      city: it?.city || f.city,
    }));
  };

  const handleSubmit = async () => {
    if (!form.client_name.trim()) {
      toast({ title: "Informe o nome do cliente", variant: "destructive" });
      return;
    }
    if (!form.visit_date || !form.visit_time) {
      toast({ title: "Informe data e hora", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      await onSubmit(form);
      toast({ title: initial ? "Visita atualizada!" : "Visita criada!" });
      onOpenChange(false);
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initial ? "Editar Visita" : "Nova Visita"}</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-2">
          <div className="md:col-span-2">
            <Label>Nome do cliente *</Label>
            <Input value={form.client_name} onChange={(e) => setForm({ ...form, client_name: e.target.value })} />
          </div>
          <div>
            <Label>Telefone</Label>
            <Input value={form.client_phone || ""} onChange={(e) => setForm({ ...form, client_phone: e.target.value })} placeholder="(00) 00000-0000" />
          </div>
          <div>
            <Label>E-mail</Label>
            <Input type="email" value={form.client_email || ""} onChange={(e) => setForm({ ...form, client_email: e.target.value })} />
          </div>

          <div className="md:col-span-2">
            <Label>Imóvel (opcional)</Label>
            <Select value={form.item_id || "_none"} onValueChange={handleItemChange}>
              <SelectTrigger><SelectValue placeholder="Selecione um imóvel ou deixe livre" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="_none">Sem vínculo (endereço livre)</SelectItem>
                {items.map((it) => (
                  <SelectItem key={it.id} value={it.id}>{it.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Tipo do imóvel</Label>
            <Input value={form.property_type || ""} onChange={(e) => setForm({ ...form, property_type: e.target.value })} placeholder="Casa, Apto..." />
          </div>
          <div>
            <Label>Código</Label>
            <Input value={form.property_code || ""} onChange={(e) => setForm({ ...form, property_code: e.target.value })} />
          </div>
          <div className="md:col-span-2">
            <Label>Endereço</Label>
            <Input value={form.address || ""} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          </div>
          <div>
            <Label>Cidade</Label>
            <Input value={form.city || ""} onChange={(e) => setForm({ ...form, city: e.target.value })} />
          </div>
          <div>
            <Label>Corretor responsável</Label>
            <Input value={form.responsible_name || ""} onChange={(e) => setForm({ ...form, responsible_name: e.target.value })} placeholder="Nome do responsável" />
          </div>

          <div>
            <Label>Data *</Label>
            <Input type="date" value={form.visit_date} onChange={(e) => setForm({ ...form, visit_date: e.target.value })} />
          </div>
          <div>
            <Label>Hora *</Label>
            <Input type="time" value={form.visit_time} onChange={(e) => setForm({ ...form, visit_time: e.target.value })} />
          </div>

          <div className="md:col-span-2">
            <Label>Status</Label>
            <Select value={form.status || "pendente"} onValueChange={(v) => setForm({ ...form, status: v as VisitStatus })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="pendente">🟡 Pendente</SelectItem>
                <SelectItem value="confirmada">🟢 Confirmada</SelectItem>
                <SelectItem value="reagendada">🔵 Reagendada</SelectItem>
                <SelectItem value="cancelada">🔴 Cancelada</SelectItem>
                <SelectItem value="fechada">🟣 Fechada</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="md:col-span-2">
            <Label>Observações</Label>
            <Textarea rows={3} value={form.notes || ""} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Save className="w-4 h-4 mr-1" />}
            Salvar Visita
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
