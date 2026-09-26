import CircularProgress from '@mui/material/CircularProgress';

export interface SpinnerProps {
  /** Diameter in px. Default 20. */
  size?: number;
  /** Announced to screen readers. */
  label?: string;
  className?: string;
}

/** Small inline busy indicator (inherits the text color). For a whole pane use LoadingIndicator. */
export function Spinner({ size = 20, label = 'Loading', className }: SpinnerProps) {
  return <CircularProgress size={size} thickness={5} aria-label={label} className={className} />;
}
