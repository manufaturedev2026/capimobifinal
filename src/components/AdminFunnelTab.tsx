import { useEffect, useState } from "react";
import { Plus, Trash2, Save, Send, Loader2, Mail, Calendar, Eye, EyeOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

type Step = {
  id: string;
  day_offset: number;
  subject: string;
  content_html: string;
  is_active: boolean;
};

type Send = {
  id: string;
  to_email: string;
  day_offset: number;
  status: string;
  error_message: string | null;
  sent_at: string;
};

const DEFAULT_HTML = `<div style="font-family:system-ui,sans-serif;max-width:560px;margin:auto;padding:24px;background:#f8fafc;border-radius:12px;color:#0f172a">
  <h2>Olá {{nome}}, bem-vindo(a) à Capimobi!</h2>
  <p>Estamos felizes em ter você conosco. Acesse seu painel e comece a anunciar agora.</p>
  <p style="margin-top:20px"><a href="https://capimobi001.lovable.app/painel" style="background:#2563eb;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none">Acessar Painel</a></p>
</div>`;

export default function AdminFunnelTab() {
  const { toast } = useToast();
  const [steps, setSteps] = useState<Step[]>([]);
  const [sends, setSends] = useState<Send[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [tab, setTab] = useState<"steps" | "history">("steps");

  const load = async () => {
    setLoading(true);
    const [{ data: s }, { data: h }] = await Promise.all([
      supabase.from("funnel_steps").select("*").order("day_offset"),
      supabase.from("funnel_sends").select("*").order("sent_at", { ascending: false }).limit(200),
    ]);
    setSteps((s as Step[]) || []);
    setSends((h as Send[]) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const addStep = async () => {
    const used = new Set(steps.map(s => s.day_offset));
    let day = 0;
    while (used.has(day)) day++;
    const { error } = await supabase.from("funnel_steps").insert({
      day_offset: day,
      subject: `Dia ${day} — Assunto do e-mail`,
      content_html: DEFAULT_HTML,
      is_active: true,
    });
    if (error) toast({ title: "Erro", description: error.message, variant: "destructive" });
    else load();
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

  const deleteStep = async (id: string) => {
    if (!confirm("Excluir esta etapa do funil?")) return;
    const { error } = await supabase.from("funnel_steps").delete().eq("id", id);
    if (error) toast({ title: "Erro", description: error.message, variant: "destructive" });
    else load();
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

  return (
    <div className="space-y-6 text-foreground">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2 text-foreground"><Mail className="w-6 h-6 text-primary" /> Funil de E-mails</h2>
          <p className="text-sm text-muted-foreground">Sequência automática para novos corretores cadastrados. Use <code className="bg-muted text-foreground px-1 rounded">{"{{nome}}"}</code> nos textos.</p>
        </div>
        <button onClick={runNow} disabled={running}
          className="px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium flex items-center gap-2 disabled:opacity-50">
          {running ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          Executar agora
        </button>
      </div>

      <div className="flex gap-2 border-b">
        <button onClick={() => setTab("steps")} className={`px-4 py-2 font-medium ${tab === "steps" ? "border-b-2 border-primary text-primary" : "text-muted-foreground"}`}>Etapas ({steps.length})</button>
        <button onClick={() => setTab("history")} className={`px-4 py-2 font-medium ${tab === "history" ? "border-b-2 border-primary text-primary" : "text-muted-foreground"}`}>Histórico ({sends.length})</button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : tab === "steps" ? (
        <div className="space-y-4">
          <button onClick={addStep} className="w-full py-3 border-2 border-dashed rounded-xl flex items-center justify-center gap-2 hover:bg-muted">
            <Plus className="w-5 h-5" /> Adicionar etapa
          </button>

          {steps.map((s, i) => (
            <div key={s.id} className="bg-card text-card-foreground border border-border rounded-xl p-4 space-y-3 shadow-sm">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-primary" />
                  <span className="font-semibold text-foreground">Dia</span>
                  <input type="number" min={0} value={s.day_offset}
                    onChange={(e) => { const v = [...steps]; v[i] = { ...s, day_offset: parseInt(e.target.value) || 0 }; setSteps(v); }}
                    className="w-20 px-2 py-1 border border-input rounded bg-background text-foreground" />
                  <span className="text-sm text-muted-foreground">após o cadastro</span>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => { const v = [...steps]; v[i] = { ...s, is_active: !s.is_active }; setSteps(v); updateStep({ ...s, is_active: !s.is_active }); }}
                    className={`px-3 py-1.5 rounded-lg text-sm flex items-center gap-1 ${s.is_active ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                    {s.is_active ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                    {s.is_active ? "Ativa" : "Inativa"}
                  </button>
                  <button onClick={() => updateStep(s)} disabled={saving === s.id}
                    className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm flex items-center gap-1 hover:opacity-90">
                    {saving === s.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />} Salvar
                  </button>
                  <button onClick={() => deleteStep(s.id)} className="p-2 rounded-lg hover:bg-destructive/10 text-destructive">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

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
          ))}

          {steps.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">Nenhuma etapa criada. Clique em "Adicionar etapa" para começar.</div>
          )}
        </div>
      ) : (
        <div className="bg-card border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted">
              <tr>
                <th className="text-left p-3">Data</th>
                <th className="text-left p-3">E-mail</th>
                <th className="text-left p-3">Dia</th>
                <th className="text-left p-3">Status</th>
                <th className="text-left p-3">Erro</th>
              </tr>
            </thead>
            <tbody>
              {sends.map(h => (
                <tr key={h.id} className="border-t">
                  <td className="p-3">{new Date(h.sent_at).toLocaleString("pt-BR")}</td>
                  <td className="p-3">{h.to_email}</td>
                  <td className="p-3">Dia {h.day_offset}</td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded text-xs ${h.status === "enviado" ? "bg-green-500/10 text-green-600" : "bg-red-500/10 text-red-600"}`}>{h.status}</span>
                  </td>
                  <td className="p-3 text-xs text-muted-foreground max-w-xs truncate">{h.error_message}</td>
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
