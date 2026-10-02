import { describe, expect, it } from 'vitest';
import { analyze, LogLevel } from '@log-analyzer/domain';
import { IN_MEMORY_DATABASE, openDatabase } from '../../database/database';
import { createAnalysesRepository } from './analyses.repository';
import { createEntriesRepository } from './entries.repository';

const entry = { lineNumber: 1, timestamp: '2026-01-01 00:00:00', level: LogLevel.Info, message: 'hello' };

describe('entries repository', () => {
  it('rejects a duplicate line number within the same analysis', () => {
    const database = openDatabase(IN_MEMORY_DATABASE);
    createAnalysesRepository(database).create({
      id: 'a1',
      name: 'test',
      createdAt: new Date().toISOString(),
      summary: analyze({ entries: [entry], invalidLines: [] }),
    });
    const entries = createEntriesRepository(database);

    entries.insertMany('a1', [entry]);

    expect(() => entries.insertMany('a1', [entry])).toThrow(/UNIQUE constraint failed/);
  });
});
