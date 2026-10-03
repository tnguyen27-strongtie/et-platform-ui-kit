import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import useMediaQuery from '@mui/material/useMediaQuery';
import { type KeyboardEvent, type ReactNode, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';

import { cn } from '../../utils/cn';
import { deepEqual } from '../../utils/useStableValue';
import { Button, IconButton } from '../Button';
import { DropdownMenu, type DropdownMenuItem } from '../DropdownMenu';
import { Tab, TabPanel, tabId, Tabs } from '../Tabs';
import { fitTabs, nextTabAfterClose } from './workspaceTabsLogic';

export interface WorkspaceTab<V extends string> {
  value: V;
  /** Tab name. Plain text: it is also used in the "more" menu and its "Close …" entry. */
  label: string;
  /** Shows an "unsaved changes" dot after the name (also announced to screen readers). */
  dirty?: boolean;
  disabled?: boolean;
  /** Set false to make this tab not closable (no ×, no Delete, no menu entry). Default: closable when `onClose` is given. */
  closable?: boolean;
  /** Keep the tab's content mounted while another tab is shown (preserves state, keeps queries running). */
  keepMounted?: boolean;
}

export interface WorkspaceTabsLabels {
  /** Name of the tab bar. */
  list: string;
  /** Text of the menu button that holds the tabs that do not fit. */
  more: (count: number) => string;
  /** Text of that menu button on touch screens when every tab fits (the menu still offers "Close"). */
  menu: string;
  /** Name of the add button. */
  add: string;
  /** Text of the menu entry that closes a tab (also the tooltip of the ×). */
  close: (label: string) => string;
  /** Screen reader text for the unsaved-changes dot. */
  unsaved: string;
}

export const defaultWorkspaceTabsLabels: WorkspaceTabsLabels = {
  list: 'Open workspaces',
  more: (count) => `${count} more`,
  menu: 'Tabs',
  add: 'New tab',
  close: (label) => `Close ${label}`,
  unsaved: 'Unsaved changes',
};

export interface WorkspaceTabsProps<V extends string> {
  tabs: WorkspaceTab<V>[];
  /** The selected tab. */
  value: V;
  onChange: (value: V) => void;
  /** Shows a "+" button after the tabs. The app creates the tab and selects it. */
  onAdd?: () => void;
  /**
   * Makes tabs closable: an × on each tab (mouse), Delete or Backspace on the focused tab (keyboard)
   * and a "Close" entry in the menu (touch and screen readers).
   * `next` is the tab to select when the closed one was selected: its right neighbour, else
   * its left one, `null` when none is left. Ask for confirmation here if the tab has unsaved work.
   */
  onClose?: (value: V, next: V | null) => void;
  /** Buttons at the right end of the tab bar. */
  actions?: ReactNode;
  /** Shown instead of the content when there are no tabs. */
  empty?: ReactNode;
  labels?: Partial<WorkspaceTabsLabels>;
  className?: string;
  /** Renders the content of a tab (usually a SectionLayout). Called for the selected tab and for `keepMounted` tabs. */
  children: (value: V) => ReactNode;
}

/**
 * Space between tabs and between the bar's items, in px. The overflow maths adds it once per
 * item, so the CSS gaps below are built from it; never write the number twice.
 */
const GAP = 2;

/*
 * Browser-like look, so the workspace level does not read as another section header: no bar
 * background or underline, rounded-top tabs, and the selected tab is a raised surface with a
 * brand stripe on top (section tabs use a gray bar and a brand underline).
 */
const barSx = {
  minWidth: 0,
  padding: 0,
  border: 0,
  backgroundColor: 'transparent',
  '& .MuiTabs-list': { gap: `${GAP}px` },
  '& .MuiTabs-indicator': { display: 'none' },
} as const;

/*
 * These classes override the theme's MuiTab colors and min-width; they win because the kit puts
 * Tailwind after MUI in the CSS layer order (docs/getting-started.md).
 * min-w-0 + shrink let the selected tab shrink and ellipsize its name when it alone is wider than
 * the bar (the theme's min-width: fit-content and MUI's flex-shrink: 0 would clip it instead).
 */
const tabClass = cn(
  // Large appearance radii (Glass) would turn a tab into a dome, so cap the rounding.
  'min-w-0 max-w-60 shrink rounded-t-[min(var(--radius-control),0.5rem)] px-3 text-text-muted',
  'hover:bg-[color-mix(in_srgb,var(--color-text)_6%,transparent)] hover:text-text',
  '[&.Mui-selected]:material-panel [&.Mui-selected]:text-text [&.Mui-selected]:shadow-[inset_0_3px_0_var(--color-brand),0_0_0_1px_var(--color-border-strong)]',
);

const isCloseKey = (e: KeyboardEvent) => e.key === 'Delete' || e.key === 'Backspace';

/** Tab name with the unsaved-changes dot; used in the tabs and in the "more" menu. */
function TabName({ label, dirty, unsaved }: { label: string; dirty?: boolean; unsaved: string }) {
  return (
    <>
      <span className="min-w-0 truncate">{label}</span>
      {dirty && <span className="size-1.5 shrink-0 rounded-full bg-current" aria-hidden="true" data-testid="unsaved-dot" />}
      {dirty && <span className="sr-only">{`(${unsaved})`}</span>}
    </>
  );
}

/**
 * Several workspaces open at once (e.g. one per calculation), switched by a tab bar above them.
 * Controlled: the app owns the list of tabs and their data. The bar shows as many tabs as fit its
 * width and puts the rest in a "more" menu; the selected tab is always shown.
 */
export function WorkspaceTabs<V extends string>({
  tabs,
  value,
  onChange,
  onAdd,
  onClose,
  actions,
  empty,
  labels: labelOverrides,
  className,
  children,
}: WorkspaceTabsProps<V>) {
  const labels = { ...defaultWorkspaceTabsLabels, ...labelOverrides };
  const tabsId = useId();
  // Touch screens have no hover or Delete key, and touch screen readers cannot reach the ×.
  const isTouch = useMediaQuery('(pointer: coarse)');
  const areaRef = useRef<HTMLDivElement>(null);
  const addRef = useRef<HTMLButtonElement>(null);
  const measureRef = useRef<HTMLDivElement>(null);
  /** The hidden menu buttons: one per possible label, the widest is reserved. */
  const menuButtonsRef = useRef<HTMLDivElement>(null);
  /** Value of a tab closed with the keyboard or the menu, until the app has answered onClose. */
  const closedByKey = useRef<V | null>(null);
  const [fit, setFit] = useState<{ widths: number[]; more: number; available: number } | null>(null);

  const canClose = (tab: WorkspaceTab<V>) => onClose !== undefined && tab.closable !== false && !tab.disabled;
  const close = (tab: WorkspaceTab<V>) => onClose?.(tab.value, nextTabAfterClose(tabs, tab.value, value));
  /** Close from the keyboard or the menu: focus follows to the next tab (see the effect below). */
  function closeAndRefocus(tab: WorkspaceTab<V>) {
    closedByKey.current = tab.value;
    close(tab);
  }

  /*
   * Overflow. Every tab is rendered once more in a hidden row (below), so its width is known even
   * while it sits in the menu; measuring the visible tabs would not tell what a hidden one needs.
   * The rule fitTabs applies, in DOM terms (n tabs, k of them shown when some overflow):
   *   all fit:  sum(n tab widths) + n*GAP + "+" button <= width of the bar area
   *   overflow: sum(k tab widths) + (k+2)*GAP + menu button + "+" button <= width of the bar area
   * (the overflow case keeps one GAP of slack: fitTabs charges a gap after the last shown tab too).
   * measure() reads those widths; it runs after every render and when the area or the hidden row
   * resizes (window, panel, or web fonts arriving). setFit keeps the old object when nothing
   * changed, so measuring after a render does not cause another render.
   */
  const measure = () => {
    const area = areaRef.current;
    const row = measureRef.current;
    if (!area || !row) return;
    const items = [...row.querySelectorAll('[role="tab"]')].map((el) => el.getBoundingClientRect().width);
    const menuWidths = [...(menuButtonsRef.current?.children ?? [])].map((el) => el.getBoundingClientRect().width);
    const more = Math.max(0, ...menuWidths) + GAP;
    const add = addRef.current ? addRef.current.getBoundingClientRect().width + GAP : 0;
    const next = { widths: items, more, available: area.clientWidth - add };
    setFit((prev) => (prev && deepEqual(prev, next) ? prev : next));
  };
  // Names, dots or close buttons may have changed. Reading a few widths per render is cheap
  // next to the content below, which also re-renders.
  useLayoutEffect(measure);
  // [] deps: measure only reads refs and calls setFit, which never change.
  useLayoutEffect(() => {
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(() => measure());
    if (areaRef.current) observer.observe(areaRef.current);
    if (measureRef.current) observer.observe(measureRef.current);
    return () => observer.disconnect();
  }, []);

  /*
   * A tab closed from the keyboard takes the focus with it when it disappears; give focus to the
   * newly selected tab. The app may also keep the tab (the user cancelled a confirmation): then
   * forget it, so a later change of `tabs` (e.g. a dirty flag while typing) never moves focus.
   * Runs on `tabs` changes only, so an app may select `next` before it removes the tab; `value`
   * still comes from this render, so focus goes to the tab selected by then.
   */
  useEffect(() => {
    const closed = closedByKey.current;
    if (closed === null) return;
    closedByKey.current = null;
    if (tabs.some((t) => t.value === closed)) return;
    document.getElementById(tabId(tabsId, value))?.focus();
  }, [tabs]); // eslint-disable-line react-hooks/exhaustive-deps -- see above: not on value changes

  const selectedIndex = tabs.findIndex((t) => t.value === value);
  const current = tabs[selectedIndex];
  const currentClosable = current !== undefined && canClose(current);
  // On touch screens the menu is always there when the selected tab can close, so reserve its room.
  const menuAlways = isTouch && currentClosable;
  // Before the first measurement, or for one render after tabs were added or removed, the widths
  // do not match the tabs: show them all, the next measurement corrects it.
  const measured = fit !== null && fit.widths.length === tabs.length;
  const shown = new Set(
    measured
      ? fitTabs(fit.widths, fit.available - (menuAlways ? fit.more : 0), selectedIndex, menuAlways ? 0 : fit.more, GAP)
      : tabs.keys(),
  );
  const visible = tabs.filter((_, i) => shown.has(i));
  const overflow = tabs.filter((_, i) => !shown.has(i));

  // Item ids are prefixed so a tab value can never clash with the menu's own entries.
  const menuItems: DropdownMenuItem[] = overflow.map((tab) => ({
    id: `tab:${tab.value}`,
    label: (
      <span className="flex min-w-0 items-center gap-1.5">
        <TabName label={tab.label} dirty={tab.dirty} unsaved={labels.unsaved} />
      </span>
    ),
    disabled: tab.disabled,
    onSelect: () => onChange(tab.value),
  }));
  if (currentClosable && (overflow.length > 0 || isTouch)) {
    if (menuItems.length > 0) menuItems.push({ id: 'action:divider', divider: true });
    // False positive: onSelect writes the ref when the entry is chosen, never during render.
    // eslint-disable-next-line react-hooks/refs
    menuItems.push({
      id: 'action:close',
      label: labels.close(current.label),
      icon: <CloseIcon fontSize="small" />,
      // Same focus handoff as Delete: the menu button may disappear with the overflow.
      onSelect: () => closeAndRefocus(current),
    });
  }

  const renderTab = (tab: WorkspaceTab<V>) => {
    const closable = canClose(tab);
    return (
      <Tab
        key={tab.value}
        value={tab.value}
        disabled={tab.disabled}
        className={tabClass}
        aria-keyshortcuts={closable ? 'Delete' : undefined}
        onKeyDown={
          closable
            ? (e) => {
                if (!isCloseKey(e)) return;
                e.preventDefault();
                closeAndRefocus(tab);
              }
            : undefined
        }
        // Middle click closes, as in browsers.
        onAuxClick={closable ? (e) => e.button === 1 && close(tab) : undefined}
        label={
          // max-w-full: MUI lays a Tab out as a column, so the row must be capped for the name to shrink.
          <span className="flex min-w-0 max-w-full items-center gap-1.5">
            <TabName label={tab.label} dirty={tab.dirty} unsaved={labels.unsaved} />
            {closable && (
              // Not a button: a button inside a tab is invalid. Mouse users click it (24px target),
              // keyboard users press Delete, touch and screen reader users use the menu's Close entry.
              <span
                aria-hidden="true"
                title={labels.close(tab.label)}
                data-testid="tab-close"
                className="-mr-1.5 flex size-6 shrink-0 items-center justify-center rounded-control text-text-muted hover:bg-(--material-splitter) hover:text-text"
                onClick={(e) => {
                  e.stopPropagation();
                  close(tab);
                }}
              >
                <CloseIcon sx={{ fontSize: 16 }} />
              </span>
            )}
          </span>
        }
      />
    );
  };

  return (
    <div className={cn('flex size-full flex-col gap-(--workspace-gap)', className)}>
      <div className="flex shrink-0 items-end gap-1 pt-1">
        <div ref={areaRef} className="relative flex min-w-0 flex-1 items-end" style={{ gap: GAP }}>
          {visible.length > 0 && (
            <Tabs<V> id={tabsId} aria-label={labels.list} value={value} onChange={onChange} sx={barSx}>
              {visible.map((tab) => renderTab(tab))}
            </Tabs>
          )}
          {menuItems.length > 0 && (
            <div className="shrink-0 self-center">
              <DropdownMenu label={overflow.length > 0 ? labels.more(overflow.length) : labels.menu} variant="text" size="small" items={menuItems} />
            </div>
          )}
          {onAdd && (
            <IconButton ref={addRef} aria-label={labels.add} size="small" className="shrink-0 self-center" onClick={onAdd}>
              <AddIcon fontSize="small" />
            </IconButton>
          )}
          {/* Measuring row: same tabs and menu button, invisible and out of the accessibility tree. */}
          <div className="pointer-events-none absolute size-0 overflow-hidden" aria-hidden="true" inert>
            <div ref={measureRef} className="invisible flex w-max">
              {/* MUI tabs need a Tabs parent. No id: it then makes its own, so ids stay unique and the
                  hidden tabs do not point aria-controls at panels. */}
              <Tabs<V> value={value} onChange={() => {}} sx={barSx}>
                {tabs.map((tab) => renderTab(tab))}
              </Tabs>
              {/* Both labels the menu button can show; a translation may make either one longer. */}
              <div ref={menuButtonsRef} className="flex">
                {[labels.more(tabs.length), labels.menu].map((text) => (
                  <Button key={text} variant="text" size="small" endIcon={<KeyboardArrowDownIcon />}>
                    {text}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </div>
        {actions && <div className="flex shrink-0 items-center self-center">{actions}</div>}
      </div>
      {tabs.length === 0 && empty !== undefined ? (
        <div className="min-h-0 flex-1">{empty}</div>
      ) : (
        tabs.map((tab) => (
          <TabPanel key={tab.value} tabsId={tabsId} value={tab.value} current={value} keepMounted={tab.keepMounted} className="min-h-0 overflow-hidden">
            {children(tab.value)}
          </TabPanel>
        ))
      )}
    </div>
  );
}
