import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import Autocomplete from '@mui/material/Autocomplete';
import OutlinedInput from '@mui/material/OutlinedInput';

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
}

/** FD searchable Dropdown (MUI Autocomplete). Options' labels must be strings. */
export function Combobox<V extends string | number = string>({
  id,
  options,
  value,
  onChange,
  placeholder,
  disabled,
  error,
  noOptionsText = 'No options',
}: ComboboxProps<V>) {
  const selected = options.find((o) => o.value === value) ?? null;

  return (
    <Autocomplete
      id={id}
      options={options}
      value={selected}
      disabled={disabled}
      noOptionsText={noOptionsText}
      popupIcon={<KeyboardArrowDownIcon />}
      getOptionLabel={(o) => String(o.label)}
      getOptionDisabled={(o) => !!o.disabled}
      isOptionEqualToValue={(a, b) => a.value === b.value}
      onChange={(_, o) => onChange(o?.value ?? null)}
      renderInput={(params) => {
        const { slotProps, disabled: inputDisabled, fullWidth } = params;
        return (
          <OutlinedInput
            ref={slotProps.input.ref}
            className={slotProps.input.className}
            startAdornment={slotProps.input.startAdornment}
            endAdornment={slotProps.input.endAdornment}
            onMouseDown={slotProps.input.onMouseDown}
            slotProps={{ input: slotProps.htmlInput }}
            disabled={inputDisabled}
            fullWidth={fullWidth}
            error={error}
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
