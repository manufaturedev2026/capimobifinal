import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Bot, Copy, ExternalLink, Sparkles, Plus, Trash2, Home as HomeIcon, Save, Edit3, Upload, Loader2, X } from "lucide-react";

interface Props {
  sellerId: string;
  sellerSlug: string | null;
}

interface AgendaBot {
  id: string;
  seller_id: string;
  user_id: string;
  item_id: string | null;
  slug: string;
  name: string;
  attendant_name: string;
  attendant_avatar: string | null;
  opening_message: string | null;
  success_cta_label: string;
  success_cta_url: string | null;
  is_active: boolean;
}

interface SellerItem {
  id: string;
  title: string;
  neighborhood: string | null;
  city: string | null;
  category: string;
}

const slugify = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40) || `bot-${Date.now()}`;

export default function AgendaBotConfigTab({ sellerId, sellerSlug }: Props) {
  const { toast } = useToast();
  const [bots, setBots] = useState<AgendaBot[]>([]);
  const [items, setItems] = useState<SellerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<AgendaBot | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    const path = `${uid}/agenda-bots/${Date.now()}.${ext}`;
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

  const baseUrl = (botSlug: string) => `${window.location.origin}/agenda/${sellerSlug || sellerId}/chat/${botSlug}`;

  const load = async () => {
    setLoading(true);
    const [{ data: botsData }, { data: itemsData }] = await Promise.all([
      supabase.from("agenda_bots").select("*").eq("seller_id", sellerId).order("created_at", { ascending: false }),
      supabase.from("seller_items").select("id, title, neighborhood, city, category").eq("seller_id", sellerId).eq("status", "ativo").order("created_at", { ascending: false }).limit(200),
    ]);
    setBots((botsData as any) || []);
    setItems((itemsData as any) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [sellerId]);

  const startNew = () => {
    setEditing({
      id: "",
      seller_id: sellerId,
      user_id: "",
      item_id: null,
      slug: "",
      name: "Bot — Novo imóvel",
      attendant_name: "Assistente de Agendamento",
      attendant_avatar: null,
      opening_message: null,
      success_cta_label: "💬 Falar no WhatsApp",
      success_cta_url: null,
      is_active: true,
    });
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
      const { error } = await supabase.from("agenda_bots").update({
        item_id: editing.item_id, slug, name: editing.name,
        attendant_name: editing.attendant_name, attendant_avatar: editing.attendant_avatar,
        opening_message: editing.opening_message, success_cta_label: editing.success_cta_label,
        success_cta_url: editing.success_cta_url, is_active: editing.is_active,
      }).eq("id", editing.id);
      setSaving(false);
      if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return; }
    } else {
      const { error } = await supabase.from("agenda_bots").insert({
        seller_id: sellerId, user_id: uid, item_id: editing.item_id, slug, name: editing.name,
        attendant_name: editing.attendant_name, attendant_avatar: editing.attendant_avatar,
        opening_message: editing.opening_message, success_cta_label: editing.success_cta_label,
        success_cta_url: editing.success_cta_url, is_active: editing.is_active,
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
    const { error } = await supabase.from("agenda_bots").delete().eq("id", id);
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
    const linkedItem = items.find((i) => i.id === editing.item_id);
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold flex items-center gap-2">
            <Bot className="w-5 h-5 text-primary" />
            {editing.id ? "Editar bot" : "Novo bot"}
          </h3>
          <Button variant="ghost" size="sm" onClick={() => setEditing(null)}>Cancelar</Button>
        </div>

        <div className="rounded-2xl border bg-card p-4 space-y-3">
          <div>
            <label className="text-xs text-muted-foreground">Nome interno do bot</label>
            <Input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} placeholder="Ex: Bot — Apto Praia da Costa" className="mt-1" />
          </div>

          <div>
            <label className="text-xs text-muted-foreground">Imóvel pré-vinculado (opcional)</label>
            <Select value={editing.item_id || "none"} onValueChange={(v) => setEditing({ ...editing, item_id: v === "none" ? null : v })}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sem vínculo (cliente escolhe via IA)</SelectItem>
                {items.map((i) => (
                  <SelectItem key={i.id} value={i.id}>
                    {i.title} {i.neighborhood ? `— ${i.neighborhood}` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {linkedItem && (
              <p className="text-[11px] text-emerald-700 mt-1 flex items-center gap-1">
                <HomeIcon className="w-3 h-3" /> Bot pré-configurado para este imóvel — IA não precisa adivinhar.
              </p>
            )}
          </div>

          <div>
            <label className="text-xs text-muted-foreground">Slug do link (URL)</label>
            <Input value={editing.slug} onChange={(e) => setEditing({ ...editing, slug: slugify(e.target.value) })} placeholder={slugify(editing.name)} className="mt-1 font-mono text-xs" />
            <p className="text-[10px] text-muted-foreground mt-1">{baseUrl(editing.slug || slugify(editing.name))}</p>
          </div>
        </div>

        <div className="rounded-2xl border bg-card p-4 space-y-3">
          <p className="text-sm font-bold">Atendente virtual</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground">Nome</label>
              <Input value={editing.attendant_name} onChange={(e) => setEditing({ ...editing, attendant_name: e.target.value })} className="mt-1" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Avatar do atendente</label>
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
                    <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={uploadingAvatar} className="flex-1">
                      {uploadingAvatar ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Upload className="w-3 h-3 mr-1" />}
                      {uploadingAvatar ? "Enviando..." : "Enviar foto"}
                    </Button>
                    {editing.attendant_avatar && (
                      <Button type="button" variant="ghost" size="sm" onClick={() => setEditing({ ...editing, attendant_avatar: null })} className="text-red-600">
                        <X className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                  <Input
                    value={editing.attendant_avatar || ""}
                    onChange={(e) => setEditing({ ...editing, attendant_avatar: e.target.value || null })}
                    placeholder="ou cole uma URL https://..."
                    className="h-8 text-xs"
                  />
                </div>
              </div>
            </div>
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Mensagem de abertura (opcional)</label>
            <Textarea value={editing.opening_message || ""} onChange={(e) => setEditing({ ...editing, opening_message: e.target.value || null })} className="mt-1 min-h-[70px]" placeholder="Deixe em branco — a IA gera saudação contextual." />
          </div>
        </div>

        <div className="rounded-2xl border bg-card p-4 space-y-3">
          <p className="text-sm font-bold">Botão pós-agendamento</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground">Texto</label>
              <Input value={editing.success_cta_label} onChange={(e) => setEditing({ ...editing, success_cta_label: e.target.value })} className="mt-1" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">URL custom (vazio = WhatsApp do corretor)</label>
              <Input value={editing.success_cta_url || ""} onChange={(e) => setEditing({ ...editing, success_cta_url: e.target.value || null })} className="mt-1" />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-2xl border bg-card p-4">
          <Switch checked={editing.is_active} onCheckedChange={(v) => setEditing({ ...editing, is_active: v })} />
          <span className="text-sm">Bot ativo (link funcionando)</span>
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
              Bots de Agendamento <Sparkles className="w-4 h-4 text-amber-500" />
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Crie um bot para cada imóvel. Cada um tem link próprio e a IA já sabe qual visita está sendo agendada — sem confusão.
            </p>
          </div>
        </div>
      </div>

      <Button onClick={startNew} size="lg" className="w-full sm:w-auto">
        <Plus className="w-4 h-4 mr-2" /> Criar novo bot
      </Button>

      {bots.length === 0 ? (
        <div className="rounded-2xl border border-dashed p-8 text-center text-muted-foreground">
          <Bot className="w-10 h-10 mx-auto mb-2 opacity-40" />
          <p className="text-sm">Nenhum bot criado ainda. Clique acima para começar.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {bots.map((bot) => {
            const linked = items.find((i) => i.id === bot.item_id);
            const url = baseUrl(bot.slug);
            return (
              <div key={bot.id} className={`rounded-2xl border bg-card p-4 ${!bot.is_active ? "opacity-60" : ""}`}>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Bot className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-bold truncate">{bot.name}</p>
                      {!bot.is_active && <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">Inativo</span>}
                      {linked && <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 flex items-center gap-1"><HomeIcon className="w-3 h-3" /> Pré-vinculado</span>}
                    </div>
                    {linked ? (
                      <p className="text-xs text-muted-foreground truncate mt-0.5">📍 {linked.title}{linked.neighborhood ? ` — ${linked.neighborhood}` : ""}</p>
                    ) : (
                      <p className="text-xs text-muted-foreground mt-0.5">IA identifica imóvel pelo texto livre</p>
                    )}
                    <p className="text-[10px] text-muted-foreground font-mono truncate mt-1">{url}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 mt-3">
                  <Button onClick={() => copyUrl(bot.slug)} variant="outline" size="sm" className="flex-1 sm:flex-none">
                    <Copy className="w-3 h-3 mr-1" /> Copiar link
                  </Button>
                  <Button onClick={() => window.open(url, "_blank")} variant="outline" size="sm" className="flex-1 sm:flex-none">
                    <ExternalLink className="w-3 h-3 mr-1" /> Testar
                  </Button>
                  <Button onClick={() => setEditing(bot)} variant="outline" size="sm" className="flex-1 sm:flex-none">
                    <Edit3 className="w-3 h-3 mr-1" /> Editar
                  </Button>
                  <Button onClick={() => remove(bot.id)} variant="ghost" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50">
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
