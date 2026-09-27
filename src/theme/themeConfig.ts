/**
 * Serializable theme configuration: what the Theme builder exports and apps load.
 * Pure (no React/MUI) so it is unit tested directly (tests/unit/themeConfig.test.ts).
 */
// Type-only import: this file has no runtime imports so Node can run its unit tests directly.
import type { ColorConfig, ColorRole, Density } from '../tokens/tokens';

/** Every role in defaultColors (tests/unit/themeConfig.test.ts checks they stay in sync). */
export const COLOR_ROLES: readonly ColorRole[] = [
  'brand',
  'brandHover',
  'brandActive',
  'brandDark',
  'brandSubtle',
  'brandSelected',
  'focusRing',
  'accent',
  'selection',
  'text',
  'textMuted',
  'textNav',
  'textOnBrand',
  'surface',
  'surfaceApp',
  'surfaceSubtle',
  'surfaceDisabled',
  'surfaceHover',
  'border',
  'borderInput',
  'borderStrong',
  'borderTabs',
  'neutral',
  'danger',
  'warning',
  'warningText',
  'success',
  'successStrong',
  'info',
  'link',
  'scrollbarThumb',
  'scrollbarThumbMenu',
  'overlay',
];

export const THEME_CONFIG_VERSION = 1;

export interface PlatformThemeConfig {
  /** Format version, for future migrations. */
  version?: typeof THEME_CONFIG_VERSION;
  /** Human-readable name, e.g. "Demo Calculator". */
  name?: string;
  /** Only the roles you change. Brand shades are derived from `brand` unless given. */
  colors?: ColorConfig;
  /** Default text size. */
  density?: Density;
}

/** Identity helper that type-checks a theme.config.ts file. */
export function definePlatformTheme(config: PlatformThemeConfig): PlatformThemeConfig {
  return config;
}

const colorPatterns = [
  /^#(?:[0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/i,
  /^rgba?\(\s*[\d.]+%?\s*,\s*[\d.]+%?\s*,\s*[\d.]+%?\s*(?:,\s*[\d.]+%?\s*)?\)$/i,
  /^rgba?\(\s*[\d.]+%?\s+[\d.]+%?\s+[\d.]+%?\s*(?:\/\s*[\d.]+%?\s*)?\)$/i,
  /^hsla?\(\s*[\d.]+(?:deg)?\s*,?\s*[\d.]+%\s*,?\s*[\d.]+%\s*(?:[,/]\s*[\d.]+%?\s*)?\)$/i,
];

/** Accepts hex, rgb()/rgba() and hsl()/hsla() colors. Named colors and var() are rejected on purpose. */
export function isValidColor(value: unknown): value is string {
  return typeof value === 'string' && colorPatterns.some((p) => p.test(value.trim()));
}

export type ParseThemeResult =
  | { ok: true; config: PlatformThemeConfig; warnings: string[] }
  | { ok: false; errors: string[]; warnings: string[] };

/**
 * Validates untrusted input (a pasted or downloaded theme.json). Unknown color roles and keys
 * are dropped with a warning; invalid values are errors, so a typo never reaches the UI.
 */
