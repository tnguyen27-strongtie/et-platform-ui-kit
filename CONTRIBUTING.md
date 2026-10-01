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
| npm | 11 (pinned in `packageManager`) |
| TypeScript / Vite | 6.0 / 8.3 |

```bash
npm install
npm run dev   # showcase at http://localhost:5173
```

## Scripts

| Script | Description |
| --- | --- |
| `npm run dev` | Showcase dev server |
| `npm run tokens` | Regenerate `src/theme/tokens.generated.css` from `tokens.ts` |
| `npm run lint` | ESLint: typescript-eslint, react-hooks, no hex colors in components |
| `npm run typecheck` | Strict `tsc`, including `tests/unit` and `scripts` (`tsconfig.node.json`) |
| `npm test` | Unit tests for pure logic (`node --test`, no extra dependencies). `tests/unit/resolve-ts.mjs` lets Node load library files whose imports have no extension |
| `npm run test:e2e` | Playwright in Chromium and WebKit: component behavior, keyboard, axe, theming. Starts the dev server itself. `npm run test:e2e -- --project desktop` (or `safari`) runs one browser |
| `npm run check` | `lint` + `typecheck` + `test` + `build` |
| `npm run check:architecture` | Layer boundaries, import cycles, dependencies, duplicated helpers, file-size budgets, and new exports missing a showcase demo, docs, changelog entry or fixture. Default: changes since `main`, including uncommitted files; `-- --base <ref>` for another base, `-- --all` for the whole library, `-- --strict` to fail on warnings. Exits 1 on errors. The rules it enforces are in [architecture.md](.claude/skills/platform-ui-architecture/references/architecture.md). Allow one finding on purpose with `// architecture-allow: <rule-id> <reason>` |
| `npm run build` | Library build to `dist/` (ESM + `.d.ts` + CSS) |
| `npm run build:showcase` | Showcase build to `dist-showcase/` |
| `npm pack` | Tarball `platform-ui-x.y.z.tgz` (runs `build` first); check it with `scripts/verify-pack.sh <tgz>` |

