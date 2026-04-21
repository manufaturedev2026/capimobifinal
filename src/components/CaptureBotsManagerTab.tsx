import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Bot, Copy, ExternalLink, Sparkles, Plus, Trash2, Save, Edit3, Upload, Loader2, X, Home as HomeIcon, Users, Gem, Zap, FileText } from "lucide-react";

interface Props {
  sellerId: string;
  sellerSlug: string | null;
}

type BotType = "captacao" | "grupo" | "avaliacao";

interface CaptureBot {
  id: string;
  seller_id: string;
  user_id: string;
  bot_type: BotType;
  slug: string;
  name: string;
  attendant_name: string;
  attendant_avatar: string | null;
  opening_message: string | null;
  success_cta_label: string;
  success_cta_url: string | null;
  whatsapp_group_url: string | null;
  is_active: boolean;
  use_ai: boolean;
}

const TYPE_META: Record<BotType, { label: string; icon: any; color: string; defaultName: string; defaultOpening: string; defaultCtaLabel: string }> = {
  captacao: {
    label: "Captação de Imóveis",
    icon: HomeIcon,
    color: "text-primary bg-primary/10 border-primary/20",
    defaultName: "Bot — Captação",
    defaultOpening: "Olá! 👋 Vou te ajudar a cadastrar seu imóvel para venda ou aluguel — 100% gratuito. 🏡 Vamos começar?",
    defaultCtaLabel: "💬 Falar no WhatsApp",
  },
  grupo: {
    label: "Grupo de WhatsApp",
    icon: Users,
    color: "text-accent-foreground bg-accent/40 border-accent",
    defaultName: "Bot — Grupo VIP",
    defaultOpening: "Olá! 👋 Que bom ter você por aqui!\n\nVou te adicionar ao nosso grupo VIP no WhatsApp 📲, onde compartilhamos em primeira mão as melhores oportunidades. Vamos garantir sua vaga?",
    defaultCtaLabel: "🔗 Entrar no Grupo",
  },
  avaliacao: {
    label: "Avaliação Profissional",
    icon: Gem,
    color: "text-secondary-foreground bg-secondary border-border",
    defaultName: "Bot — Avaliação",
    defaultOpening: "Olá! 👋 Vou te ajudar a solicitar uma avaliação profissional do seu imóvel. 💎 Análise técnica, mercado atual da sua região e tendências de preço. Vamos começar?",
    defaultCtaLabel: "💬 Falar com Especialista",
  },
};

const slugify = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40) || `bot-${Date.now()}`;

