import { ConfirmDialog } from '../../../shared/components/ConfirmDialog';
import type { DeleteAnalysisViewModel } from '../hooks/useDeleteAnalysis';

export const DeleteAnalysisDialog = ({ deletion }: { deletion: DeleteAnalysisViewModel }) => (
  <ConfirmDialog
    open={Boolean(deletion.target)}
    title="Delete analysis?"
    description={`"${deletion.target?.name ?? ''}" and all its entries will be permanently deleted.`}
    confirmLabel="Delete"
    loading={deletion.deleting}
    error={deletion.error}
    onConfirm={deletion.confirm}
    onClose={deletion.cancel}
  />
);
