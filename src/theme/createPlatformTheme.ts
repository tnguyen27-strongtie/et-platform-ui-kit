import type { Shadows, ThemeOptions } from '@mui/material/styles';
import { createTheme } from '@mui/material/styles';

import type { Density } from '../tokens/tokens';
import { colors, layout, radius, scales, shadows, tokens, typography } from '../tokens/tokens';

/**
 * MUI theme reproducing the FD look. Every MUI component used by the kit gets its FD
 * styling here, so plain MUI usage (TextField, Select, Autocomplete...) also matches.
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

const brandFilled = {
  backgroundColor: colors.brand,
  color: colors.textOnBrand,
  '&:hover': { backgroundColor: colors.brandHover },
  '&:focus-visible': { backgroundColor: colors.brandActive },
  '&.Mui-disabled': { backgroundColor: colors.brandDark, color: '#fff' },
} as const;

export interface PlatformThemeOptions {
  density?: Density;
  overrides?: ThemeOptions;
}

export function createPlatformTheme({ density = 'standard', overrides }: PlatformThemeOptions = {}) {
  const { fontSize, lineHeight } = typography.density[density];

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
          main: colors.brand,
          light: colors.brandHover,
          dark: colors.brandActive,
          contrastText: colors.textOnBrand,
        },
        secondary: { main: colors.neutral, contrastText: '#fff' },
        error: { main: colors.danger },
        warning: { main: colors.warning, dark: colors.warningText },
        success: { main: colors.success, dark: colors.successStrong },
        info: { main: colors.info },
        text: { primary: colors.text, secondary: colors.textMuted },
        background: { default: colors.surfaceApp, paper: colors.surface },
        divider: colors.border,
        pumpkinOrange: scales.pumpkinOrange,
        trueGray: scales.trueGray,
        sageGreen: scales.sageGreen,
        sstOrange: scales.sstOrange,
        blue: scales.blue,
        neutral: { main: colors.neutral },
        muted: colors.borderInput,
      },
      typography: {
        fontFamily: typography.fontFamily.sans,
        fontSize,
        fontWeightLight: typography.weight.light,
        fontWeightRegular: typography.weight.regular,
        fontWeightMedium: typography.weight.medium,
        fontWeightBold: typography.weight.bold,
        body1: { fontSize: `${fontSize}px`, lineHeight: `${lineHeight}px` },
        body2: { fontSize: typography.size.sm },
        caption: { fontSize: typography.size.xs },
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
              '0%, 100%': { borderColor: scales.pumpkinOrange[50], borderWidth: '1px' },
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
              '&.Mui-disabled': {
                ...disabledControl,
                color: 'inherit',
                backgroundColor: colors.brandDark,
                '&:hover': { transform: 'none' },
              },
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
                '&.Mui-disabled': { color: '#fff' },
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
                '&.Mui-disabled': { color: colors.brandDark },
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
              '& input::selection': { backgroundColor: scales.pumpkinOrange[50] },
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
          defaultProps: { MenuProps: { slotProps: { paper: { elevation: 8 } } } },
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
            paper: { borderRadius: radius.sm, ...thinMenuScrollbar },
            list: { padding: 0, maxHeight: '24rem' },
          },
        },
        MuiMenuItem: {
          styleOverrides: {
            root: {
              padding: '0.5rem',
              gap: '0.5rem',
              minHeight: 'auto',
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
          styleOverrides: { root: { padding: 0, fontSize: typography.size.base, fontWeight: typography.weight.medium } },
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
            },
            content: {
              margin: 0,
              fontSize: typography.size.sm,
              fontWeight: typography.weight.medium,
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
      },
    },
    overrides ?? {},
  );
}

export type PlatformTheme = ReturnType<typeof createPlatformTheme>;
