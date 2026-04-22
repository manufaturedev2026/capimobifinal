import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Save, Upload, User, Instagram, Link as LinkIcon, Lock, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useSellerSubscription } from "@/hooks/useSubscription";
import type { Database } from "@/integrations/supabase/types";
import { BRAZIL_STATES } from "@/data/brazilStates";
import { useCitiesByState } from "@/hooks/useCitiesByState";

type SellerType = Database["public"]["Enums"]["seller_type"];

export default function SellerProfile({ embedded }: { embedded?: boolean }) {
  const { user, profile, refreshProfile, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const sellerTier = useSellerSubscription(profile?.id);
  const isEmpresa = sellerTier === "essencial_empresa" || sellerTier === "premium_empresa";

  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    company_name: "",
    seller_type: "imoveis" as SellerType,
    logo_url: "",
    address: "",
    cep: "",
    city: "",
    state: "",
    show_location: true,
    instagram: "",
    bio: "",
    seller_category: "" as string,
    creci: "",
    cnpj: "",
    slug: "",
    show_floating_whatsapp: false,
    whatsapp_mode: "team" as string,
    open_for_partnerships: true,
  });
  const { cities: ibgeCities, loading: citiesLoading } = useCitiesByState(form.state);
  const [slugError, setSlugError] = useState("");

  useEffect(() => {
    if (!authLoading && !user) navigate("/login");
  }, [user, authLoading]);

  useEffect(() => {
    if (profile) {
      setForm({
        full_name: profile.full_name || "",
        email: profile.email || "",
        phone: profile.phone || "",
        company_name: profile.company_name || "",
        seller_type: profile.seller_type || "imoveis",
        logo_url: profile.logo_url || "",
        address: profile.address || "",
        cep: (profile as any).cep || "",
        city: profile.city || "",
        state: profile.state || "",
        show_location: profile.show_location ?? true,
        instagram: (profile as any).instagram || "",
        bio: (profile as any).bio || "",
        seller_category: (profile as any).seller_category || "",
        creci: (profile as any).creci || "",
        cnpj: (profile as any).cnpj || "",
        slug: (profile as any).slug || "",
        show_floating_whatsapp: (profile as any).show_floating_whatsapp ?? false,
        whatsapp_mode: (profile as any).whatsapp_mode || "team",
        open_for_partnerships: (profile as any).open_for_partnerships ?? true,
      });
    }
  }, [profile]);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0] || !user) return;
    setUploading(true);
    const file = e.target.files[0];
    const ext = file.name.split(".").pop();
    const path = `${user.id}/logo.${ext}`;
    const { error } = await supabase.storage.from("seller-uploads").upload(path, file, { upsert: true });
    if (!error) {
      const { data } = supabase.storage.from("seller-uploads").getPublicUrl(path);
      setForm((f) => ({ ...f, logo_url: data.publicUrl }));
    }
    setUploading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast({ title: "Erro", description: "Você precisa estar logado.", variant: "destructive" });
      return;
    }

    setSaving(true);

    // Validate slug
    const cleanSlug = form.slug.trim().toLowerCase().replace(/[^a-z0-9_-]/g, "");
    if (cleanSlug) {
      const { data: existing } = await supabase
        .from("profiles")
        .select("id")
        .eq("slug", cleanSlug)
        .neq("user_id", user.id)
        .maybeSingle();
      if (existing) {
        setSlugError("Essa URL já está em uso. Escolha outra.");
        setSaving(false);
        return;
      }
    }
    setSlugError("");

    const profileData: any = {
      ...form,
      user_id: user.id,
      full_name: form.full_name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim() || null,
      company_name: form.company_name.trim() || null,
      address: form.address.trim() || null,
      cep: form.cep.trim() || null,
      city: form.city || null,
      instagram: form.instagram.trim() || null,
      bio: form.bio.trim() || null,
      logo_url: form.logo_url.trim() || null,
      slug: cleanSlug || null,
      seller_type: "imoveis",
      state: form.state || null,
    };

    if (!profileData.seller_category) delete profileData.seller_category;
    if (!profileData.creci?.trim()) delete profileData.creci;
    else profileData.creci = profileData.creci.trim();

    if (!profileData.cnpj?.trim()) delete profileData.cnpj;
    else profileData.cnpj = profileData.cnpj.trim();




    const { data: existingProfile, error: lookupError } = await supabase
      .from("profiles")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (lookupError) {
      toast({ title: "Erro ao salvar", description: lookupError.message, variant: "destructive" });
      setSaving(false);
      return;
    }

    const query = existingProfile
      ? supabase.from("profiles").update(profileData).eq("user_id", user.id)
      : supabase.from("profiles").insert(profileData);

    const { error } = await query;

    if (error) {
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
    } else {
      await refreshProfile();
      toast({ title: existingProfile ? "Perfil atualizado!" : "Perfil criado!" });
      navigate("/painel");
    }

    setSaving(false);
  };

  const formContent = (
    <>
      {/* Logo */}
      <div className="bg-card border border-border rounded-2xl p-5 flex flex-col items-center">
        <div className="w-24 h-24 rounded-2xl bg-muted border-2 border-border overflow-hidden mb-4">
          {form.logo_url ? (
            <img src={form.logo_url} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <User size={32} className="text-muted-foreground" />
            </div>
          )}
        </div>
        <label className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/10 text-primary text-sm font-medium cursor-pointer hover:bg-primary/20 transition-colors">
          {uploading ? (
            <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          ) : (
            <Upload size={14} />
          )}
          Alterar Logo
          <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
        </label>
      </div>

      <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
        <h2 className="font-display font-bold text-foreground">Categoria</h2>
        <p className="text-xs text-muted-foreground">Selecione o tipo que melhor descreve você ou sua empresa.</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { value: "imobiliaria", label: "🏢 Imobiliária" },
            { value: "corretor", label: "📋 Corretor(a)" },
            { value: "construtora", label: "🏗️ Construtora" },
          ].map((cat) => (
            <button
              key={cat.value}
              type="button"
              onClick={() => setForm((f) => ({ ...f, seller_category: cat.value }))}
              className={`py-3 rounded-xl border-2 font-bold text-sm transition-all ${
                form.seller_category === cat.value
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:border-primary/50"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {["corretor", "imobiliaria", "construtora"].includes(form.seller_category) && (
          <div className="mt-4">
            <label className="text-sm font-medium text-foreground mb-1 block">Número do CRECI</label>
            <input
              value={form.creci}
              onChange={(e) => setForm((f) => ({ ...f, creci: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl border border-input bg-background text-foreground text-sm focus:ring-2 focus:ring-ring focus:outline-none"
              placeholder="Ex: CRECI 12345-ES"
            />
            <p className="text-xs text-muted-foreground mt-1">O CRECI será exibido no perfil da sua loja.</p>
          </div>
        )}

        {["imobiliaria", "construtora"].includes(form.seller_category) && (
          <div className="mt-4">
            <label className="text-sm font-medium text-foreground mb-1 block">CNPJ</label>
            <input
              value={form.cnpj}
              onChange={(e) => setForm((f) => ({ ...f, cnpj: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl border border-input bg-background text-foreground text-sm focus:ring-2 focus:ring-ring focus:outline-none"
              placeholder="Ex: 12.345.678/0001-99"
            />
            <p className="text-xs text-muted-foreground mt-1">O CNPJ só aparece na loja se preenchido.</p>
          </div>
        )}
      </div>

      <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
        <h2 className="font-display font-bold text-foreground">Informações do Perfil</h2>
        <p className="text-xs text-muted-foreground">
          O nome público/fantasia é o nome que aparece na sua loja. Para corretor, use o nome fantasia profissional; para imobiliária ou construtora, use o nome da empresa.
        </p>
        <input value={form.full_name} onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))} className="w-full px-4 py-3 rounded-xl border border-input bg-background text-foreground text-sm focus:ring-2 focus:ring-ring focus:outline-none" placeholder="Nome completo" />
        <input value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} className="w-full px-4 py-3 rounded-xl border border-input bg-background text-foreground text-sm focus:ring-2 focus:ring-ring focus:outline-none" placeholder="E-mail" />
        <input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} className="w-full px-4 py-3 rounded-xl border border-input bg-background text-foreground text-sm focus:ring-2 focus:ring-ring focus:outline-none" placeholder="Telefone" />
        <input value={form.company_name} onChange={(e) => setForm((f) => ({ ...f, company_name: e.target.value }))} className="w-full px-4 py-3 rounded-xl border border-input bg-background text-foreground text-sm focus:ring-2 focus:ring-ring focus:outline-none" placeholder={
          form.seller_category === "corretor" ? "Nome fantasia do corretor" :
          form.seller_category === "construtora" ? "Nome fantasia da construtora" :
          "Nome fantasia da imobiliária"
        } />
        <p className="text-xs text-muted-foreground -mt-2">Esse campo define o nome exibido no topo da loja, nos cards e nos contatos.</p>
        <div className="relative">
          <Instagram size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input value={form.instagram} onChange={(e) => setForm((f) => ({ ...f, instagram: e.target.value }))} className="w-full pl-10 pr-4 py-3 rounded-xl border border-input bg-background text-foreground text-sm focus:ring-2 focus:ring-ring focus:outline-none" placeholder="Instagram (ex: @sualoja)" />
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
        <h2 className="font-display font-bold text-foreground">URL da Loja</h2>
        <p className="text-xs text-muted-foreground">Escolha um nome curto para a URL da sua loja.</p>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground whitespace-nowrap">{window.location.origin}/empresa/</span>
          <div className="relative flex-1">
            <LinkIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={form.slug}
              onChange={(e) => {
                const val = e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, "");
                setForm((f) => ({ ...f, slug: val }));
                setSlugError("");
              }}
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-input bg-background text-foreground text-sm focus:ring-2 focus:ring-ring focus:outline-none"
              placeholder="ex: Gabrielcorretor"
              maxLength={30}
            />
          </div>
        </div>
        {slugError && <p className="text-xs text-destructive font-medium">{slugError}</p>}
        {form.slug && !slugError && (
          <p className="text-xs text-emerald-500 font-medium">
            Sua loja ficará em: {window.location.origin}/empresa/{form.slug}
          </p>
        )}
      </div>

      <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
        <h2 className="font-display font-bold text-foreground">Sobre a Empresa</h2>
        <p className="text-xs text-muted-foreground">Descreva sua empresa, diferenciais, horário de funcionamento, etc.</p>
        <textarea
          value={form.bio}
          onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
          rows={5}
          maxLength={80}
          className="w-full px-4 py-3 rounded-xl border border-input bg-background text-foreground text-sm focus:ring-2 focus:ring-ring focus:outline-none resize-none"
          placeholder="Ex: Somos uma empresa especializada em imóveis com mais de 10 anos de experiência..."
        />
        <span className="text-xs text-muted-foreground">{form.bio.length}/80</span>
      </div>

      <div className="bg-card border border-border rounded-2xl p-5">
        <h2 className="font-display font-bold text-foreground mb-3">Tipo de vendedor</h2>
        <div className="flex items-center gap-3 py-3 px-4 rounded-xl border-2 border-primary bg-primary/10">
          <span className="text-lg">🏠</span>
          <span className="font-bold text-sm text-primary">Imóveis</span>
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
        <h2 className="font-display font-bold text-foreground">Localização</h2>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Estado</label>
            <select value={form.state} onChange={(e) => setForm((f) => ({ ...f, state: e.target.value, city: "" }))}
              className="px-4 py-3 rounded-xl border border-input bg-background text-foreground text-sm focus:ring-2 focus:ring-ring focus:outline-none">
              <option value="">Selecione o estado</option>
              {BRAZIL_STATES.map((s) => <option key={s.uf} value={s.uf}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Cidade</label>
            <select value={form.city} onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
              className="px-4 py-3 rounded-xl border border-input bg-background text-foreground text-sm focus:ring-2 focus:ring-ring focus:outline-none"
              disabled={!form.state || citiesLoading}>
              <option value="">{citiesLoading ? "Carregando..." : "Selecione a cidade"}</option>
              {ibgeCities.map((city) => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
          </div>
        </div>
        <input value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} className="w-full px-4 py-3 rounded-xl border border-input bg-background text-foreground text-sm focus:ring-2 focus:ring-ring focus:outline-none" placeholder="Endereço completo" />
        <label className="flex items-center gap-3 cursor-pointer select-none">
          <input type="checkbox" checked={form.show_location} onChange={(e) => setForm((f) => ({ ...f, show_location: e.target.checked }))} className="w-5 h-5 rounded border-input text-primary focus:ring-ring accent-primary cursor-pointer" />
          <span className="text-sm text-foreground">
            {form.seller_category === "proprietario" ? "Mostrar localização da propriedade no perfil" : form.seller_category === "corretor" || form.seller_category === "imobiliaria" ? "Mostrar localização do escritório no perfil" : "Mostrar localização no perfil da loja"}
          </span>
        </label>
        <label className="flex items-center gap-3 cursor-pointer select-none">
          <input type="checkbox" checked={form.show_floating_whatsapp} onChange={(e) => setForm((f) => ({ ...f, show_floating_whatsapp: e.target.checked }))} className="w-5 h-5 rounded border-input text-primary focus:ring-ring accent-primary cursor-pointer" />
          <span className="text-sm text-foreground">Mostrar botão flutuante do WhatsApp na loja</span>
        </label>
        {(form.seller_category === "imobiliaria" || form.seller_category === "construtora") && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground">Ao clicar no WhatsApp:</p>
            <label className="flex items-center gap-3 cursor-pointer select-none">
              <input type="radio" name="whatsapp_mode" checked={form.whatsapp_mode === "team"} onChange={() => setForm((f) => ({ ...f, whatsapp_mode: "team" }))} className="w-4 h-4 accent-primary cursor-pointer" />
              <span className="text-sm text-foreground">Mostrar lista de corretores vinculados</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer select-none">
              <input type="radio" name="whatsapp_mode" checked={form.whatsapp_mode === "direct"} onChange={() => setForm((f) => ({ ...f, whatsapp_mode: "direct" }))} className="w-4 h-4 accent-primary cursor-pointer" />
              <span className="text-sm text-foreground">Ir direto para o WhatsApp da empresa</span>
            </label>
          </div>
        )}
        {(form.seller_category === "imobiliaria" || form.seller_category === "construtora") && (
          <label className="flex items-center gap-3 cursor-pointer select-none">
            <input type="checkbox" checked={form.open_for_partnerships} onChange={(e) => setForm((f) => ({ ...f, open_for_partnerships: e.target.checked }))} className="w-5 h-5 rounded border-input text-primary focus:ring-ring accent-primary cursor-pointer" />
            <span className="text-sm text-foreground">Aparecer como disponível para parcerias com corretores</span>
          </label>
        )}
      </div>
    </>
  );

  if (embedded) {
    return (
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display font-bold text-xl text-foreground">Meu Perfil</h2>
            <p className="text-sm text-muted-foreground">Edite suas informações pessoais e da empresa</p>
          </div>
          <button type="submit" disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 transition-all disabled:opacity-50">
            <Save size={16} /> {saving ? "Salvando..." : "Salvar"}
          </button>
        </div>
        {formContent}
        <ChangePasswordSection />
      </form>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="gradient-hero py-6">
        <div className="container max-w-3xl mx-auto px-4 flex items-center gap-3">
          <button onClick={() => navigate("/painel")} className="p-2 rounded-xl bg-white/20 text-white hover:bg-white/30">
            <ArrowLeft size={18} />
          </button>
          <h1 className="font-display font-bold text-xl text-white">Editar Perfil</h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="container max-w-3xl mx-auto px-4 py-6 space-y-6">
        {formContent}
        <button
          disabled={saving}
          className="w-full py-4 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg"
        >
          {saving ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <><Save size={16} /> Salvar Perfil</>
          )}
        </button>
      </form>

      <ChangePasswordSection />
    </div>
  );
}

function ChangePasswordSection() {
  const { toast } = useToast();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword.length < 6) {
      toast({ title: "Senha muito curta", description: "A nova senha deve ter pelo menos 6 caracteres.", variant: "destructive" });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({ title: "Senhas não conferem", description: "A nova senha e a confirmação devem ser iguais.", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      // Verify current password by re-signing in
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) throw new Error("Usuário não encontrado");

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      });

      if (signInError) {
        toast({ title: "Senha atual incorreta", description: "Verifique sua senha atual e tente novamente.", variant: "destructive" });
        setSaving(false);
        return;
      }

      // Update password
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;

      toast({ title: "Senha alterada!", description: "Sua senha foi atualizada com sucesso." });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      toast({ title: "Erro ao trocar senha", description: err.message || "Tente novamente.", variant: "destructive" });
    }
    setSaving(false);
  };

  return (
    <form onSubmit={handleChangePassword} className="mt-8 bg-card border border-border rounded-2xl p-4 space-y-3">
      <div className="flex items-center gap-3 mb-1">
        <div className="w-8 h-8 rounded-lg bg-destructive/10 flex items-center justify-center">
          <Lock size={16} className="text-destructive" />
        </div>
        <div>
          <h3 className="font-display font-bold text-sm text-foreground">Trocar Senha</h3>
          <p className="text-[11px] text-muted-foreground">Altere sua senha de acesso</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <div className="relative">
          <input
            type={showCurrent ? "text" : "password"}
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder="Senha atual"
            required
            className="w-full px-3 py-2.5 pr-10 rounded-xl border border-input bg-background text-foreground text-sm focus:ring-2 focus:ring-ring focus:outline-none"
          />
          <button type="button" onClick={() => setShowCurrent(!showCurrent)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
            {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>

        <div className="relative">
          <input
            type={showNew ? "text" : "password"}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Nova senha (mín. 6)"
            required
            minLength={6}
            className="w-full px-3 py-2.5 pr-10 rounded-xl border border-input bg-background text-foreground text-sm focus:ring-2 focus:ring-ring focus:outline-none"
          />
          <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
            {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>

        <div className="relative">
          <input
            type={showConfirm ? "text" : "password"}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirmar nova senha"
            required
            minLength={6}
            className="w-full px-3 py-2.5 pr-10 rounded-xl border border-input bg-background text-foreground text-sm focus:ring-2 focus:ring-ring focus:outline-none"
          />
          <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
            {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
      </div>

      {newPassword && confirmPassword && newPassword !== confirmPassword && (
        <p className="text-xs text-destructive">As senhas não conferem</p>
      )}

      <button
        type="submit"
        disabled={saving || !currentPassword || !newPassword || !confirmPassword || newPassword !== confirmPassword}
        className="w-full py-2.5 rounded-xl bg-destructive text-destructive-foreground font-bold text-sm hover:bg-destructive/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {saving ? (
          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        ) : (
          <>
            <Lock size={16} /> Alterar Senha
          </>
        )}
      </button>
    </form>
  );
}
