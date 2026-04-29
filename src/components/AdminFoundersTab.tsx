import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Crown, Loader2, Plus, RefreshCw, Trash2, Power, Repeat, Sparkles } from "lucide-react";

type InheritedTier =
  | "start"
  | "premium"
  | "vip"
  | "essencial_empresa"
  | "premium_empresa"
  | "prime_empresa";

type Lot = {
  id: string;
  category: "individual" | "enterprise";
  lot_number: number;
  price: number;
  total_slots: number;
  used_slots: number;
  is_active: boolean;
  inherited_tier: InheritedTier;
  ia_credits: number;
};

type Settings = {
  is_enabled: boolean;
  loop_enabled: boolean;
  price_increment: number;
  default_slots: number;
};

const CAT_LABEL: Record<string, string> = {
  individual: "Corretor Fundador",
  enterprise: "Empresa Fundadora",
};

const TIER_OPTIONS: { value: InheritedTier; label: string; defaultCredits: number; category: "individual" | "enterprise" }[] = [
  { value: "start", label: "Start", defaultCredits: 250, category: "individual" },
  { value: "premium", label: "Premium", defaultCredits: 600, category: "individual" },
  { value: "vip", label: "VIP", defaultCredits: 1000, category: "individual" },
  { value: "essencial_empresa", label: "Essencial Empresa", defaultCredits: 2000, category: "enterprise" },
  { value: "premium_empresa", label: "Premium Empresa", defaultCredits: 2000, category: "enterprise" },
  { value: "prime_empresa", label: "Prime Empresa (Black)", defaultCredits: 3500, category: "enterprise" },
];

const TIER_LABEL: Record<string, string> = Object.fromEntries(TIER_OPTIONS.map(t => [t.value, t.label]));

