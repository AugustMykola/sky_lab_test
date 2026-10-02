import { useState } from 'react';
import { toApiError } from '../../../api/ApiError';
import { useIsOnline } from '../../../shared/connectivity/connectivity.store';
import { useNotificationsStore } from '../../../shared/notifications/notifications.store';
import { useAnalysesStore } from '../store/analyses.store';

interface DeleteTarget {
  id: string;
  name: string;
}

export const useDeleteAnalysis = ({ onDeleted }: { onDeleted?: () => void } = {}) => {
  const deleteAnalysis = useAnalysesStore((state) => state.deleteAnalysis);
  const notify = useNotificationsStore((state) => state.notify);
  const online = useIsOnline();

  const [target, setTarget] = useState<DeleteTarget>();
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string>();

  const confirm = async () => {
    if (!target) return;
    setDeleting(true);
    setError(undefined);
    try {
      await deleteAnalysis(target.id);
      notify(`"${target.name}" deleted`);
      setTarget(undefined);
      onDeleted?.();
    } catch (caughtError) {
      setError(toApiError(caughtError).message);
    } finally {
      setDeleting(false);
    }
  };

  return {
    available: online,
    target,
    deleting,
    error,
    request: (analysis: DeleteTarget) => {
      setError(undefined);
      setTarget(analysis);
    },
    cancel: () => setTarget(undefined),
    confirm,
  };
};

export type DeleteAnalysisViewModel = ReturnType<typeof useDeleteAnalysis>;
