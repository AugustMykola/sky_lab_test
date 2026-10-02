import type { SqliteDatabase } from '../../database/database';
import { toAnalysis, toAnalysisRow, toListItem } from './analyses.mappers';
import type { AnalysesRepository } from './analyses.types';

export const createAnalysesRepository = (database: SqliteDatabase): AnalysesRepository => {
  const insert = database.prepare(
    'INSERT INTO analyses (id, name, created_at, summary) VALUES (@id, @name, @createdAt, @summary)',
  );
  const selectListItems = database.prepare(
    `SELECT id, name, created_at,
            json_extract(summary, '$.totalEntries') AS total_entries,
            json_extract(summary, '$.invalidCount') AS invalid_count,
            json_extract(summary, '$.levelCounts')  AS level_counts
     FROM analyses ORDER BY created_at DESC`,
  );
  const selectById = database.prepare('SELECT id, name, created_at, summary FROM analyses WHERE id = ?');
  const deleteById = database.prepare('DELETE FROM analyses WHERE id = ?');
  const selectExists = database.prepare('SELECT 1 FROM analyses WHERE id = ?');

  return {
    create: (analysis) => {
      insert.run(toAnalysisRow(analysis));
    },
    list: () => selectListItems.all().map(toListItem),
    findById: (id) => {
      const row = selectById.get(id);
      return row === undefined ? undefined : toAnalysis(row);
    },
    exists: (id) => selectExists.get(id) !== undefined,
    delete: (id) => deleteById.run(id).changes > 0,
  };
};
