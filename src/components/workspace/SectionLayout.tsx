import KeyboardDoubleArrowRightIcon from '@mui/icons-material/KeyboardDoubleArrowRight';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import { type ReactNode, useId, useState } from 'react';
import { Group, Panel, type PanelSize, Separator, useDefaultLayout, usePanelRef } from 'react-resizable-panels';

import { layout } from '../../tokens/tokens';
import { cn } from '../../utils/cn';
import { Tab, TabPanel, Tabs } from '../Tabs';

export type SectionId = 'input' | 'illustration' | 'output';

export interface SectionLayoutProps {
  input: ReactNode;
  illustration: ReactNode;
  output: ReactNode;
  /**
   * How Illustration and Output share the right side on desktop (FD "orientation" setting):
   * 'rows' = stacked (FD default "horizontal"), 'columns' = side by side.
   * Tablet always stacks them.
   */
  secondarySplit?: 'rows' | 'columns';
  /** Persists panel sizes in localStorage under this key. Omit to disable. */
  layoutId?: string;
  /** Labels for the collapsed rails and the mobile tab bar. */
  labels?: Partial<Record<SectionId, ReactNode>>;
  /** Mobile only: replace the section order or add extra tabs (e.g. "Result"). */
  mobileTabs?: { value: string; label: ReactNode; content: ReactNode; disabled?: boolean; keepMounted?: boolean }[];
  /** Mobile only: buttons at the right end of the tab bar (e.g. reset). */
  mobileActions?: ReactNode;
}

const defaultLabels: Record<SectionId, ReactNode> = { input: 'Input', illustration: '3D', output: 'Output' };

/** Pane minimum before collapsing, as in FD (content was hidden under 250px). */
const PANE_MIN = '250px';
const RAIL = '2rem';

function ResizeHandle({ direction }: { direction: 'columns' | 'rows' }) {
  return (
    <Separator
      className={cn(
        'shrink-0 bg-true-gray-30 transition-colors duration-250 hover:bg-true-gray-50 data-[separator=active]:bg-accent',
        direction === 'columns' ? 'w-[5px] cursor-col-resize' : 'h-[5px] cursor-row-resize',
      )}
    />
  );
}

/**
 * localStorage that never throws: reading `window.localStorage` itself throws a SecurityError when
 * storage is blocked (sandboxed iframe, strict privacy settings), and it is missing during SSR.
 * Sizes are then simply not remembered.
 */
const safeStorage = {
  getItem(key: string) {
    try {
      return globalThis.localStorage?.getItem(key) ?? null;
    } catch {
      return null;
    }
  },
  setItem(key: string, value: string) {
    try {
      globalThis.localStorage?.setItem(key, value);
    } catch {
      // Blocked or full: layout persistence is a convenience, nothing breaks.
    }
  },
};

/** Thin bar shown when a column pane is collapsed; click to expand it again. */
function CollapsedRail({ label, onExpand }: { label: ReactNode; onExpand: () => void }) {
  return (
    // Name "Expand <label>" contains the visible label (WCAG 2.5.3: label in name).
    <button
      type="button"
      onClick={onExpand}
      aria-expanded={false}
      className="flex h-full w-full cursor-pointer flex-col items-center gap-2 border-0 bg-true-gray-10 py-2 text-sm font-medium text-text hover:text-brand"
    >
      <KeyboardDoubleArrowRightIcon fontSize="small" />
      <span className="sr-only">Expand </span>
      <span className="[writing-mode:vertical-rl]">{label}</span>
    </button>
  );
}

function useCollapsed(collapsedPx: number) {
  const [collapsed, setCollapsed] = useState(false);
  const onResize = (size: PanelSize) => setCollapsed(size.inPixels <= collapsedPx + 1);
  return [collapsed, onResize] as const;
}

