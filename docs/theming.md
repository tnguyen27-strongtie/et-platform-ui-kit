# Theming

Every color in the kit is a **role** (`brand`, `danger`, `surfaceApp`…) backed by a CSS variable. An app changes roles at runtime; MUI styles, Tailwind classes and `sx` values all update together, with no rebuild.

- [Brand color in one line](#brand-color-in-one-line)
- [Theme builder](#theme-builder)
- [Theme files](#theme-files)
- [Runtime themes](#runtime-themes)
- [Text size (density)](#text-size-density)
- [MUI theme overrides](#mui-theme-overrides)
- [Rules for themeable code](#rules-for-themeable-code)
- [API reference](#api-reference)

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
| `PlatformThemeProvider` | Applies the theme. Props: `config`, `colors`, `density`, `overrides` ([details](getting-started.md#what-the-provider-does)) |
| `PlatformThemeConfig` | `{ version?: 1; name?: string; colors?: ColorConfig; density?: Density }`, plain JSON |
| `definePlatformTheme(config)` | Identity function that type-checks a `theme.config.ts` |
| `parseThemeConfig(input)` | Validates untrusted input (a JSON string or an object). Returns `{ ok: true, config, warnings }` or `{ ok: false, errors, warnings }` |
| `normalizeThemeConfig(config)` | Drops empty parts, so exported files contain only what changed |
| `themeConfigToJson(config)`, `themeConfigToTs(config)` | Serialize a theme file |
| `THEME_CONFIG_VERSION` | Current theme file version (`1`) |
| `COLOR_ROLES` | Every role name, in display order |
| `resolveColors(config?)` | Resolved hex values of every role: defaults, then derived shades, then given values |
| `colorCssVars(values)` | `{ '--color-brand': '#a8671d', … }` for resolved values |
| `createPlatformTheme({ density?, colors?, overrides? })` | Builds the MUI theme without the provider (for tests or custom setups) |
| `contrastRatio(fg, bg)` | WCAG contrast ratio (1–21) of two hex or `rgb()` colors, or `null` if a color cannot be parsed |
| `isValidColor(value)` | `true` for hex, `rgb()`/`rgba()` and `hsl()`/`hsla()`; named colors and `var()` are rejected |
| `parseRgb(color)` | `[r, g, b]` from a hex or `rgb()` color, else `null` |
