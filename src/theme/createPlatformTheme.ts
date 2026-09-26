import type { Shadows, ThemeOptions } from '@mui/material/styles';
import { createTheme } from '@mui/material/styles';

import type { ColorConfig, Density } from '../tokens/tokens';
import { colors, layout, radius, scales, shadows, tokens, typography } from '../tokens/tokens';
import { resolveColors } from './colors';

/**
 * MUI theme reproducing the FD look. Every MUI component used by the kit gets its FD
 * styling here, so plain MUI usage (TextField, Select, Autocomplete...) also matches.
 *
 * Styles reference role colors as CSS variables (`colors.*` = var(--color-*)), so an app
 * color config applies without rebuilding the theme. Only the MUI palette needs resolved
 * values, because MUI computes channels and contrast from them.
 */

const muiShadows = [
  'none',
  shadows.button, // 1: buttons
  shadows.popover, // 2: popover, tooltip
  shadows.dropdownItem, // 3: hovered menu option
  shadows.raised, // 4: hovered option card
  ...Array<string>(19).fill(shadows.popover), // 5-23: Menu/Popover use 8
  shadows.modal, // 24: Dialog
] as Shadows;

const disabledControl = {
  opacity: 0.4,
  cursor: 'not-allowed',
  pointerEvents: 'auto',
} as const;

const thinMenuScrollbar = {
  '&::-webkit-scrollbar': { width: '4px' },
  '&::-webkit-scrollbar-thumb': {
    background: colors.scrollbarThumbMenu,
    borderRadius: radius.sm,
  },
} as const;

/**
 * Keyboard focus indicator (WCAG 2.4.7). Ripples are disabled kit-wide, and MUI relies on
 * the focus ripple to show focus, so every focusable control gets this outline instead.
 */
const focusOutline = { outline: `2px solid ${colors.brand}`, outlineOffset: '2px' } as const;
const focusOutlineInset = { ...focusOutline, outlineOffset: '-2px' } as const;

// Disabled brand buttons keep their hue and fade (root sets opacity), so they never look
// more prominent than enabled ones.
const brandFilled = {
  backgroundColor: colors.brand,
  color: colors.textOnBrand,
  '&:hover': { backgroundColor: colors.brandHover },
  '&.Mui-focusVisible': { backgroundColor: colors.brandActive },
  '&.Mui-disabled': { backgroundColor: colors.brand, color: colors.textOnBrand },
  '& .MuiButton-loadingIndicator': { color: colors.textOnBrand },
} as const;

/** Class on the Select dropdown paper, which follows the field width instead of the menu limits. */
const SELECT_MENU_CLASS = 'platform-select-menu';

export interface PlatformThemeOptions {
  density?: Density;
  /** Role colors to override, e.g. { brand: '#1565c0' }. Brand shades are derived. */
  colors?: ColorConfig;
  overrides?: ThemeOptions;
}

