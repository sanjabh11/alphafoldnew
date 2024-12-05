import axios from 'axios';
import { API_CONFIG } from '../config/apiConfig';

export interface PredictionRequest {
  sequence: string;
  mode: 'fast' | 'accurate';
  options?: {
    templates?: boolean;
    multimerMode?: boolean;
  };
}

export interface PredictionResult {
  jobId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  result?: {
    pdbData: string;
    confidenceScore: number;
    domains: Array<{
      start: number;
      end: number;
      confidence: number;
    }>;
  };
}

class AlphaFold3Service {
  private baseUrl: string;
  private cache: Map<string, PredictionResult>;

  constructor() {
    this.baseUrl = API_CONFIG.alphafold3.baseUrl;
    this.cache = new Map();
    this.initializeCache();
  }

  private async initializeCache() {
    const cachedData = localStorage.getItem('alphafold3_cache');
    if (cachedData) {
      const parsed = JSON.parse(cachedData);
      Object.entries(parsed).forEach(([key, value]) => {
        this.cache.set(key, value as PredictionResult);
      });
    }
  }

  private updateCache(key: string, value: PredictionResult) {
    this.cache.set(key, value);
    localStorage.setItem('alphafold3_cache', 
      JSON.stringify(Object.fromEntries(this.cache.entries()))
    );
  }

  async submitPrediction(request: PredictionRequest): Promise<string> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/predict`,
        request
      );
      return response.data.jobId;
    } catch (error) {
      console.error('Error submitting prediction:', error);
      throw error;
    }
  }

  async getPredictionStatus(jobId: string): Promise<PredictionResult> {
    // Check cache first
    const cached = this.cache.get(jobId);
    if (cached && cached.status === 'completed') {
      return cached;
    }

    try {
      const response = await axios.get(
        `${this.baseUrl}/status/${jobId}`
      );
      const result = response.data;
      
      if (result.status === 'completed') {
        this.updateCache(jobId, result);
      }
      
      return result;
    } catch (error) {
      console.error('Error getting prediction status:', error);
      throw error;
    }
  }

  async analyzePrediction(jobId: string, options: {
    includeDomains?: boolean;
    includeBindingSites?: boolean;
    includeStability?: boolean;
  } = {}): Promise<any> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/analyze/${jobId}`,
        options
      );
      return response.data;
    } catch (error) {
      console.error('Error analyzing prediction:', error);
      throw error;
    }
  }
}

export const alphafold3Service = new AlphaFold3Service();
