import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { styled } from '@mui/material/styles';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import type { ReactNode } from 'react';

import { colors, radius, shadows } from '../tokens/tokens';

const Group = styled(ToggleButtonGroup)({
  width: '100%',
  gap: '1rem',
  flexWrap: 'wrap',
  justifyContent: 'space-around',
});

const Card = styled(ToggleButton, { shouldForwardProp: (p) => p !== 'showCheck' })<{ showCheck: boolean }>(
  ({ showCheck }) => ({
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.25rem',
    padding: '0.5rem',
    margin: 0,
    border: '1px solid transparent',
    borderRadius: `${radius.lg} !important`,
    color: 'inherit',
    textTransform: 'none',
    boxShadow: 'none',
    '&:hover': { backgroundColor: colors.brandSubtle, boxShadow: shadows.raised },
    '&.Mui-selected, &.Mui-selected:hover': {
      backgroundColor: colors.brandSelected,
      border: `1px solid ${showCheck ? colors.focusRing : colors.accent}`,
    },
    '&.Mui-disabled': {
      opacity: 0.4,
      cursor: 'not-allowed',
      pointerEvents: 'auto',
      '&:hover': { backgroundColor: 'transparent', boxShadow: 'none' },
    },
    '& .option-card-check': {
      position: 'absolute',
      top: '0.25rem',
      right: '0.25rem',
      color: colors.accent,
      fontSize: '1.25rem',
    },
  }),
);

export interface OptionCard<V extends string | number> {
  value: V;
  label: ReactNode;
  /** Product image or illustration shown above the label. */
  image?: ReactNode;
  disabled?: boolean;
}

export interface OptionCardGroupProps<V extends string | number> {
  value: V | null;
  options: OptionCard<V>[];
  onChange: (value: V) => void;
  showCheck?: boolean;
  'aria-label'?: string;
}

/** Picture cards, one selectable, brand-colored check on the selected card. */
export function OptionCardGroup<V extends string | number>({
  value,
  options,
  onChange,
  showCheck = true,
  ...aria
}: OptionCardGroupProps<V>) {
  return (
    <Group exclusive value={value} onChange={(_, v: V | null) => v !== null && onChange(v)} {...aria}>
      {options.map((o) => (
        <Card key={String(o.value)} value={o.value} disabled={o.disabled} showCheck={showCheck}>
          {o.image}
          <span className="text-sm">{o.label}</span>
          {showCheck && value === o.value && <CheckCircleIcon className="option-card-check" />}
        </Card>
      ))}
    </Group>
  );
}