CI (`.github/workflows/ci.yml`) runs `lint`, the architecture check (against the base branch on a pull request, the whole library on a push), `typecheck`, `test`, `build`, checks that `tokens.generated.css` is up to date, and runs the e2e suite in Chromium and WebKit (Safari's engine) as two parallel jobs on every pull request. It also packs the kit, checks the tarball with `scripts/verify-pack.sh`, and keeps it for 30 days as an artifact named `platform-ui-<version>-<commit>` on the run's summary page, so a branch can be tried in an app without building it locally.

Pushing a tag `vX.Y.Z` runs `.github/workflows/release.yml`: the same CI, a check that the tag matches `package.json`, then a GitHub Release with the CHANGELOG section as notes and that tarball attached.

Keyboard tests that press Tab use `tabKey(browserName)` from `tests/e2e/helpers.ts`: Safari's default Tab skips buttons, checkboxes and links, and Option+Tab reaches them.

CI retries a failed e2e test once. A test that passes on the retry does not fail the job, but the end of the e2e job log lists it as `flaky`. Treat a flaky test as a bug: run it locally with `npm run test:e2e -- <spec> --repeat-each 10` until it fails, then fix the cause (usually a missing wait for a transition or animation; see [Pitfalls](#pitfalls)).

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
│   ├── PlatformThemeProvider.tsx  # MUI theme, CSS layers, page-level variables and attributes
│   ├── createPlatformTheme.ts     # MUI theme: component styleOverrides and variants
│   ├── colors.ts, colorMath.ts    # Role colors per scheme, contrast, the CSS the provider writes
│   ├── appearance.ts, themeConfig.ts  # Classic/Glass/custom appearances; theme files
│   ├── theme.css                  # Tailwind 4: layer order, animations, utilities, variants
│   ├── tokens.generated.css       # Generated from tokens.ts. Do not edit
│   └── fonts.css                  # Inter from @fontsource-variable/inter
├── components/                    # Components
│   ├── grid/                      # GridView; gridTypes, gridState (pure, unit tested), gridTable (TanStack setup), gridFilters, header parts, cells
│   ├── release-notes/             # ReleaseNotes, ReleaseNotesDialog, useReleaseNotesSeen
│   └── workspace/                 # SectionLayout, Section, VisualizationStage, ImageViewer
├── utils/                         # cn(), number helpers, useStableValue, storage (safe localStorage), focusOutline (internal)
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
2. Run `npm run tokens` to update `tokens.generated.css`. Never edit that file by hand.
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

## Pitfalls

Things that have broken before. Each one is easy to miss in review.

**Accessibility**

- Everything inside a `<label>` or a button becomes part of the control's accessible name. Put a "?" trigger or description text next to the label or button, not inside it (see `Checkbox help`, `OptionCardGroup description`).
- An element used as an `aria-describedby` target contributes its own `aria-label` / `aria-labelledby` instead of its text, so describe with a plain inner element.
- Assert names with `toHaveAccessibleName(...)`. `getByRole({ name })` matches substrings and hides the bugs above.
- MUI `Tooltip` sets `aria-describedby` only while it is open. A description that must be there when the tooltip is closed goes in a visually hidden (`sr-only`) element.
- A scroll area needs something focusable inside or `tabIndex={0}` on itself; axe (`scrollable-region-focusable`) fails otherwise.
- When content is replaced (a retry, a reset), move focus somewhere sensible in the same area. Never leave it on a removed element (see `ErrorBoundary`).

**Code conventions**

- Props that are usually inline objects or arrays and end up in hook dependencies go through `useStableValue` (`src/utils/useStableValue.ts`), not `JSON.stringify` keys. (`GridView` keeps one JSON key on purpose; the comment there says why.)
- `localStorage` goes through `readStorage` / `writeStorage` (`src/utils/storage.ts`). Raw access throws in sandboxed iframes and private mode.
- When a function gains options, accept an options object and keep the old positional form working (see `useAccordionGroup`), with a spec for each form.
- Components in workspace panels respond to their container, not the viewport: `@container` on a wrapper and `@xs:`-style variants (see `DescriptionList`).

**Styles and tests**

- App Tailwind classes beat MUI styles because of CSS layer order, not specificity. See [How app classes beat MUI styles](docs/getting-started.md#how-app-classes-beat-mui-styles) before changing `theme.css` or how `PlatformThemeProvider` sets up MUI.
- MUI buttons and many controls animate colors and padding (0.15s). A computed style read right after a change shows the in-between value. Use `toHaveCSS` (it retries), and before running axe on colors, wait for running animations (see the dark-scheme axe test in `display.spec.ts`).
- Only one `PlatformThemeProvider` per page: it writes page-global CSS and attributes, and MUI's `--mui-*` variables are page-global too.
- Safari's plain Tab skips buttons and links: use `tabKey(browserName)`. Playwright's `End` key does not move the caret on macOS; set the selection with `setSelectionRange`.

**Fonts**

- Fonts are open source and bundled as `@fontsource*` dependencies, declared in `src/theme/fonts.css`. Apps never copy font files.
- Check a font package's `unicode-range` before importing its CSS. Fontsource labels some fonts `latin` even when the file holds every glyph (STIX Two Math does), and the range silently sends other symbols to fallback fonts. Import the per-subset-per-weight file (`latin-400.css`), which has no `unicode-range`.
- Never write `url('@fontsource/…')` in the kit's CSS. Apps inline the kit's CSS, Vite resolves that URL from the app (where the font package is not a direct dependency) and the font 404s; the showcase does not catch it. Use `@import` of the package CSS. `scripts/verify-pack.sh` fails on bare URLs.

## Testing

```bash
npm run check && npm run check:architecture && npm run test:e2e
```

**Unit tests** (`tests/unit`) cover pure logic: number parsing, rounding and formatting, grid filters and grid state, theme files, appearances, color math and the theme CSS (light, dark, Glass, canvas), release note sorting and dates.

**E2E tests** run against a harness page with one fixture per component (`tests/e2e/harness/fixtures.tsx`; open `npm run dev`, then `/tests/e2e/harness/index.html#<name>`). Fixtures print what callbacks received into `<output data-testid>`, so tests check values and types (`2` vs `"2"`), not only what is drawn.

| Area | What is tested |
| --- | --- |
| All fixtures (smoke) | No console errors; no axe violations (except `color-contrast`, see README). Dark Classic and dark Glass are checked with `color-contrast` on (`display.spec.ts`) |
| Button | Click, Enter, Space; `disabled` and `loading` block clicks; no form submit without `type="submit"`; Enter in an input submits; focus ring only for keyboard; app Tailwind classes (`className="p-0"`) beat the theme's MUI styles |
| TextInput, FormField | `required`, description and error wired to the input; errors announced and cleared; multiline; disabled |
| NumberInput | Spinbutton with min/max/now; emits only numbers or `null`; no `onChange` on an unchanged blur; follows app values; Shift+arrow ×10 with clamping; `precision`; comma decimals and minus sign (`-2,5` → `-2`, `-2.5`); lone `-` reverts; minus rejected when `min ≥ 0`; thousands separators rejected; values ≥ 1e21 without exponent; out of range invalid, `clampBehavior="blur"`; read-only, disabled |
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
| GridView | Cell types; highlighting; sort cycle, empty last, multi-sort, keyboard, menu; text/range/select filters; no-match state; filter row toggle; master search (words, accents, columns, Escape); presets; `labels`; pinning; reorder by menu and drag; hide, show, reset; sticky header; row click and Enter; links inside rows; `onStateChange` on mount; a reported state restored through `initialState` |

When adding a component, add a fixture, add its name to `fixtureNames` in `tests/e2e/helpers.ts` (the fixture map is typed by those names, so forgetting either is a type error), and write a spec for its behavior. A fixture that renders its own `PlatformThemeProvider` goes in `ownThemeFixtures`, so the harness leaves out its own provider (providers must not be nested).

## Before merging

A change is ready when a teammate could own it without asking its author (or an AI) how it works:

1. `npm run check`, `npm run check:architecture` and, for components, theme, CSS or showcase changes, `npm run test:e2e` pass.
2. Every claim in the PR or changelog has a test that would fail if the claim were false (not just a render).
3. Workarounds, magic numbers, `eslint-disable`, `!important`, casts and `architecture-allow` comments say why.
4. Docs, props tables and `CHANGELOG.md` match the code, including defaults. Removed or changed API is listed with a migration.
5. Commits say what and why (Conventional Commits). Unrelated changes go in separate commits.
6. The person merging can explain the riskiest part of the change in their own words.

`.claude/agents/human.md` runs this checklist as an AI reviewer and writes owner questions for point 6. It is optional; the checklist is what matters.

## Releasing

1. Bump `version` in `package.json` following semver: new features → minor, fixes → patch, breaking changes → major. While the version is below 1.0, a breaking change is a minor bump instead, marked **Breaking** in the changelog. Without a version bump, an app cannot tell the new tarball from the one it already installed and may keep the old build.
2. Add an entry to [CHANGELOG.md](CHANGELOG.md).
3. Run `npm ci`, then `npm run check && npm run check:architecture && npm run test:e2e`. Afterwards `git status` must be clean: the build regenerates `tokens.generated.css`, and a change there means it was stale.
4. Pack into a folder that exists (`npm pack` does not create it) and check the tarball: `mkdir -p pack && npm pack --pack-destination pack && scripts/verify-pack.sh pack/platform-ui-x.y.z.tgz`. The script checks that docs, `dist/` and the theme CSS are inside and that the showcase, tests and font files are not.
5. For larger releases, try the tarball in a throwaway Vite app outside the repo: install it with the peer dependencies, import `@platform/ui/theme.css`, render a `Button` inside `PlatformThemeProvider`, run `vite build`, and check the output has the Inter and STIX Two Math `.woff2` files. If the release uses Tailwind classes the kit did not use before, search the built CSS for them: apps get them only because `theme.css` scans the kit's `dist/`.
6. Commit as `chore(release): x.y.z` on `main`, tag `vX.Y.Z` and push the tag. `.github/workflows/release.yml` runs CI, checks the tag matches `package.json`, and creates the GitHub Release with the tarball. If that job fails, fix the cause, then move the tag: `git push origin :vX.Y.Z`, `git tag -f vX.Y.Z`, `git push origin vX.Y.Z`.
7. Update the apps.

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
