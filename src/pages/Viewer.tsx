// src/pages/Viewer.tsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { StructureData } from '../types';
import StructureViewer from '../components/StructureViewer';

const Viewer: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [structure, setStructure] = useState<StructureData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadStructure = async () => {
      if (!id) {
        navigate('/');
        return;
      }

      try {
        const data = await api.getStructure(id);
        setStructure(data);
      } catch (err) {
        setError('Failed to load protein structure');
        console.error('Structure loading error:', err);
      } finally {
        setLoading(false);
      }
    };

    loadStructure();
  }, [id, navigate]);

  if (!id) {
    return <Navigate to="/" />;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-4">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
          <button
            onClick={() => navigate('/')}
            className="ml-4 underline"
          >
            Return to search
          </button>
        </div>
      </div>
    );
  }

  if (!structure) {
    return <div className="p-4">No structure found</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <div className="bg-white rounded-lg shadow-lg p-4">
        <div className="mb-4">
          <h2 className="text-2xl font-bold">Structure Details</h2>
          <p className="mt-2">UniProt ID: {structure.pdbId}</p>
          <p>Method: {structure.experimentalMethod}</p>
          <p>Confidence Score: {structure.confidenceScore}</p>
        </div>
        
        <div className="mt-4">
          <h3 className="text-lg font-semibold mb-2">3D Structure Viewer</h3>
          <div className="border rounded-lg overflow-hidden">
            <StructureViewer structureUrl={structure.coordinates} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Viewer;