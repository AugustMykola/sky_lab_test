import type { AnalysisSummary, LogEntry, LogLevel, SortOrder } from '@log-analyzer/domain';

export interface Analysis {
  id: string;
  name: string;
  createdAt: string;
  summary: AnalysisSummary;
}

export type AnalysisListItem = Pick<Analysis, 'id' | 'name' | 'createdAt'> &
  Pick<AnalysisSummary, 'totalEntries' | 'invalidCount' | 'levelCounts'>;

export interface EntriesFilter {
  levels: LogLevel[];
  search: string;
}

export interface EntriesQuery extends EntriesFilter {
  sort: SortOrder;
  page: number;
  pageSize: number;
}

export interface Page<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface AnalysesRepository {
  create(analysis: Analysis): void;
  list(): AnalysisListItem[];
  findById(id: string): Analysis | undefined;
  exists(id: string): boolean;
  delete(id: string): boolean;
}

export interface ClientRequestsRepository {
  findAnalysisId(clientId: string): string | undefined;
  save(clientId: string, analysisId: string): void;
}

export interface EntriesRepository {
  insertMany(analysisId: string, entries: readonly LogEntry[]): void;
  findPage(analysisId: string, query: EntriesQuery): Page<LogEntry>;
}
