import { defineConfig } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(), // Official v4 plugin handling everything natively
  ],
  resolve: {
    alias: {
      // Create @ shortcut for src folder
      '@': path.resolve(__dirname, './src'),
    },
  },
  // Maintain support for asset file types you need
  assetsInclude: ['**/*.svg', '**/*.csv'],
})