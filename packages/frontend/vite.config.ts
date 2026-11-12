import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import monacoEditorPlugin from 'vite-plugin-monaco-editor';
import path from 'path';

export default defineConfig(({ mode }) => {
  const isTest = mode === 'test';
  
  return {
    plugins: [
      react(),
      !isTest && monacoEditorPlugin({
        languageWorkers: ['editorWorkerService', 'typescript'],
      }),
    ].filter(Boolean),
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
  };
});