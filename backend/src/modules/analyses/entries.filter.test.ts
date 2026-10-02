import { describe, expect, it } from 'vitest';
import { LogLevel } from '@log-analyzer/domain';
import { buildEntriesWhere, escapeLike } from './entries.filter';

describe('escapeLike', () => {
  it('escapes LIKE wildcards and the escape character', () => {
    expect(escapeLike('100%_done\\')).toBe('100\\%\\_done\\\\');
  });
});

describe('buildEntriesWhere', () => {
  it('filters only by analysis when no filters are set', () => {
    expect(buildEntriesWhere('a1', { levels: [], search: '' })).toEqual({
      where: 'analysis_id = ?',
      parameters: ['a1'],
    });
  });

  it('combines levels and search', () => {
    expect(buildEntriesWhere('a1', { levels: [LogLevel.Error, LogLevel.Fatal], search: 'db_%' })).toEqual({
      where: "analysis_id = ? AND level IN (?, ?) AND unicode_lower(message) LIKE ? ESCAPE '\\'",
      parameters: ['a1', 'ERROR', 'FATAL', '%db\\_\\%%'],
    });
  });
});
