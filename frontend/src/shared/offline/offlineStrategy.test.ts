import { describe, expect, it, vi } from 'vitest';
import { OfflineMode, selectOfflineStrategy } from './offlineStrategy';

describe('selectOfflineStrategy', () => {
  it('uses the installed-app strategy over HTTPS and registers the service worker on start', () => {
    const registerServiceWorker = vi.fn();
    const strategy = selectOfflineStrategy({ secureContext: true, serviceWorkerSupported: true }, { registerServiceWorker });

    strategy.start();

    expect(strategy.mode).toBe(OfflineMode.InstalledApp);
    expect(registerServiceWorker).toHaveBeenCalledTimes(1);
  });

  it.each([
    ['plain HTTP', { secureContext: false, serviceWorkerSupported: false }],
    ['a browser without service workers', { secureContext: true, serviceWorkerSupported: false }],
  ])('falls back to the open-tab-only strategy on %s and never registers a worker', (_caseName, capabilities) => {
    const registerServiceWorker = vi.fn();
    const strategy = selectOfflineStrategy(capabilities, { registerServiceWorker });

    strategy.start();

    expect(strategy.mode).toBe(OfflineMode.OpenTabOnly);
    expect(strategy.offlineNotice).toContain('Keep this tab open');
    expect(registerServiceWorker).not.toHaveBeenCalled();
  });
});
