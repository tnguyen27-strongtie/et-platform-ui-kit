import { alpha, darken, lighten } from '@mui/material/styles';

import {
  type ColorConfig,
  type ColorRole,
  type ColorValues,
  colorVar,
  defaultColors,
  defaultMaterial,
  defaultShape,
  layout,
  type MaterialRole,
  materialVar,
  type ShadowRole,
  shadowVar,
  shadows,
  type ShapeRole,
  shapeVar,
  typography,
} from '../tokens/tokens';
import type { PlatformAppearance } from './appearance';

const defined = (config: ColorConfig = {}) => Object.fromEntries(Object.entries(config).filter(([, v]) => v != null)) as ColorConfig;

/** Shades derived from a brand color (hover, active, subtle, selected, focus…). */
function brandShades(brand: string | undefined): ColorConfig {
  if (!brand) return {};
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

/**
 * Merges an app color config over the defaults.
 * Passing only `brand` is enough: its hover/active/subtle/focus shades are derived from it.
 * Any role given explicitly wins over the derived value.
 * `base` (an appearance's colors) sits between the kit defaults and the app config.
 */
export function resolveColors(config: ColorConfig = {}, base: ColorConfig = {}): ColorValues {
  const given = defined(config);
  const fromBase = defined(base);
  return { ...defaultColors, ...brandShades(fromBase.brand), ...fromBase, ...brandShades(given.brand), ...given };
}

/** CSS custom properties for the resolved colors, e.g. { '--color-brand': '#a8671d' }. */
export function colorCssVars(values: ColorValues): Record<string, string> {
  return Object.fromEntries(Object.entries(values).map(([role, value]) => [colorVar(role as ColorRole), value]));
}

/**
 * CSS custom properties of an appearance (radius roles, shadows, materials, font), with every
 * value it leaves out taken from the kit defaults, e.g. { '--radius-panel': '1.25rem', … }.
 * Colors are separate: pass `appearance.colors` as the `base` of `resolveColors`.
 */
export function appearanceCssVars(appearance?: PlatformAppearance): Record<string, string> {
  const vars: Record<string, string> = {};
  for (const [role, value] of Object.entries({ ...defaultShape, ...appearance?.shape })) vars[shapeVar(role as ShapeRole)] = value;
  for (const [role, value] of Object.entries({ ...shadows, ...appearance?.shadows })) vars[shadowVar(role as ShadowRole)] = value;
  for (const [role, value] of Object.entries({ ...defaultMaterial, ...appearance?.material })) vars[materialVar(role as MaterialRole)] = value;
  vars['--font-sans'] = appearance?.fontFamily ?? typography.fontFamily.sans;
  vars['--workspace-gap'] = appearance?.workspaceGap ?? layout.workspaceGap;
  return vars;
}

const declarations = (vars: Record<string, string>) =>
  Object.entries(vars)
    .map(([name, value]) => `${name}:${value};`)
    .join('');

/**
 * The stylesheet PlatformThemeProvider injects: resolved role colors and appearance variables on
 * :root, plus the appearance's reduced-transparency materials under `prefers-reduced-transparency`.
 */
export function themeCss(colorConfig: ColorConfig | undefined, appearance: PlatformAppearance): string {
  const vars = { ...colorCssVars(resolveColors(colorConfig, appearance.colors)), ...appearanceCssVars(appearance) };
  let css = `:root{${declarations(vars)}}`;
  const reduced = Object.entries(appearance.reducedTransparency ?? {});
  if (reduced.length) {
    const reducedVars = Object.fromEntries(reduced.map(([role, value]) => [materialVar(role as MaterialRole), value]));
    css += `@media (prefers-reduced-transparency: reduce){:root{${declarations(reducedVars)}}}`;
  }
  return css;
}