export default function CaptureBotsManagerTab({ sellerId, sellerSlug }: Props) {
  const { toast } = useToast();
  const [bots, setBots] = useState<CaptureBot[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<CaptureBot | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const baseUrl = (botSlug: string) => `${window.location.origin}/captar-imovel/${sellerSlug || sellerId}/${botSlug}`;

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("capture_bots")
      .select("*")
      .eq("seller_id", sellerId)
      .order("created_at", { ascending: false });
    setBots((data as any) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [sellerId]);

  const startNew = (type: BotType, useAi: boolean) => {
    const meta = TYPE_META[type];
    setEditing({
      id: "",
      seller_id: sellerId,
      user_id: "",
      bot_type: type,
      slug: useAi ? type : `${type}-form`,
      name: `${meta.defaultName}${useAi ? " (IA)" : " (Formulário)"}`,
      attendant_name: "Assistente Imobiliário",
      attendant_avatar: null,
      opening_message: meta.defaultOpening,
      success_cta_label: meta.defaultCtaLabel,
      success_cta_url: null,
      whatsapp_group_url: null,
      is_active: true,
      use_ai: useAi,
    });
  };

  const handleAvatarUpload = async (file: File) => {
    if (!editing) return;
    if (!file.type.startsWith("image/")) {
      toast({ title: "Selecione uma imagem", variant: "destructive" }); return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "Imagem muito grande", description: "Máximo 5MB", variant: "destructive" }); return;
    }
    setUploadingAvatar(true);
    const { data: userRes } = await supabase.auth.getUser();
    const uid = userRes.user?.id;
    if (!uid) { setUploadingAvatar(false); return; }
    const ext = file.name.split(".").pop() || "jpg";
    const path = `${uid}/capture-bots/${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage.from("seller-uploads").upload(path, file, { upsert: true, contentType: file.type });
    if (upErr) {
      setUploadingAvatar(false);
      toast({ title: "Erro no upload", description: upErr.message, variant: "destructive" }); return;
    }
    const { data: pub } = supabase.storage.from("seller-uploads").getPublicUrl(path);
    setEditing({ ...editing, attendant_avatar: pub.publicUrl });
    setUploadingAvatar(false);
    toast({ title: "Avatar carregado!" });
  };

  const save = async () => {
    if (!editing) return;
    if (!editing.name.trim()) { toast({ title: "Nome obrigatório", variant: "destructive" }); return; }
    setSaving(true);
    const { data: userRes } = await supabase.auth.getUser();
    const uid = userRes.user?.id;
    if (!uid) { setSaving(false); return; }
    const slug = editing.slug.trim() || slugify(editing.name);

    if (editing.id) {
      const { error } = await supabase.from("capture_bots").update({
        bot_type: editing.bot_type, slug, name: editing.name,
        attendant_name: editing.attendant_name, attendant_avatar: editing.attendant_avatar,
        opening_message: editing.opening_message, success_cta_label: editing.success_cta_label,
        success_cta_url: editing.success_cta_url, whatsapp_group_url: editing.whatsapp_group_url,
        is_active: editing.is_active, use_ai: editing.use_ai,
      }).eq("id", editing.id);
      setSaving(false);
      if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return; }
    } else {
      const { error } = await supabase.from("capture_bots").insert({
        seller_id: sellerId, user_id: uid, bot_type: editing.bot_type, slug, name: editing.name,
        attendant_name: editing.attendant_name, attendant_avatar: editing.attendant_avatar,
        opening_message: editing.opening_message, success_cta_label: editing.success_cta_label,
        success_cta_url: editing.success_cta_url, whatsapp_group_url: editing.whatsapp_group_url,
        is_active: editing.is_active, use_ai: editing.use_ai,
      });
      setSaving(false);
      if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return; }
    }
    toast({ title: "Bot salvo!" });
    setEditing(null);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Excluir este bot?")) return;
    const { error } = await supabase.from("capture_bots").delete().eq("id", id);
    if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Bot excluído" });
    load();
  };

  const copyUrl = (botSlug: string) => {
    navigator.clipboard.writeText(baseUrl(botSlug));
    toast({ title: "Link copiado!" });
  };

  if (loading) return <div className="text-center py-8 text-muted-foreground">Carregando bots...</div>;

  // ============ FORM EDIT MODE ============
  if (editing) {
    const meta = TYPE_META[editing.bot_type];
    const Icon = meta.icon;
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 p-4">
          <h3 className="font-bold text-foreground flex items-center gap-2">
            <Icon className="w-5 h-5 text-primary" />
            <span>{editing.id ? "Editar bot" : "Novo bot"} — <span className="text-primary">{meta.label}</span></span>
          </h3>
          <Button variant="outline" size="sm" onClick={() => setEditing(null)} className="bg-card text-foreground hover:bg-accent hover:text-accent-foreground border-border">Cancelar</Button>
        </div>

        <div className="rounded-2xl border border-border bg-background p-4 space-y-3 shadow-sm">
          <p className="text-sm font-bold text-foreground">Identificação</p>
          <div>
            <label className="text-xs font-semibold text-foreground">Nome interno do bot</label>
            <Input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} className="mt-1 bg-card text-foreground" />
          </div>
          <div>
            <label className="text-xs font-semibold text-foreground">Slug do link (URL)</label>
            <Input value={editing.slug} onChange={(e) => setEditing({ ...editing, slug: slugify(e.target.value) })} placeholder={slugify(editing.name)} className="mt-1 font-mono text-xs bg-card text-foreground" />
            <p className="text-[10px] text-muted-foreground mt-1 break-all">{baseUrl(editing.slug || slugify(editing.name))}</p>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-background p-4 space-y-3 shadow-sm">
          <p className="text-sm font-bold text-foreground">Atendente virtual</p>
          <div>
            <label className="text-xs font-semibold text-foreground">Nome</label>
            <Input value={editing.attendant_name} onChange={(e) => setEditing({ ...editing, attendant_name: e.target.value })} className="mt-1 bg-card text-foreground" />
          </div>
          <div>
            <label className="text-xs font-semibold text-foreground">Avatar do atendente</label>
            <div className="mt-1 flex items-center gap-3">
              <div className="w-14 h-14 rounded-full bg-muted overflow-hidden shrink-0 border flex items-center justify-center">
                {editing.attendant_avatar ? (
                  <img src={editing.attendant_avatar} alt="" className="w-full h-full object-cover" />
                ) : (
                  <Bot className="w-6 h-6 text-muted-foreground" />
                )}
              </div>
              <div className="flex-1 flex flex-col gap-1.5">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handleAvatarUpload(f); e.target.value = ""; }}
                />
                <div className="flex gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={uploadingAvatar} className="flex-1 bg-card text-foreground hover:bg-accent hover:text-accent-foreground border-border">
                    {uploadingAvatar ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Upload className="w-3 h-3 mr-1" />}
                    {uploadingAvatar ? "Enviando..." : "Enviar foto"}
                  </Button>
                  {editing.attendant_avatar && (
                    <Button type="button" variant="ghost" size="sm" onClick={() => setEditing({ ...editing, attendant_avatar: null })} className="text-destructive hover:bg-destructive/10">
                      <X className="w-3 h-3" />
                    </Button>
                  )}
                </div>
                <Input
                  value={editing.attendant_avatar || ""}
                  onChange={(e) => setEditing({ ...editing, attendant_avatar: e.target.value || null })}
                  placeholder="ou cole uma URL https://..."
                  className="h-8 text-xs bg-card text-foreground"
                />
              </div>
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-foreground">Mensagem de abertura</label>
            <Textarea value={editing.opening_message || ""} onChange={(e) => setEditing({ ...editing, opening_message: e.target.value || null })} className="mt-1 min-h-[90px] bg-card text-foreground" />
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-background p-4 space-y-3 shadow-sm">
          <p className="text-sm font-bold text-foreground">Botão pós-conversa</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-foreground">Texto</label>
              <Input value={editing.success_cta_label} onChange={(e) => setEditing({ ...editing, success_cta_label: e.target.value })} className="mt-1 bg-card text-foreground" />
            </div>
            <div>
              <label className="text-xs font-semibold text-foreground">URL custom <span className="text-muted-foreground font-normal">(vazio = WhatsApp do corretor)</span></label>
              <Input value={editing.success_cta_url || ""} onChange={(e) => setEditing({ ...editing, success_cta_url: e.target.value || null })} placeholder="https://wa.me/55..." className="mt-1 bg-card text-foreground" />
            </div>
          </div>
          {editing.bot_type === "grupo" && (
            <div>
              <label className="text-xs font-semibold text-foreground">Link do grupo de WhatsApp <span className="text-muted-foreground font-normal">(chat.whatsapp.com/...)</span></label>
              <Input value={editing.whatsapp_group_url || ""} onChange={(e) => setEditing({ ...editing, whatsapp_group_url: e.target.value || null })} placeholder="https://chat.whatsapp.com/..." className="mt-1 bg-card text-foreground" />
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 rounded-2xl border border-border bg-background p-4 shadow-sm">
          <Switch checked={editing.is_active} onCheckedChange={(v) => setEditing({ ...editing, is_active: v })} />
          <span className="text-sm font-medium text-foreground">Bot ativo (link funcionando)</span>
        </div>

        <div className="flex items-start gap-3 rounded-2xl border border-border bg-background p-4 shadow-sm">
          <Switch checked={editing.use_ai} onCheckedChange={(v) => setEditing({ ...editing, use_ai: v })} />
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground flex items-center gap-1.5">
              {editing.use_ai ? <><Zap className="w-3.5 h-3.5 text-primary" /> Conversa com IA</> : <><FileText className="w-3.5 h-3.5" /> Formulário fixo (sem IA)</>}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {editing.use_ai
                ? "O atendente conversa naturalmente com o lead usando IA."
                : "Pergunta os campos em ordem fixa — não consome créditos de IA."}
            </p>
          </div>
        </div>

        <Button onClick={save} disabled={saving} className="w-full sm:w-auto" size="lg">
          <Save className="w-4 h-4 mr-2" />
          {saving ? "Salvando..." : "Salvar bot"}
        </Button>
      </div>
    );
  }

  // ============ LIST MODE ============
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
            <Bot className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-foreground flex items-center gap-2">
              Bots de Captação <Sparkles className="w-4 h-4 text-primary" />
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Crie quantos bots quiser, cada um com link próprio: captação de imóveis, convite para grupo VIP e solicitação de avaliação.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-3 sm:p-4">
          <p className="text-xs font-bold text-primary flex items-center gap-1.5 mb-2"><Zap className="w-3.5 h-3.5" /> Bots com IA <span className="text-[10px] font-normal text-muted-foreground">(conversa inteligente)</span></p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {(Object.keys(TYPE_META) as BotType[]).map((t) => {
              const m = TYPE_META[t];
              const Icon = m.icon;
              return (
                <Button key={`ai-${t}`} onClick={() => startNew(t, true)} variant="outline" size="lg" className="h-auto py-3 flex-col gap-1 bg-card hover:bg-primary/10 hover:border-primary/40">
                  <div className="flex items-center gap-2"><Icon className="w-4 h-4 text-primary" /> <Plus className="w-3 h-3" /></div>
                  <span className="text-xs font-bold">{m.label}</span>
                </Button>
              );
            })}
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-muted/30 p-3 sm:p-4">
          <p className="text-xs font-bold text-foreground flex items-center gap-1.5 mb-2"><FileText className="w-3.5 h-3.5" /> Bots sem IA <span className="text-[10px] font-normal text-muted-foreground">(formulário fixo, não consome IA)</span></p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {(Object.keys(TYPE_META) as BotType[]).map((t) => {
              const m = TYPE_META[t];
              const Icon = m.icon;
              return (
                <Button key={`form-${t}`} onClick={() => startNew(t, false)} variant="outline" size="lg" className="h-auto py-3 flex-col gap-1 bg-card hover:bg-accent">
                  <div className="flex items-center gap-2"><Icon className="w-4 h-4" /> <Plus className="w-3 h-3" /></div>
                  <span className="text-xs font-bold">{m.label}</span>
                </Button>
              );
            })}
          </div>
        </div>
      </div>

      {bots.length === 0 ? (
        <div className="rounded-2xl border border-dashed p-8 text-center text-muted-foreground">
          <Bot className="w-10 h-10 mx-auto mb-2 opacity-40" />
          <p className="text-sm">Nenhum bot criado ainda. Escolha um tipo acima para começar.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {bots.map((bot) => {
            const meta = TYPE_META[bot.bot_type] || TYPE_META.captacao;
            const Icon = meta.icon;
            const url = baseUrl(bot.slug);
            return (
              <div key={bot.id} className={`rounded-2xl border bg-card p-4 ${!bot.is_active ? "opacity-60" : ""}`}>
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 border ${meta.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-bold truncate">{bot.name}</p>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full border ${meta.color}`}>{meta.label}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full border flex items-center gap-1 ${bot.use_ai ? "bg-primary/10 text-primary border-primary/30" : "bg-muted text-muted-foreground border-border"}`}>
                        {bot.use_ai ? <><Zap className="w-2.5 h-2.5" /> IA</> : <><FileText className="w-2.5 h-2.5" /> Formulário</>}
                      </span>
                      {!bot.is_active && <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">Inativo</span>}
                    </div>
                    <p className="text-[10px] text-muted-foreground font-mono truncate mt-1">{url}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 mt-3">
                  <Button onClick={() => copyUrl(bot.slug)} variant="outline" size="sm" className="flex-1 sm:flex-none bg-card text-foreground hover:bg-accent hover:text-accent-foreground border-border">
                    <Copy className="w-3 h-3 mr-1" /> Copiar link
                  </Button>
                  <Button onClick={() => window.open(url, "_blank")} variant="outline" size="sm" className="flex-1 sm:flex-none bg-card text-foreground hover:bg-accent hover:text-accent-foreground border-border">
                    <ExternalLink className="w-3 h-3 mr-1" /> Testar
                  </Button>
                  <Button onClick={() => setEditing(bot)} variant="outline" size="sm" className="flex-1 sm:flex-none bg-card text-foreground hover:bg-accent hover:text-accent-foreground border-border">
                    <Edit3 className="w-3 h-3 mr-1" /> Editar
                  </Button>
                  <Button onClick={() => remove(bot.id)} variant="ghost" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10">
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
