import { createUuid } from '../../../shared/utils/uuid';

const LOCAL_ID_PREFIX = 'local-';

export const createLocalAnalysisId = (): string => `${LOCAL_ID_PREFIX}${createUuid()}`;

export const isLocalAnalysisId = (id: string): boolean => id.startsWith(LOCAL_ID_PREFIX);
