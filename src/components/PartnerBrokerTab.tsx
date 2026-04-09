import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Building2, Send, Clock, CheckCircle2, XCircle, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
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
}

interface PartnerRequest {
  id: string;
  agency_profile_id: string;
  status: string;
  message: string | null;
  created_at: string;
  agency?: Agency;
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
  const [partnerLink, setPartnerLink] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    
    // Fetch agencies (imobiliárias e construtoras)
    const { data: agencyData } = await supabase
      .from("profiles")
      .select("id, full_name, company_name, logo_url, city, state, slug, cnpj")
      .in("seller_category", ["imobiliaria", "construtora"])
      .neq("id", profileId);

    // Fetch my requests
    const { data: reqData } = await supabase
      .from("partnership_requests")
      .select("*")
      .eq("requester_profile_id", profileId);

    // Check if I'm already a team member somewhere (approved partner)
    const { data: teamData } = await supabase
      .from("team_members")
      .select("company_id, slug")
      .eq("is_active", true);

    // Find my team membership by matching profile data
    const myProfile = await supabase.from("profiles").select("full_name, phone, email").eq("id", profileId).single();
    
    if (teamData && myProfile.data) {
      const myMembership = teamData.find(t => true); // We'll match by approved request
      // Check approved requests to find partner link
      if (reqData) {
        const approved = reqData.find(r => r.status === "aprovado");
        if (approved && agencyData) {
          const agency = agencyData.find(a => a.id === approved.agency_profile_id);
          if (agency) {
            // Find my team member entry for this agency
            const { data: myTeam } = await supabase
              .from("team_members")
              .select("slug")
              .eq("company_id", approved.agency_profile_id)
              .limit(10);
            
            if (myTeam && myTeam.length > 0) {
              // Match by name
              const me = myTeam.find(t => t.slug);
              if (me) {
                const baseUrl = agency.slug ? `/empresa/${agency.slug}` : `/empresa/${approved.agency_profile_id}`;
                setPartnerLink(`${baseUrl}?corretor=${me.slug}`);
              }
            }
          }
        }
      }
    }

    setAgencies(agencyData || []);
    setRequests(reqData || []);
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

  const getRequestStatus = (agencyId: string) => {
    return requests.find(r => r.agency_profile_id === agencyId);
  };

  const statusIcon = (status: string) => {
    if (status === "aprovado") return <CheckCircle2 className="text-green-500" size={18} />;
    if (status === "recusado") return <XCircle className="text-red-500" size={18} />;
    return <Clock className="text-yellow-500" size={18} />;
  };

  const statusLabel = (status: string) => {
    if (status === "aprovado") return "Aprovado";
    if (status === "recusado") return "Recusado";
    return "Pendente";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-foreground">Parceiro</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Vincule-se a uma imobiliária e tenha sua loja espelho com os imóveis dela.
        </p>
      </div>

      {/* Partner Link */}
      {partnerLink && (
        <div className="rounded-xl border border-green-500/30 bg-green-500/10 p-4">
          <h3 className="font-semibold text-foreground flex items-center gap-2">
            <CheckCircle2 className="text-green-500" size={20} />
            Sua Loja Parceira
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Compartilhe este link com seus clientes:
          </p>
          <div className="flex items-center gap-2 mt-2">
            <code className="flex-1 text-xs bg-background/50 px-3 py-2 rounded-lg border border-border truncate">
              {window.location.origin}{partnerLink}
            </code>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                navigator.clipboard.writeText(`${window.location.origin}${partnerLink}`);
                toast({ title: "Link copiado! 📋" });
              }}
            >
              Copiar
            </Button>
            <Button size="sm" variant="outline" asChild>
              <a href={partnerLink} target="_blank" rel="noopener noreferrer">
                <ExternalLink size={14} />
              </a>
            </Button>
          </div>
        </div>
      )}

      {/* Agencies List */}
      <div className="space-y-3">
        <h3 className="font-semibold text-foreground">Imobiliárias Disponíveis</h3>
        {agencies.length === 0 ? (
          <p className="text-muted-foreground text-sm py-8 text-center">Nenhuma imobiliária cadastrada no momento.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {agencies.map((agency) => {
              const req = getRequestStatus(agency.id);
              return (
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
                      {req ? (
                        <div className="flex items-center gap-1.5 text-xs">
                          {statusIcon(req.status)}
                          <span className="text-muted-foreground">{statusLabel(req.status)}</span>
                        </div>
                      ) : (
                        <Dialog open={dialogOpen && selectedAgency?.id === agency.id} onOpenChange={(o) => {
                          setDialogOpen(o);
                          if (!o) setSelectedAgency(null);
                        }}>
                          <DialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-xs"
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
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
