import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import UnfoldLessIcon from '@mui/icons-material/UnfoldLess';
import UnfoldMoreIcon from '@mui/icons-material/UnfoldMore';
import MuiAccordion from '@mui/material/Accordion';
import AccordionDetails from '@mui/material/AccordionDetails';
import AccordionSummary from '@mui/material/AccordionSummary';
import Tooltip from '@mui/material/Tooltip';
import { type ReactNode, useCallback, useId, useMemo, useState } from 'react';

import { useStableValue } from '../utils/useStableValue';
import { IconButton } from './Button';
import { InfoTip } from './InfoTip';

export interface AccordionProps {
  title: ReactNode;
  children: ReactNode;
  defaultExpanded?: boolean;
  expanded?: boolean;
  onChange?: (expanded: boolean) => void;
  /** Heading level wrapping the header button, to fit the page outline. Default h3. */
  headingLevel?: 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
  /** Content of a "?" bubble right after the title, outside the header button (not part of its name). */
  help?: ReactNode;
  /** Accessible name of the "?" button, e.g. "About loads". Default "More information". */
  helpLabel?: string;
  className?: string;
}

/**
 * Header with a "?" bubble. A button cannot contain another button, so the "?" sits in a layer over the header: an
 * invisible copy of the title (same font and padding as the summary, chevron width reserved) places it right after the
 * text, and `relative` stacks the layer above the (positioned) summary button. MUI reads `id` and `aria-controls` from
 * the accordion's first child to label its region, so this wrapper takes them like the summary itself.
 */
function HeaderWithHelp({ title, help, helpLabel, children }: { id: string; 'aria-controls': string; title: ReactNode; help: ReactNode; helpLabel?: string; children: ReactNode }) {
  return (
    <div className="grid">
      {children}
      <div className="pointer-events-none relative col-start-1 row-start-1 self-center py-2 pr-[calc(1rem+24px)] pl-2 text-sm font-bold">
        <span aria-hidden className="invisible">
          {title}
        </span>
        <span className="pointer-events-auto ml-1 inline-flex align-middle">
          <InfoTip label={helpLabel}>{help}</InfoTip>
        </span>
      </div>
    </div>
  );
}

/**
 * Section accordion: light gray header, brand-colored chevron rotating 90deg when open.
 * The header is a button inside a heading (WAI-ARIA accordion pattern): Enter/Space toggle.
 */
export function Accordion({ title, children, defaultExpanded = true, expanded, onChange, headingLevel = 'h3', help, helpLabel, className }: AccordionProps) {
  const id = useId();
  const headerIds = { id: `${id}-header`, 'aria-controls': `${id}-content` };
  const summary = (
    <AccordionSummary expandIcon={<KeyboardArrowRightIcon />} {...headerIds} className={help ? 'col-start-1 row-start-1' : undefined}>
      {title}
    </AccordionSummary>
  );
  return (
    <MuiAccordion
      slots={{ heading: headingLevel }}
      // A plain heading element keeps browser margins/font; reset them like MUI's own heading slot.
      slotProps={{ heading: { style: { margin: 0, fontSize: 'inherit', fontWeight: 'inherit', lineHeight: 'inherit' } } }}
      defaultExpanded={defaultExpanded}
      expanded={expanded}
      onChange={(_, isExpanded) => onChange?.(isExpanded)}
      className={className}
    >
      {help ? (
        <HeaderWithHelp {...headerIds} title={title} help={help} helpLabel={helpLabel}>
          {summary}
        </HeaderWithHelp>
      ) : (
        summary
      )}
      {/* MUI gives the collapse region the id named by aria-controls; do not repeat it here. */}
      <AccordionDetails>{children}</AccordionDetails>
    </MuiAccordion>
  );
}

