import CloseIcon from '@mui/icons-material/Close';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import FilterListIcon from '@mui/icons-material/FilterList';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import PushPinIcon from '@mui/icons-material/PushPin';
import SearchIcon from '@mui/icons-material/Search';
import ViewColumnIcon from '@mui/icons-material/ViewColumn';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import InputAdornment from '@mui/material/InputAdornment';
import ListItemIcon from '@mui/material/ListItemIcon';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import OutlinedInput from '@mui/material/OutlinedInput';
import {
  type Column,
  type ColumnDef,
  columnFacetingFeature,
  columnFilteringFeature,
  columnOrderingFeature,
  columnPinningFeature,
  columnSizingFeature,
  columnVisibilityFeature,
  createFacetedRowModel,
  createFacetedUniqueValues,
  createFilteredRowModel,
  createSortedRowModel,
  type FilterFn,
  type RowData,
  rowSortingFeature,
  sortFn_alphanumeric,
  sortFn_basic,
  tableFeatures,
  useTable,
} from '@tanstack/react-table';
import { type CSSProperties, type DragEvent, type KeyboardEvent, type MouseEvent, type ReactNode, useEffect, useId, useMemo, useState } from 'react';

import { cn } from '../../utils/cn';
import { formatDisplayNumber } from '../../utils/number';
import { useStableValue } from '../../utils/useStableValue';
import { Button, IconButton } from '../Button';
import { Checkbox } from '../Choice';
import { NumberInput } from '../NumberInput';
import { Select } from '../Select';
import { TextInput } from '../TextInput';
import { GridImageCell, GridLinkCell } from './GridCells';
import {
  type GridFilterValue,
  isEmptyFilter,
  matchesNumberRange,
  matchesSearch,
  matchesSelect,
  matchesText,
  type NumberRange,
} from './gridFilters';

// ---------------------------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------------------------

export type GridCellValue = string | number | boolean | null | undefined;
export type GridHighlight = 'success' | 'warning' | 'danger' | 'info';
export type GridFilterType = 'text' | 'number' | 'select';

export interface GridColumn<T> {
  /** Stable id: used in state (sort, filters, order, pinning) and presets. */
  id: string;
  header: string;
  /** The cell's value: drives sorting, filtering, search and the default display. */
  value: keyof T | ((row: T) => GridCellValue);
  /**
   * Default rendering and behaviour:
   * - 'text' (default): left aligned, text filter
   * - 'number': right aligned, tabular digits, range filter, thousands separators
   * - 'image': thumbnail + text, needs `image`
   * - 'link': link or in-app action, needs `link`
   */
  type?: 'text' | 'number' | 'image' | 'link';
  /** Custom content. The column `value` still drives sort, filter and search. */
  cell?: (row: T) => ReactNode;
  /** Display text for the value (e.g. units). Also what the master search matches. */
  format?: (value: GridCellValue, row: T) => string;
  /** 'number' columns: fixed decimals in the default display. */
  precision?: number;
  image?: { src: (row: T) => string | undefined; alt?: (row: T) => string; subtext?: (row: T) => ReactNode };
  link?: { href?: (row: T) => string | undefined; onClick?: (row: T) => void; external?: boolean };
  /** Width in px. Default 160 (120 for numbers). Widths are fixed so frozen columns line up. */
  width?: number;
  align?: 'start' | 'center' | 'end';
  /** Default true. */
  sortable?: boolean;
  /** Per-column filter. Default: 'number' for number columns, 'text' otherwise. false = none. */
  filter?: GridFilterType | false;
  /** Choices for a 'select' filter. Default: the distinct values in the data. */
  filterOptions?: Array<{ value: string | number; label: string }>;
  /** Included in the master search. Default true. */
  searchable?: boolean;
  /** User can hide this column from the Columns menu. Default true. */
  hideable?: boolean;
}

/** A saved search: one click applies these column filters and search text. */
export interface GridPreset {
  id: string;
  label: string;
  filters?: Record<string, GridFilterValue>;
  search?: string;
}

/** Everything the user can change, in a plain shape that is easy to persist. */
export interface GridViewState {
  sort: Array<{ id: string; desc: boolean }>;
  filters: Record<string, GridFilterValue>;
  search: string;
  columnOrder: string[];
  pinned: { start: string[]; end: string[] };
  hidden: string[];
  /** Whether the filter row is shown. Hidden filters stay applied. */
  filtersVisible: boolean;
}

