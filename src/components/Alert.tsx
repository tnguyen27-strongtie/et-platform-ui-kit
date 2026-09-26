import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import InfoIcon from '@mui/icons-material/Info';
import WarningIcon from '@mui/icons-material/Warning';
import { styled } from '@mui/material/styles';
import type { ReactNode } from 'react';

import { colors, radius, typography } from '../tokens/tokens';

export type AlertSeverity = 'info' | 'success' | 'warning' | 'error';

// color-mix, not alpha(): colors are CSS variables so they follow the app's color config.
const tint = (c: string) => `color-mix(in srgb, ${c} 15%, transparent)`;

const tone: Record<AlertSeverity, { fg: string; bg: string }> = {
  info: { fg: colors.text, bg: 'transparent' },
  success: { fg: colors.success, bg: tint(colors.success) },
  warning: { fg: colors.warningText, bg: tint(colors.warning) },
  error: { fg: colors.danger, bg: tint(colors.danger) },
};

const icons: Record<AlertSeverity, ReactNode> = {
  info: <InfoIcon />,
  success: <CheckCircleIcon />,
  warning: <WarningIcon />,
  error: <ErrorIcon />,
};

const Root = styled('div', { shouldForwardProp: (p) => p !== 'severity' })<{ severity: AlertSeverity }>(
  ({ severity }) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    padding: '1rem',
    borderRadius: radius.xl,
    color: tone[severity].fg,
    backgroundColor: tone[severity].bg,
    '& > .MuiSvgIcon-root': { fontSize: '1.875rem', flexShrink: 0 },
  }),
);

export interface AlertProps {
  severity?: AlertSeverity;
  title?: ReactNode;
  children: ReactNode;
  icon?: ReactNode;
  className?: string;
}

/** FD result/validation banner: tinted background, large icon, bold title, small description. */
export function Alert({ severity = 'info', title, children, icon, className }: AlertProps) {
  return (
    <Root role={severity === 'error' ? 'alert' : 'status'} severity={severity} className={className}>
      {icon ?? icons[severity]}
      <div className="flex flex-col gap-2">
        {title && <div style={{ fontWeight: typography.weight.bold, fontSize: typography.size.lg }}>{title}</div>}
        <div style={{ fontWeight: typography.weight.medium, fontSize: typography.size.xs }}>{children}</div>
      </div>
    </Root>
  );
}
