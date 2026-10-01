# @platform/ui architecture

The rules a change must follow so the kit stays small, layered and easy to extend. `scripts/check-architecture.mjs` enforces the mechanical ones; the review checklist in `SKILL.md` covers the rest.

## Layers

Dependencies point one way. A lower layer never imports a higher one.

```
                    src/index.ts   (entry: the only public surface)
                         │
        ┌────────────────┼──────────────────────────┐
        ▼                ▼                          ▼
  components/grid   components/workspace   components/release-notes     feature areas
        │                │                          │
        └───────┬────────┴──────────────────────────┘
                ▼
          components/*.tsx                                               base components
                │                     theme/  (MUI theme, provider, colors, appearance)
                │                        │
                └──────────┬─────────────┘
                           ▼
                        utils/            (cn, focusOutline, number, storage, useStableValue)
                           │
                           ▼
                        tokens/tokens.ts  (every design value; imports nothing)
```

| Layer | May import | Must not import |
| --- | --- | --- |
| `tokens/` | nothing from the kit | everything |
| `utils/` | `tokens/` | `theme/`, `components/` |
| `theme/` | `tokens/`, `utils/` | `components/` |
| `components/*.tsx` (base) | `tokens/`, `utils/`, other base components | `theme/` (read the theme through MUI: `useTheme`, `styleOverrides`), feature areas |
| `components/<area>/` | base components, `tokens/`, `utils/`, its own area | other areas, `theme/` |
| `src/index.ts` | any library module | `showcase/`, `tests/`, `scripts/` |
| Library code (all of the above) | its dependencies and peer dependencies | `src/showcase/`, `tests/`, Node built-ins, the kit's own package name |

Why each rule exists:

- **Components do not import the theme.** The theme styles MUI; components get those styles automatically. A component that imports `createPlatformTheme` or `colors.ts` bypasses the provider, so an app's brand, appearance and dark scheme stop reaching it.
- **Areas do not import each other.** `GridView` and `SectionLayout` must be usable (and changeable) on their own. If two areas need the same piece, it is a base component or a util.
- **Base components do not import areas.** Otherwise every small component drags in the grid and its table library.
- **No cycles.** Cycles make modules load half-initialized and block tree-shaking (the build keeps one output file per module).

## Where a change belongs

Decide this before writing code. Pick the lowest layer that can hold the change.

| The change is… | Put it in | Not in |
| --- | --- | --- |
| A design value (color, size, radius, shadow, z-index, breakpoint) | `tokens/tokens.ts` + `npm run tokens` | a component constant |
| How an MUI component looks everywhere | `theme/createPlatformTheme.ts` (`styleOverrides`, `variants`) | a wrapper that restyles MUI |
| Global CSS, Tailwind utility or variant | `theme/theme.css` | a component's inline styles |
| Pure logic (parse, format, filter, sort, compare) | a React-free `.ts` module next to its user (`grid/gridFilters.ts`) or in `utils/` when two places use it, with a unit test | inside a component body |
| A small internal part of one component (a styled trigger, a cell) | the same file, or a sibling file in the same folder (`grid/GridCells.tsx`) | a new public export |
| A safer or simpler API around MUI | a base component in `components/` | a feature area |
| A composed feature with its own state and several parts | a folder `components/<area>/` | a 1000-line base component |
| A new behavior on an existing component | a prop on that component, following its existing props | a second component with the same job |
| Showcase-only data or helpers | `src/showcase/` | the library |

New top-level folders under `src/` are not allowed without changing this document first.

## Reuse before adding

Search before writing (`grep -rn "<idea>" src/`). The kit already has:

