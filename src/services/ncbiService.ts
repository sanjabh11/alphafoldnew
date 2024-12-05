import axios from 'axios';
import { API_CONFIG } from '../config/api';

class NCBIService {
  private readonly baseURL = API_CONFIG.BASE_URL;
  private readonly apiKey = API_CONFIG.NCBI_API_KEY;

  private async request(endpoint: string, params: any = {}) {
    try {
      const response = await axios.get(`${this.baseURL}${endpoint}`, {
        params: {
          ...params,
          api_key: this.apiKey
        },
        headers: {
          'Accept': 'application/json'
        }
      });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`NCBI API Error: ${error.response?.data?.message || error.message}`);
      }
      throw error;
    }
  }

  async searchProteins(query: string, params: any = {}) {
    return this.request('/search/protein', {
      term: query,
      ...params
    });
  }

  async getProteinStructure(id: string) {
    return this.request(`/structure/${id}`);
  }

  async runBlastSearch(sequence: string) {
    return this.request('/blast/blastp', {
      query: sequence,
      database: 'nr'
    });
  }
}

export const ncbiService = new NCBIService();