import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import { type ReactNode, useId, useState } from 'react';

import { cn } from '../utils/cn';

/**
 * FD top navigation bar primitives. The full configurable nav (menus, slots) belongs in
 * libs/shell; these give it the FD look: 54px bar, orange bottom border, gray menu labels
 * with an orange 4px underline on hover/open.
 */
export function TopNav({ logo, children, right }: { logo: ReactNode; children?: ReactNode; right?: ReactNode }) {
  return (
    <header className="relative z-[var(--z-top-nav)] flex h-[var(--top-nav-height)] items-center justify-between border-b border-accent bg-true-gray-0 p-2">
      <div className="md:mr-2">{logo}</div>
      <nav className="hidden flex-1 items-center gap-2 md:ml-6 md:flex lg:ml-12">{children}</nav>
      {right && <div className="flex items-center gap-2">{right}</div>}
    </header>
  );
}

const navItemClass = cn(
  'relative flex h-[var(--top-nav-height)] cursor-pointer items-center border-0 bg-transparent px-2 font-sans text-sm font-medium text-text-nav',
  'after:absolute after:bottom-0 after:left-0 after:hidden after:h-1 after:w-full after:bg-accent',
  'hover:after:block aria-expanded:after:block',
);

export interface NavMenuItem {
  id: string;
  label: ReactNode;
  onSelect: () => void;
  disabled?: boolean;
  icon?: ReactNode;
}

export function NavMenu({ label, items }: { label: ReactNode; items: NavMenuItem[] }) {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const menuId = useId();

  return (
    <>
      <button
        type="button"
        className={navItemClass}
        aria-haspopup="menu"
        aria-controls={anchor ? menuId : undefined}
        aria-expanded={!!anchor}
        onClick={(e) => setAnchor(e.currentTarget)}
      >
        {label}
      </button>
      <Menu
        id={menuId}
        anchorEl={anchor}
        open={!!anchor}
        onClose={() => setAnchor(null)}
        slotProps={{ paper: { sx: { border: '1px solid rgba(0,0,0,.176)', py: 2, boxShadow: 'none' } } }}
      >
        {items.map((item) => (
          <MenuItem
            key={item.id}
            disabled={item.disabled}
            onClick={() => {
              setAnchor(null);
              item.onSelect();
            }}
            sx={{ fontSize: '0.875rem', color: '#000', '&:hover': { boxShadow: 'none' } }}
          >
            {item.icon}
            {item.label}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}
