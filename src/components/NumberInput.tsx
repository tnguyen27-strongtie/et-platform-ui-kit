import { forwardRef, type KeyboardEvent, useEffect, useState } from 'react';

import {
  clamp,
  formatNumber,
  isInRange,
  isPartialNumber,
  type NumberRules,
  parseNumber,
  roundTo,
  stepNumber,
} from '../utils/number';
import { useFormField } from './FormField';
import { TextInput, type TextInputProps } from './TextInput';

export interface NumberInputProps
  extends Omit<TextInputProps, 'value' | 'defaultValue' | 'onChange' | 'type' | 'multiline' | 'rows' | 'minRows' | 'maxRows'> {
  /** null = empty field. Never NaN. */
  value: number | null;
  /** Called with every complete number typed (not for "-" or "1e"), or null when cleared. */
  onChange: (value: number | null) => void;
  min?: number;
  max?: number;
  /** Arrow Up/Down step (Shift = 10x). Default 1. */
  step?: number;
  /** Maximum decimal places; extra digits cannot be typed and the value is rounded on blur. 0 = integer. */
  precision?: number;
  /**
   * What happens to an out-of-range value when the field loses focus:
   * - 'none' (default): keep it, mark the field invalid and let the app show a message.
   *   Silently changing an engineering input can hide a user mistake.
   * - 'blur': clamp it to [min, max].
   */
  clampBehavior?: 'none' | 'blur';
}

/**
 * Numeric field for calculator inputs.
 *
 * Behaviour (why not <input type="number">: it accepts "e", changes on mouse wheel, returns ""
 * for partial input and ignores the user's decimal separator):
 * - Only digits, one "." or "," and a leading "-" (if min < 0) can be typed or pasted.
 * - Emits number | null, never NaN or a string; "-" or "." alone are not emitted.
 * - Arrow Up/Down step by `step` (Shift x10), clamped to min/max, without float drift.
 * - On blur/Enter the text is normalized; incomplete text reverts to the last value.
 * - Out-of-range values are shown invalid (aria-invalid) unless clampBehavior="blur".
 * - Exposed as an ARIA spinbutton with aria-valuemin/max/now.
 */
export const NumberInput = forwardRef<HTMLDivElement, NumberInputProps>(function NumberInput(
  { value, onChange, min, max, step = 1, precision, clampBehavior = 'none', error, inputProps, onBlur, onKeyDown, disabled, readOnly, ...props },
  ref,
) {
  const field = useFormField();
  const rules: NumberRules = { min, max, precision };
  const [draft, setDraft] = useState(() => formatNumber(value, precision));

  // Follow external changes (reset, loaded file) unless the draft already shows that value.
  useEffect(() => {
    setDraft((current) => (parseNumber(current) === value ? current : formatNumber(value, precision)));
  }, [value, precision]);

  const emit = (next: number | null) => {
    if (next !== value) onChange(next);
  };

  const commit = () => {
    const parsed = parseNumber(draft);
    let next = parsed === undefined ? value : parsed;
    if (next !== null && clampBehavior === 'blur') next = clamp(next, min, max);
    if (next !== null && precision !== undefined) next = roundTo(next, precision);
    emit(next);
    setDraft(formatNumber(next, precision));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    onKeyDown?.(e);
    if (e.defaultPrevented || disabled || readOnly) return;
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault();
      const current = parseNumber(draft);
      const delta = (e.key === 'ArrowUp' ? 1 : -1) * step * (e.shiftKey ? 10 : 1);
      const next = stepNumber(current === undefined ? value : current, delta, rules);
      setDraft(formatNumber(next, precision));
      emit(next);
    } else if (e.key === 'Enter') {
      commit();
    }
  };

  const outOfRange = value !== null && !isInRange(value, rules);
  const allowNegative = min === undefined || min < 0;
  // An explicit `error` prop wins over the field's state and the range check.
  const invalid = error ?? (field?.invalid || outOfRange);

  return (
    <TextInput
      ref={ref}
      {...props}
      disabled={disabled}
      readOnly={readOnly}
      error={invalid}
      value={draft}
      onChange={(e) => {
        const text = e.target.value.trim();
        if (!isPartialNumber(text, rules)) return;
        setDraft(text);
        const parsed = parseNumber(text);
        if (parsed !== undefined) emit(parsed);
      }}
      onKeyDown={handleKeyDown}
      onBlur={(e) => {
        commit();
        onBlur?.(e);
      }}
      inputProps={{
        role: 'spinbutton',
        // iOS decimal keypads have no minus key, so fall back to the text keyboard when negatives are allowed.
        inputMode: allowNegative ? 'text' : precision === 0 ? 'numeric' : 'decimal',
        autoComplete: 'off',
        spellCheck: false,
        'aria-valuenow': value ?? undefined,
        'aria-valuemin': min,
        'aria-valuemax': max,
        'aria-invalid': invalid ? true : undefined,
        'aria-describedby': field?.describedBy,
        ...inputProps,
      }}
    />
  );
});
