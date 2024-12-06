import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['@react-spring/web'],
  },
  define: {
    'process.env.VITE_NCBI_API_KEY': JSON.stringify(process.env.VITE_NCBI_API_KEY)
  },
  server: {
    proxy: {
      '/api/proxy/geo': {
        target: 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/proxy\/geo/, ''),
        secure: false,
        configure: (proxy, options) => {
          proxy.on('proxyReq', (proxyReq, req, res) => {
            proxyReq.setHeader('Accept', req.headers['accept'] || 'application/json');
          });
        }
      },
      '/api/proxy/arrayexpress': {
        target: 'https://www.ebi.ac.uk/arrayexpress',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/proxy\/arrayexpress/, ''),
        secure: false,
        headers: {
          'Accept': 'application/json'
        }
      }
    }
  }
});