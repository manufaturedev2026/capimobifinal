import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Save, Upload, User, Instagram, Video, Link as LinkIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useSellerSubscription } from "@/hooks/useSubscription";
import type { Database } from "@/integrations/supabase/types";
import { BRAZIL_STATES } from "@/data/brazilStates";
import { useCitiesByState } from "@/hooks/useCitiesByState";
import StoreThemePicker from "@/components/StoreThemePicker";
import { STORE_LAYOUTS, isLayoutAllowed, getMinTierForLayout } from "@/components/store-layouts";
import layoutNetflix from "@/assets/layout-previews/layout-netflix.jpg";
import layoutMinimal from "@/assets/layout-previews/layout-minimal.jpg";
import layoutMagazine from "@/assets/layout-previews/layout-magazine.jpg";
import layoutGallery from "@/assets/layout-previews/layout-gallery.jpg";
import layoutElegant from "@/assets/layout-previews/layout-elegant.jpg";
import layoutShowcase from "@/assets/layout-previews/layout-showcase.jpg";
import layoutMarketplace from "@/assets/layout-previews/layout-marketplace.jpg";

const LAYOUT_PREVIEWS: Record<string, string> = {
  netflix: layoutNetflix,
  minimal: layoutMinimal,
  magazine: layoutMagazine,
  gallery: layoutGallery,
  elegant: layoutElegant,
  showcase: layoutShowcase,
  marketplace: layoutMarketplace,
};

type SellerType = Database["public"]["Enums"]["seller_type"];

