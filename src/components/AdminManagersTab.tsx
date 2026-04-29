import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { UserCog, Plus, Trash2, Pencil, Phone, Camera, Check, X, Power } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface Manager {
  id: string;
  name: string;
  phone: string | null;
  photo_url: string | null;
  email: string | null;
  is_active: boolean;
}

export default function AdminManagersTab() {
  const { toast } = useToast();
  const [managers, setManagers] = useState<Manager[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Manager | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const fetch = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("account_managers")
      .select("*")
      .order("created_at", { ascending: false });
    setManagers((data as Manager[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetch(); }, []);

  const openNew = () => {
    setEditing(null);
    setName(""); setPhone(""); setEmail(""); setPhotoUrl("");
    setDialogOpen(true);
  };

  const openEdit = (m: Manager) => {
    setEditing(m);
    setName(m.name);
    setPhone(m.phone || "");
    setEmail(m.email || "");
    setPhotoUrl(m.photo_url || "");
    setDialogOpen(true);
  };

  const handlePhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `managers/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("seller-assets").upload(path, file, { upsert: true });
    if (error) {
      toast({ title: "Erro no upload", description: error.message, variant: "destructive" });
    } else {
      const { data } = supabase.storage.from("seller-assets").getPublicUrl(path);
      setPhotoUrl(data.publicUrl);
    }
    setUploading(false);
  };

  const save = async () => {
    if (!name.trim()) {
      toast({ title: "Nome obrigatório", variant: "destructive" });
      return;
    }
    setSaving(true);
    const payload = {
      name: name.trim(),
      phone: phone.trim() || null,
      email: email.trim() || null,
      photo_url: photoUrl || null,
    };
    const { error } = editing
      ? await supabase.from("account_managers").update(payload).eq("id", editing.id)
      : await supabase.from("account_managers").insert(payload);
    setSaving(false);
    if (error) {
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
    } else {
      toast({ title: editing ? "Gerente atualizado!" : "Gerente cadastrado!" });
      setDialogOpen(false);
      fetch();
    }
  };

  const toggleActive = async (m: Manager) => {
    const { error } = await supabase
      .from("account_managers")
      .update({ is_active: !m.is_active })
      .eq("id", m.id);
    if (!error) {
      toast({ title: m.is_active ? "Gerente desativado" : "Gerente ativado" });
      fetch();
    }
  };

  const remove = async (m: Manager) => {
    if (!confirm(`Excluir gerente ${m.name}?`)) return;
    const { error } = await supabase.from("account_managers").delete().eq("id", m.id);
    if (error) {
      toast({ title: "Erro ao excluir", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Gerente excluído" });
      fetch();
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display font-bold text-xl text-foreground">Gerentes de Conta</h2>
          <p className="text-sm text-muted-foreground">Cadastre os gerentes e atribua-os aos clientes na aba Clientes.</p>
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-semibold hover:opacity-90"
        >
          <Plus size={16} /> Novo gerente
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Carregando...</div>
      ) : managers.length === 0 ? (
        <div className="text-center py-12 bg-card border border-border rounded-2xl">
          <UserCog className="mx-auto mb-3 text-muted-foreground" size={40} />
          <p className="text-muted-foreground">Nenhum gerente cadastrado ainda.</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {managers.map((m) => (
            <div
              key={m.id}
              className={`bg-card border border-border rounded-2xl p-4 flex items-center gap-4 ${!m.is_active ? "opacity-60" : ""}`}
            >
              {m.photo_url ? (
                <img loading="lazy" decoding="async" src={m.photo_url} alt={m.name} className="w-14 h-14 rounded-full object-cover" />
              ) : (
                <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center">
                  <UserCog size={24} className="text-muted-foreground" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-foreground">{m.name}</h3>
                  {!m.is_active && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-muted text-muted-foreground">
                      INATIVO
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground truncate">
                  {m.phone || "—"} {m.email && `• ${m.email}`}
                </p>
              </div>
              <div className="flex gap-1.5">
                {m.phone && (
                  <a
                    href={`https://wa.me/55${m.phone.replace(/\D/g, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-green-500/10 text-green-600 text-xs font-semibold hover:bg-green-500/20"
                  >
                    <Phone size={12} />
                  </a>
                )}
                <button
                  onClick={() => toggleActive(m)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-secondary text-foreground text-xs font-semibold hover:opacity-80"
                  title={m.is_active ? "Desativar" : "Ativar"}
                >
                  <Power size={12} />
                </button>
                <button
                  onClick={() => openEdit(m)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-semibold hover:bg-primary/20"
                >
                  <Pencil size={12} />
                </button>
                <button
                  onClick={() => remove(m)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-destructive/10 text-destructive text-xs font-semibold hover:bg-destructive/20"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar gerente" : "Novo gerente"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="flex justify-center">
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="relative w-24 h-24 rounded-full bg-muted overflow-hidden border-2 border-dashed border-border hover:border-primary transition"
              >
                {photoUrl ? (
                  <img loading="lazy" decoding="async" src={photoUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <Camera className="m-auto text-muted-foreground" size={28} />
                )}
                {uploading && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white text-xs">
                    Enviando...
                  </div>
                )}
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePhoto}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Nome *</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full mt-1 px-3 py-2 rounded-lg border border-input bg-background text-foreground"
                placeholder="Nome do gerente"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Telefone (WhatsApp)</label>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full mt-1 px-3 py-2 rounded-lg border border-input bg-background text-foreground"
                placeholder="(27) 99999-9999"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">E-mail</label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full mt-1 px-3 py-2 rounded-lg border border-input bg-background text-foreground"
                placeholder="gerente@capimobi.com.br"
              />
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <button
                onClick={() => setDialogOpen(false)}
                className="px-4 py-2 rounded-lg border border-input bg-background text-sm font-medium hover:bg-secondary"
              >
                Cancelar
              </button>
              <button
                onClick={save}
                disabled={saving}
                className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 disabled:opacity-50"
              >
                {saving ? "Salvando..." : "Salvar"}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
