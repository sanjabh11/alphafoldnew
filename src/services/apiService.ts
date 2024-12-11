import axios, { AxiosError, AxiosInstance, AxiosRequestConfig } from 'axios';
import { API_CONFIG } from '../config/apiConfig';
import { validateApiKeys } from '../config/apiKeys';

class ApiService {
  private instances: Map<string, AxiosInstance> = new Map();
  private rateLimiters: Map<string, { lastRequest: number; queue: Array<() => Promise<void>> }> = new Map();

  constructor() {
    this.initializeApiInstances();
  }

  private initializeApiInstances() {
    // Validate API keys first
    const { valid, missing } = validateApiKeys();
    if (!valid) {
      console.warn(`Missing API keys for: ${missing.join(', ')}`);
    }

    // Initialize instances for each API
    Object.entries(API_CONFIG).forEach(([key, config]) => {
      const instance = axios.create({
        baseURL: config.baseUrl,
        timeout: Number(import.meta.env.VITE_API_TIMEOUT) || 30000,
      });

      // Add request interceptor for API key and rate limiting
      instance.interceptors.request.use(async (config) => {
        if (typeof config.headers === 'function') {
          config.headers = config.headers();
        }
        await this.handleRateLimit(key);
        return config;
      });

      // Add response interceptor for error handling
      instance.interceptors.response.use(
        (response) => response,
        this.handleApiError
      );

      this.instances.set(key, instance);
      this.rateLimiters.set(key, { lastRequest: 0, queue: [] });
    });
  }

  private async handleRateLimit(apiKey: string): Promise<void> {
    const limiter = this.rateLimiters.get(apiKey);
    if (!limiter) return;

    const now = Date.now();
    const waitTime = apiKey === 'ncbi' ? 334 : 100; // NCBI: 3 requests/sec, others: 10 requests/sec

    if (now - limiter.lastRequest < waitTime) {
      await new Promise((resolve) => setTimeout(resolve, waitTime));
    }
    limiter.lastRequest = Date.now();
  }

  private async handleApiError(error: AxiosError) {
    if (error.response) {
      const { status, data } = error.response;
      switch (status) {
        case 429:
          console.warn('Rate limit exceeded. Retrying after delay...');
          await new Promise((resolve) => setTimeout(resolve, 1000));
          return this.retryRequest(error.config);
        case 401:
          console.error('API key authentication failed');
          break;
        case 403:
          console.error('API access forbidden. Check API key permissions');
          break;
        default:
          console.error(`API Error: ${status}`, data);
      }
    }
    return Promise.reject(error);
  }

  private async retryRequest(config: AxiosRequestConfig) {
    const instance = this.instances.get(config.baseURL || '');
    if (!instance || !config) {
      return Promise.reject(new Error('Unable to retry request'));
    }
    return instance.request(config);
  }

  public async request<T>(
    apiKey: keyof typeof API_CONFIG,
    endpoint: string,
    config: AxiosRequestConfig = {}
  ): Promise<T> {
    const instance = this.instances.get(apiKey);
    if (!instance) {
      throw new Error(`API instance not found for ${apiKey}`);
    }
    return instance.request<T>({
      ...config,
      url: endpoint,
    }).then((response) => response.data);
  }
}

export const apiService = new ApiService();
