import axios from 'axios';
import { API_CONFIG } from '../config/apiConfig';

// Types for API responses
interface NCBISearchResponse {
  esearchresult: {
    idlist: string[];
    count: string;
    retmax: string;
    retstart: string;
  };
}

interface ArrayExpressExperiment {
  accession: string;
  name: string;
  description: string;
  organism: string;
}

interface UniProtEntry {
  accession: string;
  id: string;
  proteinExistence: string;
  organism: {
    scientificName: string;
  };
}

export class DataService {
  // NCBI/GEO Data Fetching
  static async searchGEODatasets(query: string) {
    const params = new URLSearchParams({
      db: 'gds',
      term: query,
      retmode: 'json',
      retmax: '20',
      api_key: API_CONFIG.ncbi.apiKey || ''
    });

    const response = await axios.get<NCBISearchResponse>(
      `${API_CONFIG.ncbi.baseUrl}${API_CONFIG.ncbi.endpoints.search}?${params}`
    );
    return response.data;
  }

  static async fetchGEODataset(id: string) {
    const params = new URLSearchParams({
      db: 'gds',
      id: id,
      retmode: 'json',
      api_key: API_CONFIG.ncbi.apiKey || ''
    });

    const response = await axios.get(
      `${API_CONFIG.ncbi.baseUrl}${API_CONFIG.ncbi.endpoints.fetch}?${params}`
    );
    return response.data;
  }

  static async getGEODatasetDetails(id: string) {
    const params = new URLSearchParams({
      db: 'gds',
      id: id,
      retmode: 'json',
      api_key: API_CONFIG.ncbi.apiKey || ''
    });

    const response = await axios.get(
      `${API_CONFIG.ncbi.baseUrl}${API_CONFIG.ncbi.endpoints.fetch}?${params}`
    );
    return response.data;
  }

  // ArrayExpress Data Fetching
  static async searchArrayExpress(query: string) {
    try {
      // First, try direct accession lookup
      if (query.toUpperCase().startsWith('E-')) {
        try {
          const details = await this.getArrayExpressExperimentDetails(query);
          return {
            experiments: [details]
          };
        } catch (error) {
          console.log('Direct accession lookup failed, trying search...');
        }
      }

      // If direct lookup fails or it's not an accession number, try search
      const response = await axios.get(
        `${API_CONFIG.arrayexpress.baseUrl}${API_CONFIG.arrayexpress.endpoints.search}`,
        {
          params: {
            query: query,
            collection: API_CONFIG.arrayexpress.collection,
            pageSize: 10
          }
        }
      );

      if (!response.data || !response.data.hits) {
        return { experiments: [] };
      }

      return {
        experiments: response.data.hits.map((hit: any) => ({
          accession: hit.accession,
          name: hit.title,
          description: hit.description || hit.summary,
          organism: hit.attributes?.organism || 'Not specified'
        }))
      };
    } catch (error) {
      console.error('ArrayExpress search error:', error);
      throw new Error('Failed to search ArrayExpress data');
    }
  }

  static async getArrayExpressExperimentDetails(accession: string) {
    try {
      const response = await axios.get(
        `${API_CONFIG.arrayexpress.baseUrl}${API_CONFIG.arrayexpress.endpoints.details}/${accession}`
      );

      const data = response.data;
      return {
        accession: data.accession || accession,
        title: data.title,
        description: data.description || data.summary,
        organism: data.attributes?.organism || 'Not specified',
        experimentType: data.attributes?.experimentType,
        submissionDate: data.attributes?.submissionDate,
        releaseDate: data.attributes?.releaseDate
      };
    } catch (error) {
      console.error('ArrayExpress details error:', error);
      throw new Error('Failed to fetch experiment details');
    }
  }

  static async getArrayExpressFiles(accession: string) {
    const response = await axios.get(
      `${API_CONFIG.arrayexpress.baseUrl}${API_CONFIG.arrayexpress.endpoints.files}/${accession}`
    );
    return response.data;
  }

  // UniProt Data Fetching
  static async searchUniProt(query: string) {
    const response = await axios.get(
      `${API_CONFIG.uniprot.baseUrl}${API_CONFIG.uniprot.endpoints.search}?query=${encodeURIComponent(query)}&format=json`
    );
    return response.data;
  }

  static async getUniProtEntry(accession: string) {
    const response = await axios.get<UniProtEntry>(
      `${API_CONFIG.uniprot.baseUrl}${API_CONFIG.uniprot.endpoints.fetch}/${accession}?format=json`
    );
    return response.data;
  }

  static async getUniProtEntryDetails(accession: string) {
    if (!accession) {
      throw new Error('UniProt accession is required');
    }
    const response = await axios.get(
      `${API_CONFIG.uniprot.baseUrl}${API_CONFIG.uniprot.endpoints.entry}/${accession}?format=json`
    );
    return response.data;
  }

  // Error Handler
  private static handleError(error: any) {
    console.error('API Error:', error.response?.data || error.message);
    throw error;
  }
}
