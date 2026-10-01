/**
 * GridView's TanStack Table setup: which table features it uses, its filter functions, and the
 * column definitions built from the app's GridColumn list.
 */
import {
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
} from '@tanstack/react-table';

import { isEmptyFilter, matchesNumberRange, matchesSelect, matchesText, type NumberRange } from './gridFilters';
import { filterTypeOf, readValue } from './gridState';
import type { GridColumn } from './gridTypes';

export const features = tableFeatures({
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

export type Features = typeof features;

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

/** One TanStack column definition per GridColumn. */
export function toColumnDefs<T extends RowData>(columns: GridColumn<T>[]): ColumnDef<Features, T, unknown>[] {
  return columns.map((c) => {
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
      // The cast: TanStack v9 types ColumnDef as a union of accessor and display definitions, and
      // an object literal with accessorFn plus these options does not narrow to one member.
    } as ColumnDef<Features, T, unknown>;
  });
}