export default function AdminFoundersTab() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<Settings>({
    is_enabled: true,
    loop_enabled: true,
    price_increment: 30,
    default_slots: 500,
  });
  const [lots, setLots] = useState<Lot[]>([]);

  const load = async () => {
    setLoading(true);
    const [{ data: s }, { data: l }] = await Promise.all([
      supabase.from("founder_settings" as any).select("*").eq("id", 1).maybeSingle(),
      supabase.from("founder_lots").select("*").order("category").order("lot_number"),
    ]);
    if (s) setSettings(s as any);
    if (l) setLots(l as any);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const saveSettings = async (patch: Partial<Settings>) => {
    const next = { ...settings, ...patch };
    setSettings(next);
    const { error } = await (supabase.from("founder_settings" as any) as any)
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq("id", 1);
    if (error) toast.error("Erro ao salvar"); else toast.success("Configuração salva");
  };

  const updateLot = async (id: string, patch: Partial<Lot>) => {
    setSaving(true);
    const { error } = await supabase.from("founder_lots").update(patch).eq("id", id);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Lote atualizado");
    load();
  };

  const createLot = async (category: "individual" | "enterprise") => {
    const catLots = lots.filter(l => l.category === category);
    const nextNumber = (catLots.reduce((m, l) => Math.max(m, l.lot_number), 0)) + 1;
    const last = catLots[catLots.length - 1];
    const lastPrice = last ? last.price : 97;
    const newPrice = Number(lastPrice) + Number(settings.price_increment || 30);
    // Herda do último lote da categoria; se não houver, usa default sensato
    const defaultTier: InheritedTier = last?.inherited_tier
      ?? (category === "individual" ? "vip" : "prime_empresa");
    const defaultCredits = last?.ia_credits
      ?? (category === "individual" ? 1000 : 3500);
    const { error } = await supabase.from("founder_lots").insert({
      category, lot_number: nextNumber, price: newPrice,
      total_slots: settings.default_slots, used_slots: 0, is_active: true,
      inherited_tier: defaultTier,
      ia_credits: defaultCredits,
    } as any);
    if (error) { toast.error(error.message); return; }
    toast.success(`Lote ${nextNumber} criado em R$ ${newPrice} (herda ${TIER_LABEL[defaultTier]})`);
    load();
  };

  const deleteLot = async (id: string) => {
    if (!confirm("Excluir este lote? Essa ação não pode ser desfeita.")) return;
    const { error } = await supabase.from("founder_lots").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Lote excluído");
    load();
  };

  const resetUsed = async (id: string) => {
    if (!confirm("Resetar o contador de vagas usadas para 0?")) return;
    await updateLot(id, { used_slots: 0 });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  const renderCategory = (category: "individual" | "enterprise") => {
    const catLots = lots.filter(l => l.category === category);
    const totalRevenue = catLots.reduce((sum, l) => sum + (Number(l.price) * l.used_slots), 0);
    const totalUsed = catLots.reduce((sum, l) => sum + l.used_slots, 0);
    const totalSlots = catLots.reduce((sum, l) => sum + l.total_slots, 0);

    return (
      <Card key={category}>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Crown className="text-amber-500" size={20} />
                {CAT_LABEL[category]}
              </CardTitle>
              <CardDescription>
                {totalUsed} / {totalSlots} vagas usadas · Receita: R$ {totalRevenue.toLocaleString("pt-BR")}
              </CardDescription>
            </div>
            <Button size="sm" onClick={() => createLot(category)}>
              <Plus size={14} className="mr-1" /> Novo lote
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {catLots.map(lot => {
            const isFull = lot.used_slots >= lot.total_slots;
            return (
              <div key={lot.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">Lote {lot.lot_number}</Badge>
                    {lot.is_active ? (
                      <Badge className="bg-green-500/10 text-green-600 border-green-500/30">Ativo</Badge>
                    ) : (
                      <Badge variant="secondary">Inativo</Badge>
                    )}
                    {isFull && <Badge className="bg-red-500/10 text-red-600 border-red-500/30">Esgotado</Badge>}
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={lot.is_active}
                      onCheckedChange={(v) => updateLot(lot.id, { is_active: v })}
                    />
                    <Button size="icon" variant="ghost" onClick={() => resetUsed(lot.id)} title="Resetar vagas usadas">
                      <RefreshCw size={14} />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => deleteLot(lot.id)} title="Excluir lote">
                      <Trash2 size={14} className="text-red-500" />
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <Label className="text-xs">Preço (R$)</Label>
                    <Input
                      type="number"
                      defaultValue={lot.price}
                      onBlur={(e) => {
                        const v = Number(e.target.value);
                        if (v !== Number(lot.price)) updateLot(lot.id, { price: v });
                      }}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Vagas totais</Label>
                    <Input
                      type="number"
                      defaultValue={lot.total_slots}
                      onBlur={(e) => {
                        const v = Number(e.target.value);
                        if (v !== lot.total_slots) updateLot(lot.id, { total_slots: v });
                      }}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Vagas usadas</Label>
                    <Input type="number" value={lot.used_slots} disabled />
                  </div>
                </div>

                {/* Plano herdado + créditos IA */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t">
                  <div>
                    <Label className="text-xs flex items-center gap-1.5">
                      <Crown size={12} className="text-amber-500" />
                      Plano herdado pelo comprador
                    </Label>
                    <Select
                      value={lot.inherited_tier}
                      onValueChange={(v) => {
                        const opt = TIER_OPTIONS.find(o => o.value === v);
                        const patch: Partial<Lot> = { inherited_tier: v as InheritedTier };
                        if (opt && (lot.ia_credits === 0 || confirm(`Atualizar créditos de IA para o padrão do plano ${opt.label} (${opt.defaultCredits})?`))) {
                          patch.ia_credits = opt.defaultCredits;
                        }
                        updateLot(lot.id, patch);
                      }}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {TIER_OPTIONS
                          .filter(t => t.category === lot.category)
                          .map(t => (
                            <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      Define quais funções premium o membro recebe por 12 meses.
                    </p>
                  </div>
                  <div>
                    <Label className="text-xs flex items-center gap-1.5">
                      <Sparkles size={12} className="text-primary" />
                      Créditos de IA (uma vez)
                    </Label>
                    <Input
                      type="number"
                      defaultValue={lot.ia_credits}
                      onBlur={(e) => {
                        const v = Number(e.target.value);
                        if (v !== lot.ia_credits) updateLot(lot.id, { ia_credits: v });
                      }}
                    />
                    <p className="text-[10px] text-muted-foreground mt-1">
                      Concedidos no momento da compra; não renovam mensalmente.
                    </p>
                  </div>
                </div>

                <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all"
                    style={{ width: `${Math.min(100, (lot.used_slots / Math.max(1, lot.total_slots)) * 100)}%` }}
                  />
                </div>
              </div>
            );
          })}
          {catLots.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-6">
              Nenhum lote. Clique em "Novo lote" para criar.
            </p>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Configurações Globais */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Power size={20} /> Configurações da Campanha Fundador
          </CardTitle>
          <CardDescription>
            Controle global do sistema. Quando desativado, ninguém pode comprar Fundador.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div>
              <p className="font-semibold">Campanha ativa</p>
              <p className="text-xs text-muted-foreground">
                Ao desligar, o card Fundador some da página /pacotes e o checkout é bloqueado.
              </p>
            </div>
            <Switch
              checked={settings.is_enabled}
              onCheckedChange={(v) => saveSettings({ is_enabled: v })}
            />
          </div>

          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex items-start gap-2">
              <Repeat size={18} className="mt-1 text-primary" />
              <div>
                <p className="font-semibold">Loop automático de lotes</p>
                <p className="text-xs text-muted-foreground">
                  Quando o último lote ativo esgota, um novo lote é criado automaticamente com preço incrementado.
                </p>
              </div>
            </div>
            <Switch
              checked={settings.loop_enabled}
              onCheckedChange={(v) => saveSettings({ loop_enabled: v })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Incremento de preço por novo lote (R$)</Label>
              <Input
                type="number"
                defaultValue={settings.price_increment}
                onBlur={(e) => {
                  const v = Number(e.target.value);
                  if (v !== settings.price_increment) saveSettings({ price_increment: v });
                }}
              />
            </div>
            <div>
              <Label className="text-xs">Vagas padrão por novo lote</Label>
              <Input
                type="number"
                defaultValue={settings.default_slots}
                onBlur={(e) => {
                  const v = Number(e.target.value);
                  if (v !== settings.default_slots) saveSettings({ default_slots: v });
                }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Separator />

      {renderCategory("individual")}
      {renderCategory("enterprise")}
    </div>
  );
}
