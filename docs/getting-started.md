# Getting started

- [Installation](#installation)
- [Peer dependencies](#peer-dependencies)
- [Setup](#setup)
- [What the provider does](#what-the-provider-does)
- [Imports](#imports)
- [The showcase](#the-showcase)
- [Working with AI agents](#working-with-ai-agents)

## Installation

The package is named `@platform/ui`. It is marked `"private": true` so it can never be published to the public npm registry by mistake. Pick one of three ways to install it:

| Method | In the kit | In the app | Use when |
| --- | --- | --- | --- |
| Tarball | `npm pack`, or download it from the GitHub Release (tagged versions) or the CI run's artifacts (any commit) | `npm install ./path/platform-ui-0.12.1.tgz` | The app lives in another repository and you want a pinned version |
| Local link | `npm run build` | `npm install ../et-platform-ui-kit` | You change the kit and the app at the same time |
| Internal registry | Remove `private`, add `publishConfig.registry`, `npm publish` | `npm install @platform/ui` | Several teams share the kit |

> Bump `version` in the kit's `package.json` before packing a new tarball. An app tells tarballs apart by version, so it could otherwise keep the old build.

## Peer dependencies

The kit does not bundle React, MUI or Emotion. The app installs them, so the whole app runs a single copy of each.

```bash
npm install react react-dom @mui/material @mui/icons-material @emotion/react @emotion/styled
npm install -D tailwindcss @tailwindcss/vite @vitejs/plugin-react vite
```

| Package | Range |
| --- | --- |
| `react`, `react-dom` | `^19.3.0` |
| `@mui/material`, `@mui/icons-material` | `^9.4.0` |
| `@emotion/react`, `@emotion/styled` | `^11.14.0` |
| `tailwindcss` | `^4.3.0` |

Ranges use `^`, so minor and patch upgrades in the app do not raise peer warnings.

Bundled dependencies: `@tanstack/react-table` (GridView state), `react-resizable-panels` (workspace layout), `react-toastify` (toasts), `clsx`, `tailwind-merge`, `@fontsource-variable/inter` (text font) and `@fontsource/stix-two-math` (math font).

## Setup

### 1. Stylesheet and provider

```tsx
// main.tsx
import '@platform/ui/theme.css';
import { PlatformThemeProvider, ToastHost } from '@platform/ui';

createRoot(document.getElementById('root')!).render(
  <PlatformThemeProvider density={settings.density}>
    <App />
    <ToastHost />
  </PlatformThemeProvider>,
);
```

Import `theme.css` once, in the app entry. Mount `ToastHost` once, in the app shell.

### 2. Vite and Tailwind

```ts
// vite.config.ts
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({ plugins: [react(), tailwindcss()] });
```

`theme.css` declares `@source` for the kit's own files, so Tailwind finds the kit's classes whether you use the kit from source or from the installed package. The app does not need to add an `@source` for it.

### 3. Theme (optional)

```tsx
import theme from './theme.config'; // exported from the theme builder

<PlatformThemeProvider config={theme}>
```

See [Theming](theming.md).

## What the provider does

`PlatformThemeProvider`:

1. Enables CSS cascade layers, so Tailwind utilities override MUI styles without `!important`. Layer order: `theme, base, mui, components, utilities`.
2. Provides the MUI theme and `CssBaseline`.
3. Writes the color variables (`--color-*`) for the current `colors` / `config`.
4. Adds `density-standard` or `density-expanded` to `<body>` (14px or 16px body text).
5. Writes the appearance variables (`--radius-*`, `--elevation-*`, `--material-*`, `--font-sans`, `--workspace-gap`) and sets `<body data-appearance="…">`.
6. Applies the color scheme: dark role colors and neutral scale, MUI `palette.mode`, `color-scheme`, and `<html data-color-scheme="light|dark">` (`'system'` follows the OS live).

| Prop | Type | Description |
| --- | --- | --- |
| `config` | `PlatformThemeConfig` | Theme file exported from the theme builder |
| `colors` | `ColorConfig` | Role colors, e.g. `{ brand: '#1565c0' }`. Overrides `config.colors` |
| `darkColors` | `ColorConfig` | Role colors of the dark scheme. Overrides `config.darkColors`. Without it, the light brand is adapted for dark surfaces |
| `colorScheme` | `'light' \| 'dark' \| 'system'` | [Dark mode](theming.md#color-scheme-dark-mode). Overrides `config.colorScheme`. Default `'light'` |
| `density` | `'standard' \| 'expanded'` | Text size setting. Overrides `config.density`. Default `'standard'` |
| `appearance` | `'classic' \| 'glass' \| PlatformAppearance` | Visual style of every component ([Appearance](theming.md#appearance)). Overrides `config.appearance`. Default `'classic'` |
| `overrides` | `ThemeOptions` | MUI theme additions merged over the platform theme. May be passed inline |
| `children` | `ReactNode` | |

## Imports

Everything comes from the package root:

```tsx
import { Box, Button, FormField, GridView, NumberInput, Stack, Typography, colors } from '@platform/ui';
```

| Entry point | Contents |
| --- | --- |
| `@platform/ui` | Components, hooks, theme, tokens, utilities |
| `@platform/ui/theme.css` | Global stylesheet (Tailwind layers, tokens, font, animations) |
| `@platform/ui/tokens` | Tokens only, with no React dependency (for charts, scripts, Node) |

The kit re-exports the MUI primitives apps need (`Box`, `Stack`, `Typography`, `Divider`, `Link`, `Chip`), already styled by the theme. Block direct `@mui/*` imports in apps with ESLint `no-restricted-imports`, so every app goes through the kit.

## The showcase

The repository contains a showcase: a live catalog of every export with usage notes, states and code samples.

```bash
npm install
npm run dev   # http://localhost:5173
```

| Page | URL | Contents |
| --- | --- | --- |
| Overview | `/` | Every demo and the exports it shows |
| Theme builder | `/#/theme` | Edit colors and text size, check contrast, export or import a theme file |
| Foundations | `/#/foundations` | Role colors, color scales, typography, radius, shadows, spacing, `Box`/`Stack` |
| Actions | `/#/actions` | `Button` (all variants, sizes, states), `IconButton`, `CloseButton`, `DropdownMenu` |
| Forms | `/#/forms` | `FormField`, `TextInput`, `NumberInput`, `Select`, `Combobox`, `Checkbox`/`Switch`, `RadioGroup`, `OptionCardGroup` |
| Overlays | `/#/overlays` | `Tooltip`, `InfoTip`, `Dialog`, `ConfirmDialog`, toasts |
| Navigation | `/#/navigation` | `TopNav`/`NavMenu`, `Tabs`, `Accordion` |
| Data display | `/#/data` | `Card`, `DataTable`, `GridView`, grid cells, `Chip`/`Link`/`Divider` |
| Feedback | `/#/feedback` | `Alert`, `EmptyState`, `Spinner`, `LoadingIndicator`, `ErrorBoundary` |
| Workspace | `/#/workspace` | `SectionLayout`, `Section`, `VisualizationStage`, `ImageViewer`, `DropOverlay` |
| Patterns | `/#/patterns` | Release notes dialog, update simulation, embedded help page, translation |
| Utilities | `/#/utilities` | Playgrounds for number, search and theme helpers |
| Full-screen workspace | `/#workspace`, `/#workspace-columns` | Complete calculator layout, stacked or side by side |

Each demo has a direct link: `/#/<page>/<id>`, for example `/#/data/grid-view`. The brand picker in the top bar previews other brand colors across every page.

## Working with AI agents

The kit repository includes skills for coding agents (Claude Code and others that read `SKILL.md` files):

- `platform-ui-app` teaches how to build app screens with the kit: which component to pick, form and validation patterns, theming rules, and a pre-finish checklist.
- `platform-ui-theme` turns a look-and-feel idea ("make it feel like Apple's liquid glass", "use the colors of our website", "friendlier and rounder") into a theme: it investigates the idea, maps it to colors and an appearance, checks contrast, writes `theme.config.ts` and takes before/after screenshots. Its scripts need Node ≥ 22.18; screenshots need Playwright in the app.

Copy them into the app repository:

```bash
mkdir -p .claude/skills
cp -r ../et-platform-ui-kit/.claude/skills/platform-ui-app ../et-platform-ui-kit/.claude/skills/platform-ui-theme .claude/skills/
```

The skill points agents to the docs shipped in `node_modules/@platform/ui/docs/`, so it stays accurate as the kit is upgraded. For agents without skill support, reference the file from the app's `AGENTS.md` or `CLAUDE.md`.
