import { useState, useMemo, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "@/hooks/use-toast";
import { useParams, Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Star, MapPin, MessageCircle, Share2, Key, Home, Building2, Landmark, Store, Warehouse, MoreHorizontal, Image, Eye, Instagram, Phone, ExternalLink, Clock, Shield, Zap, ChevronLeft, ChevronRight, Heart, BadgeCheck, Clapperboard, Play, X, Volume2, VolumeX } from "lucide-react";
import StoreEffects from "@/components/StoreEffects";
import { getStoreTheme } from "@/components/StoreThemePicker";
import { formatPrice, getTagStyle, getTagLabel } from "@/data/products";
import { supabase } from "@/integrations/supabase/client";
import { trackSellerEvent } from "@/hooks/useSellerAnalytics";
import { useSellerSubscription } from "@/hooks/useSubscription";
import MapEmbed from "@/components/MapEmbed";
import PackageBadge from "@/components/PackageBadge";
import { useWhatsAppPicker } from "@/components/WhatsAppTeamPicker";
import StoryViewer from "@/components/StoryViewer";
import { useStories } from "@/hooks/useStories";

const propertySubcategories = [
  { slug: "todos", name: "Todos", icon: Store, img: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=300&h=200&fit=crop" },
  { slug: "aluguel", name: "Aluguéis", icon: Key, img: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=300&h=200&fit=crop" },
  { slug: "casa", name: "Casas", icon: Home, img: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=300&h=200&fit=crop" },
  { slug: "apartamento", name: "Apartamentos", icon: Building2, img: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=300&h=200&fit=crop" },
  { slug: "terreno", name: "Terrenos", icon: Landmark, img: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=300&h=200&fit=crop" },
  { slug: "comercial", name: "Comerciais", icon: Store, img: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=300&h=200&fit=crop" },
  { slug: "flat", name: "Flats", icon: Building2, img: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=300&h=200&fit=crop" },
  { slug: "galpao", name: "Galpões", icon: Warehouse, img: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=300&h=200&fit=crop" },
];



function extractYouTubeId(url: string): string | null {
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([a-zA-Z0-9_-]{11})/);
  return match ? match[1] : null;
}


function isUUID(str: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
}

export default function CompanyProfile() {
  const { id } = useParams();
  const location = useLocation();
  const [activeCategory, setActiveCategory] = useState("todos");
  const [filterCity, setFilterCity] = useState("");
  const [dbProfile, setDbProfile] = useState<any>(null);
  const [dbItems, setDbItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDbProfile, setIsDbProfile] = useState(false);
  const [heroSlide, setHeroSlide] = useState(0);
  const [galleryLightbox, setGalleryLightbox] = useState<number | null>(null);
  const [gallerySlide, setGallerySlide] = useState(0);
  const [galleryPaused, setGalleryPaused] = useState(false);
  const [teamMember, setTeamMember] = useState<any>(null);
  const [videoModalOpen, setVideoModalOpen] = useState(false);
  const [videoMuted, setVideoMuted] = useState(true);
  const { openWhatsApp: openWhatsAppPicker } = useWhatsAppPicker();
  const { sellerStories } = useStories();
  const [storyViewerOpen, setStoryViewerOpen] = useState(false);

  const searchParams = new URLSearchParams(location.search);
  const corretorSlug = searchParams.get("corretor");

  const resolvedProfileId = isDbProfile ? dbProfile?.id : undefined;
  const sellerTier = useSellerSubscription(resolvedProfileId);

  useEffect(() => {
    if (!id) {
      setIsDbProfile(false);
      setLoading(false);
      return;
    }
    // If UUID, fetch directly; otherwise treat as slug
    if (isUUID(id)) {
      setIsDbProfile(true);
      fetchProfileById(id);
    } else {
      setIsDbProfile(true);
      fetchProfileBySlug(id);
    }
  }, [id, corretorSlug]);

  const fetchProfileById = async (profileId: string) => {
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", profileId)
      .single();
    await loadProfileData(profile);
  };

  const fetchProfileBySlug = async (slug: string) => {
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("slug", slug)
      .single();
    if (!profile) {
      // Try static company fallback
      setIsDbProfile(false);
      setLoading(false);
      return;
    }
    await loadProfileData(profile);
  };

  const loadProfileData = async (profile: any) => {
    if (profile) {
      setDbProfile(profile);
      const pid = profile.id;
      // Paginate to fetch all items (Supabase default limit is 1000)
      let allItems: any[] = [];
      let page = 0;
      const pageSize = 1000;
      let hasMore = true;
      while (hasMore) {
        const { data: batch } = await supabase
          .from("seller_items")
          .select("*")
          .eq("seller_id", pid)
          .in("status", ["ativo", "vendido"] as any)
          .order("created_at", { ascending: false })
          .range(page * pageSize, (page + 1) * pageSize - 1);
        if (batch && batch.length > 0) {
          allItems = [...allItems, ...batch];
          hasMore = batch.length === pageSize;
          page++;
        } else {
          hasMore = false;
        }
      }
      const items = allItems;
      
      // Filter out sold items older than 24h
      const cutoff = Date.now() - 24 * 60 * 60 * 1000;
      const filteredItems = (items || []).filter((item: any) => {
        if (item.status === "vendido" && item.sold_at) {
          return new Date(item.sold_at).getTime() > cutoff;
        }
        return true;
      });

      // Sort by seller's custom item_order if available
      const savedOrder: string[] = profile.item_order || [];
      if (savedOrder.length > 0) {
        filteredItems.sort((a: any, b: any) => {
          const ai = savedOrder.indexOf(a.id);
          const bi = savedOrder.indexOf(b.id);
          if (ai === -1 && bi === -1) return 0;
          if (ai === -1) return 1;
          if (bi === -1) return -1;
          return ai - bi;
        });
      }

      setDbItems(filteredItems);

      if (corretorSlug) {
        const { data: member } = await supabase
          .from("team_members")
          .select("*")
          .eq("company_id", pid)
          .eq("slug", corretorSlug)
          .eq("is_active", true)
          .single();
        setTeamMember(member || null);
      } else {
        setTeamMember(null);
      }
    }
    setLoading(false);

    if (profile) {
      // teamMember was already resolved above via corretorSlug
      const resolvedMemberId = corretorSlug
        ? await supabase
            .from("team_members")
            .select("id")
            .eq("company_id", profile.id)
            .eq("slug", corretorSlug)
            .eq("is_active", true)
            .maybeSingle()
            .then(r => r.data?.id || null)
        : null;
      trackSellerEvent(profile.id, "view", undefined, resolvedMemberId || undefined);
    }
  };

  const company = isDbProfile
    ? dbProfile
      ? {
          id: dbProfile.id,
          name: teamMember ? teamMember.full_name : (dbProfile.company_name || dbProfile.full_name),
          logo: teamMember?.photo_url || dbProfile.logo_url || "",
          address: [dbProfile.address, dbProfile.city, dbProfile.state].filter(Boolean).join(", "),
          rating: "5.0",
          reviewCount: 0,
          whatsapp: teamMember?.phone || dbProfile.phone || "",
          instagram: (teamMember?.instagram || dbProfile.instagram) || "",
          segment: dbProfile.seller_type,
          show_location: dbProfile.show_location ?? true,
        }
      : null
    : null;

  const vehicleCategories: string[] = [];
  const isProperty = true;
  const subcategories = propertySubcategories;

  const dbDisplayItems = dbItems.map((item) => ({
    id: item.id,
    title: item.title,
    image: item.photos?.[0] || "",
    images: item.photos || [],
    price: item.price || 0,
    tag: item.tags?.[0] || null,
    tags: item.tags || [],
    category: item.category,
    city: item.city,
    description: item.description,
    specs: {} as Record<string, string>,
    type: "imovel" as const,
    status: item.status,
    sold_at: item.sold_at,
  }));

  const products = isDbProfile ? dbDisplayItems : [];

  const filteredProducts = useMemo(() => {
    let filtered = products;
    // Filter by city if selected
    if (filterCity) {
      filtered = filtered.filter((p: any) => p.city === filterCity);
    }
    if (activeCategory === "todos") return filtered;
    if (activeCategory === "aluguel") {
      return filtered.filter((p: any) => {
        const tags: string[] = p.tags || [];
        return tags.includes("aluguel_flex");
      });
    }
    return filtered.filter((p: any) => {
      if (isDbProfile) return p.category === activeCategory;
      return true;
    });
  }, [products, activeCategory, isDbProfile, filterCity]);

  // Get unique cities from products
  const availableCities = useMemo(() => {
    const cities = new Set<string>();
    products.forEach((p: any) => { if (p.city) cities.add(p.city); });
    return Array.from(cities).sort();
  }, [products]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { todos: products.length };
    products.forEach((p: any) => {
      const cat = isDbProfile ? p.category : "todos";
      counts[cat] = (counts[cat] || 0) + 1;
      const tags: string[] = p.tags || [];
      if (tags.includes("aluguel_flex")) {
        counts["aluguel"] = (counts["aluguel"] || 0) + 1;
      }
    });
    return counts;
  }, [products, isDbProfile]);

  // Hero images: prioritize seller-chosen hero_item_ids, fallback to all products
  const heroImages = useMemo(() => {
    const heroIds: string[] = (dbProfile as any)?.hero_item_ids || [];
    const pool = heroIds.length > 0
      ? products.filter((p: any) => p.image && heroIds.includes(p.id))
      : products.filter((p: any) => p.image).slice(0, 5);
    return pool.map((p: any) => ({ image: p.image, title: p.title, price: p.price, id: p.id }));
  }, [products, dbProfile]);

  // Auto-slide hero
  useEffect(() => {
    if (heroImages.length <= 1) return;
    const timer = setInterval(() => setHeroSlide((p) => (p + 1) % heroImages.length), 5000);
    return () => clearInterval(timer);
  }, [heroImages.length]);

  // Auto-slide gallery
  useEffect(() => {
    if (galleryPaused || galleryLightbox !== null) return;
    const timer = setInterval(() => setGallerySlide((p) => p + 1), 6000);
    return () => clearInterval(timer);
  }, [galleryPaused, galleryLightbox]);

  // Fullscreen + landscape lock for cinema mode
  useEffect(() => {
    if (galleryLightbox !== null) {
      const el = document.documentElement;
      if (el.requestFullscreen) {
        el.requestFullscreen().then(() => {
          try { (screen.orientation as any).lock?.("landscape"); } catch {}
        }).catch(() => {});
      }
    } else {
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
      try { (screen.orientation as any).unlock?.(); } catch {}
    }
  }, [galleryLightbox]);


  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!company) {
    return (
      <div className="container max-w-6xl mx-auto px-4 py-20 text-center">
        <h1 className="font-display font-bold text-2xl text-foreground">Empresa não encontrada</h1>
        <Link to="/" className="text-primary text-sm mt-4 inline-block hover:underline">Voltar ao início</Link>
      </div>
    );
  }

  const featuredItemId = isDbProfile ? dbProfile?.featured_item_id : null;
  const heroProduct = featuredItemId
    ? products.find((p: any) => p.id === featuredItemId) || products[0]
    : products[0];

  const handleWhatsApp = (title: string, productId?: string) => {
    if (isDbProfile && id) trackSellerEvent(id, "whatsapp_click", productId, teamMember?.id);
    const seg = "imoveis";
    const link = productId 
      ? `${window.location.origin}/${seg}/produto/${productId}${corretorSlug ? `?corretor=${corretorSlug}` : ""}` 
      : window.location.href;
    
    // If on a broker's mirror store, go directly to broker's WhatsApp
    if (teamMember && teamMember.phone) {
      const phone = teamMember.phone.replace(/\D/g, "");
      const msg = productId
        ? `Olá ${teamMember.full_name}! 🏠 Vi o imóvel *${title}* na sua loja e gostaria de mais informações.\n\n🔗 ${link}`
        : `Olá ${teamMember.full_name}! 🏠 Vim da sua loja ES Corretores e gostaria de mais informações sobre seus imóveis.\n\n🔗 ${link}`;
      window.open(`https://wa.me/55${phone}?text=${encodeURIComponent(msg)}`, "_blank");
      return;
    }
    
    openWhatsAppPicker({
      sellerId: company.id,
      sellerName: company.name,
      sellerPhone: company.whatsapp,
      title,
      link,
    });
  };

  const isPaid = sellerTier !== "basico";
  const videoId = dbProfile?.video_url ? extractYouTubeId(dbProfile.video_url) : null;
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const hasVideoHero = !!(videoId && sellerTier && sellerTier !== "basico" && sellerTier !== "start" && !isIOS);
  const storeTheme = getStoreTheme((dbProfile as any)?.store_theme);

  return (
    <div
      className="min-h-screen"
      style={{
        background: storeTheme.bg,
        color: storeTheme.text,
        ["--store-bg" as any]: storeTheme.bg,
        ["--store-card" as any]: storeTheme.card,
        ["--store-text" as any]: storeTheme.text,
        ["--store-text-muted" as any]: storeTheme.textMuted,
        ["--store-primary" as any]: storeTheme.primary,
        ["--store-accent" as any]: storeTheme.accent,
        ["--store-border" as any]: storeTheme.border,
      }}
    >
      {/* ═══════════ SEO META TAGS ═══════════ */}
      {company && (
        <Helmet>
          <title>{company.name} — Imóveis em {dbProfile?.city || "ES"} | ES Corretores</title>
          <meta name="description" content={`${company.name} — ${dbProfile?.bio ? dbProfile.bio.slice(0, 140) : `Encontre os melhores imóveis com ${company.name} em ${dbProfile?.city || "Espírito Santo"}`}.`} />
          <link rel="canonical" href={`https://lojaes.lovable.app/empresa/${dbProfile?.slug || id}`} />

          {/* Open Graph */}
          <meta property="og:type" content="website" />
          <meta property="og:title" content={`${company.name} — Imóveis em ${dbProfile?.city || "ES"}`} />
          <meta property="og:description" content={dbProfile?.bio ? dbProfile.bio.slice(0, 200) : `Veja os ${products.length} anúncios de ${company.name}`} />
          <meta property="og:url" content={`https://lojaes.lovable.app/empresa/${dbProfile?.slug || id}`} />
          {company.logo && <meta property="og:image" content={company.logo} />}
          <meta property="og:site_name" content="ES Corretores" />

          {/* Twitter Card */}
          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:title" content={`${company.name} — Imóveis em ${dbProfile?.city || "ES"}`} />
          <meta name="twitter:description" content={dbProfile?.bio ? dbProfile.bio.slice(0, 200) : `Veja os ${products.length} anúncios de ${company.name}`} />
          {company.logo && <meta name="twitter:image" content={company.logo} />}

          {/* JSON-LD Structured Data */}
          <script type="application/ld+json">
            {JSON.stringify({
              "@context": "https://schema.org",
              "@type": "RealEstateAgent",
              "name": company.name,
              "url": `https://lojaes.lovable.app/empresa/${dbProfile?.slug || id}`,
              "logo": company.logo || undefined,
              "image": company.logo || undefined,
              "description": dbProfile?.bio || `Imóveis em ${dbProfile?.city || "ES"}`,
              "address": company.address ? {
                "@type": "PostalAddress",
                "streetAddress": dbProfile?.address || "",
                "addressLocality": dbProfile?.city || "",
                "addressRegion": dbProfile?.state || "ES",
                "addressCountry": "BR",
              } : undefined,
              "telephone": company.whatsapp || undefined,
              "numberOfEmployees": products.length > 0 ? undefined : undefined,
              "makesOffer": {
                "@type": "Offer",
                "itemOffered": {
                  "@type": "Product",
                  "name": `Imóveis de ${company.name}`,
                  "description": `${products.length} imóveis disponíveis`,
                },
              },
            })}
          </script>
        </Helmet>
      )}

      {isDbProfile && dbProfile?.id && <StoreEffects sellerId={dbProfile.id} />}
      {/* ═══════════ HERO BANNER ═══════════ */}
      <section className={`relative overflow-hidden ${hasVideoHero ? "h-[55vh] md:h-[70vh]" : "h-[50vh] md:h-[60vh]"}`}>

        {/* Video background or sliding images */}
        {hasVideoHero ? (
          <iframe
            src={`https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&loop=1&playlist=${videoId}&controls=0&showinfo=0&rel=0&modestbranding=1&playsinline=1&iv_load_policy=3&disablekb=1&enablejsapi=1`}
            title="Vídeo de fundo"
            allow="autoplay; encrypted-media; playsinline"
            className="absolute pointer-events-none"
            style={{
              top: "50%",
              left: "60%",
              width: "100vw",
              height: "56.25vw",
              minWidth: "177.78vh",
              minHeight: "100vh",
              transform: "translate(-50%, -50%) scale(1.65)",
              transformOrigin: "center center",
            }}
          />
        ) : (
          <>
            <AnimatePresence mode="wait">
              {heroImages.length > 0 && (
                <motion.img
                  key={heroSlide}
                  src={heroImages[heroSlide].image}
                  alt={heroImages[heroSlide].title}
                  initial={{ opacity: 0, scale: 1.05 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.8 }}
                  className="absolute inset-0 w-full h-full object-cover"
                />
              )}
            </AnimatePresence>
          </>
        )}
        {heroImages.length === 0 && !hasVideoHero && (
          <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/80 to-accent" />
        )}

        {/* Overlays — heavier on the left for video */}
        {hasVideoHero ? (
          <>
            <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-black/5" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/10" />
          </>
        ) : (
          <>
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/5" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />
          </>
        )}

        {/* Back button */}
        <div className="absolute top-4 left-4 z-20">
          <Link to="/imoveis" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 backdrop-blur-md text-white text-sm font-medium hover:bg-white/20 transition-colors">
            <ArrowLeft size={16} /> Voltar
          </Link>
        </div>

        {/* Tier Badge */}
        {isPaid && (
          <div className="absolute top-4 right-4 z-20">
            <PackageBadge tier={sellerTier} size="lg" />
          </div>
        )}

        {/* Hero slide arrows (only when no video) */}
        {!hasVideoHero && heroImages.length > 1 && (
          <>
            <button onClick={() => setHeroSlide((p) => (p - 1 + heroImages.length) % heroImages.length)} className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/50 transition-colors">
              <ChevronLeft size={20} />
            </button>
            <button onClick={() => setHeroSlide((p) => (p + 1) % heroImages.length)} className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/50 transition-colors">
              <ChevronRight size={20} />
            </button>
          </>
        )}



        {/* Company info overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10 z-10">
          <div className="max-w-[1800px] mx-auto px-4 md:px-8">
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="max-w-3xl">
              <div className="flex items-center gap-4 mb-3">
                {(() => {
                  const sellerStoryData = sellerStories.find(s => s.sellerId === dbProfile?.id);
                  const hasActiveStory = !!sellerStoryData;
                  const storySellerIndex = sellerStories.findIndex(s => s.sellerId === dbProfile?.id);
                  
                  const logoContent = company.logo ? (
                    <img src={company.logo} alt={company.name} className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <div className="w-full h-full rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center">
                      <span className="text-white font-bold text-2xl">{company.name?.charAt(0)}</span>
                    </div>
                  );

                  return hasActiveStory ? (
                    <button
                      onClick={() => { setStoryViewerOpen(true); }}
                      className="w-16 h-16 md:w-20 md:h-20 rounded-full p-[3px] bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 shrink-0 cursor-pointer hover:scale-105 transition-transform"
                    >
                      <div className="w-full h-full rounded-full bg-black p-[2px]">
                        {logoContent}
                      </div>
                    </button>
                  ) : (
                    <div className="w-16 h-16 md:w-20 md:h-20 rounded-full border-2 border-white/30 shadow-2xl overflow-hidden shrink-0">
                      {logoContent}
                    </div>
                  );
                })()}
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="font-display font-bold text-2xl md:text-4xl text-white leading-tight">{company.name}</h1>
                    {isPaid && <BadgeCheck size={22} className="text-primary" />}
                  </div>
                  <div className="flex items-center gap-3 mt-1 flex-wrap">
                    {dbProfile?.seller_category && (
                      <span className="flex items-center gap-1 text-white/80 text-xs font-medium bg-white/10 px-2 py-0.5 rounded-full">
                        {({ imobiliaria: "🏢 Imobiliária", corretor: "📋 Corretor(a)", proprietario: "🏠 Proprietário" } as Record<string, string>)[dbProfile.seller_category]}
                        {dbProfile.seller_category === "corretor" && dbProfile.creci && ` • ${dbProfile.creci}`}
                      </span>
                    )}
                    {company.address && (
                      <span className="flex items-center gap-1 text-white/70 text-xs">
                        <MapPin size={12} /> {company.address}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Video title & description */}
              {hasVideoHero && ((dbProfile as any)?.video_title || (dbProfile as any)?.video_description) && (
                <div className="mt-3">
                  {(dbProfile as any)?.video_title && (
                    <p className="text-white/90 font-display font-bold text-lg md:text-2xl drop-shadow-lg">{(dbProfile as any).video_title}</p>
                  )}
                  {(dbProfile as any)?.video_description && (
                    <p className="text-white/60 text-sm md:text-base mt-1 max-w-xl line-clamp-2">{(dbProfile as any).video_description}</p>
                  )}
                </div>
              )}

              {/* Action buttons */}
              <div className="flex flex-nowrap gap-1.5 md:gap-2 mt-4 overflow-x-auto scrollbar-hide">
                {company.whatsapp && (
                  <button onClick={() => handleWhatsApp(heroProduct?.title || company.name)} className="flex items-center justify-center gap-1.5 px-2.5 py-2 md:px-5 md:py-2.5 rounded-xl bg-[#25d366] text-white font-bold text-[11px] md:text-sm hover:bg-[#22c55e] transition-colors shadow-lg whitespace-nowrap flex-shrink-0 min-w-9 md:min-w-0">
                    <MessageCircle size={14} />
                    <span className="hidden md:inline">WhatsApp</span>
                  </button>
                )}
                {(company as any).instagram && ["vip", "premium", "essencial_empresa", "premium_empresa", "prime_empresa"].includes(sellerTier || "") && (
                  <a href={`https://instagram.com/${(company as any).instagram.replace(/^@/, "")}`} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-1.5 px-2.5 py-2 md:px-5 md:py-2.5 rounded-xl bg-gradient-to-r from-[#833AB4] via-[#E1306C] to-[#F77737] text-white font-bold text-[11px] md:text-sm hover:opacity-90 transition-opacity shadow-lg whitespace-nowrap flex-shrink-0 min-w-9 md:min-w-0">
                    <Instagram size={14} />
                    <span className="hidden md:inline">Instagram</span>
                  </a>
                )}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center justify-center gap-1.5 px-2.5 py-2 md:px-4 md:py-2.5 rounded-xl bg-white/10 backdrop-blur-md text-white text-[11px] md:text-sm font-medium hover:bg-white/20 transition-colors whitespace-nowrap flex-shrink-0 min-w-9 md:min-w-0">
                      <Share2 size={13} />
                      <span className="hidden sm:inline">Compartilhar</span>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem onClick={() => {
                      const text = `Confira ${company.name} no ES Corretores: ${window.location.href}`;
                      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
                    }}>
                      <MessageCircle size={16} className="mr-2 text-[#25d366]" /> Enviar via WhatsApp
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => {
                      navigator.clipboard.writeText(window.location.href);
                      toast({ title: "Link copiado!", description: "O link da loja foi copiado." });
                    }}>
                      <ExternalLink size={16} className="mr-2" /> Copiar link
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                {videoId && sellerTier && sellerTier !== "basico" && sellerTier !== "start" && (
                  <button
                    onClick={() => { setVideoMuted(false); setVideoModalOpen(true); }}
                    className="flex items-center justify-center gap-1.5 px-2.5 py-2 md:px-5 md:py-2.5 rounded-xl bg-destructive text-destructive-foreground font-bold text-[11px] md:text-sm hover:opacity-90 transition-opacity shadow-lg whitespace-nowrap flex-shrink-0 min-w-9 md:min-w-0"
                  >
                    <Play size={14} fill="currentColor" />
                    <span className="hidden md:inline">Assistir</span>
                  </button>
                )}
                <button
                  onClick={() => setGalleryLightbox(0)}
                  className="flex items-center justify-center gap-1.5 px-2.5 py-2 md:px-4 md:py-2.5 rounded-xl bg-white/10 backdrop-blur-md text-white text-[11px] md:text-sm font-medium hover:bg-white/20 transition-colors whitespace-nowrap flex-shrink-0 min-w-9 md:min-w-0"
                  title="Modo Cinema"
                >
                  <Clapperboard size={13} />
                  <span className="hidden sm:inline">Modo Cinema</span>
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ═══════════ STATS BAR ═══════════ */}
      <section style={{ borderBottom: `1px solid ${storeTheme.border}`, background: storeTheme.card }}>
        <div className="max-w-[1800px] mx-auto px-4 md:px-8">
          <div className="flex items-center gap-6 py-3 overflow-x-auto scrollbar-hide">
            <div className="flex items-center gap-2 text-sm flex-shrink-0">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${storeTheme.primary}18` }}>
                <Store size={16} style={{ color: storeTheme.primary }} />
              </div>
              <div>
                <p className="font-bold" style={{ color: storeTheme.text }}>{products.length}</p>
                <p className="text-[10px]" style={{ color: storeTheme.textMuted }}>Anúncios</p>
              </div>
            </div>
            <div className="w-px h-8 flex-shrink-0" style={{ background: storeTheme.border }} />
            <div className="flex items-center gap-2 text-sm flex-shrink-0">
              <div className="w-8 h-8 rounded-lg bg-[#25d366]/10 flex items-center justify-center">
                <MessageCircle size={16} className="text-[#25d366]" />
              </div>
              <div>
                <p className="font-bold" style={{ color: storeTheme.text }}>Direto</p>
                <p className="text-[10px]" style={{ color: storeTheme.textMuted }}>WhatsApp</p>
              </div>
            </div>
            <div className="w-px h-8 flex-shrink-0" style={{ background: storeTheme.border }} />
            <div className="flex items-center gap-2 text-sm flex-shrink-0">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${storeTheme.accent}30` }}>
                <Shield size={16} style={{ color: storeTheme.accent }} />
              </div>
              <div>
                <p className="font-bold" style={{ color: storeTheme.text }}>{isPaid ? "Verificado" : "Ativo"}</p>
                <p className="text-[10px]" style={{ color: storeTheme.textMuted }}>Vendedor</p>
              </div>
            </div>
            {isPaid && (
              <>
                <div className="w-px h-8 flex-shrink-0" style={{ background: storeTheme.border }} />
                <div className="flex items-center gap-2 text-sm flex-shrink-0">
                  <PackageBadge tier={sellerTier} size="sm" />
                </div>
              </>
            )}
          </div>
        </div>
      </section>


      {/* ═══════════ MAIN LAYOUT ═══════════ */}
      <div className="max-w-[1800px] mx-auto px-4 md:px-8 py-6">
        <div className="flex gap-8">
          {/* ═══════════ DESKTOP SIDEBAR ═══════════ */}
          <aside className="hidden lg:block w-[280px] flex-shrink-0">
            <div className="sticky top-20 space-y-4">
              {/* Company Card */}
              <div className="rounded-2xl overflow-hidden" style={{ background: storeTheme.card, border: `1px solid ${storeTheme.border}` }}>
                {/* Mini banner */}
                <div className="h-20 relative" style={{ background: dbProfile?.cover_color || storeTheme.preview.heroBg }}>
                  {company.logo && (
                    <img src={company.logo} alt="" className="absolute -bottom-6 left-4 w-14 h-14 rounded-xl object-cover border-3 border-card shadow-lg" />
                  )}
                </div>
                <div className="p-4 pt-8">
                  <h3 className="font-display font-bold text-sm" style={{ color: storeTheme.text }}>{company.name}</h3>
                  {teamMember ? (
                    <>
                      <p className="text-xs mt-0.5" style={{ color: storeTheme.textMuted }}>Corretor(a) de Imóveis</p>
                      {teamMember.creci && (
                        <p className="text-xs font-semibold mt-1 flex items-center gap-1" style={{ color: storeTheme.primary }}>
                          <Shield size={12} /> {teamMember.creci}
                        </p>
                      )}
                      <p className="text-[10px] mt-1" style={{ color: storeTheme.textMuted }}>
                        Vinculado a {dbProfile?.company_name || dbProfile?.full_name}
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-xs mt-0.5" style={{ color: storeTheme.textMuted }}>
                        {dbProfile?.seller_category
                          ? ({ imobiliaria: "Imobiliária", corretor: "Corretor(a) de Imóveis", proprietario: "Proprietário" } as Record<string, string>)[dbProfile.seller_category] || "Imobiliária"
                          : "Imobiliária"}
                      </p>
                      {dbProfile?.seller_category === "corretor" && dbProfile?.creci && (
                        <p className="text-xs font-semibold mt-1 flex items-center gap-1" style={{ color: storeTheme.primary }}>
                          <Shield size={12} /> {dbProfile.creci}
                        </p>
                      )}
                    </>
                  )}
                  
                  {company.address && (
                    <div className="flex items-start gap-2 text-xs mt-3" style={{ color: storeTheme.textMuted }}>
                      <MapPin size={12} className="mt-0.5 flex-shrink-0" style={{ color: storeTheme.primary }} />
                      <span>{company.address}</span>
                    </div>
                  )}

                  <div className="mt-4 space-y-2">
                    {company.whatsapp && (
                      <button
                        onClick={() => handleWhatsApp(company.name)}
                        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#25d366] text-white font-bold text-xs hover:bg-[#22c55e] transition-colors"
                      >
                        <MessageCircle size={14} /> Falar no WhatsApp
                      </button>
                    )}
                    {(company as any).instagram && ["vip", "essencial_empresa", "premium_empresa"].includes(sellerTier || "") && (
                      <a
                        href={`https://instagram.com/${(company as any).instagram.replace(/^@/, "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-[#833AB4] via-[#E1306C] to-[#F77737] text-white font-bold text-xs hover:opacity-90 transition-opacity"
                      >
                        <Instagram size={14} /> Instagram
                      </a>
                    )}
                  </div>
                </div>
              </div>

              {/* About Section */}
              <div className="rounded-2xl p-4" style={{ background: storeTheme.card, border: `1px solid ${storeTheme.border}` }}>
                <h3 className="font-display font-bold text-sm mb-3 flex items-center gap-2" style={{ color: storeTheme.text }}>
                  <BadgeCheck size={14} style={{ color: storeTheme.primary }} /> Sobre a empresa
                </h3>
                {teamMember && dbProfile?.logo_url && (
                  <div className="flex items-center gap-3 mb-3 p-2 rounded-xl" style={{ background: `${storeTheme.primary}10` }}>
                    <img src={dbProfile.logo_url} alt={dbProfile.company_name || dbProfile.full_name} className="w-10 h-10 rounded-lg object-cover" style={{ border: `1px solid ${storeTheme.border}` }} />
                    <div>
                      <p className="text-xs font-bold" style={{ color: storeTheme.text }}>{dbProfile.company_name || dbProfile.full_name}</p>
                      {dbProfile.cnpj && <p className="text-[10px]" style={{ color: storeTheme.textMuted }}>CNPJ: {dbProfile.cnpj}</p>}
                    </div>
                  </div>
                )}
                {!teamMember && dbProfile?.cnpj && (
                  <div className="flex items-center gap-2 mb-3 text-xs" style={{ color: storeTheme.textMuted }}>
                    <Shield size={13} className="flex-shrink-0" style={{ color: storeTheme.primary }} />
                    <span>CNPJ: {dbProfile.cnpj}</span>
                  </div>
                )}
                {dbProfile?.bio && (
                  <p className="text-sm mb-3 whitespace-pre-line" style={{ color: storeTheme.text }}>{dbProfile.bio}</p>
                )}
                <div className="space-y-3 text-xs" style={{ color: storeTheme.textMuted }}>
                  <div className="flex items-center gap-2">
                    <Store size={13} className="flex-shrink-0" />
                    <span>
                      {dbProfile?.seller_category
                        ? ({ imobiliaria: "Imobiliária", corretor: "Corretor(a) de Imóveis", proprietario: "Proprietário" } as Record<string, string>)[dbProfile.seller_category] || "Especialista em imóveis"
                        : "Especialista em imóveis"}
                    </span>
                  </div>
                  {dbProfile?.seller_category === "corretor" && dbProfile?.creci && (
                    <div className="flex items-center gap-2">
                      <Shield size={13} className="flex-shrink-0" style={{ color: storeTheme.primary }} />
                      <span className="font-semibold" style={{ color: storeTheme.primary }}>{dbProfile.creci}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Zap size={13} className="flex-shrink-0" />
                    <span>Contato direto via WhatsApp</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Shield size={13} className="flex-shrink-0" />
                    <span>{isPaid ? "Vendedor verificado e premium" : "Vendedor ativo na plataforma"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock size={13} className="flex-shrink-0" />
                    <span>Atendimento em horário comercial</span>
                  </div>
                </div>
              </div>

              {/* Category Navigation */}
              <div className="rounded-2xl p-4" style={{ background: storeTheme.card, border: `1px solid ${storeTheme.border}` }}>
                <h3 className="font-display font-bold text-sm mb-3" style={{ color: storeTheme.text }}>Categorias</h3>
                <nav className="space-y-1">
                  {subcategories.map((cat) => {
                    const Icon = cat.icon;
                    const isActive = activeCategory === cat.slug;
                    const count = categoryCounts[cat.slug] || 0;
                    return (
                      <button
                        key={cat.slug}
                        onClick={() => setActiveCategory(cat.slug)}
                        className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-medium transition-all`}
                        style={{
                          background: isActive ? storeTheme.primary : "transparent",
                          color: isActive ? "#fff" : storeTheme.textMuted,
                          boxShadow: isActive ? "0 4px 12px rgba(0,0,0,0.15)" : "none",
                        }}
                      >
                        <Icon size={14} />
                        <span className="flex-1 text-left">{cat.name}</span>
                        {cat.slug === "todos" ? (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: isActive ? "rgba(255,255,255,0.2)" : `${storeTheme.border}` }}>{products.length}</span>
                        ) : count > 0 ? (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: isActive ? "rgba(255,255,255,0.2)" : `${storeTheme.border}` }}>{count}</span>
                        ) : null}
                      </button>
                    );
                  })}
                </nav>
              </div>
            </div>
          </aside>

          {/* ═══════════ MAIN CONTENT ═══════════ */}
          <div className="flex-1 min-w-0">
            {/* Mobile Category Carousel — Epic Premium Cards */}
            <div className="lg:hidden mb-6">
              <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-3 snap-x snap-mandatory -mx-4 px-4">
                {subcategories.map((cat) => {
                  const Icon = cat.icon;
                  const isActive = activeCategory === cat.slug;
                  const count = cat.slug === "todos" ? products.length : (categoryCounts[cat.slug] || 0);
                  return (
                    <button
                      key={cat.slug}
                      onClick={() => setActiveCategory(cat.slug)}
                      className="flex-shrink-0 snap-start relative w-28 h-20 rounded-2xl overflow-hidden transition-all duration-300 group"
                      style={{
                        boxShadow: isActive ? `0 0 20px ${storeTheme.primary}40, 0 4px 15px rgba(0,0,0,0.3)` : "0 2px 8px rgba(0,0,0,0.15)",
                        border: isActive ? `2px solid ${storeTheme.primary}` : "2px solid transparent",
                      }}
                    >
                      <img src={cat.img} alt={cat.name} className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/10" />
                      {isActive && <div className="absolute inset-0 bg-primary/20" />}
                      <div className="absolute bottom-0 left-0 right-0 p-2 text-left">
                        <div className="flex items-center gap-1">
                          <Icon size={11} className="text-white/80" />
                          <span className="text-[11px] font-bold text-white leading-tight">{cat.name}</span>
                        </div>
                        {count > 0 && <span className="text-[9px] text-white/70 font-medium">{count} imóveis</span>}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* City Filter — Epic Horizontal Scroll with Photos */}
            {availableCities.length > 1 && (
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <MapPin size={16} style={{ color: storeTheme.primary }} />
                  <h3 className="font-display font-bold text-sm" style={{ color: storeTheme.text }}>Cidades</h3>
                </div>
                <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-3 -mx-4 px-4 snap-x snap-mandatory">
                  {/* All cities button */}
                  <button
                    onClick={() => setFilterCity("")}
                    className="flex-shrink-0 snap-start relative w-32 h-24 md:w-36 md:h-28 rounded-2xl overflow-hidden transition-all duration-300 group"
                    style={{
                      boxShadow: !filterCity ? `0 0 20px ${storeTheme.primary}40, 0 4px 15px rgba(0,0,0,0.3)` : "0 2px 8px rgba(0,0,0,0.15)",
                      border: !filterCity ? `2px solid ${storeTheme.primary}` : "2px solid transparent",
                    }}
                  >
                    <img src="https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=400&h=300&fit=crop" alt="Todas" className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/10" />
                    {!filterCity && <div className="absolute inset-0 bg-primary/20" />}
                    <div className="absolute bottom-0 left-0 right-0 p-2.5">
                      <span className="text-xs font-bold text-white block leading-tight">Todas as Cidades</span>
                      <span className="text-[10px] text-white/70 font-medium">{products.length} imóveis</span>
                    </div>
                  </button>
                  {availableCities.map((city, idx) => {
                    const count = products.filter((p: any) => p.city === city).length;
                    const isActive = filterCity === city;
                    // Rotate through different city images
                    const cityImages = [
                      "https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=400&h=300&fit=crop",
                      "https://images.unsplash.com/photo-1444723121867-7a241cacace9?w=400&h=300&fit=crop",
                      "https://images.unsplash.com/photo-1514565131-fce0801e5785?w=400&h=300&fit=crop",
                      "https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=400&h=300&fit=crop",
                      "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=400&h=300&fit=crop",
                      "https://images.unsplash.com/photo-1486325212027-8081e485255e?w=400&h=300&fit=crop",
                      "https://images.unsplash.com/photo-1500916434205-0c77489c6cf7?w=400&h=300&fit=crop",
                      "https://images.unsplash.com/photo-1518391846015-55a9cc003b25?w=400&h=300&fit=crop",
                    ];
                    const img = cityImages[idx % cityImages.length];
                    return (
                      <button
                        key={city}
                        onClick={() => setFilterCity(isActive ? "" : city)}
                        className="flex-shrink-0 snap-start relative w-32 h-24 md:w-36 md:h-28 rounded-2xl overflow-hidden transition-all duration-300 group"
                        style={{
                          boxShadow: isActive ? `0 0 20px ${storeTheme.primary}40, 0 4px 15px rgba(0,0,0,0.3)` : "0 2px 8px rgba(0,0,0,0.15)",
                          border: isActive ? `2px solid ${storeTheme.primary}` : "2px solid transparent",
                        }}
                      >
                        <img src={img} alt={city} className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" loading="lazy" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/10" />
                        {isActive && <div className="absolute inset-0 bg-primary/20" />}
                        <div className="absolute bottom-0 left-0 right-0 p-2.5">
                          <span className="text-xs font-bold text-white block leading-tight truncate">{city}</span>
                          <span className="text-[10px] text-white/70 font-medium">{count} imóveis</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Products Header */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display font-bold text-lg md:text-xl" style={{ color: storeTheme.text }}>
                {activeCategory === "todos"
                  ? `Todos os Anúncios`
                  : subcategories.find(c => c.slug === activeCategory)?.name}
                {filterCity && <span className="font-normal text-sm ml-2" style={{ color: storeTheme.textMuted }}>em {filterCity}</span>}
                <span className="font-normal text-sm ml-2" style={{ color: storeTheme.textMuted }}>({filteredProducts.length})</span>
              </h2>
            </div>

            {/* Products Grid — Premium cards */}
            {filteredProducts.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-5">
                {filteredProducts.map((product: any, i: number) => {
                  const productLink = `/${product.type === "veiculo" ? "veiculos" : "imoveis"}/produto/${product.id}${corretorSlug ? `?corretor=${corretorSlug}` : ""}`;
                  return (
                    <motion.div
                      key={product.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.03 + i * 0.03 }}
                    >
                      <Link to={productLink} className={`group block rounded-2xl overflow-hidden hover:shadow-lg transition-all duration-300 ${
                        isDbProfile && ((dbProfile as any)?.destaque_item_ids || []).includes(product.id)
                          ? "ring-2 ring-amber-400/60 shadow-[0_0_20px_rgba(251,191,36,0.15)] border-amber-400/40"
                          : ""
                      }`} style={{ background: storeTheme.card, border: `1px solid ${storeTheme.border}` }}>
                        <div className="relative aspect-[4/3] overflow-hidden bg-muted">
                          {product.image ? (
                            <img src={product.image} alt={product.title} className={`w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 ${product.status === "vendido" ? "brightness-50 blur-[1px]" : ""}`} loading="lazy" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Image size={32} className="text-muted-foreground" />
                            </div>
                          )}
                          {/* Sold overlay */}
                          {product.status === "vendido" && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
                              <span className="px-4 py-2 rounded-xl bg-red-600/90 text-white font-bold text-sm shadow-lg">❌ Vendido</span>
                            </div>
                          )}
                          {/* Gradient overlay on hover */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                          {/* Tag */}
                          {product.tag && (
                            <span className={`absolute top-2 left-2 px-2.5 py-1 rounded-lg text-[10px] font-bold shadow-md ${getTagStyle(product.tag)}`}>
                              {getTagLabel(product.tag)}
                            </span>
                          )}
                          {isDbProfile && ((product.tags || []).includes("aluguel_flex") || product.category === "aluguel") && (
                            <span className="absolute top-2 right-2 px-2 py-0.5 rounded-lg text-[10px] font-bold shadow-md bg-primary text-primary-foreground">
                              🏠 Aluguel
                            </span>
                          )}
                          {/* Quick WhatsApp on hover - hide for sold */}
                          {company.whatsapp && product.status !== "vendido" && (
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleWhatsApp(product.title, product.id);
                              }}
                              className="absolute bottom-2 right-2 w-9 h-9 rounded-full bg-[#25d366] text-white flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110"
                            >
                              <MessageCircle size={16} />
                            </button>
                          )}
                        </div>
                        <div className="p-3 md:p-4">
                          <h3 className="font-display font-semibold text-sm leading-tight line-clamp-2 transition-colors" style={{ color: storeTheme.text }}>
                            {product.title}
                          </h3>
                          {product.price > 0 && (
                            <div className="flex items-center gap-2 mt-1.5">
                              <p className="font-display font-bold text-emerald-500 text-base md:text-lg">
                                {isDbProfile
                                  ? `R$ ${product.price.toLocaleString("pt-BR")}`
                                  : formatPrice(product.price)}
                                {isDbProfile && ((product.tags || []).includes("aluguel_flex") || product.category === "aluguel") && (
                                  <span className="text-sm font-normal text-muted-foreground"> /mês</span>
                                )}
                              </p>
                            </div>
                          )}
                          {product.city && (
                            <p className="text-[11px] mt-1.5 flex items-center gap-1" style={{ color: storeTheme.textMuted }}>
                              <MapPin size={10} /> {product.city}
                            </p>
                          )}
                        </div>
                      </Link>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-20 rounded-2xl" style={{ background: storeTheme.card, border: `1px solid ${storeTheme.border}` }}>
                <Image size={48} className="text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground text-lg font-medium">Nenhum anúncio nesta categoria</p>
                <button onClick={() => setActiveCategory("todos")} className="text-primary text-sm mt-2 hover:underline">Ver todos</button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ═══ FULLSCREEN CINEMA MODE ═══ */}
      {(() => {
        const galleryProducts = products.filter((p: any) => p.image || p.images?.length);
        if (galleryProducts.length < 1) return null;
        const seg = isProperty ? "imoveis" : "veiculos";
        const total = galleryProducts.length;

        return (
          <AnimatePresence>
            {galleryLightbox !== null && galleryProducts[galleryLightbox] && (() => {
              const lbProduct = galleryProducts[galleryLightbox];
              const lbImg = lbProduct.images?.[0] || lbProduct.image;

              return (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-50 bg-black"
                >
                  {/* Background */}
                  <AnimatePresence mode="wait">
                    <motion.img
                      key={lbProduct.id}
                      initial={{ opacity: 0, filter: "blur(8px) brightness(0.6)" }}
                      animate={{ opacity: 1, filter: "blur(0px) brightness(1)" }}
                      exit={{ opacity: 0, filter: "blur(4px) brightness(0.5)" }}
                      transition={{ duration: 1.4, ease: [0.25, 0.46, 0.45, 0.94] }}
                      src={lbImg}
                      alt={lbProduct.title}
                      className="absolute inset-0 w-full h-full object-contain md:object-cover animate-[zoomout_12s_ease-in-out_infinite_alternate]"
                    />
                  </AnimatePresence>

                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/20" />
                  <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-transparent" />

                  {/* Close */}
                  <button
                    onClick={() => setGalleryLightbox(null)}
                    className="absolute top-4 right-4 z-50 w-9 h-9 md:w-11 md:h-11 rounded-full bg-white/10 backdrop-blur flex items-center justify-center text-white text-sm md:text-base hover:bg-white/20 transition-colors"
                  >
                    ✕
                  </button>

                  {/* Arrows */}
                  <button
                    onClick={() => setGalleryLightbox((prev) => (prev! - 1 + total) % total)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 z-50 w-10 h-10 md:w-14 md:h-14 rounded-full bg-white/10 backdrop-blur flex items-center justify-center text-white hover:bg-white/20 transition-colors"
                  >
                    <ChevronLeft size={20} className="md:hidden" /><ChevronLeft size={28} className="hidden md:block" />
                  </button>
                  <button
                    onClick={() => setGalleryLightbox((prev) => (prev! + 1) % total)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 z-50 w-10 h-10 md:w-14 md:h-14 rounded-full bg-white/10 backdrop-blur flex items-center justify-center text-white hover:bg-white/20 transition-colors"
                  >
                    <ChevronLeft size={20} className="md:hidden rotate-180" /><ChevronRight size={28} className="hidden md:block" />
                  </button>

                  {/* Content */}
                  <div className="absolute bottom-0 left-0 right-0 p-5 md:p-14 z-10">
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={lbProduct.id}
                        initial={{ opacity: 0, y: 40 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.6 }}
                        className="max-w-3xl"
                      >
                        {/* Store info */}
                        <div className="flex items-center gap-3 mb-4">
                          {company.logo && (
                            <img src={company.logo} alt="" className="w-9 h-9 rounded-lg object-cover border border-white/20" />
                          )}
                          <div>
                            <p className="font-display font-bold text-sm text-white/90">{company.name}</p>
                            <p className="text-[11px] text-white/40">{company.address}</p>
                          </div>
                        </div>

                        {lbProduct.tag && (
                          <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold shadow mb-3 ${getTagStyle(getTagLabel(lbProduct.tag))}`}>
                            {getTagLabel(lbProduct.tag)}
                          </span>
                        )}
                        <h2 className="font-display font-bold text-3xl md:text-6xl text-white leading-tight drop-shadow-2xl">
                          {lbProduct.title}
                        </h2>
                        {lbProduct.description && (
                          <p className="text-white/50 text-sm md:text-lg mt-3 line-clamp-3 max-w-xl">{lbProduct.description}</p>
                        )}
                        {lbProduct.price > 0 && (
                          <p className="font-display font-bold text-2xl md:text-4xl text-emerald-500 mt-4 drop-shadow-lg">
                            {isDbProfile ? `R$ ${lbProduct.price.toLocaleString("pt-BR")}` : formatPrice(lbProduct.price)}
                            {isDbProfile && (((lbProduct as any).tags || []).includes("aluguel_flex") || (lbProduct as any).category === "aluguel") && (
                              <span className="text-lg font-normal text-muted-foreground"> /mês</span>
                            )}
                          </p>
                        )}

                        <div className="flex items-center gap-2 mt-4 flex-wrap">
                          <Link
                            to={`/${seg}/produto/${lbProduct.id}${corretorSlug ? `?corretor=${corretorSlug}` : ""}`}
                            className="inline-flex items-center gap-1.5 px-3 py-2 md:px-6 md:py-3.5 rounded-lg md:rounded-xl bg-white text-black font-bold text-[11px] md:text-sm hover:bg-white/90 transition-all shadow-lg hover:scale-105"
                          >
                            <Eye size={12} className="md:w-4 md:h-4" /> Ver Imóvel
                          </Link>
                          {company.whatsapp && (
                            <button
                              onClick={() => handleWhatsApp(lbProduct.title, lbProduct.id)}
                              className="inline-flex items-center gap-1.5 px-3 py-2 md:px-6 md:py-3.5 rounded-lg md:rounded-xl bg-[#25d366] text-white font-bold text-[11px] md:text-sm hover:bg-[#22c55e] transition-all shadow-lg hover:scale-105"
                            >
                              <MessageCircle size={12} className="md:w-4 md:h-4" /> WhatsApp
                            </button>
                          )}
                        </div>
                      </motion.div>
                    </AnimatePresence>
                  </div>

                  {/* Counter */}
                  <div className="absolute top-5 left-5 z-50">
                    <p className="text-white/40 text-xs">{galleryLightbox + 1} de {total}</p>
                  </div>

                  {/* Progress bar */}
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10 z-30">
                    <motion.div
                      key={`cinema-progress-${galleryLightbox}`}
                      className="h-full bg-primary"
                      initial={{ width: "0%" }}
                      animate={{ width: "100%" }}
                      transition={{ duration: 8, ease: "linear" }}
                      onAnimationComplete={() => setGalleryLightbox((prev) => (prev! + 1) % total)}
                    />
                  </div>
                </motion.div>
              );
            })()}
          </AnimatePresence>
        );
      })()}
      <section className="lg:hidden px-4 mt-6 mb-6">
        <div className="max-w-[1800px] mx-auto">
          <div className="rounded-2xl p-5" style={{ background: storeTheme.card, border: `1px solid ${storeTheme.border}` }}>
            <h3 className="font-display font-bold text-base mb-3 flex items-center gap-2" style={{ color: storeTheme.text }}>
              <BadgeCheck size={16} style={{ color: storeTheme.primary }} /> Sobre a empresa
            </h3>
            {teamMember && dbProfile?.logo_url && (
              <div className="flex items-center gap-3 mb-3 p-2 rounded-xl" style={{ background: `${storeTheme.primary}10` }}>
                <img src={dbProfile.logo_url} alt={dbProfile.company_name || dbProfile.full_name} className="w-10 h-10 rounded-lg object-cover" style={{ border: `1px solid ${storeTheme.border}` }} />
                <div>
                  <p className="text-xs font-bold" style={{ color: storeTheme.text }}>{dbProfile.company_name || dbProfile.full_name}</p>
                  {dbProfile.cnpj && <p className="text-[10px]" style={{ color: storeTheme.textMuted }}>CNPJ: {dbProfile.cnpj}</p>}
                </div>
              </div>
            )}
            {!teamMember && dbProfile?.cnpj && (
              <div className="flex items-center gap-2 mb-3 text-xs" style={{ color: storeTheme.textMuted }}>
                <Shield size={13} className="flex-shrink-0" style={{ color: storeTheme.primary }} />
                <span>CNPJ: {dbProfile.cnpj}</span>
              </div>
            )}
            {dbProfile?.bio && (
              <p className="text-sm mb-3 whitespace-pre-line" style={{ color: storeTheme.text }}>{dbProfile.bio}</p>
            )}
            <div className="space-y-3 text-xs" style={{ color: storeTheme.textMuted }}>
              <div className="flex items-center gap-2">
                <Store size={13} className="flex-shrink-0" />
                <span>
                  {dbProfile?.seller_category
                    ? ({ imobiliaria: "Imobiliária", corretor: "Corretor(a) de Imóveis", proprietario: "Proprietário", loja_veiculos: "Loja de Veículos", autonomo: "Vendedor Autônomo", concessionaria: "Concessionária" } as Record<string, string>)[dbProfile.seller_category] || (isProperty ? "Especialista em imóveis" : "Especialista em veículos")
                    : isProperty ? "Especialista em imóveis" : "Especialista em veículos"}
                </span>
              </div>
              {dbProfile?.seller_category === "corretor" && dbProfile?.creci && (
                <div className="flex items-center gap-2">
                  <Shield size={13} className="flex-shrink-0" style={{ color: storeTheme.primary }} />
                  <span className="font-semibold" style={{ color: storeTheme.primary }}>{dbProfile.creci}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Zap size={13} className="flex-shrink-0" />
                <span>Contato direto via WhatsApp</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield size={13} className="flex-shrink-0" />
                <span>{isPaid ? "Vendedor verificado e premium" : "Vendedor ativo na plataforma"}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock size={13} className="flex-shrink-0" />
                <span>Atendimento em horário comercial</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ LOCATION ═══════════ */}
      {company.address && (!isDbProfile || (company as any).show_location) && (
        <section className="container max-w-7xl mx-auto px-4 pb-10">
          <div className="rounded-2xl overflow-hidden border border-border bg-card">
            <div className="px-5 py-4 border-b border-border flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <MapPin size={20} className="text-primary" />
              </div>
              <div>
                <h2 className="font-display font-bold text-lg text-foreground">Localização</h2>
                <p className="text-xs text-muted-foreground">{company.address}</p>
              </div>
            </div>
            <MapEmbed address={company.address} className="border-0 rounded-none" />
          </div>
        </section>
      )}

      {/* ═══════════ VIDEO FULLSCREEN MODAL ═══════════ */}
      <AnimatePresence>
        {videoModalOpen && videoId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-black flex flex-col"
            onClick={() => setVideoModalOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between p-4 md:p-6 bg-gradient-to-b from-black/80 to-transparent"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3">
                {company.logo && <img src={company.logo} alt="" className="w-8 h-8 rounded-lg object-cover border border-white/20" />}
                <div>
                  <p className="text-white font-display font-bold text-sm md:text-base">{(dbProfile as any)?.video_title || company.name}</p>
                  {(dbProfile as any)?.video_description && (
                    <p className="text-white/60 text-[10px] md:text-xs max-w-md line-clamp-2">{(dbProfile as any).video_description}</p>
                  )}
                  {!(dbProfile as any)?.video_description && (
                    <p className="text-white/50 text-[10px]">Apresentação exclusiva</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setVideoMuted(!videoMuted)} className="w-9 h-9 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/20 transition-colors">
                  {videoMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                </button>
                <button onClick={() => setVideoModalOpen(false)} className="w-9 h-9 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/20 transition-colors">
                  <X size={18} />
                </button>
              </div>
            </motion.div>
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: "spring", damping: 30, stiffness: 200 }}
              className="flex-1 flex items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-full h-full">
                 <iframe
                   src={`https://www.youtube.com/embed/${videoId}?autoplay=1&mute=${videoMuted ? 1 : 0}&rel=0&modestbranding=1&controls=1&playsinline=1`}
                   title="Vídeo"
                   allow="autoplay; encrypted-media; fullscreen; playsinline"
                  allowFullScreen
                  className="w-full h-full"
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Story Viewer */}
      {storyViewerOpen && (() => {
        const storySellerIndex = sellerStories.findIndex(s => s.sellerId === dbProfile?.id);
        return storySellerIndex >= 0 ? (
          <StoryViewer
            sellers={sellerStories}
            initialSellerIndex={storySellerIndex}
            onClose={() => setStoryViewerOpen(false)}
          />
        ) : null;
      })()}

    </div>
  );
}
