import { create } from 'zustand';

interface Notification {
  id: number;
  message: string;
}

interface NotificationsState {
  current?: Notification;
  open: boolean;
  notify: (message: string) => void;
  dismiss: () => void;
}

export const useNotificationsStore = create<NotificationsState>()((set) => ({
  current: undefined,
  open: false,
  notify: (message) => set((state) => ({ current: { id: (state.current?.id ?? 0) + 1, message }, open: true })),
  dismiss: () => set({ open: false }),
}));