export interface AccordionGroup<K extends string> {
  /** Props for one accordion of the group: <Accordion {...group.item('loads')} />. */
  item: (key: K) => { expanded: boolean; onChange: (expanded: boolean) => void };
  allExpanded: boolean;
  allCollapsed: boolean;
  /** Opens every section. Does nothing in exclusive mode. */
  expandAll: () => void;
  collapseAll: () => void;
  /** Collapses everything if any section is open, otherwise expands everything (exclusive mode: only collapses). */
  toggleAll: () => void;
}

export interface AccordionGroupOptions<K extends string> {
  /** Starting state of keys not in `initial`. Default true (false in exclusive mode). */
  defaultExpanded?: boolean;
  /** Starting state for specific keys, e.g. { [latest]: true } with defaultExpanded false. */
  initial?: Partial<Record<K, boolean>>;
  /**
   * At most one section open: opening one closes the others. Everything starts closed except
   * the first key set to true in `initial`. Do not show ExpandCollapseAllButton with it.
   */
  exclusive?: boolean;
}

/**
 * Shared open/closed state for a list of accordions, so a header button can
 * expand or collapse them all while each one still toggles on its own.
 *
 * `useAccordionGroup(keys, { exclusive: true, initial: { loads: true } })` keeps one section open
 * at a time. The older form `useAccordionGroup(keys, defaultExpanded, initial)` still works.
 */
export function useAccordionGroup<K extends string>(
  keysProp: readonly K[],
  optionsOrDefault?: boolean | AccordionGroupOptions<K>,
  /** Starting state for specific keys (older positional form). */
  initialProp?: Partial<Record<K, boolean>>,
): AccordionGroup<K> {
  const options = typeof optionsOrDefault === 'object' ? optionsOrDefault : { defaultExpanded: optionsOrDefault, initial: initialProp };
  const exclusive = options.exclusive ?? false;
  const defaultExpanded = exclusive ? false : (options.defaultExpanded ?? true);
  // keys is usually an inline array; depend on its content, not its identity.
  const keys = useStableValue(keysProp);
  const [state, setState] = useState<Partial<Record<K, boolean>>>(() => {
    if (!exclusive) return { ...options.initial };
    const open = keysProp.find((k) => options.initial?.[k]);
    return open === undefined ? {} : ({ [open]: true } as Partial<Record<K, boolean>>);
  });
  const isOpen = useCallback((key: K) => state[key] ?? defaultExpanded, [state, defaultExpanded]);
  const setAll = useCallback(
    (open: boolean) => setState(Object.fromEntries(keys.map((k) => [k, open])) as Record<K, boolean>),
    [keys],
  );

  return useMemo(() => {
    const allExpanded = keys.every(isOpen);
    const allCollapsed = !keys.some(isOpen);
    return {
      item: (key: K) => ({
        expanded: isOpen(key),
        onChange: (open: boolean) =>
          setState((s) => (exclusive && open ? ({ [key]: true } as Partial<Record<K, boolean>>) : { ...s, [key]: open })),
      }),
      allExpanded,
      allCollapsed,
      expandAll: () => {
        if (!exclusive) setAll(true);
      },
      collapseAll: () => setAll(false),
      toggleAll: () => {
        if (!allCollapsed) setAll(false);
        else if (!exclusive) setAll(true);
      },
    };
  }, [keys, isOpen, setAll, exclusive]);
}

export interface ExpandCollapseAllButtonProps {
  group: Pick<AccordionGroup<string>, 'allCollapsed' | 'toggleAll'>;
  expandLabel?: string;
  collapseLabel?: string;
}

/** Header icon button for an accordion group: "Collapse all" while any is open, else "Expand all". */
export function ExpandCollapseAllButton({
  group,
  expandLabel = 'Expand all sections',
  collapseLabel = 'Collapse all sections',
}: ExpandCollapseAllButtonProps) {
  const label = group.allCollapsed ? expandLabel : collapseLabel;
  return (
    <Tooltip title={label}>
      <IconButton aria-label={label} onClick={group.toggleAll} sx={{ color: 'primary.main' }}>
        {group.allCollapsed ? <UnfoldMoreIcon /> : <UnfoldLessIcon />}
      </IconButton>
    </Tooltip>
  );
}
