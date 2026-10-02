import { useState } from 'react';
import type { AnalysisCounts } from '../../../api/types';
import { EmptyState } from '../../../shared/components/PageStates';
import { AnalysisHeader, BackToHistoryButton } from '../components/details/AnalysisHeader';
import { AnalysisTabContent } from '../components/details/AnalysisTabContent';
import { AnalysisTab, AnalysisTabs } from '../components/details/AnalysisTabs';
import { SummaryStats } from '../components/details/SummaryStats';
import { DeleteLocalAnalysisDialog } from '../components/local/DeleteLocalAnalysisDialog';
import { SyncStatusBanner } from '../components/local/SyncStatusBanner';
import { AnalysisDetailsSkeleton } from '../components/skeletons/AnalysisDetailsSkeleton';
import { useLocalAnalysis } from '../hooks/useLocalAnalysis';
import { SyncStatus } from '../store/outbox.store';

export const LocalAnalysisDetails = ({ localId }: { localId: string }) => {
  const viewModel = useLocalAnalysis(localId);
  const [tab, setTab] = useState(AnalysisTab.Entries);

  if (viewModel.loading) return <AnalysisDetailsSkeleton />;
  if (!viewModel.pending) {
    return (
      <>
        <BackToHistoryButton />
        <EmptyState title="Analysis not found" description="It may have been deleted from this device." />
      </>
    );
  }

  const { pending } = viewModel;
  const counts: AnalysisCounts = pending.summary;

  return (
    <>
      <AnalysisHeader
        analysis={pending}
        canDelete={pending.status !== SyncStatus.Syncing}
        onDelete={() => viewModel.deletion.request(localId)}
      />
      <SyncStatusBanner pending={pending} onRetry={viewModel.retry} />
      <SummaryStats counts={counts} />
      <AnalysisTabs value={tab} counts={counts} onChange={setTab} />
      <AnalysisTabContent tab={tab} analysisId={localId} summary={pending.summary} onRetry={viewModel.retry} />
      <DeleteLocalAnalysisDialog deletion={viewModel.deletion} />
    </>
  );
};
