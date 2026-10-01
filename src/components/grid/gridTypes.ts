/**
 * Public types of GridView and its default texts. Kept apart from the component so the React-free
 * modules (gridState.ts) and the component share them without importing each other.
 */
import type { ReactNode } from 'react';

import type { GridFilterValue } from './gridFilters';

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
