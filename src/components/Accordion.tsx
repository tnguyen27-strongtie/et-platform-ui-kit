import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import UnfoldLessIcon from '@mui/icons-material/UnfoldLess';
import UnfoldMoreIcon from '@mui/icons-material/UnfoldMore';
import MuiAccordion from '@mui/material/Accordion';
import AccordionDetails from '@mui/material/AccordionDetails';
import AccordionSummary from '@mui/material/AccordionSummary';
import Tooltip from '@mui/material/Tooltip';
import { type ReactNode, useCallback, useId, useMemo, useState } from 'react';

import { IconButton } from './Button';

export interface AccordionProps {
  title: ReactNode;
  children: ReactNode;
  defaultExpanded?: boolean;
  expanded?: boolean;
  onChange?: (expanded: boolean) => void;
  /** Heading level wrapping the header button, to fit the page outline. Default h3. */
  headingLevel?: 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
  className?: string;
}

/**
 * FD section accordion: light gray header, orange chevron rotating 90deg when open.
 * The header is a button inside a heading (WAI-ARIA accordion pattern): Enter/Space toggle.
 */
export function Accordion({ title, children, defaultExpanded = true, expanded, onChange, headingLevel = 'h3', className }: AccordionProps) {
  const id = useId();
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
      <AccordionSummary expandIcon={<KeyboardArrowRightIcon />} aria-controls={`${id}-content`} id={`${id}-header`}>
        {title}
      </AccordionSummary>
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
  expandAll: () => void;
  collapseAll: () => void;
  /** FD behaviour: collapse everything if any section is open, otherwise expand everything. */
  toggleAll: () => void;
}

/**
 * Shared open/closed state for a list of accordions, so a header button can
 * expand or collapse them all while each one still toggles on its own.
 */
export function useAccordionGroup<K extends string>(
  keys: readonly K[],
  defaultExpanded = true,
  /** Starting state for specific keys, e.g. { [latest]: true } with defaultExpanded false. */
  initial?: Partial<Record<K, boolean>>,
): AccordionGroup<K> {
  const [state, setState] = useState<Partial<Record<K, boolean>>>(() => ({ ...initial }));
  const isOpen = useCallback((key: K) => state[key] ?? defaultExpanded, [state, defaultExpanded]);
  const setAll = useCallback(
    (open: boolean) => setState(Object.fromEntries(keys.map((k) => [k, open])) as Record<K, boolean>),
    // keys is usually an inline array; depend on its content, not its identity.
    [keys.join('\u0000')],
  );

  return useMemo(() => {
    const allExpanded = keys.every(isOpen);
    const allCollapsed = !keys.some(isOpen);
    return {
      item: (key: K) => ({ expanded: isOpen(key), onChange: (open: boolean) => setState((s) => ({ ...s, [key]: open })) }),
      allExpanded,
      allCollapsed,
      expandAll: () => setAll(true),
      collapseAll: () => setAll(false),
      toggleAll: () => setAll(allCollapsed),
    };
  }, [keys, isOpen, setAll]);
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
