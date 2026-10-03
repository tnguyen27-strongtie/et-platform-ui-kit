import {
  Checkbox,
  DropOverlay,
  ImageViewer,
  ResetViewButton,
  ViewControls,
  ViewControlsGroup,
  VisualizationStage,
  breakpoints,
  colors,
  elevation,
  layout,
  material,
  motion,
  notify,
  resolveSchemeColors,
  shape,
  spacingUnit,
  typography,
  usePlatformColorScheme,
  zIndex,
  type ImageViewerHandle,
} from '@platform/ui';
import { useRef, useState, useSyncExternalStore, type CSSProperties, type DragEvent } from 'react';
import type { CalcInputs } from '../lib/calc';
import theme from '../theme.config';

// App-styled overlay built from the kit's role tokens, so it follows the appearance and dark mode.
const selectionBadge: CSSProperties = {
  position: 'absolute',
  right: spacingUnit * 2,
  bottom: spacingUnit * 2,
  zIndex: zIndex.popper,
  minHeight: layout.tabHeight / 2,
  padding: `${spacingUnit}px ${spacingUnit * 2}px`,
  background: material.overlay,
  borderRadius: shape.panel,
  boxShadow: elevation.popover,
  color: colors.textMuted,
  transition: `opacity ${motion.base} ${motion.easing}`,
};

const wideQuery = `(min-width: ${breakpoints.md}px)`;
function useWideScreen() {
  return useSyncExternalStore(
    (onChange) => {
      const list = window.matchMedia(wideQuery);
      list.addEventListener('change', onChange);
      return () => list.removeEventListener('change', onChange);
    },
    () => window.matchMedia(wideQuery).matches,
  );
}

interface IllustrationPanelProps {
  inputs: CalcInputs;
  loading: boolean;
  selected: string | null;
}

export function IllustrationPanel({ inputs, loading, selected }: IllustrationPanelProps) {
  const viewer = useRef<ImageViewerHandle>(null);
  const wide = useWideScreen();
  const [showDimensions, setShowDimensions] = useState(true);
  const [dragging, setDragging] = useState(false);
  // Canvas-like code needs real colors, not CSS variables.
  const scheme = usePlatformColorScheme();
  const palette = resolveSchemeColors(scheme, { colors: theme.colors, darkColors: theme.darkColors });

  const onDrop = (event: DragEvent) => {
    event.preventDefault();
    setDragging(false);
    const file = event.dataTransfer.files[0];
    notify.info(file ? `Would load inputs from ${file.name}` : 'Nothing to load');
  };

  return (
    <div
      className="relative size-full"
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
    >
      <VisualizationStage
        loading={loading}
        note="* Fasteners are not drawn to scale."
        empty={inputs.sideThickness === null || inputs.mainThickness === null ? 'Enter both thicknesses to see the drawing.' : undefined}
        controls={
          <ViewControls>
            <ResetViewButton onClick={() => viewer.current?.reset()} />
            <ViewControlsGroup title="Object visibility">
              <Checkbox label="Dimensions" checked={showDimensions} onChange={setShowDimensions} />
            </ViewControlsGroup>
          </ViewControls>
        }
      >
        <div className="relative size-full">
          <ImageViewer ref={viewer} src={inputs.shear === 'double' ? '/double-shear.svg' : '/single-shear.svg'} alt={`${inputs.shear} shear connection drawing`} maxScale={wide ? 8 : 4} />
          {showDimensions && (
            <svg className="pointer-events-none absolute top-2 left-2" width="160" height="24" aria-hidden="true">
              <rect width="160" height="24" rx="4" fill={palette.brand} opacity="0.15" />
              <text x="8" y="16" fontSize="12" fontFamily={typography.fontFamily.math} fill={palette.brand}>
                {`ts ${inputs.sideThickness ?? '?'} in · tm ${inputs.mainThickness ?? '?'} in`}
              </text>
            </svg>
          )}
          {selected && (
            <p className="m-0 text-xs" style={selectionBadge}>
              Selected: {selected}
            </p>
          )}
        </div>
      </VisualizationStage>
      {dragging && <DropOverlay>Drop an input file</DropOverlay>}
    </div>
  );
}
