import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOutboxStore } from '../store/outbox.store';
import { useDeleteLocalAnalysis } from './useDeleteLocalAnalysis';

export const useLocalAnalysis = (localId: string) => {
  const navigate = useNavigate();
  const pending = useOutboxStore((state) => state.items.find((item) => item.localId === localId));
  const syncedId = useOutboxStore((state) => state.syncedIds[localId]);
  const hasHydrated = useOutboxStore((state) => state.hasHydrated);
  const retry = useOutboxStore((state) => state.retry);
  const deletion = useDeleteLocalAnalysis({ onDeleted: () => navigate('/analyses', { replace: true }) });

  useEffect(() => {
    if (syncedId) navigate(`/analyses/${syncedId}`, { replace: true });
  }, [syncedId, navigate]);

  return {
    pending,
    loading: !hasHydrated || Boolean(syncedId),
    deletion,
    retry: () => retry(localId),
  };
};
