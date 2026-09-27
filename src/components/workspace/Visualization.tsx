import { type ReactNode } from 'react';

import { cn } from '../../utils/cn';
import Tooltip from '@mui/material/Tooltip';
import { Button } from '../Button';
import { LoadingIndicator } from '../LoadingIndicator';

export interface VisualizationStageProps {
  /** The viewer: a 3D web component, a canvas, an <ImageViewer>, an SVG... */
  children: ReactNode;
  /** Control panel: top-right on tablet/desktop, below the viewer on mobile. */
  controls?: ReactNode;
  /** Footnote pinned bottom-left (e.g. "Fasteners not shown to scale"). */
  note?: ReactNode;
  /** Shows the "Updating results" overlay above the viewer. */
  loading?: boolean;
  loadingText?: ReactNode;
  /** Shown instead of the viewer when there is nothing to draw yet. */
  empty?: ReactNode;
  className?: string;
}

/**
 * Illustration pane body.
 * - Tablet/desktop: viewer fills the pane; controls float top-right, note bottom-left.
 * - Mobile: viewer on top, then controls and note in normal flow (no overlap on small screens).
 */
export function VisualizationStage({ children, controls, note, loading, loadingText, empty, className }: VisualizationStageProps) {
  return (
    <div className={cn('relative flex size-full flex-col overflow-auto bg-white md:block md:overflow-hidden', className)}>
      <div className="relative min-h-64 flex-1 md:absolute md:inset-0">{empty ?? children}</div>

      {controls && (
        <div className="z-10 flex flex-col p-2 md:absolute md:top-2 md:right-2 md:rounded-sm md:bg-white/85 md:p-4">
          {controls}
        </div>
      )}

      {note && <div className="z-10 p-2 text-xs md:absolute md:bottom-0 md:left-0 md:max-w-[60%]">{note}</div>}

      {loading && (
        <div className="absolute inset-0 z-50">
          <LoadingIndicator>{loadingText}</LoadingIndicator>
        </div>
      )}
    </div>
  );
}

/** Vertical stack of viewer controls; use ViewControlsGroup for titled blocks. */
export function ViewControls({ children }: { children: ReactNode }) {
  return <div className="flex flex-col items-start gap-4">{children}</div>;
}

export function ViewControlsGroup({ title, children }: { title: ReactNode; children: ReactNode }) {
  return (
    <div role="group" className="flex flex-col gap-1">
      <p className="m-0 text-sm">{title}</p>
      <div className="flex flex-col gap-1 text-xs [&_.MuiFormControlLabel-label]:text-xs">{children}</div>
    </div>
  );
}

/** Reset-view button: default button with a target icon and a hover tooltip. */
export function ResetViewButton({ onClick, label = 'Reset view' }: { onClick: () => void; label?: string }) {
  return (
    <Tooltip title={label}>
      <Button onClick={onClick} aria-label={label} sx={{ px: 2 }}>
        <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
          <path
            fill="currentColor"
            d="M12 8C9.79 8 8 9.79 8 12s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4Zm8.94 3A8.994 8.994 0 0 0 13 3.06V1h-2v2.06A8.994 8.994 0 0 0 3.06 11H1v2h2.06A8.994 8.994 0 0 0 11 20.94V23h2v-2.06A8.994 8.994 0 0 0 20.94 13H23v-2h-2.06ZM12 19c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7Z"
          />
        </svg>
      </Button>
    </Tooltip>
  );
}

/** Dashed overlay shown while a file is dragged over a section (e.g. dropping a saved input JSON file). */
export function DropOverlay({ children }: { children: ReactNode }) {
  return (
    <div className="pointer-events-none absolute inset-1 z-40 flex items-center justify-center rounded-sm border-4 border-dashed border-true-gray-30 bg-white/60 text-4xl font-bold text-true-gray-30">
      {children}
    </div>
  );
}
