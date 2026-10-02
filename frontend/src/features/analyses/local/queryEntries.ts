import { SortOrder, type EntriesPage, type EntriesQuery, type LogEntry } from '../../../api/types';

const compareChronologically = (left: LogEntry, right: LogEntry): number =>
  left.timestamp.localeCompare(right.timestamp) || left.lineNumber - right.lineNumber;

const matchesFilters = ({ levels, search }: Pick<EntriesQuery, 'levels' | 'search'>) => {
  const levelSet = new Set(levels);
  const normalizedSearch = search.toLowerCase();

  return (entry: LogEntry): boolean =>
    (levelSet.size === 0 || levelSet.has(entry.level)) &&
    (normalizedSearch === '' || entry.message.toLowerCase().includes(normalizedSearch));
};

export const queryEntries = (entries: readonly LogEntry[], query: EntriesQuery): EntriesPage => {
  const matching = entries.filter(matchesFilters(query)).sort(compareChronologically);
  const ordered = query.sort === SortOrder.Desc ? matching.reverse() : matching;
  const start = (query.page - 1) * query.pageSize;

  return {
    items: ordered.slice(start, start + query.pageSize),
    total: ordered.length,
    page: query.page,
    pageSize: query.pageSize,
  };
};
