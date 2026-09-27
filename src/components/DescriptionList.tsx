import { Fragment, type ReactNode } from 'react';

import { cn } from '../utils/cn';

export interface DescriptionListItem {
  /** Stable key. */
  id: string;
  label: ReactNode;
  value: ReactNode;
}

export interface DescriptionListProps {
  items: DescriptionListItem[];
  /** 'sm' for small text inside cards; 'md' (default) for dialogs and pages. */
  size?: 'sm' | 'md';
  className?: string;
}

const sizes = {
  sm: { text: 'text-xs', gap: '@xs:gap-y-1', stack: 'mb-1' },
  md: { text: 'text-sm', gap: '@xs:gap-y-2', stack: 'mb-2' },
} as const;

/**
 * Label/value pairs (details, properties, "About" information) as a semantic dl/dt/dd list.
 * Two columns when its container is at least 20rem wide, stacked label-over-value below that,
 * so it also fits a narrow workspace panel. Long values wrap.
 */
export function DescriptionList({ items, size = 'md', className }: DescriptionListProps) {
  const s = sizes[size];
  return (
    <div className={cn('@container', className)}>
      <dl className={cn('m-0 grid grid-cols-1 @xs:grid-cols-[fit-content(50%)_minmax(0,1fr)] @xs:gap-x-4', s.gap, s.text)}>
        {items.map((item) => (
          <Fragment key={item.id}>
            <dt className="font-medium text-text">{item.label}</dt>
            <dd className={cn('m-0 min-w-0 wrap-break-word text-text @xs:mb-0', s.stack)}>{item.value}</dd>
          </Fragment>
        ))}
      </dl>
    </div>
  );
}
