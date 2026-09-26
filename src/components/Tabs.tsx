import MuiTab, { type TabProps } from '@mui/material/Tab';
import MuiTabs, { type TabsProps } from '@mui/material/Tabs';
import type { ReactNode } from 'react';

import { cn } from '../utils/cn';

/** Gray tab bar with orange selected tab (FD Tabs.List). Styling lives in the theme. */
export function Tabs<V extends string | number>(
  props: Omit<TabsProps, 'onChange' | 'value'> & { value: V; onChange: (value: V) => void },
) {
  const { onChange, ...rest } = props;
  return <MuiTabs variant="scrollable" scrollButtons={false} onChange={(_, v: V) => onChange(v)} {...rest} />;
}

export const Tab = (props: TabProps) => <MuiTab {...props} />;

export interface TabPanelProps<V> {
  value: V;
  current: V;
  children: ReactNode;
  className?: string;
  /** Keep the panel mounted when hidden (preserves form state). */
  keepMounted?: boolean;
}

export function TabPanel<V>({ value, current, children, className, keepMounted }: TabPanelProps<V>) {
  const active = value === current;
  if (!active && !keepMounted) return null;
  return (
    <div role="tabpanel" hidden={!active} className={cn('w-full flex-1 overflow-auto', className)}>
      {children}
    </div>
  );
}
