/**
 * Appearances: complete visual styles (shape, depth, material, type, neutral colors) that sit
 * on top of the same components. The brand color stays with the app; an appearance changes how
 * everything is built around it, so a product can move to a new visual direction by changing
 * one prop instead of restyling every screen.
 *
 * Pure (no React/MUI, type-only imports) so it is unit tested directly (tests/unit/appearance.test.ts).
 */
import type { ColorConfig, MaterialRole, RadiusStep, ShadowRole, ShapeRole } from '../tokens/tokens';

/** What an appearance changes in the dark color scheme. Unset parts keep the kit's dark defaults. */
export interface PlatformAppearanceDark {
  /** Dark-scheme neutral colors (the brand is adapted from the light brand unless given). */
  colors?: ColorConfig;
  /** Dark-scheme shadows. */
  shadows?: Partial<Record<ShadowRole, string>>;
  /** Dark-scheme materials. */
  material?: Partial<Record<MaterialRole, string>>;
}

export interface PlatformAppearance {
  /** Identifier, lowercase. The provider puts it on `<body data-appearance="…">` for app CSS. */
  name: string;
  /** Display name, e.g. "Glass". */
  label?: string;
  /** One line on what the appearance looks like. */
  description?: string;
  /**
   * Neutral colors the appearance needs (surfaces, borders, overlay). They replace the kit
   * defaults; colors the app passes (`colors`, `config.colors`) still win over them.
   */
  colors?: ColorConfig;
  /** Corner radius by role (control, field, overlay, dialog, panel, option, alert, section). Any CSS length. */
  shape?: Partial<Record<ShapeRole, string>>;
  /**
   * The size steps behind Tailwind rounded-sm/md/lg/xl, rescaled so app code that uses them follows
   * the appearance too (kit components use `shape` roles).
   */
  radius?: Partial<Record<RadiusStep, string>>;
  /** Box shadows by role (button, popover, modal, panel…). Any CSS `box-shadow`. */
  shadows?: Partial<Record<ShadowRole, string>>;
  /** Surface materials (backgrounds and backdrop filters of app, panel, header, nav, overlay, control). */
  material?: Partial<Record<MaterialRole, string>>;
  /** Font stack for text (`--font-sans`). */
  fontFamily?: string;
  /** Space around and between workspace sections (`--workspace-gap`), e.g. '0.5rem' for floating panels. */
  workspaceGap?: string;
  /**
   * Material values used when the user asks the system for less transparency
   * (`prefers-reduced-transparency: reduce`). Translucent appearances should make surfaces solid here.
   */
  reducedTransparency?: Partial<Record<MaterialRole, string>>;
  /** Overrides for the dark color scheme. */
  dark?: PlatformAppearanceDark;
}

/** The platform's original look: solid surfaces, small radii, compact shadows. Every token keeps its default. */
export const classicAppearance: PlatformAppearance = {
  name: 'classic',
  label: 'Classic',
  description: 'Solid surfaces, tight corners and compact shadows: the original platform look.',
};

const glassSurface = (percent: number) => `color-mix(in srgb, var(--color-surface) ${percent}%, transparent)`;
const tint = (role: string, percent: number) => `color-mix(in srgb, var(--color-${role}) ${percent}%, transparent)`;

/**
 * Translucent layers over a soft, brand-tinted backdrop: frosted panels and bars, capsule
 * buttons, large rounded overlays with a light edge highlight. Data (grid rows, table cells,
 * inputs) stays on solid surfaces so it remains easy to read.
 */
