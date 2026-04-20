import { useState } from "react";
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

export default function MapEmbed({ address, className = "", showStreetView = true }: MapEmbedProps) {
  const [openingStreetView, setOpeningStreetView] = useState(false);
  const encodedAddress = encodeURIComponent(address);
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;
  const fallbackStreetViewUrl = `https://www.google.com/maps/@?api=1&map_action=pano&query=${encodedAddress}`;
  const mapSrc = `https://www.google.com/maps?q=${encodedAddress}&hl=pt-BR&z=16&output=embed`;

  const handleOpenStreetView = async () => {
    if (openingStreetView) return;

    const popup = window.open("", "_blank", "noopener,noreferrer");
    if (!popup) return;

    popup.document.title = "Abrindo Street View...";
    popup.document.body.style.margin = "0";
    popup.document.body.style.fontFamily = "system-ui, sans-serif";
    popup.document.body.style.display = "grid";
    popup.document.body.style.placeItems = "center";
    popup.document.body.style.minHeight = "100vh";
    popup.document.body.style.background = "#111827";
    popup.document.body.style.color = "#f9fafb";
    popup.document.body.innerHTML = '<div style="padding:24px;text-align:center;font-size:14px;">Abrindo Street View…</div>';

    setOpeningStreetView(true);

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodedAddress}`,
        {
          headers: {
            "Accept": "application/json",
            "Accept-Language": "pt-BR",
          },
        },
      );

      if (!response.ok) {
        popup.location.href = fallbackStreetViewUrl;
        return;
      }

      const results = (await response.json()) as NominatimResult[];
      const firstResult = results?.[0];

      if (!firstResult?.lat || !firstResult?.lon) {
        popup.location.href = fallbackStreetViewUrl;
        return;
      }

      const streetViewUrl = `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${firstResult.lat},${firstResult.lon}`;
      popup.location.href = streetViewUrl;
    } catch {
      popup.location.href = fallbackStreetViewUrl;
    } finally {
      setOpeningStreetView(false);
    }
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
            disabled={openingStreetView}
            className="absolute bottom-3 right-3 flex items-center gap-2 px-3.5 py-2 bg-primary text-primary-foreground text-xs font-semibold rounded-full shadow-lg hover:scale-105 transition-transform disabled:opacity-80 disabled:hover:scale-100"
          >
            {openingStreetView ? <Loader2 size={14} className="animate-spin" /> : <Eye size={14} />}
            {openingStreetView ? "Abrindo..." : "Ver Street View 360°"}
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
