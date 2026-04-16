import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Building2, Send, Clock, CheckCircle2, XCircle, ExternalLink, LogOut, Search, Copy, Eye, Phone, MapPin, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface Agency {
  id: string;
  full_name: string;
  company_name: string | null;
  logo_url: string | null;
  city: string | null;
  state: string | null;
  slug: string | null;
  cnpj: string | null;
  phone: string | null;
  instagram: string | null;
  bio: string | null;
}

interface PartnerRequest {
  id: string;
  agency_profile_id: string;
  status: string;
  message: string | null;
  created_at: string;
  agency?: Agency;
  mirrorLink?: string;
}

export default function PartnerBrokerTab({ profileId, userId }: { profileId: string; userId: string }) {
  const { toast } = useToast();
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [requests, setRequests] = useState<PartnerRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [sendingTo, setSendingTo] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedAgency, setSelectedAgency] = useState<Agency | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<"vinculadas" | "disponiveis">("vinculadas");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);

    // Fetch agencies (imobiliárias e construtoras)
    const { data: agencyData } = await supabase
      .from("profiles")
      .select("id, full_name, company_name, logo_url, city, state, slug, cnpj, phone, instagram, bio")
      .in("seller_category", ["imobiliaria", "construtora"])
      .eq("open_for_partnerships", true)
      .neq("id", profileId);

    // Fetch my requests
    const { data: reqData } = await supabase
      .from("partnership_requests")
      .select("*")
      .eq("requester_profile_id", profileId);

    // For approved requests, find my mirror store links
    const enrichedRequests: PartnerRequest[] = [];

    if (reqData) {
      for (const req of reqData) {
        const agency = agencyData?.find(a => a.id === req.agency_profile_id);
        let mirrorLink: string | undefined;

        if (req.status === "aprovado" && agency) {
          // Find my team member entry at this agency
          const { data: myTeam } = await supabase
            .from("team_members")
            .select("slug")
            .eq("company_id", req.agency_profile_id)
            .eq("linked_profile_id", profileId)
            .maybeSingle();

          if (myTeam?.slug) {
            const base = agency.slug ? `/empresa/${agency.slug}` : `/empresa/${req.agency_profile_id}`;
            mirrorLink = `${base}?corretor=${myTeam.slug}`;
          }
        }

        enrichedRequests.push({
          ...req,
          agency,
          mirrorLink,
        });
      }
    }

    setAgencies(agencyData || []);
    setRequests(enrichedRequests);
    setLoading(false);
  };

  const sendRequest = async () => {
    if (!selectedAgency) return;
    setSendingTo(selectedAgency.id);

    const agencyProfile = await supabase
      .from("profiles")
      .select("user_id")
      .eq("id", selectedAgency.id)
      .single();

    if (!agencyProfile.data) {
      toast({ title: "Erro", description: "Não foi possível encontrar a imobiliária.", variant: "destructive" });
      setSendingTo(null);
      return;
    }

    const { error } = await supabase.from("partnership_requests").insert({
      requester_profile_id: profileId,
      requester_user_id: userId,
      agency_profile_id: selectedAgency.id,
      agency_user_id: agencyProfile.data.user_id,
      message: message || null,
    });

    if (error) {
      if (error.code === "23505") {
        toast({ title: "Já enviado", description: "Você já enviou uma solicitação para esta imobiliária." });
      } else {
        toast({ title: "Erro", description: error.message, variant: "destructive" });
      }
    } else {
      toast({ title: "Solicitação enviada! ✅", description: `Aguarde a aprovação de ${selectedAgency.company_name || selectedAgency.full_name}.` });
      fetchData();
    }

    setSendingTo(null);
    setMessage("");
    setDialogOpen(false);
    setSelectedAgency(null);
  };

  const leavePartnership = async (agencyId: string) => {
    setSendingTo(agencyId);

    // Remove team member entry by linked_profile_id
    const { data: members } = await supabase
      .from("team_members")
      .select("id")
      .eq("company_id", agencyId)
      .eq("linked_profile_id", profileId);

    if (members && members.length > 0) {
      await supabase.from("team_members").delete().eq("id", members[0].id);
    } else {
      // Fallback: match by name
      const { data: myProfile } = await supabase.from("profiles").select("full_name").eq("id", profileId).single();
      if (myProfile) {
        const { data: nameMatch } = await supabase
          .from("team_members")
          .select("id, full_name")
          .eq("company_id", agencyId);
        const me = nameMatch?.find(m => m.full_name === myProfile.full_name);
        if (me) await supabase.from("team_members").delete().eq("id", me.id);
      }
    }

    await supabase.from("partnership_requests").delete().eq("requester_profile_id", profileId).eq("agency_profile_id", agencyId);

    toast({ title: "Parceria encerrada", description: "Você saiu da imobiliária." });
    fetchData();
    setSendingTo(null);
  };

  const getRequestStatus = (agencyId: string) => {
    return requests.find(r => r.agency_profile_id === agencyId);
  };

  // Derived data
  const approvedRequests = requests.filter(r => r.status === "aprovado");
  const pendingRequests = requests.filter(r => r.status === "pendente");

  // Available agencies = those without an approved or pending request
  const requestedAgencyIds = new Set(requests.map(r => r.agency_profile_id));
  const availableAgencies = useMemo(() => {
    let list = agencies.filter(a => !requestedAgencyIds.has(a.id));
    if (searchQuery.trim() && activeSubTab === "disponiveis") {
      const q = searchQuery.toLowerCase();
      list = list.filter(a =>
        (a.company_name || a.full_name).toLowerCase().includes(q) ||
        a.city?.toLowerCase().includes(q) ||
        a.cnpj?.includes(q)
      );
    }
    return list;
  }, [agencies, requestedAgencyIds, searchQuery, activeSubTab]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Building2 size={22} className="text-primary" />
            Imobiliárias
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Vincule-se a uma imobiliária e tenha sua loja espelho com os imóveis dela.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-medium">
          <span className="px-2.5 py-1 rounded-full bg-green-500/10 text-green-600 border border-green-500/20">
            {approvedRequests.length} vinculadas
          </span>
          {pendingRequests.length > 0 && (
            <span className="px-2.5 py-1 rounded-full bg-yellow-500/10 text-yellow-600 border border-yellow-500/20">
              {pendingRequests.length} pendentes
            </span>
          )}
        </div>
      </div>

      {/* Sub-tabs */}
      <div className="flex gap-1 bg-secondary/50 p-1 rounded-xl">
        <button
          onClick={() => { setActiveSubTab("vinculadas"); setSearchQuery(""); }}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
            activeSubTab === "vinculadas"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <CheckCircle2 size={16} />
          Minhas Imobiliárias ({approvedRequests.length})
        </button>
        <button
          onClick={() => { setActiveSubTab("disponiveis"); setSearchQuery(""); }}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
            activeSubTab === "disponiveis"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Building2 size={16} />
          Disponíveis ({availableAgencies.length})
          {pendingRequests.length > 0 && (
            <span className="w-5 h-5 rounded-full bg-yellow-500 text-white text-[10px] font-bold flex items-center justify-center">
              {pendingRequests.length}
            </span>
          )}
        </button>
      </div>

      {/* ═══ Tab: Minhas Imobiliárias Vinculadas ═══ */}
      {activeSubTab === "vinculadas" && (
        <div className="space-y-4">
          {approvedRequests.length > 0 ? (
            approvedRequests.map((req) => {
              const agency = req.agency;
              if (!agency) return null;
              const storeUrl = agency.slug ? `/empresa/${agency.slug}` : `/empresa/${agency.id}`;
              return (
                <div key={req.id} className="rounded-2xl border border-green-500/20 bg-card shadow-sm overflow-hidden">
                  <div className="p-4 sm:p-5 space-y-4">
                    {/* Header */}
                    <div className="flex items-start gap-4">
                      <div className="w-16 h-16 rounded-xl bg-secondary flex items-center justify-center overflow-hidden shrink-0">
                        {agency.logo_url ? (
                          <img src={agency.logo_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <Building2 className="text-muted-foreground" size={28} />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-foreground truncate text-lg">{agency.company_name || agency.full_name}</p>
                          <CheckCircle2 className="text-green-500 shrink-0" size={18} />
                        </div>
                        {agency.city && (
                          <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                            <MapPin size={12} /> {agency.city}{agency.state ? ` - ${agency.state}` : ""}
                          </p>
                        )}
                        {agency.cnpj && (
                          <p className="text-xs text-muted-foreground">CNPJ: {agency.cnpj}</p>
                        )}
                        {agency.bio && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{agency.bio}</p>
                        )}
                      </div>
                    </div>

                    {/* Actions row */}
                    <div className="flex flex-wrap gap-2">
                      {agency.phone && (
                        <Button
                          size="sm"
                          className="h-9 text-xs bg-green-500 hover:bg-green-600 text-white"
                          onClick={() => {
                            const clean = agency.phone!.replace(/\D/g, "");
                            window.open(`https://wa.me/55${clean}?text=${encodeURIComponent(`Olá ${agency.company_name || agency.full_name}, sou corretor parceiro e gostaria de conversar.`)}`, "_blank");
                          }}
                        >
                          <Phone size={14} className="mr-1.5" /> WhatsApp
                        </Button>
                      )}
                      <Button size="sm" variant="outline" className="h-9 text-xs" asChild>
                        <a href={storeUrl} target="_blank" rel="noopener noreferrer">
                          <Globe size={14} className="mr-1.5" /> Ver Loja
                        </a>
                      </Button>
                      {agency.instagram && (
                        <Button size="sm" variant="outline" className="h-9 text-xs" asChild>
                          <a href={`https://instagram.com/${agency.instagram.replace("@", "")}`} target="_blank" rel="noopener noreferrer">
                            @ Instagram
                          </a>
                        </Button>
                      )}
                    </div>

                    {/* Mirror Store Link */}
                    {req.mirrorLink && (
                      <div className="rounded-xl border border-primary/20 bg-primary/5 p-3">
                        <p className="text-xs font-semibold text-foreground mb-1.5 flex items-center gap-1.5">
                          <Eye size={14} className="text-primary" />
                          Sua Loja Espelho
                        </p>
                        <div className="flex items-center gap-2">
                          <code className="flex-1 text-[11px] bg-background/70 px-2.5 py-1.5 rounded-lg border border-border truncate text-foreground">
                            {window.location.origin}{req.mirrorLink}
                          </code>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 px-2 text-xs shrink-0"
                            onClick={() => {
                              navigator.clipboard.writeText(`${window.location.origin}${req.mirrorLink}`);
                              toast({ title: "Link copiado! 📋" });
                            }}
                          >
                            <Copy size={12} className="mr-1" /> Copiar
                          </Button>
                          <Button size="sm" variant="outline" className="h-7 px-2 shrink-0" asChild>
                            <a href={req.mirrorLink} target="_blank" rel="noopener noreferrer">
                              <ExternalLink size={12} />
                            </a>
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Leave button */}
                    <div className="flex justify-end">
                      <Button
                        size="sm"
                        variant="destructive"
                        className="text-xs h-8 px-3"
                        onClick={() => leavePartnership(agency.id)}
                        disabled={sendingTo === agency.id}
                      >
                        <LogOut size={12} className="mr-1" />
                        Sair da Parceria
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-16 text-muted-foreground">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-secondary/50 flex items-center justify-center">
                <Building2 size={32} className="opacity-40" />
              </div>
              <p className="text-sm font-medium">Nenhuma imobiliária vinculada.</p>
              <p className="text-xs mt-1">
                Vá em "Disponíveis" para solicitar parceria com uma imobiliária.
              </p>
              <Button
                size="sm"
                className="mt-4"
                onClick={() => setActiveSubTab("disponiveis")}
              >
                Ver Imobiliárias Disponíveis
              </Button>
            </div>
          )}

          {/* Pending requests shown as info */}
          {pendingRequests.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-semibold text-muted-foreground flex items-center gap-2 text-sm">
                <Clock className="text-yellow-500" size={16} />
                Aguardando Aprovação ({pendingRequests.length})
              </h3>
              {pendingRequests.map((req) => {
                const agency = req.agency;
                if (!agency) return null;
                return (
                  <div key={req.id} className="rounded-xl border border-yellow-500/20 bg-card/50 p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center overflow-hidden shrink-0">
                      {agency.logo_url ? (
                        <img src={agency.logo_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <Building2 className="text-muted-foreground" size={18} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground text-sm truncate">{agency.company_name || agency.full_name}</p>
                      <p className="text-xs text-muted-foreground">
                        Enviado em {new Date(req.created_at).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                    <span className="flex items-center gap-1 text-xs text-yellow-600 font-medium shrink-0">
                      <Clock size={14} /> Pendente
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ═══ Tab: Imobiliárias Disponíveis ═══ */}
      {activeSubTab === "disponiveis" && (
        <div className="space-y-4">
          {/* Search */}
          {agencies.length > 3 && (
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar imobiliária por nome, cidade ou CNPJ..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-11 rounded-xl bg-secondary/50 border-border"
              />
            </div>
          )}

          {availableAgencies.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {availableAgencies.map((agency) => (
                <div key={agency.id} className="rounded-xl border border-border bg-card p-4 flex items-start gap-3">
                  <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center overflow-hidden shrink-0">
                    {agency.logo_url ? (
                      <img src={agency.logo_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <Building2 className="text-muted-foreground" size={22} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground text-sm truncate">{agency.company_name || agency.full_name}</p>
                    {agency.city && (
                      <p className="text-xs text-muted-foreground">{agency.city}{agency.state ? ` - ${agency.state}` : ""}</p>
                    )}
                    {agency.cnpj && <p className="text-xs text-muted-foreground">CNPJ: {agency.cnpj}</p>}

                    <div className="mt-2">
                      <Dialog open={dialogOpen && selectedAgency?.id === agency.id} onOpenChange={(o) => {
                        setDialogOpen(o);
                        if (!o) setSelectedAgency(null);
                      }}>
                        <DialogTrigger asChild>
                          <Button
                            size="sm"
                            className="text-xs bg-primary text-primary-foreground hover:bg-primary/90"
                            onClick={() => setSelectedAgency(agency)}
                          >
                            <Send size={14} className="mr-1" />
                            Solicitar Parceria
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Solicitar Parceria</DialogTitle>
                          </DialogHeader>
                          <p className="text-sm text-muted-foreground">
                            Enviar solicitação para <strong>{agency.company_name || agency.full_name}</strong>
                          </p>
                          <Textarea
                            placeholder="Mensagem opcional (ex: Sou corretor CRECI XXXXX, atuo na região de...)"
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            rows={3}
                          />
                          <Button onClick={sendRequest} disabled={sendingTo === agency.id}>
                            {sendingTo === agency.id ? "Enviando..." : "Enviar Solicitação"}
                          </Button>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 text-muted-foreground">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-secondary/50 flex items-center justify-center">
                <Building2 size={32} className="opacity-40" />
              </div>
              {searchQuery ? (
                <>
                  <p className="text-sm font-medium">Nenhuma imobiliária encontrada.</p>
                  <p className="text-xs mt-1">Tente outro termo de busca.</p>
                </>
              ) : (
                <>
                  <p className="text-sm font-medium">Todas as imobiliárias já foram solicitadas.</p>
                  <p className="text-xs mt-1">Aguarde a aprovação das suas solicitações pendentes.</p>
                </>
              )}
            </div>
          )}

          {/* Rejected requests */}
          {requests.filter(r => r.status === "recusado").length > 0 && (
            <div className="space-y-3 mt-4">
              <h3 className="font-semibold text-muted-foreground flex items-center gap-2 text-sm">
                <XCircle className="text-red-400" size={16} />
                Recusadas
              </h3>
              {requests.filter(r => r.status === "recusado").map((req) => {
                const agency = req.agency;
                if (!agency) return null;
                return (
                  <div key={req.id} className="rounded-xl border border-border bg-card/50 p-4 flex items-center gap-3 opacity-60">
                    <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center overflow-hidden shrink-0">
                      {agency.logo_url ? (
                        <img src={agency.logo_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <Building2 className="text-muted-foreground" size={18} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground text-sm truncate">{agency.company_name || agency.full_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(req.created_at).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                    <span className="flex items-center gap-1 text-xs text-red-500 font-medium shrink-0">
                      <XCircle size={14} /> Recusado
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