export const glassAppearance: PlatformAppearance = {
  name: 'glass',
  label: 'Glass',
  description: 'Frosted translucent panels over a tinted backdrop, capsule buttons and soft, rounded overlays.',
  colors: {
    surfaceApp: '#eef1f6',
    surfaceSubtle: '#f6f7f9',
    surfaceHover: '#f1f3f7',
    border: '#e4e7ec',
    borderInput: '#c5cbd4',
    borderStrong: '#dce0e6',
    borderTabs: '#d5dae2',
    overlay: 'rgba(15, 23, 42, 0.2)',
  },
  shape: {
    control: '9999px',
    field: '0.75rem',
    overlay: '1rem',
    dialog: '1.75rem',
    panel: '1.25rem',
    option: '1.25rem',
    alert: '1.25rem',
    section: '1rem',
  },
  radius: { sm: '0.375rem', md: '0.625rem', lg: '1rem', xl: '1.5rem' },
  shadows: {
    button: '0 1px 3px rgba(15, 23, 42, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.75)',
    popover: '0 16px 40px rgba(15, 23, 42, 0.16), inset 0 0 0 1px rgba(255, 255, 255, 0.6)',
    dropdownItem: 'none',
    modal: '0 30px 80px rgba(15, 23, 42, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.8), inset 0 0 0 1px rgba(255, 255, 255, 0.45)',
    raised: '0 10px 30px rgba(15, 23, 42, 0.14)',
    alert: '0 10px 30px rgba(15, 23, 42, 0.14)',
    panel: '0 10px 40px rgba(15, 23, 42, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.85), inset 0 0 0 1px rgba(255, 255, 255, 0.55)',
  },
  material: {
    app: [
      `radial-gradient(60rem 40rem at 0% 0%, ${tint('brand', 45)}, transparent 70%)`,
      `radial-gradient(50rem 40rem at 100% 10%, ${tint('info', 50)}, transparent 70%)`,
      `radial-gradient(50rem 40rem at 50% 100%, ${tint('success', 38)}, transparent 70%)`,
      'var(--color-surface-app)',
    ].join(', '),
    panel: glassSurface(58),
    header: glassSurface(35),
    nav: glassSurface(55),
    overlay: glassSurface(72),
    control: glassSurface(60),
    splitter: 'transparent',
    filter: 'blur(24px) saturate(180%)',
    scrimFilter: 'blur(8px)',
  },
  workspaceGap: '0.5rem',
  fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Inter Variable', 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
  dark: {
    colors: {
      surfaceApp: '#0e1014',
      surface: '#1c1f25',
      surfaceSubtle: '#23272e',
      surfaceHover: '#272b33',
      border: '#2c3139',
      borderInput: '#6f7784',
      borderStrong: '#363c46',
      borderTabs: '#363c46',
      overlay: 'rgba(0, 0, 0, 0.45)',
    },
    shadows: {
      button: '0 1px 3px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.08)',
      popover: '0 16px 40px rgba(0, 0, 0, 0.5), inset 0 0 0 1px rgba(255, 255, 255, 0.1)',
      modal: '0 30px 80px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.12), inset 0 0 0 1px rgba(255, 255, 255, 0.08)',
      raised: '0 10px 30px rgba(0, 0, 0, 0.5)',
      alert: '0 10px 30px rgba(0, 0, 0, 0.5)',
      panel: '0 10px 40px rgba(0, 0, 0, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.1), inset 0 0 0 1px rgba(255, 255, 255, 0.06)',
    },
    material: {
      control: glassSurface(60),
    },
  },
  reducedTransparency: {
    panel: 'var(--color-surface)',
    header: 'var(--color-surface-subtle)',
    nav: 'var(--color-surface)',
    overlay: 'var(--color-surface)',
    control: 'var(--color-surface)',
    filter: 'none',
    scrimFilter: 'none',
  },
};

/** Built-in appearances, by name. */
export const APPEARANCES = {
  classic: classicAppearance,
  glass: glassAppearance,
} as const satisfies Record<string, PlatformAppearance>;

export type AppearanceName = keyof typeof APPEARANCES;

/** Names of the built-in appearances, in display order. */
export const APPEARANCE_NAMES = Object.keys(APPEARANCES) as AppearanceName[];

export function isAppearanceName(value: unknown): value is AppearanceName {
  return typeof value === 'string' && Object.hasOwn(APPEARANCES, value);
}

/** A built-in name or an appearance object. Unknown names and `undefined` resolve to Classic. */
export function resolveAppearance(appearance?: AppearanceName | PlatformAppearance): PlatformAppearance {
  if (appearance === undefined) return classicAppearance;
  if (typeof appearance === 'string') return isAppearanceName(appearance) ? APPEARANCES[appearance] : classicAppearance;
  return appearance;
}

/**
 * Builds an appearance on top of another one (Classic by default). Each part (colors, shape, radius,
 * shadows, material, reducedTransparency) merges key by key, so only the differences are written:
 *
 *   const brandGlass = defineAppearance({ name: 'brand-glass', shape: { control: '0.75rem' } }, 'glass');
 */
export function defineAppearance(appearance: PlatformAppearance, base: AppearanceName | PlatformAppearance = 'classic'): PlatformAppearance {
  const b = resolveAppearance(base);
  const merged: PlatformAppearance = { ...b, ...appearance };
  for (const part of ['colors', 'shape', 'radius', 'shadows', 'material', 'reducedTransparency'] as const) {
    const value = { ...b[part], ...appearance[part] };
    if (Object.keys(value).length) (merged as Record<typeof part, object>)[part] = value;
    else delete merged[part];
  }
  const dark: PlatformAppearanceDark = {};
  for (const part of ['colors', 'shadows', 'material'] as const) {
    const value = { ...b.dark?.[part], ...appearance.dark?.[part] };
    if (Object.keys(value).length) (dark as Record<typeof part, object>)[part] = value;
  }
  if (Object.keys(dark).length) merged.dark = dark;
  else delete merged.dark;
  return merged;
}
