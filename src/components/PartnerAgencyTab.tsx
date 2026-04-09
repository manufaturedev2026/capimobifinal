import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2, XCircle, Clock, User, Phone, Mail, MessageSquare, ExternalLink, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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
  };
}

export default function PartnerAgencyTab({ profileId, userId }: { profileId: string; userId: string }) {
  const { toast } = useToast();
  const [requests, setRequests] = useState<RequestWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [slugInputs, setSlugInputs] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("partnership_requests")
      .select("*")
      .eq("agency_profile_id", profileId)
      .order("created_at", { ascending: false });

    if (data) {
      // Fetch profiles for each request
      const profileIds = data.map(r => r.requester_profile_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, phone, email, creci, logo_url, city, state")
        .in("id", profileIds);

      const enriched = data.map(r => ({
        ...r,
        profile: profiles?.find(p => p.id === r.requester_profile_id),
      }));

      setRequests(enriched);
    }
    setLoading(false);
  };

  const handleApprove = async (request: RequestWithProfile) => {
    if (!request.profile) return;
    setProcessingId(request.id);

    const slug = slugInputs[request.id] || request.profile.full_name
      .toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    // Check slug uniqueness
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

    // Create team member
    const { error: teamError } = await supabase.from("team_members").insert({
      company_id: profileId,
      full_name: request.profile.full_name,
      phone: request.profile.phone,
      email: request.profile.email,
      creci: request.profile.creci,
      photo_url: request.profile.logo_url,
      slug,
      is_active: true,
    });

    if (teamError) {
      toast({ title: "Erro ao criar corretor", description: teamError.message, variant: "destructive" });
      setProcessingId(null);
      return;
    }

    // Update request status
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

    // Remove team member
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

    // Delete the request entirely
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

  const pending = requests.filter(r => r.status === "pendente");
  const processed = requests.filter(r => r.status !== "pendente");

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-foreground">Solicitações de Parceria</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Corretores que desejam se vincular à sua imobiliária.
        </p>
      </div>

      {/* Pending Requests */}
      {pending.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-semibold text-foreground flex items-center gap-2">
            <Clock className="text-yellow-500" size={18} />
            Pendentes ({pending.length})
          </h3>
          {pending.map((req) => (
            <div key={req.id} className="rounded-xl border border-yellow-500/30 bg-card p-4 space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center overflow-hidden shrink-0">
                  {req.profile?.logo_url ? (
                    <img src={req.profile.logo_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <User className="text-muted-foreground" size={22} />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground">{req.profile?.full_name}</p>
                  {req.profile?.creci && <p className="text-xs text-muted-foreground">CRECI: {req.profile.creci}</p>}
                  {req.profile?.city && (
                    <p className="text-xs text-muted-foreground">{req.profile.city}{req.profile.state ? ` - ${req.profile.state}` : ""}</p>
                  )}
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                    {req.profile?.phone && <span className="flex items-center gap-1"><Phone size={12} />{req.profile.phone}</span>}
                    {req.profile?.email && <span className="flex items-center gap-1"><Mail size={12} />{req.profile.email}</span>}
                  </div>
                </div>
              </div>

              {req.message && (
                <div className="bg-secondary/50 rounded-lg p-3 text-sm text-muted-foreground flex gap-2">
                  <MessageSquare size={16} className="shrink-0 mt-0.5" />
                  {req.message}
                </div>
              )}

              <div className="space-y-2">
                <label className="text-xs text-muted-foreground">Slug da URL do corretor:</label>
                <Input
                  placeholder={req.profile?.full_name
                    ?.toLowerCase()
                    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
                    .replace(/[^a-z0-9]+/g, "-")
                    .replace(/^-+|-+$/g, "") || "slug-do-corretor"}
                  value={slugInputs[req.id] || ""}
                  onChange={(e) => setSlugInputs(prev => ({ ...prev, [req.id]: e.target.value }))}
                  className="text-sm"
                />
              </div>

              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => handleApprove(req)}
                  disabled={processingId === req.id}
                  className="flex-1"
                >
                  <CheckCircle2 size={16} className="mr-1" />
                  {processingId === req.id ? "Processando..." : "Aprovar"}
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleReject(req.id)}
                  disabled={processingId === req.id}
                >
                  <XCircle size={16} className="mr-1" />
                  Recusar
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Processed Requests */}
      {processed.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-semibold text-foreground">Histórico</h3>
          {processed.map((req) => (
            <div key={req.id} className="rounded-xl border border-border bg-card p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center overflow-hidden shrink-0">
                {req.profile?.logo_url ? (
                  <img src={req.profile.logo_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <User className="text-muted-foreground" size={18} />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-foreground text-sm">{req.profile?.full_name}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(req.created_at).toLocaleDateString("pt-BR")}
                </p>
              </div>
              {req.status === "aprovado" ? (
                <span className="flex items-center gap-1 text-xs text-green-500 font-medium">
                  <CheckCircle2 size={14} /> Aprovado
                </span>
              ) : (
                <span className="flex items-center gap-1 text-xs text-red-500 font-medium">
                  <XCircle size={14} /> Recusado
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {requests.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <User size={40} className="mx-auto mb-3 opacity-40" />
          <p className="text-sm">Nenhuma solicitação de parceria recebida ainda.</p>
        </div>
      )}
    </div>
  );
}
