import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: '../backend/public',
    emptyOutDir: true,
  },
  server: {
    proxy: {
      '/api': 'http://localhost:3002',
      '/health': 'http://localhost:3002',
      '/status': 'http://localhost:3002',
      '/metrics': 'http://localhost:3002',
    },
  },
});