| Need | Use |
| --- | --- |
| Combine class names | `cn()` from `utils/cn` (not `clsx` / `twMerge` directly) |
| localStorage / sessionStorage | `readStorage`, `writeStorage` from `utils/storage` |
| Inline-object props in hook deps | `useStableValue` / `deepEqual` from `utils/useStableValue` |
| Parse, format, round, clamp numbers | `utils/number` (`parseNumber`, `formatNumber`, `roundTo`, `clamp`…) |
| Keyboard focus outline | `focusOutline` / `focusOutlineInset` from `utils/focusOutline` |
| Transparent color | `color-mix(in srgb, ${colors.x} 15%, transparent)` |
| Color contrast, mixing | `theme/colorMath` |
| Form wiring (id, label, error, description) | `useFormField()` from `FormField` |
| Icon button with a required name | `IconButton` from `Button` |
| Confirm before a destructive action | `ConfirmDialog` |
| Help text on click / hover | `InfoTip` / `Tooltip` / `HelpPopover` |
| Empty, loading, error states | `EmptyState`, `LoadingIndicator` / `Spinner`, `ErrorAlert` |

If the need is close to an existing component, extend that component with a prop instead of creating a sibling. Two components with overlapping jobs is the main way a kit becomes hard to learn and hard to change.

## Growth budgets

Budgets keep files reviewable. They are soft: the check warns when a file is over budget **and grows**; it never forces a refactor of untouched code.

| File kind | Budget |
| --- | --- |
| Component (`.tsx`) | 400 lines |
| Logic module (`.ts`) | 300 lines |
| `createPlatformTheme.ts`, `tokens.ts` | 800 lines |
| New public exports in one change | 8 (more usually means internals are leaking) |
| New runtime dependencies | 0 without a written justification |

Over budget? Split along existing seams before adding: pure logic → React-free module with unit tests; sub-parts → sibling files in the same folder; long `styleOverrides` → keep in the theme, but group by component with the existing section comments.

## Public API

`src/index.ts` is the only public surface. Everything exported from it is a promise to several apps.

- Export only what apps call. Internal parts (styled sub-elements, helpers used by one component) stay unexported.
- Named exports only; types exported with `type`.
- Adding: the export needs a showcase demo and `catalog.ts` entry, an e2e fixture and spec, docs in `docs/`, and a `CHANGELOG.md` entry (the `platform-ui-component` skill has the steps).
- Changing: keep the old signature working (options object with the positional form still accepted, see `useAccordionGroup`), or mark it as breaking in the changelog.
- Removing or renaming: a breaking change. Deprecate first (JSDoc `@deprecated`, keep it working), remove in a major release.
- Props follow the existing vocabulary: `value` / `onChange(value)`, `open` / `onClose`, `disabled`, `loading`, `labels` for overridable texts, `className` merged with `cn()`. Do not invent a synonym for an existing prop name.

## Dependencies

Every dependency is externalized by the library build and installed by every app.

- UI and icons: MUI and `@mui/icons-material` only. No Radix, Headless UI, Bootstrap, Chakra, Mantine, Ant, lucide, react-icons, Font Awesome, styled-components.
- Import MUI per component (`@mui/material/Button`) or from `@mui/material/styles`; icons one per path.
- Adding a dependency needs, in the review: what it does that MUI and the current dependencies cannot, its size, license (open source, permissive) and maintenance status. Prefer a small in-house module with tests when the need is under ~100 lines.

## Known debt

Existing code that does not meet these rules. Do not copy these patterns; fix them when you are already changing the file (and say so in the changelog if behavior changes).

| Where | Debt | Direction |
| --- | --- | --- |
| `components/grid/GridView.tsx` (~960 lines) | Over the component budget | Move state/preset logic into `grid/` modules with unit tests; toolbar and filter row into sibling files |
| `components/grid/GridView.tsx` (`stateKey = JSON.stringify(...)`) | Serialized state as an effect key | Acceptable here (it reports a derived value), but new code uses `useStableValue` |

Run `node .claude/skills/platform-ui-architecture/scripts/check-architecture.mjs --all` to see the current list. When you pay off an item, remove its row.
