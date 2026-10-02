import { Button } from '@mui/material';
import { EmptyState, ErrorState } from '../../../../shared/components/PageStates';
import { TableSkeleton } from '../../../../shared/components/skeletons/TableSkeleton';
import { useEntries, type EntriesViewModel } from '../../hooks/useEntries';
import { EntriesFilters } from '../filters/EntriesFilters';
import { EntriesTable } from './EntriesTable';

const EntriesContent = (viewModel: EntriesViewModel) => {
  if (viewModel.error && viewModel.offline) {
    return <ErrorState message="This page of entries is not saved for offline use. Reconnect to load it." />;
  }
  if (viewModel.error) return <ErrorState message={viewModel.error.message} onRetry={viewModel.reload} />;
  if (viewModel.loading && viewModel.entries.length === 0) return <TableSkeleton rows={8} columns={4} />;
  if (viewModel.total === 0) {
    return (
      <EmptyState
        title="No entries match"
        description="Try a different search or level filter."
        action={viewModel.hasActiveFilters && <Button onClick={viewModel.resetFilters}>Reset filters</Button>}
      />
    );
  }
  return <EntriesTable {...viewModel} />;
};

export const EntriesPanel = ({ analysisId }: { analysisId: string }) => {
  const viewModel = useEntries(analysisId);

  return (
    <>
      <EntriesFilters {...viewModel} />
      <EntriesContent {...viewModel} />
    </>
  );
};
