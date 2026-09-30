import { type ReactNode, useId } from 'react';

import { cn } from '../../utils/cn';
import { Tab, TabPanel, Tabs } from '../Tabs';

export interface SectionTab<V extends string> {
  value: V;
  label: ReactNode;
  content: ReactNode;
  disabled?: boolean;
  /** Keep mounted while hidden (preserves state, lets queries keep running). */
  keepMounted?: boolean;
  /** Extra class for the tab, e.g. "animate-jump" to draw attention to a new result. */
  className?: string;
}

interface SectionBaseProps {
  /** Icons or buttons at the right end of the header bar (e.g. expand/collapse all). */
  actions?: ReactNode;
  /**
   * Bar under the scrolling body that stays visible (e.g. Calculate / Restart). It is outside
   * the scroll area, so it never covers a field or the focused control. Put the primary button last.
   */
  footer?: ReactNode;
  /** 'end' (default) right-aligns the footer buttons; 'between' puts the first one at the left. */
  footerAlign?: 'end' | 'between';
  className?: string;
  bodyClassName?: string;
}

export interface SingleSectionProps extends SectionBaseProps {
  title: ReactNode;
  children: ReactNode;
  tabs?: never;
}

export interface TabbedSectionProps<V extends string> extends SectionBaseProps {
  tabs: SectionTab<V>[];
  value: V;
  onChange: (value: V) => void;
  title?: never;
  children?: never;
}

export type SectionProps<V extends string> = SingleSectionProps | TabbedSectionProps<V>;

const headerClass = 'flex shrink-0 items-center border-b-2 border-border-tabs material-header pr-2';
const tabsSx = { flex: 1, border: 0, backgroundColor: 'transparent' } as const;

/**
 * Section panel (Input / Output / Illustration): gray tab bar on top, scrollable body.
 * A single-title section renders its title as the only tab, so every section header looks the same.
 */
export function Section<V extends string>(props: SectionProps<V>) {
  const { actions, footer, footerAlign = 'end', className, bodyClassName } = props;
  const tabsId = useId();
  const footerBar = footer && (
    <div
      className={cn(
        'flex shrink-0 flex-wrap items-center gap-2 border-t border-border p-2',
        footerAlign === 'between' ? 'justify-between' : 'justify-end',
      )}
    >
      {footer}
    </div>
  );

  if (props.tabs) {
    const { tabs, value, onChange } = props;
    return (
      <div className={cn('flex h-full min-h-0 flex-col overflow-hidden rounded-section material-panel shadow-(--shadow-panel)', className)}>
        <div className={headerClass}>
          <Tabs id={tabsId} value={value} onChange={onChange} sx={tabsSx}>
            {tabs.map((t) => (
              <Tab key={t.value} value={t.value} label={t.label} disabled={t.disabled} className={t.className} />
            ))}
          </Tabs>
          {actions && <div className="flex items-center gap-1">{actions}</div>}
        </div>
        {tabs.map((t) => (
          <TabPanel key={t.value} tabsId={tabsId} value={t.value} current={value} keepMounted={t.keepMounted} className={cn('min-h-0', bodyClassName)}>
            {t.content}
          </TabPanel>
        ))}
        {footerBar}
      </div>
    );
  }

  return (
    <div className={cn('flex h-full min-h-0 flex-col overflow-hidden rounded-section material-panel shadow-(--shadow-panel)', className)}>
      <div className={headerClass}>
        <Tabs value="only" onChange={() => undefined} sx={tabsSx}>
          <Tab value="only" label={props.title} />
        </Tabs>
        {actions && <div className="flex items-center gap-1">{actions}</div>}
      </div>
      <div className={cn('min-h-0 flex-1 overflow-auto', bodyClassName)}>{props.children}</div>
      {footerBar}
    </div>
  );
}
