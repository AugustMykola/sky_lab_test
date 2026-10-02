import { Paper, Skeleton, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import { indexes } from './indexes';

interface TableSkeletonProps {
  rows: number;
  columns: number;
}

export const TableSkeleton = ({ rows, columns }: TableSkeletonProps) => (
  <TableContainer component={Paper} variant="outlined" aria-busy="true" aria-label="Loading table">
    <Table size="small">
      <TableHead>
        <TableRow>
          {indexes(columns).map((column) => (
            <TableCell key={column}>
              <Skeleton width="60%" />
            </TableCell>
          ))}
        </TableRow>
      </TableHead>
      <TableBody>
        {indexes(rows).map((row) => (
          <TableRow key={row}>
            {indexes(columns).map((column) => (
              <TableCell key={column}>
                <Skeleton />
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </TableContainer>
);
