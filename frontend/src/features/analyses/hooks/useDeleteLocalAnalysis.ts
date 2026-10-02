import { useState } from 'react';
import { SyncStatus, useOutboxStore } from '../store/outbox.store';

export const useDeleteLocalAnalysis = ({ onDeleted }: { onDeleted?: () => void } = {}) => {
  const deleteLocal = useOutboxStore((state) => state.deleteLocal);
  const [targetId, setTargetId] = useState<string>();
  const target = useOutboxStore((state) => state.items.find((item) => item.localId === targetId));
  const uploading = target?.status === SyncStatus.Syncing;

  const confirm = () => {
    if (targetId === undefined) return;
    if (deleteLocal(targetId)) onDeleted?.();
    setTargetId(undefined);
  };

  return {
    target: uploading ? undefined : target,
    request: (localId: string) => setTargetId(localId),
    cancel: () => setTargetId(undefined),
    confirm,
  };
};

export type DeleteLocalAnalysisViewModel = ReturnType<typeof useDeleteLocalAnalysis>;
