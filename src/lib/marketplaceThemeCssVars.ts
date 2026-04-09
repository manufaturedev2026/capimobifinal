import type { CSSProperties } from "react";
import type { MarketplaceTheme } from "@/lib/marketplaceThemes";

function rgbToHslTriplet(r: number, g: number, b: number) {
  const red = r / 255;
  const green = g / 255;
  const blue = b / 255;

  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  const delta = max - min;

  let h = 0;
  const l = (max + min) / 2;
  const s = delta === 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));

  if (delta !== 0) {
    switch (max) {
      case red:
        h = ((green - blue) / delta) % 6;
        break;
      case green:
        h = (blue - red) / delta + 2;
        break;
      default:
        h = (red - green) / delta + 4;
        break;
    }
  }

  const hue = Math.round(h * 60 < 0 ? h * 60 + 360 : h * 60);
  const saturation = Math.round(s * 1000) / 10;
  const lightness = Math.round(l * 1000) / 10;

  return `${hue} ${saturation}% ${lightness}%`;
}

function hexToHslTriplet(hex: string) {
  const normalized = hex.replace("#", "").trim();
  const expanded = normalized.length === 3
    ? normalized.split("").map((char) => char + char).join("")
    : normalized;

  if (!/^[0-9a-fA-F]{6}$/.test(expanded)) return null;

  const r = Number.parseInt(expanded.slice(0, 2), 16);
  const g = Number.parseInt(expanded.slice(2, 4), 16);
  const b = Number.parseInt(expanded.slice(4, 6), 16);

  return rgbToHslTriplet(r, g, b);
}

function parseHslTriplet(color: string) {
  const match = color.match(/hsla?\(\s*([\d.]+)\s*,\s*([\d.]+)%\s*,\s*([\d.]+)%/i);
  if (!match) return null;

  const [, h, s, l] = match;
  return `${Number(h)} ${Number(s)}% ${Number(l)}%`;
}

function colorToHslTriplet(color: string | undefined, fallback: string) {
  if (!color) return fallback;
  return parseHslTriplet(color) || hexToHslTriplet(color) || fallback;
}

export function getMarketplaceThemeCssVars(theme: MarketplaceTheme): CSSProperties {
  const background = colorToHslTriplet(theme.darkBase, "220 40% 8%");
  const foreground = colorToHslTriplet(theme.text, "0 0% 100%");
  const card = colorToHslTriplet(theme.cardBg, background);
  const secondary = colorToHslTriplet(theme.darkMid, card);
  const border = colorToHslTriplet(theme.border, secondary);
  const primary = colorToHslTriplet(theme.primary, "197 100% 47%");
  const accent = colorToHslTriplet(theme.promoAccent || theme.promoExploreColor || theme.primary, primary);
  const highlight = colorToHslTriplet(theme.promoExtra || theme.promoExploreColor || theme.promoAccent || theme.primary, accent);
  const mutedForeground = colorToHslTriplet(theme.textMuted, foreground);

  return buildCssVars({ background, foreground, card, secondary, border, primary, accent, highlight, mutedForeground });
}

/** Convert a StoreTheme (from StoreThemePicker) into CSS variable overrides */
export function getStoreThemeCssVars(theme: { bg: string; card: string; text: string; textMuted: string; primary: string; accent: string; border: string }): CSSProperties {
  const background = colorToHslTriplet(theme.bg, "220 40% 8%");
  const foreground = colorToHslTriplet(theme.text, "0 0% 100%");
  const card = colorToHslTriplet(theme.card, background);
  const border = colorToHslTriplet(theme.border, card);
  const primary = colorToHslTriplet(theme.primary, "197 100% 47%");
  const accent = colorToHslTriplet(theme.accent || theme.primary, primary);
  const mutedForeground = colorToHslTriplet(theme.textMuted, foreground);

  return buildCssVars({ background, foreground, card, secondary: card, border, primary, accent, highlight: accent, mutedForeground });
}

function buildCssVars(v: { background: string; foreground: string; card: string; secondary: string; border: string; primary: string; accent: string; highlight: string; mutedForeground: string }): CSSProperties {
  return {
    "--background": v.background,
    "--foreground": v.foreground,
    "--card": v.card,
    "--card-foreground": v.foreground,
    "--popover": v.card,
    "--popover-foreground": v.foreground,
    "--primary": v.primary,
    "--primary-foreground": "0 0% 100%",
    "--secondary": v.secondary,
    "--secondary-foreground": v.foreground,
    "--muted": v.secondary,
    "--muted-foreground": v.mutedForeground,
    "--accent": v.accent,
    "--accent-foreground": "0 0% 100%",
    "--destructive": "0 84% 60%",
    "--destructive-foreground": "0 0% 98%",
    "--border": v.border,
    "--input": v.border,
    "--ring": v.primary,
    "--sidebar-background": v.background,
    "--sidebar-foreground": v.foreground,
    "--sidebar-primary": v.primary,
    "--sidebar-primary-foreground": "0 0% 100%",
    "--sidebar-accent": v.secondary,
    "--sidebar-accent-foreground": v.foreground,
    "--sidebar-border": v.border,
    "--sidebar-ring": v.primary,
    "--highlight": v.highlight,
  } as CSSProperties;
}