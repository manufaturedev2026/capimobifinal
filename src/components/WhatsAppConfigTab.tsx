import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { MessageCircle, Bot, PowerOff, Loader2, Save, Sparkles } from "lucide-react";

type Mode = "disabled" | "crm" | "ai";

interface Props {
  userId: string;
  sellerId: string;
}

const DEFAULT_PROMPT = `Você é uma atendente simpática e profissional. Qualifique o lead descobrindo:
1. Tipo de imóvel desejado (casa, apartamento, terreno, comercial)
2. Cidade e bairro de interesse
3. Faixa de valor / forma de pagamento (à vista ou financiamento)
4. Urgência (precisa rápido ou está pesquisando)

Sempre confirme dados importantes e seja calorosa. Não invente preços ou disponibilidade — diga que o corretor vai confirmar.`;

export default function WhatsAppConfigTab({ userId, sellerId }: Props) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [mode, setMode] = useState<Mode>("crm");
  const [aiName, setAiName] = useState("Sofia");
  const [welcome, setWelcome] = useState("");
  const [prompt, setPrompt] = useState(DEFAULT_PROMPT);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("whatsapp_mode, whatsapp_ai_name, whatsapp_ai_welcome, whatsapp_ai_prompt, show_floating_whatsapp")
        .eq("id", sellerId)
        .maybeSingle();
      if (data) {
        setMode(((data as any).whatsapp_mode as Mode) || "crm");
        setAiName((data as any).whatsapp_ai_name || "Sofia");
        setWelcome((data as any).whatsapp_ai_welcome || "");
        setPrompt((data as any).whatsapp_ai_prompt || DEFAULT_PROMPT);
      }
      setLoading(false);
    })();
  }, [sellerId]);

  const save = async () => {
    setSaving(true);
    const payload: any = {
      whatsapp_mode: mode,
      whatsapp_ai_name: aiName.trim().slice(0, 60) || "Sofia",
      whatsapp_ai_welcome: welcome.trim().slice(0, 500) || null,
      whatsapp_ai_prompt: prompt.trim().slice(0, 2000) || null,
      // Mantém o toggle legado em sincronia
      show_floating_whatsapp: mode !== "disabled",
    };
    const { error } = await supabase.from("profiles").update(payload).eq("id", sellerId);
    setSaving(false);
    if (error) {
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Configuração salva!", description: "O WhatsApp da sua loja já está atualizado." });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-muted-foreground" />
      </div>
    );
  }

  const opts: { id: Mode; icon: any; title: string; desc: string; color: string }[] = [
    {
      id: "disabled",
      icon: PowerOff,
      title: "Desativado",
      desc: "Esconde o botão flutuante de WhatsApp da sua loja.",
      color: "from-muted-foreground/20 to-muted-foreground/5",
    },
    {
      id: "crm",
      icon: MessageCircle,
      title: "WhatsApp + CRM (padrão)",
      desc: "Ao clicar, o visitante preenche um mini formulário (nome, telefone, cidade) e vai para o seu WhatsApp. O lead entra direto no seu CRM.",
      color: "from-emerald-500/30 to-green-500/10",
    },
    {
      id: "ai",
      icon: Bot,
      title: "Atendente IA (recepciona o lead)",
      desc: "Uma atendente IA conversa com o visitante no site, qualifica o lead, salva no CRM e te avisa. Custa 1 crédito por sessão de 30min.",
      color: "from-primary/30 to-accent/10",
    },
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 rounded-2xl bg-primary/15 text-primary flex items-center justify-center">
          <MessageCircle size={22} />
        </div>
        <div>
          <h2 className="font-display font-bold text-2xl text-foreground">WhatsApp da Loja</h2>
          <p className="text-sm text-muted-foreground">
            Escolha como o botão de WhatsApp da sua loja recebe os visitantes.
          </p>
        </div>
      </div>

      <div className="grid gap-3">
        {opts.map((opt) => {
          const Icon = opt.icon;
          const active = mode === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => setMode(opt.id)}
              className={`text-left rounded-2xl border-2 transition-all p-4 bg-gradient-to-br ${opt.color} ${
                active ? "border-primary shadow-lg" : "border-border hover:border-primary/40"
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${active ? "bg-primary text-primary-foreground" : "bg-background text-foreground"}`}>
                  <Icon size={18} />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-foreground">{opt.title}</p>
                  <p className="text-xs text-muted-foreground mt-1">{opt.desc}</p>
                </div>
                <div className={`w-5 h-5 rounded-full border-2 ${active ? "bg-primary border-primary" : "border-border"}`} />
              </div>
            </button>
          );
        })}
      </div>

      {mode === "ai" && (
        <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-primary" />
            <h3 className="font-bold text-foreground">Personalização da Atendente IA</h3>
          </div>

          <div>
            <label className="text-xs font-bold text-foreground uppercase tracking-wider">Nome da atendente</label>
            <input
              value={aiName}
              onChange={(e) => setAiName(e.target.value)}
              maxLength={60}
              placeholder="Sofia"
              className="mt-1 w-full rounded-xl border border-input bg-background text-foreground placeholder:text-muted-foreground px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-foreground uppercase tracking-wider">Mensagem de boas-vindas</label>
            <textarea
              value={welcome}
              onChange={(e) => setWelcome(e.target.value)}
              maxLength={500}
              rows={3}
              placeholder="Olá! 👋 Sou a Sofia da imobiliária X. Como posso te ajudar?"
              className="mt-1 w-full rounded-xl border border-input bg-background text-foreground placeholder:text-muted-foreground px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
            />
            <p className="text-[11px] text-muted-foreground mt-1">Aparece como primeira mensagem. Se vazio, usamos um padrão.</p>
          </div>

          <div>
            <label className="text-xs font-bold text-foreground uppercase tracking-wider">Instruções para a IA</label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              maxLength={2000}
              rows={8}
              className="mt-1 w-full rounded-xl border border-input bg-background text-foreground placeholder:text-muted-foreground px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30 font-mono"
            />
            <p className="text-[11px] text-muted-foreground mt-1">
              Diga como ela deve atender, o que perguntar e o tom de voz. Máx. 2000 caracteres.
            </p>
          </div>

          <div className="rounded-xl bg-amber-500/10 border border-amber-500/30 p-3 text-xs text-foreground">
            ⚠️ A IA <strong>não fecha vendas</strong> — ela qualifica o lead, salva no seu CRM e oferece o botão para continuar no seu WhatsApp.
          </div>
        </div>
      )}

      <button
        onClick={save}
        disabled={saving}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-primary-foreground font-bold hover:opacity-90 disabled:opacity-50 transition"
      >
        {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
        Salvar configuração
      </button>
    </div>
  );
}