import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `
          @use "sass:math";
          @import "molstar/lib/mol-plugin-ui/skin/light.scss";
        `
      }
    }
  },
  optimizeDeps: {
    exclude: ['molstar']
  },
  build: {
    commonjsOptions: {
      include: [/molstar/, /node_modules/]
    }
  },
  server: {
    headers: {
      'Cross-Origin-Embedder-Policy': 'require-corp',
      'Cross-Origin-Opener-Policy': 'same-origin'
    }
  },
  resolve: {
    alias: {
      '@': '/src'
    }
  }
});