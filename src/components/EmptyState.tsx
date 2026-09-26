import { type ReactNode } from 'react';

import { cn } from '../utils/cn';

export interface EmptyStateProps {
  title: ReactNode;
  children?: ReactNode;
  icon?: ReactNode;
  /** Usually one Button that fixes the situation ("Add a member"). */
  action?: ReactNode;
  className?: string;
}

/** Placeholder for a pane with nothing to show yet (no results, no inputs). */
export function EmptyState({ title, children, icon, action, className }: EmptyStateProps) {
  return (
    <div role="status" className={cn('flex flex-col items-center justify-center gap-2 p-6 text-center text-text-muted', className)}>
      {icon && <div className="text-4xl text-true-gray-30 icon:text-4xl">{icon}</div>}
      <p className="m-0 text-base font-medium text-text">{title}</p>
      {children && <div className="max-w-md text-sm">{children}</div>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
