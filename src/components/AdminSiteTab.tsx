import { useState, useEffect, useRef } from "react";
import { Globe, Image, FileText, Save, Upload, Loader2, Type, Shield, Sparkles } from "lucide-react";
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
  "site_splash_image_url",
  "site_splash_enabled",
  "site_splash_bg_color",
] as const;

type SiteSettings = Record<(typeof SITE_KEYS)[number], string>;

const DEFAULT_FOOTER = "Crie seu próprio app de imóveis. Perfeito para corretores, imobiliárias e construtoras.";

const DEFAULT_TERMS = `<section><h2>1. Aceitação dos Termos</h2><p>Ao acessar ou utilizar a plataforma, você concorda com estes Termos de Uso. Caso não concorde, não utilize a plataforma.</p></section>
<section><h2>2. Descrição do Serviço</h2><p>A plataforma conecta vendedores e compradores de imóveis em todo o Brasil. Atuamos como intermediários, fornecendo a plataforma para publicação e busca de anúncios.</p></section>
<section><h2>3. Cadastro e Conta</h2><ul><li>Para anunciar, é necessário criar uma conta com informações verdadeiras</li><li>Você é responsável por manter a segurança de sua conta e senha</li><li>Cada pessoa/empresa pode ter apenas uma conta ativa</li><li>Menores de 18 anos não podem utilizar a plataforma</li></ul></section>
<section><h2>4. Regras de Publicação</h2><ul><li>Os anúncios devem conter informações verídicas e atualizadas</li><li>É proibido anunciar itens ilegais, roubados ou com restrições judiciais</li><li>Fotos devem ser reais e do produto/imóvel anunciado</li><li>Reservamo-nos o direito de remover anúncios que violem estas regras</li></ul></section>
<section><h2>5. Planos e Pagamentos</h2><ul><li>A plataforma oferece planos gratuitos e pagos para anunciantes</li><li>Pagamentos são processados conforme acordado com o gerente de conta</li><li>Não há reembolso após a ativação do plano</li></ul></section>
<section><h2>6. Responsabilidades</h2><p>A plataforma não se responsabiliza por negociações entre compradores e vendedores, veracidade das informações fornecidas, ou problemas decorrentes de transações financeiras entre as partes.</p></section>
<section><h2>7. Legislação Aplicável</h2><p>Estes termos são regidos pelas leis da República Federativa do Brasil, em especial o Código de Defesa do Consumidor, o Marco Civil da Internet e a LGPD.</p></section>`;

const DEFAULT_PRIVACY = `<section><h2>1. Introdução</h2><p>Esta política descreve como coletamos, usamos e protegemos suas informações pessoais quando você utiliza nosso marketplace de imóveis.</p></section>
<section><h2>2. Dados que Coletamos</h2><ul><li>Nome completo e e-mail ao criar uma conta</li><li>Telefone (opcional) para contato via WhatsApp</li><li>Informações de anúncios publicados</li><li>Dados de navegação (cookies, endereço IP)</li><li>Localização aproximada para exibição de anúncios regionais</li></ul></section>
<section><h2>3. Como Usamos seus Dados</h2><ul><li>Fornecer e manter nossos serviços</li><li>Permitir publicação e busca de anúncios</li><li>Enviar notificações sobre sua conta</li><li>Melhorar a experiência do usuário</li></ul></section>
<section><h2>4. Compartilhamento de Dados</h2><p>Não vendemos seus dados pessoais. Podemos compartilhar informações com provedores de infraestrutura, serviços de análise (de forma anonimizada), e autoridades legais quando exigido por lei.</p></section>
<section><h2>5. Seus Direitos (LGPD)</h2><ul><li>Acessar seus dados pessoais</li><li>Corrigir dados incompletos ou desatualizados</li><li>Solicitar a exclusão dos seus dados</li><li>Revogar consentimento a qualquer momento</li><li>Solicitar a portabilidade dos dados</li></ul></section>`;

const DEFAULTS: SiteSettings = {
  site_name: "Capimobi",
  site_logo_url: "",
  site_favicon_url: "",
  site_footer_text: DEFAULT_FOOTER,
  site_terms_html: DEFAULT_TERMS,
  site_privacy_html: DEFAULT_PRIVACY,
  site_splash_image_url: "/pwa-icon-512.png",
  site_splash_enabled: "true",
  site_splash_bg_color: "#FFFFFF",
};