export function createPlatformTheme({ density = 'standard', colors: colorConfig, overrides }: PlatformThemeOptions = {}) {
  const { fontSize, lineHeight } = typography.density[density];
  const v = resolveColors(colorConfig);

  return createTheme(
    {
      tokens,
      cssVariables: { cssVarPrefix: 'mui' },
      spacing: 4, // 1 unit = 0.25rem, same scale as Tailwind
      shape: { borderRadius: 2 },
      shadows: muiShadows,
      breakpoints: {
        values: { xs: 0, sm: 640, md: 768, lg: 992, xl: 1280 },
      },
      palette: {
        primary: {
          main: v.brand,
          light: v.brandHover,
          dark: v.brandActive,
          contrastText: v.textOnBrand,
        },
        secondary: { main: v.neutral, contrastText: '#fff' },
        error: { main: v.danger },
        warning: { main: v.warning, dark: v.warningText },
        success: { main: v.success, dark: v.successStrong },
        info: { main: v.info },
        text: { primary: v.text, secondary: v.textMuted },
        background: { default: v.surfaceApp, paper: v.surface },
        divider: v.border,
        pumpkinOrange: scales.pumpkinOrange,
        trueGray: scales.trueGray,
        sageGreen: scales.sageGreen,
        sstOrange: scales.sstOrange,
        blue: scales.blue,
        neutral: { main: v.neutral },
        muted: v.borderInput,
      },
      typography: {
        fontFamily: typography.fontFamily.sans,
        fontSize,
        fontWeightLight: typography.weight.light,
        fontWeightRegular: typography.weight.regular,
        fontWeightMedium: typography.weight.medium,
        fontWeightBold: typography.weight.bold,
        // Compact heading scale for tool UIs (MUI's defaults start at 6rem). Titles are bold,
        // labels medium, body regular, so headings stand out without per-app styling.
        h1: { fontSize: '1.5rem', lineHeight: 1.25, fontWeight: typography.weight.bold },
        h2: { fontSize: '1.25rem', lineHeight: 1.25, fontWeight: typography.weight.bold },
        h3: { fontSize: '1.125rem', lineHeight: 1.3, fontWeight: typography.weight.bold },
        h4: { fontSize: typography.size.base, lineHeight: 1.4, fontWeight: typography.weight.bold },
        h5: { fontSize: typography.size.sm, lineHeight: 1.4, fontWeight: typography.weight.bold },
        h6: { fontSize: typography.size.xs, lineHeight: 1.4, fontWeight: typography.weight.bold, textTransform: 'uppercase', letterSpacing: '0.04em' },
        subtitle1: { fontSize: typography.size.sm, fontWeight: typography.weight.medium },
        subtitle2: { fontSize: typography.size.xs, fontWeight: typography.weight.medium },
        body1: { fontSize: `${fontSize}px`, lineHeight: `${lineHeight}px` },
        body2: { fontSize: typography.size.sm },
        caption: { fontSize: typography.size.xs, color: colors.textMuted },
        button: { textTransform: 'none', fontWeight: typography.weight.regular },
      },
      zIndex: {
        appBar: tokens.zIndex.topNav,
        drawer: tokens.zIndex.drawer,
      },
      components: {
        MuiCssBaseline: {
          styleOverrides: {
            html: { color: colors.text, scrollbarWidth: 'thin', scrollbarColor: `${colors.scrollbarThumb} transparent` },
            'html, body, #root': { height: '100%' },
            body: { backgroundColor: colors.surfaceApp },
            '::selection': { backgroundColor: colors.selection, color: '#fff', textShadow: 'none' },
            '::-webkit-scrollbar': { width: '10px', height: '10px' },
            '::-webkit-scrollbar-thumb': { backgroundColor: colors.scrollbarThumb, borderRadius: 0 },
            '@keyframes platform-modal-show': {
              from: { transform: 'translate(0, -25%)' },
              to: { transform: 'translate(0, 0)' },
            },
            '@keyframes platform-loading-border': {
              '0%, 100%': { borderColor: colors.accent, borderWidth: '1px' },
              '50%': { borderColor: 'transparent', borderWidth: '15px' },
            },
            '@keyframes platform-loading-pulse': {
              '0%, 100%': { opacity: 1 },
              '50%': { opacity: 0 },
            },
          },
        },

        // ---------- Buttons ----------
        MuiButtonBase: { defaultProps: { disableRipple: true } },
        MuiButton: {
          defaultProps: { variant: 'default', disableElevation: true },
          styleOverrides: {
            root: {
              whiteSpace: 'nowrap',
              boxShadow: shadows.button,
              gap: '0.5rem',
              borderRadius: radius.md,
              transition: 'all 0.15s linear',
              minWidth: 'fit-content',
              '&:hover': { transform: 'scale(1.02)', boxShadow: shadows.button },
              '&.Mui-focusVisible': focusOutline,
              '&.Mui-disabled': {
                ...disabledControl,
                color: colors.text,
                backgroundColor: colors.surfaceDisabled,
                '&:hover': { transform: 'none' },
              },
              // Loading: disabled for clicks but not faded; label hidden behind the spinner.
              '&.MuiButton-loading': { opacity: 1, cursor: 'progress' },
              '&.MuiButton-loading.MuiButton-loadingPositionCenter': { color: 'transparent' },
              '& .MuiButton-loadingIndicator': { color: colors.text },
            },
            sizeSmall: { padding: '0.25rem 0.5rem', fontSize: '0.875rem', lineHeight: '1.25rem' },
            sizeMedium: { padding: '0.5rem 0.75rem', fontSize: '1rem', lineHeight: '1.5rem' },
            fullWidth: { maxWidth: '100%' },
          },
          variants: [
            { props: { variant: 'primary' }, style: brandFilled },
            {
              props: { variant: 'primaryDark' },
              style: {
                backgroundColor: colors.brandDark,
                color: '#fff',
                fontWeight: typography.weight.bold,
                '&:hover': { backgroundColor: colors.brandActive },
                '&.Mui-disabled': { backgroundColor: colors.brandDark, color: '#fff' },
              },
            },
            {
              props: { variant: 'secondary' },
              style: {
                backgroundColor: colors.neutral,
                color: '#fff',
                '&.Mui-disabled': { color: '#fff' },
              },
            },
            {
              props: { variant: 'text' },
              style: {
                backgroundColor: 'transparent',
                color: '#000',
                boxShadow: 'none',
                '&:hover, &:focus-visible, &:active': {
                  backgroundColor: colors.brandActive,
                  color: colors.textOnBrand,
                  boxShadow: 'none',
                },
                '&.Mui-disabled': { color: colors.textMuted, backgroundColor: 'transparent' },
              },
            },
            {
              props: { variant: 'textDark' },
              style: {
                backgroundColor: 'transparent',
                color: colors.brandDark,
                fontWeight: typography.weight.heavy,
                textTransform: 'uppercase',
                boxShadow: 'none',
                '&:hover': { backgroundColor: colors.brandActive, color: colors.textOnBrand, boxShadow: 'none' },
                '&.Mui-disabled': { color: colors.brandDark, backgroundColor: 'transparent' },
              },
            },
            // FD painted disabled default/tertiary buttons dark brown with inherited (black) text,
            // which is unreadable. The kit uses a light disabled surface instead.
            {
              props: { variant: 'tertiary' },
              style: {
                color: '#000',
                fontWeight: typography.weight.medium,
                backgroundColor: '#fff',
                '&.Mui-disabled': { backgroundColor: colors.surfaceDisabled, color: colors.text },
              },
            },
            {
              props: { variant: 'default' },
              style: {
                color: '#000',
                fontWeight: typography.weight.medium,
                backgroundColor: '#fff',
                border: `1px solid ${colors.borderInput}`,
                '&.Mui-disabled': { backgroundColor: colors.surfaceDisabled, color: colors.text },
              },
            },
            {
              props: { variant: 'danger' },
              style: {
                backgroundColor: colors.danger,
                color: '#fff',
                fontWeight: typography.weight.medium,
                '&:hover': { backgroundColor: colors.danger, filter: 'brightness(1.1)' },
                '&.Mui-disabled': { backgroundColor: colors.danger, color: '#fff' },
                '& .MuiButton-loadingIndicator': { color: '#fff' },
              },
            },
            {
              props: { variant: 'fab' },
              style: { ...brandFilled, borderRadius: radius.full, minWidth: 0, width: '2.5rem', height: '2.5rem', padding: 0 },
            },
          ],
        },
        MuiIconButton: {
          styleOverrides: {
            root: {
              color: 'inherit',
              padding: '0.25rem',
              transition: 'all 0.2s ease-in-out',
              '&:hover': { backgroundColor: colors.brandSubtle },
              '&.Mui-focusVisible': focusOutline,
              '&.Mui-disabled': disabledControl,
            },
          },
        },

        // ---------- Inputs ----------
        MuiFormLabel: {
          styleOverrides: {
            root: {
              display: 'block',
              fontSize: typography.size.xs,
              fontWeight: typography.weight.medium,
              minHeight: '1.25rem',
              color: colors.text,
              '&.Mui-focused': { color: colors.text },
              '&.Mui-error': { color: colors.danger },
            },
            asterisk: { color: colors.danger },
          },
        },
        MuiFormHelperText: {
          styleOverrides: {
            root: { margin: 0, fontSize: typography.size.xs, '&.Mui-error': { color: colors.danger } },
          },
        },
        MuiInputBase: {
          styleOverrides: {
            root: {
              fontSize: typography.size.sm,
              fontWeight: typography.weight.medium,
              '& input::selection': { backgroundColor: colors.accent },
            },
          },
        },
        MuiOutlinedInput: {
          defaultProps: { notched: false },
          styleOverrides: {
            root: {
              backgroundColor: colors.surface,
              borderRadius: radius.sm,
              transition: 'box-shadow 0.15s',
              '&:not(.MuiInputBase-multiline)': { height: layout.inputHeight },
              '&.MuiInputBase-adornedStart': { paddingLeft: 0 },
              '&.MuiInputBase-adornedEnd': { paddingRight: 0 },
              '& .MuiOutlinedInput-notchedOutline': {
                border: `1px solid ${colors.borderInput}`,
                top: 0,
                '& legend': { display: 'none' },
              },
              '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: colors.borderInput },
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                border: `2px solid ${colors.focusRing}`,
              },
              '&.Mui-error .MuiOutlinedInput-notchedOutline, &.Mui-error.Mui-focused .MuiOutlinedInput-notchedOutline':
                { borderColor: colors.danger },
              '&.Mui-disabled': {
                backgroundColor: colors.surfaceDisabled,
                opacity: 0.45,
                cursor: 'not-allowed',
                '& *': { cursor: 'not-allowed' },
              },
            },
            input: { padding: '0 0.5rem', height: '100%', boxSizing: 'border-box' },
            multiline: { padding: '0.5rem' },
          },
        },
        MuiInputAdornment: {
          styleOverrides: {
            root: { margin: 0, padding: '0 0.5rem', height: '100%', maxHeight: 'none', whiteSpace: 'nowrap', color: colors.text },
          },
        },
        MuiSelect: {
          // Marked so the action-menu width limits below do not apply: a select's list matches the field width.
          defaultProps: { MenuProps: { slotProps: { paper: { elevation: 8, className: SELECT_MENU_CLASS } } } },
          styleOverrides: {
            select: {
              display: 'flex',
              alignItems: 'center',
              height: '100%',
              padding: '0 1.5rem 0 0.5rem',
              boxSizing: 'border-box',
            },
            icon: { fontSize: '1rem', color: '#000', right: '0.375rem' },
          },
        },
        MuiMenu: {
          styleOverrides: {
            paper: {
              borderRadius: radius.sm,
              ...thinMenuScrollbar,
              // Action menus share one width range; long labels wrap instead of stretching the menu.
              [`&:not(.${SELECT_MENU_CLASS})`]: { minWidth: layout.menuMinWidth, maxWidth: layout.menuMaxWidth },
            },
            list: { padding: 0, maxHeight: '24rem' },
          },
        },
        MuiMenuItem: {
          styleOverrides: {
            root: {
              padding: '0.5rem',
              gap: '0.5rem',
              // Nested so it beats MUI's own `@media (min-width: sm) { min-height: auto }`, which
              // emotion emits after plain declarations.
              '&.MuiMenuItem-root': {
                minHeight: layout.menuItemMinHeight,
                '@media (pointer: coarse)': { minHeight: layout.menuItemMinHeightTouch },
              },
              // Wrap long labels rather than cut them off: the full action name must stay readable.
              whiteSpace: 'normal',
              overflowWrap: 'anywhere',
              lineHeight: 1.3,
              fontSize: typography.size.sm,
              '&:hover, &.Mui-focusVisible': { backgroundColor: colors.brandSubtle, boxShadow: shadows.dropdownItem },
              '&.Mui-selected, &.Mui-selected:hover, &.Mui-selected.Mui-focusVisible': {
                backgroundColor: colors.brandSelected,
              },
            },
          },
        },
        MuiAutocomplete: {
          styleOverrides: {
            inputRoot: {
              padding: '0 1.5rem 0 0.5rem',
              '& .MuiAutocomplete-input': { padding: 0 },
            },
            popupIndicator: { color: '#000', '& svg': { fontSize: '1rem' } },
            clearIndicator: { '& svg': { fontSize: '1rem' } },
            paper: { borderRadius: radius.sm, boxShadow: shadows.popover },
            listbox: { padding: 0, maxHeight: '24rem', ...thinMenuScrollbar },
            option: {
              padding: '0.5rem !important',
              gap: '0.5rem',
              fontSize: typography.size.sm,
              '&:hover, &.Mui-focused': { backgroundColor: `${colors.brandSubtle} !important`, boxShadow: shadows.dropdownItem },
              '&[aria-selected="true"]': { backgroundColor: `${colors.brandSelected} !important` },
            },
            noOptions: {
              color: colors.danger,
              fontSize: typography.size.sm,
              fontWeight: typography.weight.medium,
              padding: '0.5rem',
            },
          },
        },

        // ---------- Selection controls ----------
        MuiRadio: {
          defaultProps: { size: 'small', disableRipple: true },
          styleOverrides: {
            root: {
              padding: 0,
              color: colors.text,
              '&.Mui-checked': { color: colors.brand },
              '&:hover': { backgroundColor: 'transparent' },
              '&.Mui-focusVisible': { ...focusOutline, borderRadius: radius.full },
              '&:hover:not(.Mui-checked):not(.Mui-disabled)': { color: colors.brand },
              '&.Mui-disabled': { ...disabledControl, color: colors.text, '&.Mui-checked': { color: colors.brand } },
            },
          },
        },
        MuiCheckbox: {
          defaultProps: { size: 'small', disableRipple: true },
          styleOverrides: {
            root: {
              padding: 0,
              color: colors.text,
              '&.Mui-checked, &.MuiCheckbox-indeterminate': { color: colors.brand },
              '&:hover': { backgroundColor: 'transparent' },
              '&.Mui-focusVisible': { ...focusOutline, borderRadius: radius.sm },
              '&:hover:not(.Mui-checked):not(.Mui-disabled)': { color: colors.brand },
              '&.Mui-disabled': { ...disabledControl, color: colors.text, '&.Mui-checked': { color: colors.brand } },
            },
          },
        },
        MuiRadioGroup: {
          defaultProps: { row: true },
        },
        MuiFormGroup: {
          styleOverrides: { row: { gap: '1rem' } },
        },
        MuiFormControlLabel: {
          styleOverrides: {
            root: {
              marginLeft: 0,
              marginRight: 0,
              gap: '0.5rem',
              '&:hover .MuiRadio-root:not(.Mui-checked):not(.Mui-disabled), &:hover .MuiCheckbox-root:not(.Mui-checked):not(.Mui-disabled)':
                { color: colors.brand },
              '&.Mui-disabled': { cursor: 'not-allowed' },
            },
            label: { fontSize: typography.size.sm, '&.Mui-disabled': { color: colors.text, opacity: 0.4 } },
          },
        },
        MuiSwitch: {
          defaultProps: { disableRipple: true },
          styleOverrides: {
            root: { width: 37.5, height: 19, padding: 0, overflow: 'visible' },
            switchBase: {
              padding: 2,
              '&:hover': { backgroundColor: 'transparent' },
              '&.Mui-checked': {
                transform: 'translateX(18.5px)',
                color: '#fff',
                '& + .MuiSwitch-track': { backgroundColor: colors.brand, opacity: 1 },
                '&:hover + .MuiSwitch-track': { backgroundColor: colors.brandActive },
              },
              '&:hover + .MuiSwitch-track': { backgroundColor: scales.trueGray[50] },
              '&.Mui-focusVisible + .MuiSwitch-track': focusOutline,
              '&.Mui-disabled + .MuiSwitch-track': { opacity: 0.5 },
              '&.Mui-disabled': { cursor: 'not-allowed', color: '#fff' },
            },
            thumb: { width: 15, height: 15, boxShadow: 'none', color: '#fff' },
            track: {
              borderRadius: radius.full,
              opacity: 1,
              backgroundColor: scales.trueGray[30],
              transition: 'background-color 0.15s',
            },
          },
        },

        // ---------- Navigation ----------
        MuiTabs: {
          styleOverrides: {
            root: {
              minHeight: 'fit-content',
              backgroundColor: scales.trueGray[10],
              padding: '0 0.5rem',
              borderBottom: `2px solid ${colors.borderTabs}`,
            },
            list: { gap: '1rem' },
            indicator: { backgroundColor: colors.brand },
          },
        },
        MuiTab: {
          defaultProps: { disableRipple: true, disableFocusRipple: true },
          styleOverrides: {
            root: {
              minWidth: 'fit-content',
              minHeight: layout.tabHeight,
              padding: 0,
              textTransform: 'none',
              fontWeight: typography.weight.medium,
              fontSize: typography.size.sm,
              letterSpacing: '0.025em',
              color: 'inherit',
              textWrap: 'nowrap',
              '&:hover, &.Mui-selected': { color: colors.brand },
              '&.Mui-focusVisible': focusOutlineInset,
              '&.Mui-disabled': { ...disabledControl, opacity: 0.5, color: 'inherit' },
            },
          },
        },

        // ---------- Overlays ----------
        MuiTooltip: {
          // describeChild keeps the child's own accessible name (tooltip becomes a description).
          defaultProps: { arrow: true, placement: 'top', describeChild: true },
          styleOverrides: {
            tooltip: {
              backgroundColor: colors.text,
              color: '#fff',
              padding: '0.5rem 0.375rem',
              borderRadius: radius.sm,
              maxWidth: '24rem',
              fontSize: typography.size.sm,
              fontWeight: typography.weight.regular,
              boxShadow: shadows.popover,
            },
            arrow: { color: colors.text },
          },
        },
        MuiPopover: {
          styleOverrides: {
            paper: {
              borderRadius: 0,
              boxShadow: shadows.popover,
            },
          },
        },
        MuiBackdrop: {
          styleOverrides: { root: { '&:not(.MuiBackdrop-invisible)': { backgroundColor: colors.overlay } } },
        },
        MuiDialog: {
          styleOverrides: {
            paper: ({ theme }) => ({
              borderRadius: 0,
              width: 'calc(100% - 1rem)',
              maxWidth: layout.dialogMaxWidth,
              margin: '0.5rem',
              boxShadow: shadows.modal,
              animation: 'platform-modal-show 0.3s ease-out',
              [theme.breakpoints.up('md')]: {
                width: layout.dialogWidth,
                borderRadius: radius.sm,
                margin: '5rem 0',
              },
            }),
            paperWidthLg: ({ theme }) => ({ [theme.breakpoints.up('md')]: { width: '80%' } }),
            paperFullWidth: { width: '100%' },
          },
        },
        MuiDialogTitle: {
          styleOverrides: { root: { padding: 0, fontSize: typography.size.base, fontWeight: typography.weight.bold } },
        },
        MuiDialogContent: {
          styleOverrides: { root: { padding: '0.5rem' } },
        },
        MuiDialogActions: {
          styleOverrides: {
            root: { padding: '0.5rem', gap: '0.5rem', borderTop: `1px solid ${colors.border}`, '& > :not(style) ~ :not(style)': { marginLeft: 0 } },
          },
        },

        // ---------- Disclosure ----------
        MuiAccordion: {
          defaultProps: { disableGutters: true, square: true, elevation: 0 },
          styleOverrides: {
            root: { backgroundColor: 'transparent', '&::before': { display: 'none' } },
          },
        },
        MuiAccordionSummary: {
          styleOverrides: {
            root: {
              minHeight: 'auto',
              padding: '0.5rem',
              backgroundColor: colors.surfaceSubtle,
              borderBottom: `1px solid ${colors.borderInput}`,
              '&.Mui-expanded': { minHeight: 'auto' },
              '&.Mui-focusVisible': { ...focusOutlineInset, backgroundColor: colors.surfaceSubtle },
            },
            content: {
              margin: 0,
              fontSize: typography.size.sm,
              fontWeight: typography.weight.bold,
              '&.Mui-expanded': { margin: 0 },
            },
            expandIconWrapper: {
              color: colors.brand,
              '&.Mui-expanded': { transform: 'rotate(90deg)' },
            },
          },
        },
        MuiAccordionDetails: {
          styleOverrides: { root: { padding: '0.5rem' } },
        },

        // ---------- Data display ----------
        MuiTableCell: {
          styleOverrides: {
            root: {
              padding: '0.5rem',
              fontSize: typography.size.xs,
              lineHeight: 'inherit',
              border: `1px solid ${colors.border}`,
              color: colors.text,
            },
            head: { fontWeight: typography.weight.bold, height: '3rem', backgroundColor: colors.surfaceSubtle },
            body: { fontWeight: typography.weight.medium },
          },
        },
        MuiTableContainer: {
          styleOverrides: {
            root: { border: `1px solid ${colors.borderStrong}`, backgroundColor: colors.surface },
          },
        },
        MuiTable: {
          styleOverrides: { root: { borderCollapse: 'collapse' } },
        },
        MuiToggleButton: {
          styleOverrides: { root: { '&.Mui-focusVisible': focusOutline } },
        },
        MuiLink: {
          defaultProps: { underline: 'hover' },
          styleOverrides: { root: { color: colors.link, cursor: 'pointer', '&.Mui-focusVisible, &:focus-visible': focusOutline } },
        },
        MuiDivider: {
          styleOverrides: { root: { borderColor: colors.border } },
        },
        MuiCircularProgress: {
          defaultProps: { color: 'inherit' },
        },
        MuiPaper: {
          styleOverrides: { outlined: { borderColor: colors.borderStrong } },
        },
      },
    },
    overrides ?? {},
  );
}

export type PlatformTheme = ReturnType<typeof createPlatformTheme>;