/** Every text GridView shows or announces. Override any subset through the `labels` prop. */
export interface GridViewLabels {
  searchPlaceholder: string;
  /** Accessible name of the search box; receives the grid's aria-label. */
  searchLabel: (gridLabel: string) => string;
  clearSearch: string;
  savedSearches: string;
  /** Row count in the toolbar. `filtered` is true while a search or filter is active. */
  rowCount: (shown: number, total: number, filtered: boolean) => string;
  clearFilters: string;
  filters: string;
  /** Screen-reader text after the active filter count ("2 active"). */
  activeFilters: string;
  columns: string;
  resetLayout: string;
  noMatches: string;
  /** Accessible text of an empty cell. */
  emptyCell: string;
  dragToMove: string;
  sortHint: string;
  frozen: string;
  columnOptions: (header: string) => string;
  sortAscending: string;
  sortDescending: string;
  clearSort: string;
  freezeLeft: string;
  freezeRight: string;
  unfreeze: string;
  moveLeft: string;
  moveRight: string;
  hideColumn: string;
  filterColumn: (header: string) => string;
  filterPlaceholder: string;
  minimum: (header: string) => string;
  maximum: (header: string) => string;
  minPlaceholder: string;
  maxPlaceholder: string;
  /** Placeholder of a select filter with nothing chosen. */
  all: string;
}

export const defaultGridViewLabels: GridViewLabels = {
  searchPlaceholder: 'Search',
  searchLabel: (grid) => `Search ${grid}`,
  clearSearch: 'Clear search',
  savedSearches: 'Saved searches',
  rowCount: (shown, total, filtered) => (filtered ? `${shown} of ${total} rows` : `${total} rows`),
  clearFilters: 'Clear filters',
  filters: 'Filters',
  activeFilters: 'active',
  columns: 'Columns',
  resetLayout: 'Reset layout',
  noMatches: 'No rows match the current search and filters.',
  emptyCell: 'empty',
  dragToMove: 'Drag to move',
  sortHint: 'Sort (Shift+click to add)',
  frozen: 'Frozen',
  columnOptions: (header) => `Column options: ${header}`,
  sortAscending: 'Sort ascending',
  sortDescending: 'Sort descending',
  clearSort: 'Clear sort',
  freezeLeft: 'Freeze left',
  freezeRight: 'Freeze right',
  unfreeze: 'Unfreeze',
  moveLeft: 'Move left',
  moveRight: 'Move right',
  hideColumn: 'Hide column',
  filterColumn: (header) => `Filter ${header}`,
  filterPlaceholder: 'Filter',
  minimum: (header) => `${header} minimum`,
  maximum: (header) => `${header} maximum`,
  minPlaceholder: 'Min',
  maxPlaceholder: 'Max',
  all: 'All',
};

export interface GridViewProps<T extends RowData> {
  rows: T[];
  columns: GridColumn<T>[];
  getRowId: (row: T) => string;
  /** Accessible name of the grid (e.g. "Fastener results"). */
  'aria-label': string;
  /** Master search box. `columns` limits which columns it looks at. Default: on, all searchable columns. */
  search?: boolean | { placeholder?: string; columns?: string[] };
  /** Pre-configured searches shown as chips next to the search box. */
  presets?: GridPreset[];
  /**
   * Per-column filters. Default true: a "Filters" toolbar button shows/hides the filter row
   * (visible at start unless initialState.filtersVisible is false). false removes filtering.
   */
  columnFilters?: boolean;
  /** Tints a row by status (e.g. failing checks in red). */
  rowHighlight?: (row: T) => GridHighlight | null | undefined;
  /** Marks the current row (e.g. the result shown in the drawing). */
  selectedRowId?: string | null;
  /** Makes rows clickable and keyboard activatable (Enter/Space). Clicks on links/buttons in a row do not count. */
  onRowClick?: (row: T) => void;
  /** Starting sort/filters/layout. Changing it later does not reset the grid. */
  initialState?: Partial<GridViewState>;
  /** Called whenever the user changes sort, filters, search or layout (for persistence). */
  onStateChange?: (state: GridViewState) => void;
  /** Scroll inside the grid with sticky headers. */
  maxHeight?: number | string;
  /** Extra buttons at the right of the toolbar (e.g. Export). */
  toolbar?: ReactNode;
  /** Text when there are no rows at all. */
  emptyText?: ReactNode;
  /** Any subset of the grid's texts, e.g. { clearFilters: 'Xóa bộ lọc', rowCount: (n, t) => `${n}/${t} dòng` }. */
  labels?: Partial<GridViewLabels>;
  /** Locale of number columns without a `format` (decimal and grouping separators), e.g. 'vi-VN'. Default 'en-US'. */
  locale?: string;
  className?: string;
}

// ---------------------------------------------------------------------------------------------
// Table setup
// ---------------------------------------------------------------------------------------------

