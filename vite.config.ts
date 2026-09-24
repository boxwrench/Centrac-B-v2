import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: '/Centrac-B-v2/',
  server: {
    port: 3000,
    host: '0.0.0.0',
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      includeAssets: ['icon.svg'],
      workbox: {
        // mjs/json/pdf precache the O&M manual reader (worker, search
        // index, optimized IOM) so it works offline at the pump skid.
        globPatterns: ['**/*.{js,mjs,css,html,json,pdf,svg,png,ico,woff,woff2}'],
      },
      manifest: {
        name: 'Centrac B Field Toolkit',
        short_name: 'Centrac B',
        description: 'Offline 3D explorer, O&M manual and field toolkit for Centrac B metering pumps',
        start_url: '/Centrac-B-v2/',
        scope: '/Centrac-B-v2/',
        display: 'standalone',
        background_color: '#0f172a',
        theme_color: '#0f172a',
        icons: [
          { src: 'pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
});
