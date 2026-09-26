import { type ReactNode, useId, useRef } from 'react';

import { Button } from './Button';
import { Dialog, DialogBody, DialogFooter, DialogHeader } from './Dialog';

export interface ConfirmDialogProps {
  open: boolean;
  title: ReactNode;
  /** Explain what will happen, e.g. "All inputs will be reset to their defaults." */
  children?: ReactNode;
  confirmLabel?: ReactNode;
  cancelLabel?: ReactNode;
  /** Irreversible action (delete, reset): red confirm button and Cancel focused first. */
  destructive?: boolean;
  /** Spinner on the confirm button; the dialog cannot be closed until it clears. */
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Asks before an action that loses data. Safe defaults: Escape and Cancel dismiss,
 * a click outside does nothing, and for destructive actions Enter hits Cancel, not Confirm.
 */
export function ConfirmDialog({
  open,
  title,
  children,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  destructive = false,
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const bodyId = useId();
  const cancelRef = useRef<HTMLButtonElement>(null);
  const confirmRef = useRef<HTMLButtonElement>(null);
  return (
    <Dialog
      open={open}
      onClose={onCancel}
      dismissible={loading ? 'none' : 'escape'}
      placement="center"
      role={destructive ? 'alertdialog' : 'dialog'}
      aria-describedby={children ? bodyId : undefined}
      // The focus trap focuses the dialog itself on open (autoFocus is ignored), so move focus
      // to the safe button once the dialog is in place.
      slotProps={{ transition: { onEntering: () => (destructive ? cancelRef : confirmRef).current?.focus() } }}
    >
      <DialogHeader onClose={loading ? undefined : onCancel}>{title}</DialogHeader>
      {children && <DialogBody id={bodyId}>{children}</DialogBody>}
      <DialogFooter>
        <Button ref={cancelRef} onClick={onCancel} disabled={loading}>
          {cancelLabel}
        </Button>
        <Button ref={confirmRef} variant={destructive ? 'danger' : 'primary'} onClick={onConfirm} loading={loading}>
          {confirmLabel}
        </Button>
      </DialogFooter>
    </Dialog>
  );
}
