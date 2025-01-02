import React, { useState, useEffect } from 'react';
import { MolstarViewer } from '../components/MolstarViewer';
import { ProteinViewer } from '../components/ProteinViewer';

const ExperimentsPage: React.FC = () => {
  const [viewerType, setViewerType] = useState<'molstar' | 'ngl'>('molstar');
  const [pdbId, setPdbId] = useState('1cbs');
  const [viewerKey, setViewerKey] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const handleLoadStructure = () => {
    setViewerKey(prev => prev + 1);
    setError(null);
  };

  useEffect(() => {
    console.log('Current viewer type:', viewerType);
    console.log('Current PDB ID:', pdbId);
  }, [viewerType, pdbId]);

  return (
    <div className="container mx-auto p-4">
      <div className="bg-white rounded-lg shadow-lg p-6 min-h-screen">
        <h2 className="text-2xl font-bold mb-4">Protein Structure Viewer</h2>
        
        {/* Controls */}
        <div className="mb-4 flex items-center gap-2">
          <select 
            value={viewerType}
            onChange={(e) => setViewerType(e.target.value as 'molstar' | 'ngl')}
            className="p-2 border rounded"
          >
            <option value="molstar">Molstar Viewer</option>
            <option value="ngl">NGL Viewer</option>
          </select>
          
          <input
            type="text"
            value={pdbId}
            onChange={(e) => setPdbId(e.target.value.toUpperCase())}
            placeholder="Enter PDB ID"
            className="p-2 border rounded flex-1"
          />
          <button
            onClick={handleLoadStructure}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Load Structure
          </button>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-100 text-red-700 rounded">
            {error}
          </div>
        )}

        <div className="bg-gray-50 rounded-lg p-4 relative" style={{ height: '70vh', minHeight: '600px' }}>
          {viewerType === 'molstar' ? (
            <MolstarViewer 
              key={viewerKey}
              pdbId={pdbId}
              height="100%"
              width="100%"
              className="w-full h-full"
              onError={(err) => setError(err)}
            />
          ) : (
            <ProteinViewer 
              pdbId={pdbId}
              style={{ width: '100%', height: '100%' }}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default ExperimentsPage; 