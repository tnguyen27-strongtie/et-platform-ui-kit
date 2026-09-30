import { type ReactNode, useId } from 'react';

import { cn } from '../utils/cn';

export interface CardProps {
  /** Header title, bold on a light gray bar (same look as table and accordion headers). */
  title?: ReactNode;
  /** Heading level of the title for the page outline. Default h3. */
  titleAs?: 'h2' | 'h3' | 'h4';
  /** Muted text after the title (e.g. units, "3 items"). */
  subtitle?: ReactNode;
  /** Buttons or links at the right of the header. */
  actions?: ReactNode;
  /** Row at the bottom (e.g. totals, buttons), right-aligned. */
  footer?: ReactNode;
  /**
   * Body padding. 'sm' (default, 8px) matches dialogs and accordions; 'md' is 12px;
   * 'none' lets a table or list sit flush against the card border.
   */
  padding?: 'none' | 'sm' | 'md';
  /**
   * 'group' makes the card a named group (role="group", aria-labelledby the title), so screen
   * readers announce the title when focus enters an input inside it. Use it for cards that group
   * form inputs. Default: a plain section.
   */
  role?: 'group';
  /** Let a long title wrap onto more lines instead of being cut off with an ellipsis. Default false. */
  wrapTitle?: boolean;
  children: ReactNode;
  className?: string;
}

// padding="none": a DataTable inside drops its outer border and the cell borders along the
// card edge, so the card border is the only line there (no doubled edges).
const flushTable = [
  '[&>.MuiTableContainer-root]:border-0',
  '[&_tr>*:first-child]:border-l-0',
  '[&_tr>*:last-child]:border-r-0',
  '[&_table>*:first-child>tr:first-child>*]:border-t-0',
  '[&_table>*:last-child>tr:last-child>*]:border-b-0',
].join(' ');
const bodyPadding = { none: flushTable, sm: 'p-2', md: 'p-3' } as const;

/** Bordered panel with an optional highlighted header and footer, for grouping results or inputs. */
export function Card({
  title,
  titleAs: Title = 'h3',
  subtitle,
  actions,
  footer,
  padding = 'sm',
  role,
  wrapTitle = false,
  children,
  className,
}: CardProps) {
  const titleId = useId();
  // A named <section> would be a landmark region; many input cards would flood the landmark list,
  // so a group card is a <div role="group"> instead.
  const Root = role === 'group' ? 'div' : 'section';
  const labelledBy = role === 'group' && title ? titleId : undefined;
  return (
    <Root
      role={role}
      aria-labelledby={labelledBy}
      className={cn('flex min-w-0 flex-col overflow-hidden rounded-panel border border-border-strong material-panel shadow-(--shadow-panel)', className)}
    >
      {(title || actions) && (
        <header className="flex min-h-10 items-center justify-between gap-2 border-b border-border-input bg-surface-subtle px-2 py-1">
          <div className={cn('flex min-w-0 items-baseline gap-x-2', wrapTitle && 'flex-wrap')}>
            {title && (
              <Title id={labelledBy} className={cn('m-0 text-sm font-bold text-text', wrapTitle ? 'min-w-0 wrap-break-word' : 'truncate')}>
                {title}
              </Title>
            )}
            {subtitle && <span className="truncate text-xs text-text-muted">{subtitle}</span>}
          </div>
          {actions && <div className="flex shrink-0 items-center gap-1">{actions}</div>}
        </header>
      )}
      <div className={cn('min-w-0 flex-1 text-sm', bodyPadding[padding])}>{children}</div>
      {footer && <footer className="flex items-center justify-end gap-2 border-t border-border px-2 py-1.5">{footer}</footer>}
    </Root>
  );
}
