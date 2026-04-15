import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Link2, Copy, ExternalLink, User, Phone, MapPin, Home, DollarSign, Clock,
  Filter, Loader2, Inbox, Sparkles, ChevronDown, ChevronUp, Image as ImageIcon, Trash2, Video,
  MessageCircle, Save, Settings, Megaphone, LayoutList
} from "lucide-react";

interface CaptacaoOnlineTabProps {
  userId: string;
  sellerId: string;
  sellerSlug: string | null;
  sellerName: string;
  currentTier?: string;
}

type Lead = {
  id: string;
  full_name: string;
  phone: string;
  property_type: string;
  address: string | null;
  desired_price: number | null;
  photos: string[] | null;
  description: string | null;
  status: string;
  created_at: string;
};

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  novo: { label: "Novo", color: "bg-blue-500" },
  em_contato: { label: "Em contato", color: "bg-yellow-500" },
  captado: { label: "Captado", color: "bg-green-500" },
  perdido: { label: "Perdido", color: "bg-red-500" },
};

const PROPERTY_TYPE_LABELS: Record<string, string> = {
  casa: "Casa", apartamento: "Apartamento", terreno: "Terreno",
  comercial: "Comercial", galpao: "Galpão", flat: "Flat", outros: "Outros",
};

/* ── Collapsible Section ─────────────────────────────────── */
function Section({ icon: Icon, title, badge, defaultOpen = false, children, accent = false }: {
  icon: any; title: string; badge?: string; defaultOpen?: boolean; children: React.ReactNode; accent?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className={`rounded-2xl border overflow-hidden transition-colors ${accent ? "border-primary/25 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" : "border-border bg-card"}`}>
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-secondary/30 transition-colors"
      >
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${accent ? "bg-primary/15" : "bg-secondary"}`}>
          <Icon size={16} className={accent ? "text-primary" : "text-muted-foreground"} />
        </div>
        <span className="text-sm font-bold text-foreground flex-1">{title}</span>
        {badge && <Badge variant="secondary" className="text-[10px] mr-1">{badge}</Badge>}
        {open ? <ChevronUp size={16} className="text-muted-foreground" /> : <ChevronDown size={16} className="text-muted-foreground" />}
      </button>
      {open && <div className="px-4 pb-4 space-y-3">{children}</div>}
    </div>
  );
}

export default function CaptacaoOnlineTab({ userId, sellerId, sellerSlug, sellerName, currentTier = "basico" }: CaptacaoOnlineTabProps) {
  const TIER_ORDER = ["basico", "start", "premium", "vip", "essencial_empresa", "premium_empresa", "prime_empresa", "black"];
  const tierLevel = TIER_ORDER.indexOf(currentTier);
  const hasLandingPage = tierLevel >= 1; // Start+
  const hasBot = tierLevel >= 2; // VIP+
  const { toast } = useToast();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("todos");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [generatedAd, setGeneratedAd] = useState("");
  const [captureVideoUrl, setCaptureVideoUrl] = useState("");
  const [captureVideoTitle, setCaptureVideoTitle] = useState("");
  const [savingVideo, setSavingVideo] = useState(false);

  // Bot config
  const [botAttendantName, setBotAttendantName] = useState("Assistente Imobiliário");
  const [botAttendantAvatar, setBotAttendantAvatar] = useState("");
  const [botOpeningMessage, setBotOpeningMessage] = useState("Olá! 👋 Vou te ajudar a cadastrar seu imóvel para avaliação gratuita! É rápido e sem compromisso 🏡");
  const [botChatMode, setBotChatMode] = useState<"flow" | "ai">("flow");
  const [savingBot, setSavingBot] = useState(false);

  const captureUrl = `${window.location.origin}/captar-imovel/${sellerSlug || sellerId}`;
  const chatBotUrl = `${window.location.origin}/captar-imovel/${sellerSlug || sellerId}/chat`;

  useEffect(() => {
    fetchLeads();
    fetchCaptureVideo();
    fetchBotConfig();
  }, [sellerId]);

  const fetchCaptureVideo = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("capture_video_url, capture_video_title")
      .eq("id", sellerId)
      .maybeSingle();
    if (data?.capture_video_url) setCaptureVideoUrl(data.capture_video_url);
    if ((data as any)?.capture_video_title) setCaptureVideoTitle((data as any).capture_video_title);
  };

  const fetchBotConfig = async () => {
    const { data } = await supabase
      .from("platform_settings")
      .select("value")
      .eq("key", `capture_bot_config_${sellerId}`)
      .maybeSingle();
    if (data?.value) {
      try {
        const cfg = JSON.parse(data.value);
        if (cfg.attendantName) setBotAttendantName(cfg.attendantName);
        if (cfg.attendantAvatar) setBotAttendantAvatar(cfg.attendantAvatar);
        if (cfg.openingMessage) setBotOpeningMessage(cfg.openingMessage);
        if (cfg.chatMode) setBotChatMode(cfg.chatMode);
      } catch {}
    }
  };

  const saveBotConfig = async () => {
    setSavingBot(true);
    const config = JSON.stringify({
      attendantName: botAttendantName,
      attendantAvatar: botAttendantAvatar,
      openingMessage: botOpeningMessage,
      chatMode: botChatMode,
    });
    const { error } = await supabase
      .from("platform_settings")
      .upsert({ key: `capture_bot_config_${sellerId}`, value: config, updated_at: new Date().toISOString() } as any, { onConflict: "key" });
    setSavingBot(false);
    if (error) {
      toast({ title: "Erro ao salvar bot", variant: "destructive" });
    } else {
      toast({ title: "Bot de captação salvo!" });
    }
  };

  const saveCaptureVideo = async () => {
    setSavingVideo(true);
    await supabase
      .from("profiles")
      .update({ capture_video_url: captureVideoUrl || null, capture_video_title: captureVideoTitle || null } as any)
      .eq("id", sellerId);
    toast({ title: "Vídeo salvo!" });
    setSavingVideo(false);
  };

  const fetchLeads = async () => {
    const { data } = await supabase
      .from("property_capture_leads" as any)
      .select("*")
      .eq("seller_id", sellerId)
      .order("created_at", { ascending: false });
    if (data) setLeads(data as any);
    setLoading(false);
  };

  const updateStatus = async (leadId: string, newStatus: string) => {
    await supabase.from("property_capture_leads" as any).update({ status: newStatus }).eq("id", leadId);
    setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status: newStatus } : l));
    toast({ title: `Status atualizado para "${STATUS_CONFIG[newStatus]?.label || newStatus}"` });
  };

  const deleteLead = async (leadId: string) => {
    await supabase.from("property_capture_leads" as any).delete().eq("id", leadId);
    setLeads(prev => prev.filter(l => l.id !== leadId));
    toast({ title: "Lead removido" });
  };

  const copyLink = (url: string, label: string) => {
    navigator.clipboard.writeText(url);
    toast({ title: `${label} copiado!`, description: url });
  };

  const generateAdText = () => {
    const text = `🏡 Quer vender ou alugar seu imóvel MAIS RÁPIDO e pelo melhor valor?

Eu posso te ajudar 👇

🚀 Cadastre seu imóvel 100% GRÁTIS e receba propostas reais de compradores interessados!

✨ O que você ganha:
✔ Avaliação profissional do seu imóvel
✔ Divulgação em vários sites e redes sociais
✔ Atendimento rápido e personalizado
✔ Estratégia para vender ou alugar mais rápido

💰 Sem burocracia. Sem complicação. Mais resultado!

👉 Cadastre agora:
${captureUrl}

📲 Clique no link ou fale comigo no WhatsApp!

⚠️ Vagas limitadas para novos imóveis essa semana

#imoveis #venderimovel #aluguel #corretordeimoveis #oportunidade #mercadoimobiliario`;
    setGeneratedAd(text);
  };

  const copyAd = () => {
    navigator.clipboard.writeText(generatedAd);
    toast({ title: "Texto do anúncio copiado!" });
  };

  const filtered = leads.filter(l => statusFilter === "todos" || l.status === statusFilter);

  const counts = {
    todos: leads.length,
    novo: leads.filter(l => l.status === "novo").length,
    em_contato: leads.filter(l => l.status === "em_contato").length,
    captado: leads.filter(l => l.status === "captado").length,
    perdido: leads.filter(l => l.status === "perdido").length,
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h2 className="font-display font-bold text-xl text-foreground">Captação Online</h2>
        <p className="text-sm text-muted-foreground">Capte imóveis automaticamente com seu link exclusivo ou bot interativo</p>
      </div>

      {/* ─── Quick Links Row ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Landing Page Link */}
        <div className="rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/5 to-accent/5 p-3.5 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary/15 flex items-center justify-center flex-shrink-0">
            <Link2 size={16} className="text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Landing Page</p>
            <p className="text-xs font-mono text-foreground truncate">{captureUrl}</p>
          </div>
          <div className="flex gap-1.5 flex-shrink-0">
            <Button size="icon" variant="ghost" className="h-7 w-7 text-foreground hover:text-primary" onClick={() => copyLink(captureUrl, "Link da página")}>
              <Copy size={12} />
            </Button>
            <a href={captureUrl} target="_blank" rel="noopener noreferrer">
              <Button size="icon" variant="ghost" className="h-7 w-7 text-foreground hover:text-primary"><ExternalLink size={12} /></Button>
            </a>
          </div>
        </div>

        {/* Bot Link */}
        <div className="rounded-2xl border border-[#25d366]/20 bg-gradient-to-r from-[#25d366]/5 to-accent/5 p-3.5 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#25d366]/15 flex items-center justify-center flex-shrink-0">
            <MessageCircle size={16} className="text-[#25d366]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Bot WhatsApp</p>
            <p className="text-xs font-mono text-foreground truncate">{chatBotUrl}</p>
          </div>
          <div className="flex gap-1.5 flex-shrink-0">
            <Button size="icon" variant="ghost" className="h-7 w-7 text-foreground hover:text-[#25d366]" onClick={() => copyLink(chatBotUrl, "Link do bot")}>
              <Copy size={12} />
            </Button>
            <a href={chatBotUrl} target="_blank" rel="noopener noreferrer">
              <Button size="icon" variant="ghost" className="h-7 w-7 text-foreground hover:text-[#25d366]"><ExternalLink size={12} /></Button>
            </a>
          </div>
        </div>
      </div>

      {/* ─── Collapsible Sections ─── */}

      {/* Gerador de Texto */}
      <Section icon={Megaphone} title="Gerador de Texto para Anúncio">
        <Button onClick={generateAdText} size="sm" variant="secondary" className="gap-1.5 text-xs border border-border">
          <Sparkles size={12} /> Gerar Texto
        </Button>
        {generatedAd && (
          <div className="space-y-2">
            <Textarea value={generatedAd} onChange={e => setGeneratedAd(e.target.value)} className="min-h-[160px] text-sm" />
            <Button onClick={copyAd} size="sm" className="gap-1.5 text-xs">
              <Copy size={12} /> Copiar Texto
            </Button>
          </div>
        )}
      </Section>

      {/* Configurar Bot */}
      <Section icon={MessageCircle} title="Configurar Bot de Captação" accent>
        <p className="text-xs text-muted-foreground">
          Personalize o chat interativo que coleta informações do imóvel automaticamente.
        </p>

        {/* Chat Mode Toggle */}
        <div>
          <label className="text-xs text-muted-foreground font-semibold">Modo do Chat</label>
          <div className="flex gap-2 mt-1.5">
            <button
              onClick={() => setBotChatMode("flow")}
              className={`flex-1 px-3 py-2.5 rounded-xl text-xs font-semibold border transition-all ${
                botChatMode === "flow"
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card text-muted-foreground border-border hover:border-primary/40"
              }`}
            >
              🔀 Fluxo Fixo
            </button>
            <button
              onClick={() => setBotChatMode("ai")}
              className={`flex-1 px-3 py-2.5 rounded-xl text-xs font-semibold border transition-all ${
                botChatMode === "ai"
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card text-muted-foreground border-border hover:border-primary/40"
              }`}
            >
              🤖 IA Inteligente
            </button>
          </div>
          <p className="text-[10px] text-muted-foreground mt-1">
            {botChatMode === "ai"
              ? "A IA conduz a conversa naturalmente e coleta dados do imóvel de forma inteligente"
              : "O bot segue um roteiro fixo com perguntas pré-definidas"}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-muted-foreground">Nome do atendente</label>
            <Input
              value={botAttendantName}
              onChange={(e) => setBotAttendantName(e.target.value)}
              placeholder="Assistente Imobiliário"
              className="mt-1"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">URL do avatar (opcional)</label>
            <Input
              value={botAttendantAvatar}
              onChange={(e) => setBotAttendantAvatar(e.target.value)}
              placeholder="https://..."
              className="mt-1"
            />
          </div>
        </div>
        {botChatMode === "flow" && (
          <div>
            <label className="text-xs text-muted-foreground">Mensagem de abertura</label>
            <Textarea
              value={botOpeningMessage}
              onChange={(e) => setBotOpeningMessage(e.target.value)}
              placeholder="Olá! 👋 Vou te ajudar a cadastrar seu imóvel..."
              className="mt-1 min-h-[80px] text-sm"
            />
          </div>
        )}
        <Button onClick={saveBotConfig} disabled={savingBot} size="sm" className="gap-1.5 text-xs">
          <Save size={12} /> {savingBot ? "Salvando..." : "Salvar Bot"}
        </Button>
      </Section>

      {/* Vídeo */}
      <Section icon={Video} title="Vídeo da Página de Captação">
        <p className="text-xs text-muted-foreground">
          Cole o link de um vídeo do YouTube para exibir na parte inferior da sua página de captação.
        </p>
        <Input
          value={captureVideoTitle}
          onChange={e => setCaptureVideoTitle(e.target.value)}
          placeholder="Título do vídeo (ex: Conheça nosso trabalho)"
          className="text-sm"
        />
        <div className="flex gap-2">
          <Input
            value={captureVideoUrl}
            onChange={e => setCaptureVideoUrl(e.target.value)}
            placeholder="https://www.youtube.com/watch?v=..."
            className="flex-1 text-sm"
          />
          <Button onClick={saveCaptureVideo} size="sm" disabled={savingVideo} className="gap-1.5 text-xs">
            {savingVideo ? <Loader2 size={12} className="animate-spin" /> : null}
            Salvar
          </Button>
        </div>
        {captureVideoUrl && (
          <div className="aspect-video rounded-xl overflow-hidden border border-border">
            <iframe
              src={captureVideoUrl.replace("watch?v=", "embed/").replace("youtu.be/", "youtube.com/embed/").split("&")[0]}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        )}
      </Section>

      {/* ─── Leads de Captação ─── */}
      <Section icon={LayoutList} title="Leads de Captação" badge={`${leads.length}`} defaultOpen accent>
        {/* Status Filter Chips */}
        <div className="flex flex-wrap gap-2">
          {(Object.entries(counts) as [string, number][]).map(([key, count]) => (
            <button
              key={key}
              onClick={() => setStatusFilter(key)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                statusFilter === key
                  ? "bg-primary text-white"
                  : "bg-secondary text-muted-foreground hover:bg-secondary/80"
              }`}
            >
              {key === "todos" ? "Todos" : STATUS_CONFIG[key]?.label || key} ({count})
            </button>
          ))}
        </div>

        {/* Leads List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={24} className="animate-spin text-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Inbox size={40} className="text-muted-foreground/30 mb-3" />
            <h3 className="text-base font-bold text-foreground mb-1">Nenhum lead ainda</h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              Compartilhe seu link de captação nas redes sociais e comece a receber leads automaticamente.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map(lead => {
              const isExpanded = expandedId === lead.id;
              const cfg = STATUS_CONFIG[lead.status] || { label: lead.status, color: "bg-gray-500" };
              return (
                <div key={lead.id} className="rounded-xl border border-border bg-background overflow-hidden">
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : lead.id)}
                    className="w-full flex items-center gap-3 p-3 text-left hover:bg-secondary/30 transition-colors"
                  >
                    <div className={`w-2 h-2 rounded-full ${cfg.color} flex-shrink-0`} />
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm text-foreground truncate">{lead.full_name}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                        <Home size={10} /> {PROPERTY_TYPE_LABELS[lead.property_type] || lead.property_type}
                        {lead.desired_price && (
                          <> • R$ {lead.desired_price.toLocaleString("pt-BR")}</>
                        )}
                      </p>
                    </div>
                    <Badge variant="secondary" className="text-[10px]">{cfg.label}</Badge>
                    <span className="text-xs text-muted-foreground hidden sm:block">
                      {new Date(lead.created_at).toLocaleDateString("pt-BR")}
                    </span>
                    {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>

                  {isExpanded && (
                    <div className="px-3 pb-3 space-y-3 border-t border-border pt-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                        <div className="flex items-center gap-2">
                          <Phone size={14} className="text-muted-foreground" />
                          <a href={`https://wa.me/${lead.phone.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer"
                            className="text-green-600 font-medium hover:underline">{lead.phone}</a>
                        </div>
                        {lead.address && (
                          <div className="flex items-center gap-2">
                            <MapPin size={14} className="text-muted-foreground" />
                            <span className="text-foreground">{lead.address}</span>
                          </div>
                        )}
                        {lead.desired_price && (
                          <div className="flex items-center gap-2">
                            <DollarSign size={14} className="text-muted-foreground" />
                            <span className="text-foreground">R$ {lead.desired_price.toLocaleString("pt-BR")}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <Clock size={14} className="text-muted-foreground" />
                          <span className="text-foreground">{new Date(lead.created_at).toLocaleString("pt-BR")}</span>
                        </div>
                      </div>

                      {lead.description && (
                        <p className="text-sm text-muted-foreground bg-secondary/50 rounded-xl p-3">{lead.description}</p>
                      )}

                      {lead.photos && lead.photos.length > 0 && (
                        <div className="flex items-center gap-2 flex-wrap">
                          <ImageIcon size={14} className="text-muted-foreground" />
                          {lead.photos.map((url, i) => (
                            <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                              <img src={url} alt="" className="w-16 h-16 rounded-lg object-cover border border-border" />
                            </a>
                          ))}
                        </div>
                      )}

                      <div className="flex items-center gap-2 pt-2">
                        <Select value={lead.status} onValueChange={v => updateStatus(lead.id, v)}>
                          <SelectTrigger className="w-[160px] h-9 text-xs bg-background text-foreground border-border">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-background text-foreground border-border">
                            {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                              <SelectItem key={key} value={key} className="text-foreground">{cfg.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        <a
                          href={`https://wa.me/${lead.phone.replace(/\D/g, "")}?text=Olá ${encodeURIComponent(lead.full_name)}! Recebi o cadastro do seu imóvel e gostaria de conversar sobre ele.`}
                          target="_blank" rel="noopener noreferrer"
                        >
                          <Button size="sm" className="gap-1.5 text-xs bg-green-500 hover:bg-green-600 text-white">
                            <Phone size={12} /> WhatsApp
                          </Button>
                        </a>

                        <Button size="sm" variant="ghost" className="text-destructive hover:bg-destructive/10 ml-auto"
                          onClick={() => deleteLead(lead.id)}>
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Section>
    </div>
  );
}
