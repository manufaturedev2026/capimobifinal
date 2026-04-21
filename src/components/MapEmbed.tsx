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
  display_name?: string;
  address?: {
    road?: string;
    pedestrian?: string;
    residential?: string;
    house_number?: string;
    suburb?: string;
    neighbourhood?: string;
    city?: string;
    town?: string;
    village?: string;
    municipality?: string;
    state?: string;
    state_code?: string;
  };
}

interface AddressOverride {
  lat: string;
  lon: string;
  streetViewUrl: string;
  mapsUrl?: string;
  embedUrl?: string;
}

const BR_STATE_NAMES: Record<string, string> = {
  AC: "Acre",
  AL: "Alagoas",
  AP: "Amapá",
  AM: "Amazonas",
  BA: "Bahia",
  CE: "Ceará",
  DF: "Distrito Federal",
  ES: "Espírito Santo",
  GO: "Goiás",
  MA: "Maranhão",
  MT: "Mato Grosso",
  MS: "Mato Grosso do Sul",
  MG: "Minas Gerais",
  PA: "Pará",
  PB: "Paraíba",
  PR: "Paraná",
  PE: "Pernambuco",
  PI: "Piauí",
  RJ: "Rio de Janeiro",
  RN: "Rio Grande do Norte",
  RS: "Rio Grande do Sul",
  RO: "Rondônia",
  RR: "Roraima",
  SC: "Santa Catarina",
  SP: "São Paulo",
  SE: "Sergipe",
  TO: "Tocantins",
};

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeStreet(value: string) {
  return normalizeText(value)
    .replace(/\b(avenida|av|rua|rodovia|rod|travessa|tv|alameda|estrada)\b/g, "")
    .replace(/\s+/g, " ")
    .trim();
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
      ].filter(Boolean),
    ),
  );
}

function buildStreetViewQueryUrl(query: string) {
  return `https://www.google.com/maps/@?api=1&map_action=pano&query=${encodeURIComponent(query)}`;
}

const ADDRESS_OVERRIDES: Record<string, AddressOverride> = {
  [normalizeText("Av. Beira Rio, 120, Centro, Colatina, ES")]: {
    lat: "-19.5350114",
    lon: "-40.6336901",
    mapsUrl:
      "https://www.google.com/maps/place/Av.+Beira+Rio,+120+-+Centro,+Colatina+-+ES,+29700-193/@-19.5350063,-40.636265,17z/data=!3m1!4b1!4m5!3m4!1s0xb7a8280e021691:0x5ba443623bb754bd!8m2!3d-19.5350114!4d-40.6336901",
    embedUrl:
      "https://www.google.com/maps?q=Av.+Beira+Rio,+120+-+Centro,+Colatina+-+ES,+29700-193&hl=pt-BR&z=17&output=embed",
    streetViewUrl:
      "https://www.google.com/maps/@-19.5349498,-40.6336249,3a,75y,252.33h,90t/data=!3m7!1e1!3m5!1s5Ul2zyyrn98mD-foBY4ABg!2e0!6shttps:%2F%2Fstreetviewpixels-pa.googleapis.com%2Fv1%2Fthumbnail%3Fcb_client%3Dmaps_sv.tactile%26w%3D900%26h%3D600%26pitch%3D0%26panoid%3D5Ul2zyyrn98mD-foBY4ABg%26yaw%3D252.32602!7i16384!8i8192",
  },
  [normalizeText("Rua Giacomo Martinelli, 343, Colatina, ES")]: {
    lat: "-19.5095977",
    lon: "-40.6172574",
    mapsUrl: "https://www.google.com/maps/search/?api=1&query=Rua+Giacomo+Martinelli,+343,+Maria+das+Gracas,+Colatina,+ES",
    embedUrl: "https://www.google.com/maps?q=Rua+Giacomo+Martinelli,+343,+Maria+das+Gracas,+Colatina,+ES&hl=pt-BR&z=18&output=embed",
    streetViewUrl: "https://www.google.com/maps?q=&layer=c&cbll=-19.5095977,-40.6172574&cbp=11,0,0,0,0",
  },
};

function getAddressOverride(address: string) {
  const normalizedAddress = normalizeText(address);
  return Object.entries(ADDRESS_OVERRIDES).find(([key]) => normalizedAddress.includes(key) || key.includes(normalizedAddress))?.[1];
}

