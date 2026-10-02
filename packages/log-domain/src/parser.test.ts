import { describe, expect, it } from 'vitest';
import { parseLine, parseLog } from './parser';

describe('parseLine', () => {
  it('parses a valid line', () => {
    expect(parseLine('2026-09-30 12:41:02 INFO User connected', 1)).toEqual({
      ok: true,
      entry: { lineNumber: 1, timestamp: '2026-09-30 12:41:02', level: 'INFO', message: 'User connected' },
    });
  });

  it('normalizes level case and trims surrounding whitespace', () => {
    const result = parseLine('  2026-09-30 12:41:05   warn   Slow request: 1250ms  ', 7);
    expect(result).toEqual({
      ok: true,
      entry: { lineNumber: 7, timestamp: '2026-09-30 12:41:05', level: 'WARN', message: 'Slow request: 1250ms' },
    });
  });

  it.each(['DEBUG', 'INFO', 'WARN', 'ERROR', 'FATAL'])('accepts level %s', (level) => {
    expect(parseLine(`2026-01-01 00:00:00 ${level} msg`, 1).ok).toBe(true);
  });

  it('rejects an unknown level', () => {
    expect(parseLine('2026-09-30 12:41:02 TRACE something', 1)).toEqual({ ok: false, reason: 'Unknown level "TRACE"' });
  });

  it.each([
    ['impossible date', '2026-02-30 12:00:00 INFO msg'],
    ['impossible time', '2026-09-30 25:61:00 INFO msg'],
  ])('rejects %s', (_caseName, line) => {
    expect(parseLine(line, 1)).toEqual({ ok: false, reason: 'Invalid date or time' });
  });

  it('accepts a time that falls into a local DST gap, because timestamps are parsed as UTC', () => {
    expect(parseLine('2026-03-29 03:30:00 INFO clocks moved forward', 1).ok).toBe(true);
  });

  it('accepts a leap day and rejects a non-leap one', () => {
    expect(parseLine('2028-02-29 10:00:00 INFO leap', 1).ok).toBe(true);
    expect(parseLine('2026-02-29 10:00:00 INFO not leap', 1)).toEqual({ ok: false, reason: 'Invalid date or time' });
  });

  it.each([
    ['garbage', 'hello world'],
    ['single-digit month', '2026-9-30 12:41:02 INFO msg'],
    ['missing message', '2026-09-30 12:41:02 INFO'],
    ['wrong date format', '30.09.2026 12:41:02 INFO msg'],
  ])('rejects %s', (_caseName, line) => {
    expect(parseLine(line, 1).ok).toBe(false);
  });
});

describe('parseLog', () => {
  it('splits valid and invalid lines, skips blank lines and keeps original line numbers', () => {
    const content = [
      '2026-09-30 12:41:02 INFO User connected',
      '',
      'broken line',
      '2026-09-30 12:41:08 ERROR Database connection failed\r',
    ].join('\n');

    const result = parseLog(content);

    expect(result.entries.map((entry) => [entry.lineNumber, entry.level])).toEqual([
      [1, 'INFO'],
      [4, 'ERROR'],
    ]);
    expect(result.invalidLines).toEqual([
      { lineNumber: 3, content: 'broken line', reason: expect.any(String) },
    ]);
  });

  it('keeps Unicode line/paragraph separators inside the message instead of rejecting the line', () => {
    const result = parseLog('2026-09-30 12:00:00 ERROR payload: a b c');
    expect(result.invalidLines).toEqual([]);
    expect(result.entries[0].message).toBe('payload: a b c');
  });

  it('handles classic Mac (CR-only) line endings', () => {
    const result = parseLog('2026-09-30 12:41:02 INFO a\r2026-09-30 12:41:03 WARN b\r');
    expect(result.entries.map((entry) => entry.lineNumber)).toEqual([1, 2]);
    expect(result.invalidLines).toHaveLength(0);
  });

  it('handles CRLF line endings', () => {
    const result = parseLog('2026-09-30 12:41:02 INFO a\r\n2026-09-30 12:41:03 WARN b\r\n');
    expect(result.entries).toHaveLength(2);
    expect(result.invalidLines).toHaveLength(0);
  });

  it('returns empty result for empty input', () => {
    expect(parseLog('')).toEqual({ entries: [], invalidLines: [] });
  });
});
