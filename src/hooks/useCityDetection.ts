import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

function slugifyCity(city: string): string {
  return city
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

async function detectByGPS(): Promise<string | null> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve(null);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          // Use free reverse geocoding API
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&accept-language=pt-BR`,
            { headers: { "User-Agent": "BrokersApp/1.0" } }
          );
          if (res.ok) {
            const data = await res.json();
            const city =
              data.address?.city ||
              data.address?.town ||
              data.address?.municipality ||
              data.address?.county;
            if (city) {
              resolve(slugifyCity(city));
              return;
            }
          }
          resolve(null);
        } catch {
          resolve(null);
        }
      },
      () => resolve(null), // user denied or error
      { enableHighAccuracy: false, timeout: 5000, maximumAge: 600000 }
    );
  });
}

async function detectByIP(): Promise<string | null> {
  try {
    const { data, error } = await supabase.functions.invoke("detect-city");
    if (!error && data?.city) return data.city;
  } catch {
    // silent
  }
  return null;
}

export function useCityDetection() {
  const [detectedCity, setDetectedCity] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check localStorage first
    const saved = localStorage.getItem("preferred_city");
    if (saved) {
      setDetectedCity(saved);
      setLoading(false);
      return;
    }

    const detect = async () => {
      // Try GPS first (real location)
      const gpsCity = await detectByGPS();
      if (gpsCity) {
        setDetectedCity(gpsCity);
        localStorage.setItem("preferred_city", gpsCity);
        setLoading(false);
        return;
      }

      // Fallback to IP detection
      const ipCity = await detectByIP();
      if (ipCity) {
        setDetectedCity(ipCity);
        localStorage.setItem("preferred_city", ipCity);
      }
      setLoading(false);
    };

    detect();
  }, []);

  const setCity = (city: string) => {
    localStorage.setItem("preferred_city", city);
    setDetectedCity(city);
  };

  return { detectedCity, loading, setCity };
}
