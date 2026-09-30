# Style recipes

Starting points that turn a style idea into a theme draft. Each recipe is a valid `appearance` object for `theme-tool.mjs`; adjust it to the brief, then check and preview. Values reflect the kit's roles:

- `shape`: `control` buttons · `field` inputs · `overlay` menus, popovers, tooltips · `dialog` · `panel` Card, GridView · `option` option cards · `alert` · `section` workspace panes
- `shadows`: `button` · `popover` · `dropdownItem` hovered menu row · `modal` · `raised` hovered option card · `alert` · `panel` resting panels
- `material`: `app` page background · `panel` · `header` tab bars · `nav` top bar · `overlay` menus and dialogs · `control` default buttons · `splitter` workspace resize handles · `filter` / `scrimFilter` backdrop filters

Contents: [Reading a source](#reading-a-source) · [Mood words](#mood-words) · [Classic](#classic-the-platform-default) · [Glass](#glass-apple-liquid-glass-visionos) · [Material 3](#material-3) · [Fluent 2](#fluent-2) · [Flat minimal](#flat-minimal-enterprise-saas) · [Soft friendly](#soft-and-friendly) · [Sharp technical](#sharp-technical-brutalist) · [Neumorphic](#neumorphic-soft-ui) · [Brand color](#choosing-and-fixing-the-brand-color)

## Reading a source

**Website.** Fetch the page and its main stylesheet. Look for CSS custom properties first (`--primary`, `--brand`, `--radius`, `--shadow-*`), then the computed look of: the primary button (background → `brand`, radius → `shape.control`), text inputs (radius → `field`, border color → `borderInput`), cards (radius → `panel`, shadow → `shadows.panel`, border → `borderStrong`), the page background (→ `surfaceApp` or `material.app`), modals (radius → `dialog`, shadow → `modal`), `font-family` of body text, and any `backdrop-filter` (→ translucency, base `glass`).

**Screenshot or mockup.** Estimate rather than guess precisely: radius as a fraction of the element height (a 40px button with fully round ends = `9999px`; slightly rounded ≈ 6–8px), shadows as none / hairline / soft / floating, surfaces as solid or see-through, font as geometric (Inter, Manrope), humanist (Segoe, Source Sans), rounded (Nunito) or grotesk (Helvetica, Arial). Say in the report that the values are estimates.

**Logo.** Only the brand color comes from a logo. Pick the most saturated color that covers a large area; ignore black, white and gray. Then check it (see [Brand color](#choosing-and-fixing-the-brand-color)).

## Mood words

| Word | Usually means |
| --- | --- |
| modern, clean | Medium radii (0.5–0.75rem), soft low shadows or none, generous surfaces, system or geometric font |
| premium, elegant | Restrained brand, subtle depth, larger dialogs radius, translucency in moderation, tight neutral palette |
| friendly, approachable | Large radii, pill buttons, soft colored shadows, rounded font |
| calm, focused | Low contrast neutrals (but text still AA), few shadows, tinted app background |
| technical, precise, engineering | Small or zero radii, borders instead of shadows, compact density, mono or grotesk font |
| bold, energetic | Saturated brand, high contrast, hard shadows or none, heavier weights |
| light, airy | Translucency, pale tinted backdrop, low shadows |
| like Apple / iOS | Glass recipe |
| like Google / Android | Material 3 recipe |
| like Microsoft / Windows / Office | Fluent 2 recipe |

## Classic (the platform default)

The existing look; nothing to set. `"appearance": "classic"` or leave it out. Values: control 0.25rem, others 0.125rem, option 0.5rem, alert 1rem, section 0; compact shadows; solid surfaces; Inter.

## Glass (Apple liquid glass, visionOS)

Built in: `"appearance": "glass"`. Frosted panels and bars over a brand-tinted backdrop, pill buttons, big rounded dialogs, floating workspace panes, system font. Variations:

```json
{ "name": "glass-dense", "base": "glass",
  "shape": { "control": "0.75rem", "field": "0.5rem", "panel": "0.875rem", "dialog": "1.25rem" },
  "material": { "filter": "blur(16px) saturate(160%)" } }
```

- Dense forms (many inputs): smaller radii as above; pills get cramped next to compact inputs.
- Busy data screens: raise solidity, e.g. `"panel": "color-mix(in srgb, var(--color-surface) 80%, transparent)"`.
- Stronger "liquid" feel: brighter backdrop in `material.app` (raise the `color-mix` percentages) and a stronger edge highlight in `shadows.panel` (`inset 0 1px 0 rgba(255,255,255,.9)`).
- True lensing/refraction is not possible with CSS backdrop filters; say so if the user expects it.

## Material 3

Base `classic`. Tonal surfaces derived from the brand, full-pill buttons, 4px fields, 28dp dialogs, 12dp cards, Roboto.

```json
{ "name": "material", "base": "classic", "label": "Material",
  "description": "Tonal surfaces, pill buttons, rounded cards and dialogs.",
  "colors": { "border": "#e0e2ec", "borderInput": "#74777f", "borderStrong": "#c4c6d0", "borderTabs": "#c4c6d0" },
  "shape": { "control": "9999px", "field": "0.25rem", "overlay": "0.25rem", "dialog": "1.75rem",
             "panel": "0.75rem", "option": "0.75rem", "alert": "0.75rem" },
  "shadows": {
    "button": "none",
    "popover": "0 1px 2px rgba(0,0,0,.3), 0 2px 6px 2px rgba(0,0,0,.15)",
    "dropdownItem": "none",
    "modal": "0 4px 8px 3px rgba(0,0,0,.15), 0 1px 3px rgba(0,0,0,.3)",
    "raised": "0 1px 2px rgba(0,0,0,.3), 0 1px 3px 1px rgba(0,0,0,.15)",
    "panel": "none" },
  "material": {
    "app": "color-mix(in srgb, var(--color-brand) 4%, var(--color-surface))",
    "header": "color-mix(in srgb, var(--color-brand) 8%, var(--color-surface))",
    "nav": "color-mix(in srgb, var(--color-brand) 6%, var(--color-surface))",
    "overlay": "color-mix(in srgb, var(--color-brand) 5%, var(--color-surface))" },
  "fontFamily": "Roboto, system-ui, -apple-system, 'Segoe UI', Arial, sans-serif" }
```

Roboto must be loaded by the app (`@fontsource/roboto`, weights 400/500/700). `borderInput` `#74777f` meets 3:1, as Material's outline color does.

## Fluent 2

Base `classic`. Small consistent radii, layered neutral shadows, acrylic (translucent, blurred) flyouts only, Segoe UI.

```json
{ "name": "fluent", "base": "classic", "label": "Fluent",
  "description": "Small radii, layered shadows, acrylic menus and dialogs.",
  "colors": { "surfaceApp": "#f5f5f5", "border": "#e0e0e0", "borderInput": "#8a8a8a", "borderStrong": "#d1d1d1" },
  "shape": { "control": "0.25rem", "field": "0.25rem", "overlay": "0.5rem", "dialog": "0.5rem",
             "panel": "0.5rem", "option": "0.5rem", "alert": "0.5rem" },
  "shadows": {
    "button": "none",
    "popover": "0 0 2px rgba(0,0,0,.12), 0 8px 16px rgba(0,0,0,.14)",
    "modal": "0 0 8px rgba(0,0,0,.12), 0 32px 64px rgba(0,0,0,.14)",
    "raised": "0 0 2px rgba(0,0,0,.12), 0 4px 8px rgba(0,0,0,.14)",
    "panel": "0 0 2px rgba(0,0,0,.12), 0 2px 4px rgba(0,0,0,.14)" },
  "material": {
    "overlay": "color-mix(in srgb, var(--color-surface) 85%, transparent)",
    "filter": "blur(30px) saturate(125%)" },
  "reducedTransparency": { "overlay": "var(--color-surface)", "filter": "none" },
  "fontFamily": "'Segoe UI Variable', 'Segoe UI', system-ui, -apple-system, Roboto, Arial, sans-serif" }
```

`filter` applies to every material that uses it; with only `overlay` translucent, the blur shows on menus and dialogs only.

## Flat minimal (enterprise SaaS)

Base `classic`. Borders carry structure, no shadows, one medium radius everywhere.

```json
{ "name": "flat", "base": "classic", "label": "Flat",
  "description": "Borders instead of shadows, one medium radius.",
  "colors": { "surfaceApp": "#f7f7f8", "borderInput": "#8c8c8c" },
  "shape": { "control": "0.375rem", "field": "0.375rem", "overlay": "0.375rem", "dialog": "0.5rem",
             "panel": "0.5rem", "option": "0.5rem", "alert": "0.5rem" },
  "shadows": { "button": "none", "popover": "0 0 0 1px rgba(0,0,0,.12)", "dropdownItem": "none",
               "modal": "0 0 0 1px rgba(0,0,0,.12), 0 16px 32px rgba(0,0,0,.08)", "raised": "0 0 0 1px rgba(0,0,0,.2)",
               "alert": "none", "panel": "none" },
  "material": { "header": "var(--color-surface)", "nav": "var(--color-surface)" } }
```

## Soft and friendly

Base `classic` (or `glass` for airy). Large radii, pill buttons, soft brand-tinted shadows, rounded font.

```json
{ "name": "soft", "base": "classic", "label": "Soft",
  "description": "Large rounded shapes, pill buttons and soft tinted shadows.",
  "colors": { "surfaceApp": "#f6f5fb", "border": "#ecebf3", "borderStrong": "#e2e0ec", "borderInput": "#8b89a0" },
  "shape": { "control": "9999px", "field": "0.75rem", "overlay": "0.875rem", "dialog": "1.5rem",
             "panel": "1rem", "option": "1rem", "alert": "1rem", "section": "1rem" },
  "shadows": {
    "button": "0 2px 6px color-mix(in srgb, var(--color-brand) 18%, transparent)",
    "popover": "0 8px 24px color-mix(in srgb, var(--color-brand) 14%, transparent)",
    "modal": "0 24px 48px color-mix(in srgb, var(--color-brand) 18%, transparent)",
    "raised": "0 8px 20px color-mix(in srgb, var(--color-brand) 16%, transparent)",
    "panel": "0 4px 16px color-mix(in srgb, var(--color-brand) 8%, transparent)" },
  "material": { "header": "var(--color-surface-subtle)", "splitter": "transparent" },
  "workspaceGap": "0.5rem",
  "fontFamily": "Nunito, system-ui, -apple-system, 'Segoe UI', Roboto, Arial, sans-serif" }
```

Nunito must be loaded (`@fontsource-variable/nunito`).

## Sharp technical (brutalist)

Base `classic`. Zero radii, strong borders, hard offset shadows, grotesk or mono font. Good for engineering tools that want to feel exact.

```json
{ "name": "sharp", "base": "classic", "label": "Sharp",
  "description": "Square corners, strong borders and hard shadows.",
  "colors": { "border": "#d0d0d0", "borderInput": "#1d1d1d", "borderStrong": "#1d1d1d", "borderTabs": "#1d1d1d" },
  "shape": { "control": "0", "field": "0", "overlay": "0", "dialog": "0", "panel": "0", "option": "0", "alert": "0" },
  "shadows": { "button": "2px 2px 0 #1d1d1d", "popover": "4px 4px 0 #1d1d1d", "dropdownItem": "none",
               "modal": "8px 8px 0 #1d1d1d", "raised": "4px 4px 0 #1d1d1d", "alert": "4px 4px 0 #1d1d1d", "panel": "none" },
  "material": { "header": "var(--color-surface)", "nav": "var(--color-surface)" },
  "fontFamily": "'Helvetica Neue', Arial, system-ui, sans-serif" }
```

## Neumorphic (soft UI)

Warn first: extruded shapes on same-colored backgrounds have very low contrast between controls and their surroundings and usually fail WCAG 1.4.11. Offer this accessible variant, which keeps borders:

```json
{ "name": "neo", "base": "classic", "label": "Neo",
  "description": "Soft extruded surfaces, with borders kept for accessibility.",
  "colors": { "surfaceApp": "#e9edf2", "surface": "#eef1f5", "surfaceSubtle": "#e9edf2", "borderInput": "#737d8c", "link": "#0b57d0" },
  "shape": { "control": "0.75rem", "field": "0.75rem", "overlay": "0.75rem", "dialog": "1.25rem",
             "panel": "1rem", "option": "1rem", "alert": "1rem" },
  "shadows": { "button": "3px 3px 6px #c5ccd6, -3px -3px 6px #ffffff",
               "raised": "6px 6px 12px #c5ccd6, -6px -6px 12px #ffffff",
               "panel": "8px 8px 16px #c5ccd6, -8px -8px 16px #ffffff",
               "popover": "8px 8px 20px #bcc4cf", "modal": "16px 16px 40px #b5bdc9" },
  "material": { "header": "var(--color-surface)", "nav": "var(--color-surface-app)", "control": "var(--color-surface)" } }
```

## Dark scheme

Every recipe works in dark with no extra values: the kit switches to its dark colors and adapts the brand. Add values only where the style has its own dark character:

- **Glass** already has `dark` values (darker translucent layers, faint highlights).
- **Material 3 dark:** tonal dark surfaces tinted by the brand:
  `"dark": { "material": { "app": "color-mix(in srgb, var(--color-brand) 6%, #111318)", "header": "color-mix(in srgb, var(--color-brand) 10%, var(--color-surface))", "nav": "color-mix(in srgb, var(--color-brand) 8%, var(--color-surface))" } }`
- **Fluent dark:** `"dark": { "colors": { "surfaceApp": "#1f1f1f", "surface": "#292929", "border": "#3d3d3d", "borderInput": "#7a7a7a" } }` (Fluent's neutral dark ramp).
- **Sharp / brutalist dark:** hard shadows need a light offset color in dark: `"dark": { "shadows": { "popover": "4px 4px 0 #e8e8e8", "modal": "8px 8px 0 #e8e8e8", "button": "2px 2px 0 #e8e8e8" }, "colors": { "borderInput": "#e8e8e8", "borderStrong": "#e8e8e8" } }`.
- **Soft:** tinted shadows get lost on dark; use `"dark": { "shadows": { "panel": "0 4px 16px rgba(0,0,0,.4)" } }`.
- **Neumorphic:** extruded shadows do not work on dark surfaces at all; recommend light only (`"colorScheme": "light"`) or a separate flat dark style.

A brand guide with its own dark palette goes in `darkColors` (`brand`, `surface`, `surfaceApp`…). Keep `danger`/`warning`/`success` from the kit unless the guide defines dark versions; the kit's are tuned for dark text on filled buttons.

## Choosing and fixing the brand color

- The brand fills primary buttons with `textOnBrand` (near white by default). Check "Primary button text" in the contrast table; it needs 4.5:1.
- Light brands (yellow, lime, light cyan, pastel): either darken the brand for UI use (keep the logo color for the logo), or set `"textOnBrand": "#1d1d1d"`. Prefer darkening when the product must look like the brand guide's buttons; prefer dark text when the brand color itself must appear.
- Very dark brands (navy, near black): fine for buttons; check "Focus ring, checked controls" (brand on surface, 3:1) and that `brandSelected` (brand lightened 80%) is still distinguishable from the surface.
- Two brand colors: the one used for actions becomes `brand`; the other can be `accent` (selected tab underline, top nav border, loading) if it passes 3:1 on the surface.
- Status colors (`danger`, `warning`, `success`, `info`) stay unless the brand guide defines them; users read them by convention.
