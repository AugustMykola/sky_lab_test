import * as zod from 'zod';

export enum LogLevel {
  Debug = 'DEBUG',
  Info = 'INFO',
  Warn = 'WARN',
  Error = 'ERROR',
  Fatal = 'FATAL',
}

export const LOG_LEVELS = Object.values(LogLevel);

export enum SortOrder {
  Asc = 'asc',
  Desc = 'desc',
}

export const sortOrderSchema = zod.enum(SortOrder);

export const logLevelSchema = zod.enum(LogLevel);

export const errorLevelSchema = zod.enum([LogLevel.Error, LogLevel.Fatal]);

export const levelCountsSchema = zod.record(logLevelSchema, zod.number().int().nonnegative());

export const logEntrySchema = zod.object({
  lineNumber: zod.number().int().positive(),
  timestamp: zod.string(),
  level: logLevelSchema,
  message: zod.string(),
});

export const invalidLineSchema = zod.object({
  lineNumber: zod.number().int().positive(),
  content: zod.string(),
  reason: zod.string(),
});

export const errorStatSchema = zod.object({
  level: errorLevelSchema,
  message: zod.string(),
  count: zod.number().int().positive(),
  firstSeen: zod.string(),
  lastSeen: zod.string(),
});

export const analysisSummarySchema = zod.object({
  totalEntries: zod.number().int().nonnegative(),
  invalidCount: zod.number().int().nonnegative(),
  levelCounts: levelCountsSchema,
  errorStats: zod.array(errorStatSchema),
  errorGroupCount: zod.number().int().nonnegative(),
  invalidSample: zod.array(invalidLineSchema),
});

export type ErrorLevel = zod.infer<typeof errorLevelSchema>;
export type LevelCounts = zod.infer<typeof levelCountsSchema>;
export type LogEntry = zod.infer<typeof logEntrySchema>;
export type InvalidLine = zod.infer<typeof invalidLineSchema>;
export type ErrorStat = zod.infer<typeof errorStatSchema>;
export type AnalysisSummary = zod.infer<typeof analysisSummarySchema>;

export interface ParseResult {
  entries: LogEntry[];
  invalidLines: InvalidLine[];
}
