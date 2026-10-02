import { TablePagination } from '@mui/material';
import { PAGE_SIZE_OPTIONS } from '../../hooks/useEntries';

interface EntriesPaginationProps {
  total: number;
  page: number;
  pageSize: number;
  compact: boolean;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
}

export const EntriesPagination = ({
  total,
  page,
  pageSize,
  compact,
  onPageChange,
  onPageSizeChange,
}: EntriesPaginationProps) => (
  <TablePagination
    component="div"
    count={total}
    page={page - 1}
    onPageChange={(_event, zeroBasedPage) => onPageChange(zeroBasedPage + 1)}
    rowsPerPage={pageSize}
    rowsPerPageOptions={PAGE_SIZE_OPTIONS}
    onRowsPerPageChange={(event) => onPageSizeChange(Number(event.target.value))}
    labelRowsPerPage={compact ? 'Rows' : 'Rows per page'}
  />
);
