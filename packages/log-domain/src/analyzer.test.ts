import { describe, expect, it } from 'vitest';
import {
  analyze,
  buildErrorStats,
  countByLevel,
  ERROR_STATS_LIMIT,
  INVALID_SAMPLE_SIZE,
  MAX_INVALID_LINE_LENGTH,
} from './analyzer';
import { LogLevel, type LogEntry } from './types';

const entry = (level: LogLevel, message: string, timestamp: string, lineNumber = 1): LogEntry => ({
  lineNumber,
  timestamp,
  level,
  message,
});

describe('countByLevel', () => {
  it('counts every level and includes zero for missing ones', () => {
    const entries = [
      entry(LogLevel.Info, 'a', '2026-01-01 00:00:00'),
      entry(LogLevel.Info, 'b', '2026-01-01 00:00:01'),
      entry(LogLevel.Error, 'c', '2026-01-01 00:00:02'),
    ];
    expect(countByLevel(entries)).toEqual({ DEBUG: 0, INFO: 2, WARN: 0, ERROR: 1, FATAL: 0 });
  });
});

describe('buildErrorStats', () => {
  it('groups ERROR/FATAL by level and message with first/last seen, most frequent first', () => {
    const entries = [
      entry(LogLevel.Error, 'DB down', '2026-01-01 10:00:00'),
      entry(LogLevel.Info, 'ignored', '2026-01-01 10:00:01'),
      entry(LogLevel.Error, 'Timeout', '2026-01-01 10:00:02'),
      entry(LogLevel.Error, 'DB down', '2026-01-01 09:00:00'),
      entry(LogLevel.Error, 'DB down', '2026-01-01 11:00:00'),
      entry(LogLevel.Fatal, 'DB down', '2026-01-01 12:00:00'),
    ];

    expect(buildErrorStats(entries)).toEqual([
      { level: 'ERROR', message: 'DB down', count: 3, firstSeen: '2026-01-01 09:00:00', lastSeen: '2026-01-01 11:00:00' },
      { level: 'FATAL', message: 'DB down', count: 1, firstSeen: '2026-01-01 12:00:00', lastSeen: '2026-01-01 12:00:00' },
      { level: 'ERROR', message: 'Timeout', count: 1, firstSeen: '2026-01-01 10:00:02', lastSeen: '2026-01-01 10:00:02' },
    ]);
  });

  it('keeps groups apart when messages contain colons', () => {
    const entries = [
      entry(LogLevel.Error, 'DB: connection lost', '2026-01-01 10:00:00'),
      entry(LogLevel.Fatal, 'DB: connection lost', '2026-01-01 10:00:01'),
      entry(LogLevel.Error, 'DB: connection lost', '2026-01-01 10:00:02'),
    ];

    expect(buildErrorStats(entries).map(({ level, count }) => [level, count])).toEqual([
      ['ERROR', 2],
      ['FATAL', 1],
    ]);
  });

  it('returns an empty list when there are no errors', () => {
    expect(buildErrorStats([entry(LogLevel.Info, 'ok', '2026-01-01 00:00:00')])).toEqual([]);
  });
});

describe('analyze', () => {
  it('builds a full summary and caps the invalid sample', () => {
    const invalidLines = Array.from({ length: INVALID_SAMPLE_SIZE + 5 }, (_unused, index) => ({
      lineNumber: index + 2,
      content: 'bad',
      reason: 'x',
    }));

    const summary = analyze({ entries: [entry(LogLevel.Warn, 'slow', '2026-01-01 00:00:00')], invalidLines });

    expect(summary.totalEntries).toBe(1);
    expect(summary.invalidCount).toBe(INVALID_SAMPLE_SIZE + 5);
    expect(summary.invalidSample).toHaveLength(INVALID_SAMPLE_SIZE);
    expect(summary.levelCounts.WARN).toBe(1);
    expect(summary.errorStats).toEqual([]);
  });

  it('keeps only the top error groups but reports how many groups exist', () => {
    const groupCount = ERROR_STATS_LIMIT + 25;
    const entries = Array.from({ length: groupCount }, (_unused, index) =>
      entry(LogLevel.Error, `Request ${index} failed`, '2026-01-01 00:00:00', index + 1),
    );

    const summary = analyze({ entries, invalidLines: [] });

    expect(summary.errorStats).toHaveLength(ERROR_STATS_LIMIT);
    expect(summary.errorGroupCount).toBe(groupCount);
  });

  it('truncates very long invalid lines in the sample', () => {
    const longLine = 'x'.repeat(MAX_INVALID_LINE_LENGTH * 10);

    const summary = analyze({
      entries: [entry(LogLevel.Info, 'ok', '2026-01-01 00:00:00')],
      invalidLines: [{ lineNumber: 2, content: longLine, reason: 'bad' }],
    });

    expect(summary.invalidSample[0].content).toHaveLength(MAX_INVALID_LINE_LENGTH);
  });
});
