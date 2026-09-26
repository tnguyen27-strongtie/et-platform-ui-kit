import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import MuiAccordion from '@mui/material/Accordion';
import AccordionDetails from '@mui/material/AccordionDetails';
import AccordionSummary from '@mui/material/AccordionSummary';
import { type ReactNode, useId } from 'react';

export interface AccordionProps {
  title: ReactNode;
  children: ReactNode;
  defaultExpanded?: boolean;
  expanded?: boolean;
  onChange?: (expanded: boolean) => void;
  className?: string;
}

/** FD section accordion: light gray header, orange chevron rotating 90deg when open. */
export function Accordion({ title, children, defaultExpanded = true, expanded, onChange, className }: AccordionProps) {
  const id = useId();
  return (
    <MuiAccordion
      defaultExpanded={defaultExpanded}
      expanded={expanded}
      onChange={(_, isExpanded) => onChange?.(isExpanded)}
      className={className}
    >
      <AccordionSummary expandIcon={<KeyboardArrowRightIcon />} aria-controls={`${id}-content`} id={`${id}-header`}>
        {title}
      </AccordionSummary>
      <AccordionDetails id={`${id}-content`}>{children}</AccordionDetails>
    </MuiAccordion>
  );
}
