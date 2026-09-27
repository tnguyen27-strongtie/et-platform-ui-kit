# Changelog

All notable changes to `@platform/ui`. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses [Semantic Versioning](https://semver.org/).

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
