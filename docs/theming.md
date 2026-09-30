# Theming

Every color in the kit is a **role** (`brand`, `danger`, `surfaceApp`…) backed by a CSS variable. An app changes roles at runtime; MUI styles, Tailwind classes and `sx` values all update together, with no rebuild.

The same applies to the **appearance**: the shape, depth, surface material and font of every component. Brand colors say *whose* app it is; the appearance says *what style* it is built in. The two are independent.

- [Appearance](#appearance)
- [Brand color in one line](#brand-color-in-one-line)
- [Theme builder](#theme-builder)
- [Theme files](#theme-files)
- [Runtime themes](#runtime-themes)
- [Text size (density)](#text-size-density)
- [MUI theme overrides](#mui-theme-overrides)
- [Rules for themeable code](#rules-for-themeable-code)
- [API reference](#api-reference)

## Appearance

```tsx
<PlatformThemeProvider config={theme} appearance="glass">
```

| Appearance | Look |
| --- | --- |
| `classic` (default) | Solid surfaces, tight corners, compact shadows: the original platform look |
| `glass` | Frosted translucent panels, bars and overlays over a soft brand-tinted backdrop; capsule buttons; large rounded dialogs and menus; floating workspace sections; the system font |

Changing the appearance changes no component API and no brand color. A screen built with the kit moves to a new visual direction by changing that one value (or `appearance` in the theme file). Switching at runtime needs no rebuild, so a user setting or an A/B test can drive it.

What an appearance controls:

| Part | Roles | Used by |
| --- | --- | --- |
| `shape` (radius by role) | `control`, `field`, `overlay`, `dialog`, `panel`, `option`, `alert`, `section` | Buttons, inputs, menus/popovers/tooltips, dialogs, Card/GridView, OptionCardGroup, Alert, workspace sections |
| `shadows` | `button`, `popover`, `dropdownItem`, `modal`, `raised`, `alert`, `panel` | Same components |
| `material` | `app`, `panel`, `header`, `nav`, `overlay`, `control`, `splitter`, `filter`, `scrimFilter` | Page background, panels, tab bars, TopNav, floating layers, default buttons, resize handles, backdrop filters |
| `colors` | Any role, usually neutrals | Surfaces and borders the style needs. Colors the app passes still win |
| `fontFamily`, `workspaceGap` | | Text font; space around and between workspace sections |
| `reducedTransparency` | Material roles | Values used when the user turns on the system's *reduce transparency* setting |

Data stays readable in every appearance: grid rows, table cells and inputs keep solid surfaces; only the layers around them (panels, bars, menus, dialogs) become translucent in Glass. Glass sets solid surfaces for users with `prefers-reduced-transparency: reduce`.

### Custom appearance

Build on a built-in appearance and write only what differs. Each part merges key by key:

```ts
import { defineAppearance } from '@platform/ui';

export const productGlass = defineAppearance(
  {
    name: 'product-glass',
    shape: { control: '0.75rem', dialog: '1rem' },
    material: { filter: 'blur(12px) saturate(160%)' },
  },
  'glass', // base; default 'classic'
);

<PlatformThemeProvider config={theme} appearance={productGlass}>
```

An appearance object can also go in `theme.config.ts` (`appearance: productGlass`); `theme.json` files accept the built-in names only.

### App styles per appearance

- Use the role tokens in app code and it follows the appearance: Tailwind `rounded-panel`, `rounded-control`, `material-panel`, `material-overlay`, `shadow-(--shadow-panel)`; in `sx`, `shape.panel`, `material.overlay`, `elevation.popover`.
- Tailwind's `shadow-popover`-style utilities bake the default value in at build time. Use `shadow-(--shadow-popover)` to follow the appearance.
- The provider sets `<body data-appearance="glass">` for the rare style that must differ: `[data-appearance='glass'] .my-chart-legend { … }`.

## Brand color in one line

```tsx
<PlatformThemeProvider colors={{ brand: '#1565c0' }}>
```

Passing only `brand` is enough. These roles are derived from it:

| Role | Derived as |
| --- | --- |
| `brandHover` | `brand` lightened 15% |
| `brandActive` | `brand` darkened 25% |
| `brandDark` | `brand` darkened 40% |
| `brandSubtle` | `brand` lightened 93% (option hover background) |
| `brandSelected` | `brand` lightened 80% (selected option background) |
| `focusRing` | `brand` lightened 50% |
| `accent`, `selection` | `brand` |
| `scrollbarThumb` | `brand` at 50% opacity |

Any role you pass explicitly wins over the derived value:

```tsx
<PlatformThemeProvider colors={{ brand: '#1565c0', danger: '#c62828', surfaceApp: '#f5f7fa' }}>
```

`colors` accepts any role of [`defaultColors`](design-tokens.md#color-roles).

## Theme builder

The showcase includes a theme builder for designers and developers.

1. Run `pnpm dev` and open `/#/theme`.
2. Pick the brand color. Hover, active, subtle and focus shades are derived automatically. Turn on **Show all roles** to edit any role. Changes apply to the whole showcase immediately, so open other pages to review them. The theme survives a page reload.
3. Check the **Contrast check** table (WCAG 2.1 AA) and fix failing pairs if your product must meet AA.
4. **Export** `theme.config.ts` (or `theme.json`). The file contains only what you changed; everything else keeps the kit defaults.
5. Save the file in the app and pass it to the provider (see below).

To change the theme later, **Import** the app's file into the builder, edit, and export again.

## Theme files

```ts
// src/theme.config.ts (exported by the theme builder)
import { definePlatformTheme } from '@platform/ui';

export default definePlatformTheme({
  version: 1,
  name: 'Demo Calculator',
  colors: { brand: '#1f5f99' },
  density: 'standard',
});
```

```tsx
// src/main.tsx
import theme from './theme.config';

<PlatformThemeProvider config={theme} density={userSettings.density}>
```

Props passed directly (`colors`, `density`) override the same fields of `config`. A common pattern is a fixed brand from the theme file plus the user's text size setting.

## Runtime themes

For a theme loaded at runtime (per customer, from an API), validate it first with `parseThemeConfig`. Invalid colors are errors; unknown keys are dropped with a warning.

```ts
const result = parseThemeConfig(await fetch('/theme.json').then((r) => r.text()));
const theme = result.ok ? result.config : {}; // fall back to kit defaults on error
if (result.ok && result.warnings.length) console.warn(result.warnings);
```

## Text size (density)

| Density | Body text | Line height |
| --- | --- | --- |
| `standard` (default) | 14px | 17.5px |
| `expanded` | 16px | 24px |

The provider puts `density-standard` or `density-expanded` on `<body>`, not `<html>`, so `rem` units stay the same. Tailwind variants `standard:` and `expanded:` target each mode:

```tsx
<p className="text-xs expanded:text-sm">…</p>
```

## MUI theme overrides

```tsx
<PlatformThemeProvider overrides={{ components: { MuiTooltip: { defaultProps: { arrow: true } } } }}>
```

`overrides` is merged over the platform theme. It can be passed inline: the theme is rebuilt only when its content changes. Functions inside (for example `styleOverrides` callbacks) are compared by identity, so define them outside the component.

## Rules for themeable code

- Use `colors.*` (a CSS variable reference such as `var(--color-brand)`) or role-based Tailwind classes (`bg-brand`, `text-danger`, `border-border-input`).
- Do not write hex values in components, and do not use scale colors (`pumpkinOrange`…) for anything that should follow the brand.
- MUI's `alpha()` cannot take a CSS variable. Use `color-mix()` instead:

  ```ts
  backgroundColor: `color-mix(in srgb, ${colors.success} 15%, transparent)`
  ```

- When you need the actual hex value (for a chart library, a canvas), resolve it: `resolveColors({ brand }).brand`.

## API reference

| Export | Description |
| --- | --- |
| `PlatformThemeProvider` | Applies the theme. Props: `config`, `colors`, `density`, `appearance`, `overrides` ([details](getting-started.md#what-the-provider-does)) |
| `PlatformThemeConfig` | `{ version?: 1; name?: string; colors?: ColorConfig; density?: Density; appearance?: AppearanceName \| PlatformAppearance }` |
| `PlatformAppearance` | `{ name; label?; description?; colors?; shape?; shadows?; material?; fontFamily?; workspaceGap?; reducedTransparency? }` |
| `APPEARANCES`, `APPEARANCE_NAMES` | Built-in appearances by name (`classic`, `glass`) and their names in display order |
| `classicAppearance`, `glassAppearance` | The built-in appearance objects |
| `defineAppearance(appearance, base?)` | Builds an appearance over `base` (a name or object, default `'classic'`), merging each part key by key |
| `resolveAppearance(value?)` | A name or object to an appearance object; unknown names and `undefined` give Classic |
| `isAppearanceName(value)` | `true` for a built-in name |
| `appearanceCssVars(appearance?)` | `{ '--radius-panel': '1.25rem', '--material-filter': …, '--font-sans': … }`, defaults filled in (for setups without the provider) |
| `definePlatformTheme(config)` | Identity function that type-checks a `theme.config.ts` |
| `parseThemeConfig(input)` | Validates untrusted input (a JSON string or an object). Returns `{ ok: true, config, warnings }` or `{ ok: false, errors, warnings }` |
| `normalizeThemeConfig(config)` | Drops empty parts, so exported files contain only what changed |
| `themeConfigToJson(config)`, `themeConfigToTs(config)` | Serialize a theme file |
| `THEME_CONFIG_VERSION` | Current theme file version (`1`) |
| `COLOR_ROLES` | Every role name, in display order |
| `resolveColors(config?, base?)` | Resolved values of every role: defaults, then `base` (an appearance's colors), then shades derived from `brand`, then given values |
| `colorCssVars(values)` | `{ '--color-brand': '#a8671d', … }` for resolved values |
| `createPlatformTheme({ density?, colors?, appearance?, overrides? })` | Builds the MUI theme without the provider (for tests or custom setups) |
| `contrastRatio(fg, bg)` | WCAG contrast ratio (1–21) of two hex or `rgb()` colors, or `null` if a color cannot be parsed |
| `isValidColor(value)` | `true` for hex, `rgb()`/`rgba()` and `hsl()`/`hsla()`; named colors and `var()` are rejected |
| `parseRgb(color)` | `[r, g, b]` from a hex or `rgb()` color, else `null` |
