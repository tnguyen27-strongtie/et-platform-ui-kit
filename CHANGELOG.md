# Changelog

All notable changes to `@platform/ui`. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Changed

- Tooling: `npm run check:architecture` runs the architecture check, and CI runs it on every pull request (against the base branch) and push (whole library). CONTRIBUTING documents it and the pre-1.0 version rule (a breaking change is a minor bump, marked **Breaking**).
- Internal: removed two unused `@keyframes` from the theme's global styles (`LoadingIndicator` uses the ones in `theme.css`); `NumberInput` computes its invalid state once. No visual or behavior change.
- Internal: `GridView` is split into `gridTypes.ts` (public types, default labels), `gridState.ts` (state conversion, presets, column moves; unit tested), `gridTable.ts` (TanStack setup) and `GridHeaderParts.tsx` (menus, filter inputs). Exports and behavior are unchanged.
- Docs: [Getting started](docs/getting-started.md) explains what `PlatformThemeProvider` writes outside React, why there must be one provider per page (a nested provider in another color scheme shows dark-on-dark dialog text), and how CSS layer order makes app Tailwind classes beat MUI styles. CONTRIBUTING gains Pitfalls, Before merging and the full release steps.
- Tests: an app class overriding MUI styles; dark Classic and dark Glass pass axe with `color-contrast` on; `NumberInput` comma decimals, minus sign, thousands separators, huge values and `clampBehavior`; `GridView` state restored through `initialState`; unit tests for the theme CSS and grid state. The fixture map is typed by `fixtureNames`, and fixtures with their own provider no longer render inside the harness provider.

### Fixed

- `NumberInput` / `formatNumber`: values of 1e21 and above show every digit instead of `1e+21`, which the field could not read back (typing into it did nothing).
- Docs: `GridView` `onStateChange` is also called once on mount with the starting state; the docs said it fired only on user changes.
- README no longer lists dark mode as missing (it shipped in 0.12.0).

## [0.12.1] - 2026-10-01

Two accessibility and API fixes in the workspace view controls, plus internal cleanup. Upgrading needs no code changes.

### Added

**Agent skills** (repository `.claude/skills/`, for work on the kit itself)

- `platform-ui-architecture`: a design gate before coding (which layer, what to reuse, public surface, size budget, dependencies) and a review gate before a change is done. `check-architecture.mjs` checks the branch against the kit's layers (`tokens` ← `utils` ← `theme` / components ← feature areas ← `index.ts`), import cycles, unknown or non-MUI UI packages, MUI barrel imports, duplicated helpers (Web Storage, `clsx`, `alpha(colors.x)`), file growth over budget, new exports without showcase / docs / changelog / fixture, removed exports and new dependencies. `references/architecture.md` documents the layers, placement rules, budgets and known debt.

### Changed

- Internal: the focus outline lives in `utils/focusOutline` and is shared by the theme and components; pill shapes use `radius.full`; `SectionLayout` persists pane sizes through `utils/storage`. No visual change.
- Tooling: the repository uses npm (11, pinned in `packageManager`) instead of pnpm. `package-lock.json` replaces `pnpm-lock.yaml` and keeps every direct dependency at the version pnpm had resolved; CI installs with `npm ci`. Script arguments now go after `--`, for example `npm run test:e2e -- --project desktop`. The tarball ships the same files; only `packageManager` and the script commands in its `package.json` differ.

### Fixed

- `ViewControlsGroup`: the group is named by its title (`aria-labelledby`), so screen readers announce it ("Object visibility, group") instead of an unnamed group.
- `ResetViewButton`: `onClick` is called with no arguments, as its type says, instead of receiving the click event.

No type changes. Untyped code that read the click event from `ResetViewButton`'s `onClick` now gets `undefined`.

## [0.12.0] - 2026-10-01

