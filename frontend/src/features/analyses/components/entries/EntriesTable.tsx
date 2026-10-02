import { Box, LinearProgress, useMediaQuery, useTheme } from '@mui/material';
import type { EntriesViewModel } from '../../hooks/useEntries';
import { EntriesCardList } from './EntriesCardList';
import { EntriesPagination } from './EntriesPagination';
import { EntriesTableView } from './EntriesTableView';

type EntriesTableProps = Pick<
  EntriesViewModel,
  'entries' | 'total' | 'page' | 'loading' | 'filters' | 'setPage' | 'setPageSize'
>;

export const EntriesTable = ({ entries, total, page, loading, filters, setPage, setPageSize }: EntriesTableProps) => {
  const isPhone = useMediaQuery(useTheme().breakpoints.down('sm'));

  return (
    <Box>
      <Box sx={{ height: 4, mb: 1 }}>{loading && <LinearProgress />}</Box>
      <Box sx={{ opacity: loading ? 0.6 : 1, transition: 'opacity 0.2s' }}>
        {isPhone ? <EntriesCardList entries={entries} /> : <EntriesTableView entries={entries} />}
      </Box>
      <EntriesPagination
        total={total}
        page={page}
        pageSize={filters.pageSize}
        compact={isPhone}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
      />
    </Box>
  );
};
