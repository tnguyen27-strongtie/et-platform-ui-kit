/**
 * Pure color math behind the theme: shade derivation for light and dark color schemes and the
 * role-color resolution order. No imports (React, MUI or tokens), so it runs in Node as is: the unit
 * tests import it directly and the platform-ui-theme skill's script loads it from dist/.
 *
 * lighten/darken/alpha return the same strings as MUI's helpers of the same name
 * (`rgb(r, g, b)` with truncated channels), so derived shades did not change when the kit moved off MUI's.
 */

type Rgb = [number, number, number];

/** [r, g, b] and alpha from #rgb(a), #rrggbb(aa), rgb()/rgba() (comma or space syntax). null otherwise. */
export function parseColor(color: string): { rgb: Rgb; alpha: number } | null {
  const c = color.trim();
  const hex = /^#([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i.exec(c);
  if (hex) {
    let h = hex[1]!;
    if (h.length <= 4) h = [...h].map((x) => x + x).join('');
    const rgb = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)) as Rgb;
    return { rgb, alpha: h.length === 8 ? parseInt(h.slice(6, 8), 16) / 255 : 1 };
  }
  const fn = /^rgba?\(\s*([\d.]+)\s*[,\s]\s*([\d.]+)\s*[,\s]\s*([\d.]+)\s*(?:[,/]\s*([\d.]+)(%?)\s*)?\)$/i.exec(c);
  if (fn) {
    const a = fn[4] === undefined ? 1 : Number(fn[4]) / (fn[5] ? 100 : 1);
    return { rgb: [Number(fn[1]), Number(fn[2]), Number(fn[3])], alpha: a };
  }
  return null;
}

const rgbString = ([r, g, b]: Rgb) => `rgb(${Math.trunc(r)}, ${Math.trunc(g)}, ${Math.trunc(b)})`;

/** Moves each channel toward white by `amount` (0–1). Unparseable input is returned unchanged. */
export function lighten(color: string, amount: number): string {
  const p = parseColor(color);
  return p ? rgbString(p.rgb.map((v) => v + (255 - v) * amount) as Rgb) : color;
}

/** Moves each channel toward black by `amount` (0–1). */
export function darken(color: string, amount: number): string {
  const p = parseColor(color);
  return p ? rgbString(p.rgb.map((v) => v * (1 - amount)) as Rgb) : color;
}

/** The color with the given opacity, as rgba(). */
export function alpha(color: string, value: number): string {
  const p = parseColor(color);
  return p ? `rgba(${p.rgb.map(Math.trunc).join(', ')}, ${value})` : color;
}

/** `color` laid over `base` at `weight` (0–1): an opaque blend, e.g. a brand tint on a dark surface. */
export function mix(color: string, base: string, weight: number): string {
  const a = parseColor(color);
  const b = parseColor(base);
  if (!a || !b) return color;
  return rgbString(a.rgb.map((v, i) => b.rgb[i]! * (1 - weight) + v * weight) as Rgb);
}

