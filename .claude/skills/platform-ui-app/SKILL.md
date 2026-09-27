---
name: platform-ui-app
description: How to build UI in an app that uses the @platform/ui kit - forms and number inputs, input groups, validation messages, dialogs and confirmations, license agreements, tooltips and help, toasts, error messages for failed requests, result tables, data grids and label/value details, number and fraction formatting, the Input/Illustration/Output workspace layout, math formulas and equations, theming with a brand color, and translated texts. Use it whenever you create or change screens, components or styles in a calculator app that depends on @platform/ui (imports from '@platform/ui', uses PlatformThemeProvider, GridView, SectionLayout, NumberInput…), including when the user just says "add a field", "show the results in a table", "add a settings dialog" or "make it match the design", so the app uses the kit's components and rules instead of raw MUI, hand-written styles or hex colors.
---

# Building app screens with @platform/ui

The kit already solves layout, styling, accessibility and the tricky input behaviors for calculator apps. App code that reaches past it (raw MUI, custom CSS colors, `<input type="number">`) looks inconsistent, loses keyboard and screen reader support, and breaks when the theme changes. So the job is mostly choosing the right kit component and wiring it correctly.

**Full API reference:** the package ships its docs. Read the relevant file before using a component you have not used yet:
`node_modules/@platform/ui/docs/` → `components.md`, `grid-view.md`, `workspace-layout.md`, `release-notes.md`, `theming.md`, `design-tokens.md`, `guidelines.md`, `getting-started.md`.

## Ground rules

- Import everything from `'@platform/ui'`, including `Box`, `Stack`, `Typography`, `Divider`, `Link`, `Chip`. Do not import `@mui/material` or `@mui/icons-material` components directly for things the kit provides (icons from `@mui/icons-material` are fine).
- Colors: `colors.*` in `sx`/style, or role classes in Tailwind (`bg-brand`, `text-danger`, `bg-surface-app`, `border-border-input`). No hex values, so the app follows its theme. Need a real hex (charts, canvas)? `resolveColors(themeColors).brand`.
- Layout with Tailwind utilities; spacing in 4px steps (`p-2` = `sx={{ p: 2 }}` = 0.5rem).
- Do not import `react-toastify`; use `notify` and the app's single `<ToastHost />`.

## Choosing a component

| Need | Use | Not |
| --- | --- | --- |
| Any numeric input | `NumberInput` inside `FormField` | `TextInput`, `<input type="number">` |
| Text input, textarea | `TextInput` (`multiline minRows={3}`) | raw `OutlinedInput`, `TextField` |
| Pick one of a few (2–5) visible options | `RadioGroup` | `Select` |
| Pick one of many | `Select`; searchable: `Combobox` | custom dropdown |
| Pick with pictures | `OptionCardGroup` (`description` for a hover/focus explanation) | image + `Tooltip` built into `label` |
| On/off applied on Calculate | `Checkbox` (`help` for a "?" bubble) | `InfoTip` placed next to it by hand |
| On/off applied immediately (a setting) | `Switch` | |
| Group of related inputs ("Seismic", "Wind") | `Card role="group"` | `<section role="group">` by hand |
| Accordions, only one open at a time | `useAccordionGroup(keys, { exclusive: true })` | own open/close state |
| Calculate / Restart bar under the inputs | `Section footer` | sticky `div` in the scrolling body |
| Short hint on hover (1–2 lines, text only) | `Tooltip` | `InfoTip` |
| Longer explanation, links, lists | `InfoTip` (or `FormField help`) | `Tooltip` |
| Validation error | `FormField error` | toast, `Alert` |
| Outcome of an action ("Saved", "Export failed") | `notify.success / error` | `Alert` |
| Result or page-level message | `Alert` (`actions` for buttons) | toast |
| Failed request (message, trace id, retry) | `ErrorAlert` | `Alert` + hand-built reference line and button |
| Terms to accept before using the app | `AgreementDialog` + `useAgreementAccepted` | `Dialog` with custom dismiss logic |
| Confirm delete / reset | `ConfirmDialog destructive` | `window.confirm` |
| Form in a modal | `Dialog dismissible="escape"` + `DialogHeader/Body/Footer` | raw MUI `Dialog` |
| Small static table | `DataTable` (inside `Card padding="none"`) | MUI `Table` |
| Results users sort, filter, search | `GridView` | `DataTable` + hand-written sorting |
| Panel with a title | `Card` | styled `div` |
| Label/value details (About, result properties) | `DescriptionList` | hand-written `<dl>` grid |
| Nothing to show yet | `EmptyState` | blank space |
| Loading inline / a whole pane | `Spinner` / `LoadingIndicator` or `VisualizationStage loading` | |
| Icon-only button | `IconButton aria-label="…"` + `Tooltip` with the same text | `Button` with only an icon |
| Calculator page layout | `Workspace` + `SectionLayout` + `Section` | custom split panes |
| Drawing with zoom | `ImageViewer` in `VisualizationStage` | |
| "What's new" | `ReleaseNotesDialog` + `useReleaseNotesSeen` | custom modal |
| Formula or equation | MathML `<math>` (see "Math formulas") | images of formulas, KaTeX/MathJax, hand-built `<sup>`/`<sub>` fractions |
| Variable in a label (S<sub>DS</sub>) | `MathVar` + `MathSub` | `<span className="font-math italic">` + `<sub>` |

