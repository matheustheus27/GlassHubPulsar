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
      // Deixa o clientPort dinâmico/automático para funcionar tanto na porta 80 quanto na 3000
      path: '/@vite/client',
    },
  },
  assetsInclude: ['**/*.svg', '**/*.csv'],
});