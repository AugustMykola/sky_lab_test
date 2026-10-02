import { LOG_TIMESTAMP_FORMAT } from './constants/date-formats';
import { LINE_BREAK_PATTERN, LOG_LINE_PATTERN } from './constants/patterns';
import { dayjs } from './lib/dayjs';
import { LOG_LEVELS, type LogEntry, type LogLevel, type ParseResult } from './types';

type LineParseResult = { ok: true; entry: LogEntry } | { ok: false; reason: string };

const isLogLevel = (value: string): value is LogLevel => LOG_LEVELS.some((level) => level === value);

const isValidTimestamp = (timestamp: string): boolean =>
  dayjs.utc(timestamp, LOG_TIMESTAMP_FORMAT, true).isValid();

export const parseLine = (line: string, lineNumber: number): LineParseResult => {
  const match = LOG_LINE_PATTERN.exec(line.trim());
  if (!match) {
    return { ok: false, reason: 'Line does not match "YYYY-MM-DD HH:mm:ss LEVEL message"' };
  }

  const [, timestamp, rawLevel, message] = match;
  if (!isValidTimestamp(timestamp)) {
    return { ok: false, reason: 'Invalid date or time' };
  }

  const level = rawLevel.toUpperCase();
  if (!isLogLevel(level)) {
    return { ok: false, reason: `Unknown level "${rawLevel}"` };
  }

  return { ok: true, entry: { lineNumber, timestamp, level, message: message.trim() } };
};

export const parseLog = (content: string): ParseResult => {
  const result: ParseResult = { entries: [], invalidLines: [] };

  for (const [index, line] of content.split(LINE_BREAK_PATTERN).entries()) {
    if (line.trim() === '') {
      continue;
    }

    const lineNumber = index + 1;
    const parsed = parseLine(line, lineNumber);

    if (parsed.ok) {
      result.entries.push(parsed.entry);
    } else {
      result.invalidLines.push({ lineNumber, content: line, reason: parsed.reason });
    }
  }

  return result;
};
