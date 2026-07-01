import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Builds the React app into /dist. The Cloudflare Worker (src/worker/index.js)
// serves these static assets and handles /api/* routes.
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
  server: {
    // Honour the PORT env (the preview harness assigns one) and fall back to 5173.
    port: Number(process.env.PORT) || 5173,
    strictPort: false,
    // Proxy API calls to the local Wrangler dev server during development.
    proxy: {
      '/api': 'http://127.0.0.1:8787',
    },
  },
});
