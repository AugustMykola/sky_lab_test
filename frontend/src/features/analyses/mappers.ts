import type { Analysis, AnalysisListItem } from '../../api/types';

export const toListItem = ({ id, name, createdAt, summary }: Analysis): AnalysisListItem => ({
  id,
  name,
  createdAt,
  totalEntries: summary.totalEntries,
  invalidCount: summary.invalidCount,
  levelCounts: summary.levelCounts,
});
