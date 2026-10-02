import { SortOrder } from '@log-analyzer/domain';
import type { Statement } from 'better-sqlite3';
import type { SqliteDatabase } from '../../database/database';
import { toLogEntry, toTotal } from './analyses.mappers';
import type { EntriesRepository } from './analyses.types';
import { buildEntriesWhere } from './entries.filter';

const SORT_DIRECTION: Record<SortOrder, 'ASC' | 'DESC'> = {
  [SortOrder.Asc]: 'ASC',
  [SortOrder.Desc]: 'DESC',
};

const createStatementCache = (database: SqliteDatabase) => {
  const statements = new Map<string, Statement>();

  return (sql: string): Statement => {
    const cached = statements.get(sql);
    if (cached) return cached;

    const statement = database.prepare(sql);
    statements.set(sql, statement);
    return statement;
  };
};

export const createEntriesRepository = (database: SqliteDatabase): EntriesRepository => {
  const insert = database.prepare(
    'INSERT INTO entries (analysis_id, line_number, timestamp, level, message) VALUES (?, ?, ?, ?, ?)',
  );
  const prepared = createStatementCache(database);

  return {
    insertMany: (analysisId, entries) => {
      for (const { lineNumber, timestamp, level, message } of entries) {
        insert.run(analysisId, lineNumber, timestamp, level, message);
      }
    },

    findPage: (analysisId, { levels, search, sort, page, pageSize }) => {
      const { where, parameters } = buildEntriesWhere(analysisId, { levels, search });
      const direction = SORT_DIRECTION[sort];

      const total = toTotal(prepared(`SELECT COUNT(*) AS total FROM entries WHERE ${where}`).get(...parameters));

      const items = prepared(
        `SELECT line_number, timestamp, level, message FROM entries
         WHERE ${where}
         ORDER BY timestamp ${direction}, line_number ${direction}
         LIMIT ? OFFSET ?`,
      )
        .all(...parameters, pageSize, (page - 1) * pageSize)
        .map(toLogEntry);

      return { items, total, page, pageSize };
    },
  };
};
