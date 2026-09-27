---
name: platform-ui-component
description: Workflow for adding or changing anything in the @platform/ui component kit itself - a new component, a new prop or variant, a behavior fix, a design token, a theme style (createPlatformTheme / theme.css), or a GridView / workspace / release-notes feature. Use it whenever the task edits files under src/components, src/theme or src/tokens of this repository, even for a "small" prop or styling tweak, because every public change here must also update the export list, the showcase demo and catalog, the e2e fixture and spec, the docs and the changelog, and the test suite fails if the showcase is out of sync.
---

# Changing the @platform/ui kit

The kit is consumed by several apps, so a change is only done when it is exported, demonstrated, tested, documented and logged. Most mistakes in this repo are a missing one of those five, not bad component code. Work through the steps below in order and skip only the ones that genuinely do not apply (say which ones you skipped and why).

Read `AGENTS.md` first if you have not. For code templates of each step, see `references/templates.md`.

## 1. Decide where the change belongs

Look at how the nearest existing component does it before writing anything; the codebase is consistent and the fastest route is to copy its patterns.

| The change is about… | Put it in |
| --- | --- |
| How an MUI component looks | `src/theme/createPlatformTheme.ts` (`components.MuiXxx.styleOverrides` or `variants`). Plain MUI usage in apps then matches too |
| A simpler or safer API around MUI | A wrapper in `src/components/` |
| A color, size, radius, shadow, breakpoint | `src/tokens/tokens.ts`, then `pnpm tokens` |
| Global CSS, Tailwind utilities or variants | `src/theme/theme.css` |
| Pure logic (parsing, filtering, sorting) | A React-free module with unit tests (like `utils/number.ts`, `grid/gridFilters.ts`) |

A wrapper is justified when it removes a footgun (value types, accessibility wiring, safe defaults), not just to rename props.

## 2. Write the component the kit's way

These conventions exist because apps rely on them; breaking one usually breaks a test or an app.

- **Colors:** `colors.*` from `../tokens/tokens` or role classes (`bg-brand`, `text-text-muted`, `border-border-input`). Never hex (ESLint fails; `#fff`/`#000` pass). For transparency use `color-mix(in srgb, ${colors.x} 15%, transparent)`; MUI `alpha()` cannot read CSS variables.
- **Classes:** Tailwind for layout, combined with `cn()` so an app's `className` can override.
- **Base:** MUI only; icons from `@mui/icons-material` imported per icon (`@mui/icons-material/Close`).
- **Callbacks:** return normalized values (`onChange(value: V)`), keep value types (a number option stays a number), `null` for empty.
- **Forms:** a control that takes input calls `useFormField()` and uses `field?.id`, `field?.describedBy`, `field?.invalid`, `field?.labelId`, so it works inside `FormField` without extra props. Outside a `FormField` it accepts `aria-label`.
- **Accessibility:** real roles and names, `aria-label` required on icon-only buttons (use `IconButton`), visible `:focus-visible` style, keyboard support equal to mouse support. Texts that users read should be overridable through a `labels` prop when the component is text-heavy (see `GridView`, `ReleaseNotes`).
- **Inline-object props** (arrays of keys, option objects) used in hook dependencies go through `useStableValue` from `utils/useStableValue.ts`, not `JSON.stringify` keys.
- **Storage** (`localStorage`) access is wrapped in try/catch; it throws in sandboxed iframes.
- **Comments:** English, describing the component on its own terms. JSDoc on every public prop; it ends up in the `.d.ts` apps see.

## 3. Export it

Add the component and its public types to `src/index.ts`, next to related exports. Types use `type` imports in the export list.

## 4. Showcase demo + catalog

Every runtime export must appear in `src/showcase/catalog.ts`; `tests/e2e/showcase.spec.ts` ("every kit export appears in a showcase demo") fails otherwise, and each catalog section must render a `<DemoSection>` with the same `id` and `title`.

