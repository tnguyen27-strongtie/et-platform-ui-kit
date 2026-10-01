# @platform/ui

Shared React components, design tokens and an MUI theme for the platform's calculator apps. Built on **MUI 9**, **Tailwind CSS 4** and **React 19**.

Apps get a consistent look, predictable behavior and accessibility out of the box, without restyling anything themselves.

```tsx
import { Button, FormField, NumberInput } from '@platform/ui';

<FormField label="Design load" htmlFor="load" description="Factored load, lbs">
  <NumberInput value={load} onChange={setLoad} min={0} addonAfter="lbs" />
</FormField>
<Button variant="primary" loading={isCalculating}>Calculate</Button>
```

## Features

- **40+ components** for calculator apps: forms with a strict `NumberInput`, dialogs, tooltips, tabs, accordions, toasts, a sortable and filterable `GridView`, and a resizable three-section workspace layout.
- **Theme at runtime.** Pass one brand color and every shade (hover, active, focus, selection) is derived. MUI styles, Tailwind classes and `sx` values all follow the same CSS variables, so nothing needs a rebuild.
- **Theme builder.** Pick colors, check WCAG contrast and export a typed `theme.config.ts` from the showcase.
- **Accessible by default.** Visible keyboard focus, labelled controls, focus trapping in dialogs, screen reader announcements. Every component is covered by Playwright tests and axe checks.
- **Plain MUI still works.** Styles live in the theme, so `TextField`, `Autocomplete` or `Menu` used directly get the same look.
- **Multilingual.** Ships the open-source Inter font (Latin, Vietnamese, Cyrillic, Greek). Grid and release notes texts can be translated.
- **Tree-shakable ESM** with TypeScript definitions. React, MUI and Emotion are peer dependencies, so an app keeps a single copy of each.

## Installation

The package is private (`"private": true`) and is not published to the public npm registry. Install it from a tarball, a local link, or your internal registry. See [Getting started](docs/getting-started.md#installation) for details.

```bash
npm install ./platform-ui-0.12.0.tgz
npm install react react-dom @mui/material @mui/icons-material @emotion/react @emotion/styled
npm install -D tailwindcss @tailwindcss/vite
```

### Requirements

| Dependency | Version |
| --- | --- |
| React, React DOM | ^19.3 |
| `@mui/material`, `@mui/icons-material` | ^9.4 |
| `@emotion/react`, `@emotion/styled` | ^11.14 |
| Tailwind CSS | ^4.3 |
| Bundler | Vite with `@tailwindcss/vite` (recommended) |

## Quick start

**1. Import the stylesheet and wrap the app in the provider.**

```tsx
// main.tsx
import '@platform/ui/theme.css';
import { PlatformThemeProvider, ToastHost } from '@platform/ui';

createRoot(document.getElementById('root')!).render(
  <PlatformThemeProvider>
    <App />
    <ToastHost />
  </PlatformThemeProvider>,
);
```

**2. Enable Tailwind in Vite.**

```ts
// vite.config.ts
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({ plugins: [react(), tailwindcss()] });
```

**3. Use components and tokens.**

```tsx
import { Box, Button, colors } from '@platform/ui';

<Button variant="primary">Calculate</Button>
<div className="flex gap-2 bg-surface-app p-2">…</div>   {/* Tailwind classes from tokens */}
<Box sx={{ color: colors.danger }}>…</Box>               {/* tokens in TypeScript */}
```

Import everything from `@platform/ui`, including `Box`, `Stack`, `Typography`, `Divider`, `Link` and `Chip`. Apps should not import `@mui/*` directly.

**4. Optional: use your brand color.**

```tsx
<PlatformThemeProvider colors={{ brand: '#1565c0' }}>
```

## Documentation

| Guide | Contents |
| --- | --- |
| [Getting started](docs/getting-started.md) | Installation options, setup, what the provider does, the showcase |
| [Theming](docs/theming.md) | Brand colors, the theme builder, theme files, runtime themes |
| [Design tokens](docs/design-tokens.md) | Color roles, scales, typography, spacing, breakpoints; using tokens in Tailwind and MUI |
| [Components](docs/components.md) | API and usage of every component |
| [GridView](docs/grid-view.md) | Data grid: columns, sorting, filters, search, presets, layout persistence |
| [Workspace layout](docs/workspace-layout.md) | The three-section Input / Illustration / Output layout and the image viewer |
| [Release notes](docs/release-notes.md) | The "What's new" dialog and version tracking |
| [Guidelines](docs/guidelines.md) | Behavior rules, accessibility and design decisions the kit follows |

## Showcase

The repository includes a live catalog of every export, with usage notes and code samples.

```bash
npm install
npm run dev   # http://localhost:5173
```

## Not included yet

- App shell pieces: mobile drawer, help center, EULA, maintenance mode, full File/Template/Print menus. These belong in the app shell library.
- Print styles, product carousel, 3D viewer (the 3D viewer stays app code; see [Workspace layout](docs/workspace-layout.md)).
- Components no app needs yet: Pagination, Breadcrumb, Skeleton, Progress bar, Date picker, File input, Slider.
- Dark mode. Tokens are CSS variables, so it can be added by passing a dark `colors` set.
- Some default color pairs (`textMuted` on gray, brand orange on white) are below 4.5:1 contrast. Adjust them with `colors` if your product must meet WCAG AA. The axe `color-contrast` rule is disabled in the test suite for this reason.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for the development setup, project structure, testing and release process.

## AI agents

[AGENTS.md](AGENTS.md) gives coding agents the context of this repository, and `.claude/skills/` holds step-by-step skills for changing the kit (`platform-ui-component`), keeping every change inside the kit's architecture (`platform-ui-architecture`), releasing it (`platform-ui-release`) and building app screens with it (`platform-ui-app`) and creating themes from a style idea (`platform-ui-theme`); [copy those two into app repositories](docs/getting-started.md#working-with-ai-agents).

## Changelog

See [CHANGELOG.md](CHANGELOG.md).

## Fonts and licensing

The kit ships no commercial fonts. It uses [Inter](https://rsms.me/inter), licensed under the SIL Open Font License 1.1, bundled through `@fontsource-variable/inter`. You may use, embed and redistribute it in commercial products; you may not sell the font files on their own.

When an app builds, Vite copies the `.woff2` files into its output and applies the app's `base` path (for example `/calc/`). Fonts are split by `unicode-range` (Latin, Latin Extended, Vietnamese, Cyrillic, Greek), so browsers download only the subsets a page uses. Characters Inter lacks (CJK, Thai, Arabic…) fall back to the system fonts listed after it in `--font-sans`.

The serif token `'Clarendon'` is only a font name the browser looks up locally. The kit ships no file for it, so it carries no license obligation.
