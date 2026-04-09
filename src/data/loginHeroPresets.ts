import preset01 from "@/assets/login-presets/preset-01.jpg";
import preset02 from "@/assets/login-presets/preset-02.jpg";
import preset03 from "@/assets/login-presets/preset-03.jpg";
import preset04 from "@/assets/login-presets/preset-04.jpg";
import preset05 from "@/assets/login-presets/preset-05.jpg";
import preset06 from "@/assets/login-presets/preset-06.jpg";
import preset07 from "@/assets/login-presets/preset-07.jpg";
import preset08 from "@/assets/login-presets/preset-08.jpg";
import preset09 from "@/assets/login-presets/preset-09.jpg";
import preset10 from "@/assets/login-presets/preset-10.jpg";

export interface LoginHeroPreset {
  id: string;
  label: string;
  src: string;
}

export const LOGIN_HERO_PRESETS: LoginHeroPreset[] = [
  { id: "preset-01", label: "Edifício Sunset", src: preset01 },
  { id: "preset-02", label: "Cidade Litorânea", src: preset02 },
  { id: "preset-03", label: "Sala Elegante", src: preset03 },
  { id: "preset-04", label: "Cidade Noturna", src: preset04 },
  { id: "preset-05", label: "Piscina Resort", src: preset05 },
  { id: "preset-06", label: "Casa com Jardim", src: preset06 },
  { id: "preset-07", label: "Penthouse Vista", src: preset07 },
  { id: "preset-08", label: "Chalé Montanha", src: preset08 },
  { id: "preset-09", label: "Comercial Moderno", src: preset09 },
  { id: "preset-10", label: "Praia Tropical", src: preset10 },
];

export function getLoginHeroPreset(value?: string | null): LoginHeroPreset | undefined {
  if (!value) return undefined;

  const normalizedValue = value.trim();
  const byId = LOGIN_HERO_PRESETS.find((preset) => preset.id === normalizedValue);
  if (byId) return byId;

  const presetIdMatch = normalizedValue.match(/preset-\d+/i)?.[0]?.toLowerCase();
  if (!presetIdMatch) return undefined;

  return LOGIN_HERO_PRESETS.find((preset) => preset.id === presetIdMatch);
}

export function normalizeLoginHeroSetting(value?: string | null): string {
  const preset = getLoginHeroPreset(value);
  return preset?.id || value?.trim() || "";
}

export function resolveLoginHeroImage(value?: string | null): string | null {
  const preset = getLoginHeroPreset(value);
  return preset?.src || value?.trim() || null;
}
