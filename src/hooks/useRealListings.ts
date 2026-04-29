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
  slug?: string | null;
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
  state?: string;
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
  sold_at?: string | null;
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
    state: item.state,
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
    sold_at: item.sold_at,
  };
}
export function useRealListings(segment?: "imoveis" | "automoveis") {
  const [sellers, setSellers] = useState<RealSeller[]>([]);
  const [items, setItems] = useState<RealItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      // Fetch all active items + recently sold items using pagination (Supabase default limit is 1000)
      let allItems: any[] = [];
      let page = 0;
      const pageSize = 1000;
      let hasMore = true;
      
      while (hasMore) {
        const { data: batch } = await supabase
          .from("seller_items")
          .select("*")
          .eq("seller_type", "imoveis")
          .in("status", ["ativo", "vendido"] as any)
          .or("is_owner_listing.is.null,is_owner_listing.eq.false")
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
      
      const rawItems = allItems;

      // Filter out sold items older than 24h
      const cutoff = Date.now() - 24 * 60 * 60 * 1000;
      const filteredItems = (rawItems || []).filter((item: any) => {
        if (item.status === "vendido" && item.sold_at) {
          return new Date(item.sold_at).getTime() > cutoff;
        }
        return true;
      });

      const sellerIds = [...new Set(filteredItems.map((i: any) => i.seller_id))];

      const { data: subs } = await supabase
        .from("seller_subscriptions")
        .select("seller_id, tier")
        .eq("is_active", true);
      const tierMap = new Map<string, string>();
      (subs || []).forEach((s: any) => tierMap.set(s.seller_id, s.tier));

      // Fetch active gamification rewards (black_tag + destaque)
      const { data: activeRewards } = await supabase
        .from("seller_rewards" as any)
        .select("seller_id, reward_type, expires_at")
        .eq("is_active", true);
      const blackTagSellers = new Set<string>();
      const destaqueSellers = new Set<string>();
      const now = new Date();
      (activeRewards || []).forEach((r: any) => {
        if (new Date(r.expires_at) > now) {
          if (r.reward_type === "black_tag_24h" || r.reward_type === "black_tag_1h") blackTagSellers.add(r.seller_id);
          if (r.reward_type === "destaque_24h" || r.reward_type === "destaque_10min") destaqueSellers.add(r.seller_id);
        }
      });

      const destaqueItemIds = new Set<string>();
      let mappedSellers: RealSeller[] = [];

      // Fetch ALL profiles so the seller count reflects all registered users
      const { data: allProfiles } = await supabase
        .from("profiles")
        .select("*");

      const profileMap = new Map<string, any>();
      (allProfiles || []).forEach((p: any) => profileMap.set(p.id, p));

      mappedSellers = (allProfiles || []).map((p: any) => ({
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
        slug: p.slug || null,
      }));

      // Collect destaque_item_ids from all sellers
      (allProfiles || []).forEach((p: any) => {
        (p.destaque_item_ids || []).forEach((id: string) => destaqueItemIds.add(id));
      });

      setSellers(mappedSellers);

      const mapped = filteredItems.map((item: any) => ({
        ...mapItem(item),
        sellerTier: (tierMap.get(item.seller_id) as any) || "basico",
        status: item.status,
      }));

      // Tier weight: higher = more priority in sorting (appears first more often)
      // All items appear, but higher tiers get weighted shuffle priority
      const tierWeight: Record<string, number> = {
        prime_empresa: 70,    // Pareado com VIP individual ("Premium")
        vip: 70,              // Display: "Premium"
        premium_empresa: 40,  // Pareado com Premium individual ("VIP")
        premium: 40,          // Display: "VIP"
        essencial_empresa: 20, // Pareado com Start
        start: 20,
        basico_empresa: 10,
        basico: 10,
      };

      // Weighted shuffle: each item gets a random score multiplied by tier weight
      // Higher tiers get higher scores on average, so they appear first more often
      // But lower tiers still have a chance to appear near the top
      const weightedItems = mapped.map((item: any) => {
        let weight = tierWeight[item.sellerTier] ?? 10;
        // Gamification: Black Tag 24h gives same priority as prime_empresa (200)
        if (blackTagSellers.has(item.sellerId)) {
          weight = Math.max(weight, 200);
          item.hasBlackTag = true;
        }
        // Gamification: Destaque 24h boosts to essencial_empresa level (100)
        if (destaqueSellers.has(item.sellerId)) {
          weight = Math.max(weight, 100);
          item.hasDestaque = true;
        }
        // Manual destaque from seller profile (up to 5 items)
        if (destaqueItemIds.has(item.id)) {
          weight = Math.max(weight, 100);
          item.hasDestaque = true;
        }
        const randomFactor = Math.random();
        const score = weight * (0.7 + randomFactor * 0.6);
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
