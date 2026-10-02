import { create } from 'zustand';

interface ConnectivityState {
  online: boolean;
}

const useConnectivityStore = create<ConnectivityState>()(() => ({ online: navigator.onLine }));

window.addEventListener('online', () => useConnectivityStore.setState({ online: true }));
window.addEventListener('offline', () => useConnectivityStore.setState({ online: false }));

export const useIsOnline = () => useConnectivityStore((state) => state.online);
