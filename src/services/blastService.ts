// src/services/blastService.ts
import axios from 'axios';

export class BlastService {
  private readonly BLAST_API_URL = 'https://blast.ncbi.nlm.nih.gov/Blast.cgi';

  async submitBlastSearch(sequence: string) {
    try {
      const params = new URLSearchParams({
        CMD: 'Put',
        PROGRAM: 'blastp',
        DATABASE: 'nr',
        QUERY: sequence
      });

      const response = await axios.post(this.BLAST_API_URL, params);
      return response.data.RID; // Request ID for checking results
    } catch (error) {
      console.error('Error submitting BLAST search:', error);
      throw error;
    }
  }

  async checkBlastResults(requestId: string) {
    try {
      const params = new URLSearchParams({
        CMD: 'Get',
        RID: requestId,
        FORMAT_TYPE: 'JSON2_S'
      });

      const response = await axios.get(`${this.BLAST_API_URL}?${params}`);
      return response.data;
    } catch (error) {
      console.error('Error checking BLAST results:', error);
      throw error;
    }
  }
}

export const blastService = new BlastService();