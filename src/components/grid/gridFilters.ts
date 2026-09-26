/**
 * Pure filter/search helpers behind GridView. No React or table imports, so they are
 * unit tested directly (tests/unit/gridFilters.test.ts) and apps can reuse them.
 */

/** Range filter for number columns; either bound may be missing. */
export interface NumberRange {
  min?: number | null;
  max?: number | null;
}

/**
 * Filter value per column type:
 * - text: string (contains)
 * - number: NumberRange (inclusive)
 * - select: array of allowed values
 */
export type GridFilterValue = string | NumberRange | ReadonlyArray<string | number | boolean>;

/** Lower-case and strip diacritics so "be tong" matches "Bê tông" and "CAFE" matches "café". */
export function normalizeText(value: unknown): string {
  if (value == null) return '';
  return String(value)
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim();
}

/** Case- and accent-insensitive "contains". An empty query matches everything. */
export function matchesText(value: unknown, query: string): boolean {
  const q = normalizeText(query);
  if (q === '') return true;
  return normalizeText(value).includes(q);
}

/** Inclusive range test. Missing values never match an active range. */
export function matchesNumberRange(value: unknown, range: NumberRange): boolean {
  const { min, max } = range;
  const hasMin = min != null && Number.isFinite(min);
  const hasMax = max != null && Number.isFinite(max);
  if (!hasMin && !hasMax) return true;
  if (typeof value !== 'number' || !Number.isFinite(value)) return false;
  return (!hasMin || value >= (min as number)) && (!hasMax || value <= (max as number));
}

/** Value is one of the selected values. An empty selection matches everything. */
export function matchesSelect(value: unknown, selected: ReadonlyArray<unknown>): boolean {
  if (selected.length === 0) return true;
  return selected.some((s) => Object.is(s, value));
}

/** True when a filter value filters nothing (so it can be dropped from state). */
export function isEmptyFilter(value: unknown): boolean {
  if (value == null) return true;
  if (typeof value === 'string') return value.trim() === '';
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') {
    const { min, max } = value as NumberRange;
    return (min == null || !Number.isFinite(min)) && (max == null || !Number.isFinite(max));
  }
  return false;
}

/**
 * Master search: every whitespace-separated term must appear in at least one of the
 * row's searchable values ("wood 2x4" finds rows mentioning both, in any columns).
 */
export function matchesSearch(values: ReadonlyArray<unknown>, query: string): boolean {
  const terms = normalizeText(query).split(/\s+/).filter(Boolean);
  if (terms.length === 0) return true;
  const haystack = values.map(normalizeText);
  return terms.every((term) => haystack.some((v) => v.includes(term)));
}
