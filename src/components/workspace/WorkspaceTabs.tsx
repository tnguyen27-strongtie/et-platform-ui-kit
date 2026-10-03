import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import { type KeyboardEvent, type ReactNode, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';

import { cn } from '../../utils/cn';
import { deepEqual } from '../../utils/useStableValue';
import { Button, IconButton } from '../Button';
import { DropdownMenu } from '../DropdownMenu';
import { Tab, TabPanel, Tabs } from '../Tabs';
import { fitTabs, nextTabAfterClose } from './workspaceTabsLogic';

export interface WorkspaceTab<V extends string> {
  value: V;
  /** Tab name. Plain text: it also names the close action and the entry in the "more" menu. */
  label: string;
  /** Shows an "unsaved changes" dot after the name (also announced to screen readers). */
  dirty?: boolean;
  disabled?: boolean;
  /** Set false to hide the close button of this tab. Default: closable when `onClose` is given. */
  closable?: boolean;
  /** Keep the tab's content mounted while another tab is shown (preserves state, keeps queries running). */
  keepMounted?: boolean;
}

export interface WorkspaceTabsLabels {
  /** Name of the tab bar. */
  list: string;
  /** Text of the menu button that holds the tabs that do not fit. */
  more: (count: number) => string;
  /** Name of the add button. */
  add: string;
  /** Name of a tab's close action. */
  close: (label: string) => string;
  /** Screen reader text for the unsaved-changes dot. */
  unsaved: string;
}

export const defaultWorkspaceTabsLabels: WorkspaceTabsLabels = {
  list: 'Open workspaces',
  more: (count) => `${count} more`,
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
   * Shows a close button on each tab (Delete or Backspace closes the focused tab).
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
  '& .MuiTabs-list': { gap: '2px' },
  '& .MuiTabs-indicator': { display: 'none' },
} as const;

const tabClass = cn(
  // Large appearance radii (Glass) would turn a tab into a dome, so cap the rounding.
  'max-w-60 rounded-t-[min(var(--radius-control),0.5rem)] px-3 text-text-muted',
  'hover:bg-[color-mix(in_srgb,var(--color-text)_6%,transparent)] hover:text-text',
  '[&.Mui-selected]:material-panel [&.Mui-selected]:text-text [&.Mui-selected]:shadow-[inset_0_3px_0_var(--color-brand),0_0_0_1px_var(--color-border-strong)]',
);

/** Space between tabs, in px (matches the MuiTabs-list gap above). */
const GAP = 2;

const isCloseKey = (e: KeyboardEvent) => e.key === 'Delete' || e.key === 'Backspace';

/** Tab name with the unsaved-changes dot; used in the tabs and in the "more" menu. */
function TabName({ label, dirty, unsaved }: { label: string; dirty?: boolean; unsaved: string }) {
  return (
    <>
      <span className="truncate">{label}</span>
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
  const barRef = useRef<HTMLDivElement>(null);
  const areaRef = useRef<HTMLDivElement>(null);
  const addRef = useRef<HTMLButtonElement>(null);
  const measureRef = useRef<HTMLDivElement>(null);
  const moreRef = useRef<HTMLButtonElement>(null);
  const focusSelected = useRef(false);
  const [fit, setFit] = useState<{ widths: number[]; more: number; available: number } | null>(null);

  const canClose = (tab: WorkspaceTab<V>) => onClose !== undefined && tab.closable !== false && !tab.disabled;
  const close = (tab: WorkspaceTab<V>) => onClose?.(tab.value, nextTabAfterClose(tabs, tab.value, value));

  // Every tab is rendered once more in a hidden row, so its width is known even while it sits in the menu.
  const measure = () => {
    const area = areaRef.current;
    const row = measureRef.current;
    if (!area || !row) return;
    const items = [...row.querySelectorAll('[role="tab"]')].map((el) => el.getBoundingClientRect().width);
    const more = (moreRef.current?.getBoundingClientRect().width ?? 0) + GAP;
    const add = addRef.current ? addRef.current.getBoundingClientRect().width + GAP : 0;
    const next = { widths: items, more, available: area.clientWidth - add };
    setFit((prev) => (prev && deepEqual(prev, next) ? prev : next));
  };
  // Names, dots or close buttons may have changed: measure after every render (setFit bails out when equal).
  useLayoutEffect(measure);
  useLayoutEffect(() => {
    const area = areaRef.current;
    if (!area || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(() => measure());
    observer.observe(area);
    return () => observer.disconnect();
  }, []);

  // A tab closed from the keyboard is gone with its focus; move focus to the newly selected tab.
  useEffect(() => {
    if (!focusSelected.current) return;
    focusSelected.current = false;
    barRef.current?.querySelector<HTMLElement>('[role="tab"][aria-selected="true"]')?.focus();
  }, [tabs]);

  const selectedIndex = tabs.findIndex((t) => t.value === value);
  const shown = new Set(fit && fit.widths.length === tabs.length ? fitTabs(fit.widths, fit.available, selectedIndex, fit.more, GAP) : tabs.keys());
  const visible = tabs.filter((_, i) => shown.has(i));
  const overflow = tabs.filter((_, i) => !shown.has(i));

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
                focusSelected.current = true;
                close(tab);
              }
            : undefined
        }
        // Middle click closes, as in browsers.
        onAuxClick={closable ? (e) => e.button === 1 && close(tab) : undefined}
        label={
          <span className="flex min-w-0 items-center gap-1.5">
            <TabName label={tab.label} dirty={tab.dirty} unsaved={labels.unsaved} />
            {closable && (
              // Not a button: a button inside a tab is invalid. Mouse users click it; keyboard users press Delete.
              <span
                aria-hidden="true"
                title={labels.close(tab.label)}
                data-testid="tab-close"
                className="-mr-1 flex rounded-control p-0.5 text-text-muted hover:bg-(--material-splitter) hover:text-text"
                onClick={(e) => {
                  e.stopPropagation();
                  close(tab);
                }}
              >
                <CloseIcon sx={{ fontSize: 14 }} />
              </span>
            )}
          </span>
        }
      />
    );
  };

  return (
    <div className={cn('flex size-full flex-col gap-(--workspace-gap)', className)}>
      <div ref={barRef} className="flex shrink-0 items-end gap-1 pt-1">
        <div ref={areaRef} className="relative flex min-w-0 flex-1 items-end gap-[2px]">
          {visible.length > 0 && (
            <Tabs<V> id={tabsId} aria-label={labels.list} value={value} onChange={onChange} sx={barSx}>
              {visible.map((tab) => renderTab(tab))}
            </Tabs>
          )}
          {overflow.length > 0 && (
            <div className="shrink-0 self-center">
              <DropdownMenu
                label={labels.more(overflow.length)}
                variant="text"
                size="small"
                items={overflow.map((tab) => ({
                  id: tab.value,
                  label: (
                    <span className="flex min-w-0 items-center gap-1.5">
                      <TabName label={tab.label} dirty={tab.dirty} unsaved={labels.unsaved} />
                    </span>
                  ),
                  disabled: tab.disabled,
                  onSelect: () => onChange(tab.value),
                }))}
              />
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
              {/* MUI tabs need a Tabs parent; this one has its own id so no id is duplicated. */}
              <Tabs<V> id={`${tabsId}-measure`} value={value} onChange={() => {}} sx={barSx}>
                {tabs.map((tab) => renderTab(tab))}
              </Tabs>
              <Button ref={moreRef} variant="text" size="small" endIcon={<KeyboardArrowDownIcon />}>
                {labels.more(tabs.length)}
              </Button>
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
