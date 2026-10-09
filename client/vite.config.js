import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

const clientDirectory = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  server: {
    host: '0.0.0.0',
    allowedHosts: ['.sg2.manus.computer'],
    fs: {
      // The canonical location catalogue is shared by the Express API and React client.
      allow: [path.resolve(clientDirectory, '..')],
    },
    proxy: {
      '/api': {
        target: process.env.CAMPUSFIX_API_PROXY || 'http://127.0.0.1:5000',
        changeOrigin: true,
      },
    },
  },
});
