import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import Popover, { type PopoverOrigin } from '@mui/material/Popover';
import { styled } from '@mui/material/styles';
import {
  cloneElement,
  isValidElement,
  type MouseEvent,
  type ReactElement,
  type ReactNode,
  useId,
  useState,
} from 'react';

import { colors } from '../tokens/tokens';
import { CloseButton, IconButton } from './Button';

const HelpTrigger = styled('button')({
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
  fontFamily: 'inherit',
  color: colors.textOnBrand,
  backgroundColor: colors.accent,
  transition: 'background-color 250ms',
  '&:hover': { backgroundColor: colors.brandHover },
  '&:active': { backgroundColor: colors.brandActive },
  '&:focus-visible': { outline: `2px solid ${colors.brand}`, outlineOffset: '2px' },
});

export type InfoTipPlacement = 'top' | 'bottom' | 'left' | 'right';

const origins: Record<InfoTipPlacement, { anchor: PopoverOrigin; transform: PopoverOrigin; offset: object }> = {
  top: { anchor: { vertical: 'top', horizontal: 'center' }, transform: { vertical: 'bottom', horizontal: 'center' }, offset: { mt: -1 } },
  bottom: { anchor: { vertical: 'bottom', horizontal: 'center' }, transform: { vertical: 'top', horizontal: 'center' }, offset: { mt: 1 } },
  left: { anchor: { vertical: 'center', horizontal: 'left' }, transform: { vertical: 'center', horizontal: 'right' }, offset: { ml: -1 } },
  right: { anchor: { vertical: 'center', horizontal: 'right' }, transform: { vertical: 'center', horizontal: 'left' }, offset: { ml: 1 } },
};

export interface InfoTipProps {
  /** The explanation: paragraphs, lists, links, small tables. */
  children: ReactNode;
  /** Bold heading inside the bubble; also names the dialog for screen readers. */
  title?: ReactNode;
  /** Accessible name of the trigger. Default "More information". */
  label?: string;
  /**
   * Trigger:
   * - 'help' (default): the brand-colored "?" bubble, sized to sit next to a label
   * - 'info': an outlined "i" icon button
   * - an element, e.g. <Button variant="text">How is this calculated?</Button>
   */
  trigger?: 'help' | 'info' | ReactElement<{ onClick?: (e: MouseEvent<HTMLElement>) => void }>;
  /** Side of the trigger the bubble opens on (flips if there is no room). Default 'bottom'. */
  placement?: InfoTipPlacement;
  /** Bubble width limit in px. Default 360. Long content scrolls after 24rem height. */
  maxWidth?: number;
}

/**
 * Click-to-open explanation ("toggletip") for content too long or rich for a hover tooltip.
 *
 * Opens on click / Enter / Space as a small dialog: focus moves into it (so links inside are
 * reachable), Escape, a click outside or the X closes it, and focus returns to the trigger.
 * For a one-line hint shown on hover, use Tooltip instead.
 */
export function InfoTip({ children, title, label = 'More information', trigger = 'help', placement = 'bottom', maxWidth = 360 }: InfoTipProps) {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const id = useId();
  const titleId = `${id}-title`;
  const open = !!anchor;

  const toggle = (e: MouseEvent<HTMLElement>) => {
    // Inside a <label> (FormField), do not also focus/toggle the labelled control.
    e.preventDefault();
    setAnchor(open ? null : e.currentTarget);
  };
  const a11y = {
    'aria-haspopup': 'dialog' as const,
    'aria-expanded': open,
    'aria-controls': open ? id : undefined,
  };

  let triggerNode: ReactNode;
  if (trigger === 'help') {
    triggerNode = (
      <HelpTrigger type="button" aria-label={label} onClick={toggle} {...a11y}>
        ?
      </HelpTrigger>
    );
  } else if (trigger === 'info') {
    triggerNode = (
      <IconButton aria-label={label} size="small" onClick={toggle} sx={{ color: 'text.secondary', p: 0.5 }} {...a11y}>
        <InfoOutlinedIcon sx={{ fontSize: '1.125rem' }} />
      </IconButton>
    );
  } else if (isValidElement(trigger)) {
    triggerNode = cloneElement(trigger, {
      onClick: (e: MouseEvent<HTMLElement>) => {
        trigger.props.onClick?.(e);
        toggle(e);
      },
      ...a11y,
    } as Record<string, unknown>);
  }

  const { anchor: anchorOrigin, transform, offset } = origins[placement];

  return (
    <>
      {triggerNode}
      <Popover
        id={id}
        open={open}
        anchorEl={anchor}
        onClose={() => setAnchor(null)}
        anchorOrigin={anchorOrigin}
        transformOrigin={transform}
        slotProps={{
          paper: {
            role: 'dialog',
            'aria-labelledby': title ? titleId : undefined,
            'aria-label': title ? undefined : label,
            sx: {
              ...offset,
              maxWidth,
              maxHeight: '24rem',
              overflowY: 'auto',
              p: 3,
              fontSize: '0.875rem',
              lineHeight: 1.45,
              '& p': { m: 0 },
              '& p + p, & p + ul, & ul + p, & p + ol, & ol + p': { mt: 2 },
              '& ul, & ol': { m: 0, pl: 5 },
              '& a': { color: colors.link, textUnderlineOffset: '2px' },
              '& a:focus-visible': { outline: `2px solid ${colors.brand}`, outlineOffset: '2px', borderRadius: '2px' },
            },
          },
        }}
      >
        {title ? (
          <>
            <div className="flex items-start gap-2">
              <h2 id={titleId} className="m-0 flex-1 pt-1 text-sm font-bold text-text">
                {title}
              </h2>
              <CloseButton onClick={() => setAnchor(null)} sx={{ mt: -1, mr: -1, flexShrink: 0 }} />
            </div>
            <div className="mt-1">{children}</div>
          </>
        ) : (
          <>
            {/* Floated so short text wraps beside it instead of leaving an empty header row. */}
            <CloseButton onClick={() => setAnchor(null)} sx={{ float: 'right', ml: 2, mt: -1, mr: -1 }} />
            {children}
          </>
        )}
      </Popover>
    </>
  );
}