export default function SellerProfile() {
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
    city: "",
    state: "",
    show_location: true,
    instagram: "",
    bio: "",
    seller_category: "" as string,
    creci: "",
    cnpj: "",
    cover_color: "",
    video_url: "",
    video_title: "",
    video_description: "",
    slug: "",
    store_theme: "dark",
    store_layout: "netflix",
    store_video_url: "",
    store_video_title: "",
    store_video_description: "",
    store_video_button_text: "",
    store_video_button_url: "",
    show_floating_whatsapp: false,
  });
  const { cities: ibgeCities, loading: citiesLoading } = useCitiesByState(form.state);
  const [slugError, setSlugError] = useState("");

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
        state: profile.state || "",
        show_location: profile.show_location ?? true,
        instagram: (profile as any).instagram || "",
        bio: (profile as any).bio || "",
        seller_category: (profile as any).seller_category || "",
        creci: (profile as any).creci || "",
        cnpj: (profile as any).cnpj || "",
        cover_color: (profile as any).cover_color || "",
        video_url: (profile as any).video_url || "",
        video_title: (profile as any).video_title || "",
        video_description: (profile as any).video_description || "",
        slug: (profile as any).slug || "",
        store_theme: (profile as any).store_theme || "dark",
        store_layout: (profile as any).store_layout || "netflix",
        store_video_url: (profile as any).store_video_url || "",
        store_video_title: (profile as any).store_video_title || "",
        store_video_description: (profile as any).store_video_description || "",
        store_video_button_text: (profile as any).store_video_button_text || "",
        store_video_button_url: (profile as any).store_video_button_url || "",
        show_floating_whatsapp: (profile as any).show_floating_whatsapp ?? false,
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

    if (!profileData.cover_color?.trim()) delete profileData.cover_color;
    else profileData.cover_color = profileData.cover_color.trim();

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

        {/* Cover Color */}
        <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
          <h2 className="font-display font-bold text-foreground">Cor da Capa da Loja</h2>
          <p className="text-xs text-muted-foreground">Escolha a cor de fundo da capa do seu perfil público.</p>
          <div className="flex flex-wrap gap-3">
            {[
              { value: "", label: "Padrão", color: "bg-gradient-to-br from-primary via-primary/80 to-accent" },
              { value: "#000000", label: "Preto", color: "bg-black" },
              { value: "#1a1a2e", label: "Azul Escuro", color: "bg-[#1a1a2e]" },
              { value: "#002F6C", label: "Marinho", color: "bg-[#002F6C]" },
              { value: "#00AEEF", label: "Azul", color: "bg-[#00AEEF]" },
              { value: "#dc2626", label: "Vermelho", color: "bg-[#dc2626]" },
              { value: "#831843", label: "Bordô", color: "bg-[#831843]" },
              { value: "#ec4899", label: "Rosa", color: "bg-[#ec4899]" },
              { value: "#059669", label: "Verde", color: "bg-[#059669]" },
              { value: "#d97706", label: "Dourado", color: "bg-[#d97706]" },
              { value: "#6d28d9", label: "Roxo", color: "bg-[#6d28d9]" },
              { value: "#374151", label: "Cinza", color: "bg-[#374151]" },
            ].map((c) => (
              <button
                key={c.value}
                type="button"
                onClick={() => setForm((f) => ({ ...f, cover_color: c.value }))}
                className={`flex flex-col items-center gap-1.5 group`}
              >
                <div className={`w-10 h-10 rounded-xl ${c.color} border-2 transition-all ${
                  form.cover_color === c.value
                    ? "border-primary ring-2 ring-primary/40 scale-110"
                    : "border-border hover:border-primary/50"
                }`} />
                <span className="text-[10px] text-muted-foreground font-medium">{c.label}</span>
              </button>
            ))}
          </div>
          {form.cover_color && (
            <div className="h-16 rounded-xl overflow-hidden" style={{ backgroundColor: form.cover_color }}>
              <div className="w-full h-full flex items-center justify-center text-white/80 text-xs font-medium">
                Pré-visualização da capa
              </div>
            </div>
          )}
        </div>

        <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
          <h2 className="font-display font-bold text-foreground">Categoria</h2>
          <p className="text-xs text-muted-foreground">Selecione o tipo que melhor descreve você ou sua empresa.</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { value: "imobiliaria", label: "🏢 Imobiliária" },
              { value: "corretor", label: "📋 Corretor(a)" },
              { value: "proprietario", label: "🏠 Proprietário" },
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

          {/* CRECI field — for corretor, imobiliaria, construtora */}
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

          {/* CNPJ field — for imobiliaria, construtora */}
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

        {/* URL da Loja */}
        <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
          <h2 className="font-display font-bold text-foreground">URL da Loja</h2>
          <p className="text-xs text-muted-foreground">Escolha um nome curto para a URL da sua loja. Use apenas letras minúsculas, números, hífens e underscores.</p>
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
                placeholder="ex: gabriel01"
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

        {/* Sobre a empresa */}
        <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
          <h2 className="font-display font-bold text-foreground">Sobre a Empresa</h2>
          <p className="text-xs text-muted-foreground">Descreva sua empresa, diferenciais, horário de funcionamento, etc. Esse texto aparece na sua loja pública.</p>
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

        {/* Video URL — VIP+ plans */}
        {sellerTier && sellerTier !== "basico" && sellerTier !== "start" && (
          <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Video size={18} className="text-primary" />
              <h2 className="font-display font-bold text-foreground">Vídeo da Loja</h2>
            </div>
            <p className="text-xs text-muted-foreground">
              Cole o link de um vídeo do YouTube. O vídeo substituirá o banner principal da sua loja no estilo Netflix.
            </p>
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 text-xs text-amber-700 dark:text-amber-400 space-y-1">
              <p className="font-semibold">📱 Nota sobre iPhones:</p>
              <p>O iOS não permite autoplay de vídeos. No iPhone, o banner exibirá automaticamente as <strong>fotos dos seus anúncios em destaque</strong> como slideshow. Para escolher quais fotos aparecem, marque os anúncios desejados como "Capa do Banner" no painel de anúncios.</p>
            </div>
            <input
              value={form.video_url}
              onChange={(e) => setForm((f) => ({ ...f, video_url: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl border border-input bg-background text-foreground text-sm focus:ring-2 focus:ring-ring focus:outline-none"
              placeholder="https://www.youtube.com/watch?v=..."
            />
            {form.video_url && (
              <>
                <input
                  value={form.video_title}
                  onChange={(e) => setForm((f) => ({ ...f, video_title: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border border-input bg-background text-foreground text-sm focus:ring-2 focus:ring-ring focus:outline-none"
                  placeholder="Título do vídeo (ex: Tour Virtual Completo)"
                  maxLength={60}
                />
                <textarea
                  value={form.video_description}
                  onChange={(e) => setForm((f) => ({ ...f, video_description: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border border-input bg-background text-foreground text-sm focus:ring-2 focus:ring-ring focus:outline-none resize-none"
                  placeholder="Descrição curta do vídeo..."
                  rows={2}
                  maxLength={120}
                />
                <div className="flex items-center gap-2 text-xs text-green-600">
                  <span className="w-2 h-2 rounded-full bg-green-500" />
                  Vídeo ativado — substituirá o banner da loja (em PCs e Android)
                </div>
              </>
            )}
          </div>
        )}

        {/* Store Video Section */}
        <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Video size={18} className="text-primary" />
            <h3 className="font-display font-bold text-foreground">🎬 Vídeo da Loja</h3>
          </div>
          <p className="text-xs text-muted-foreground">
            Adicione um vídeo do YouTube que aparecerá <strong>depois dos seus anúncios</strong> na loja, com um botão personalizável.
          </p>
          <input
            value={form.store_video_url}
            onChange={(e) => setForm((f) => ({ ...f, store_video_url: e.target.value }))}
            className="w-full px-4 py-3 rounded-xl border border-input bg-background text-foreground text-sm focus:ring-2 focus:ring-ring focus:outline-none"
            placeholder="https://www.youtube.com/watch?v=..."
          />
          {form.store_video_url && (
            <>
               <input
                value={form.store_video_title}
                onChange={(e) => setForm((f) => ({ ...f, store_video_title: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl border border-input bg-background text-foreground text-sm focus:ring-2 focus:ring-ring focus:outline-none"
                placeholder="Título do vídeo (ex: Conheça nosso empreendimento)"
                maxLength={80}
              />
              <textarea
                value={form.store_video_description}
                onChange={(e) => setForm((f) => ({ ...f, store_video_description: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl border border-input bg-background text-foreground text-sm focus:ring-2 focus:ring-ring focus:outline-none resize-none"
                placeholder="Descrição do vídeo (opcional — aparece abaixo do player)"
                rows={3}
                maxLength={300}
              />
              <input
                value={form.store_video_button_text}
                onChange={(e) => setForm((f) => ({ ...f, store_video_button_text: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl border border-input bg-background text-foreground text-sm focus:ring-2 focus:ring-ring focus:outline-none"
                placeholder="Texto do botão (ex: Ver Imóvel, Saiba Mais)"
                maxLength={30}
              />
              <input
                value={form.store_video_button_url}
                onChange={(e) => setForm((f) => ({ ...f, store_video_button_url: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl border border-input bg-background text-foreground text-sm focus:ring-2 focus:ring-ring focus:outline-none"
                placeholder="Link do botão (ex: /imoveis/produto/xxx ou https://...)"
              />
              <div className="flex items-center gap-2 text-xs text-green-600">
                <span className="w-2 h-2 rounded-full bg-green-500" />
                Vídeo da loja ativado — aparecerá após os anúncios
              </div>
            </>
          )}
        </div>

        {/* Store Theme Picker */}
        <div className="bg-card border border-border rounded-2xl p-5">
          <StoreThemePicker
            selected={form.store_theme}
            onChange={(themeId) => setForm((f) => ({ ...f, store_theme: themeId }))}
          />
        </div>

        {/* Store Layout Picker */}
        <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
          <h2 className="font-display font-bold text-foreground">Layout da Loja (Mobile)</h2>
          <p className="text-xs text-muted-foreground">Escolha como seus imóveis são exibidos no celular.</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {STORE_LAYOUTS.map((layout) => {
              const isActive = form.store_layout === layout.id;
              return (
                <button
                  key={layout.id}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, store_layout: layout.id }))}
                  className={`rounded-2xl text-left transition-all border-2 overflow-hidden ${
                    isActive
                      ? "border-primary shadow-lg shadow-primary/10 ring-2 ring-primary/30"
                      : "border-border hover:border-primary/30"
                  }`}
                >
                  <div className="relative aspect-[9/16] w-full bg-muted overflow-hidden">
                    <img
                      src={LAYOUT_PREVIEWS[layout.id]}
                      alt={`Preview ${layout.name}`}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                    {isActive && (
                      <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                        <svg className="w-3.5 h-3.5 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <h3 className="font-display font-bold text-sm text-foreground">{layout.preview} {layout.name}</h3>
                    <p className="text-[10px] text-muted-foreground mt-0.5 leading-relaxed">{layout.desc}</p>
                  </div>
                </button>
              );
            })}
          </div>
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
          <label className="flex items-center gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={form.show_floating_whatsapp}
              onChange={(e) => setForm((f) => ({ ...f, show_floating_whatsapp: e.target.checked }))}
              className="w-5 h-5 rounded border-input text-primary focus:ring-ring accent-primary cursor-pointer"
            />
            <span className="text-sm text-foreground">
              Mostrar botão flutuante do WhatsApp na loja
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
