import MuiTab, { type TabProps } from '@mui/material/Tab';
import MuiTabs, { type TabsProps as MuiTabsProps } from '@mui/material/Tabs';
import { createContext, type ReactNode, useContext, useId } from 'react';

import { cn } from '../utils/cn';

const slug = (value: unknown) => String(value).replace(/\s+/g, '-');
const tabId = (base: string, value: unknown) => `${base}-tab-${slug(value)}`;
const panelId = (base: string, value: unknown) => `${base}-panel-${slug(value)}`;

/** base id + whether panels were linked (only then may tabs point at them with aria-controls). */
const TabsIdContext = createContext<{ base: string; linked: boolean } | null>(null);

export type TabsProps<V extends string | number> = Omit<MuiTabsProps, 'onChange' | 'value'> & {
  value: V;
  onChange: (value: V) => void;
  /** Give the same id to each TabPanel's `tabsId` to link tabs and panels for screen readers. */
  id?: string;
};

/**
 * Gray tab bar with orange selected tab (FD Tabs.List). Styling lives in the theme.
 * Keyboard: arrow keys move between tabs, Home/End jump to first/last (MUI).
 */
export function Tabs<V extends string | number>({ onChange, id, ...rest }: TabsProps<V>) {
  const autoId = useId();
  return (
    <TabsIdContext.Provider value={{ base: id ?? autoId, linked: id !== undefined }}>
      <MuiTabs variant="scrollable" scrollButtons={false} onChange={(_, v: V) => onChange(v)} {...rest} />
    </TabsIdContext.Provider>
  );
}

export function Tab(props: TabProps) {
  const ctx = useContext(TabsIdContext);
  const ids =
    ctx && props.value !== undefined
      ? { id: tabId(ctx.base, props.value), 'aria-controls': ctx.linked ? panelId(ctx.base, props.value) : undefined }
      : {};
  return <MuiTab {...ids} {...props} />;
}

export interface TabPanelProps<V> {
  value: V;
  current: V;
  children: ReactNode;
  className?: string;
  /** Keep the panel mounted when hidden (preserves form state). */
  keepMounted?: boolean;
  /** The `id` given to the Tabs, to link this panel to its tab. */
  tabsId?: string;
}

export function TabPanel<V>({ value, current, children, className, keepMounted, tabsId }: TabPanelProps<V>) {
  const active = value === current;
  if (!active && !keepMounted) return null;
  return (
    <div
      role="tabpanel"
      hidden={!active}
      id={tabsId ? panelId(tabsId, value) : undefined}
      aria-labelledby={tabsId ? tabId(tabsId, value) : undefined}
      className={cn('w-full flex-1 overflow-auto', className)}
    >
      {children}
    </div>
  );
}
