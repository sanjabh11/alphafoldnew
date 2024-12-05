export interface Protein {
  id: string;
  name: string;
  description: string;
  sequence: string;
  length: number;
  organism: string;
  uniprotId: string;
}

export interface SearchResult {
  proteins: Protein[];
  total: number;
  page: number;
  perPage: number;
}

export interface StructureData {
  pdbId: string;
  resolution: number;
  experimentalMethod: string;
  confidenceScore: number;
  coordinates: string;
}