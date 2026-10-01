import CloseIcon from '@mui/icons-material/Close';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import FilterListIcon from '@mui/icons-material/FilterList';
import PushPinIcon from '@mui/icons-material/PushPin';
import SearchIcon from '@mui/icons-material/Search';
import Chip from '@mui/material/Chip';
import InputAdornment from '@mui/material/InputAdornment';
import OutlinedInput from '@mui/material/OutlinedInput';
import { type Column, type RowData, useTable } from '@tanstack/react-table';
import { type CSSProperties, type DragEvent, type KeyboardEvent, type MouseEvent, type ReactNode, useEffect, useId, useMemo, useState } from 'react';

import { cn } from '../../utils/cn';
import { useStableValue } from '../../utils/useStableValue';
import { Button, IconButton } from '../Button';
import { GridImageCell, GridLinkCell } from './GridCells';
import { matchesSearch } from './gridFilters';
import { ColumnFilter, ColumnMenu, ColumnsMenu, SortIcon } from './GridHeaderParts';
import { displayText, moveId, presetMatches, toGridViewState, toTableInitialState } from './gridState';
import { features, type Features, toColumnDefs } from './gridTable';
import {
  defaultGridViewLabels,
  type GridColumn,
  type GridHighlight,
  type GridPreset,
  type GridViewLabels,
  type GridViewState,
} from './gridTypes';

// Types and helpers live in sibling files: gridTypes.ts (public types, default texts),
// gridState.ts (React-free logic, unit tested), gridTable.ts (TanStack setup),
// GridHeaderParts.tsx (menus and filter inputs).

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
  /** Called once on mount with the starting state, then whenever the user changes sort, filters, search or layout (for persistence). */
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

  const columnDefs = useMemo(() => toColumnDefs(columns), [columns]);

  const table = useTable({
    features,
    columns: columnDefs,
    data: searchedRows,
    getRowId: (row: T) => getRowId(row),
    enableSortingRemoval: true,
    enableMultiSort: true,
    // Every column sorts ascending on the first click (TanStack defaults numbers to descending).
    sortDescFirst: false,
    initialState: toTableInitialState(initialState, columns.map((c) => c.id)),
  });

  const state = table.state;
  const currentState = toGridViewState(state, query, filtersVisible);
  // currentState is a new object on every render, so it cannot be the effect dependency: the effect
  // would call onStateChange after every render, and an app that stores the state (setState)
  // would render again, forever. The JSON text changes only when the content does. The effect
  // also runs once on mount, so the app receives the starting state.
  // onStateChange is left out of the dependencies on purpose: an inline callback is a new function
  // every render and must not trigger a report.
  const stateKey = JSON.stringify(currentState);
  useEffect(() => {
    onStateChange?.(JSON.parse(stateKey) as GridViewState);
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
    const reorder = (list: string[]) => moveId(list, id, targetId, after);
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
  const presetActive = (preset: GridPreset) => presetMatches(preset, currentState.filters, query);

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
    <div className={cn('flex w-full min-w-0 flex-col overflow-hidden rounded-panel border border-border-strong material-panel shadow-panel [contain:inline-size]', className)}>
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
