import type { RequestHandler } from 'express';
import { createAnalysisSchema, entriesQuerySchema, idParamsSchema } from './analyses.schemas';
import type { AnalysesService } from './analyses.service';

export const createAnalysesController = (service: AnalysesService) => {
  const list: RequestHandler = (_request, response) => {
    response.set('Cache-Control', 'no-cache').json(service.list());
  };

  const create: RequestHandler = (request, response) => {
    const { analysis, created } = service.create(createAnalysisSchema.parse(request.body));
    response.status(created ? 201 : 200).json(analysis);
  };

  const getById: RequestHandler = (request, response) => {
    const { id } = idParamsSchema.parse(request.params);
    response.json(service.getById(id));
  };

  const getEntries: RequestHandler = (request, response) => {
    const { id } = idParamsSchema.parse(request.params);
    const { level, q: search, sort, page, pageSize } = entriesQuerySchema.parse(request.query);
    response.json(service.getEntries(id, { levels: level, search, sort, page, pageSize }));
  };

  const remove: RequestHandler = (request, response) => {
    const { id } = idParamsSchema.parse(request.params);
    service.remove(id);
    response.status(204).end();
  };

  return { list, create, getById, getEntries, remove };
};

export type AnalysesController = ReturnType<typeof createAnalysesController>;
