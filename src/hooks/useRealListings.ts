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
  brand?: string;
  model?: string;
  description?: string;
  bedrooms?: number;
  bathrooms?: number;
  area?: number;
  year?: number;
  mileage?: number;
  sellerTier?: "basico" | "premium" | "vip";
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
    brand: item.brand,
    model: item.model,
    description: item.description,
    bedrooms: item.bedrooms,
    bathrooms: item.bathrooms,
    area: item.area,
    year: item.year,
    mileage: item.mileage,
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

      const tierOrder = { vip: 0, premium: 1, start: 2, basico: 3 };
      mapped.sort((a: any, b: any) => (tierOrder[a.sellerTier as keyof typeof tierOrder] ?? 3) - (tierOrder[b.sellerTier as keyof typeof tierOrder] ?? 3));

      // Apply tier-based visibility percentage
      const tierVisibility: Record<string, number> = {
        basico: 0.10,
        start: 0.15,
        vip: 0.20,
        premium: 0.25,
        essencial_empresa: 0.26,
        premium_empresa: 0.27,
        prime_empresa: 0.29,
      };

      // Group items by seller, apply % filter, then flatten
      const itemsBySeller = new Map<string, typeof mapped>();
      mapped.forEach((item) => {
        const list = itemsBySeller.get(item.sellerId) || [];
        list.push(item);
        itemsBySeller.set(item.sellerId, list);
      });

      const visibleItems: typeof mapped = [];
      itemsBySeller.forEach((sellerItems, sellerId) => {
        const tier = tierMap.get(sellerId) || "basico";
        const pct = tierVisibility[tier] ?? 0.10;
        const count = Math.max(1, Math.ceil(sellerItems.length * pct));
        // Shuffle for fairness, then take the allowed count
        const shuffled = [...sellerItems].sort(() => Math.random() - 0.5);
        visibleItems.push(...shuffled.slice(0, count));
      });

      // Re-sort by tier priority
      visibleItems.sort((a: any, b: any) => (tierOrder[a.sellerTier as keyof typeof tierOrder] ?? 3) - (tierOrder[b.sellerTier as keyof typeof tierOrder] ?? 3));

      setItems(visibleItems);
      setLoading(false);
    };

    fetchData();
  }, [segment]);

  return { sellers, items, loading };
}
