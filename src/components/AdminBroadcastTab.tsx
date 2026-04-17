import { useEffect, useState } from "react";
import { Megaphone, Send, Loader2, Save, Trash2, Plus, FileText, Users, TestTube, History } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { PACKAGE_CONFIG } from "@/hooks/useSubscription";

type Template = { id: string; name: string; subject: string; content_html: string };
type SendRow = { id: string; batch_id: string; to_email: string; subject: string; tier_filter: string | null; status: string; error_message: string | null; sent_at: string };

const DEFAULT_HTML = `<div style="font-family:system-ui,sans-serif;max-width:560px;margin:auto;padding:24px;background:#f8fafc;border-radius:12px;color:#0f172a">
  <h2>Olá {{nome}}!</h2>
  <p>Escreva sua mensagem aqui...</p>
  <p style="margin-top:20px"><a href="https://capimobi.com.br/painel" style="background:#2563eb;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none">Acessar Painel</a></p>
</div>`;

const TIERS = ["start", "basico", "premium", "vip", "essencial_empresa", "premium_empresa", "prime_empresa", "black"] as const;

export default function AdminBroadcastTab() {
  const { toast } = useToast();
  const [tab, setTab] = useState<"compose" | "templates" | "history">("compose");
  const [templates, setTemplates] = useState<Template[]>([]);
  const [sends, setSends] = useState<SendRow[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  const [subject, setSubject] = useState("");
  const [contentHtml, setContentHtml] = useState(DEFAULT_HTML);
  const [selectedTiers, setSelectedTiers] = useState<string[]>([]);
  const [testEmail, setTestEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [testing, setTesting] = useState(false);
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState("");

  const load = async () => {
    setLoading(true);
    const [{ data: t }, { data: s }, { data: subs }] = await Promise.all([
      supabase.from("broadcast_templates" as any).select("*").order("created_at", { ascending: false }),
      supabase.from("broadcast_sends" as any).select("*").order("sent_at", { ascending: false }).limit(200),
      supabase.from("seller_subscriptions").select("tier").eq("is_active", true),
    ]);
    setTemplates((t as any) || []);
    setSends((s as any) || []);
    const c: Record<string, number> = {};
    (subs || []).forEach((r: any) => { c[r.tier] = (c[r.tier] || 0) + 1; });
    setCounts(c);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const totalRecipients = selectedTiers.reduce((sum, t) => sum + (counts[t] || 0), 0);

  const toggleTier = (t: string) => {
    setSelectedTiers((prev) => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);
  };

  const loadTemplate = (tpl: Template) => {
    setSubject(tpl.subject);
    setContentHtml(tpl.content_html);
    setTab("compose");
    toast({ title: "Template carregado" });
  };

  const saveAsTemplate = async () => {
    if (!newTemplateName.trim() || !subject.trim()) {
      toast({ title: "Informe nome e assunto", variant: "destructive" });
      return;
    }
    setSavingTemplate(true);
    const { error } = await supabase.from("broadcast_templates" as any).insert({
      name: newTemplateName, subject, content_html: contentHtml,
    });
    setSavingTemplate(false);
    if (error) toast({ title: "Erro", description: error.message, variant: "destructive" });
    else {
      toast({ title: "Template salvo!" });
      setNewTemplateName("");
      load();
    }
  };

  const deleteTemplate = async (id: string) => {
    if (!confirm("Excluir este template?")) return;
    const { error } = await supabase.from("broadcast_templates" as any).delete().eq("id", id);
    if (error) toast({ title: "Erro", description: error.message, variant: "destructive" });
    else load();
  };

  const sendTest = async () => {
    if (!testEmail || !subject || !contentHtml) {
      toast({ title: "Preencha assunto, conteúdo e e-mail de teste", variant: "destructive" });
      return;
    }
    setTesting(true);
    const { data, error } = await supabase.functions.invoke("send-broadcast-email", {
      body: { subject, content_html: contentHtml, tiers: [], test_email: testEmail },
    });
    setTesting(false);
    if (error || (data as any)?.error) {
      toast({ title: "Erro no envio", description: (data as any)?.error || error?.message, variant: "destructive" });
    } else {
      toast({ title: "E-mail de teste enviado!", description: testEmail });
    }
  };

  const sendBroadcast = async () => {
    if (!subject || !contentHtml) {
      toast({ title: "Preencha assunto e conteúdo", variant: "destructive" });
      return;
    }
    if (selectedTiers.length === 0) {
      toast({ title: "Selecione ao menos um plano", variant: "destructive" });
      return;
    }
    if (!confirm(`Enviar para ${totalRecipients} corretor(es) do(s) plano(s) selecionado(s)?`)) return;

    setSending(true);
    const { data, error } = await supabase.functions.invoke("send-broadcast-email", {
      body: { subject, content_html: contentHtml, tiers: selectedTiers },
    });
    setSending(false);
    if (error || (data as any)?.error) {
      toast({ title: "Erro", description: (data as any)?.error || error?.message, variant: "destructive" });
    } else {
      toast({ title: "Broadcast concluído!", description: `Enviados: ${(data as any)?.sent || 0} | Falhas: ${(data as any)?.failed || 0}` });
      load();
    }
  };

  return (
    <div className="space-y-6 text-foreground">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2 text-foreground">
            <Megaphone className="w-6 h-6 text-primary" /> Broadcast de E-mails
          </h2>
          <p className="text-sm text-muted-foreground">
            Envio instantâneo para corretores filtrados por plano. Use <code className="bg-muted px-1 rounded">{"{{nome}}"}</code> para personalizar.
          </p>
        </div>
      </div>

      <div className="flex gap-2 border-b border-border">
        <button onClick={() => setTab("compose")} className={`px-4 py-2 font-medium flex items-center gap-2 ${tab === "compose" ? "border-b-2 border-primary text-primary" : "text-muted-foreground"}`}>
          <Send className="w-4 h-4" /> Compor
        </button>
        <button onClick={() => setTab("templates")} className={`px-4 py-2 font-medium flex items-center gap-2 ${tab === "templates" ? "border-b-2 border-primary text-primary" : "text-muted-foreground"}`}>
          <FileText className="w-4 h-4" /> Templates ({templates.length})
        </button>
        <button onClick={() => setTab("history")} className={`px-4 py-2 font-medium flex items-center gap-2 ${tab === "history" ? "border-b-2 border-primary text-primary" : "text-muted-foreground"}`}>
          <History className="w-4 h-4" /> Histórico ({sends.length})
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : tab === "compose" ? (
        <div className="space-y-5">
          {/* Tier selector */}
          <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <Users className="w-4 h-4 text-primary" />
              <h3 className="font-semibold text-foreground">Selecionar Planos</h3>
              <span className="ml-auto text-sm font-bold text-primary">
                {totalRecipients} destinatário{totalRecipients !== 1 ? "s" : ""}
              </span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {TIERS.map((t) => {
                const cfg = PACKAGE_CONFIG[t];
                const active = selectedTiers.includes(t);
                const count = counts[t] || 0;
                return (
                  <button
                    key={t}
                    onClick={() => toggleTier(t)}
                    className={`p-3 rounded-lg border-2 text-left transition-all ${active ? "border-primary bg-primary/10" : "border-border bg-background hover:border-primary/50"}`}
                  >
                    <div className="font-bold text-sm text-foreground">{cfg.name}</div>
                    <div className="text-xs text-muted-foreground">{count} corretor{count !== 1 ? "es" : ""}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Subject + content */}
          <div className="bg-card border border-border rounded-xl p-4 space-y-3 shadow-sm">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Assunto</label>
              <input value={subject} onChange={(e) => setSubject(e.target.value)}
                placeholder="Ex: {{nome}}, novidade exclusiva para você!"
                className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Conteúdo (HTML)</label>
              <textarea value={contentHtml} onChange={(e) => setContentHtml(e.target.value)} rows={12}
                className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground font-mono text-xs" />
            </div>

            {/* Save as template */}
            <div className="flex gap-2 pt-2 border-t border-border">
              <input value={newTemplateName} onChange={(e) => setNewTemplateName(e.target.value)}
                placeholder="Nome do template para salvar"
                className="flex-1 px-3 py-2 border border-input rounded-lg bg-background text-foreground text-sm" />
              <button onClick={saveAsTemplate} disabled={savingTemplate}
                className="px-3 py-2 rounded-lg bg-muted text-foreground text-sm flex items-center gap-1 hover:bg-muted/80 disabled:opacity-50">
                {savingTemplate ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Salvar como template
              </button>
            </div>
          </div>

          {/* Test + Send */}
          <div className="bg-card border border-border rounded-xl p-4 space-y-3 shadow-sm">
            <div className="flex gap-2">
              <input type="email" value={testEmail} onChange={(e) => setTestEmail(e.target.value)}
                placeholder="seu@email.com"
                className="flex-1 px-3 py-2 border border-input rounded-lg bg-background text-foreground text-sm" />
              <button onClick={sendTest} disabled={testing}
                className="px-4 py-2 rounded-lg bg-secondary text-secondary-foreground font-medium flex items-center gap-2 hover:opacity-90 disabled:opacity-50">
                {testing ? <Loader2 className="w-4 h-4 animate-spin" /> : <TestTube className="w-4 h-4" />}
                Enviar teste
              </button>
            </div>
            <button onClick={sendBroadcast} disabled={sending || totalRecipients === 0}
              className="w-full px-4 py-3 rounded-lg bg-primary text-primary-foreground font-bold flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50">
              {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
              Enviar para {totalRecipients} corretor{totalRecipients !== 1 ? "es" : ""}
            </button>
          </div>
        </div>
      ) : tab === "templates" ? (
        <div className="space-y-3">
          {templates.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              Nenhum template salvo. Vá em "Compor" e clique em "Salvar como template".
            </div>
          ) : templates.map((tpl) => (
            <div key={tpl.id} className="bg-card border border-border rounded-xl p-4 flex items-center justify-between shadow-sm">
              <div className="flex-1 min-w-0">
                <div className="font-bold text-foreground">{tpl.name}</div>
                <div className="text-sm text-muted-foreground truncate">{tpl.subject}</div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => loadTemplate(tpl)}
                  className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm hover:opacity-90">
                  Usar
                </button>
                <button onClick={() => deleteTemplate(tpl.id)}
                  className="p-2 rounded-lg hover:bg-destructive/10 text-destructive">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-muted text-muted-foreground">
              <tr>
                <th className="text-left p-3">Data</th>
                <th className="text-left p-3">E-mail</th>
                <th className="text-left p-3">Assunto</th>
                <th className="text-left p-3">Planos</th>
                <th className="text-left p-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {sends.map((h) => (
                <tr key={h.id} className="border-t border-border">
                  <td className="p-3 text-foreground whitespace-nowrap">{new Date(h.sent_at).toLocaleString("pt-BR")}</td>
                  <td className="p-3 text-foreground">{h.to_email}</td>
                  <td className="p-3 text-foreground max-w-xs truncate">{h.subject}</td>
                  <td className="p-3 text-xs text-muted-foreground">{h.tier_filter}</td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded text-xs ${h.status === "enviado" ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive"}`}>{h.status}</span>
                  </td>
                </tr>
              ))}
              {sends.length === 0 && (
                <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">Nenhum envio ainda.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