function luminance([r, g, b]: Rgb) {
  const lin = (v: number) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

/** WCAG contrast ratio (1–21), unrounded; null if a color cannot be parsed. */
export function contrast(foreground: string, background: string): number | null {
  const a = parseColor(foreground);
  const b = parseColor(background);
  if (!a || !b) return null;
  const [hi, lo] = [luminance(a.rgb), luminance(b.rgb)].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
}

/** The candidate with the highest contrast on `background` (text on a filled button, a badge…). */
export function readableOn(background: string, candidates: readonly string[] = ['#ffffff', '#1d1d1d']): string {
  let best = candidates[0]!;
  let bestRatio = -1;
  for (const c of candidates) {
    const r = contrast(c, background) ?? 0;
    if (r > bestRatio) [best, bestRatio] = [c, r];
  }
  return best;
}

/**
 * A light-scheme brand made readable on a dark surface: lightened in small steps until it reaches
 * `min` contrast (4.5:1 by default: the brand colors selected tabs, links in menus, checked controls).
 */
export function adaptBrandForDark(brand: string, surface: string, min = 4.5): string {
  if (!parseColor(brand)) return brand;
  for (let amount = 0; amount <= 0.8; amount += 0.05) {
    const candidate = amount === 0 ? brand : lighten(brand, amount);
    if ((contrast(candidate, surface) ?? 0) >= min) return candidate;
  }
  return lighten(brand, 0.8);
}

export type Scheme = 'light' | 'dark';
type Colors = Record<string, string>;

/**
 * Shades derived from a brand color. Light: lightened tints for subtle backgrounds (the kit's
 * original formulas). Dark: tints mixed into the dark surface, a lighter "dark" shade (it is used as
 * text), and the more readable of white or near-black for `textOnBrand`.
 */
export function brandShades(brand: string | undefined, scheme: Scheme = 'light', surface = '#1e1e1e'): Colors {
  if (!brand || !parseColor(brand)) return {};
  if (scheme === 'light') {
    return {
      brandHover: lighten(brand, 0.15),
      brandActive: darken(brand, 0.25),
      brandDark: darken(brand, 0.4),
      brandSubtle: lighten(brand, 0.93),
      brandSelected: lighten(brand, 0.8),
      focusRing: lighten(brand, 0.5),
      accent: brand,
      selection: brand,
      scrollbarThumb: alpha(brand, 0.5),
    };
  }
  return {
    brandHover: lighten(brand, 0.12),
    brandActive: darken(brand, 0.15),
    brandDark: lighten(brand, 0.35),
    brandSubtle: mix(brand, surface, 0.14),
    brandSelected: mix(brand, surface, 0.28),
    focusRing: mix(brand, surface, 0.7),
    accent: brand,
    selection: brand,
    scrollbarThumb: alpha(brand, 0.5),
    textOnBrand: readableOn(brand),
  };
}

const defined = (colors: Colors = {}) => Object.fromEntries(Object.entries(colors).filter(([, v]) => v != null && v !== '')) as Colors;

export interface RoleColorInput {
  /** The app's light-scheme colors (`colors` / `config.colors`). */
  colors?: Colors;
  /** The app's dark-scheme colors (`darkColors` / `config.darkColors`). */
  darkColors?: Colors;
  /** The appearance's light-scheme colors. */
  appearanceColors?: Colors;
  /** The appearance's dark-scheme colors (`appearance.dark.colors`). */
  appearanceDarkColors?: Colors;
}

/**
 * Every role color for a scheme, in this order (later wins):
 * - light: kit defaults, appearance colors, shades of the appearance's brand, shades of the app's brand, app colors.
 * - dark: kit dark defaults, appearance dark colors, shades of the dark brand, app dark colors.
 *   The dark brand is the app's `darkColors.brand`, else the appearance's dark brand, else the light
 *   brand (app, then appearance) made readable on the dark surface. Other light colors do not carry
 *   over: they were chosen for light surfaces.
 */
export function resolveRoleColors<T extends Colors>(scheme: Scheme, input: RoleColorInput, defaults: { light: T; dark: T }): T {
  if (scheme === 'light') {
    const given = defined(input.colors);
    const base = defined(input.appearanceColors);
    return { ...defaults.light, ...brandShades(base.brand), ...base, ...brandShades(given.brand), ...given } as T;
  }
  const given = defined(input.darkColors);
  const base = defined(input.appearanceDarkColors);
  const surface = given.surface ?? base.surface ?? defaults.dark.surface!;
  const lightBrand = defined(input.colors).brand ?? defined(input.appearanceColors).brand;
  const brand = given.brand ?? base.brand ?? (lightBrand ? adaptBrandForDark(lightBrand, surface) : undefined);
  const shades = brand ? { brand, ...brandShades(brand, 'dark', surface) } : {};
  return { ...defaults.dark, ...base, ...shades, ...given } as T;
}
