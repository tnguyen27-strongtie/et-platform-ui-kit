# Design tokens

All design values live in one file, `src/tokens/tokens.ts`. The MUI theme and the Tailwind theme (`tokens.generated.css`) are both generated from it, so the three always agree.

```ts
import { colors, defaultColors, layout, radius, tokens } from '@platform/ui';
// or, without React: import { tokens } from '@platform/ui/tokens';
```

- [Color roles](#color-roles)
- [Color scales](#color-scales)
- [Typography](#typography)
- [Radius, shadows, spacing](#radius-shadows-spacing)
- [Breakpoints and layout](#breakpoints-and-layout)
- [Z-index and motion](#z-index-and-motion)
- [Using tokens in Tailwind](#using-tokens-in-tailwind)
- [Using tokens in MUI](#using-tokens-in-mui)

## Color roles

Components use colors by **role**, never by value. Each role has three forms:

| Export | Example | Use for |
| --- | --- | --- |
| `colors` | `colors.brand` → `'var(--color-brand)'` | Styles in components and `sx`. Follows the app theme |
| `defaultColors` | `defaultColors.brand` → `'#a8671d'` | The kit's default value |
| `colorVar(role)` | `colorVar('brand')` → `'--color-brand'` | The CSS variable name |

For the value after the app's theme is applied, use `resolveSchemeColors(scheme, { colors, darkColors })` ([Theming](theming.md#api-reference)). The dark scheme's defaults are in `defaultDarkColors` ([Color scheme](theming.md#color-scheme-dark-mode)); `darkTrueGray` is the reversed neutral scale it uses.

| Role | Default | Used for |
| --- | --- | --- |
| `brand` | `#a8671d` | Primary buttons, checked radios and switches, selected tabs |
| `brandHover` / `brandActive` / `brandDark` | `#d38225` / `#7a4b16` / `#623c11` | Brand interaction states |
| `brandSubtle` / `brandSelected` | `#fcf3e9` / `#f7dec1` | Option background on hover / when selected |
| `focusRing` | `#f0c18c` | Input focus ring |
| `accent` | `#b26d1f` | Accents: help bubble, top nav underline, selected option card, toast actions |
| `selection` | `#ff5308` | Text selection |
| `text` / `textMuted` / `textNav` / `textOnBrand` | `#343434` / `#686868` / `#757575` / `#f4f4f4` | Body text, secondary text, navigation labels, text on brand |
| `textStrong` / `textOnColor` | `#000000` / `#ffffff` | Strongest text (default and text buttons, select arrows); text on filled status and neutral colors (danger and secondary buttons, badges) |
| `surface` / `surfaceApp` / `surfaceSubtle` | `#ffffff` / `#f4f4f4` / `#fafafa` | Panels, app background, headers |
| `surfaceDisabled` / `surfaceHover` | `#f5f5f5` / `#f5f5f5` | Disabled fields, row hover |
| `border` / `borderInput` / `borderStrong` / `borderTabs` | `#f0f0f0` / `#d9d9d9` / `#cacaca` / `#cacaca` | Dividers, inputs, card and table outlines, tab bars |
| `danger` / `warning` / `warningText` | `#b32c06` / `#db9f24` / `#945b1a` | Errors, warnings, warning text with enough contrast |
| `success` / `successStrong` / `info` / `neutral` | `#789048` / `#216e4e` / `#4e7296` / `#737373` | Status colors |
| `link` | `#1890ff` | Links |
| `scrollbarThumb` / `scrollbarThumbMenu` / `overlay` | brand 50% / `#6b7280` / black 50% | Scrollbars, dialog backdrop |

## Color scales

Full scales are available for illustrations and charts: `pumpkinOrange`, `trueGray`, `sstOrange`, `sageGreen` and `blue`, each with steps `0, 10, 20 … 100` plus `base`.

```ts
import { scales } from '@platform/ui';
scales.trueGray[20]; // '#cacaca'
```

Scale colors do not follow the app theme. Use roles for anything that should change with the brand.

## Typography

| Token | Value |
| --- | --- |
| `typography.fontFamily.sans` | Inter (variable, weights 100–900), then system fonts |
| `typography.fontFamily.serif` | `'Clarendon', Georgia, serif` (local fonts only) |
| `typography.fontFamily.math` | STIX Two Math (bundled), then Cambria Math, Latin Modern Math, the `math` generic family |
| `typography.size` | `xs` 0.75rem (labels, errors, table cells), `sm` 0.875rem (inputs, tabs, menus), `base` 1rem (buttons, dialog titles), `lg` 1.125rem (alert titles) |
| `typography.weight` | `light` 300, `regular` 400, `medium` 500, `bold` 700, `heavy` 800 |
| `typography.density` | `standard` 14px / 17.5px, `expanded` 16px / 24px |

### Math formulas

Write formulas as MathML. Every `<math>` element uses STIX Two Math (SIL OFL 1.1), which the kit bundles; its OpenType MATH table lets the browser stretch radicals, brackets and big operators and lay out fractions. For symbols inside ordinary text, use the `font-math` class (Tailwind utility from the `--font-math` token).

```tsx
<math display="block">
  <mi>M</mi><mo>=</mo>
  <mfrac><mrow><mi>w</mi><msup><mi>L</mi><mn>2</mn></msup></mrow><mn>8</mn></mfrac>
</math>

<span className="font-math">σ ≤ 0.6 F<sub>y</sub></span>
```

For variables in labels (S<sub>DS</sub>), use `MathVar` and `MathSub` (see [Math notation](components.md#math-notation)); they also work as elements in translation components.

The font file (about 400 KB) is downloaded only by pages that show math. Apps copy no files.

React renders MathML, but `@types/react` does not declare its tags yet, so TypeScript reports `Property 'math' does not exist on type 'JSX.IntrinsicElements'`. Declare the tags you use once in the app, for example `src/mathml.d.ts`:

```ts
import 'react';

type MathMLProps = React.HTMLAttributes<HTMLElement> & { display?: 'block' | 'inline' };

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      math: MathMLProps; mrow: MathMLProps; mi: MathMLProps; mn: MathMLProps; mo: MathMLProps;
      mfrac: MathMLProps; msqrt: MathMLProps; msub: MathMLProps; msup: MathMLProps;
    }
  }
}
```

Headings `h1`–`h6` in MUI `Typography` use a compact scale for tool apps (24px down to 12px), not MUI's default 96px scale.

## Radius, shadows, spacing

| Token | Values |
| --- | --- |
| `radius` | `none` 0, `sm` 0.125rem (inputs, menus, dialogs, tooltips), `md` 0.25rem (buttons), `lg` 0.5rem (option cards), `xl` 1rem (alerts), `full` |
| `shadows` | Default values of `popover`, `dropdownItem`, `modal`, `button`, `raised`, `alert`, `panel` (`none`). `defaultDarkShadows` holds the dark scheme's |
| `elevation` | The same shadows as CSS variable references (`var(--shadow-popover)`): they follow the [appearance](theming.md#appearance) and the dark scheme. The value lives in `--elevation-*` (`elevationVar`), and `--shadow-*` points at it, so Tailwind `shadow-popover` follows too |
| `defaultShape` / `shape` | Radius by role, default values / `var(--radius-*)` references: `control` 0.25rem (buttons), `field` 0.125rem (inputs), `overlay` 0.125rem (menus, popovers, tooltips), `dialog` 0.125rem, `panel` 0.125rem (Card, GridView), `option` 0.5rem (option cards), `alert` 1rem, `section` 0 (workspace sections) |
| `defaultMaterial` / `material` | Surface materials, default values / `var(--material-*)` references: `app`, `panel`, `header`, `nav`, `overlay`, `control`, `splitter`, `canvas` (backgrounds; `canvas` is the white drawing surface) and `filter`, `scrimFilter` (backdrop filters, `none` by default). `defaultDarkMaterial` holds the dark scheme's differences |
| `shapeVar`, `shadowVar`, `elevationVar`, `materialVar` | CSS variable names, e.g. `shapeVar('panel')` = `--radius-panel` |
| `spacingUnit` | `4` (px). `theme.spacing(2)` and Tailwind `p-2` are both 0.5rem |

Components use the role tokens (`shape`, `elevation`, `material`), not the size steps in `radius`, so an appearance can round a button differently from a dialog.

## Breakpoints and layout

| Token | Values |
| --- | --- |
| `breakpoints` | `xs` 0, `sm` 640, `md` 768, `lg` 992, `xl` 1280 (px) |
| `layout.topNavHeight` | 54px |
| `layout.inputHeight` / `layout.tabHeight` | 40px / 48px |
| `layout.dialogWidth` / `layout.dialogMaxWidth` | 572px / 1536px |
| `layout.menuMinWidth` / `layout.menuMaxWidth` | 160px / 320px (every action menu) |
| `layout.menuItemMinHeight` / `layout.menuItemMinHeightTouch` | 36px / 48px (touch target size on coarse pointers) |
| `layout.workspaceGap` | `0px` (`--workspace-gap`; Glass uses 0.5rem) |

## Z-index and motion

| Token | Values |
| --- | --- |
| `zIndex` | `popper` 1, `editTemplate` 2, `drawerBackdrop` 51, `drawer` 52, `topNavMenu` 100, `topNav` 101, `eula` 102, `dropdown` 1050 |
| `motion` | `fast` 150ms, `base` 200ms, `slow` 300ms, `easing` ease-out |

## Using tokens in Tailwind

Tokens become Tailwind theme values with kebab-case names:

```tsx
<div className="bg-surface-app text-text border border-border-input rounded-panel shadow-popover" />
<span className="text-danger bg-pumpkin-orange-10" />
<header className="z-(--z-top-nav) h-(--top-nav-height)" />
```

The stylesheet also defines:

| Utility or variant | Effect |
| --- | --- |
| `standard:` / `expanded:` | Styles for one text size setting |
| `icon:` | Styles MUI icons inside an element, e.g. `icon:text-brand` |
| `flex-center` | `display: flex` centered on both axes |
| `no-scrollbar` | Hides the scrollbar, keeps scrolling |
| `material-panel`, `material-overlay`, `material-nav`, `material-header`, `material-app` | Background (and backdrop filter) of the appearance's material |
| `rounded-control`, `rounded-field`, `rounded-overlay`, `rounded-dialog`, `rounded-panel`, `rounded-option`, `rounded-alert`, `rounded-section` | Radius by role |
| `animate-modal-show`, `animate-loading-pulse`, `animate-border-highlight`, `animate-jump` | Kit animations |

## Using tokens in MUI

- `theme.palette.primary.main` is the resolved `brand` value (a hex, after the app's config is applied).
- Scales are on the palette: `theme.palette.pumpkinOrange[50]`, `theme.palette.trueGray[20]`…
- Every token is on `theme.tokens`.
- `theme.spacing` uses 4px steps like Tailwind: `sx={{ p: 2 }}` is 0.5rem.

```tsx
<Box sx={{ color: colors.textMuted, p: 2, borderRadius: radius.sm }} />
```
