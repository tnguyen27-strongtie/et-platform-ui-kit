import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import MuiLink from '@mui/material/Link';
import type { MouseEvent, ReactNode } from 'react';

export interface GridImageCellProps {
  /** Image URL. Without one, a neutral placeholder keeps rows aligned. */
  src?: string;
  /** Alt text; leave empty ("") when the text next to it already says the same. */
  alt?: string;
  text: ReactNode;
  /** Second line in muted small text (e.g. model number, size). */
  subtext?: ReactNode;
  /** Thumbnail size in px. Default 32. */
  size?: number;
}

/** Thumbnail + text (+ optional second line). Images load lazily. */
export function GridImageCell({ src, alt = '', text, subtext, size = 32 }: GridImageCellProps) {
  return (
    <span className="flex min-w-0 items-center gap-2">
      {src ? (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          width={size}
          height={size}
          className="shrink-0 rounded-sm border border-border bg-surface object-contain"
        />
      ) : (
        <span aria-hidden="true" className="shrink-0 rounded-sm bg-true-gray-10" style={{ width: size, height: size }} />
      )}
      <span className="flex min-w-0 flex-col">
        <span className="truncate">{text}</span>
        {subtext != null && subtext !== '' && <span className="truncate text-text-muted">{subtext}</span>}
      </span>
    </span>
  );
}

export interface GridLinkCellProps {
  children: ReactNode;
  /** Navigates like a normal link (middle-click, open in new tab work). */
  href?: string;
  /** In-app action when there is no URL (opens a dialog, selects a product...). */
  onClick?: () => void;
  /** Opens in a new tab with rel="noopener noreferrer" and an icon + screen-reader hint. */
  external?: boolean;
}

/**
 * Link inside a grid cell. With `href` it is a real <a>; with only `onClick` it renders a
 * button styled as a link, so it is keyboard accessible and never a dead href="#".
 * Clicks do not trigger the row's onRowClick.
 */
export function GridLinkCell({ children, href, onClick, external }: GridLinkCellProps) {
  const handleClick = (e: MouseEvent) => {
    e.stopPropagation();
    onClick?.();
  };
  if (!href) {
    return (
      <MuiLink component="button" type="button" onClick={handleClick} sx={{ font: 'inherit', textAlign: 'start' }}>
        {children}
      </MuiLink>
    );
  }
  return (
    <MuiLink
      href={href}
      onClick={handleClick}
      {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}
    >
      {children}
      {external && (
        <>
          <OpenInNewIcon aria-hidden="true" sx={{ fontSize: '0.875rem' }} />
          <span className="sr-only">(opens in a new tab)</span>
        </>
      )}
    </MuiLink>
  );
}
