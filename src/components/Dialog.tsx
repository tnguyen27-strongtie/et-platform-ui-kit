import MuiDialog, { type DialogProps as MuiDialogProps } from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import { styled } from '@mui/material/styles';
import type { ReactNode } from 'react';

import { colors, layout } from '../tokens/tokens';
import { cn } from '../utils/cn';
import { CloseButton } from './Button';

export interface DialogProps extends Omit<MuiDialogProps, 'onClose'> {
  onClose?: () => void;
  /** 'top' slides in below the top nav (FD default); 'center' centers vertically. */
  placement?: 'top' | 'center';
}

const StyledDialog = styled(MuiDialog, {
  shouldForwardProp: (prop) => prop !== 'placement',
})<{ placement: 'top' | 'center' }>(({ theme, placement }) => ({
  // On mobile the top nav stays visible above the dialog and its backdrop.
  '& .MuiBackdrop-root': { top: `var(--top-nav-height, ${layout.topNavHeight}px)` },
  '& .MuiDialog-container': {
    alignItems: placement === 'top' ? 'flex-start' : 'center',
    paddingTop: `var(--top-nav-height, ${layout.topNavHeight}px)`,
  },
  [theme.breakpoints.up('md')]: {
    '& .MuiBackdrop-root': { top: 0 },
    '& .MuiDialog-container': { paddingTop: 0 },
    ...(placement === 'center' && { '& .MuiDialog-paper': { margin: 0 } }),
  },
}));

export function Dialog({ placement = 'top', onClose, ...props }: DialogProps) {
  return <StyledDialog placement={placement} onClose={() => onClose?.()} {...props} />;
}

export interface DialogHeaderProps {
  children: ReactNode;
  onClose?: () => void;
  className?: string;
}

/** Title row with bottom border and optional close button. */
export function DialogHeader({ children, onClose, className }: DialogHeaderProps) {
  return (
    <div className={cn('flex items-center gap-2 border-b p-2', className)} style={{ borderColor: colors.border }}>
      <DialogTitle component="div" className="flex-1">
        {children}
      </DialogTitle>
      {onClose && <CloseButton onClick={onClose} />}
    </div>
  );
}

export const DialogBody = DialogContent;
export const DialogFooter = DialogActions;
