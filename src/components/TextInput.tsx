import InputAdornment from '@mui/material/InputAdornment';
import OutlinedInput, { type OutlinedInputProps } from '@mui/material/OutlinedInput';
import { forwardRef, type ReactNode } from 'react';

import { useFormField } from './FormField';

export interface TextInputProps extends Omit<OutlinedInputProps, 'startAdornment' | 'endAdornment'> {
  /** Text or node shown inside the field before the value (e.g. "$", an icon). */
  addonBefore?: ReactNode;
  /** Unit or action after the value, e.g. "in", "mm", "lbs". */
  addonAfter?: ReactNode;
}

/**
 * Text field: 40px high, muted ring, orange focus ring, red ring on error.
 * Multi-line text: pass `multiline` and `minRows`. For numbers use NumberInput.
 * Inside a FormField, id, aria-describedby, aria-invalid and required are wired automatically.
 */
export const TextInput = forwardRef<HTMLDivElement, TextInputProps>(function TextInput(
  { addonBefore, addonAfter, fullWidth = true, id, error, inputProps, ...props },
  ref,
) {
  const field = useFormField();
  return (
    <OutlinedInput
      ref={ref}
      id={id ?? field?.id}
      error={error ?? field?.invalid}
      fullWidth={fullWidth}
      startAdornment={addonBefore ? <InputAdornment position="start">{addonBefore}</InputAdornment> : undefined}
      endAdornment={addonAfter ? <InputAdornment position="end">{addonAfter}</InputAdornment> : undefined}
      inputProps={{ 'aria-describedby': field?.describedBy, ...inputProps }}
      {...props}
    />
  );
});
