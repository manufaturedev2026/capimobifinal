import { useState, useRef, useEffect, useMemo } from "react";
import { Helmet } from "react-helmet-async";
import { useParams, Link, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, ChevronLeft, ChevronRight, MessageCircle, Share2, Star,
  MapPin, Tag, Store, Image, X, ZoomIn, BadgeCheck, Video, FileDown,
  BedDouble, Bath, Car, Ruler, Building2, Home, Flame, Waves,
  TreePine, Shield, Dumbbell, Wifi, Zap, DoorOpen, UtensilsCrossed,
  Snowflake, Eye, Landmark, Mountain, ChevronDown, ChevronUp
} from "lucide-react";
import { generateProposalPdf } from "@/lib/generateProposalPdf";
import { buildProductLink } from "@/lib/productUrl";
import QRCodeDisplay from "@/components/QRCodeDisplay";
import FinancingSimulator from "@/components/FinancingSimulator";
import PackageBadge from "@/components/PackageBadge";
import { useWhatsAppPicker } from "@/components/WhatsAppTeamPicker";
import { formatPrice, getTagStyle, getTagLabel } from "@/data/products";
import { supabase } from "@/integrations/supabase/client";
import { trackSellerEvent } from "@/hooks/useSellerAnalytics";
import { useToast } from "@/hooks/use-toast";
import MapEmbed from "@/components/MapEmbed";
import WhatsAppLeadCapture from "@/components/WhatsAppLeadCapture";
import { useIsMobile } from "@/hooks/use-mobile";
import StoreEffects from "@/components/StoreEffects";
import ThemeParticles from "@/components/ThemeParticles";
import { getStoreTheme } from "@/components/StoreThemePicker";
import { getStoreThemeCssVars } from "@/lib/marketplaceThemeCssVars";
import { useAuth } from "@/hooks/useAuth";

function buildThemeCSSVars(themeId: string | null | undefined): React.CSSProperties {
  const t = getStoreTheme(themeId);
  return getStoreThemeCssVars(t);
}

function isUUID(str: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
}

