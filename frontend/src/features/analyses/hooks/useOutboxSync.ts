import { useEffect } from 'react';
import { useIsOnline } from '../../../shared/connectivity/connectivity.store';
import { useOutboxStore } from '../store/outbox.store';

export const useOutboxSync = () => {
  const online = useIsOnline();
  const sync = useOutboxStore((state) => state.sync);

  useEffect(() => {
    if (online) void sync();
  }, [online, sync]);
};
