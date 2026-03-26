import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Save, ArrowLeft, Upload, X, MapPin, Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Database } from "@/integrations/supabase/types";
import { useSubscription, PACKAGE_CONFIG } from "@/hooks/useSubscription";
import { ES_CITIES } from "@/data/esCities";

type ItemCategory = Database["public"]["Enums"]["item_category"];
type ItemTag = Database["public"]["Enums"]["item_tag"];

const propertyCategories: { value: ItemCategory; label: string }[] = [
  { value: "casa", label: "Casa" },
  { value: "apartamento", label: "Apartamento" },
  { value: "terreno", label: "Terreno" },
  { value: "comercial", label: "Comercial" },
  { value: "galpao", label: "Galpão" },
  { value: "flat", label: "Flat" },
];

const commonTags: { value: ItemTag; label: string; gradient: string; emoji: string }[] = [
  { value: "premium", label: "Premium", gradient: "from-amber-500 to-yellow-400", emoji: "👑" },
  { value: "luxo", label: "Luxo", gradient: "from-purple-600 to-pink-500", emoji: "💎" },
  { value: "prime", label: "Prime", gradient: "from-blue-600 to-cyan-400", emoji: "⭐" },
  { value: "novo", label: "Novo", gradient: "from-emerald-500 to-green-400", emoji: "✨" },
  { value: "em_destaque", label: "Em Destaque", gradient: "from-orange-500 to-amber-400", emoji: "🔥" },
  { value: "oferta", label: "Oferta", gradient: "from-red-500 to-rose-400", emoji: "🏷️" },
  { value: "exclusivo", label: "Exclusivo", gradient: "from-indigo-600 to-violet-500", emoji: "🔒" },
  { value: "top", label: "Top", gradient: "from-sky-500 to-blue-400", emoji: "🚀" },
  { value: "limited", label: "Limited", gradient: "from-slate-600 to-zinc-500", emoji: "⏳" },
  { value: "lancamento", label: "Lançamento", gradient: "from-fuchsia-600 to-pink-400", emoji: "🆕" },
];

const propertyOnlyTags: { value: ItemTag; label: string; gradient: string; emoji: string }[] = [
  { value: "pronto_para_morar", label: "Pronto p/ Morar", gradient: "from-teal-500 to-emerald-400", emoji: "🏡" },
  { value: "cobertura", label: "Cobertura", gradient: "from-violet-600 to-purple-400", emoji: "🏙️" },
  { value: "vista_panoramica", label: "Vista Panorâmica", gradient: "from-cyan-500 to-sky-400", emoji: "🌅" },
  { value: "aluguel_flex", label: "Aluguel Flex", gradient: "from-lime-500 to-green-400", emoji: "🔄" },
];

