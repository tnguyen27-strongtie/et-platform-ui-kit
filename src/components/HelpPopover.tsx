import type { ReactNode } from 'react';

import { InfoTip, type InfoTipPlacement } from './InfoTip';

export interface HelpPopoverProps {
  content: ReactNode;
  placement?: InfoTipPlacement;
  label?: string;
}

/**
 * Brand-colored "?" help bubble, kept for existing code and used by FormField `help`. A smaller
 * wrapper around <InfoTip> with its own props: the text goes in `content` (not children), there is no
 * title, and it opens above the trigger (InfoTip opens below). New code should use InfoTip.
 */
export function HelpPopover({ content, placement = 'top', label = 'More information' }: HelpPopoverProps) {
  return (
    <InfoTip label={label} placement={placement}>
      {content}
    </InfoTip>
  );
}
