import express from 'express';
import type { SqliteDatabase } from './database/database';
import { createTransactionRunner } from './database/transaction';
import { errorHandler, notFoundHandler } from './http/error-handler';
import { createAnalysesController } from './modules/analyses/analyses.controller';
import { createAnalysesRepository } from './modules/analyses/analyses.repository';
import { createAnalysesRouter } from './modules/analyses/analyses.router';
import { createAnalysesService } from './modules/analyses/analyses.service';
import { createClientRequestsRepository } from './modules/analyses/client-requests.repository';
import { createEntriesRepository } from './modules/analyses/entries.repository';

const REQUEST_BODY_LIMIT = '32mb';

export const createApp = (database: SqliteDatabase) => {
  const service = createAnalysesService({
    analyses: createAnalysesRepository(database),
    entries: createEntriesRepository(database),
    clientRequests: createClientRequestsRepository(database),
    runInTransaction: createTransactionRunner(database),
  });
  const controller = createAnalysesController(service);

  return express()
    .use(express.json({ limit: REQUEST_BODY_LIMIT }))
    .get('/api/health', (_request, response) => {
      response.json({ status: 'ok' });
    })
    .use('/api/analyses', createAnalysesRouter(controller))
    .use(notFoundHandler)
    .use(errorHandler);
};
