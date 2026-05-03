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

const CONVITE_LEADS_HTML = `<div style="font-family:'Segoe UI',-apple-system,BlinkMacSystemFont,system-ui,sans-serif;max-width:640px;margin:0 auto;padding:0;background:#0f172a;">
  <div style="background:linear-gradient(135deg,#064e3b 0%,#16a34a 50%,#22c55e 100%);padding:0;border-radius:20px 20px 0 0;text-align:center;position:relative;overflow:hidden;">
    <div style="padding:48px 28px 40px;position:relative;">
      <div style="display:inline-block;background:rgba(255,255,255,0.18);backdrop-filter:blur(10px);padding:8px 18px;border-radius:999px;margin-bottom:18px;border:1px solid rgba(255,255,255,0.25);">
        <span style="color:#ffffff;font-size:12px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;">✨ Convite Exclusivo</span>
      </div>
      <h1 style="margin:0 0 12px;font-size:34px;color:#ffffff;font-weight:800;letter-spacing:-0.5px;line-height:1.15;">Bem-vindo à Capimobi</h1>
      <p style="margin:0;color:#dcfce7;font-size:16px;font-weight:500;">Acesso liberado para <strong style="color:#ffffff;">{{nome}}</strong></p>
    </div>
  </div>

  <div style="background:#ffffff;padding:40px 32px 36px;">
    <h2 style="margin:0 0 18px;font-size:26px;color:#0f172a;font-weight:700;letter-spacing:-0.3px;">Olá, {{nome}} 👋</h2>
    <p style="font-size:16px;line-height:1.7;color:#475569;margin:0 0 14px;">
      Preparamos um <strong style="color:#16a34a;">acesso gratuito exclusivo</strong> para você conhecer a Capimobi — a plataforma completa para corretores que querem vender mais e melhor.
    </p>
    <p style="font-size:14px;line-height:1.6;color:#64748b;margin:0 0 28px;background:#f1f5f9;padding:12px 16px;border-radius:10px;border-left:3px solid #16a34a;">
      📧 Cadastro reservado para: <strong style="color:#0f172a;">{{email}}</strong>
    </p>

    <h3 style="margin:0 0 16px;font-size:14px;color:#0f172a;font-weight:700;text-transform:uppercase;letter-spacing:1px;">O que você vai ter:</h3>
    <table cellpadding="0" cellspacing="0" border="0" style="width:100%;margin-bottom:28px;">
      <tr>
        <td style="padding:10px 0;vertical-align:top;width:38px;"><div style="width:32px;height:32px;background:#dcfce7;border-radius:8px;text-align:center;line-height:32px;font-size:16px;">📊</div></td>
        <td style="padding:10px 0 10px 12px;font-size:15px;color:#334155;line-height:1.5;"><strong style="color:#0f172a;">CRM completo</strong> para gerenciar leads e clientes</td>
      </tr>
      <tr>
        <td style="padding:10px 0;vertical-align:top;width:38px;"><div style="width:32px;height:32px;background:#dcfce7;border-radius:8px;text-align:center;line-height:32px;font-size:16px;">🌐</div></td>
        <td style="padding:10px 0 10px 12px;font-size:15px;color:#334155;line-height:1.5;"><strong style="color:#0f172a;">Site imobiliário profissional</strong> personalizado</td>
      </tr>
      <tr>
        <td style="padding:10px 0;vertical-align:top;width:38px;"><div style="width:32px;height:32px;background:#dcfce7;border-radius:8px;text-align:center;line-height:32px;font-size:16px;">🤖</div></td>
        <td style="padding:10px 0 10px 12px;font-size:15px;color:#334155;line-height:1.5;"><strong style="color:#0f172a;">Captação automática</strong> de imóveis com IA</td>
      </tr>
      <tr>
        <td style="padding:10px 0;vertical-align:top;width:38px;"><div style="width:32px;height:32px;background:#dcfce7;border-radius:8px;text-align:center;line-height:32px;font-size:16px;">✍️</div></td>
        <td style="padding:10px 0 10px 12px;font-size:15px;color:#334155;line-height:1.5;"><strong style="color:#0f172a;">IA para anúncios</strong> e textos profissionais</td>
      </tr>
      <tr>
        <td style="padding:10px 0;vertical-align:top;width:38px;"><div style="width:32px;height:32px;background:#dcfce7;border-radius:8px;text-align:center;line-height:32px;font-size:16px;">🚀</div></td>
        <td style="padding:10px 0 10px 12px;font-size:15px;color:#334155;line-height:1.5;"><strong style="color:#0f172a;">Painel moderno</strong> e ferramentas exclusivas de vendas</td>
      </tr>
    </table>

    <div style="background:linear-gradient(135deg,#ecfdf5 0%,#d1fae5 100%);border:1px solid #86efac;padding:20px;border-radius:14px;margin:0 0 32px;">
      <p style="margin:0;font-size:15px;color:#065f46;line-height:1.6;font-weight:500;">
        <span style="font-size:18px;">✅</span> <strong>{{nome}}</strong>, seu acesso gratuito já está ativo. Crie sua conta agora e comece a usar sem compromisso.
      </p>
    </div>

    <div style="text-align:center;margin:0 0 12px;">
      <a href="https://capimobi.com.br/anunciar" style="background:linear-gradient(135deg,#16a34a 0%,#15803d 100%);color:#ffffff;padding:18px 44px;text-decoration:none;border-radius:12px;font-weight:700;display:inline-block;font-size:16px;letter-spacing:0.3px;box-shadow:0 8px 20px rgba(22,163,74,0.35);">
        Criar Minha Conta Grátis →
      </a>
    </div>
    <p style="text-align:center;margin:0 0 28px;font-size:13px;color:#94a3b8;">Sem cartão de crédito • Acesso imediato</p>

    <div style="border-top:1px solid #e2e8f0;padding-top:20px;">
      <p style="margin:0 0 6px;font-size:13px;color:#64748b;line-height:1.6;text-align:center;">
        Convite enviado para <strong style="color:#334155;">{{nome}}</strong>
      </p>
      <p style="margin:0;font-size:12px;color:#94a3b8;line-height:1.6;text-align:center;">
        {{email}}
      </p>
    </div>
  </div>

  <div style="background:#0f172a;padding:24px;border-radius:0 0 20px 20px;text-align:center;">
    <p style="margin:0 0 6px;font-size:14px;color:#ffffff;font-weight:700;">Cap<span style="color:#22c55e;">i</span>mobi</p>
    <p style="margin:0;font-size:12px;color:#64748b;">© 2026 Capimobi • Tecnologia que impulsiona resultados</p>
  </div>
</div>`;

