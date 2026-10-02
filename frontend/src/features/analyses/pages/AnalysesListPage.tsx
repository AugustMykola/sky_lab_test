import { PageHeader } from '../../../shared/components/PageHeader';
import { EmptyState, ErrorState } from '../../../shared/components/PageStates';
import { DeleteAnalysisDialog } from '../components/DeleteAnalysisDialog';
import { AnalysesGrid } from '../components/history/AnalysesGrid';
import { NewAnalysisButton } from '../components/history/NewAnalysisButton';
import { DeleteLocalAnalysisDialog } from '../components/local/DeleteLocalAnalysisDialog';
import { PendingAnalysesSection } from '../components/local/PendingAnalysesSection';
import { AnalysesGridSkeleton } from '../components/skeletons/AnalysesGridSkeleton';
import { useAnalysesList } from '../hooks/useAnalysesList';

type AnalysesListViewModel = ReturnType<typeof useAnalysesList>;

const ServerAnalyses = ({ analyses, pending, loading, error, reload, deletion }: AnalysesListViewModel) => {
  if (loading) return <AnalysesGridSkeleton />;
  if (error) return <ErrorState message={error.message} onRetry={reload} />;
  if (analyses.length === 0 && pending.length === 0) {
    return (
      <EmptyState
        title="No analyses yet"
        description="Upload or paste a server log to get your first report."
        action={<NewAnalysisButton />}
      />
    );
  }
  return <AnalysesGrid analyses={analyses} canDelete={deletion.available} onDelete={deletion.request} />;
};

export const AnalysesListPage = () => {
  const viewModel = useAnalysesList();
  const hasAnyAnalysis = viewModel.analyses.length > 0 || viewModel.pending.length > 0;

  return (
    <>
      <PageHeader
        title="Analyses"
        subtitle="History of your log analyses"
        actions={hasAnyAnalysis && <NewAnalysisButton />}
      />
      {viewModel.pending.length > 0 && (
        <PendingAnalysesSection
          pending={viewModel.pending}
          onRetry={viewModel.retryUpload}
          onDelete={viewModel.localDeletion.request}
        />
      )}
      <ServerAnalyses {...viewModel} />
      <DeleteAnalysisDialog deletion={viewModel.deletion} />
      <DeleteLocalAnalysisDialog deletion={viewModel.localDeletion} />
    </>
  );
};
