import axios from 'axios';
import { API_CONFIG } from '../config/apiConfig';

export interface MolecularInteraction {
  id: string;
  confidence: number;
  interactionType: string;
  residues: string[];
  score: number;
}

export interface ComplexStructure {
  id: string;
  chains: string[];
  resolution: number;
  method: string;
  pdbData: string;
}

export class AlphaFoldService {
  static async predictInteractions(sequence: string): Promise<MolecularInteraction[]> {
    try {
      const response = await axios.post(
        `${API_CONFIG.alphafold3.baseUrl}${API_CONFIG.alphafold3.endpoints.interaction}`,
        {
          sequence,
          format: API_CONFIG.alphafold3.params.format,
          version: API_CONFIG.alphafold3.params.version
        }
      );
      return response.data.interactions;
    } catch (error) {
      console.error('Error predicting interactions:', error);
      throw new Error('Failed to predict molecular interactions');
    }
  }

  static async getComplexStructure(chainIds: string[]): Promise<ComplexStructure> {
    try {
      const response = await axios.post(
        `${API_CONFIG.alphafold3.baseUrl}${API_CONFIG.alphafold3.endpoints.complex}`,
        {
          chains: chainIds,
          format: API_CONFIG.alphafold3.params.format,
          version: API_CONFIG.alphafold3.params.version
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error getting complex structure:', error);
      throw new Error('Failed to retrieve complex structure');
    }
  }

  static async getStructurePrediction(sequence: string): Promise<string> {
    try {
      const response = await axios.post(
        `${API_CONFIG.alphafold3.baseUrl}${API_CONFIG.alphafold3.endpoints.predict}`,
        {
          sequence,
          format: API_CONFIG.alphafold3.params.format,
          version: API_CONFIG.alphafold3.params.version
        }
      );
      return response.data.pdbData;
    } catch (error) {
      console.error('Error predicting structure:', error);
      throw new Error('Failed to predict protein structure');
    }
  }
}
