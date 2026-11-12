import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import monacoEditorPlugin from 'vite-plugin-monaco-editor';
import path from 'path';

export default defineConfig({
  plugins: [
    react(),
    monacoEditorPlugin({
      languageWorkers: ['editorWorkerService', 'typescript'],
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@wokvi/shared': path.resolve(__dirname, '../shared/src'),
      '@wokvi/components': path.resolve(__dirname, '../components/src'),
    },
  },
  server: {
    port: 3000,
    host: true,
  },
  build: {
    target: 'esnext',
    minify: 'esbuild',
  },
  optimizeDeps: {
    include: ['monaco-editor', 'three', 'yjs'],
  },
});