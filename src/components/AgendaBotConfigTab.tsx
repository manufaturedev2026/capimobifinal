import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Bot, Copy, ExternalLink, Save, Sparkles, Calendar as CalendarIcon } from "lucide-react";

interface Props {
  sellerId: string;
  sellerSlug: string | null;
}

interface AgendaBotConfig {
  attendantName: string;
  attendantAvatar: string;
  openingMessage: string;
  successCtaLabel: string;
  successCtaUrl: string;
}

const DEFAULT: AgendaBotConfig = {
  attendantName: "Assistente de Agendamento",
  attendantAvatar: "",
  openingMessage: "Olá! 👋 Vou te ajudar a agendar uma visita ao imóvel. É rápido e você escolhe o melhor dia e horário. 📅",
  successCtaLabel: "💬 Falar no WhatsApp",
  successCtaUrl: "",
};

export default function AgendaBotConfigTab({ sellerId, sellerSlug }: Props) {
  const { toast } = useToast();
  const [cfg, setCfg] = useState<AgendaBotConfig>(DEFAULT);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const chatUrl = `${window.location.origin}/agenda/${sellerSlug || sellerId}/chat`;

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("platform_settings")
        .select("value")
        .eq("key", `agenda_bot_config_${sellerId}`)
        .maybeSingle();
      if (data?.value) {
        try { setCfg({ ...DEFAULT, ...JSON.parse(data.value) }); } catch {}
      }
      setLoading(false);
    })();
  }, [sellerId]);

  const save = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("platform_settings")
      .upsert({
        key: `agenda_bot_config_${sellerId}`,
        value: JSON.stringify(cfg),
        updated_at: new Date().toISOString(),
      } as any, { onConflict: "key" });
    setSaving(false);
    toast({
      title: error ? "Erro ao salvar" : "Bot salvo!",
      description: error ? error.message : "Configurações do bot atualizadas.",
      variant: error ? "destructive" : undefined,
    });
  };

  const copyUrl = () => {
    navigator.clipboard.writeText(chatUrl);
    toast({ title: "Link copiado!" });
  };

  if (loading) return <div className="text-center py-8 text-muted-foreground">Carregando...</div>;

  return (
    <div className="space-y-4">
      {/* Hero card */}
      <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
            <Bot className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-foreground flex items-center gap-2">
              Bot de Agendamento <Sparkles className="w-4 h-4 text-amber-500" />
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              IA atende o cliente, identifica automaticamente o imóvel e cria a visita aqui na sua agenda como <strong>pendente de confirmação</strong>.
            </p>
          </div>
        </div>
      </div>

      {/* Link */}
      <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
        <p className="text-sm font-bold flex items-center gap-2"><CalendarIcon className="w-4 h-4 text-primary" /> Link do bot</p>
        <p className="text-xs text-muted-foreground">Compartilhe este link no Instagram, WhatsApp, Stories — qualquer cliente que abrir é atendido pela IA e a visita aparece direto na agenda.</p>
        <div className="flex flex-col sm:flex-row gap-2">
          <Input value={chatUrl} readOnly className="font-mono text-xs" />
          <div className="flex gap-2">
            <Button onClick={copyUrl} variant="outline" size="sm" className="flex-1 sm:flex-none">
              <Copy className="w-4 h-4 mr-1" /> Copiar
            </Button>
            <Button onClick={() => window.open(chatUrl, "_blank")} variant="outline" size="sm" className="flex-1 sm:flex-none">
              <ExternalLink className="w-4 h-4 mr-1" /> Testar
            </Button>
          </div>
        </div>
      </div>

      {/* Atendente */}
      <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
        <p className="text-sm font-bold">Atendente virtual</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-muted-foreground">Nome</label>
            <Input value={cfg.attendantName} onChange={(e) => setCfg({ ...cfg, attendantName: e.target.value })} placeholder="Assistente de Agendamento" className="mt-1" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">URL do avatar</label>
            <Input value={cfg.attendantAvatar} onChange={(e) => setCfg({ ...cfg, attendantAvatar: e.target.value })} placeholder="https://..." className="mt-1" />
          </div>
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Mensagem de abertura</label>
          <Textarea
            value={cfg.openingMessage}
            onChange={(e) => setCfg({ ...cfg, openingMessage: e.target.value })}
            className="mt-1 min-h-[80px]"
            placeholder="Olá! Vou te ajudar a agendar uma visita..."
          />
          <p className="text-[10px] text-muted-foreground mt-1">A IA pode adaptar a saudação automaticamente — esta é o fallback caso o serviço falhe.</p>
        </div>
      </div>

      {/* CTA pós-agendamento */}
      <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
        <p className="text-sm font-bold">Botão pós-agendamento</p>
        <p className="text-xs text-muted-foreground">Aparece após a IA registrar a visita. Por padrão abre o WhatsApp do corretor com o resumo.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-muted-foreground">Texto do botão</label>
            <Input value={cfg.successCtaLabel} onChange={(e) => setCfg({ ...cfg, successCtaLabel: e.target.value })} className="mt-1" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">URL customizada (opcional)</label>
            <Input value={cfg.successCtaUrl} onChange={(e) => setCfg({ ...cfg, successCtaUrl: e.target.value })} placeholder="Vazio = WhatsApp do corretor" className="mt-1" />
          </div>
        </div>
      </div>

      {/* Como funciona */}
      <div className="rounded-2xl border border-dashed border-border bg-muted/30 p-4 space-y-2">
        <p className="text-sm font-bold">🤖 Como a IA trabalha</p>
        <ul className="text-xs text-muted-foreground space-y-1.5 list-disc list-inside">
          <li>Cliente conversa naturalmente em texto livre — sem formulário.</li>
          <li>IA identifica o imóvel comparando o pedido com seus anúncios ativos (vínculo automático com confiança {">"} 40%).</li>
          <li>Data e horário são interpretados de qualquer formato (“amanhã”, “sexta”, “20/04 às 14h”).</li>
          <li>Visita entra como <strong>pendente de confirmação</strong> na sua agenda — você confirma, reagenda ou cancela.</li>
          <li>Você recebe push notification imediato a cada novo agendamento.</li>
        </ul>
      </div>

      <Button onClick={save} disabled={saving} className="w-full sm:w-auto" size="lg">
        <Save className="w-4 h-4 mr-2" />
        {saving ? "Salvando..." : "Salvar configurações"}
      </Button>
    </div>
  );
}
