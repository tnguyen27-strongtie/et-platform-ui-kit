import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import Checkbox from '@mui/material/Checkbox';
import MenuItem from '@mui/material/MenuItem';
import MuiSelect, { type SelectChangeEvent } from '@mui/material/Select';
import { styled } from '@mui/material/styles';
import type React from 'react';
import type { ReactNode } from 'react';

import { colors } from '../tokens/tokens';
import { useFormField } from './FormField';

export interface SelectOption<V extends string | number = string> {
  value: V;
  label: ReactNode;
  /** Product thumbnail shown in the option (FD dropdown with images). */
  image?: string;
  /** Italic note aligned right in the option. */
  note?: ReactNode;
  /** Text used for search and screen readers when `label` is not a plain string. */
  searchText?: string;
  disabled?: boolean;
}

const OptionImage = styled('img')({
  width: '3rem',
  height: '3rem',
  padding: '0.5rem',
  borderRadius: '0.125rem',
  objectFit: 'contain',
  flexShrink: 0,
});

const OptionLabel = styled('span')({
  flex: 1,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  fontWeight: 400,
});

const OptionNote = styled('span')({
  marginLeft: '0.5rem',
  fontStyle: 'italic',
  color: colors.textMuted,
  whiteSpace: 'nowrap',
});

interface BaseProps<V extends string | number> {
  id?: string;
  name?: string;
  options: SelectOption<V>[];
  placeholder?: string;
  disabled?: boolean;
  error?: boolean;
  fullWidth?: boolean;
  /** Accessible name when the select is not inside a FormField. */
  'aria-label'?: string;
}

export interface SingleSelectProps<V extends string | number> extends BaseProps<V> {
  multiple?: false;
  value: V | '';
  onChange: (value: V) => void;
}

export interface MultiSelectProps<V extends string | number> extends BaseProps<V> {
  multiple: true;
  value: V[];
  onChange: (value: V[]) => void;
}

export type SelectProps<V extends string | number> = SingleSelectProps<V> | MultiSelectProps<V>;

/** FD Dropdown (non-searchable). For search, use Combobox. */
export function Select<V extends string | number = string>(props: MultiSelectProps<V>): React.JSX.Element;
export function Select<V extends string | number = string>(props: SingleSelectProps<V>): React.JSX.Element;
export function Select<V extends string | number = string>(props: SelectProps<V>) {
  const { id, name, options, placeholder, disabled, error, fullWidth = true } = props;
  const field = useFormField();
  const labelOf = (v: V) => options.find((o) => o.value === v)?.label ?? String(v);

  return (
    <MuiSelect<V | V[] | ''>
      id={id ?? field?.id}
      labelId={field?.labelId}
      inputProps={{ 'aria-describedby': field?.describedBy, 'aria-label': props['aria-label'] }}
      name={name}
      value={props.value}
      multiple={props.multiple}
      disabled={disabled}
      error={error ?? field?.invalid}
      fullWidth={fullWidth}
      displayEmpty={!!placeholder}
      IconComponent={KeyboardArrowDownIcon}
      renderValue={(selected) => {
        const values = (Array.isArray(selected) ? selected : [selected]).filter((v) => v !== '') as V[];
        if (values.length === 0) return <span style={{ color: colors.textMuted }}>{placeholder}</span>;
        return values.map((v, i) => (
          <span key={String(v)}>
            {i > 0 && ', '}
            {labelOf(v)}
          </span>
        ));
      }}
      onChange={(e: SelectChangeEvent<V | V[] | ''>) => {
        if (props.multiple) props.onChange(e.target.value as V[]);
        else props.onChange(e.target.value as V);
      }}
    >
      {options.map((o) => (
        <MenuItem key={String(o.value)} value={o.value} disabled={o.disabled}>
          {props.multiple && <Checkbox checked={props.value.includes(o.value)} tabIndex={-1} />}
          {o.image && <OptionImage src={o.image} alt="" />}
          <OptionLabel>{o.label}</OptionLabel>
          {o.note && <OptionNote>{o.note}</OptionNote>}
        </MenuItem>
      ))}
    </MuiSelect>
  );
}
