/** Header pieces of GridView: sort arrows, per-column filter inputs, the column menu and the Columns menu. */
import MoreVertIcon from '@mui/icons-material/MoreVert';
import PushPinIcon from '@mui/icons-material/PushPin';
import ViewColumnIcon from '@mui/icons-material/ViewColumn';
import Divider from '@mui/material/Divider';
import ListItemIcon from '@mui/material/ListItemIcon';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import type { Column, RowData } from '@tanstack/react-table';
import { useId, useState } from 'react';

import { Button, IconButton } from '../Button';
import { Checkbox } from '../Choice';
import { NumberInput } from '../NumberInput';
import { Select } from '../Select';
import { TextInput } from '../TextInput';
import type { NumberRange } from './gridFilters';
import { filterTypeOf } from './gridState';
import type { Features } from './gridTable';
import type { GridColumn, GridViewLabels } from './gridTypes';

export function SortIcon({ direction }: { direction: false | 'asc' | 'desc' }) {
  return (
    <svg viewBox="0 0 10 14" width="8" height="12" aria-hidden="true" className="shrink-0">
      <path d="M5 1 9 5.5H1Z" fill="currentColor" opacity={direction === 'asc' ? 1 : 0.25} />
      <path d="M5 13 1 8.5h8Z" fill="currentColor" opacity={direction === 'desc' ? 1 : 0.25} />
    </svg>
  );
}

export function ColumnFilter<T extends RowData>({
  column,
  config,
  labels: L,
}: {
  column: Column<Features, T, unknown>;
  config: GridColumn<T>;
  labels: GridViewLabels;
}) {
  const type = filterTypeOf(config);
  const label = L.filterColumn(config.header);
  const value = column.getFilterValue();

  if (type === 'number') {
    const range = (value as NumberRange | undefined) ?? {};
    const set = (patch: NumberRange) => column.setFilterValue({ ...range, ...patch });
    return (
      <div className="grid-filter flex gap-1">
        <NumberInput aria-label={L.minimum(config.header)} placeholder={L.minPlaceholder} value={range.min ?? null} onChange={(min) => set({ min })} />
        <NumberInput aria-label={L.maximum(config.header)} placeholder={L.maxPlaceholder} value={range.max ?? null} onChange={(max) => set({ max })} />
      </div>
    );
  }

  if (type === 'select') {
    const options =
      config.filterOptions ??
      [...column.getFacetedUniqueValues().keys()]
        .filter((v): v is string | number => typeof v === 'string' || typeof v === 'number')
        .sort((a, b) => String(a).localeCompare(String(b), undefined, { numeric: true }))
        .map((v) => ({ value: v, label: String(v) }));
    return (
      <div className="grid-filter">
        <Select<string | number>
          multiple
          aria-label={label}
          placeholder={L.all}
          value={(value as Array<string | number> | undefined) ?? []}
          onChange={(v) => column.setFilterValue(v)}
          options={options}
        />
      </div>
    );
  }

  return (
    <div className="grid-filter">
      <TextInput
        inputProps={{ 'aria-label': label, type: 'search' }}
        placeholder={L.filterPlaceholder}
        value={(value as string | undefined) ?? ''}
        onChange={(e) => column.setFilterValue(e.target.value)}
      />
    </div>
  );
}

interface ColumnMenuProps<T extends RowData> {
  column: Column<Features, T, unknown>;
  header: string;
  labels: GridViewLabels;
  canMoveLeft: boolean;
  canMoveRight: boolean;
  onMove: (step: -1 | 1) => void;
  canHide: boolean;
}

