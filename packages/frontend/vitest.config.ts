import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: [],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@wokvi/shared': path.resolve(__dirname, '../shared/src'),
      '@wokvi/components': path.resolve(__dirname, '../components/src'),
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@wokvi/shared': path.resolve(__dirname, '../shared/src'),
      '@wokvi/components': path.resolve(__dirname, '../components/src'),
    },
  },
});