export default function SellerItemForm() {
  const { id } = useParams();
  const isEdit = !!id;
  const { user, profile, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [activeItemCount, setActiveItemCount] = useState(0);
  const [isAluguel, setIsAluguel] = useState(false);
  const { subscription, currentTier, config: pkgConfig, isExpired } = useSubscription(user?.id);

  
  
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "" as ItemCategory | "",
    price: "",
    city: "",
    state: "ES",
    neighborhood: "",
    address: "",
    addressNumber: "",
    tags: [] as ItemTag[],
    photos: [] as string[],
    brand: "",
    model: "",
    year: "",
    mileage: "",
    fuel: "",
    transmission: "",
    color: "",
    bedrooms: "",
    bathrooms: "",
    area: "",
    parking_spots: "",
  });

  useEffect(() => {
    if (!authLoading && !user) navigate("/entrar");
  }, [user, authLoading]);




  useEffect(() => {
    if (isEdit && user) {
      supabase
        .from("seller_items")
        .select("*")
        .eq("id", id)
        .eq("user_id", user.id)
        .single()
        .then(({ data }) => {
          if (data) {
            const editIsAluguel = data.category === "aluguel";
            setIsAluguel(editIsAluguel);
            setForm({
              title: data.title || "",
              description: data.description || "",
              category: data.category,
              price: data.price?.toString() || "",
              city: data.city || "",
              state: data.state || "ES",
              neighborhood: data.neighborhood || "",
              address: data.address?.replace(/,\s*\d+$/, '') || "",
              addressNumber: data.address?.match(/,\s*(\d+)$/)?.[1] || "",
              tags: (data.tags as ItemTag[]) || [],
              photos: data.photos || [],
              brand: data.brand || "",
              model: data.model || "",
              year: data.year?.toString() || "",
              mileage: data.mileage?.toString() || "",
              fuel: data.fuel || "",
              transmission: data.transmission || "",
              color: data.color || "",
              bedrooms: data.bedrooms?.toString() || "",
              bathrooms: data.bathrooms?.toString() || "",
              area: data.area?.toString() || "",
              parking_spots: data.parking_spots?.toString() || "",
            });
          }
        });
    }
  }, [isEdit, id, user]);

  // Fetch active item count for limit enforcement
  useEffect(() => {
    if (user) {
      supabase
        .from("seller_items")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("status", "ativo")
        .then(({ count }) => setActiveItemCount(count || 0));
    }
  }, [user]);

  const isAtLimit = !isEdit && activeItemCount >= pkgConfig.maxItems;

  // Tags for properties
  const allTags = [...commonTags, ...propertyOnlyTags];
  const premiumOnlyTags: ItemTag[] = ["premium", "luxo", "prime", "exclusivo"];
  const availableTags = currentTier === "basico"
    ? allTags.filter((t) => !premiumOnlyTags.includes(t.value))
    : allTags;

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length || !user) return;
    setUploading(true);
    const newPhotos = [...form.photos];

    for (const file of Array.from(e.target.files)) {
      const ext = file.name.split(".").pop();
      const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage.from("seller-uploads").upload(path, file);
      if (!error) {
        const { data: urlData } = supabase.storage.from("seller-uploads").getPublicUrl(path);
        newPhotos.push(urlData.publicUrl);
      }
    }

    setForm((f) => ({ ...f, photos: newPhotos }));
    setUploading(false);
  };

  const removePhoto = (index: number) => {
    setForm((f) => ({ ...f, photos: f.photos.filter((_, i) => i !== index) }));
  };

  const toggleTag = (tag: ItemTag) => {
    setForm((f) => ({
      ...f,
      tags: f.tags.includes(tag) ? f.tags.filter((t) => t !== tag) : [...f.tags, tag],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("handleSubmit called", { user: !!user, profile: !!profile, category: form.category, title: form.title });
    if (!user) {
      toast({ title: "Erro", description: "Você precisa estar logado.", variant: "destructive" });
      return;
    }
    if (!profile) {
      toast({ title: "Erro", description: "Perfil não encontrado. Complete seu perfil primeiro.", variant: "destructive" });
      return;
    }
    if (!form.category) {
      toast({ title: "Erro", description: "Selecione uma categoria.", variant: "destructive" });
      return;
    }
    if (!form.title.trim()) {
      toast({ title: "Erro", description: "Preencha o título do anúncio.", variant: "destructive" });
      return;
    }

    // Check item limit
    if (!isEdit && activeItemCount >= pkgConfig.maxItems) {
      toast({
        title: "Limite de anúncios atingido!",
        description: `Seu plano ${pkgConfig.name} permite até ${pkgConfig.maxItems} anúncios ativos. Faça upgrade para adicionar mais.`,
        variant: "destructive",
      });
      return;
    }

    // Check if subscription is expired
    if (isExpired && subscription) {
      toast({
        title: "Assinatura expirada!",
        description: "Renove seu plano para continuar publicando anúncios.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);

    const payload = {
      user_id: user.id,
      seller_id: profile.id,
      title: form.title,
      description: form.description || null,
      category: (isAluguel ? "aluguel" : form.category) as ItemCategory,
      seller_type: "imoveis" as const,
      price: form.price ? parseFloat(form.price) : null,
      city: form.city || null,
      state: form.state || null,
      neighborhood: form.neighborhood || null,
      address: [form.address, form.addressNumber].filter(Boolean).join(", ") || null,
      tags: form.tags,
      photos: form.photos,
      brand: form.brand || null,
      model: form.model || null,
      year: form.year ? parseInt(form.year) : null,
      mileage: form.mileage ? parseInt(form.mileage) : null,
      fuel: form.fuel || null,
      transmission: form.transmission || null,
      color: form.color || null,
      bedrooms: form.bedrooms ? parseInt(form.bedrooms) : null,
      bathrooms: form.bathrooms ? parseInt(form.bathrooms) : null,
      area: form.area ? parseFloat(form.area) : null,
      parking_spots: form.parking_spots ? parseInt(form.parking_spots) : null,
    };

    let error;
    if (isEdit) {
      ({ error } = await supabase.from("seller_items").update(payload).eq("id", id));
    } else {
      ({ error } = await supabase.from("seller_items").insert(payload));
    }

    if (error) {
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
    } else {
      toast({ title: isEdit ? "Item atualizado!" : "Item criado!" });
      navigate("/painel");
    }
    setSaving(false);
  };

  const categories = propertyCategories;

  return (
    <div className="min-h-screen bg-background">
      <div className="gradient-hero py-6">
        <div className="container max-w-3xl mx-auto px-4 flex items-center gap-3">
          <button onClick={() => navigate("/painel")} className="p-2 rounded-xl bg-white/20 text-white hover:bg-white/30">
            <ArrowLeft size={18} />
          </button>
          <h1 className="font-display font-bold text-xl text-white">
            {isEdit ? "Editar Item" : "Novo Item"}
          </h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="container max-w-3xl mx-auto px-4 py-6 space-y-6">
        {/* Limit Warning */}
        {isAtLimit && (
          <div className="bg-red-500/10 border-2 border-red-500/30 rounded-2xl p-4 flex flex-col sm:flex-row items-center gap-3">
            <Lock size={20} className="text-red-500 flex-shrink-0" />
            <div className="flex-1 text-center sm:text-left">
              <p className="font-bold text-red-600 text-sm">Limite de anúncios atingido!</p>
              <p className="text-xs text-muted-foreground">Seu plano {pkgConfig.name} permite até {pkgConfig.maxItems} anúncios. Faça upgrade para continuar.</p>
            </div>
            <a href="/pacotes" className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90">
              Ver Pacotes
            </a>
          </div>
        )}

        {/* Expired Warning */}
        {isExpired && subscription && (
          <div className="bg-amber-500/10 border-2 border-amber-500/30 rounded-2xl p-4 flex flex-col sm:flex-row items-center gap-3">
            <Lock size={20} className="text-amber-500 flex-shrink-0" />
            <div className="flex-1 text-center sm:text-left">
              <p className="font-bold text-amber-600 text-sm">Sua assinatura expirou!</p>
              <p className="text-xs text-muted-foreground">Renove para continuar publicando anúncios.</p>
            </div>
            <a href="/pacotes" className="px-4 py-2 rounded-xl bg-amber-500 text-white text-xs font-bold hover:bg-amber-600">
              Renovar
            </a>
          </div>
        )}




        {/* Basic Info */}
        <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
          <h2 className="font-display font-bold text-foreground">Informações Básicas</h2>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Título *</label>
            <input
              required
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl border border-input bg-background text-foreground text-sm focus:ring-2 focus:ring-ring focus:outline-none"
              placeholder="Ex: Casa 3 quartos no Centro"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Categoria *</label>
            <select
              required={!isAluguel}
              value={isAluguel ? "" : form.category}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value as ItemCategory }))}
              disabled={isAluguel}
              className="w-full px-4 py-3 rounded-xl border border-input bg-background text-foreground text-sm focus:ring-2 focus:ring-ring focus:outline-none disabled:opacity-50"
            >
              <option value="">Selecione...</option>
              {categories.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>

          {/* Aluguel Toggle */}
          <button
            type="button"
            onClick={() => {
              setIsAluguel(!isAluguel);
              if (!isAluguel) {
                setForm((f) => ({ ...f, category: "aluguel" as ItemCategory }));
              }
            }}
            className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl border-2 transition-all ${
              isAluguel
                ? "border-primary bg-primary/10 shadow-sm"
                : "border-input bg-background hover:border-primary/30"
            }`}
          >
            <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
              isAluguel ? "border-primary bg-primary" : "border-muted-foreground"
            }`}>
              {isAluguel && <span className="text-primary-foreground text-xs font-bold">✓</span>}
            </div>
            <div className="text-left">
              <span className={`text-sm font-semibold ${isAluguel ? "text-primary" : "text-foreground"}`}>
                🏠 Para Aluguel
              </span>
              <p className="text-[11px] text-muted-foreground">Marque se este imóvel é para alugar</p>
            </div>
          </button>

          {isAluguel && (
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Tipo do Imóvel (Aluguel) *</label>
              <select
                required
                value={form.category === "aluguel" ? "" : form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value as ItemCategory }))}
                className="w-full px-4 py-3 rounded-xl border border-primary/30 bg-primary/5 text-foreground text-sm focus:ring-2 focus:ring-ring focus:outline-none"
              >
                <option value="">Selecione o tipo...</option>
                {categories.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
              <p className="text-[10px] text-muted-foreground mt-1">O imóvel será listado como aluguel na categoria selecionada</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Preço (R$)</label>
            <input
              type="number"
              step="0.01"
              value={form.price}
              onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl border border-input bg-background text-foreground text-sm focus:ring-2 focus:ring-ring focus:outline-none"
              placeholder="0,00"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Descrição</label>
            <textarea
              rows={4}
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl border border-input bg-background text-foreground text-sm focus:ring-2 focus:ring-ring focus:outline-none resize-none"
              placeholder="Descreva seu item..."
            />
          </div>
        </div>

        {/* Location */}
        <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
          <h2 className="font-display font-bold text-foreground flex items-center gap-2">
            <MapPin size={16} className="text-primary" /> Localização
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Estado</label>
              <input
                value="Espírito Santo"
                readOnly
                className="w-full px-4 py-3 rounded-xl border border-input bg-muted text-muted-foreground text-sm cursor-not-allowed"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Cidade</label>
              <select
                value={form.city}
                onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl border border-input bg-background text-foreground text-sm focus:ring-2 focus:ring-ring focus:outline-none"
              >
                <option value="">Selecione a cidade</option>
                {ES_CITIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Bairro</label>
            <input
              value={form.neighborhood}
              onChange={(e) => setForm((f) => ({ ...f, neighborhood: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl border border-input bg-background text-foreground text-sm focus:ring-2 focus:ring-ring focus:outline-none"
              placeholder="Bairro"
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <input
              value={form.address}
              onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
              className="col-span-2 px-4 py-3 rounded-xl border border-input bg-background text-foreground text-sm focus:ring-2 focus:ring-ring focus:outline-none"
              placeholder="Endereço (Rua, Av...)"
            />
            <input
              value={form.addressNumber}
              onChange={(e) => setForm((f) => ({ ...f, addressNumber: e.target.value }))}
              className="px-4 py-3 rounded-xl border border-input bg-background text-foreground text-sm focus:ring-2 focus:ring-ring focus:outline-none"
              placeholder="Número"
            />
          </div>
        </div>

        {/* Property Fields */}
        <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
          <h2 className="font-display font-bold text-foreground">🏠 Dados do Imóvel</h2>
          <div className="grid grid-cols-2 gap-3">
            <input type="number" value={form.bedrooms} onChange={(e) => setForm((f) => ({ ...f, bedrooms: e.target.value }))} className="px-4 py-3 rounded-xl border border-input bg-background text-foreground text-sm focus:ring-2 focus:ring-ring focus:outline-none" placeholder="Quartos" />
            <input type="number" value={form.bathrooms} onChange={(e) => setForm((f) => ({ ...f, bathrooms: e.target.value }))} className="px-4 py-3 rounded-xl border border-input bg-background text-foreground text-sm focus:ring-2 focus:ring-ring focus:outline-none" placeholder="Banheiros" />
            <input type="number" value={form.area} onChange={(e) => setForm((f) => ({ ...f, area: e.target.value }))} className="px-4 py-3 rounded-xl border border-input bg-background text-foreground text-sm focus:ring-2 focus:ring-ring focus:outline-none" placeholder="Área (m²)" />
            <input type="number" value={form.parking_spots} onChange={(e) => setForm((f) => ({ ...f, parking_spots: e.target.value }))} className="px-4 py-3 rounded-xl border border-input bg-background text-foreground text-sm focus:ring-2 focus:ring-ring focus:outline-none" placeholder="Vagas" />
          </div>
        </div>



        {/* Tags */}
        <div className="bg-card border border-border rounded-2xl p-5">
          <h2 className="font-display font-bold text-foreground mb-1">Tags de Destaque</h2>
          {currentTier === "basico" && (
            <p className="text-xs text-muted-foreground mb-3 flex items-center gap-1">
              <Lock size={10} /> Algumas tags são exclusivas para planos Premium e VIP
            </p>
          )}
          <div className="flex flex-wrap gap-2.5">
            {availableTags.map((tag) => {
              const selected = form.tags.includes(tag.value);
              return (
                <button
                  key={tag.value}
                  type="button"
                  onClick={() => toggleTag(tag.value)}
                  className={`relative px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 flex items-center gap-1.5 ${
                    selected
                      ? `bg-gradient-to-r ${tag.gradient} text-white shadow-lg scale-105 ring-2 ring-white/20`
                      : "bg-secondary text-secondary-foreground hover:scale-105 hover:shadow-md"
                  }`}
                >
                  <span>{tag.emoji}</span>
                  {tag.label}
                  {selected && (
                    <span className="ml-1 w-4 h-4 rounded-full bg-white/25 flex items-center justify-center text-[10px]">✓</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Photos */}
        <div className="bg-card border border-border rounded-2xl p-5">
          <h2 className="font-display font-bold text-foreground mb-3">Fotos</h2>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
            {form.photos.map((photo, i) => (
              <div key={i} className="relative aspect-square rounded-xl overflow-hidden border border-border">
                <img src={photo} alt="" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => removePhoto(i)}
                  className="absolute top-1 right-1 p-1 rounded-full bg-destructive text-white"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
            <label className="aspect-square rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 transition-colors">
              {uploading ? (
                <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
              ) : (
                <>
                  <Upload size={20} className="text-muted-foreground mb-1" />
                  <span className="text-xs text-muted-foreground">Adicionar</span>
                </>
              )}
              <input type="file" multiple accept="image/*" onChange={handlePhotoUpload} className="hidden" />
            </label>
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={saving || (isAtLimit && !isEdit) || (isExpired && !!subscription)}
          className="w-full py-4 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg"
        >
          {saving ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <Save size={16} /> {isEdit ? "Salvar Alterações" : "Publicar Item"}
            </>
          )}
        </button>
      </form>
    </div>
  );
}
