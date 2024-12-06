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
    description?: string;
    organism?: string;
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

interface SearchResults {
  geoResults: ExpressionData[];
  arrayExpressResults: ExpressionData[];
  error?: string;
}

interface ArrayExpressExperiment {
  accession: string;
  name: string;
  description: string;
  organism: string;
  experimentalFactors?: string[];
}

export class GeneExpressionService {
  private axiosInstance: AxiosInstance;
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAY = 1000;
  private readonly geoConfig = API_CONFIG.geneExpression.geo;
  private readonly arrayExpressConfig = API_CONFIG.geneExpression.arrayExpress;

  constructor() {
    this.axiosInstance = axios.create({
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  private validateApiKey(): string {
    const apiKey = import.meta.env.VITE_NCBI_API_KEY;
    if (!apiKey) {
      throw new Error('NCBI API key not found in environment variables');
    }
    return apiKey;
  }

  async searchGene(query: ExpressionQuery): Promise<SearchResults> {
    console.log('Searching for gene expression data:', query);

    try {
      const [geoResults, arrayExpressResults] = await Promise.allSettled([
        this.searchGEO(query),
        this.searchArrayExpress(query)
      ]);

      return {
        geoResults: geoResults.status === 'fulfilled' ? geoResults.value : [],
        arrayExpressResults: arrayExpressResults.status === 'fulfilled' ? arrayExpressResults.value : [],
      };
    } catch (error) {
      console.error('Gene search failed:', error);
      return {
        geoResults: [],
        arrayExpressResults: [],
        error: error.message
      };
    }
  }

  async searchGEO(query: ExpressionQuery): Promise<ExpressionData[]> {
    console.log('Searching GEO for:', query);

    try {
      const searchResponse = await this.makeRequest(
        '/api/proxy/geo/esearch.fcgi',
        {
          db: 'gds',
          term: `${query.geneId}[Gene Symbol] AND "expression profiling"[DataSet Type]${
            query.organism ? ` AND "${query.organism}"[Organism]` : ''
          }`,
          retmax: 20,
          retmode: 'json'
        }
      );

      if (!searchResponse?.esearchresult?.idlist?.length) {
        console.log('No GEO datasets found');
        return [];
      }

      const results: ExpressionData[] = [];
      const batchSize = 5;

      for (let i = 0; i < searchResponse.esearchresult.idlist.length; i += batchSize) {
        const batch = searchResponse.esearchresult.idlist.slice(i, i + batchSize);
        await this.processGeoBatch(batch, query, results);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      return results;
    } catch (error) {
      console.error('GEO search failed:', error);
      return [];
    }
  }

  private async processGeoBatch(batch: string[], query: ExpressionQuery, results: ExpressionData[]): Promise<void> {
    try {
      const summaryResponse = await this.makeRequest(
        '/api/proxy/geo/esummary.fcgi',
        {
          db: 'gds',
          id: batch.join(','),
          retmode: 'json'
        }
      );

      if (!summaryResponse?.result) return;

      for (const id of Object.keys(summaryResponse.result)) {
        const dataset = summaryResponse.result[id];
        if (!dataset || !dataset.accession) continue;

        try {
          const values = await this.fetchGEODatasetValues(dataset.accession);
          if (values.length > 0) {
            results.push(this.createGeoDatasetResult(dataset, values, query));
          }
        } catch (error) {
          console.warn(`Failed to process dataset ${dataset.accession}:`, error);
        }
      }
    } catch (error) {
      console.warn('Failed to process GEO batch:', error);
    }
  }

  private async fetchGEODatasetValues(accession: string): Promise<number[]> {
    try {
      const response = await this.makeRequest(
        '/api/proxy/geo/efetch.fcgi',
        {
          db: 'gds',
          id: accession,
          rettype: 'full',
          retmode: 'text'
        }
      );

      return this.extractGEODatasetValues(response);
    } catch (error) {
      console.warn(`Failed to fetch GEO values for ${accession}:`, error);
      return [];
    }
  }

  private createGeoDatasetResult(dataset: any, values: number[], query: ExpressionQuery): ExpressionData {
    return {
      id: dataset.accession,
      source: 'GEO',
      values,
      metadata: {
        tissue: dataset.tissue || query.tissueType || '',
        condition: dataset.title || '',
        platform: dataset.gpl || '',
        experimentId: dataset.accession,
        title: dataset.title || '',
        description: dataset.summary || '',
        organism: dataset.taxon || query.organism || 'Homo sapiens'
      },
      statistics: this.calculateStatistics(values)
    };
  }

  private extractGEODatasetValues(data: string): number[] {
    try {
      const values: number[] = [];
      const lines = data.split('\n');
      let dataStarted = false;

      for (const line of lines) {
        if (line.startsWith('!dataset_table_begin')) {
          dataStarted = true;
          continue;
        }
        if (line.startsWith('!dataset_table_end')) break;
        if (!dataStarted || !line.trim() || line.startsWith('!')) continue;

        const value = parseFloat(line.split('\t')[1]);
        if (!isNaN(value)) values.push(value);
      }

      return values;
    } catch (error) {
      console.error('Error extracting GEO values:', error);
      return [];
    }
  }

  private async searchArrayExpress(query: ExpressionQuery): Promise<ExpressionData[]> {
    try {
      const searchParams = {
        keywords: query.geneId,
        species: query.organism || 'Homo sapiens',
        exptype: 'RNA-seq OR array assay',
        raw: true
      };

      const response = await this.makeRequest(
        '/api/proxy/arrayexpress/json/v3/experiments',
        searchParams
      );

      if (!response?.experiments?.length) {
        console.log('No ArrayExpress experiments found');
        return [];
      }

      return response.experiments.map((experiment: any) => ({
        id: experiment.accession,
        source: 'ArrayExpress',
        values: [],
        metadata: {
          experimentId: experiment.accession,
          title: experiment.name,
          description: experiment.description,
          organism: experiment.organism,
          tissue: experiment.experimentalFactors?.[0] || query.tissueType
        },
        statistics: {
          mean: 0,
          median: 0,
          stdDev: 0,
          min: 0,
          max: 0,
          sampleSize: experiment.samples || 0
        }
      }));
    } catch (error) {
      console.error('ArrayExpress search failed:', error);
      return [];
    }
  }

  private async makeRequest(url: string, params: any): Promise<any> {
    try {
      console.log('Making request to:', url, 'with params:', params);

      // Add API key to GEO requests
      if (url.startsWith('/api/proxy/geo')) {
        params = { ...params, api_key: this.validateApiKey() };
      }

      const response = await this.retryRequest(() => 
        this.axiosInstance.get(url, { 
          params,
          headers: {
            'Accept': params.retmode === 'json' ? 'application/json' : 'text/plain',
            'Content-Type': 'application/json'
          }
        })
      );

      if (!response.data) {
        throw new Error('Empty response received');
      }

      return response.data;
    } catch (error) {
      if (error instanceof AxiosError) {
        if (error.code === 'ERR_NETWORK') {
          console.error('Network error:', error.message);
          throw new Error('Network connection error. Please check your internet connection.');
        }
        if (error.response?.status === 404) {
          console.warn('Resource not found:', url);
          return null;
        }
        if (error.response?.status === 429) {
          throw new Error('Rate limit exceeded. Please try again later.');
        }
      }
      throw error;
    }
  }

  private async retryRequest(requestFn: () => Promise<any>, attempt = 1): Promise<any> {
    try {
      return await requestFn();
    } catch (error) {
      if (attempt >= this.MAX_RETRIES || 
          (error instanceof AxiosError && error.response?.status === 403)) {
        throw error;
      }

      const delay = this.RETRY_DELAY * Math.pow(2, attempt - 1);
      console.log(`Retrying request, ${this.MAX_RETRIES - attempt} attempts remaining`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return this.retryRequest(requestFn, attempt + 1);
    }
  }

  private normalizeValues(values: number[]): number[] {
    if (values.length === 0) return [];

    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min;

    return range === 0 ? values.map(() => 1) : values.map(v => (v - min) / range);
  }

  private calculateStatistics(values: number[]): ExpressionStatistics {
    if (values.length === 0) {
      return {
        mean: 0,
        median: 0,
        stdDev: 0,
        min: 0,
        max: 0
      };
    }

    const sorted = [...values].sort((a, b) => a - b);
    const sum = values.reduce((a, b) => a + b, 0);
    const mean = sum / values.length;
    const median = values.length % 2 === 0 
      ? (sorted[values.length / 2 - 1] + sorted[values.length / 2]) / 2
      : sorted[Math.floor(values.length / 2)];
    
    const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
    const variance = squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
    const stdDev = Math.sqrt(variance);

    return {
      mean,
      median,
      stdDev,
      min: sorted[0],
      max: sorted[sorted.length - 1]
    };
  }
}

export const geneExpressionService = new GeneExpressionService();