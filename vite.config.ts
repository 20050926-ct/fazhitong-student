import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import type { Plugin } from 'vite';
import { defineConfig } from 'vite';
import { applyUnityWebglBuildHeaders } from './server/unityWebGlBuildHeaders';

/** When running `vite` without `server.ts`, Unity .gz assets still need Content-Encoding. */
function unityWebglCourtHeadersPlugin(): Plugin {
  return {
    name: 'unity-webgl-court-headers',
    enforce: 'pre',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const pathname = (req.url ?? '').split('?')[0] ?? '';
        if (!pathname.startsWith('/court-3d/')) return next();
        applyUnityWebglBuildHeaders(res, pathname);
        next();
      });
    },
  };
}

export default defineConfig(() => ({
    plugins: [unityWebglCourtHeadersPlugin(), react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify — file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      headers: {
        // Helps Unity WebGL / iframes that use Screen Orientation API (see GamePlayer court flow).
        'Permissions-Policy': 'screen-orientation=*, fullscreen=*',
      },
    },
}));
