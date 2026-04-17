import { useEffect, useState } from "react";
import { Mail, Save, Loader2, CheckCircle2, XCircle, Send, FileText, Trash2, Server } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

type SmtpRow = {
  id: string;
  enabled: boolean;
  sender_name: string;
  sender_email: string;
  host: string;
  port: number;
  security: "ssl" | "tls" | "none";
  username: string;
  password_encrypted: string | null;
  reply_to: string | null;
  use_for_signup: boolean;
  use_for_recovery: boolean;
  last_test_at: string | null;
  last_test_status: string | null;
  last_test_error: string | null;
};

type EmailLog = {
  id: string;
  to_email: string;
  subject: string;
  status: string;
  error_message: string | null;
  context: string | null;
  created_at: string;
};

type Preset = { id: string; label: string; host: string; port: number; security: "ssl" | "tls" | "none"; hint: string };

const PRESETS: Preset[] = [
  { id: "hostinger", label: "Hostinger", host: "smtp.hostinger.com", port: 465, security: "ssl", hint: "Usuário = e-mail completo. Senha = senha do e-mail criado no hPanel." },
  { id: "gmail", label: "Gmail", host: "smtp.gmail.com", port: 465, security: "ssl", hint: "Use uma 'Senha de App' do Google (não a senha normal). Ative verificação em 2 etapas e gere em myaccount.google.com/apppasswords." },
  { id: "gmail-tls", label: "Gmail (TLS 587)", host: "smtp.gmail.com", port: 587, security: "tls", hint: "Alternativa Gmail via STARTTLS na porta 587. Também requer Senha de App." },
  { id: "outlook", label: "Outlook / Microsoft 365", host: "smtp.office365.com", port: 587, security: "tls", hint: "Use seu e-mail e senha (ou Senha de App se 2FA ativo)." },
  { id: "custom", label: "Personalizado", host: "", port: 587, security: "tls", hint: "Configure manualmente os dados do seu provedor." },
];