## Forms

```tsx
const [thickness, setThickness] = useState<number | null>(1.5);
const thicknessError =
  thickness === null ? 'Required.' : !isInRange(thickness, { min: 1.5, max: 3.5 }) ? 'Must be between 1.5 and 3.5 in.' : undefined;

<FormField label="Member thickness" htmlFor="thickness" required description="1.5 to 3.5 in." help="Measured perpendicular to the grain." error={thicknessError}>
  <NumberInput value={thickness} onChange={setThickness} min={1.5} max={3.5} step={0.25} precision={3} addonAfter="in" />
</FormField>
```

- One control per `FormField`; the control needs no `id`, label or ARIA props, the field wires them. Outside a `FormField`, give the control an `aria-label`.
- `NumberInput` values are `number | null`; keep state as `number | null`, never strings. It flags out-of-range values but keeps them (so the user sees their mistake); show the message through `FormField error`. Use `clampBehavior="blur"` only when silently correcting is acceptable.
- Reuse the kit's number helpers for validation and math: `isInRange`, `roundTo`, `parseNumber`, `formatNumber`.
- Group related inputs in `Card role="group"` (use `titleAs` to fit the heading outline, `wrapTitle` for long titles); screen readers then announce the group name when focus enters it. Several groups in accordions where only one should be open: `useAccordionGroup(keys, { exclusive: true, initial: { first: true } })`, without `ExpandCollapseAllButton`.
- A checkbox or switch that needs an explanation gets `help` and `helpLabel` ("About wet service"), not a separate `InfoTip`.
- Put Calculate / Restart in the input `Section`'s `footer` (`footerAlign="between"` for Restart at the left, primary button last). It stays visible and never covers a field.
- Buttons are `type="button"` by default; the submitting one needs `type="submit"`. Use `loading` on the button while calculating so it cannot be clicked twice. One `variant="primary"` button per view.

## Dialogs, feedback, help

- `Dialog` with a form: `dismissible="escape"`, so a stray click outside does not lose input. While saving: `dismissible="none"`.
- Destructive actions: `ConfirmDialog destructive` (focus starts on Cancel).
- Toasts: success/info close after 5s, warning 8s, error stays. Never use toasts for validation.
- Wrap each workspace section in `ErrorBoundary` with `resetKeys` set to the inputs that feed it, and pass translated `labels={{ title, message, retry }}` instead of writing a custom `fallback`. The default fallback keeps keyboard focus in the pane after "Try again"; a custom fallback has to do that itself.
- A failed request: `<ErrorAlert title={…} reference={traceId && t('errors.reference', { traceId })} onRetry={refetch} retryLabel={t('actions.tryAgain')}>{message}</ErrorAlert>`. Mapping error codes to messages stays in the app.
- A license or terms agreement: `const agreement = useAgreementAccepted({ storageKey: 'my-app:eula', version })`, then `<AgreementDialog open={!agreement.accepted} onAccept={agreement.accept} onDecline={…} lang="en" labels={…}>{text}</AgreementDialog>`. Bump `version` to ask everyone again. If acceptance must be stored on a server, keep that in the app and drive `open` yourself.

