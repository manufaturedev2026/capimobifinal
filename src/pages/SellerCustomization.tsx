import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Save, Video, Palette } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useSellerSubscription } from "@/hooks/useSubscription";
import StoreThemePicker from "@/components/StoreThemePicker";
import { STORE_LAYOUTS, isLayoutAllowed, getMinTierForLayout } from "@/components/store-layouts";
import layoutNetflix from "@/assets/layout-previews/layout-netflix.jpg";
import layoutMinimal from "@/assets/layout-previews/layout-minimal.jpg";
import layoutMagazine from "@/assets/layout-previews/layout-magazine.jpg";
import layoutGallery from "@/assets/layout-previews/layout-gallery.jpg";
import layoutElegant from "@/assets/layout-previews/layout-elegant.jpg";
import layoutMarketplace from "@/assets/layout-previews/layout-marketplace.jpg";

const LAYOUT_PREVIEWS: Record<string, string> = {
  netflix: layoutNetflix,
  minimal: layoutMinimal,
  magazine: layoutMagazine,
  gallery: layoutGallery,
  elegant: layoutElegant,
  marketplace: layoutMarketplace,
};

export default function SellerCustomization({ embedded }: { embedded?: boolean }) {
  const { user, profile, refreshProfile, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const sellerTier = useSellerSubscription(profile?.id);

  const [form, setForm] = useState({
    cover_color: "",
    store_theme: "dark",
    store_layout: "marketplace",
    professional_title: "",
    video_url: "",
    video_title: "",
    video_description: "",
    store_video_url: "",
    store_video_title: "",
    store_video_description: "",
    store_video_button_text: "",
    store_video_button_url: "",
    store_video_property_label: "",
  });

  useEffect(() => {
    if (!authLoading && !user) navigate("/login");
  }, [user, authLoading]);

  useEffect(() => {
    if (profile) {
      setForm({
        cover_color: (profile as any).cover_color || "",
        store_theme: (profile as any).store_theme || "dark",
        store_layout: (profile as any).store_layout || "marketplace",
        professional_title: (profile as any).professional_title || "",
        video_url: (profile as any).video_url || "",
        video_title: (profile as any).video_title || "",
        video_description: (profile as any).video_description || "",
        store_video_url: (profile as any).store_video_url || "",
        store_video_title: (profile as any).store_video_title || "",
        store_video_description: (profile as any).store_video_description || "",
        store_video_button_text: (profile as any).store_video_button_text || "",
        store_video_button_url: (profile as any).store_video_button_url || "",
        store_video_property_label: (profile as any).store_video_property_label || "",
      });
    }
  }, [profile]);

  // Auto-save layout/theme instantly when changed
  const autoSaveField = async (field: string, value: string) => {
    if (!user) return;
    const { error } = await supabase
      .from("profiles")
      .update({ [field]: value } as any)
      .eq("user_id", user.id);
    if (!error) {
      await refreshProfile();
      toast({ title: "Salvo automaticamente!" });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);

    const updateData: any = { ...form };
    if (!updateData.cover_color?.trim()) updateData.cover_color = null;

    const { error } = await supabase
      .from("profiles")
      .update(updateData)
      .eq("user_id", user.id);

    if (error) {
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
    } else {
      await refreshProfile();
      toast({ title: "Personalização salva!" });
    }
    setSaving(false);
  };
  const renderFormContent = () => (
    <>
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
                className="flex flex-col items-center gap-1.5 group"
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

        {/* Store Theme Picker */}
        <div className="bg-card border border-border rounded-2xl p-5">
          <StoreThemePicker
            selected={form.store_theme}
            tier={sellerTier}
            onLocked={() => toast({ title: "Tema exclusivo a partir do plano Start", description: "Faça upgrade para desbloquear todos os temas.", variant: "destructive" })}
            onChange={(themeId) => { setForm((f) => ({ ...f, store_theme: themeId })); autoSaveField("store_theme", themeId); }}
          />
        </div>

        {/* Store Layout Picker */}
        <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
          <h2 className="font-display font-bold text-foreground">Layout da Loja (Mobile)</h2>
          <p className="text-xs text-muted-foreground">Escolha como seus imóveis são exibidos no celular.</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {STORE_LAYOUTS.map((layout) => {
              const isActive = form.store_layout === layout.id;
              const allowed = isLayoutAllowed(layout.id, sellerTier);
              const minTier = getMinTierForLayout(layout.id);
              return (
                <button
                  key={layout.id}
                  type="button"
                  onClick={() => {
                    if (allowed) {
                      setForm((f) => ({ ...f, store_layout: layout.id }));
                      autoSaveField("store_layout", layout.id);
                    } else {
                      toast({ title: `Layout exclusivo do plano ${minTier}`, description: "Faça upgrade para desbloquear este layout.", variant: "destructive" });
                    }
                  }}
                  className={`rounded-2xl text-left transition-all border-2 overflow-hidden relative ${
                    !allowed
                      ? "border-border opacity-60 grayscale"
                      : isActive
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
                    {isActive && allowed && (
                      <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                        <svg className="w-3.5 h-3.5 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                    {!allowed && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                        <span className="text-white text-xs font-bold bg-black/60 px-3 py-1.5 rounded-full">🔒 {minTier}</span>
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

        {/* Video URL — VIP+ plans */}
        {sellerTier && sellerTier !== "basico" && sellerTier !== "start" && (
          <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Video size={18} className="text-primary" />
              <h2 className="font-display font-bold text-foreground">Vídeo do Banner</h2>
            </div>
            <p className="text-xs text-muted-foreground">
              Cole o link de um vídeo do YouTube. O vídeo substituirá o banner principal da sua loja no estilo Netflix.
            </p>
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 text-xs text-amber-700 dark:text-amber-400 space-y-1">
              <p className="font-semibold">📱 Nota sobre iPhones:</p>
              <p>O iOS não permite autoplay de vídeos. No iPhone, o banner exibirá automaticamente as <strong>fotos dos seus anúncios em destaque</strong> como slideshow.</p>
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
              <input
                value={form.store_video_property_label}
                onChange={(e) => setForm((f) => ({ ...f, store_video_property_label: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl border border-input bg-background text-foreground text-sm focus:ring-2 focus:ring-ring focus:outline-none"
                placeholder="Nome do imóvel do vídeo (ex: Residencial Vista Mar) — usado no CRM para rastrear leads"
                maxLength={100}
              />
              <div className="flex items-center gap-2 text-xs text-green-600">
                <span className="w-2 h-2 rounded-full bg-green-500" />
                Vídeo da loja ativado — aparecerá após os anúncios
              </div>
              <p className="text-[11px] text-muted-foreground">
                💡 O botão "Agendar uma Visita" aparecerá automaticamente no vídeo. Leads serão registrados no CRM como agendamento, vinculados ao imóvel informado acima.
              </p>
            </>
          )}
        </div>
    </>
  );

  if (embedded) {
    return (
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display font-bold text-xl text-foreground">Personalização</h2>
            <p className="text-sm text-muted-foreground">Customize cores, temas, layout e vídeos da sua loja</p>
          </div>
          <button type="submit" disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 transition-all disabled:opacity-50">
            <Save size={16} /> {saving ? "Salvando..." : "Salvar"}
          </button>
        </div>
        {renderFormContent()}
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
          <Palette size={20} className="text-white" />
          <h1 className="font-display font-bold text-xl text-white">Personalização</h1>
        </div>
      </div>
      <form onSubmit={handleSubmit} className="container max-w-3xl mx-auto px-4 py-6 space-y-6">
        {renderFormContent()}
        <button type="submit" disabled={saving}
          className="w-full py-4 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg">
          {saving ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Save size={16} /> Salvar Personalização</>}
        </button>
      </form>
    </div>
  );
}