const BUILTIN_TEMPLATES: Template[] = [
  {
    id: "builtin-convite-leads",
    name: "🎁 Convite para Leads",
    subject: "{{nome}}, seu acesso gratuito ao Capimobi está liberado 🎉",
    content_html: CONVITE_LEADS_HTML,
  },
];

const TIERS = ["basico", "start", "premium", "prime", "basico_empresa", "essencial_empresa", "premium_empresa", "prime_empresa"] as const;
// Display overrides to disambiguate duplicated names in PACKAGE_CONFIG
const TIER_LABEL_OVERRIDES: Record<string, string> = {
  prime_empresa: "Black Empresa",
};

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
  const [customEmailsRaw, setCustomEmailsRaw] = useState("");
  const [testEmail, setTestEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [sendProgress, setSendProgress] = useState("");
  const [testing, setTesting] = useState(false);
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState("");

  const parseCustomEmails = (raw: string): string[] => {
    const matches = raw.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi) || [];
    return Array.from(new Set(matches.map((e) => e.toLowerCase()).filter((email) => {
      const [local, domain] = email.split("@");
      if (!local || !domain || local.startsWith(".") || local.endsWith(".") || local.startsWith("-")) return false;
      return domain.split(".").every((label) => /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/i.test(label));
    })));
  };
  const customEmails = parseCustomEmails(customEmailsRaw);

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

  const totalRecipients = selectedTiers.reduce((sum, t) => sum + (counts[t] || 0), 0) + customEmails.length;

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
    if (selectedTiers.length === 0 && customEmails.length === 0) {
      toast({ title: "Selecione um plano ou cole e-mails personalizados", variant: "destructive" });
      return;
    }
    if (!confirm(`Enviar para ${totalRecipients} destinatário(s)?`)) return;

    setSending(true);
    setSendProgress("");

    if (selectedTiers.length === 0 && customEmails.length > 0) {
      let sent = 0;
      let failed = 0;
      let pausedByLimit = false;
      let nextDelayMs = 70_000;
      let retryAfterMs = 0;

      for (let i = 0; i < customEmails.length; i++) {
        const email = customEmails[i];
        setSendProgress(`Enviando ${i + 1}/${customEmails.length}: ${email}`);
        const { data, error } = await supabase.functions.invoke("send-broadcast-email", {
          body: { subject, content_html: contentHtml, tiers: [], custom_emails: [email], sync: true },
        });

        if (error || (data as any)?.error) {
          failed += 1;
        } else {
          nextDelayMs = Number((data as any)?.delay_ms || nextDelayMs);
          sent += Number((data as any)?.sent || 0);
          failed += Number((data as any)?.failed || 0);
          if ((data as any)?.rate_limited) {
            pausedByLimit = true;
            retryAfterMs = Number((data as any)?.retry_after_ms || nextDelayMs);
            break;
          }
        }

        if (i < customEmails.length - 1) {
          setSendProgress(`Aguardando limite do SMTP (${Math.ceil(nextDelayMs / 1000)}s)... ${sent} enviado(s), ${failed} falha(s)`);
          await new Promise((resolve) => setTimeout(resolve, nextDelayMs));
        }
      }

      setSending(false);
      setSendProgress("");
      toast({
        title: pausedByLimit ? "Broadcast pausado pelo limite do SMTP" : "Broadcast finalizado",
        description: `Enviados: ${sent} | Falhas: ${failed}${pausedByLimit ? ` — aguarde cerca de ${Math.ceil((retryAfterMs || nextDelayMs) / 60000)} min antes de continuar.` : ""}`,
        variant: pausedByLimit ? "destructive" : undefined,
      });
      load();
      return;
    }

    const { data, error } = await supabase.functions.invoke("send-broadcast-email", {
      body: { subject, content_html: contentHtml, tiers: selectedTiers, custom_emails: customEmails },
    });
    setSending(false);
    setSendProgress("");
    if (error || (data as any)?.error) {
      toast({ title: "Erro", description: (data as any)?.error || error?.message, variant: "destructive" });
    } else {
      toast({ title: "Broadcast iniciado!", description: `${(data as any)?.total || totalRecipients} e-mail(s) na fila. Acompanhe o histórico em alguns minutos.` });
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
          <FileText className="w-4 h-4" /> Templates ({templates.length + BUILTIN_TEMPLATES.length})
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
                    <div className="font-bold text-sm text-foreground">{TIER_LABEL_OVERRIDES[t] || cfg.name}</div>
                    <div className="text-xs text-muted-foreground">{count} corretor{count !== 1 ? "es" : ""}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom emails */}
          <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <Send className="w-4 h-4 text-primary" />
              <h3 className="font-semibold text-foreground">Lista personalizada de e-mails</h3>
              <span className="ml-auto text-sm font-bold text-primary">
                {customEmails.length} válido{customEmails.length !== 1 ? "s" : ""}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mb-2">
              Cole um e-mail por linha (ou separados por vírgula). Esses e-mails serão somados aos planos selecionados acima. As variáveis <code className="bg-muted px-1 rounded">{"{{nome}}"}</code> usarão "Olá" como padrão para e-mails fora da base.
            </p>
            <textarea
              value={customEmailsRaw}
              onChange={(e) => setCustomEmailsRaw(e.target.value)}
              rows={5}
              placeholder={"joao@exemplo.com\nmaria@exemplo.com\npedro@exemplo.com"}
              className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground font-mono text-xs"
            />
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
              Enviar para {totalRecipients} destinatário{totalRecipients !== 1 ? "s" : ""}
            </button>
            {sendProgress && <p className="text-xs text-muted-foreground text-center">{sendProgress}</p>}
          </div>
        </div>
      ) : tab === "templates" ? (
        <div className="space-y-3">
          {BUILTIN_TEMPLATES.map((tpl) => (
            <div key={tpl.id} className="bg-card border-2 border-primary/30 rounded-xl p-4 flex items-center justify-between shadow-sm">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase font-bold tracking-wider bg-primary/10 text-primary px-2 py-0.5 rounded">Padrão</span>
                  <div className="font-bold text-foreground">{tpl.name}</div>
                </div>
                <div className="text-sm text-muted-foreground truncate mt-1">{tpl.subject}</div>
              </div>
              <button onClick={() => loadTemplate(tpl)}
                className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm hover:opacity-90">
                Usar
              </button>
            </div>
          ))}
          {templates.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              Nenhum template personalizado salvo ainda. Vá em "Compor" e clique em "Salvar como template".
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
