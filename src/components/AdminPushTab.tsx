import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Bell, Send, Users, Clock, CheckCircle2, XCircle, Loader2, Trash2, MessageSquare, Megaphone, ImagePlus, X, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BRAZIL_STATES } from "@/data/brazilStates";

interface AdminPushTabProps {
  userId: string;
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

export default function AdminPushTab({ userId }: AdminPushTabProps) {
  const { toast } = useToast();
  const [totalSubscribers, setTotalSubscribers] = useState(0);
  const [totalSellers, setTotalSellers] = useState(0);
  const [totalCorretores, setTotalCorretores] = useState(0);
  const [totalImobiliarias, setTotalImobiliarias] = useState(0);
  const [totalConstrutoras, setTotalConstrutoras] = useState(0);
  const [logs, setLogs] = useState<NotificationLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [url, setUrl] = useState("");
  const [image, setImage] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [audience, setAudience] = useState<"all" | "corretor" | "imobiliaria" | "construtora" | "professionals" | "clients">("all");
  const [filterState, setFilterState] = useState<string>("all");
  const [filterCity, setFilterCity] = useState<string>("all");
  const [regionData, setRegionData] = useState<Record<string, string[]>>({});
  const availableStates = Object.keys(regionData).sort();
  const stateCities = filterState !== "all" ? (regionData[filterState] || []) : [];
  const [estimate, setEstimate] = useState<number | null>(null);
  const [estimating, setEstimating] = useState(false);

  // Estimate number of recipients when filters change
  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setEstimating(true);
      try {
        const hasCategoryFilter = audience !== "all";
        const hasRegionFilter = filterState !== "all" || filterCity !== "all";

        if (!hasCategoryFilter && !hasRegionFilter) {
          // All subscriptions, deduplicated by endpoint
          const { data } = await supabase.from("push_subscriptions" as any).select("endpoint");
          if (cancelled) return;
          const unique = new Set((data || []).map((s: any) => s.endpoint));
          setEstimate(unique.size);
          return;
        }

        // Build profiles query matching server logic
        let profilesQuery = supabase.from("profiles").select("id");
        if (audience === "professionals") {
          profilesQuery = profilesQuery.in("seller_category", ["corretor", "imobiliaria", "construtora"]);
        } else if (audience === "clients") {
          profilesQuery = profilesQuery.or(
            "seller_category.is.null,seller_category.in.(proprietario,autonomo,loja_veiculos,concessionaria)"
          );
        } else if (audience !== "all") {
          profilesQuery = profilesQuery.eq("seller_category", audience as any);
        }
        if (filterState !== "all") profilesQuery = profilesQuery.eq("state", filterState);
        // Quando uma cidade específica é selecionada, filtra por ela.
        // Quando "todas as cidades de X", inclui também profiles sem cidade preenchida (state-only match).
        if (filterCity !== "all") profilesQuery = profilesQuery.ilike("city", filterCity);

        const { data: profs } = await profilesQuery;
        if (cancelled) return;
        const ids = (profs || []).map((p: any) => p.id);
        if (ids.length === 0) {
          setEstimate(0);
          return;
        }
        const { data: subs } = await supabase
          .from("push_subscriptions" as any)
          .select("endpoint")
          .in("seller_id", ids);
        if (cancelled) return;
        const unique = new Set((subs || []).map((s: any) => s.endpoint));
        setEstimate(unique.size);
      } finally {
        if (!cancelled) setEstimating(false);
      }
    };
    run();
    return () => { cancelled = true; };
  }, [audience, filterState, filterCity, totalSubscribers]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `push-images/admin/${Date.now()}.${ext}`;
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

  const fetchData = async () => {
    const { count: subCount } = await supabase
      .from("push_subscriptions" as any)
      .select("id", { count: "exact", head: true });

    setTotalSubscribers(subCount || 0);

    // Count unique seller_ids with subscriptions, joined with profile category
    const { data: sellerData } = await supabase
      .from("push_subscriptions" as any)
      .select("seller_id");

    const uniqueSellerIds = Array.from(new Set((sellerData || []).map((s: any) => s.seller_id))).filter(Boolean);
    setTotalSellers(uniqueSellerIds.length);

    if (uniqueSellerIds.length > 0) {
      const { data: profs } = await supabase
        .from("profiles")
        .select("id, seller_category")
        .in("id", uniqueSellerIds);
      const counts = { corretor: 0, imobiliaria: 0, construtora: 0 };
      for (const p of (profs || []) as any[]) {
        if (p.seller_category === "corretor") counts.corretor++;
        else if (p.seller_category === "imobiliaria") counts.imobiliaria++;
        else if (p.seller_category === "construtora") counts.construtora++;
      }
      setTotalCorretores(counts.corretor);
      setTotalImobiliarias(counts.imobiliaria);
      setTotalConstrutoras(counts.construtora);
    } else {
      setTotalCorretores(0);
      setTotalImobiliarias(0);
      setTotalConstrutoras(0);
    }

    const { data: logData } = await supabase
      .from("push_notifications_log" as any)
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(20);

    setLogs((logData as unknown as NotificationLog[]) || []);

    // Load distinct states/cities from active listings (paginate to bypass 1000 row cap)
    const regions: Record<string, Set<string>> = {};
    let from = 0;
    const pageSize = 1000;
    while (true) {
      const { data: items } = await supabase
        .from("seller_items")
        .select("state, city")
        .eq("status", "ativo")
        .range(from, from + pageSize - 1);
      if (!items || items.length === 0) break;
      for (const it of items as any[]) {
        const uf = (it.state || "").trim().toUpperCase();
        const ct = (it.city || "").trim();
        if (!uf) continue;
        if (!regions[uf]) regions[uf] = new Set();
        if (ct) regions[uf].add(ct);
      }
      if (items.length < pageSize) break;
      from += pageSize;
    }
    const regionMap: Record<string, string[]> = {};
    for (const uf of Object.keys(regions)) {
      regionMap[uf] = Array.from(regions[uf]).sort((a, b) => a.localeCompare(b, "pt-BR"));
    }
    setRegionData(regionMap);

    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [userId]);

  const handleSend = async () => {
    if (!title.trim() || !body.trim()) {
      toast({ title: "Preencha título e mensagem", variant: "destructive" });
      return;
    }

    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-push-admin", {
        body: {
          title: title.trim(),
          body: body.trim(),
          url: url.trim() || undefined,
          image: image || undefined,
          audience,
          state: filterState !== "all" ? filterState : undefined,
          city: filterCity !== "all" ? filterCity : undefined,
        },
      });

      if (error) throw error;

      toast({
        title: "Notificação enviada para todos! 🚀",
        description: `${data.sent} enviadas, ${data.failed} falharam de ${data.total} dispositivos`,
      });

      setTitle("");
      setBody("");
      setUrl("");
      setImage("");
      fetchData();
    } catch (err: any) {
      toast({ title: "Erro ao enviar", description: err.message, variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  const handleDeleteLog = async (id: string) => {
    await supabase.from("push_notifications_log" as any).delete().eq("id", id);
    setLogs((prev) => prev.filter((l) => l.id !== id));
    toast({ title: "Registro removido" });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
          <Megaphone className="w-5 h-5" /> Push para Corretores
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Envie notificações push para todos os corretores que instalaram o app
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="p-4 rounded-xl border border-border bg-card">
          <div className="flex items-center gap-2 mb-1">
            <Users className="w-4 h-4 text-primary" />
            <span className="text-xs text-muted-foreground font-medium">Dispositivos</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{totalSubscribers}</p>
        </div>
        <div className="p-4 rounded-xl border border-border bg-card">
          <div className="flex items-center gap-2 mb-1">
            <Bell className="w-4 h-4 text-primary" />
            <span className="text-xs text-muted-foreground font-medium">Corretores</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{totalCorretores}</p>
        </div>
        <div className="p-4 rounded-xl border border-border bg-card">
          <div className="flex items-center gap-2 mb-1">
            <Bell className="w-4 h-4 text-primary" />
            <span className="text-xs text-muted-foreground font-medium">Imobiliárias</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{totalImobiliarias}</p>
        </div>
        <div className="p-4 rounded-xl border border-border bg-card">
          <div className="flex items-center gap-2 mb-1">
            <Bell className="w-4 h-4 text-primary" />
            <span className="text-xs text-muted-foreground font-medium">Construtoras</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{totalConstrutoras}</p>
        </div>
        <div className="p-4 rounded-xl border border-border bg-card hidden md:block">
          <div className="flex items-center gap-2 mb-1">
            <Send className="w-4 h-4 text-primary" />
            <span className="text-xs text-muted-foreground font-medium">Enviadas</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{logs.length}</p>
        </div>
      </div>

      {/* Compose */}
      <div className="p-6 rounded-xl border border-border bg-card space-y-4">
        <h3 className="text-base font-bold text-foreground flex items-center gap-2">
          <MessageSquare className="w-4 h-4" /> Enviar para Todos os Corretores
        </h3>

        {totalSubscribers === 0 ? (
          <div className="text-center py-8">
            <Bell className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
            <p className="text-sm font-medium text-muted-foreground">Nenhum inscrito ainda</p>
            <p className="text-xs text-muted-foreground mt-1">
              Quando corretores instalarem o app e aceitarem notificações, eles aparecerão aqui.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5" /> Público-alvo
              </Label>
              <Select value={audience} onValueChange={(v) => { setAudience(v as any); if (v === "clients") { setFilterState("all"); setFilterCity("all"); } }}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os inscritos</SelectItem>
                  <SelectItem value="clients">Apenas Clientes (não profissionais)</SelectItem>
                  <SelectItem value="professionals">Apenas profissionais (Corretores + Imobiliárias + Construtoras)</SelectItem>
                  <SelectItem value="corretor">Apenas Corretores</SelectItem>
                  <SelectItem value="imobiliaria">Apenas Imobiliárias</SelectItem>
                  <SelectItem value="construtora">Apenas Construtoras</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {audience !== "clients" && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Estado (UF)</Label>
                  <Select value={filterState} onValueChange={(v) => { setFilterState(v); setFilterCity("all"); }}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="max-h-60">
                      <SelectItem value="all">Todos os estados</SelectItem>
                      {availableStates.map((uf) => {
                        const meta = BRAZIL_STATES.find((s) => s.uf === uf);
                        return (
                          <SelectItem key={uf} value={uf}>
                            {uf}{meta ? ` — ${meta.name}` : ""}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                  {availableStates.length === 0 && (
                    <p className="text-[10px] text-muted-foreground">Nenhum imóvel cadastrado ainda</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Cidade</Label>
                  <Select
                    value={filterCity}
                    onValueChange={setFilterCity}
                    disabled={filterState === "all" || stateCities.length === 0}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={filterState === "all" ? "Selecione um estado" : "Todas as cidades"} />
                    </SelectTrigger>
                    <SelectContent className="max-h-60">
                      <SelectItem value="all">Todas as cidades de {filterState}</SelectItem>
                      {stateCities.map((c) => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {/* Estimate badge */}
            <div className="flex items-center gap-2 p-3 rounded-lg border border-primary/20 bg-primary/5">
              <Target className="w-4 h-4 text-primary shrink-0" />
              <div className="flex-1 text-xs">
                {estimating ? (
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <Loader2 className="w-3 h-3 animate-spin" /> Calculando estimativa...
                  </span>
                ) : (
                  <>
                    <span className="font-bold text-foreground">
                      ~{estimate ?? 0} dispositivo{estimate !== 1 ? "s" : ""}
                    </span>
                    <span className="text-muted-foreground"> receberão esta notificação</span>
                  </>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Título *</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Nova atualização disponível!"
                maxLength={100}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Mensagem *</Label>
              <Textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Ex: Confira os novos recursos do painel"
                maxLength={250}
                rows={3}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Link (opcional)</Label>
              <Input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Ex: /painel"
              />
              <p className="text-[10px] text-muted-foreground">URL para onde o corretor será levado ao clicar</p>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Imagem (opcional)</Label>
              {image ? (
                <div className="relative w-full max-w-[200px]">
                  <img src={image} alt="Preview" className="rounded-lg w-full h-24 object-cover border border-border" />
                  <button
                    type="button"
                    onClick={() => setImage("")}
                    className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <label className="flex items-center gap-2 cursor-pointer text-xs text-muted-foreground hover:text-foreground transition-colors">
                  <ImagePlus className="w-4 h-4" />
                  {uploadingImage ? "Enviando..." : "Adicionar imagem"}
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploadingImage} />
                </label>
              )}
            </div>

            <Button onClick={handleSend} disabled={sending || !title.trim() || !body.trim()} className="w-full gap-2">
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Megaphone className="w-4 h-4" />}
              Enviar para ~{estimate ?? totalSubscribers} dispositivo{(estimate ?? totalSubscribers) !== 1 ? "s" : ""}
            </Button>
          </div>
        )}
      </div>

      {/* History */}
      {logs.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-base font-bold text-foreground flex items-center gap-2">
            <Clock className="w-4 h-4" /> Histórico de Broadcasts
          </h3>
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
