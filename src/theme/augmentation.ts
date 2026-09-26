// Type-only module augmentation; imported by index.ts so it ships with the package types.
import type { ColorScale, Tokens } from '../tokens/tokens';

declare module '@mui/material/styles' {
  interface Palette {
    pumpkinOrange: ColorScale;
    trueGray: ColorScale;
    sageGreen: ColorScale;
    sstOrange: ColorScale;
    blue: ColorScale;
    neutral: { main: string };
    muted: string;
  }
  interface PaletteOptions {
    pumpkinOrange?: ColorScale;
    trueGray?: ColorScale;
    sageGreen?: ColorScale;
    sstOrange?: ColorScale;
    blue?: ColorScale;
    neutral?: { main: string };
    muted?: string;
  }
  interface Theme {
    tokens: Tokens;
  }
  interface ThemeOptions {
    tokens?: Tokens;
  }
}

declare module '@mui/material/Button' {
  interface ButtonPropsVariantOverrides {
    primary: true;
    primaryDark: true;
    secondary: true;
    textDark: true;
    tertiary: true;
    default: true;
    fab: true;
    /** Destructive action (delete, reset). */
    danger: true;
    // MUI built-ins that FD never uses are turned off to keep one vocabulary.
    contained: false;
    outlined: false;
  }
}

export {};
