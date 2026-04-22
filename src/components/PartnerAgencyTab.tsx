import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2, XCircle, Clock, User, Phone, Mail, MessageSquare, Trash2, Search, MapPin, Instagram, FileText, Shield, Building2, ExternalLink, Eye, MousePointerClick, BarChart3, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import TeamMembersTab from "@/components/TeamMembersTab";

interface RequestWithProfile {
  id: string;
  requester_profile_id: string;
  status: string;
  message: string | null;
  created_at: string;
  profile?: {
    full_name: string;
    phone: string | null;
    email: string;
    creci: string | null;
    logo_url: string | null;
    city: string | null;
    state: string | null;
    address: string | null;
    bio: string | null;
    instagram: string | null;
    cnpj: string | null;
    seller_category: string | null;
    company_name: string | null;
  };
  teamMember?: {
    id: string;
    slug: string;
  };
  analytics?: {
    views: number;
    whatsapp_clicks: number;
  };
}

const categoryLabels: Record<string, string> = {
  corretor: "Corretor",
  imobiliaria: "Imobiliária",
  proprietario: "Proprietário",
  autonomo: "Autônomo",
  construtora: "Construtora",
};

const tabHelp = {
  "loja-espelho": "Cadastre e edite os corretores da sua empresa. Cada corretor ganha uma loja espelho com URL própria, usando o tema da imobiliária e os dados dele.",
  vinculados: "Veja os corretores parceiros já aprovados, acompanhe acessos, cliques no WhatsApp e copie o link da loja espelho vinculada.",
  solicitacoes: "Analise os pedidos de vínculo enviados por corretores e aprove ou recuse quem poderá representar sua imobiliária.",
};

function HelpBubble({ text }: { text: string }) {
  return (
    <span
      title={text}
      aria-label={text}
      className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-border bg-muted text-[11px] font-bold text-muted-foreground"
    >
      ?
    </span>
  );
}

