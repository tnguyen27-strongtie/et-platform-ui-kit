/**
 * Example themes for the showcase: complete themes (colors, dark colors, color scheme and a custom
 * appearance) made with the platform-ui-theme skill. They show what a theme file can do; they are
 * not part of the kit's API. Theme files store only built-in appearance names, so the showcase
 * persists an example by id (`example:<id>`) and restores its appearance object on load.
 */
import { type AppearanceName, defineAppearance, definePlatformTheme, parseThemeConfig, type PlatformThemeConfig } from '../index';

/** Dark HUD panels over a neon city grid, sharp corners and neon glow instead of shadows. */
const neonGridAppearance = defineAppearance({
  name: 'neon-grid',
  label: 'Neon Grid',
  description: 'Dark HUD panels over a neon city grid, sharp corners and neon glow instead of shadows.',
  shape: {
    control: '2px',
    field: '2px',
    overlay: '2px',
    dialog: '4px',
    panel: '2px',
    option: '2px',
    alert: '2px',
    section: '2px',
  },
  radius: {
    sm: '1px',
    md: '2px',
    lg: '3px',
    xl: '4px',
  },
  fontFamily: 'Rajdhani, \'Share Tech Mono\', ui-monospace, \'SF Mono\', Menlo, Consolas, monospace',
  dark: {
    shadows: {
      button: '0 0 12px color-mix(in srgb, var(--color-brand) 55%, transparent)',
      popover: '0 0 0 1px rgba(0, 240, 255, 0.55), 0 0 18px rgba(0, 240, 255, 0.35)',
      dropdownItem: 'inset 2px 0 0 #00F0FF',
      modal: '0 0 0 1px rgba(255, 42, 109, 0.7), 0 0 40px rgba(255, 42, 109, 0.35)',
      raised: '0 0 16px rgba(0, 240, 255, 0.45)',
      alert: '0 0 14px rgba(0, 240, 255, 0.2)',
      panel: '0 0 0 1px rgba(0, 240, 255, 0.25), 0 0 24px rgba(0, 240, 255, 0.12)',
    },
    material: {
      app: 'linear-gradient(rgba(0, 240, 255, 0.07) 1px, transparent 1px) 0 0 / 100% 32px, linear-gradient(90deg, rgba(0, 240, 255, 0.07) 1px, transparent 1px) 0 0 / 32px 100%, radial-gradient(60rem 30rem at 85% 0%, rgba(255, 42, 109, 0.3), transparent 70%), radial-gradient(50rem 30rem at 0% 100%, rgba(0, 240, 255, 0.22), transparent 70%), var(--color-surface-app)',
      panel: 'color-mix(in srgb, var(--color-surface) 74%, transparent)',
      header: 'color-mix(in srgb, #00F0FF 9%, var(--color-surface))',
      nav: 'color-mix(in srgb, var(--color-surface) 80%, transparent)',
      overlay: 'color-mix(in srgb, var(--color-surface) 90%, transparent)',
      control: 'color-mix(in srgb, var(--color-surface) 70%, transparent)',
      splitter: '#FF2A6D',
      filter: 'blur(12px) saturate(140%)',
      canvas: '#0B0B16',
    },
  },
}, 'glass');

const neonGrid = definePlatformTheme({
  version: 1,
  name: 'Neon Grid',
  colors: {
    brand: '#8A7A00',
  },
  darkColors: {
    brand: '#FCEE0A',
    textOnBrand: '#0A0A12',
    accent: '#00F0FF',
    info: '#00F0FF',
    link: '#00F0FF',
    danger: '#FF2A6D',
    success: '#39FF14',
    successStrong: '#39FF14',
    warning: '#FF9E00',
    warningText: '#FFB547',
    selection: '#FF2A6D',
    text: '#E6F7FF',
    textMuted: '#8FA3B8',
    textNav: '#9FB3C8',
    surfaceApp: '#07070D',
    surface: '#0E0E1A',
    surfaceSubtle: '#141426',
    surfaceDisabled: '#141420',
    surfaceHover: '#1A1A33',
    border: '#23234A',
    borderInput: '#2FA8B8',
    borderStrong: '#1FB8C8',
    borderTabs: '#1FB8C8',
    scrollbarThumb: 'rgba(0, 240, 255, 0.45)',
  },
  colorScheme: 'dark',
  appearance: neonGridAppearance,
});

export interface ExampleTheme {
  id: string;
  label: string;
  description: string;
  config: PlatformThemeConfig;
}

export const exampleThemes: ExampleTheme[] = [
  {
    id: 'neon-grid',
    label: 'Neon Grid',
    description: 'Cyberpunk: neon on a night-city grid, dark HUD glass panels, sharp corners, glow instead of shadows. Dark scheme.',
    config: neonGrid,
  },
];

/**
 * Appearance picker value: a built-in name or an example theme id. An example is a whole theme
 * (colors, dark colors, scheme), so picking one replaces the theme, and leaving it resets its colors.
 */
export function pickAppearance(config: PlatformThemeConfig, value: string): PlatformThemeConfig {
  const example = exampleThemes.find((e) => e.id === value);
  if (example) return { ...example.config, density: config.density };
  const base = exampleThemeOf(config) ? { density: config.density } : config;
  return { ...base, appearance: value === 'classic' ? undefined : (value as AppearanceName) };
}

const PREFIX = 'example:';

/** The example theme whose appearance the config uses, if any. */
export function exampleThemeOf(config: PlatformThemeConfig): ExampleTheme | undefined {
  const a = config.appearance;
  return typeof a === 'object' ? exampleThemes.find((e) => typeof e.config.appearance === 'object' && e.config.appearance.name === a.name) : undefined;
}

/** JSON for localStorage: an example's appearance object is replaced by its id. */
export function toStoredTheme(config: PlatformThemeConfig): string {
  const example = exampleThemeOf(config);
  return JSON.stringify(example ? { ...config, appearance: `${PREFIX}${example.id}` } : config);
}

/** Reads what toStoredTheme wrote; invalid or unknown content gives the kit defaults. */
export function fromStoredTheme(stored: string): PlatformThemeConfig {
  let raw: Record<string, unknown>;
  try {
    raw = JSON.parse(stored) as Record<string, unknown>;
  } catch {
    return {};
  }
  const ref = typeof raw.appearance === 'string' && raw.appearance.startsWith(PREFIX) ? raw.appearance.slice(PREFIX.length) : undefined;
  const example = ref ? exampleThemes.find((e) => e.id === ref) : undefined;
  if (ref) delete raw.appearance;
  const result = parseThemeConfig(raw);
  if (!result.ok) return {};
  return example ? { ...result.config, appearance: example.config.appearance } : result.config;
}