export default function MapEmbed({ address, className = "", showStreetView = true }: MapEmbedProps) {
  const encodedAddress = encodeURIComponent(address);
  const addressOverride = useMemo(() => getAddressOverride(address), [address]);

  const mapsUrl = addressOverride
    ? addressOverride.mapsUrl || `https://www.google.com/maps/search/?api=1&query=${addressOverride.lat},${addressOverride.lon}`
    : `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;
  const fallbackStreetViewUrl = addressOverride?.streetViewUrl || buildStreetViewQueryUrl(address);
  const mapSrc = addressOverride
    ? addressOverride.embedUrl || `https://www.google.com/maps?q=${addressOverride.lat},${addressOverride.lon}&hl=pt-BR&z=17&output=embed`
    : `https://www.google.com/maps?q=${encodedAddress}&hl=pt-BR&z=16&output=embed`;

  const geocodingCandidates = useMemo(() => buildGeocodingCandidates(address), [address]);
  const [streetViewUrl, setStreetViewUrl] = useState(fallbackStreetViewUrl);
  const [resolvingStreetView, setResolvingStreetView] = useState(false);

  useEffect(() => {
    setStreetViewUrl(fallbackStreetViewUrl);

    if (addressOverride) {
      setResolvingStreetView(false);
      return;
    }

    if (!showStreetView || !address.trim()) {
      setResolvingStreetView(false);
      return;
    }

    let cancelled = false;

    const parts = normalizeAddressForGeocoding(address)
      .split(",")
      .map((part) => part.trim())
      .filter(Boolean);

    const [streetName, numberPart, , cityPart, statePart] = parts;
    const stateFull = statePart ? BR_STATE_NAMES[statePart.toUpperCase()] || statePart : "";
    const expectedStreet = normalizeStreet(streetName || "");
    const expectedNumber = normalizeText(numberPart || "");
    const expectedCity = normalizeText(cityPart || "");
    const expectedState = normalizeText(stateFull || statePart || "");

    const structuredUrl = (() => {
      const params = new URLSearchParams({
        format: "jsonv2",
        addressdetails: "1",
        limit: "5",
        countrycodes: "br",
      });
      if (streetName) params.set("street", numberPart ? `${numberPart} ${streetName}` : streetName);
      if (cityPart) params.set("city", cityPart);
      if (stateFull) params.set("state", stateFull);
      params.set("country", "Brasil");
      return `https://nominatim.openstreetmap.org/search?${params.toString()}`;
    })();

    const urls = [
      structuredUrl,
      ...geocodingCandidates.map(
        (candidate) =>
          `https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&limit=5&countrycodes=br&q=${encodeURIComponent(candidate)}`,
      ),
    ];

    const getCity = (result: NominatimResult) =>
      normalizeText(
        result.address?.city ||
          result.address?.town ||
          result.address?.village ||
          result.address?.municipality ||
          "",
      );

    const getStreet = (result: NominatimResult) =>
      normalizeStreet(
        result.address?.road ||
          result.address?.pedestrian ||
          result.address?.residential ||
          result.display_name ||
          "",
      );

    const getNumber = (result: NominatimResult) => normalizeText(result.address?.house_number || result.display_name || "");

    const matchesLocation = (result: NominatimResult) => {
      const resultCity = getCity(result);
      const resultState = normalizeText(result.address?.state || "");
      const resultStreet = getStreet(result);
      const resultNumber = getNumber(result);

      const cityOk = !expectedCity || resultCity.includes(expectedCity) || expectedCity.includes(resultCity);
      const stateOk = !expectedState || resultState.includes(expectedState) || expectedState.includes(resultState);
      const streetOk = !expectedStreet || resultStreet.includes(expectedStreet) || expectedStreet.includes(resultStreet);
      const numberOk = !expectedNumber || !result.address?.house_number || resultNumber.includes(expectedNumber);

      return cityOk && stateOk && streetOk && numberOk;
    };

    const resolveStreetView = async () => {
      setResolvingStreetView(true);

      for (const url of urls) {
        try {
          const response = await fetch(url, {
            headers: {
              Accept: "application/json",
              "Accept-Language": "pt-BR",
            },
          });

          if (!response.ok) continue;

          const results = (await response.json()) as NominatimResult[];
          const match = results.find(matchesLocation);

          if (match?.lat && match?.lon) {
            if (!cancelled) {
              setStreetViewUrl(`https://www.google.com/maps/@${match.lat},${match.lon},3a,75y,0h,90t/data=!3m1!1e1`);
            }
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
  }, [address, addressOverride, fallbackStreetViewUrl, geocodingCandidates, showStreetView]);

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
            aria-busy={resolvingStreetView}
            className="absolute bottom-3 right-3 z-10 flex items-center gap-2 rounded-full bg-primary px-3.5 py-2 text-xs font-semibold text-primary-foreground shadow-lg transition-transform hover:scale-105"
          >
            {resolvingStreetView ? <Loader2 size={14} className="animate-spin" /> : <Eye size={14} />}
            Ver Street View 360°
          </button>
        )}
      </div>
      <a
        href={mapsUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 bg-card px-4 py-3 text-sm text-muted-foreground transition-colors hover:text-primary"
      >
        <MapPin size={14} className="shrink-0 text-primary" />
        <span className="line-clamp-1">{address}</span>
      </a>
    </div>
  );
}
