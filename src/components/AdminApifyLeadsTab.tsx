import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { BRAZIL_STATES } from "@/data/brazilStates";
import { useCitiesByState } from "@/hooks/useCitiesByState";
import {
  Activity, Search, Settings as SettingsIcon, Database, Mail, History,
  Loader2, Play, RefreshCw, MessageCircle, Trash2, Send, Filter, MapPin,
  CheckCircle2, XCircle, Building2, User, Globe, Instagram, Phone,
} from "lucide-react";

type Lead = {
  id: string;
  nome: string;
  tipo_lead: string;
  empresa: string | null;
  email: string | null;
  whatsapp: string | null;
  telefone: string | null;
  site: string | null;
  instagram: string | null;
  cidade: string | null;
  estado: string | null;
  endereco: string | null;
  status: string;
  rating: number | null;
  reviews_count: number | null;
  origem: string;
  data_captacao: string;
  observacoes: string | null;
};

type Run = {
  id: string;
  tipo_lead: string;
  estado: string | null;
  cidade: string | null;
  palavra_chave: string | null;
  quantidade_solicitada: number;
  quantidade_retornada: number;
  quantidade_importada: number;
  quantidade_duplicada: number;
  status: string;
  error_message: string | null;
  duration_ms: number | null;
  created_at: string;
};

const QUICK_SEARCHES = [
  "imobiliária em São Paulo",
  "imobiliária em Belo Horizonte",
  "corretor de imóveis em Goiânia",
  "corretor imobiliário em Vitória ES",
  "imobiliária em Curitiba",
  "corretor autônomo Rio de Janeiro",
];

