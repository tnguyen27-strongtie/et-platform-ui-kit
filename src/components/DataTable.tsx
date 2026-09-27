import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableFooter from '@mui/material/TableFooter';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import type { ReactNode } from 'react';

import { colors } from '../tokens/tokens';

/**
 * Table primitives: bordered container, 12px cells, bold 48px header.
 * Styling lives in the theme (MuiTableCell/MuiTableContainer). Pair with @tanstack/react-table
 * for sorting, filtering and virtualization.
 *
 * Sticky first column / header: add className "sticky left-0 z-[4]" / "sticky top-0 z-[4]".
 */
export interface DataTableProps {
  children: ReactNode;
  /** Scroll inside the table with a sticky header. */
  maxHeight?: number | string;
  /** Accessible name of the table (and of its scroll region when maxHeight is set). */
  'aria-label'?: string;
}

export const DataTable = Object.assign(
  function DataTable({ children, maxHeight, 'aria-label': ariaLabel }: DataTableProps) {
    // A scrolling container must be focusable so keyboard users can scroll it (WCAG 2.1.1).
    const scrollRegion = maxHeight ? { tabIndex: 0, role: 'region', 'aria-label': ariaLabel ?? 'Scrollable table' } : {};
    return (
      <TableContainer
        sx={{ maxHeight, '&:focus-visible': { outline: `2px solid ${colors.brand}`, outlineOffset: '2px' } }}
        {...scrollRegion}
      >
        <Table stickyHeader={!!maxHeight} size="small" aria-label={ariaLabel}>
          {children}
        </Table>
      </TableContainer>
    );
  },
  {
    Head: TableHead,
    Body: TableBody,
    Footer: TableFooter,
    Row: TableRow,
    Cell: TableCell,
  },
);
