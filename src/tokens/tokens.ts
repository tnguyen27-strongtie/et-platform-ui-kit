/**
 * Design tokens extracted from the Blueprint FD app (branch main-3.2).
 *
 * Sources:
 *  - tailwind-workspace-preset.js      (color scales, shadows, keyframes, breakpoints)
 *  - libs/shared/src/utils/constants.js (THEME: font sizes, line heights, palette)
 *  - libs/shared/src/globals/global.css (z-index, layout vars, scrollbar, selection)
 *  - libs/shared/src/utils/BlueprintThemeProvider.jsx (MUI palette, breakpoints)
 *
 * This file is the single source of truth: the MUI theme and the Tailwind @theme
 * (src/theme/theme.css) are both derived from these values.
 */

export const scales = {
  pumpkinOrange: {
    base: '#e28b28',
    0: '#fcf3e9',
    10: '#f7dec1',
    20: '#f0c18c',
    30: '#e89f4d',
    40: '#d38225',
    50: '#b26d1f',
    60: '#945b1a',
    70: '#7a4b16',
    80: '#623c11',
    90: '#4a2e0d',
    100: '#291907',
  },
  trueGray: {
    base: '#777777',
    0: '#f4f4f4',
    10: '#e2e2e2',
    20: '#cacaca',
    30: '#aeaeae',
    40: '#959595',
    50: '#7e7e7e',
    60: '#686868',
    70: '#565656',
    80: '#444444',
    90: '#343434',
    100: '#1d1d1d',
  },
  sstOrange: {
    base: '#ff5308',
    0: '#ffede6',
    10: '#ffd8c7',
    20: '#ffba9d',
    30: '#ffa077',
    40: '#ff7d46',
    50: '#ff6928',
    60: '#ff5308',
    70: '#ef4800',
    80: '#cb3d00',
    90: '#8e2b00',
    100: '#330f00',
  },
  sageGreen: {
    base: '#7a9f7f',
    0: '#f0f5f0',
    10: '#d7e5d9',
    20: '#b8d0bb',
    30: '#97b79b',
    40: '#799e7e',
    50: '#66856a',
    60: '#556f58',
    70: '#455b48',
    80: '#38493a',
    90: '#2b382c',
    100: '#171e18',
  },
  blue: {
    base: '#557799',
    0: '#f0f7ff',
    10: '#d2e6fa',
    20: '#b0cfee',
    30: '#8eb3d9',
    40: '#6d94bb',
    50: '#4e7296',
    60: '#35526f',
    70: '#23394f',
    80: '#182838',
    90: '#121e2b',
    100: '#0f1b26',
  },
} as const;

export type ColorScale = (typeof scales)[keyof typeof scales];

/**
 * Default value of every role color. Apps change them at runtime through
 * <PlatformThemeProvider colors={...}>; components read them via `colors` (CSS variables).
 */
export const defaultColors = {
  /** FD "new orange": primary buttons, checked radios/switches, selected tabs. */
  brand: '#a8671d',
  brandHover: scales.pumpkinOrange[40],
  brandActive: scales.pumpkinOrange[70],
  brandDark: scales.pumpkinOrange[80],
  brandSubtle: scales.pumpkinOrange[0],
  brandSelected: scales.pumpkinOrange[10],
  focusRing: scales.pumpkinOrange[20],
  accent: scales.pumpkinOrange[50],
  selection: scales.sstOrange.base,

  text: scales.trueGray[90],
  textMuted: scales.trueGray[60],
  textNav: '#757575',
  textOnBrand: scales.trueGray[0],

  surface: '#ffffff',
  surfaceApp: scales.trueGray[0],
  surfaceSubtle: '#fafafa',
  surfaceDisabled: '#f5f5f5',
  surfaceHover: '#f5f5f5',

  border: '#f0f0f0',
  borderInput: '#d9d9d9',
  borderStrong: scales.trueGray[20],
  borderTabs: scales.trueGray[20],

  neutral: '#737373',

  danger: '#b32c06',
  warning: '#db9f24',
  warningText: '#945b1a',
  success: '#789048',
  successStrong: '#216e4e',
  info: scales.blue[50],
  link: '#1890ff',
  scrollbarThumb: 'rgba(226, 139, 40, 0.5)',
  scrollbarThumbMenu: '#6b7280',
  overlay: 'rgba(0, 0, 0, 0.5)',
} as const;

