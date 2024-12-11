import axios from 'axios';
import { API_CONFIG } from '../config/apiConfig';

console.log('API_CONFIG:', API_CONFIG); // Log the API_CONFIG

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
  status: 'pending' | 'running' | 'success' | 'error';
  result?: {
    pdbData: string;
    confidenceScore: number;
    domains?: Array<{
      start: number;
      end: number;
      confidence: number;
    }>;
  };
  error?: string;
}

class AlphaFold3Service {
  private baseUrl: string;

  constructor() {
    if (!API_CONFIG.alphafold3 || !API_CONFIG.alphafold3.baseUrl) {
      throw new Error('AlphaFold3 baseUrl is not defined in API_CONFIG');
    }
    this.baseUrl = API_CONFIG.alphafold3.baseUrl;
  }

  async submitPrediction(request: PredictionRequest): Promise<string> {
    try {
      // Real AlphaFold API endpoint
      const response = await axios.post(
        `${this.baseUrl}/prediction`,
        {
          sequence: request.sequence,
          template_mode: request.options?.templates ? 'template' : 'pdb70',
          model_mode: request.mode === 'accurate' ? 'monomer' : 'multimer',
          max_template_date: '2024-12-08', // Current date
          num_predictions: 1
        }
      );

      if (response.data.error) {
        throw new Error(response.data.error);
      }

      return response.data.job_id;
    } catch (error) {
      console.error('Error submitting prediction:', error);
      throw error;
    }
  }

  async getPredictionStatus(jobId: string): Promise<PredictionResult> {
    try {
      // Real AlphaFold API status endpoint
      const statusResponse = await axios.get(
        `${this.baseUrl}/status/${jobId}`
      );

      const status = statusResponse.data.status;

      if (status === 'error') {
        return {
          jobId,
          status: 'error',
          error: statusResponse.data.message || 'Prediction failed'
        };
      }

      if (status === 'success') {
        // Get the actual prediction results
        const resultResponse = await axios.get(
          `${this.baseUrl}/result/${jobId}`
        );

        return {
          jobId,
          status: 'success',
          result: {
            pdbData: resultResponse.data.pdb,
            confidenceScore: resultResponse.data.confidence_score,
            domains: resultResponse.data.domain_definitions?.map((d: any) => ({
              start: d.start,
              end: d.end,
              confidence: d.confidence
            }))
          }
        };
      }

      return {
        jobId,
        status: status === 'running' ? 'running' : 'pending'
      };
    } catch (error) {
      console.error('Error getting prediction status:', error);
      throw error;
    }
  }

  async getPDBStructure(uniprotId: string): Promise<string> {
    try {
      // Get structure from AlphaFold database
      const response = await axios.get(
        `https://alphafold.ebi.ac.uk/files/AF-${uniprotId}-F1-model_v4.pdb`
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching PDB structure:', error);
      throw error;
    }
  }

  async getStructureMetadata(uniprotId: string): Promise<any> {
    try {
      // Get metadata from AlphaFold database
      const response = await axios.get(
        `https://alphafold.ebi.ac.uk/api/prediction/${uniprotId}`
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching structure metadata:', error);
      throw error;
    }
  }
}

export const alphafold3Service = new AlphaFold3Service();
