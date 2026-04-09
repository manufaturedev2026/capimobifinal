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
  Filter, Loader2, Inbox, Sparkles, ChevronDown, ChevronUp, Image as ImageIcon, Trash2, Video
} from "lucide-react";

interface CaptacaoOnlineTabProps {
  userId: string;
  sellerId: string;
  sellerSlug: string | null;
  sellerName: string;
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

export default function CaptacaoOnlineTab({ userId, sellerId, sellerSlug, sellerName }: CaptacaoOnlineTabProps) {
  const { toast } = useToast();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("todos");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [generatedAd, setGeneratedAd] = useState("");
  const [captureVideoUrl, setCaptureVideoUrl] = useState("");
  const [captureVideoTitle, setCaptureVideoTitle] = useState("");
  const [savingVideo, setSavingVideo] = useState(false);

  const captureUrl = `${window.location.origin}/captar-imovel/${sellerSlug || sellerId}`;

  useEffect(() => {
    fetchLeads();
    fetchCaptureVideo();
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

  const copyLink = () => {
    navigator.clipboard.writeText(captureUrl);
    toast({ title: "Link copiado!", description: captureUrl });
  };

  const generateAdText = () => {
    const text = `🏠 **${sellerName}** — Corretor de Imóveis

📢 Está pensando em vender ou alugar seu imóvel?

✅ Cadastre GRÁTIS e receba propostas reais!
✅ Avaliação gratuita do seu imóvel
✅ Divulgação profissional em múltiplas plataformas
✅ Atendimento personalizado

👉 Cadastre agora: ${captureUrl}

📞 Fale comigo pelo WhatsApp para mais informações!

#imoveis #venda #aluguel #corretor #oportunidade`;
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display font-bold text-xl text-foreground">Captação Online</h2>
          <p className="text-sm text-muted-foreground">Capte imóveis automaticamente com seu link exclusivo</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={copyLink} variant="outline" className="gap-2 text-sm">
            <Copy size={14} /> Copiar link
          </Button>
          <a href={captureUrl} target="_blank" rel="noopener noreferrer">
            <Button variant="outline" className="gap-2 text-sm">
              <ExternalLink size={14} /> Abrir página
            </Button>
          </a>
        </div>
      </div>

      {/* Link Preview Card */}
      <div className="rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/5 to-accent/5 p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
            <Link2 size={20} className="text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground">Seu link de captação</p>
            <p className="text-sm font-mono text-foreground truncate">{captureUrl}</p>
          </div>
        </div>
      </div>

      {/* Ad Generator */}
      <div className="rounded-2xl border border-border p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-primary" />
            <span className="text-sm font-bold text-foreground">Gerador de Texto para Anúncio</span>
          </div>
          <Button onClick={generateAdText} size="sm" variant="outline" className="gap-1.5 text-xs">
            <Sparkles size={12} /> Gerar Texto
          </Button>
        </div>
        {generatedAd && (
          <div className="space-y-2">
            <Textarea value={generatedAd} onChange={e => setGeneratedAd(e.target.value)} className="min-h-[160px] text-sm" />
            <Button onClick={copyAd} size="sm" className="gap-1.5 text-xs">
              <Copy size={12} /> Copiar Texto
            </Button>
          </div>
        )}
      </div>

      {/* Capture Video */}
      <div className="rounded-2xl border border-border p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Video size={16} className="text-primary" />
          <span className="text-sm font-bold text-foreground">Vídeo da Página de Captação</span>
        </div>
        <p className="text-xs text-muted-foreground">
          Cole o link de um vídeo do YouTube para exibir na parte inferior da sua página de captação.
        </p>
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
      </div>

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
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Inbox size={48} className="text-muted-foreground/30 mb-4" />
          <h3 className="text-lg font-bold text-foreground mb-1">Nenhum lead ainda</h3>
          <p className="text-sm text-muted-foreground max-w-sm">
            Compartilhe seu link de captação nas redes sociais e comece a receber leads automaticamente.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(lead => {
            const isExpanded = expandedId === lead.id;
            const cfg = STATUS_CONFIG[lead.status] || { label: lead.status, color: "bg-gray-500" };
            return (
              <div key={lead.id} className="rounded-2xl border border-border bg-card overflow-hidden">
                <button
                  onClick={() => setExpandedId(isExpanded ? null : lead.id)}
                  className="w-full flex items-center gap-3 p-4 text-left hover:bg-secondary/30 transition-colors"
                >
                  <div className={`w-2.5 h-2.5 rounded-full ${cfg.color} flex-shrink-0`} />
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
                  {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>

                {isExpanded && (
                  <div className="px-4 pb-4 space-y-3 border-t border-border pt-3">
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
                        <SelectTrigger className="w-[160px] h-9 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                            <SelectItem key={key} value={key}>{cfg.label}</SelectItem>
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
    </div>
  );
}
