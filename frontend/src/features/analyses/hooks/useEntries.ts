import { useState } from 'react';
import { SortOrder, type LogLevel } from '../../../api/types';
import { useIsOnline } from '../../../shared/connectivity/connectivity.store';
import { useDebouncedValue } from '../../../shared/hooks/useDebouncedValue';
import { useRequest } from '../../../shared/hooks/useRequest';
import { isLocalAnalysisId } from '../local/localAnalysisId';
import { useEntriesStore } from '../store/entries.store';
import { useOutboxStore } from '../store/outbox.store';

export const PAGE_SIZE_OPTIONS = [25, 50, 100];

interface Filters {
  levels: LogLevel[];
  search: string;
  sort: SortOrder;
  pageSize: number;
}

const INITIAL_FILTERS: Filters = { levels: [], search: '', sort: SortOrder.Asc, pageSize: 50 };

export const useEntries = (analysisId: string) => {
  const loadRemotePage = useEntriesStore((state) => state.loadPage);
  const loadLocalPage = useOutboxStore((state) => state.loadEntriesPage);
  const online = useIsOnline();
  const [filters, setFilters] = useState<Filters>(INITIAL_FILTERS);
  const [page, setPage] = useState(1);
  const search = useDebouncedValue(filters.search.trim());
  const [appliedSearch, setAppliedSearch] = useState(search);

  if (search !== appliedSearch) {
    setAppliedSearch(search);
    setPage(1);
  }

  const { levels, sort, pageSize } = filters;
  const { data, error, loading, reload } = useRequest(
    (signal) =>
      isLocalAnalysisId(analysisId)
        ? loadLocalPage(analysisId, { levels, search, sort, page, pageSize })
        : loadRemotePage(analysisId, { levels, search, sort, page, pageSize }, signal),
    [analysisId, levels, search, sort, page, pageSize],
  );

  const updateFilters = (patch: Partial<Filters>) => {
    setFilters((previousFilters) => ({ ...previousFilters, ...patch }));
    setPage(1);
  };

  return {
    filters,
    offline: !online,
    entries: data?.items ?? [],
    total: data?.total ?? 0,
    page,
    loading,
    error,
    reload,
    hasActiveFilters: levels.length > 0 || filters.search.trim() !== '',
    setLevels: (value: LogLevel[]) => updateFilters({ levels: value }),
    setSearch: (value: string) => setFilters((previousFilters) => ({ ...previousFilters, search: value })),
    setSort: (value: SortOrder) => updateFilters({ sort: value }),
    setPageSize: (value: number) => updateFilters({ pageSize: value }),
    setPage,
    resetFilters: () => updateFilters({ levels: [], search: '' }),
  };
};

export type EntriesViewModel = ReturnType<typeof useEntries>;
