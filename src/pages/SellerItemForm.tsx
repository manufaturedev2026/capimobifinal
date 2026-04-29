import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Save, ArrowLeft, Upload, X, MapPin, Lock, Video, Search, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getTagStyle, getTagLabel, getTagEmoji, TAG_CATEGORIES } from "@/data/products";
import type { Database } from "@/integrations/supabase/types";
import { useSubscription, PACKAGE_CONFIG } from "@/hooks/useSubscription";
import { ES_NEIGHBORHOODS } from "@/data/esNeighborhoods";
import { BRAZIL_STATES } from "@/data/brazilStates";
import { useCitiesByState } from "@/hooks/useCitiesByState";
import PropertyFieldsCasa from "@/components/PropertyFieldsCasa";
import PropertyFieldsApartamento from "@/components/PropertyFieldsApartamento";
import PropertyFieldsTerreno from "@/components/PropertyFieldsTerreno";
import PropertyFieldsComercial from "@/components/PropertyFieldsComercial";

type ItemCategory = Database["public"]["Enums"]["item_category"];
type ItemTag = Database["public"]["Enums"]["item_tag"];

const propertyCategories: { value: ItemCategory; label: string; emoji: string }[] = [
  { value: "casa", label: "Casa", emoji: "🏠" },
  { value: "apartamento", label: "Apartamento", emoji: "🏢" },
  { value: "terreno", label: "Terreno / Lote", emoji: "🌳" },
  { value: "comercial", label: "Sala / Loja Comercial", emoji: "🏪" },
  { value: "galpao", label: "Galpão / Comercial", emoji: "🏭" },
  { value: "flat", label: "Flat / Studio", emoji: "🛏️" },
];

const MAX_TAGS = 1;
const MAX_PHOTOS = 10;

const categoryHeaderStyles: Record<string, string> = {
  valor: "text-amber-600",
  destaque: "text-red-500",
  status: "text-blue-500",
  diferenciais: "text-emerald-500",
  facilidade: "text-purple-500",
};

const INITIAL_FORM = {
  title: "",
  description: "",
  category: "" as ItemCategory | "",
  price: "",
  city: "",
  state: "",
  neighborhood: "",
  address: "",
  addressNumber: "",
  cep: "",
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
  video_url: "",
  // New fields
  property_subtype: "",
  finality: "venda",
  built_area: "",
  suites: "",
  living_rooms: "",
  kitchen_type: "",
  service_area: false,
  backyard: false,
  pool: false,
  barbecue: false,
  balcony: false,
  garden: false,
  furnished: false,
  accepts_financing: false,
  documentation: "",
  condo_fee: "",
  iptu: "",
  floor_number: "",
  has_elevator: false,
  doorman_24h: false,
  leisure_amenities: [] as string[],
  ceiling_height: "",
  has_dock: false,
  internal_office: false,
  three_phase_power: false,
  truck_access: false,
  zoning: "",
  security: "",
  lot_front: "",
  lot_depth: "",
  topography: "",
  infrastructure: [] as string[],
  has_showcase: false,
  has_ac: false,
  foot_traffic: "",
  ideal_for: "",
  show_financing: false,
  show_street_view: true,
  partnership_enabled: false,
  commission_percent: "",
  partner_percent: "",
};