export type ColorRole = keyof typeof defaultColors;
/** Resolved color values (hex/rgba), e.g. for MUI palette computations. */
export type ColorValues = Record<ColorRole, string>;
/** App-level color config: any subset of role colors. */
export type ColorConfig = Partial<ColorValues>;

const kebab = (s: string) => s.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();

/** CSS custom property name of a role color, e.g. brand -> --color-brand. */
export const colorVar = (role: ColorRole) => `--color-${kebab(role)}`;

/**
 * Role-based colors as CSS variable references (`var(--color-brand)`).
 * Components use these, never raw hex, so a theme config applies everywhere,
 * including MUI styles, Tailwind classes (bg-brand) and inline styles.
 */
export const colors = Object.fromEntries(
  Object.keys(defaultColors).map((role) => [role, `var(${colorVar(role as ColorRole)})`]),
) as Record<ColorRole, string>;

export const typography = {
  fontFamily: {
    sans: "'HelveticaNeueLTStd', 'Helvetica Neue', Helvetica, Arial, sans-serif",
    serif: "'Clarendon', Georgia, serif",
  },
  /** FD "density" setting: html font-size and line-height. */
  density: {
    standard: { fontSize: 14, lineHeight: 17.5 },
    expanded: { fontSize: 16, lineHeight: 24 },
  },
  size: {
    xs: '0.75rem', // labels, errors, table cells
    sm: '0.875rem', // inputs, tabs, menu items
    base: '1rem', // default button, dialog title
    lg: '1.125rem', // alert title
  },
  weight: {
    light: 300,
    regular: 400,
    medium: 500,
    bold: 700,
    heavy: 800,
  },
} as const;

export const radius = {
  none: '0',
  sm: '0.125rem', // inputs, menus, dialogs (desktop), tooltips
  md: '0.25rem', // buttons
  lg: '0.5rem', // option cards
  xl: '1rem', // alerts
  full: '9999px',
} as const;

export const shadows = {
  popover: '0 1.5px 4px rgba(0,0,0,.24), 0 1.5px 6px rgba(0,0,0,.12)',
  dropdownItem: '0 3px 4px rgba(0,0,0,.2)',
  modal: '0 6px 12px rgba(0,0,0,.23), 0 10px 40px rgba(0,0,0,.19)',
  button: '0 2px 0 0 rgba(0,0,0,.04)',
  raised: '0 3px 12px rgba(0,0,0,.23), 0 3px 12px rgba(0,0,0,.16)',
  alert: '0 6px 7px 3px rgba(0,0,0,.15), 0 3px 3px 0 rgba(0,0,0,.25)',
} as const;

/** Tailwind-compatible spacing unit: 1 = 0.25rem. */
export const spacingUnit = 4;

export const breakpoints = {
  xs: 0,
  sm: 640,
  md: 768,
  lg: 992,
  xl: 1280,
} as const;

export const layout = {
  topNavHeight: 54,
  dialogWidth: 572,
  dialogMaxWidth: 1536,
  inputHeight: 40,
  tabHeight: 48,
} as const;

export const zIndex = {
  popper: 1,
  editTemplate: 2,
  drawerBackdrop: 51,
  drawer: 52,
  topNavMenu: 100,
  topNav: 101,
  eula: 102,
  dropdown: 1050,
} as const;

export const motion = {
  fast: '150ms',
  base: '200ms',
  slow: '300ms',
  easing: 'ease-out',
} as const;

export const tokens = {
  scales,
  colors: defaultColors,
  typography,
  radius,
  shadows,
  spacingUnit,
  breakpoints,
  layout,
  zIndex,
  motion,
} as const;

export type Tokens = typeof tokens;
export type Density = keyof typeof typography.density;
