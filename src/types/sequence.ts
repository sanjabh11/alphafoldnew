// src/types/sequence.ts
export interface AminoAcidProperties {
    name: string;
    type: string;
    polarity: string;
    charge: string;
    hydrophobicity: string;
    color: string;
  }
  
  export const aminoAcidProperties: Record<string, AminoAcidProperties> = {
    'A': { name: 'Alanine', type: 'Aliphatic', polarity: 'Nonpolar', charge: 'Neutral', hydrophobicity: 'Hydrophobic', color: '#FF9999' },
    'R': { name: 'Arginine', type: 'Basic', polarity: 'Polar', charge: 'Positive', hydrophobicity: 'Hydrophilic', color: '#0000FF' },
    'N': { name: 'Asparagine', type: 'Amide', polarity: 'Polar', charge: 'Neutral', hydrophobicity: 'Hydrophilic', color: '#00FF00' },
    // ... Add properties for all amino acids
  };