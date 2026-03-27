import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface RealSeller {
  id: string;
  name: string;
  logo: string;
  address: string;
  city: string;
  phone: string;
  segment: "imoveis";
  show_location: boolean;
  tier: string;
  featured_item_id?: string | null;
}

export interface RealItem {
  id: string;
  sellerId: string;
  title: string;
  price: number;
  image: string;
  images: string[];
  tags: string[];
  category: string;
  type: "imovel";
  city?: string;
  neighborhood?: string;
  brand?: string;
  model?: string;
  description?: string;
  bedrooms?: number;
  bathrooms?: number;
  area?: number;
  year?: number;
  mileage?: number;
  sellerTier?: string;
  // New fields
  suites?: number;
  parking_spots?: number;
  furnished?: boolean;
  accepts_financing?: boolean;
  pool?: boolean;
  balcony?: boolean;
  property_subtype?: string;
  built_area?: number;
  condo_fee?: number;
  iptu?: number;
}

function mapItem(item: any): RealItem {
  const photos = item.photos?.length ? item.photos : [];
  return {
    id: item.id,
    sellerId: item.seller_id,
    title: item.title,
    price: item.price || 0,
    image: photos[0] || "",
    images: photos,
    tags: item.tags || [],
    category: item.category,
    type: "imovel",
    city: item.city,
    neighborhood: item.neighborhood,
    brand: item.brand,
    model: item.model,
    description: item.description,
    bedrooms: item.bedrooms,
    bathrooms: item.bathrooms,
    area: item.area,
    year: item.year,
    mileage: item.mileage,
    suites: item.suites,
    parking_spots: item.parking_spots,
    furnished: item.furnished,
    accepts_financing: item.accepts_financing,
    pool: item.pool,
    balcony: item.balcony,
    property_subtype: item.property_subtype,
    built_area: item.built_area,
    condo_fee: item.condo_fee,
    iptu: item.iptu,
  };
}

export function useRealListings(segment?: "imoveis" | "automoveis") {
  const [sellers, setSellers] = useState<RealSeller[]>([]);
  const [items, setItems] = useState<RealItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const query = supabase
        .from("seller_items")
        .select("*")
        .eq("seller_type", "imoveis")
        .eq("status", "ativo")
        .order("created_at", { ascending: false });

      const { data: rawItems } = await query;

      const sellerIds = [...new Set((rawItems || []).map((i: any) => i.seller_id))];

      const { data: subs } = await supabase
        .from("seller_subscriptions")
        .select("seller_id, tier")
        .eq("is_active", true);
      const tierMap = new Map<string, string>();
      (subs || []).forEach((s: any) => tierMap.set(s.seller_id, s.tier));

      let mappedSellers: RealSeller[] = [];
      if (sellerIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("*")
          .in("id", sellerIds);

        mappedSellers = (profiles || []).map((p: any) => ({
          id: p.id,
          name: p.company_name || p.full_name,
          logo: p.logo_url || "",
          address: [p.address, p.city, p.state].filter(Boolean).join(", "),
          city: p.city || "",
          phone: p.phone || "",
          segment: "imoveis" as const,
          show_location: p.show_location ?? true,
          tier: tierMap.get(p.id) || "basico",
          featured_item_id: p.featured_item_id || null,
        }));
      }
      setSellers(mappedSellers);

      const mapped = (rawItems || []).map((item: any) => ({
        ...mapItem(item),
        sellerTier: (tierMap.get(item.seller_id) as any) || "basico",
      }));

      // Tier weight: higher = more priority in sorting (appears first more often)
      // All items appear, but higher tiers get weighted shuffle priority
      const tierWeight: Record<string, number> = {
        prime_empresa: 29,
        premium_empresa: 27,
        essencial_empresa: 26,
        vip: 25,      // Display: "Premium" (plano mais caro individual)
        premium: 20,   // Display: "VIP"
        start: 15,
        basico: 10,
      };

      // Weighted shuffle: each item gets a random score multiplied by tier weight
      // Higher tiers get higher scores on average, so they appear first more often
      // But lower tiers still have a chance to appear near the top
      const weightedItems = mapped.map((item: any) => {
        const weight = tierWeight[item.sellerTier] ?? 10;
        const randomFactor = Math.random(); // 0-1
        const score = weight * (0.5 + randomFactor); // weight * [0.5 - 1.5]
        return { ...item, _sortScore: score };
      });

      // Sort by score descending (highest priority first, with randomness)
      weightedItems.sort((a: any, b: any) => b._sortScore - a._sortScore);

      // Remove internal score before setting state
      const finalItems = weightedItems.map(({ _sortScore, ...item }: any) => item);

      setItems(finalItems);
      setLoading(false);
    };

    fetchData();
  }, [segment]);

  return { sellers, items, loading };
}
