import type { SqliteDatabase } from '../../database/database';
import { toClientRequestAnalysisId } from './analyses.mappers';
import type { ClientRequestsRepository } from './analyses.types';

export const createClientRequestsRepository = (database: SqliteDatabase): ClientRequestsRepository => {
  const selectByClientId = database.prepare('SELECT analysis_id FROM client_requests WHERE client_id = ?');
  const insert = database.prepare('INSERT INTO client_requests (client_id, analysis_id) VALUES (?, ?)');

  return {
    findAnalysisId: (clientId) => {
      const row = selectByClientId.get(clientId);
      return row === undefined ? undefined : toClientRequestAnalysisId(row);
    },
    save: (clientId, analysisId) => {
      insert.run(clientId, analysisId);
    },
  };
};
