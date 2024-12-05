// src/services/api.ts
import { StorageService } from './storage';
import { Protein } from '../types';
import axios from 'axios';

interface AlphaFoldPrediction {
  entryId: string;
  pdbUrl: string;
  cifUrl: string;
  bcifUrl: string;
  uniprotAccession: string;
  uniprotDescription: string;
  organismScientificName: string;
  modelCreatedDate: string;
  latestVersion: number;
}

export class APIService {
  private storage: StorageService;
  private worker: Worker;
  private CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours
  private BASE_URL = 'https://rest.uniprot.org/uniprotkb';
  private ALPHAFOLD_API_URL = 'https://alphafold.ebi.ac.uk/api';
  private ALPHAFOLD_FILES_URL = 'https://alphafold.ebi.ac.uk/files';

  constructor() {
    this.storage = new StorageService();
    this.worker = new Worker(
      new URL('../workers/structureProcessor.worker.ts', import.meta.url)
    );
    this.initializeServices();
  }

  private async initializeServices() {
    await this.storage.initDB();
    this.setupWorkerListeners();
  }

  private setupWorkerListeners() {
    this.worker.addEventListener('message', (event) => {
      const { type, data, error } = event.data;
      if (error) {
        console.error('Worker error:', error);
      }
    });
  }

  async searchProteins(query: string): Promise<Protein[]> {
    // Try cache first
    try {
      const cached = await this.storage.getSearchResults(query);
      if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
        return cached.results;
      }
    } catch (error) {
      console.warn('Cache read failed:', error);
    }

    // Fetch from UniProt API if not in cache
    try {
      const response = await axios.get(`${this.BASE_URL}/search`, {
        params: {
          query: query,
          format: 'json',
          fields: 'accession,id,protein_name,organism_name,length,sequence,gene_names',
          size: 10
        }
      });

      if (!response.data || !response.data.results) {
        throw new Error('Invalid response format from UniProt API');
      }

      // Transform UniProt response to our Protein format with proper null checks
      const proteins: Protein[] = response.data.results.map((item: any) => {
        // Get protein name with fallbacks
        const proteinName = 
          item.proteinDescription?.recommendedName?.fullName?.value ||
          item.proteinDescription?.submittedName?.[0]?.fullName?.value ||
          item.proteinDescription?.alternativeName?.[0]?.fullName?.value ||
          item.gene_names?.[0] ||
          'Unknown Protein';

        // Get description with fallback
        const description = 
          item.proteinDescription?.recommendedName?.fullName?.value ||
          item.proteinDescription?.submittedName?.[0]?.fullName?.value ||
          '';

        // Ensure we have a valid UniProt ID
        const uniprotId = item.primaryAccession || item.accession || item.id;

        return {
          id: uniprotId,
          uniprotId: uniprotId,
          name: proteinName,
          description: description,
          length: item.sequence?.length || 0,
          organism: item.organism?.scientificName || 'Unknown Organism',
          sequence: item.sequence?.value || ''
        };
      });

      // Save to cache
      await this.storage.saveSearchResults(query, proteins);

      return proteins;
    } catch (error) {
      console.error('Search error:', error);
      if (axios.isAxiosError(error)) {
        throw new Error(
          error.response?.data?.message || 'Failed to search proteins'
        );
      }
      throw error;
    }
  }

  async getProteinStructure(uniprotId: string): Promise<any> {
    try {
      // Check cache first
      const cached = await this.storage.getStructure(uniprotId);
      if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
        return cached.data;
      }

      // First try to get metadata from AlphaFold API
      const metadataUrl = `${this.ALPHAFOLD_API_URL}/prediction/${uniprotId}`;
      const metadataResponse = await axios.get(metadataUrl, {
        headers: {
          'Accept': 'application/json'
        }
      });

      if (!metadataResponse.data || !Array.isArray(metadataResponse.data) || metadataResponse.data.length === 0) {
        throw new Error('No structure prediction available');
      }

      // Get the PDB file URL from metadata
      const prediction = metadataResponse.data[0];
      const pdbUrl = prediction.pdbUrl || `${this.ALPHAFOLD_FILES_URL}/AF-${uniprotId}-F1-model_v4.pdb`;

      // Get the actual PDB file
      const response = await axios.get(pdbUrl, {
        responseType: 'text',
        headers: {
          'Accept': 'text/plain'
        }
      });

      if (!response.data || response.data.trim() === '') {
        throw new Error('Received empty PDB data from AlphaFold');
      }

      // Process PDB data
      const pdbData = response.data;
      
      // Basic validation
      if (!pdbData.includes('ATOM') && !pdbData.includes('HETATM')) {
        throw new Error('Invalid PDB file format');
      }

      // Clean up PDB data
      const cleanedPdb = pdbData
        .split('\n')
        .filter((line: string) => line.trim().length > 0)
        .map((line: string) => {
          // Ensure proper line length
          if (line.length < 80) {
            return line.padEnd(80);
          }
          return line;
        })
        .join('\n');

      const data = {
        pdbId: uniprotId,
        experimentalMethod: 'AlphaFold Prediction',
        confidenceScore: prediction.confidenceScore || 100,
        coordinates: cleanedPdb,
        metadata: {
          modelCreatedDate: prediction.modelCreatedDate,
          source: 'AlphaFold DB',
          version: prediction.latestVersion || 4,
          organism: prediction.organismScientificName
        }
      };

      // Save to cache
      await this.storage.saveStructure(uniprotId, data);

      return data;
    } catch (error) {
      console.error('Structure fetch error:', error);
      
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        if (status === 404) {
          throw new Error(`No structure available for protein ${uniprotId}`);
        }
        if (status === 422) {
          throw new Error(`Invalid UniProt ID: ${uniprotId}`);
        }
        throw new Error(
          'Failed to fetch protein structure. This protein may not have a predicted structure available.'
        );
      }
      
      throw error;
    }
  }

  async getProteinInfo(uniprotId: string) {
    try {
      const response = await axios.get(`${this.BASE_URL}/${uniprotId}`, {
        params: {
          format: 'json',
          fields: 'id,sequence,organism_name,length,feature_count,protein_name'
        }
      });

      return {
        sequence: response.data.sequence?.value,
        organism: response.data.organism?.scientificName,
        length: response.data.sequence?.length,
        name: response.data.proteinDescription?.recommendedName?.fullName?.value || response.data.proteinName,
        features: response.data.features || []
      };
    } catch (error) {
      console.error('Error fetching protein metadata:', error);
      throw error;
    }
  }
}

export const api = new APIService();