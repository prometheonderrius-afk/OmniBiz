import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // @alias-sync-start
        '@': path.resolve(__dirname, './src'),
        '@components': path.resolve(__dirname, './src/components'),
        'db': path.resolve(__dirname, './src/db/index.ts'),
      // @alias-sync-end
      'custom-manual-alias': path.resolve(__dirname, 'manual')
    }
  }
});
