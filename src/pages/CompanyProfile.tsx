import { useState, useMemo, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "@/hooks/use-toast";
import { useParams, Link, useLocation, Navigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, Star, MapPin, MessageCircle, Share2, Key, Home, Building2, Landmark, Store, Warehouse, MoreHorizontal, Image, Eye, Instagram, Phone, ExternalLink, Clock, Shield, Zap, ChevronLeft, ChevronRight, Heart, BadgeCheck, Clapperboard, Play, X, Volume2, VolumeX, LayoutDashboard, Bed, Bath, Car, Maximize, Sword, Trophy, Sparkles, Calendar, Info, Ruler } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import StoreEffects from "@/components/StoreEffects";
import ThemeParticles from "@/components/ThemeParticles";
import {
 StoreLayoutNetflix, StoreLayoutMinimal, StoreLayoutMagazine,
 StoreLayoutGallery, StoreLayoutElegant,
  StoreLayoutMarketplace,
} from "@/components/store-layouts";
import type { StoreLayoutProps } from "@/components/store-layouts";
import { getStoreTheme } from "@/components/StoreThemePicker";
import { getStoreThemeCssVars } from "@/lib/marketplaceThemeCssVars";
import { formatPrice, getTagStyle, getTagLabel } from "@/data/products";
import { supabase } from "@/integrations/supabase/client";
import { trackSellerEvent } from "@/hooks/useSellerAnalytics";
import { useSellerSubscription } from "@/hooks/useSubscription";
import MapEmbed from "@/components/MapEmbed";
import PackageBadge from "@/components/PackageBadge";
import { useWhatsAppPicker } from "@/components/WhatsAppTeamPicker";
import StoryViewer from "@/components/StoryViewer";
import { useStories } from "@/hooks/useStories";
import WhatsAppLeadCapture from "@/components/WhatsAppLeadCapture";

import StoriesBar from "@/components/StoriesBar";
import StoryUploadDialog from "@/components/StoryUploadDialog";
import PushSubscribeButton from "@/components/PushSubscribeButton";
import { isIOSStandaloneApp } from "@/lib/pwaInstall";

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

const CITY_CARD_IMAGES = [
  "https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=400&h=300&fit=crop",
  "https://images.unsplash.com/photo-1444723121867-7a241cacace9?w=400&h=300&fit=crop",
  "https://images.unsplash.com/photo-1514565131-fce0801e5785?w=400&h=300&fit=crop",
  "https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=400&h=300&fit=crop",
  "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=400&h=300&fit=crop",
  "https://images.unsplash.com/photo-1486325212027-8081e485255e?w=400&h=300&fit=crop",
  "https://images.unsplash.com/photo-1500916434205-0c77489c6cf7?w=400&h=300&fit=crop",
  "https://images.unsplash.com/photo-1518391846015-55a9cc003b25?w=400&h=300&fit=crop",
];

const matchesCityFilter = (product: any, city: string) => !city || product.city === city;

const matchesCategoryFilter = (product: any, category: string) => {
  if (category === "todos") return true;

  const tags: string[] = product.tags || [];

  if (category === "aluguel") {
    return tags.includes("aluguel_flex") || product.category === "aluguel";
  }

  return product.category === category;
};



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
  const { user } = useAuth();
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
  const { sellerStories } = useStories(dbProfile?.id);
  const [storyViewerOpen, setStoryViewerOpen] = useState(false);
  const [leadCaptureOpen, setLeadCaptureOpen] = useState(false);
  const [storyUploadOpen, setStoryUploadOpen] = useState(false);
  const [pendingWhatsAppAction, setPendingWhatsAppAction] = useState<(() => void) | null>(null);
  const [leadCaptureContext, setLeadCaptureContext] = useState<{ funnelStage?: string; extraNotes?: string; leadSource?: string } | null>(null);

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

      // Also fetch captured items (owner listings this broker captured)
      const { data: captures } = await supabase
        .from("property_captures")
        .select("item_id")
        .eq("broker_id", pid);

      if (captures && captures.length > 0) {
        const capturedItemIds = captures.map((c: any) => c.item_id);
        const { data: capturedItems } = await supabase
          .from("seller_items")
          .select("*")
          .in("id", capturedItemIds)
          .in("status", ["ativo", "vendido"] as any);

        if (capturedItems) {
          // Avoid duplicates
          const existingIds = new Set(items.map((i: any) => i.id));
          for (const ci of capturedItems) {
            if (!existingIds.has(ci.id)) {
              items.push(ci);
            }
          }
        }
      }
      
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
        
        if (member) {
          // For partnership-based members, fetch latest photo from linked profile
          const memberAny = member as any;
          if (memberAny.origin === "partnership" && memberAny.linked_profile_id) {
            const { data: brokerProfile } = await supabase
              .from("profiles")
              .select("logo_url, id, user_id")
              .eq("id", memberAny.linked_profile_id)
              .maybeSingle();
            if (brokerProfile?.logo_url) {
              member.photo_url = brokerProfile.logo_url;
            }
            // Store broker's own profile info for CRM routing
            if (brokerProfile) {
              (member as any)._partnerSellerId = brokerProfile.id;
              (member as any)._partnerUserId = brokerProfile.user_id;
            }
          } else if (!member.photo_url && member.email) {
            // Fallback for legacy members without origin field
            const { data: brokerProfile } = await supabase
              .from("profiles")
              .select("logo_url")
              .eq("email", member.email)
              .maybeSingle();
            if (brokerProfile?.logo_url) {
              member.photo_url = brokerProfile.logo_url;
            }
          }
        }

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
    slug: (item as any).slug as string | null,
    title: item.title,
    image: item.photos?.[0] || "",
    images: item.photos || [],
    price: item.price || 0,
    tag: item.tags?.[0] || null,
    tags: item.tags || [],
    category: item.category,
    city: item.city,
    neighborhood: item.neighborhood,
    description: item.description,
    specs: {} as Record<string, string>,
    type: "imovel" as const,
    status: item.status,
    sold_at: item.sold_at,
    finality: item.finality,
    isAluguel: item.category === "aluguel" || item.finality === "aluguel",
  }));

  const products = isDbProfile ? dbDisplayItems : [];

  const productsForSelectedCity = useMemo(
    () => products.filter((product: any) => matchesCityFilter(product, filterCity)),
    [products, filterCity],
  );

  const productsForSelectedCategory = useMemo(
    () => products.filter((product: any) => matchesCategoryFilter(product, activeCategory)),
    [products, activeCategory],
  );

  const filteredProducts = useMemo(() => {
    return products.filter(
      (product: any) => matchesCityFilter(product, filterCity) && matchesCategoryFilter(product, activeCategory),
    );
  }, [products, activeCategory, filterCity]);

  const availableCities = useMemo(() => {
    const cities = new Set<string>();
    productsForSelectedCategory.forEach((product: any) => {
      if (product.city) cities.add(product.city);
    });
    return Array.from(cities).sort();
  }, [productsForSelectedCategory]);

  const cityCounts = useMemo(() => {
    const counts: Record<string, number> = {};

    productsForSelectedCategory.forEach((product: any) => {
      if (!product.city) return;
      counts[product.city] = (counts[product.city] || 0) + 1;
    });

    return counts;
  }, [productsForSelectedCategory]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { todos: productsForSelectedCity.length };

    productsForSelectedCity.forEach((product: any) => {
      const cat = isDbProfile ? product.category : "todos";
      counts[cat] = (counts[cat] || 0) + 1;
      const tags: string[] = product.tags || [];
      if (tags.includes("aluguel_flex") || product.category === "aluguel") {
        counts["aluguel"] = (counts["aluguel"] || 0) + 1;
      }
    });

    return counts;
  }, [productsForSelectedCity, isDbProfile]);

  const categoryCardImages = useMemo(() => {
    return propertySubcategories.reduce<Record<string, string>>((images, category) => {
      const selectedCityImage = productsForSelectedCity.find(
        (product: any) => product.image && matchesCategoryFilter(product, category.slug),
      )?.image;

      const fallbackImage = products.find(
        (product: any) => product.image && matchesCategoryFilter(product, category.slug),
      )?.image;

      images[category.slug] = selectedCityImage || fallbackImage || category.img;
      return images;
    }, {});
  }, [products, productsForSelectedCity]);

  useEffect(() => {
    if (activeCategory !== "todos" && (categoryCounts[activeCategory] || 0) === 0) {
      setActiveCategory("todos");
    }
  }, [activeCategory, categoryCounts]);

  useEffect(() => {
    if (filterCity && !availableCities.includes(filterCity)) {
      setFilterCity("");
    }
  }, [filterCity, availableCities]);

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
    return <Navigate to="/login" replace />;
  }

  const featuredItemId = isDbProfile ? dbProfile?.featured_item_id : null;
  const heroProduct = featuredItemId
    ? products.find((p: any) => p.id === featuredItemId) || products[0]
    : products[0];

  const doWhatsAppRedirect = (title: string, productId?: string) => {
    if (isDbProfile && id) trackSellerEvent(id, "whatsapp_click", productId, teamMember?.id);
    const seg = "imoveis";
    const link = productId 
      ? `${window.location.origin}/${seg}/produto/${productId}${corretorSlug ? `?corretor=${corretorSlug}` : ""}` 
      : window.location.href;
    
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches
      || (navigator as any).standalone === true;

    const openUrl = (url: string) => {
      // Avoid popup blocking after lead capture or async flows
      if (isStandalone) {
        window.location.href = url;
        return;
      }
      window.location.assign(url);
    };

    if (teamMember && teamMember.phone) {
      const phone = teamMember.phone.replace(/\D/g, "");
      const msg = productId
        ? `Olá ${teamMember.full_name}! 🏠 Vi o imóvel *${title}* na sua loja e gostaria de mais informações.\n\n🔗 ${link}`
        : `Olá ${teamMember.full_name}! 🏠 Vim da sua loja Capimobi e gostaria de mais informações sobre seus imóveis.\n\n🔗 ${link}`;
      openUrl(`https://wa.me/55${phone}?text=${encodeURIComponent(msg)}`);
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

  const handleWhatsApp = (title: string, productId?: string) => {
    if (isDbProfile && dbProfile) {
      setLeadCaptureContext(null); // Reset context for normal WhatsApp
      setPendingWhatsAppAction(() => () => doWhatsAppRedirect(title, productId));
      setLeadCaptureOpen(true);
    } else {
      doWhatsAppRedirect(title, productId);
    }
  };

  const isPaid = sellerTier !== "basico";
  const videoId = dbProfile?.video_url ? extractYouTubeId(dbProfile.video_url) : null;
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const hasVideoHero = !!(videoId && sellerTier && sellerTier !== "basico" && sellerTier !== "start" && !isIOS);
  const storeTheme = getStoreTheme((dbProfile as any)?.store_theme);
  const currentLayout = (dbProfile as any)?.store_layout || "marketplace";
  const isMarketplace = currentLayout === "marketplace";
  const isMinimal = currentLayout === "minimal";
  const isNetflix = currentLayout === "netflix";
  const isElegant = currentLayout === "elegant";
  const isGallery = currentLayout === "gallery";
  const isMagazine = currentLayout === "magazine";
  const isIOSStandalone = isIOSStandaloneApp();

  return (
    <div
      className={`${false ? "h-screen overflow-hidden" : "min-h-screen pb-20 md:pb-0 overflow-x-hidden max-w-full"}`}
      style={{
        background: storeTheme.bg,
        color: storeTheme.text,
        width: "100%",
        maxWidth: "100vw",
        ...(false ? {} : { overflowX: "clip" as any, overscrollBehaviorX: "none" }),
        ["--store-bg" as any]: storeTheme.bg,
        ["--store-card" as any]: storeTheme.card,
        ["--store-text" as any]: storeTheme.text,
        ["--store-text-muted" as any]: storeTheme.textMuted,
        ["--store-primary" as any]: storeTheme.primary,
        ["--store-accent" as any]: storeTheme.accent,
        ["--store-border" as any]: storeTheme.border,
        ...getStoreThemeCssVars(storeTheme),
      }}
    >
      {/* ═══════════ SEO META TAGS ═══════════ */}
      {company && (
        <Helmet>
          {(() => {
            const cityName = dbProfile?.city || "Brasil";
            const stateName = dbProfile?.state || "";
            const sellerName = company.name;
            const totalItems = products.length;
            const seoTitle = `${sellerName} — Imóveis em ${cityName}${stateName ? `, ${stateName}` : ""} | Capimobi`;
            const activeBio = teamMember?.bio || dbProfile?.bio;
            const seoDesc = activeBio
              ? `${activeBio.slice(0, 130)} — ${totalItems} imóveis em ${cityName}.`
              : `Encontre ${totalItems}+ imóveis com ${sellerName} em ${cityName}. Casas, apartamentos, terrenos à venda. Contato direto via WhatsApp.`;
            const canonicalUrl = `https://capimobi.lovable.app/empresa/${dbProfile?.slug || id}`;
            const ogImage = company.logo || (products[0]?.image) || "";
            const keywords = `${sellerName}, imóveis ${cityName}, casas ${cityName}, apartamentos ${cityName}, corretor ${cityName}, imobiliária ${cityName}`;

            return (
              <>
                <title>{seoTitle}</title>
                <meta name="description" content={seoDesc} />
                <meta name="keywords" content={keywords} />
                <link rel="canonical" href={canonicalUrl} />

                <meta property="og:type" content="website" />
                <meta property="og:title" content={`${sellerName} — Imóveis em ${cityName}`} />
                <meta property="og:description" content={seoDesc} />
                <meta property="og:url" content={canonicalUrl} />
                {ogImage && <meta property="og:image" content={ogImage} />}
                <meta property="og:site_name" content="Capimobi" />
                <meta property="og:locale" content="pt_BR" />

                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:title" content={`${sellerName} — Imóveis em ${cityName}`} />
                <meta name="twitter:description" content={seoDesc} />
                {ogImage && <meta name="twitter:image" content={ogImage} />}

                <script type="application/ld+json">
                  {JSON.stringify({
                    "@context": "https://schema.org",
                    "@type": "RealEstateAgent",
                    name: sellerName,
                    url: canonicalUrl,
                    logo: company.logo || undefined,
                    image: ogImage || undefined,
                    description: seoDesc,
                    address: company.address ? {
                      "@type": "PostalAddress",
                      streetAddress: dbProfile?.address || "",
                      addressLocality: cityName,
                      addressRegion: stateName,
                      addressCountry: "BR",
                    } : undefined,
                    telephone: company.whatsapp || undefined,
                    areaServed: {
                      "@type": "City",
                      name: cityName,
                    },
                    makesOffer: products.slice(0, 10).map(p => ({
                      "@type": "Offer",
                      itemOffered: {
                        "@type": "Product",
                        name: p.title,
                        image: p.image,
                        offers: p.price ? {
                          "@type": "Offer",
                          price: p.price,
                          priceCurrency: "BRL",
                        } : undefined,
                      },
                    })),
                  })}
                </script>
              </>
            );
          })()}
        </Helmet>
      )}

      {isDbProfile && dbProfile?.id && <StoreEffects sellerId={dbProfile.id} />}
      {!isIOSStandalone && <ThemeParticles color={storeTheme.primary} sellerId={dbProfile?.id} />}
      {/* ═══════════ MOBILE PROFILE HERO ═══════════ */}
      <section data-company-hero-mobile className={`lg:hidden relative overflow-hidden ${isMinimal || isMarketplace || isNetflix || false ? "hidden" : ""}`}>
        {isMarketplace ? (
          /* ── Marketplace-style compact hero ── */
          <>
            <div className="px-4 pt-4 pb-5" style={{ background: storeTheme.primary }}>
              {/* Top bar */}
              <div className="flex items-center justify-between mb-4">
                <Link
                  to={user && dbProfile && user.id === dbProfile.user_id ? "/painel" : "/login"}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/15 text-white text-xs font-medium"
                >
                  <LayoutDashboard size={14} /> {user && dbProfile && user.id === dbProfile.user_id ? "Painel" : "Entrar"}
                </Link>
                {isPaid && <PackageBadge tier={sellerTier} size="sm" />}
              </div>

              {/* Profile row */}
              <div className="flex items-center gap-3">
                {(() => {
                  const sellerStoryData = sellerStories.find(s => s.sellerId === dbProfile?.id);
                  const hasActiveStory = !!sellerStoryData;
                  const logoEl = company.logo ? (
                    <img src={company.logo} alt={company.name} className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <div className="w-full h-full rounded-full bg-white/20 flex items-center justify-center">
                      <span className="text-white font-bold text-xl">{company.name?.charAt(0)}</span>
                    </div>
                  );
                  return hasActiveStory ? (
                    <button onClick={() => setStoryViewerOpen(true)} className="w-14 h-14 rounded-full p-[2px] bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 shrink-0">
                      <div className="w-full h-full rounded-full bg-black p-[2px]">{logoEl}</div>
                    </button>
                  ) : (
                    <div className="w-14 h-14 rounded-full border-2 border-white/30 overflow-hidden shrink-0">{logoEl}</div>
                  );
                })()}

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h1 className="font-display font-bold text-lg text-white truncate">{company.name}</h1>
                    {isPaid && <BadgeCheck size={16} className="text-white/80 flex-shrink-0" />}
                  </div>
                  {dbProfile?.seller_category && (
                    <span className="text-white/70 text-[11px]">
                      {({ imobiliaria: "🏢 Imobiliária", corretor: "📋 Corretor(a)", proprietario: "🏠 Proprietário", construtora: "🏗️ Construtora" } as Record<string, string>)[dbProfile.seller_category]}
                    </span>
                  )}
                  {company.show_location && company.address && (
                    <span className="flex items-center gap-1 text-white/50 text-[10px] mt-0.5">
                      <MapPin size={9} /> {company.address}
                    </span>
                  )}
                </div>
              </div>

              {/* Stats */}
              <div className="flex items-center gap-5 mt-4 text-white/90 text-xs">
                <span className="font-bold">{products.length} <span className="font-normal text-white/60">imóveis</span></span>
                {availableCities.length > 0 && (
                  <span className="font-bold">{availableCities.length} <span className="font-normal text-white/60">cidades</span></span>
                )}
                <span className="font-bold">{isPaid ? "✓" : "—"} <span className="font-normal text-white/60">{isPaid ? "Verificado" : "Ativo"}</span></span>
              </div>

              {/* Action buttons */}
              <div className="flex gap-2 mt-4">
                {company.whatsapp && (
                  <button onClick={() => handleWhatsApp(heroProduct?.title || company.name)} className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white text-xs font-bold active:scale-95 transition-transform" style={{ color: storeTheme.primary }}>
                    <MessageCircle size={16} /> WhatsApp
                  </button>
                )}
                {(company as any).instagram && ["start", "vip", "premium", "essencial_empresa", "premium_empresa", "prime_empresa"].includes(sellerTier || "") && (
                  <a href={`https://instagram.com/${(company as any).instagram.replace(/^@/, "")}`} target="_blank" rel="noopener noreferrer" className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-[#833AB4] via-[#E1306C] to-[#F77737] text-white text-xs font-bold active:scale-95 transition-transform">
                    <Instagram size={16} /> Instagram
                  </a>
                )}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white/15 text-white text-xs font-medium">
                      <Share2 size={13} /> Compartilhar
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="center" className="w-48">
                    <DropdownMenuItem onClick={() => {
                      const text = `Confira ${company.name} no Capimobi: ${window.location.href}`;
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
                
              </div>
            </div>
          </>
        ) : (
          /* ── Default Instagram-style hero ── */
          <>
        {/* Sliding hero images behind profile */}
        {heroImages.length > 0 ? (
          <>
            <AnimatePresence mode="wait">
              <motion.img
                key={heroSlide}
                src={heroImages[heroSlide].image}
                alt={heroImages[heroSlide].title}
                initial={{ opacity: 0, scale: 1.08 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1 }}
                className="absolute inset-0 w-full h-full object-cover"
              />
            </AnimatePresence>
            {/* Slide indicators */}
            {heroImages.length > 1 && (
              <div className="absolute top-14 left-0 right-0 z-20 flex justify-center gap-1.5">
                {heroImages.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setHeroSlide(idx)}
                    className={`h-1 rounded-full transition-all duration-300 ${idx === heroSlide ? "w-6 bg-white" : "w-1.5 bg-white/40"}`}
                  />
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/80 to-accent" />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/50 to-black/90" />
        
        {/* Cinema Mode button — top right */}
        <button onClick={() => setGalleryLightbox(0)} className="absolute top-4 right-4 z-20 flex items-center gap-1.5 px-3 py-2 rounded-lg text-[11px] font-medium text-white/60 hover:text-white transition-all" style={{ background: "rgba(0,0,0,0.35)" }}>
          <Clapperboard size={13} /> Cinema
        </button>
        {/* Back + Badge */}
        <div className="relative z-10 flex items-center justify-between px-4 pt-4">
          <Link
            to={user && dbProfile && user.id === dbProfile.user_id ? "/painel" : "/login"}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md text-white text-xs font-medium"
          >
            <LayoutDashboard size={14} /> {user && dbProfile && user.id === dbProfile.user_id ? "Painel" : "Entrar"}
          </Link>
          {isPaid && <PackageBadge tier={sellerTier} size="sm" />}
        </div>

        {/* Centered profile */}
        <div className="relative z-10 flex flex-col items-center text-center px-6 pt-6 pb-8">
          {(() => {
            const sellerStoryData = sellerStories.find(s => s.sellerId === dbProfile?.id);
            const hasActiveStory = !!sellerStoryData;
            
            const logoContent = company.logo ? (
              <img src={company.logo} alt={company.name} className="w-full h-full rounded-full object-cover" />
            ) : (
              <div className="w-full h-full rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center">
                <span className="text-white font-bold text-3xl">{company.name?.charAt(0)}</span>
              </div>
            );

            return hasActiveStory ? (
              <button
                onClick={() => setStoryViewerOpen(true)}
                className="w-24 h-24 rounded-full p-[3px] bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 shrink-0 cursor-pointer hover:scale-105 transition-transform mb-4"
              >
                <div className="w-full h-full rounded-full bg-black p-[2px]">
                  {logoContent}
                </div>
              </button>
            ) : (
              <div className="w-24 h-24 rounded-full border-3 border-white/30 shadow-2xl overflow-hidden shrink-0 mb-4">
                {logoContent}
              </div>
            );
          })()}

          <div className="flex items-center gap-2 mb-1">
            <h1 className="font-display font-bold text-xl text-white leading-tight">{company.name}</h1>
            {isPaid && <BadgeCheck size={18} className="text-primary" />}
          </div>

          {(teamMember || dbProfile?.seller_category) && (
            <span className="text-white/70 text-xs font-medium mb-2">
              {teamMember
                ? `📋 Corretor(a)${teamMember.creci ? ` • ${teamMember.creci}` : ""}`
                : `${({ imobiliaria: "🏢 Imobiliária", corretor: "📋 Corretor(a)", proprietario: "🏠 Proprietário", construtora: "🏗️ Construtora" } as Record<string, string>)[dbProfile.seller_category] || ""}${["corretor", "imobiliaria", "construtora"].includes(dbProfile.seller_category) && dbProfile.creci ? ` • ${dbProfile.creci}` : ""}`
              }
            </span>
          )}

          {company.show_location && company.address && (
            <span className="flex items-center gap-1 text-white/50 text-[11px] mb-3">
              <MapPin size={10} /> {company.address}
            </span>
          )}

          {(teamMember?.bio || dbProfile?.bio) && (
            <p className="text-white/70 text-xs leading-relaxed line-clamp-3 max-w-sm mb-4">{teamMember?.bio || dbProfile.bio}</p>
          )}

          {/* Stats row */}
          <div className="flex items-center gap-6 mb-5">
            <div className="text-center">
              <p className="font-bold text-white text-lg">{products.length}</p>
              <p className="text-white/50 text-[10px]">Imóveis</p>
            </div>
            <div className="w-px h-8 bg-white/20" />
            <div className="text-center">
              <p className="font-bold text-white text-lg">{isPaid ? "✓" : "—"}</p>
              <p className="text-white/50 text-[10px]">{isPaid ? "Verificado" : "Ativo"}</p>
            </div>
            {availableCities.length > 0 && (
              <>
                <div className="w-px h-8 bg-white/20" />
                <div className="text-center">
                  <p className="font-bold text-white text-lg">{availableCities.length}</p>
                  <p className="text-white/50 text-[10px]">Cidades</p>
                </div>
              </>
            )}
          </div>

          {/* Big action buttons */}
          <div className="flex gap-2 w-full max-w-sm">
            {company.whatsapp && (
              <button onClick={() => handleWhatsApp(heroProduct?.title || company.name)} className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-[#25d366] text-white font-bold text-sm shadow-lg active:scale-95 transition-transform">
                <MessageCircle size={18} /> WhatsApp
              </button>
            )}
            {(company as any).instagram && ["start", "vip", "premium", "essencial_empresa", "premium_empresa", "prime_empresa"].includes(sellerTier || "") && (
              <a href={`https://instagram.com/${(company as any).instagram.replace(/^@/, "")}`} target="_blank" rel="noopener noreferrer" className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-gradient-to-r from-[#833AB4] via-[#E1306C] to-[#F77737] text-white font-bold text-sm shadow-lg active:scale-95 transition-transform">
                <Instagram size={18} /> Instagram
              </a>
            )}
          </div>

          <div className="flex gap-2 mt-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/10 backdrop-blur-md text-white text-xs font-medium">
                  <Share2 size={13} /> Compartilhar
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center" className="w-48">
                <DropdownMenuItem onClick={() => {
                  const text = `Confira ${company.name} no Capimobi: ${window.location.href}`;
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
              <button onClick={() => { setVideoMuted(false); setVideoModalOpen(true); }} className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/10 backdrop-blur-md text-white text-xs font-medium">
                <Play size={13} fill="currentColor" /> Vídeo
              </button>
            )}
            
          </div>
        </div>
          </>
        )}
      </section>

      
      {isMarketplace && products.length > 0 && (
        <div className="hidden overflow-hidden" style={{ background: `${storeTheme.primary}e6` }}>
          <motion.div
            className="flex gap-3 py-3 px-4"
            animate={{ x: ["0%", "-50%"] }}
            transition={{ duration: products.length * 4, repeat: Infinity, ease: "linear" }}
          >
            {[...products, ...products].filter((p: any) => p.image).slice(0, 20).map((product: any, i: number) => {
              const productLink = `/imoveis/produto/${product.slug || product.id}${corretorSlug ? `?corretor=${corretorSlug}` : ""}`;
              return (
                <Link
                  key={`scroll-${product.id}-${i}`}
                  to={productLink}
                  className="flex-shrink-0 w-[200px] rounded-xl overflow-hidden shadow-lg"
                  style={{ background: storeTheme.card }}
                >
                  <div className="relative h-[110px] overflow-hidden">
                    <img src={product.image} alt={product.title} className="w-full h-full object-cover" loading="lazy" />
                    {product.tag && (
                      <span className={`absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded text-[8px] font-bold ${getTagStyle(product.tag)}`}>
                        {getTagLabel(product.tag)}
                      </span>
                    )}
                  </div>
                  <div className="px-2.5 py-2">
                    <h4 className="text-[11px] font-semibold line-clamp-1" style={{ color: storeTheme.text }}>{product.title}</h4>
                    {product.price > 0 && (
                      <p className="text-xs font-bold mt-0.5" style={{ color: storeTheme.primary }}>R$ {product.price.toLocaleString("pt-BR")}</p>
                    )}
                    {product.city && (
                      <p className="text-[9px] mt-0.5 flex items-center gap-0.5" style={{ color: storeTheme.textMuted }}>
                        <MapPin size={8} /> {product.city}
                      </p>
                    )}
                  </div>
                </Link>
              );
            })}
          </motion.div>
        </div>
      )}

      <section data-company-hero className={`hidden lg:block relative overflow-hidden ${isMinimal || isMarketplace || isNetflix || false ? "!hidden" : ""} ${hasVideoHero ? "h-[70vh]" : "h-[60vh]"}`}>
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
        )}
        {heroImages.length === 0 && !hasVideoHero && (
          <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/80 to-accent" />
        )}

        {/* Overlays */}
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
          <Link
            to={user && dbProfile && user.id === dbProfile.user_id ? "/painel" : "/login"}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 backdrop-blur-md text-white text-sm font-medium hover:bg-white/20 transition-colors"
          >
            <LayoutDashboard size={16} /> {user && dbProfile && user.id === dbProfile.user_id ? "Painel" : "Entrar"}
          </Link>
        </div>

        {/* Cinema Mode button — top right */}
        <button onClick={() => setGalleryLightbox(0)} className="absolute top-4 right-4 z-20 flex items-center gap-1.5 px-3 py-2 rounded-lg text-[11px] font-medium text-white/60 hover:text-white transition-all" style={{ background: "rgba(0,0,0,0.35)" }}>
          <Clapperboard size={13} /> Cinema
        </button>

        {/* Tier Badge */}
        {isPaid && (
          <div className="absolute top-4 right-4 z-20">
            <PackageBadge tier={sellerTier} size="lg" />
          </div>
        )}

        {/* Hero slide arrows */}
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
        <div className="absolute bottom-0 left-0 right-0 p-10 z-10">
          <div className="max-w-[1800px] mx-auto px-8">
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="max-w-3xl">
              <div className="flex items-center gap-4 mb-3">
                {(() => {
                  const sellerStoryData = sellerStories.find(s => s.sellerId === dbProfile?.id);
                  const hasActiveStory = !!sellerStoryData;
                  
                  const logoContent = company.logo ? (
                    <img src={company.logo} alt={company.name} className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <div className="w-full h-full rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center">
                      <span className="text-white font-bold text-2xl">{company.name?.charAt(0)}</span>
                    </div>
                  );

                  return hasActiveStory ? (
                    <button
                      onClick={() => setStoryViewerOpen(true)}
                      className="w-20 h-20 rounded-full p-[3px] bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 shrink-0 cursor-pointer hover:scale-105 transition-transform"
                    >
                      <div className="w-full h-full rounded-full bg-black p-[2px]">
                        {logoContent}
                      </div>
                    </button>
                  ) : (
                    <div className="w-20 h-20 rounded-full border-2 border-white/30 shadow-2xl overflow-hidden shrink-0">
                      {logoContent}
                    </div>
                  );
                })()}
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="font-display font-bold text-4xl text-white leading-tight">{company.name}</h1>
                    {isPaid && <BadgeCheck size={22} className="text-primary" />}
                  </div>
                  <div className="flex items-center gap-3 mt-1 flex-wrap">
                    {dbProfile?.seller_category && (
                      <span className="flex items-center gap-1 text-white/80 text-xs font-medium bg-white/10 px-2 py-0.5 rounded-full">
                        {({ imobiliaria: "🏢 Imobiliária", corretor: "📋 Corretor(a)", proprietario: "🏠 Proprietário", construtora: "🏗️ Construtora" } as Record<string, string>)[dbProfile.seller_category]}
                        {["corretor", "imobiliaria", "construtora"].includes(dbProfile.seller_category) && dbProfile.creci && ` • ${dbProfile.creci}`}
                      </span>
                    )}
                    {company.show_location && company.address && (
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
                    <p className="text-white/90 font-display font-bold text-2xl drop-shadow-lg">{(dbProfile as any).video_title}</p>
                  )}
                  {(dbProfile as any)?.video_description && (
                    <p className="text-white/60 text-base mt-1 max-w-xl line-clamp-2">{(dbProfile as any).video_description}</p>
                  )}
                </div>
              )}

              {/* Action buttons */}
              <div className="flex flex-nowrap gap-2 mt-4 overflow-x-auto scrollbar-hide">
                {company.whatsapp && (
                  <button onClick={() => handleWhatsApp(heroProduct?.title || company.name)} className="flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#25d366] text-white font-bold text-sm hover:bg-[#22c55e] transition-colors shadow-lg whitespace-nowrap flex-shrink-0">
                    <MessageCircle size={14} /> WhatsApp
                  </button>
                )}
                {(company as any).instagram && ["start", "vip", "premium", "essencial_empresa", "premium_empresa", "prime_empresa"].includes(sellerTier || "") && (
                  <a href={`https://instagram.com/${(company as any).instagram.replace(/^@/, "")}`} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#833AB4] via-[#E1306C] to-[#F77737] text-white font-bold text-sm hover:opacity-90 transition-opacity shadow-lg whitespace-nowrap flex-shrink-0">
                    <Instagram size={14} /> Instagram
                  </a>
                )}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-white/10 backdrop-blur-md text-white text-sm font-medium hover:bg-white/20 transition-colors whitespace-nowrap flex-shrink-0">
                      <Share2 size={13} /> Compartilhar
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem onClick={() => {
                      const text = `Confira ${company.name} no Capimobi: ${window.location.href}`;
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
                  <button onClick={() => { setVideoMuted(false); setVideoModalOpen(true); }} className="flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl bg-destructive text-destructive-foreground font-bold text-sm hover:opacity-90 transition-opacity shadow-lg whitespace-nowrap flex-shrink-0">
                    <Play size={14} fill="currentColor" /> Assistir
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ═══════════ STATS BAR ═══════════ */}
      <section data-company-stats-bar className={`block relative z-20 overflow-hidden ${isNetflix ? "!hidden" : ""}`} style={{ borderBottom: `1px solid ${storeTheme.border}`, background: storeTheme.card }}>
        <div className={`${isMarketplace ? "px-3 md:px-8" : "max-w-[1800px] mx-auto px-3 md:px-8"}`}>
          <div className="flex items-center gap-2 sm:gap-3 md:gap-6 py-2.5 md:py-3 overflow-x-auto scrollbar-hide">
            <div className="flex items-center gap-1.5 md:gap-2 text-xs md:text-sm flex-shrink-0">
              <div className="w-7 h-7 md:w-8 md:h-8 rounded-lg flex items-center justify-center" style={{ background: `${storeTheme.primary}18` }}>
                <Store size={14} style={{ color: storeTheme.primary }} />
              </div>
              <div>
                <p className="font-bold" style={{ color: storeTheme.text }}>{products.length}</p>
                <p className="text-[9px] md:text-[10px]" style={{ color: storeTheme.textMuted }}>Anúncios</p>
              </div>
            </div>
            <div className="w-px h-7 md:h-8 flex-shrink-0" style={{ background: storeTheme.border }} />
            <div className="flex items-center gap-1.5 md:gap-2 text-xs md:text-sm flex-shrink-0">
              <div className="w-7 h-7 md:w-8 md:h-8 rounded-lg bg-[#25d366]/10 flex items-center justify-center">
                <MessageCircle size={14} className="text-[#25d366]" />
              </div>
              <div>
                <p className="font-bold" style={{ color: storeTheme.text }}>Direto</p>
                <p className="text-[9px] md:text-[10px]" style={{ color: storeTheme.textMuted }}>WhatsApp</p>
              </div>
            </div>
            <div className="w-px h-7 md:h-8 flex-shrink-0" style={{ background: storeTheme.border }} />
            <div className="flex items-center gap-1.5 md:gap-2 text-xs md:text-sm flex-shrink-0">
              <div className="w-7 h-7 md:w-8 md:h-8 rounded-lg flex items-center justify-center" style={{ background: `${storeTheme.accent}30` }}>
                <Shield size={14} style={{ color: storeTheme.accent }} />
              </div>
              <div>
                <p className="font-bold" style={{ color: storeTheme.text }}>{isPaid ? "Verificado" : "Ativo"}</p>
                <p className="text-[9px] md:text-[10px]" style={{ color: storeTheme.textMuted }}>Vendedor</p>
              </div>
            </div>
            {isPaid && (
              <>
                <div className="w-px h-7 md:h-8 flex-shrink-0" style={{ background: storeTheme.border }} />
                <div className="flex items-center gap-1.5 md:gap-2 text-xs md:text-sm flex-shrink-0">
                  <PackageBadge tier={sellerTier} size="sm" />
                </div>
              </>
            )}
          </div>
        </div>
      </section>


      {/* ═══════════ MAIN LAYOUT ═══════════ */}
      <div className={`${isNetflix ? "w-full px-0" : isMarketplace ? "w-full px-4 md:px-8" : "max-w-[1800px] mx-auto px-4 md:px-8"} ${isMinimal || isMarketplace || isNetflix ? "py-0" : "py-6"}`}>
        <div className={`flex ${isNetflix ? "gap-0" : "gap-8"}`}>
          {/* ═══════════ DESKTOP SIDEBAR ═══════════ */}
          <aside className={`hidden lg:block w-[280px] flex-shrink-0 ${isMarketplace || isNetflix || isElegant || isMagazine || isMinimal || false || isGallery ? "!hidden" : ""}`}>
            <div className={`sticky ${isMinimal ? "top-4" : "top-20"} space-y-4`}>
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
                          ? ({ imobiliaria: "Imobiliária", corretor: "Corretor(a) de Imóveis", proprietario: "Proprietário", construtora: "Construtora" } as Record<string, string>)[dbProfile.seller_category] || "Imobiliária"
                          : "Imobiliária"}
                      </p>
                      {["corretor", "imobiliaria", "construtora"].includes(dbProfile?.seller_category) && dbProfile?.creci && (
                        <p className="text-xs font-semibold mt-1 flex items-center gap-1" style={{ color: storeTheme.primary }}>
                          <Shield size={12} /> {dbProfile.creci}
                        </p>
                      )}
                    </>
                  )}
                  
                  {company.show_location && company.address && (
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
                    {(company as any).instagram && ["start", "vip", "premium", "essencial_empresa", "premium_empresa", "prime_empresa"].includes(sellerTier || "") && (
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
                  <BadgeCheck size={14} style={{ color: storeTheme.primary }} /> {teamMember ? "Sobre o corretor" : "Sobre a empresa"}
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
                {(teamMember?.bio || dbProfile?.bio) && (
                  <p className="text-sm mb-3 whitespace-pre-line" style={{ color: storeTheme.text }}>{teamMember?.bio || dbProfile.bio}</p>
                )}
                <div className="space-y-3 text-xs" style={{ color: storeTheme.textMuted }}>
                  <div className="flex items-center gap-2">
                    <Store size={13} className="flex-shrink-0" />
                    <span>
                      {teamMember
                        ? "Corretor(a) de Imóveis"
                        : dbProfile?.seller_category
                          ? ({ imobiliaria: "Imobiliária", corretor: "Corretor(a) de Imóveis", proprietario: "Proprietário", construtora: "Construtora" } as Record<string, string>)[dbProfile.seller_category] || "Especialista em imóveis"
                          : "Especialista em imóveis"}
                    </span>
                  </div>
                  {(teamMember?.creci || (["corretor", "imobiliaria", "construtora"].includes(dbProfile?.seller_category) && dbProfile?.creci)) && !teamMember && (
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
                    const isDisabled = cat.slug !== "todos" && count === 0;
                    return (
                      <button
                        key={cat.slug}
                        onClick={() => { setActiveCategory(cat.slug); setTimeout(() => document.getElementById("products-grid")?.scrollIntoView({ behavior: "smooth", block: "start" }), 100); }}
                        disabled={isDisabled}
                        className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-medium transition-all`}
                        style={{
                          background: isActive ? storeTheme.primary : "transparent",
                          color: isActive ? "#fff" : storeTheme.textMuted,
                          boxShadow: isActive ? "0 4px 12px rgba(0,0,0,0.15)" : "none",
                          opacity: isDisabled ? 0.45 : 1,
                          cursor: isDisabled ? "not-allowed" : "pointer",
                        }}
                      >
                        <Icon size={14} />
                        <span className="flex-1 text-left">{cat.name}</span>
                        {count > 0 || cat.slug === "todos" ? (
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
          <div className={`flex-1 min-w-0 ${isNetflix ? "w-full" : ""}`}>
            {/* ═══ DYNAMIC MOBILE LAYOUT ═══ */}
            {(() => {
              const layoutProps: StoreLayoutProps = {
                products,
                filteredProducts,
                subcategories,
                activeCategory,
                setActiveCategory,
                categoryCounts,
                categoryCardImages,
                storeTheme,
                corretorSlug,
                sellerDisplayName: company?.name || dbProfile?.company_name || dbProfile?.full_name || "o corretor",
                isDbProfile,
                dbProfile,
                handleWhatsApp,
                formatPrice: (p: number) => `R$ ${p.toLocaleString("pt-BR")}`,
                getTagStyle,
                getTagLabel,
                filterCity,
                setFilterCity,
                availableCities,
                onCinemaMode: () => setGalleryLightbox(0),
                onShareLink: () => { navigator.clipboard.writeText(window.location.href); },
                storiesBar: sellerStories.length > 0 || (user && dbProfile && user.id === dbProfile.user_id)
                  ? <StoriesBar sellerId={dbProfile?.id} textColor={storeTheme.text} onAddStory={user && dbProfile && user.id === dbProfile.user_id ? () => setStoryUploadOpen(true) : undefined} />
                  : undefined,
              };

              const layout = (dbProfile as any)?.store_layout || "marketplace";

              switch (layout) {
                case "netflix": return <StoreLayoutNetflix {...layoutProps} />;
                case "minimal": return <StoreLayoutMinimal {...layoutProps} />;
                case "magazine": return <StoreLayoutMagazine {...layoutProps} />;
                case "gallery": return <StoreLayoutGallery {...layoutProps} />;
                case "elegant": return <StoreLayoutElegant {...layoutProps} />;
                
                case "marketplace": return <StoreLayoutMarketplace {...layoutProps} />;
                default: return <StoreLayoutMarketplace {...layoutProps} />;
              }
            })()}

            {/* Desktop: keep original grid */}
            <div id="products-grid" className={`hidden lg:block ${isMinimal ? "!hidden" : ""}`}>
            {/* Products Header */}
            <div className="flex items-center justify-between mb-4">
              {false ? (
                <div className="flex items-center gap-3">
                  <Trophy size={16} style={{ color: storeTheme.primary }} />
                  <h2 className="font-display font-black text-lg uppercase tracking-wider" style={{ color: storeTheme.text }}>
                    {activeCategory === "todos" ? "Inventário" : subcategories.find(c => c.slug === activeCategory)?.name}
                  </h2>
                  <span className="text-[10px] font-bold px-2 py-0.5 uppercase tracking-wider"
                    style={{ background: `${storeTheme.primary}20`, color: storeTheme.primary, border: `1px solid ${storeTheme.primary}30` }}>
                    {filteredProducts.length} itens
                  </span>
                  <div className="flex-1 h-px" style={{ background: `linear-gradient(to right, ${storeTheme.primary}30, transparent)` }} />
                </div>
              ) : (
                <h2 className="font-display font-bold text-lg md:text-xl" style={{ color: storeTheme.text }}>
                  {activeCategory === "todos"
                    ? `Todos os Anúncios`
                    : subcategories.find(c => c.slug === activeCategory)?.name}
                  {filterCity && <span className="font-normal text-sm ml-2" style={{ color: storeTheme.textMuted }}>em {filterCity}</span>}
                  <span className="font-normal text-sm ml-2" style={{ color: storeTheme.textMuted }}>({filteredProducts.length})</span>
                </h2>
              )}
            </div>

            {/* Products Grid — Desktop only */}
            {filteredProducts.length > 0 ? (
              false ? (
                /* ── RPG-style grid ── */
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                  {filteredProducts.map((product: any, i: number) => {
                    const productLink = `/imoveis/produto/${product.slug || product.id}${corretorSlug ? `?corretor=${corretorSlug}` : ""}`;
                    const accentColor = storeTheme.primary;
                    return (
                      <motion.div
                        key={product.id}
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.04 }}
                      >
                        <Link
                          to={productLink}
                          className="group block relative overflow-hidden transition-all hover:scale-[1.02] hover:shadow-xl"
                          style={{
                            background: "rgba(0,0,0,0.55)",
                            border: `1px solid ${accentColor}20`,
                            clipPath: "polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 calc(100% - 12px))",
                          }}
                        >
                          <div className="relative aspect-[4/3] overflow-hidden">
                            {product.image ? (
                              <img src={product.image} alt={product.title}
                                className={`w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 ${product.status === "vendido" ? "brightness-50" : ""}`} loading="lazy" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center" style={{ background: "#111" }}>
                                <Image size={28} style={{ color: accentColor }} />
                              </div>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />

                            {product.tag && (
                              <span className="absolute top-2 left-2 px-2 py-0.5 text-[9px] font-bold text-white/90"
                                style={{ background: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.15)" }}>
                                {getTagLabel(product.tag)}
                              </span>
                            )}
                            {isDbProfile && ((product.tags || []).includes("aluguel_flex") || product.category === "aluguel") && (
                              <span className="absolute top-2 right-2 px-2 py-0.5 text-[9px] font-bold text-white/90"
                                style={{ background: `${accentColor}80`, border: `1px solid ${accentColor}40` }}>
                                🏠 Aluguel
                              </span>
                            )}
                            {product.status === "vendido" && (
                              <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                <span className="text-red-400 font-black text-xs uppercase tracking-widest"
                                  style={{ textShadow: "0 0 10px rgba(248,113,113,0.5)" }}>
                                  VENDIDO
                                </span>
                              </div>
                            )}
                          </div>

                          <div className="p-3 md:p-4" style={{ background: "rgba(0,0,0,0.65)" }}>
                            <h4 className="font-display font-bold text-xs md:text-sm text-white/90 line-clamp-2 leading-tight">
                              {product.title}
                            </h4>
                            {product.price > 0 && (
                              <p className="font-display font-black text-base md:text-lg mt-1" style={{ color: accentColor }}>
                                R$ {product.price.toLocaleString("pt-BR")}
                                {isDbProfile && ((product.tags || []).includes("aluguel_flex") || product.category === "aluguel") && (
                                  <span className="text-xs font-normal text-white/40"> /mês</span>
                                )}
                              </p>
                            )}
                            {product.city && (
                              <p className="text-[10px] mt-1.5 flex items-center gap-0.5 text-white/40">
                                <MapPin size={9} /> {product.city}
                              </p>
                            )}
                            {(product.bedrooms || product.area) && (
                              <div className="flex gap-1.5 mt-2 flex-wrap">
                                {product.bedrooms && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[9px] text-white/60 font-semibold"
                                    style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>
                                    <Bed size={9} className="text-white/40" /> {product.bedrooms}
                                  </span>
                                )}
                                {product.bathrooms && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[9px] text-white/60 font-semibold"
                                    style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>
                                    <Bath size={9} className="text-white/40" /> {product.bathrooms}
                                  </span>
                                )}
                                {product.area && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[9px] text-white/60 font-semibold"
                                    style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>
                                    <Maximize size={9} className="text-white/40" /> {product.area}m²
                                  </span>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Bottom glow */}
                          <div className="absolute bottom-0 left-0 right-0 h-0.5"
                            style={{ background: `linear-gradient(90deg, transparent, ${accentColor}40, transparent)` }} />
                        </Link>
                      </motion.div>
                    );
                  })}
                </div>
              ) : (
                /* ── Standard grid ── */
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-5">
                  {filteredProducts.map((product: any, i: number) => {
                    const productLink = `/imoveis/produto/${product.slug || product.id}${corretorSlug ? `?corretor=${corretorSlug}` : ""}`;
                    const isAluguel = isDbProfile && ((product.tags || []).includes("aluguel_flex") || product.category === "aluguel");
                    return (
                      <motion.div
                        key={product.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.03 + i * 0.03 }}
                        whileHover={{ y: -4 }}
                      >
                        <Link to={productLink} className={`group block rounded-2xl overflow-hidden transition-all duration-500 relative isolate ${
                          isDbProfile && ((dbProfile as any)?.destaque_item_ids || []).includes(product.id)
                            ? "ring-2 ring-amber-400/60 shadow-[0_0_20px_rgba(251,191,36,0.15)] border-amber-400/40"
                            : ""
                        }`} style={{
                          background: storeTheme.card,
                          border: `1px solid ${storeTheme.border}`,
                          boxShadow: `0 10px 30px -12px ${storeTheme.primary}30`,
                        }}>
                          <div className="relative aspect-[4/3] overflow-hidden bg-muted">
                            {product.image ? (
                              <img src={product.image} alt={product.title} className={`w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 ${product.status === "vendido" ? "brightness-50 blur-[1px]" : ""}`} loading="lazy" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Image size={32} className="text-muted-foreground" />
                              </div>
                            )}
                            {product.status === "vendido" && (
                              <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
                                <span className="px-4 py-2 rounded-xl bg-red-600/90 text-white font-bold text-sm shadow-lg">❌ Vendido</span>
                              </div>
                            )}
                            {/* Cinematic gradient overlay */}
                            <div className="absolute inset-0 pointer-events-none" style={{
                              background: `linear-gradient(to top, ${storeTheme.bg}cc 0%, transparent 50%)`,
                            }} />
                            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" style={{
                              background: `linear-gradient(135deg, transparent 30%, ${storeTheme.primary}25 50%, transparent 70%)`,
                            }} />
                            {product.tag && (
                              <span className={`absolute top-2.5 left-2.5 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider shadow-lg backdrop-blur-md ${getTagStyle(product.tag)}`}
                                style={{ boxShadow: `0 4px 12px rgba(0,0,0,0.4)` }}>
                                {getTagLabel(product.tag)}
                              </span>
                            )}
                            {isAluguel && (
                              <span className="absolute top-2.5 right-2.5 px-2.5 py-1 rounded-lg text-[10px] font-bold shadow-lg backdrop-blur-sm" style={{ background: `${storeTheme.primary}dd`, color: "#fff" }}>
                                🏠 Aluguel
                              </span>
                            )}
                          </div>
                          <div className="p-3 md:p-4 relative">
                            <div
                              className="absolute top-0 left-3 right-3 h-[1px] opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                              style={{ background: `linear-gradient(90deg, transparent, ${storeTheme.primary}, transparent)` }}
                            />
                            <h3 className="font-display font-black text-sm leading-snug line-clamp-2 mb-2 uppercase tracking-tight" style={{ color: storeTheme.text, letterSpacing: "-0.01em" }}>
                              {product.title}
                            </h3>
                            {product.price > 0 && (
                              <div className="inline-flex items-baseline gap-1 px-2.5 py-1.5 rounded-lg" style={{
                                background: `linear-gradient(135deg, ${storeTheme.primary}20, ${storeTheme.primary}08)`,
                                border: `1px solid ${storeTheme.primary}40`,
                                boxShadow: `0 0 16px ${storeTheme.primary}30, inset 0 1px 0 ${storeTheme.primary}30`,
                              }}>
                                <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: storeTheme.primary }}>R$</span>
                                <span className="text-base md:text-xl font-black leading-none" style={{
                                  color: storeTheme.text,
                                  textShadow: `0 0 12px ${storeTheme.primary}80, 0 0 24px ${storeTheme.primary}40`,
                                }}>
                                  {product.price.toLocaleString("pt-BR")}
                                </span>
                                {isAluguel && <span className="text-[9px] font-bold ml-0.5" style={{ color: storeTheme.textMuted }}>/mês</span>}
                              </div>
                            )}
                            <div className="flex items-center gap-2.5 mt-2.5 text-[10px]" style={{ color: storeTheme.textMuted }}>
                              {product.bedrooms > 0 && <span className="flex items-center gap-0.5"><Bed size={10} /> {product.bedrooms}</span>}
                              {product.bathrooms > 0 && <span className="flex items-center gap-0.5"><Bath size={10} /> {product.bathrooms}</span>}
                              {product.area > 0 && <span className="flex items-center gap-0.5"><Ruler size={10} /> {product.area}m²</span>}
                            </div>
                            {product.city && (
                              <p className="text-[11px] mt-2 flex items-center gap-1" style={{ color: storeTheme.textMuted }}>
                                <MapPin size={10} /> {product.city}
                              </p>
                            )}
                            <div
                              className="relative mt-3 w-full flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg text-[11px] font-black uppercase tracking-widest overflow-hidden group/info transition-all group-hover:scale-[1.02]"
                              style={{
                                background: `linear-gradient(135deg, ${storeTheme.primary}, ${storeTheme.primary}dd)`,
                                color: "#fff",
                                boxShadow: `0 8px 24px -4px ${storeTheme.primary}90, 0 0 0 1px ${storeTheme.primary}, inset 0 1px 0 rgba(255,255,255,0.4)`,
                                textShadow: "0 1px 2px rgba(0,0,0,0.3)",
                              }}
                            >
                              <div
                                className="absolute inset-0 -translate-x-full group-hover/info:translate-x-full transition-transform duration-700"
                                style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.5), transparent)" }}
                              />
                              <Info size={13} className="relative z-10" />
                              <span className="relative z-10">Informações</span>
                            </div>
                          </div>
                        </Link>
                      </motion.div>
                    );
                  })}
                </div>
              )
            ) : (
              <div className="text-center py-20 rounded-2xl" style={{ background: storeTheme.card, border: `1px solid ${storeTheme.border}` }}>
                {false ? (
                  <>
                    <Sparkles size={48} className="mx-auto mb-3" style={{ color: storeTheme.primary }} />
                    <p className="font-semibold text-lg" style={{ color: storeTheme.textMuted }}>Nenhum item no inventário</p>
                  </>
                ) : (
                  <>
                    <Image size={48} className="text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground text-lg font-medium">Nenhum anúncio nesta categoria</p>
                  </>
                )}
                <button onClick={() => setActiveCategory("todos")} className="text-primary text-sm mt-2 hover:underline">Ver todos</button>
              </div>
            )}
            </div>
          </div>
        </div>
      </div>

      {/* ═══ VIDEO SECTION ═══ */}
      {isDbProfile && dbProfile?.video_url && (() => {
        const ytId = extractYouTubeId(dbProfile.video_url);
        if (!ytId) return null;
        return (
          <section className="px-4 md:px-8 lg:px-12 py-8">
            <div className="max-w-4xl mx-auto">
              <h3 className="font-display font-bold text-lg md:text-xl mb-4" style={{ color: storeTheme.text }}>
                <Play size={20} className="inline mr-2" style={{ color: storeTheme.primary }} />
                {(dbProfile as any)?.video_title || "Vídeo"}
              </h3>
              {(dbProfile as any)?.video_description && (
                <p className="text-sm mb-4 max-w-2xl" style={{ color: storeTheme.textMuted }}>{(dbProfile as any).video_description}</p>
              )}
              <div className="relative aspect-video rounded-2xl overflow-hidden shadow-xl" style={{ border: `1px solid ${storeTheme.border}` }}>
                <iframe
                  src={`https://www.youtube.com/embed/${ytId}?rel=0`}
                  title={(dbProfile as any)?.video_title || "Vídeo"}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full"
                />
              </div>
              <div className="flex gap-3 mt-4">
                <a
                  href={dbProfile.video_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm text-white shadow-lg active:scale-95 transition-transform"
                  style={{ background: storeTheme.primary }}
                >
                  <ExternalLink size={16} /> Assistir no YouTube
                </a>
                {company.whatsapp && (
                  <button
                    onClick={() => handleWhatsApp("Vídeo: " + ((dbProfile as any)?.video_title || company.name))}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#25d366] text-white font-bold text-sm shadow-lg active:scale-95 transition-transform"
                  >
                    <MessageCircle size={16} /> Falar sobre
                  </button>
                )}
              </div>
            </div>
          </section>
        );
      })()}

      {/* ═══ STORE VIDEO SECTION (separate from hero video) ═══ */}
      {isDbProfile && (dbProfile as any)?.store_video_url && (() => {
        const ytId = extractYouTubeId((dbProfile as any).store_video_url);
        if (!ytId) return null;
        const svTitle = (dbProfile as any)?.store_video_title || "Vídeo";
        const svDescription = (dbProfile as any)?.store_video_description;
        const svButtonText = (dbProfile as any)?.store_video_button_text;
        const svButtonUrl = (dbProfile as any)?.store_video_button_url;
        const svPropertyLabel = (dbProfile as any)?.store_video_property_label || svTitle;

        const handleScheduleVisit = () => {
          if (dbProfile) {
            setLeadCaptureContext({
              funnelStage: "agendamento",
              extraNotes: `📹 Agendamento via vídeo da loja\n🏠 Imóvel: ${svPropertyLabel}`,
              leadSource: "video_loja",
            });
            setPendingWhatsAppAction(() => () => doWhatsAppRedirect(`Agendamento - ${svPropertyLabel}`));
            setLeadCaptureOpen(true);
          } else {
            doWhatsAppRedirect(`Agendamento - ${svPropertyLabel}`);
          }
        };

        return (
          <section className="px-4 md:px-8 lg:px-12 py-10">
            <div className="max-w-4xl mx-auto text-center">
              <h3 className="font-display font-bold text-xl md:text-2xl mb-4 flex items-center justify-center gap-2" style={{ color: storeTheme.text }}>
                <span className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${storeTheme.primary}20` }}>
                  <Play size={18} style={{ color: storeTheme.primary }} />
                </span>
                {svTitle}
              </h3>
              <div className="relative aspect-video rounded-2xl overflow-hidden shadow-2xl" style={{ border: `1px solid ${storeTheme.border}` }}>
                <iframe
                  src={`https://www.youtube.com/embed/${ytId}?rel=0`}
                  title={svTitle}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full"
                />
              </div>
              {svDescription && (
                <p className="text-sm mt-4 leading-relaxed max-w-2xl" style={{ color: storeTheme.textMuted }}>
                  {svDescription}
                </p>
              )}
              <div className="flex flex-wrap justify-center gap-3 mt-5">
                {svButtonText && svButtonUrl && (
                  <a
                    href={svButtonUrl}
                    target={svButtonUrl.startsWith("http") ? "_blank" : undefined}
                    rel={svButtonUrl.startsWith("http") ? "noopener noreferrer" : undefined}
                    className="inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl font-bold text-sm text-white shadow-xl hover:shadow-2xl active:scale-95 transition-all"
                    style={{ background: `linear-gradient(135deg, ${storeTheme.primary}, ${storeTheme.primary}dd)` }}
                  >
                    <ExternalLink size={16} /> {svButtonText}
                  </a>
                )}
                {company.whatsapp && (
                  <button
                    onClick={handleScheduleVisit}
                    className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl font-bold text-sm text-white shadow-xl hover:shadow-2xl active:scale-95 transition-all"
                    style={{ background: `linear-gradient(135deg, ${storeTheme.primary}, ${storeTheme.primary}cc)` }}
                  >
                    <Calendar size={16} /> Agendar uma Visita
                  </button>
                )}
              </div>
            </div>
          </section>
        );
      })()}

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

                  {/* Content overlay – full description on photo */}
                  <div className="absolute inset-0 z-10 flex flex-col justify-end p-5 md:p-14">
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
                        <div className="flex items-center gap-3 mb-3">
                          {company.logo && (
                            <img src={company.logo} alt="" className="w-9 h-9 rounded-lg object-cover border border-white/20" />
                          )}
                          <div>
                            <p className="font-display font-bold text-sm text-white/90">{company.name}</p>
                            {company.show_location && <p className="text-[11px] text-white/40">{company.address}</p>}
                          </div>
                        </div>

                        {lbProduct.tag && (
                          <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold shadow mb-2 ${getTagStyle(getTagLabel(lbProduct.tag))}`}>
                            {getTagLabel(lbProduct.tag)}
                          </span>
                        )}
                        <h2 className="font-display font-bold text-2xl md:text-5xl text-white leading-tight drop-shadow-2xl">
                          {lbProduct.title}
                        </h2>

                        {/* Specs row */}
                        {((lbProduct as any).bedrooms || (lbProduct as any).bathrooms || (lbProduct as any).area || (lbProduct as any).parking_spots || lbProduct.specs?.quartos) && (
                          <div className="flex items-center gap-4 mt-3 text-white/70 text-xs md:text-sm flex-wrap">
                            {((lbProduct as any).bedrooms || lbProduct.specs?.quartos) && <span>🛏 {(lbProduct as any).bedrooms || lbProduct.specs?.quartos} quartos</span>}
                            {(lbProduct as any).suites && <span>🛁 {(lbProduct as any).suites} suítes</span>}
                            {((lbProduct as any).bathrooms || lbProduct.specs?.banheiros) && <span>🚿 {(lbProduct as any).bathrooms || lbProduct.specs?.banheiros} banheiros</span>}
                            {((lbProduct as any).area || lbProduct.specs?.area) && <span>📐 {(lbProduct as any).area || lbProduct.specs?.area}m²</span>}
                            {((lbProduct as any).parking_spots || lbProduct.specs?.vagas) && <span>🚗 {(lbProduct as any).parking_spots || lbProduct.specs?.vagas} vagas</span>}
                          </div>
                        )}

                        {/* Full description */}
                        {lbProduct.description && (
                          <p className="text-white/60 text-xs md:text-base mt-3 line-clamp-5 md:line-clamp-6 max-w-2xl leading-relaxed">{lbProduct.description}</p>
                        )}

                        {/* Location */}
                        {((lbProduct as any).neighborhood || lbProduct.city) && (
                          <p className="text-white/40 text-[11px] md:text-xs mt-2 flex items-center gap-1">
                            📍 {[(lbProduct as any).neighborhood, lbProduct.city, (lbProduct as any).state].filter(Boolean).join(", ")}
                          </p>
                        )}

                        {lbProduct.price > 0 && (
                          <p className="font-display font-bold text-xl md:text-4xl mt-3 drop-shadow-lg" style={{ color: storeTheme.primary }}>
                            {isDbProfile ? `R$ ${lbProduct.price.toLocaleString("pt-BR")}` : formatPrice(lbProduct.price)}
                            {isDbProfile && (((lbProduct as any).tags || []).includes("aluguel_flex") || (lbProduct as any).category === "aluguel") && (
                              <span className="text-lg font-normal text-muted-foreground"> /mês</span>
                            )}
                          </p>
                        )}

                        <div className="flex items-center gap-2 mt-4 flex-wrap">
                          <Link
                            to={`/${seg}/produto/${lbProduct.slug || lbProduct.id}${corretorSlug ? `?corretor=${corretorSlug}` : ""}`}
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
      {/* Mobile "Sobre" section - unified card for all layouts */}
      <section data-broker-card-section className={`${isMarketplace || isNetflix ? "" : "lg:hidden"} px-4 mt-6 mb-6`}>
        <div className="max-w-[1800px] mx-auto grid lg:grid-cols-2 gap-4 items-start">
          {/* ── Bloco 1: Card do Corretor (estilo sidebar) ── */}
          <div
            className="rounded-2xl p-4"
            style={{
              background: `linear-gradient(160deg, ${storeTheme.card}, ${storeTheme.primary}08)`,
              border: `1px solid ${storeTheme.primary}30`,
              boxShadow: `0 10px 30px -10px ${storeTheme.primary}30`,
            }}
          >
            <h5 className="text-[11px] font-black uppercase tracking-widest mb-3 flex items-center gap-1.5" style={{ color: storeTheme.primary }}>
              <BadgeCheck size={12} /> Profissional Verificado
            </h5>
            <div className="flex items-start gap-3.5 lg:flex-col lg:items-center lg:text-center">
              {company.logo ? (
                <img src={company.logo} alt={company.name} className="w-16 h-16 rounded-xl object-cover shadow-lg" style={{ border: `2px solid ${storeTheme.primary}`, boxShadow: `0 0 20px ${storeTheme.primary}40` }} />
              ) : (
                <div className="w-16 h-16 rounded-xl flex items-center justify-center shadow-lg" style={{ background: storeTheme.primary, boxShadow: `0 0 20px ${storeTheme.primary}40` }}>
                  <span className="text-white font-bold text-xl">{company.name?.charAt(0)}</span>
                </div>
              )}
              <div className="flex-1 min-w-0 pt-1">
                <div className="flex items-center gap-1.5 lg:justify-center">
                  <p className="font-display font-bold text-sm truncate" style={{ color: storeTheme.text }}>{company.name}</p>
                  {isPaid && <BadgeCheck size={14} style={{ color: storeTheme.primary }} />}
                </div>
                <p className="text-[11px] mt-0.5 flex items-center gap-1 lg:justify-center" style={{ color: storeTheme.textMuted }}>
                  <Sparkles size={9} style={{ color: storeTheme.primary }} />
                  {teamMember
                    ? "Corretor(a) de Imóveis"
                    : dbProfile?.seller_category
                      ? ({ imobiliaria: "Imobiliária", corretor: "Corretor(a) de Imóveis", proprietario: "Proprietário", construtora: "Construtora", loja_veiculos: "Loja de Veículos", autonomo: "Vendedor Autônomo", concessionaria: "Concessionária" } as Record<string, string>)[dbProfile.seller_category] || "Especialista em imóveis"
                      : "Especialista em imóveis"}
                </p>
                <div className="flex gap-2 mt-3 flex-wrap lg:justify-center">
                  {company.whatsapp && (
                    <button
                      onClick={() => handleWhatsApp(heroProduct?.title || company.name, heroProduct?.id)}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-white font-bold text-[11px] active:scale-95 transition-transform"
                      style={{ background: `linear-gradient(135deg, ${storeTheme.primary}, ${storeTheme.primary}dd)`, boxShadow: `0 8px 20px -5px ${storeTheme.primary}80` }}
                    >
                      <MessageCircle size={13} /> WhatsApp
                    </button>
                  )}
                  {(company as any).instagram && ["start", "vip", "premium", "essencial_empresa", "premium_empresa", "prime_empresa"].includes(sellerTier || "") && (
                    <a
                      href={`https://instagram.com/${(company as any).instagram.replace(/^@/, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3 py-2 rounded-lg font-bold text-[11px] active:scale-95 transition-transform"
                      style={{ background: `${storeTheme.primary}15`, color: storeTheme.primary, border: `1px solid ${storeTheme.primary}40` }}
                    >
                      <Instagram size={13} /> Instagram
                    </a>
                  )}
                </div>
                {(teamMember?.bio || dbProfile?.bio) && (
                  <p className="text-[11px] leading-relaxed mt-2" style={{ color: storeTheme.textMuted }}>{teamMember?.bio || dbProfile.bio}</p>
                )}
                <div className="grid grid-cols-3 gap-2 mt-3">
                  <div className="text-center py-2 rounded-lg" style={{ background: `linear-gradient(135deg, ${storeTheme.primary}15, ${storeTheme.primary}05)`, border: `1px solid ${storeTheme.primary}30` }}>
                    <p className="text-base font-black" style={{ color: storeTheme.primary, textShadow: `0 0 10px ${storeTheme.primary}60` }}>{products.length}</p>
                    <p className="text-[8px] uppercase tracking-wider" style={{ color: storeTheme.textMuted }}>Imóveis</p>
                  </div>
                  <div className="text-center py-2 rounded-lg" style={{ background: `linear-gradient(135deg, ${storeTheme.primary}15, ${storeTheme.primary}05)`, border: `1px solid ${storeTheme.primary}30` }}>
                    <p className="text-base font-black" style={{ color: storeTheme.primary, textShadow: `0 0 10px ${storeTheme.primary}60` }}>{isPaid ? "✓" : "—"}</p>
                    <p className="text-[8px] uppercase tracking-wider" style={{ color: storeTheme.textMuted }}>{isPaid ? "Verificado" : "Ativo"}</p>
                  </div>
                  {availableCities.length > 0 && (
                    <div className="text-center py-2 rounded-lg" style={{ background: `linear-gradient(135deg, ${storeTheme.primary}15, ${storeTheme.primary}05)`, border: `1px solid ${storeTheme.primary}30` }}>
                      <p className="text-base font-black" style={{ color: storeTheme.primary, textShadow: `0 0 10px ${storeTheme.primary}60` }}>{availableCities.length}</p>
                      <p className="text-[8px] uppercase tracking-wider" style={{ color: storeTheme.textMuted }}>{availableCities.length === 1 ? "Cidade" : "Cidades"}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="mt-4 space-y-2">
              {(teamMember?.creci || (["corretor", "imobiliaria", "construtora"].includes(dbProfile?.seller_category) && dbProfile?.creci)) && (
                <div className="flex items-center justify-center gap-1.5 py-2 rounded-lg" style={{ background: `linear-gradient(135deg, ${storeTheme.primary}20, ${storeTheme.primary}10)`, border: `1px solid ${storeTheme.primary}50`, boxShadow: `0 0 15px ${storeTheme.primary}30` }}>
                  <Shield size={12} style={{ color: storeTheme.primary }} />
                  <span className="text-[10px] font-bold tracking-wider" style={{ color: storeTheme.primary }}>CRECI {teamMember?.creci || dbProfile.creci}</span>
                </div>
              )}
              {dbProfile?.cnpj && (
                <div className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg" style={{ background: `${storeTheme.primary}08`, border: `1px solid ${storeTheme.primary}20` }}>
                  <Store size={12} style={{ color: storeTheme.textMuted }} />
                  <span className="text-[10px]" style={{ color: storeTheme.textMuted }}>CNPJ: {dbProfile.cnpj}</span>
                </div>
              )}
            </div>
            {teamMember && dbProfile?.logo_url && (
              <div className="flex items-center gap-3 mt-3 p-2.5 rounded-lg" style={{ background: `${storeTheme.primary}08`, border: `1px solid ${storeTheme.primary}20` }}>
                <img src={dbProfile.logo_url} alt={dbProfile.company_name || dbProfile.full_name} className="w-10 h-10 rounded-lg object-cover" style={{ border: `1px solid ${storeTheme.primary}40` }} />
                <div>
                  <p className="text-xs font-bold" style={{ color: storeTheme.text }}>{dbProfile.company_name || dbProfile.full_name}</p>
                  {dbProfile.cnpj && <p className="text-[10px]" style={{ color: storeTheme.textMuted }}>CNPJ: {dbProfile.cnpj}</p>}
                </div>
              </div>
            )}
            {isPaid && isNetflix && (
              <div className="flex justify-center mt-3 pt-3" style={{ borderTop: `1px solid ${storeTheme.primary}20` }}>
                <PackageBadge tier={sellerTier} size="sm" />
              </div>
            )}
          </div>

          {/* ── Bloco 2: Mapa de Localização (estilo sidebar) ── */}
          {(company?.address || dbProfile?.address || dbProfile?.city) && (
            <div
              className="rounded-2xl p-4 flex flex-col"
              style={{
                background: `linear-gradient(160deg, ${storeTheme.card}, ${storeTheme.primary}08)`,
                border: `1px solid ${storeTheme.primary}30`,
                boxShadow: `0 10px 30px -10px ${storeTheme.primary}30`,
              }}
            >
              <h5 className="text-[11px] font-black uppercase tracking-widest mb-3 flex items-center gap-1.5" style={{ color: storeTheme.primary }}>
                <MapPin size={12} /> Localização
              </h5>
              <div className="flex-1 rounded-xl overflow-hidden" style={{ border: `1px solid ${storeTheme.primary}20`, minHeight: 240 }}>
                <MapEmbed address={company?.address || [dbProfile?.address, dbProfile?.city, dbProfile?.state].filter(Boolean).join(", ")} />
              </div>
              {(company?.address || dbProfile?.address) && (
                <p className="text-[11px] mt-3 flex items-start gap-1.5" style={{ color: storeTheme.textMuted }}>
                  <MapPin size={11} style={{ color: storeTheme.primary }} className="mt-0.5 flex-shrink-0" />
                  <span>{company?.address || [dbProfile?.address, dbProfile?.city, dbProfile?.state].filter(Boolean).join(", ")}</span>
                </p>
              )}
            </div>
          )}
        </div>
      </section>

      {/* ═══ STICKY MOBILE BOTTOM BAR ═══ */}


      {company.whatsapp && (dbProfile as any)?.show_floating_whatsapp && (
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => handleWhatsApp(heroProduct?.title || company.name)}
          className="fixed bottom-6 right-6 lg:bottom-24 z-50 w-14 h-14 rounded-full bg-[#25d366] text-white shadow-2xl flex items-center justify-center hover:bg-[#22c55e] transition-colors"
          aria-label="Falar no WhatsApp"
        >
          <MessageCircle size={26} fill="white" />
        </motion.button>
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

      {isDbProfile && dbProfile && (
        <WhatsAppLeadCapture
          open={leadCaptureOpen}
          onOpenChange={(open) => {
            setLeadCaptureOpen(open);
            if (!open) setLeadCaptureContext(null);
          }}
          sellerId={id!}
          sellerUserId={dbProfile.user_id}
          funnelStage={leadCaptureContext?.funnelStage}
          extraNotes={leadCaptureContext?.extraNotes}
          leadSource={leadCaptureContext?.leadSource}
          teamMemberId={teamMember?.id || null}
          partnerBrokerSellerId={teamMember?._partnerSellerId || null}
          partnerBrokerUserId={teamMember?._partnerUserId || null}
          onComplete={() => {
            if (pendingWhatsAppAction) {
              pendingWhatsAppAction();
              setPendingWhatsAppAction(null);
            }
            setLeadCaptureContext(null);
          }}
        />
      )}

      {dbProfile && (
        <StoryUploadDialog
          open={storyUploadOpen}
          onOpenChange={setStoryUploadOpen}
          sellerId={dbProfile.id}
          onUploaded={() => window.location.reload()}
        />
      )}

      {dbProfile?.id && (
        <PushSubscribeButton sellerId={dbProfile.id} primaryColor={storeTheme.primary} />
      )}
    </div>
  );
}
