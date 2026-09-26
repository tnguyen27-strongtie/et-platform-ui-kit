import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import { forwardRef, type PointerEvent, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';

import { IconButton } from '../Button';
import { LoadingIndicator } from '../LoadingIndicator';

export interface ImageViewerHandle {
  reset: () => void;
}

export interface ImageViewerProps {
  src: string;
  alt: string;
  /** Smallest zoom. 1 = the image fits the viewer; below 1 it can be shrunk further. */
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

type Point = { x: number; y: number };
const distance = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y);

/**
 * Pan/zoom image viewer for 2D drawings and illustrations (FD used @panzoom/panzoom).
 * Wheel or trackpad pinch zooms around the cursor, two-finger pinch zooms on touch screens,
 * drag pans, double-click resets. Call ref.reset() from a ResetViewButton.
 * A new `src` resets the view and shows the loading indicator until it has loaded.
 */
export const ImageViewer = forwardRef<ImageViewerHandle, ImageViewerProps>(function ImageViewer(
  { src, alt, minScale = 1, maxScale = 8, showZoomButtons = true },
  ref,
) {
  const [view, setView] = useState<View>(initial);
  const [loading, setLoading] = useState(true);
  const [gesturing, setGesturing] = useState(false);
  const [shownSrc, setShownSrc] = useState(src);
  const containerRef = useRef<HTMLDivElement>(null);
  const pointers = useRef(new Map<number, Point>());
  const drag = useRef<{ id: number; x: number; y: number } | null>(null);
  const pinch = useRef<{ dist: number } | null>(null);

  // New image: start from the fitted view and show the spinner again (state reset during render).
  if (shownSrc !== src) {
    setShownSrc(src);
    setView(initial);
    setLoading(true);
  }

  const reset = useCallback(() => setView(initial), []);
  useImperativeHandle(ref, () => ({ reset }), [reset]);

  const zoomAt = useCallback(
    (factor: number, clientX?: number, clientY?: number) => {
      setView((v) => {
        const scale = Math.min(maxScale, Math.max(minScale, v.scale * factor));
        // At or below the fitted size there is nothing to pan to: keep the image centered.
        if (scale <= 1) return { scale, x: 0, y: 0 };
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

  // Native, non-passive listener: React's onWheel is passive, so the page would scroll while zooming.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      // ctrlKey = trackpad pinch: many small deltas, so zoom proportionally instead of in steps.
      const factor = e.ctrlKey ? Math.exp(-e.deltaY * 0.01) : e.deltaY < 0 ? 1.15 : 1 / 1.15;
      zoomAt(factor, e.clientX, e.clientY);
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [zoomAt]);

  const endPointer = (e: PointerEvent<HTMLDivElement>) => {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) pinch.current = null;
    if (drag.current?.id === e.pointerId || pointers.current.size === 0) drag.current = null;
    if (!drag.current && !pinch.current) setGesturing(false);
  };

  return (
    <div
      ref={containerRef}
      className="relative size-full touch-none overflow-hidden bg-white select-none"
      onDoubleClick={reset}
      onPointerDown={(e) => {
        pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
        e.currentTarget.setPointerCapture(e.pointerId);
        if (pointers.current.size === 2) {
          const [a, b] = [...pointers.current.values()] as [Point, Point];
          drag.current = null;
          pinch.current = { dist: distance(a, b) };
          setGesturing(true);
          return;
        }
        if (pointers.current.size > 1 || view.scale <= 1) return;
        drag.current = { id: e.pointerId, x: e.clientX - view.x, y: e.clientY - view.y };
        setGesturing(true);
      }}
      onPointerMove={(e) => {
        if (!pointers.current.has(e.pointerId)) return;
        pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
        if (pinch.current && pointers.current.size >= 2) {
          const [a, b] = [...pointers.current.values()] as [Point, Point];
          const dist = distance(a, b);
          if (pinch.current.dist > 0) zoomAt(dist / pinch.current.dist, (a.x + b.x) / 2, (a.y + b.y) / 2);
          pinch.current.dist = dist;
          return;
        }
        if (drag.current?.id !== e.pointerId) return;
        const start = drag.current;
        setView((v) => ({ ...v, x: e.clientX - start.x, y: e.clientY - start.y }));
      }}
      onPointerUp={endPointer}
      // Touch gestures taken over by the browser or OS end in pointercancel, not pointerup.
      onPointerCancel={endPointer}
      style={{ cursor: gesturing ? 'grabbing' : view.scale > 1 ? 'grab' : 'zoom-in' }}
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
          transition: gesturing ? 'none' : 'transform 120ms ease-out',
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
