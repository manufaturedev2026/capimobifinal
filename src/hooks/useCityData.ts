import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface CityItem {
  id: string;
  sellerId: string;
  sellerName: string;
  sellerLogo: string;
  sellerAddress: string;
  title: string;
  price: number;
  image: string;
  images: string[];
  tags: string[];
  category: string;
  type: "imovel";
  city?: string;
  neighborhood?: string;
  description?: string;
  bedrooms?: number;
  bathrooms?: number;
  area?: number;
  sellerTier?: string;
  furnished?: boolean;
  accepts_financing?: boolean;
  hasDestaque?: boolean;
  hasBlackTag?: boolean;
}

export function useCityData(city: string, segment?: "imoveis") {
  const [items, setItems] = useState<CityItem[]>([]);
  const [loading, setLoading] = useState(true);

  const normalizedCity = city.replace(/-/g, " ");

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      const { data: rawItems } = await supabase
        .from("seller_items")
        .select("id, seller_id, title, price, photos, thumbnail_url, tags, category, city, neighborhood, description, bedrooms, bathrooms, area, furnished, accepts_financing")
        .ilike("city", `%${normalizedCity}%`)
        .eq("seller_type", "imoveis")
        .eq("status", "ativo")
        .or("is_owner_listing.is.null,is_owner_listing.eq.false")
        .order("created_at", { ascending: false })
        .limit(200);

      const sellerIds = [...new Set((rawItems || []).map((item: any) => item.seller_id).filter(Boolean))];

      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, company_name, full_name, logo_url, seller_type, address, city, state")
        .eq("seller_type", "imoveis")
        .in("id", sellerIds.length > 0 ? sellerIds : ["00000000-0000-0000-0000-000000000000"]);

      const sellerMap = new Map<string, { name: string; logo: string; address: string }>();
      (profiles || []).forEach((p: any) => {
        sellerMap.set(p.id, {
          name: p.company_name || p.full_name,
          logo: p.logo_url || "",
          address: [p.address, p.city, p.state].filter(Boolean).join(", "),
        });
      });

      // Fetch subscriptions for tier info
      const { data: subs } = sellerIds.length > 0
        ? await supabase
            .from("seller_subscriptions")
            .select("seller_id, tier")
            .in("seller_id", sellerIds)
            .eq("is_active", true)
        : { data: [] };
      const tierMap = new Map<string, string>();
      (subs || []).forEach((s: any) => tierMap.set(s.seller_id, s.tier));

      // Fetch active destaque rewards
      const { data: rewards } = sellerIds.length > 0
        ? await supabase
            .from("seller_rewards")
            .select("seller_id, reward_type")
            .in("seller_id", sellerIds)
            .eq("is_active", true)
            .eq("claimed", true)
        : { data: [] };
      const destaqueSet = new Set<string>();
      (rewards || []).forEach((r: any) => {
        if (r.reward_type === "destaque") destaqueSet.add(r.seller_id);
      });

      const mapped: CityItem[] = (rawItems || []).map((item: any) => {
        const seller = sellerMap.get(item.seller_id);
        const photos = item.photos?.length ? item.photos : [];
        return {
          id: item.id,
          sellerId: item.seller_id,
          sellerName: seller?.name || "",
          sellerLogo: seller?.logo || "",
          sellerAddress: seller?.address || "",
          title: item.title,
          price: item.price || 0,
          image: photos[0] || "",
          images: photos,
          tags: item.tags || [],
          category: item.category,
          type: "imovel" as const,
          city: item.city,
          neighborhood: item.neighborhood,
          description: item.description,
          bedrooms: item.bedrooms,
          bathrooms: item.bathrooms,
          area: item.area,
          sellerTier: tierMap.get(item.seller_id) || "basico",
          furnished: item.furnished,
          accepts_financing: item.accepts_financing,
          hasDestaque: destaqueSet.has(item.seller_id),
          hasBlackTag: false,
        };
      });

      setItems(mapped);
      setLoading(false);
    };

    fetchData();
  }, [normalizedCity]);

  return { items, loading, cityName: normalizedCity };
}

const CITIES_CACHE_KEY = "available_cities_cache_v1";
const CITIES_TTL_MS = 60 * 60 * 1000; // 1 hour

export function useAvailableCities() {
  const [cities, setCities] = useState<string[]>(() => {
    // Hydrate synchronously from localStorage
    try {
      const raw = localStorage.getItem(CITIES_CACHE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.expiresAt && Date.now() < parsed.expiresAt && Array.isArray(parsed.value)) {
          return parsed.value;
        }
      }
    } catch {
      // ignore
    }
    return [];
  });

  useEffect(() => {
    // Skip fetch if cache is fresh
    try {
      const raw = localStorage.getItem(CITIES_CACHE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.expiresAt && Date.now() < parsed.expiresAt) return;
      }
    } catch {
      // ignore
    }

    const fetchCities = async () => {
      // Single capped query (1000 distinct cities is more than enough)
      const { data } = await supabase
        .from("seller_items")
        .select("city")
        .eq("status", "ativo")
        .eq("seller_type", "imoveis")
        .not("city", "is", null)
        .limit(1000);

      const unique = new Set<string>();
      (data || []).forEach((item: any) => {
        if (item.city) unique.add(item.city.trim());
      });
      const sorted = Array.from(unique).sort();
      setCities(sorted);

      try {
        localStorage.setItem(
          CITIES_CACHE_KEY,
          JSON.stringify({ value: sorted, expiresAt: Date.now() + CITIES_TTL_MS })
        );
      } catch {
        // ignore
      }
    };
    fetchCities();
  }, []);

  return cities;
}
