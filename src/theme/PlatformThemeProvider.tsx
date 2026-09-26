import CssBaseline from '@mui/material/CssBaseline';
import { StyledEngineProvider, ThemeProvider } from '@mui/material/styles';
import type { ThemeOptions } from '@mui/material/styles';
import { type ReactNode, useEffect, useMemo } from 'react';

import type { Density } from '../tokens/tokens';
import { createPlatformTheme } from './createPlatformTheme';

export interface PlatformThemeProviderProps {
  children: ReactNode;
  /** FD "font size" setting: standard = 14px, expanded = 16px. */
  density?: Density;
  /** App-level theme additions, merged over the platform theme. */
  overrides?: ThemeOptions;
}

export function PlatformThemeProvider({ children, density = 'standard', overrides }: PlatformThemeProviderProps) {
  const theme = useMemo(() => createPlatformTheme({ density, overrides }), [density, overrides]);

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
