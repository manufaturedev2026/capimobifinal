import { useEffect, useMemo, useState } from "react";
import { MapPin, Eye, Loader2 } from "lucide-react";

interface MapEmbedProps {
  address: string;
  className?: string;
  showStreetView?: boolean;
}

interface NominatimResult {
  lat: string;
  lon: string;
}

function normalizeAddressForGeocoding(address: string) {
  return address
    .replace(/\bAv\.?\b/gi, "Avenida")
    .replace(/\bR\.?\b/gi, "Rua")
    .replace(/\bRod\.?\b/gi, "Rodovia")
    .replace(/\bES\b/gi, "Espírito Santo")
    .replace(/\s+/g, " ")
    .trim();
}

function buildGeocodingCandidates(address: string) {
  const normalized = normalizeAddressForGeocoding(address);
  const parts = normalized
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);

  const [street, number, neighborhood, city, state] = parts;
  const withCountry = (value: string) => (value.toLowerCase().includes("brasil") ? value : `${value}, Brasil`);

  return Array.from(
    new Set(
      [
        normalized,
        withCountry(normalized),
        [street, number, neighborhood, city, state].filter(Boolean).join(", "),
        withCountry([street, number, neighborhood, city, state].filter(Boolean).join(", ")),
        [street, number, city, state].filter(Boolean).join(", "),
        withCountry([street, number, city, state].filter(Boolean).join(", ")),
        [street, city, state].filter(Boolean).join(", "),
        withCountry([street, city, state].filter(Boolean).join(", ")),
        [neighborhood, city, state].filter(Boolean).join(", "),
        withCountry([neighborhood, city, state].filter(Boolean).join(", ")),
      ].filter(Boolean),
    ),
  );
}

export default function MapEmbed({ address, className = "", showStreetView = true }: MapEmbedProps) {
  const encodedAddress = encodeURIComponent(address);
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;
  const fallbackStreetViewUrl = `https://www.google.com/maps/@?api=1&map_action=pano&query=${encodedAddress}`;
  const fallbackMapSrc = `https://www.google.com/maps?q=${encodedAddress}&hl=pt-BR&z=16&output=embed`;

  const geocodingCandidates = useMemo(() => buildGeocodingCandidates(address), [address]);
  const [streetViewUrl, setStreetViewUrl] = useState(fallbackStreetViewUrl);
  const [mapSrc, setMapSrc] = useState(fallbackMapSrc);
  const [resolvingStreetView, setResolvingStreetView] = useState(showStreetView);

  useEffect(() => {
    setStreetViewUrl(fallbackStreetViewUrl);
    setMapSrc(fallbackMapSrc);
    if (!address.trim()) {
      setResolvingStreetView(false);
      return;
    }

    let cancelled = false;

    const resolveStreetView = async () => {
      setResolvingStreetView(true);

      for (const candidate of geocodingCandidates) {
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&countrycodes=br&q=${encodeURIComponent(candidate)}`,
            {
              headers: {
                Accept: "application/json",
                "Accept-Language": "pt-BR",
              },
            },
          );

          if (!response.ok) continue;

          const results = (await response.json()) as NominatimResult[];
          const first = results?.[0];

          if (first?.lat && first?.lon) {
            const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
            const forcedStreetViewUrl = isMobile
              ? `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${first.lat},${first.lon}&heading=0&pitch=0&fov=90`
              : `https://www.google.com/maps?layer=c&cbll=${first.lat},${first.lon}&cbp=12,0,0,0,0&ie=UTF8&oe=UTF8&hl=pt-BR&z=17&data=!3m1!1e3`;
            if (!cancelled) setStreetViewUrl(forcedStreetViewUrl);
            break;
          }
        } catch {
          continue;
        }
      }

      if (!cancelled) setResolvingStreetView(false);
    };

    void resolveStreetView();

    return () => {
      cancelled = true;
    };
  }, [address, fallbackStreetViewUrl, geocodingCandidates, showStreetView]);

  const handleOpenStreetView = () => {
    window.open(streetViewUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <div className={`rounded-2xl overflow-hidden border border-border ${className}`}>
      <div className="relative aspect-[16/9] bg-muted">
        <iframe
          src={mapSrc}
          className="w-full h-full border-0"
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          title={`Mapa - ${address}`}
        />
        {showStreetView && (
          <button
            type="button"
            onClick={handleOpenStreetView}
            disabled={resolvingStreetView}
            className="absolute bottom-3 right-3 flex items-center gap-2 px-3.5 py-2 bg-primary text-primary-foreground text-xs font-semibold rounded-full shadow-lg hover:scale-105 transition-transform disabled:opacity-80 disabled:hover:scale-100"
          >
            {resolvingStreetView ? <Loader2 size={14} className="animate-spin" /> : <Eye size={14} />}
            {resolvingStreetView ? "Localizando rua..." : "Ver Street View 360°"}
          </button>
        )}
      </div>
      <a
        href={mapsUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 px-4 py-3 bg-card text-sm text-muted-foreground hover:text-primary transition-colors"
      >
        <MapPin size={14} className="text-primary flex-shrink-0" />
        <span className="line-clamp-1">{address}</span>
      </a>
    </div>
  );
}
