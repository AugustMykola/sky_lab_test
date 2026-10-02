export enum OfflineMode {
  InstalledApp = 'installed-app',
  OpenTabOnly = 'open-tab-only',
}

export interface OfflineStrategy {
  mode: OfflineMode;
  start: () => void;
  offlineNotice: string;
}

export interface BrowserCapabilities {
  secureContext: boolean;
  serviceWorkerSupported: boolean;
}

interface OfflineStrategyDependencies {
  registerServiceWorker: () => void;
}

const OFFLINE_NOTICE = 'You are offline. Saved data is shown, new analyses run on this device and upload when you reconnect.';

const createInstalledAppStrategy = ({ registerServiceWorker }: OfflineStrategyDependencies): OfflineStrategy => ({
  mode: OfflineMode.InstalledApp,
  start: registerServiceWorker,
  offlineNotice: OFFLINE_NOTICE,
});

const OPEN_TAB_ONLY_STRATEGY: OfflineStrategy = {
  mode: OfflineMode.OpenTabOnly,
  start: () => undefined,
  offlineNotice: `${OFFLINE_NOTICE} Keep this tab open: without HTTPS the app cannot be reopened while offline.`,
};

export const detectBrowserCapabilities = (): BrowserCapabilities => ({
  secureContext: window.isSecureContext,
  serviceWorkerSupported: 'serviceWorker' in navigator,
});

export const selectOfflineStrategy = (
  { secureContext, serviceWorkerSupported }: BrowserCapabilities,
  dependencies: OfflineStrategyDependencies,
): OfflineStrategy =>
  secureContext && serviceWorkerSupported ? createInstalledAppStrategy(dependencies) : OPEN_TAB_ONLY_STRATEGY;
