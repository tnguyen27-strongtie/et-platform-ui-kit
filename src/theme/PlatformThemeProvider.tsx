import CssBaseline from '@mui/material/CssBaseline';
import { StyledEngineProvider, ThemeProvider } from '@mui/material/styles';
import type { ThemeOptions } from '@mui/material/styles';
import { type ReactNode, useEffect, useInsertionEffect, useMemo } from 'react';

import type { ColorConfig, Density } from '../tokens/tokens';
import { useStableValue } from '../utils/useStableValue';
import { colorCssVars, resolveColors } from './colors';
import { createPlatformTheme } from './createPlatformTheme';
import type { PlatformThemeConfig } from './themeConfig';

export interface PlatformThemeProviderProps {
  children: ReactNode;
  /**
   * The app's theme file (exported from the showcase Theme builder):
   * import theme from './theme.config'; <PlatformThemeProvider config={theme}>.
   * `colors` and `density` props, when given, override it (e.g. a user's text-size setting).
   */
  config?: PlatformThemeConfig;
  /** FD "font size" setting: standard = 14px, expanded = 16px. */
  density?: Density;
  /**
   * Role colors for this app, e.g. { brand: '#1565c0' }. Shades of brand (hover, active,
   * subtle, focus) are derived unless given. Applies to MUI styles, Tailwind classes
   * (bg-brand, text-danger...) and `colors.*` in sx.
   */
  colors?: ColorConfig;
  /**
   * App-level theme additions, merged over the platform theme. May be passed inline: the theme
   * is rebuilt only when the content changes (functions inside are compared by identity).
   */
  overrides?: ThemeOptions;
}

const COLOR_STYLE_ID = 'platform-ui-colors';

export function PlatformThemeProvider({ children, config, density: densityProp, colors: colorsProp, overrides: overridesProp }: PlatformThemeProviderProps) {
  // Apps often pass `overrides` inline; keep the same object while its content is unchanged.
  // Functions inside (e.g. styleOverrides callbacks) compare by identity, so hoist those out of render.
  const overrides = useStableValue(overridesProp);
  const density = densityProp ?? config?.density ?? 'standard';
  const colors = config?.colors || colorsProp ? { ...config?.colors, ...colorsProp } : undefined;
  // Callers often pass an inline object; key on its content so the theme is not rebuilt every render.
  const colorKey = JSON.stringify(colors ?? {});
  const theme = useMemo(
    () => createPlatformTheme({ density, colors: JSON.parse(colorKey) as ColorConfig, overrides }),
    [density, colorKey, overrides],
  );
  const colorCss = useMemo(() => {
    const vars = colorCssVars(resolveColors(JSON.parse(colorKey) as ColorConfig));
    return `:root{${Object.entries(vars)
      .map(([name, value]) => `${name}:${value};`)
      .join('')}}`;
  }, [colorKey]);

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
    el.textContent = colorCss;
  }, [colorCss]);

  // On <body>, not <html>: changing the root font-size would rescale every rem value.
  useEffect(() => {
    const { classList } = document.body;
    classList.remove('density-standard', 'density-expanded');
    classList.add(`density-${density}`);
  }, [density]);

  return (
    <StyledEngineProvider enableCssLayer>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </StyledEngineProvider>
  );
}
