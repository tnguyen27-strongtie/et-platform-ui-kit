---
name: platform-ui-theme
description: Turns a user's look-and-feel idea into a finished @platform/ui theme - investigates the idea (a named style such as Apple liquid glass, Material 3, Fluent, flat, soft or brutalist; a website, logo, screenshot or brand guide; or just mood words like "modern", "friendly", "premium"), translates it into the kit's tokens (brand colors, appearance shape, shadows, surface materials, font, density, light and dark color schemes), checks contrast and accessibility in both schemes, writes theme.config.ts (and theme.json) and previews it with before/after screenshots. Use it whenever someone asks to create, design, change or modernize a theme, style, skin, look, brand or appearance of an app built on @platform/ui, including "make it look like X", "rebrand to our new colors", "use the colors from this logo/site", "try a glass/Material/Fluent style", "add dark mode", or "give me a theme for app Y", even if they do not say "theme".
---

# Creating a theme for @platform/ui

A theme is data, not code: brand colors, an **appearance** (shape, depth, surface material, font, neutral colors) and a **color scheme** (light, dark or system) that every kit component reads from CSS variables. So the job is to understand what the user imagines, express it in the kit's vocabulary, prove it is readable, and write the file. You do not restyle components.

Reference, read when needed:
- `references/style-recipes.md`: ready token translations for common styles (glass, Material 3, Fluent 2, flat, soft, sharp, neumorphic…) and how to read a website, screenshot or logo.
- The kit's own docs: `docs/theming.md` (Appearance section) and `docs/design-tokens.md`, in the kit repo or at `node_modules/@platform/ui/docs/`.
- `scripts/theme-tool.mjs --list` prints every role, default value and built-in appearance of the installed kit. Trust it over memory; the kit evolves.

Scripts below are relative to this skill's directory (`.claude/skills/platform-ui-theme/`).

## 1. Check the setup

1. Find where you are. An **app** has `@platform/ui` in `package.json`; the **kit repository** has `src/tokens/tokens.ts`.
2. Run `node <skill>/scripts/theme-tool.mjs --list`. If it says the kit has no appearances or no color schemes, the app needs a newer `@platform/ui`; tell the user and offer what the installed version supports (a colors-only theme at least). Inside the kit repository the tool reads `dist/`, so run `pnpm build` first.
3. Read the existing theme file (`src/theme.config.ts`, `theme.json`, or the `PlatformThemeProvider` props in `main.tsx`) so you keep what the user already chose (name, density, colors they set on purpose).

## 2. Investigate the idea

Build a short **style brief** before choosing any value. Pull it from what the user gave you:

| The user gives | Do this |
| --- | --- |
| A named style ("liquid glass", "Material 3", "like Linear") | Recall its defining traits (shape language, depth, surfaces, type). If web search is available and the style is recent or you are unsure, look up its current guidelines. `references/style-recipes.md` has starting values |
| A website URL | Fetch it and read the CSS: primary/accent colors, background and surface colors, border-radius on buttons, inputs and cards, box-shadows, font-family, any `backdrop-filter` |
| A screenshot, mockup or logo | Look at the image. Estimate the brand hex from the most saturated dominant color; note corner roundness, shadows or borders, translucency, font style (geometric, humanist, rounded, mono) |
| A brand guide or hex list | Map primary → `brand`; use secondary colors only where a role fits (`accent`, `info`, `success`…) |
| Only mood words ("modern", "calm", "premium", "friendly") | Translate them with the mood table in the recipes file, then state the interpretation back |

The brief covers: brand color(s), mood in three words, shape (sharp / soft / pill), depth (flat / subtle / floating), surfaces (solid / tinted / translucent), font, density, color scheme (light only, dark, or follow the system), and constraints (WCAG AA required? mostly desktop or tablets? dense data?).

Ask the user only what you cannot infer and what changes the result, at most two or three questions, each with a recommended answer. The usual ones: the brand color when none is given, and whether WCAG AA contrast is required. If the user said to just go ahead, pick sensible values and list your assumptions in the report instead of asking.

