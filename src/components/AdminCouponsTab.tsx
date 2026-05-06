import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAllPlans } from "@/hooks/usePlans";
import {
  Pencil, Plus, Trash2, X, Check, Eye, EyeOff, Save, Ticket, Copy,
  Calendar, Percent, Settings, TrendingUp,
} from "lucide-react";

interface Coupon {
  id: string;
  code: string;
  description: string | null;
  discount_percent: number | null;
  discount_type: "percent" | "fixed";
  discount_amount_cents: number | null;
  applies_to: "all" | "monthly" | "annual";
  applicable_tiers: string[] | null;
  max_uses: number | null;
  uses_count: number;
  valid_until: string | null;
  is_active: boolean;
  stripe_coupon_id: string | null;
  created_at: string;
}

const APPLIES_OPTIONS = [
  { value: "all", label: "Todos os períodos" },
  { value: "monthly", label: "Apenas Mensal" },
  { value: "annual", label: "Apenas Anual" },
];

function emptyCoupon(): Partial<Coupon> {
  return {
    code: "",
    description: "",
    discount_type: "percent",
    discount_percent: 10,
    discount_amount_cents: null,
    applies_to: "all",
    applicable_tiers: null,
    max_uses: null,
    valid_until: null,
    is_active: true,
  };
}

