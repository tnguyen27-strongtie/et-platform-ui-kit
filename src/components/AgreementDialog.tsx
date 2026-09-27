import { type ReactNode, useId, useState } from 'react';

import { readStorage, writeStorage } from '../utils/storage';
import { Button } from './Button';
import { Dialog, DialogBody, DialogFooter, DialogHeader } from './Dialog';

export interface AgreementDialogLabels {
  /** Button that accepts, e.g. "I agree". */
  accept: string;
  /** Button that declines, e.g. "I disagree". */
  decline: string;
}

export interface AgreementDialogProps {
  open: boolean;
  /** Dialog heading, e.g. "End user license agreement". */
  title: ReactNode;
  /**
   * The agreement text: headings (h3), paragraphs, lists. Scrolls inside the dialog and is read
   * out as the dialog's description.
   */
  children: ReactNode;
  /** Muted line above the text, e.g. "This agreement is available in English only." In the UI language. */
  note?: ReactNode;
  /** BCP 47 language of the agreement text when it differs from the page, e.g. 'en' in a translated app. */
  lang?: string;
  onAccept: () => void;
  /** The user declined; the app decides what happens (sign out, leave the page…). */
  onDecline: () => void;
  labels: AgreementDialogLabels;
}

/**
 * Terms the user must accept before using the app. Escape and clicks outside do nothing; only
 * the two buttons close it. Focus is not restored on close because it usually opens on page load.
 */
export function AgreementDialog({ open, title, children, note, lang, onAccept, onDecline, labels }: AgreementDialogProps) {
  const id = useId();
  const titleId = `${id}-title`;
  const textId = `${id}-text`;
  return (
    <Dialog
      open={open}
      dismissible="none"
      disableRestoreFocus
      maxWidth="md"
      fullWidth
      aria-labelledby={titleId}
      aria-describedby={textId}
    >
      <DialogHeader>
        <span id={titleId}>{title}</span>
      </DialogHeader>
      <DialogBody className="flex flex-col gap-2">
        {note && <p className="m-0 text-xs text-text-muted">{note}</p>}
        {/* Focusable so keyboard users can scroll it with the arrow keys. */}
        <div
          lang={lang}
          role="region"
          aria-labelledby={titleId}
          tabIndex={0}
          className="max-h-[60vh] overflow-y-auto rounded-sm border border-border p-3 text-sm"
        >
          {/* Its own element: a description taken from the region would be the region's name. */}
          <div
            id={textId}
            className="[&_h3]:mt-3 [&_h3]:mb-1 [&_h3]:text-sm [&_h3]:font-bold [&_h3:first-child]:mt-0 [&_li]:mb-1 [&_ol]:my-1 [&_ol]:pl-6 [&_p]:my-1 [&_ul]:my-1 [&_ul]:pl-6 [&>:first-child]:mt-0"
          >
            {children}
          </div>
        </div>
      </DialogBody>
      <DialogFooter>
        <Button onClick={onDecline}>{labels.decline}</Button>
        <Button variant="primary" onClick={onAccept}>
          {labels.accept}
        </Button>
      </DialogFooter>
    </Dialog>
  );
}

export interface UseAgreementAcceptedOptions {
  /** localStorage key; make it unique per app. */
  storageKey: string;
  /** Version of the agreement text. Changing it asks every user to accept again. */
  version: string;
}

/**
 * Remembers which agreement version the user accepted (in localStorage).
 * - `accepted`: false until the user accepts this version; open the AgreementDialog while false
 * - `accept()`: call from onAccept
 */
export function useAgreementAccepted({ storageKey, version }: UseAgreementAcceptedOptions) {
  const [stored, setStored] = useState(() => readStorage(storageKey));
  return {
    accepted: stored === version,
    accept: () => {
      writeStorage(storageKey, version);
      setStored(version);
    },
  };
}
