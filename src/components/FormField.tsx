import FormHelperText from '@mui/material/FormHelperText';
import FormLabel from '@mui/material/FormLabel';
import type { ReactNode } from 'react';

import { cn } from '../utils/cn';
import { HelpPopover } from './HelpPopover';

export interface FormFieldProps {
  label: ReactNode;
  htmlFor: string;
  children: ReactNode;
  /** FD "warning": red label with trailing asterisk. */
  required?: boolean;
  /** Content of the "?" bubble next to the label. */
  help?: ReactNode;
  error?: ReactNode;
  className?: string;
}

/** Label + control + error, stacked with FD spacing (gap 0.5rem). */
export function FormField({ label, htmlFor, children, required, help, error, className }: FormFieldProps) {
  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <FormLabel htmlFor={htmlFor} required={required} error={required}>
        {label}
        {help && <HelpPopover content={help} />}
      </FormLabel>
      {children}
      {error && (
        <FormHelperText error id={`${htmlFor}-error`}>
          {error}
        </FormHelperText>
      )}
    </div>
  );
}
