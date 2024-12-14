import { rateLimiter } from '../utils/rateLimiter';

const BASE_URL = import.meta.env.VITE_GEO_API_URL;
const API_KEY = import.meta.env.VITE_NCBI_API_KEY;

export interface GEOSearchParams {
  term: string;
  retmax?: number;
  retstart?: number;
}

export const geoService = {
  searchDatasets: rateLimiter(async ({ term, retmax = 20, retstart = 0 }: GEOSearchParams) => {
    const params = new URLSearchParams({
      db: 'gds',
      term,
      retmax: retmax.toString(),
      retstart: retstart.toString(),
      retmode: 'json',
      api_key: API_KEY
    });

    const response = await fetch(`${BASE_URL}/esearch.fcgi?${params}`);
    if (!response.ok) throw new Error('Failed to fetch GEO datasets');
    
    return await response.json();
  }),

  getDatasetDetails: rateLimiter(async (gdsId: string) => {
    const params = new URLSearchParams({
      db: 'gds',
      id: gdsId,
      retmode: 'json',
      api_key: API_KEY
    });

    const response = await fetch(`${BASE_URL}/efetch.fcgi?${params}`);
    if (!response.ok) throw new Error('Failed to fetch dataset details');
    
    return await response.json();
  })
}; 