import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Save, Upload, User, Instagram } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Database } from "@/integrations/supabase/types";
import { ES_CITIES } from "@/data/esCities";

type SellerType = Database["public"]["Enums"]["seller_type"];

export default function SellerProfile() {
  const { user, profile, refreshProfile, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    company_name: "",
    seller_type: "imoveis" as SellerType,
    logo_url: "",
    address: "",
    city: "",
    state: "ES",
    show_location: true,
    instagram: "",
    bio: "",
    seller_category: "" as string,
    creci: "",
    cnpj: "",
  });

  useEffect(() => {
    if (!authLoading && !user) navigate("/entrar");
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
        city: profile.city || "",
        state: profile.state || "ES",
        show_location: profile.show_location ?? true,
        instagram: (profile as any).instagram || "",
        bio: (profile as any).bio || "",
        seller_category: (profile as any).seller_category || "",
        creci: (profile as any).creci || "",
        cnpj: (profile as any).cnpj || "",
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

    const profileData: any = {
      ...form,
      user_id: user.id,
      full_name: form.full_name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim() || null,
      company_name: form.company_name.trim() || null,
      address: form.address.trim() || null,
      city: form.city || null,
      instagram: form.instagram.trim() || null,
      bio: form.bio.trim() || null,
      logo_url: form.logo_url.trim() || null,
      seller_type: "imoveis",
      state: "ES",
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

        {/* Categoria do vendedor */}
        <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
          <h2 className="font-display font-bold text-foreground">Categoria</h2>
          <p className="text-xs text-muted-foreground">Selecione o tipo que melhor descreve você ou sua empresa.</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { value: "imobiliaria", label: "🏢 Imobiliária" },
              { value: "corretor", label: "📋 Corretor(a)" },
              { value: "proprietario", label: "🏠 Proprietário" },
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

          {/* CRECI field — only for corretor */}
          {form.seller_category === "corretor" && (
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

          {/* CNPJ field — only for imobiliaria */}
          {form.seller_category === "imobiliaria" && (
            <div className="mt-4">
              <label className="text-sm font-medium text-foreground mb-1 block">CNPJ</label>
              <input
                value={form.cnpj}
                onChange={(e) => setForm((f) => ({ ...f, cnpj: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl border border-input bg-background text-foreground text-sm focus:ring-2 focus:ring-ring focus:outline-none"
                placeholder="Ex: 12.345.678/0001-90"
              />
              <p className="text-xs text-muted-foreground mt-1">O CNPJ será exibido no perfil da sua loja.</p>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
          <h2 className="font-display font-bold text-foreground">Informações Pessoais</h2>
          <input value={form.full_name} onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))} className="w-full px-4 py-3 rounded-xl border border-input bg-background text-foreground text-sm focus:ring-2 focus:ring-ring focus:outline-none" placeholder="Nome completo" />
          <input value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} className="w-full px-4 py-3 rounded-xl border border-input bg-background text-foreground text-sm focus:ring-2 focus:ring-ring focus:outline-none" placeholder="E-mail" />
          <input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} className="w-full px-4 py-3 rounded-xl border border-input bg-background text-foreground text-sm focus:ring-2 focus:ring-ring focus:outline-none" placeholder="Telefone" />
          <input value={form.company_name} onChange={(e) => setForm((f) => ({ ...f, company_name: e.target.value }))} className="w-full px-4 py-3 rounded-xl border border-input bg-background text-foreground text-sm focus:ring-2 focus:ring-ring focus:outline-none" placeholder={
            form.seller_category === "corretor" ? "Nome do Corretor" :
            form.seller_category === "proprietario" ? "Nome do Proprietário" :
            "Nome da Empresa"
          } />
          <div className="relative">
            <Instagram size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input value={form.instagram} onChange={(e) => setForm((f) => ({ ...f, instagram: e.target.value }))} className="w-full pl-10 pr-4 py-3 rounded-xl border border-input bg-background text-foreground text-sm focus:ring-2 focus:ring-ring focus:outline-none" placeholder="Instagram (ex: @sualoja)" />
          </div>
        </div>

        {/* Sobre a empresa */}
        <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
          <h2 className="font-display font-bold text-foreground">Sobre a Empresa</h2>
          <p className="text-xs text-muted-foreground">Descreva sua empresa, diferenciais, horário de funcionamento, etc. Esse texto aparece na sua loja pública.</p>
          <textarea
            value={form.bio}
            onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
            rows={5}
            maxLength={1000}
            className="w-full px-4 py-3 rounded-xl border border-input bg-background text-foreground text-sm focus:ring-2 focus:ring-ring focus:outline-none resize-none"
            placeholder="Ex: Somos uma empresa especializada em imóveis com mais de 10 anos de experiência..."
          />
          <span className="text-xs text-muted-foreground">{form.bio.length}/1000</span>
        </div>
        <div className="bg-card border border-border rounded-2xl p-5">
          <h2 className="font-display font-bold text-foreground mb-3">Tipo de vendedor</h2>
          <div className="flex items-center gap-3 py-3 px-4 rounded-xl border-2 border-primary bg-primary/10">
            <span className="text-lg">🏠</span>
            <span className="font-bold text-sm text-primary">Imóveis</span>
          </div>
        </div>

        {/* Location */}
        <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
          <h2 className="font-display font-bold text-foreground">Localização</h2>
          <div className="grid grid-cols-2 gap-3">
            <select value={form.city} onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))} className="px-4 py-3 rounded-xl border border-input bg-background text-foreground text-sm focus:ring-2 focus:ring-ring focus:outline-none">
              <option value="">Selecione a cidade</option>
              {ES_CITIES.map((city) => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
            <input value={form.state} disabled className="px-4 py-3 rounded-xl border border-input bg-muted text-muted-foreground text-sm" placeholder="Estado" />
          </div>
          <input value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} className="w-full px-4 py-3 rounded-xl border border-input bg-background text-foreground text-sm focus:ring-2 focus:ring-ring focus:outline-none" placeholder="Endereço completo" />
          <label className="flex items-center gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={form.show_location}
              onChange={(e) => setForm((f) => ({ ...f, show_location: e.target.checked }))}
              className="w-5 h-5 rounded border-input text-primary focus:ring-ring accent-primary cursor-pointer"
            />
            <span className="text-sm text-foreground">
              {form.seller_category === "proprietario"
                ? "Mostrar localização da propriedade no perfil"
                : form.seller_category === "corretor" || form.seller_category === "imobiliaria"
                ? "Mostrar localização do escritório no perfil"
                : "Mostrar localização no perfil da loja"}
            </span>
          </label>
        </div>
          <button
          disabled={saving}
          className="w-full py-4 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg"
        >
          {saving ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <Save size={16} /> Salvar Perfil
            </>
          )}
        </button>
      </form>
    </div>
  );
}