Themes are no longer just a brand color. An app can switch the visual style of every component (**appearances**: Classic, Glass or its own), turn on **dark mode**, and have its own Tailwind classes follow both, without touching component code. The default light Classic look is unchanged (every kit fixture renders pixel-identical), apart from the two small details under Changed.

### Added

**Appearances**

- `<PlatformThemeProvider appearance="glass">` (or `appearance` in the theme file) changes shape, depth, surface material, font and neutral colors of every component; brand colors and component APIs stay the same. `classic` (default) is the existing look. Glass: frosted translucent panels, bars, menus and dialogs over a brand-tinted backdrop, capsule buttons, large rounded overlays, floating workspace sections; solid surfaces for users with the system's reduce-transparency setting. See `docs/theming.md` → Appearance.
- Custom appearances with `defineAppearance(overrides, base)`; also `APPEARANCES`, `APPEARANCE_NAMES`, `classicAppearance`, `glassAppearance`, `resolveAppearance`, `isAppearanceName`, `appearanceCssVars`, and the `PlatformAppearance`, `PlatformAppearanceDark`, `AppearanceName` types.
- Role tokens that follow the appearance: `shape` / `defaultShape` (radius by role: control, field, overlay, dialog, panel, option, alert, section), `elevation` (shadows as CSS variables; new `shadows.panel`), `material` / `defaultMaterial` (surface backgrounds and backdrop filters, including `canvas` for drawing surfaces), `layout.workspaceGap`, `shapeVar` / `shadowVar` / `elevationVar` / `materialVar`. Tailwind: `rounded-control`, `rounded-panel`…, `material-panel`, `material-overlay`, `material-nav`, `material-header`, `material-app`.
- Appearances can rescale the radius steps (`radius: { sm, md, lg, xl }`), so app code using `rounded-sm`…`rounded-xl` follows them.

**Dark mode**

- `<PlatformThemeProvider colorScheme="dark">`, or `'system'` to follow the operating system live; also `colorScheme` in theme files. Works with every appearance. Dark role colors (`defaultDarkColors`, WCAG AA checked in unit tests), a reversed neutral scale (`darkTrueGray`: `true-gray-*` classes adapt), dark shadows and materials, MUI `palette.mode`, `color-scheme`, `<html data-color-scheme>`; Tailwind's `dark:` variant follows the provider.
- The light brand is made readable on dark surfaces automatically; `darkColors` (prop and theme file) sets any dark role. Appearances can add `dark: { colors, shadows, material }`.
- Drawing surfaces (`VisualizationStage`, `ImageViewer`) stay white in dark, and their controls keep light colors (`data-surface="canvas"`); a theme can make them dark with `material.canvas`.
- `usePlatformColorScheme()`, `resolveSchemeColors(scheme, { colors, darkColors, appearance })` for real colors (charts, canvas), and the helpers `adaptBrandForDark`, `readableOn`, `contrast`, `mix`.
- Color roles `textStrong` (strongest text: black in light, white in dark) and `textOnColor` (text on filled status and neutral colors).

**Showcase**

- Top bar: Appearance and Light / Dark / System switches. Theme builder: Appearance section with previews and a color scheme choice; the role editor and contrast check work on the scheme on screen (dark edits `darkColors`). Utilities → Color scheme helpers.
- Example theme **Neon Grid** (cyberpunk, dark, custom appearance), made with the `platform-ui-theme` skill. Showcase only, not part of the kit's API.

**Agent skills** (repository `.claude/skills/`; copy into app repositories, see `docs/getting-started.md`)

