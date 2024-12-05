import axios, { AxiosError } from 'axios';
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
  private cache: Map<string, ExpressionData[]>;
  private axiosInstance;

  constructor() {
    this.geoConfig = API_CONFIG.geneExpression.geo;
    this.arrayExpressConfig = API_CONFIG.geneExpression.arrayExpress;
    this.cache = new Map();
    
    // Create axios instance with retry logic
    this.axiosInstance = axios.create({
      timeout: API_CONFIG.geneExpression.proxy.timeout,
      validateStatus: (status) => status < 500
    });

    // Add retry interceptor
    this.axiosInstance.interceptors.response.use(null, async (error: AxiosError) => {
      const config = error.config;
      if (!config || config.retryCount === undefined || config.retryCount >= API_CONFIG.geneExpression.proxy.retries) {
        return Promise.reject(error);
      }

      config.retryCount = config.retryCount ? config.retryCount + 1 : 1;
      const delay = Math.min(1000 * (2 ** config.retryCount), 10000);
      
      await new Promise(resolve => setTimeout(resolve, delay));
      return this.axiosInstance(config);
    });

    this.initializeCache();
  }

  private async initializeCache() {
    try {
      const cachedData = localStorage.getItem('gene_expression_cache');
      if (cachedData) {
        const parsed = JSON.parse(cachedData);
        Object.entries(parsed).forEach(([key, value]) => {
          this.cache.set(key, value as ExpressionData[]);
        });
      }
    } catch (error) {
      console.warn('Failed to initialize cache:', error);
    }
  }

  private updateCache(key: string, value: ExpressionData[]) {
    try {
      this.cache.set(key, value);
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

  async searchGene(query: ExpressionQuery): Promise<{
    geoResults: ExpressionData[];
    arrayExpressResults: ExpressionData[];
    error?: string;
  }> {
    try {
      const [geoResults, arrayExpressResults] = await Promise.allSettled([
        this.searchGEO({
          ...query,
          geneId: query.geneId.toUpperCase()
        }),
        this.searchArrayExpress({
          ...query,
          geneId: query.geneId.toUpperCase()
        })
      ]);

      return {
        geoResults: geoResults.status === 'fulfilled' ? geoResults.value : [],
        arrayExpressResults: arrayExpressResults.status === 'fulfilled' ? arrayExpressResults.value : [],
        error: geoResults.status === 'rejected' && arrayExpressResults.status === 'rejected' 
          ? 'Failed to fetch data from both sources' 
          : undefined
      };
    } catch (error) {
      console.error('Gene search failed:', error);
      return {
        geoResults: [],
        arrayExpressResults: [],
        error: 'Gene search failed'
      };
    }
  }

  async searchGEO(query: ExpressionQuery): Promise<ExpressionData[]> {
    const cacheKey = this.getCacheKey(query);
    const cached = this.cache.get(cacheKey);
    if (cached) return cached;

    try {
      // First search for datasets
      const searchResponse = await this.axiosInstance.get(`${this.geoConfig.baseUrl}${this.geoConfig.endpoints.search}`, {
        params: {
          ...this.geoConfig.params,
          term: `${query.geneId}[Gene Symbol] AND "${query.organism || ''}"[Organism]`,
          sort: 'relevance',
          datetype: 'pdat'
        }
      });

      if (!searchResponse.data?.esearchresult?.idlist) {
        return [];
      }

      // Get summaries for found datasets
      const ids = searchResponse.data.esearchresult.idlist;
      const summaryResponse = await this.axiosInstance.get(`${this.geoConfig.baseUrl}${this.geoConfig.endpoints.summary}`, {
        params: {
          ...this.geoConfig.params,
          id: ids.join(',')
        }
      });

      // Get detailed data using efetch
      const fetchResponse = await this.axiosInstance.get(`${this.geoConfig.baseUrl}${this.geoConfig.endpoints.fetch}`, {
        params: {
          ...this.geoConfig.params,
          id: ids.join(',')
        }
      });

      const results: ExpressionData[] = [];
      
      if (summaryResponse.data?.result && fetchResponse.data) {
        Object.values(summaryResponse.data.result).forEach((dataset: any) => {
          if (dataset.title && dataset.gpl) {
            const expressionData = this.extractExpressionData(fetchResponse.data, dataset.accession);
            results.push({
              id: dataset.accession,
              source: 'GEO',
              values: this.normalizeValues(expressionData.values || []),
              metadata: {
                tissue: dataset.tissue || query.tissueType,
                condition: dataset.title,
                platform: dataset.gpl,
                experimentId: dataset.accession,
                title: dataset.title,
                timePoint: expressionData.timePoint,
                ...this.extractAdditionalMetadata(dataset)
              },
              statistics: this.calculateStatistics(expressionData.values || [])
            });
          }
        });
      }

      this.updateCache(cacheKey, results);
      return results;
    } catch (error) {
      console.error('Error searching GEO:', error);
      if (error instanceof Error) {
        throw new Error(`GEO search failed: ${error.message}`);
      }
      throw error;
    }
  }

  private extractExpressionData(fetchData: any, accession: string): { values: number[], timePoint?: string } {
    try {
      // Implementation depends on GEO's data structure
      const dataset = fetchData[accession];
      if (!dataset) return { values: [] };

      return {
        values: dataset.expression_values || [],
        timePoint: dataset.time_point
      };
    } catch (error) {
      console.warn(`Failed to extract expression data for ${accession}:`, error);
      return { values: [] };
    }
  }

  private extractAdditionalMetadata(dataset: any): Record<string, any> {
    const metadata: Record<string, any> = {};
    
    try {
      if (dataset.characteristics) {
        Object.entries(dataset.characteristics).forEach(([key, value]) => {
          metadata[key.toLowerCase()] = value;
        });
      }
      
      if (dataset.supplementary_files) {
        metadata.supplementaryFiles = dataset.supplementary_files;
      }
      
      if (dataset.submission_date) {
        metadata.submissionDate = dataset.submission_date;
      }
    } catch (error) {
      console.warn('Failed to extract additional metadata:', error);
    }
    
    return metadata;
  }

  async searchArrayExpress(query: ExpressionQuery): Promise<ExpressionData[]> {
    const cacheKey = this.getCacheKey(query);
    const cached = this.cache.get(cacheKey);
    if (cached) return cached;

    try {
      // Try proxy first
      const response = await this.axiosInstance.get(
        `${this.arrayExpressConfig.baseUrl}${this.arrayExpressConfig.endpoints.query}`,
        {
          params: {
            ...this.arrayExpressConfig.params,
            gene: query.geneId,
            species: query.organism,
            tissue: query.tissueType,
            experimenttype: query.experimentType
          }
        }
      ).catch(async () => {
        console.warn('Proxy failed, attempting direct ArrayExpress access');
        return this.axiosInstance.get(
          `${this.arrayExpressConfig.fallbackUrl}${this.arrayExpressConfig.endpoints.query}`,
          {
            params: {
              ...this.arrayExpressConfig.params,
              gene: query.geneId,
              species: query.organism,
              tissue: query.tissueType,
              experimenttype: query.experimentType
            }
          }
        );
      });

      if (!response.data?.experiments) {
        return [];
      }

      const experiments = Array.isArray(response.data.experiments) 
        ? response.data.experiments 
        : [response.data.experiments];

      const results = await Promise.all(experiments.map(async (exp: any) => {
        try {
          const detailedData = await this.fetchExperimentDetails(exp.accession);
          return {
            id: exp.accession,
            source: 'ArrayExpress' as const,
            values: this.normalizeValues(detailedData.expressions || []),
            metadata: {
              tissue: exp.tissue || query.tissueType,
              condition: exp.experimentalCondition,
              timePoint: exp.timePoint,
              platform: exp.arrayDesign,
              experimentId: exp.accession,
              title: exp.name,
              ...this.extractArrayExpressMetadata(exp, detailedData)
            },
            statistics: this.calculateStatistics(detailedData.expressions || [])
          };
        } catch (error) {
          console.warn(`Failed to fetch details for ${exp.accession}:`, error);
          return null;
        }
      }));

      const validResults = results.filter((result): result is ExpressionData => result !== null);
      this.updateCache(cacheKey, validResults);
      return validResults;
    } catch (error) {
      console.error('Error searching ArrayExpress:', error);
      if (error instanceof Error) {
        throw new Error(`ArrayExpress search failed: ${error.message}`);
      }
      throw error;
    }
  }

  private async fetchExperimentDetails(accession: string): Promise<any> {
    try {
      const response = await this.axiosInstance.get(
        `${this.arrayExpressConfig.baseUrl}${this.arrayExpressConfig.endpoints.experiments}/${accession}`,
        {
          params: this.arrayExpressConfig.params
        }
      );
      return response.data;
    } catch (error) {
      console.warn(`Failed to fetch details for ${accession}:`, error);
      return {};
    }
  }

  private extractArrayExpressMetadata(experiment: any, details: any): Record<string, any> {
    const metadata: Record<string, any> = {};
    
    try {
      if (details.protocols) {
        metadata.protocols = details.protocols.map((p: any) => ({
          type: p.type,
          description: p.description
        }));
      }
      
      if (details.samples) {
        metadata.sampleCount = details.samples.length;
        metadata.sampleTypes = [...new Set(details.samples.map((s: any) => s.type))];
      }
      
      if (experiment.releasedate) {
        metadata.releaseDate = experiment.releasedate;
      }
    } catch (error) {
      console.warn('Failed to extract ArrayExpress metadata:', error);
    }
    
    return metadata;
  }

  private normalizeValues(values: any[]): number[] {
    if (!Array.isArray(values)) return [];
    return values.map(v => {
      const num = typeof v === 'string' ? parseFloat(v) : v;
      return isNaN(num) ? 0 : num;
    }).filter(v => v !== 0);
  }

  private calculateStatistics(values: number[]) {
    const normalizedValues = this.normalizeValues(values);
    if (!normalizedValues.length) return undefined;

    const mean = normalizedValues.reduce((a, b) => a + b, 0) / normalizedValues.length;
    const sortedValues = [...normalizedValues].sort((a, b) => a - b);
    const median = sortedValues[Math.floor(normalizedValues.length / 2)];
    const variance = normalizedValues.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / normalizedValues.length;
    const stdDev = Math.sqrt(variance);

    return { mean, median, stdDev };
  }

  async searchAllSources(query: ExpressionQuery): Promise<ExpressionData[]> {
    try {
      const [geoResults, arrayExpressResults] = await Promise.all([
        this.searchGEO(query).catch(() => []),
        this.searchArrayExpress(query).catch(() => [])
      ]);

      return [...geoResults, ...arrayExpressResults];
    } catch (error) {
      console.error('Error searching all sources:', error);
      return [];
    }
  }
}

export const geneExpressionService = new GeneExpressionService();
