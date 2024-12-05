// src/services/downloadService.ts
export const downloadStructure = async (uniprotId: string, format: string) => {
    try {
      const response = await fetch(`https://alphafold.ebi.ac.uk/files/AF-${uniprotId}-F1-model_v4.${format}`);
      if (!response.ok) throw new Error('Download failed');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${uniprotId}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
      throw error;
    }
  };