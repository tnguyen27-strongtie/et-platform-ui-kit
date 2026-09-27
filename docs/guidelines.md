# Guidelines

The behavior rules every component follows, and the design decisions behind them. New components must follow the same rules; the [test suite](../CONTRIBUTING.md#testing) checks most of them.

- [Behavior rules](#behavior-rules)
- [Accessibility](#accessibility)
- [Design decisions](#design-decisions)

## Behavior rules

| Rule | How the kit applies it |
| --- | --- |
| No accidental form submits | `Button` defaults to `type="button"`. Submitting requires an explicit `type="submit"` |
| No double actions while busy | `Button loading` blocks clicks. `ConfirmDialog loading` locks the whole dialog |
| Disabled looks off | 40% opacity, `not-allowed` cursor, never darker or bolder than the enabled state |
| Errors belong to their field | `FormField` wires `aria-invalid`, `aria-describedby` (description + error), `required` and the label to `TextInput`, `NumberInput`, `Select`, `Combobox` and `RadioGroup` |
| Validation errors next to the field, not in a toast | Toasts are for the outcome of an action. Error toasts stay until closed |
| No lost work by accident | `ConfirmDialog` before delete or reset. Dialogs with forms use `dismissible="escape"`, so a stray click outside does not close them |
| Safe default for destructive actions | `ConfirmDialog destructive`: red confirm button, focus starts on Cancel |
| Local render errors stay local | Wrap each workspace section in an `ErrorBoundary` |
| The right tooltip | Short text → `Tooltip` (hover). Long content, links or lists → `InfoTip` (click). No links or buttons inside a `Tooltip` |
| Consistent text hierarchy | Titles (Card, Dialog, Accordion, EmptyState, Alert, table headers, `Typography h1–h6`) are **bold**; labels are medium; content is regular. `h1`–`h6` use a compact scale (24px → 12px) |
| 8px spacing rhythm | Card, Dialog, Accordion and table cells use 0.5rem padding; fields are 0.5–0.75rem apart |
| One menu size | Every action menu (`DropdownMenu`, `NavMenu`, MUI `Menu`) is 160–320px wide; long labels wrap. Items are at least 36px tall, 48px on touch screens. A `Select` dropdown is as wide as its field |
| Text and icons line up | Inter's metrics center capitals in the line box, so any icon + text pair aligned with `center` (checkbox, radio, switch, button icons) lines up without per-component tweaks |

## Accessibility

| Requirement | How the kit meets it |
| --- | --- |
| Visible keyboard focus (WCAG 2.4.7) | Ripple is off; every control shows a 2px brand-colored outline on `:focus-visible` (not `:focus`, so buttons do not stay highlighted after a mouse click) |
| Names for icon-only buttons | `IconButton` requires `aria-label` or `aria-labelledby` at the type level |
| Label in name (WCAG 2.5.3) | Controls' accessible names contain their visible text, e.g. the collapsed panel rail is "Expand Input" |
| Focus management in dialogs | Focus is trapped inside, Escape closes, focus returns to the trigger |
| Enough time (WCAG 2.2.1) | Toasts pause on hover and while the window is in the background; error toasts do not close on their own |
| Target size (WCAG 2.5.8) | Menu items are 48px tall on coarse pointers |
| Announcements | Errors use `role="alert"`; statuses, spinners and row counts use `role="status"` |
| Tooltips describe, not rename | `Tooltip` uses `describeChild`, so it adds a description instead of replacing the button's name |
| Keyboard-reachable scroll areas | Scrollable tables and grids are focusable |
| Contrast | Text colors are chosen for contrast (e.g. warning alerts use `warningText`, not yellow). Some default pairs are below 4.5:1; see [Not included yet](../README.md#not-included-yet) |

Every component fixture and every showcase page is checked with axe in the test suite.

## Design decisions

These choices are deliberate. Keep them when adding or changing components.

- **MUI is the only base library.** Dialog, Tooltip, Popover, Switch, Checkbox and Accordion are all built on MUI. Do not mix in Radix, Bootstrap or other UI libraries.
- **Styles live in the theme first.** Prefer `components.MuiXxx.styleOverrides` or `variants`, so plain MUI usage looks right too. Write a wrapper only when a simpler API helps.
- **Callbacks return values, not events.** `onChange(checked: boolean)`, `onChange(value: number | null)`, typed option values that stay numbers or booleans.
- **One vocabulary.** MUI's `contained` and `outlined` button variants are turned off; use the platform variants.
- **Open-source font.** Inter (SIL OFL 1.1) is bundled, covering Latin, Vietnamese, Cyrillic and Greek, with no font licensing to manage.
- **Icons come from `@mui/icons-material` only.**
- **Brand shadows are their own tokens** (`shadows.popover`…). `theme.shadows[0]` stays `'none'`, as MUI expects.
- **Density classes go on `<body>`**, not `<html>`, so `rem` units never change.
- **`theme.spacing` is 4px** (MUI's default is 8px), matching Tailwind's scale.
- **Layout.** `react-resizable-panels` (actively maintained) for resizable panes; the Input pane collapses into a rail that can be reopened; panel sizes persist; the viewer's control panel has a translucent white background and moves below the viewer on mobile.
- **Release notes are shared.** Each app supplies data only.
