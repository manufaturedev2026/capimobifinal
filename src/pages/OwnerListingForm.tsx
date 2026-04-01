import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { Upload, X, Home, MapPin, Phone, DollarSign, FileText, Camera } from "lucide-react";
import { motion } from "framer-motion";

const CATEGORIES = [
  { value: "casa", label: "Casa" },
  { value: "apartamento", label: "Apartamento" },
  { value: "terreno", label: "Terreno" },
  { value: "comercial", label: "Comercial" },
  { value: "galpao", label: "Galpão" },
  { value: "flat", label: "Flat" },
];

export default function OwnerListingForm() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [photos, setPhotos] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);

  const [form, setForm] = useState({
    title: "",
    description: "",
    price: "",
    city: "",
    neighborhood: "",
    state: "ES",
    category: "casa" as string,
    phone: "",
    bedrooms: "",
    bathrooms: "",
    area: "",
  });

  const handlePhotoAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (photos.length + files.length > 10) {
      toast({ title: "Máximo 10 fotos", variant: "destructive" });
      return;
    }
    setPhotos((prev) => [...prev, ...files]);
    files.forEach((f) => {
      const reader = new FileReader();
      reader.onload = (ev) => setPreviews((prev) => [...prev, ev.target?.result as string]);
      reader.readAsDataURL(f);
    });
  };

  const removePhoto = (idx: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== idx));
    setPreviews((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile) {
      toast({ title: "Faça login para anunciar", variant: "destructive" });
      navigate("/entrar");
      return;
    }

    if (!form.title || !form.phone || !form.city) {
      toast({ title: "Preencha título, telefone e cidade", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      // Upload photos
      const photoUrls: string[] = [];
      for (const photo of photos) {
        const ext = photo.name.split(".").pop();
        const path = `${profile.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("seller-uploads")
          .upload(path, photo);
        if (!uploadError) {
          const { data: urlData } = supabase.storage.from("seller-uploads").getPublicUrl(path);
          photoUrls.push(urlData.publicUrl);
        }
      }

      const { error } = await supabase.from("seller_items").insert({
        title: form.title,
        description: form.description,
        price: form.price ? parseFloat(form.price) : null,
        city: form.city,
        neighborhood: form.neighborhood,
        state: form.state,
        category: form.category as any,
        seller_id: profile.id,
        user_id: user.id,
        seller_type: "imoveis",
        photos: photoUrls,
        owner_phone: form.phone,
        is_owner_listing: true,
        capture_status: "disponivel" as any,
        bedrooms: form.bedrooms ? parseInt(form.bedrooms) : null,
        bathrooms: form.bathrooms ? parseInt(form.bathrooms) : null,
        area: form.area ? parseFloat(form.area) : null,
      });

      if (error) throw error;

      toast({ title: "Imóvel cadastrado com sucesso!", description: "Corretores já podem visualizar seu anúncio." });
      navigate("/meus-imoveis");
    } catch (err: any) {
      toast({ title: "Erro ao cadastrar", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-secondary/50 py-8 px-4">
      <Helmet>
        <title>Anunciar Imóvel Grátis | ES Corretores</title>
        <meta name="description" content="Cadastre seu imóvel gratuitamente e receba propostas de corretores qualificados." />
      </Helmet>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl mx-auto"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Home size={32} className="text-primary" />
          </div>
          <h1 className="font-display font-bold text-2xl md:text-3xl text-foreground">
            Anuncie seu imóvel grátis
          </h1>
          <p className="text-muted-foreground mt-2">
            Cadastre e receba propostas de corretores qualificados
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-card border border-border rounded-2xl p-6 space-y-6">
          {/* Título */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <FileText size={16} className="text-primary" /> Título do Anúncio *
            </Label>
            <Input
              placeholder="Ex: Casa 3 quartos no Centro"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              required
            />
          </div>

          {/* Categoria e Preço */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tipo do Imóvel *</Label>
              <Select value={form.category} onValueChange={(v) => setForm((f) => ({ ...f, category: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <DollarSign size={16} className="text-primary" /> Preço (R$)
              </Label>
              <Input
                type="number"
                placeholder="500000"
                value={form.price}
                onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
              />
            </div>
          </div>

          {/* Localização */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <MapPin size={16} className="text-primary" /> Cidade *
              </Label>
              <Input
                placeholder="Vila Velha"
                value={form.city}
                onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Bairro</Label>
              <Input
                placeholder="Centro"
                value={form.neighborhood}
                onChange={(e) => setForm((f) => ({ ...f, neighborhood: e.target.value }))}
              />
            </div>
          </div>

          {/* Detalhes */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Quartos</Label>
              <Input type="number" placeholder="3" value={form.bedrooms} onChange={(e) => setForm((f) => ({ ...f, bedrooms: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Banheiros</Label>
              <Input type="number" placeholder="2" value={form.bathrooms} onChange={(e) => setForm((f) => ({ ...f, bathrooms: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Área (m²)</Label>
              <Input type="number" placeholder="120" value={form.area} onChange={(e) => setForm((f) => ({ ...f, area: e.target.value }))} />
            </div>
          </div>

          {/* Telefone */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Phone size={16} className="text-primary" /> Seu Telefone *
            </Label>
            <Input
              placeholder="(27) 99999-9999"
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              required
            />
            <p className="text-xs text-muted-foreground">
              Seu telefone só será compartilhado com corretores que captarem seu imóvel.
            </p>
          </div>

          {/* Descrição */}
          <div className="space-y-2">
            <Label>Descrição</Label>
            <Textarea
              placeholder="Descreva seu imóvel: localização, diferenciais, estado de conservação..."
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              rows={4}
            />
          </div>

          {/* Fotos */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Camera size={16} className="text-primary" /> Fotos (até 10)
            </Label>
            <div className="grid grid-cols-4 md:grid-cols-5 gap-2">
              {previews.map((p, i) => (
                <div key={i} className="relative aspect-square rounded-xl overflow-hidden border border-border">
                  <img src={p} alt="" className="w-full h-full object-cover" />
                  <button type="button" onClick={() => removePhoto(i)} className="absolute top-1 right-1 w-6 h-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center">
                    <X size={14} />
                  </button>
                </div>
              ))}
              {photos.length < 10 && (
                <label className="aspect-square rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 transition-colors">
                  <Upload size={20} className="text-muted-foreground" />
                  <span className="text-xs text-muted-foreground mt-1">Adicionar</span>
                  <input type="file" accept="image/*" multiple onChange={handlePhotoAdd} className="hidden" />
                </label>
              )}
            </div>
          </div>

          <Button type="submit" disabled={loading} className="w-full h-12 text-base font-bold">
            {loading ? "Cadastrando..." : "Cadastrar Imóvel Grátis"}
          </Button>
        </form>
      </motion.div>
    </div>
  );
}
