import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableFooter from '@mui/material/TableFooter';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import type { ReactNode } from 'react';

/**
 * FD table primitives (Blueprint Table.*): bordered container, 12px cells, bold 48px header.
 * Styling lives in the theme (MuiTableCell/MuiTableContainer). Pair with @tanstack/react-table
 * for sorting, filtering and virtualization.
 *
 * Sticky first column / header: add className "sticky left-0 z-[4]" / "sticky top-0 z-[4]".
 */
export const DataTable = Object.assign(
  function DataTable({ children, maxHeight }: { children: ReactNode; maxHeight?: number | string }) {
    return (
      <TableContainer sx={{ maxHeight }}>
        <Table stickyHeader={!!maxHeight} size="small">
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