## 3. Translate the brief into a draft

Write the draft as JSON, a temporary file outside the app's source (for example in a scratch directory):

```json
{
  "name": "Acme Calculator",
  "colors": { "brand": "#0a66c2" },
  "colorScheme": "system",
  "density": "standard",
  "appearance": {
    "name": "acme-glass",
    "base": "glass",
    "label": "Acme Glass",
    "description": "Glass with tighter corners for dense forms.",
    "shape": { "control": "0.75rem", "dialog": "1rem" },
    "material": { "filter": "blur(12px) saturate(160%)" }
  }
}
```

Rules that keep themes good:

- **Pick the base first.** Anything translucent or floating starts from `"glass"`; everything else from `"classic"`. Then write only the differences; unmentioned values inherit from the base. If a built-in appearance already matches, use its name (`"appearance": "glass"`) instead of an object.
- **Colors: brand first, little else.** Hover, active, subtle, selected and focus shades derive from `brand`. Set other roles only when the idea needs them (a tinted app background, softer borders). Neutrals that belong to the style go in `appearance.colors`; the product's brand goes in top-level `colors`.
- **Shape by role, not by size.** `control` (buttons), `field` (inputs), `overlay` (menus, popovers, tooltips; tooltips cap at 0.5rem), `dialog`, `panel` (Card, GridView), `option` (option cards), `alert`, `section` (workspace panes). A consistent shape language usually means `field` ≤ `panel` ≤ `dialog`.
- **Translucency is for the layers around data.** Panels, bars, menus and dialogs may be see-through; the kit keeps grid rows, table cells and inputs solid. Every translucent material needs a solid value in `reducedTransparency`, plus `"filter": "none"`.
- **Fonts:** the kit bundles only Inter. Another font must be a system font or be loaded by the app (an `@fontsource/*` package imported in `main.tsx`); end the stack with fallbacks.
- **Appearance name:** lowercase kebab-case, not a built-in name. It becomes `<body data-appearance>`.
- **Dark scheme:** set `"colorScheme": "dark"` or `"system"`; never make a dark theme by putting dark colors in `colors` (MUI, the neutral scale and several components would stay light). The kit adapts the light brand for dark surfaces by itself, so most themes need no `darkColors`. Add `darkColors` only for a brand guide's own dark palette or a specific surface tint, and `appearance.dark` (colors, shadows, material) when the style needs different depth or translucency in dark. A "system" theme must pass contrast in both schemes.

## 4. Check the draft

```bash
node <skill>/scripts/theme-tool.mjs draft.json
```

It validates roles and CSS values against the installed kit, resolves colors with the kit's own code (exactly like the provider), prints the WCAG contrast table for each scheme the theme uses (the same pairs as the showcase Theme builder; `--dark` also checks dark for a light-only theme) and warns about invisible blur, missing reduced-transparency values, fonts the app must load and dark colors put in the light scheme. Fix every error. For contrast failures, the message says who caused them:

- **Set by this theme:** fix it. Darken a light brand until `textOnBrand` on `brand` reaches 4.5:1, or set `textOnBrand` to a dark color for light brands (yellow, lime, cyan).
- **Comes from the appearance colors:** override that role in your draft if the product must meet AA.
- **Kit default:** not caused by you; mention it, and fix it in the theme only when the user needs AA.

Use `--strict` when the user requires AA: then any failure the theme or appearance causes is an error.

## 5. Preview

Write the theme file first (step 6, or `--write` to a scratch path while iterating), then preview it with the **real provider**:

```bash
node <skill>/scripts/theme-tool.mjs draft.json --write /tmp/theme.config.ts --force
node <skill>/scripts/preview.mjs --theme /tmp/theme.config.ts --out theme-preview [--mobile]   # screenshots
node <skill>/scripts/preview.mjs --theme /tmp/theme.config.ts --serve                          # the user opens it
```

