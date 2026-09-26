import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import Divider from '@mui/material/Divider';
import ListItemIcon from '@mui/material/ListItemIcon';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import { type ReactNode, useId, useState } from 'react';

import { Button, type ButtonProps } from './Button';

export type DropdownMenuItem =
  | { id: string; label: ReactNode; onSelect: () => void; disabled?: boolean; icon?: ReactNode; danger?: boolean }
  | { id: string; divider: true };

export interface DropdownMenuProps {
  /** Text of the trigger button. */
  label: ReactNode;
  items: DropdownMenuItem[];
  variant?: ButtonProps['variant'];
  size?: ButtonProps['size'];
  disabled?: boolean;
}

/**
 * Button that opens a list of actions (ARIA menu button).
 * Keyboard: Enter/Space/ArrowDown open, arrows move, Enter selects, Escape closes and returns focus.
 */
export function DropdownMenu({ label, items, variant, size, disabled }: DropdownMenuProps) {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const menuId = useId();
  const buttonId = useId();
  const close = () => setAnchor(null);

  return (
    <>
      <Button
        id={buttonId}
        variant={variant}
        size={size}
        disabled={disabled}
        aria-haspopup="menu"
        aria-expanded={!!anchor}
        aria-controls={anchor ? menuId : undefined}
        endIcon={<KeyboardArrowDownIcon />}
        onClick={(e) => setAnchor(e.currentTarget)}
      >
        {label}
      </Button>
      <Menu
        id={menuId}
        anchorEl={anchor}
        open={!!anchor}
        onClose={close}
        slotProps={{ list: { 'aria-labelledby': buttonId } }}
      >
        {items.map((item) =>
          'divider' in item ? (
            <Divider key={item.id} />
          ) : (
            <MenuItem
              key={item.id}
              disabled={item.disabled}
              sx={item.danger ? { color: 'error.main' } : undefined}
              onClick={() => {
                close();
                item.onSelect();
              }}
            >
              {item.icon && <ListItemIcon sx={{ color: 'inherit', minWidth: 0 }}>{item.icon}</ListItemIcon>}
              {item.label}
            </MenuItem>
          ),
        )}
      </Menu>
    </>
  );
}
