import { useState } from 'react';
import ProteinViewer from '../components/ProteinViewer';
import ProteinSearch from '../components/ProteinSearch';

const ProteinStructurePage = () => {
  const [selectedProteinId, setSelectedProteinId] = useState<string>();

  return (
    <div className="container mx-auto p-4 space-y-6">
      <h1 className="text-2xl font-bold">Protein Structure Viewer</h1>
      
      <ProteinSearch onSelectProtein={setSelectedProteinId} />
      
      <div className="bg-white rounded-lg shadow-lg p-4">
        <ProteinViewer proteinId={selectedProteinId} />
      </div>
    </div>
  );
};

export default ProteinStructurePage; 