export default function PartnerAgencyTab({ profileId, userId, maxMembers }: { profileId: string; userId: string; maxMembers: number }) {
  const { toast } = useToast();
  const [requests, setRequests] = useState<RequestWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [slugInputs, setSlugInputs] = useState<Record<string, string>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSubTab, setActiveSubTab] = useState<"loja-espelho" | "vinculados" | "solicitacoes">("loja-espelho");

  const [companySlug, setCompanySlug] = useState<string | null>(null);

  useEffect(() => {
    fetchRequests();
    fetchCompanySlug();
  }, []);

  const fetchCompanySlug = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("slug")
      .eq("id", profileId)
      .maybeSingle();
    if (data?.slug) setCompanySlug(data.slug);
  };

  const fetchRequests = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("partnership_requests")
      .select("*")
      .eq("agency_profile_id", profileId)
      .order("created_at", { ascending: false });

    if (data) {
      const profileIds = data.map(r => r.requester_profile_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, phone, email, creci, logo_url, city, state, address, bio, instagram, cnpj, seller_category, company_name")
        .in("id", profileIds);

      // Fetch ALL team members for this company (to handle legacy records without linked_profile_id)
      const { data: teamMembers } = await supabase
        .from("team_members")
        .select("id, slug, linked_profile_id, full_name")
        .eq("company_id", profileId);

      // Fetch analytics for team members (last 30 days)
      const teamMemberIds = teamMembers?.map(tm => tm.id) || [];
      let analyticsMap: Record<string, { views: number; whatsapp_clicks: number }> = {};

      if (teamMemberIds.length > 0) {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const { data: analyticsData } = await supabase
          .from("seller_analytics")
          .select("team_member_id, event_type")
          .eq("seller_id", profileId)
          .in("team_member_id", teamMemberIds)
          .gte("created_at", thirtyDaysAgo.toISOString());

        if (analyticsData) {
          analyticsData.forEach((row: any) => {
            const tmId = row.team_member_id;
            if (!tmId) return;
            if (!analyticsMap[tmId]) analyticsMap[tmId] = { views: 0, whatsapp_clicks: 0 };
            if (row.event_type === "view") analyticsMap[tmId].views++;
            else if (row.event_type === "whatsapp_click") analyticsMap[tmId].whatsapp_clicks++;
          });
        }
      }

      const enriched = data.map(r => {
        const profile = profiles?.find(p => p.id === r.requester_profile_id);
        // Match by linked_profile_id first, then fallback to name match
        const tm = teamMembers?.find(t => t.linked_profile_id === r.requester_profile_id)
          || teamMembers?.find(t => profile && t.full_name === profile.full_name);
        return {
          ...r,
          profile,
          teamMember: tm ? { id: tm.id, slug: tm.slug } : undefined,
          analytics: tm ? (analyticsMap[tm.id] || { views: 0, whatsapp_clicks: 0 }) : undefined,
        };
      });

      setRequests(enriched);
    }
    setLoading(false);
  };

  const filteredRequests = useMemo(() => {
    if (!searchQuery.trim()) return requests;
    const q = searchQuery.toLowerCase().trim();
    return requests.filter(r => {
      const p = r.profile;
      if (!p) return false;
      return (
        p.full_name?.toLowerCase().includes(q) ||
        p.email?.toLowerCase().includes(q) ||
        p.creci?.toLowerCase().includes(q) ||
        p.cnpj?.toLowerCase().includes(q) ||
        p.phone?.includes(q) ||
        p.company_name?.toLowerCase().includes(q)
      );
    });
  }, [requests, searchQuery]);

  const handleApprove = async (request: RequestWithProfile) => {
    if (!request.profile) return;
    setProcessingId(request.id);

    const slug = slugInputs[request.id] || request.profile.full_name
      .toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    const { data: existing } = await supabase
      .from("team_members")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();

    if (existing) {
      toast({ title: "Slug já existe", description: "Escolha outro slug para este corretor.", variant: "destructive" });
      setProcessingId(null);
      return;
    }

    const { error: teamError } = await supabase.from("team_members").insert({
      company_id: profileId,
      full_name: request.profile.full_name,
      phone: request.profile.phone,
      email: request.profile.email,
      creci: request.profile.creci,
      photo_url: request.profile.logo_url,
      slug,
      is_active: true,
      origin: "partnership",
      linked_profile_id: request.requester_profile_id,
    } as any);

    if (teamError) {
      toast({ title: "Erro ao criar corretor", description: teamError.message, variant: "destructive" });
      setProcessingId(null);
      return;
    }

    const { error: updateError } = await supabase
      .from("partnership_requests")
      .update({ status: "aprovado" })
      .eq("id", request.id);

    if (updateError) {
      toast({ title: "Erro", description: updateError.message, variant: "destructive" });
    } else {
      toast({ title: "Parceria aprovada! ✅", description: `${request.profile.full_name} agora é seu corretor vinculado.` });
      fetchRequests();
    }

    setProcessingId(null);
  };

  const handleReject = async (requestId: string) => {
    setProcessingId(requestId);
    const { error } = await supabase
      .from("partnership_requests")
      .update({ status: "recusado" })
      .eq("id", requestId);

    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Solicitação recusada" });
      fetchRequests();
    }
    setProcessingId(null);
  };

  const removePartner = async (request: RequestWithProfile) => {
    if (!request.profile) return;
    setProcessingId(request.id);

    const { data: members } = await supabase
      .from("team_members")
      .select("id, full_name")
      .eq("company_id", profileId);

    if (members) {
      const match = members.find(m => m.full_name === request.profile?.full_name);
      if (match) {
        await supabase.from("team_members").delete().eq("id", match.id);
      }
    }

    await supabase.from("partnership_requests").delete().eq("id", request.id);

    toast({ title: "Corretor removido", description: `${request.profile.full_name} foi desvinculado.` });
    fetchRequests();
    setProcessingId(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
      </div>
    );
  }

  const pending = filteredRequests.filter(r => r.status === "pendente");
  const approved = filteredRequests.filter(r => r.status === "aprovado");
  const rejected = filteredRequests.filter(r => r.status === "recusado");

  const pendingCount = requests.filter(r => r.status === "pendente").length;
  const approvedCount = requests.filter(r => r.status === "aprovado").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Building2 size={22} className="text-primary" />
            Corretores Parceiros
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Gerencie os corretores vinculados via convite à sua imobiliária.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-medium">
          <span className="px-2.5 py-1 rounded-full bg-green-500/10 text-green-600 border border-green-500/20">
            {approvedCount} vinculados
          </span>
          {pendingCount > 0 && (
            <span className="px-2.5 py-1 rounded-full bg-yellow-500/10 text-yellow-600 border border-yellow-500/20">
              {pendingCount} pendentes
            </span>
          )}
        </div>
      </div>

      {/* Sub-tabs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-1 bg-secondary/50 p-1 rounded-xl">
        <button
          onClick={() => { setActiveSubTab("loja-espelho"); setSearchQuery(""); }}
          className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
            activeSubTab === "loja-espelho"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Users size={16} />
          Loja espelho
          <HelpBubble text={tabHelp["loja-espelho"]} />
        </button>
        <button
          onClick={() => { setActiveSubTab("vinculados"); setSearchQuery(""); }}
          className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
            activeSubTab === "vinculados"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <CheckCircle2 size={16} />
          Vinculados ({approvedCount})
          <HelpBubble text={tabHelp.vinculados} />
        </button>
        <button
          onClick={() => { setActiveSubTab("solicitacoes"); setSearchQuery(""); }}
          className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
            activeSubTab === "solicitacoes"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Clock size={16} />
          Solicitações
          <HelpBubble text={tabHelp.solicitacoes} />
          {pendingCount > 0 && (
            <span className="w-5 h-5 rounded-full bg-yellow-500 text-white text-[10px] font-bold flex items-center justify-center">
              {pendingCount}
            </span>
          )}
        </button>
      </div>

      <div className="flex items-start gap-2 rounded-xl border border-border bg-card p-3 text-sm text-muted-foreground">
        <HelpBubble text={tabHelp[activeSubTab]} />
        <p>{tabHelp[activeSubTab]}</p>
      </div>

      {/* Search Bar */}
      {activeSubTab !== "loja-espelho" && requests.length > 0 && (
        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, CRECI, CPF/CNPJ, e-mail ou telefone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-11 rounded-xl bg-secondary/50 border-border"
          />
        </div>
      )}

      {activeSubTab === "loja-espelho" && (
        <TeamMembersTab profileId={profileId} userId={userId} maxMembers={maxMembers} />
      )}

      {/* ─── Sub-tab: Vinculados ─── */}
      {activeSubTab === "vinculados" && (
        <div className="space-y-4">
          {approved.length > 0 ? (
            approved.map((req) => (
              <PartnerCard
                key={req.id}
                request={req}
                variant="approved"
                slugInputs={slugInputs}
                setSlugInputs={setSlugInputs}
                processingId={processingId}
                onApprove={handleApprove}
                onReject={handleReject}
                onRemove={removePartner}
                companySlug={companySlug}
              />
            ))
          ) : (
            <div className="text-center py-16 text-muted-foreground">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-secondary/50 flex items-center justify-center">
                <CheckCircle2 size={32} className="opacity-40" />
              </div>
              <p className="text-sm font-medium">Nenhum corretor parceiro vinculado ainda.</p>
              <p className="text-xs mt-1">Quando aprovar uma solicitação, o corretor aparecerá aqui.</p>
            </div>
          )}
        </div>
      )}

      {/* ─── Sub-tab: Solicitações ─── */}
      {activeSubTab === "solicitacoes" && (
        <div className="space-y-6">
          {/* Pending */}
          {pending.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <Clock className="text-yellow-500" size={18} />
                Pendentes ({pending.length})
              </h3>
              {pending.map((req) => (
                <PartnerCard
                  key={req.id}
                  request={req}
                  variant="pending"
                  slugInputs={slugInputs}
                  setSlugInputs={setSlugInputs}
                  processingId={processingId}
                  onApprove={handleApprove}
                  onReject={handleReject}
                  onRemove={removePartner}
                />
              ))}
            </div>
          )}

          {/* Rejected */}
          {rejected.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-semibold text-muted-foreground flex items-center gap-2">
                <XCircle className="text-red-400" size={18} />
                Recusados ({rejected.length})
              </h3>
              {rejected.map((req) => (
                <div key={req.id} className="rounded-xl border border-border bg-card/50 p-4 flex items-center gap-3 opacity-60">
                  <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center overflow-hidden shrink-0">
                    {req.profile?.logo_url ? (
                      <img src={req.profile.logo_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <User className="text-muted-foreground" size={18} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground text-sm truncate">{req.profile?.full_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(req.created_at).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                  <span className="flex items-center gap-1 text-xs text-red-500 font-medium shrink-0">
                    <XCircle size={14} /> Recusado
                  </span>
                </div>
              ))}
            </div>
          )}

          {pending.length === 0 && rejected.length === 0 && (
            <div className="text-center py-16 text-muted-foreground">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-secondary/50 flex items-center justify-center">
                <Clock size={32} className="opacity-40" />
              </div>
              <p className="text-sm font-medium">Nenhuma solicitação de parceria.</p>
              <p className="text-xs mt-1">Quando um corretor solicitar vínculo, aparecerá aqui.</p>
            </div>
          )}
        </div>
      )}

      {/* Search no results */}
      {activeSubTab !== "loja-espelho" && requests.length > 0 && filteredRequests.length === 0 && searchQuery && (
        <div className="text-center py-12 text-muted-foreground">
          <Search size={32} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">Nenhum resultado para "<strong className="text-foreground">{searchQuery}</strong>"</p>
        </div>
      )}
    </div>
  );
}

