import { type ReactNode } from 'react';

import { Alert } from './Alert';
import { Button } from './Button';

interface ErrorAlertBaseProps {
  /** Short heading, e.g. "Could not calculate". */
  title: ReactNode;
  /** What went wrong, in words the user understands. Mapping error codes to messages stays in the app. */
  children: ReactNode;
  /**
   * Support reference, e.g. "Reference: 00-4bf92f…" built from a server trace id. Shown in a
   * small monospace line that can be selected and copied.
   */
  reference?: ReactNode;
  className?: string;
}

interface ErrorAlertWithRetry extends ErrorAlertBaseProps {
  /** Shows a retry button that calls this. */
  onRetry: () => void;
  /** Text of the retry button, e.g. "Try again". Required with onRetry. */
  retryLabel: ReactNode;
}

interface ErrorAlertWithoutRetry extends ErrorAlertBaseProps {
  onRetry?: undefined;
  retryLabel?: undefined;
}

export type ErrorAlertProps = ErrorAlertWithRetry | ErrorAlertWithoutRetry;

/** Error message for a failed request or a crashed pane: message, optional support reference, optional retry. */
export function ErrorAlert({ title, children, reference, onRetry, retryLabel, className }: ErrorAlertProps) {
  return (
    <Alert
      severity="error"
      title={title}
      className={className}
      actions={
        onRetry && (
          <Button size="small" onClick={onRetry}>
            {retryLabel}
          </Button>
        )
      }
    >
      <div>{children}</div>
      {reference && <div className="mt-1 font-mono text-text-muted select-text">{reference}</div>}
    </Alert>
  );
}
