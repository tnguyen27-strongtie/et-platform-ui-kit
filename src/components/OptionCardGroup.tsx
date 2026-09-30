import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { styled } from '@mui/material/styles';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import { type ReactNode, useId } from 'react';

import { colors, elevation, shape } from '../tokens/tokens';
import { Tooltip } from './Tooltip';

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
    borderRadius: `${shape.option} !important`,
    color: 'inherit',
    textTransform: 'none',
    boxShadow: 'none',
    '&:hover': { backgroundColor: colors.brandSubtle, boxShadow: elevation.raised },
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
  /**
   * Longer explanation in plain text. Shown as a tooltip on hover and keyboard focus, and always
   * announced as the card's accessible description (also while the tooltip is closed).
   */
  description?: string;
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
  const baseId = useId();
  const descId = (i: number) => `${baseId}-desc-${i}`;
  return (
    <>
      <Group exclusive value={value} onChange={(_, v: V | null) => v !== null && onChange(v)} {...aria}>
        {options.map((o, i) => {
          const card = (
            <Card
              key={String(o.value)}
              value={o.value}
              disabled={o.disabled}
              showCheck={showCheck}
              aria-describedby={o.description ? descId(i) : undefined}
              // The tooltip would otherwise add a native title while closed (a second, unstyled tooltip).
              title={undefined}
            >
              {o.image}
              <span className="text-sm">{o.label}</span>
              {showCheck && value === o.value && <CheckCircleIcon className="option-card-check" />}
            </Card>
          );
          return o.description ? (
            <Tooltip key={String(o.value)} title={o.description}>
              {card}
            </Tooltip>
          ) : (
            card
          );
        })}
      </Group>
      {/* Outside the buttons: text inside a button would become part of its name. */}
      {options.map((o, i) =>
        o.description ? (
          <span key={String(o.value)} id={descId(i)} className="sr-only">
            {o.description}
          </span>
        ) : null,
      )}
    </>
  );
}
