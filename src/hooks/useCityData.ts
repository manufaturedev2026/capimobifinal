import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface CityItem {
  id: string;
  sellerId: string;
  sellerName: string;
  sellerLogo: string;
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
}

export function useCityData(city: string, segment?: "imoveis") {
  const [items, setItems] = useState<CityItem[]>([]);
  const [loading, setLoading] = useState(true);

  const normalizedCity = city.replace(/-/g, " ");

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, company_name, full_name, logo_url, seller_type")
        .eq("seller_type", "imoveis")
        .ilike("city", `%${normalizedCity}%`);

      const sellerMap = new Map<string, { name: string; logo: string }>();
      (profiles || []).forEach((p: any) => {
        sellerMap.set(p.id, {
          name: p.company_name || p.full_name,
          logo: p.logo_url || "",
        });
      });

      const { data: rawItems } = await supabase
        .from("seller_items")
        .select("*")
        .ilike("city", `%${normalizedCity}%`)
        .eq("seller_type", "imoveis")
        .eq("status", "ativo")
        .order("created_at", { ascending: false });

      const mapped: CityItem[] = (rawItems || []).map((item: any) => {
        const seller = sellerMap.get(item.seller_id);
        const photos = item.photos?.length ? item.photos : [];
        return {
          id: item.id,
          sellerId: item.seller_id,
          sellerName: seller?.name || "",
          sellerLogo: seller?.logo || "",
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
        };
      });

      setItems(mapped);
      setLoading(false);
    };

    fetchData();
  }, [normalizedCity]);

  return { items, loading, cityName: normalizedCity };
}

export function useAvailableCities() {
  const [cities, setCities] = useState<string[]>([]);

  useEffect(() => {
    const fetchCities = async () => {
      const { data } = await supabase
        .from("seller_items")
        .select("city")
        .eq("status", "ativo")
        .eq("seller_type", "imoveis");

      const unique = new Set<string>();
      (data || []).forEach((item: any) => {
        if (item.city) unique.add(item.city.trim());
      });
      setCities(Array.from(unique).sort());
    };
    fetchCities();
  }, []);

  return cities;
}
