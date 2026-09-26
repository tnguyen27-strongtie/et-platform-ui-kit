import { alpha, darken, lighten } from '@mui/material/styles';

import { type ColorConfig, type ColorRole, type ColorValues, colorVar, defaultColors } from '../tokens/tokens';

/**
 * Merges an app color config over the defaults.
 * Passing only `brand` is enough: its hover/active/subtle/focus shades are derived from it.
 * Any role given explicitly wins over the derived value.
 */
export function resolveColors(config: ColorConfig = {}): ColorValues {
  const given = Object.fromEntries(Object.entries(config).filter(([, v]) => v != null)) as ColorConfig;
  const derived: ColorConfig = {};
  const brand = given.brand;
  if (brand) {
    Object.assign(derived, {
      brandHover: lighten(brand, 0.15),
      brandActive: darken(brand, 0.25),
      brandDark: darken(brand, 0.4),
      brandSubtle: lighten(brand, 0.93),
      brandSelected: lighten(brand, 0.8),
      focusRing: lighten(brand, 0.5),
      accent: brand,
      selection: brand,
      scrollbarThumb: alpha(brand, 0.5),
    } satisfies ColorConfig);
  }
  return { ...defaultColors, ...derived, ...given };
}

/** CSS custom properties for the resolved colors, e.g. { '--color-brand': '#a8671d' }. */
export function colorCssVars(values: ColorValues): Record<string, string> {
  return Object.fromEntries(Object.entries(values).map(([role, value]) => [colorVar(role as ColorRole), value]));
}
