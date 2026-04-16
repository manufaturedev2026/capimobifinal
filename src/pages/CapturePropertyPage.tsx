import { useState, useEffect, useMemo } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Home, Phone, User, MapPin, DollarSign, FileText, CheckCircle2, Loader2, Building2, Shield, Zap, TrendingUp, Instagram, Mail, Award, MapPinned } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { getStoreTheme } from "@/components/StoreThemePicker";
import ThemeParticles from "@/components/ThemeParticles";

const PROPERTY_TYPES = [
  { value: "casa", label: "🏠 Casa" },
  { value: "apartamento", label: "🏢 Apartamento" },
  { value: "terreno", label: "🌳 Terreno" },
  { value: "comercial", label: "🏪 Comercial" },
  { value: "galpao", label: "🏭 Galpão" },
  { value: "flat", label: "🏨 Flat" },
  { value: "outros", label: "📦 Outros" },
];

const BENEFITS = [
  { icon: Zap, text: "Resposta em até 24h" },
  { icon: TrendingUp, text: "Avaliação gratuita" },
  { icon: Shield, text: "100% seguro e gratuito" },
];

/** Determines if a hex color is dark */
function isDarkColor(hex: string): boolean {
  const c = hex.replace("#", "");
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 < 128;
}

/** Lighten or darken a hex color */
function adjustColor(hex: string, amount: number): string {
  const c = hex.replace("#", "");
  const r = Math.min(255, Math.max(0, parseInt(c.substring(0, 2), 16) + amount));
  const g = Math.min(255, Math.max(0, parseInt(c.substring(2, 4), 16) + amount));
  const b = Math.min(255, Math.max(0, parseInt(c.substring(4, 6), 16) + amount));
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

export default function CapturePropertyPage() {
  const { slug } = useParams<{ slug: string }>();
  const { toast } = useToast();
  const [broker, setBroker] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [form, setForm] = useState({
    full_name: "",
    phone: "",
    property_type: "casa",
    address: "",
    desired_price: "",
    description: "",
  });

  useEffect(() => {
    if (!slug) return;
    supabase
      .from("profiles")
      .select("id, user_id, full_name, company_name, logo_url, phone, slug, seller_category, creci, instagram, bio, city, state, email, store_theme, capture_video_url, capture_video_title")
      .eq("slug", slug)
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        setBroker(data);
        setLoading(false);
      });
  }, [slug]);

  const theme = useMemo(() => getStoreTheme(broker?.store_theme), [broker?.store_theme]);
  const dark = useMemo(() => isDarkColor(theme.bg), [theme]);

  // Derived colors from theme
  const colors = useMemo(() => {
    const primary = theme.primary;
    const bg = theme.bg;
    const card = theme.card;
    const text = dark ? "#ffffff" : theme.text;
    const textMuted = theme.textMuted;
    const border = theme.border;
    const primaryDarker = adjustColor(primary, -30);
    const primaryLighter = adjustColor(primary, 60);
    const glowBg = dark ? bg : adjustColor(bg, -10);
    const btnTextColor = theme.preview.btnText;

    return { primary, primaryDarker, primaryLighter, bg, card, text, textMuted, border, glowBg, btnTextColor };
  }, [theme, dark]);

  

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broker || !form.full_name.trim() || !form.phone.trim()) return;
    setSubmitting(true);

    try {
      const price = form.desired_price ? parseFloat(form.desired_price.replace(/\D/g, "")) : null;

      await supabase.from("property_capture_leads" as any).insert({
        seller_id: broker.id,
        seller_user_id: broker.user_id,
        full_name: form.full_name.trim().slice(0, 100),
        phone: form.phone.trim().slice(0, 20),
        property_type: form.property_type,
        address: form.address.trim().slice(0, 200),
        desired_price: price,
        photos: [],
        description: form.description.trim().slice(0, 1000),
        status: "novo",
      });

      // Push notification to broker about the new capture lead
      supabase.functions.invoke("notify-new-lead", {
        body: {
          target_user_id: broker.user_id,
          title: "Novo lead de captação 🏠",
          body: `${form.full_name.trim()} quer vender um imóvel.`,
          url: "/painel?tab=captacao",
        },
      }).catch(() => {});

      setSubmitted(true);
    } catch {
      toast({ title: "Erro ao enviar", description: "Tente novamente.", variant: "destructive" });
    }
    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: colors.bg }}>
        <div className="w-10 h-10 border-4 rounded-full animate-spin" style={{ borderColor: `${colors.primary}33`, borderTopColor: colors.primary }} />
      </div>
    );
  }

  if (!broker) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: colors.bg }}>
        <div className="text-center" style={{ color: colors.text }}>
          <Building2 size={48} className="mx-auto mb-4 opacity-40" />
          <h1 className="text-2xl font-bold">Corretor não encontrado</h1>
          <p className="mt-2" style={{ color: colors.textMuted }}>Verifique o link e tente novamente.</p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden" style={{ background: colors.bg }}>
        <Helmet>
          <title>Imóvel cadastrado! | {broker.company_name || broker.full_name}</title>
        </Helmet>
        <ThemeParticles color={colors.primary} sellerId={broker?.id} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-[120px]" style={{ background: `${colors.primary}18` }} />
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative backdrop-blur-xl rounded-3xl p-8 max-w-md w-full text-center shadow-2xl"
          style={{ background: `${colors.card}cc`, border: `1px solid ${colors.border}` }}
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg"
            style={{ background: `linear-gradient(135deg, #22c55e, #10b981)`, boxShadow: `0 10px 30px rgba(34,197,94,0.3)` }}
          >
            <CheckCircle2 size={48} className="text-white" />
          </motion.div>
          <h2 className="text-3xl font-bold mb-3 font-display" style={{ color: colors.text }}>Imóvel cadastrado!</h2>
          <p className="mb-8 leading-relaxed" style={{ color: colors.textMuted }}>
            Recebemos seus dados com sucesso. O corretor <strong style={{ color: colors.text }}>{broker.full_name}</strong> entrará em contato em breve.
          </p>
          {broker.phone && (
            <a
              href={`https://wa.me/${broker.phone.replace(/\D/g, "")}?text=Olá! Acabei de cadastrar meu imóvel no formulário de captação.`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl text-white font-bold text-sm hover:shadow-lg transition-all hover:-translate-y-0.5"
              style={{ background: `linear-gradient(135deg, #22c55e, #10b981)` }}
            >
              <Phone size={18} /> Falar pelo WhatsApp
            </a>
          )}
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden capture-page" style={{ background: colors.bg }}>
      <style>{`
        .capture-page input::placeholder,
        .capture-page textarea::placeholder {
          color: ${colors.textMuted} !important;
          opacity: 0.7;
        }
      `}</style>
      <Helmet>
        <title>Cadastre seu imóvel | {broker.company_name || broker.full_name}</title>
        <meta name="description" content={`Cadastre seu imóvel gratuitamente com ${broker.full_name}. Receba propostas de compra ou aluguel mais rápido.`} />
      </Helmet>

      <ThemeParticles color={colors.primary} sellerId={broker?.id} />

      {/* Background effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full blur-[150px]" style={{ background: `${colors.primary}14` }} />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] rounded-full blur-[120px]" style={{ background: `${colors.primaryDarker}20` }} />
        <div className="absolute top-1/3 left-0 w-[300px] h-[300px] rounded-full blur-[100px]" style={{ background: `${theme.accent}0d` }} />
        {/* Grid pattern */}
        <div className="absolute inset-0" style={{
          opacity: 0.03,
          backgroundImage: `linear-gradient(${colors.text}1a 1px, transparent 1px), linear-gradient(90deg, ${colors.text}1a 1px, transparent 1px)`,
          backgroundSize: '60px 60px'
        }} />
      </div>

      <div className="relative max-w-6xl mx-auto px-4 py-10 md:py-20">
        <div className="flex flex-col lg:flex-row items-center lg:items-start gap-10 lg:gap-16">
          {/* Hero Left - CTA */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex-1 text-center lg:text-left lg:sticky lg:top-20"
          >
            <span className="inline-block px-4 py-1.5 rounded-full text-xs font-bold mb-6 tracking-wider uppercase"
              style={{ background: `${colors.primary}18`, border: `1px solid ${colors.primary}33`, color: colors.primary }}>
              ✨ Cadastro gratuito
            </span>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 font-display leading-[1.1]" style={{ color: colors.text }}>
              Cadastre seu imóvel
              <br />
              <span style={{
                backgroundImage: `linear-gradient(90deg, ${colors.primary}, ${colors.primaryLighter})`,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}>gratuitamente</span>
            </h1>

            <p className="text-base md:text-lg max-w-md mx-auto lg:mx-0 mb-8" style={{ color: colors.textMuted }}>
              Receba propostas de compra ou aluguel mais rápido
            </p>

            {/* Benefits */}
            <div className="flex flex-wrap justify-center lg:justify-start gap-4 mb-8">
              {BENEFITS.map((b, i) => (
                <div key={i} className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl"
                  style={{ background: `${colors.card}99`, border: `1px solid ${colors.border}` }}>
                  <b.icon size={18} className="shrink-0" style={{ color: colors.primary }} />
                  <span className="text-xs font-medium" style={{ color: colors.text }}>{b.text}</span>
                </div>
              ))}
            </div>

            {/* Broker mini card on desktop */}
            <div className="hidden lg:flex items-center gap-4 mt-8 p-4 rounded-2xl"
              style={{ background: `${colors.card}80`, border: `1px solid ${colors.border}` }}>
              {broker.logo_url ? (
                <img src={broker.logo_url} alt={broker.full_name} className="w-14 h-14 rounded-2xl object-cover" style={{ boxShadow: `0 0 0 2px ${colors.border}` }} />
              ) : (
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-bold"
                  style={{ background: `linear-gradient(135deg, ${colors.primary}, ${colors.primaryDarker})`, color: colors.btnTextColor }}>
                  {broker.full_name?.charAt(0)}
                </div>
              )}
              <div>
                <p className="font-bold text-sm" style={{ color: colors.text }}>{broker.company_name || broker.full_name}</p>
                {broker.seller_category && (
                  <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: colors.primary }}>
                    {broker.seller_category === 'corretor' ? 'Corretor(a) de Imóveis' :
                     broker.seller_category === 'imobiliaria' ? 'Imobiliária' :
                     broker.seller_category === 'construtora' ? 'Construtora' : broker.seller_category}
                  </span>
                )}
                {broker.creci && <p className="text-[10px] mt-0.5" style={{ color: colors.textMuted }}>CRECI: {broker.creci}</p>}
              </div>
            </div>
          </motion.div>

          {/* Form Right */}
          <div className="w-full max-w-md lg:max-w-lg shrink-0">

            {/* Form */}
            <motion.form
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              onSubmit={handleSubmit}
              className="relative backdrop-blur-xl rounded-3xl p-6 md:p-8 shadow-2xl space-y-4"
              style={{ background: `${colors.card}aa`, border: `1px solid ${colors.border}` }}
            >
              {/* Glow accent on form */}
              <div className="absolute -top-px left-1/2 -translate-x-1/2 w-1/2 h-[2px]"
                style={{ background: `linear-gradient(90deg, transparent, ${colors.primary}99, transparent)` }} />

              <div className="relative">
                <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: colors.textMuted }} />
                <Input
                  value={form.full_name}
                  onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
                  placeholder="Nome completo *"
                  className="pl-9"
                  style={{ background: `${colors.card}`, borderColor: colors.border, color: colors.text }}
                  maxLength={100}
                  required
                />
              </div>

              <div className="relative">
                <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: colors.textMuted }} />
                <Input
                  value={form.phone}
                  onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                  placeholder="WhatsApp *"
                  className="pl-9"
                  style={{ background: `${colors.card}`, borderColor: colors.border, color: colors.text }}
                  type="tel"
                  maxLength={20}
                  required
                />
              </div>

              <Select value={form.property_type} onValueChange={v => setForm(f => ({ ...f, property_type: v }))}>
                <SelectTrigger style={{ background: `${colors.card}`, borderColor: colors.border, color: colors.text }}>
                  <div className="flex items-center gap-2">
                    <Home size={16} style={{ color: colors.textMuted }} />
                    <SelectValue placeholder="Tipo de imóvel" />
                  </div>
                </SelectTrigger>
                <SelectContent style={{ background: colors.card, borderColor: colors.border, color: colors.text }}>
                  {PROPERTY_TYPES.map(t => (
                    <SelectItem key={t.value} value={t.value} style={{ color: colors.text }}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="relative">
                <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: colors.textMuted }} />
                <Input
                  value={form.address}
                  onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                  placeholder="Endereço do imóvel"
                  className="pl-9"
                  style={{ background: `${colors.card}`, borderColor: colors.border, color: colors.text }}
                  maxLength={200}
                />
              </div>

              <div className="relative">
                <DollarSign size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: colors.textMuted }} />
                <Input
                  value={form.desired_price}
                  onChange={e => setForm(f => ({ ...f, desired_price: e.target.value }))}
                  placeholder="Valor desejado (R$)"
                  className="pl-9"
                  style={{ background: `${colors.card}`, borderColor: colors.border, color: colors.text }}
                  type="text"
                />
              </div>

              <div className="relative">
                <FileText size={16} className="absolute left-3 top-3" style={{ color: colors.textMuted }} />
                <Textarea
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Descrição do imóvel (opcional)"
                  className="pl-9 min-h-[100px]"
                  style={{ background: `${colors.card}`, borderColor: colors.border, color: colors.text }}
                  maxLength={1000}
                />
              </div>

              <Button
                type="submit"
                disabled={submitting || !form.full_name.trim() || !form.phone.trim()}
                className="w-full py-6 text-base font-bold rounded-2xl transition-all hover:-translate-y-0.5 disabled:opacity-40"
                style={{
                  background: `linear-gradient(90deg, ${colors.primary}, ${colors.primaryDarker})`,
                  color: colors.btnTextColor,
                  boxShadow: `0 8px 25px ${colors.primary}40`,
                }}
              >
                {submitting ? <Loader2 size={20} className="animate-spin mr-2" /> : <CheckCircle2 size={20} className="mr-2" />}
                {submitting ? "Enviando..." : "Cadastrar meu imóvel"}
              </Button>

              <p className="text-center text-[11px]" style={{ color: colors.textMuted }}>
                Seus dados serão enviados diretamente ao corretor responsável.
              </p>
            </motion.form>

            {/* Broker Info Card - mobile only */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="lg:hidden mt-8 backdrop-blur-xl rounded-3xl p-6"
              style={{ background: `${colors.card}aa`, border: `1px solid ${colors.border}` }}
            >
              <div className="flex items-center gap-4 mb-4">
                {broker.logo_url ? (
                  <img src={broker.logo_url} alt={broker.full_name} className="w-16 h-16 rounded-2xl object-cover" style={{ boxShadow: `0 0 0 2px ${colors.border}` }} />
                ) : (
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-bold"
                    style={{ background: `linear-gradient(135deg, ${colors.primary}, ${colors.primaryDarker})`, color: colors.btnTextColor }}>
                    {broker.full_name?.charAt(0)}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-lg truncate" style={{ color: colors.text }}>{broker.company_name || broker.full_name}</h3>
                  {broker.seller_category && (
                    <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider mt-1"
                      style={{ background: `${colors.primary}18`, border: `1px solid ${colors.primary}33`, color: colors.primary }}>
                      {broker.seller_category === 'corretor' ? 'Corretor(a) de Imóveis' :
                       broker.seller_category === 'imobiliaria' ? 'Imobiliária' :
                       broker.seller_category === 'construtora' ? 'Construtora' : broker.seller_category}
                    </span>
                  )}
                </div>
              </div>
              {broker.bio && <p className="text-xs leading-relaxed mb-4" style={{ color: colors.text, opacity: 0.8 }}>{broker.bio}</p>}
              <div className="space-y-2.5">
                {broker.creci && (
                  <div className="flex items-center gap-2.5 text-xs" style={{ color: colors.textMuted }}>
                    <Award size={14} className="shrink-0" style={{ color: colors.primary }} />
                    <span>CRECI: <strong style={{ color: colors.text }}>{broker.creci}</strong></span>
                  </div>
                )}
                {(broker.city || broker.state) && (
                  <div className="flex items-center gap-2.5 text-xs" style={{ color: colors.textMuted }}>
                    <MapPinned size={14} className="shrink-0" style={{ color: colors.primary }} />
                    <span>{[broker.city, broker.state].filter(Boolean).join(" - ")}</span>
                  </div>
                )}
                {broker.phone && (
                  <a href={`https://wa.me/${broker.phone.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2.5 text-xs transition-colors" style={{ color: colors.textMuted }}>
                    <Phone size={14} className="shrink-0" style={{ color: colors.primary }} />
                    <span>{broker.phone}</span>
                  </a>
                )}
                {broker.email && (
                  <div className="flex items-center gap-2.5 text-xs" style={{ color: colors.textMuted }}>
                    <Mail size={14} className="shrink-0" style={{ color: colors.primary }} />
                    <span>{broker.email}</span>
                  </div>
                )}
                {broker.instagram && (
                  <a href={`https://instagram.com/${broker.instagram.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2.5 text-xs transition-colors" style={{ color: colors.textMuted }}>
                    <Instagram size={14} className="shrink-0" style={{ color: colors.primary }} />
                    <span>@{broker.instagram.replace('@', '')}</span>
                  </a>
                )}
              </div>
            </motion.div>

            {/* Trust footer */}
            <div className="text-center mt-6">
              <div className="flex items-center justify-center gap-2 text-[11px]" style={{ color: colors.textMuted }}>
                <Shield size={12} />
                <span>Dados protegidos • Sem compromisso</span>
              </div>
            </div>
          </div>{/* end form column */}
        </div>{/* end flex row */}

        {/* Video Section */}
        {broker.capture_video_url && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1 }}
            className="mt-16 max-w-3xl mx-auto"
          >
            <h2 className="text-2xl md:text-3xl font-bold font-display text-center mb-6" style={{ color: colors.text }}>
              {broker.capture_video_title || "Conheça nosso trabalho"}
            </h2>
            <div className="aspect-video rounded-3xl overflow-hidden shadow-2xl" style={{ border: `1px solid ${colors.border}` }}>
              <iframe
                src={broker.capture_video_url.replace("watch?v=", "embed/").replace("youtu.be/", "youtube.com/embed/").split("&")[0]}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </motion.div>
        )}
      </div>{/* end max-w container */}
    </div>
  );
}
