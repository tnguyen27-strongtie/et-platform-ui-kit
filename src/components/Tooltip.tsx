import MuiTooltip, { type TooltipProps as MuiTooltipProps } from '@mui/material/Tooltip';
import { forwardRef } from 'react';

export type TooltipProps = MuiTooltipProps;

/**
 * Hover tooltip for short text: a label for an icon button, a one-line hint. Plain text only;
 * for long or rich explanations (paragraphs, lists, links) use InfoTip, which opens on click.
 *
 * Standard behaviour (defaults set in the theme, so plain MUI Tooltip matches):
 * - opens after 300ms on hover, 100ms when moving between neighbours; on keyboard focus;
 *   on long-press on touch screens
 * - stays open while the pointer is over the tooltip; Escape closes it (WCAG 1.4.13)
 * - describes its child (aria-describedby), never replaces the child's own name
 * - works on disabled buttons (they keep pointer events in this kit)
 */
export const Tooltip = forwardRef<HTMLDivElement, TooltipProps>(function Tooltip(props, ref) {
  return <MuiTooltip ref={ref} {...props} />;
});
