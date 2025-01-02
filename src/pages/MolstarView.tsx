import React, { useState } from 'react';
import MolstarViewer from '../components/MolstarViewer';
import 'molstar/lib/mol-plugin-ui/skin/light.scss'; // Ensure SCSS is imported correctly

const MolstarView: React.FC = () => {
  const [pdbId, setPdbId] = useState<string>('');
  const [viewerKey, setViewerKey] = useState(0);

  const handleLoadStructure = () => {
    if (pdbId) {
      setViewerKey(prev => prev + 1);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold mb-4">Mol* Structure Viewer</h2>
        
        <div className="mb-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={pdbId}
              onChange={(e) => setPdbId(e.target.value.toUpperCase())}
              placeholder="Enter PDB ID (e.g., 1CRN)"
              className="flex-1 p-2 border rounded"
            />
            <button
              onClick={handleLoadStructure}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              disabled={!pdbId}
            >
              Load Structure
            </button>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Enter a valid PDB ID to view the protein structure
          </p>
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <MolstarViewer
            key={viewerKey}
            pdbId={pdbId}
            height="600px"
          />
        </div>
      </div>
    </div>
  );
};

export default MolstarView;
