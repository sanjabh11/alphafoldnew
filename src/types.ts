// src/types.ts
export interface Protein {
    id: string;
    name: string;
    description: string;
    length: number;
    organism: string;
    uniprotId: string;
  }
  
  export interface StructureData {
    pdbId: string;
    resolution: number;
    experimentalMethod: string;
    confidenceScore: number;
    coordinates: string;
  }