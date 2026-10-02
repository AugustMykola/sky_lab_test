import { useEffect } from 'react';
import { ApiError, ApiErrorCode } from '../../../api/ApiError';
import { useIsOnline } from '../../../shared/connectivity/connectivity.store';
import { useAnalysesStore } from '../store/analyses.store';
import { useOutboxStore } from '../store/outbox.store';
import { useDeleteAnalysis } from './useDeleteAnalysis';
import { useDeleteLocalAnalysis } from './useDeleteLocalAnalysis';

const OFFLINE_WITHOUT_CACHE = new ApiError(0, ApiErrorCode.NetworkError, 'You are offline and there is no saved history yet.');

interface ListState {
  hasHydrated: boolean;
  hasLoadedList: boolean;
  online: boolean;
  hasPending: boolean;
  listError?: ApiError;
}

const toListError = ({ hasHydrated, hasLoadedList, online, hasPending, listError }: ListState): ApiError | undefined => {
  if (!hasHydrated || hasLoadedList) return undefined;
  if (!online) return hasPending ? undefined : OFFLINE_WITHOUT_CACHE;
  return listError;
};

const isListLoading = ({ hasHydrated, hasLoadedList, online, listError }: ListState): boolean =>
  !hasHydrated || (!hasLoadedList && online && !listError);

export const useAnalysesList = () => {
  const analyses = useAnalysesStore((state) => state.list);
  const listError = useAnalysesStore((state) => state.listError);
  const hasLoadedList = useAnalysesStore((state) => state.hasLoadedList);
  const hasHydrated = useAnalysesStore((state) => state.hasHydrated);
  const loadList = useAnalysesStore((state) => state.loadList);
  const pending = useOutboxStore((state) => state.items);
  const retryUpload = useOutboxStore((state) => state.retry);
  const deletion = useDeleteAnalysis();
  const localDeletion = useDeleteLocalAnalysis();
  const online = useIsOnline();

  useEffect(() => {
    if (online) void loadList();
  }, [loadList, online]);

  const listState: ListState = { hasHydrated, hasLoadedList, online, hasPending: pending.length > 0, listError };

  return {
    analyses,
    pending,
    loading: isListLoading(listState),
    error: toListError(listState),
    reload: loadList,
    deletion,
    localDeletion,
    retryUpload,
  };
};
