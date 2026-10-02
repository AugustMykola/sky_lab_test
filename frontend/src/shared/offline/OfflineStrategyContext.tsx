import { createContext, useContext, type ReactNode } from 'react';
import type { OfflineStrategy } from './offlineStrategy';

const OfflineStrategyContext = createContext<OfflineStrategy | undefined>(undefined);

export const OfflineStrategyProvider = ({ strategy, children }: { strategy: OfflineStrategy; children: ReactNode }) => (
  <OfflineStrategyContext.Provider value={strategy}>{children}</OfflineStrategyContext.Provider>
);

export const useOfflineStrategy = (): OfflineStrategy => {
  const strategy = useContext(OfflineStrategyContext);
  if (!strategy) throw new Error('useOfflineStrategy must be used inside OfflineStrategyProvider');
  return strategy;
};
