import { useState, useEffect, useRef } from "react";
import { Globe, Image, FileText, Save, Upload, Loader2, Type, Shield } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { invalidateSiteSettings } from "@/hooks/useSiteSettings";

const SITE_KEYS = [
  "site_name",
  "site_logo_url",
  "site_favicon_url",
  "site_footer_text",
  "site_terms_html",
  "site_privacy_html",
] as const;

type SiteSettings = Record<(typeof SITE_KEYS)[number], string>;

const DEFAULTS: SiteSettings = {
  site_name: "Capimobi",
  site_logo_url: "",
  site_favicon_url: "",
  site_footer_text: "",
  site_terms_html: "",
  site_privacy_html: "",
};

export default function AdminSiteTab() {
  const { toast } = useToast();
  const [settings, setSettings] = useState<SiteSettings>({ ...DEFAULTS });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const logoRef = useRef<HTMLInputElement>(null);
  const faviconRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("platform_settings")
        .select("key, value")
        .in("key", SITE_KEYS as unknown as string[]);
      if (data) {
        const map = { ...DEFAULTS };
        data.forEach((row) => {
          if (row.key in map) (map as any)[row.key] = row.value;
        });
        setSettings(map);
      }
      setLoading(false);
    })();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      for (const key of SITE_KEYS) {
        await supabase
          .from("platform_settings" as any)
          .upsert({ key, value: settings[key] || "" } as any, { onConflict: "key" });
      }
      invalidateSiteSettings();
      toast({ title: "Configurações salvas!" });
    } catch {
      toast({ title: "Erro ao salvar", variant: "destructive" });
    }
    setSaving(false);
  };

  const handleUpload = async (field: "site_logo_url" | "site_favicon_url", file: File) => {
    setUploading(field);
    const ext = file.name.split(".").pop() || "png";
    const path = `site/${field.replace("site_", "").replace("_url", "")}.${ext}`;
    const { error } = await supabase.storage.from("seller-assets").upload(path, file, { upsert: true });
    if (error) {
      toast({ title: "Erro no upload", description: error.message, variant: "destructive" });
      setUploading(null);
      return;
    }
    const { data: pub } = supabase.storage.from("seller-assets").getPublicUrl(path);
    const url = pub.publicUrl + "?t=" + Date.now();
    setSettings((prev) => ({ ...prev, [field]: url }));
    setUploading(null);
    toast({ title: "Imagem enviada!" });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Site Name */}
      <Section icon={Type} title="Nome do Site" desc="Nome exibido no cabeçalho, título e rodapé.">
        <input
          value={settings.site_name}
          onChange={(e) => setSettings((p) => ({ ...p, site_name: e.target.value }))}
          className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm text-foreground focus:ring-2 focus:ring-ring focus:outline-none"
          placeholder="Nome do site"
        />
      </Section>

      {/* Logo */}
      <Section icon={Image} title="Logo do Site" desc="Imagem exibida no cabeçalho (recomendado: PNG transparente).">
        <div className="flex items-center gap-4">
          {settings.site_logo_url && (
            <img src={settings.site_logo_url} alt="Logo" className="h-12 max-w-[180px] object-contain rounded-lg border border-border bg-secondary p-1" />
          )}
          <input ref={logoRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload("site_logo_url", f); }} />
          <button
            onClick={() => logoRef.current?.click()}
            disabled={uploading === "site_logo_url"}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-secondary text-secondary-foreground text-sm font-medium hover:bg-secondary/80 transition-colors disabled:opacity-50"
          >
            {uploading === "site_logo_url" ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
            Enviar Logo
          </button>
        </div>
        <input
          value={settings.site_logo_url}
          onChange={(e) => setSettings((p) => ({ ...p, site_logo_url: e.target.value }))}
          className="w-full mt-2 rounded-xl border border-input bg-background px-4 py-2 text-xs text-muted-foreground focus:ring-2 focus:ring-ring focus:outline-none"
          placeholder="Ou cole a URL da logo"
        />
      </Section>

      {/* Favicon */}
      <Section icon={Globe} title="Favicon" desc="Ícone exibido na aba do navegador (recomendado: 32x32 ou 64x64 PNG).">
        <div className="flex items-center gap-4">
          {settings.site_favicon_url && (
            <img src={settings.site_favicon_url} alt="Favicon" className="w-10 h-10 object-contain rounded-lg border border-border bg-secondary p-1" />
          )}
          <input ref={faviconRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload("site_favicon_url", f); }} />
          <button
            onClick={() => faviconRef.current?.click()}
            disabled={uploading === "site_favicon_url"}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-secondary text-secondary-foreground text-sm font-medium hover:bg-secondary/80 transition-colors disabled:opacity-50"
          >
            {uploading === "site_favicon_url" ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
            Enviar Favicon
          </button>
        </div>
        <input
          value={settings.site_favicon_url}
          onChange={(e) => setSettings((p) => ({ ...p, site_favicon_url: e.target.value }))}
          className="w-full mt-2 rounded-xl border border-input bg-background px-4 py-2 text-xs text-muted-foreground focus:ring-2 focus:ring-ring focus:outline-none"
          placeholder="Ou cole a URL do favicon"
        />
      </Section>

      {/* Footer */}
      <Section icon={FileText} title="Texto do Rodapé" desc="Texto exibido no rodapé de todas as páginas.">
        <textarea
          value={settings.site_footer_text}
          onChange={(e) => setSettings((p) => ({ ...p, site_footer_text: e.target.value }))}
          rows={3}
          className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm text-foreground focus:ring-2 focus:ring-ring focus:outline-none resize-y"
          placeholder="Ex: © 2026 Capimobi. Todos os direitos reservados."
        />
      </Section>

      {/* Terms */}
      <Section icon={FileText} title="Termos de Uso" desc="Conteúdo HTML da página de Termos de Uso (/termos).">
        <textarea
          value={settings.site_terms_html}
          onChange={(e) => setSettings((p) => ({ ...p, site_terms_html: e.target.value }))}
          rows={8}
          className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm text-foreground font-mono focus:ring-2 focus:ring-ring focus:outline-none resize-y"
          placeholder="Cole aqui o conteúdo HTML dos Termos de Uso..."
        />
      </Section>

      {/* Privacy */}
      <Section icon={Shield} title="Política de Privacidade" desc="Conteúdo HTML da página de Privacidade (/privacidade).">
        <textarea
          value={settings.site_privacy_html}
          onChange={(e) => setSettings((p) => ({ ...p, site_privacy_html: e.target.value }))}
          rows={8}
          className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm text-foreground font-mono focus:ring-2 focus:ring-ring focus:outline-none resize-y"
          placeholder="Cole aqui o conteúdo HTML da Política de Privacidade..."
        />
      </Section>

      {/* Save */}
      <button
        onClick={handleSave}
        disabled={saving}
        className="flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-50 shadow-lg shadow-primary/20"
      >
        {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
        Salvar Configurações
      </button>
    </div>
  );
}

function Section({ icon: Icon, title, desc, children }: { icon: React.ElementType; title: string; desc: string; children: React.ReactNode }) {
  return (
    <div className="bg-card border border-border rounded-2xl p-5">
      <h3 className="font-display font-bold text-lg text-foreground mb-1 flex items-center gap-2">
        <Icon size={20} className="text-primary" /> {title}
      </h3>
      <p className="text-sm text-muted-foreground mb-4">{desc}</p>
      {children}
    </div>
  );
}
