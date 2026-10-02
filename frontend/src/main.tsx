import { CssBaseline, ThemeProvider } from '@mui/material';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { registerSW } from 'virtual:pwa-register';
import { router } from './app/router';
import { theme } from './app/theme';
import { detectBrowserCapabilities, selectOfflineStrategy } from './shared/offline/offlineStrategy';
import { OfflineStrategyProvider } from './shared/offline/OfflineStrategyContext';

const offlineStrategy = selectOfflineStrategy(detectBrowserCapabilities(), {
  registerServiceWorker: () => void registerSW({ immediate: true }),
});
offlineStrategy.start();

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Root element #root not found');

createRoot(rootElement).render(
  <StrictMode>
    <OfflineStrategyProvider strategy={offlineStrategy}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <RouterProvider router={router} />
      </ThemeProvider>
    </OfflineStrategyProvider>
  </StrictMode>,
);
