import axios, { AxiosError } from 'axios';
import { API_CONFIG } from '../config/apiConfig';
import { RateLimiter } from '../utils/rateLimiter';

export interface ExpressionQuery {
  geneId: string;
  organism?: string;
  tissueType?: string;
  experimentType?: string;
  timePoint?: string;
}

export interface ExpressionData {
  id: string;
  source: 'GEO' | 'ArrayExpress';
  values: number[];
  metadata: {
    tissue?: string;
    condition?: string;
    timePoint?: string;
    platform?: string;
    experimentId?: string;
    title?: string;
  };
  statistics?: {
    mean: number;
    median: number;
    stdDev: number;
  };
}

class GeneExpressionService {
  private geoConfig: typeof API_CONFIG.geneExpression.geo;
  private arrayExpressConfig: typeof API_CONFIG.geneExpression.arrayExpress;
  private cache: Map<string, {
    data: ExpressionData[];
    timestamp: number;
  }>;
  private geoRateLimiter: RateLimiter;
  private arrayExpressRateLimiter: RateLimiter;
  private axiosInstance;

  constructor() {
    this.geoConfig = API_CONFIG.geneExpression.geo;
    this.arrayExpressConfig = API_CONFIG.geneExpression.arrayExpress;
    this.cache = new Map();
    
    this.geoRateLimiter = new RateLimiter({
      requestsPerMinute: 30,
      concurrentRequests: 5
    });

    this.arrayExpressRateLimiter = new RateLimiter({
      requestsPerMinute: 30,
      concurrentRequests: 5
    });
    
    this.axiosInstance = axios.create({
      timeout: 30000,
      validateStatus: (status) => status < 500
    });

    this.setupAxiosInterceptors();
    this.initializeCache();
  }

  private setupAxiosInterceptors() {
    this.axiosInstance.interceptors.response.use(
      response => response,
      async (error: AxiosError) => {
        const config = error.config;
        if (!config || config.retryCount === undefined || config.retryCount >= 3) {
          return Promise.reject(error);
        }

        config.retryCount = config.retryCount ? config.retryCount + 1 : 1;
        const delay = Math.min(1000 * (2 ** config.retryCount), 10000);
        
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.axiosInstance(config);
      }
    );
  }

  private async initializeCache() {
    try {
      const cachedData = localStorage.getItem('gene_expression_cache');
      if (cachedData) {
        const parsed = JSON.parse(cachedData);
        const now = Date.now();
        Object.entries(parsed).forEach(([key, value]: [string, any]) => {
          if (now - value.timestamp < 1800000) { // 30 minutes TTL
            this.cache.set(key, value);
          }
        });
      }
    } catch (error) {
      console.warn('Failed to initialize cache:', error);
    }
  }

  private updateCache(key: string, value: ExpressionData[]) {
    try {
      const cacheEntry = {
        data: value,
        timestamp: Date.now()
      };
      this.cache.set(key, cacheEntry);

      // Cleanup old entries
      const now = Date.now();
      for (const [key, entry] of this.cache.entries()) {
        if (now - entry.timestamp >= 1800000) {
          this.cache.delete(key);
        }
      }

      localStorage.setItem('gene_expression_cache',
        JSON.stringify(Object.fromEntries(this.cache.entries()))
      );
    } catch (error) {
      console.warn('Failed to update cache:', error);
    }
  }

  private getCacheKey(query: ExpressionQuery): string {
    return JSON.stringify(query);
  }

  async searchGEO(query: ExpressionQuery): Promise<ExpressionData[]> {
    const cacheKey = this.getCacheKey(query);
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < 1800000) {
      return cached.data;
    }

    await this.geoRateLimiter.acquire();
    try {
      const searchResponse = await this.axiosInstance.get(
        `${this.geoConfig.baseUrl}${this.geoConfig.endpoints.search}`,
        {
          params: {
            ...this.geoConfig.params,
            term: `${query.geneId}[Gene] AND "${query.organism}"[Organism]`,
            retmax: 10
          }
        }
      );

      const ids = searchResponse.data.esearchresult.idlist;
      if (!ids.length) {
        return [];
      }

      const fetchResponse = await this.axiosInstance.get(
        `${this.geoConfig.baseUrl}${this.geoConfig.endpoints.fetch}`,
        {
          params: {
            ...this.geoConfig.params,
            id: ids.join(',')
          }
        }
      );

      const results = this.parseGEOResponse(fetchResponse.data, query);
      this.updateCache(cacheKey, results);
      return results;
    } catch (error) {
      if (error instanceof AxiosError) {
        if (error.response?.status === 429) {
          throw new Error('GEO rate limit exceeded. Please try again later.');
        }
      }
      throw error;
    } finally {
      this.geoRateLimiter.release();
    }
  }

  async searchArrayExpress(query: ExpressionQuery): Promise<ExpressionData[]> {
    const cacheKey = `ae_${this.getCacheKey(query)}`;
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < 1800000) {
      return cached.data;
    }

    await this.arrayExpressRateLimiter.acquire();
    try {
      const response = await this.axiosInstance.get(
        `${this.arrayExpressConfig.baseUrl}${this.arrayExpressConfig.endpoints.query}`,
        {
          params: {
            keywords: query.geneId,
            organism: query.organism,
            experimentType: query.experimentType
          }
        }
      );

      const results = this.parseArrayExpressResponse(response.data, query);
      this.updateCache(cacheKey, results);
      return results;
    } catch (error) {
      if (error instanceof AxiosError) {
        if (error.response?.status === 429) {
          throw new Error('ArrayExpress rate limit exceeded. Please try again later.');
        }
      }
      throw error;
    } finally {
      this.arrayExpressRateLimiter.release();
    }
  }

  private parseGEOResponse(data: any, query: ExpressionQuery): ExpressionData[] {
    // Implementation of GEO response parsing
    return [];
  }

  private parseArrayExpressResponse(data: any, query: ExpressionQuery): ExpressionData[] {
    // Implementation of ArrayExpress response parsing
    return [];
  }

  async searchGene(query: ExpressionQuery): Promise<{
    geoResults: ExpressionData[];
    arrayExpressResults: ExpressionData[];
    error?: string;
  }> {
    try {
      const [geoResults, arrayExpressResults] = await Promise.allSettled([
        this.searchGEO(query),
        this.searchArrayExpress(query)
      ]);

      return {
        geoResults: geoResults.status === 'fulfilled' ? geoResults.value : [],
        arrayExpressResults: arrayExpressResults.status === 'fulfilled' ? arrayExpressResults.value : [],
        error: geoResults.status === 'rejected' || arrayExpressResults.status === 'rejected' 
          ? 'Some data sources failed to respond' 
          : undefined
      };
    } catch (error) {
      console.error('Error searching gene expression:', error);
      throw error;
    }
  }
}

export const geneExpressionService = new GeneExpressionService();
