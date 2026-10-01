# GridView

A data grid for calculation results: sorting, per-column filters, a master search with presets, column reordering, pinning and hiding, status highlighting and clickable rows. State is handled by `@tanstack/react-table` v9; markup, styles and keyboard behavior are the kit's own.

- [Example](#example)
- [Props](#props)
- [Columns](#columns)
- [Behavior](#behavior)
- [Persisting the layout](#persisting-the-layout)
- [Translation](#translation)
- [Limits](#limits)

## Example

```tsx
const columns: GridColumn<Fastener>[] = [
  { id: 'model', header: 'Model', value: 'model', type: 'image', width: 220,
    image: { src: (r) => r.imageUrl, subtext: (r) => r.description } },
  { id: 'material', header: 'Material', value: 'material', filter: 'select' },
  { id: 'capacity', header: 'Capacity', value: 'capacity', type: 'number',
    format: (v) => `${(v as number).toLocaleString('en-US')} lbs` },
  { id: 'sheet', header: 'Datasheet', value: (r) => `${r.model}.pdf`, type: 'link',
    link: { href: (r) => r.datasheetUrl, external: true }, filter: false, sortable: false },
  { id: 'details', header: 'Details', value: () => 'View', type: 'link',
    link: { onClick: (r) => openDetails(r) }, filter: false, sortable: false, searchable: false },
];

<GridView
  aria-label="Fastener results"
  rows={fasteners}
  columns={columns}
  getRowId={(r) => r.id}
  search={{ placeholder: 'Search model, material…', columns: ['model', 'material'] }}
  presets={[
    { id: 'high', label: 'Capacity ≥ 1,000 lbs', filters: { capacity: { min: 1000 } } },
    { id: 'wood', label: 'Wood only', filters: { material: ['Wood'] } },
  ]}
  rowHighlight={(r) => (r.status === 'Fails' ? 'danger' : r.status === 'Check' ? 'warning' : undefined)}
  selectedRowId={selectedId}
  onRowClick={(r) => setSelectedId(r.id)}
  initialState={savedLayout ?? { pinned: { start: ['model'], end: ['details'] } }}
  onStateChange={saveLayout}
  maxHeight={400}
  toolbar={<Button size="small">Export</Button>}
/>
```

## Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `rows` | `T[]` | | Data |
| `columns` | `GridColumn<T>[]` | | See [Columns](#columns) |
| `getRowId` | `(row: T) => string` | | Stable row id |
| `aria-label` | `string` | | Accessible name of the grid, e.g. "Fastener results" |
| `search` | `boolean \| { placeholder?, columns? }` | `true` | Master search box. `columns` limits the columns it searches |
| `presets` | `GridPreset[]` | | Saved searches shown as chips: `{ id, label, filters?, search? }` |
| `columnFilters` | `boolean` | `true` | Per-column filters and the **Filters** toggle. `false` removes them |
| `rowHighlight` | `(row: T) => 'success' \| 'warning' \| 'danger' \| 'info' \| null \| undefined` | | Tints a row by status |
| `selectedRowId` | `string \| null` | | Marks the current row (brand stripe, `aria-current`) |
| `onRowClick` | `(row: T) => void` | | Makes rows clickable and keyboard activatable |
| `initialState` | `Partial<GridViewState>` | | Starting sort, filters and layout. Later changes do not reset the grid |
| `onStateChange` | `(state: GridViewState) => void` | | Called once on mount with the starting state, then whenever the user changes sort, filters, search or layout |
| `maxHeight` | `number \| string` | | Scroll inside the grid with sticky headers |
| `toolbar` | `ReactNode` | | Extra buttons at the right of the toolbar |
| `emptyText` | `ReactNode` | `'No data'` | Shown when `rows` is empty |
| `labels` | `Partial<GridViewLabels>` | | Translated texts, see [Translation](#translation) |
| `locale` | `string` | `'en-US'` | Separators of number columns without `format`, e.g. `'de-DE'` shows `1.234,5` |
| `className` | `string` | | |

## Columns

| Field | Description |
| --- | --- |
| `id`, `header` | Stable id (used in state and presets) and column title |
| `value` | Field name or `(row) => value`. Drives sorting, filtering and search. Empty strings, `null` and `NaN` count as empty: shown as `—` and always sorted last |
| `type` | `text` (default), `number` (right aligned, tabular digits, range filter, thousands separators), `image` (thumbnail + text, needs `image`), `link` (needs `link`) |
| `cell` | `(row) => ReactNode` for custom content. Sorting, filtering and search still use `value` |
| `format` | `(value, row) => string`: display text, e.g. with units. The master search matches this text |
| `precision` | Fixed decimals for `number` columns |
| `image` | `{ src, alt?, subtext? }`: lazy-loaded thumbnail and a gray second line |
| `link` | `{ href, external? }` for a real `<a>` (new tab, safely, when `external`), or `{ onClick }` for a link-styled button that runs an in-app action |
| `width` | Fixed width in px. Default 160 (120 for numbers), so pinned columns line up |
| `align` | `start`, `center`, `end`. Numbers default to `end` |
| `sortable`, `searchable`, `hideable` | `false` turns the feature off for the column |
| `filter` | `'text' \| 'number' \| 'select' \| false`. Default: `number` for number columns, `text` otherwise |
| `filterOptions` | Choices of a `select` filter. Default: the distinct values in the data |

## Behavior

| Feature | Behavior |
| --- | --- |
| Sorting | Click a header: ascending → descending → off. Every column, including numbers, starts ascending. Shift+click adds a secondary sort (numbered). `aria-sort` on headers. Empty values stay last in both directions |
| Column filters | A filter row under the headers: text (contains, ignoring case and accents), number range (inclusive), multi-select. The toolbar shows "x of y rows" and **Clear filters** |
| Filter row toggle | The **Filters** button (`aria-pressed`) shows or hides the row. Hidden filters stay applied; the button shows how many are active, and their values come back unchanged. Start hidden with `initialState={{ filtersVisible: false }}` |
| Master search | Every word must appear, in any searchable column (`"wood 1,450"`). Ignores case and accents (`"be tong"` finds `"Bê tông"`). Escape clears it |
| Presets | A chip applies its filters and search in one click; clicking it again clears them. Editing a filter by hand deselects the chip |
| Reordering | Drag a header (the handle shows on hover), or use the column menu → Move left / Move right from the keyboard. Columns move within their region (pinned left, center, pinned right) |
| Pinning | Column menu → Freeze left / Freeze right / Unfreeze. Pinned columns stay in place while scrolling sideways, with a divider |
| Hiding | Column menu → Hide column; the **Columns** menu shows it again. The last visible column cannot be hidden. **Reset layout** restores the initial layout |
| Rows | `onRowClick`: rows are focusable; Enter or Space activates. Clicks on links and buttons inside a row do not count as a row click |
| Scrolling | Headers and the filter row stick to the top; the scroll area is keyboard focusable. The grid takes its parent's width and scrolls wide tables inside, so it never stretches the page |

## Persisting the layout

`onStateChange` receives a plain, serializable object. Store it and pass it back as `initialState`:

```ts
interface GridViewState {
  sort: Array<{ id: string; desc: boolean }>;
  filters: Record<string, GridFilterValue>; // string | { min?, max? } | Array<string | number | boolean>
  search: string;
  columnOrder: string[];
  pinned: { start: string[]; end: string[] };
  hidden: string[];
  filtersVisible: boolean;
}
```

```tsx
// App code: persist wherever the app keeps user settings.
const saved = loadSetting<GridViewState>('results-grid');
<GridView … initialState={saved ?? undefined} onStateChange={(s) => saveSetting('results-grid', s)} />
```

`onStateChange` fires once when the grid mounts (with the state built from `initialState`), then only when the state actually changes, not on every render. Saving on mount is harmless: it writes back what was loaded. The callback may be an inline function; a new function identity does not trigger a report.

**How it works**, for anyone changing it: the reported object is rebuilt on every render, so `GridView` compares its JSON text and reports in an effect keyed on that text (`src/components/grid/GridView.tsx`). Keying the effect on the object itself would report after every render, and an app that stores the state in React state would render again forever. The conversion between this shape and the table library's state is in `src/components/grid/gridState.ts`, unit tested in `tests/unit/gridState.test.ts`; `tests/e2e/components/grid.spec.ts` ("saving and restoring the layout") checks the round trip in a browser.

## Translation

Override any subset of the grid's texts with `labels`. Everything else comes from `defaultGridViewLabels`.

```tsx
<GridView
  …
  labels={{
    searchPlaceholder: 'Tìm kiếm',
    clearFilters: 'Xóa bộ lọc',
    filters: 'Bộ lọc',
    columns: 'Cột',
    rowCount: (shown, total, filtered) => (filtered ? `${shown}/${total} dòng` : `${total} dòng`),
    columnOptions: (header) => `Tùy chọn cột ${header}`,
  }}
/>
```

`GridViewLabels` covers the toolbar, column menu, filters, row count, empty states and screen reader texts. Function labels receive the values they describe (header name, counts).

Pass `locale` (usually the app's current language) so number columns use its decimal and grouping separators; the master search matches the text as displayed. Columns with their own `format` are not affected.

## Limits

- Every row is rendered (no virtualization): fine for a few thousand rows.
- Not yet supported: resizing columns by dragging, row grouping, inline cell editing.