function DesktopLayout({ input, illustration, output, secondarySplit, layoutId, labels }: Required<Pick<SectionLayoutProps, 'input' | 'illustration' | 'output' | 'secondarySplit'>> & Pick<SectionLayoutProps, 'layoutId'> & { labels: Record<SectionId, ReactNode> }) {
  const inputRef = usePanelRef();
  const [inputCollapsed, onInputResize] = useCollapsed(32);
  const primary = useDefaultLayout({ id: `${layoutId ?? 'layout'}-primary`, storage: layoutId ? safeStorage : undefined });
  const secondary = useDefaultLayout({ id: `${layoutId ?? 'layout'}-secondary-${secondarySplit}`, storage: layoutId ? safeStorage : undefined });

  return (
    <Group
      orientation="horizontal"
      className="size-full"
      defaultLayout={layoutId ? primary.defaultLayout : undefined}
      onLayoutChanged={layoutId ? primary.onLayoutChanged : undefined}
    >
      <Panel
        id="input"
        panelRef={inputRef}
        defaultSize="36%"
        minSize={PANE_MIN}
        collapsible
        collapsedSize={RAIL}
        onResize={onInputResize}
        className="h-full"
      >
        {inputCollapsed ? <CollapsedRail label={labels.input} onExpand={() => inputRef.current?.expand()} /> : input}
      </Panel>
      <ResizeHandle direction="columns" />
      <Panel id="secondary" minSize={PANE_MIN} className="h-full">
        <Group
          orientation={secondarySplit === 'columns' ? 'horizontal' : 'vertical'}
          className="size-full"
          defaultLayout={layoutId ? secondary.defaultLayout : undefined}
          onLayoutChanged={layoutId ? secondary.onLayoutChanged : undefined}
        >
          <Panel id="illustration" defaultSize="50%" minSize={`${layout.tabHeight}px`} className="h-full overflow-hidden">
            {illustration}
          </Panel>
          <ResizeHandle direction={secondarySplit} />
          <Panel id="output" minSize={`${layout.tabHeight}px`} className="h-full overflow-hidden">
            {output}
          </Panel>
        </Group>
      </Panel>
    </Group>
  );
}

function MobileLayout({ input, illustration, output, labels, mobileTabs, mobileActions }: SectionLayoutProps & { labels: Record<SectionId, ReactNode> }) {
  const tabs = mobileTabs ?? [
    { value: 'input', label: labels.input, content: input, keepMounted: true },
    { value: 'illustration', label: labels.illustration, content: illustration },
    // Output stays mounted so result queries keep running while hidden (FD behaviour).
    { value: 'output', label: labels.output, content: output, keepMounted: true },
  ];
  const [current, setCurrent] = useState(tabs[0]?.value ?? 'input');
  const tabsId = useId();

  return (
    <div className="flex size-full flex-col bg-white">
      <div className="flex shrink-0 items-center border-b-2 border-true-gray-20 bg-true-gray-10 pr-2">
        <Tabs id={tabsId} value={current} onChange={setCurrent} sx={{ flex: 1, border: 0, backgroundColor: 'transparent' }}>
          {tabs.map((t) => (
            <Tab key={t.value} value={t.value} label={t.label} disabled={t.disabled} />
          ))}
        </Tabs>
        {mobileActions}
      </div>
      {tabs.map((t) => (
        <TabPanel key={t.value} tabsId={tabsId} value={t.value} current={current} keepMounted={t.keepMounted} className="min-h-0 [&>*]:h-full">
          {t.content}
        </TabPanel>
      ))}
    </div>
  );
}

/**
 * FD three-section workspace.
 * - Desktop (>= 992px): Input | (Illustration / Output), resizable, collapsible Input.
 * - Tablet (768-991px): same, Illustration and Output always stacked.
 * - Mobile (< 768px): one section at a time, switched by tabs.
 * Sections should render their own header (use <Section>); on mobile the layout's tab bar
 * replaces it, so pass the section bodies via mobileTabs if you want to avoid a double header.
 */
export function SectionLayout({ secondarySplit = 'rows', labels: labelOverrides, ...props }: SectionLayoutProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isTablet = useMediaQuery(theme.breakpoints.between('md', 'lg'));
  const labels = { ...defaultLabels, ...labelOverrides };

  if (isMobile) return <MobileLayout {...props} labels={labels} />;
  return <DesktopLayout {...props} labels={labels} secondarySplit={isTablet ? 'rows' : secondarySplit} />;
}

/** Fills the viewport below the top nav (FD .workspace). */
export function Workspace({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <main className={cn('relative h-[calc(var(--viewport-height)-var(--top-nav-height))] w-full overflow-hidden bg-surface-app', className)}>
      {children}
    </main>
  );
}
