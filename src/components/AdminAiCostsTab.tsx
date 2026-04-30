import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Brain, Save, RotateCcw, Sparkles, DollarSign, Bot, Zap } from "lucide-react";

type ToolCost = {
  id: string;
  tool_key: string;
  label: string;
  cost: number;
  description: string | null;
  category: string;
  is_session_based: boolean;
  session_window_minutes: number;
};

const CREDIT_PRICE_CENTS = 25; // R$ 0,25 por crédito

const CATEGORY_META: Record<string, { label: string; icon: any; color: string }> = {
  conteudo: { label: "Conteúdo", icon: Sparkles, color: "from-purple-500 to-pink-500" },
  analise: { label: "Análise", icon: Brain, color: "from-blue-500 to-cyan-500" },
  bots: { label: "Bots de Chat", icon: Bot, color: "from-emerald-500 to-teal-500" },
  suporte: { label: "Suporte", icon: Zap, color: "from-amber-500 to-orange-500" },
  geral: { label: "Geral", icon: DollarSign, color: "from-slate-500 to-zinc-500" },
};

export default function AdminAiCostsTab() {
  const [items, setItems] = useState<ToolCost[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [dirty, setDirty] = useState<Record<string, Partial<ToolCost>>>({});

  const load = async () => {
    setLoading(true);
    const { data, error } = await (supabase as any)
      .from("ai_tool_costs")
      .select("*")
      .order("category", { ascending: true })
      .order("label", { ascending: true });
    if (error) toast.error("Erro ao carregar custos");
    setItems(data || []);
    setDirty({});
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const updateField = (id: string, field: keyof ToolCost, value: any) => {
    setItems(prev => prev.map(it => it.id === id ? { ...it, [field]: value } : it));
    setDirty(prev => ({ ...prev, [id]: { ...(prev[id] || {}), [field]: value } }));
  };

  const save = async (item: ToolCost) => {
    setSaving(item.id);
    const patch = dirty[item.id];
    if (!patch) { setSaving(null); return; }
    const { error } = await (supabase as any)
      .from("ai_tool_costs")
      .update(patch)
      .eq("id", item.id);
    setSaving(null);
    if (error) {
      toast.error("Erro ao salvar: " + error.message);
      return;
    }
    setDirty(prev => { const { [item.id]: _, ...rest } = prev; return rest; });
    toast.success(`✅ ${item.label} atualizado`);
  };

  const grouped = items.reduce<Record<string, ToolCost[]>>((acc, it) => {
    (acc[it.category] = acc[it.category] || []).push(it);
    return acc;
  }, {});

  const totalTools = items.length;
  const avgCost = items.length ? (items.reduce((s, i) => s + i.cost, 0) / items.length).toFixed(1) : "0";

  return (
    <div className="space-y-6">
      {/* Header épico */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-600 via-fuchsia-600 to-pink-600 p-6 lg:p-8 text-white shadow-2xl">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.2),transparent_50%)]" />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-3 bg-white/20 backdrop-blur rounded-xl">
                <Brain className="w-7 h-7" />
              </div>
              <div>
                <h2 className="text-2xl lg:text-3xl font-bold tracking-tight">Custos de IA</h2>
                <p className="text-white/80 text-sm">Defina quanto cada ferramenta consome em créditos</p>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white/10 backdrop-blur rounded-xl p-3 text-center min-w-[90px]">
              <div className="text-2xl font-bold">{totalTools}</div>
              <div className="text-[10px] uppercase tracking-wider text-white/70">Ferramentas</div>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-xl p-3 text-center min-w-[90px]">
              <div className="text-2xl font-bold">{avgCost}</div>
              <div className="text-[10px] uppercase tracking-wider text-white/70">Custo médio</div>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-xl p-3 text-center min-w-[90px]">
              <div className="text-2xl font-bold">R$ {(CREDIT_PRICE_CENTS / 100).toFixed(2)}</div>
              <div className="text-[10px] uppercase tracking-wider text-white/70">Por crédito</div>
            </div>
          </div>
        </div>
      </div>

      {/* Aviso */}
      <div className="rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-900 p-3 text-sm text-amber-900 dark:text-amber-200 flex items-start gap-2">
        <Zap className="w-4 h-4 mt-0.5 flex-shrink-0" />
        <p>
          Mudanças entram em vigor em até <strong>1 minuto</strong> nas edge functions (cache).
          Bots marcados como <strong>"por janela"</strong> cobram 1x a cada N minutos por visitante.
        </p>
      </div>

      {loading && <p className="text-muted-foreground text-center py-8">Carregando...</p>}

      {!loading && Object.entries(grouped).map(([cat, tools]) => {
        const meta = CATEGORY_META[cat] || CATEGORY_META.geral;
        const Icon = meta.icon;
        return (
          <div key={cat} className="space-y-3">
            <div className="flex items-center gap-2">
              <div className={`p-2 rounded-lg bg-gradient-to-br ${meta.color} text-white shadow-sm`}>
                <Icon className="w-4 h-4" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">{meta.label}</h3>
              <Badge variant="secondary" className="ml-auto">{tools.length}</Badge>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              {tools.map(item => {
                const isDirty = !!dirty[item.id];
                return (
                  <Card key={item.id} className={`transition-all ${isDirty ? "ring-2 ring-violet-500/50 shadow-lg" : ""}`}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <CardTitle className="text-base">{item.label}</CardTitle>
                          <code className="text-[10px] text-muted-foreground font-mono">{item.tool_key}</code>
                        </div>
                        {isDirty && <Badge variant="outline" className="text-violet-600 border-violet-300">não salvo</Badge>}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label className="text-xs">Custo (créditos)</Label>
                          <Input
                            type="number"
                            min={0}
                            value={item.cost}
                            onChange={e => updateField(item.id, "cost", parseInt(e.target.value) || 0)}
                            className="font-bold text-lg"
                          />
                          <p className="text-[10px] text-muted-foreground mt-1">
                            ≈ R$ {((item.cost * CREDIT_PRICE_CENTS) / 100).toFixed(2)} por uso
                          </p>
                        </div>
                        <div>
                          <Label className="text-xs">Janela (min)</Label>
                          <Input
                            type="number"
                            min={1}
                            value={item.session_window_minutes}
                            disabled={!item.is_session_based}
                            onChange={e => updateField(item.id, "session_window_minutes", parseInt(e.target.value) || 30)}
                          />
                          <p className="text-[10px] text-muted-foreground mt-1">
                            {item.is_session_based ? "Tempo entre cobranças" : "(Cobra por uso)"}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between rounded-md border p-2">
                        <div>
                          <Label className="text-xs font-medium">Cobrar por janela</Label>
                          <p className="text-[10px] text-muted-foreground">Em vez de cobrar por mensagem</p>
                        </div>
                        <Switch
                          checked={item.is_session_based}
                          onCheckedChange={v => updateField(item.id, "is_session_based", v)}
                        />
                      </div>

                      <div>
                        <Label className="text-xs">Descrição</Label>
                        <Textarea
                          rows={2}
                          value={item.description || ""}
                          onChange={e => updateField(item.id, "description", e.target.value)}
                          className="text-xs resize-none"
                        />
                      </div>

                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => save(item)}
                          disabled={!isDirty || saving === item.id}
                          className="flex-1"
                        >
                          <Save className="w-3.5 h-3.5 mr-1.5" />
                          {saving === item.id ? "Salvando..." : "Salvar"}
                        </Button>
                        {isDirty && (
                          <Button size="sm" variant="outline" onClick={load}>
                            <RotateCcw className="w-3.5 h-3.5" />
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