## Results

- `GridView` needs `aria-label`, `getRowId` and stable column `id`s. Use `type: 'number'` with `format` for units, `rowHighlight` for pass/fail, `selectedRowId` + `onRowClick` to sync with a drawing, `presets` for common filters. Persist the user's layout with `onStateChange` → `initialState`.
- Translate grid texts with `labels` (defaults in `defaultGridViewLabels`) and pass the app language as `locale` so number columns use its separators.
- Label/value details: `DescriptionList` (`size="sm"` inside a `Card`); it stacks by itself in narrow panels.
- Formatting numbers: `formatDisplayNumber(value, { precision, locale })` for text people read (grouping, locale separators); `formatNumber` only for values that go back into an input; `formatFraction(value, { unit: '"' })` for fractional inches (`1 7/16"`, rounded to 1/32 by default). All return `''` for `null`, so no extra checks.

## Layout

```tsx
<Workspace>
  <SectionLayout
    layoutId="my-app"
    input={<Section title="Input"><InputForm /></Section>}
    illustration={<Section title="Drawing"><VisualizationStage loading={rendering}><ImageViewer src={url} alt="Connection drawing" /></VisualizationStage></Section>}
    output={<Section title="Output"><Results /></Section>}
  />
</Workspace>
```

Use `mobileTabs` to give mobile a single flat tab bar, and `keepMounted` on tabs whose state or queries must survive being hidden.

## Math formulas

The kit bundles STIX Two Math and applies it to every `<math>` element, so write formulas as MathML; no math library or font setup is needed.

```tsx
<math display="block">
  <msub><mi>M</mi><mi>max</mi></msub><mo>=</mo>
  <mfrac><mrow><mi>w</mi><msup><mi>L</mi><mn>2</mn></msup></mrow><mn>8</mn></mfrac>
</math>
```

- `display="block"` for a formula on its own line; omit it inside a sentence. In table cells add `displaystyle="true"` so fractions are not shrunk.
- Variables in `<mi>` (italic), numbers in `<mn>`, operators in `<mo>`, words in `<mtext>`. Brackets in `<mo>` around an `<mtable>` or fraction stretch by themselves.
- Symbols inside ordinary text (labels, table values): `<span className="font-math">σ ≤ 0.6 F<sub>y</sub></span>`.
- Variables in labels: `<MathVar>S</MathVar><MathSub>DS</MathSub>` (italic variable, upright subscript that keeps the line height). In translated texts pass them as elements: `<Trans components={{ v: <MathVar />, s: <MathSub /> }} />`.
- Show a result by substituting the inputs into the formula (`<mn>{value}</mn>`) inside an `<output>`, formatted with `formatNumber`.
- TypeScript does not know MathML tags yet (`Property 'math' does not exist on type 'JSX.IntrinsicElements'`). Add the declaration from `docs/design-tokens.md` → "Math formulas" once, as `src/mathml.d.ts`, with the tags you use.

## Theming

The app sets its theme once, at the root:

```tsx
import theme from './theme.config'; // exported from the kit's theme builder
<PlatformThemeProvider config={theme} density={settings.density}>
```

A single `colors={{ brand }}` derives every brand shade. Do not restyle individual components to change colors; change the theme.

## Before you finish

- No hex colors, no direct MUI component imports, no `<input type="number">` in your diff.
- Every input has a visible label (through `FormField`) or an `aria-label`; every icon-only button has `aria-label`.
- Try the screen with the keyboard only: Tab order, visible focus, Enter/Escape in dialogs.
- If the kit is missing something the app needs, say so instead of building a lookalike in the app; it probably belongs in the kit (see the kit's `platform-ui-component` skill).
