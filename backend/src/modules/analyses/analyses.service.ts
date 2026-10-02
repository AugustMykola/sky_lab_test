import { randomUUID } from 'node:crypto';
import { analyze, NO_VALID_LOG_LINES_MESSAGE, parseLog } from '@log-analyzer/domain';
import dayjs, { type Dayjs } from 'dayjs';
import type { RunInTransaction } from '../../database/transaction';
import { notFound, unprocessable } from '../../http/app-error';
import type {
  Analysis,
  AnalysesRepository,
  ClientRequestsRepository,
  EntriesQuery,
  EntriesRepository,
} from './analyses.types';

export interface AnalysesServiceDependencies {
  analyses: AnalysesRepository;
  entries: EntriesRepository;
  clientRequests: ClientRequestsRepository;
  runInTransaction: RunInTransaction;
  generateId?: () => string;
  now?: () => Dayjs;
}

export interface CreateAnalysisCommand {
  name: string;
  content: string;
  clientId?: string;
  createdAt?: string;
}

export interface CreateAnalysisResult {
  analysis: Analysis;
  created: boolean;
}

const analysisNotFound = (id: string) => notFound(`Analysis ${id} not found`);

export const createAnalysesService = ({
  analyses,
  entries,
  clientRequests,
  runInTransaction,
  generateId = randomUUID,
  now = () => dayjs(),
}: AnalysesServiceDependencies) => {
  const getById = (id: string): Analysis => {
    const analysis = analyses.findById(id);
    if (!analysis) throw analysisNotFound(id);
    return analysis;
  };

  const notLaterThanNow = (createdAt: string | undefined): string => {
    const serverNow = now();
    if (createdAt === undefined) return serverNow.toISOString();
    const clientTime = dayjs(createdAt);
    return clientTime.isAfter(serverNow) ? serverNow.toISOString() : clientTime.toISOString();
  };

  const findPreviousResult = (clientId: string | undefined): Analysis | undefined => {
    const previousAnalysisId = clientId === undefined ? undefined : clientRequests.findAnalysisId(clientId);
    return previousAnalysisId === undefined ? undefined : analyses.findById(previousAnalysisId);
  };

  const create = ({ name, content, clientId, createdAt }: CreateAnalysisCommand): CreateAnalysisResult => {
    const previous = findPreviousResult(clientId);
    if (previous) return { analysis: previous, created: false };

    const parsed = parseLog(content);
    if (parsed.entries.length === 0) throw unprocessable(NO_VALID_LOG_LINES_MESSAGE);

    const analysis: Analysis = {
      id: generateId(),
      name,
      createdAt: notLaterThanNow(createdAt),
      summary: analyze(parsed),
    };
    runInTransaction(() => {
      analyses.create(analysis);
      entries.insertMany(analysis.id, parsed.entries);
      if (clientId !== undefined) clientRequests.save(clientId, analysis.id);
    });
    return { analysis, created: true };
  };

  const getEntries = (id: string, query: EntriesQuery) => {
    if (!analyses.exists(id)) throw analysisNotFound(id);
    return entries.findPage(id, query);
  };

  const remove = (id: string): void => {
    if (!analyses.delete(id)) throw analysisNotFound(id);
  };

  return { create, getById, getEntries, remove, list: () => analyses.list() };
};

export type AnalysesService = ReturnType<typeof createAnalysesService>;
