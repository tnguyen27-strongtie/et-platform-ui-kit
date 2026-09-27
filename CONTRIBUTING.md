# Contributing

How to develop, test and release `@platform/ui`. Coding agents: start with [AGENTS.md](AGENTS.md) and the skills in `.claude/skills/`.

- [Development setup](#development-setup)
- [Scripts](#scripts)
- [Project structure](#project-structure)
- [Changing tokens](#changing-tokens)
- [Adding a component](#adding-a-component)
- [Testing](#testing)
- [Releasing](#releasing)
- [Moving into an Nx workspace](#moving-into-an-nx-workspace)

## Development setup

| Tool | Version |
| --- | --- |
| Node.js | 24 LTS (≥ 22.18: `scripts/build-tokens.ts` runs TypeScript directly) |
| pnpm | 12 (pinned in `packageManager`) |
| TypeScript / Vite | 6.0 / 8.3 |

```bash
pnpm install
pnpm dev   # showcase at http://localhost:5173
```

## Scripts

| Script | Description |
| --- | --- |
| `pnpm dev` | Showcase dev server |
| `pnpm tokens` | Regenerate `src/theme/tokens.generated.css` from `tokens.ts` |
| `pnpm lint` | ESLint: typescript-eslint, react-hooks, no hex colors in components |
| `pnpm typecheck` | Strict `tsc`, including `tests/unit` and `scripts` (`tsconfig.node.json`) |
| `pnpm test` | Unit tests for pure logic (`node --test`, no extra dependencies) |
| `pnpm test:e2e` | Playwright in Chromium and WebKit: component behavior, keyboard, axe, theming. Starts the dev server itself. `--project desktop` or `--project safari` runs one browser |
| `pnpm check` | `lint` + `typecheck` + `test` + `build`, the same as the first CI job |
| `pnpm build` | Library build to `dist/` (ESM + `.d.ts` + CSS) |
| `pnpm build:showcase` | Showcase build to `dist-showcase/` |
| `pnpm pack` | Tarball `platform-ui-x.y.z.tgz` (runs `build` first) |

CI (`.github/workflows/ci.yml`) runs `lint`, `typecheck`, `test`, `build`, checks that `tokens.generated.css` is up to date, and runs the e2e suite in Chromium and WebKit (Safari's engine) as two parallel jobs on every pull request.

Keyboard tests that press Tab use `tabKey(browserName)` from `tests/e2e/helpers.ts`: Safari's default Tab skips buttons, checkboxes and links, and Option+Tab reaches them.

## Project structure

```
src/
├── tokens/tokens.ts               # Single source of truth: colors, fonts, radius, shadows, z-index, breakpoints, layout
├── theme/
│   ├── createPlatformTheme.ts     # MUI theme: platform styles for MUI components
│   ├── colors.ts                  # resolveColors(): app colors + shades derived from brand
│   ├── themeConfig.ts             # Theme files: define, parse, export, contrast
│   ├── augmentation.ts            # Types for the extra palette entries and Button variants
│   ├── PlatformThemeProvider.tsx  # CSS layers + ThemeProvider + CssBaseline + density + colors
│   ├── theme.css                  # Tailwind 4: layer order, animations, utilities, variants
│   ├── tokens.generated.css       # Generated from tokens.ts. Do not edit
│   └── fonts.css                  # Inter from @fontsource-variable/inter
├── components/                    # Components
│   ├── grid/                      # GridView, grid cells, filter helpers
│   ├── release-notes/             # ReleaseNotes, ReleaseNotesDialog, useReleaseNotesSeen
│   └── workspace/                 # SectionLayout, Section, VisualizationStage, ImageViewer
├── utils/                         # cn(), number helpers, useStableValue (internal)
├── index.ts                       # Package entry: every public export
└── showcase/                      # Demo app. Not part of the package
    ├── catalog.ts                 # Pages and demos (source for the sidebar, overview and tests)
    ├── layout.tsx                 # DemoPage, DemoSection, Code, hash routing
    └── pages/                     # One page per group
scripts/build-tokens.ts            # tokens.ts → tokens.generated.css
tests/
├── unit/                          # node --test
└── e2e/
    ├── harness/                   # Test page: one fixture per component (#select, #dialog…)
    ├── components/                # Specs by group: forms, buttons, navigation, overlays, display, grid…
    ├── showcase.spec.ts           # Every export has a demo; every page renders and passes axe
    └── helpers.ts
docs/                              # Guides linked from the README
vite.lib.config.ts, tsconfig.lib.json  # Library build
tsconfig.node.json                 # Typecheck for code Node runs directly (unit tests, scripts)
eslint.config.js
public/images/                     # Logos and the sample drawing used by the showcase
```

## Changing tokens

1. Edit `src/tokens/tokens.ts`. New role colors go in `defaultColors`.
2. Run `pnpm tokens` to update `tokens.generated.css`. Never edit that file by hand.
3. If MUI needs the token, reference it in `createPlatformTheme.ts`: `colors.x` in `styleOverrides`, the resolved value (`v.x`) in `palette`.

Never write hex values in components (ESLint enforces this; pure white and black are allowed).

## Adding a component

- Style through the theme first (`components.MuiXxx.styleOverrides` or `variants`). Write a wrapper only for a simpler API.
- Take colors, shadows and radii from tokens; use Tailwind classes for layout; combine classes with `cn()`.
- Build on MUI only. No Radix, Bootstrap or other UI libraries.
- Return normalized values from callbacks (`onChange(checked: boolean)`), not events.
- Controls that take data call `useFormField()` for `id`, `describedBy`, `invalid` and `labelId`.
- Follow the [guidelines](docs/guidelines.md). Focusable controls need a `.Mui-focusVisible` or `:focus-visible` style.
- Export it from `src/index.ts`.
- Add a demo: a `<DemoSection id=…>` in the right page of `src/showcase/pages/`, and an entry in `src/showcase/catalog.ts` listing the exports it shows. `showcase.spec.ts` fails if any export has no demo.
- Add a fixture and a spec (see [Testing](#testing)), and document it in [docs/components.md](docs/components.md) or its own guide.

**New Button variant:** declare the name in `src/theme/augmentation.ts` (`ButtonPropsVariantOverrides`), then add its style to `MuiButton.variants` in the theme.

## Testing

```bash
pnpm check && pnpm test:e2e
```

**Unit tests** (`tests/unit`) cover pure logic: number parsing and rounding, grid filters, theme files, release note sorting and dates.

**E2E tests** run against a harness page with one fixture per component (`tests/e2e/harness/fixtures.tsx`; open `pnpm dev`, then `/tests/e2e/harness/index.html#<name>`). Fixtures print what callbacks received into `<output data-testid>`, so tests check values and types (`2` vs `"2"`), not only what is drawn.

| Area | What is tested |
| --- | --- |
| All fixtures (smoke) | No console errors; no axe violations (except `color-contrast`) |
| Button | Click, Enter, Space; `disabled` and `loading` block clicks; no form submit without `type="submit"`; Enter in an input submits; focus ring only for keyboard |
| TextInput, FormField | `required`, description and error wired to the input; errors announced and cleared; multiline; disabled |
| NumberInput | Spinbutton with min/max/now; emits only numbers or `null`; no `onChange` on an unchanged blur; follows app values; Shift+arrow ×10 with clamping; `precision`; read-only, disabled |
| Select | Placeholder, label, description; keyboard open/select/skip disabled/focus return; number values; Escape keeps the value; multiple; dropdown width |
| Combobox | Filtering; keyboard selection; no results; disabled options; `searchText`; clear to `null`; Escape |
| Checkbox, Switch, Radio | Label click, Space; `switch` role; disabled; radio named by FormField, arrows skip disabled, typed values |
| OptionCardGroup | `aria-pressed`; reselecting keeps the value; disabled cards; Space |
| Tabs | Tab/panel linked by id; arrows, Home, End skip disabled tabs; `keepMounted` |
| Accordion | Click, Enter, Space; header inside a heading; `aria-controls` points to one region; controlled mode; expand/collapse all |
| DropdownMenu, NavMenu | `aria-haspopup`/`aria-expanded`; keyboard open, skip disabled, select, focus return; Escape; 160–320px width, wrapping, 36px items (48px touch) |
| Dialog, ConfirmDialog | Named by title; focus trap; Escape returns focus; each `dismissible` mode and `reason`; confirm focus; `loading` lock; Cancel |
| Tooltip | Hover with delay and no flicker; keyboard focus; hoverable; Escape; describes without renaming; disabled buttons; size limits |
| InfoTip, HelpPopover | No hover open; click/Enter opens a named dialog; focus inside, links reachable; Escape, outside click and X close and return focus; triggers; size limits and scrolling |
| Toasts | Announced; success closes, error stays; hover pauses; close and dismiss all; 5 at most |
| Alert, Card, DataTable, EmptyState, Spinner, LoadingIndicator | Roles (`alert`, `status`, `progressbar`); Card heading; table headers, keyboard scroll, sticky header |
| ErrorBoundary | Crash contained, reported through `onError`, retry fails again until data changes, `resetKeys` recovers |
| ImageViewer | Zoom limits; buttons while zoomed; quick clicks do not reset; wheel without page scroll; double-click and `ref.reset()`; `minScale` < 1; new `src` resets; two-finger pinch |
| SectionLayout | Three panes with dividers; Input collapses to a rail and reopens ("Expand Input"); works with blocked localStorage; mobile shows one section and keeps Input state |
| Density | `<body>` class and 14 ↔ 16px text |
| Theme builder | Brand applies everywhere with derived shades; export contains only changes; invalid colors rejected; per-role override and reset; contrast table; text size; persistence and Reset; TS export and download; import with errors and warnings |
| Release notes | App name and intro; no uppercase title; semver order, latest open; dates without time zone shift; New badge; categories, groups, links; expand/collapse all; focus return; translation; empty list; `useReleaseNotesSeen` first visit, update, `markSeen` |
| GridView | Cell types; highlighting; sort cycle, empty last, multi-sort, keyboard, menu; text/range/select filters; no-match state; filter row toggle; master search (words, accents, columns, Escape); presets; `labels`; pinning; reorder by menu and drag; hide, show, reset; sticky header; row click and Enter; links inside rows |

When adding a component, add a fixture, add its name to `fixtureNames` in `tests/e2e/helpers.ts`, and write a spec for its behavior.

## Releasing

1. Bump `version` in `package.json` following semver: new features → minor, fixes → patch, breaking changes → major. Without a version bump, pnpm in the apps keeps using the cached tarball.
2. Add an entry to [CHANGELOG.md](CHANGELOG.md).
3. Run `pnpm check && pnpm test:e2e`.
4. `pnpm pack` (or `pnpm publish` to an internal registry) and update the apps.

## Moving into an Nx workspace

| Kit folder | Workspace target | Nx tag |
| --- | --- | --- |
| `src/tokens/`, `scripts/build-tokens.ts` | `libs/ui/tokens` | `type:ui` |
| `src/theme/`, `src/components/`, `src/utils/`, `src/index.ts` | `libs/ui/components` (package `@platform/ui`) | `type:ui` |
| `tests/` | `libs/ui/components/tests` | — |
| `public/images` | `libs/ui/assets`; apps copy it into `public/` at build time | — |
| `src/showcase/` | Not copied; becomes Storybook stories | — |

- Keep the `exports` (`"."`, `"./theme.css"`, `"./tokens"`) and `peerDependencies` of `package.json` as they are.
- In apps, block direct `@mui/*` imports (ESLint `no-restricted-imports`) and hex colors, so every app goes through `@platform/ui`. The kit's own ESLint config only covers the kit.
