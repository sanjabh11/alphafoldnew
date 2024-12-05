// src/types/protein.ts
export interface StyleOptions {
  representation: 'cartoon' | 'surface' | 'ball-and-stick' | 'ribbon';
  colorScheme: 'chainid' | 'residue' | 'secondary-structure' | 'custom';
  opacity: number;
}

export interface ChainInfo {
  id: string;
  description: string;
  visible: boolean;
  color: string;
}
export interface AnnotationGroup {
  id: string;
  name: string;
  types: string[];
}

export interface UniProtAnnotation {
  type: string;
  location: {
    start: { value: number };
    end: { value: number };
  } | null;
  description: string;
  evidence?: string;
}

export interface LoadingState {
  isLoading: boolean;
  error: string | null;
}