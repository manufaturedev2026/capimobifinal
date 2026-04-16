import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Save, ExternalLink, Copy, MessageCircle, User, ChevronDown, ChevronRight, Plus, Trash2, Bot, GitBranch } from "lucide-react";
import { DEFAULT_CONFIG, STEP_TYPE_LABELS, STEP_NAMES, type InviteChatConfig, type FlowStep, type BotStep, type ChoiceStep, type InputStep } from "@/data/inviteFlow";

export default function AdminInviteTab() {
  const { toast } = useToast();
  const [config, setConfig] = useState<InviteChatConfig>({ ...DEFAULT_CONFIG });
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [openSteps, setOpenSteps] = useState<Set<string>>(new Set(["start", "greet", "choice_experience"]));

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("platform_settings")
        .select("value")
        .eq("key", "invite_chat_config")
        .maybeSingle();
      if (data?.value) {
        try {
          const parsed = JSON.parse(data.value);
          const cfg = { ...DEFAULT_CONFIG };
          if (parsed.attendantName) cfg.attendantName = parsed.attendantName;
          if (parsed.attendantAvatar) cfg.attendantAvatar = parsed.attendantAvatar;
          if (parsed.ctaText) cfg.ctaText = parsed.ctaText;
          if (parsed.ctaUrl) cfg.ctaUrl = parsed.ctaUrl;
          if (parsed.ctaType) cfg.ctaType = parsed.ctaType;
          if (parsed.chatMode) cfg.chatMode = parsed.chatMode;
           if (parsed.crmRedirectUrl !== undefined) cfg.crmRedirectUrl = parsed.crmRedirectUrl;
           if (parsed.crmButtonText) cfg.crmButtonText = parsed.crmButtonText;
          if (parsed.flow?.length) cfg.flow = parsed.flow;
          setConfig(cfg);
        } catch {}
      }
      setLoaded(true);
    })();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    const value = JSON.stringify(config);
    const { error } = await supabase
      .from("platform_settings")
      .upsert({ key: "invite_chat_config", value, updated_at: new Date().toISOString() } as any, { onConflict: "key" });
    setSaving(false);
    if (error) toast({ title: "Erro ao salvar", variant: "destructive" });
    else toast({ title: "Convite salvo com sucesso!" });
  };

  const resetToDefault = () => {
    setConfig({ ...DEFAULT_CONFIG });
    toast({ title: "Fluxo restaurado ao padrão" });
  };

  const toggleStep = (id: string) => {
    setOpenSteps((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const updateStep = (id: string, updater: (step: FlowStep) => FlowStep) => {
    setConfig((prev) => ({
      ...prev,
      flow: prev.flow.map((s) => (s.id === id ? updater(s) : s)),
    }));
  };

  const updateBotMessage = (stepId: string, msgIndex: number, text: string) => {
    updateStep(stepId, (s) => {
      if (s.type !== "bot") return s;
      const msgs = [...(s as BotStep).messages];
      msgs[msgIndex] = text;
      return { ...s, messages: msgs } as FlowStep;
    });
  };

  const addBotMessage = (stepId: string) => {
    updateStep(stepId, (s) => {
      if (s.type !== "bot") return s;
      return { ...s, messages: [...(s as BotStep).messages, "Nova mensagem..."] } as FlowStep;
    });
  };

  const removeBotMessage = (stepId: string, msgIndex: number) => {
    updateStep(stepId, (s) => {
      if (s.type !== "bot") return s;
      const msgs = (s as BotStep).messages.filter((_, i) => i !== msgIndex);
      return { ...s, messages: msgs } as FlowStep;
    });
  };

  const updateChoiceLabel = (stepId: string, optIndex: number, label: string) => {
    updateStep(stepId, (s) => {
      if (s.type !== "choice") return s;
      const opts = [...(s as ChoiceStep).options];
      opts[optIndex] = { ...opts[optIndex], label };
      return { ...s, options: opts } as FlowStep;
    });
  };

  const updateInputPlaceholder = (stepId: string, placeholder: string) => {
    updateStep(stepId, (s) => {
      if (s.type !== "input") return s;
      return { ...s, placeholder } as FlowStep;
    });
  };

  const copyUrl = () => {
    const url = `${window.location.origin}/convite`;
    navigator.clipboard.writeText(url);
    toast({ title: "URL copiada!", description: url });
  };

  if (!loaded) return <div className="p-8 text-center text-muted-foreground">Carregando...</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2 text-foreground">
            <MessageCircle size={22} className="text-[#25d366]" />
            Página de Convite Interativo
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Chat interativo com ramificações para atrair corretores
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={copyUrl}><Copy size={14} /> URL</Button>
          <a href="/convite" target="_blank" rel="noopener">
            <Button variant="secondary" size="sm"><ExternalLink size={14} /> Visualizar</Button>
          </a>
        </div>
      </div>

      {/* Chat Mode Toggle */}
      <div className="bg-card border border-border rounded-xl p-4 space-y-3">
        <h3 className="text-sm font-semibold flex items-center gap-2 text-foreground">🧠 Modo do Chat</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            onClick={() => setConfig((p) => ({ ...p, chatMode: "flow" }))}
            className={`flex items-start gap-3 p-4 rounded-xl border-2 transition-all text-left ${
              config.chatMode === "flow"
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/30"
            }`}
          >
            <GitBranch size={20} className="text-primary mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-foreground">Fluxo Interativo</p>
              <p className="text-xs text-muted-foreground mt-1">
                Mensagens pré-definidas com botões de escolha e caminhos ramificados. Editável abaixo.
              </p>
            </div>
          </button>
          <button
            onClick={() => setConfig((p) => ({ ...p, chatMode: "ai" }))}
            className={`flex items-start gap-3 p-4 rounded-xl border-2 transition-all text-left ${
              config.chatMode === "ai"
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/30"
            }`}
          >
            <Bot size={20} className="text-primary mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-foreground">IA Conversacional</p>
              <p className="text-xs text-muted-foreground mt-1">
                A IA responde em tempo real. O visitante digita livremente e é guiado até o cadastro.
              </p>
            </div>
          </button>
        </div>
        {config.chatMode === "ai" && (
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 text-xs text-foreground space-y-2">
            <p className="font-semibold">🤖 Modo IA ativado</p>
            <p className="text-muted-foreground">
              A IA conversa livremente com o visitante e adapta sua estratégia de acordo com o tipo de CTA configurado abaixo.
              O editor de fluxo fica desativado neste modo.
            </p>
            {/* Strategy preview per CTA type */}
            <div className="mt-2 p-2.5 rounded-lg bg-background/80 border border-border">
              <p className="font-semibold text-[11px] uppercase tracking-wider text-muted-foreground mb-1.5">
                Estratégia IA ativa: {AI_STRATEGY_INFO[config.ctaType]?.title || "Padrão"}
              </p>
              <p className="text-muted-foreground leading-relaxed">
                {AI_STRATEGY_INFO[config.ctaType]?.description || "Estratégia padrão de cadastro."}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Attendant */}
      <div className="bg-card border border-border rounded-xl p-4 space-y-3">
        <h3 className="text-sm font-semibold flex items-center gap-2 text-foreground"><User size={16} /> Atendente</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-muted-foreground">Nome</label>
            <Input value={config.attendantName} onChange={(e) => setConfig((p) => ({ ...p, attendantName: e.target.value }))} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Avatar URL (opcional)</label>
            <Input value={config.attendantAvatar} onChange={(e) => setConfig((p) => ({ ...p, attendantAvatar: e.target.value }))} placeholder="https://..." />
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="bg-card border border-border rounded-xl p-4 space-y-3">
        <h3 className="text-sm font-semibold flex items-center gap-2 text-foreground"><ExternalLink size={16} /> Botão Final (CTA)</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="text-xs text-muted-foreground">Tipo de link</label>
            <select
              value={config.ctaType}
              onChange={(e) => {
                const v = e.target.value as InviteChatConfig["ctaType"];
                setConfig((p) => ({ ...p, ctaType: v, ctaUrl: v === "internal" ? "/login" : v === "whatsapp" ? "https://wa.me/55" : v === "crm" ? "" : "https://" }));
              }}
              className="w-full text-sm bg-card text-foreground border border-border rounded px-3 py-2 mt-1"
            >
              <option value="internal">📱 Cadastro interno</option>
              <option value="crm">📋 Salvar no CRM</option>
              <option value="whatsapp">💬 WhatsApp direto</option>
              <option value="whatsapp_group">👥 Grupo WhatsApp</option>
              <option value="url">🔗 URL externa</option>
            </select>
          </div>
          {config.ctaType === "crm" ? (
            <div className="sm:col-span-2 space-y-3">
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 text-xs text-foreground">
                <p className="font-semibold mb-1">📋 Modo CRM ativado</p>
                <p className="text-muted-foreground">
                  O visitante preencherá nome e WhatsApp. Os dados serão salvos no CRM e um botão aparecerá para continuar.
                </p>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Texto do botão após envio</label>
                <Input
                  value={config.crmButtonText || ""}
                  onChange={(e) => setConfig((p) => ({ ...p, crmButtonText: e.target.value }))}
                  placeholder="🚀 Criar Minha Conta Agora"
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">URL do botão após envio</label>
                <Input
                  value={config.crmRedirectUrl || ""}
                  onChange={(e) => setConfig((p) => ({ ...p, crmRedirectUrl: e.target.value }))}
                  placeholder="/login ou https://wa.me/5527999999999"
                  className="mt-1"
                />
                <p className="text-[10px] text-muted-foreground mt-1">Padrão: /login</p>
              </div>
            </div>
          ) : (
            <>
              <div>
                <label className="text-xs text-muted-foreground">Texto do botão</label>
                <Input value={config.ctaText} onChange={(e) => setConfig((p) => ({ ...p, ctaText: e.target.value }))} className="mt-1" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">{config.ctaType === "internal" ? "Rota" : "URL"}</label>
                <Input value={config.ctaUrl} onChange={(e) => setConfig((p) => ({ ...p, ctaUrl: e.target.value }))} className="mt-1" />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Flow editor */}
      <div className="bg-card border border-border rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">🔀 Fluxo da Conversa</h3>
          <Button variant="ghost" size="sm" onClick={resetToDefault} className="text-xs text-muted-foreground">Restaurar padrão</Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Use <code className="bg-muted px-1 rounded">{"{{nome}}"}</code> para inserir o nome do visitante. Clique em cada etapa para editar.
        </p>

        <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
          {config.flow.map((step) => {
            const meta = STEP_TYPE_LABELS[step.type] || { emoji: "❓", label: step.type };
            const name = STEP_NAMES[step.id] || step.id;
            const isOpen = openSteps.has(step.id);

            return (
              <div key={step.id} className="border border-border rounded-lg overflow-hidden">
                <button
                  onClick={() => toggleStep(step.id)}
                  className="w-full flex items-center gap-2 px-3 py-2.5 text-left hover:bg-muted/50 transition-colors"
                >
                  {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  <span className="text-base">{meta.emoji}</span>
                  <span className="text-sm font-medium text-foreground flex-1">{name}</span>
                  <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{meta.label}</span>
                </button>

                {isOpen && (
                  <div className="px-3 pb-3 space-y-2 border-t border-border pt-2">
                    {/* Bot step */}
                    {step.type === "bot" && (
                      <>
                        {(step as BotStep).messages.map((msg, i) => (
                          <div key={i} className="flex gap-2">
                            <Textarea
                              value={msg}
                              onChange={(e) => updateBotMessage(step.id, i, e.target.value)}
                              className="min-h-[50px] text-sm flex-1"
                            />
                            {(step as BotStep).messages.length > 1 && (
                              <button onClick={() => removeBotMessage(step.id, i)} className="text-destructive/60 hover:text-destructive shrink-0 mt-1">
                                <Trash2 size={14} />
                              </button>
                            )}
                          </div>
                        ))}
                        <Button variant="outline" size="sm" onClick={() => addBotMessage(step.id)} className="text-xs text-primary border-primary/30 hover:bg-primary/10">
                          <Plus size={12} /> Adicionar balão
                        </Button>
                      </>
                    )}

                    {/* Input step */}
                    {step.type === "input" && (
                      <div>
                        <label className="text-xs text-muted-foreground">Placeholder do input</label>
                        <Input
                          value={(step as InputStep).placeholder}
                          onChange={(e) => updateInputPlaceholder(step.id, e.target.value)}
                          className="mt-1"
                        />
                      </div>
                    )}

                    {/* Choice step */}
                    {step.type === "choice" && (
                      <div className="space-y-2">
                        <label className="text-xs text-muted-foreground">Botões de escolha</label>
                        {(step as ChoiceStep).options.map((opt, i) => (
                          <div key={i} className="flex gap-2 items-center">
                            <span className="text-xs text-muted-foreground w-6 text-right">{i + 1}.</span>
                            <Input
                              value={opt.label}
                              onChange={(e) => updateChoiceLabel(step.id, i, e.target.value)}
                              className="flex-1 text-sm"
                            />
                            <span className="text-[10px] text-muted-foreground">→ {STEP_NAMES[opt.next] || opt.next}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* CTA step */}
                    {step.type === "cta" && (
                      <p className="text-xs text-muted-foreground italic">O botão CTA é configurado acima.</p>
                    )}

                    {/* Next indicator */}
                    {"next" in step && (step as any).next && (
                      <p className="text-[10px] text-muted-foreground mt-1">
                        Próximo passo: <span className="font-medium">{STEP_NAMES[(step as any).next] || (step as any).next}</span>
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <Button onClick={handleSave} disabled={saving} className="w-full sm:w-auto">
        <Save size={16} /> {saving ? "Salvando..." : "Salvar Convite"}
      </Button>
    </div>
  );
}
