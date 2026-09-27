import MuiCheckbox, { type CheckboxProps as MuiCheckboxProps } from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormHelperText from '@mui/material/FormHelperText';
import MuiRadio from '@mui/material/Radio';
import MuiRadioGroup from '@mui/material/RadioGroup';
import MuiSwitch, { type SwitchProps as MuiSwitchProps } from '@mui/material/Switch';
import { type ReactElement, type ReactNode, useId } from 'react';

import { useFormField } from './FormField';
import { InfoTip } from './InfoTip';

interface HelpProps {
  /** Content of a "?" bubble after the label (same as FormField's help). Needs `label`. */
  help?: ReactNode;
  /** Accessible name of the "?" button, e.g. "About metric units". Default "More information". */
  helpLabel?: string;
}

/** Label + control, plus the "?" bubble next to (not inside) the label so it is not part of the control's name. */
function Labelled({ control, label, disabled, help, helpLabel }: HelpProps & { control: ReactElement; label: ReactNode; disabled?: boolean }) {
  const labelled = <FormControlLabel control={control} label={label} disabled={disabled} sx={help ? { mr: 0 } : undefined} />;
  if (!help) return labelled;
  return (
    <span className="inline-flex items-center">
      {labelled}
      <InfoTip label={helpLabel}>{help}</InfoTip>
    </span>
  );
}

// ---------- Checkbox ----------
export interface CheckboxProps extends Omit<MuiCheckboxProps, 'onChange'>, HelpProps {
  label?: ReactNode;
  onChange?: (checked: boolean) => void;
}

/**
 * Checkbox with a boolean onChange. `indeterminate` sets the native input's indeterminate
 * state (announced as "mixed") instead of MUI's aria-checked="mixed", which conflicts with a
 * native checkbox that is not itself indeterminate.
 */
export function Checkbox({ label, onChange, indeterminate = false, slotProps, help, helpLabel, ...props }: CheckboxProps) {
  const inputSlot = (slotProps?.input ?? {}) as Record<string, unknown> & { ref?: unknown };
  const syncIndeterminate = (el: HTMLInputElement | null) => {
    if (el) el.indeterminate = indeterminate;
    const ref = inputSlot.ref;
    if (typeof ref === 'function') ref(el);
    else if (ref && typeof ref === 'object') (ref as { current: HTMLInputElement | null }).current = el;
  };
  const control = (
    <MuiCheckbox
      indeterminate={indeterminate}
      onChange={(_, checked) => onChange?.(checked)}
      slotProps={{ ...slotProps, input: { ...inputSlot, ref: syncIndeterminate, 'aria-checked': undefined } as never }}
      {...props}
    />
  );
  if (!label) return control;
  return <Labelled control={control} label={label} disabled={props.disabled} help={help} helpLabel={helpLabel} />;
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
  /** Error shown under the group. Inside a FormField, pass the error to the FormField instead. */
  error?: ReactNode;
  disabled?: boolean;
  /** Accessible name. Inside a FormField the field label is used automatically. */
  'aria-labelledby'?: string;
  'aria-label'?: string;
}

/**
 * Radio group. Keeps the original value type (number/boolean) instead of MUI's string.
 * Keyboard: Tab enters the group, arrow keys move and select (native radio behaviour).
 */
export function RadioGroup<V extends string | number | boolean>({
  name,
  value,
  options,
  onChange,
  direction = 'row',
  error,
  disabled,
  'aria-labelledby': labelledBy,
  'aria-label': ariaLabel,
}: RadioGroupProps<V>) {
  const field = useFormField();
  const errorId = useId();
  const index = options.findIndex((o) => o.value === value);
  const describedBy = [field?.describedBy, error ? errorId : undefined].filter(Boolean).join(' ') || undefined;
  const groupDisabled = disabled ?? field?.disabled;
  return (
    <>
      <MuiRadioGroup
        id={field?.id}
        aria-labelledby={labelledBy ?? field?.labelId}
        aria-label={ariaLabel}
        aria-describedby={describedBy}
        aria-invalid={error || field?.invalid ? true : undefined}
        aria-required={field?.required || undefined}
        name={name}
        row={direction === 'row'}
        value={index >= 0 ? String(index) : ''}
        onChange={(e) => {
          const picked = options[Number(e.target.value)];
          if (picked) onChange(picked.value);
        }}
        sx={{ gap: direction === 'row' ? 4 : 2 }}
      >
        {options.map((o, i) => (
          <FormControlLabel
            key={String(o.value)}
            value={String(i)}
            control={<MuiRadio />}
            label={o.label}
            disabled={groupDisabled || o.disabled}
          />
        ))}
      </MuiRadioGroup>
      {error && (
        <FormHelperText id={errorId} error>
          {error}
        </FormHelperText>
      )}
    </>
  );
}

// ---------- Switch ----------
export interface SwitchProps extends Omit<MuiSwitchProps, 'onChange'>, HelpProps {
  label?: ReactNode;
  onChange?: (checked: boolean) => void;
}

export function Switch({ label, onChange, help, helpLabel, ...props }: SwitchProps) {
  const control = <MuiSwitch onChange={(_, checked) => onChange?.(checked)} {...props} />;
  if (!label) return control;
  return <Labelled control={control} label={label} disabled={props.disabled} help={help} helpLabel={helpLabel} />;
}