- Add a `<DemoSection id title description code>` to the matching page in `src/showcase/pages/` (Actions, Forms, Overlays, Navigation, DataDisplay, Feedback, WorkspacePage, Patterns, Utilities, Foundations).
- Add `{ id, title, exports: [...] }` to that page's `sections` in `catalog.ts`.
- `description`: one line on when to use it. `code`: the shortest realistic usage.

## 5. Fixture and e2e spec

Specs test behavior through a harness fixture, not the showcase.

1. Add a fixture component to `tests/e2e/harness/fixtures.tsx`. Print what callbacks receive with `<Out id="..." value={...} />`, so specs can assert value *and* type.
2. Register it in the `fixtures` map and add the name to `fixtureNames` in `tests/e2e/helpers.ts`. The smoke spec then checks it renders without console errors and passes axe automatically.
3. Write the spec in the matching `tests/e2e/components/*.spec.ts`: query by role and accessible name (`getByRole('button', { name: 'Save' })`), cover mouse, keyboard, disabled, and the edge case that motivated the change. Use `expectOut(page, id, value)` for callback results.
4. Keyboard steps that press Tab use `tabKey(browserName)` from `tests/e2e/helpers.ts`; Safari's plain Tab skips buttons, checkboxes and links, so a bare `'Tab'` fails in WebKit.
5. If you changed an existing behavior, update the spec that asserted the old behavior instead of deleting it.

Pure logic gets a `tests/unit/*.test.ts` (`node:test` + `node:assert/strict`, imports with `.ts` extensions).

## 6. Docs and changelog

- `docs/components.md` (or the dedicated guide: `grid-view.md`, `workspace-layout.md`, `release-notes.md`, `theming.md`, `design-tokens.md`): a usage example and a props table with types and defaults. Check defaults against the code; docs drifting from code is the most common review finding here.
- `CHANGELOG.md`: an entry under the next version (Added / Changed / Fixed / Removed). If there is no unreleased section yet, create one; the release skill bumps the number.
- New rule or convention? Add it to `docs/guidelines.md`.

## 7. Verify

```bash
pnpm check                                   # lint, typecheck, unit tests, build
pnpm test:e2e                                # full suite in Chromium + WebKit, ~2 min; pass one spec file or --project desktop while iterating
```

For visual changes, run `pnpm dev` and look at the demo and the fixture (`/tests/e2e/harness/index.html#<fixture>`); a Playwright screenshot before and after is the quickest honest check. Finish by reporting what passed, what you looked at, and anything you did not verify.

## Token and theme changes

- Edit `tokens.ts`, run `pnpm tokens`, commit `tokens.generated.css` too (CI fails if it is stale).
- A new role color goes in `defaultColors`; if it should follow the brand, derive it in `resolveColors` (`src/theme/colors.ts`).
- In `createPlatformTheme.ts`, use `colors.x` inside `styleOverrides` and resolved values (`v.x`) inside `palette`, because MUI computes contrast from palette values.
- A new Button variant: declare it in `src/theme/augmentation.ts` (`ButtonPropsVariantOverrides`) and style it in `MuiButton.variants`.
- Theme changes are visual: take screenshots and run the full e2e suite; many specs measure sizes and colors.

## Fonts

- Fonts are open source (SIL OFL) and bundled as dependencies (`@fontsource*`), declared in `src/theme/fonts.css`, with a family token in `typography.fontFamily` (`pnpm tokens` turns it into `--font-*` and a `font-*` utility). Apps never copy font files.
- Check the package's `unicode-range` before importing its CSS. Fontsource labels some fonts `latin` even when the file holds every glyph (STIX Two Math does); importing that CSS silently sends symbols outside the range to fallback fonts. In that case write the `@font-face` yourself with `url('@fontsource/<pkg>/files/<file>.woff2')` and no `unicode-range`, as `fonts.css` does for the math font.
- Verify with `pnpm build:showcase` (the font file must appear in `dist-showcase/assets`) and an e2e check that `document.fonts.load()` returns the face as `loaded` with the expected `unicodeRange`.
- MathML in the showcase: `@types/react` has no MathML tags, so add any new tag or attribute to `src/showcase/mathml.d.ts`. Formulas are demonstrated in Foundations → Math formulas.