export default function AdminSmtpTab() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [row, setRow] = useState<SmtpRow | null>(null);
  const [password, setPassword] = useState("");
  const [presetId, setPresetId] = useState<string>("hostinger");
  const [testEmail, setTestEmail] = useState("");
  const [logs, setLogs] = useState<EmailLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("smtp_settings" as any).select("*").limit(1).maybeSingle();
    if (data) {
      setRow(data as any);
      const matched = PRESETS.find(
        (p) => p.host === (data as any).host && p.port === (data as any).port && p.security === (data as any).security,
      );
      setPresetId(matched?.id || "custom");
    }
    setLoading(false);
  };

  const loadLogs = async () => {
    setLogsLoading(true);
    const { data } = await supabase
      .from("email_logs" as any)
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);
    setLogs((data as any) || []);
    setLogsLoading(false);
  };

  useEffect(() => {
    load();
    loadLogs();
  }, []);

  const applyPreset = (id: string) => {
    setPresetId(id);
    const p = PRESETS.find((x) => x.id === id);
    if (!p || !row) return;
    if (id === "custom") {
      setRow({ ...row });
      return;
    }
    setRow({ ...row, host: p.host, port: p.port, security: p.security });
  };

  const handleSave = async () => {
    if (!row) return;
    setSaving(true);
    try {
      const { error } = await supabase.functions.invoke("save-smtp-settings", {
        body: {
          enabled: row.enabled,
          sender_name: row.sender_name,
          sender_email: row.sender_email,
          host: row.host,
          port: row.port,
          security: row.security,
          username: row.username,
          password: password || null,
          reply_to: row.reply_to,
          use_for_signup: row.use_for_signup,
          use_for_recovery: row.use_for_recovery,
        },
      });
      if (error) throw error;
      toast({ title: "Configurações salvas!" });
      setPassword("");
      load();
    } catch (e: any) {
      toast({ title: "Erro ao salvar", description: e.message, variant: "destructive" });
    }
    setSaving(false);
  };

  const handleTest = async () => {
    if (!testEmail) {
      toast({ title: "Informe um e-mail de teste", variant: "destructive" });
      return;
    }
    setTesting(true);
    try {
      const { data, error } = await supabase.functions.invoke("test-smtp", { body: { to: testEmail } });
      if (error) throw error;
      if ((data as any)?.ok) {
        toast({ title: "E-mail de teste enviado!", description: `Enviado para ${testEmail}` });
      } else {
        toast({ title: "Falha no teste", description: (data as any)?.error || "Erro desconhecido", variant: "destructive" });
      }
      load();
      loadLogs();
    } catch (e: any) {
      toast({ title: "Erro no teste", description: e.message, variant: "destructive" });
    }
    setTesting(false);
  };

  const clearLogs = async () => {
    if (!confirm("Limpar todos os logs de e-mail?")) return;
    await supabase.from("email_logs" as any).delete().neq("id", "00000000-0000-0000-0000-000000000000");
    loadLogs();
  };

  if (loading || !row) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  const preset = PRESETS.find((p) => p.id === presetId);
  const statusOk = row.last_test_status === "success";
  const statusFail = row.last_test_status === "error";

  return (
    <div className="space-y-5">
      <div className="bg-card border border-border rounded-2xl p-5">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h3 className="font-display font-bold text-lg text-foreground flex items-center gap-2">
              <Mail size={20} className="text-primary" /> Configurações de E-mail SMTP
            </h3>
            <p className="text-sm text-muted-foreground mt-1">Configure o servidor SMTP para envio de e-mails da plataforma.</p>
          </div>
          <div className="flex items-center gap-2">
            {statusOk && <span className="flex items-center gap-1 text-xs font-medium text-emerald-500"><CheckCircle2 size={14} /> Conectado</span>}
            {statusFail && <span className="flex items-center gap-1 text-xs font-medium text-destructive"><XCircle size={14} /> Erro</span>}
          </div>
        </div>

        {/* Preset selector */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-foreground mb-2">Provedor SMTP</label>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            {PRESETS.map((p) => (
              <button
                key={p.id}
                onClick={() => applyPreset(p.id)}
                className={`px-3 py-2 rounded-xl border text-sm font-medium transition-all ${
                  presetId === p.id
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-secondary text-secondary-foreground hover:bg-secondary/80"
                }`}
              >
                <Server size={14} className="inline mr-1" /> {p.label}
              </button>
            ))}
          </div>
          {preset && (
            <p className="text-xs text-muted-foreground mt-2 bg-secondary/50 rounded-lg px-3 py-2">
              💡 {preset.hint}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Toggle label="Ativar SMTP" checked={row.enabled} onChange={(v) => setRow({ ...row, enabled: v })} />
          <Toggle label="Usar para cadastro (signup)" checked={row.use_for_signup} onChange={(v) => setRow({ ...row, use_for_signup: v })} />
          <Toggle label="Usar para recuperação de senha" checked={row.use_for_recovery} onChange={(v) => setRow({ ...row, use_for_recovery: v })} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <Field label="Nome do remetente" value={row.sender_name} onChange={(v) => setRow({ ...row, sender_name: v })} placeholder="Capimobi" />
          <Field label="E-mail remetente" value={row.sender_email} onChange={(v) => setRow({ ...row, sender_email: v })} placeholder="contato@seudominio.com" type="email" />
          <Field label="Host SMTP" value={row.host} onChange={(v) => setRow({ ...row, host: v })} placeholder="smtp.hostinger.com" />
          <Field label="Porta SMTP" value={String(row.port)} onChange={(v) => setRow({ ...row, port: parseInt(v) || 0 })} placeholder="465" type="number" />
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Segurança</label>
            <select
              value={row.security}
              onChange={(e) => setRow({ ...row, security: e.target.value as any })}
              className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm text-foreground focus:ring-2 focus:ring-ring focus:outline-none"
            >
              <option value="ssl">SSL (porta 465)</option>
              <option value="tls">TLS / STARTTLS (porta 587)</option>
              <option value="none">Nenhuma</option>
            </select>
          </div>
          <Field label="Usuário SMTP" value={row.username} onChange={(v) => setRow({ ...row, username: v })} placeholder="contato@seudominio.com" />
          <Field
            label={`Senha SMTP ${row.password_encrypted ? "(deixe vazio para manter)" : ""}`}
            value={password}
            onChange={setPassword}
            placeholder={row.password_encrypted ? "•••••••• (já configurada)" : "Sua senha SMTP"}
            type="password"
          />
          <Field label="E-mail de resposta (Reply-To)" value={row.reply_to || ""} onChange={(v) => setRow({ ...row, reply_to: v })} placeholder="opcional" type="email" />
        </div>

        {row.last_test_error && (
          <div className="mt-4 p-3 rounded-xl bg-destructive/10 border border-destructive/30 text-xs text-destructive">
            <strong>Último erro:</strong> {row.last_test_error}
          </div>
        )}

        <button
          onClick={handleSave}
          disabled={saving}
          className="mt-5 flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-50 shadow-lg shadow-primary/20"
        >
          {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
          Salvar Configurações
        </button>
      </div>

      {/* Test */}
      <div className="bg-card border border-border rounded-2xl p-5">
        <h3 className="font-display font-bold text-lg text-foreground flex items-center gap-2 mb-1">
          <Send size={20} className="text-primary" /> Testar Conexão
        </h3>
        <p className="text-sm text-muted-foreground mb-4">Envia um e-mail de teste para validar as configurações.</p>
        <div className="flex flex-col md:flex-row gap-2">
          <input
            type="email"
            value={testEmail}
            onChange={(e) => setTestEmail(e.target.value)}
            placeholder="seu@email.com"
            className="flex-1 rounded-xl border border-input bg-background px-4 py-3 text-sm text-foreground focus:ring-2 focus:ring-ring focus:outline-none"
          />
          <button
            onClick={handleTest}
            disabled={testing || !row.enabled}
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-secondary text-secondary-foreground font-bold text-sm hover:bg-secondary/80 disabled:opacity-50"
          >
            {testing ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
            Enviar Teste
          </button>
        </div>
      </div>

      {/* Logs */}
      <div className="bg-card border border-border rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-bold text-lg text-foreground flex items-center gap-2">
            <FileText size={20} className="text-primary" /> Logs de Envio
          </h3>
          <button onClick={clearLogs} className="text-xs text-destructive hover:underline flex items-center gap-1">
            <Trash2 size={12} /> Limpar logs
          </button>
        </div>
        {logsLoading ? (
          <Loader2 className="animate-spin text-primary mx-auto" size={24} />
        ) : logs.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">Nenhum e-mail enviado ainda.</p>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {logs.map((log) => (
              <div key={log.id} className="flex items-start gap-3 p-3 rounded-xl bg-secondary/50 border border-border text-xs">
                <div className="flex-shrink-0 mt-0.5">
                  {log.status === "sent" ? (
                    <CheckCircle2 size={16} className="text-emerald-500" />
                  ) : log.status === "failed" ? (
                    <XCircle size={16} className="text-destructive" />
                  ) : (
                    <Loader2 size={16} className="text-muted-foreground animate-spin" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <strong className="text-foreground truncate">{log.to_email}</strong>
                    <span className="text-muted-foreground flex-shrink-0">{new Date(log.created_at).toLocaleString("pt-BR")}</span>
                  </div>
                  <div className="text-muted-foreground truncate">{log.subject}</div>
                  {log.error_message && <div className="text-destructive mt-1">{log.error_message}</div>}
                  {log.context && <div className="text-muted-foreground/70 italic mt-1">contexto: {log.context}</div>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder, type = "text" }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) {
  return (
    <div>
      <label className="block text-sm font-medium text-foreground mb-2">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm text-foreground focus:ring-2 focus:ring-ring focus:outline-none"
      />
    </div>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl bg-secondary/50 border border-border">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="w-5 h-5 rounded accent-primary" />
      <span className="text-sm font-medium text-foreground">{label}</span>
    </label>
  );
}
