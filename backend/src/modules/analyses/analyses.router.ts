import { Router } from 'express';
import type { AnalysesController } from './analyses.controller';

export const createAnalysesRouter = (controller: AnalysesController): Router =>
  Router()
    .get('/', controller.list)
    .post('/', controller.create)
    .get('/:id', controller.getById)
    .get('/:id/entries', controller.getEntries)
    .delete('/:id', controller.remove);
