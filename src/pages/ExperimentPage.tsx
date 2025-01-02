// src/pages/ExperimentPage.tsx

import React, { useState, useEffect } from 'react';
import { Viewer } from 'molstar/lib/mol-plugin-ui/viewer';

interface ExperimentData {
  id: string;
  structure: string;
  // other fields
}

export const ExperimentPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ExperimentData | null>(null);
  const [viewer, setViewer] = useState<Viewer | null>(null);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const apiKey = import.meta.env.VITE_NCBI_API_KEY;
      const baseUrl = import.meta.env.VITE_GEO_API_URL;
      
      const response = await fetch(`${baseUrl}/your-endpoint?api_key=${apiKey}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(Number(import.meta.env.VITE_API_TIMEOUT)),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch data');
      }

      const experimentData = await response.json();
      setData(experimentData);
      
      // Load structure into viewer if available
      if (viewer && experimentData.structure) {
        await viewer.loadStructure(experimentData.structure);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (import.meta.env.VITE_MOLSTAR_ENABLED === 'true') {
      const molstarViewer = new Viewer('molstar-container', {
        layout: {
          initial: {
            isExpanded: false
          }
        },
        viewport: {
          backgroundColor: { r: 255, g: 255, b: 255 }
        }
      });
      setViewer(molstarViewer);

      return () => {
        molstarViewer.dispose();
      };
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [viewer]);

  return (
    <div className="experiment-page">
      <h1>Experiment Viewer</h1>
      {isLoading && <div className="loading">Loading...</div>}
      {error && <div className="error">Error: {error}</div>}
      {data && (
        <div className="experiment-data">
          {/* Add your data display components here */}
        </div>
      )}
      {import.meta.env.VITE_MOLSTAR_ENABLED === 'true' && (
        <div 
          id="molstar-container" 
          style={{ height: '400px', width: '100%', border: '1px solid #ccc' }} 
        />
      )}
    </div>
  );
};