import Popover from '@mui/material/Popover';
import { styled } from '@mui/material/styles';
import { type ReactNode, useId, useState } from 'react';

import { colors, scales } from '../tokens/tokens';
import { CloseButton } from './Button';

const Trigger = styled('button')({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '1rem',
  height: '1rem',
  marginLeft: '0.25rem',
  verticalAlign: 'text-bottom',
  borderRadius: '9999px',
  border: 0,
  padding: 0,
  cursor: 'pointer',
  fontSize: '0.75rem',
  fontWeight: 700,
  lineHeight: 1,
  fontFamily: 'Helvetica, Arial, sans-serif',
  color: colors.textOnBrand,
  backgroundColor: colors.accent,
  transition: 'background-color 250ms',
  '&:hover': { backgroundColor: scales.pumpkinOrange[30] },
  '&:active': { backgroundColor: colors.brandActive },
});

export interface HelpPopoverProps {
  content: ReactNode;
  placement?: 'top' | 'bottom';
  label?: string;
}

/** Orange "?" bubble that opens a popover with help text (FD Popper, click trigger). */
export function HelpPopover({ content, placement = 'top', label = 'More information' }: HelpPopoverProps) {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const id = useId();

  return (
    <>
      <Trigger
        type="button"
        aria-label={label}
        aria-describedby={anchor ? id : undefined}
        onClick={(e) => {
          e.preventDefault();
          setAnchor(e.currentTarget);
        }}
      >
        ?
      </Trigger>
      <Popover
        id={id}
        open={!!anchor}
        anchorEl={anchor}
        onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: placement, horizontal: 'center' }}
        transformOrigin={{ vertical: placement === 'top' ? 'bottom' : 'top', horizontal: 'center' }}
        slotProps={{
          paper: {
            sx: { maxWidth: '24rem', maxHeight: '24rem', p: 2, fontSize: '0.875rem', my: placement === 'top' ? -2.5 : 2.5 },
          },
        }}
      >
        <CloseButton onClick={() => setAnchor(null)} sx={{ float: 'right', ml: 2 }} />
        {content}
      </Popover>
    </>
  );
}
