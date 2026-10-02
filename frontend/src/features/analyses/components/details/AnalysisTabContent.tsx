import type { ApiError } from '../../../../api/ApiError';
import type { AnalysisSummary } from '../../../../api/types';
import { useIsOnline } from '../../../../shared/connectivity/connectivity.store';
import { ErrorState } from '../../../../shared/components/PageStates';
import { TableSkeleton } from '../../../../shared/components/skeletons/TableSkeleton';
import { EntriesPanel } from '../entries/EntriesPanel';
import { AnalysisTab } from './AnalysisTabs';
import { ErrorStatsTable } from './ErrorStatsTable';
import { InvalidLinesList } from './InvalidLinesList';

export const AnalysisUnavailable = ({ error, onRetry }: { error: ApiError; onRetry: () => void }) => {
  const online = useIsOnline();
  if (!online) return <ErrorState message="This analysis is not saved for offline use. Reconnect to load it." />;
  return <ErrorState message={error.message} onRetry={error.isClientError ? undefined : onRetry} />;
};

interface AnalysisTabContentProps {
  tab: AnalysisTab;
  analysisId: string;
  summary?: AnalysisSummary;
  summaryError?: ApiError;
  onRetry: () => void;
}

export const AnalysisTabContent = ({ tab, analysisId, summary, summaryError, onRetry }: AnalysisTabContentProps) => {
  if (tab === AnalysisTab.Entries) return <EntriesPanel analysisId={analysisId} />;
  if (!summary && summaryError) return <AnalysisUnavailable error={summaryError} onRetry={onRetry} />;
  if (!summary) return <TableSkeleton rows={5} columns={tab === AnalysisTab.Errors ? 5 : 1} />;
  if (tab === AnalysisTab.Errors) {
    return <ErrorStatsTable stats={summary.errorStats} groupCount={summary.errorGroupCount} />;
  }
  return <InvalidLinesList lines={summary.invalidSample} total={summary.invalidCount} />;
};
