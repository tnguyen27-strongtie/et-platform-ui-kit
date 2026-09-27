import { Component, createRef, type ErrorInfo, type ReactNode } from 'react';

import { ErrorAlert } from './ErrorAlert';

export interface ErrorBoundaryLabels {
  /** Heading of the default fallback. */
  title: string;
  /** Explanation under the heading. */
  message: string;
  /** Text of the retry button. */
  retry: string;
}

export const defaultErrorBoundaryLabels: ErrorBoundaryLabels = {
  title: 'Something went wrong',
  message: 'This part of the page could not be displayed. Your inputs are kept.',
  retry: 'Try again',
};

export interface ErrorBoundaryProps {
  children: ReactNode;
  /** Custom fallback; receives the error and a reset function. Takes precedence over the default one. */
  fallback?: (error: Error, reset: () => void) => ReactNode;
  /** Texts of the default fallback (any subset), e.g. translated ones. */
  labels?: Partial<ErrorBoundaryLabels>;
  /** Report the error (Sentry, console...). */
  onError?: (error: Error, info: ErrorInfo) => void;
  /** When any of these values change, the boundary resets (e.g. the inputs that caused the crash). */
  resetKeys?: unknown[];
}

interface State {
  error: Error | null;
}

const focusable = 'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Stops a render error in one pane (e.g. a result table fed unexpected data) from blanking
 * the whole app. Wrap each workspace section in one.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, State> {
  state: State = { error: null };

  private fallbackRef = createRef<HTMLDivElement>();
  /** Where the content will reappear after "Try again", so focus can follow it. */
  private focusAnchor: { parent: Node; prev: Node | null } | null = null;

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    this.props.onError?.(error, info);
  }

  componentDidUpdate(prev: ErrorBoundaryProps) {
    const { resetKeys = [] } = this.props;
    const prevKeys = prev.resetKeys ?? [];
    if (this.state.error && (resetKeys.length !== prevKeys.length || resetKeys.some((k, i) => !Object.is(k, prevKeys[i])))) {
      this.reset();
    }
    this.restoreFocus();
  }

  reset = () => this.setState({ error: null });

  /** The default retry button: resets and keeps keyboard focus in this part of the page. */
  private retry = () => {
    const el = this.fallbackRef.current;
    if (el?.parentNode) this.focusAnchor = { parent: el.parentNode, prev: el.previousSibling };
    this.reset();
  };

  // The retry button is removed from the DOM by the reset, which would drop focus to <body>.
  private restoreFocus() {
    const anchor = this.focusAnchor;
    if (!anchor) return;
    this.focusAnchor = null;
    if (this.state.error) {
      // Failed again: back to the new fallback's retry button.
      this.fallbackRef.current?.querySelector<HTMLElement>('button')?.focus();
      return;
    }
    const first = anchor.prev ? anchor.prev.nextSibling : anchor.parent.firstChild;
    if (!(first instanceof HTMLElement)) return;
    const target = first.matches(focusable) ? first : first.querySelector<HTMLElement>(focusable);
    if (target) {
      target.focus();
    } else {
      // Nothing focusable inside: focus the content itself, then make it unfocusable again.
      first.tabIndex = -1;
      first.addEventListener('blur', () => first.removeAttribute('tabindex'), { once: true });
      first.focus();
    }
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;
    if (this.props.fallback) return this.props.fallback(error, this.reset);
    const labels = { ...defaultErrorBoundaryLabels, ...this.props.labels };
    return (
      <div ref={this.fallbackRef} className="p-4">
        <ErrorAlert title={labels.title} onRetry={this.retry} retryLabel={labels.retry}>
          {labels.message}
        </ErrorAlert>
      </div>
    );
  }
}
