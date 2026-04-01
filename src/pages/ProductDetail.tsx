import { useState, useRef, useEffect } from "react";
import { useParams, Link, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ChevronLeft, ChevronRight, MessageCircle, Share2, Star, MapPin, Tag, Store, Image, X, ZoomIn, BadgeCheck, Video, FileDown } from "lucide-react";
import { generateProposalPdf } from "@/lib/generateProposalPdf";
import QRCodeDisplay from "@/components/QRCodeDisplay";
import FinancingSimulator from "@/components/FinancingSimulator";
import PackageBadge from "@/components/PackageBadge";
import { useWhatsAppPicker } from "@/components/WhatsAppTeamPicker";
import { formatPrice, getTagStyle, getTagLabel } from "@/data/products";
import { supabase } from "@/integrations/supabase/client";
import { trackSellerEvent } from "@/hooks/useSellerAnalytics";
import { useToast } from "@/hooks/use-toast";
import MapEmbed from "@/components/MapEmbed";

function isUUID(str: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
}

export default function ProductDetail() {
  const { productId } = useParams();
  const [searchParams] = useSearchParams();
  const corretorSlug = searchParams.get("corretor");
  const { toast } = useToast();
  const { openWhatsApp } = useWhatsAppPicker();
  const [activeImage, setActiveImage] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const carouselRef = useRef<HTMLDivElement>(null);
  const [dbItem, setDbItem] = useState<any>(null);
  const [dbSeller, setDbSeller] = useState<any>(null);
  const [teamMember, setTeamMember] = useState<any>(null);
  const [sellerTier, setSellerTier] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDb, setIsDb] = useState(false);
  const [relatedItems, setRelatedItems] = useState<any[]>([]);

  useEffect(() => {
    if (productId && isUUID(productId)) {
      setIsDb(true);
      fetchDbItem(productId);
    } else {
      setIsDb(false);
      setLoading(false);
    }
  }, [productId]);

  const fetchDbItem = async (id: string) => {
    const { data: item } = await supabase.from("seller_items").select("*").eq("id", id).maybeSingle();
    if (item) {
      setDbItem(item);
      const { data: seller } = await supabase.from("profiles").select("*").eq("id", item.seller_id).maybeSingle();
      setDbSeller(seller);
      // Fetch team member if corretor slug is present
      if (corretorSlug) {
        const { data: member } = await supabase
          .from("team_members")
          .select("*")
          .eq("company_id", item.seller_id)
          .eq("slug", corretorSlug)
          .eq("is_active", true)
          .maybeSingle();
        if (member) setTeamMember(member);
      }
      // Fetch seller subscription tier
      const { data: subData } = await supabase
        .from("seller_subscriptions")
        .select("tier")
        .eq("seller_id", item.seller_id)
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(1);
      if (subData && subData.length > 0) setSellerTier(subData[0].tier);
      trackSellerEvent(item.seller_id, "view", item.id, teamMember?.id);
    }
    setLoading(false);
  };

  // Keyboard navigation for lightbox
  useEffect(() => {
    if (!lightboxOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightboxOpen(false);
      if (e.key === "ArrowRight") setActiveImage((p) => (p + 1) % images.length);
      if (e.key === "ArrowLeft") setActiveImage((p) => (p - 1 + images.length) % images.length);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [lightboxOpen]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const product = isDb ? dbItem : null;
  const company = isDb
    ? dbSeller
      ? {
          id: dbSeller.id,
          name: dbSeller.company_name || dbSeller.full_name,
          logo: dbSeller.logo_url || "",
          address: [dbSeller.address, dbSeller.city, dbSeller.state].filter(Boolean).join(", "),
          whatsapp: dbSeller.phone || "",
          rating: "5.0",
          reviewCount: 0,
          segment: dbSeller.seller_type,
          sellerCategory: dbSeller.seller_category,
        }
      : null
    : null;

  // Override with team member data when ?corretor= is present
  if (teamMember && company) {
    company.name = teamMember.full_name;
    company.whatsapp = teamMember.phone || company.whatsapp;
    if (teamMember.photo_url) company.logo = teamMember.photo_url;
  }

  if (!product || !company) {
    return (
      <div className="container max-w-6xl mx-auto px-4 py-20 text-center">
        <h1 className="font-display font-bold text-2xl text-foreground">Anúncio não encontrado</h1>
        <Link to="/" className="text-primary text-sm mt-4 inline-block hover:underline">Voltar ao início</Link>
      </div>
    );
  }

  const isProperty = true;
  const isAluguel = isDb
    ? ((product.tags || []).includes("aluguel_flex") || product.category === "aluguel")
    : false;

  const images: string[] = isDb ? (product.photos?.length > 0 ? product.photos : []) : product.images;
  const title = product.title;
  const price = product.price;
  const description = product.description;
  const tags: string[] = isDb ? (product.tags || []).filter((t: string) => t !== "aluguel_flex") : (product.tag ? [product.tag] : []);
  const companyUrl = teamMember 
    ? `/empresa/${dbSeller?.slug || dbSeller?.id}?corretor=${teamMember.slug}` 
    : `/empresa/${company.id}`;
  const formattedPrice = isDb
    ? price ? `R$ ${Number(price).toLocaleString("pt-BR")}` : ""
    : formatPrice(price);
  const productUrl = window.location.href;
  const handleWhatsAppClick = (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    if (isDb && dbItem) trackSellerEvent(dbItem.seller_id, "whatsapp_click", dbItem.id, teamMember?.id);
    // When a specific broker is selected, go directly to their WhatsApp
    if (teamMember && teamMember.phone) {
      const phone = teamMember.phone.replace(/\D/g, "");
      const msg = `Olá ${teamMember.full_name}! 🏠 Vi o imóvel *${title}* - ${formattedPrice} na sua loja e gostaria de mais informações.\n\n🔗 ${productUrl}`;
      window.open(`https://wa.me/55${phone}?text=${encodeURIComponent(msg)}`, "_blank");
      return;
    }
    openWhatsApp({
      sellerId: company.id,
      sellerName: company.name,
      sellerPhone: company.whatsapp,
      title: `${title} - ${formattedPrice}`,
      link: productUrl,
    });
  };
  const mapAddress = isDb
    ? [product.address, product.neighborhood, product.city, product.state].filter(Boolean).join(", ") || company.address
    : (isProperty && product.location ? product.location : company.address);

  const specs: Record<string, string> = {};
  if (isDb) {
    const p = product as any;
    // Subtipo
    const subtypeLabels: Record<string, string> = { terrea: "Térrea", sobrado: "Sobrado", condominio: "Condomínio", apartamento: "Apartamento", cobertura: "Cobertura", kitnet: "Kitnet", urbano: "Urbano", rural: "Rural", galpao: "Galpão", sala: "Sala", loja: "Loja", ponto_comercial: "Ponto Comercial", deposito: "Depósito", barracao: "Barracão" };
    if (p.property_subtype) specs["Tipo"] = subtypeLabels[p.property_subtype] || p.property_subtype;
    if (p.finality && p.finality !== "venda") specs["Finalidade"] = p.finality === "aluguel" ? "Aluguel" : "Venda";
    
    // Medidas
    if (p.area) specs["Área Total"] = `${p.area} m²`;
    if (p.built_area) specs["Área Construída"] = `${p.built_area} m²`;
    if (p.lot_front) specs["Frente"] = `${p.lot_front} m`;
    if (p.lot_depth) specs["Fundo"] = `${p.lot_depth} m`;
    if (p.ceiling_height) specs["Pé Direito"] = `${p.ceiling_height} m`;
    
    // Cômodos
    if (p.bedrooms) specs["Quartos"] = String(p.bedrooms);
    if (p.suites) specs["Suítes"] = String(p.suites);
    if (p.bathrooms) specs["Banheiros"] = String(p.bathrooms);
    if (p.living_rooms) specs["Salas"] = String(p.living_rooms);
    if (p.parking_spots) specs["Vagas"] = String(p.parking_spots);
    if (p.floor_number) specs["Andar"] = String(p.floor_number);
    
    // Cozinha
    const kitchenLabels: Record<string, string> = { americana: "Americana", planejada: "Planejada", simples: "Simples" };
    if (p.kitchen_type) specs["Cozinha"] = kitchenLabels[p.kitchen_type] || p.kitchen_type;
    
    // Terreno
    const topoLabels: Record<string, string> = { plano: "Plano", aclive: "Aclive", declive: "Declive" };
    if (p.topography) specs["Topografia"] = topoLabels[p.topography] || p.topography;
    
    // Documentação
    if (p.documentation) specs["Documentação"] = p.documentation === "regular" ? "Regular" : "Irregular";
    
    // Valores
    if (p.condo_fee) specs["Condomínio"] = `R$ ${Number(p.condo_fee).toLocaleString("pt-BR")}`;
    if (p.iptu) specs["IPTU"] = `R$ ${Number(p.iptu).toLocaleString("pt-BR")}/ano`;
    
    // Comercial
    if (p.zoning) specs["Zoneamento"] = p.zoning;
    if (p.security) specs["Segurança"] = p.security;
    const trafficLabels: Record<string, string> = { alto: "Alto", medio: "Médio", baixo: "Baixo" };
    if (p.foot_traffic) specs["Fluxo de Pessoas"] = trafficLabels[p.foot_traffic] || p.foot_traffic;
    if (p.ideal_for) specs["Ideal para"] = p.ideal_for;
    
    // Booleans
    const boolSpecs: [string, string][] = [
      ["furnished", "Mobiliado"], ["pool", "Piscina"], ["barbecue", "Churrasqueira"],
      ["balcony", "Varanda"], ["garden", "Jardim"], ["backyard", "Quintal"],
      ["service_area", "Área de Serviço"], ["has_elevator", "Elevador"],
      ["doorman_24h", "Portaria 24h"], ["accepts_financing", "Aceita Financiamento"],
      ["has_dock", "Docas"], ["internal_office", "Escritório Interno"],
      ["three_phase_power", "Energia Trifásica"], ["truck_access", "Acesso Caminhão"],
      ["has_showcase", "Vitrine"], ["has_ac", "Ar-Condicionado"],
    ];
    boolSpecs.forEach(([key, label]) => { if (p[key]) specs[label] = "Sim"; });
    
    // Arrays
    if (p.leisure_amenities?.length) {
      const leisureLabels: Record<string, string> = { piscina: "Piscina", academia: "Academia", salao_festas: "Salão de Festas", playground: "Playground", churrasqueira: "Churrasqueira", sauna: "Sauna", quadra: "Quadra" };
      specs["Área de Lazer"] = p.leisure_amenities.map((a: string) => leisureLabels[a] || a).join(", ");
    }
    if (p.infrastructure?.length) {
      const infraLabels: Record<string, string> = { agua: "Água", luz: "Luz", esgoto: "Esgoto", asfalto: "Asfalto", internet: "Internet" };
      specs["Infraestrutura"] = p.infrastructure.map((a: string) => infraLabels[a] || a).join(", ");
    }
    
    // Localização
    if (p.city) specs["Cidade"] = p.city;
    if (p.neighborhood) specs["Bairro"] = p.neighborhood;
    
    // Veículos (legado)
    if (p.brand) specs["Marca"] = p.brand;
    if (p.model) specs["Modelo"] = p.model;
    if (p.year) specs["Ano"] = String(p.year);
    if (p.mileage) specs["Quilometragem"] = `${Number(p.mileage).toLocaleString("pt-BR")} km`;
    if (p.fuel) specs["Combustível"] = p.fuel;
    if (p.transmission) specs["Câmbio"] = p.transmission;
    if (p.color) specs["Cor"] = p.color;
  }
  const displaySpecs = isDb ? specs : product.specs;
  const relatedProducts: any[] = [];

  const scrollCarousel = (dir: "left" | "right") => {
    if (!carouselRef.current) return;
    const scrollAmount = carouselRef.current.clientWidth * 0.8;
    carouselRef.current.scrollBy({ left: dir === "left" ? -scrollAmount : scrollAmount, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Banner - always shows active image */}
      <section className="relative">
        <div className="aspect-[16/9] md:aspect-[21/7] overflow-hidden bg-muted">
          {images.length > 0 ? (
            <AnimatePresence mode="wait">
              <motion.img
                key={activeImage}
                initial={{ opacity: 0, scale: 1.02 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
                src={images[activeImage]}
                alt={title}
                className="w-full h-full object-cover"
              />
            </AnimatePresence>
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-muted">
              <Image size={64} className="text-muted-foreground" />
            </div>
          )}
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent pointer-events-none" />
        <div className="absolute top-4 left-4 z-20">
          <Link to={companyUrl} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-card/70 backdrop-blur-md text-foreground text-sm font-medium hover:bg-card/90 transition-colors">
            <ArrowLeft size={16} /> Voltar
          </Link>
        </div>
        {tags.length > 0 && (
          <div className="absolute top-4 right-4 z-20 flex flex-wrap gap-1.5 justify-end max-w-[60%]">
            {tags.map((t) => (
              <span key={t} className={`px-3 py-1.5 rounded-lg text-xs font-bold shadow-lg ${getTagStyle(t)}`}>
                <Tag size={12} className="inline mr-1 mb-0.5" />{getTagLabel(t)}
              </span>
            ))}
          </div>
        )}
        {/* Hero image counter */}
        {images.length > 1 && (
          <div className="absolute bottom-4 right-4 z-20 flex items-center gap-2">
            <button onClick={() => setActiveImage((p) => (p - 1 + images.length) % images.length)}
              className="w-9 h-9 rounded-full bg-card/70 backdrop-blur-md flex items-center justify-center text-foreground hover:bg-card/90 transition-colors">
              <ChevronLeft size={18} />
            </button>
            <span className="px-3 py-1.5 rounded-lg bg-card/70 backdrop-blur-md text-xs font-bold text-foreground">
              {activeImage + 1} / {images.length}
            </span>
            <button onClick={() => setActiveImage((p) => (p + 1) % images.length)}
              className="w-9 h-9 rounded-full bg-card/70 backdrop-blur-md flex items-center justify-center text-foreground hover:bg-card/90 transition-colors">
              <ChevronRight size={18} />
            </button>
          </div>
        )}
      </section>

      {/* Gallery Grid - full quality photos */}
      {images.length > 0 && (
        <div className="container max-w-6xl mx-auto px-4 -mt-16 md:-mt-20 z-10 relative">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-2 md:grid md:grid-cols-5 md:overflow-visible md:snap-none md:pb-0">
            {images.map((img: string, i: number) => (
              <motion.button
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => { setActiveImage(i); setLightboxOpen(true); }}
                className={`relative flex-shrink-0 w-20 h-20 md:w-auto md:h-auto md:aspect-square snap-start rounded-xl overflow-hidden border-2 transition-all group ${
                  activeImage === i
                    ? "border-primary shadow-lg ring-2 ring-primary/30"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <img src={img} alt={`Foto ${i + 1}`} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" loading="lazy" />
                <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/10 transition-colors flex items-center justify-center">
                  <ZoomIn size={20} className="text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" />
                </div>
                {activeImage === i && (
                  <div className="absolute bottom-1.5 left-1.5 px-2 py-0.5 rounded-md bg-primary text-primary-foreground text-[10px] font-bold">
                    Exibindo
                  </div>
                )}
              </motion.button>
            ))}
          </div>
        </div>
      )}

      {/* Lightbox - fullscreen photo viewer */}
      <AnimatePresence>
        {lightboxOpen && images.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-foreground/95 flex items-center justify-center"
            onClick={() => setLightboxOpen(false)}
          >
            <button className="absolute top-4 right-4 z-50 w-10 h-10 rounded-full bg-card/20 backdrop-blur flex items-center justify-center text-white hover:bg-card/40 transition-colors">
              <X size={20} />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); setActiveImage((p) => (p - 1 + images.length) % images.length); }}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-50 w-12 h-12 rounded-full bg-card/20 backdrop-blur flex items-center justify-center text-white hover:bg-card/40 transition-colors"
            >
              <ChevronLeft size={24} />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); setActiveImage((p) => (p + 1) % images.length); }}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-50 w-12 h-12 rounded-full bg-card/20 backdrop-blur flex items-center justify-center text-white hover:bg-card/40 transition-colors"
            >
              <ChevronRight size={24} />
            </button>
            <motion.img
              key={activeImage}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              src={images[activeImage]}
              alt={title}
              className="max-w-[90vw] max-h-[85vh] object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2">
              {images.map((_, i) => (
                <button
                  key={i}
                  onClick={(e) => { e.stopPropagation(); setActiveImage(i); }}
                  className={`w-2.5 h-2.5 rounded-full transition-all ${activeImage === i ? "bg-white scale-125" : "bg-white/40 hover:bg-white/70"}`}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content */}
      <div className="container max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <div className="flex items-center gap-2 flex-wrap">
                <p className={`text-xs font-bold uppercase tracking-wider ${isProperty ? "text-primary" : "text-accent"}`}>
                  {isProperty ? "Imóvel" : "Veículo"} {isDb ? `• ${product.category}` : ""}
                </p>
              </div>
              <h1 className="font-display font-bold text-2xl md:text-4xl text-foreground mt-1 leading-tight">{title}</h1>
              {formattedPrice && (
                <div className="flex items-baseline gap-3 mt-3">
                  <p className="font-display font-bold text-3xl md:text-4xl text-emerald-500">
                    {formattedPrice}
                    {isAluguel && <span className="text-lg font-normal text-muted-foreground"> /mês</span>}
                  </p>
                  {isAluguel && (
                    <span className="px-3 py-1 rounded-full text-xs font-bold shadow bg-primary text-primary-foreground">
                      🏠 Aluguel
                    </span>
                  )}
                </div>
              )}
            </motion.div>

            {description && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                <h2 className="font-display font-semibold text-lg text-foreground mb-2">Descrição</h2>
                <p className="text-muted-foreground leading-relaxed">{description}</p>
              </motion.div>
            )}

            {/* Video embed */}
            {isDb && (product as any).video_url && (() => {
              const match = (product as any).video_url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([a-zA-Z0-9_-]{11})/);
              const videoId = match?.[1];
              return videoId ? (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
                  <h2 className="font-display font-semibold text-lg text-foreground mb-3 flex items-center gap-2">
                    <Video size={18} className="text-primary" />
                    Vídeo do Imóvel
                  </h2>
                  <div className="aspect-video rounded-2xl overflow-hidden border border-border bg-muted">
                    <iframe
                      src={`https://www.youtube.com/embed/${videoId}`}
                      title="Vídeo do imóvel"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="w-full h-full"
                    />
                  </div>
                </motion.div>
              ) : null;
            })()}
            {Object.keys(displaySpecs).length > 0 && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                <h2 className="font-display font-semibold text-lg text-foreground mb-3">Especificações</h2>
                <div className="bg-card border border-border rounded-2xl overflow-hidden">
                  {Object.entries(displaySpecs).map(([key, value], i) => (
                    <div key={key} className={`flex items-center justify-between px-5 py-3.5 ${i % 2 === 0 ? "bg-card" : "bg-muted/50"} ${i < Object.entries(displaySpecs).length - 1 ? "border-b border-border" : ""}`}>
                      <span className="text-sm text-muted-foreground font-medium">{key}</span>
                      <span className="text-sm text-foreground font-semibold">{String(value)}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {mapAddress && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                <h2 className="font-display font-semibold text-lg text-foreground mb-3 flex items-center gap-2">
                  <MapPin size={18} className="text-primary" />
                  {isProperty ? "Localização do Imóvel" : "Localização da Loja"}
                </h2>
                <MapEmbed address={mapAddress} />
              </motion.div>
            )}

            {/* Financing Simulator - only when seller enabled it */}
            {isDb && !isAluguel && product.price > 0 && product.show_financing && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
                <FinancingSimulator propertyPrice={product.price} />
              </motion.div>
            )}
          </div>

          <div className="space-y-4">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="bg-card border border-border rounded-2xl p-6 sticky top-20">
              <Link to={companyUrl} className="flex items-center gap-3 mb-4 group">
                {company.logo ? (
                  <img src={company.logo} alt={company.name} className="w-14 h-14 rounded-xl object-cover border border-border" />
                ) : (
                  <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center border border-border">
                    <span className="font-bold text-primary text-lg">{company.name?.charAt(0)}</span>
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-display font-bold text-foreground text-sm group-hover:text-primary transition-colors">{company.name}</p>
                    {sellerTier && sellerTier !== "basico" && (
                      <PackageBadge tier={sellerTier as any} size="sm" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {isDb && (company as any).sellerCategory
                      ? ({ imobiliaria: "Imobiliária", corretor: "Corretor(a)", proprietario: "Proprietário", loja_veiculos: "Loja de Veículos", autonomo: "Autônomo", concessionaria: "Concessionária" } as any)[(company as any).sellerCategory] || (company as any).sellerCategory
                      : isProperty ? "Imobiliária" : "Revenda"}
                  </p>
                </div>
              </Link>

              {/* Sobre o vendedor / corretor */}
              {isDb && dbSeller && (
                <div className="border-t border-border pt-4 mb-4 space-y-2">
                  <h3 className="font-display font-semibold text-foreground text-sm">
                    {teamMember ? "Sobre o Corretor" : (company as any).sellerCategory === "corretor" ? "o Corretor" : (company as any).sellerCategory === "imobiliaria" ? "Sobre a Imobiliária" : "Sobre o Vendedor"}
                  </h3>
                  
                  {teamMember ? (
                    <>
                      {teamMember.bio && (
                        <p className="text-xs text-muted-foreground leading-relaxed">{teamMember.bio}</p>
                      )}
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <BadgeCheck size={13} className="text-primary flex-shrink-0" />
                          <span>Corretor(a) de Imóveis</span>
                        </div>
                        {teamMember.creci && (
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <BadgeCheck size={13} className="text-primary flex-shrink-0" />
                            <span>CRECI {teamMember.creci}</span>
                          </div>
                        )}
                        {teamMember.email && (
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <BadgeCheck size={13} className="text-primary flex-shrink-0" />
                            <span>{teamMember.email}</span>
                          </div>
                        )}
                        {teamMember.instagram && (
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span className="flex-shrink-0">📸</span>
                            <a href={`https://instagram.com/${teamMember.instagram.replace("@", "")}`} target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">{teamMember.instagram}</a>
                          </div>
                        )}
                        {/* Show parent company info */}
                        <div className="mt-3 pt-3 border-t border-border">
                          <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider mb-1">Empresa</p>
                          <div className="flex items-center gap-2">
                            {dbSeller.logo_url && <img src={dbSeller.logo_url} alt="" className="w-6 h-6 rounded object-cover" />}
                            <span className="text-xs text-muted-foreground">{dbSeller.company_name || dbSeller.full_name}</span>
                          </div>
                          {dbSeller.cnpj && (
                            <p className="text-[10px] text-muted-foreground mt-1">CNPJ {dbSeller.cnpj}</p>
                          )}
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      {dbSeller.bio && (
                        <p className="text-xs text-muted-foreground leading-relaxed">{dbSeller.bio}</p>
                      )}
                      <div className="space-y-1.5">
                        {(company as any).sellerCategory && (
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <BadgeCheck size={13} className="text-primary flex-shrink-0" />
                            <span>{({ imobiliaria: "Imobiliária", corretor: "Corretor(a) de Imóveis", proprietario: "Proprietário", loja_veiculos: "Loja de Veículos", autonomo: "Autônomo", concessionaria: "Concessionária" } as any)[(company as any).sellerCategory] || (company as any).sellerCategory}</span>
                          </div>
                        )}
                        {dbSeller.creci && (company as any).sellerCategory !== "imobiliaria" && (
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <BadgeCheck size={13} className="text-primary flex-shrink-0" />
                            <span>CRECI {dbSeller.creci}</span>
                          </div>
                        )}
                        {dbSeller.cnpj && (
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <BadgeCheck size={13} className="text-primary flex-shrink-0" />
                            <span>CNPJ {dbSeller.cnpj}</span>
                          </div>
                        )}
                        {company.whatsapp && (
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <MessageCircle size={13} className="text-green-500 flex-shrink-0" />
                            <span>Contato direto via WhatsApp</span>
                          </div>
                        )}
                        {sellerTier && sellerTier !== "basico" && (
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Star size={13} className="text-accent fill-accent flex-shrink-0" />
                            <span>Vendedor verificado e {sellerTier === "start" ? "start" : sellerTier === "premium" ? "VIP" : sellerTier === "vip" ? "premium" : sellerTier === "essencial_empresa" ? "essencial" : sellerTier === "premium_empresa" ? "premium empresa" : sellerTier === "prime_empresa" ? "black" : sellerTier}</span>
                          </div>
                        )}
                        {dbSeller.instagram && (
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span className="flex-shrink-0">📸</span>
                            <a href={`https://instagram.com/${dbSeller.instagram.replace("@", "")}`} target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">{dbSeller.instagram}</a>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )}

              {mapAddress && (
                <div className="flex items-center gap-1.5 text-muted-foreground text-xs mb-4">
                  <MapPin size={13} />
                  <span>{mapAddress}</span>
                </div>
              )}

              {dbItem?.status === "vendido" && (
                <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-center">
                  <p className="font-bold text-red-600 text-sm">❌ Este imóvel foi vendido</p>
                </div>
              )}

              {company.whatsapp && dbItem?.status !== "vendido" && (
                <button onClick={() => handleWhatsAppClick()}
                  className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-sm transition-colors shadow-lg">
                  <MessageCircle size={18} /> Chamar no WhatsApp
                </button>
              )}
              {company.whatsapp && dbItem?.status === "vendido" && (
                <button disabled
                  className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-muted text-muted-foreground font-bold text-sm cursor-not-allowed">
                  <MessageCircle size={18} /> Imóvel Vendido
                </button>
              )}

              <button onClick={async () => {
                try {
                  if (navigator.share) {
                    await navigator.share({ title, url: window.location.href });
                  } else {
                    await navigator.clipboard.writeText(window.location.href);
                    toast({ title: "Link copiado!" });
                  }
                } catch {
                  await navigator.clipboard.writeText(window.location.href);
                  toast({ title: "Link copiado!" });
                }
              }}
                className="mt-3 w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-white border border-border text-foreground font-medium text-sm hover:bg-secondary transition-colors">
                <Share2 size={16} /> Compartilhar
              </button>

              {isDb && dbItem && (
                <button
                  onClick={() => generateProposalPdf({
                    id: dbItem.id,
                    title: title,
                    price: product.price,
                    image: images[0] || "",
                    images: images || [],
                    location: mapAddress || "",
                    description: product.description || "",
                    tags: product.tags || [],
                    status: dbItem.status || "ativo",
                    sellerName: company.name,
                    sellerPhone: company.whatsapp || "",
                    sellerCategory: (company as any).sellerCategory || "",
                    sellerLogo: company.logo || "",
                    propertyUrl: window.location.href,
                    bedrooms: product.bedrooms,
                    bathrooms: product.bathrooms,
                    area: product.area,
                    suites: product.suites,
                    parking_spots: product.parking_spots,
                  })}
                  className="mt-3 w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-secondary text-foreground font-medium text-sm hover:bg-secondary/80 transition-colors border border-border"
                >
                  <FileDown size={16} /> Baixar Proposta (PDF)
                </button>
              )}

              <Link to={companyUrl}
                className="mt-3 w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-accent text-accent-foreground font-bold text-sm hover:bg-accent/90 transition-colors shadow-md">
                <Store size={16} /> Ver Loja Completa
              </Link>

              {/* QR Code */}
              <div className="mt-4 pt-4 border-t border-border">
                <QRCodeDisplay url={window.location.href} size={120} />
              </div>
            </motion.div>
          </div>
        </div>

        {relatedProducts.length > 0 && (
          <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="mt-16">
            <h2 className="font-display font-bold text-xl text-foreground mb-6">Mais de {company.name}</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {relatedProducts.map((rp: any) => (
                <Link key={rp.id} to={`/imoveis/produto/${rp.id}`} className="card-epic bg-card border border-border group">
                  <div className="relative aspect-[4/3] overflow-hidden rounded-t-2xl">
                    <img src={rp.image} alt={rp.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" loading="lazy" />
                  </div>
                  <div className="p-3">
                    <h3 className="font-display font-semibold text-foreground text-sm leading-tight line-clamp-2">{rp.title}</h3>
                    <p className="font-display font-bold text-emerald-500 text-base mt-1">{formatPrice(rp.price)}</p>
                  </div>
                </Link>
              ))}
            </div>
          </motion.section>
        )}
      </div>
    </div>
  );
}