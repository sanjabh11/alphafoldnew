import axios from 'axios';
import { API_CONFIG } from '../config/apiConfig';

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
  };
  statistics?: {
    mean: number;
    median: number;
    stdDev: number;
  };
}

class GeneExpressionService {
  private geoBaseUrl: string;
  private arrayExpressBaseUrl: string;
  private cache: Map<string, ExpressionData[]>;

  constructor() {
    this.geoBaseUrl = API_CONFIG.geneExpression.geo.baseUrl;
    this.arrayExpressBaseUrl = API_CONFIG.geneExpression.arrayExpress.baseUrl;
    this.cache = new Map();
    this.initializeCache();
  }

  private async initializeCache() {
    const cachedData = localStorage.getItem('gene_expression_cache');
    if (cachedData) {
      const parsed = JSON.parse(cachedData);
      Object.entries(parsed).forEach(([key, value]) => {
        this.cache.set(key, value as ExpressionData[]);
      });
    }
  }

  private updateCache(key: string, value: ExpressionData[]) {
    this.cache.set(key, value);
    localStorage.setItem('gene_expression_cache',
      JSON.stringify(Object.fromEntries(this.cache.entries()))
    );
  }

  private getCacheKey(query: ExpressionQuery): string {
    return JSON.stringify(query);
  }

  async searchGEO(query: ExpressionQuery): Promise<ExpressionData[]> {
    const cacheKey = this.getCacheKey(query);
    const cached = this.cache.get(cacheKey);
    if (cached) return cached;

    try {
      const response = await axios.get(`${this.geoBaseUrl}/search`, {
        params: {
          term: query.geneId,
          organism: query.organism,
          type: query.experimentType
        }
      });

      const results = response.data.map((item: any) => ({
        id: item.id,
        source: 'GEO' as const,
        values: item.expression_values,
        metadata: {
          tissue: item.tissue,
          condition: item.condition,
          timePoint: item.time_point,
          platform: item.platform
        },
        statistics: this.calculateStatistics(item.expression_values)
      }));

      this.updateCache(cacheKey, results);
      return results;
    } catch (error) {
      console.error('Error searching GEO:', error);
      throw error;
    }
  }

  async searchArrayExpress(query: ExpressionQuery): Promise<ExpressionData[]> {
    const cacheKey = this.getCacheKey(query);
    const cached = this.cache.get(cacheKey);
    if (cached) return cached;

    try {
      const response = await axios.get(`${this.arrayExpressBaseUrl}/query`, {
        params: {
          gene: query.geneId,
          species: query.organism,
          tissue: query.tissueType
        }
      });

      const results = response.data.map((item: any) => ({
        id: item.accession,
        source: 'ArrayExpress' as const,
        values: item.expression_data,
        metadata: {
          tissue: item.tissue,
          condition: item.experimental_condition,
          timePoint: item.time_point,
          platform: item.array_platform
        },
        statistics: this.calculateStatistics(item.expression_data)
      }));

      this.updateCache(cacheKey, results);
      return results;
    } catch (error) {
      console.error('Error searching ArrayExpress:', error);
      throw error;
    }
  }

  private calculateStatistics(values: number[]) {
    if (!values?.length) return undefined;

    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const sortedValues = [...values].sort((a, b) => a - b);
    const median = sortedValues[Math.floor(values.length / 2)];
    const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);

    return { mean, median, stdDev };
  }

  async searchAllSources(query: ExpressionQuery): Promise<ExpressionData[]> {
    const [geoResults, arrayExpressResults] = await Promise.all([
      this.searchGEO(query),
      this.searchArrayExpress(query)
    ]);

    return [...geoResults, ...arrayExpressResults];
  }
}

export const geneExpressionService = new GeneExpressionService();
