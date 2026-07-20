import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';

/**
 * Portable single-file build.
 *
 * Emits ONE self-contained `dist-single/index.html` with all JavaScript, CSS,
 * fonts and icons inlined as text / data-URIs. It opens by double-clicking the
 * file, runs fully offline, and needs no server, hosting, or install step —
 * copy it to a tablet or USB stick and open it.
 *
 * The regular installable-PWA / GitHub-Pages build still lives in
 * `vite.config.ts` (`npm run build`). This config is used by `npm run build:single`.
 */
export default defineConfig({
  // Relative paths so the file works from any folder or from file://.
  base: './',
  plugins: [react(), viteSingleFile()],
  build: {
    outDir: 'dist-single',
    // Inline every asset (web fonts, svg icons) as data URIs so nothing is fetched.
    assetsInlineLimit: 100_000_000,
    cssCodeSplit: false,
    // One inlined bundle is large by design; silence the size warning.
    chunkSizeWarningLimit: 100_000,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
});
