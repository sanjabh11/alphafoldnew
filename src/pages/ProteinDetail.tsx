// src/pages/ProteinDetail.tsx
import React, { useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import ProteinViewer from '../components/ProteinViewer';
import AnnotationViewer from '../components/AnnotationViewer';
import SequenceViewer from '../components/SequenceViewer';
import BlastSearch from '../components/BlastSearch';
import { Loader2 } from 'lucide-react';
import { Measurement } from '../types/measurements';

const ProteinDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [viewerStyle, setViewerStyle] = useState('cartoon');
  const [measurements, setMeasurements] = useState<Measurement[]>([]);

  // Fetch structure data
  const { 
    data: structure, 
    isLoading: structureLoading, 
    error: structureError 
  } = useQuery({
    queryKey: ['structure', id],
    queryFn: () => api.getProteinStructure(id!),
    enabled: !!id
  });

  // Fetch protein data
  const { 
    data: proteinData, 
    isLoading: proteinLoading 
  } = useQuery({
    queryKey: ['proteinData', id],
    queryFn: () => api.getProteinInfo(id!),
    enabled: !!id
  });

  // Handle measurement callback
  const handleMeasurement = useCallback((measurement: Measurement) => {
    setMeasurements(prev => [...prev, measurement]);
  }, []);

  // Handle download
  const handleDownload = useCallback(async (format: 'pdb' | 'mmcif') => {
    if (!id) return;
    try {
      const response = await fetch(`https://alphafold.ebi.ac.uk/files/AF-${id}-F1-model_v4.${format}`);
      if (!response.ok) throw new Error('Download failed');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${id}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
    }
  }, [id]);

  // Update test annotations with residue ranges that exist in P06213
  const testAnnotations = [
    {
      id: '1',
      label: 'Tyrosine Kinase Domain',
      residueRange: [980, 1000],
      type: 'active-site',
      description: 'Key catalytic domain responsible for phosphorylation',
      color: '#FFD700'
    },
    {
      id: '2',
      label: 'ATP Binding Site',
      residueRange: [1003, 1023],
      type: 'binding-site',
      description: 'ATP binding pocket essential for kinase activity',
      color: '#00FF00'
    }
  ];

  if (structureLoading || proteinLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (structureError || !structure) {
    return (
      <div className="text-red-500 p-4">
        Error loading protein structure.
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="p-6">
          <h1 className="text-2xl font-bold mb-4">Protein Structure Viewer</h1>
          
          {/* Metadata */}
          <div className="mb-4">
            <p className="text-gray-600">UniProt ID: {id}</p>
            <p className="text-gray-600">Method: {structure.experimentalMethod}</p>
          </div>

          {/* Download buttons */}
          <div className="mb-4 flex gap-2">
            <button
              onClick={() => handleDownload('pdb')}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center gap-2"
            >
              Download PDB
            </button>
            <button
              onClick={() => handleDownload('mmcif')}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center gap-2"
            >
              Download mmCIF
            </button>
          </div>

          {/* Style selector */}
          <div className="mb-4">
            <select
              value={viewerStyle}
              onChange={(e) => setViewerStyle(e.target.value)}
              className="px-3 py-2 border rounded"
            >
              <option value="cartoon">Cartoon</option>
              <option value="surface">Surface</option>
              <option value="ball+stick">Ball & Stick</option>
              <option value="ribbon">Ribbon</option>
            </select>
          </div>

          {/* Protein Viewer with annotations */}
          <ProteinViewer 
            pdbData={structure.coordinates}
            annotations={testAnnotations}
            onAnnotationClick={(annotation) => {
              console.log('Clicked annotation:', annotation);
            }}
            style={{ height: '600px' }}
            viewerStyle={viewerStyle}
            onMeasurement={handleMeasurement}
          />

          {/* Measurements Display */}
          {measurements.length > 0 && (
            <div className="mt-4">
              <h3 className="text-lg font-semibold mb-2">Measurements</h3>
              <div className="space-y-2">
                {measurements.map((m, index) => (
                  <div key={index} className="text-sm">
                    {m.type}: {m.value.toFixed(2)} {m.type === 'angle' ? '°' : 'Å'}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Annotations */}
          {id && (
            <div className="border-t mt-6">
              <AnnotationViewer uniprotId={id} />
            </div>
          )}

          {/* Sequence Viewer */}
          {proteinData?.sequence && (
            <div className="mt-6">
              <SequenceViewer 
                uniprotId={id!}
                sequence={proteinData.sequence}
                features={proteinData.features}
              />
            </div>
          )}

          {/* BLAST Search */}
          {proteinData?.sequence && (
            <div className="mt-6">
              <BlastSearch sequence={proteinData.sequence} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProteinDetail;