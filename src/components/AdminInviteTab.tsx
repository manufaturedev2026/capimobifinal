import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Save, ExternalLink, Copy, MessageCircle, User, ArrowUp, ArrowDown } from "lucide-react";

interface ChatMessage {
  id: string;
  text: string;
  sender: "attendant" | "user";
  delay: number;
}

const DEFAULT_MESSAGES: ChatMessage[] = [
  { id: "1", text: "Olá! 👋 Seja bem-vindo(a) à Capimobi!", sender: "attendant", delay: 800 },
  { id: "2", text: "Eu sou a Ana, sua consultora digital 😊", sender: "attendant", delay: 2200 },
  { id: "3", text: "Você sabia que pode criar sua loja de imóveis 100% GRÁTIS? 🏠✨", sender: "attendant", delay: 3800 },
  { id: "4", text: "Sério?! Como funciona?", sender: "user", delay: 5500 },
  { id: "5", text: "Sim! Com a Capimobi você tem:\n\n✅ Loja online personalizada\n✅ CRM de leads integrado\n✅ Compartilhamento por WhatsApp\n✅ Página profissional com seu nome\n✅ Cadastro de imóveis ilimitado no plano gratuito", sender: "attendant", delay: 7000 },
  { id: "6", text: "E o melhor: é tudo pelo celular! 📱", sender: "attendant", delay: 9500 },
  { id: "7", text: "Quanto custa?", sender: "user", delay: 11000 },
  { id: "8", text: "O cadastro é GRATUITO! 🎉\n\nVocê já começa com acesso ao painel completo, pode cadastrar seus imóveis e compartilhar sua loja.\n\nSe quiser turbinar, temos planos a partir de R$29/mês com funcionalidades premium!", sender: "attendant", delay: 12500 },
  { id: "9", text: "Quero criar minha conta! 🚀", sender: "user", delay: 15000 },
  { id: "10", text: "Perfeito! Clica no botão abaixo e cria sua conta em menos de 2 minutos! 👇", sender: "attendant", delay: 16500 },
];

