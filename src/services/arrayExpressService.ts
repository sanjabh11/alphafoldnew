import axios from 'axios';
import { StorageService } from './storage';

interface ArrayExpressExperiment {
  accession: string;
  title: string;
  description: string;
  organism: string;
  experimentType: string;
  releaseDate: string;
  lastUpdate: string;
  protocols: string[];
  files: {
    name: string;
    type: string;
    url: string;
  }[];
}

export class ArrayExpressService {
  private readonly BASE_URL = 'https://www.ebi.ac.uk/arrayexpress/json/v3';
  private storage: StorageService;
  private CACHE_KEY_PREFIX = 'arrayexpress_';

  constructor(storage: StorageService) {
    this.storage = storage;
  }

  async searchExperiments(query: string, species?: string): Promise<ArrayExpressExperiment[]> {
    try {
      // Check cache first
      const cachedResults = await this.storage.getSearchResults(
        `${this.CACHE_KEY_PREFIX}${query}_${species || ''}`
      );
      if (cachedResults) {
        return cachedResults;
      }

      // Build query parameters
      const params = new URLSearchParams();
      params.append('keywords', query);
      if (species) {
        params.append('species', species);
      }

      const response = await axios.get(`${this.BASE_URL}/experiments`, {
        params,
        headers: {
          'Accept': 'application/json'
        }
      });

      if (!response.data.experiments || !response.data.experiments.experiment) {
        return [];
      }

      const experiments: ArrayExpressExperiment[] = response.data.experiments.experiment.map((exp: any) => ({
        accession: exp.accession,
        title: exp.name,
        description: exp.description || '',
        organism: exp.organism || '',
        experimentType: exp.experimenttype || '',
        releaseDate: exp.releasedate || '',
        lastUpdate: exp.lastupdatedate || '',
        protocols: exp.protocols?.protocol || [],
        files: (exp.files?.file || []).map((file: any) => ({
          name: file.name,
          type: file.type,
          url: file.url
        }))
      }));

      // Cache the results
      await this.storage.saveSearchResults(
        `${this.CACHE_KEY_PREFIX}${query}_${species || ''}`,
        experiments
      );

      return experiments;
    } catch (error) {
      console.error('Error searching ArrayExpress:', error);
      throw new Error('Failed to search ArrayExpress experiments');
    }
  }

  async getExperimentDetails(accession: string): Promise<ArrayExpressExperiment | null> {
    try {
      // Check cache first
      const cachedResult = await this.storage.getSearchResults(
        `${this.CACHE_KEY_PREFIX}experiment_${accession}`
      );
      if (cachedResult) {
        return cachedResult;
      }

      const response = await axios.get(`${this.BASE_URL}/experiments/${accession}`);
      
      if (!response.data.experiments || !response.data.experiments.experiment?.[0]) {
        return null;
      }

      const exp = response.data.experiments.experiment[0];
      const experiment: ArrayExpressExperiment = {
        accession: exp.accession,
        title: exp.name,
        description: exp.description || '',
        organism: exp.organism || '',
        experimentType: exp.experimenttype || '',
        releaseDate: exp.releasedate || '',
        lastUpdate: exp.lastupdatedate || '',
        protocols: exp.protocols?.protocol || [],
        files: (exp.files?.file || []).map((file: any) => ({
          name: file.name,
          type: file.type,
          url: file.url
        }))
      };

      // Cache the result
      await this.storage.saveSearchResults(
        `${this.CACHE_KEY_PREFIX}experiment_${accession}`,
        experiment
      );

      return experiment;
    } catch (error) {
      console.error('Error fetching experiment details:', error);
      throw new Error('Failed to fetch experiment details');
    }
  }
}
