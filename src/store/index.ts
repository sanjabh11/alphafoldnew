import { create } from 'zustand';
import { Protein } from '../types';

interface ProteinStore {
  selectedProtein: Protein | null;
  setSelectedProtein: (protein: Protein | null) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export const useProteinStore = create<ProteinStore>((set) => ({
  selectedProtein: null,
  setSelectedProtein: (protein) => set({ selectedProtein: protein }),
  searchQuery: '',
  setSearchQuery: (query) => set({ searchQuery: query }),
}));