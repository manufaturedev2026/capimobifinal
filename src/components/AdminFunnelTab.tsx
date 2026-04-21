import { useEffect, useMemo, useState } from "react";
import { Plus, Trash2, Save, Send, Loader2, Mail, Calendar, Eye, EyeOff, Copy, FileText, BarChart3, X, Sparkles, Users, UserMinus, UserPlus, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

type Step = {
  id: string;
  day_offset: number;
  subject: string;
  content_html: string;
  is_active: boolean;
};

type SendRow = {
  id: string;
  to_email: string;
  day_offset: number;
  status: string;
  error_message: string | null;
  sent_at: string;
};

type Recipient = {
  profile_id: string;
  user_id: string;
  full_name: string;
  email: string;
  created_at: string;
  sent_count: number;
  last_sent_at: string | null;
};

type Excluded = { id: string; email: string; reason: string | null; created_at: string };

const DEFAULT_HTML = `<div style="font-family:system-ui,sans-serif;max-width:560px;margin:auto;padding:24px;background:#f8fafc;border-radius:12px;color:#0f172a">
  <h2>Olá {{nome}}, bem-vindo(a) à Capimobi!</h2>
  <p>Estamos felizes em ter você conosco. Acesse seu painel e comece a anunciar agora.</p>
  <p style="margin-top:20px"><a href="https://capimobi.com.br/painel" style="background:#2563eb;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none">Acessar Painel</a></p>
</div>`;

const TEMPLATES: { name: string; subject: string; html: string }[] = [
  {
    name: "Boas-vindas",
    subject: "Bem-vindo(a) à Capimobi, {{nome}}! 🎉",
    html: `<div style="font-family:system-ui,sans-serif;max-width:560px;margin:auto;padding:24px;background:#f8fafc;border-radius:12px;color:#0f172a">
  <h2>Olá {{nome}}, seja muito bem-vindo(a)! 👋</h2>
  <p>Sua conta foi criada com sucesso. Agora você tem acesso a uma plataforma completa para vender mais imóveis.</p>
  <p><strong>O que fazer agora?</strong></p>
  <ul>
    <li>✅ Personalize sua loja virtual</li>
    <li>✅ Cadastre seus primeiros imóveis</li>
    <li>✅ Configure seu CRM</li>
  </ul>
  <p style="margin-top:20px"><a href="https://capimobi.com.br/painel" style="background:#2563eb;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none">Acessar Painel</a></p>
</div>`,
  },
  {
    name: "Dica de uso",
    subject: "{{nome}}, uma dica para vender mais 💡",
    html: `<div style="font-family:system-ui,sans-serif;max-width:560px;margin:auto;padding:24px;background:#f8fafc;border-radius:12px;color:#0f172a">
  <h2>Dica do dia, {{nome}} 💡</h2>
  <p>Imóveis com pelo menos <strong>5 fotos de qualidade</strong> recebem 3x mais visualizações.</p>
  <p>Que tal revisar seus anúncios agora?</p>
  <p style="margin-top:20px"><a href="https://capimobi.com.br/painel" style="background:#2563eb;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none">Revisar anúncios</a></p>
</div>`,
  },
  {
    name: "Upgrade de plano",
    subject: "{{nome}}, libere todo o potencial da sua loja 🚀",
    html: `<div style="font-family:system-ui,sans-serif;max-width:560px;margin:auto;padding:24px;background:#f8fafc;border-radius:12px;color:#0f172a">
  <h2>Está na hora de crescer, {{nome}}!</h2>
  <p>Com o plano <strong>Start</strong> a partir de R$24,99/mês você desbloqueia:</p>
  <ul>
    <li>📦 Até 25 imóveis</li>
    <li>🎨 Layouts premium</li>
    <li>📊 Analytics avançado</li>
    <li>📱 Push notifications ilimitados</li>
  </ul>
  <p style="margin-top:20px"><a href="https://capimobi.com.br/pacotes" style="background:#2563eb;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none">Ver planos</a></p>
</div>`,
  },
  {
    name: "Reengajamento",
    subject: "Sentimos sua falta, {{nome}} 💙",
    html: `<div style="font-family:system-ui,sans-serif;max-width:560px;margin:auto;padding:24px;background:#f8fafc;border-radius:12px;color:#0f172a">
  <h2>Faz tempo que não te vemos, {{nome}}!</h2>
  <p>Voltamos com novidades incríveis na plataforma. Que tal dar uma olhada?</p>
  <p style="margin-top:20px"><a href="https://capimobi.com.br/painel" style="background:#2563eb;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none">Voltar ao painel</a></p>
</div>`,
  },
];

export default function AdminFunnelTab() {
  const { toast } = useToast();
  const [steps, setSteps] = useState<Step[]>([]);
  const [sends, setSends] = useState<SendRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [tab, setTab] = useState<"steps" | "history" | "recipients">("steps");
  const [previewStep, setPreviewStep] = useState<Step | null>(null);
  const [showTemplates, setShowTemplates] = useState<string | null>(null); // step id
  const [historyFilter, setHistoryFilter] = useState<"all" | "enviado" | "falhou">("all");
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [excluded, setExcluded] = useState<Excluded[]>([]);
  const [recipientFilter, setRecipientFilter] = useState<"all" | "active" | "excluded">("all");
  const [recipientSearch, setRecipientSearch] = useState("");
  const [newExcludeEmail, setNewExcludeEmail] = useState("");
  const [busyEmail, setBusyEmail] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const [{ data: s }, { data: h }, { data: profilesData }, { data: exData }] = await Promise.all([
      supabase.from("funnel_steps").select("*").order("day_offset"),
      supabase.from("funnel_sends").select("*").order("sent_at", { ascending: false }).limit(2000),
      supabase.from("profiles").select("id, user_id, full_name, email, created_at").not("email", "is", null).order("created_at", { ascending: false }),
      supabase.from("funnel_excluded_emails").select("*").order("created_at", { ascending: false }),
    ]);
    setSteps((s as Step[]) || []);
    const sendRows = (h as SendRow[]) || [];
    setSends(sendRows);
    setExcluded((exData as Excluded[]) || []);

    // Build recipients with stats
    const sendsByEmail: Record<string, { count: number; last: string | null }> = {};
    sendRows.forEach((row) => {
      const k = row.to_email.toLowerCase();
      if (!sendsByEmail[k]) sendsByEmail[k] = { count: 0, last: null };
      if (row.status === "enviado") {
        sendsByEmail[k].count++;
        if (!sendsByEmail[k].last || new Date(row.sent_at) > new Date(sendsByEmail[k].last!)) {
          sendsByEmail[k].last = row.sent_at;
        }
      }
    });
    const recs: Recipient[] = ((profilesData as any[]) || []).map((p) => {
      const stats = sendsByEmail[(p.email || "").toLowerCase()] || { count: 0, last: null };
      return {
        profile_id: p.id,
        user_id: p.user_id,
        full_name: p.full_name || "—",
        email: p.email,
        created_at: p.created_at,
        sent_count: stats.count,
        last_sent_at: stats.last,
      };
    });
    setRecipients(recs);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const sendsByDay = useMemo(() => {
    const map: Record<number, { sent: number; failed: number }> = {};
    sends.forEach(s => {
      if (!map[s.day_offset]) map[s.day_offset] = { sent: 0, failed: 0 };
      if (s.status === "enviado") map[s.day_offset].sent++;
      else map[s.day_offset].failed++;
    });
    return map;
  }, [sends]);

  const totalStats = useMemo(() => {
    const sent = sends.filter(s => s.status === "enviado").length;
    const failed = sends.filter(s => s.status !== "enviado").length;
    return { sent, failed, total: sends.length };
  }, [sends]);

  const filteredSends = useMemo(() => {
    if (historyFilter === "all") return sends;
    if (historyFilter === "enviado") return sends.filter(s => s.status === "enviado");
    return sends.filter(s => s.status !== "enviado");
  }, [sends, historyFilter]);

  const addStep = async (preset?: { subject: string; html: string }) => {
    const used = new Set(steps.map(s => s.day_offset));
    let day = 0;
    while (used.has(day)) day++;
    const { error } = await supabase.from("funnel_steps").insert({
      day_offset: day,
      subject: preset?.subject || `Dia ${day} — Assunto do e-mail`,
      content_html: preset?.html || DEFAULT_HTML,
      is_active: true,
    });
    if (error) toast({ title: "Erro", description: error.message, variant: "destructive" });
    else { toast({ title: "Etapa adicionada!", description: `Dia ${day} criado com sucesso` }); load(); }
  };

  const duplicateStep = async (s: Step) => {
    const used = new Set(steps.map(x => x.day_offset));
    let day = s.day_offset + 1;
    while (used.has(day)) day++;
    const { error } = await supabase.from("funnel_steps").insert({
      day_offset: day,
      subject: s.subject + " (cópia)",
      content_html: s.content_html,
      is_active: false,
    });
    if (error) toast({ title: "Erro", description: error.message, variant: "destructive" });
    else { toast({ title: "Etapa duplicada!", description: `Nova etapa no dia ${day}` }); load(); }
  };

  const updateStep = async (s: Step) => {
    setSaving(s.id);
    const { error } = await supabase.from("funnel_steps").update({
      day_offset: s.day_offset, subject: s.subject, content_html: s.content_html, is_active: s.is_active,
    }).eq("id", s.id);
    setSaving(null);
    if (error) toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
    else toast({ title: "Etapa salva!" });
  };

  const deleteStep = async (id: string, dayOffset: number) => {
    if (!confirm(`Excluir a etapa do Dia ${dayOffset} do funil?\n\nEsta ação não pode ser desfeita.`)) return;
    const { error } = await supabase.from("funnel_steps").delete().eq("id", id);
    if (error) toast({ title: "Erro", description: error.message, variant: "destructive" });
    else { toast({ title: "Etapa removida" }); load(); }
  };

  const applyTemplate = (stepId: string, tpl: { subject: string; html: string }) => {
    const v = steps.map(x => x.id === stepId ? { ...x, subject: tpl.subject, content_html: tpl.html } : x);
    setSteps(v);
    const updated = v.find(x => x.id === stepId);
    if (updated) updateStep(updated);
    setShowTemplates(null);
  };

  const runNow = async () => {
    setRunning(true);
    const { data, error } = await supabase.functions.invoke("process-funnel-emails");
    setRunning(false);
    if (error) toast({ title: "Erro", description: error.message, variant: "destructive" });
    else {
      toast({ title: "Processamento concluído", description: `Enviados: ${data?.sent || 0} | Falhas: ${data?.failed || 0} | Já enviados: ${data?.skipped || 0}` });
      load();
    }
  };

  const renderPreview = (html: string, name = "João Silva") => html.replace(/\{\{nome\}\}/g, name);

  const excludedSet = useMemo(
    () => new Set(excluded.map((e) => e.email.toLowerCase().trim())),
    [excluded]
  );

  const excludeEmail = async (email: string, reason?: string) => {
    const clean = email.trim().toLowerCase();
    if (!clean) return;
    setBusyEmail(clean);
    const { error } = await supabase
      .from("funnel_excluded_emails")
      .insert({ email: clean, reason: reason || "Removido manualmente pelo admin" });
    setBusyEmail(null);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "E-mail removido do funil", description: clean });
      load();
    }
  };

  const reincludeEmail = async (email: string) => {
    const clean = email.trim().toLowerCase();
    setBusyEmail(clean);
    const { error } = await supabase.from("funnel_excluded_emails").delete().eq("email", clean);
    setBusyEmail(null);
    if (error) toast({ title: "Erro", description: error.message, variant: "destructive" });
    else { toast({ title: "E-mail reincluído no funil", description: clean }); load(); }
  };

  const addManualExclusion = async () => {
    const emails = newExcludeEmail
      .split(/[\s,;]+/)
      .map((e) => e.trim().toLowerCase())
      .filter((e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e));
    if (emails.length === 0) {
      toast({ title: "Nenhum e-mail válido", variant: "destructive" });
      return;
    }
    const rows = emails.map((email) => ({ email, reason: "Adicionado manualmente" }));
    const { error } = await supabase.from("funnel_excluded_emails").upsert(rows, { onConflict: "email" });
    if (error) toast({ title: "Erro", description: error.message, variant: "destructive" });
    else {
      toast({ title: `${emails.length} e-mail(s) excluído(s) do funil` });
      setNewExcludeEmail("");
      load();
    }
  };

  const filteredRecipients = useMemo(() => {
    let list = recipients;
    if (recipientFilter === "active") list = list.filter((r) => !excludedSet.has(r.email.toLowerCase()));
    if (recipientFilter === "excluded") list = list.filter((r) => excludedSet.has(r.email.toLowerCase()));
    const q = recipientSearch.trim().toLowerCase();
    if (q) list = list.filter((r) => r.email.toLowerCase().includes(q) || r.full_name.toLowerCase().includes(q));
    return list;
  }, [recipients, recipientFilter, excludedSet, recipientSearch]);

  // E-mails excluídos manualmente que NÃO são perfis cadastrados
  const orphanExclusions = useMemo(() => {
    const profileEmails = new Set(recipients.map((r) => r.email.toLowerCase()));
    return excluded.filter((e) => !profileEmails.has(e.email.toLowerCase()));
  }, [excluded, recipients]);


  return (
    <div className="space-y-6 text-foreground">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2 text-foreground">
            <Mail className="w-6 h-6 text-primary" /> Funil de E-mails
          </h2>
          <p className="text-sm text-muted-foreground">
            Sequência automática para novos corretores. Variáveis: <code className="bg-muted text-foreground px-1 rounded">{"{{nome}}"}</code>
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={load} className="px-3 py-2 rounded-lg border border-border text-sm hover:bg-muted">
            Atualizar
          </button>
          <button onClick={runNow} disabled={running}
            className="px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium flex items-center gap-2 disabled:opacity-50">
            {running ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Executar agora
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="text-xs text-muted-foreground">Etapas ativas</div>
          <div className="text-2xl font-bold text-foreground mt-1">{steps.filter(s => s.is_active).length}<span className="text-sm text-muted-foreground">/{steps.length}</span></div>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="text-xs text-muted-foreground">Enviados (total)</div>
          <div className="text-2xl font-bold text-primary mt-1">{totalStats.sent}</div>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="text-xs text-muted-foreground">Falhas</div>
          <div className="text-2xl font-bold text-destructive mt-1">{totalStats.failed}</div>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="text-xs text-muted-foreground">Taxa de sucesso</div>
          <div className="text-2xl font-bold text-foreground mt-1">
            {totalStats.total > 0 ? Math.round((totalStats.sent / totalStats.total) * 100) : 0}%
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border flex-wrap">
        <button onClick={() => setTab("steps")} className={`px-4 py-2 font-medium ${tab === "steps" ? "border-b-2 border-primary text-primary" : "text-muted-foreground"}`}>
          Etapas ({steps.length})
        </button>
        <button onClick={() => setTab("recipients")} className={`px-4 py-2 font-medium flex items-center gap-1.5 ${tab === "recipients" ? "border-b-2 border-primary text-primary" : "text-muted-foreground"}`}>
          <Users className="w-4 h-4" /> Destinatários ({recipients.length})
        </button>
        <button onClick={() => setTab("history")} className={`px-4 py-2 font-medium ${tab === "history" ? "border-b-2 border-primary text-primary" : "text-muted-foreground"}`}>
          Histórico ({sends.length})
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : tab === "steps" ? (
        <div className="space-y-4">
          {/* Add buttons */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <button onClick={() => addStep()} className="py-3 border-2 border-dashed border-border rounded-xl flex items-center justify-center gap-2 hover:bg-muted text-foreground">
              <Plus className="w-5 h-5" /> Adicionar etapa em branco
            </button>
            <div className="relative group">
              <button className="w-full py-3 border-2 border-dashed border-primary/40 rounded-xl flex items-center justify-center gap-2 hover:bg-primary/5 text-primary">
                <Sparkles className="w-5 h-5" /> Adicionar a partir de modelo
              </button>
              <div className="absolute z-10 left-0 right-0 mt-1 bg-popover border border-border rounded-xl shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition">
                {TEMPLATES.map(t => (
                  <button key={t.name} onClick={() => addStep({ subject: t.subject, html: t.html })}
                    className="w-full text-left px-4 py-2.5 hover:bg-muted text-sm text-foreground first:rounded-t-xl last:rounded-b-xl">
                    <div className="font-medium">{t.name}</div>
                    <div className="text-xs text-muted-foreground truncate">{t.subject}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Steps */}
          {steps.map((s, i) => {
            const stats = sendsByDay[s.day_offset] || { sent: 0, failed: 0 };
            return (
              <div key={s.id} className="bg-card text-card-foreground border border-border rounded-xl p-4 space-y-3 shadow-sm">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Calendar className="w-4 h-4 text-primary" />
                    <span className="font-semibold text-foreground">Dia</span>
                    <input type="number" min={0} value={s.day_offset}
                      onChange={(e) => { const v = [...steps]; v[i] = { ...s, day_offset: parseInt(e.target.value) || 0 }; setSteps(v); }}
                      className="w-20 px-2 py-1 border border-input rounded bg-background text-foreground" />
                    <span className="text-sm text-muted-foreground">após o cadastro</span>
                    <span className="ml-2 text-xs flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-primary/10 text-primary flex items-center gap-1">
                        <BarChart3 className="w-3 h-3" /> {stats.sent} enviados
                      </span>
                      {stats.failed > 0 && (
                        <span className="px-2 py-0.5 rounded bg-destructive/10 text-destructive">{stats.failed} falhas</span>
                      )}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button onClick={() => { const v = [...steps]; v[i] = { ...s, is_active: !s.is_active }; setSteps(v); updateStep({ ...s, is_active: !s.is_active }); }}
                      className={`px-3 py-1.5 rounded-lg text-sm flex items-center gap-1 ${s.is_active ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                      {s.is_active ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                      {s.is_active ? "Ativa" : "Inativa"}
                    </button>
                    <button onClick={() => setPreviewStep(s)} title="Pré-visualizar"
                      className="p-2 rounded-lg hover:bg-muted text-foreground">
                      <Eye className="w-4 h-4" />
                    </button>
                    <button onClick={() => setShowTemplates(showTemplates === s.id ? null : s.id)} title="Aplicar modelo"
                      className="p-2 rounded-lg hover:bg-muted text-foreground">
                      <FileText className="w-4 h-4" />
                    </button>
                    <button onClick={() => duplicateStep(s)} title="Duplicar"
                      className="p-2 rounded-lg hover:bg-muted text-foreground">
                      <Copy className="w-4 h-4" />
                    </button>
                    <button onClick={() => updateStep(s)} disabled={saving === s.id}
                      className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm flex items-center gap-1 hover:opacity-90">
                      {saving === s.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />} Salvar
                    </button>
                    <button onClick={() => deleteStep(s.id, s.day_offset)} title="Excluir"
                      className="p-2 rounded-lg hover:bg-destructive/10 text-destructive">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {showTemplates === s.id && (
                  <div className="bg-muted/50 border border-border rounded-lg p-3 space-y-1">
                    <div className="text-xs font-medium text-muted-foreground mb-2">Aplicar modelo (substitui o conteúdo atual):</div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {TEMPLATES.map(t => (
                        <button key={t.name} onClick={() => applyTemplate(s.id, t)}
                          className="text-left px-3 py-2 rounded-lg bg-background border border-border hover:border-primary text-sm">
                          <div className="font-medium text-foreground">{t.name}</div>
                          <div className="text-xs text-muted-foreground truncate">{t.subject}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <label className="text-xs font-medium text-muted-foreground">Assunto</label>
                  <input value={s.subject}
                    onChange={(e) => { const v = [...steps]; v[i] = { ...s, subject: e.target.value }; setSteps(v); }}
                    className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground" />
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground">Conteúdo (HTML)</label>
                  <textarea value={s.content_html}
                    onChange={(e) => { const v = [...steps]; v[i] = { ...s, content_html: e.target.value }; setSteps(v); }}
                    rows={8} className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground font-mono text-xs" />
                </div>
              </div>
            );
          })}

          {steps.length === 0 && (
            <div className="text-center py-12 text-muted-foreground border-2 border-dashed border-border rounded-xl">
              Nenhuma etapa criada. Use os botões acima para adicionar a primeira etapa.
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex gap-2">
            {(["all", "enviado", "falhou"] as const).map(f => (
              <button key={f} onClick={() => setHistoryFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-sm ${historyFilter === f ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                {f === "all" ? "Todos" : f === "enviado" ? "Enviados" : "Falhas"}
              </button>
            ))}
          </div>
          <div className="bg-card text-card-foreground border border-border rounded-xl overflow-hidden shadow-sm overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted text-muted-foreground">
                <tr>
                  <th className="text-left p-3">Data</th>
                  <th className="text-left p-3">E-mail</th>
                  <th className="text-left p-3">Dia</th>
                  <th className="text-left p-3">Status</th>
                  <th className="text-left p-3">Erro</th>
                </tr>
              </thead>
              <tbody>
                {filteredSends.map(h => (
                  <tr key={h.id} className="border-t border-border">
                    <td className="p-3 text-foreground whitespace-nowrap">{new Date(h.sent_at).toLocaleString("pt-BR")}</td>
                    <td className="p-3 text-foreground">{h.to_email}</td>
                    <td className="p-3 text-foreground">Dia {h.day_offset}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-xs ${h.status === "enviado" ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive"}`}>{h.status}</span>
                    </td>
                    <td className="p-3 text-xs text-muted-foreground max-w-xs truncate">{h.error_message}</td>
                  </tr>
                ))}
                {filteredSends.length === 0 && (
                  <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">Nenhum envio encontrado.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Preview modal */}
      {previewStep && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => setPreviewStep(null)}>
          <div className="bg-card border border-border rounded-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div>
                <div className="text-xs text-muted-foreground">Pré-visualização — Dia {previewStep.day_offset}</div>
                <div className="font-semibold text-foreground">{renderPreview(previewStep.subject)}</div>
              </div>
              <button onClick={() => setPreviewStep(null)} className="p-2 hover:bg-muted rounded-lg">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="overflow-auto p-4 bg-muted/30">
              <div dangerouslySetInnerHTML={{ __html: renderPreview(previewStep.content_html) }} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
