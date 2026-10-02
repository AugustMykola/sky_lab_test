import {
  analysisSummarySchema,
  levelCountsSchema,
  logEntrySchema,
  type AnalysisSummary,
  type LogLevel,
  type SortOrder,
} from '@log-analyzer/domain';
import * as zod from 'zod';

export {
  LOG_LEVELS,
  LogLevel,
  logLevelSchema,
  SortOrder,
  sortOrderSchema,
  type AnalysisSummary,
  type ErrorStat,
  type InvalidLine,
  type LevelCounts,
  type LogEntry,
} from '@log-analyzer/domain';

export const analysisSchema = zod.object({
  id: zod.string(),
  name: zod.string(),
  createdAt: zod.string(),
  summary: analysisSummarySchema,
});

export const analysisListItemSchema = zod.object({
  id: zod.string(),
  name: zod.string(),
  createdAt: zod.string(),
  totalEntries: zod.number(),
  invalidCount: zod.number(),
  levelCounts: levelCountsSchema,
});

export const entriesPageSchema = zod.object({
  items: zod.array(logEntrySchema),
  total: zod.number(),
  page: zod.number(),
  pageSize: zod.number(),
});

export type AnalysisCounts = Pick<AnalysisSummary, 'totalEntries' | 'invalidCount' | 'levelCounts'>;
export type Analysis = zod.infer<typeof analysisSchema>;
export type AnalysisListItem = zod.infer<typeof analysisListItemSchema>;
export type EntriesPage = zod.infer<typeof entriesPageSchema>;

export interface EntriesQuery {
  levels: LogLevel[];
  search: string;
  sort: SortOrder;
  page: number;
  pageSize: number;
}

export interface CreateAnalysisPayload {
  name: string;
  content: string;
  clientId?: string;
  createdAt?: string;
}
