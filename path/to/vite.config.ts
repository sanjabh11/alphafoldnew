import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@molstar/mol-plugin-ui': require.resolve('@molstar/mol-plugin-ui'),
      '@molstar/mol-model-formats': require.resolve('@molstar/mol-model-formats')
    }
  },
  optimizeDeps: {
    include: [
      '@molstar/mol-plugin-ui',
      '@molstar/mol-model-formats'
    ]
  }
});
