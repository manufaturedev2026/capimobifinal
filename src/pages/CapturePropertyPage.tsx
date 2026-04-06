import { useState, useEffect } from "react";
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
      .select("id, user_id, full_name, company_name, logo_url, phone, slug, seller_category, creci, instagram, bio, city, state, email")
      .or(`slug.eq.${slug},id.eq.${slug}`)
      .limit(1)
      .single()
      .then(({ data }) => {
        setBroker(data);
        setLoading(false);
      });
  }, [slug]);

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

      await supabase.from("seller_crm_contacts").insert({
        seller_id: broker.id,
        user_id: broker.user_id,
        full_name: form.full_name.trim().slice(0, 100),
        phone: form.phone.trim().slice(0, 20),
        funnel_stage: "novo",
        lead_source: "captacao_online",
        notes: `📍 ${form.address || "Sem endereço"}\n🏠 ${PROPERTY_TYPES.find(t => t.value === form.property_type)?.label || form.property_type}\n💰 ${price ? `R$ ${price.toLocaleString("pt-BR")}` : "Não informado"}\n📝 ${form.description || "Sem descrição"}`,
      } as any);

      setSubmitted(true);
    } catch {
      toast({ title: "Erro ao enviar", description: "Tente novamente.", variant: "destructive" });
    }
    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#020817]">
        <div className="w-10 h-10 border-4 border-white/20 border-t-[#00AEEF] rounded-full animate-spin" />
      </div>
    );
  }

  if (!broker) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#020817] p-4">
        <div className="text-center text-white">
          <Building2 size={48} className="mx-auto mb-4 opacity-40" />
          <h1 className="text-2xl font-bold">Corretor não encontrado</h1>
          <p className="text-white/40 mt-2">Verifique o link e tente novamente.</p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#020817] p-4 relative overflow-hidden">
        <Helmet>
          <title>Imóvel cadastrado! | {broker.company_name || broker.full_name}</title>
        </Helmet>
        {/* Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-[#00AEEF]/10 blur-[120px]" />
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative bg-white/5 backdrop-blur-xl rounded-3xl p-8 max-w-md w-full text-center border border-white/10 shadow-2xl"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="w-24 h-24 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-green-500/30"
          >
            <CheckCircle2 size={48} className="text-white" />
          </motion.div>
          <h2 className="text-3xl font-bold text-white mb-3 font-display">Imóvel cadastrado!</h2>
          <p className="text-white/60 mb-8 leading-relaxed">
            Recebemos seus dados com sucesso. O corretor <strong className="text-white/90">{broker.full_name}</strong> entrará em contato em breve.
          </p>
          {broker.phone && (
            <a
              href={`https://wa.me/${broker.phone.replace(/\D/g, "")}?text=Olá! Acabei de cadastrar meu imóvel no formulário de captação.`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold text-sm hover:shadow-lg hover:shadow-green-500/30 transition-all hover:-translate-y-0.5"
            >
              <Phone size={18} /> Falar pelo WhatsApp
            </a>
          )}
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020817] relative overflow-hidden">
      <Helmet>
        <title>Cadastre seu imóvel | {broker.company_name || broker.full_name}</title>
        <meta name="description" content={`Cadastre seu imóvel gratuitamente com ${broker.full_name}. Receba propostas de compra ou aluguel mais rápido.`} />
      </Helmet>

      {/* Background effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full bg-[#00AEEF]/8 blur-[150px]" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] rounded-full bg-[#002F6C]/20 blur-[120px]" />
        <div className="absolute top-1/3 left-0 w-[300px] h-[300px] rounded-full bg-purple-600/5 blur-[100px]" />
        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
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
            <span className="inline-block px-4 py-1.5 rounded-full bg-[#00AEEF]/10 border border-[#00AEEF]/20 text-[#00AEEF] text-xs font-bold mb-6 tracking-wider uppercase">
              ✨ Cadastro gratuito
            </span>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 font-display leading-[1.1]">
              Cadastre seu imóvel
              <br />
              <span className="bg-gradient-to-r from-[#00AEEF] to-[#60d0ff] bg-clip-text text-transparent">gratuitamente</span>
            </h1>

            <p className="text-white/50 text-base md:text-lg max-w-md mx-auto lg:mx-0 mb-8">
              Receba propostas de compra ou aluguel mais rápido
            </p>

            {/* Benefits */}
            <div className="flex flex-wrap justify-center lg:justify-start gap-4 mb-8">
              {BENEFITS.map((b, i) => (
                <div key={i} className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-white/5 border border-white/10">
                  <b.icon size={18} className="text-[#00AEEF] shrink-0" />
                  <span className="text-xs text-white/50 font-medium">{b.text}</span>
                </div>
              ))}
            </div>

            {/* Broker mini card on desktop */}
            <div className="hidden lg:flex items-center gap-4 mt-8 p-4 rounded-2xl bg-white/[0.03] border border-white/10">
              {broker.logo_url ? (
                <img src={broker.logo_url} alt={broker.full_name} className="w-14 h-14 rounded-2xl object-cover ring-2 ring-white/10" />
              ) : (
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#00AEEF] to-[#0060a0] flex items-center justify-center text-white text-xl font-bold">
                  {broker.full_name?.charAt(0)}
                </div>
              )}
              <div>
                <p className="text-white font-bold text-sm">{broker.company_name || broker.full_name}</p>
                {broker.seller_category && (
                  <span className="text-[#00AEEF] text-[10px] font-bold uppercase tracking-wider">
                    {broker.seller_category === 'corretor' ? 'Corretor(a) de Imóveis' :
                     broker.seller_category === 'imobiliaria' ? 'Imobiliária' :
                     broker.seller_category === 'construtora' ? 'Construtora' : broker.seller_category}
                  </span>
                )}
                {broker.creci && <p className="text-white/30 text-[10px] mt-0.5">CRECI: {broker.creci}</p>}
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
          className="relative bg-white/[0.04] backdrop-blur-xl rounded-3xl p-6 md:p-8 border border-white/10 shadow-2xl space-y-4"
        >
          {/* Glow accent on form */}
          <div className="absolute -top-px left-1/2 -translate-x-1/2 w-1/2 h-[2px] bg-gradient-to-r from-transparent via-[#00AEEF]/60 to-transparent" />

          <div className="relative">
            <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
            <Input
              value={form.full_name}
              onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
              placeholder="Nome completo *"
              className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-white/30 focus-visible:ring-[#00AEEF]/50 focus-visible:border-[#00AEEF]/30"
              maxLength={100}
              required
            />
          </div>

          <div className="relative">
            <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
            <Input
              value={form.phone}
              onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
              placeholder="WhatsApp *"
              className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-white/30 focus-visible:ring-[#00AEEF]/50 focus-visible:border-[#00AEEF]/30"
              type="tel"
              maxLength={20}
              required
            />
          </div>

          <Select value={form.property_type} onValueChange={v => setForm(f => ({ ...f, property_type: v }))}>
            <SelectTrigger className="bg-white/5 border-white/10 text-white [&>span]:text-white/70">
              <div className="flex items-center gap-2">
                <Home size={16} className="text-white/30" />
                <SelectValue placeholder="Tipo de imóvel" />
              </div>
            </SelectTrigger>
            <SelectContent>
              {PROPERTY_TYPES.map(t => (
                <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="relative">
            <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
            <Input
              value={form.address}
              onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
              placeholder="Endereço do imóvel"
              className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-white/30 focus-visible:ring-[#00AEEF]/50 focus-visible:border-[#00AEEF]/30"
              maxLength={200}
            />
          </div>

          <div className="relative">
            <DollarSign size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
            <Input
              value={form.desired_price}
              onChange={e => setForm(f => ({ ...f, desired_price: e.target.value }))}
              placeholder="Valor desejado (R$)"
              className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-white/30 focus-visible:ring-[#00AEEF]/50 focus-visible:border-[#00AEEF]/30"
              type="text"
            />
          </div>

          <div className="relative">
            <FileText size={16} className="absolute left-3 top-3 text-white/30" />
            <Textarea
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Descrição do imóvel (opcional)"
              className="pl-9 min-h-[100px] bg-white/5 border-white/10 text-white placeholder:text-white/30 focus-visible:ring-[#00AEEF]/50 focus-visible:border-[#00AEEF]/30"
              maxLength={1000}
            />
          </div>

          <Button
            type="submit"
            disabled={submitting || !form.full_name.trim() || !form.phone.trim()}
            className="w-full py-6 text-base font-bold rounded-2xl bg-gradient-to-r from-[#00AEEF] to-[#0090c5] hover:shadow-lg hover:shadow-[#00AEEF]/25 text-white transition-all hover:-translate-y-0.5 disabled:opacity-40"
          >
            {submitting ? <Loader2 size={20} className="animate-spin mr-2" /> : <CheckCircle2 size={20} className="mr-2" />}
            {submitting ? "Enviando..." : "Cadastrar meu imóvel"}
          </Button>

          <p className="text-center text-[11px] text-white/25">
            Seus dados serão enviados diretamente ao corretor responsável.
          </p>
          </motion.form>

          {/* Broker Info Card - mobile only */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="lg:hidden mt-8 bg-white/[0.04] backdrop-blur-xl rounded-3xl p-6 border border-white/10"
          >
            <div className="flex items-center gap-4 mb-4">
              {broker.logo_url ? (
                <img src={broker.logo_url} alt={broker.full_name} className="w-16 h-16 rounded-2xl object-cover ring-2 ring-white/10" />
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#00AEEF] to-[#0060a0] flex items-center justify-center text-white text-xl font-bold">
                  {broker.full_name?.charAt(0)}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h3 className="text-white font-bold text-lg truncate">{broker.company_name || broker.full_name}</h3>
                {broker.seller_category && (
                  <span className="inline-block px-2.5 py-0.5 rounded-full bg-[#00AEEF]/10 border border-[#00AEEF]/20 text-[#00AEEF] text-[10px] font-bold uppercase tracking-wider mt-1">
                    {broker.seller_category === 'corretor' ? 'Corretor(a) de Imóveis' :
                     broker.seller_category === 'imobiliaria' ? 'Imobiliária' :
                     broker.seller_category === 'construtora' ? 'Construtora' : broker.seller_category}
                  </span>
                )}
              </div>
            </div>
            {broker.bio && <p className="text-white/40 text-xs leading-relaxed mb-4">{broker.bio}</p>}
            <div className="space-y-2.5">
              {broker.creci && (
                <div className="flex items-center gap-2.5 text-white/50 text-xs">
                  <Award size={14} className="text-[#00AEEF] shrink-0" />
                  <span>CRECI: <strong className="text-white/70">{broker.creci}</strong></span>
                </div>
              )}
              {(broker.city || broker.state) && (
                <div className="flex items-center gap-2.5 text-white/50 text-xs">
                  <MapPinned size={14} className="text-[#00AEEF] shrink-0" />
                  <span>{[broker.city, broker.state].filter(Boolean).join(" - ")}</span>
                </div>
              )}
              {broker.phone && (
                <a href={`https://wa.me/${broker.phone.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2.5 text-white/50 text-xs hover:text-[#00AEEF] transition-colors">
                  <Phone size={14} className="text-[#00AEEF] shrink-0" />
                  <span>{broker.phone}</span>
                </a>
              )}
              {broker.email && (
                <div className="flex items-center gap-2.5 text-white/50 text-xs">
                  <Mail size={14} className="text-[#00AEEF] shrink-0" />
                  <span>{broker.email}</span>
                </div>
              )}
              {broker.instagram && (
                <a href={`https://instagram.com/${broker.instagram.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2.5 text-white/50 text-xs hover:text-[#00AEEF] transition-colors">
                  <Instagram size={14} className="text-[#00AEEF] shrink-0" />
                  <span>@{broker.instagram.replace('@', '')}</span>
                </a>
              )}
            </div>
          </motion.div>

          {/* Trust footer */}
          <div className="text-center mt-6">
            <div className="flex items-center justify-center gap-2 text-white/20 text-[11px]">
              <Shield size={12} />
              <span>Dados protegidos • Sem compromisso</span>
            </div>
          </div>
          </div>{/* end form column */}
        </div>{/* end flex row */}
      </div>{/* end max-w container */}
    </div>
  );
}
