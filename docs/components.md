# Components

Most styling lives in the MUI theme (`createPlatformTheme`), so plain MUI components (`TextField`, `Select`, `Autocomplete`, `Menu`…) get the platform look too. The kit's wrappers add a smaller, safer API on top: normalized callback values, accessibility wiring and sensible defaults.

Live examples of every component are in the [showcase](getting-started.md#the-showcase).

- [Actions](#actions): `Button`, `IconButton`, `CloseButton`, `DropdownMenu`
- [Overlays](#overlays): `Dialog`, `ConfirmDialog`, `AgreementDialog`, `Tooltip`, `InfoTip`, `HelpPopover`, toasts
- [Forms](#forms): `FormField`, `TextInput`, `NumberInput`, `Select`, `Combobox`, `Checkbox`, `Switch`, `RadioGroup`, `OptionCardGroup`
- [Navigation](#navigation): `TopNav`, `NavMenu`, `Tabs`, `Accordion`
- [Data display](#data-display): `Card`, `DescriptionList`, `DataTable`, `GridView`, grid cells, MUI primitives
- [Feedback](#feedback): `Alert`, `ErrorAlert`, `EmptyState`, `Spinner`, `LoadingIndicator`, `ErrorBoundary`
- [Utilities](#utilities): `cn`, number helpers, search and filter helpers, math notation

See also: [GridView](grid-view.md), [Workspace layout](workspace-layout.md), [Release notes](release-notes.md).

---

## Actions

### Button

```tsx
<Button variant="primary" onClick={calculate}>Calculate</Button>
<Button variant="danger" startIcon={<DeleteOutlineIcon />}>Delete</Button>
<Button variant="primary" loading={isSaving}>Save</Button>
<Button type="submit">Submit</Button>
```

MUI `Button` props, with the platform's variants:

| Prop | Values | Default |
| --- | --- | --- |
| `variant` | `primary`, `primaryDark`, `secondary`, `default`, `tertiary`, `text`, `textDark`, `danger`, `fab` | `default` |
| `size` | `small`, `medium` | `medium` |
| `loading` | `boolean`: shows a spinner and blocks clicks | `false` |
| `type` | `button`, `submit`, `reset` | `button` |

Use one `primary` button per view. A button never submits a form unless it has `type="submit"`. MUI's `contained` and `outlined` variants are disabled to keep one vocabulary.

### IconButton, CloseButton

```tsx
<Tooltip title="Settings">
  <IconButton aria-label="Settings"><SettingsIcon /></IconButton>
</Tooltip>
<CloseButton onClick={close} />
```

`IconButton` requires `aria-label` or `aria-labelledby` at the type level. Pair it with a `Tooltip` carrying the same text. `CloseButton` is the "X" used in dialogs and popovers.

### DropdownMenu

```tsx
<DropdownMenu
  label="Actions"
  items={[
    { id: 'edit', label: 'Edit', icon: <EditIcon />, onSelect: edit },
    { id: 'copy', label: 'Duplicate', onSelect: duplicate, disabled: true },
    { id: 'sep', divider: true },
    { id: 'delete', label: 'Delete', onSelect: remove, danger: true },
  ]}
/>
```

| Prop | Type | Description |
| --- | --- | --- |
| `label` | `ReactNode` | Text of the trigger button |
| `items` | `DropdownMenuItem[]` | `{ id, label, onSelect, icon?, disabled?, danger? }` or `{ id, divider: true }` |
| `variant`, `size`, `disabled` | Button props | Trigger button appearance |

Menus are 160–320px wide; long labels wrap instead of being cut. Items are at least 36px tall (48px on touch screens).

---

## Overlays

### Dialog

```tsx
<Dialog open={open} onClose={close} dismissible="escape">
  <DialogHeader onClose={close}>Save as template</DialogHeader>
  <DialogBody>…</DialogBody>
  <DialogFooter>
    <Button onClick={close}>Cancel</Button>
    <Button variant="primary">Save</Button>
  </DialogFooter>
</Dialog>
```

MUI `Dialog` props, plus:

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `onClose` | `(reason: 'backdropClick' \| 'escapeKeyDown') => void` | | Called on Escape or backdrop click, as allowed by `dismissible` |
| `placement` | `'top' \| 'center'` | `'top'` | `top` slides in below the top nav |
| `dismissible` | `'any' \| 'escape' \| 'none'` | `'any'` | `escape`: a stray click outside does not lose form input. `none`: only the dialog's buttons close it (use while saving) |

`DialogHeader` takes `children` (the title, which names the dialog) and an optional `onClose` that shows the close button. `DialogBody` and `DialogFooter` are MUI `DialogContent` and `DialogActions`.

Focus is trapped inside the dialog and returns to the trigger on close; the page behind is inert.

### ConfirmDialog

```tsx
<ConfirmDialog
  open={open}
  title="Delete this project?"
  confirmLabel="Delete"
  destructive
  loading={isDeleting}
  onConfirm={remove}
  onCancel={() => setOpen(false)}
>
  This cannot be undone.
</ConfirmDialog>
```

| Prop | Type | Description |
| --- | --- | --- |
| `open`, `title`, `children` | | Visibility, title and message |
| `confirmLabel`, `cancelLabel` | `ReactNode` | Button texts |
| `destructive` | `boolean` | Red confirm button; focus starts on Cancel and backdrop clicks are ignored |
| `loading` | `boolean` | Locks the dialog: it cannot be closed or confirmed twice |
| `onConfirm`, `onCancel` | `() => void` | |

### AgreementDialog

Terms the user must accept before using the app (license agreement, terms of use). Escape and clicks outside do nothing; only the two buttons close it. The text scrolls inside the dialog (up to 60% of the viewport height), can be scrolled with the keyboard, and is read out as the dialog's description.

```tsx
const agreement = useAgreementAccepted({ storageKey: 'my-app:eula', version: EULA_VERSION });

<AgreementDialog
  open={!agreement.accepted}
  title={t('eula.title')}
  note={t('eula.englishOnly')}
  lang="en"
  labels={{ accept: t('eula.agree'), decline: t('eula.disagree') }}
  onAccept={agreement.accept}
  onDecline={signOut}
>
  <p>Read this agreement carefully…</p>
  <h3>1. License</h3>
  <p>…</p>
</AgreementDialog>
```

| Prop | Type | Description |
| --- | --- | --- |
| `open`, `title` | `boolean`, `ReactNode` | |
| `children` | `ReactNode` | The agreement text. `h3` headings, paragraphs and lists are styled |
| `note` | `ReactNode` | Muted line above the text, in the UI language (e.g. "Available in English only") |
| `lang` | `string` | BCP 47 language of the text when it differs from the page, so screen readers pronounce it correctly |
| `onAccept`, `onDecline` | `() => void` | What declining means (sign out, leave) is up to the app |
| `labels` | `{ accept: string; decline: string }` | Button texts |

Focus is not restored when it closes, because it usually opens on page load.

**The accepted version.** `useAgreementAccepted({ storageKey, version })` returns `{ accepted, accept() }` and keeps the accepted version in `localStorage`. `accepted` is true only for the current `version`, so publishing a new agreement version asks every user again. If acceptance must be recorded on a server, keep that in the app and pass your own `open`.

### Tooltip vs InfoTip

| | `Tooltip` | `InfoTip` |
| --- | --- | --- |
| Opens on | Hover, keyboard focus, long press | Click, Enter, Space |
| Content | Short text, 1–2 lines, text only | Explanations: paragraphs, lists, links |
| Focus | Stays on the trigger | Moves inside; links are reachable |

Never put links or other interactive content in a `Tooltip`: keyboard and touch users cannot reach them.

### Tooltip

```tsx
<Tooltip title="Reset view">
  <IconButton aria-label="Reset view"><RestartAltIcon /></IconButton>
</Tooltip>
```

MUI `Tooltip` with platform defaults: opens after 300ms (100ms when moving between neighbors), stays open while the pointer is over it, closes on Escape, 12px text, 320px maximum width, works on disabled buttons. It uses `describeChild`, so it describes the button instead of replacing its accessible name.

### InfoTip

```tsx
<InfoTip title="How capacity is calculated">
  <p>Capacity is the lowest of the fastener and member limits.</p>
  <ul><li>Fastener: withdrawal and lateral</li><li>Members: bearing</li></ul>
  <p>See the <a href="/guide">design guide</a>.</p>
</InfoTip>
```

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `children` | `ReactNode` | | Content |
| `title` | `ReactNode` | | Bold heading; also names the dialog |
| `label` | `string` | `'More information'` | Accessible name of the trigger |
| `trigger` | `'help' \| 'info' \| ReactElement` | `'help'` | `help`: brand-colored "?" bubble. `info`: "i" icon. Or your own element, e.g. `<Button variant="text">Why?</Button>` |
| `placement` | `'top' \| 'bottom' \| 'left' \| 'right'` | `'bottom'` | |
| `maxWidth` | `number` | `360` | Long content scrolls after 384px |

Closes on Escape, outside click or the X button, and returns focus to the trigger. `HelpPopover` is an alias of `InfoTip` with the default trigger, kept for existing code and used by `FormField help`.

### Toasts

```tsx
// once, in the app shell
<ToastHost />

// anywhere
notify.success('Saved');
notify.error('Export failed', <button onClick={retry}>Retry</button>);
notify.dismiss();
```

| Function | Auto close |
| --- | --- |
| `notify.success(content, action?)` | 5s |
| `notify.info(content, action?)` | 5s |
| `notify.warning(content, action?)` | 8s |
| `notify.error(content, action?)` | Never: stays until closed |
| `notify.dismiss(id?)` | Closes one toast, or all |

Toasts pause while hovered or while the window is in the background, and at most 5 are shown. Use toasts for the outcome of an action; show validation errors next to the field instead. Do not import `react-toastify` in the app: `notify` and `ToastHost` must share the kit's instance.

---

## Forms

### FormField

Wraps one control with its label, help, description and error, and wires them for screen readers.

```tsx
<FormField
  label="Member thickness"
  htmlFor="thickness"
  required
  help="Measured perpendicular to the grain."
  description="1.5 to 3.5 in."
  error={thicknessError}
>
  <NumberInput value={thickness} onChange={setThickness} addonAfter="in" />
</FormField>
```

| Prop | Type | Description |
| --- | --- | --- |
| `label` | `ReactNode` | 12px label |
| `htmlFor` | `string` | Id given to the control |
| `required` | `boolean` | Red label with `*`; sets `required` on the control |
| `help` | `ReactNode` | Content of a "?" `InfoTip` next to the label |
| `description` | `ReactNode` | Gray hint under the control |
| `error` | `ReactNode` | Red message; marks the control invalid (`aria-invalid`, red ring) and is announced |
| `disabled` | `boolean` | Disables the control |

Kit controls inside a `FormField` (`TextInput`, `NumberInput`, `Select`, `Combobox`, `RadioGroup`) pick up `id`, `aria-describedby`, `aria-invalid`, `required` and `disabled` automatically, so they need no `id`. Outside a `FormField`, give them an `aria-label`.

For a custom control, read the wiring with `useFormField()`:

```ts
const field = useFormField(); // { id, labelId, describedBy, invalid, required, disabled } | null
```

### TextInput

```tsx
<TextInput value={name} onChange={(e) => setName(e.target.value)} addonAfter="mm" />
<TextInput multiline minRows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
```

MUI `OutlinedInput` props, 40px high and full width by default, plus `addonBefore` and `addonAfter` (units, icons, actions).

### NumberInput

The number field for every calculator input. Use it instead of `TextInput` or `<input type="number">`.

```tsx
const [thickness, setThickness] = useState<number | null>(1.5);

<NumberInput value={thickness} onChange={setThickness} min={1.5} max={3.5} step={0.25} precision={3} addonAfter="in" />
```

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `value` | `number \| null` | | `null` means empty. Never `NaN` |
| `onChange` | `(value: number \| null) => void` | | Called with every complete number, or `null` when cleared |
| `min`, `max` | `number` | | Range. Out-of-range values are flagged, see `clampBehavior` |
| `step` | `number` | `1` | Arrow key step (Shift ×10) |
| `precision` | `number` | | Maximum decimals; `0` = integers |
| `clampBehavior` | `'none' \| 'blur'` | `'none'` | `none`: keep the value and mark it invalid. `blur`: clamp on blur |

Plus the `TextInput` props (`addonBefore`, `addonAfter`, `placeholder`, `disabled`, `readOnly`…).

| Situation | Behavior |
| --- | --- |
| Letters, `e`, spaces, thousands separators | Rejected as you type or paste |
| `,` | Read as the decimal separator (`2,5` → `2.5`) |
| `-` when `min >= 0`, more decimals than `precision` | Rejected |
| Empty field | `onChange(null)`, never `0`, `NaN` or `''` |
| Incomplete text (`-`, `.`) | No `onChange`. Reverts to the last value on blur |
| Arrow Up / Down | Steps by `step` (Shift ×10), clamped to `[min, max]`, without float drift (`0.1 + 0.2` = `0.3`) |
| Mouse wheel | Does not change the value |
| Out of `[min, max]` | Kept and marked invalid so the app can explain; clamped on blur with `clampBehavior="blur"` |
| `precision` set | Rounded half away from zero on blur, shown with fixed decimals |
| Screen readers | `spinbutton` role with `aria-valuemin`, `aria-valuemax`, `aria-valuenow` |

The same logic is exported for app validation: see [number helpers](#number-helpers).

### Select

```tsx
<Select
  value={connection}
  onChange={setConnection}
  placeholder="Pick a connection"
  options={[
    { value: 'wood', label: 'Wood to Wood', note: 'most common' },
    { value: 'steel', label: 'Wood to Steel', image: '/img/steel.png' },
  ]}
/>
<Select multiple value={materials} onChange={setMaterials} options={materialOptions} />
```

| Prop | Type | Description |
| --- | --- | --- |
| `value` | `V \| ''` (single) or `V[]` (`multiple`) | Keeps number values as numbers |
| `onChange` | `(value: V) => void` or `(value: V[]) => void` | |
| `options` | `SelectOption<V>[]` | `{ value, label, image?, note?, searchText?, disabled? }` |
| `multiple` | `boolean` | Checkboxes in the list; selected labels joined with commas |
| `placeholder`, `disabled`, `error`, `fullWidth`, `name`, `id` | | |
| `aria-label` | `string` | Accessible name outside a `FormField` |

The dropdown is as wide as the field.

### Combobox

Searchable single select, built on MUI `Autocomplete`.

```tsx
<Combobox value={species} onChange={setSpecies} options={speciesOptions} placeholder="Search species" />
```

Same option shape as `Select`. `value` is `V | null`; clearing gives `null`. Options whose `label` is not a string need `searchText` for filtering. `noOptionsText` defaults to `'No options'`.

### Checkbox, Switch

```tsx
<Checkbox label="Include fasteners" checked={include} onChange={setInclude} />
<Switch label="Metric units" checked={metric} onChange={setMetric} />
```

MUI props, with `label` and `onChange(checked: boolean)`. Use a checkbox for options applied on submit or calculate, a switch for settings that apply immediately. `Checkbox` supports `indeterminate` for "select all" parents.

`help` adds the "?" bubble after the label (the same one as `FormField help`); `helpLabel` names its button (default "More information"). The bubble sits next to the label, not inside it, so it is not part of the checkbox's name and opening it does not toggle the checkbox.

```tsx
<Checkbox label="Wet service" checked={wet} onChange={setWet} help="Moisture content above 19% in service." helpLabel="About wet service" />
```

### RadioGroup

```tsx
<RadioGroup<number>
  name="plies"
  value={plies}
  onChange={setPlies}
  direction="column"
  options={[
    { value: 1, label: 'One ply' },
    { value: 2, label: 'Two plies' },
  ]}
/>
```

| Prop | Type | Description |
| --- | --- | --- |
| `name`, `value`, `onChange` | | `value` keeps its type (`number`, `boolean`, `string`); `null` = nothing selected |
| `options` | `RadioOption<V>[]` | `{ value, label, disabled? }` |
| `direction` | `'row' \| 'column'` | Default `'row'` |
| `error`, `disabled` | | |
| `aria-label`, `aria-labelledby` | `string` | Name when not inside a `FormField` |

For 2–5 visible choices. Arrow keys move the selection and skip disabled options.

### OptionCardGroup

Picture cards for choices such as connection types.

```tsx
<OptionCardGroup
  aria-label="Shear type"
  value={shear}
  onChange={setShear}
  options={[
    { value: 'single', label: 'Single shear', image: <img src={singleSvg} alt="" />, description: 'One shear plane between two members.' },
    { value: 'double', label: 'Double shear', image: <img src={doubleSvg} alt="" /> },
  ]}
/>
```

| Prop | Type | Description |
| --- | --- | --- |
| `value`, `onChange` | `V \| null`, `(value: V) => void` | Clicking the selected card keeps it selected |
| `options` | `OptionCard<V>[]` | `{ value, label, image?, description?, disabled? }` |
| `showCheck` | `boolean` | Check mark on the selected card. Default `true` |
| `aria-label` | `string` | Group name |

`description` (plain text) is shown as a tooltip on hover and keyboard focus, and is always the card's accessible description, also while the tooltip is closed.

---

## Navigation

### TopNav, NavMenu

```tsx
<TopNav logo={<img src={logo} alt="Demo Calculator" />} right={<UserMenu />}>
  <NavMenu label="File" items={[{ id: 'new', label: 'New project', onSelect: create }]} />
</TopNav>
```

A 54px bar with a brand-colored bottom border. `NavMenu` labels get a 4px underline on hover and while open. `NavMenu` items: `{ id, label, onSelect, icon?, disabled? }`. The full configurable navigation (menus, slots) belongs in the app shell; these are its building blocks.

### Tabs

```tsx
<Tabs id="results" value={tab} onChange={setTab} aria-label="Result views">
  <Tab value="summary" label="Summary" />
  <Tab value="details" label="Details" />
</Tabs>
<TabPanel tabsId="results" value="summary" current={tab}>…</TabPanel>
<TabPanel tabsId="results" value="details" current={tab} keepMounted>…</TabPanel>
```

`Tabs` takes MUI props with a typed `value` and `onChange(value)`. Give `Tabs` an `id` and each `TabPanel` the same `tabsId` to link tabs and panels. `keepMounted` keeps a hidden panel's state. Arrow keys, Home and End move between tabs and skip disabled ones.

### Accordion

```tsx
const group = useAccordionGroup(['loads', 'members'] as const);

<Section title="Input" actions={<ExpandCollapseAllButton group={group} />}>
  <Accordion title="Loads" {...group.item('loads')}>…</Accordion>
  <Accordion title="Members" {...group.item('members')}>…</Accordion>
</Section>
```

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `title` | `ReactNode` | | Header text |
| `defaultExpanded` | `boolean` | `true` | Uncontrolled initial state |
| `expanded`, `onChange` | `boolean`, `(expanded: boolean) => void` | | Controlled state |
| `headingLevel` | `'h2'`–`'h6'` | `'h3'` | The header sits inside a heading of this level |
| `help` | `ReactNode` | | Content of a "?" bubble right after the title (an `InfoTip`). It sits outside the header button, so it is not part of the button's name and opening it does not toggle the section |
| `helpLabel` | `string` | `'More information'` | Accessible name of the "?" button, e.g. "About loads" |

`useAccordionGroup(keys, options?)` shares state across several accordions and returns `{ item(key), allExpanded, allCollapsed, expandAll, collapseAll, toggleAll }`. `ExpandCollapseAllButton` toggles the group: "Collapse all" while any section is open, otherwise "Expand all".

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `defaultExpanded` | `boolean` | `true` (`false` when exclusive) | State of keys not in `initial` |
| `initial` | `Partial<Record<K, boolean>>` | | Starting state of specific keys, e.g. `{ [latest]: true }` |
| `exclusive` | `boolean` | `false` | At most one section open: opening one closes the others. Starts with the first key set to true in `initial` open |

In exclusive mode `expandAll` does nothing and `toggleAll` only collapses, so do not show `ExpandCollapseAllButton` with it:

```tsx
const group = useAccordionGroup(['seismic', 'wind', 'geometry'] as const, { exclusive: true, initial: { seismic: true } });
```

The older positional form `useAccordionGroup(keys, defaultExpanded, initial)` still works.

---

## Data display

### Card

```tsx
<Card title="Fastener capacity" subtitle="per connection" actions={<Button size="small">Details</Button>} footer="Total: 1,450 lbs">
  …
</Card>
<Card title="Results" padding="none">
  <DataTable aria-label="Results">…</DataTable>
</Card>
```

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `title`, `subtitle`, `actions` | `ReactNode` | | Header: bold title, muted subtitle, right-aligned actions |
| `titleAs` | `'h2' \| 'h3' \| 'h4'` | `'h3'` | Heading level of the title |
| `footer` | `ReactNode` | | Right-aligned bottom row |
| `padding` | `'none' \| 'sm' \| 'md'` | `'sm'` | 8px, 12px, or none: a table sits flush and doubled borders are removed |
| `role` | `'group'` | | Makes the card a named group of inputs (see below) |
| `wrapTitle` | `boolean` | `false` | A long title wraps onto more lines instead of being cut off with an ellipsis |

**Input groups inside an accordion.** With `role="group"` the card is a `role="group"` element labelled by its title, so screen readers announce "Seismic" when focus enters a field inside it. A card without `role` stays a plain `<section>` (not a landmark), which suits result panels.

```tsx
<Accordion title="Loads" {...group.item('loads')}>
  <div className="grid gap-3 md:grid-cols-2">
    <Card role="group" title="Seismic" titleAs="h4" padding="md" wrapTitle>
      <FormField label="Short-period acceleration" htmlFor="sds"><NumberInput … /></FormField>
    </Card>
    <Card role="group" title="Wind" titleAs="h4" padding="md" wrapTitle>…</Card>
  </div>
</Accordion>
```

### DescriptionList

Label/value pairs (an About dialog, result details) as a semantic `dl`/`dt`/`dd` list.

```tsx
<DescriptionList items={[
  { id: 'version', label: 'Version', value: '2.4.0' },
  { id: 'code', label: 'Design code', value: 'ASCE 7-22' },
]} />
<Card title="Result details"><DescriptionList size="sm" items={details} /></Card>
```

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `items` | `{ id: string; label: ReactNode; value: ReactNode }[]` | | |
| `size` | `'sm' \| 'md'` | `'md'` | `sm`: 12px text and tighter rows, for inside cards |
| `className` | `string` | | |

Labels are medium weight. Two columns when the list's container is at least 20rem (320px) wide, label over value below that; it measures its container, not the window, so it also stacks in a narrow workspace panel. Long values wrap.

### DataTable

Static tables for reports and short lists. For sorting and filtering, use [GridView](grid-view.md).

```tsx
<DataTable aria-label="Capacities" maxHeight={200}>
  <DataTable.Head>
    <DataTable.Row>
      <DataTable.Cell>Model</DataTable.Cell>
      <DataTable.Cell align="right">Capacity</DataTable.Cell>
    </DataTable.Row>
  </DataTable.Head>
  <DataTable.Body>…</DataTable.Body>
</DataTable>
```

12px cells and a bold 48px header. With `maxHeight`, the header sticks and the scroll area is keyboard focusable. Parts: `Head`, `Body`, `Footer`, `Row`, `Cell`.

### Grid cells

`GridImageCell` (thumbnail, text and subtext) and `GridLinkCell` (a real link, or a button styled as a link for in-app actions) are the cells `GridView` uses for `image` and `link` columns. They work in any table.

```tsx
<GridImageCell src={url} text="SDWS22400" subtext="Timber screw" />
<GridLinkCell href={pdfUrl} external>Datasheet</GridLinkCell>
<GridLinkCell onClick={openDetails}>View</GridLinkCell>
```

External links open in a new tab with `rel="noopener noreferrer"` and say so to screen readers.

### MUI primitives

`Box`, `Stack`, `Typography`, `Divider`, `Link` and `Chip` are re-exported from MUI and styled by the theme. Use `Link` for navigation and `Button` for actions.

---

## Feedback

### Alert

```tsx
<Alert severity="error" title="Invalid input">Thickness is out of range.</Alert>
```

| Prop | Type | Default |
| --- | --- | --- |
| `severity` | `'info' \| 'success' \| 'warning' \| 'error'` | `'info'` |
| `title`, `children`, `icon`, `className` | | |
| `actions` | `ReactNode` | Buttons under the text, e.g. `<Button size="small">Undo</Button>` |

A tinted banner with a large icon, bold title and 12px text. `error` is announced as an alert; other severities as polite status messages.

### ErrorAlert

The standard message for a failed request: what went wrong, an optional support reference, an optional retry.

```tsx
<ErrorAlert
  title={t('errors.title')}
  reference={error.traceId && t('errors.reference', { traceId: error.traceId })}
  onRetry={refetch}
  retryLabel={t('actions.tryAgain')}
>
  {messageFor(error.code)}
</ErrorAlert>
```

| Prop | Type | Description |
| --- | --- | --- |
| `title`, `children` | `ReactNode` | Heading and message. Turning error codes into messages stays in the app |
| `reference` | `ReactNode` | Support reference (e.g. a server trace id), in small monospace text that can be selected and copied |
| `onRetry`, `retryLabel` | `() => void`, `ReactNode` | Retry button. `retryLabel` is required when `onRetry` is set |
| `className` | `string` | |

### EmptyState

```tsx
<EmptyState title="No results yet" action={<Button>Calculate</Button>}>Fill in the inputs.</EmptyState>
```

Props: `title`, `children`, `icon`, `action`, `className`.

### Spinner, LoadingIndicator

```tsx
<Spinner label="Loading results" />
<LoadingIndicator />
```

`Spinner` is a small inline progress indicator that follows the text color (`size` default 20, `label` default `'Loading'`). `LoadingIndicator` is the full-pane overlay; its text defaults to "Updating" and can be replaced through `children`. Both are announced to screen readers.

### ErrorBoundary

```tsx
<ErrorBoundary resetKeys={[inputs]} onError={(error) => reportError(error)}>
  <ResultsTable data={results} />
</ErrorBoundary>
```

| Prop | Type | Description |
| --- | --- | --- |
| `fallback` | `(error, reset) => ReactNode` | Custom fallback. Takes precedence over the default one |
| `labels` | `Partial<ErrorBoundaryLabels>` | Texts of the default fallback: `{ title, message, retry }`. English defaults in `defaultErrorBoundaryLabels` |
| `onError` | `(error, info) => void` | Reporting (Sentry, console…) |
| `resetKeys` | `unknown[]` | The boundary resets when any value changes |

Wrap each workspace section in one, so a render error in one pane does not blank the whole app. The default fallback is an `ErrorAlert` with a "Try again" button. After "Try again", keyboard focus stays in the pane: it moves to the first focusable element of the recovered content, or back to the retry button if the content fails again. With a custom `fallback`, focus handling is up to the app.

```tsx
<ErrorBoundary onError={log} labels={{ title: t('errors.title'), message: t('errors.renderFailed'), retry: t('actions.tryAgain') }}>
  <OutputSection />
</ErrorBoundary>
```

---

## Utilities

### cn

```ts
cn('p-2 text-sm', isActive && 'bg-brand', className); // clsx + tailwind-merge
```

### Number helpers

Pure functions behind `NumberInput`, exported for app validation and calculations.

| Function | Description |
| --- | --- |
| `parseNumber(text)` | `number` for complete input, `null` for empty, `undefined` for incomplete (`-`, `.`). Accepts `,` as decimal separator |
| `isPartialNumber(text, rules?)` | Whether text may appear while typing a number |
| `formatNumber(value, precision?)` | Text for an input field (what `NumberInput` shows): no grouping, `.` decimal, never exponent notation. `parseNumber` reads it back |
| `formatDisplayNumber(value, { precision?, locale? })` | Text for people: locale separators and grouping (`1234.5` → `1,234.5`; `'de-DE'` → `1.234,5`). Default `'en-US'`. Not for inputs |
| `formatFraction(value, { denominator?, unit? })` | Mixed number rounded to the nearest 1/`denominator` (default 32): `0.4375` → `7/16`, `1.5` → `1 1/2`, `-1.5` → `-1 1/2`, `0.99` → `1`. `unit: '"'` gives `7/16"` |
| `roundTo(n, digits)` | Rounds half away from zero without binary artifacts (`1.005` → `1.01`) |
| `stepNumber(value, delta, rules?)` | Steps and clamps without float drift |
| `clamp(n, min?, max?)`, `isInRange(n, rules)`, `decimalsOf(n)` | |

`rules` is `NumberRules`: `{ min?, max?, precision? }`. The format helpers return `''` for `null`, `NaN` and `Infinity`.

### Search and filter helpers

Pure functions behind `GridView`, usable on their own.

| Function | Description |
| --- | --- |
| `normalizeText(value)` | Lower case, trimmed, accents removed (`"Bê tông"` → `"be tong"`) |
| `matchesText(value, query)` | Case- and accent-insensitive "contains" |
| `matchesSearch(values, query)` | Every word of the query appears in at least one value |
| `matchesNumberRange(value, { min?, max? })` | Inclusive range |
| `matchesSelect(value, selected)` | Value is one of the selected values; empty selection matches all |
| `isEmptyFilter(value)` | Whether a filter value filters nothing |

### Math notation

For variables in labels and running text (S<sub>DS</sub>, F<sub>y</sub>). Whole formulas are MathML, see [Math formulas](design-tokens.md#math-formulas).

```tsx
<MathVar>S</MathVar><MathSub>DS</MathSub>

// In translated texts, e.g. react-i18next: "<v>S</v><s>DS</s> from the site class table"
<Trans i18nKey="inputs.sds" components={{ v: <MathVar />, s: <MathSub /> }} />
```

`MathVar` renders a `<var>` in the math font, italic. `MathSub` renders an upright `<sub>` that does not stretch the line height; descriptive subscripts such as DS are not variables, so they stay upright (wrap a variable subscript in `MathVar`).
