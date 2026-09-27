import type { ReactNode } from 'react';

import { InfoTip, type InfoTipPlacement } from './InfoTip';

export interface HelpPopoverProps {
  content: ReactNode;
  placement?: InfoTipPlacement;
  label?: string;
}

/** Brand-colored "?" help bubble. Same as <InfoTip> with the default trigger; kept for existing code. */
export function HelpPopover({ content, placement = 'top', label = 'More information' }: HelpPopoverProps) {
  return (
    <InfoTip label={label} placement={placement}>
      {content}
    </InfoTip>
  );
}
