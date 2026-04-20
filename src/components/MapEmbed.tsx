import { useState } from "react";
import { MapPin, Eye, Map as MapIcon } from "lucide-react";

interface MapEmbedProps {
  address: string;
  className?: string;
}

type ViewMode = "map" | "street";

export default function MapEmbed({ address, className = "" }: MapEmbedProps) {
  const [mode, setMode] = useState<ViewMode>("map");
  const encodedAddress = encodeURIComponent(address);
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;
  const streetViewExternalUrl = `https://www.google.com/maps/@?api=1&map_action=pano&query=${encodedAddress}`;

  const mapSrc = `https://maps.google.com/maps?q=${encodedAddress}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
  // Street View embed (free, no API key). Uses search query as location.
  const streetSrc = `https://maps.google.com/maps?q=${encodedAddress}&t=k&z=18&ie=UTF8&iwloc=&output=svembed&layer=c&cbll=&cbp=`;

  return (
    <div className={`rounded-2xl overflow-hidden border border-border ${className}`}>
      {/* Toggle */}
      <div className="flex items-center gap-1 p-1.5 bg-card border-b border-border">
        <button
          type="button"
          onClick={() => setMode("map")}
          className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
            mode === "map"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-muted"
          }`}
        >
          <MapIcon size={14} />
          Mapa
        </button>
        <button
          type="button"
          onClick={() => setMode("street")}
          className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
            mode === "street"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-muted"
          }`}
        >
          <Eye size={14} />
          Street View
        </button>
      </div>

      <div className="relative aspect-[16/9] bg-muted">
        <iframe
          key={mode}
          src={mode === "map" ? mapSrc : streetSrc}
          className="w-full h-full border-0"
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          title={mode === "map" ? `Mapa - ${address}` : `Street View - ${address}`}
        />
      </div>

      <a
        href={mode === "map" ? mapsUrl : streetViewExternalUrl}
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