export default function SellerItemForm() {
  const { id } = useParams();
  const isEdit = !!id;
  const { user, profile, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [fetchingCep, setFetchingCep] = useState(false);
  const [activeItemCount, setActiveItemCount] = useState(0);
  const [isAluguel, setIsAluguel] = useState(false);
  const { subscription, currentTier, config: pkgConfig, isExpired } = useSubscription(user?.id);

  const [form, setForm] = useState(INITIAL_FORM);
  const { cities: ibgeCities, loading: citiesLoading } = useCitiesByState(form.state);

  useEffect(() => {
    if (!authLoading && !user) navigate("/login");
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
            const d = data as any;
            const editIsAluguel = d.finality === "aluguel" || (d.tags as string[] || []).includes("aluguel_flex") || d.category === "aluguel";
            setIsAluguel(editIsAluguel);
            setForm({
              title: d.title || "",
              description: d.description || "",
              category: d.category,
              price: d.price?.toString() || "",
              city: d.city || "",
              state: d.state || "",
              neighborhood: d.neighborhood || "",
              address: d.address?.replace(/,\s*\d+$/, '') || "",
              addressNumber: d.address?.match(/,\s*(\d+)$/)?.[1] || "",
              cep: d.cep || "",
              tags: (d.tags as ItemTag[]) || [],
              photos: d.photos || [],
              brand: d.brand || "",
              model: d.model || "",
              year: d.year?.toString() || "",
              mileage: d.mileage?.toString() || "",
              fuel: d.fuel || "",
              transmission: d.transmission || "",
              color: d.color || "",
              bedrooms: d.bedrooms?.toString() || "",
              bathrooms: d.bathrooms?.toString() || "",
              area: d.area?.toString() || "",
              parking_spots: d.parking_spots?.toString() || "",
              video_url: d.video_url || "",
              property_subtype: d.property_subtype || "",
              finality: editIsAluguel ? "aluguel" : "venda",
              built_area: d.built_area?.toString() || "",
              suites: d.suites?.toString() || "",
              living_rooms: d.living_rooms?.toString() || "",
              kitchen_type: d.kitchen_type || "",
              service_area: !!d.service_area,
              backyard: !!d.backyard,
              pool: !!d.pool,
              barbecue: !!d.barbecue,
              balcony: !!d.balcony,
              garden: !!d.garden,
              furnished: !!d.furnished,
              accepts_financing: !!d.accepts_financing,
              show_financing: !!d.show_financing,
              show_street_view: d.show_street_view ?? true,
              documentation: d.documentation || "",
              condo_fee: d.condo_fee?.toString() || "",
              iptu: d.iptu?.toString() || "",
              floor_number: d.floor_number?.toString() || "",
              has_elevator: !!d.has_elevator,
              doorman_24h: !!d.doorman_24h,
              leisure_amenities: d.leisure_amenities || [],
              ceiling_height: d.ceiling_height?.toString() || "",
              has_dock: !!d.has_dock,
              internal_office: !!d.internal_office,
              three_phase_power: !!d.three_phase_power,
              truck_access: !!d.truck_access,
              zoning: d.zoning || "",
              security: d.security || "",
              lot_front: d.lot_front?.toString() || "",
              lot_depth: d.lot_depth?.toString() || "",
              topography: d.topography || "",
              infrastructure: d.infrastructure || [],
              has_showcase: !!d.has_showcase,
              has_ac: !!d.has_ac,
              foot_traffic: d.foot_traffic || "",
              ideal_for: d.ideal_for || "",
              partnership_enabled: !!d.partnership_enabled,
              commission_percent: d.commission_percent?.toString() || "",
              partner_percent: d.partner_percent?.toString() || "",
            });
          }
        });
    }
  }, [isEdit, id, user]);

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
  const premiumOnlyTags: string[] = ["premium", "luxo", "alto_padrao", "exclusivo"];
  const allTagValues = Object.values(TAG_CATEGORIES).flatMap((c) => c.tags);

  const toggleTag = (tag: ItemTag) => {
    setForm((f) => {
      if (f.tags.includes(tag)) return { ...f, tags: f.tags.filter((t) => t !== tag) };
      if (f.tags.length >= MAX_TAGS) {
        toast({ title: "Máximo de 1 tag", description: "Remova a tag atual antes de adicionar outra.", variant: "destructive" });
        return f;
      }
      return { ...f, tags: [...f.tags, tag] };
    });
  };

  // Auto-suggest tags based on form data
  const suggestedTags = (() => {
    const suggestions: string[] = [];
    const price = parseFloat(form.price);
    if (price >= 800000) suggestions.push("premium");
    if (price >= 1500000) suggestions.push("alto_padrao");
    if (form.pool) suggestions.push("piscina_tag");
    if (form.property_subtype === "cobertura" || form.category === "apartamento" && form.property_subtype === "cobertura") suggestions.push("cobertura");
    if (form.leisure_amenities.length >= 2) suggestions.push("area_lazer");
    if (form.accepts_financing) suggestions.push("aceita_financiamento_tag");
    if (form.furnished) suggestions.push("pronto_para_morar");
    return suggestions.filter((s) => !form.tags.includes(s as ItemTag));
  })();

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length || !user) return;
    const remaining = MAX_PHOTOS - form.photos.length;
    if (remaining <= 0) {
      toast({ title: `Máximo de ${MAX_PHOTOS} fotos por imóvel`, description: "Remova alguma foto antes de adicionar outra.", variant: "destructive" });
      e.target.value = "";
      return;
    }
    const filesArray = Array.from(e.target.files);
    if (filesArray.length > remaining) {
      toast({ title: `Você só pode adicionar mais ${remaining} foto(s)`, description: `Limite de ${MAX_PHOTOS} fotos por imóvel.`, variant: "destructive" });
    }
    const filesToUpload = filesArray.slice(0, remaining);
    setUploading(true);
    const newPhotos = [...form.photos];
    for (const file of filesToUpload) {
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
    e.target.value = "";
  };

  const removePhoto = (index: number) => setForm((f) => ({ ...f, photos: f.photos.filter((_, i) => i !== index) }));

  const handleCepLookup = async () => {
    const cleanCep = form.cep.replace(/\D/g, "");
    if (cleanCep.length !== 8) {
      toast({ title: "CEP inválido", description: "Digite um CEP com 8 números.", variant: "destructive" });
      return;
    }

    setFetchingCep(true);
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
      const data = await response.json();
      if (!response.ok || data.erro) {
        toast({ title: "CEP não encontrado", description: "Confira o CEP informado e tente novamente.", variant: "destructive" });
        return;
      }

      setForm((f) => ({
        ...f,
        state: data.uf || f.state,
        city: data.localidade || f.city,
        neighborhood: data.bairro || f.neighborhood,
        address: data.logradouro || f.address,
      }));
      toast({ title: "Endereço localizado", description: "Rua, bairro, cidade e estado foram preenchidos pelo CEP." });
    } catch {
      toast({ title: "Erro ao buscar CEP", description: "Não foi possível consultar o CEP agora.", variant: "destructive" });
    } finally {
      setFetchingCep(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { toast({ title: "Erro", description: "Você precisa estar logado.", variant: "destructive" }); return; }
    if (!profile) { toast({ title: "Erro", description: "Perfil não encontrado.", variant: "destructive" }); return; }
    if (!isAluguel && !form.category) { toast({ title: "Erro", description: "Selecione uma categoria.", variant: "destructive" }); return; }
    if (!form.title.trim()) { toast({ title: "Erro", description: "Preencha o título.", variant: "destructive" }); return; }
    if (!isEdit && activeItemCount >= pkgConfig.maxItems) { toast({ title: "Limite atingido!", description: `Plano ${pkgConfig.name} permite até ${pkgConfig.maxItems} anúncios.`, variant: "destructive" }); return; }
    if (isExpired && subscription) { toast({ title: "Assinatura expirada!", description: "Renove seu plano.", variant: "destructive" }); return; }

    setSaving(true);

    const numOrNull = (v: string) => v ? parseFloat(v) : null;
    const intOrNull = (v: string) => v ? parseInt(v) : null;
    const strOrNull = (v: string) => v?.trim() || null;
    const boolOrNull = (v: boolean) => v || null;
    const arrOrNull = (v: string[]) => v.length > 0 ? v : null;

    const payload: any = {
      user_id: user.id,
      seller_id: profile.id,
      title: form.title,
      description: strOrNull(form.description),
      category: form.category as ItemCategory,
      seller_type: "imoveis" as const,
      price: numOrNull(form.price),
      city: strOrNull(form.city),
      state: strOrNull(form.state),
      neighborhood: strOrNull(form.neighborhood),
      address: [form.address, form.addressNumber].filter(Boolean).join(", ") || null,
      cep: strOrNull(form.cep),
      tags: isAluguel ? [...new Set([...form.tags, "aluguel_flex" as ItemTag])] : form.tags.filter(t => t !== "aluguel_flex"),
      photos: form.photos,
      brand: strOrNull(form.brand),
      model: strOrNull(form.model),
      year: intOrNull(form.year),
      mileage: intOrNull(form.mileage),
      fuel: strOrNull(form.fuel),
      transmission: strOrNull(form.transmission),
      color: strOrNull(form.color),
      bedrooms: intOrNull(form.bedrooms),
      bathrooms: intOrNull(form.bathrooms),
      area: numOrNull(form.area),
      parking_spots: intOrNull(form.parking_spots),
      video_url: strOrNull(form.video_url),
      // New fields
      property_subtype: strOrNull(form.property_subtype),
      finality: isAluguel ? "aluguel" : "venda",
      built_area: numOrNull(form.built_area),
      suites: intOrNull(form.suites),
      living_rooms: intOrNull(form.living_rooms),
      kitchen_type: strOrNull(form.kitchen_type),
      service_area: boolOrNull(form.service_area),
      backyard: boolOrNull(form.backyard),
      pool: boolOrNull(form.pool),
      barbecue: boolOrNull(form.barbecue),
      balcony: boolOrNull(form.balcony),
      garden: boolOrNull(form.garden),
      furnished: boolOrNull(form.furnished),
      accepts_financing: boolOrNull(form.accepts_financing),
      documentation: strOrNull(form.documentation),
      condo_fee: numOrNull(form.condo_fee),
      iptu: numOrNull(form.iptu),
      floor_number: intOrNull(form.floor_number),
      has_elevator: boolOrNull(form.has_elevator),
      doorman_24h: boolOrNull(form.doorman_24h),
      leisure_amenities: arrOrNull(form.leisure_amenities),
      ceiling_height: numOrNull(form.ceiling_height),
      has_dock: boolOrNull(form.has_dock),
      internal_office: boolOrNull(form.internal_office),
      three_phase_power: boolOrNull(form.three_phase_power),
      truck_access: boolOrNull(form.truck_access),
      zoning: strOrNull(form.zoning),
      security: strOrNull(form.security),
      lot_front: numOrNull(form.lot_front),
      lot_depth: numOrNull(form.lot_depth),
      topography: strOrNull(form.topography),
      infrastructure: arrOrNull(form.infrastructure),
      has_showcase: boolOrNull(form.has_showcase),
      has_ac: boolOrNull(form.has_ac),
      foot_traffic: strOrNull(form.foot_traffic),
      ideal_for: strOrNull(form.ideal_for),
      show_financing: form.show_financing || false,
      show_street_view: form.show_street_view ?? true,
      partnership_enabled: form.partnership_enabled || false,
      commission_percent: numOrNull(form.commission_percent),
      partner_percent: numOrNull(form.partner_percent),
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

  const renderPropertyFields = () => {
    const cat = form.category;
    if (!cat) return null;

    const categoryLabels: Record<string, string> = {
      casa: "🏠 Dados da Casa",
      apartamento: "🏢 Dados do Apartamento",
      flat: "🏢 Dados do Flat",
      terreno: "🌳 Dados do Terreno",
      comercial: "🏪 Dados do Comercial",
      galpao: "🏭 Dados do Galpão",
    };

    return (
      <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
        <h2 className="font-display font-bold text-foreground">{categoryLabels[cat] || "Dados do Imóvel"}</h2>
        {(cat === "casa" || cat === "flat") && <PropertyFieldsCasa form={form} setForm={setForm} />}
        {cat === "apartamento" && <PropertyFieldsApartamento form={form} setForm={setForm} />}
        {cat === "terreno" && <PropertyFieldsTerreno form={form} setForm={setForm} />}
        {(cat === "comercial" || cat === "galpao") && <PropertyFieldsComercial form={form} setForm={setForm} category={cat} />}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="gradient-hero py-6">
        <div className="container max-w-3xl mx-auto px-4 flex items-center gap-3">
          <button onClick={() => navigate("/painel")} className="p-2 rounded-xl bg-white/20 text-white hover:bg-white/30">
            <ArrowLeft size={18} />
          </button>
          <h1 className="font-display font-bold text-xl text-white">{isEdit ? "Editar Anúncio" : "Novo Anúncio"}</h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="container max-w-3xl mx-auto px-4 py-6 space-y-6">
        {/* Limit Warning */}
        {isAtLimit && (
          <div className="bg-red-500/10 border-2 border-red-500/30 rounded-2xl p-4 flex flex-col sm:flex-row items-center gap-3">
            <Lock size={20} className="text-red-500 flex-shrink-0" />
            <div className="flex-1 text-center sm:text-left">
              <p className="font-bold text-red-600 text-sm">Limite de anúncios atingido!</p>
              <p className="text-xs text-muted-foreground">Seu plano {pkgConfig.name} permite até {pkgConfig.maxItems} anúncios.</p>
            </div>
            <a href="/pacotes" className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90">Ver Pacotes</a>
          </div>
        )}

        {isExpired && subscription && (
          <div className="bg-amber-500/10 border-2 border-amber-500/30 rounded-2xl p-4 flex flex-col sm:flex-row items-center gap-3">
            <Lock size={20} className="text-amber-500 flex-shrink-0" />
            <div className="flex-1 text-center sm:text-left">
              <p className="font-bold text-amber-600 text-sm">Assinatura expirada!</p>
              <p className="text-xs text-muted-foreground">Renove para publicar.</p>
            </div>
            <a href="/pacotes" className="px-4 py-2 rounded-xl bg-amber-500 text-white text-xs font-bold hover:bg-amber-600">Renovar</a>
          </div>
        )}

        {/* Category Selection - Visual Cards */}
        <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
          <h2 className="font-display font-bold text-foreground">Tipo de Imóvel *</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {propertyCategories.map((cat) => (
              <button
                key={cat.value}
                type="button"
                onClick={() => setForm((f) => ({ ...f, category: cat.value }))}
                className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all text-center ${
                  form.category === cat.value
                    ? "border-primary bg-primary/10 shadow-md"
                    : "border-input bg-background hover:border-primary/30"
                }`}
              >
                <span className="text-2xl">{cat.emoji}</span>
                <span className={`text-sm font-semibold ${form.category === cat.value ? "text-primary" : "text-foreground"}`}>{cat.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Basic Info */}
        <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
          <h2 className="font-display font-bold text-foreground">Informações Básicas</h2>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Título do Anúncio *</label>
            <input required value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl border border-input bg-background text-foreground text-sm focus:ring-2 focus:ring-ring focus:outline-none"
              placeholder="Ex: Casa 3 quartos com piscina no Centro" />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Tipo de anúncio</label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Para Venda", value: false, emoji: "💰" },
                { label: "Para Aluguel", value: true, emoji: "🏠" },
              ].map((option) => (
                <button
                  key={option.label}
                  type="button"
                  onClick={() => setIsAluguel(option.value)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all ${
                    isAluguel === option.value ? "border-primary bg-primary/10 shadow-sm" : "border-input bg-background hover:border-primary/30"
                  }`}
                >
                  <span className="text-xl">{option.emoji}</span>
                  <span className={`text-sm font-semibold ${isAluguel === option.value ? "text-primary" : "text-foreground"}`}>{option.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Preço (R$) {isAluguel && <span className="text-primary font-normal">/Mês</span>}</label>
            <input type="number" step="0.01" value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl border border-input bg-background text-foreground text-sm focus:ring-2 focus:ring-ring focus:outline-none" placeholder="0,00" />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Descrição</label>
            <textarea rows={4} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl border border-input bg-background text-foreground text-sm focus:ring-2 focus:ring-ring focus:outline-none resize-none"
              placeholder="Descreva o imóvel com detalhes..." />
          </div>
        </div>

        {/* Location */}
        <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
          <h2 className="font-display font-bold text-foreground flex items-center gap-2"><MapPin size={16} className="text-primary" /> Localização</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Estado</label>
              <select value={form.state} onChange={(e) => setForm((f) => ({ ...f, state: e.target.value, city: "", neighborhood: "" }))}
                className="w-full px-4 py-3 rounded-xl border border-input bg-background text-foreground text-sm focus:ring-2 focus:ring-ring focus:outline-none">
                <option value="">Selecione o estado</option>
                {BRAZIL_STATES.map((s) => <option key={s.uf} value={s.uf}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Cidade</label>
              <select value={form.city} onChange={(e) => setForm((f) => ({ ...f, city: e.target.value, neighborhood: "" }))}
                className="w-full px-4 py-3 rounded-xl border border-input bg-background text-foreground text-sm focus:ring-2 focus:ring-ring focus:outline-none"
                disabled={!form.state || citiesLoading}>
                <option value="">{citiesLoading ? "Carregando..." : "Selecione a cidade"}</option>
                {ibgeCities.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Bairro</label>
            {form.city && ES_NEIGHBORHOODS[form.city] ? (
              <select value={form.neighborhood} onChange={(e) => setForm((f) => ({ ...f, neighborhood: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl border border-input bg-background text-foreground text-sm focus:ring-2 focus:ring-ring focus:outline-none">
                <option value="">Selecione o bairro</option>
                {ES_NEIGHBORHOODS[form.city].map((b) => <option key={b} value={b}>{b}</option>)}
              </select>
            ) : (
              <input value={form.neighborhood} onChange={(e) => setForm((f) => ({ ...f, neighborhood: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl border border-input bg-background text-foreground text-sm focus:ring-2 focus:ring-ring focus:outline-none"
                placeholder={form.city ? "Digite o bairro" : "Selecione a cidade primeiro"} />
            )}
          </div>
          <div className="grid grid-cols-3 gap-3">
            <input value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
              className="col-span-2 px-4 py-3 rounded-xl border border-input bg-background text-foreground text-sm focus:ring-2 focus:ring-ring focus:outline-none" placeholder="Endereço (opcional)" />
            <input value={form.addressNumber} onChange={(e) => setForm((f) => ({ ...f, addressNumber: e.target.value }))}
              className="px-4 py-3 rounded-xl border border-input bg-background text-foreground text-sm focus:ring-2 focus:ring-ring focus:outline-none" placeholder="Número" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">CEP (busca rua, bairro, cidade e estado no Brasil)</label>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                value={form.cep}
                onChange={(e) => {
                  const raw = e.target.value.replace(/\D/g, "").slice(0, 8);
                  const formatted = raw.length > 5 ? `${raw.slice(0, 5)}-${raw.slice(5)}` : raw;
                  setForm((f) => ({ ...f, cep: formatted }));
                }}
                className="flex-1 px-4 py-3 rounded-xl border border-input bg-background text-foreground text-sm focus:ring-2 focus:ring-ring focus:outline-none"
                placeholder="29705-037"
                inputMode="numeric"
              />
              <button
                type="button"
                onClick={handleCepLookup}
                disabled={fetchingCep || form.cep.replace(/\D/g, "").length !== 8}
                className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {fetchingCep ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
                Buscar CEP
              </button>
            </div>
          </div>
        </div>

        {/* Dynamic Property Fields */}
        {renderPropertyFields()}

        {/* Tags */}
        <div className="bg-card border border-border rounded-2xl p-5 space-y-5">
          <div>
            <h2 className="font-display font-bold text-foreground mb-1">Tags de Destaque</h2>
            <p className="text-xs text-muted-foreground">Selecione até {MAX_TAGS} tags. ({form.tags.length}/{MAX_TAGS})</p>
            {currentTier === "basico" && (
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1"><Lock size={10} /> Tags de valor são exclusivas para planos pagos</p>
            )}
          </div>

          {/* Auto-suggestions */}
          {suggestedTags.length > 0 && form.tags.length < MAX_TAGS && (
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-3">
              <p className="text-xs font-semibold text-primary mb-2">💡 Sugestões automáticas:</p>
              <div className="flex flex-wrap gap-2">
                {suggestedTags.slice(0, 3).map((tagValue) => (
                  <button key={tagValue} type="button" onClick={() => toggleTag(tagValue as ItemTag)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold ${getTagStyle(tagValue)} opacity-80 hover:opacity-100 transition-all flex items-center gap-1 border border-white/20`}>
                    {getTagEmoji(tagValue)} {getTagLabel(tagValue)}
                    <span className="ml-1 text-[10px] opacity-70">+ Adicionar</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {Object.entries(TAG_CATEGORIES).map(([catKey, catConfig]) => {
            const isLocked = currentTier === "basico" && catKey === "valor";
            return (
              <div key={catKey}>
                <h3 className={`text-xs font-bold uppercase tracking-wider mb-2 ${categoryHeaderStyles[catKey] || "text-muted-foreground"}`}>
                  {catConfig.label}
                  {isLocked && <span className="ml-1 text-muted-foreground">🔒</span>}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {catConfig.tags.map((tagValue) => {
                    const selected = form.tags.includes(tagValue as ItemTag);
                    const locked = isLocked;
                    const disabled = locked || (!selected && form.tags.length >= MAX_TAGS);
                    return (
                      <button key={tagValue} type="button"
                        onClick={() => !disabled && toggleTag(tagValue as ItemTag)}
                        disabled={disabled}
                        className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all duration-200 flex items-center gap-1.5 shadow-sm ${getTagStyle(tagValue)} ${
                          selected ? "ring-2 ring-white/40 scale-105 shadow-lg" : disabled ? "opacity-30 cursor-not-allowed" : "opacity-60 hover:opacity-100 hover:scale-105 hover:shadow-md"
                        }`}>
                        <span>{getTagEmoji(tagValue)}</span>
                        {getTagLabel(tagValue)}
                        {selected && <span className="ml-0.5 w-4 h-4 rounded-full bg-white/25 flex items-center justify-center text-[10px]">✓</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Photos */}
        <div className="bg-card border border-border rounded-2xl p-5">
          <h2 className="font-display font-bold text-foreground mb-3">Fotos</h2>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
            {form.photos.map((photo, i) => (
              <div key={i} className="relative aspect-square rounded-xl overflow-hidden border border-border">
                <img src={photo} alt="" className="w-full h-full object-cover" />
                <button type="button" onClick={() => removePhoto(i)} className="absolute top-1 right-1 p-1 rounded-full bg-destructive text-white"><X size={12} /></button>
              </div>
            ))}
            <label className="aspect-square rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 transition-colors">
              {uploading ? <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" /> : (
                <><Upload size={20} className="text-muted-foreground mb-1" /><span className="text-xs text-muted-foreground">Adicionar</span></>
              )}
              <input type="file" multiple accept="image/*" onChange={handlePhotoUpload} className="hidden" />
            </label>
          </div>
        </div>

        {/* Video */}
        <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
          <div className="flex items-center gap-2"><Video size={18} className="text-primary" /><h2 className="font-display font-bold text-foreground">Vídeo (opcional)</h2></div>
          <p className="text-xs text-muted-foreground">Cole o link de um vídeo do YouTube.</p>
          <input value={form.video_url} onChange={(e) => setForm((f) => ({ ...f, video_url: e.target.value }))}
            className="w-full px-4 py-3 rounded-xl border border-input bg-background text-foreground text-sm focus:ring-2 focus:ring-ring focus:outline-none" placeholder="https://www.youtube.com/watch?v=..." />
        </div>

        {/* Financing Simulator Toggle */}
        {!isAluguel && (
          <div className="bg-card border border-border rounded-2xl p-5">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={form.show_financing}
                onChange={(e) => setForm((f) => ({ ...f, show_financing: e.target.checked }))}
                className="w-5 h-5 rounded border-border text-primary focus:ring-primary"
              />
              <div>
                <p className="font-display font-bold text-foreground text-sm">💰 Simular Financiamento</p>
                <p className="text-xs text-muted-foreground">Exibir simulador de financiamento bancário na página do imóvel</p>
              </div>
            </label>
          </div>
        )}

        {/* Street View Toggle */}
        <div className="bg-card border border-border rounded-2xl p-5">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={form.show_street_view}
              onChange={(e) => setForm((f) => ({ ...f, show_street_view: e.target.checked }))}
              className="w-5 h-5 mt-0.5 rounded border-border text-primary focus:ring-primary"
            />
            <div className="flex-1">
              <p className="font-display font-bold text-foreground text-sm">👁️ Mostrar botão de Street View 360°</p>
              <p className="text-xs text-muted-foreground mt-1">
                Exibe um botão sobre o mapa do imóvel que abre o <strong>Google Street View</strong> em uma nova aba, posicionado no endereço cadastrado.
                O visitante pode "andar" virtualmente pela rua e ver a fachada e o entorno do imóvel em 360°.
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                💡 <strong>Dica:</strong> Desative se o imóvel estiver em uma rua sem cobertura do Street View, em condomínio fechado ou se preferir não revelar o entorno.
              </p>
            </div>
          </label>
        </div>

        {/* Partnership */}
        <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={form.partnership_enabled}
              onChange={(e) => setForm((f) => ({ ...f, partnership_enabled: e.target.checked }))}
              className="w-5 h-5 rounded border-border text-primary focus:ring-primary"
            />
            <div>
              <p className="font-display font-bold text-foreground text-sm">🤝 Disponível para Parceria</p>
              <p className="text-xs text-muted-foreground">Permitir que outros corretores solicitem parceria neste imóvel</p>
            </div>
          </label>

          {form.partnership_enabled && (
            <div className="space-y-3 pt-2 border-t border-border">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-foreground mb-1 block">Comissão Total (%)</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="100"
                    value={form.commission_percent}
                    onChange={(e) => setForm((f) => ({ ...f, commission_percent: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl border border-input bg-background text-foreground text-sm focus:ring-2 focus:ring-ring focus:outline-none"
                    placeholder="Ex: 6"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-foreground mb-1 block">% do Parceiro</label>
                  <input
                    type="number"
                    step="5"
                    min="0"
                    max="100"
                    value={form.partner_percent}
                    onChange={(e) => setForm((f) => ({ ...f, partner_percent: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl border border-input bg-background text-foreground text-sm focus:ring-2 focus:ring-ring focus:outline-none"
                    placeholder="Ex: 50"
                  />
                </div>
              </div>

              {/* Auto calculation preview */}
              {form.price && form.commission_percent && form.partner_percent && (() => {
                const price = parseFloat(form.price);
                const comm = parseFloat(form.commission_percent);
                const partnerPct = parseFloat(form.partner_percent);
                if (!price || !comm || !partnerPct) return null;
                const total = price * (comm / 100);
                const partnerGain = total * (partnerPct / 100);
                const ownerGain = total - partnerGain;
                const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
                return (
                  <div className="bg-secondary/50 rounded-xl p-3 space-y-2">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Simulação de Comissão</p>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="bg-primary/10 rounded-lg p-2">
                        <p className="text-[10px] text-muted-foreground">Total</p>
                        <p className="font-bold text-xs text-primary">{fmt(total)}</p>
                      </div>
                      <div className="bg-green-500/10 rounded-lg p-2">
                        <p className="text-[10px] text-muted-foreground">Parceiro</p>
                        <p className="font-bold text-xs text-green-600">{fmt(partnerGain)}</p>
                      </div>
                      <div className="bg-accent/10 rounded-lg p-2">
                        <p className="text-[10px] text-muted-foreground">Você</p>
                        <p className="font-bold text-xs text-accent">{fmt(ownerGain)}</p>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
        </div>

        <button type="submit" disabled={saving || (isAtLimit && !isEdit) || (isExpired && !!subscription)}
          className="w-full py-4 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg">
          {saving ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : (
            <><Save size={16} /> {isEdit ? "Salvar Alterações" : "Publicar Anúncio"}</>
          )}
        </button>
      </form>
    </div>
  );
}