export default function AdminInviteTab() {
  const { toast } = useToast();
  const [messages, setMessages] = useState<ChatMessage[]>(DEFAULT_MESSAGES);
  const [attendantName, setAttendantName] = useState("Ana • Capimobi");
  const [attendantAvatar, setAttendantAvatar] = useState("");
  const [ctaText, setCtaText] = useState("🚀 Criar Minha Conta Grátis");
  const [ctaUrl, setCtaUrl] = useState("/login");
  const [ctaType, setCtaType] = useState<"internal" | "whatsapp" | "whatsapp_group" | "url">("internal");
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("platform_settings")
        .select("value")
        .eq("key", "invite_chat_config")
        .maybeSingle();
      if (data?.value) {
        try {
          const config = JSON.parse(data.value);
          if (config.messages?.length) setMessages(config.messages);
          if (config.attendantName) setAttendantName(config.attendantName);
          if (config.attendantAvatar) setAttendantAvatar(config.attendantAvatar);
          if (config.ctaText) setCtaText(config.ctaText);
          if (config.ctaUrl) setCtaUrl(config.ctaUrl);
          if (config.ctaType) setCtaType(config.ctaType);
        } catch {}
      }
      setLoaded(true);
    };
    load();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    // Recalculate delays automatically
    const recalculated = messages.map((m, i) => ({
      ...m,
      delay: (i + 1) * 1800,
    }));
    const config = JSON.stringify({
      attendantName,
      attendantAvatar,
      ctaText,
      ctaUrl,
      ctaType,
      messages: recalculated,
    });
    const { error } = await supabase
      .from("platform_settings")
      .upsert({ key: "invite_chat_config", value: config, updated_at: new Date().toISOString() } as any, { onConflict: "key" });
    setSaving(false);
    if (error) {
      toast({ title: "Erro ao salvar", variant: "destructive" });
    } else {
      setMessages(recalculated);
      toast({ title: "Convite salvo com sucesso!" });
    }
  };

  const addMessage = () => {
    const newId = String(Date.now());
    setMessages((prev) => [
      ...prev,
      { id: newId, text: "", sender: "attendant", delay: (prev.length + 1) * 1800 },
    ]);
  };

  const removeMessage = (id: string) => {
    setMessages((prev) => prev.filter((m) => m.id !== id));
  };

  const updateMessage = (id: string, field: keyof ChatMessage, value: string) => {
    setMessages((prev) =>
      prev.map((m) => (m.id === id ? { ...m, [field]: value } : m))
    );
  };

  const moveMessage = (index: number, dir: -1 | 1) => {
    const newIndex = index + dir;
    if (newIndex < 0 || newIndex >= messages.length) return;
    const copy = [...messages];
    [copy[index], copy[newIndex]] = [copy[newIndex], copy[index]];
    setMessages(copy);
  };

  const copyUrl = () => {
    const url = `${window.location.origin}/convite`;
    navigator.clipboard.writeText(url);
    toast({ title: "URL copiada!", description: url });
  };

  if (!loaded) return <div className="p-8 text-center text-muted-foreground">Carregando...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2 text-foreground">
            <MessageCircle size={22} className="text-[#25d366]" />
            Página de Convite (WhatsApp)
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Simula uma conversa de WhatsApp para atrair novos corretores via Facebook Ads
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={copyUrl}>
            <Copy size={14} /> Copiar URL
          </Button>
          <a href="/convite" target="_blank" rel="noopener">
            <Button variant="secondary" size="sm">
              <ExternalLink size={14} /> Visualizar
            </Button>
          </a>
        </div>
      </div>

      {/* Attendant config */}
      <div className="bg-card border border-border rounded-xl p-4 space-y-3">
        <h3 className="text-sm font-semibold flex items-center gap-2 text-foreground">
          <User size={16} /> Atendente
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-muted-foreground">Nome da atendente</label>
            <Input
              value={attendantName}
              onChange={(e) => setAttendantName(e.target.value)}
              placeholder="Ana • Capimobi"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">URL do avatar (opcional)</label>
            <Input
              value={attendantAvatar}
              onChange={(e) => setAttendantAvatar(e.target.value)}
              placeholder="https://..."
            />
          </div>
        </div>
      </div>

      {/* CTA config */}
      <div className="bg-card border border-border rounded-xl p-4 space-y-3">
        <h3 className="text-sm font-semibold flex items-center gap-2 text-foreground">
          <ExternalLink size={16} /> Botão Final (CTA)
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="text-xs text-muted-foreground">Tipo de link</label>
            <select
              value={ctaType}
              onChange={(e) => {
                const v = e.target.value as typeof ctaType;
                setCtaType(v);
                if (v === "internal") setCtaUrl("/login");
                else if (v === "whatsapp") setCtaUrl("https://wa.me/5500000000000");
                else if (v === "whatsapp_group") setCtaUrl("https://chat.whatsapp.com/...");
                else setCtaUrl("https://");
              }}
              className="w-full text-sm bg-card text-foreground border border-border rounded px-3 py-2 mt-1"
            >
              <option value="internal">📱 Cadastro interno (/login)</option>
              <option value="whatsapp">💬 WhatsApp direto</option>
              <option value="whatsapp_group">👥 Grupo de WhatsApp</option>
              <option value="url">🔗 URL externa</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Texto do botão</label>
            <Input
              value={ctaText}
              onChange={(e) => setCtaText(e.target.value)}
              placeholder="🚀 Criar Minha Conta Grátis"
              className="mt-1"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">
              {ctaType === "internal" ? "Rota interna" : "URL completa"}
            </label>
            <Input
              value={ctaUrl}
              onChange={(e) => setCtaUrl(e.target.value)}
              placeholder={ctaType === "whatsapp" ? "https://wa.me/5527..." : ctaType === "whatsapp_group" ? "https://chat.whatsapp.com/..." : "/login"}
              className="mt-1"
            />
          </div>
        </div>
      </div>

      {/* Messages editor */}
      <div className="bg-card border border-border rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">Mensagens da conversa</h3>
          <Button variant="secondary" size="sm" onClick={addMessage}>
            <Plus size={14} /> Adicionar
          </Button>
        </div>

        <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
          {messages.map((msg, i) => (
            <div
              key={msg.id}
              className={`flex gap-2 p-3 rounded-lg border ${
                msg.sender === "user"
                  ? "border-primary/30 bg-primary/10"
                  : "border-border bg-background"
              }`}
            >
              <div className="flex flex-col gap-1 shrink-0">
                <button
                  onClick={() => moveMessage(i, -1)}
                  disabled={i === 0}
                  className="text-muted-foreground hover:text-foreground disabled:opacity-30"
                >
                  <ArrowUp size={14} />
                </button>
                <button
                  onClick={() => moveMessage(i, 1)}
                  disabled={i === messages.length - 1}
                  className="text-muted-foreground hover:text-foreground disabled:opacity-30"
                >
                  <ArrowDown size={14} />
                </button>
              </div>
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <select
                    value={msg.sender}
                    onChange={(e) => updateMessage(msg.id, "sender", e.target.value)}
                    className="text-xs bg-card text-foreground border border-border rounded px-2 py-1"
                  >
                    <option value="attendant">🟢 Atendente</option>
                    <option value="user">🔵 Usuário</option>
                  </select>
                  <span className="text-[10px] text-muted-foreground">#{i + 1}</span>
                </div>
                <Textarea
                  value={msg.text}
                  onChange={(e) => updateMessage(msg.id, "text", e.target.value)}
                  placeholder="Texto da mensagem..."
                  className="min-h-[60px] text-sm"
                />
              </div>
              <button
                onClick={() => removeMessage(msg.id)}
                className="text-destructive/60 hover:text-destructive shrink-0 mt-1"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      </div>

      <Button onClick={handleSave} disabled={saving} className="w-full sm:w-auto">
        <Save size={16} /> {saving ? "Salvando..." : "Salvar Convite"}
      </Button>
    </div>
  );
}
