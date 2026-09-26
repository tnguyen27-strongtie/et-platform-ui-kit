import InputAdornment from '@mui/material/InputAdornment';
import OutlinedInput, { type OutlinedInputProps } from '@mui/material/OutlinedInput';
import { forwardRef, type ReactNode } from 'react';

export interface TextInputProps extends Omit<OutlinedInputProps, 'startAdornment' | 'endAdornment'> {
  /** Text or node shown inside the field before the value (FD addonBefore). */
  addonBefore?: ReactNode;
  /** Unit or action after the value (FD addonAfter), e.g. "in", "mm", "lbs". */
  addonAfter?: ReactNode;
}

/** FD InputGroup: 40px field, muted ring, orange focus ring, red ring on error. */
export const TextInput = forwardRef<HTMLDivElement, TextInputProps>(function TextInput(
  { addonBefore, addonAfter, fullWidth = true, ...props },
  ref,
) {
  return (
    <OutlinedInput
      ref={ref}
      fullWidth={fullWidth}
      startAdornment={addonBefore ? <InputAdornment position="start">{addonBefore}</InputAdornment> : undefined}
      endAdornment={addonAfter ? <InputAdornment position="end">{addonAfter}</InputAdornment> : undefined}
      {...props}
    />
  );
});
