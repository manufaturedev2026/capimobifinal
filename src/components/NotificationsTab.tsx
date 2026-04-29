import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Bell, Send, Users, Clock, CheckCircle2, XCircle, Loader2, Trash2, MessageSquare, BellRing, Smartphone, ImagePlus, X, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { usePushSubscription } from "@/hooks/usePushSubscription";
import { useSubscription } from "@/hooks/useSubscription";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const PUSH_DAILY_LIMITS: Record<string, number> = {
  basico: 1,
  basico_empresa: 1,
  start: 1,
  premium: 2,
  vip: 3,
  essencial_empresa: 4,
  premium_empresa: 5,
  prime_empresa: 6,
};

interface NotificationsTabProps {
  userId: string;
  sellerId: string;
}

interface NotificationLog {
  id: string;
  title: string;
  body: string;
  url: string | null;
  sent_count: number;
  failed_count: number;
  created_at: string;
}

export default function NotificationsTab({ userId, sellerId }: NotificationsTabProps) {
  const { toast } = useToast();
  const pushSub = usePushSubscription(sellerId);
  const [subscriberCount, setSubscriberCount] = useState(0);
  const [logs, setLogs] = useState<NotificationLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [selectedItemId, setSelectedItemId] = useState<string>("");
  const [image, setImage] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [items, setItems] = useState<{ id: string; title: string; slug: string | null; photos: string[] | null }[]>([]);

  const { currentTier } = useSubscription(userId);
  const dailyLimit = PUSH_DAILY_LIMITS[currentTier] ?? 1;
  const sentToday = logs.filter((l) => {
    const d = new Date(l.created_at);
    const now = new Date();
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
  }).length;
  const limitReached = sentToday >= dailyLimit;

  const fetchData = async () => {
    // Get subscriber count
    const { count } = await supabase
      .from("push_subscriptions" as any)
      .select("id", { count: "exact", head: true })
      .eq("seller_id", sellerId);

    setSubscriberCount(count || 0);

    // Get notification logs
    const { data: logData } = await supabase
      .from("push_notifications_log" as any)
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(20);

    setLogs((logData as unknown as NotificationLog[]) || []);

    // Fetch seller items for the item picker
    const { data: itemsData } = await supabase
      .from("seller_items")
      .select("id, title, slug, photos")
      .eq("seller_id", sellerId)
      .eq("status", "ativo")
      .order("title");

    setItems((itemsData as any) || []);
    setLoading(false);
  };

  const handleDeleteLog = async (id: string) => {
    await supabase.from("push_notifications_log" as any).delete().eq("id", id);
    setLogs((prev) => prev.filter((l) => l.id !== id));
    toast({ title: "Registro removido" });
  };

  const handleClearAll = async () => {
    await supabase.from("push_notifications_log" as any).delete().eq("user_id", userId);
    setLogs([]);
    toast({ title: "Histórico limpo" });
  };

  useEffect(() => {
    fetchData();
  }, [userId, sellerId]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `push-images/${sellerId}/${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("seller-uploads").upload(path, file, { upsert: true });
      if (error) throw error;
      const { data: urlData } = supabase.storage.from("seller-uploads").getPublicUrl(path);
      setImage(urlData.publicUrl);
    } catch (err: any) {
      toast({ title: "Erro ao enviar imagem", description: err.message, variant: "destructive" });
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSend = async () => {
    if (!title.trim() || !body.trim()) {
      toast({ title: "Preencha título e mensagem", variant: "destructive" });
      return;
    }

    setSending(true);
    try {
      const selectedItem = selectedItemId && selectedItemId !== "none" ? items.find(i => i.id === selectedItemId) : undefined;
      const itemUrl = selectedItem?.slug ? `/imovel/${selectedItem.slug}` : undefined;

      const { data, error } = await supabase.functions.invoke("send-push", {
        body: {
          title: title.trim(),
          body: body.trim(),
          url: itemUrl,
          image: image || (selectedItem?.photos?.[0]) || undefined,
        },
      });

      if (error) throw error;

      if (data?.error === "daily_limit_reached") {
        toast({
          title: "Limite diário atingido",
          description: data.message || `Seu plano permite ${data.limit} envio(s) por dia.`,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Notificação enviada! 🚀",
        description: `${data.sent} enviadas, ${data.failed} falharam de ${data.total} inscritos`,
      });

      setTitle("");
      setBody("");
      setSelectedItemId("");
      setImage("");
      fetchData();
    } catch (err: any) {
      toast({ title: "Erro ao enviar", description: err.message, variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
          <Bell className="w-5 h-5" /> Push Notifications
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Envie notificações para quem instalou seu app
        </p>
      </div>

      {/* Stats */}
      {/* Self-subscribe test button — only show if not yet subscribed */}
      {pushSub.isSupported && !pushSub.isSubscribed && (
        <div className="p-4 rounded-xl border border-border bg-card space-y-3">
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
            <Smartphone className="w-4 h-4" /> Testar neste navegador
          </h3>
          {pushSub.permission === "denied" ? (
            <p className="text-xs text-destructive">
              ❌ Notificações bloqueadas neste navegador. Vá nas configurações do navegador para desbloquear.
            </p>
          ) : (
            <Button
              size="sm"
              variant="outline"
              className="gap-2"
              disabled={pushSub.loading}
              onClick={async () => {
                const ok = await pushSub.subscribe();
                if (ok) fetchData();
              }}
            >
              {pushSub.loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <BellRing className="w-4 h-4" />
              )}
              {pushSub.loading ? "Ativando..." : "Ativar Push neste navegador"}
            </Button>
          )}
          <p className="text-[10px] text-muted-foreground">
            Inscreva este dispositivo para testar o envio de notificações.
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="stat-card p-4 rounded-xl border border-border bg-card">
          <div className="flex items-center gap-2 mb-1">
            <Users className="w-4 h-4 text-primary" />
            <span className="text-xs text-muted-foreground font-medium">Inscritos</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{subscriberCount}</p>
        </div>
        <div className="stat-card p-4 rounded-xl border border-border bg-card">
          <div className="flex items-center gap-2 mb-1">
            <Send className="w-4 h-4 text-primary" />
            <span className="text-xs text-muted-foreground font-medium">Enviadas</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{logs.length}</p>
        </div>
        <div className="stat-card p-4 rounded-xl border border-border bg-card hidden md:block">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle2 className="w-4 h-4 text-green-500" />
            <span className="text-xs text-muted-foreground font-medium">Entregues (última)</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{logs[0]?.sent_count ?? 0}</p>
        </div>
      </div>

      {/* Daily limit indicator */}
      <div
        className={`p-4 rounded-xl border ${
          limitReached ? "border-destructive/50 bg-destructive/5" : "border-border bg-card"
        }`}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Clock className={`w-4 h-4 ${limitReached ? "text-destructive" : "text-primary"}`} />
            <span className="text-sm font-bold text-foreground">Envios hoje</span>
          </div>
          <span className={`text-sm font-bold ${limitReached ? "text-destructive" : "text-foreground"}`}>
            {sentToday} / {dailyLimit}
          </span>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          {limitReached
            ? "Você atingiu o limite diário do seu plano. Faça upgrade para enviar mais."
            : `Seu plano permite ${dailyLimit} envio${dailyLimit > 1 ? "s" : ""} de push por dia.`}
        </p>
      </div>

      {/* Compose */}
      <div className="p-6 rounded-xl border border-border bg-card space-y-4">
        <h3 className="text-base font-bold text-foreground flex items-center gap-2">
          <MessageSquare className="w-4 h-4" /> Enviar Notificação
        </h3>

        {subscriberCount === 0 ? (
          <div className="text-center py-8">
            <Bell className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
            <p className="text-sm font-medium text-muted-foreground">Nenhum inscrito ainda</p>
            <p className="text-xs text-muted-foreground mt-1">
              Quando visitantes instalarem seu app/PWA e aceitarem notificações, eles aparecerão aqui.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Título *</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Novo imóvel disponível!"
                maxLength={100}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Mensagem *</Label>
              <Textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Ex: Casa 3 quartos no Centro por R$ 350.000"
                maxLength={250}
                rows={3}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium flex items-center gap-1.5">
                <Home className="w-3.5 h-3.5" /> Imóvel vinculado (opcional)
              </Label>
              <Select value={selectedItemId} onValueChange={setSelectedItemId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um imóvel" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhum (sem link)</SelectItem>
                  {items.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-[10px] text-muted-foreground">O link e a foto do imóvel serão usados na notificação</p>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Imagem (opcional)</Label>
              {image ? (
                <div className="relative w-full h-32 rounded-lg overflow-hidden border border-border">
                  <img loading="lazy" decoding="async" src={image} alt="Preview" className="w-full h-full object-cover" />
                  <Button
                    type="button"
                    size="icon"
                    variant="destructive"
                    className="absolute top-1 right-1 h-6 w-6"
                    onClick={() => setImage("")}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              ) : (
                <label className="flex items-center gap-2 p-3 rounded-lg border border-dashed border-border cursor-pointer hover:bg-muted/50 transition-colors">
                  {uploadingImage ? (
                    <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                  ) : (
                    <ImagePlus className="w-4 h-4 text-muted-foreground" />
                  )}
                  <span className="text-xs text-muted-foreground">
                    {uploadingImage ? "Enviando..." : "Clique para selecionar uma imagem"}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                    disabled={uploadingImage}
                  />
                </label>
              )}
              <p className="text-[10px] text-muted-foreground">Imagem exibida na notificação (ex: foto do imóvel)</p>
            </div>

            <Button onClick={handleSend} disabled={sending || uploadingImage || !title.trim() || !body.trim() || limitReached} className="w-full gap-2">
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {limitReached ? "Limite diário atingido" : `Enviar para ${subscriberCount} inscrito${subscriberCount !== 1 ? "s" : ""}`}
            </Button>
          </div>
        )}
      </div>

      {/* History */}
      {logs.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              <Clock className="w-4 h-4" /> Histórico
            </h3>
            <Button size="sm" variant="ghost" className="text-xs text-destructive gap-1" onClick={handleClearAll}>
              <Trash2 className="w-3.5 h-3.5" /> Limpar tudo
            </Button>
          </div>

          <div className="space-y-2">
            {logs.map((log) => (
              <div key={log.id} className="p-4 rounded-xl border border-border bg-card">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-sm text-foreground">{log.title}</h4>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{log.body}</p>
                    {log.url && (
                      <p className="text-[10px] text-primary mt-1 truncate">🔗 {log.url}</p>
                    )}
                  </div>
                  <div className="flex items-start gap-2 shrink-0">
                    <div className="text-right">
                      <div className="flex items-center gap-1 text-xs">
                        <CheckCircle2 className="w-3 h-3 text-green-500" />
                        <span className="text-green-600 font-medium">{log.sent_count}</span>
                        {log.failed_count > 0 && (
                          <>
                            <XCircle className="w-3 h-3 text-red-400 ml-1" />
                            <span className="text-red-400 font-medium">{log.failed_count}</span>
                          </>
                        )}
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-1">
                        {new Date(log.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                    <Button size="icon" variant="ghost" className="h-6 w-6 text-muted-foreground hover:text-destructive" onClick={() => handleDeleteLog(log.id)}>
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