export default function AdminCouponsTab() {
  const { plans } = useAllPlans();
  const { toast } = useToast();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Partial<Coupon> | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [annualDiscount, setAnnualDiscount] = useState<number>(20);
  const [savingAnnual, setSavingAnnual] = useState(false);

  const refetch = useCallback(async () => {
    setLoading(true);
    const { data } = await (supabase as any)
      .from("discount_coupons")
      .select("*")
      .order("created_at", { ascending: false });
    setCoupons((data as Coupon[]) || []);
    const { data: setting } = await (supabase as any)
      .from("platform_settings")
      .select("value")
      .eq("key", "annual_discount_percent")
      .maybeSingle();
    if (setting?.value) setAnnualDiscount(parseInt(setting.value) || 20);
    setLoading(false);
  }, []);

  useEffect(() => { refetch(); }, [refetch]);

  const openEdit = (c: Coupon) => { setEditing({ ...c }); setIsNew(false); };
  const openNew = () => { setEditing(emptyCoupon()); setIsNew(true); };
  const close = () => { setEditing(null); setIsNew(false); };

  const toggleActive = async (c: Coupon) => {
    const { error } = await (supabase as any)
      .from("discount_coupons")
      .update({ is_active: !c.is_active })
      .eq("id", c.id);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: !c.is_active ? "Cupom ativado" : "Cupom desativado" });
    refetch();
  };

  const remove = async (c: Coupon) => {
    if (!confirm(`Excluir o cupom "${c.code}"? Esta ação não pode ser desfeita.`)) return;
    const { error } = await (supabase as any)
      .from("discount_coupons")
      .delete()
      .eq("id", c.id);
    if (error) {
      toast({ title: "Erro ao excluir", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Cupom excluído" });
    refetch();
  };

  const save = async () => {
    if (!editing) return;
    if (!editing.code?.trim()) {
      toast({ title: "Informe o código do cupom", variant: "destructive" });
      return;
    }
    const dtype = editing.discount_type || "percent";
    if (dtype === "percent") {
      if (!editing.discount_percent || editing.discount_percent < 1 || editing.discount_percent > 100) {
        toast({ title: "Desconto deve ser entre 1% e 100%", variant: "destructive" });
        return;
      }
    } else {
      if (!editing.discount_amount_cents || editing.discount_amount_cents < 100) {
        toast({ title: "Valor mínimo do cupom: R$ 1,00", variant: "destructive" });
        return;
      }
    }
    setSaving(true);
    const payload = {
      code: editing.code!.trim().toUpperCase(),
      description: editing.description?.trim() || null,
      discount_type: dtype,
      discount_percent: dtype === "percent" ? Number(editing.discount_percent) : null,
      discount_amount_cents: dtype === "fixed" ? Number(editing.discount_amount_cents) : null,
      applies_to: editing.applies_to || "all",
      applicable_tiers: editing.applicable_tiers && editing.applicable_tiers.length > 0
        ? editing.applicable_tiers : null,
      max_uses: editing.max_uses ? Number(editing.max_uses) : null,
      valid_until: editing.valid_until || null,
      is_active: !!editing.is_active,
    };
    const op = isNew
      ? (supabase as any).from("discount_coupons").insert(payload)
      : (supabase as any).from("discount_coupons").update(payload).eq("id", editing.id);
    const { error } = await op;
    setSaving(false);
    if (error) {
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: isNew ? "Cupom criado" : "Cupom atualizado" });
    close();
    refetch();
  };

  const saveAnnualDiscount = async () => {
    setSavingAnnual(true);
    const { error } = await (supabase as any)
      .from("platform_settings")
      .upsert({ key: "annual_discount_percent", value: String(annualDiscount) }, { onConflict: "key" });
    setSavingAnnual(false);
    if (error) {
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: `Desconto anual salvo: ${annualDiscount}%` });
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({ title: `Código "${code}" copiado` });
  };

  const toggleTier = (tier: string) => {
    if (!editing) return;
    const current = editing.applicable_tiers || [];
    if (current.includes(tier)) {
      setEditing({ ...editing, applicable_tiers: current.filter((t) => t !== tier) });
    } else {
      setEditing({ ...editing, applicable_tiers: [...current, tier] });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Configuração de Desconto Anual */}
      <div className="bg-gradient-to-br from-primary/10 to-primary/5 border-2 border-primary/30 rounded-2xl p-5">
        <div className="flex items-start gap-3 mb-4">
          <div className="p-2 rounded-xl bg-primary/15">
            <Settings size={20} className="text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="font-display font-bold text-lg text-foreground">Desconto Anual Global</h3>
            <p className="text-sm text-muted-foreground">
              Aplicado quando o cliente seleciona a aba <strong>Anual</strong> em <code className="px-1.5 py-0.5 bg-secondary rounded text-xs">/pacotes</code>.
              Esse desconto é cumulativo com qualquer cupom usado.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 flex-1 min-w-[200px]">
            <input
              type="number"
              min={0}
              max={100}
              value={annualDiscount}
              onChange={(e) => setAnnualDiscount(parseInt(e.target.value) || 0)}
              className="w-24 px-3 py-2.5 rounded-xl border-2 border-border bg-background text-foreground text-lg font-bold text-center"
            />
            <span className="font-bold text-foreground">% de desconto</span>
          </div>
          <button
            onClick={saveAnnualDiscount}
            disabled={savingAnnual}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:opacity-90 disabled:opacity-50"
          >
            <Save size={16} />
            {savingAnnual ? "Salvando..." : "Salvar"}
          </button>
        </div>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h3 className="font-display font-bold text-lg text-foreground flex items-center gap-2">
            <Ticket size={20} className="text-primary" />
            Cupons de Desconto
          </h3>
          <p className="text-sm text-muted-foreground">
            Crie códigos promocionais que clientes podem aplicar no checkout em <code className="px-1.5 py-0.5 bg-secondary rounded">/pacotes</code>.
          </p>
        </div>
        <button
          onClick={openNew}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:opacity-90"
        >
          <Plus size={16} /> Novo Cupom
        </button>
      </div>

      {/* Lista */}
      {coupons.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-border rounded-2xl">
          <Ticket size={48} className="mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground font-medium">Nenhum cupom criado ainda.</p>
          <button
            onClick={openNew}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground font-bold text-sm"
          >
            <Plus size={16} /> Criar primeiro cupom
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {coupons.map((c) => {
            const expired = c.valid_until && new Date(c.valid_until) < new Date();
            const exhausted = c.max_uses && c.uses_count >= c.max_uses;
            const usable = c.is_active && !expired && !exhausted;
            return (
              <motion.div
                key={c.id}
                layout
                className={`rounded-2xl border-2 bg-card overflow-hidden ${
                  usable ? "border-primary/40" : "border-border opacity-70"
                }`}
              >
                <div className="p-4 bg-gradient-to-br from-primary to-primary/70 text-primary-foreground">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <code className="font-mono font-extrabold text-xl tracking-wider">{c.code}</code>
                        <button
                          onClick={() => copyCode(c.code)}
                          className="p-1 rounded hover:bg-white/20 text-primary-foreground/80"
                          title="Copiar código"
                        >
                          <Copy size={14} />
                        </button>
                      </div>
                      {c.description && (
                        <p className="text-xs text-primary-foreground/80 mt-1 line-clamp-2">{c.description}</p>
                      )}
                    </div>
                    <span className="text-2xl font-display font-extrabold flex items-center">
                      {c.discount_percent}<Percent size={16} className="ml-0.5" />
                    </span>
                  </div>
                </div>

                <div className="p-4 space-y-2 text-xs">
                  <div className="flex items-center gap-2 text-foreground">
                    <Calendar size={12} className="text-muted-foreground" />
                    <span>
                      {APPLIES_OPTIONS.find((o) => o.value === c.applies_to)?.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-foreground">
                    <TrendingUp size={12} className="text-muted-foreground" />
                    <span>
                      {c.uses_count} {c.max_uses ? `/ ${c.max_uses}` : ""} usos
                    </span>
                  </div>
                  {c.valid_until && (
                    <div className={`flex items-center gap-2 ${expired ? "text-destructive" : "text-foreground"}`}>
                      <Calendar size={12} />
                      <span>
                        {expired ? "Expirado em " : "Válido até "}
                        {new Date(c.valid_until).toLocaleDateString("pt-BR")}
                      </span>
                    </div>
                  )}
                  {c.applicable_tiers && c.applicable_tiers.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {c.applicable_tiers.map((t) => (
                        <span key={t} className="px-2 py-0.5 rounded-full bg-secondary text-foreground text-[10px] font-bold">
                          {t}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2 pt-3 border-t border-border">
                    <button
                      onClick={() => openEdit(c)}
                      className="flex-1 inline-flex items-center justify-center gap-1 px-2 py-2 rounded-lg bg-secondary text-foreground hover:bg-accent text-xs font-bold"
                    >
                      <Pencil size={12} /> Editar
                    </button>
                    <button
                      onClick={() => toggleActive(c)}
                      className={`inline-flex items-center justify-center gap-1 px-3 py-2 rounded-lg text-xs font-bold ${
                        c.is_active
                          ? "bg-emerald-500/15 text-emerald-600 hover:bg-emerald-500/25"
                          : "bg-muted text-muted-foreground hover:bg-accent"
                      }`}
                      title={c.is_active ? "Desativar" : "Ativar"}
                    >
                      {c.is_active ? <Eye size={12} /> : <EyeOff size={12} />}
                    </button>
                    <button
                      onClick={() => remove(c)}
                      className="inline-flex items-center justify-center gap-1 px-3 py-2 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 text-xs font-bold"
                      title="Excluir"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

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
                  {isNew ? "Novo Cupom" : `Editar: ${editing.code}`}
                </h3>
                <button onClick={close} className="p-2 rounded-lg hover:bg-accent text-muted-foreground">
                  <X size={18} />
                </button>
              </div>

              <div className="p-5 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Field label="Código (sem espaços)" hint="MAIÚSCULAS, sem acentos">
                    <input
                      type="text"
                      value={editing.code || ""}
                      onChange={(e) => setEditing({ ...editing, code: e.target.value.toUpperCase().replace(/\s/g, "") })}
                      className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm font-mono uppercase tracking-wider"
                      placeholder="FUNDADOR50"
                    />
                  </Field>
                  <Field label="Desconto (%)">
                    <input
                      type="number" min={1} max={100}
                      value={editing.discount_percent ?? 10}
                      onChange={(e) => setEditing({ ...editing, discount_percent: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm font-bold"
                    />
                  </Field>
                </div>

                <Field label="Descrição (opcional)">
                  <input
                    type="text"
                    value={editing.description || ""}
                    onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm"
                    placeholder="Ex: Promoção de lançamento — Membros Fundadores"
                  />
                </Field>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Field label="Aplica em">
                    <select
                      value={editing.applies_to || "all"}
                      onChange={(e) => setEditing({ ...editing, applies_to: e.target.value as any })}
                      className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm"
                    >
                      {APPLIES_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </Field>
                  <Field label="Máx. de usos" hint="Vazio = ilimitado">
                    <input
                      type="number" min={1}
                      value={editing.max_uses ?? ""}
                      onChange={(e) => setEditing({ ...editing, max_uses: e.target.value ? parseInt(e.target.value) : null })}
                      className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm"
                      placeholder="Ilimitado"
                    />
                  </Field>
                </div>

                <Field label="Válido até (opcional)" hint="Vazio = sem expiração">
                  <input
                    type="datetime-local"
                    value={editing.valid_until ? new Date(editing.valid_until).toISOString().slice(0, 16) : ""}
                    onChange={(e) => setEditing({ ...editing, valid_until: e.target.value ? new Date(e.target.value).toISOString() : null })}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm"
                  />
                </Field>

                <Field label="Planos elegíveis" hint="Não marcar nenhum = vale para todos">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {plans.map((p) => {
                      const checked = (editing.applicable_tiers || []).includes(p.tier);
                      return (
                        <label
                          key={p.tier}
                          className={`flex items-center gap-2 px-3 py-2 rounded-lg border-2 cursor-pointer text-xs font-bold transition-colors ${
                            checked
                              ? "border-primary bg-primary/10 text-foreground"
                              : "border-border bg-secondary text-muted-foreground hover:bg-accent"
                          }`}
                        >
                          <input
                            type="checkbox"
                            className="sr-only"
                            checked={checked}
                            onChange={() => toggleTier(p.tier)}
                          />
                          {checked && <Check size={12} className="text-primary" />}
                          {p.name}
                        </label>
                      );
                    })}
                  </div>
                </Field>

                <Field label="Status">
                  <label className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 cursor-pointer text-sm font-bold transition-colors ${
                    editing.is_active
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-secondary text-foreground hover:bg-accent"
                  }`}>
                    <input className="sr-only" type="checkbox" checked={!!editing.is_active}
                      onChange={(e) => setEditing({ ...editing, is_active: e.target.checked })} />
                    {editing.is_active ? <Check size={14} /> : <X size={14} />}
                    {editing.is_active ? "Cupom Ativo" : "Cupom Desativado"}
                  </label>
                </Field>
              </div>

              <div className="sticky bottom-0 flex justify-end gap-2 p-4 border-t border-border bg-card">
                <button
                  onClick={close}
                  className="px-4 py-2 rounded-xl bg-secondary text-foreground font-bold text-sm hover:bg-accent"
                >
                  Cancelar
                </button>
                <button
                  onClick={save}
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:opacity-90 disabled:opacity-50"
                >
                  <Save size={14} />
                  {saving ? "Salvando..." : "Salvar Cupom"}
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
    <label className="block">
      <span className="block text-xs font-bold text-foreground mb-1.5">{label}</span>
      {hint && <span className="block text-[10px] text-muted-foreground mb-1">{hint}</span>}
      {children}
    </label>
  );
}
