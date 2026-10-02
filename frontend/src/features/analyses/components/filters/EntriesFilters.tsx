import { Box, Button } from '@mui/material';
import type { EntriesViewModel } from '../../hooks/useEntries';
import styles from './EntriesFilters.module.scss';
import { LevelSelect } from './LevelSelect';
import { SearchField } from './SearchField';
import { SortToggle } from './SortToggle';

type EntriesFiltersProps = Pick<
  EntriesViewModel,
  'filters' | 'hasActiveFilters' | 'setLevels' | 'setSearch' | 'setSort' | 'resetFilters'
>;

export const EntriesFilters = ({
  filters,
  hasActiveFilters,
  setLevels,
  setSearch,
  setSort,
  resetFilters,
}: EntriesFiltersProps) => (
  <Box className={styles.filters}>
    <SearchField className={styles.search} value={filters.search} onChange={setSearch} />
    <LevelSelect className={styles.levels} value={filters.levels} onChange={setLevels} />
    <SortToggle value={filters.sort} onChange={setSort} />
    {hasActiveFilters && (
      <Button size="small" onClick={resetFilters}>
        Reset filters
      </Button>
    )}
  </Box>
);
