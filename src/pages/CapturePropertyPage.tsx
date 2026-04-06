import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Home, Phone, User, MapPin, DollarSign, Camera, FileText, CheckCircle2, Loader2, Building2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const PROPERTY_TYPES = [
  { value: "casa", label: "Casa" },
  { value: "apartamento", label: "Apartamento" },
  { value: "terreno", label: "Terreno" },
  { value: "comercial", label: "Comercial" },
  { value: "galpao", label: "Galpão" },
  { value: "flat", label: "Flat" },
  { value: "outros", label: "Outros" },
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
  const [photos, setPhotos] = useState<File[]>([]);

  useEffect(() => {
    if (!slug) return;
    supabase
      .from("profiles")
      .select("id, user_id, full_name, company_name, logo_url, phone, slug, seller_category")
      .or(`slug.eq.${slug},id.eq.${slug}`)
      .limit(1)
      .single()
      .then(({ data }) => {
        setBroker(data);
        setLoading(false);
      });
  }, [slug]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files).slice(0, 10);
      setPhotos(files);
    }
  };

  const uploadPhotos = async (): Promise<string[]> => {
    if (!photos.length || !broker) return [];
    const urls: string[] = [];
    for (const file of photos) {
      const ext = file.name.split(".").pop();
      const path = `captacao/${broker.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage.from("seller-photos").upload(path, file);
      if (!error) {
        const { data: urlData } = supabase.storage.from("seller-photos").getPublicUrl(path);
        urls.push(urlData.publicUrl);
      }
    }
    return urls;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broker || !form.full_name.trim() || !form.phone.trim()) return;
    setSubmitting(true);

    try {
      const photoUrls = await uploadPhotos();
      const price = form.desired_price ? parseFloat(form.desired_price.replace(/\D/g, "")) : null;

      await supabase.from("property_capture_leads" as any).insert({
        seller_id: broker.id,
        seller_user_id: broker.user_id,
        full_name: form.full_name.trim().slice(0, 100),
        phone: form.phone.trim().slice(0, 20),
        property_type: form.property_type,
        address: form.address.trim().slice(0, 200),
        desired_price: price,
        photos: photoUrls,
        description: form.description.trim().slice(0, 1000),
        status: "novo",
      });

      // Also create a CRM contact for the broker
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#002F6C] to-[#00AEEF]">
        <div className="w-10 h-10 border-4 border-white/30 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  if (!broker) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#002F6C] to-[#00AEEF] p-4">
        <div className="text-center text-white">
          <Building2 size={48} className="mx-auto mb-4 opacity-60" />
          <h1 className="text-2xl font-bold">Corretor não encontrado</h1>
          <p className="text-white/60 mt-2">Verifique o link e tente novamente.</p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#002F6C] to-[#00AEEF] p-4">
        <Helmet>
          <title>Imóvel cadastrado! | {broker.company_name || broker.full_name}</title>
        </Helmet>
        <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center shadow-2xl">
          <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 size={40} className="text-green-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Imóvel cadastrado!</h2>
          <p className="text-gray-500 mb-6">
            Recebemos seus dados com sucesso. O corretor <strong>{broker.full_name}</strong> entrará em contato em breve.
          </p>
          {broker.phone && (
            <a
              href={`https://wa.me/${broker.phone.replace(/\D/g, "")}?text=Olá! Acabei de cadastrar meu imóvel no formulário de captação.`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-green-500 text-white font-bold text-sm hover:bg-green-600 transition-colors"
            >
              <Phone size={16} /> Falar pelo WhatsApp
            </a>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#002F6C] via-[#003d8f] to-[#00AEEF]">
      <Helmet>
        <title>Cadastre seu imóvel | {broker.company_name || broker.full_name}</title>
        <meta name="description" content={`Cadastre seu imóvel gratuitamente com ${broker.full_name}. Receba propostas de compra ou aluguel mais rápido.`} />
      </Helmet>

      <div className="max-w-lg mx-auto px-4 py-8 md:py-16">
        {/* Broker Header */}
        <div className="text-center mb-8">
          {broker.logo_url && (
            <img src={broker.logo_url} alt={broker.full_name} className="w-20 h-20 rounded-2xl object-cover mx-auto mb-4 ring-4 ring-white/20 shadow-xl" />
          )}
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">Cadastre seu imóvel gratuitamente</h1>
          <p className="text-white/70 text-sm md:text-base">Receba propostas de compra ou aluguel mais rápido</p>
          <p className="text-white/50 text-xs mt-2">por <strong className="text-white/80">{broker.company_name || broker.full_name}</strong></p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-6 md:p-8 shadow-2xl space-y-4">
          <div className="relative">
            <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <Input
              value={form.full_name}
              onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
              placeholder="Nome completo *"
              className="pl-9"
              maxLength={100}
              required
            />
          </div>

          <div className="relative">
            <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <Input
              value={form.phone}
              onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
              placeholder="WhatsApp *"
              className="pl-9"
              type="tel"
              maxLength={20}
              required
            />
          </div>

          <Select value={form.property_type} onValueChange={v => setForm(f => ({ ...f, property_type: v }))}>
            <SelectTrigger>
              <div className="flex items-center gap-2">
                <Home size={16} className="text-gray-400" />
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
            <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <Input
              value={form.address}
              onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
              placeholder="Endereço do imóvel"
              className="pl-9"
              maxLength={200}
            />
          </div>

          <div className="relative">
            <DollarSign size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <Input
              value={form.desired_price}
              onChange={e => setForm(f => ({ ...f, desired_price: e.target.value }))}
              placeholder="Valor desejado (R$)"
              className="pl-9"
              type="text"
            />
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm text-gray-600 mb-2">
              <Camera size={16} /> Fotos do imóvel (até 10)
            </label>
            <Input
              type="file"
              accept="image/*"
              multiple
              onChange={handlePhotoChange}
              className="text-sm"
            />
            {photos.length > 0 && (
              <p className="text-xs text-gray-400 mt-1">{photos.length} foto(s) selecionada(s)</p>
            )}
          </div>

          <div className="relative">
            <FileText size={16} className="absolute left-3 top-3 text-gray-400" />
            <Textarea
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Descrição do imóvel"
              className="pl-9 min-h-[100px]"
              maxLength={1000}
            />
          </div>

          <Button
            type="submit"
            disabled={submitting || !form.full_name.trim() || !form.phone.trim()}
            className="w-full py-6 text-base font-bold rounded-xl bg-gradient-to-r from-[#00AEEF] to-[#002F6C] hover:opacity-90 text-white"
          >
            {submitting ? <Loader2 size={20} className="animate-spin" /> : <CheckCircle2 size={20} />}
            {submitting ? "Enviando..." : "Cadastrar meu imóvel"}
          </Button>

          <p className="text-center text-[11px] text-gray-400">
            Seus dados serão enviados diretamente ao corretor responsável.
          </p>
        </form>
      </div>
    </div>
  );
}