Run it from the project root (the app or the kit repository). It writes a temporary sampler page (`theme-preview-<port>.tmp/`, one per run: a calculator workspace and a gallery of buttons, fields, choices, option cards, tabs, alerts, overlays and a table) rendered by `PlatformThemeProvider` with the theme file, serves it with the project's own Vite, and removes the folder when it stops. Screenshot mode saves `workspace-light`, `components-light`, `workspace-dark`, `components-dark`. With `--serve` it prints the URLs and keeps running (run it in the background and give the user the link); the top bar switches page and color scheme. Look at every shot and judge it against the brief. Typical fixes: blur invisible (backdrop too plain: add color to `material.app`), panels muddy (raise the surface percentage), text hard to read on glass (lower transparency or add a solid `colors.surface`), shape inconsistent (align `field`/`panel`/`dialog`).

To see the theme on the **app's own screens**, use the injected-CSS mode: it needs no theme file and no code change, but colors MUI computes from its palette (input text, some icons, `Chip color="primary"`) keep the old values, which can look like contrast bugs in dark. Confirm anything suspicious with the real-provider mode.

```bash
node <skill>/scripts/theme-tool.mjs draft.json --css preview.css [--scheme dark]
node <skill>/scripts/preview.mjs --url http://localhost:5173 --css preview.css --out theme-preview \
  --paths "/,/#/some-screen" --appearance acme-glass [--scheme dark] [--mobile] [--clear-storage]
```

Start the app first (`pnpm dev`, in the background). In the kit repository the showcase's useful paths are `/#/forms`, `/#/overlays`, `/#/data`, `/#workspace`; pass `--clear-storage` so a saved showcase theme does not interfere.

Fonts the app has not installed show the fallback in both modes. If Playwright is not installed, use `--serve` and let the user look; without Vite, give the user the `--css` file to paste into the browser devtools.

## 6. Write the theme files

```bash
node <skill>/scripts/theme-tool.mjs draft.json --write src/theme.config.ts [--json public/theme.json] [--force]
```

- `--write` produces a typed `theme.config.ts` (`definePlatformTheme`, plus `defineAppearance` for a custom appearance). It refuses to overwrite an existing file; read that file first, carry over anything the draft should keep, then pass `--force`.
- `--json` writes a `theme.json` for themes loaded at runtime (per customer, from an API). JSON files accept built-in appearance names only; a custom appearance needs the `.ts` file.
- Wire it once if the app does not yet: `import theme from './theme.config'` and `<PlatformThemeProvider config={theme}>` in `main.tsx`. A user's density setting still overrides it: `density={userSettings.density}`.
- If the theme needs a font, add the `@fontsource` package and its import in `main.tsx`.
- Run the app's typecheck (`pnpm typecheck` or `tsc`) to confirm the file compiles against the installed kit.

In the **kit repository**, a theme for a specific app does not belong in the kit: write it to the location the user names, or hand over the file. A new **built-in** appearance for every app is a kit change: follow the `platform-ui-component` skill (add it to `APPEARANCES` and the theme-file name list in `themeConfig.ts`, unit tests, showcase, docs, changelog).

## 7. Report

Tell the user, briefly:

1. The brief as you understood it, and assumptions you made.
2. How the idea maps to the theme: a small table (idea → token → value), e.g. "floating panels → base glass, workspaceGap 0.5rem".
3. Files written and how the app loads them.
4. Contrast results: what passes, what fails and who causes it.
5. What the kit cannot express yet, honestly. A theme changes shape, depth, surfaces, font, colors and the color scheme; it cannot change layout or component structure, animation, icon style, the type scale (only font family and density) or true refraction ("liquid" lensing; glass is an approximation with blur and saturation). Each of those is a kit change. If the app's own code uses fixed colors, say that those parts will not follow the theme and point to `audit-styles.mjs` in the `platform-ui-app` skill.
6. Where the screenshots are, or what you did not verify.
