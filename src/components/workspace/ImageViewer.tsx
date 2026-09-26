import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import { forwardRef, useCallback, useImperativeHandle, useRef, useState } from 'react';

import { IconButton } from '../Button';
import { LoadingIndicator } from '../LoadingIndicator';

export interface ImageViewerHandle {
  reset: () => void;
}

export interface ImageViewerProps {
  src: string;
  alt: string;
  minScale?: number;
  maxScale?: number;
  /** Show +/- buttons (bottom-right). Wheel, drag, pinch and double-click always work. */
  showZoomButtons?: boolean;
}

interface View {
  scale: number;
  x: number;
  y: number;
}

const initial: View = { scale: 1, x: 0, y: 0 };

/**
 * Pan/zoom image viewer for 2D drawings and illustrations (FD used @panzoom/panzoom).
 * Wheel zooms around the cursor, drag pans, double-click resets. Call ref.reset() from a
 * ResetViewButton.
 */
export const ImageViewer = forwardRef<ImageViewerHandle, ImageViewerProps>(function ImageViewer(
  { src, alt, minScale = 1, maxScale = 8, showZoomButtons = true },
  ref,
) {
  const [view, setView] = useState<View>(initial);
  const [loading, setLoading] = useState(true);
  const [dragging, setDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ id: number; x: number; y: number } | null>(null);

  const reset = useCallback(() => setView(initial), []);
  useImperativeHandle(ref, () => ({ reset }), [reset]);

  const zoomAt = useCallback(
    (factor: number, clientX?: number, clientY?: number) => {
      setView((v) => {
        const scale = Math.min(maxScale, Math.max(minScale, v.scale * factor));
        if (scale === minScale) return initial;
        const rect = containerRef.current?.getBoundingClientRect();
        if (!rect) return { ...v, scale };
        // Keep the point under the cursor fixed while zooming.
        const px = (clientX ?? rect.left + rect.width / 2) - rect.left - rect.width / 2;
        const py = (clientY ?? rect.top + rect.height / 2) - rect.top - rect.height / 2;
        const k = scale / v.scale;
        return { scale, x: px - (px - v.x) * k, y: py - (py - v.y) * k };
      });
    },
    [maxScale, minScale],
  );

  return (
    <div
      ref={containerRef}
      className="relative size-full touch-none overflow-hidden bg-white select-none"
      onWheel={(e) => zoomAt(e.deltaY < 0 ? 1.15 : 1 / 1.15, e.clientX, e.clientY)}
      onDoubleClick={reset}
      onPointerDown={(e) => {
        if (view.scale === 1) return;
        e.currentTarget.setPointerCapture(e.pointerId);
        drag.current = { id: e.pointerId, x: e.clientX - view.x, y: e.clientY - view.y };
        setDragging(true);
      }}
      onPointerMove={(e) => {
        if (drag.current?.id !== e.pointerId) return;
        const start = drag.current;
        setView((v) => ({ ...v, x: e.clientX - start.x, y: e.clientY - start.y }));
      }}
      onPointerUp={() => {
        drag.current = null;
        setDragging(false);
      }}
      style={{ cursor: dragging ? 'grabbing' : view.scale > 1 ? 'grab' : 'zoom-in' }}
    >
      <img
        src={src}
        alt={alt}
        draggable={false}
        onLoad={() => setLoading(false)}
        onError={() => setLoading(false)}
        className="absolute inset-0 size-full object-contain"
        style={{
          transform: `translate(${view.x}px, ${view.y}px) scale(${view.scale})`,
          transition: dragging ? 'none' : 'transform 120ms ease-out',
        }}
      />
      {showZoomButtons && (
        // Keep pointer and double-click events on the buttons: otherwise the pan handler captures the
        // pointer (the click never reaches the button) and quick repeated clicks reset the view.
        <div
          className="absolute right-2 bottom-2 z-10 flex flex-col rounded-sm bg-white shadow-popover"
          onPointerDown={(e) => e.stopPropagation()}
          onDoubleClick={(e) => e.stopPropagation()}
        >
          <IconButton aria-label="Zoom in" onClick={() => zoomAt(1.5)} disabled={view.scale >= maxScale}>
            <AddIcon fontSize="small" />
          </IconButton>
          <IconButton aria-label="Zoom out" onClick={() => zoomAt(1 / 1.5)} disabled={view.scale <= minScale}>
            <RemoveIcon fontSize="small" />
          </IconButton>
        </div>
      )}
      {loading && (
        <div className="absolute inset-0 z-20">
          <LoadingIndicator />
        </div>
      )}
    </div>
  );
});