export default function AdminApifyLeadsTab() {
  const { toast } = useToast();
  const [tab, setTab] = useState("dashboard");

  // Settings
  const [apifyToken, setApifyToken] = useState("");
  const [actorId, setActorId] = useState("compass~crawler-google-places");
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsLoaded, setSettingsLoaded] = useState(false);

  // Search form
  const [tipoLead, setTipoLead] = useState<"imobiliaria" | "corretor" | "ambos">("ambos");
  const [estado, setEstado] = useState("");
  const [cidade, setCidade] = useState("");
  const [palavraChave, setPalavraChave] = useState("");
  const [quantidade, setQuantidade] = useState(50);
  const [searching, setSearching] = useState(false);
  const { cities } = useCitiesByState(estado);

  // Data
  const [leads, setLeads] = useState<Lead[]>([]);
  const [runs, setRuns] = useState<Run[]>([]);
  const [loading, setLoading] = useState(false);

  // Filters list
  const [fEstado, setFEstado] = useState("");
  const [fTipo, setFTipo] = useState("");
  const [fStatus, setFStatus] = useState("");
  const [fSearch, setFSearch] = useState("");
  const [fHasEmail, setFHasEmail] = useState(false);
  const [fHasWhats, setFHasWhats] = useState(false);

  // Campaign dialog
  const [campOpen, setCampOpen] = useState(false);
  const [campSubject, setCampSubject] = useState("");
  const [campName, setCampName] = useState("");
  const [campHtml, setCampHtml] = useState("");
  const [campTipo, setCampTipo] = useState("todos");
  const [campEstado, setCampEstado] = useState("");
  const [campStatus, setCampStatus] = useState("todos");
  const [campTestEmail, setCampTestEmail] = useState("");
  const [campSending, setCampSending] = useState(false);
  const [campTesting, setCampTesting] = useState(false);

  useEffect(() => {
    loadSettings();
    loadLeads();
    loadRuns();
  }, []);

  async function loadSettings() {
    const { data } = await supabase
      .from("platform_settings").select("key, value")
      .in("key", ["apify_token", "apify_actor_id"]);
    const map = Object.fromEntries((data || []).map((s) => [s.key, s.value]));
    setApifyToken(map.apify_token || "");
    setActorId(map.apify_actor_id || "compass~crawler-google-places");
    setSettingsLoaded(true);
  }

  async function saveSettings() {
    setSavingSettings(true);
    const rows = [
      { key: "apify_token", value: apifyToken },
      { key: "apify_actor_id", value: actorId || "compass~crawler-google-places" },
    ];
    const { error } = await supabase.from("platform_settings").upsert(rows, { onConflict: "key" });
    setSavingSettings(false);
    if (error) toast({ title: "Erro", description: error.message, variant: "destructive" });
    else toast({ title: "Configurações salvas" });
  }

  async function loadLeads() {
    setLoading(true);
    const { data } = await supabase
      .from("leads_imobiliarios")
      .select("*")
      .order("data_captacao", { ascending: false })
      .limit(500);
    setLeads((data || []) as Lead[]);
    setLoading(false);
  }

  async function loadRuns() {
    const { data } = await supabase
      .from("apify_search_runs").select("*").order("created_at", { ascending: false }).limit(50);
    setRuns((data || []) as Run[]);
  }

  async function runSearch() {
    if (!apifyToken) {
      toast({ title: "Configure o Token Apify", description: "Vá em Configurações Apify", variant: "destructive" });
      setTab("config");
      return;
    }

    setSearching(true);
    const { data, error } = await supabase.functions.invoke("apify-search-leads", {
      body: { tipo_lead: tipoLead, estado, cidade, palavra_chave: palavraChave, quantidade },
    });
    setSearching(false);

    const payload = data as any;

    if (error) {
      toast({ title: "Erro na busca", description: error.message, variant: "destructive" });
      await loadRuns();
      return;
    }

    if (payload?.success === false || payload?.error) {
      toast({ title: "Busca não iniciada", description: payload?.error || "Falha ao iniciar a busca.", variant: "destructive" });
      await loadRuns();
      return;
    }

    toast({
      title: "Busca iniciada",
      description: payload?.message || "A captura está rodando em segundo plano.",
    });

    await loadRuns();
  }

  async function deleteLead(id: string) {
    if (!confirm("Excluir este lead?")) return;
    await supabase.from("leads_imobiliarios").delete().eq("id", id);
    setLeads((p) => p.filter((l) => l.id !== id));
  }

  async function markStatus(id: string, status: string) {
    await supabase.from("leads_imobiliarios").update({ status }).eq("id", id);
    setLeads((p) => p.map((l) => (l.id === id ? { ...l, status } : l)));
  }

  async function sendCampaign(test: boolean) {
    if (test && !campTestEmail) {
      toast({ title: "Informe o e-mail de teste", variant: "destructive" });
      return;
    }
    if (!campSubject || !campHtml) {
      toast({ title: "Preencha assunto e conteúdo", variant: "destructive" });
      return;
    }
    if (test) setCampTesting(true); else setCampSending(true);
    const { data, error } = await supabase.functions.invoke("send-leads-campaign", {
      body: {
        name: campName || campSubject,
        subject: campSubject,
        content_html: campHtml,
        segment_filter: { tipo_lead: campTipo, estado: campEstado, status: campStatus },
        test_email: test ? campTestEmail : undefined,
      },
    });
    if (test) setCampTesting(false); else setCampSending(false);
    if (error || (data as any)?.error) {
      toast({ title: "Erro", description: error?.message || (data as any)?.error, variant: "destructive" });
    } else {
      const d = data as any;
      toast({
        title: test ? "E-mail de teste enviado" : "Campanha enviada",
        description: test ? campTestEmail : `${d.sent} enviados • ${d.failed} falhas • ${d.total} destinatários`,
      });
      if (!test) setCampOpen(false);
    }
  }

  // Stats
  const stats = useMemo(() => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const monthAgo = new Date(); monthAgo.setDate(monthAgo.getDate() - 30);
    return {
      hoje: leads.filter((l) => new Date(l.data_captacao) >= today).length,
      mes: leads.filter((l) => new Date(l.data_captacao) >= monthAgo).length,
      imobiliarias: leads.filter((l) => l.tipo_lead === "imobiliaria").length,
      corretores: leads.filter((l) => l.tipo_lead === "corretor").length,
      comEmail: leads.filter((l) => l.email).length,
      comWhats: leads.filter((l) => l.whatsapp).length,
      novos: leads.filter((l) => l.status === "novo").length,
      total: leads.length,
      ultimaSync: runs.find((r) => r.status === "concluido")?.created_at || null,
      erros: runs.filter((r) => r.status === "erro").length,
    };
  }, [leads, runs]);

  const porEstado = useMemo(() => {
    const m: Record<string, number> = {};
    leads.forEach((l) => { if (l.estado) m[l.estado] = (m[l.estado] || 0) + 1; });
    return Object.entries(m).sort((a, b) => b[1] - a[1]);
  }, [leads]);

  const filteredLeads = useMemo(() => {
    return leads.filter((l) => {
      if (fEstado && l.estado !== fEstado) return false;
      if (fTipo && l.tipo_lead !== fTipo) return false;
      if (fStatus && l.status !== fStatus) return false;
      if (fHasEmail && !l.email) return false;
      if (fHasWhats && !l.whatsapp) return false;
      if (fSearch) {
        const s = fSearch.toLowerCase();
        return (l.nome?.toLowerCase().includes(s) || l.email?.toLowerCase().includes(s) || l.cidade?.toLowerCase().includes(s));
      }
      return true;
    });
  }, [leads, fEstado, fTipo, fStatus, fHasEmail, fHasWhats, fSearch]);

  const statusBadge = (s: string) => {
    const map: Record<string, string> = {
      novo: "bg-primary/10 text-primary",
      contatado: "bg-amber-500/10 text-amber-600",
      qualificado: "bg-blue-500/10 text-blue-600",
      convertido: "bg-emerald-500/10 text-emerald-600",
      descartado: "bg-muted text-muted-foreground",
    };
    return <Badge className={map[s] || ""}>{s}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Integração Apify Leads</h2>
          <p className="text-sm text-muted-foreground">Captação automática de leads imobiliários do Brasil</p>
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="grid grid-cols-4 lg:grid-cols-7 h-auto">
          <TabsTrigger value="dashboard" className="gap-1"><Activity className="h-4 w-4" />Dashboard</TabsTrigger>
          <TabsTrigger value="config" className="gap-1"><SettingsIcon className="h-4 w-4" />Config</TabsTrigger>
          <TabsTrigger value="search" className="gap-1"><Search className="h-4 w-4" />Buscar</TabsTrigger>
          <TabsTrigger value="leads" className="gap-1"><Database className="h-4 w-4" />Leads</TabsTrigger>
          <TabsTrigger value="filters" className="gap-1"><Filter className="h-4 w-4" />Filtros</TabsTrigger>
          <TabsTrigger value="campaigns" className="gap-1"><Mail className="h-4 w-4" />Campanhas</TabsTrigger>
          <TabsTrigger value="logs" className="gap-1"><History className="h-4 w-4" />Logs</TabsTrigger>
        </TabsList>

        {/* DASHBOARD */}
        <TabsContent value="dashboard" className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {[
              { label: "Hoje", value: stats.hoje, icon: Activity },
              { label: "Este mês", value: stats.mes, icon: Activity },
              { label: "Imobiliárias", value: stats.imobiliarias, icon: Building2 },
              { label: "Corretores", value: stats.corretores, icon: User },
              { label: "Com E-mail", value: stats.comEmail, icon: Mail },
              { label: "Com WhatsApp", value: stats.comWhats, icon: MessageCircle },
              { label: "Novos", value: stats.novos, icon: Activity },
              { label: "Total", value: stats.total, icon: Database },
              { label: "Erros", value: stats.erros, icon: XCircle },
            ].map((s) => (
              <Card key={s.label}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">{s.label}</p>
                      <p className="text-2xl font-bold">{s.value}</p>
                    </div>
                    <s.icon className="h-5 w-5 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {stats.ultimaSync && (
            <p className="text-sm text-muted-foreground">
              Última sincronização: {new Date(stats.ultimaSync).toLocaleString("pt-BR")}
            </p>
          )}

          <Card>
            <CardHeader><CardTitle className="text-base">Distribuição por Estado</CardTitle></CardHeader>
            <CardContent>
              {porEstado.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum lead captado ainda.</p>
              ) : (
                <div className="space-y-2">
                  {porEstado.slice(0, 10).map(([uf, count]) => {
                    const max = porEstado[0][1];
                    return (
                      <div key={uf} className="flex items-center gap-3">
                        <span className="w-10 text-sm font-medium">{uf}</span>
                        <div className="flex-1 h-6 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-primary rounded-full transition-all"
                               style={{ width: `${(count / max) * 100}%` }} />
                        </div>
                        <span className="w-12 text-right text-sm">{count}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* CONFIG */}
        <TabsContent value="config" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center justify-between">
                Configurações Apify
                {settingsLoaded && (
                  apifyToken
                    ? <Badge className="bg-emerald-500/10 text-emerald-600 gap-1"><CheckCircle2 className="h-3 w-3" />Conectado</Badge>
                    : <Badge variant="destructive" className="gap-1"><XCircle className="h-3 w-3" />Desconectado</Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Apify API Token</Label>
                <Input type="password" value={apifyToken} onChange={(e) => setApifyToken(e.target.value)}
                       placeholder="apify_api_xxxxxxxxxx" />
                <p className="text-xs text-muted-foreground mt-1">
                  Obtenha em apify.com → Settings → Integrations
                </p>
              </div>
              <div>
                <Label>Actor ID</Label>
                <Input value={actorId} onChange={(e) => setActorId(e.target.value)}
                       placeholder="compass~crawler-google-places" />
                <p className="text-xs text-muted-foreground mt-1">
                  Padrão: <code>compass~crawler-google-places</code> (Google Maps Scraper)
                </p>
              </div>
              <Button onClick={saveSettings} disabled={savingSettings}>
                {savingSettings ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Salvar Configurações
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* SEARCH */}
        <TabsContent value="search" className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Buscar Leads</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>Tipo de Lead</Label>
                  <Select value={tipoLead} onValueChange={(v: any) => setTipoLead(v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="imobiliaria">Imobiliárias</SelectItem>
                      <SelectItem value="corretor">Corretores Autônomos</SelectItem>
                      <SelectItem value="ambos">Ambos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Estado</Label>
                  <Select value={estado} onValueChange={(v) => { setEstado(v); setCidade(""); }}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      {BRAZIL_STATES.map((s) => <SelectItem key={s.uf} value={s.uf}>{s.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Cidade</Label>
                  <Select value={cidade} onValueChange={setCidade} disabled={!estado}>
                    <SelectTrigger><SelectValue placeholder={estado ? "Selecione" : "Escolha o estado"} /></SelectTrigger>
                    <SelectContent>
                      {cities.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Palavra-chave (opcional)</Label>
                <Input value={palavraChave} onChange={(e) => setPalavraChave(e.target.value)}
                       placeholder="Ex: imobiliária de luxo" />
              </div>
              <div>
                <Label>Quantidade máxima</Label>
                <Select value={String(quantidade)} onValueChange={(v) => setQuantidade(Number(v))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[50, 100, 250, 500, 1000].map((n) => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs text-muted-foreground">Sugestões rápidas</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {QUICK_SEARCHES.map((q) => (
                    <Button key={q} type="button" variant="outline" size="sm"
                            onClick={() => setPalavraChave(q)}>{q}</Button>
                  ))}
                </div>
              </div>

              <Button onClick={runSearch} disabled={searching} size="lg" className="w-full md:w-auto">
                {searching ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Play className="h-4 w-4 mr-2" />}
                Buscar Agora
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* LEADS */}
        <TabsContent value="leads" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center justify-between">
                Leads Importados ({filteredLeads.length})
                <Button size="sm" variant="outline" onClick={loadLeads}>
                  <RefreshCw className="h-4 w-4 mr-1" />Atualizar
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <Input placeholder="Buscar nome/email/cidade" value={fSearch} onChange={(e) => setFSearch(e.target.value)} />
                <Select value={fEstado || "all"} onValueChange={(v) => setFEstado(v === "all" ? "" : v)}>
                  <SelectTrigger><SelectValue placeholder="Estado" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos estados</SelectItem>
                    {BRAZIL_STATES.map((s) => <SelectItem key={s.uf} value={s.uf}>{s.uf}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={fTipo || "all"} onValueChange={(v) => setFTipo(v === "all" ? "" : v)}>
                  <SelectTrigger><SelectValue placeholder="Tipo" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="imobiliaria">Imobiliária</SelectItem>
                    <SelectItem value="corretor">Corretor</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={fStatus || "all"} onValueChange={(v) => setFStatus(v === "all" ? "" : v)}>
                  <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="novo">Novo</SelectItem>
                    <SelectItem value="contatado">Contatado</SelectItem>
                    <SelectItem value="qualificado">Qualificado</SelectItem>
                    <SelectItem value="convertido">Convertido</SelectItem>
                    <SelectItem value="descartado">Descartado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-sm">
                  <Switch checked={fHasEmail} onCheckedChange={setFHasEmail} />Com e-mail
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <Switch checked={fHasWhats} onCheckedChange={setFHasWhats} />Com WhatsApp
                </label>
              </div>

              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Cidade/UF</TableHead>
                      <TableHead>Contato</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-32">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow><TableCell colSpan={6} className="text-center py-8"><Loader2 className="h-5 w-5 animate-spin mx-auto" /></TableCell></TableRow>
                    ) : filteredLeads.length === 0 ? (
                      <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Nenhum lead encontrado</TableCell></TableRow>
                    ) : filteredLeads.slice(0, 200).map((l) => (
                      <TableRow key={l.id}>
                        <TableCell>
                          <div className="font-medium">{l.nome}</div>
                          {l.empresa && l.empresa !== l.nome && <div className="text-xs text-muted-foreground">{l.empresa}</div>}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {l.tipo_lead === "imobiliaria" ? <Building2 className="h-3 w-3 mr-1" /> : <User className="h-3 w-3 mr-1" />}
                            {l.tipo_lead}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">
                          {l.cidade ? <><MapPin className="h-3 w-3 inline mr-1" />{l.cidade}/{l.estado}</> : "—"}
                        </TableCell>
                        <TableCell className="text-xs space-y-1">
                          {l.email && <div className="truncate max-w-[180px]">{l.email}</div>}
                          {l.whatsapp && <div className="text-muted-foreground">{l.whatsapp}</div>}
                          <div className="flex gap-1">
                            {l.site && <Globe className="h-3 w-3 text-muted-foreground" />}
                            {l.instagram && <Instagram className="h-3 w-3 text-muted-foreground" />}
                            {l.telefone && <Phone className="h-3 w-3 text-muted-foreground" />}
                          </div>
                        </TableCell>
                        <TableCell>{statusBadge(l.status)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {l.whatsapp && (
                              <Button asChild size="icon" variant="ghost" className="h-8 w-8">
                                <a href={`https://wa.me/55${l.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noopener">
                                  <MessageCircle className="h-4 w-4 text-emerald-600" />
                                </a>
                              </Button>
                            )}
                            <Button size="icon" variant="ghost" className="h-8 w-8"
                                    onClick={() => markStatus(l.id, l.status === "contatado" ? "novo" : "contatado")}
                                    title="Marcar contatado">
                              <CheckCircle2 className="h-4 w-4" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => deleteLead(l.id)}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {filteredLeads.length > 200 && (
                <p className="text-xs text-muted-foreground text-center">
                  Mostrando 200 de {filteredLeads.length}. Use os filtros para refinar.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* FILTROS INTELIGENTES */}
        <TabsContent value="filters" className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Segmentos Inteligentes</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {[
                  { name: "Imobiliárias", filter: { tipo: "imobiliaria" } },
                  { name: "Corretores Autônomos", filter: { tipo: "corretor" } },
                  { name: "Sudeste (SP/RJ/MG/ES)", filter: { ufs: ["SP", "RJ", "MG", "ES"] } },
                  { name: "Sul (PR/SC/RS)", filter: { ufs: ["PR", "SC", "RS"] } },
                  { name: "Com E-mail", filter: { hasEmail: true } },
                  { name: "Com WhatsApp", filter: { hasWhats: true } },
                  { name: "Com Instagram", filter: { hasInsta: true } },
                  { name: "Com Site", filter: { hasSite: true } },
                  { name: "Nunca contatados", filter: { status: "novo" } },
                ].map((seg) => {
                  const count = leads.filter((l) => {
                    if ((seg.filter as any).tipo && l.tipo_lead !== (seg.filter as any).tipo) return false;
                    if ((seg.filter as any).ufs && !((seg.filter as any).ufs as string[]).includes(l.estado || "")) return false;
                    if ((seg.filter as any).hasEmail && !l.email) return false;
                    if ((seg.filter as any).hasWhats && !l.whatsapp) return false;
                    if ((seg.filter as any).hasInsta && !l.instagram) return false;
                    if ((seg.filter as any).hasSite && !l.site) return false;
                    if ((seg.filter as any).status && l.status !== (seg.filter as any).status) return false;
                    return true;
                  }).length;
                  return (
                    <Card key={seg.name} className="hover:border-primary/50 transition-colors">
                      <CardContent className="p-4">
                        <p className="font-medium text-sm">{seg.name}</p>
                        <p className="text-2xl font-bold mt-1">{count}</p>
                        <p className="text-xs text-muted-foreground">leads</p>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* CAMPAIGNS */}
        <TabsContent value="campaigns" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center justify-between">
                Campanhas de E-mail (SMTP)
                <Button onClick={() => setCampOpen(true)}>
                  <Send className="h-4 w-4 mr-2" />Nova Campanha
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Dispara e-mails para segmentos de leads usando seu SMTP configurado.
                Variáveis disponíveis: <code>{"{{nome}}"}</code>, <code>{"{{empresa}}"}</code>, <code>{"{{cidade}}"}</code>, <code>{"{{estado}}"}</code>
              </p>
              <CampaignsList />
            </CardContent>
          </Card>
        </TabsContent>

        {/* LOGS */}
        <TabsContent value="logs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center justify-between">
                Histórico de Buscas
                <Button size="sm" variant="outline" onClick={loadRuns}><RefreshCw className="h-4 w-4 mr-1" />Atualizar</Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Tipo / Local</TableHead>
                    <TableHead>Solic.</TableHead>
                    <TableHead>Retorn.</TableHead>
                    <TableHead>Import.</TableHead>
                    <TableHead>Duplic.</TableHead>
                    <TableHead>Tempo</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {runs.length === 0 ? (
                    <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Nenhuma busca executada</TableCell></TableRow>
                  ) : runs.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="text-xs">{new Date(r.created_at).toLocaleString("pt-BR")}</TableCell>
                      <TableCell className="text-sm">
                        {r.tipo_lead}
                        {(r.cidade || r.estado) && <div className="text-xs text-muted-foreground">{[r.cidade, r.estado].filter(Boolean).join("/")}</div>}
                        {r.palavra_chave && <div className="text-xs text-muted-foreground italic">"{r.palavra_chave}"</div>}
                      </TableCell>
                      <TableCell>{r.quantidade_solicitada}</TableCell>
                      <TableCell>{r.quantidade_retornada}</TableCell>
                      <TableCell className="text-emerald-600 font-medium">{r.quantidade_importada}</TableCell>
                      <TableCell className="text-amber-600">{r.quantidade_duplicada}</TableCell>
                      <TableCell className="text-xs">{r.duration_ms ? `${(r.duration_ms / 1000).toFixed(1)}s` : "—"}</TableCell>
                      <TableCell>
                        {r.status === "concluido" && <Badge className="bg-emerald-500/10 text-emerald-600">Concluído</Badge>}
                        {r.status === "erro" && <Badge variant="destructive" title={r.error_message || ""}>Erro</Badge>}
                        {r.status === "rodando" && <Badge>Rodando</Badge>}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* CAMPAIGN DIALOG */}
      <Dialog open={campOpen} onOpenChange={setCampOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Nova Campanha de E-mail</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nome interno</Label>
              <Input value={campName} onChange={(e) => setCampName(e.target.value)} placeholder="Ex: Apresentação Capimobi - Out/2025" />
            </div>
            <div>
              <Label>Assunto</Label>
              <Input value={campSubject} onChange={(e) => setCampSubject(e.target.value)} placeholder="Olá {{nome}}, conheça a Capimobi" />
            </div>
            <div>
              <Label>Conteúdo HTML</Label>
              <Textarea value={campHtml} onChange={(e) => setCampHtml(e.target.value)} rows={8}
                        placeholder="<p>Olá {{nome}},</p><p>Sou da Capimobi e gostaria de apresentar...</p>" />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label>Tipo</Label>
                <Select value={campTipo} onValueChange={setCampTipo}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    <SelectItem value="imobiliaria">Imobiliárias</SelectItem>
                    <SelectItem value="corretor">Corretores</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Estado</Label>
                <Select value={campEstado || "all"} onValueChange={(v) => setCampEstado(v === "all" ? "" : v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {BRAZIL_STATES.map((s) => <SelectItem key={s.uf} value={s.uf}>{s.uf}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Status</Label>
                <Select value={campStatus} onValueChange={setCampStatus}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    <SelectItem value="novo">Novos</SelectItem>
                    <SelectItem value="contatado">Contatados</SelectItem>
                    <SelectItem value="qualificado">Qualificados</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Enviar teste para</Label>
              <div className="flex gap-2">
                <Input type="email" value={campTestEmail} onChange={(e) => setCampTestEmail(e.target.value)} placeholder="seu@email.com" />
                <Button variant="outline" onClick={() => sendCampaign(true)} disabled={campTesting}>
                  {campTesting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Testar"}
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCampOpen(false)}>Cancelar</Button>
            <Button onClick={() => sendCampaign(false)} disabled={campSending}>
              {campSending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
              Enviar Campanha
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CampaignsList() {
  const [list, setList] = useState<any[]>([]);
  useEffect(() => {
    supabase.from("lead_campaigns").select("*").order("created_at", { ascending: false }).limit(20)
      .then(({ data }) => setList(data || []));
  }, []);
  if (list.length === 0) return <p className="text-sm text-muted-foreground mt-4">Nenhuma campanha enviada ainda.</p>;
  return (
    <div className="mt-4 border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Assunto</TableHead>
            <TableHead>Total</TableHead>
            <TableHead>Enviados</TableHead>
            <TableHead>Falhas</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Data</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {list.map((c) => (
            <TableRow key={c.id}>
              <TableCell className="font-medium">{c.name}</TableCell>
              <TableCell className="text-sm text-muted-foreground truncate max-w-[200px]">{c.subject}</TableCell>
              <TableCell>{c.total_recipients}</TableCell>
              <TableCell className="text-emerald-600">{c.sent_count}</TableCell>
              <TableCell className="text-destructive">{c.failed_count}</TableCell>
              <TableCell><Badge variant="outline">{c.status}</Badge></TableCell>
              <TableCell className="text-xs">{new Date(c.created_at).toLocaleString("pt-BR")}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
