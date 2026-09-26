import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import Autocomplete from '@mui/material/Autocomplete';
import OutlinedInput from '@mui/material/OutlinedInput';

import { useFormField } from './FormField';
import type { SelectOption } from './Select';

export interface ComboboxProps<V extends string | number> {
  id?: string;
  options: SelectOption<V>[];
  value: V | null;
  onChange: (value: V | null) => void;
  placeholder?: string;
  disabled?: boolean;
  error?: boolean;
  noOptionsText?: string;
  /** Accessible name when the combobox is not inside a FormField. */
  'aria-label'?: string;
}

/** Plain text of an option, for filtering and the input value. */
const optionText = (o: SelectOption<string | number>) =>
  o.searchText ?? (typeof o.label === 'string' || typeof o.label === 'number' ? String(o.label) : String(o.value));

/** FD searchable Dropdown (MUI Autocomplete). Give `searchText` to options whose label is not a string. */
export function Combobox<V extends string | number = string>({
  id,
  options,
  value,
  onChange,
  placeholder,
  disabled,
  error,
  noOptionsText = 'No options',
  'aria-label': ariaLabel,
}: ComboboxProps<V>) {
  const field = useFormField();
  const selected = options.find((o) => o.value === value) ?? null;

  return (
    <Autocomplete
      id={id ?? field?.id}
      options={options}
      value={selected}
      disabled={disabled ?? field?.disabled}
      noOptionsText={noOptionsText}
      popupIcon={<KeyboardArrowDownIcon />}
      getOptionLabel={optionText}
      getOptionDisabled={(o) => !!o.disabled}
      isOptionEqualToValue={(a, b) => a.value === b.value}
      onChange={(_, o) => onChange(o?.value ?? null)}
      renderInput={(params) => {
        const { slotProps, disabled: inputDisabled, fullWidth } = params;
        // InputBase only picks up the input ref from `inputRef`/`inputProps.ref`, not slotProps.input.
        const { ref: htmlInputRef, ...htmlInput } = slotProps.htmlInput;
        return (
          <OutlinedInput
            ref={slotProps.input.ref}
            className={slotProps.input.className}
            startAdornment={slotProps.input.startAdornment}
            endAdornment={slotProps.input.endAdornment}
            onMouseDown={slotProps.input.onMouseDown}
            inputRef={htmlInputRef}
            inputProps={{
              ...htmlInput,
              'aria-describedby': field?.describedBy,
              'aria-label': ariaLabel,
            }}
            disabled={inputDisabled}
            fullWidth={fullWidth}
            error={error ?? field?.invalid}
            placeholder={placeholder}
          />
        );
      }}
      renderOption={({ key, ...optionProps }, o) => (
        <li key={key} {...optionProps}>
          {o.image && <img src={o.image} alt="" style={{ width: '3rem', height: '3rem', padding: '0.5rem' }} />}
          <span style={{ flex: 1 }}>{o.label}</span>
          {o.note && <em style={{ marginLeft: '0.5rem' }}>{o.note}</em>}
        </li>
      )}
    />
  );
}
