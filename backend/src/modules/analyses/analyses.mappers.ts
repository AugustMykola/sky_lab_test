import * as zod from 'zod';
import { analysisSummarySchema, levelCountsSchema, logLevelSchema, type LogEntry } from '@log-analyzer/domain';
import type { Analysis, AnalysisListItem } from './analyses.types';

const analysisRowSchema = zod.object({
  id: zod.string(),
  name: zod.string(),
  created_at: zod.string(),
  summary: zod
    .string()
    .transform((json): unknown => JSON.parse(json))
    .pipe(analysisSummarySchema),
});

const listItemRowSchema = zod.object({
  id: zod.string(),
  name: zod.string(),
  created_at: zod.string(),
  total_entries: zod.number().int().nonnegative(),
  invalid_count: zod.number().int().nonnegative(),
  level_counts: zod
    .string()
    .transform((json): unknown => JSON.parse(json))
    .pipe(levelCountsSchema),
});

const clientRequestRowSchema = zod.object({ analysis_id: zod.string() });

const entryRowSchema = zod.object({
  line_number: zod.number().int(),
  timestamp: zod.string(),
  level: logLevelSchema,
  message: zod.string(),
});

const countRowSchema = zod.object({ total: zod.number().int().nonnegative() });

class CorruptedStoredDataError extends Error {}

const parseStoredRow = <Output>(schema: zod.ZodType<Output>, row: unknown): Output => {
  const result = schema.safeParse(row);
  if (!result.success) {
    throw new CorruptedStoredDataError('Stored row does not match the expected schema', { cause: result.error });
  }
  return result.data;
};

export const toAnalysis = (row: unknown): Analysis => {
  const { id, name, created_at, summary } = parseStoredRow(analysisRowSchema, row);
  return { id, name, createdAt: created_at, summary };
};

export const toAnalysisRow = ({ id, name, createdAt, summary }: Analysis) => ({
  id,
  name,
  createdAt,
  summary: JSON.stringify(summary),
});

export const toLogEntry = (row: unknown): LogEntry => {
  const { line_number, timestamp, level, message } = parseStoredRow(entryRowSchema, row);
  return { lineNumber: line_number, timestamp, level, message };
};

export const toTotal = (row: unknown): number => parseStoredRow(countRowSchema, row).total;

export const toListItem = (row: unknown): AnalysisListItem => {
  const { id, name, created_at, total_entries, invalid_count, level_counts } = parseStoredRow(listItemRowSchema, row);
  return { id, name, createdAt: created_at, totalEntries: total_entries, invalidCount: invalid_count, levelCounts: level_counts };
};

export const toClientRequestAnalysisId = (row: unknown): string => parseStoredRow(clientRequestRowSchema, row).analysis_id;
