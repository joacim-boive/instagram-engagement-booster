import { loadEnv } from 'vite';
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  resolve: {
    alias: [
      {
        find: '@',
        replacement: resolve(__dirname, '.'),
      },
      {
        find: '@/lib',
        replacement: resolve(__dirname, './lib'),
      },
      {
        find: '@/server',
        replacement: resolve(__dirname, './server'),
      },
      {
        find: '@/services',
        replacement: resolve(__dirname, './services'),
      },
      {
        find: '@/scripts',
        replacement: resolve(__dirname, './src/scripts'),
      },
      {
        find: '@/components',
        replacement: resolve(__dirname, './components'),
      },
      {
        find: '@/contexts',
        replacement: resolve(__dirname, './contexts'),
      },
      {
        find: '@/config',
        replacement: resolve(__dirname, './app/config'),
      },
      {
        find: '@/hooks',
        replacement: resolve(__dirname, './hooks'),
      },
      {
        find: '@/types',
        replacement: resolve(__dirname, './types'),
      },
    ],
  },
  test: {
    env: loadEnv(mode, process.cwd(), ''),
    environment: 'jsdom',
    globals: true,
    setupFiles: './tests/setup.ts',
    include: ['**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'tests/setup.ts'],
    },
  },
}));