/** Per-column actions; also the keyboard alternative to drag-and-drop. */
export function ColumnMenu<T extends RowData>({ column, header, labels: L, canMoveLeft, canMoveRight, onMove, canHide }: ColumnMenuProps<T>) {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const menuId = useId();
  const close = () => setAnchor(null);
  const run = (fn: () => void) => () => {
    fn();
    close();
  };
  const sorted = column.getIsSorted();
  const pinned = column.getIsPinned();

  return (
    <>
      <IconButton
        aria-label={L.columnOptions(header)}
        aria-haspopup="menu"
        aria-expanded={!!anchor}
        aria-controls={anchor ? menuId : undefined}
        size="small"
        className="grid-col-menu shrink-0"
        onClick={(e) => setAnchor(e.currentTarget)}
      >
        <MoreVertIcon sx={{ fontSize: '1rem' }} />
      </IconButton>
      <Menu id={menuId} anchorEl={anchor} open={!!anchor} onClose={close}>
        {column.getCanSort() && [
          <MenuItem key="asc" selected={sorted === 'asc'} onClick={run(() => column.toggleSorting(false))}>
            {L.sortAscending}
          </MenuItem>,
          <MenuItem key="desc" selected={sorted === 'desc'} onClick={run(() => column.toggleSorting(true))}>
            {L.sortDescending}
          </MenuItem>,
          sorted && (
            <MenuItem key="clear" onClick={run(() => column.clearSorting())}>
              {L.clearSort}
            </MenuItem>
          ),
          <Divider key="d1" />,
        ]}
        {pinned !== 'start' && (
          <MenuItem onClick={run(() => column.pin('start'))}>
            <ListItemIcon sx={{ minWidth: 0, color: 'inherit' }}>
              <PushPinIcon fontSize="small" />
            </ListItemIcon>
            {L.freezeLeft}
          </MenuItem>
        )}
        {pinned !== 'end' && <MenuItem onClick={run(() => column.pin('end'))}>{L.freezeRight}</MenuItem>}
        {pinned && <MenuItem onClick={run(() => column.pin(false))}>{L.unfreeze}</MenuItem>}
        <Divider />
        <MenuItem disabled={!canMoveLeft} onClick={run(() => onMove(-1))}>
          {L.moveLeft}
        </MenuItem>
        <MenuItem disabled={!canMoveRight} onClick={run(() => onMove(1))}>
          {L.moveRight}
        </MenuItem>
        {canHide && [
          <Divider key="d3" />,
          <MenuItem key="hide" onClick={run(() => column.toggleVisibility(false))}>
            {L.hideColumn}
          </MenuItem>,
        ]}
      </Menu>
    </>
  );
}

/** Toolbar menu: show/hide columns and reset the layout. */
export function ColumnsMenu<T extends RowData>({
  columns: all,
  byId,
  labels: L,
  onReset,
}: {
  columns: Column<Features, T, unknown>[];
  byId: Map<string, GridColumn<T>>;
  labels: GridViewLabels;
  onReset: () => void;
}) {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const menuId = useId();
  const visibleCount = all.filter((c) => c.getIsVisible()).length;

  return (
    <>
      <Button
        size="small"
        startIcon={<ViewColumnIcon />}
        aria-haspopup="menu"
        aria-expanded={!!anchor}
        aria-controls={anchor ? menuId : undefined}
        onClick={(e) => setAnchor(e.currentTarget)}
      >
        {L.columns}
      </Button>
      <Menu id={menuId} anchorEl={anchor} open={!!anchor} onClose={() => setAnchor(null)}>
        {all.map((col) => {
          const visible = col.getIsVisible();
          const locked = !col.getCanHide() || (visible && visibleCount === 1);
          return (
            <MenuItem
              key={col.id}
              role="menuitemcheckbox"
              aria-checked={visible}
              disabled={locked}
              onClick={() => col.toggleVisibility(!visible)}
            >
              <Checkbox checked={visible} tabIndex={-1} slotProps={{ input: { 'aria-hidden': true, tabIndex: -1 } }} />
              {byId.get(col.id)?.header ?? col.id}
            </MenuItem>
          );
        })}
        <Divider />
        <MenuItem
          onClick={() => {
            onReset();
            setAnchor(null);
          }}
        >
          {L.resetLayout}
        </MenuItem>
      </Menu>
    </>
  );
}
