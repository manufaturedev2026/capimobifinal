import { useEffect, useMemo, useState } from "react";
import { MapPin, Eye, Loader2, Map as MapIcon, ExternalLink } from "lucide-react";

interface MapEmbedProps {
  address: string;
  cep?: string | null;
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
    streetViewUrl:
      "https://www.google.com/maps/@-19.5088816,-40.6175373,3a,75y,186.83h,88.2t/data=!3m7!1e1!3m5!1s5NiDxmnM20Kcyf36dHfb-Q!2e0!6shttps:%2F%2Fstreetviewpixels-pa.googleapis.com%2Fv1%2Fthumbnail%3Fcb_client%3Dmaps_sv.tactile%26w%3D900%26h%3D600%26pitch%3D1.804121935880616%26panoid%3D5NiDxmnM20Kcyf36dHfb-Q%26yaw%3D186.82990985274955!7i16384!8i8192",
  },
};

function getAddressOverride(address: string) {
  const normalizedAddress = normalizeText(address);
  return Object.entries(ADDRESS_OVERRIDES).find(([key]) => normalizedAddress.includes(key) || key.includes(normalizedAddress))?.[1];
}

export default function MapEmbed({ address, cep, className = "", showStreetView = true }: MapEmbedProps) {
  const encodedAddress = encodeURIComponent(address);
  const addressOverride = useMemo(() => getAddressOverride(address), [address]);
  const cleanCep = useMemo(() => (cep || "").replace(/\D/g, ""), [cep]);

  const fallbackMapsUrl = addressOverride
    ? addressOverride.mapsUrl || `https://www.google.com/maps/search/?api=1&query=${addressOverride.lat},${addressOverride.lon}`
    : `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;
  const fallbackStreetViewUrl = addressOverride?.streetViewUrl || buildStreetViewQueryUrl(address);
  const fallbackMapSrc = addressOverride
    ? addressOverride.embedUrl || `https://www.google.com/maps?q=${addressOverride.lat},${addressOverride.lon}&hl=pt-BR&z=17&output=embed`
    : `https://www.google.com/maps?q=${encodedAddress}&hl=pt-BR&z=16&output=embed`;

  const geocodingCandidates = useMemo(() => buildGeocodingCandidates(address), [address]);
  const [streetViewUrl, setStreetViewUrl] = useState(fallbackStreetViewUrl);
  const [mapSrc, setMapSrc] = useState(fallbackMapSrc);
  const [mapsUrl, setMapsUrl] = useState(fallbackMapsUrl);
  const [streetViewEmbed, setStreetViewEmbed] = useState<string | null>(null);
  const [resolvingStreetView, setResolvingStreetView] = useState(false);
  const [view, setView] = useState<"map" | "street">("map");

  useEffect(() => {
    setStreetViewUrl(fallbackStreetViewUrl);
    setMapSrc(fallbackMapSrc);
    setMapsUrl(fallbackMapsUrl);
    setStreetViewEmbed(null);
    setView("map");

    if (addressOverride) {
      setResolvingStreetView(false);
      return;
    }

    if (!showStreetView || (!address.trim() && cleanCep.length !== 8)) {
      setResolvingStreetView(false);
      return;
    }

    let cancelled = false;

    const applyCoords = (lat: string, lon: string, label?: string) => {
      if (cancelled) return;
      // Prefer query-based pano (Google finds nearest panorama); fallback to viewpoint coords
      const panoUrl = label
        ? `https://www.google.com/maps/@?api=1&map_action=pano&query=${encodeURIComponent(label)}`
        : `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${lat},${lon}&heading=0&pitch=0&fov=90`;
      setStreetViewUrl(panoUrl);
      // Embeddable Street View iframe (no API key required via /maps?layer=c)
      setStreetViewEmbed(`https://www.google.com/maps?layer=c&cbll=${lat},${lon}&cbp=11,0,0,0,0&output=embed`);
      setMapSrc(`https://www.google.com/maps?q=${lat},${lon}&hl=pt-BR&z=18&output=embed`);
      setMapsUrl(`https://www.google.com/maps/search/?api=1&query=${lat},${lon}`);
    };

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

    const getCity = (result: NominatimResult) =>
      normalizeText(
        result.address?.city || result.address?.town || result.address?.village || result.address?.municipality || "",
      );
    const getStreet = (result: NominatimResult) =>
      normalizeStreet(result.address?.road || result.address?.pedestrian || result.address?.residential || result.display_name || "");
    const getNumber = (result: NominatimResult) => normalizeText(result.address?.house_number || "");

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

    const fetchNominatim = async (url: string) => {
      try {
        const response = await fetch(url, { headers: { Accept: "application/json", "Accept-Language": "pt-BR" } });
        if (!response.ok) return null;
        return (await response.json()) as NominatimResult[];
      } catch {
        return null;
      }
    };

    const resolve = async () => {
      setResolvingStreetView(true);

      // Strategy 1: CEP via ViaCEP -> structured Nominatim with house number
      if (cleanCep.length === 8) {
        try {
          const viaCepRes = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
          if (viaCepRes.ok) {
            const viaCep = await viaCepRes.json();
            if (!viaCep.erro && viaCep.logradouro) {
              const street = viaCep.logradouro as string;
              const city = viaCep.localidade as string;
              const stateUf = viaCep.uf as string;
              const stateName = BR_STATE_NAMES[stateUf?.toUpperCase()] || stateUf;
              const streetWithNum = numberPart ? `${numberPart} ${street}` : street;
              const params = new URLSearchParams({
                format: "jsonv2",
                addressdetails: "1",
                limit: "5",
                countrycodes: "br",
                street: streetWithNum,
                city,
                state: stateName,
                country: "Brasil",
              });
              const results = await fetchNominatim(`https://nominatim.openstreetmap.org/search?${params.toString()}`);
              const match = results?.find((r) => !numberPart || r.address?.house_number === numberPart) || results?.[0];
              if (match?.lat && match?.lon) {
                const label = [numberPart ? `${street}, ${numberPart}` : street, viaCep.bairro, city, stateUf].filter(Boolean).join(", ");
                applyCoords(match.lat, match.lon, label);
                if (!cancelled) setResolvingStreetView(false);
                return;
              }
            }
          }
        } catch {
          /* fall through */
        }
      }

      // Strategy 2: structured search by parsed address
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

      for (const url of urls) {
        const results = await fetchNominatim(url);
        const match = results?.find(matchesLocation);
        if (match?.lat && match?.lon) {
          applyCoords(match.lat, match.lon);
          break;
        }
      }

      if (!cancelled) setResolvingStreetView(false);
    };

    void resolve();

    return () => {
      cancelled = true;
    };
  }, [address, cleanCep, addressOverride, fallbackStreetViewUrl, fallbackMapSrc, fallbackMapsUrl, geocodingCandidates, showStreetView]);

  const handleOpenStreetView = () => {
    window.open(streetViewUrl, "_blank", "noopener,noreferrer");
  };

  const streetEmbedSrc = streetViewEmbed || addressOverride?.embedUrl || null;

  return (
    <div className={`rounded-2xl overflow-hidden border border-border ${className}`}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-border">
        {/* Mapa */}
        <div className="relative aspect-[16/9] bg-muted">
          <iframe
            src={mapSrc}
            className="w-full h-full border-0"
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title={`Mapa - ${address}`}
          />
          <span className="absolute top-3 left-3 z-10 flex items-center gap-1.5 rounded-full bg-background/90 backdrop-blur px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-foreground shadow-md border border-border">
            <MapIcon size={11} className="text-primary" /> Mapa
          </span>
        </div>

        {/* Street View 360° */}
        {showStreetView && (
          <div className="relative aspect-[16/9] bg-muted">
            {streetEmbedSrc ? (
              <iframe
                src={streetEmbedSrc}
                className="w-full h-full border-0"
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title={`Street View - ${address}`}
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-muted-foreground text-xs">
                {resolvingStreetView ? (
                  <>
                    <Loader2 size={20} className="animate-spin text-primary" />
                    <span>Carregando Street View...</span>
                  </>
                ) : (
                  <>
                    <Eye size={20} className="text-primary" />
                    <span>Street View indisponível</span>
                  </>
                )}
              </div>
            )}
            <span className="absolute top-3 left-3 z-10 flex items-center gap-1.5 rounded-full bg-background/90 backdrop-blur px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-foreground shadow-md border border-border">
              <Eye size={11} className="text-primary" /> Street View 360°
            </span>
            <button
              type="button"
              onClick={handleOpenStreetView}
              aria-busy={resolvingStreetView}
              className="absolute bottom-3 right-3 z-10 flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-[11px] font-semibold text-primary-foreground shadow-lg transition-transform hover:scale-105"
            >
              <ExternalLink size={12} />
              Abrir
            </button>
          </div>
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
