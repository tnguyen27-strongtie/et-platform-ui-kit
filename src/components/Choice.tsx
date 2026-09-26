import MuiCheckbox, { type CheckboxProps as MuiCheckboxProps } from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormHelperText from '@mui/material/FormHelperText';
import MuiRadio from '@mui/material/Radio';
import MuiRadioGroup from '@mui/material/RadioGroup';
import MuiSwitch, { type SwitchProps as MuiSwitchProps } from '@mui/material/Switch';
import type { ReactNode } from 'react';

// ---------- Checkbox ----------
export interface CheckboxProps extends Omit<MuiCheckboxProps, 'onChange'> {
  label?: ReactNode;
  onChange?: (checked: boolean) => void;
}

export function Checkbox({ label, onChange, ...props }: CheckboxProps) {
  const control = <MuiCheckbox onChange={(_, checked) => onChange?.(checked)} {...props} />;
  if (!label) return control;
  return <FormControlLabel control={control} label={label} disabled={props.disabled} />;
}

// ---------- Radio ----------
export interface RadioOption<V extends string | number | boolean> {
  value: V;
  label: ReactNode;
  disabled?: boolean;
}

export interface RadioGroupProps<V extends string | number | boolean> {
  name: string;
  value: V | null;
  options: RadioOption<V>[];
  onChange: (value: V) => void;
  direction?: 'row' | 'column';
  error?: ReactNode;
  'aria-labelledby'?: string;
}

/** FD RadioGroup. Keeps the original value type (number/boolean) instead of MUI's string. */
export function RadioGroup<V extends string | number | boolean>({
  name,
  value,
  options,
  onChange,
  direction = 'row',
  error,
  ...aria
}: RadioGroupProps<V>) {
  const index = options.findIndex((o) => o.value === value);
  return (
    <>
      <MuiRadioGroup
        name={name}
        row={direction === 'row'}
        value={index >= 0 ? String(index) : ''}
        onChange={(e) => {
          const picked = options[Number(e.target.value)];
          if (picked) onChange(picked.value);
        }}
        sx={{ gap: direction === 'row' ? 4 : 2 }}
        {...aria}
      >
        {options.map((o, i) => (
          <FormControlLabel key={String(o.value)} value={String(i)} control={<MuiRadio />} label={o.label} disabled={o.disabled} />
        ))}
      </MuiRadioGroup>
      {error && <FormHelperText error>{error}</FormHelperText>}
    </>
  );
}

// ---------- Switch ----------
export interface SwitchProps extends Omit<MuiSwitchProps, 'onChange'> {
  label?: ReactNode;
  onChange?: (checked: boolean) => void;
}

export function Switch({ label, onChange, ...props }: SwitchProps) {
  const control = <MuiSwitch onChange={(_, checked) => onChange?.(checked)} {...props} />;
  if (!label) return control;
  return <FormControlLabel control={control} label={label} disabled={props.disabled} />;
}
