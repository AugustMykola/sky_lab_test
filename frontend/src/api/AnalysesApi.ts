import * as zod from 'zod';
import { BaseApiClient } from './BaseApiClient';
import {
  analysisListItemSchema,
  analysisSchema,
  entriesPageSchema,
  type Analysis,
  type AnalysisListItem,
  type CreateAnalysisPayload,
  type EntriesPage,
  type EntriesQuery,
} from './types';

const analysisPath = (id: string) => `/analyses/${encodeURIComponent(id)}`;

const API_BASE_URL = import.meta.env.VITE_API_URL ?? '/api';

export class AnalysesApi extends BaseApiClient {
  constructor(baseUrl: string) {
    super(baseUrl);
  }

  list(): Promise<AnalysisListItem[]> {
    return this.get('/analyses', zod.array(analysisListItemSchema));
  }

  getById(id: string): Promise<Analysis> {
    return this.get(analysisPath(id), analysisSchema);
  }

  getEntries(id: string, { levels, search, sort, page, pageSize }: EntriesQuery, signal?: AbortSignal): Promise<EntriesPage> {
    return this.get(`${analysisPath(id)}/entries`, entriesPageSchema, {
      signal,
      query: { level: levels.join(','), q: search, sort, page, pageSize },
    });
  }

  create(payload: CreateAnalysisPayload): Promise<Analysis> {
    return this.post('/analyses', payload, analysisSchema);
  }

  remove(id: string): Promise<void> {
    return this.delete(analysisPath(id));
  }
}

export const analysesApi = new AnalysesApi(API_BASE_URL);
