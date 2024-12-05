import axios, { AxiosInstance, AxiosError } from 'axios';
import { API_CONFIG } from '../config/apiConfig';

export interface ExpressionQuery {
  geneId: string;
  organism?: string;
  tissueType?: string;
  experimentType?: string;
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
    experimentId: string;
    title: string;
    [key: string]: any;
  };
  statistics: ExpressionStatistics;
}

interface ExpressionStatistics {
  mean: number;
  median: number;
  stdDev: number;
  min: number;
  max: number;
  sampleSize: number;
}

class GeneExpressionService {
  private axiosInstance: AxiosInstance;
  private cache: Map<string, ExpressionData[]>;
  private readonly geoConfig = API_CONFIG.geneExpression.geo;
  private readonly arrayExpressConfig = API_CONFIG.geneExpression.arrayExpress;
  private readonly retryDelay = 1000;
  private readonly maxRetries = 3;

  constructor() {
    this.axiosInstance = axios.create({
      timeout: parseInt(import.meta.env.VITE_API_TIMEOUT) || 30000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    // Add request interceptor for debugging
    this.axiosInstance.interceptors.request.use(request => {
      console.log('Starting Request:', {
        url: request.url,
        method: request.method,
        params: request.params
      });
      return request;
    });

    // Add response interceptor for debugging
    this.axiosInstance.interceptors.response.use(
      response => {
        console.log('Response:', {
          url: response.config.url,
          status: response.status,
          data: response.data
        });
        return response;
      },
      error => {
        console.error('API Error:', {
          url: error.config?.url,
          status: error.response?.status,
          message: error.message,
          response: error.response?.data
        });
        return Promise.reject(error);
      }
    );

    this.cache = new Map();
    this.loadCacheFromStorage();
  }

  private loadCacheFromStorage() {
    try {
      const cached = localStorage.getItem('gene_expression_cache');
      if (cached) {
        const parsed = JSON.parse(cached);
        this.cache = new Map(Object.entries(parsed));
      }
    } catch (error) {
      console.warn('Failed to load cache:', error);
    }
  }

  private getCacheKey(query: ExpressionQuery): string {
    return `${query.geneId}_${query.organism || ''}_${query.tissueType || ''}_${query.experimentType || ''}`;
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

  private async retryRequest<T>(
    request: () => Promise<T>,
    retries = this.maxRetries
  ): Promise<T> {
    try {
      return await request();
    } catch (error) {
      if (retries > 0 && error instanceof AxiosError) {
        console.warn(`Request failed, retrying... (${retries} attempts left)`);
        await new Promise(resolve => setTimeout(resolve, this.retryDelay));
        return this.retryRequest(request, retries - 1);
      }
      throw error;
    }
  }

  async searchGene(query: ExpressionQuery): Promise<{
    geoResults: ExpressionData[];
    arrayExpressResults: ExpressionData[];
    error?: string;
  }> {
    console.log('Starting gene search for:', query);
    
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

      const results = {
        geoResults: geoResults.status === 'fulfilled' ? geoResults.value : [],
        arrayExpressResults: arrayExpressResults.status === 'fulfilled' ? arrayExpressResults.value : [],
        error: geoResults.status === 'rejected' && arrayExpressResults.status === 'rejected' 
          ? 'Failed to fetch data from both sources' 
          : undefined
      };

      if (results.geoResults.length === 0 && results.arrayExpressResults.length === 0) {
        console.warn('No expression data found from any source');
      } else {
        console.log(`Found ${results.geoResults.length} GEO results and ${results.arrayExpressResults.length} ArrayExpress results`);
      }

      return results;
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
    console.log('Searching GEO for:', query);
    const cacheKey = this.getCacheKey(query);
    const cached = this.cache.get(cacheKey);
    if (cached) {
      console.log('Returning cached GEO results');
      return cached;
    }

    try {
      // First search for datasets
      const searchResponse = await this.retryRequest(() => 
        this.axiosInstance.get(`${this.geoConfig.baseUrl}${this.geoConfig.endpoints.search}`, {
          params: {
            ...this.geoConfig.params,
            term: `${query.geneId}[Gene Symbol]${query.organism ? ` AND "${query.organism}"[Organism]` : ''}`,
            sort: 'relevance',
            retmax: 20,
            api_key: import.meta.env.VITE_NCBI_API_KEY
          }
        })
      );

      console.log('GEO search response:', searchResponse.data);

      if (!searchResponse.data?.esearchresult?.idlist?.length) {
        console.log('No GEO datasets found');
        return [];
      }

      const ids = searchResponse.data.esearchresult.idlist;
      
      // Get summaries for found datasets
      const summaryResponse = await this.retryRequest(() =>
        this.axiosInstance.get(`${this.geoConfig.baseUrl}${this.geoConfig.endpoints.summary}`, {
          params: {
            ...this.geoConfig.params,
            id: ids.join(','),
            api_key: import.meta.env.VITE_NCBI_API_KEY
          }
        })
      );

      console.log('GEO summary response:', summaryResponse.data);

      // Get detailed data using efetch
      const fetchResponse = await this.retryRequest(() =>
        this.axiosInstance.get(`${this.geoConfig.baseUrl}${this.geoConfig.endpoints.fetch}`, {
          params: {
            ...this.geoConfig.params,
            id: ids.join(','),
            api_key: import.meta.env.VITE_NCBI_API_KEY
          }
        })
      );

      console.log('GEO fetch response:', fetchResponse.data);

      const results: ExpressionData[] = [];
      
      if (summaryResponse.data?.result && fetchResponse.data) {
        for (const dataset of Object.values(summaryResponse.data.result)) {
          if (!dataset.title || !dataset.gpl) continue;

          try {
            const expressionData = this.extractExpressionData(fetchResponse.data, dataset.accession);
            const normalizedValues = this.normalizeValues(expressionData.values || []);
            
            if (normalizedValues.length === 0) {
              console.warn(`No expression values found for dataset ${dataset.accession}`);
              continue;
            }

            results.push({
              id: dataset.accession,
              source: 'GEO',
              values: normalizedValues,
              metadata: {
                tissue: dataset.tissue || query.tissueType,
                condition: dataset.title,
                platform: dataset.gpl,
                experimentId: dataset.accession,
                title: dataset.title,
                timePoint: expressionData.timePoint,
                ...this.extractAdditionalMetadata(dataset)
              },
              statistics: this.calculateStatistics(normalizedValues)
            });
          } catch (error) {
            console.warn(`Failed to process dataset ${dataset.accession}:`, error);
          }
        }
      }

      console.log(`Processed ${results.length} GEO datasets`);
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

  async searchArrayExpress(query: ExpressionQuery): Promise<ExpressionData[]> {
    console.log('Searching ArrayExpress for:', query);
    const cacheKey = this.getCacheKey(query);
    const cached = this.cache.get(cacheKey);
    if (cached) {
      console.log('Returning cached ArrayExpress results');
      return cached;
    }

    try {
      // Try proxy first
      const response = await this.retryRequest(async () => {
        try {
          return await this.axiosInstance.get(
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
          );
        } catch (error) {
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
        }
      });

      console.log('ArrayExpress response:', response.data);

      if (!response.data?.experiments) {
        console.log('No ArrayExpress experiments found');
        return [];
      }

      const experiments = Array.isArray(response.data.experiments) 
        ? response.data.experiments 
        : [response.data.experiments];

      console.log(`Processing ${experiments.length} ArrayExpress experiments`);

      const results = await Promise.all(experiments.map(async (exp: any) => {
        try {
          const detailedData = await this.fetchExperimentDetails(exp.accession);
          console.log(`Fetched details for ${exp.accession}:`, detailedData);

          const normalizedValues = this.normalizeValues(detailedData.expressions || []);
          
          if (normalizedValues.length === 0) {
            console.warn(`No expression values found for experiment ${exp.accession}`);
            return null;
          }

          return {
            id: exp.accession,
            source: 'ArrayExpress' as const,
            values: normalizedValues,
            metadata: {
              tissue: exp.tissue || query.tissueType,
              condition: exp.experimentalCondition,
              timePoint: exp.timePoint,
              platform: exp.arrayDesign,
              experimentId: exp.accession,
              title: exp.name,
              ...this.extractArrayExpressMetadata(exp, detailedData)
            },
            statistics: this.calculateStatistics(normalizedValues)
          };
        } catch (error) {
          console.warn(`Failed to fetch details for ${exp.accession}:`, error);
          return null;
        }
      }));

      const validResults = results.filter((result): result is ExpressionData => result !== null);
      console.log(`Successfully processed ${validResults.length} ArrayExpress experiments`);
      
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

  private normalizeValues(values: number[]): number[] {
    if (!values || values.length === 0) return [];
    
    try {
      // Remove outliers using IQR method
      const sorted = [...values].sort((a, b) => a - b);
      const q1 = sorted[Math.floor(values.length * 0.25)];
      const q3 = sorted[Math.floor(values.length * 0.75)];
      const iqr = q3 - q1;
      const lowerBound = q1 - 1.5 * iqr;
      const upperBound = q3 + 1.5 * iqr;
      
      const validValues = values.filter(v => v >= lowerBound && v <= upperBound);
      
      if (validValues.length === 0) {
        console.warn('No valid values after outlier removal, using original values');
        return this.minMaxNormalize(values);
      }
      
      return this.minMaxNormalize(validValues);
    } catch (error) {
      console.error('Error normalizing values:', error);
      return this.minMaxNormalize(values);
    }
  }

  private minMaxNormalize(values: number[]): number[] {
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min;
    
    if (range === 0) {
      console.warn('Zero range in values, returning zeros');
      return values.map(() => 0);
    }
    
    return values.map(v => (v - min) / range);
  }

  private calculateStatistics(values: number[]): ExpressionStatistics {
    if (!values || values.length === 0) {
      return {
        mean: 0,
        median: 0,
        stdDev: 0,
        min: 0,
        max: 0,
        sampleSize: 0
      };
    }

    try {
      const sorted = [...values].sort((a, b) => a - b);
      const sum = sorted.reduce((acc, val) => acc + val, 0);
      const mean = sum / sorted.length;
      const median = sorted.length % 2 === 0
        ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
        : sorted[Math.floor(sorted.length / 2)];
      
      const squaredDiffs = sorted.map(value => Math.pow(value - mean, 2));
      const variance = squaredDiffs.reduce((acc, val) => acc + val, 0) / sorted.length;
      const stdDev = Math.sqrt(variance);

      return {
        mean,
        median,
        stdDev,
        min: sorted[0],
        max: sorted[sorted.length - 1],
        sampleSize: sorted.length
      };
    } catch (error) {
      console.error('Error calculating statistics:', error);
      return {
        mean: 0,
        median: 0,
        stdDev: 0,
        min: 0,
        max: 0,
        sampleSize: 0
      };
    }
  }

  private extractExpressionData(data: any, accession: string): { values: number[]; timePoint?: string } {
    try {
      const dataset = data.find((d: any) => d.accession === accession);
      if (!dataset?.expression_values) {
        return { values: [] };
      }

      return {
        values: dataset.expression_values,
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
        metadata.characteristics = dataset.characteristics;
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

  async searchProteinExpression(proteinId: string, query: Partial<ExpressionQuery>): Promise<ExpressionData[]> {
    console.log('Searching protein expression for:', { proteinId, query });
    const cacheKey = this.getCacheKey({ ...query, proteinId });
    const cached = this.cache.get(cacheKey);
    
    if (cached) {
      console.log('Returning cached protein expression results');
      return cached;
    }

    try {
      const endpoint = this.config.endpoints.protein.replace(':id', proteinId);
      const response = await this.retryRequest(() => 
        this.axiosInstance.get(`${this.config.baseUrl}${endpoint}`, {
          params: {
            ...this.config.params,
            ...query,
            format: 'json'
          }
        })
      );

      console.log('Protein expression response:', response.data);

      if (!response.data?.results) {
        console.log('No expression data found');
        return [];
      }

      const results = response.data.results.map((result: any) => ({
        id: result.id,
        source: result.source,
        values: this.normalizeValues(result.values),
        metadata: {
          tissue: result.tissue || query.tissueType,
          condition: result.condition,
          timePoint: result.timePoint,
          platform: result.platform,
          experimentId: result.experimentId,
          title: result.title,
          ...result.metadata
        },
        statistics: this.calculateStatistics(result.values)
      }));

      this.updateCache(cacheKey, results);
      return results;
    } catch (error) {
      console.error('Error searching protein expression:', error);
      if (error instanceof Error) {
        throw new Error(`Protein expression search failed: ${error.message}`);
      }
      throw error;
    }
  }
}

export const geneExpressionService = new GeneExpressionService();
