import { ConfirmDialog } from '../../../../shared/components/ConfirmDialog';
import type { DeleteLocalAnalysisViewModel } from '../../hooks/useDeleteLocalAnalysis';

export const DeleteLocalAnalysisDialog = ({ deletion }: { deletion: DeleteLocalAnalysisViewModel }) => (
  <ConfirmDialog
    open={deletion.target !== undefined}
    title="Delete analysis?"
    description={`"${deletion.target?.name ?? ''}" has not been uploaded yet. Deleting it removes it from this device for good.`}
    confirmLabel="Delete"
    onConfirm={deletion.confirm}
    onClose={deletion.cancel}
  />
);
