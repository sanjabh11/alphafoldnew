import axios from 'axios';
import { API_CONFIG } from '../config/apiConfig';

export class ArrayExpressService {
  private readonly GWAS_BASE_URL = 'https://www.ebi.ac.uk/gwas/api/search';

  async searchExperiment(query: string) {
    try {
      const response = await axios.get(this.GWAS_BASE_URL, {
        params: {
          q: query
        },
        headers: {
          'Accept': 'application/json'
        }
      });

      if (response.data) {
        return this.formatGWASResponse(response.data);
      }
    } catch (error) {
      console.error('Error fetching data from GWAS API:', error);
      throw new Error('Failed to fetch experiment data from GWAS API');
    }
  }

  private formatGWASResponse(data: any) {
    return data.hits.map((hit: any) => ({
      accession: hit.accession,
      title: hit.title,
      description: hit.description || 'No description available',
      organism: hit.attributes?.organism || 'Not specified'
    }));
  }
}
