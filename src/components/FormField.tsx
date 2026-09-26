import FormControl from '@mui/material/FormControl';
import FormHelperText from '@mui/material/FormHelperText';
import FormLabel from '@mui/material/FormLabel';
import { createContext, type ReactNode, useContext } from 'react';

import { cn } from '../utils/cn';
import { HelpPopover } from './HelpPopover';

export interface FormFieldContextValue {
  /** id of the control (the label's htmlFor). */
  id: string;
  labelId: string;
  /** Space-separated ids of the description and error, for aria-describedby. */
  describedBy: string | undefined;
  invalid: boolean;
  required: boolean;
  disabled: boolean;
}

const FormFieldContext = createContext<FormFieldContextValue | null>(null);

/**
 * Accessibility wiring from the surrounding FormField (null outside one).
 * Kit controls call this so the label, description and error reach assistive tech.
 */
export function useFormField() {
  return useContext(FormFieldContext);
}

export interface FormFieldProps {
  label: ReactNode;
  /** id given to the control; the label points to it. */
  htmlFor: string;
  children: ReactNode;
  /** Marks the field required: red label with asterisk (FD "warning") and `required` on the control. */
  required?: boolean;
  /** Content of the "?" bubble next to the label. */
  help?: ReactNode;
  /** Short hint shown under the control (e.g. allowed range). */
  description?: ReactNode;
  /** Error message. Also marks the control invalid (red ring, aria-invalid). */
  error?: ReactNode;
  disabled?: boolean;
  className?: string;
}

/**
 * Label + control + description + error, stacked with FD spacing (gap 0.5rem).
 * Kit controls inside it (TextInput, NumberInput, Select, Combobox, RadioGroup) pick up
 * aria-describedby, aria-invalid, required and disabled automatically.
 */
export function FormField({ label, htmlFor, children, required = false, help, description, error, disabled = false, className }: FormFieldProps) {
  const invalid = error != null && error !== false && error !== '';
  const labelId = `${htmlFor}-label`;
  const descriptionId = description ? `${htmlFor}-description` : undefined;
  const errorId = invalid ? `${htmlFor}-error` : undefined;
  const describedBy = [descriptionId, errorId].filter(Boolean).join(' ') || undefined;

  return (
    <FormFieldContext.Provider value={{ id: htmlFor, labelId, describedBy, invalid, required, disabled }}>
      {/* MUI FormControl passes error/required/disabled to MUI inputs inside (aria-invalid, required attr). */}
      <FormControl
        error={invalid}
        required={required}
        disabled={disabled}
        fullWidth
        className={cn('flex flex-col gap-2', className)}
      >
        <FormLabel id={labelId} htmlFor={htmlFor} error={required || invalid}>
          {label}
          {help && <HelpPopover content={help} />}
        </FormLabel>
        {children}
        {description && (
          <FormHelperText id={descriptionId} error={false} sx={{ color: 'text.secondary' }}>
            {description}
          </FormHelperText>
        )}
        {invalid && (
          <FormHelperText id={errorId} role="alert">
            {error}
          </FormHelperText>
        )}
      </FormControl>
    </FormFieldContext.Provider>
  );
}
