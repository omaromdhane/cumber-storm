import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { viteSingleFile } from 'vite-plugin-singlefile';
import tailwindcss from '@tailwindcss/vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [tailwindcss(), react(), viteSingleFile()],
  build: {
    outDir: path.resolve(__dirname, '../../src/core/dist/html-reporter-template'),
    emptyOutDir: true,
  },
  define: {
    global: 'globalThis',
    'process.env': {}
  },
})