/* ─── Partner Card Component ─── */

function PartnerCard({
  request,
  variant,
  slugInputs,
  setSlugInputs,
  processingId,
  onApprove,
  onReject,
  onRemove,
  companySlug,
}: {
  request: RequestWithProfile;
  variant: "pending" | "approved";
  slugInputs: Record<string, string>;
  setSlugInputs: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  processingId: string | null;
  onApprove: (r: RequestWithProfile) => void;
  onReject: (id: string) => void;
  onRemove: (r: RequestWithProfile) => void;
  companySlug?: string | null;
}) {
  const p = request.profile;
  const isPending = variant === "pending";

  const borderColor = isPending
    ? "border-yellow-500/30 shadow-yellow-500/5"
    : "border-green-500/20 shadow-green-500/5";

  return (
    <div className={`rounded-2xl border bg-card shadow-sm ${borderColor} overflow-hidden`}>
      {/* Top section with photo and main info */}
      <div className="p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Photo - larger */}
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-secondary flex items-center justify-center overflow-hidden shrink-0 border border-border mx-auto sm:mx-0">
            {p?.logo_url ? (
              <img src={p.logo_url} alt={p.full_name} className="w-full h-full object-cover" />
            ) : (
              <User className="text-muted-foreground" size={36} />
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0 text-center sm:text-left">
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
              <h4 className="font-bold text-foreground text-lg leading-tight">{p?.full_name}</h4>
              {p?.seller_category && (
                <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary/10 text-primary self-center sm:self-auto">
                  {categoryLabels[p.seller_category] || p.seller_category}
                </span>
              )}
              {!isPending && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-green-500 self-center sm:self-auto">
                  <CheckCircle2 size={12} /> Vinculado
                </span>
              )}
            </div>

            {p?.company_name && (
              <p className="text-sm text-muted-foreground mt-0.5">{p.company_name}</p>
            )}

            {/* Key details grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 mt-3 text-sm">
              {p?.creci && (
                <div className="flex items-center gap-2 text-foreground justify-center sm:justify-start">
                  <Shield size={14} className="text-primary shrink-0" />
                  <span className="font-medium">CRECI:</span>
                  <span className="text-muted-foreground">{p.creci}</span>
                </div>
              )}
              {p?.cnpj && (
                <div className="flex items-center gap-2 text-foreground justify-center sm:justify-start">
                  <FileText size={14} className="text-primary shrink-0" />
                  <span className="font-medium">CPF/CNPJ:</span>
                  <span className="text-muted-foreground">{p.cnpj}</span>
                </div>
              )}
              {p?.email && (
                <div className="flex items-center gap-2 justify-center sm:justify-start">
                  <Mail size={14} className="text-muted-foreground shrink-0" />
                  <span className="text-muted-foreground truncate">{p.email}</span>
                </div>
              )}
              {p?.phone && (
                <a
                  href={`https://wa.me/55${p.phone.replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-green-500 hover:underline justify-center sm:justify-start"
                >
                  <Phone size={14} className="shrink-0" />
                  <span>{p.phone}</span>
                </a>
              )}
              {(p?.city || p?.state) && (
                <div className="flex items-center gap-2 justify-center sm:justify-start">
                  <MapPin size={14} className="text-muted-foreground shrink-0" />
                  <span className="text-muted-foreground">
                    {p.city}{p.state ? ` - ${p.state}` : ""}
                  </span>
                </div>
              )}
              {p?.instagram && (
                <a
                  href={`https://instagram.com/${p.instagram.replace("@", "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-pink-500 hover:underline justify-center sm:justify-start"
                >
                  <Instagram size={14} className="shrink-0" />
                  <span>@{p.instagram.replace("@", "")}</span>
                </a>
              )}
            </div>

            {p?.address && (
              <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1 justify-center sm:justify-start">
                <MapPin size={12} className="shrink-0" /> {p.address}
              </p>
            )}

            {p?.bio && (
              <p className="text-xs text-muted-foreground mt-2 line-clamp-2 italic">"{p.bio}"</p>
            )}
          </div>
        </div>

        {/* Request date */}
        <p className="text-[11px] text-muted-foreground mt-3 text-center sm:text-left">
          Solicitado em {new Date(request.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}
        </p>
      </div>

      {/* Message */}
      {request.message && (
        <div className="mx-4 sm:mx-5 mb-4 bg-secondary/50 rounded-xl p-3 text-sm text-muted-foreground flex gap-2">
          <MessageSquare size={16} className="shrink-0 mt-0.5 text-primary/60" />
          <span>{request.message}</span>
        </div>
      )}

      {/* Actions */}
      {isPending && (
        <div className="border-t border-border px-4 sm:px-5 py-3 bg-secondary/20 space-y-3">
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground font-medium">Slug da URL do corretor:</label>
            <Input
              placeholder={p?.full_name
                ?.toLowerCase()
                .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
                .replace(/[^a-z0-9]+/g, "-")
                .replace(/^-+|-+$/g, "") || "slug-do-corretor"}
              value={slugInputs[request.id] || ""}
              onChange={(e) => setSlugInputs(prev => ({ ...prev, [request.id]: e.target.value }))}
              className="text-sm h-9 rounded-lg"
            />
          </div>

          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={() => onApprove(request)}
              disabled={processingId === request.id}
              className="flex-1 h-9"
            >
              <CheckCircle2 size={16} className="mr-1.5" />
              {processingId === request.id ? "Processando..." : "Aprovar Parceria"}
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => onReject(request.id)}
              disabled={processingId === request.id}
              className="h-9"
            >
              <XCircle size={16} className="mr-1.5" />
              Recusar
            </Button>
          </div>
        </div>
      )}

      {!isPending && (
        <div className="border-t border-border px-4 sm:px-5 py-3 bg-secondary/20 space-y-3">
          {/* Analytics Stats */}
          {request.analytics && (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5 text-sm">
                <Eye size={14} className="text-primary" />
                <span className="font-semibold text-foreground">{request.analytics.views}</span>
                <span className="text-muted-foreground text-xs">visitas</span>
              </div>
              <div className="flex items-center gap-1.5 text-sm">
                <MousePointerClick size={14} className="text-green-500" />
                <span className="font-semibold text-foreground">{request.analytics.whatsapp_clicks}</span>
                <span className="text-muted-foreground text-xs">cliques WhatsApp</span>
              </div>
              {request.analytics.views > 0 && (
                <div className="flex items-center gap-1.5 text-sm">
                  <BarChart3 size={14} className="text-primary" />
                  <span className="font-semibold text-foreground">
                    {((request.analytics.whatsapp_clicks / request.analytics.views) * 100).toFixed(1)}%
                  </span>
                  <span className="text-muted-foreground text-xs">conversão</span>
                </div>
              )}
              <span className="text-[10px] text-muted-foreground ml-auto">últimos 30 dias</span>
            </div>
          )}

          {/* Actions row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Parceiro desde {new Date(request.created_at).toLocaleDateString("pt-BR")}</span>
            </div>
            <div className="flex items-center gap-2">
              {companySlug && request.teamMember?.slug && (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 px-3 text-xs bg-primary/10 text-primary border-primary/30 hover:bg-primary/20"
                  asChild
                >
                  <a
                    href={`/empresa/${companySlug}?corretor=${request.teamMember.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink size={12} className="mr-1" />
                    Ver Loja Espelho
                  </a>
                </Button>
              )}
              <Button
                size="sm"
                variant="destructive"
                className="h-7 px-3 text-xs"
                onClick={() => onRemove(request)}
                disabled={processingId === request.id}
              >
                <Trash2 size={12} className="mr-1" />
                Encerrar Parceria
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
