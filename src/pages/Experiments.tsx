import React, { useState } from 'react';
import MolstarViewer from '../components/MolstarViewer';

const Experiments: React.FC = () => {
  const [pdbId, setPdbId] = useState('1CRN');
  const [viewerKey, setViewerKey] = useState(0);

  const handleLoadStructure = () => {
    setViewerKey(prev => prev + 1);
  };

  return (
    <div className="container mx-auto p-4">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-bold mb-4">Protein Structure Viewer</h1>
        <p className="mb-4">Enter a PDB ID to visualize its 3D structure using Molstar.</p>

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
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
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
          <div className="relative" style={{ height: '600px' }}>
            <MolstarViewer
              key={viewerKey}
              pdbId={pdbId}
              height="100%"
              advancedConfig={{
                viewportShowControls: true,
                viewportShowSettings: true,
                viewportShowSelectionMode: true,
                viewportShowAnimation: true,
                viewportShowTrajectoryControls: true,
                volumeStreamingEnabled: true,
                viewportShowAxes: true,
                viewportShowExpanded: true
              }}
            />
          </div>
        </div>

        <div className="mt-4 text-sm text-gray-600">
          <h2 className="font-semibold mb-2">Controls:</h2>
          <ul className="list-disc list-inside space-y-1">
            <li>Left mouse: Rotate</li>
            <li>Right mouse: Zoom</li>
            <li>Middle mouse: Pan</li>
            <li>Use the toolbar above the viewer for additional controls</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Experiments;