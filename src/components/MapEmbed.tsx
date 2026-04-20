import { MapPin, Eye } from "lucide-react";

interface MapEmbedProps {
  address: string;
  className?: string;
  showStreetView?: boolean;
}

export default function MapEmbed({ address, className = "", showStreetView = true }: MapEmbedProps) {
  const encodedAddress = encodeURIComponent(address);
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;
  const streetViewUrl = `https://www.google.com/maps/@?api=1&map_action=pano&query=${encodedAddress}`;
  const mapSrc = `https://maps.google.com/maps?q=${encodedAddress}&t=&z=15&ie=UTF8&iwloc=&output=embed`;

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
          <a
            href={streetViewUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute bottom-3 right-3 flex items-center gap-2 px-3.5 py-2 bg-primary text-primary-foreground text-xs font-semibold rounded-full shadow-lg hover:scale-105 transition-transform"
          >
            <Eye size={14} />
            Ver Street View 360°
          </a>
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
