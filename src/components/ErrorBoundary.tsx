import { Component, type ErrorInfo, type ReactNode } from 'react';

import { Alert } from './Alert';
import { Button } from './Button';

export interface ErrorBoundaryProps {
  children: ReactNode;
  /** Custom fallback; receives the error and a reset function. */
  fallback?: (error: Error, reset: () => void) => ReactNode;
  /** Report the error (Sentry, console...). */
  onError?: (error: Error, info: ErrorInfo) => void;
  /** When any of these values change, the boundary resets (e.g. the inputs that caused the crash). */
  resetKeys?: unknown[];
}

interface State {
  error: Error | null;
}

/**
 * Stops a render error in one pane (e.g. a result table fed unexpected data) from blanking
 * the whole app. Wrap each workspace section in one.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, State> {
  state: State = { error: null };

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
  }

  reset = () => this.setState({ error: null });

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;
    if (this.props.fallback) return this.props.fallback(error, this.reset);
    return (
      <div className="flex flex-col items-start gap-2 p-4">
        <Alert severity="error" title="Something went wrong">
          This part of the page could not be displayed. Your inputs are kept.
        </Alert>
        <Button onClick={this.reset}>Try again</Button>
      </div>
    );
  }
}
