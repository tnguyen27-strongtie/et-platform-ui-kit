import CssBaseline from '@mui/material/CssBaseline';
import { StyledEngineProvider, ThemeProvider } from '@mui/material/styles';
import type { ThemeOptions } from '@mui/material/styles';
import { createContext, type ReactNode, useContext, useEffect, useInsertionEffect, useMemo, useSyncExternalStore } from 'react';

import type { ColorConfig, ColorScheme, ColorSchemeSetting, Density } from '../tokens/tokens';
import { useStableValue } from '../utils/useStableValue';
import { type AppearanceName, type PlatformAppearance, resolveAppearance } from './appearance';
import { themeCss } from './colors';
import { createPlatformTheme } from './createPlatformTheme';
import type { PlatformThemeConfig } from './themeConfig';

export interface PlatformThemeProviderProps {
  children: ReactNode;
  /**
   * The app's theme file (exported from the showcase Theme builder):
   * import theme from './theme.config'; <PlatformThemeProvider config={theme}>.
   * `colors`, `darkColors`, `colorScheme`, `density` and `appearance` props, when given, override it
   * (e.g. a user's text-size or dark-mode setting).
   */
  config?: PlatformThemeConfig;
  /**
   * Visual style of every component: 'classic' (default) or 'glass', or a custom appearance from
   * defineAppearance(). The brand colors stay; shape, shadows, surface materials, font and neutral
   * colors change. Switching at runtime needs no rebuild.
   */
  appearance?: AppearanceName | PlatformAppearance;
  /**
   * 'light' (default), 'dark', or 'system' to follow the operating system setting (and its changes).
   * Works with every appearance. Read the result with usePlatformColorScheme().
   */
  colorScheme?: ColorSchemeSetting;
  /** Text size setting: standard = 14px, expanded = 16px. */
  density?: Density;
  /**
   * Role colors for this app, e.g. { brand: '#1565c0' }. Shades of brand (hover, active,
   * subtle, focus) are derived unless given. Applies to MUI styles, Tailwind classes
   * (bg-brand, text-danger...) and `colors.*` in sx.
   */
  colors?: ColorConfig;
  /**
   * Role colors for the dark color scheme. Without them, the dark scheme uses the kit's dark colors
   * and the light `brand` lightened until it reads on dark surfaces.
   */
  darkColors?: ColorConfig;
  /**
   * App-level theme additions, merged over the platform theme. May be passed inline: the theme
   * is rebuilt only when the content changes (functions inside are compared by identity).
   */
  overrides?: ThemeOptions;
}

const COLOR_STYLE_ID = 'platform-ui-colors';
const DARK_QUERY = '(prefers-color-scheme: dark)';

const subscribeToSystemScheme = (onChange: () => void) => {
  const query = window.matchMedia?.(DARK_QUERY);
  query?.addEventListener('change', onChange);
  return () => query?.removeEventListener('change', onChange);
};
const systemScheme = (): ColorScheme => (window.matchMedia?.(DARK_QUERY).matches ? 'dark' : 'light');

/** The operating system's color scheme, updated when the user changes it. */
function useSystemColorScheme(): ColorScheme {
  return useSyncExternalStore(subscribeToSystemScheme, systemScheme, () => 'light');
}

const ColorSchemeContext = createContext<ColorScheme>('light');

/**
 * The color scheme in effect ('light' or 'dark'), with 'system' already resolved. For code that
 * needs real colors outside CSS, e.g. a chart: resolveSchemeColors(usePlatformColorScheme(), { colors }).
 */
export function usePlatformColorScheme(): ColorScheme {
  return useContext(ColorSchemeContext);
}

const merge = (a?: ColorConfig, b?: ColorConfig) => (a || b ? { ...a, ...b } : undefined);

export function PlatformThemeProvider({
  children,
  config,
  density: densityProp,
  colors: colorsProp,
  darkColors: darkColorsProp,
  colorScheme: colorSchemeProp,
  appearance: appearanceProp,
  overrides: overridesProp,
}: PlatformThemeProviderProps) {
  // Apps often pass `overrides` inline; keep the same object while its content is unchanged.
  // Functions inside (e.g. styleOverrides callbacks) compare by identity, so hoist those out of render.
  const overrides = useStableValue(overridesProp);
  const density = densityProp ?? config?.density ?? 'standard';
  // Callers often pass inline objects; compare by content so the theme is not rebuilt every render.
  const colors = useStableValue(merge(config?.colors, colorsProp));
  const darkColors = useStableValue(merge(config?.darkColors, darkColorsProp));
  const appearance = useStableValue(resolveAppearance(appearanceProp ?? config?.appearance));
  const system = useSystemColorScheme();
  const setting = colorSchemeProp ?? config?.colorScheme ?? 'light';
  const scheme: ColorScheme = setting === 'system' ? system : setting;

  const theme = useMemo(
    () => createPlatformTheme({ density, colors, darkColors, colorScheme: scheme, appearance, overrides }),
    [density, colors, darkColors, scheme, appearance, overrides],
  );
  const css = useMemo(() => themeCss({ scheme, colors, darkColors, appearance }), [scheme, colors, darkColors, appearance]);

  // Unlayered <style> on purpose: emotion (MUI) styles land in @layer mui at the top of <head>,
  // which makes that layer the lowest priority, so variables set there would lose to the
  // Tailwind @theme defaults. Unlayered rules beat every layer.
  useInsertionEffect(() => {
    let el = document.getElementById(COLOR_STYLE_ID) as HTMLStyleElement | null;
    if (!el) {
      el = document.createElement('style');
      el.id = COLOR_STYLE_ID;
      document.head.appendChild(el);
    }
    el.textContent = css;
  }, [css]);

  // On <body>, not <html>: changing the root font-size would rescale every rem value.
  useEffect(() => {
    const { classList } = document.body;
    classList.remove('density-standard', 'density-expanded');
    classList.add(`density-${density}`);
  }, [density]);

  // Hook for app CSS that must differ per appearance: [data-appearance='glass'] .my-panel { … }
  useEffect(() => {
    document.body.dataset.appearance = appearance.name;
  }, [appearance.name]);

  // On <html> so Tailwind's dark: variant (theme.css) and app CSS can match the whole page.
  useEffect(() => {
    document.documentElement.dataset.colorScheme = scheme;
  }, [scheme]);

  return (
    <ColorSchemeContext.Provider value={scheme}>
      <StyledEngineProvider enableCssLayer>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          {children}
        </ThemeProvider>
      </StyledEngineProvider>
    </ColorSchemeContext.Provider>
  );
}
