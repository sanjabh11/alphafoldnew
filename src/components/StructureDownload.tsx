// src/components/StructureDownload.tsx
import React from 'react';
import { Download } from 'lucide-react';
import { downloadStructure } from '../services/downloadService';

interface StructureDownloadProps {
  uniprotId: string;
}

const StructureDownload: React.FC<StructureDownloadProps> = ({ uniprotId }) => {
  const handleDownload = async (format: string) => {
    try {
      await downloadStructure(uniprotId, format);
    } catch (error) {
      console.error('Download failed:', error);
      // Add error handling UI if needed
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h3 className="text-lg font-semibold mb-3">Download Structure</h3>
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => handleDownload('pdb')}
          className="flex items-center gap-2 px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          <Download className="h-4 w-4" />
          PDB
        </button>
        <button
          onClick={() => handleDownload('cif')}
          className="flex items-center gap-2 px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          <Download className="h-4 w-4" />
          mmCIF
        </button>
      </div>
    </div>
  );
};

export default StructureDownload;