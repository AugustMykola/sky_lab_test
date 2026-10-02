import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { DeleteAnalysisDialog } from '../components/DeleteAnalysisDialog';
import { AnalysisHeader, BackToHistoryButton } from '../components/details/AnalysisHeader';
import { AnalysisTabContent, AnalysisUnavailable } from '../components/details/AnalysisTabContent';
import { AnalysisTab, AnalysisTabs } from '../components/details/AnalysisTabs';
import { SummaryStats } from '../components/details/SummaryStats';
import { AnalysisDetailsSkeleton } from '../components/skeletons/AnalysisDetailsSkeleton';
import { useAnalysis } from '../hooks/useAnalysis';
import { isLocalAnalysisId } from '../local/localAnalysisId';
import { LocalAnalysisDetails } from './LocalAnalysisDetails';

const AnalysisDetails = ({ id }: { id: string }) => {
  const { overview, summary, error, reload, deletion } = useAnalysis(id);
  const [tab, setTab] = useState(AnalysisTab.Entries);

  if (error && !overview) {
    return (
      <>
        <BackToHistoryButton />
        <AnalysisUnavailable error={error} onRetry={reload} />
      </>
    );
  }
  if (!overview) return <AnalysisDetailsSkeleton />;

  return (
    <>
      <AnalysisHeader analysis={overview} canDelete={deletion.available} onDelete={() => deletion.request(overview)} />
      <SummaryStats counts={overview} />
      <AnalysisTabs value={tab} counts={overview} onChange={setTab} />
      <AnalysisTabContent tab={tab} analysisId={overview.id} summary={summary} summaryError={error} onRetry={reload} />
      <DeleteAnalysisDialog deletion={deletion} />
    </>
  );
};

export const AnalysisDetailsPage = () => {
  const { id = '' } = useParams();
  return isLocalAnalysisId(id) ? <LocalAnalysisDetails key={id} localId={id} /> : <AnalysisDetails key={id} id={id} />;
};