const features = tableFeatures({
  columnFilteringFeature,
  filteredRowModel: createFilteredRowModel(),
  rowSortingFeature,
  sortedRowModel: createSortedRowModel(),
  sortFns: { alphanumeric: sortFn_alphanumeric, basic: sortFn_basic },
  columnFacetingFeature,
  facetedRowModel: createFacetedRowModel(),
  facetedUniqueValues: createFacetedUniqueValues(),
  columnOrderingFeature,
  columnPinningFeature,
  columnSizingFeature,
  columnVisibilityFeature,
});

type Features = typeof features;

const textFilter: FilterFn<Features, RowData> = Object.assign(
  (row: { getValue: (id: string) => unknown }, id: string, value: string) => matchesText(row.getValue(id), value),
  { autoRemove: isEmptyFilter },
);
const numberFilter: FilterFn<Features, RowData> = Object.assign(
  (row: { getValue: (id: string) => unknown }, id: string, value: NumberRange) => matchesNumberRange(row.getValue(id), value),
  { autoRemove: isEmptyFilter },
);
const selectFilter: FilterFn<Features, RowData> = Object.assign(
  (row: { getValue: (id: string) => unknown }, id: string, value: unknown[]) => matchesSelect(row.getValue(id), value),
  { autoRemove: isEmptyFilter },
);

const filterTypeOf = <T,>(c: GridColumn<T>): GridFilterType | false =>
  c.filter ?? (c.type === 'number' ? 'number' : 'text');

/** Raw value of a column; blank strings become undefined so they always sort last. */
function readValue<T>(c: GridColumn<T>, row: T): GridCellValue {
  const v = typeof c.value === 'function' ? c.value(row) : (row[c.value] as GridCellValue);
  return v === null || v === '' || (typeof v === 'number' && Number.isNaN(v)) ? undefined : v;
}

/** Text of a cell as displayed (used by the default renderer and the master search). */
function displayText<T>(c: GridColumn<T>, row: T, locale: string): string {
  const v = readValue(c, row);
  if (c.format) return c.format(v, row);
  if (v === undefined) return '';
  if (typeof v === 'number' && c.type === 'number') return formatDisplayNumber(v, { precision: c.precision, locale });
  return String(v);
}

// ---------------------------------------------------------------------------------------------
// GridView
// ---------------------------------------------------------------------------------------------

/**
 * Data grid for result tables: sort (Shift+click for multi-sort), per-column filters, master
 * search with presets, drag or menu to reorder, freeze columns left/right, show/hide columns,
 * status highlighting and clickable rows. Cells can hold text, numbers, image + text, links or
 * any custom content.
 *
 * Built on TanStack Table v9 for state; markup and styles are the kit's own.
 * Renders every row (no virtualization): fine for a few thousand rows.
 */
