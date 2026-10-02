interface HydratableState {
  hasHydrated: boolean;
}

interface HydratableStore<State extends HydratableState> {
  getState: () => State;
  subscribe: (listener: (state: State) => void) => () => void;
}

export const waitForHydration = <State extends HydratableState>(store: HydratableStore<State>): Promise<void> =>
  store.getState().hasHydrated
    ? Promise.resolve()
    : new Promise((resolve) => {
        const unsubscribe = store.subscribe((state) => {
          if (!state.hasHydrated) return;
          unsubscribe();
          resolve();
        });
      });
