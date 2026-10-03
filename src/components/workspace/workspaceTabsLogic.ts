/** Pure helpers for WorkspaceTabs (no React), unit tested in tests/unit/workspaceTabs.test.ts. */

export interface TabRef<V> {
  value: V;
  disabled?: boolean;
}

/**
 * The tab to select after `closed` is closed, given the tab currently selected.
 * Closing another tab keeps the selection. Closing the selected tab moves to the next enabled
 * tab on its right, then on its left (as browsers do). `null` when no enabled tab is left.
 */
export function nextTabAfterClose<V>(tabs: readonly TabRef<V>[], closed: V, current: V): V | null {
  if (closed !== current && tabs.some((t) => t.value === current)) return current;
  const index = tabs.findIndex((t) => t.value === closed);
  const right = tabs.slice(index + 1).find((t) => !t.disabled);
  if (right) return right.value;
  const left = tabs
    .slice(0, Math.max(index, 0))
    .reverse()
    .find((t) => !t.disabled && t.value !== closed);
  return left?.value ?? null;
}

/**
 * Which tabs fit in `available` pixels, as indices in order. The rest go to a "more" menu that
 * takes `overflowWidth`. The selected tab is always kept: when it would overflow, it replaces the
 * last tabs that fit (so the user always sees which workspace is open). `gap` is the space between items.
 */
export function fitTabs(widths: readonly number[], available: number, selected: number, overflowWidth: number, gap = 0): number[] {
  const all = widths.map((_, i) => i);
  const cost = (i: number) => (widths[i] ?? 0) + gap;
  // n items need n - 1 gaps, so the room gets one gap back.
  if (all.reduce((sum, i) => sum + cost(i), 0) <= available + gap) return all;

  const room = available - overflowWidth;
  const visible: number[] = [];
  let used = 0;
  for (const i of all) {
    if (used + cost(i) > room) break;
    visible.push(i);
    used += cost(i);
  }
  if (selected < 0 || selected >= widths.length || visible.includes(selected)) return visible;
  while (visible.length > 0 && used + cost(selected) > room) used -= cost(visible.pop()!);
  return [...visible, selected];
}