export function GridView<T extends RowData>({
  rows,
  columns,
  getRowId,
  'aria-label': ariaLabel,
  search = true,
  presets,
  columnFilters: filtering = true,
  rowHighlight,
  selectedRowId,
  onRowClick,
  initialState,
  onStateChange,
  maxHeight,
  toolbar,
  emptyText = 'No data',
  labels: labelOverrides,
  locale = 'en-US',
  className,
}: GridViewProps<T>) {
  const baseId = useId();
  const L: GridViewLabels = { ...defaultGridViewLabels, ...labelOverrides };
  const byId = useMemo(() => new Map(columns.map((c) => [c.id, c])), [columns]);
  const [query, setQuery] = useState(initialState?.search ?? '');
  const [filtersVisible, setFiltersVisible] = useState(initialState?.filtersVisible ?? true);

  // Master search runs before the table so every term may match a different column.
  const searchConfig = typeof search === 'object' ? search : {};
  // Usually an inline array; depend on its content, not its identity.
  const searchIds = useStableValue(searchConfig.columns);
  const searchColumns = useMemo(
    () => columns.filter((c) => c.searchable !== false && (!searchIds || searchIds.includes(c.id))),
    [columns, searchIds],
  );
  const searchedRows = useMemo(
    () => (query.trim() === '' ? rows : rows.filter((row) => matchesSearch(searchColumns.map((c) => displayText(c, row, locale)), query))),
    [rows, searchColumns, query, locale],
  );

  const columnDefs = useMemo<ColumnDef<Features, T, unknown>[]>(
    () =>
      columns.map((c) => {
        const filterType = filterTypeOf(c);
        return {
          id: c.id,
          header: c.header,
          accessorFn: (row: T) => readValue(c, row),
          size: c.width ?? (c.type === 'number' ? 120 : 160),
          enableSorting: c.sortable !== false,
          sortUndefined: 'last',
          sortFn: c.type === 'number' ? 'basic' : 'alphanumeric',
          enableColumnFilter: filterType !== false,
          filterFn: filterType === 'number' ? numberFilter : filterType === 'select' ? selectFilter : textFilter,
          enableHiding: c.hideable !== false,
        } as ColumnDef<Features, T, unknown>;
      }),
    [columns],
  );

  const table = useTable({
    features,
    columns: columnDefs,
    data: searchedRows,
    getRowId: (row: T) => getRowId(row),
    enableSortingRemoval: true,
    enableMultiSort: true,
    // Every column sorts ascending on the first click (TanStack defaults numbers to descending).
    sortDescFirst: false,
    initialState: {
      sorting: initialState?.sort ?? [],
      columnFilters: Object.entries(initialState?.filters ?? {}).map(([id, value]) => ({ id, value })),
      columnOrder: initialState?.columnOrder?.length ? initialState.columnOrder : columns.map((c) => c.id),
      columnPinning: initialState?.pinned ?? { start: [], end: [] },
      columnVisibility: Object.fromEntries((initialState?.hidden ?? []).map((id) => [id, false])),
    },
  });

  const state = table.state;
  const currentState: GridViewState = {
    sort: state.sorting.map(({ id, desc }) => ({ id, desc })),
    filters: Object.fromEntries(state.columnFilters.map((f) => [f.id, f.value as GridFilterValue])),
    search: query,
    columnOrder: state.columnOrder,
    pinned: { start: state.columnPinning.start ?? [], end: state.columnPinning.end ?? [] },
    hidden: Object.entries(state.columnVisibility)
      .filter(([, visible]) => visible === false)
      .map(([id]) => id),
    filtersVisible,
  };
  const stateKey = JSON.stringify(currentState);
  useEffect(() => {
    onStateChange?.(JSON.parse(stateKey) as GridViewState);
    // Report only real changes; onStateChange identity does not matter.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stateKey]);

  const startCols = table.getStartVisibleLeafColumns();
  const centerCols = table.getCenterVisibleLeafColumns();
  const endCols = table.getEndVisibleLeafColumns();
  const visibleCols = [...startCols, ...centerCols, ...endCols];
  const lastStart = startCols.at(-1)?.id;
  // Spare width goes to an empty filler column before the right-frozen ones, so those sit at
  // the right edge and every other column keeps its exact width (sticky offsets depend on it).
  const fillerAt = startCols.length + centerCols.length;
  const filler = (key: string, header = false) => <td key={key} aria-hidden="true" className={cn(header ? 'grid-th' : 'grid-td', 'grid-filler')} />;
  const withFiller = (cells: ReactNode[], header = false) => [...cells.slice(0, fillerAt), filler('__filler', header), ...cells.slice(fillerAt)];
  const firstEnd = endCols[0]?.id;
  const tableRows = table.getRowModel().rows;
  const hasFilters = state.columnFilters.length > 0 || query.trim() !== '';
  const canFilter = filtering && visibleCols.some((col) => col.getCanFilter());
  const activeFilterCount = state.columnFilters.length;

  // ---------- layout actions (shared by drag-and-drop and the column menu) ----------
  const regionOf = (id: string) => table.getColumn(id)?.getIsPinned() || 'center';

  /** Moves `id` next to `targetId` within the same region (center order or a pinned list). */
  const moveColumn = (id: string, targetId: string, after: boolean) => {
    const region = regionOf(id);
    if (id === targetId || region !== regionOf(targetId)) return;
    const reorder = (list: string[]) => {
      const next = list.filter((x) => x !== id);
      const at = next.indexOf(targetId);
      if (at < 0) return list;
      next.splice(after ? at + 1 : at, 0, id);
      return next;
    };
    if (region === 'center') table.setColumnOrder(reorder(state.columnOrder));
    else table.setColumnPinning((p) => ({ ...p, [region]: reorder(p[region] ?? []) }));
  };

  const neighbour = (id: string, step: -1 | 1) => {
    const ids = table.getPinnedVisibleLeafColumns(regionOf(id)).map((c) => c.id);
    return ids[ids.indexOf(id) + step];
  };

  const applyPreset = (preset: GridPreset) => {
    table.setColumnFilters(Object.entries(preset.filters ?? {}).map(([id, value]) => ({ id, value })));
    setQuery(preset.search ?? '');
  };
  const presetActive = (preset: GridPreset) =>
    JSON.stringify(Object.entries(preset.filters ?? {}).sort()) === JSON.stringify(Object.entries(currentState.filters).sort()) &&
    (preset.search ?? '') === query;

  const clearFilters = () => {
    table.resetColumnFilters(true);
    setQuery('');
  };

  // ---------- rendering helpers ----------
  const stickyStyle = (col: Column<Features, T, unknown>, header = false): CSSProperties => {
    const pinned = col.getIsPinned();
    const width = col.getSize();
    return {
      width,
      minWidth: width,
      maxWidth: width,
      ...(pinned === 'start' && { position: 'sticky', insetInlineStart: col.getStart('start'), zIndex: header ? 4 : 1 }),
      ...(pinned === 'end' && { position: 'sticky', insetInlineEnd: col.getAfter('end'), zIndex: header ? 4 : 1 }),
    };
  };
  const edgeClass = (id: string) =>
    cn(id === lastStart && 'grid-pin-edge-start', id === firstEnd && 'grid-pin-edge-end');

  const [dragId, setDragId] = useState<string | null>(null);
  const [dropHint, setDropHint] = useState<{ id: string; after: boolean } | null>(null);

  const onHeaderDragOver = (e: DragEvent<HTMLElement>, id: string) => {
    if (!dragId || dragId === id || regionOf(dragId) !== regionOf(id)) return;
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    setDropHint({ id, after: e.clientX > rect.left + rect.width / 2 });
  };

  const rowInteractive = (e: MouseEvent | KeyboardEvent) =>
    !!(e.target as HTMLElement).closest('a, button, input, select, textarea, label, [role="button"]');

  const renderCell = (c: GridColumn<T>, row: T): ReactNode => {
    if (c.cell) return c.cell(row);
    const text = displayText(c, row, locale);
    if (c.type === 'image' && c.image) {
      return <GridImageCell src={c.image.src(row)} alt={c.image.alt?.(row) ?? ''} text={text} subtext={c.image.subtext?.(row)} />;
    }
    if (text === '') return <span className="text-text-muted" aria-label={L.emptyCell}>—</span>;
    if (c.type === 'link' && c.link) {
      const href = c.link.href?.(row);
      const onClick = c.link.onClick;
      return (
        <GridLinkCell href={href} external={c.link.external} onClick={onClick ? () => onClick(row) : undefined}>
          {text}
        </GridLinkCell>
      );
    }
    return text;
  };

  const alignOf = (c: GridColumn<T>) => c.align ?? (c.type === 'number' ? 'end' : 'start');

  const statusId = `${baseId}-status`;

  return (
    // contain: inline-size: the grid takes its width from its parent, never from the table, so a
    // wide table scrolls inside instead of stretching a CSS grid/flex parent (and the page).
    <div className={cn('flex w-full min-w-0 flex-col overflow-hidden rounded-panel border border-border-strong material-panel shadow-(--shadow-panel) [contain:inline-size]', className)}>
      {/* Toolbar: master search, presets, count, clear, columns, app actions */}
      <div className="flex flex-wrap items-center gap-2 border-b border-border-input bg-surface-subtle p-2">
        {search !== false && (
          <OutlinedInput
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Escape' && query && (e.stopPropagation(), setQuery(''))}
            placeholder={searchConfig.placeholder ?? L.searchPlaceholder}
            inputProps={{ 'aria-label': L.searchLabel(ariaLabel), type: 'search', 'aria-controls': `${baseId}-table` }}
            startAdornment={
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            }
            endAdornment={
              query ? (
                <InputAdornment position="end">
                  <IconButton aria-label={L.clearSearch} size="small" onClick={() => setQuery('')}>
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </InputAdornment>
              ) : undefined
            }
            sx={{ width: '20rem', maxWidth: '100%', height: '2rem' }}
          />
        )}
        {presets && presets.length > 0 && (
          <div role="group" aria-label={L.savedSearches} className="flex flex-wrap items-center gap-1">
            {presets.map((p) => {
              const active = presetActive(p);
              return (
                <Chip
                  key={p.id}
                  label={p.label}
                  size="small"
                  clickable
                  color={active ? 'primary' : 'default'}
                  variant={active ? 'filled' : 'outlined'}
                  aria-pressed={active}
                  onClick={() => (active ? clearFilters() : applyPreset(p))}
                />
              );
            })}
          </div>
        )}
        <div className="ml-auto flex items-center gap-2">
          <span id={statusId} role="status" className="text-xs whitespace-nowrap text-text-muted">
            {L.rowCount(tableRows.length, rows.length, hasFilters)}
          </span>
          {hasFilters && (
            <Button size="small" variant="text" onClick={clearFilters}>
              {L.clearFilters}
            </Button>
          )}
          {canFilter && (
            <Button
              size="small"
              startIcon={<FilterListIcon />}
              aria-pressed={filtersVisible}
              aria-controls={`${baseId}-table`}
              onClick={() => setFiltersVisible((v) => !v)}
            >
              {L.filters}
              {activeFilterCount > 0 && (
                <span className="grid-badge">
                  {activeFilterCount}
                  <span className="sr-only"> {L.activeFilters}</span>
                </span>
              )}
            </Button>
          )}
          <ColumnsMenu
            columns={table.getAllLeafColumns()}
            byId={byId}
            labels={L}
            onReset={() => {
              table.resetColumnOrder();
              table.resetColumnPinning();
              table.resetColumnVisibility();
            }}
          />
          {toolbar}
        </div>
      </div>

      {/* Scroll area: focusable so keyboard users can scroll it */}
      <div
        role="region"
        aria-label={ariaLabel}
        tabIndex={0}
        className="relative min-h-0 overflow-auto focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand"
        style={{ maxHeight }}
      >
        <table
          id={`${baseId}-table`}
          aria-label={ariaLabel}
          aria-describedby={statusId}
          className="grid-view border-separate border-spacing-0 text-xs"
          style={{ width: '100%', minWidth: table.getTotalSize(), tableLayout: 'fixed' }}
        >
          <thead className="sticky top-0 z-3">
            <tr>
              {withFiller(visibleCols.map((col) => {
                const c = byId.get(col.id)!;
                const sorted = col.getIsSorted();
                const sortIndex = state.sorting.length > 1 ? col.getSortIndex() : -1;
                const hint = dropHint?.id === col.id ? (dropHint.after ? 'grid-drop-after' : 'grid-drop-before') : undefined;
                return (
                  <th
                    key={col.id}
                    scope="col"
                    aria-sort={sorted === 'asc' ? 'ascending' : sorted === 'desc' ? 'descending' : col.getCanSort() ? 'none' : undefined}
                    style={stickyStyle(col, true)}
                    className={cn('grid-th', edgeClass(col.id), hint, dragId === col.id && 'opacity-50')}
                    onDragOver={(e) => onHeaderDragOver(e, col.id)}
                    onDragLeave={() => setDropHint((h) => (h?.id === col.id ? null : h))}
                    onDrop={(e) => {
                      e.preventDefault();
                      if (dragId && dropHint) moveColumn(dragId, dropHint.id, dropHint.after);
                      setDragId(null);
                      setDropHint(null);
                    }}
                  >
                    <div className="flex items-center gap-0.5">
                      <span
                        draggable
                        aria-hidden="true"
                        title={L.dragToMove}
                        className="grid-drag flex shrink-0 cursor-grab text-true-gray-40"
                        onDragStart={(e) => {
                          e.dataTransfer.effectAllowed = 'move';
                          e.dataTransfer.setData('text/plain', col.id);
                          setDragId(col.id);
                        }}
                        onDragEnd={() => {
                          setDragId(null);
                          setDropHint(null);
                        }}
                      >
                        <DragIndicatorIcon sx={{ fontSize: '1rem' }} />
                      </span>
                      {col.getCanSort() ? (
                        <button
                          type="button"
                          className={cn('grid-sort min-w-0 flex-1', alignOf(c) === 'end' && 'justify-end')}
                          onClick={(e) => col.toggleSorting(undefined, e.shiftKey || e.metaKey || e.ctrlKey ? true : undefined)}
                          title={L.sortHint}
                        >
                          <span className="truncate">{c.header}</span>
                          <SortIcon direction={sorted} />
                          {sortIndex >= 0 && sorted && <span className="grid-sort-index">{sortIndex + 1}</span>}
                        </button>
                      ) : (
                        <span className={cn('min-w-0 flex-1 truncate font-bold', alignOf(c) === 'end' && 'text-right')}>{c.header}</span>
                      )}
                      {col.getIsPinned() && <PushPinIcon aria-label={L.frozen} sx={{ fontSize: '0.875rem' }} className="shrink-0 text-accent" />}
                      <ColumnMenu
                        column={col}
                        header={c.header}
                        labels={L}
                        canMoveLeft={!!neighbour(col.id, -1)}
                        canMoveRight={!!neighbour(col.id, 1)}
                        onMove={(step) => {
                          const n = neighbour(col.id, step);
                          if (n) moveColumn(col.id, n, step === 1);
                        }}
                        canHide={col.getCanHide() && visibleCols.length > 1}
                      />
                    </div>
                  </th>
                );
              }), true)}
            </tr>
            {canFilter && filtersVisible && (
              <tr className="grid-filter-row">
                {withFiller(visibleCols.map((col) => {
                  const c = byId.get(col.id)!;
                  return (
                    // <td>, not <th>: filter inputs are not column headers (and may be empty).
                    <td key={col.id} style={stickyStyle(col, true)} className={cn('grid-th-filter', edgeClass(col.id))}>
                      {col.getCanFilter() && <ColumnFilter column={col} config={c} labels={L} />}
                    </td>
                  );
                }), true)}
              </tr>
            )}
          </thead>
          <tbody>
            {tableRows.length === 0 ? (
              <tr>
                <td colSpan={visibleCols.length + 1} className="grid-empty">
                  {rows.length === 0 ? (
                    emptyText
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      {L.noMatches}
                      <Button size="small" onClick={clearFilters}>
                        {L.clearFilters}
                      </Button>
                    </span>
                  )}
                </td>
              </tr>
            ) : (
              tableRows.map((row) => {
                const highlight = rowHighlight?.(row.original) ?? undefined;
                const selected = selectedRowId != null && row.id === selectedRowId;
                return (
                  <tr
                    key={row.id}
                    data-highlight={highlight}
                    data-selected={selected || undefined}
                    aria-current={selected || undefined}
                    tabIndex={onRowClick ? 0 : undefined}
                    className={cn('grid-row', onRowClick && 'grid-row-clickable')}
                    onClick={onRowClick ? (e) => !rowInteractive(e) && onRowClick(row.original) : undefined}
                    onKeyDown={
                      onRowClick
                        ? (e) => {
                            if ((e.key === 'Enter' || e.key === ' ') && e.target === e.currentTarget) {
                              e.preventDefault();
                              onRowClick(row.original);
                            }
                          }
                        : undefined
                    }
                  >
                    {withFiller(visibleCols.map((col) => {
                      const c = byId.get(col.id)!;
                      return (
                        <td
                          key={col.id}
                          style={stickyStyle(col)}
                          className={cn('grid-td', edgeClass(col.id), alignOf(c) === 'end' && 'text-right tabular-nums', alignOf(c) === 'center' && 'text-center')}
                        >
                          {renderCell(c, row.original)}
                        </td>
                      );
                    }))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------------------------
// Pieces
// ---------------------------------------------------------------------------------------------

function SortIcon({ direction }: { direction: false | 'asc' | 'desc' }) {
  return (
    <svg viewBox="0 0 10 14" width="8" height="12" aria-hidden="true" className="shrink-0">
      <path d="M5 1 9 5.5H1Z" fill="currentColor" opacity={direction === 'asc' ? 1 : 0.25} />
      <path d="M5 13 1 8.5h8Z" fill="currentColor" opacity={direction === 'desc' ? 1 : 0.25} />
    </svg>
  );
}

function ColumnFilter<T extends RowData>({
  column,
  config,
  labels: L,
}: {
  column: Column<Features, T, unknown>;
  config: GridColumn<T>;
  labels: GridViewLabels;
}) {
  const type = filterTypeOf(config);
  const label = L.filterColumn(config.header);
  const value = column.getFilterValue();

  if (type === 'number') {
    const range = (value as NumberRange | undefined) ?? {};
    const set = (patch: NumberRange) => column.setFilterValue({ ...range, ...patch });
    return (
      <div className="grid-filter flex gap-1">
        <NumberInput aria-label={L.minimum(config.header)} placeholder={L.minPlaceholder} value={range.min ?? null} onChange={(min) => set({ min })} />
        <NumberInput aria-label={L.maximum(config.header)} placeholder={L.maxPlaceholder} value={range.max ?? null} onChange={(max) => set({ max })} />
      </div>
    );
  }

  if (type === 'select') {
    const options =
      config.filterOptions ??
      [...column.getFacetedUniqueValues().keys()]
        .filter((v): v is string | number => typeof v === 'string' || typeof v === 'number')
        .sort((a, b) => String(a).localeCompare(String(b), undefined, { numeric: true }))
        .map((v) => ({ value: v, label: String(v) }));
    return (
      <div className="grid-filter">
        <Select<string | number>
          multiple
          aria-label={label}
          placeholder={L.all}
          value={(value as Array<string | number> | undefined) ?? []}
          onChange={(v) => column.setFilterValue(v)}
          options={options}
        />
      </div>
    );
  }

  return (
    <div className="grid-filter">
      <TextInput
        inputProps={{ 'aria-label': label, type: 'search' }}
        placeholder={L.filterPlaceholder}
        value={(value as string | undefined) ?? ''}
        onChange={(e) => column.setFilterValue(e.target.value)}
      />
    </div>
  );
}

interface ColumnMenuProps<T extends RowData> {
  column: Column<Features, T, unknown>;
  header: string;
  labels: GridViewLabels;
  canMoveLeft: boolean;
  canMoveRight: boolean;
  onMove: (step: -1 | 1) => void;
  canHide: boolean;
}

/** Per-column actions; also the keyboard alternative to drag-and-drop. */
function ColumnMenu<T extends RowData>({ column, header, labels: L, canMoveLeft, canMoveRight, onMove, canHide }: ColumnMenuProps<T>) {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const menuId = useId();
  const close = () => setAnchor(null);
  const run = (fn: () => void) => () => {
    fn();
    close();
  };
  const sorted = column.getIsSorted();
  const pinned = column.getIsPinned();

  return (
    <>
      <IconButton
        aria-label={L.columnOptions(header)}
        aria-haspopup="menu"
        aria-expanded={!!anchor}
        aria-controls={anchor ? menuId : undefined}
        size="small"
        className="grid-col-menu shrink-0"
        onClick={(e) => setAnchor(e.currentTarget)}
      >
        <MoreVertIcon sx={{ fontSize: '1rem' }} />
      </IconButton>
      <Menu id={menuId} anchorEl={anchor} open={!!anchor} onClose={close}>
        {column.getCanSort() && [
          <MenuItem key="asc" selected={sorted === 'asc'} onClick={run(() => column.toggleSorting(false))}>
            {L.sortAscending}
          </MenuItem>,
          <MenuItem key="desc" selected={sorted === 'desc'} onClick={run(() => column.toggleSorting(true))}>
            {L.sortDescending}
          </MenuItem>,
          sorted && (
            <MenuItem key="clear" onClick={run(() => column.clearSorting())}>
              {L.clearSort}
            </MenuItem>
          ),
          <Divider key="d1" />,
        ]}
        {pinned !== 'start' && (
          <MenuItem onClick={run(() => column.pin('start'))}>
            <ListItemIcon sx={{ minWidth: 0, color: 'inherit' }}>
              <PushPinIcon fontSize="small" />
            </ListItemIcon>
            {L.freezeLeft}
          </MenuItem>
        )}
        {pinned !== 'end' && <MenuItem onClick={run(() => column.pin('end'))}>{L.freezeRight}</MenuItem>}
        {pinned && <MenuItem onClick={run(() => column.pin(false))}>{L.unfreeze}</MenuItem>}
        <Divider />
        <MenuItem disabled={!canMoveLeft} onClick={run(() => onMove(-1))}>
          {L.moveLeft}
        </MenuItem>
        <MenuItem disabled={!canMoveRight} onClick={run(() => onMove(1))}>
          {L.moveRight}
        </MenuItem>
        {canHide && [
          <Divider key="d3" />,
          <MenuItem key="hide" onClick={run(() => column.toggleVisibility(false))}>
            {L.hideColumn}
          </MenuItem>,
        ]}
      </Menu>
    </>
  );
}

/** Toolbar menu: show/hide columns and reset the layout. */
function ColumnsMenu<T extends RowData>({
  columns: all,
  byId,
  labels: L,
  onReset,
}: {
  columns: Column<Features, T, unknown>[];
  byId: Map<string, GridColumn<T>>;
  labels: GridViewLabels;
  onReset: () => void;
}) {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const menuId = useId();
  const visibleCount = all.filter((c) => c.getIsVisible()).length;

  return (
    <>
      <Button
        size="small"
        startIcon={<ViewColumnIcon />}
        aria-haspopup="menu"
        aria-expanded={!!anchor}
        aria-controls={anchor ? menuId : undefined}
        onClick={(e) => setAnchor(e.currentTarget)}
      >
        {L.columns}
      </Button>
      <Menu id={menuId} anchorEl={anchor} open={!!anchor} onClose={() => setAnchor(null)}>
        {all.map((col) => {
          const visible = col.getIsVisible();
          const locked = !col.getCanHide() || (visible && visibleCount === 1);
          return (
            <MenuItem
              key={col.id}
              role="menuitemcheckbox"
              aria-checked={visible}
              disabled={locked}
              onClick={() => col.toggleVisibility(!visible)}
            >
              <Checkbox checked={visible} tabIndex={-1} slotProps={{ input: { 'aria-hidden': true, tabIndex: -1 } }} />
              {byId.get(col.id)?.header ?? col.id}
            </MenuItem>
          );
        })}
        <Divider />
        <MenuItem
          onClick={() => {
            onReset();
            setAnchor(null);
          }}
        >
          {L.resetLayout}
        </MenuItem>
      </Menu>
    </>
  );
}
