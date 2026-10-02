import { useCallback, useEffect, useState, type DependencyList } from 'react';
import { toApiError, type ApiError } from '../../api/ApiError';

interface RequestSnapshot<T> {
  data: T | undefined;
  error: ApiError | undefined;
  loading: boolean;
}

interface RequestState<T> extends RequestSnapshot<T> {
  reload: () => void;
}

export const useRequest = <T>(
  fetcher: (signal: AbortSignal) => Promise<T>,
  dependencies: DependencyList,
): RequestState<T> => {
  const [state, setState] = useState<RequestSnapshot<T>>({ data: undefined, error: undefined, loading: true });
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setState((previousState) => ({ ...previousState, error: undefined, loading: true }));

    fetcher(controller.signal).then(
      (data) => !controller.signal.aborted && setState({ data, error: undefined, loading: false }),
      (caughtError: unknown) =>
        !controller.signal.aborted && setState((previousState) => ({ ...previousState, error: toApiError(caughtError), loading: false })),
    );

    return () => controller.abort();
  }, [...dependencies, reloadKey]);

  const reload = useCallback(() => setReloadKey((key) => key + 1), []);

  return { ...state, reload };
};
