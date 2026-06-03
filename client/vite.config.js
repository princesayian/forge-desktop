import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: '../static',
    emptyOutDir: false,
  },
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:5000',
      '/vendor': 'http://localhost:5000',
    },
  },
});
