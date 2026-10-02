import {
  LogLevel,
  type AnalysisSummary,
  type ErrorLevel,
  type ErrorStat,
  type InvalidLine,
  type LevelCounts,
  type LogEntry,
  type ParseResult,
} from './types';

export const INVALID_SAMPLE_SIZE = 100;
export const ERROR_STATS_LIMIT = 50;
export const MAX_INVALID_LINE_LENGTH = 500;

const createEmptyLevelCounts = (): LevelCounts => ({
  [LogLevel.Debug]: 0,
  [LogLevel.Info]: 0,
  [LogLevel.Warn]: 0,
  [LogLevel.Error]: 0,
  [LogLevel.Fatal]: 0,
});

export const countByLevel = (entries: readonly LogEntry[]): LevelCounts => {
  const counts = createEmptyLevelCounts();

  for (const { level } of entries) {
    counts[level]++;
  }

  return counts;
};

const isErrorLevel = (level: LogLevel): level is ErrorLevel =>
  level === LogLevel.Error || level === LogLevel.Fatal;

const toErrorStatKey = (level: ErrorLevel, message: string): string => `${level}:${message}`;

const toErrorStat = (entry: LogEntry): ErrorStat | undefined => {
  if (!isErrorLevel(entry.level)) {
    return undefined;
  }

  return {
    level: entry.level,
    message: entry.message,
    count: 1,
    firstSeen: entry.timestamp,
    lastSeen: entry.timestamp,
  };
};

const mergeErrorStat = (previousStat: ErrorStat | undefined, nextStat: ErrorStat): ErrorStat => {
  if (!previousStat) {
    return nextStat;
  }

  return {
    ...previousStat,
    count: previousStat.count + 1,
    firstSeen: nextStat.firstSeen < previousStat.firstSeen ? nextStat.firstSeen : previousStat.firstSeen,
    lastSeen: nextStat.lastSeen > previousStat.lastSeen ? nextStat.lastSeen : previousStat.lastSeen,
  };
};

const byFrequency = (left: ErrorStat, right: ErrorStat): number =>
  right.count - left.count || left.message.localeCompare(right.message);

export const buildErrorStats = (entries: readonly LogEntry[]): ErrorStat[] => {
  const groups = new Map<string, ErrorStat>();

  for (const entry of entries) {
    const errorStat = toErrorStat(entry);

    if (!errorStat) {
      continue;
    }

    const key = toErrorStatKey(errorStat.level, errorStat.message);
    groups.set(key, mergeErrorStat(groups.get(key), errorStat));
  }

  return [...groups.values()].sort(byFrequency);
};

const summarizeErrorStats = (errorStats: ErrorStat[]) => ({
  errorStats: errorStats.slice(0, ERROR_STATS_LIMIT),
  errorGroupCount: errorStats.length,
});

const truncateInvalidLine = (invalidLine: InvalidLine): InvalidLine => ({
  ...invalidLine,
  content: invalidLine.content.slice(0, MAX_INVALID_LINE_LENGTH),
});

export const analyze = ({ entries, invalidLines }: ParseResult): AnalysisSummary => ({
  totalEntries: entries.length,
  invalidCount: invalidLines.length,
  levelCounts: countByLevel(entries),
  ...summarizeErrorStats(buildErrorStats(entries)),
  invalidSample: invalidLines.slice(0, INVALID_SAMPLE_SIZE).map(truncateInvalidLine),
});
