import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAllPlans, type Plan } from "@/hooks/usePlans";
import {
  Pencil, Plus, Trash2, X, Check, GripVertical, Eye, EyeOff, Star, Save,
} from "lucide-react";

const CATEGORY_OPTIONS = [
  { value: "free", label: "Grátis" },
  { value: "individual", label: "Individual" },
  { value: "enterprise", label: "Empresarial" },
];

const COLOR_PRESETS = [
  "from-slate-500 to-slate-600",
  "from-emerald-500 to-teal-600",
  "from-amber-500 to-orange-600",
  "from-purple-600 to-indigo-700",
  "from-rose-600 to-red-700",
  "from-sky-600 to-blue-700",
  "from-zinc-800 to-zinc-950",
  "from-zinc-900 to-black",
];

function emptyPlan(): Partial<Plan> {
  return {
    tier: "",
    name: "",
    price: 0,
    setup_fee: 0,
    max_items: 5,
    ai_generations_per_day: 5,
    color: COLOR_PRESETS[0],
    border_color: "border-slate-400",
    badge_color: "bg-slate-500 text-white",
    benefits: [],
    category: "individual",
    is_active: true,
    is_popular: false,
    sort_order: 99,
  };
}

export default function AdminPlansTab() {
  const { plans, loading, refetch } = useAllPlans();
  const { toast } = useToast();
  const [editing, setEditing] = useState<Partial<Plan> | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [saving, setSaving] = useState(false);

  const openEdit = (p: Plan) => { setEditing({ ...p, benefits: [...p.benefits] }); setIsNew(false); };
  const openNew = () => { setEditing(emptyPlan()); setIsNew(true); };
  const close = () => { setEditing(null); setIsNew(false); };

  const toggleActive = async (p: Plan) => {
    const { error } = await (supabase as any)
      .from("subscription_plans")
      .update({ is_active: !p.is_active })
      .eq("id", p.id);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: !p.is_active ? "Plano ativado" : "Plano desativado" });
    refetch();
  };

  const remove = async (p: Plan) => {
    if (!confirm(`Excluir o plano "${p.name}"? Esta ação não pode ser desfeita.`)) return;
    const { error } = await (supabase as any)
      .from("subscription_plans")
      .delete()
      .eq("id", p.id);
    if (error) {
      toast({ title: "Erro ao excluir", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Plano excluído" });
    refetch();
  };

  const save = async () => {
    if (!editing) return;
    if (!editing.tier?.trim() || !editing.name?.trim()) {
      toast({ title: "Preencha tier e nome", variant: "destructive" });
      return;
    }
    setSaving(true);
    const payload = {
      tier: editing.tier!.trim().toLowerCase(),
      name: editing.name!.trim(),
      price: Number(editing.price) || 0,
      setup_fee: Number(editing.setup_fee) || 0,
      max_items: Number(editing.max_items) || 5,
      ai_generations_per_day: Number(editing.ai_generations_per_day) || 0,
      color: editing.color,
      border_color: editing.border_color,
      badge_color: editing.badge_color,
      benefits: editing.benefits || [],
      category: editing.category,
      is_active: !!editing.is_active,
      is_popular: !!editing.is_popular,
      sort_order: Number(editing.sort_order) || 0,
    };
    const op = isNew
      ? (supabase as any).from("subscription_plans").insert(payload)
      : (supabase as any).from("subscription_plans").update(payload).eq("id", editing.id);
    const { error } = await op;
    setSaving(false);
    if (error) {
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: isNew ? "Plano criado" : "Plano atualizado" });
    close();
    refetch();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h3 className="font-display font-bold text-lg text-foreground">Planos da Plataforma</h3>
          <p className="text-sm text-muted-foreground">Edite preços, benefícios e visibilidade. Alterações refletem em <code className="px-1.5 py-0.5 bg-secondary rounded">/pacotes</code>.</p>
        </div>
        <button
          onClick={openNew}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:opacity-90"
        >
          <Plus size={16} /> Novo Plano
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {plans.map((p) => (
          <motion.div
            key={p.id}
            layout
            className={`rounded-2xl border-2 ${p.border_color} bg-card overflow-hidden ${!p.is_active ? "opacity-60" : ""}`}
          >
            <div className={`p-4 bg-gradient-to-br ${p.color} text-white`}>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-display font-bold text-lg truncate">{p.name}</h4>
                    {p.is_popular && <Star size={14} className="fill-current" />}
                  </div>
                  <p className="text-xs text-white/70 mt-0.5">tier: <code>{p.tier}</code></p>
                </div>
                <span className="text-xs font-bold px-2 py-1 rounded-full bg-white/20">
                  #{p.sort_order}
                </span>
              </div>
              <div className="mt-2">
                <span className="font-display font-bold text-2xl">
                  R$ {p.price.toFixed(2).replace(".", ",")}
                </span>
                <span className="text-white/70 text-xs">/mês</span>
              </div>
            </div>

            <div className="p-4 space-y-3">
              <div className="flex flex-wrap gap-2 text-xs">
                <span className="px-2 py-1 rounded bg-secondary text-foreground font-medium">
                  {CATEGORY_OPTIONS.find((c) => c.value === p.category)?.label || p.category}
                </span>
                <span className="px-2 py-1 rounded bg-secondary text-foreground font-medium">
                  {p.max_items >= 9999 ? "∞" : p.max_items} anúncios
                </span>
              </div>
              <p className="text-xs text-muted-foreground">{p.benefits.length} benefícios</p>

              <div className="flex flex-wrap gap-2 pt-2 border-t border-border">
                <button
                  onClick={() => openEdit(p)}
                  className="flex-1 inline-flex items-center justify-center gap-1 px-3 py-2 rounded-lg bg-secondary text-foreground hover:bg-accent text-xs font-bold"
                >
                  <Pencil size={12} /> Editar
                </button>
                <button
                  onClick={() => toggleActive(p)}
                  className={`inline-flex items-center justify-center gap-1 px-3 py-2 rounded-lg text-xs font-bold ${
                    p.is_active
                      ? "bg-emerald-500/15 text-emerald-600 hover:bg-emerald-500/25"
                      : "bg-muted text-muted-foreground hover:bg-accent"
                  }`}
                  title={p.is_active ? "Desativar" : "Ativar"}
                >
                  {p.is_active ? <Eye size={12} /> : <EyeOff size={12} />}
                  {p.is_active ? "Ativo" : "Oculto"}
                </button>
                <button
                  onClick={() => remove(p)}
                  className="inline-flex items-center justify-center gap-1 px-3 py-2 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 text-xs font-bold"
                  title="Excluir"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Editor Modal */}
      <AnimatePresence>
        {editing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
            onClick={close}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-card border border-border rounded-2xl w-full max-w-2xl my-8 max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 z-10 flex items-center justify-between p-5 border-b border-border bg-card">
                <h3 className="font-display font-bold text-lg text-foreground">
                  {isNew ? "Novo Plano" : `Editar: ${editing.name}`}
                </h3>
                <button onClick={close} className="p-2 rounded-lg hover:bg-accent text-muted-foreground">
                  <X size={18} />
                </button>
              </div>

              <div className="p-5 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Field label="Identificador (tier)" hint="único, sem espaços (ex: vip, black)">
                    <input
                      type="text"
                      value={editing.tier || ""}
                      onChange={(e) => setEditing({ ...editing, tier: e.target.value })}
                      disabled={!isNew}
                      className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm font-mono disabled:opacity-60"
                      placeholder="ex: premium"
                    />
                  </Field>
                  <Field label="Nome exibido">
                    <input
                      type="text"
                      value={editing.name || ""}
                      onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm"
                      placeholder="ex: VIP"
                    />
                  </Field>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <Field label="Preço/mês (R$)">
                    <input
                      type="number" step="0.01"
                      value={editing.price ?? 0}
                      onChange={(e) => setEditing({ ...editing, price: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm"
                    />
                  </Field>
                  <Field label="Setup (R$)">
                    <input
                      type="number" step="0.01"
                      value={editing.setup_fee ?? 0}
                      onChange={(e) => setEditing({ ...editing, setup_fee: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm"
                    />
                  </Field>
                  <Field label="Max anúncios">
                    <input
                      type="number"
                      value={editing.max_items ?? 5}
                      onChange={(e) => setEditing({ ...editing, max_items: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm"
                    />
                  </Field>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <Field label="Categoria">
                    <select
                      value={editing.category || "individual"}
                      onChange={(e) => setEditing({ ...editing, category: e.target.value as any })}
                      className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm"
                    >
                      {CATEGORY_OPTIONS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                    </select>
                  </Field>
                  <Field label="Ordem">
                    <input
                      type="number"
                      value={editing.sort_order ?? 0}
                      onChange={(e) => setEditing({ ...editing, sort_order: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm"
                    />
                  </Field>
                  <Field label="Status">
                    <div className="flex gap-2">
                      <label className={`flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg border cursor-pointer text-xs font-bold transition-colors ${
                        editing.is_active
                          ? "border-primary bg-primary text-primary-foreground shadow-sm"
                          : "border-border bg-secondary text-foreground hover:bg-accent"
                      }`}>
                        <input className="sr-only" type="checkbox" checked={!!editing.is_active}
                          onChange={(e) => setEditing({ ...editing, is_active: e.target.checked })} />
                        {editing.is_active && <Check size={13} />}
                        Ativo
                      </label>
                      <label className={`flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg border cursor-pointer text-xs font-bold transition-colors ${
                        editing.is_popular
                          ? "border-primary bg-primary text-primary-foreground shadow-sm"
                          : "border-border bg-secondary text-foreground hover:bg-accent"
                      }`}>
                        <input className="sr-only" type="checkbox" checked={!!editing.is_popular}
                          onChange={(e) => setEditing({ ...editing, is_popular: e.target.checked })} />
                        {editing.is_popular && <Check size={13} />}
                        Popular
                      </label>
                    </div>
                  </Field>
                </div>

                <Field label="Cor (gradient Tailwind)">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {COLOR_PRESETS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setEditing({ ...editing, color: c })}
                        className={`h-10 rounded-lg bg-gradient-to-br ${c} border-2 ${
                          editing.color === c ? "border-primary ring-2 ring-primary/30" : "border-transparent"
                        }`}
                      />
                    ))}
                  </div>
                  <input
                    type="text"
                    value={editing.color || ""}
                    onChange={(e) => setEditing({ ...editing, color: e.target.value })}
                    className="w-full mt-2 px-3 py-2 rounded-lg border border-border bg-background text-foreground text-xs font-mono"
                    placeholder="from-slate-500 to-slate-600"
                  />
                </Field>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Field label="Border color (Tailwind)">
                    <input
                      type="text"
                      value={editing.border_color || ""}
                      onChange={(e) => setEditing({ ...editing, border_color: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-xs font-mono"
                    />
                  </Field>
                  <Field label="Badge color (Tailwind)">
                    <input
                      type="text"
                      value={editing.badge_color || ""}
                      onChange={(e) => setEditing({ ...editing, badge_color: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-xs font-mono"
                    />
                  </Field>
                </div>

                <Field label={`Benefícios (${(editing.benefits || []).length})`}>
                  <div className="space-y-2">
                    {(editing.benefits || []).map((b, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <GripVertical size={14} className="text-muted-foreground flex-shrink-0" />
                        <input
                          type="text"
                          value={b}
                          onChange={(e) => {
                            const arr = [...(editing.benefits || [])];
                            arr[i] = e.target.value;
                            setEditing({ ...editing, benefits: arr });
                          }}
                          className="flex-1 px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const arr = [...(editing.benefits || [])];
                            arr.splice(i, 1);
                            setEditing({ ...editing, benefits: arr });
                          }}
                          className="p-2 rounded-lg hover:bg-destructive/10 text-destructive"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => setEditing({ ...editing, benefits: [...(editing.benefits || []), ""] })}
                      className="w-full inline-flex items-center justify-center gap-1 px-3 py-2 rounded-lg border border-dashed border-border text-muted-foreground hover:bg-secondary text-xs font-bold"
                    >
                      <Plus size={12} /> Adicionar benefício
                    </button>
                  </div>
                </Field>
              </div>

              <div className="sticky bottom-0 flex items-center justify-end gap-2 p-5 border-t border-border bg-card">
                <button onClick={close} className="px-4 py-2 rounded-lg text-foreground hover:bg-accent text-sm font-bold">
                  Cancelar
                </button>
                <button
                  onClick={save}
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-bold text-sm hover:opacity-90 disabled:opacity-50"
                >
                  {saving ? <>Salvando...</> : <><Save size={14} /> Salvar</>}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="block text-xs font-bold text-foreground">{label}</label>
      {children}
      {hint && <p className="text-[10px] text-muted-foreground">{hint}</p>}
    </div>
  );
}