export function parseThemeConfig(input: unknown): ParseThemeResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  let data = input;
  if (typeof input === 'string') {
    try {
      data = JSON.parse(input);
    } catch (e) {
      return { ok: false, errors: [`Not valid JSON: ${(e as Error).message}`], warnings };
    }
  }
  if (typeof data !== 'object' || data === null || Array.isArray(data)) {
    return { ok: false, errors: ['The theme must be a JSON object.'], warnings };
  }

  const raw = data as Record<string, unknown>;
  const config: PlatformThemeConfig = {};
  for (const key of Object.keys(raw)) {
    if (!['version', 'name', 'colors', 'density', '$schema'].includes(key)) warnings.push(`Unknown key "${key}" ignored.`);
  }

  if (raw.version !== undefined) {
    if (raw.version !== THEME_CONFIG_VERSION) errors.push(`Unsupported version ${JSON.stringify(raw.version)} (expected ${THEME_CONFIG_VERSION}).`);
    else config.version = THEME_CONFIG_VERSION;
  }
  if (raw.name !== undefined) {
    if (typeof raw.name !== 'string') errors.push('"name" must be a string.');
    else if (raw.name.trim()) config.name = raw.name.trim();
  }
  if (raw.density !== undefined) {
    if (raw.density !== 'standard' && raw.density !== 'expanded') errors.push('"density" must be "standard" or "expanded".');
    else config.density = raw.density;
  }
  if (raw.colors !== undefined) {
    if (typeof raw.colors !== 'object' || raw.colors === null || Array.isArray(raw.colors)) {
      errors.push('"colors" must be an object of role → color.');
    } else {
      const colors: ColorConfig = {};
      for (const [role, value] of Object.entries(raw.colors as Record<string, unknown>)) {
        if (!(COLOR_ROLES as readonly string[]).includes(role)) {
          warnings.push(`Unknown color role "${role}" ignored.`);
        } else if (!isValidColor(value)) {
          errors.push(`colors.${role}: "${String(value)}" is not a color (use #rrggbb, rgb() or hsl()).`);
        } else {
          colors[role as ColorRole] = value.trim();
        }
      }
      if (Object.keys(colors).length) config.colors = colors;
    }
  }

  return errors.length ? { ok: false, errors, warnings } : { ok: true, config, warnings };
}

/** Drops empty parts so exported files contain only what was changed. */
export function normalizeThemeConfig(config: PlatformThemeConfig): PlatformThemeConfig {
  const out: PlatformThemeConfig = { version: THEME_CONFIG_VERSION };
  if (config.name?.trim()) out.name = config.name.trim();
  const colors = Object.fromEntries(Object.entries(config.colors ?? {}).filter(([, v]) => typeof v === 'string' && v.trim())) as ColorConfig;
  if (Object.keys(colors).length) out.colors = colors;
  if (config.density && config.density !== 'standard') out.density = config.density;
  return out;
}

export function themeConfigToJson(config: PlatformThemeConfig): string {
  return `${JSON.stringify(normalizeThemeConfig(config), null, 2)}\n`;
}

/** A ready-to-commit theme.config.ts. */
export function themeConfigToTs(config: PlatformThemeConfig): string {
  const body = JSON.stringify(normalizeThemeConfig(config), null, 2).replace(/"([A-Za-z_$][\w$]*)":/g, '$1:');
  return `import { definePlatformTheme } from '@platform/ui';\n\nexport default definePlatformTheme(${body});\n`;
}

// ---------- Contrast (WCAG 2.x) ----------

/** [r, g, b] 0–255 from #rgb, #rrggbb(aa) or rgb()/rgba(); alpha is ignored. null otherwise. */
export function parseRgb(color: string): [number, number, number] | null {
  const c = color.trim();
  const hex = /^#([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i.exec(c);
  if (hex) {
    let h = hex[1]!;
    if (h.length <= 4) h = [...h].map((x) => x + x).join('');
    return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)) as [number, number, number];
  }
  const rgb = /^rgba?\(\s*([\d.]+)\s*[,\s]\s*([\d.]+)\s*[,\s]\s*([\d.]+)/i.exec(c);
  if (rgb) return [Number(rgb[1]), Number(rgb[2]), Number(rgb[3])];
  return null;
}

function luminance([r, g, b]: [number, number, number]) {
  const lin = (v: number) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

/** WCAG contrast ratio (1–21), rounded to 2 decimals; null if a color cannot be parsed. */
export function contrastRatio(foreground: string, background: string): number | null {
  const a = parseRgb(foreground);
  const b = parseRgb(background);
  if (!a || !b) return null;
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return Math.round(((hi + 0.05) / (lo + 0.05)) * 100) / 100;
}
