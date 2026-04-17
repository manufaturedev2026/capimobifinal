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
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { BRAZIL_STATES } from "@/data/brazilStates";
import { useCitiesByState } from "@/hooks/useCitiesByState";
import {
  Activity, Search, Settings as SettingsIcon, Database, Mail, History,
  Loader2, Play, RefreshCw, MessageCircle, Trash2, Send, Filter, MapPin,
  CheckCircle2, XCircle, Building2, User, Globe, Instagram, Phone,
  Upload, Download, FileText, Save, Eye, RotateCcw,
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

const INVITE_TEMPLATE = {
  name: "Convite Capimobi - Conheça a Plataforma",
  subject: "{{nome}}, uma oportunidade gratuita para sua imobiliária 🏡",
  html: `<div style="font-family:'Segoe UI',Arial,sans-serif;max-width:600px;margin:0 auto;background:#f4f6fb;padding:24px 0;">
  <div style="max-width:560px;margin:0 auto;padding:0 16px;">
    <div style="text-align:center;padding:8px 0 24px;">
      <p style="font-size:28px;font-weight:bold;color:#1e40af;margin:0;letter-spacing:-0.5px;">
        Cap<span style="color:#ffffff;background:#1e40af;padding:0 6px;border-radius:4px;">i</span><span style="color:#f59e0b;">mobi</span>
      </p>
    </div>
    <div style="background:#ffffff;border-radius:16px;padding:40px 32px;box-shadow:0 4px 24px rgba(30,64,175,0.08);">
      <h1 style="font-size:24px;font-weight:bold;color:#0f172a;margin:0 0 16px;">Olá {{nome}}! 👋</h1>
      <p style="font-size:15px;color:#334155;line-height:1.6;margin:0 0 16px;">
        Sou da <strong>Capimobi</strong>, a plataforma que está revolucionando o mercado imobiliário brasileiro — e quero apresentar uma <strong>oportunidade exclusiva e 100% gratuita</strong> para a <strong>{{empresa}}</strong> em <strong>{{cidade}}/{{estado}}</strong>.
      </p>
      <p style="font-size:15px;color:#334155;line-height:1.6;margin:0 0 24px;">
        Criamos uma vitrine digital profissional para corretores e imobiliárias se destacarem no Google e converterem mais leads, sem mensalidade no plano inicial.
      </p>
      <div style="background:#f0f9ff;border-left:4px solid #1e40af;border-radius:8px;padding:16px 20px;margin:0 0 24px;">
        <p style="font-size:14px;font-weight:bold;color:#0f172a;margin:0 0 12px;">✨ O que você ganha na Capimobi:</p>
        <ul style="margin:0;padding-left:20px;color:#334155;font-size:14px;line-height:1.8;">
          <li><strong>Loja virtual personalizada</strong> com seu logo, cores e domínio próprio</li>
          <li><strong>CRM Kanban</strong> para gestão completa de leads</li>
          <li><strong>WhatsApp inteligente</strong> com captura automática de contatos</li>
          <li><strong>Stories estilo Instagram</strong> para destacar imóveis</li>
          <li><strong>Gerador de propostas em PDF</strong> com QR Code e mapa</li>
          <li><strong>Simulador de financiamento</strong> Caixa, Itaú, Bradesco</li>
          <li><strong>Notificações Push</strong> para fidelizar visitantes</li>
          <li><strong>SEO automático</strong> por bairro e cidade — apareça no Google</li>
          <li><strong>Sistema de parcerias</strong> entre corretores e imobiliárias</li>
          <li><strong>Captação de imóveis</strong> via link público compartilhável</li>
        </ul>
      </div>
      <p style="font-size:15px;color:#334155;line-height:1.6;margin:0 0 24px;">
        Sem compromisso, sem cartão de crédito. Crie sua loja em menos de 5 minutos e comece a receber leads ainda hoje.
      </p>
      <div style="text-align:center;margin:32px 0;">
        <a href="https://capimobi001.lovable.app/cadastro" style="background:#1e40af;color:#ffffff;font-size:16px;font-weight:bold;border-radius:12px;padding:16px 40px;text-decoration:none;display:inline-block;box-shadow:0 4px 12px rgba(30,64,175,0.3);">
          🚀 Criar Minha Loja Grátis
        </a>
      </div>
      <p style="font-size:13px;color:#64748b;line-height:1.5;margin:0;text-align:center;">
        Já são centenas de corretores e imobiliárias crescendo conosco.<br>Junte-se a nós e leve seus negócios para o próximo nível.
      </p>
      <p style="font-size:13px;color:#64748b;line-height:1.5;margin:24px 0 0;padding-top:24px;border-top:1px solid #e2e8f0;text-align:center;">
        Dúvidas? Responda este e-mail que eu pessoalmente te respondo. 💙
      </p>
    </div>
    <div style="text-align:center;padding:24px 0 8px;">
      <p style="font-size:13px;color:#475569;font-weight:600;margin:0;">Capimobi — Plataforma de corretores e imobiliárias</p>
      <p style="font-size:12px;color:#94a3b8;margin:4px 0 0;">Se não deseja mais receber, basta ignorar este e-mail.</p>
    </div>
  </div>
</div>`,
};

const APIFY_LEADS_TEMPLATE = {
  name: "Integração Apify Leads - Chamada WhatsApp",
  subject: "{{nome}}, achei sua {{empresa}} e quero te mostrar algo 🚀",
  html: `<div style="font-family:'Segoe UI',Arial,sans-serif;max-width:600px;margin:0 auto;background:#f4f6fb;padding:24px 0;">
  <div style="max-width:560px;margin:0 auto;padding:0 16px;">
    <div style="text-align:center;padding:8px 0 24px;">
      <p style="font-size:28px;font-weight:bold;color:#1e40af;margin:0;letter-spacing:-0.5px;">
        Cap<span style="color:#ffffff;background:#1e40af;padding:0 6px;border-radius:4px;">i</span><span style="color:#f59e0b;">mobi</span>
      </p>
    </div>
    <div style="background:#ffffff;border-radius:16px;padding:40px 32px;box-shadow:0 4px 24px rgba(30,64,175,0.08);">
      <h1 style="font-size:24px;font-weight:bold;color:#0f172a;margin:0 0 16px;">Olá {{nome}}, tudo bem? 👋</h1>
      <p style="font-size:15px;color:#334155;line-height:1.6;margin:0 0 16px;">
        Encontrei a <strong>{{empresa}}</strong> em <strong>{{cidade}}/{{estado}}</strong> e fiquei impressionado com o trabalho de vocês. Sou da <strong>Capimobi</strong> — uma plataforma criada para corretores e imobiliárias venderem mais com tecnologia de verdade.
      </p>
      <p style="font-size:15px;color:#334155;line-height:1.6;margin:0 0 24px;">
        Quero te apresentar como a Capimobi pode <strong>multiplicar seus leads</strong> e organizar todo o seu processo comercial em um só lugar:
      </p>
      <div style="background:#f0f9ff;border-left:4px solid #1e40af;border-radius:8px;padding:16px 20px;margin:0 0 24px;">
        <p style="font-size:14px;font-weight:bold;color:#0f172a;margin:0 0 12px;">🏡 Tudo que você precisa, em uma plataforma só:</p>
        <ul style="margin:0;padding-left:20px;color:#334155;font-size:14px;line-height:1.8;">
          <li><strong>Site profissional</strong> com sua marca, domínio e SEO automático</li>
          <li><strong>CRM completo</strong> com funil Kanban e histórico de cada lead</li>
          <li><strong>WhatsApp integrado</strong> com captura automática de contatos</li>
          <li><strong>Stories</strong> estilo Instagram para destacar imóveis</li>
          <li><strong>Propostas em PDF</strong> com QR Code, fotos e mapa</li>
          <li><strong>Simulador de financiamento</strong> Caixa, Itaú, Bradesco</li>
          <li><strong>Notificações Push</strong> para reengajar visitantes</li>
          <li><strong>Sistema de parcerias</strong> entre corretores e imobiliárias</li>
          <li><strong>Captação de imóveis</strong> via link público compartilhável</li>
        </ul>
      </div>
      <p style="font-size:15px;color:#334155;line-height:1.6;margin:0 0 16px;">
        <strong>Bora trocar uma ideia rápida no WhatsApp?</strong> Em 5 minutos eu te mostro como funciona e você decide se faz sentido para a {{empresa}}.
      </p>
      <div style="text-align:center;margin:32px 0;">
        <a href="https://wa.me/5527999999999?text=Ol%C3%A1!%20Recebi%20o%20e-mail%20da%20Capimobi%20e%20quero%20saber%20mais" style="background:#25D366;color:#ffffff;font-size:16px;font-weight:bold;border-radius:12px;padding:16px 40px;text-decoration:none;display:inline-block;box-shadow:0 4px 12px rgba(37,211,102,0.35);">
          💬 Falar no WhatsApp agora
        </a>
      </div>
      <div style="text-align:center;margin:0 0 24px;">
        <a href="https://capimobi001.lovable.app" style="font-size:14px;color:#1e40af;text-decoration:underline;font-weight:600;">
          🌐 Conhecer o site capimobi001.lovable.app
        </a>
      </div>
      <p style="font-size:13px;color:#64748b;line-height:1.5;margin:24px 0 0;padding-top:24px;border-top:1px solid #e2e8f0;text-align:center;">
        Se preferir, é só responder este e-mail — eu pessoalmente te respondo. 💙
      </p>
    </div>
    <div style="text-align:center;padding:24px 0 8px;">
      <p style="font-size:13px;color:#475569;font-weight:600;margin:0;">Capimobi — Plataforma de corretores e imobiliárias</p>
      <p style="font-size:12px;color:#94a3b8;margin:4px 0 0;">Se não deseja mais receber, basta ignorar este e-mail.</p>
    </div>
  </div>
</div>`,
};

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
  const [campMaxRecipients, setCampMaxRecipients] = useState<number | "">("");
  const [campSkipSent, setCampSkipSent] = useState(true);
  const [campMode, setCampMode] = useState<"segment" | "selected">("segment");

  // Already-sent leads tracking + selection
  const [sentLeadIds, setSentLeadIds] = useState<Set<string>>(new Set());
  const [selectedLeadIds, setSelectedLeadIds] = useState<Set<string>>(new Set());

  // Templates editor (1 - Convite Capimobi)
  const [tplName, setTplName] = useState(INVITE_TEMPLATE.name);
  const [tplSubject, setTplSubject] = useState(INVITE_TEMPLATE.subject);
  const [tplHtml, setTplHtml] = useState(INVITE_TEMPLATE.html);
  const [tplSaving, setTplSaving] = useState(false);
  const [tplPreview, setTplPreview] = useState(false);

  // Templates editor (2 - Integração Apify Leads / WhatsApp)
  const [tpl2Name, setTpl2Name] = useState(APIFY_LEADS_TEMPLATE.name);
  const [tpl2Subject, setTpl2Subject] = useState(APIFY_LEADS_TEMPLATE.subject);
  const [tpl2Html, setTpl2Html] = useState(APIFY_LEADS_TEMPLATE.html);
  const [tpl2Saving, setTpl2Saving] = useState(false);
  const [tpl2Preview, setTpl2Preview] = useState(false);

  useEffect(() => {
    loadSettings();
    loadLeads();
    loadRuns();
    loadTemplate();
    loadSentLeadIds();
  }, []);

  async function loadSentLeadIds() {
    const ids = new Set<string>();
    const pageSize = 1000;
    let from = 0;
    while (true) {
      const { data, error } = await supabase
        .from("lead_campaign_sends")
        .select("lead_id")
        .eq("status", "enviado")
        .not("lead_id", "is", null)
        .range(from, from + pageSize - 1);
      if (error || !data || data.length === 0) break;
      data.forEach((r: any) => { if (r.lead_id) ids.add(r.lead_id); });
      if (data.length < pageSize) break;
      from += pageSize;
    }
    setSentLeadIds(ids);
  }

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

  async function loadTemplate() {
    const { data } = await supabase
      .from("platform_settings").select("key, value")
      .in("key", [
        "apify_invite_template_name", "apify_invite_template_subject", "apify_invite_template_html",
        "apify_leads_template_name", "apify_leads_template_subject", "apify_leads_template_html",
      ]);
    const map = Object.fromEntries((data || []).map((s) => [s.key, s.value]));
    if (map.apify_invite_template_name) setTplName(map.apify_invite_template_name);
    if (map.apify_invite_template_subject) setTplSubject(map.apify_invite_template_subject);
    if (map.apify_invite_template_html) setTplHtml(map.apify_invite_template_html);
    if (map.apify_leads_template_name) setTpl2Name(map.apify_leads_template_name);
    if (map.apify_leads_template_subject) setTpl2Subject(map.apify_leads_template_subject);
    if (map.apify_leads_template_html) setTpl2Html(map.apify_leads_template_html);
  }

  async function saveTemplate() {
    setTplSaving(true);
    const rows = [
      { key: "apify_invite_template_name", value: tplName },
      { key: "apify_invite_template_subject", value: tplSubject },
      { key: "apify_invite_template_html", value: tplHtml },
    ];
    const { error } = await supabase.from("platform_settings").upsert(rows, { onConflict: "key" });
    setTplSaving(false);
    if (error) toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
    else toast({ title: "Template salvo!", description: "As alterações foram aplicadas" });
  }

  function resetTemplate() {
    if (!confirm("Restaurar o template original? As alterações não salvas serão perdidas.")) return;
    setTplName(INVITE_TEMPLATE.name);
    setTplSubject(INVITE_TEMPLATE.subject);
    setTplHtml(INVITE_TEMPLATE.html);
  }

  async function saveTemplate2() {
    setTpl2Saving(true);
    const rows = [
      { key: "apify_leads_template_name", value: tpl2Name },
      { key: "apify_leads_template_subject", value: tpl2Subject },
      { key: "apify_leads_template_html", value: tpl2Html },
    ];
    const { error } = await supabase.from("platform_settings").upsert(rows, { onConflict: "key" });
    setTpl2Saving(false);
    if (error) toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
    else toast({ title: "Template salvo!", description: "As alterações foram aplicadas" });
  }

  function resetTemplate2() {
    if (!confirm("Restaurar o template original? As alterações não salvas serão perdidas.")) return;
    setTpl2Name(APIFY_LEADS_TEMPLATE.name);
    setTpl2Subject(APIFY_LEADS_TEMPLATE.subject);
    setTpl2Html(APIFY_LEADS_TEMPLATE.html);
  }

  async function loadLeads() {
    setLoading(true);
    // Paginação para superar o limite default de 1000 do Supabase
    const pageSize = 1000;
    let from = 0;
    const all: Lead[] = [];
    while (true) {
      const { data, error } = await supabase
        .from("leads_imobiliarios")
        .select("*")
        .order("data_captacao", { ascending: false })
        .range(from, from + pageSize - 1);
      if (error || !data || data.length === 0) break;
      all.push(...(data as Lead[]));
      if (data.length < pageSize) break;
      from += pageSize;
    }
    setLeads(all);
    setLoading(false);
  }

  async function loadRuns() {
    const { data } = await supabase
      .from("apify_search_runs").select("*").order("created_at", { ascending: false }).limit(50);
    setRuns((data || []) as Run[]);
  }

  async function cancelRunningRuns() {
    const running = runs.filter((r) => r.status === "rodando");
    if (running.length === 0) {
      toast({ title: "Nada para cancelar", description: "Não há buscas em execução." });
      return;
    }
    if (!confirm(`Marcar ${running.length} busca(s) "Rodando" como erro/cancelada?`)) return;
    const { error } = await supabase
      .from("apify_search_runs")
      .update({
        status: "erro",
        error_message: "Cancelado manualmente pelo admin",
        finished_at: new Date().toISOString(),
      })
      .in("id", running.map((r) => r.id));
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Cancelado", description: `${running.length} busca(s) marcada(s) como erro.` });
    await loadRuns();
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

  async function deleteAllLeads() {
    const count = filteredLeads.length;
    if (count === 0) {
      toast({ title: "Nenhum lead para excluir" });
      return;
    }
    const usingFilter = fSearch || fEstado || fTipo || fStatus || fHasEmail || fHasWhats;
    const msg = usingFilter
      ? `Excluir ${count} leads filtrados? Esta ação não pode ser desfeita.`
      : `Excluir TODOS os ${count} leads? Esta ação não pode ser desfeita.`;
    if (!confirm(msg)) return;
    if (!confirm("Tem certeza absoluta? Os leads serão removidos permanentemente.")) return;

    const ids = filteredLeads.map((l) => l.id);
    const { error } = await supabase.from("leads_imobiliarios").delete().in("id", ids);
    if (error) {
      toast({ title: "Erro ao excluir", description: error.message, variant: "destructive" });
      return;
    }
    setLeads((p) => p.filter((l) => !ids.includes(l.id)));
    toast({ title: `${ids.length} leads excluídos` });
  }

  function exportLeadsCSV() {
    const rows = filteredLeads;
    if (rows.length === 0) {
      toast({ title: "Nada para exportar", variant: "destructive" });
      return;
    }
    const headers = [
      "nome", "tipo_lead", "empresa", "email", "whatsapp", "telefone",
      "site", "instagram", "cidade", "estado", "endereco", "status",
      "rating", "reviews_count", "origem", "data_captacao", "observacoes",
    ];
    const escape = (v: any) => {
      if (v === null || v === undefined) return "";
      const s = String(v).replace(/"/g, '""');
      return /[",\n;]/.test(s) ? `"${s}"` : s;
    };
    const csv = [
      headers.join(","),
      ...rows.map((r: any) => headers.map((h) => escape(r[h])).join(",")),
    ].join("\n");
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `leads_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: `${rows.length} leads exportados` });
  }

  function parseCSV(text: string): Record<string, string>[] {
    // Remove BOM
    text = text.replace(/^\ufeff/, "");
    // Auto-detect delimiter from header line (handles , ; and \t)
    const firstNl = text.indexOf("\n");
    const headerLine = firstNl >= 0 ? text.slice(0, firstNl) : text;
    const counts: Record<string, number> = { ",": 0, ";": 0, "\t": 0 };
    let inQH = false;
    for (const c of headerLine) {
      if (c === '"') inQH = !inQH;
      else if (!inQH && (c === "," || c === ";" || c === "\t")) counts[c]++;
    }
    const delim = Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];

    const lines: string[] = [];
    let cur = "";
    let inQuotes = false;
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (c === '"') {
        if (inQuotes && text[i + 1] === '"') { cur += '"'; i++; }
        else inQuotes = !inQuotes;
      } else if (c === "\n" && !inQuotes) {
        lines.push(cur); cur = "";
      } else if (c === "\r" && !inQuotes) {
        // skip
      } else cur += c;
    }
    if (cur) lines.push(cur);
    if (lines.length === 0) return [];
    const splitLine = (line: string): string[] => {
      const out: string[] = [];
      let val = ""; let q = false;
      for (let i = 0; i < line.length; i++) {
        const c = line[i];
        if (c === '"') {
          if (q && line[i + 1] === '"') { val += '"'; i++; }
          else q = !q;
        } else if (c === delim && !q) {
          out.push(val); val = "";
        } else val += c;
      }
      out.push(val);
      return out;
    };
    const headers = splitLine(lines[0]).map((h) => h.trim().toLowerCase().replace(/^\ufeff/, ""));
    return lines.slice(1).filter((l) => l.trim()).map((l) => {
      const vals = splitLine(l);
      const obj: Record<string, string> = {};
      headers.forEach((h, i) => { obj[h] = (vals[i] || "").trim(); });
      return obj;
    });
  }

  async function importLeadsCSV(file: File) {
    try {
      const text = await file.text();
      const rows = parseCSV(text);
      if (rows.length === 0) {
        toast({ title: "CSV vazio ou inválido", variant: "destructive" });
        return;
      }
      const cleanPhone = (p?: string) => {
        if (!p) return null;
        const d = p.replace(/\D/g, "");
        return d.length >= 8 ? d : null;
      };
      const isEmail = (e?: string) => !!e && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
      const inferTipo = (text: string): string => {
        const t = (text || "").toLowerCase();
        if (/imobili[áa]ria|im[óo]veis|realty|real estate/.test(t)) return "imobiliaria";
        if (/corretor|agente imobili[áa]rio|broker/.test(t)) return "corretor";
        return "imobiliaria";
      };
      const records = rows
        .map((r) => {
          // suporta CSV nativo e CSV exportado da Apify (Google Places)
          const nome = r.nome || r.name || r.title || r.empresa || r.company || "";
          if (!nome) return null;
          const categoria = r.categoryname || r["categories/0"] || r.categoria || "";
          const tipoRaw = (r.tipo_lead || r.tipo || "").toLowerCase();
          const tipo = ["corretor", "imobiliaria"].includes(tipoRaw)
            ? tipoRaw
            : inferTipo(`${nome} ${categoria}`);
          const email = (r.email || r.emails || "").toLowerCase().trim();
          const tel = cleanPhone(r.whatsapp || r.telefone || r.phone);
          const endereco = r.endereco || r.address || r.street || null;
          return {
            nome,
            tipo_lead: tipo,
            empresa: r.empresa || r.company || nome,
            email: isEmail(email) ? email : null,
            whatsapp: cleanPhone(r.whatsapp) || tel,
            telefone: cleanPhone(r.telefone || r.phone) || tel,
            site: r.site || r.website || null,
            instagram: r.instagram || null,
            cidade: r.cidade || r.city || null,
            estado: r.estado || r.state || null,
            endereco,
            rating: r.rating || r.totalscore ? Number(r.rating || r.totalscore) || null : null,
            reviews_count: r.reviews_count || r.reviewscount ? Number(r.reviews_count || r.reviewscount) || null : null,
            status: r.status || "novo",
            origem: r.origem || "csv_import",
            observacoes: r.observacoes || r.notes || null,
          };
        })
        .filter(Boolean) as any[];
      if (records.length === 0) {
        toast({ title: "Nenhum lead válido encontrado", description: "O CSV precisa ter ao menos a coluna 'nome'.", variant: "destructive" });
        return;
      }
      let imported = 0;
      let duplicated = 0;
      for (const lead of records) {
        let existing = null as any;
        if (lead.email) {
          const { data } = await supabase
            .from("leads_imobiliarios").select("id").eq("email", lead.email).maybeSingle();
          existing = data;
        }
        if (existing) { duplicated++; continue; }
        const { error } = await supabase.from("leads_imobiliarios").insert(lead);
        if (!error) imported++;
      }
      toast({ title: "Importação concluída", description: `${imported} novos, ${duplicated} duplicados ignorados.` });
      await loadLeads();
    } catch (err: any) {
      toast({ title: "Erro ao importar", description: err.message, variant: "destructive" });
    }
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
    if (!test && campMode === "selected" && selectedLeadIds.size === 0) {
      toast({ title: "Selecione ao menos 1 lead", description: "Marque os checkboxes na lista de leads", variant: "destructive" });
      return;
    }
    if (test) setCampTesting(true); else setCampSending(true);
    const useSelected = !test && campMode === "selected";
    const { data, error } = await supabase.functions.invoke("send-leads-campaign", {
      body: {
        name: campName || campSubject,
        subject: campSubject,
        content_html: campHtml,
        segment_filter: useSelected ? undefined : { tipo_lead: campTipo, estado: campEstado, status: campStatus },
        lead_ids: useSelected ? Array.from(selectedLeadIds) : undefined,
        max_recipients: !test && campMaxRecipients !== "" ? Number(campMaxRecipients) : undefined,
        skip_already_sent: campSkipSent,
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
      if (!test) {
        setCampOpen(false);
        setSelectedLeadIds(new Set());
        loadSentLeadIds();
      }
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
        <TabsList className="grid grid-cols-4 lg:grid-cols-8 h-auto">
          <TabsTrigger value="dashboard" className="gap-1"><Activity className="h-4 w-4" />Dashboard</TabsTrigger>
          <TabsTrigger value="config" className="gap-1"><SettingsIcon className="h-4 w-4" />Config</TabsTrigger>
          <TabsTrigger value="search" className="gap-1"><Search className="h-4 w-4" />Buscar</TabsTrigger>
          <TabsTrigger value="leads" className="gap-1"><Database className="h-4 w-4" />Leads</TabsTrigger>
          <TabsTrigger value="filters" className="gap-1"><Filter className="h-4 w-4" />Filtros</TabsTrigger>
          <TabsTrigger value="campaigns" className="gap-1"><Mail className="h-4 w-4" />Campanhas</TabsTrigger>
          <TabsTrigger value="templates" className="gap-1"><FileText className="h-4 w-4" />Templates</TabsTrigger>
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
                  <Select value={cidade || "all"} onValueChange={(v) => setCidade(v === "all" ? "" : v)} disabled={!estado}>
                    <SelectTrigger><SelectValue placeholder={estado ? "Selecione" : "Escolha o estado"} /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas as cidades</SelectItem>
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
              <CardTitle className="text-base flex items-center justify-between gap-2">
                <span>Leads Importados ({filteredLeads.length})</span>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" onClick={loadLeads}>
                    <RefreshCw className="h-4 w-4 mr-1" />Atualizar
                  </Button>
                  <Button size="sm" variant="outline" asChild>
                    <label className="cursor-pointer">
                      <Upload className="h-4 w-4 mr-1" />Importar CSV
                      <input
                        type="file"
                        accept=".csv,text/csv"
                        className="hidden"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) importLeadsCSV(f);
                          e.target.value = "";
                        }}
                      />
                    </label>
                  </Button>
                  <Button size="sm" variant="outline" onClick={exportLeadsCSV} disabled={filteredLeads.length === 0}>
                    <Download className="h-4 w-4 mr-1" />Exportar CSV
                  </Button>
                  <Button size="sm" variant="destructive" onClick={deleteAllLeads} disabled={filteredLeads.length === 0}>
                    <Trash2 className="h-4 w-4 mr-1" />Limpar todos
                  </Button>
                </div>
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

              {selectedLeadIds.size > 0 && (
                <div className="flex items-center justify-between gap-3 rounded-lg border border-primary/30 bg-primary/5 p-3">
                  <p className="text-sm font-medium text-foreground">
                    {selectedLeadIds.size} lead(s) selecionado(s)
                  </p>
                  <div className="flex gap-2">
                    <Button size="sm" variant="ghost" onClick={() => setSelectedLeadIds(new Set())}>Limpar</Button>
                    <Button size="sm" onClick={() => { setCampMode("selected"); setCampOpen(true); }}>
                      <Send className="h-4 w-4 mr-1" />Enviar campanha para selecionados
                    </Button>
                  </div>
                </div>
              )}

              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10">
                        <Checkbox
                          checked={
                            filteredLeads.slice(0, 200).length > 0 &&
                            filteredLeads.slice(0, 200).every((l) => selectedLeadIds.has(l.id))
                          }
                          onCheckedChange={(v) => {
                            const next = new Set(selectedLeadIds);
                            const visible = filteredLeads.slice(0, 200);
                            if (v) visible.forEach((l) => { if (l.email) next.add(l.id); });
                            else visible.forEach((l) => next.delete(l.id));
                            setSelectedLeadIds(next);
                          }}
                        />
                      </TableHead>
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
                      <TableRow><TableCell colSpan={7} className="text-center py-8"><Loader2 className="h-5 w-5 animate-spin mx-auto" /></TableCell></TableRow>
                    ) : filteredLeads.length === 0 ? (
                      <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Nenhum lead encontrado</TableCell></TableRow>
                    ) : filteredLeads.slice(0, 200).map((l) => {
                      const alreadySent = sentLeadIds.has(l.id);
                      return (
                      <TableRow key={l.id} className={alreadySent ? "bg-muted/30" : ""}>
                        <TableCell>
                          <Checkbox
                            disabled={!l.email}
                            checked={selectedLeadIds.has(l.id)}
                            onCheckedChange={(v) => {
                              const next = new Set(selectedLeadIds);
                              if (v) next.add(l.id); else next.delete(l.id);
                              setSelectedLeadIds(next);
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="font-medium flex items-center gap-2">
                            {l.nome}
                            {alreadySent && (
                              <Badge variant="secondary" className="text-[10px] gap-1">
                                <Mail className="h-3 w-3" />Já recebeu
                              </Badge>
                            )}
                          </div>
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
                    );})}
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

        {/* TEMPLATES */}
        <TabsContent value="templates" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center justify-between flex-wrap gap-2">
                <span className="flex items-center gap-2"><FileText className="h-4 w-4" /> Template de Convite Capimobi</span>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setTplPreview(true)}>
                    <Eye className="h-4 w-4 mr-1" /> Pré-visualizar
                  </Button>
                  <Button variant="outline" size="sm" onClick={resetTemplate}>
                    <RotateCcw className="h-4 w-4 mr-1" /> Restaurar padrão
                  </Button>
                  <Button size="sm" onClick={saveTemplate} disabled={tplSaving}>
                    {tplSaving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
                    Salvar
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-xs text-muted-foreground">
                Edite o template usado pelo botão "Usar template" em Campanhas. Variáveis disponíveis:{" "}
                <code className="bg-muted px-1 rounded">{"{{nome}}"}</code>,{" "}
                <code className="bg-muted px-1 rounded">{"{{empresa}}"}</code>,{" "}
                <code className="bg-muted px-1 rounded">{"{{cidade}}"}</code>,{" "}
                <code className="bg-muted px-1 rounded">{"{{estado}}"}</code>
              </p>

              <div>
                <Label>Nome interno do template</Label>
                <Input value={tplName} onChange={(e) => setTplName(e.target.value)} placeholder="Convite Capimobi - ..." />
              </div>

              <div>
                <Label>Assunto do e-mail</Label>
                <Input value={tplSubject} onChange={(e) => setTplSubject(e.target.value)} placeholder="{{nome}}, ..." />
              </div>

              <div>
                <Label>Conteúdo HTML</Label>
                <Textarea
                  value={tplHtml}
                  onChange={(e) => setTplHtml(e.target.value)}
                  rows={20}
                  className="font-mono text-xs"
                />
              </div>
            </CardContent>
          </Card>

          <Dialog open={tplPreview} onOpenChange={setTplPreview}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Pré-visualização do e-mail</DialogTitle>
              </DialogHeader>
              <div className="text-xs text-muted-foreground mb-2">
                <strong>Assunto:</strong>{" "}
                {tplSubject
                  .replace(/{{nome}}/g, "João Silva")
                  .replace(/{{empresa}}/g, "Imobiliária Exemplo")
                  .replace(/{{cidade}}/g, "Vitória")
                  .replace(/{{estado}}/g, "ES")}
              </div>
              <div
                className="border border-border rounded-lg overflow-hidden bg-white"
                dangerouslySetInnerHTML={{
                  __html: tplHtml
                    .replace(/{{nome}}/g, "João Silva")
                    .replace(/{{empresa}}/g, "Imobiliária Exemplo")
                    .replace(/{{cidade}}/g, "Vitória")
                    .replace(/{{estado}}/g, "ES"),
                }}
              />
            </DialogContent>
          </Dialog>

          {/* Template 2 - Integração Apify Leads */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center justify-between flex-wrap gap-2">
                <span className="flex items-center gap-2"><MessageCircle className="h-4 w-4" /> Template Integração Apify Leads (WhatsApp)</span>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setTpl2Preview(true)}>
                    <Eye className="h-4 w-4 mr-1" /> Pré-visualizar
                  </Button>
                  <Button variant="outline" size="sm" onClick={resetTemplate2}>
                    <RotateCcw className="h-4 w-4 mr-1" /> Restaurar padrão
                  </Button>
                  <Button size="sm" onClick={saveTemplate2} disabled={tpl2Saving}>
                    {tpl2Saving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
                    Salvar
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-xs text-muted-foreground">
                Template focado em <strong>chamar o lead no WhatsApp</strong> e apresentar o site/funções da plataforma.
                Variáveis disponíveis:{" "}
                <code className="bg-muted px-1 rounded">{"{{nome}}"}</code>,{" "}
                <code className="bg-muted px-1 rounded">{"{{empresa}}"}</code>,{" "}
                <code className="bg-muted px-1 rounded">{"{{cidade}}"}</code>,{" "}
                <code className="bg-muted px-1 rounded">{"{{estado}}"}</code>
              </p>

              <div>
                <Label>Nome interno do template</Label>
                <Input value={tpl2Name} onChange={(e) => setTpl2Name(e.target.value)} placeholder="Integração Apify Leads - ..." />
              </div>

              <div>
                <Label>Assunto do e-mail</Label>
                <Input value={tpl2Subject} onChange={(e) => setTpl2Subject(e.target.value)} placeholder="{{nome}}, ..." />
              </div>

              <div>
                <Label>Conteúdo HTML</Label>
                <Textarea
                  value={tpl2Html}
                  onChange={(e) => setTpl2Html(e.target.value)}
                  rows={20}
                  className="font-mono text-xs"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  💡 Lembre de trocar o número <code className="bg-muted px-1 rounded">5527999999999</code> no link <code>wa.me</code> pelo seu WhatsApp real.
                </p>
              </div>
            </CardContent>
          </Card>

          <Dialog open={tpl2Preview} onOpenChange={setTpl2Preview}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Pré-visualização do e-mail (Apify Leads)</DialogTitle>
              </DialogHeader>
              <div className="text-xs text-muted-foreground mb-2">
                <strong>Assunto:</strong>{" "}
                {tpl2Subject
                  .replace(/{{nome}}/g, "João Silva")
                  .replace(/{{empresa}}/g, "Imobiliária Exemplo")
                  .replace(/{{cidade}}/g, "Vitória")
                  .replace(/{{estado}}/g, "ES")}
              </div>
              <div
                className="border border-border rounded-lg overflow-hidden bg-white"
                dangerouslySetInnerHTML={{
                  __html: tpl2Html
                    .replace(/{{nome}}/g, "João Silva")
                    .replace(/{{empresa}}/g, "Imobiliária Exemplo")
                    .replace(/{{cidade}}/g, "Vitória")
                    .replace(/{{estado}}/g, "ES"),
                }}
              />
            </DialogContent>
          </Dialog>
        </TabsContent>

        <TabsContent value="logs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center justify-between">
                Histórico de Buscas
                <div className="flex gap-2">
                  <Button size="sm" variant="destructive" onClick={cancelRunningRuns} disabled={!runs.some((r) => r.status === "rodando")}>
                    <XCircle className="h-4 w-4 mr-1" />Cancelar Rodando
                  </Button>
                  <Button size="sm" variant="outline" onClick={loadRuns}><RefreshCw className="h-4 w-4 mr-1" />Atualizar</Button>
                </div>
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
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 flex items-center justify-between gap-3">
              <div className="text-sm">
                <p className="font-semibold text-foreground">📧 Template de Convite Capimobi</p>
                <p className="text-xs text-muted-foreground">Carregue o e-mail bonito apresentando a plataforma</p>
              </div>
              <Button
                size="sm"
                type="button"
                onClick={() => {
                  setCampName(tplName);
                  setCampSubject(tplSubject);
                  setCampHtml(tplHtml);
                  toast({ title: "Template carregado", description: "Você pode editar antes de enviar" });
                }}
              >
                Usar template
              </Button>
            </div>
            <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3 flex items-center justify-between gap-3">
              <div className="text-sm">
                <p className="font-semibold text-foreground">💬 Integração Apify Leads (WhatsApp)</p>
                <p className="text-xs text-muted-foreground">Convida o lead a falar no WhatsApp e conhecer o site</p>
              </div>
              <Button
                size="sm"
                type="button"
                variant="secondary"
                onClick={() => {
                  setCampName(tpl2Name);
                  setCampSubject(tpl2Subject);
                  setCampHtml(tpl2Html);
                  toast({ title: "Template carregado", description: "Você pode editar antes de enviar" });
                }}
              >
                Usar template
              </Button>
            </div>
            <div>
              <Label>Nome interno</Label>
              <Input value={campName} onChange={(e) => setCampName(e.target.value)} placeholder="Ex: Convite Capimobi - Out/2025" />
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
