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
    proxy: {
      '/arrayexpress': {
        target: 'https://www.ebi.ac.uk',
        changeOrigin: true,
        secure: false,
        ws: true,
        rewrite: (path) => path.replace(/^\/arrayexpress/, ''),
      },
      "/api/proxy/arrayexpress": {
        target: "https://www.ebi.ac.uk/arrayexpress/json/v3",
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api\/proxy\/arrayexpress/, ""),
        headers: {
          "Accept": "application/json",
          "Origin": "http://localhost:5173"
        },
        configure: (proxy, _options) => {
          proxy.on("error", (err, _req, _res) => {
            console.log("proxy error", err);
          });
          proxy.on("proxyReq", (proxyReq, req, _res) => {
            console.log("Sending Request to ArrayExpress:", req.method, req.url);
          });
          proxy.on("proxyRes", (proxyRes, req, _res) => {
            console.log("Received Response from ArrayExpress:", proxyRes.statusCode, req.url);
          });
        }
      },
    },
  },
});