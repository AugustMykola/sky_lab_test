import { LIKE_WILDCARDS_PATTERN } from '../../constants/patterns';
import { UNICODE_LOWER_FUNCTION } from '../../database/database';
import type { EntriesFilter } from './analyses.types';

type SqlParameter = string | number;

interface SqlCondition {
  sql: string;
  parameters: SqlParameter[];
}

export interface SqlWhere {
  where: string;
  parameters: SqlParameter[];
}

export const escapeLike = (value: string): string => value.replace(LIKE_WILDCARDS_PATTERN, (wildcard) => `\\${wildcard}`);

const byAnalysis = (analysisId: string): SqlCondition => ({ sql: 'analysis_id = ?', parameters: [analysisId] });

const byLevels = (levels: readonly string[]): SqlCondition[] =>
  levels.length > 0 ? [{ sql: `level IN (${levels.map(() => '?').join(', ')})`, parameters: [...levels] }] : [];

const bySearch = (search: string): SqlCondition[] =>
  search !== ''
    ? [
        {
          sql: `${UNICODE_LOWER_FUNCTION}(message) LIKE ? ESCAPE '\\'`,
          parameters: [`%${escapeLike(search.toLowerCase())}%`],
        },
      ]
    : [];

export const buildEntriesWhere = (analysisId: string, { levels, search }: EntriesFilter): SqlWhere => {
  const conditions = [byAnalysis(analysisId), ...byLevels(levels), ...bySearch(search)];
  return {
    where: conditions.map(({ sql }) => sql).join(' AND '),
    parameters: conditions.flatMap(({ parameters }) => parameters),
  };
};
