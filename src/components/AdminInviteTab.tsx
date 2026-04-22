import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Save, ExternalLink, Copy, MessageCircle, User, ChevronDown, ChevronRight, Plus, Trash2, Bot, GitBranch } from "lucide-react";
import { DEFAULT_CONFIG, DEFAULT_FLOWS, STEP_TYPE_LABELS, STEP_NAMES, type InviteChatConfig, type InviteBotConfig, type FlowStep, type BotStep, type ChoiceStep, type InputStep, type CtaType } from "@/data/inviteFlow";


const cloneFlows = () =>
  Object.fromEntries(Object.entries(DEFAULT_FLOWS).map(([key, flow]) => [key, flow.map((step) => ({ ...step }))])) as InviteChatConfig["flows"];

const normalizeInviteSlug = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48) || "convite";

const createInviteBot = (overrides: Partial<InviteBotConfig> = {}): InviteBotConfig => {
  const ctaType = overrides.ctaType || DEFAULT_CONFIG.ctaType;
  const flows = overrides.flows || cloneFlows();
  const slugBase = normalizeInviteSlug(overrides.slug || overrides.name || "convite");
  return {
    ...DEFAULT_CONFIG,
    id: overrides.id || `bot_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    name: overrides.name || "Novo convite",
    slug: slugBase,
    attendantName: overrides.attendantName || DEFAULT_CONFIG.attendantName,
    attendantAvatar: overrides.attendantAvatar || "",
    aiPrompt: overrides.aiPrompt || "",
    ctaText: overrides.ctaText || DEFAULT_CONFIG.ctaText,
    ctaUrl: overrides.ctaUrl || DEFAULT_CONFIG.ctaUrl,
    ctaType,
    crmRedirectUrl: overrides.crmRedirectUrl || "",
    crmButtonText: overrides.crmButtonText || DEFAULT_CONFIG.crmButtonText,
    chatMode: overrides.chatMode || DEFAULT_CONFIG.chatMode,
    flows,
    flow: flows[ctaType] || DEFAULT_FLOWS[ctaType],
  };
};

const migrateInviteConfig = (parsed: any): InviteChatConfig => {
  if (Array.isArray(parsed?.bots) && parsed.bots.length > 0) {
    const bots = parsed.bots.map((bot: any, index: number) => createInviteBot({
      ...bot,
      id: bot.id || `bot_${index + 1}`,
      name: bot.name || (index === 0 ? "Convite principal" : `Convite ${index + 1}`),
      slug: bot.slug || (index === 0 ? "principal" : `convite-${index + 1}`),
      flows: bot.flows ? { ...cloneFlows(), ...bot.flows } : cloneFlows(),
    }));
    return { ...bots[0], bots };
  }

  const ctaType = (parsed?.ctaType || DEFAULT_CONFIG.ctaType) as CtaType;
  const flows = parsed?.flows
    ? { ...cloneFlows(), ...parsed.flows }
    : parsed?.flow?.length
      ? { ...cloneFlows(), [ctaType]: parsed.flow }
      : cloneFlows();
  const primary = createInviteBot({
    ...parsed,
    id: "principal",
    name: parsed?.name || "Convite principal",
    slug: parsed?.slug || "principal",
    ctaType,
    flows,
  });
  return { ...primary, bots: [primary] };
};

const AI_STRATEGY_INFO: Record<string, { title: string; description: string }> = {
  internal: {
    title: "📱 Cadastro Interno",
    description: "A IA identifica o perfil do visitante em tempo real (corretor, imobiliária, construtora ou autônomo), entende suas necessidades e apresenta de forma personalizada os principais benefícios da plataforma.\n\nDurante a conversa, ela demonstra funcionalidades relevantes como criação de app próprio, CRM integrado, captação de leads, anúncios automáticos, gestão de imóveis, atendimento via WhatsApp e ferramentas de vendas.\n\nCom abordagem natural e consultiva, a IA tira dúvidas, gera confiança, destaca vantagens competitivas e conduz o visitante passo a passo até criar uma conta gratuita, iniciar testes ou solicitar uma demonstração personalizada.",
  },
  crm: {
    title: "📋 Captura CRM",
    description: "A IA cria urgência e exclusividade, convencendo o visitante a deixar nome e WhatsApp para ser contatado por um consultor especializado.",
  },
  whatsapp: {
    title: "💬 WhatsApp Direto",
    description: "A IA é mais rápida e direta, criando conexão pessoal e urgência para o visitante iniciar uma conversa instantânea no WhatsApp com a equipe.",
  },
  whatsapp_group: {
    title: "👥 Grupo WhatsApp",
    description: "A IA apresenta o grupo como uma comunidade exclusiva de corretores, destacando networking, dicas e parcerias. Cria FOMO com vagas limitadas.",
  },
  url: {
    title: "🔗 URL Externa",
    description: "A IA apresenta benefícios e conduz o visitante até clicar no link de destino configurado.",
  },
  captacao_imobiliaria: {
    title: "🏢 Captação de Imobiliárias",
    description: "A IA apresenta os benefícios para imobiliárias/construtoras (lojas espelho, gestão de equipe, parcerias), salva no CRM marcando como corretora e direciona para WhatsApp do consultor.",
  },
};

export default function AdminInviteTab() {
  const { toast } = useToast();
  const [config, setConfig] = useState<InviteChatConfig>(() => migrateInviteConfig(DEFAULT_CONFIG));
  const [activeBotId, setActiveBotId] = useState("principal");
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
          const cfg = migrateInviteConfig(parsed);
          setConfig(cfg);
          setActiveBotId(cfg.bots?.[0]?.id || "principal");
        } catch {}
      }
      setLoaded(true);
    })();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    const bots = config.bots?.length ? config.bots : [createInviteBot(config as InviteBotConfig)];
    const primary = bots[0];
    const value = JSON.stringify({ ...primary, bots });
    const { error } = await supabase
      .from("platform_settings")
      .upsert({ key: "invite_chat_config", value, updated_at: new Date().toISOString() } as any, { onConflict: "key" });
    setSaving(false);
    if (error) toast({ title: "Erro ao salvar", variant: "destructive" });
    else toast({ title: "Convite salvo com sucesso!" });
  };

  const bots = config.bots?.length ? config.bots : [createInviteBot(config as InviteBotConfig)];
  const activeBot = bots.find((bot) => bot.id === activeBotId) || bots[0];

  const updateActiveBot = (updater: (bot: InviteBotConfig) => InviteBotConfig) => {
    setConfig((prev) => {
      const currentBots = prev.bots?.length ? prev.bots : [createInviteBot(prev as InviteBotConfig)];
      const nextBots = currentBots.map((bot) => (bot.id === activeBot.id ? updater(bot) : bot));
      return { ...nextBots[0], bots: nextBots };
    });
  };

  const addBot = () => {
    const nextIndex = bots.length + 1;
    const bot = createInviteBot({ name: `Convite ${nextIndex}`, slug: `convite-${nextIndex}` });
    setConfig((prev) => {
      const currentBots = prev.bots?.length ? prev.bots : [createInviteBot(prev as InviteBotConfig)];
      const nextBots = [...currentBots, bot];
      return { ...nextBots[0], bots: nextBots };
    });
    setActiveBotId(bot.id);
  };

  const removeBot = (id: string) => {
    if (bots.length <= 1) return;
    const nextBots = bots.filter((bot) => bot.id !== id);
    setConfig({ ...nextBots[0], bots: nextBots });
    setActiveBotId(nextBots[0].id);
  };

  const resetToDefault = () => {
    updateActiveBot((bot) => {
      const ctaFlows = { ...bot.flows, [bot.ctaType]: DEFAULT_FLOWS[bot.ctaType].map((step) => ({ ...step })) };
      return { ...bot, flows: ctaFlows, flow: ctaFlows[bot.ctaType] };
    });
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

  const activeFlow = activeBot.flows[activeBot.ctaType] || DEFAULT_FLOWS[activeBot.ctaType];

  const updateStep = (id: string, updater: (step: FlowStep) => FlowStep) => {
    updateActiveBot((bot) => {
      const ctaFlows = { ...bot.flows };
      ctaFlows[bot.ctaType] = (ctaFlows[bot.ctaType] || []).map((s) => (s.id === id ? updater(s) : s));
      return { ...bot, flows: ctaFlows, flow: ctaFlows[bot.ctaType] };
    });
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
    const path = activeBot.slug === "principal" ? "/convite" : `/convite/${activeBot.slug}`;
    const url = `${window.location.origin}${path}`;
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
          <a href={activeBot.slug === "principal" ? "/convite" : `/convite/${activeBot.slug}`} target="_blank" rel="noopener">
            <Button variant="secondary" size="sm"><ExternalLink size={14} /> Visualizar</Button>
          </a>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2"><Bot size={16} /> Bots de Convite</h3>
            <p className="text-xs text-muted-foreground mt-1">Cada bot tem sua própria URL, IA, texto e botão final.</p>
          </div>
          <Button variant="outline" size="sm" onClick={addBot}><Plus size={14} /> Novo bot</Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-3">
          <div className="space-y-2">
            {bots.map((bot) => (
              <button
                key={bot.id}
                type="button"
                onClick={() => setActiveBotId(bot.id)}
                className={`w-full rounded-lg border px-3 py-2 text-left text-sm transition-colors ${bot.id === activeBot.id ? "border-primary bg-primary/10 text-foreground" : "border-border text-muted-foreground hover:bg-muted"}`}
              >
                <span className="block font-medium truncate">{bot.name}</span>
                <span className="block text-[11px] truncate">/{bot.slug === "principal" ? "convite" : `convite/${bot.slug}`}</span>
              </button>
            ))}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground">Nome interno do bot</label>
              <Input value={activeBot.name} onChange={(e) => updateActiveBot((p) => ({ ...p, name: e.target.value }))} className="mt-1" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">URL do bot</label>
              <div className="flex gap-2 mt-1">
                <Input value={activeBot.slug} onChange={(e) => updateActiveBot((p) => ({ ...p, slug: normalizeInviteSlug(e.target.value) }))} />
                {bots.length > 1 && <Button variant="outline" size="icon" onClick={() => removeBot(activeBot.id)}><Trash2 size={14} /></Button>}
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">Use “principal” para manter /convite. Outros ficam em /convite/sua-url.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Chat Mode Toggle */}
      <div className="bg-card border border-border rounded-xl p-4 space-y-3">
        <h3 className="text-sm font-semibold flex items-center gap-2 text-foreground">🧠 Modo do Chat</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            onClick={() => updateActiveBot((p) => ({ ...p, chatMode: "flow" }))}
            className={`flex items-start gap-3 p-4 rounded-xl border-2 transition-all text-left ${
              activeBot.chatMode === "flow"
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
            onClick={() => updateActiveBot((p) => ({ ...p, chatMode: "ai" }))}
            className={`flex items-start gap-3 p-4 rounded-xl border-2 transition-all text-left ${
              activeBot.chatMode === "ai"
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
        {activeBot.chatMode === "ai" && (
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 text-xs text-foreground space-y-2">
            <p className="font-semibold">🤖 Modo IA ativado</p>
            <p className="text-muted-foreground">
              A IA conversa livremente com o visitante e adapta sua estratégia de acordo com o tipo de CTA configurado abaixo.
              O editor de fluxo fica desativado neste modo.
            </p>
            {/* Strategy preview per CTA type */}
            <div className="mt-2 p-2.5 rounded-lg bg-background/80 border border-border">
              <p className="font-semibold text-[11px] uppercase tracking-wider text-muted-foreground mb-1.5">
                Estratégia IA ativa: {AI_STRATEGY_INFO[activeBot.ctaType]?.title || "Padrão"}
              </p>
              <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                {AI_STRATEGY_INFO[activeBot.ctaType]?.description || "Estratégia padrão de cadastro."}
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
            <Input value={activeBot.attendantName} onChange={(e) => updateActiveBot((p) => ({ ...p, attendantName: e.target.value }))} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Avatar URL (opcional)</label>
            <Input value={activeBot.attendantAvatar} onChange={(e) => updateActiveBot((p) => ({ ...p, attendantAvatar: e.target.value }))} placeholder="https://..." />
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
              value={activeBot.ctaType}
              onChange={(e) => {
                const v = e.target.value as InviteChatConfig["ctaType"];
                updateActiveBot((p) => ({
                  ...p,
                  ctaType: v,
                  ctaUrl: v === "internal" ? "/anunciar" : v === "whatsapp" ? "https://wa.me/55" : v === "crm" || v === "captacao_imobiliaria" ? "" : "https://",
                  flow: p.flows[v] || DEFAULT_FLOWS[v],
                }));
              }}
              className="w-full text-sm bg-card text-foreground border border-border rounded px-3 py-2 mt-1"
            >
              <option value="internal">📱 Cadastro interno</option>
              <option value="crm">📋 Salvar no CRM</option>
              <option value="whatsapp">💬 WhatsApp direto</option>
              <option value="whatsapp_group">👥 Grupo WhatsApp</option>
              <option value="url">🔗 URL externa</option>
              <option value="captacao_imobiliaria">🏢 Captação de Imobiliárias</option>
            </select>
          </div>
          {(activeBot.ctaType === "crm" || activeBot.ctaType === "captacao_imobiliaria") ? (
            <div className="sm:col-span-2 space-y-3">
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 text-xs text-foreground">
                <p className="font-semibold mb-1">{activeBot.ctaType === "captacao_imobiliaria" ? "🏢 Modo Captação Imobiliárias" : "📋 Modo CRM ativado"}</p>
                <p className="text-muted-foreground">
                  {activeBot.ctaType === "captacao_imobiliaria"
                    ? "O visitante preencherá nome, WhatsApp e tipo (Imobiliária/Construtora/Corretor). Os dados serão salvos no CRM e um botão de WhatsApp aparecerá com mensagem pré-preenchida."
                    : "O visitante preencherá nome e WhatsApp. Os dados serão salvos no CRM e um botão aparecerá para continuar."}
                </p>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Texto do botão após envio</label>
                <Input
                  value={activeBot.crmButtonText || ""}
                  onChange={(e) => updateActiveBot((p) => ({ ...p, crmButtonText: e.target.value }))}
                  placeholder="🚀 Criar Minha Conta Agora"
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">URL do botão após envio</label>
                <Input
                  value={activeBot.crmRedirectUrl || ""}
                  onChange={(e) => updateActiveBot((p) => ({ ...p, crmRedirectUrl: e.target.value }))}
                  placeholder="/anunciar ou https://wa.me/5527999999999"
                  className="mt-1"
                />
                <p className="text-[10px] text-muted-foreground mt-1">Padrão: /anunciar</p>
              </div>
            </div>
          ) : (
            <>
              <div>
                <label className="text-xs text-muted-foreground">Texto do botão</label>
                <Input value={activeBot.ctaText} onChange={(e) => updateActiveBot((p) => ({ ...p, ctaText: e.target.value }))} className="mt-1" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">{activeBot.ctaType === "internal" ? "Rota" : "URL"}</label>
                <Input value={activeBot.ctaUrl} onChange={(e) => updateActiveBot((p) => ({ ...p, ctaUrl: e.target.value }))} className="mt-1" />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Flow editor — hidden in AI mode */}
      {activeBot.chatMode !== "ai" && (
      <div className="bg-card border border-border rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">🔀 Fluxo da Conversa — {
            { internal: "📱 Cadastro", crm: "📋 CRM", whatsapp: "💬 WhatsApp", whatsapp_group: "👥 Grupo", url: "🔗 URL", captacao_imobiliaria: "🏢 Imobiliárias" }[activeBot.ctaType]
          }</h3>
          <Button variant="ghost" size="sm" onClick={resetToDefault} className="text-xs text-muted-foreground">Restaurar padrão</Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Cada tipo de CTA tem seu próprio fluxo de conversa. Altere o Botão Final (CTA) acima para editar outro fluxo.
          Use <code className="bg-muted px-1 rounded">{"{{nome}}"}</code> para inserir o nome do visitante.
        </p>

        <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
          {activeFlow.map((step) => {
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
      )}

      <Button onClick={handleSave} disabled={saving} className="w-full sm:w-auto">
        <Save size={16} /> {saving ? "Salvando..." : "Salvar Convite"}
      </Button>
    </div>
  );
}