- `platform-ui-theme`: turns a style idea, website, logo or mood words into a checked `theme.config.ts`. `theme-tool.mjs` validates a draft against the installed kit, prints WCAG contrast per color scheme and writes the theme file; `preview.mjs --theme <file>` renders a workspace and component gallery with the real provider (screenshots, or `--serve` to open it), and `--css` mode previews the app's own screens.
- `platform-ui-app`: `audit-styles.mjs` lists app styles that do not follow the theme (white/black, hex, Tailwind's default palette and shadows, brand scales, `radius.*` / `shadows.*` values) with the role to use, and fixes the safe ones (`--fix`).

### Changed

- `Popover` paper (HelpPopover, InfoTip) has the same 0.125rem corners as menus instead of square corners.
- `primaryDark` buttons and selected text use `textOnBrand` (`#f4f4f4` by default) instead of `#fff`.
- The kit's shadow utilities (`shadow-popover`, `shadow-panel`…) now follow the appearance and dark scheme: shadow values live in `--elevation-*`, and `--shadow-*` points at them.
- The theme and components use role colors and tokens instead of fixed white, black, gray-scale values, radii and shadows; `Section`, `SectionLayout`, `TopNav` and `Tabs` no longer hard-code backgrounds. The text font is `var(--font-sans)`.
- `resolveColors(config, base?)` takes an optional base (an appearance's colors); `createPlatformTheme` accepts `appearance`, `colorScheme` and `darkColors`. Brand shade math no longer uses MUI's helpers (same results, in the React-free `colorMath` module).

### Upgrading

- No code changes are needed; without `appearance` or `colorScheme` an app looks as before.
- If the app's own CSS overrides a kit shadow variable (`--shadow-popover: …`), set `--elevation-popover` instead; Tailwind `shadow-popover` now reads that.
- Before enabling Glass or dark mode, run `audit-styles.mjs` (in the `platform-ui-app` skill) on the app: `bg-white`, `text-black`, hex colors and Tailwind's default palette in app code do not follow the theme.
- Review screens with `HelpPopover` / `InfoTip` (rounded corners).

## [0.11.0] - 2026-09-28

### Fixed

- `Accordion`: the header title uses the kit font. It used the browser's default button font (Arial in Chrome, the system font in Safari), which also made the `help` "?" overlap the title in some browsers.

No API changes. Accordion headers look slightly different (Inter instead of Arial or the system font); review screens with accordions.

## [0.10.0] - 2026-09-28

### Added

- `Accordion`: `help` and `helpLabel` add a "?" bubble right after the title, outside the header button (same behavior as `Checkbox help`): it is not part of the header's accessible name and opening it does not toggle the section.

No breaking changes.

## [0.9.0] - 2026-09-28

### Added

- `SectionLayout`: `defaultInputSize` (percent) sets the starting Input width on desktop and tablet. A size saved under `layoutId` still wins.

### Changed

- `SectionLayout` with one section on the right (Input | Output or Input | Illustration) starts half and half instead of Input at 36%. With all three sections Input still starts at 36%. Users who already resized keep their saved width; to start everyone at the new default, change `layoutId`.

## [0.8.0] - 2026-09-28

### Added

- `SectionLayout`: `illustration` and `output` are optional. An app passes only the sections it has and the layout adapts: Input | Output, Input | Illustration, or Input alone on desktop and tablet, and only those tabs on mobile. The saved Input width is shared by all variants. See `docs/workspace-layout.md` → "Choosing the sections".

No breaking changes: apps that pass all three sections look and behave as before.

## [0.7.0] - 2026-09-27

### Added

- `ErrorAlert`: the standard message for a failed request: title, message, an optional support reference (monospace, selectable) and an optional retry button (`onRetry` + `retryLabel`).
- `AgreementDialog` and `useAgreementAccepted`: terms the user must accept before using the app. Only its two buttons close it; the text scrolls, is keyboard scrollable, is the dialog's description and can carry its own `lang`. The hook remembers the accepted version, so a new version asks again.
- `DescriptionList`: label/value pairs as `dl`/`dt`/`dd`, two columns when its container is at least 20rem wide, stacked below that. `size="sm"` for inside cards.
- `MathVar` and `MathSub`: a variable (italic, math font) and an upright subscript for notation such as S<sub>DS</sub> in labels; both work as elements in translation components.
- `formatFraction(value, { denominator, unit })`: mixed numbers such as `1 7/16"`, rounded to the nearest 1/32 by default, negative values included.
- `formatDisplayNumber(value, { precision, locale })`: numbers for display with locale separators and grouping. `formatNumber` is unchanged; it stays the input-field format that `parseNumber` reads back.
- `Card`: `role="group"` makes a card a named group of inputs (labelled by its title); `wrapTitle` lets a long title wrap instead of truncating.
- `OptionCardGroup`: `description` on an option shows a tooltip on hover and keyboard focus and is always the card's accessible description.
- `Checkbox` and `Switch`: `help` and `helpLabel` add the "?" bubble after the label, outside the control's name.
- `Alert`: `actions` for buttons under the text.
- `Section`: `footer` and `footerAlign` for a bar under the scrolling body (Calculate / Restart) that never covers a field.
- `useAccordionGroup(keys, { exclusive, initial, defaultExpanded })`: options object with an exclusive mode (one section open at a time). The positional form still works.
- `ErrorBoundary`: `labels` translates the default fallback; `defaultErrorBoundaryLabels` holds the English texts.
- `GridView`: `locale` for number columns (default `'en-US'`, as before).

### Changed

- `ErrorBoundary` default fallback: the "Try again" button is now a small button inside the error alert (it used to sit below it). After "Try again", focus moves into the recovered content, or back to the retry button if it fails again, instead of being lost.
- `GridView` number columns with `precision` round half away from zero like the rest of the kit (`1.005` at 2 decimals shows `1.01`).

No breaking changes.

## [0.6.1] - 2026-09-27

### Fixed

- STIX Two Math did not load in apps: `fonts.css` pointed at the font with a bare `url('@fontsource/stix-two-math/…')`, which the app's Vite build left unresolved, so MathML formulas fell back to another font. The kit now imports the package's `latin-400.css` (no `unicode-range`, so the face still covers every glyph).

No API changes. Apps only need to update the kit.

## [0.6.0] - 2026-09-27

### Added

- **Math formulas.** The kit bundles STIX Two Math (SIL Open Font License 1.1, through `@fontsource/stix-two-math`) and applies it to every MathML `<math>` element, so formulas render with proper fractions, radicals, stretched brackets and big operators without a math library. Use the `font-math` class for symbols in ordinary text (`σ ≤ 0.6 F<sub>y</sub>`). New token `typography.fontFamily.math` (`--font-math`). The font file (about 400 KB) is downloaded only by pages that show math. See `docs/design-tokens.md` → "Math formulas".
- Showcase: Foundations → Math formulas (display and inline formulas, a calculator that substitutes its inputs, formulas in a table).

### Changed

- `<math>` elements already in an app now use STIX Two Math instead of the browser's default math font.
- To write MathML in TSX, apps declare the MathML tags once (`src/mathml.d.ts`); `@types/react` does not include them yet. The snippet is in `docs/design-tokens.md`.

### Fixed

- `InfoTip`, `HelpPopover` and `FormField help` in Safari: after opening with the mouse, closing (Escape, click outside, X) returns focus to the "?" or "i" trigger. Safari does not focus buttons on click, so focus used to fall back to the page.

### Development

- The e2e suite and CI run in Chromium and WebKit (Safari's engine), desktop and mobile.
- CI keeps the packed tarball of every commit as a run artifact (`platform-ui-<version>-<commit>`, 30 days); pushing a tag `vX.Y.Z` creates a GitHub Release with the tarball and this changelog section.
- Playwright starts vite directly, so test runs no longer hang or leave a dev server running.

No breaking changes.

## [0.5.1] - 2026-09-27

### Changed

- Documentation rewritten in English as library docs: a concise README, guides in `docs/`, `CONTRIBUTING.md` and this changelog.
- The kit is documented as an independent platform: comments, docs and sample data no longer refer to any legacy app. Examples use a sample "Demo Calculator".
- Showcase: the default brand preset is named "Orange (default)".

### Removed

- `scripts/copy-assets.sh`. Logos and the sample drawing are already in `public/images`.

No API changes.

## [0.5.0] - 2026-09-27

### Changed

- **Font: Inter** (SIL Open Font License 1.1) replaces Helvetica Neue LT Std (commercial). The font is bundled through `@fontsource-variable/inter`, so apps no longer copy font files or need a font license. Covers Latin, Latin Extended, Vietnamese, Cyrillic and Greek; browsers download only the subsets a page uses.
- Text is about 5–8% wider than before. Review places with fixed widths (buttons, labels, table columns).
- The `InfoTip` "?" bubble uses the kit font.

No API changes.

## [0.4.0] - 2026-09-26

### Added

- `GridView` `labels` prop and `defaultGridViewLabels`: translate every text of the grid.
- `ImageViewer`: two-finger pinch zoom on touch screens.
- Tooling: ESLint, `pnpm check`, type checking for `tests/unit` and `scripts`, GitHub Actions CI, `engines` and `packageManager`.

### Changed

- `peerDependencies` use `^` ranges (React ≥ 19.3, MUI ≥ 9.4, Emotion ≥ 11.14).
- `PlatformThemeProvider` `overrides` passed inline no longer rebuild the theme on every render.
- Toasts use `react-toastify/unstyled`: its CSS is loaded once, inside `@layer components`, so Tailwind classes can override it.

### Fixed

- `ImageViewer`: `minScale` below 1 jumped back to 1; a new `src` now resets the view and shows the loading indicator; wheel zoom no longer scrolls the page; `pointercancel` is handled.
- `SectionLayout`: no longer throws when localStorage is blocked (sandboxed iframes, strict privacy settings). The collapsed rail is named "Expand Input" instead of "Expand panel" (WCAG 2.5.3).

## [0.3.0] - 2026-09-26

Additions only; no breaking changes from 0.2.

### Added

- `GridView`: sorting, per-column filters, master search, presets, column pinning, reordering and hiding.
- `Tooltip` (hover, short text) and `InfoTip` (click, long explanations). `HelpPopover` is now an alias of `InfoTip`.
- `ReleaseNotesDialog`, `ReleaseNotes`, `useReleaseNotesSeen`.
- Theme files: `PlatformThemeProvider` `config`, `definePlatformTheme`, `parseThemeConfig`, export helpers, `contrastRatio`. Theme builder in the showcase.
- `Accordion` `headingLevel`, `useAccordionGroup(keys, defaultExpanded, initial)`, `DataTable` `aria-label`.

### Fixed

- Dialog titles rendered in uppercase.
- Extra space above accordions.
- `Checkbox indeterminate` declared conflicting ARIA states.
- Duplicate ids in accordions.
- `ImageViewer` zoom buttons.
- The `DataTable` scroll area was not keyboard focusable.

## [0.2.0] - 2026-09-26

### Changed (breaking)

- Package renamed from `@platform/ui-kit` to `@platform/ui`. `react`, `@mui/*` and `@emotion/*` became `peerDependencies`.
- `colors.*` are now CSS variable references (`var(--color-*)`). Where a hex value is needed (MUI `alpha()`, chart libraries), use `defaultColors` or `resolveColors(config)`.
- `IconButton` requires `aria-label` (or `aria-labelledby`).
- `Dialog` `onClose` receives a `reason` argument. Existing `onClose={() => …}` handlers keep working.
- `notify.error` no longer closes on its own.
- `FormField` wraps MUI `FormControl`: `error` turns the label red and sets `aria-invalid` on the control; `required` sets `required` on the input.
- react-toastify's CSS is imported by `theme.css` instead of from JavaScript.

### Added

- Runtime theming through `PlatformThemeProvider` `colors`.
- `notify.warning` and `notify.dismiss`.

## [0.1.0] - 2026-09-26

- Initial version.
