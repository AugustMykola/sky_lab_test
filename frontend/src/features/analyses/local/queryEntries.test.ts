import { describe, expect, it } from 'vitest';
import { LogLevel, SortOrder, type EntriesQuery, type LogEntry } from '../../../api/types';
import { queryEntries } from './queryEntries';

const entry = (lineNumber: number, timestamp: string, level: LogLevel, message: string): LogEntry => ({
  lineNumber,
  timestamp,
  level,
  message,
});

const ENTRIES: LogEntry[] = [
  entry(1, '2026-09-30 12:41:02', LogLevel.Info, 'User connected'),
  entry(2, '2026-09-30 12:41:05', LogLevel.Warn, 'Slow request: 1250ms'),
  entry(3, '2026-09-30 12:40:00', LogLevel.Error, 'Database connection failed'),
  entry(4, '2026-09-30 12:41:05', LogLevel.Error, 'Database timeout'),
  entry(5, '2026-09-30 12:42:00', LogLevel.Fatal, 'Out of memory'),
];

const query = (overrides: Partial<EntriesQuery> = {}): EntriesQuery => ({
  levels: [],
  search: '',
  sort: SortOrder.Asc,
  page: 1,
  pageSize: 50,
  ...overrides,
});

const lineNumbers = (page: { items: LogEntry[] }) => page.items.map((item) => item.lineNumber);

describe('queryEntries', () => {
  it('sorts by timestamp and then line number, like the SQL query', () => {
    expect(lineNumbers(queryEntries(ENTRIES, query()))).toEqual([3, 1, 2, 4, 5]);
    expect(lineNumbers(queryEntries(ENTRIES, query({ sort: SortOrder.Desc })))).toEqual([5, 4, 2, 1, 3]);
  });

  it('filters by any of the selected levels', () => {
    const page = queryEntries(ENTRIES, query({ levels: [LogLevel.Error, LogLevel.Fatal] }));
    expect(lineNumbers(page)).toEqual([3, 4, 5]);
    expect(page.total).toBe(3);
  });

  it('searches messages case-insensitively and treats wildcards literally', () => {
    expect(lineNumbers(queryEntries(ENTRIES, query({ search: 'DATABASE' })))).toEqual([3, 4]);
    expect(queryEntries(ENTRIES, query({ search: '%' })).total).toBe(0);
  });

  it('paginates and reports the total before pagination', () => {
    const secondPage = queryEntries(ENTRIES, query({ page: 2, pageSize: 2 }));
    expect(lineNumbers(secondPage)).toEqual([2, 4]);
    expect(secondPage).toMatchObject({ total: 5, page: 2, pageSize: 2 });
  });

  it('does not mutate the input entries', () => {
    const snapshot = [...ENTRIES];
    queryEntries(ENTRIES, query({ sort: SortOrder.Desc }));
    expect(ENTRIES).toEqual(snapshot);
  });
});
