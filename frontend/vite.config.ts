import { defineConfig } from 'vite';
import path from 'path';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
    // Permite que o Nginx/Docker faça o repasse sem disparar erro de Host bloqueado
    allowedHosts: true,
    watch: {
      usePolling: true,
    },
    hmr: {
      host: 'localhost',
      port: 5173,
      clientPort: 5173,
    },
  },
  assetsInclude: ['**/*.svg', '**/*.csv'],
});