export default function AdminSiteTab() {
  const { toast } = useToast();
  const [settings, setSettings] = useState<SiteSettings>({ ...DEFAULTS });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const logoRef = useRef<HTMLInputElement>(null);
  const faviconRef = useRef<HTMLInputElement>(null);
  const splashRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("platform_settings")
        .select("key, value")
        .in("key", SITE_KEYS as unknown as string[]);
      if (data) {
        const map = { ...DEFAULTS };
        data.forEach((row) => {
          if (row.key in map && row.value) (map as any)[row.key] = row.value;
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

  const handleUpload = async (field: "site_logo_url" | "site_favicon_url" | "site_splash_image_url", file: File) => {
    setUploading(field);
    const ext = file.name.split(".").pop() || "png";
    const path = `site/${field.replace("site_", "").replace("_url", "")}-${Date.now()}.${ext}`;
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

  const splashEnabled = settings.site_splash_enabled !== "false";

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

      {/* Splash Screen */}
      <Section icon={Sparkles} title="Splash Screen (Tela de Carregamento)" desc="Imagem exibida com anéis girando enquanto o site carrega. Se vazio, usa a logo do site ou o texto padrão.">
        <label className="flex items-center gap-3 mb-4 cursor-pointer">
          <input
            type="checkbox"
            checked={splashEnabled}
            onChange={(e) => setSettings((p) => ({ ...p, site_splash_enabled: e.target.checked ? "true" : "false" }))}
            className="w-5 h-5 rounded accent-primary"
          />
          <span className="text-sm font-medium text-foreground">Exibir splash screen ao carregar o site</span>
        </label>

        {splashEnabled && (
          <>
            <div className="flex items-center gap-4">
              {settings.site_splash_image_url && (
                <img src={settings.site_splash_image_url} alt="Splash" className="h-20 w-20 object-contain rounded-full border border-border bg-secondary p-2" />
              )}
              <input
                ref={splashRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload("site_splash_image_url", f); }}
              />
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => splashRef.current?.click()}
                  disabled={uploading === "site_splash_image_url"}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-secondary text-secondary-foreground text-sm font-medium hover:bg-secondary/80 transition-colors disabled:opacity-50"
                >
                  {uploading === "site_splash_image_url" ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                  Enviar Imagem do Splash
                </button>
                {settings.site_splash_image_url && (
                  <button
                    onClick={() => setSettings((p) => ({ ...p, site_splash_image_url: "" }))}
                    className="text-xs text-destructive hover:underline text-left"
                  >
                    Remover imagem (usar padrão)
                  </button>
                )}
              </div>
            </div>
            <input
              value={settings.site_splash_image_url}
              onChange={(e) => setSettings((p) => ({ ...p, site_splash_image_url: e.target.value }))}
              className="w-full mt-2 rounded-xl border border-input bg-background px-4 py-2 text-xs text-muted-foreground focus:ring-2 focus:ring-ring focus:outline-none"
              placeholder="Ou cole a URL da imagem (PNG transparente recomendado)"
            />
            <div className="mt-4 pt-4 border-t border-border">
              <label className="block text-sm font-medium text-foreground mb-2">Cor de fundo do círculo da logo</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={settings.site_splash_bg_color || "#FFFFFF"}
                  onChange={(e) => setSettings((p) => ({ ...p, site_splash_bg_color: e.target.value }))}
                  className="h-10 w-16 rounded-lg border border-border cursor-pointer bg-transparent"
                />
                <input
                  value={settings.site_splash_bg_color || "#FFFFFF"}
                  onChange={(e) => setSettings((p) => ({ ...p, site_splash_bg_color: e.target.value }))}
                  className="flex-1 rounded-xl border border-input bg-background px-4 py-2 text-sm text-foreground font-mono focus:ring-2 focus:ring-ring focus:outline-none"
                  placeholder="#FFFFFF"
                />
                <button
                  onClick={() => setSettings((p) => ({ ...p, site_splash_bg_color: "#FFFFFF" }))}
                  className="text-xs text-muted-foreground hover:underline"
                >
                  Padrão
                </button>
              </div>
            </div>
          </>
        )}
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
