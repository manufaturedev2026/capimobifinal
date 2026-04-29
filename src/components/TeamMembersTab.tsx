import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, Users, Save, X, ExternalLink, Upload, Copy, Search, Phone, Mail, Shield, Instagram, MapPin, Eye, MousePointerClick, BarChart3 } from "lucide-react";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";

type TeamMember = {
  id: string;
  company_id: string;
  full_name: string;
  phone: string | null;
  creci: string | null;
  email: string | null;
  photo_url: string | null;
  bio: string | null;
  instagram: string | null;
  slug: string;
  is_active: boolean;
  created_at: string;
  origin: "manual" | "partnership";
  linked_profile_id: string | null;
};

type Props = {
  profileId: string;
  userId: string;
  maxMembers: number;
};

function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

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

export default function TeamMembersTab({ profileId, userId, maxMembers }: Props) {
  const { toast } = useToast();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);
  const [editingOrigin, setEditingOrigin] = useState<"manual" | "partnership">("manual");
  const [showForm, setShowForm] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [analyticsMap, setAnalyticsMap] = useState<Record<string, { views: number; whatsapp_clicks: number }>>({})
  const [form, setForm] = useState({
    full_name: "",
    phone: "",
    creci: "",
    email: "",
    bio: "",
    photo_url: "",
    instagram: "",
    slug: "",
  });

  const fetchMembers = async () => {
    const { data } = await supabase
      .from("team_members")
      .select("*")
      .eq("company_id", profileId)
      .eq("origin", "manual")
      .order("created_at", { ascending: true });
    if (data) {
      // For partnership-based members, fetch latest photo from their linked profile
      const linkedIds = data
        .filter(m => (m as any).origin === "partnership" && (m as any).linked_profile_id)
        .map(m => (m as any).linked_profile_id as string);
      
      let profilePhotos: Record<string, string> = {};
      if (linkedIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, logo_url")
          .in("id", linkedIds);
        if (profiles) {
          for (const p of profiles) {
            if (p.logo_url) profilePhotos[p.id] = p.logo_url;
          }
        }
      }
      
      const enriched = data.map(m => {
        const member = m as any;
        // Only sync photo for partnership members
        if (member.origin === "partnership" && member.linked_profile_id && profilePhotos[member.linked_profile_id]) {
          return { ...m, photo_url: profilePhotos[member.linked_profile_id] };
        }
        return m;
      });
      setMembers(enriched as TeamMember[]);

      // Fetch analytics for all team members (last 30 days)
      const memberIds = data.map(m => m.id);
      if (memberIds.length > 0) {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const { data: analyticsData } = await supabase
          .from("seller_analytics")
          .select("team_member_id, event_type")
          .eq("seller_id", profileId)
          .in("team_member_id", memberIds)
          .gte("created_at", thirtyDaysAgo.toISOString());

        const map: Record<string, { views: number; whatsapp_clicks: number }> = {};
        if (analyticsData) {
          analyticsData.forEach((row: any) => {
            const tmId = row.team_member_id;
            if (!tmId) return;
            if (!map[tmId]) map[tmId] = { views: 0, whatsapp_clicks: 0 };
            if (row.event_type === "view") map[tmId].views++;
            else if (row.event_type === "whatsapp_click") map[tmId].whatsapp_clicks++;
          });
        }
        setAnalyticsMap(map);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchMembers();
  }, [profileId]);

  const filteredMembers = useMemo(() => {
    if (!searchQuery.trim()) return members;
    const q = searchQuery.toLowerCase().trim();
    return members.filter(m =>
      m.full_name?.toLowerCase().includes(q) ||
      m.creci?.toLowerCase().includes(q) ||
      m.email?.toLowerCase().includes(q) ||
      m.phone?.includes(q)
    );
  }, [members, searchQuery]);

  const resetForm = () => {
    setForm({ full_name: "", phone: "", creci: "", email: "", bio: "", photo_url: "", instagram: "", slug: "" });
    setEditing(null);
    setEditingOrigin("manual");
    setShowForm(false);
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${userId}/team/${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("seller-uploads")
      .upload(path, file, { upsert: true });

    if (uploadError) {
      toast({ title: "Erro ao enviar foto", variant: "destructive" });
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage.from("seller-uploads").getPublicUrl(path);
    setForm((f) => ({ ...f, photo_url: urlData.publicUrl }));
    setUploading(false);
  };

  const handleSave = async () => {
    if (!form.full_name.trim()) {
      toast({ title: "Nome obrigatório", variant: "destructive" });
      return;
    }

    const slug = form.slug.trim() ? slugify(form.slug.trim()) : slugify(form.full_name);

    const { data: existingSlug } = await supabase
      .from("team_members")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();

    if (existingSlug && existingSlug.id !== editing) {
      toast({ title: "Essa URL já está em uso", description: "Escolha outra URL para o corretor.", variant: "destructive" });
      return;
    }

    if (editing) {
      const updateData: any = {
        full_name: form.full_name.trim(),
        phone: form.phone.trim() || null,
        creci: form.creci.trim() || null,
        email: form.email.trim() || null,
        bio: form.bio.trim() || null,
        instagram: form.instagram.trim() || null,
        slug,
        updated_at: new Date().toISOString(),
      };
      // Only update photo for manual members
      if (editingOrigin === "manual") {
        updateData.photo_url = form.photo_url || null;
      }

      const { error } = await supabase
        .from("team_members")
        .update(updateData)
        .eq("id", editing);

      if (error) {
        toast({ title: "Erro ao atualizar", description: error.message, variant: "destructive" });
        return;
      }
      toast({ title: "Corretor atualizado!" });
    } else {
      if (members.length >= maxMembers) {
        toast({ title: `Limite de ${maxMembers} corretores atingido`, variant: "destructive" });
        return;
      }

      const { error } = await supabase.from("team_members").insert({
        company_id: profileId,
        full_name: form.full_name.trim(),
        phone: form.phone.trim() || null,
        creci: form.creci.trim() || null,
        email: form.email.trim() || null,
        bio: form.bio.trim() || null,
        photo_url: form.photo_url || null,
        instagram: form.instagram.trim() || null,
        slug,
      });

      if (error) {
        if (error.message.includes("unique") || error.message.includes("duplicate")) {
          toast({ title: "Essa URL já está em uso por outro corretor", variant: "destructive" });
        } else {
          toast({ title: "Erro ao adicionar", description: error.message, variant: "destructive" });
        }
        return;
      }
      toast({ title: "Corretor adicionado!" });
    }

    resetForm();
    fetchMembers();
  };

  const handleEdit = (m: TeamMember) => {
    setForm({
      full_name: m.full_name,
      phone: m.phone || "",
      creci: m.creci || "",
      email: m.email || "",
      bio: m.bio || "",
      photo_url: m.photo_url || "",
      instagram: (m as any).instagram || "",
      slug: m.slug || "",
    });
    setEditing(m.id);
    setEditingOrigin(m.origin || "manual");
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Remover este corretor?")) return;
    await supabase.from("team_members").delete().eq("id", id);
    toast({ title: "Corretor removido" });
    fetchMembers();
  };

  const handleToggleActive = async (id: string, current: boolean) => {
    await supabase
      .from("team_members")
      .update({ is_active: !current, updated_at: new Date().toISOString() })
      .eq("id", id);
    fetchMembers();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const activeCount = members.filter(m => m.is_active).length;
  const inactiveCount = members.filter(m => !m.is_active).length;
  const teamHelpText = "Aqui você cadastra a equipe da empresa. Cada corretor ativo ganha uma loja espelho com link próprio, usando o tema da imobiliária e os dados profissionais dele.";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="font-display font-bold text-xl text-foreground flex items-center gap-2">
            <Users size={22} className="text-primary" /> Equipe da Empresa
            <HelpBubble text={teamHelpText} />
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            {members.length}/{maxMembers} corretores vinculados.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 text-xs font-medium">
            <span className="px-2.5 py-1 rounded-full bg-green-500/10 text-green-600 border border-green-500/20">
              {activeCount} ativos
            </span>
            {inactiveCount > 0 && (
              <span className="px-2.5 py-1 rounded-full bg-muted text-muted-foreground border border-border">
                {inactiveCount} inativos
              </span>
            )}
          </div>
          {!showForm && members.length < maxMembers && (
            <button
              onClick={() => { resetForm(); setShowForm(true); }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 transition-colors"
            >
              <Plus size={16} /> Adicionar
            </button>
          )}
        </div>
      </div>

      {/* Search Bar */}
      {members.length > 0 && (
        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, CRECI, e-mail ou telefone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-11 rounded-xl bg-secondary/50 border-border"
          />
        </div>
      )}

      {/* Form */}
      {showForm && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-border rounded-2xl p-6 space-y-4"
        >
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-display font-bold text-foreground">
              {editing ? "Editar Corretor" : "Novo Corretor"}
            </h3>
            <button onClick={resetForm} className="p-2 rounded-xl hover:bg-secondary transition-colors">
              <X size={18} />
            </button>
          </div>

          {/* Photo - only for manual members */}
          {editingOrigin === "manual" && (
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-xl bg-secondary flex items-center justify-center overflow-hidden border border-border">
                {form.photo_url ? (
                  <img loading="lazy" decoding="async" src={form.photo_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <Users size={24} className="text-muted-foreground" />
                )}
              </div>
              <label className="cursor-pointer flex items-center gap-2 px-4 py-2 rounded-xl bg-secondary text-secondary-foreground text-sm font-medium hover:bg-secondary/80 transition-colors">
                <Upload size={14} />
                {uploading ? "Enviando..." : "Foto"}
                <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} disabled={uploading} />
              </label>
            </div>
          )}
          {editingOrigin === "partnership" && (
            <p className="text-xs text-muted-foreground bg-blue-500/10 text-blue-500 px-3 py-2 rounded-xl">
              🤝 A foto deste corretor é sincronizada automaticamente com o perfil dele. Apenas ele pode alterá-la.
            </p>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1">Nome Completo *</label>
              <input
                value={form.full_name}
                onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-xl bg-secondary text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="João da Silva"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1">Telefone/WhatsApp</label>
              <input
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-xl bg-secondary text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="(27) 99999-9999"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1">CRECI</label>
              <input
                value={form.creci}
                onChange={(e) => setForm((f) => ({ ...f, creci: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-xl bg-secondary text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="CRECI-ES 12345"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1">E-mail</label>
              <input
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-xl bg-secondary text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="corretor@email.com"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1">Instagram</label>
              <input
                value={form.instagram}
                onChange={(e) => setForm((f) => ({ ...f, instagram: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-xl bg-secondary text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="@corretor"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1">URL personalizada (slug)</label>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground whitespace-nowrap">?corretor=</span>
                <input
                  value={form.slug}
                  onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl bg-secondary text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder={form.full_name ? slugify(form.full_name) : "joao-silva"}
                />
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">Deixe vazio para gerar automaticamente pelo nome</p>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1">Bio</label>
            <textarea
              value={form.bio}
              onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
              rows={2}
              className="w-full px-4 py-2.5 rounded-xl bg-secondary text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
              placeholder="Experiência e especialidades do corretor..."
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 transition-colors"
            >
              <Save size={16} /> {editing ? "Salvar Alterações" : "Adicionar"}
            </button>
            <button onClick={resetForm} className="px-6 py-2.5 rounded-xl bg-secondary text-secondary-foreground font-medium text-sm hover:bg-secondary/80 transition-colors">
              Cancelar
            </button>
          </div>
        </motion.div>
      )}

      {/* Members List */}
      {members.length === 0 && !showForm ? (
        <div className="text-center py-16 bg-card border border-border rounded-2xl">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-secondary/50 flex items-center justify-center">
            <Users size={32} className="opacity-40" />
          </div>
          <h3 className="font-display font-bold text-foreground mb-2">Nenhum corretor vinculado</h3>
          <p className="text-muted-foreground text-sm mb-6">Adicione corretores para criar lojas espelho da sua empresa.</p>
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 transition-colors"
          >
            <Plus size={16} /> Adicionar Primeiro Corretor
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredMembers.map((m) => (
            <motion.div
              key={m.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className={`bg-card border rounded-2xl overflow-hidden ${
                m.is_active ? "border-border" : "border-border opacity-60"
              }`}
            >
              <div className="p-4 sm:p-5">
                <div className="flex flex-col sm:flex-row gap-4">
                  {/* Photo - larger */}
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-secondary flex items-center justify-center overflow-hidden flex-shrink-0 border border-border mx-auto sm:mx-0">
                    {m.photo_url ? (
                      <img loading="lazy" decoding="async" src={m.photo_url} alt={m.full_name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="font-bold text-2xl text-muted-foreground">{m.full_name.charAt(0)}</span>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0 text-center sm:text-left">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                      <h4 className="font-display font-bold text-foreground text-lg leading-tight">{m.full_name}</h4>
                      {m.origin === "partnership" ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-500 bg-blue-500/10 px-2 py-0.5 rounded-full self-center sm:self-auto">
                          🤝 Parceiro
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-muted-foreground bg-secondary px-2 py-0.5 rounded-full self-center sm:self-auto">
                          ✏️ Manual
                        </span>
                      )}
                      {m.is_active ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-green-500 self-center sm:self-auto">
                          <span className="w-2 h-2 rounded-full bg-green-500" /> Ativo
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-destructive/10 text-destructive text-[10px] font-bold self-center sm:self-auto">
                          Inativo
                        </span>
                      )}
                    </div>
                    {m.origin === "partnership" && (
                      <p className="text-[10px] text-blue-400 mt-0.5">Foto sincronizada com o perfil do corretor</p>
                    )}

                    {/* Key details grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 mt-3 text-sm">
                      {m.creci && (
                        <div className="flex items-center gap-2 text-foreground justify-center sm:justify-start">
                          <Shield size={14} className="text-primary shrink-0" />
                          <span className="font-medium">CRECI:</span>
                          <span className="text-muted-foreground">{m.creci}</span>
                        </div>
                      )}
                      {m.email && (
                        <div className="flex items-center gap-2 justify-center sm:justify-start">
                          <Mail size={14} className="text-muted-foreground shrink-0" />
                          <span className="text-muted-foreground truncate">{m.email}</span>
                        </div>
                      )}
                      {m.phone && (
                        <a
                          href={`https://wa.me/55${m.phone.replace(/\D/g, "")}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-green-500 hover:underline justify-center sm:justify-start"
                        >
                          <Phone size={14} className="shrink-0" />
                          <span>{m.phone}</span>
                        </a>
                      )}
                      {(m as any).instagram && (
                        <a
                          href={`https://instagram.com/${((m as any).instagram || "").replace("@", "")}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-pink-500 hover:underline justify-center sm:justify-start"
                        >
                          <Instagram size={14} className="shrink-0" />
                          <span>@{((m as any).instagram || "").replace("@", "")}</span>
                        </a>
                      )}
                    </div>

                    {m.bio && (
                      <p className="text-xs text-muted-foreground mt-2 line-clamp-2 italic">"{m.bio}"</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Analytics Stats */}
              <div className="border-t border-border px-4 sm:px-5 py-2.5 bg-secondary/10">
                <div className="flex items-center gap-4 flex-wrap">
                  <div className="flex items-center gap-1.5 text-sm">
                    <Eye size={14} className="text-primary" />
                    <span className="font-semibold text-foreground">{analyticsMap[m.id]?.views || 0}</span>
                    <span className="text-muted-foreground text-xs">visitas</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-sm">
                    <MousePointerClick size={14} className="text-green-500" />
                    <span className="font-semibold text-foreground">{analyticsMap[m.id]?.whatsapp_clicks || 0}</span>
                    <span className="text-muted-foreground text-xs">cliques WhatsApp</span>
                  </div>
                  {(analyticsMap[m.id]?.views || 0) > 0 && (
                    <div className="flex items-center gap-1.5 text-sm">
                      <BarChart3 size={14} className="text-primary" />
                      <span className="font-semibold text-foreground">
                        {(((analyticsMap[m.id]?.whatsapp_clicks || 0) / (analyticsMap[m.id]?.views || 1)) * 100).toFixed(1)}%
                      </span>
                      <span className="text-muted-foreground text-xs">conversão</span>
                    </div>
                  )}
                  <span className="text-[10px] text-muted-foreground ml-auto">últimos 30 dias</span>
                </div>
              </div>

              {/* Actions footer */}
              <div className="border-t border-border px-4 sm:px-5 py-2.5 bg-secondary/20 flex items-center justify-between">
                <span className="text-[11px] text-muted-foreground">
                  Desde {new Date(m.created_at).toLocaleDateString("pt-BR")}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      const url = `${window.location.origin}/empresa/${profileId}?corretor=${m.slug}`;
                      navigator.clipboard.writeText(url);
                      toast({ title: "Link copiado!" });
                    }}
                    className="p-2 rounded-lg hover:bg-secondary transition-colors text-muted-foreground"
                    title="Copiar link da loja"
                  >
                    <Copy size={15} />
                  </button>
                  <a
                    href={`/empresa/${profileId}?corretor=${m.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-lg hover:bg-secondary transition-colors text-primary"
                    title="Ver loja espelho"
                  >
                    <ExternalLink size={15} />
                  </a>
                  <button onClick={() => handleEdit(m)} className="p-2 rounded-lg hover:bg-secondary transition-colors text-muted-foreground" title="Editar">
                    <Edit size={15} />
                  </button>
                  <button
                    onClick={() => handleToggleActive(m.id, m.is_active)}
                    className="p-2 rounded-lg hover:bg-secondary transition-colors text-muted-foreground"
                    title={m.is_active ? "Desativar" : "Ativar"}
                  >
                    {m.is_active ? (
                      <span className="w-3.5 h-3.5 rounded-full bg-green-500 block" />
                    ) : (
                      <span className="w-3.5 h-3.5 rounded-full bg-muted-foreground/30 block" />
                    )}
                  </button>
                  <button onClick={() => handleDelete(m.id)} className="p-2 rounded-lg hover:bg-destructive/10 transition-colors text-destructive" title="Remover">
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}

          {members.length > 0 && filteredMembers.length === 0 && searchQuery && (
            <div className="text-center py-12 text-muted-foreground">
              <Search size={32} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm">Nenhum resultado para "<strong className="text-foreground">{searchQuery}</strong>"</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
