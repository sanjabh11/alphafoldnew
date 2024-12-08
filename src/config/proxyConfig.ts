import axios from 'axios';
import { API_CONFIG } from './apiConfig';

const PROXY_ENABLED = import.meta.env.VITE_PROXY_ENABLED === 'true';
const PROXY_BASE_URL = import.meta.env.VITE_PROXY_BASE_URL;
const ENABLE_DIRECT_FALLBACK = import.meta.env.VITE_ENABLE_DIRECT_FALLBACK === 'true';

export const proxyInstance = axios.create({
  baseURL: PROXY_ENABLED ? PROXY_BASE_URL : undefined,
  timeout: parseInt(import.meta.env.VITE_API_TIMEOUT),
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor
proxyInstance.interceptors.request.use(
  (config) => {
    // Add any request preprocessing here
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor with fallback logic
proxyInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (!ENABLE_DIRECT_FALLBACK) {
      return Promise.reject(error);
    }

    if (error.code === 'ERR_NETWORK' && error.config) {
      const originalRequest = error.config;
      
      // Determine the appropriate direct API URL
      let directUrl = originalRequest.url;
      if (directUrl.includes('/geo/')) {
        directUrl = directUrl.replace(PROXY_BASE_URL, import.meta.env.VITE_GEO_API_URL);
      } else if (directUrl.includes('/arrayexpress/')) {
        directUrl = directUrl.replace(PROXY_BASE_URL, import.meta.env.VITE_ARRAYEXPRESS_API_URL);
      }
      
      try {
        console.log('Attempting direct API call to:', directUrl);
        const directResponse = await axios({
          ...originalRequest,
          url: directUrl,
          baseURL: undefined,
          headers: {
            ...originalRequest.headers,
            'api_key': import.meta.env.VITE_NCBI_API_KEY
          }
        });
        return directResponse;
      } catch (fallbackError) {
        console.error('Direct API call failed:', fallbackError);
        return Promise.reject(fallbackError);
      }
    }
    
    return Promise.reject(error);
  }
); 