/* ── Highlight chips shown below price ── */
function HighlightChips({ product }: { product: any }) {
  const chips: { icon: React.ReactNode; label: string; value: string }[] = [];
  if (product.bedrooms) chips.push({ icon: <BedDouble size={16} />, label: "Quartos", value: String(product.bedrooms) });
  if (product.suites) chips.push({ icon: <DoorOpen size={16} />, label: "Suítes", value: String(product.suites) });
  if (product.bathrooms) chips.push({ icon: <Bath size={16} />, label: "Banheiros", value: String(product.bathrooms) });
  if (product.parking_spots) chips.push({ icon: <Car size={16} />, label: "Vagas", value: String(product.parking_spots) });
  if (product.area) chips.push({ icon: <Ruler size={16} />, label: "Área", value: `${product.area} m²` });
  if (product.built_area && !product.area) chips.push({ icon: <Ruler size={16} />, label: "Construída", value: `${product.built_area} m²` });
  if (chips.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-2 mt-4">
      {chips.map((c) => (
        <div key={c.label} className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-muted/80 border border-border">
          <span className="text-primary">{c.icon}</span>
          <div className="leading-none">
            <span className="text-foreground font-bold text-sm">{c.value}</span>
            <span className="text-muted-foreground text-[10px] ml-1">{c.label}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Amenities grid ── */
function AmenitiesGrid({ product }: { product: any }) {
  const amenities: { icon: React.ReactNode; label: string }[] = [];
  if (product.pool) amenities.push({ icon: <Waves size={16} />, label: "Piscina" });
  if (product.barbecue) amenities.push({ icon: <Flame size={16} />, label: "Churrasqueira" });
  if (product.garden) amenities.push({ icon: <TreePine size={16} />, label: "Jardim" });
  if (product.balcony) amenities.push({ icon: <Mountain size={16} />, label: "Varanda" });
  if (product.has_elevator) amenities.push({ icon: <Building2 size={16} />, label: "Elevador" });
  if (product.doorman_24h) amenities.push({ icon: <Shield size={16} />, label: "Portaria 24h" });
  if (product.furnished) amenities.push({ icon: <Home size={16} />, label: "Mobiliado" });
  if (product.has_ac) amenities.push({ icon: <Snowflake size={16} />, label: "Ar-Condicionado" });
  if (product.service_area) amenities.push({ icon: <UtensilsCrossed size={16} />, label: "Área de Serviço" });
  if (product.backyard) amenities.push({ icon: <TreePine size={16} />, label: "Quintal" });
  if (product.accepts_financing) amenities.push({ icon: <Landmark size={16} />, label: "Aceita Financiamento" });
  const leisureLabels: Record<string, string> = { piscina: "Piscina", academia: "Academia", salao_festas: "Salão de Festas", playground: "Playground", churrasqueira: "Churrasqueira", sauna: "Sauna", quadra: "Quadra" };
  if (product.leisure_amenities?.length) {
    product.leisure_amenities.forEach((a: string) => {
      const label = leisureLabels[a] || a;
      if (!amenities.find(am => am.label === label)) {
        amenities.push({ icon: <Dumbbell size={16} />, label });
      }
    });
  }
  const infraLabels: Record<string, string> = { agua: "Água", luz: "Luz", esgoto: "Esgoto", asfalto: "Asfalto", internet: "Internet" };
  if (product.infrastructure?.length) {
    product.infrastructure.forEach((a: string) => {
      amenities.push({ icon: a === "internet" ? <Wifi size={16} /> : <Zap size={16} />, label: infraLabels[a] || a });
    });
  }
  if (amenities.length === 0) return null;
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
      <h2 className="font-display font-semibold text-lg text-foreground mb-3">Diferenciais</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {amenities.map((a) => (
          <div key={a.label} className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-card border border-border">
            <span className="text-primary">{a.icon}</span>
            <span className="text-sm text-foreground">{a.label}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

export default function ProductDetail() {
  const { productId, lojaSlug: lojaSlugParam } = useParams();
  const [searchParams] = useSearchParams();
  const corretorSlug = searchParams.get("corretor");
  const lojaSlug = lojaSlugParam || searchParams.get("loja");
  const { toast } = useToast();
  const { openWhatsApp } = useWhatsAppPicker();
  const { profile } = useAuth();
  const isMobile = useIsMobile();
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
  const [leadCaptureOpen, setLeadCaptureOpen] = useState(false);
  const [pendingWhatsAppAction, setPendingWhatsAppAction] = useState<(() => void) | null>(null);
  const [showAllSpecs, setShowAllSpecs] = useState(false);

  useEffect(() => {
    if (productId) {
      setLoading(true);
      setIsDb(true);
      if (isUUID(productId)) {
        fetchDbItem(productId);
      } else {
        fetchDbItemBySlug(productId);
      }
    } else {
      setIsDb(false);
      setLoading(false);
    }
  }, [productId, lojaSlug, profile?.id]);

  const loadItemData = async (item: any) => {
    setDbItem(item);
    let effectiveSellerId = item.seller_id;
    let sellerProfile: any = null;

    if (lojaSlug) {
      const { data: partnerProfile } = await supabase
        .from("profiles")
        .select("*")
        .eq("slug", lojaSlug)
        .maybeSingle();

      if (partnerProfile) {
        const { data: listing } = await supabase
          .from("partner_store_listings")
          .select("id, is_visible, partnership_id")
          .eq("item_id", item.id)
          .eq("partner_profile_id", partnerProfile.id)
          .eq("is_visible", true)
          .maybeSingle();

        if (listing) {
          const { data: partnership } = await supabase
            .from("property_partnerships")
            .select("status")
            .eq("id", listing.partnership_id)
            .maybeSingle();

          if (partnership?.status === "aprovado") {
            sellerProfile = partnerProfile;
            effectiveSellerId = partnerProfile.id;
          }
        }
      }
    } else if (profile?.id && profile.id !== item.seller_id) {
      const { data: listing } = await supabase
        .from("partner_store_listings")
        .select("id, partnership_id")
        .eq("item_id", item.id)
        .eq("partner_profile_id", profile.id)
        .eq("is_visible", true)
        .maybeSingle();

      if (listing) {
        const { data: partnership } = await supabase
          .from("property_partnerships")
          .select("status")
          .eq("id", listing.partnership_id)
          .maybeSingle();

        if (partnership?.status === "aprovado") {
          sellerProfile = profile;
          effectiveSellerId = profile.id;
        }
      }
    }

    if (!sellerProfile) {
      const { data: seller } = await supabase.from("profiles").select("*").eq("id", item.seller_id).maybeSingle();
      sellerProfile = seller;
    }

    setDbSeller(sellerProfile);
    setTeamMember(null);

    if (corretorSlug) {
      const { data: member } = await supabase
        .from("team_members").select("*")
        .eq("company_id", effectiveSellerId).eq("slug", corretorSlug).eq("is_active", true).maybeSingle();
      if (member) {
        if (member.origin === "partnership" && member.linked_profile_id) {
          const { data: linkedProfile } = await supabase
            .from("profiles").select("user_id").eq("id", member.linked_profile_id).maybeSingle();
          if (linkedProfile) (member as any)._linked_user_id = linkedProfile.user_id;
        }
        setTeamMember(member);
      }
    }

    const { data: subData } = await supabase
      .from("seller_subscriptions").select("tier")
      .eq("seller_id", item.seller_id).eq("is_active", true)
      .order("created_at", { ascending: false }).limit(1);
    if (subData && subData.length > 0) setSellerTier(subData[0].tier);

    trackSellerEvent(item.seller_id, "view", item.id, undefined);

    const { data: related } = await supabase
      .from("seller_items").select("id, title, price, photos, city, neighborhood, category, finality, slug")
      .eq("seller_id", item.seller_id).eq("status", "ativo").neq("id", item.id)
      .order("created_at", { ascending: false }).limit(8);
    setRelatedItems((related || []).map((r: any) => ({
      id: r.id, title: r.title, price: r.price || 0,
      image: r.photos?.[0] || "", city: r.city, neighborhood: r.neighborhood,
      isAluguel: r.category === "aluguel" || r.finality === "aluguel",
      slug: r.slug,
    })));
    setLoading(false);
  };

  const fetchDbItem = async (id: string) => {
    const { data: item } = await supabase.from("seller_items").select("*").eq("id", id).maybeSingle();
    if (item) {
      await loadItemData(item);
    } else {
      setLoading(false);
    }
  };

  const fetchDbItemBySlug = async (slug: string) => {
    const { data: item } = await (supabase.from("seller_items").select("*") as any).eq("slug", slug).maybeSingle();
    if (item) {
      await loadItemData(item);
    } else {
      setLoading(false);
    }
  };

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

  // Touch swipe for mobile lightbox
  const touchStart = useRef<number | null>(null);
  const handleTouchStart = (e: React.TouchEvent) => { touchStart.current = e.touches[0].clientX; };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStart.current === null) return;
    const diff = e.changedTouches[0].clientX - touchStart.current;
    if (Math.abs(diff) > 50) {
      if (diff < 0) setActiveImage((p) => (p + 1) % images.length);
      else setActiveImage((p) => (p - 1 + images.length) % images.length);
    }
    touchStart.current = null;
  };

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
          rating: "5.0", reviewCount: 0,
          segment: dbSeller.seller_type,
          sellerCategory: dbSeller.seller_category,
        }
      : null
    : null;

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
    : `/empresa/${dbSeller?.slug || dbSeller?.id || company.id}`;
  const formattedPrice = isDb
    ? price ? `R$ ${Number(price).toLocaleString("pt-BR")}` : ""
    : formatPrice(price);
  const canonicalProductPath = buildProductLink(
    { id: product.id, slug: product.slug, _isPartnerImport: dbSeller?.id !== product.seller_id },
    corretorSlug,
    dbSeller?.slug || null,
  );
  const productUrl = `${window.location.origin}${canonicalProductPath}`;

  const doWhatsAppRedirect = (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    if (isDb && dbItem) trackSellerEvent(dbItem.seller_id, "whatsapp_click", dbItem.id, teamMember?.id);
    
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches
      || (navigator as any).standalone === true;

    const openUrl = (url: string) => {
      // WhatsApp after async/modal submit can be blocked as popup, so always navigate directly
      if (isStandalone) {
        window.location.href = url;
        return;
      }
      window.location.assign(url);
    };

    if (teamMember && teamMember.phone) {
      const phone = teamMember.phone.replace(/\D/g, "");
      const msg = `Olá ${teamMember.full_name}! 🏠 Vi o imóvel *${title}* - ${formattedPrice} na sua loja e gostaria de mais informações.\n\n🔗 ${productUrl}`;
      openUrl(`https://wa.me/55${phone}?text=${encodeURIComponent(msg)}`);
      return;
    }
    openWhatsApp({
      sellerId: company.id, sellerName: company.name,
      sellerPhone: company.whatsapp, title: `${title} - ${formattedPrice}`, link: productUrl,
    });
  };
  const handleWhatsAppClick = (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    if (isDb && dbSeller) {
      setPendingWhatsAppAction(() => () => doWhatsAppRedirect());
      setLeadCaptureOpen(true);
    } else {
      doWhatsAppRedirect(e);
    }
  };
  const mapAddress = isDb
    ? [product.address, product.neighborhood, product.city, product.state].filter(Boolean).join(", ") || company.address
    : (isProperty && product.location ? product.location : company.address);

  /* ── Build specs (technical details only, amenities handled separately) ── */
  const specs: Record<string, string> = {};
  if (isDb) {
    const p = product as any;
    const subtypeLabels: Record<string, string> = { terrea: "Térrea", sobrado: "Sobrado", condominio: "Condomínio", apartamento: "Apartamento", cobertura: "Cobertura", kitnet: "Kitnet", urbano: "Urbano", rural: "Rural", galpao: "Galpão", sala: "Sala", loja: "Loja", ponto_comercial: "Ponto Comercial", deposito: "Depósito", barracao: "Barracão" };
    if (p.property_subtype) specs["Tipo"] = subtypeLabels[p.property_subtype] || p.property_subtype;
    if (p.finality && p.finality !== "venda") specs["Finalidade"] = p.finality === "aluguel" ? "Aluguel" : "Venda";
    if (p.area) specs["Área Total"] = `${p.area} m²`;
    if (p.built_area) specs["Área Construída"] = `${p.built_area} m²`;
    if (p.lot_front) specs["Frente"] = `${p.lot_front} m`;
    if (p.lot_depth) specs["Fundo"] = `${p.lot_depth} m`;
    if (p.ceiling_height) specs["Pé Direito"] = `${p.ceiling_height} m`;
    if (p.bedrooms) specs["Quartos"] = String(p.bedrooms);
    if (p.suites) specs["Suítes"] = String(p.suites);
    if (p.bathrooms) specs["Banheiros"] = String(p.bathrooms);
    if (p.living_rooms) specs["Salas"] = String(p.living_rooms);
    if (p.parking_spots) specs["Vagas"] = String(p.parking_spots);
    if (p.floor_number) specs["Andar"] = String(p.floor_number);
    const kitchenLabels: Record<string, string> = { americana: "Americana", planejada: "Planejada", simples: "Simples" };
    if (p.kitchen_type) specs["Cozinha"] = kitchenLabels[p.kitchen_type] || p.kitchen_type;
    const topoLabels: Record<string, string> = { plano: "Plano", aclive: "Aclive", declive: "Declive" };
    if (p.topography) specs["Topografia"] = topoLabels[p.topography] || p.topography;
    if (p.documentation) specs["Documentação"] = p.documentation === "regular" ? "Regular" : "Irregular";
    if (p.condo_fee) specs["Condomínio"] = `R$ ${Number(p.condo_fee).toLocaleString("pt-BR")}`;
    if (p.iptu) specs["IPTU"] = `R$ ${Number(p.iptu).toLocaleString("pt-BR")}/ano`;
    if (p.zoning) specs["Zoneamento"] = p.zoning;
    if (p.security) specs["Segurança"] = p.security;
    const trafficLabels: Record<string, string> = { alto: "Alto", medio: "Médio", baixo: "Baixo" };
    if (p.foot_traffic) specs["Fluxo de Pessoas"] = trafficLabels[p.foot_traffic] || p.foot_traffic;
    if (p.ideal_for) specs["Ideal para"] = p.ideal_for;
    if (p.city) specs["Cidade"] = p.city;
    if (p.neighborhood) specs["Bairro"] = p.neighborhood;
    if (p.brand) specs["Marca"] = p.brand;
    if (p.model) specs["Modelo"] = p.model;
    if (p.year) specs["Ano"] = String(p.year);
    if (p.mileage) specs["Quilometragem"] = `${Number(p.mileage).toLocaleString("pt-BR")} km`;
    if (p.fuel) specs["Combustível"] = p.fuel;
    if (p.transmission) specs["Câmbio"] = p.transmission;
    if (p.color) specs["Cor"] = p.color;
  }
  const displaySpecs = isDb ? specs : product.specs;
  const specEntries = Object.entries(displaySpecs);
  const visibleSpecs = showAllSpecs ? specEntries : specEntries.slice(0, 8);

  const relatedProducts = relatedItems;

  const categoryLabel = isDb
    ? ({ casa: "Casa", apartamento: "Apartamento", terreno: "Terreno", comercial: "Comercial", galpao: "Galpão", flat: "Flat", aluguel: "Aluguel", carro: "Carro", moto: "Moto", caminhao: "Caminhão", van: "Van", utilitario: "Utilitário", outros: "Outros" } as any)[product.category] || product.category
    : "Imóvel";

  /* ── Seller card content (shared between sidebar & mobile bottom) ── */
  const SellerCard = ({ compact = false }: { compact?: boolean }) => (
    <div className={compact ? "" : "bg-card border border-border rounded-2xl p-6"}>
      <Link to={companyUrl} className="flex items-center gap-3 mb-4 group">
        {company.logo ? (
          <img src={company.logo} alt={company.name} className="w-14 h-14 rounded-xl object-cover border border-border" />
        ) : (
          <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center border border-border">
            <span className="font-bold text-primary text-lg">{company.name?.charAt(0)}</span>
          </div>
        )}
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-display font-bold text-foreground text-sm group-hover:text-primary transition-colors truncate">{company.name}</p>
            {sellerTier && sellerTier !== "basico" && <PackageBadge tier={sellerTier as any} size="sm" />}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {isDb && (company as any).sellerCategory
              ? ({ imobiliaria: "Imobiliária", corretor: "Corretor(a)", proprietario: "Proprietário", construtora: "Construtora", loja_veiculos: "Loja de Veículos", autonomo: "Autônomo", concessionaria: "Concessionária" } as any)[(company as any).sellerCategory] || (company as any).sellerCategory
              : "Imobiliária"}
          </p>
        </div>
      </Link>

      {!compact && isDb && dbSeller && (
        <div className="border-t border-border pt-4 mb-4 space-y-2">
          <h3 className="font-display font-semibold text-foreground text-sm">
            {teamMember ? "Sobre o Corretor" : (company as any).sellerCategory === "corretor" ? "Sobre o Corretor" : (company as any).sellerCategory === "imobiliaria" ? "Sobre a Imobiliária" : "Sobre o Vendedor"}
          </h3>
          {teamMember ? (
            <>
              {teamMember.bio && <p className="text-xs text-muted-foreground leading-relaxed">{teamMember.bio}</p>}
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-xs text-muted-foreground"><BadgeCheck size={13} className="text-primary flex-shrink-0" /><span>Corretor(a) de Imóveis</span></div>
                {teamMember.creci && <div className="flex items-center gap-2 text-xs text-muted-foreground"><BadgeCheck size={13} className="text-primary flex-shrink-0" /><span>CRECI {teamMember.creci}</span></div>}
                {teamMember.email && <div className="flex items-center gap-2 text-xs text-muted-foreground"><BadgeCheck size={13} className="text-primary flex-shrink-0" /><span>{teamMember.email}</span></div>}
                {teamMember.instagram && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="flex-shrink-0">📸</span>
                    <a href={`https://instagram.com/${teamMember.instagram.replace("@", "")}`} target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">{teamMember.instagram}</a>
                  </div>
                )}
                <div className="mt-3 pt-3 border-t border-border">
                  <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider mb-1">Empresa</p>
                  <div className="flex items-center gap-2">
                    {dbSeller.logo_url && <img src={dbSeller.logo_url} alt="" className="w-6 h-6 rounded object-cover" />}
                    <span className="text-xs text-muted-foreground">{dbSeller.company_name || dbSeller.full_name}</span>
                  </div>
                  {dbSeller.cnpj && <p className="text-[10px] text-muted-foreground mt-1">CNPJ {dbSeller.cnpj}</p>}
                </div>
              </div>
            </>
          ) : (
            <>
              {dbSeller.bio && <p className="text-xs text-muted-foreground leading-relaxed">{dbSeller.bio}</p>}
              <div className="space-y-1.5">
                {(company as any).sellerCategory && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground"><BadgeCheck size={13} className="text-primary flex-shrink-0" /><span>{({ imobiliaria: "Imobiliária", corretor: "Corretor(a) de Imóveis", proprietario: "Proprietário", construtora: "Construtora", loja_veiculos: "Loja de Veículos", autonomo: "Autônomo", concessionaria: "Concessionária" } as any)[(company as any).sellerCategory] || (company as any).sellerCategory}</span></div>
                )}
                {dbSeller.creci && (company as any).sellerCategory !== "imobiliaria" && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground"><BadgeCheck size={13} className="text-primary flex-shrink-0" /><span>CRECI {dbSeller.creci}</span></div>
                )}
                {dbSeller.cnpj && <div className="flex items-center gap-2 text-xs text-muted-foreground"><BadgeCheck size={13} className="text-primary flex-shrink-0" /><span>CNPJ {dbSeller.cnpj}</span></div>}
                {company.whatsapp && <div className="flex items-center gap-2 text-xs text-muted-foreground"><MessageCircle size={13} className="text-green-500 flex-shrink-0" /><span>Contato direto via WhatsApp</span></div>}
                {sellerTier && sellerTier !== "basico" && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground"><Star size={13} className="text-accent fill-accent flex-shrink-0" /><span>Vendedor verificado</span></div>
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

      {!compact && mapAddress && (
        <div className="flex items-center gap-1.5 text-muted-foreground text-xs mb-4">
          <MapPin size={13} /><span>{mapAddress}</span>
        </div>
      )}

      {dbItem?.status === "vendido" && (
        <div className="mb-4 p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-center">
          <p className="font-bold text-destructive text-sm">❌ Este imóvel foi vendido</p>
        </div>
      )}

      {company.whatsapp && dbItem?.status !== "vendido" && (
        <button onClick={() => handleWhatsAppClick()}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-sm transition-colors shadow-lg">
          <MessageCircle size={18} /> Chamar no WhatsApp
        </button>
      )}
      {company.whatsapp && dbItem?.status === "vendido" && (
        <button disabled className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-muted text-muted-foreground font-bold text-sm cursor-not-allowed">
          <MessageCircle size={18} /> Imóvel Vendido
        </button>
      )}

      {!compact && (
        <>
          <button onClick={async () => {
            try {
              if (navigator.share) { await navigator.share({ title, url: window.location.href }); }
              else { await navigator.clipboard.writeText(window.location.href); toast({ title: "Link copiado!" }); }
            } catch { await navigator.clipboard.writeText(window.location.href); toast({ title: "Link copiado!" }); }
          }}
            className="mt-3 w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-secondary border border-border text-foreground font-medium text-sm hover:bg-secondary/80 transition-colors">
            <Share2 size={16} /> Compartilhar
          </button>

          {isDb && dbItem && (
            <button
              onClick={() => generateProposalPdf({
                id: dbItem.id, title, price: product.price,
                image: images[0] || "", images: images || [],
                location: mapAddress || "", description: product.description || "",
                tags: product.tags || [], status: dbItem.status || "ativo",
                sellerName: company.name, sellerPhone: company.whatsapp || "",
                sellerCategory: (company as any).sellerCategory || "",
                sellerLogo: company.logo || "", propertyUrl: window.location.href,
                bedrooms: product.bedrooms, bathrooms: product.bathrooms,
                area: product.area, suites: product.suites, parking_spots: product.parking_spots,
              })}
              className="mt-3 w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-secondary text-foreground font-medium text-sm hover:bg-secondary/80 transition-colors border border-border">
              <FileDown size={16} /> Baixar Proposta (PDF)
            </button>
          )}

          <Link to={companyUrl}
            className="mt-3 w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-accent font-bold text-sm hover:bg-accent/90 transition-colors shadow-md"
            style={{ color: "#000" }}>
            <Store size={16} /> Ver Loja Completa
          </Link>

          <div className="mt-4 pt-4 border-t border-border">
            <QRCodeDisplay url={window.location.href} size={120} />
          </div>
        </>
      )}
    </div>
  );

  const themeVars = buildThemeCSSVars(dbSeller?.store_theme);

  const seoTitle = `${product.title} — ${product.city ? `Imóvel em ${product.city}` : "Imóvel"} | ${company.name}`;
  const seoDesc = [
    product.title,
    product.city && `em ${product.city}`,
    product.neighborhood && `(${product.neighborhood})`,
    product.price && `por R$ ${Number(product.price).toLocaleString("pt-BR")}`,
    product.bedrooms && `${product.bedrooms} quartos`,
    product.area && `${product.area}m²`,
    `— ${company.name}`,
  ].filter(Boolean).join(" ").slice(0, 160);
  const seoImage = product.photos?.[0] || company.logo || "";
  const seoUrl = `${window.location.origin}${canonicalProductPath}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    name: product.title,
    description: product.description || seoDesc,
    url: seoUrl,
    ...(seoImage && { image: product.photos || [seoImage] }),
    ...(product.price && {
      offers: {
        "@type": "Offer",
        price: product.price,
        priceCurrency: "BRL",
        availability: "https://schema.org/InStock",
      },
    }),
    address: {
      "@type": "PostalAddress",
      ...(product.neighborhood && { addressLocality: product.neighborhood }),
      ...(product.city && { addressRegion: product.city }),
      ...(product.state && { addressCountry: "BR" }),
    },
    ...(product.area && { floorSize: { "@type": "QuantitativeValue", value: product.area, unitCode: "MTK" } }),
    ...(product.bedrooms && { numberOfRooms: product.bedrooms }),
    ...(product.bathrooms && { numberOfBathroomsTotal: product.bathrooms }),
    broker: {
      "@type": "RealEstateAgent",
      name: company.name,
      ...(company.logo && { image: company.logo }),
      ...(company.whatsapp && { telephone: company.whatsapp }),
    },
  };

  return (
    <>
      <Helmet>
        <title>{seoTitle}</title>
        <meta name="description" content={seoDesc} />
        <link rel="canonical" href={seoUrl} />

        <meta property="og:type" content="product" />
        <meta property="og:title" content={seoTitle} />
        <meta property="og:description" content={seoDesc} />
        <meta property="og:url" content={seoUrl} />
        {seoImage && <meta property="og:image" content={seoImage} />}

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={seoTitle} />
        <meta name="twitter:description" content={seoDesc} />
        {seoImage && <meta name="twitter:image" content={seoImage} />}

        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      </Helmet>
    <div className="min-h-screen bg-background pb-24 lg:pb-0 relative overflow-hidden" style={themeVars}>
      {isDb && dbSeller?.id && <StoreEffects sellerId={dbSeller.id} />}
      <ThemeParticles color={getStoreTheme(dbSeller?.store_theme).primary} sellerId={dbSeller?.id} />
      {/* ── Hero Banner ── */}
      <section className="relative">
        <div className={`overflow-hidden bg-muted ${isMobile ? "aspect-[4/3]" : "aspect-[21/7]"}`}>
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
                className="w-full h-full object-cover cursor-pointer"
                onClick={() => isMobile && setLightboxOpen(true)}
                onTouchStart={isMobile ? handleTouchStart : undefined}
                onTouchEnd={isMobile ? handleTouchEnd : undefined}
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

        {/* Mobile: counter + zoom hint */}
        {isMobile && images.length > 0 && (
          <div className="absolute bottom-3 left-0 right-0 z-20 flex items-center justify-between px-4">
            <button onClick={() => setLightboxOpen(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-card/70 backdrop-blur-md text-xs font-bold text-foreground">
              <ZoomIn size={12} /> Ampliar
            </button>
            <span className="px-3 py-1.5 rounded-lg bg-card/70 backdrop-blur-md text-xs font-bold text-foreground">
              {activeImage + 1} / {images.length}
            </span>
          </div>
        )}

        {/* Desktop: arrows */}
        {!isMobile && images.length > 1 && (
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

      {/* ── Mobile: Thumbnail strip (tap to change hero) ── */}
      {isMobile && images.length > 1 && (
        <div className="px-3 py-2 overflow-x-auto flex gap-2 scrollbar-hide" style={{ WebkitOverflowScrolling: "touch" }}>
          {images.map((img: string, i: number) => (
            <button
              key={i}
              onClick={() => setActiveImage(i)}
              className={`flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-all ${
                activeImage === i ? "border-primary scale-105 shadow-lg" : "border-border opacity-70"
              }`}
            >
              <img src={img} alt={`Foto ${i + 1}`} className="w-full h-full object-cover" loading="lazy" />
            </button>
          ))}
        </div>
      )}

      {/* ── Gallery Mosaic (desktop only) ── */}
      {images.length > 0 && (
        <div className="container max-w-6xl mx-auto px-4 -mt-16 md:-mt-20 z-10 relative">
          {/* Desktop */}
          <div className="hidden md:block">
            {images.length === 1 && (
              <motion.button initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} onClick={() => { setActiveImage(0); setLightboxOpen(true); }}
                className="w-full aspect-[16/7] rounded-2xl overflow-hidden border-2 border-border hover:border-primary/50 transition-all group relative">
                <img src={images[0]} alt="Foto 1" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/10 transition-colors flex items-center justify-center">
                  <ZoomIn size={32} className="text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" />
                </div>
              </motion.button>
            )}
            {images.length === 2 && (
              <div className="grid grid-cols-2 gap-2 h-[320px]">
                {images.slice(0, 2).map((img, i) => (
                  <motion.button key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                    onClick={() => { setActiveImage(i); setLightboxOpen(true); }}
                    className="rounded-2xl overflow-hidden border-2 border-border hover:border-primary/50 transition-all group relative">
                    <img src={img} alt={`Foto ${i + 1}`} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/10 transition-colors flex items-center justify-center">
                      <ZoomIn size={24} className="text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" />
                    </div>
                  </motion.button>
                ))}
              </div>
            )}
            {images.length === 3 && (
              <div className="grid grid-cols-3 gap-2 h-[360px]">
                <motion.button initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  onClick={() => { setActiveImage(0); setLightboxOpen(true); }}
                  className="col-span-2 rounded-2xl overflow-hidden border-2 border-border hover:border-primary/50 transition-all group relative">
                  <img src={images[0]} alt="Foto 1" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/10 transition-colors flex items-center justify-center">
                    <ZoomIn size={28} className="text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" />
                  </div>
                </motion.button>
                <div className="grid grid-rows-2 gap-2">
                  {images.slice(1, 3).map((img, i) => (
                    <motion.button key={i + 1} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: (i + 1) * 0.05 }}
                      onClick={() => { setActiveImage(i + 1); setLightboxOpen(true); }}
                      className="rounded-2xl overflow-hidden border-2 border-border hover:border-primary/50 transition-all group relative">
                      <img src={img} alt={`Foto ${i + 2}`} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                      <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/10 transition-colors flex items-center justify-center">
                        <ZoomIn size={20} className="text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" />
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>
            )}
            {images.length >= 4 && (
              <div className="grid grid-cols-4 grid-rows-2 gap-2 h-[400px]">
                <motion.button initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  onClick={() => { setActiveImage(0); setLightboxOpen(true); }}
                  className="col-span-2 row-span-2 rounded-2xl overflow-hidden border-2 border-border hover:border-primary/50 transition-all group relative">
                  <img src={images[0]} alt="Foto 1" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/10 transition-colors flex items-center justify-center">
                    <ZoomIn size={32} className="text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" />
                  </div>
                  <span className="absolute bottom-3 left-3 px-3 py-1 rounded-lg bg-card/80 backdrop-blur-md text-xs font-bold text-foreground">
                    <Image size={12} className="inline mr-1.5 mb-0.5" />{images.length} fotos
                  </span>
                </motion.button>
                {images.slice(1, 5).map((img, i) => (
                  <motion.button key={i + 1} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: (i + 1) * 0.06 }}
                    onClick={() => { setActiveImage(i + 1); setLightboxOpen(true); }}
                    className="rounded-2xl overflow-hidden border-2 border-border hover:border-primary/50 transition-all group relative">
                    <img src={img} alt={`Foto ${i + 2}`} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/10 transition-colors flex items-center justify-center">
                      <ZoomIn size={20} className="text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" />
                    </div>
                    {i === 3 && images.length > 5 && (
                      <div className="absolute inset-0 bg-foreground/50 flex items-center justify-center">
                        <span className="text-white text-lg font-black">+{images.length - 5}</span>
                      </div>
                    )}
                  </motion.button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Lightbox with swipe ── */}
      <AnimatePresence>
        {lightboxOpen && images.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
            onClick={() => setLightboxOpen(false)}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            <button className="absolute top-4 right-4 z-50 w-10 h-10 rounded-full bg-white/10 backdrop-blur flex items-center justify-center text-white hover:bg-white/20 transition-colors">
              <X size={20} />
            </button>
            <button onClick={(e) => { e.stopPropagation(); setActiveImage((p) => (p - 1 + images.length) % images.length); }}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-50 w-12 h-12 rounded-full bg-white/10 backdrop-blur flex items-center justify-center text-white hover:bg-white/20 transition-colors hidden md:flex">
              <ChevronLeft size={24} />
            </button>
            <button onClick={(e) => { e.stopPropagation(); setActiveImage((p) => (p + 1) % images.length); }}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-50 w-12 h-12 rounded-full bg-white/10 backdrop-blur flex items-center justify-center text-white hover:bg-white/20 transition-colors hidden md:flex">
              <ChevronRight size={24} />
            </button>
            <motion.img
              key={activeImage} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}
              src={images[activeImage]} alt={title}
              className="max-w-[90vw] max-h-[85vh] object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-1.5">
              <span className="text-white/70 text-xs font-medium mr-2">{activeImage + 1}/{images.length}</span>
              {images.length <= 12 && images.map((_, i) => (
                <button key={i} onClick={(e) => { e.stopPropagation(); setActiveImage(i); }}
                  className={`w-2 h-2 rounded-full transition-all ${activeImage === i ? "bg-white scale-125" : "bg-white/30 hover:bg-white/60"}`} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Content ── */}
      <div className="container max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main column */}
          <div className="lg:col-span-2 space-y-8">
            {/* Title + Price + Highlights */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="px-2.5 py-1 rounded-lg bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider">
                  {categoryLabel}
                </span>
                {isAluguel && (
                  <span className="px-2.5 py-1 rounded-lg bg-accent/20 text-accent-foreground text-xs font-bold">
                    🏠 Aluguel
                  </span>
                )}
                {mapAddress && (
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <MapPin size={12} /> {product.neighborhood ? `${product.neighborhood}, ${product.city}` : product.city || mapAddress}
                  </span>
                )}
              </div>
              <h1 className="font-display font-bold text-2xl md:text-4xl text-foreground leading-tight">{title}</h1>
              {formattedPrice && (
                <div className="flex items-baseline gap-2 mt-3">
                  <p className="font-display font-bold text-3xl md:text-5xl text-primary">
                    {formattedPrice}
                  </p>
                  {isAluguel && <span className="text-lg font-medium text-muted-foreground">/mês</span>}
                </div>
              )}
              {/* Costs bar */}
              {isDb && (product.condo_fee || product.iptu) && (
                <div className="flex flex-wrap gap-4 mt-2 text-sm text-muted-foreground">
                  {product.condo_fee && <span>Condomínio: <strong className="text-foreground">R$ {Number(product.condo_fee).toLocaleString("pt-BR")}</strong></span>}
                  {product.iptu && <span>IPTU: <strong className="text-foreground">R$ {Number(product.iptu).toLocaleString("pt-BR")}/ano</strong></span>}
                </div>
              )}
              {isDb && <HighlightChips product={product} />}
            </motion.div>

            {/* Description */}
            {description && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                <h2 className="font-display font-semibold text-lg text-foreground mb-2">Descrição</h2>
                <p className="text-muted-foreground leading-relaxed whitespace-pre-line">{description}</p>
              </motion.div>
            )}

            {/* Video embed */}
            {isDb && (product as any).video_url && (() => {
              const match = (product as any).video_url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([a-zA-Z0-9_-]{11})/);
              const videoId = match?.[1];
              return videoId ? (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
                  <h2 className="font-display font-semibold text-lg text-foreground mb-3 flex items-center gap-2">
                    <Video size={18} className="text-primary" /> Vídeo do Imóvel
                  </h2>
                  <div className="aspect-video rounded-2xl overflow-hidden border border-border bg-muted">
                    <iframe src={`https://www.youtube.com/embed/${videoId}`} title="Vídeo do imóvel"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen className="w-full h-full" />
                  </div>
                </motion.div>
              ) : null;
            })()}

            {/* Amenities grid */}
            {isDb && <AmenitiesGrid product={product} />}

            {/* Technical Specs */}
            {specEntries.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                <h2 className="font-display font-semibold text-lg text-foreground mb-3">Ficha Técnica</h2>
                <div className="bg-card border border-border rounded-2xl overflow-hidden">
                  {visibleSpecs.map(([key, value], i) => (
                    <div key={key} className={`flex items-center justify-between px-5 py-3 ${i % 2 === 0 ? "bg-card" : "bg-muted/30"} ${i < visibleSpecs.length - 1 ? "border-b border-border" : ""}`}>
                      <span className="text-sm text-muted-foreground">{key}</span>
                      <span className="text-sm text-foreground font-semibold">{String(value)}</span>
                    </div>
                  ))}
                </div>
                {specEntries.length > 8 && (
                  <button onClick={() => setShowAllSpecs(!showAllSpecs)}
                    className="mt-2 w-full flex items-center justify-center gap-1 py-2 text-sm text-primary font-medium hover:underline">
                    {showAllSpecs ? <><ChevronUp size={16} /> Ver menos</> : <><ChevronDown size={16} /> Ver todas ({specEntries.length}) especificações</>}
                  </button>
                )}
              </motion.div>
            )}

            {/* Map */}
            {mapAddress && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                <h2 className="font-display font-semibold text-lg text-foreground mb-3 flex items-center gap-2">
                  <MapPin size={18} className="text-primary" /> Localização
                </h2>
                <MapEmbed address={mapAddress} />
              </motion.div>
            )}

            {/* Financing Simulator */}
            {isDb && !isAluguel && product.price > 0 && product.show_financing && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
                <FinancingSimulator propertyPrice={product.price} />
              </motion.div>
            )}
          </div>

          {/* Sidebar - desktop only */}
          <div className="hidden lg:block space-y-4">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="sticky top-20">
              <SellerCard />
            </motion.div>
          </div>
        </div>

        {/* ── Mobile Seller Card (below main content) ── */}
        <div className="lg:hidden mt-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
            <SellerCard />
          </motion.div>
        </div>

        {/* Related */}
        {relatedProducts.length > 0 && (
          <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="mt-16">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-1 h-8 bg-primary rounded-full" />
              <h2 className="font-display font-bold text-xl text-foreground">Mais Imóveis de {company.name}</h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {relatedProducts.map((rp: any) => (
                <Link
                  key={rp.id}
                  to={buildProductLink(
                    { id: rp.id, slug: rp.slug, _isPartnerImport: dbSeller?.id !== product.seller_id },
                    corretorSlug,
                    dbSeller?.slug || null,
                  )}
                  className="bg-card border border-border rounded-2xl overflow-hidden group hover:shadow-lg hover:border-primary/30 transition-all duration-300"
                >
                  <div className="relative aspect-[4/3] overflow-hidden">
                    <img src={rp.image} alt={rp.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" loading="lazy" />
                    {rp.isAluguel && (
                      <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md text-[10px] font-bold bg-primary text-primary-foreground">🏠 Aluguel</span>
                    )}
                  </div>
                  <div className="p-3">
                    <h3 className="font-display font-semibold text-foreground text-sm leading-tight line-clamp-2">{rp.title}</h3>
                    <p className="font-display font-bold text-primary text-base mt-1">
                      {formatPrice(rp.price)}
                      {rp.isAluguel && <span className="text-xs font-normal text-muted-foreground"> /mês</span>}
                    </p>
                    {(rp.neighborhood || rp.city) && (
                      <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                        <MapPin size={11} className="flex-shrink-0" />
                        {[rp.neighborhood, rp.city].filter(Boolean).join(", ")}
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </motion.section>
        )}
      </div>

      {/* ── Mobile sticky CTA bar ── */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-card/95 backdrop-blur-lg border-t border-border px-4 py-3 safe-bottom">
        <div className="flex items-center gap-3">
          <Link to={companyUrl} className="flex-shrink-0">
            {company.logo ? (
              <img src={company.logo} alt={company.name} className="w-10 h-10 rounded-xl object-cover border border-border" />
            ) : (
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center border border-border">
                <span className="font-bold text-primary text-sm">{company.name?.charAt(0)}</span>
              </div>
            )}
          </Link>
          <div className="min-w-0 flex-1">
            <p className="font-display font-bold text-foreground text-sm truncate">{company.name}</p>
            {formattedPrice && <p className="text-primary font-bold text-xs">{formattedPrice}{isAluguel ? " /mês" : ""}</p>}
          </div>
          {company.whatsapp && dbItem?.status !== "vendido" && (
            <button onClick={() => handleWhatsAppClick()}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-sm transition-colors shadow-lg flex-shrink-0">
              <MessageCircle size={16} /> WhatsApp
            </button>
          )}
        </div>
      </div>

      {isDb && dbSeller && (
        <WhatsAppLeadCapture
          open={leadCaptureOpen}
          onOpenChange={setLeadCaptureOpen}
          sellerId={dbItem?.seller_id || ""}
          sellerUserId={dbSeller.user_id}
          onComplete={() => {
            if (pendingWhatsAppAction) { pendingWhatsAppAction(); setPendingWhatsAppAction(null); }
          }}
          teamMemberId={teamMember?.origin === "manual" ? teamMember?.id : null}
          partnerBrokerSellerId={teamMember?.origin === "partnership" && teamMember?.linked_profile_id ? teamMember.linked_profile_id : null}
          partnerBrokerUserId={teamMember?.origin === "partnership" && teamMember?._linked_user_id ? teamMember._linked_user_id : null}
        />
      )}
    </div>
    </>
  );
}
