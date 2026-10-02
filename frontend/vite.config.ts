import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

const THEME_COLOR = '#3b5bdb';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/icon.svg', 'icons/apple-touch-icon.png'],
      manifest: {
        name: 'Log Analyzer',
        short_name: 'Log Analyzer',
        description: 'Upload server logs and explore levels, errors and entries.',
        theme_color: THEME_COLOR,
        background_color: '#f6f7fb',
        display: 'standalone',
        start_url: '/analyses',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html}'],
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api\//],
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
      },
    }),
  ],
  resolve: {
    alias: {
      '@log-analyzer/domain': fileURLToPath(new URL('../packages/log-domain/src/index.ts', import.meta.url)),
    },
  },
  server: {
    port: 5173,
    proxy: { '/api': process.env.VITE_API_PROXY ?? 'http://localhost:3000' },
  },
});
