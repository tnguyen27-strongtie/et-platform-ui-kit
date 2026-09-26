import { type ReactNode } from 'react';

import { cn } from '../utils/cn';

export interface CardProps {
  /** Header title; renders as an h3 unless `titleAs` says otherwise. */
  title?: ReactNode;
  titleAs?: 'h2' | 'h3' | 'h4';
  /** Buttons or links at the right of the header. */
  actions?: ReactNode;
  /** Row at the bottom (e.g. totals, buttons). */
  footer?: ReactNode;
  children: ReactNode;
  className?: string;
}

/** White bordered panel with optional header and footer, for grouping results or inputs. */
export function Card({ title, titleAs: Title = 'h3', actions, footer, children, className }: CardProps) {
  return (
    <section className={cn('flex flex-col rounded-sm border border-border-strong bg-surface', className)}>
      {(title || actions) && (
        <header className="flex items-center justify-between gap-2 border-b border-border px-3 py-2">
          {title && <Title className="m-0 text-sm font-bold">{title}</Title>}
          {actions && <div className="flex items-center gap-1">{actions}</div>}
        </header>
      )}
      <div className="flex-1 p-3">{children}</div>
      {footer && <footer className="flex items-center justify-end gap-2 border-t border-border px-3 py-2">{footer}</footer>}
    </section>
  );
}
