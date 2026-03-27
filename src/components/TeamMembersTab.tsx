import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, Users, Save, X, ExternalLink, Upload, Copy } from "lucide-react";
import { motion } from "framer-motion";

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

export default function TeamMembersTab({ profileId, userId, maxMembers }: Props) {
  const { toast } = useToast();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({
    full_name: "",
    phone: "",
    creci: "",
    email: "",
    bio: "",
    photo_url: "",
    instagram: "",
  });

  const fetchMembers = async () => {
    const { data } = await supabase
      .from("team_members")
      .select("*")
      .eq("company_id", profileId)
      .order("created_at", { ascending: true });
    if (data) setMembers(data as TeamMember[]);
    setLoading(false);
  };

  useEffect(() => {
    fetchMembers();
  }, [profileId]);

  const resetForm = () => {
    setForm({ full_name: "", phone: "", creci: "", email: "", bio: "", photo_url: "", instagram: "" });
    setEditing(null);
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

    const slug = slugify(form.full_name);

    if (editing) {
      const { error } = await supabase
        .from("team_members")
        .update({
          full_name: form.full_name.trim(),
          phone: form.phone.trim() || null,
          creci: form.creci.trim() || null,
          email: form.email.trim() || null,
          bio: form.bio.trim() || null,
          photo_url: form.photo_url || null,
          instagram: form.instagram.trim() || null,
          slug,
          updated_at: new Date().toISOString(),
        })
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
        if (error.message.includes("unique")) {
          toast({ title: "Já existe um corretor com esse nome", variant: "destructive" });
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
    });
    setEditing(m.id);
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display font-bold text-xl text-foreground flex items-center gap-2">
            <Users size={22} className="text-primary" /> Equipe da Empresa
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            {members.length}/{maxMembers} corretores vinculados. Cada corretor terá sua loja espelho.
          </p>
        </div>
        {!showForm && members.length < maxMembers && (
          <button
            onClick={() => { resetForm(); setShowForm(true); }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 transition-colors"
          >
            <Plus size={16} /> Adicionar Corretor
          </button>
        )}
      </div>

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

          {/* Photo */}
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-xl bg-secondary flex items-center justify-center overflow-hidden border border-border">
              {form.photo_url ? (
                <img src={form.photo_url} alt="" className="w-full h-full object-cover" />
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
          <Users size={48} className="mx-auto text-muted-foreground/30 mb-4" />
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
          {members.map((m) => (
            <motion.div
              key={m.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className={`bg-card border rounded-2xl p-4 flex items-center gap-4 ${
                m.is_active ? "border-border" : "border-border opacity-60"
              }`}
            >
              <div className="w-14 h-14 rounded-xl bg-secondary flex items-center justify-center overflow-hidden flex-shrink-0">
                {m.photo_url ? (
                  <img src={m.photo_url} alt={m.full_name} className="w-full h-full object-cover" />
                ) : (
                  <span className="font-bold text-lg text-muted-foreground">{m.full_name.charAt(0)}</span>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="font-display font-bold text-foreground text-sm truncate">{m.full_name}</h4>
                  {!m.is_active && (
                    <span className="px-2 py-0.5 rounded-full bg-destructive/10 text-destructive text-[10px] font-bold">Inativo</span>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
                  {m.creci && <span>{m.creci}</span>}
                  {m.phone && <span>{m.phone}</span>}
                  {m.email && <span className="hidden md:inline">{m.email}</span>}
                </div>
              </div>

              <div className="flex items-center gap-1.5 flex-shrink-0">
                <button
                  onClick={() => {
                    const url = `${window.location.origin}/imoveis/empresa/${profileId}?corretor=${m.slug}`;
                    navigator.clipboard.writeText(url);
                    toast({ title: "Link copiado!" });
                  }}
                  className="p-2 rounded-xl hover:bg-secondary transition-colors text-muted-foreground"
                  title="Copiar link da loja"
                >
                  <Copy size={16} />
                </button>
                <a
                  href={`/imoveis/empresa/${profileId}?corretor=${m.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-xl hover:bg-secondary transition-colors text-primary"
                  title="Ver loja espelho"
                >
                  <ExternalLink size={16} />
                </a>
                <button onClick={() => handleEdit(m)} className="p-2 rounded-xl hover:bg-secondary transition-colors text-muted-foreground" title="Editar">
                  <Edit size={16} />
                </button>
                <button
                  onClick={() => handleToggleActive(m.id, m.is_active)}
                  className="p-2 rounded-xl hover:bg-secondary transition-colors text-muted-foreground"
                  title={m.is_active ? "Desativar" : "Ativar"}
                >
                  {m.is_active ? (
                    <span className="w-4 h-4 rounded-full bg-green-500 block" />
                  ) : (
                    <span className="w-4 h-4 rounded-full bg-muted-foreground/30 block" />
                  )}
                </button>
                <button onClick={() => handleDelete(m.id)} className="p-2 rounded-xl hover:bg-destructive/10 transition-colors text-destructive" title="Remover">
                  <Trash2 size={16} />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
