import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['@react-spring/web'],
  },
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `@import "molstar/lib/mol-plugin-ui/skin/light.scss";`,
      },
    },
  },
  server: {
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
    },
  },
});