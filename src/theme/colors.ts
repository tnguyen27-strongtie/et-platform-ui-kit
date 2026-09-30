import {
  type ColorConfig,
  type ColorRole,
  type ColorScheme,
  type ColorValues,
  colorVar,
  darkTrueGray,
  defaultColors,
  defaultDarkColors,
  defaultDarkMaterial,
  defaultDarkShadows,
  defaultMaterial,
  defaultShape,
  elevationVar,
  layout,
  type MaterialRole,
  materialVar,
  radius,
  type RadiusStep,
  scales,
  type ShadowRole,
  shadows,
  type ShapeRole,
  shapeVar,
  typography,
} from '../tokens/tokens';
import type { PlatformAppearance } from './appearance';
import { contrast, resolveRoleColors } from './colorMath';

/**
 * Merges an app color config over the defaults.
 * Passing only `brand` is enough: its hover/active/subtle/focus shades are derived from it.
 * Any role given explicitly wins over the derived value.
 * `base` (an appearance's colors) sits between the kit defaults and the app config.
 */
export function resolveColors(config: ColorConfig = {}, base: ColorConfig = {}): ColorValues {
  return resolveRoleColors('light', { colors: config, appearanceColors: base }, { light: defaultColors, dark: defaultDarkColors });
}

export interface SchemeColorOptions {
  /** App colors for the light scheme; in the dark scheme only `brand` carries over (made readable on dark surfaces). */
  colors?: ColorConfig;
  /** App colors for the dark scheme. */
  darkColors?: ColorConfig;
  /** Appearance whose colors (and `dark.colors`) sit under the app's. */
  appearance?: PlatformAppearance;
}

/**
 * Every role color for a color scheme: the light scheme is `resolveColors`; the dark scheme starts
 * from `defaultDarkColors` and derives brand shades for dark surfaces. Use it for the real hex values
 * a chart or canvas needs: `resolveSchemeColors(usePlatformColorScheme(), { colors: theme.colors })`.
 */
export function resolveSchemeColors(scheme: ColorScheme, { colors, darkColors, appearance }: SchemeColorOptions = {}): ColorValues {
  return resolveRoleColors(
    scheme,
    { colors, darkColors, appearanceColors: appearance?.colors, appearanceDarkColors: appearance?.dark?.colors },
    { light: defaultColors, dark: defaultDarkColors },
  );
}

/** CSS custom properties for the resolved colors, e.g. { '--color-brand': '#a8671d' }. */
export function colorCssVars(values: ColorValues): Record<string, string> {
  return Object.fromEntries(Object.entries(values).map(([role, value]) => [colorVar(role as ColorRole), value]));
}

/**
 * CSS custom properties of an appearance (radius roles and steps, shadows, materials, font,
 * workspace gap), with every value it leaves out taken from the kit defaults, e.g.
 * { '--radius-panel': '1.25rem', '--elevation-popover': '…' }. In the dark scheme the kit's dark
 * shadows and materials, then the appearance's `dark` part, apply on top.
 * Colors are separate: see `resolveSchemeColors`.
 */
export function appearanceCssVars(appearance?: PlatformAppearance, scheme: ColorScheme = 'light'): Record<string, string> {
  const dark = scheme === 'dark';
  const vars: Record<string, string> = {};
  for (const [role, value] of Object.entries({ ...defaultShape, ...appearance?.shape })) vars[shapeVar(role as ShapeRole)] = value;
  const steps = { sm: radius.sm, md: radius.md, lg: radius.lg, xl: radius.xl, ...appearance?.radius };
  for (const [step, value] of Object.entries(steps)) vars[`--radius-${step as RadiusStep}`] = value;
  const shadowValues = { ...shadows, ...appearance?.shadows, ...(dark ? { ...defaultDarkShadows, ...appearance?.dark?.shadows } : {}) };
  for (const [role, value] of Object.entries(shadowValues)) vars[elevationVar(role as ShadowRole)] = value;
  const materialValues = { ...defaultMaterial, ...appearance?.material, ...(dark ? { ...defaultDarkMaterial, ...appearance?.dark?.material } : {}) };
  for (const [role, value] of Object.entries(materialValues)) vars[materialVar(role as MaterialRole)] = value;
  vars['--font-sans'] = appearance?.fontFamily ?? typography.fontFamily.sans;
  vars['--workspace-gap'] = appearance?.workspaceGap ?? layout.workspaceGap;
  return vars;
}

const declarations = (vars: Record<string, string>) =>
  Object.entries(vars)
    .map(([name, value]) => `${name}:${value};`)
    .join('');

export interface ThemeCssOptions extends SchemeColorOptions {
  scheme?: ColorScheme;
  appearance: PlatformAppearance;
}

/**
 * The stylesheet PlatformThemeProvider injects: `color-scheme`, resolved role colors, the neutral
 * scale (reversed in the dark scheme) and appearance variables on :root, plus the appearance's
 * reduced-transparency materials under `prefers-reduced-transparency`.
 */
export function themeCss({ scheme = 'light', colors, darkColors, appearance }: ThemeCssOptions): string {
  const vars: Record<string, string> = {
    'color-scheme': scheme,
    ...colorCssVars(resolveSchemeColors(scheme, { colors, darkColors, appearance })),
    ...appearanceCssVars(appearance, scheme),
  };
  if (scheme === 'dark') {
    for (const [step, value] of Object.entries(darkTrueGray)) vars[`--color-true-gray-${step}`] = value;
  }
  let css = `:root{${declarations(vars)}}`;
  // A light canvas (drawings, product images) in the dark scheme: controls and notes on it use the
  // light colors so they stay readable. Elements opt in with data-surface="canvas".
  const canvas = vars[materialVar('canvas')] ?? '';
  if (scheme === 'dark' && (contrast(canvas, '#000000') ?? 0) > 10) {
    const light = colorCssVars(resolveSchemeColors('light', { colors, darkColors, appearance }));
    const grays = Object.fromEntries(Object.entries(scales.trueGray).map(([step, value]) => [`--color-true-gray-${step}`, value]));
    css += `[data-surface='canvas']{color-scheme:light;${declarations({ ...light, ...grays })}color:var(--color-text);}`;
  }
  const reduced = Object.entries(appearance.reducedTransparency ?? {});
  if (reduced.length) {
    const reducedVars = Object.fromEntries(reduced.map(([role, value]) => [materialVar(role as MaterialRole), value]));
    css += `@media (prefers-reduced-transparency: reduce){:root{${declarations(reducedVars)}}}`;
  }
  return css;
}
