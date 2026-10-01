/**
 * React-free logic behind GridView: reading cell values, and converting between the grid's plain,
 * persistable state (GridViewState) and the table library's state. Unit tested in
 * tests/unit/gridState.test.ts.
 */
import { formatDisplayNumber } from '../../utils/number';
import type { GridFilterValue } from './gridFilters';
import type { GridCellValue, GridColumn, GridFilterType, GridPreset, GridViewState } from './gridTypes';

/** The column's filter, with the defaults: 'number' for number columns, 'text' otherwise. */
export const filterTypeOf = <T,>(c: GridColumn<T>): GridFilterType | false =>
  c.filter ?? (c.type === 'number' ? 'number' : 'text');

/** Raw value of a column; blank strings and NaN become undefined so they always sort last. */
export function readValue<T>(c: GridColumn<T>, row: T): GridCellValue {
  const v = typeof c.value === 'function' ? c.value(row) : (row[c.value] as GridCellValue);
  return v === null || v === '' || (typeof v === 'number' && Number.isNaN(v)) ? undefined : v;
}

/** Text of a cell as displayed (used by the default renderer and the master search). */
export function displayText<T>(c: GridColumn<T>, row: T, locale: string): string {
  const v = readValue(c, row);
  if (c.format) return c.format(v, row);
  if (v === undefined) return '';
  if (typeof v === 'number' && c.type === 'number') return formatDisplayNumber(v, { precision: c.precision, locale });
  return String(v);
}

/** The parts of the table library's state that GridView reads. */
export interface TableStateSlice {
  sorting: Array<{ id: string; desc: boolean }>;
  columnFilters: Array<{ id: string; value: unknown }>;
  columnOrder: string[];
  columnPinning: { start?: string[]; end?: string[] };
  columnVisibility: Record<string, boolean>;
}

/** Table state to start from, given the app's `initialState` (often a saved GridViewState). */
export function toTableInitialState(
  initial: Partial<GridViewState> | undefined,
  columnIds: string[],
): TableStateSlice & { columnPinning: { start: string[]; end: string[] } } {
  return {
    sorting: initial?.sort ?? [],
    columnFilters: Object.entries(initial?.filters ?? {}).map(([id, value]) => ({ id, value })),
    columnOrder: initial?.columnOrder?.length ? initial.columnOrder : columnIds,
    columnPinning: initial?.pinned ?? { start: [], end: [] },
    columnVisibility: Object.fromEntries((initial?.hidden ?? []).map((id) => [id, false])),
  };
}

/** The plain state GridView reports through onStateChange. `toTableInitialState` reads it back. */
export function toGridViewState(table: TableStateSlice, search: string, filtersVisible: boolean): GridViewState {
  return {
    sort: table.sorting.map(({ id, desc }) => ({ id, desc })),
    filters: Object.fromEntries(table.columnFilters.map((f) => [f.id, f.value as GridFilterValue])),
    search,
    columnOrder: table.columnOrder,
    pinned: { start: table.columnPinning.start ?? [], end: table.columnPinning.end ?? [] },
    hidden: Object.entries(table.columnVisibility)
      .filter(([, visible]) => visible === false)
      .map(([id]) => id),
    filtersVisible,
  };
}

/** `list` with `id` moved just before or after `targetId`; unchanged when `targetId` is not in it. */
export function moveId(list: string[], id: string, targetId: string, after: boolean): string[] {
  const next = list.filter((x) => x !== id);
  const at = next.indexOf(targetId);
  if (at < 0) return list;
  next.splice(after ? at + 1 : at, 0, id);
  return next;
}

/** True when the grid shows exactly this preset: the same column filters and search text. */
export function presetMatches(preset: GridPreset, filters: Record<string, GridFilterValue>, search: string): boolean {
  const sorted = (f: Record<string, GridFilterValue>) => JSON.stringify(Object.entries(f).sort());
  return sorted(preset.filters ?? {}) === sorted(filters) && (preset.search ?? '') === search;
}
