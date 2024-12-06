// src/components/ExpressionAnalysis/ExpressionAnalysisPanel.tsx
import React, { useState, useCallback } from 'react';
import { geneExpressionService } from '../../services/geneExpressionService';

const ExpressionAnalysisPanel: React.FC = () => {
  const [geneId, setGeneId] = useState('');
  const [organism, setOrganism] = useState('');
  const [tissueType, setTissueType] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setData(null);

    try {
      console.log('Starting search for:', { geneId, organism, tissueType });

      const results = await geneExpressionService.searchGene({
        geneId: geneId.toUpperCase(),
        organism,
        tissueType
      });

      console.log('Search results:', results);

      if (results.error) {
        if (results.error.includes('API key')) {
          setError('NCBI API key is missing. Please configure your environment variables.');
        } else {
          setError(results.error);
        }
        return;
      }

      if (results.geoResults.length === 0 && results.arrayExpressResults.length === 0) {
        setError('No expression data found for the specified criteria');
      } else {
        setData({
          geo: results.geoResults,
          arrayExpress: results.arrayExpressResults
        });
      }
    } catch (err) {
      console.error('Search failed:', err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to fetch expression data');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Gene Expression Analysis</h2>

      <form onSubmit={handleSearch} className="space-y-4">
        <div>
          <input
            type="text"
            value={geneId}
            onChange={(e) => setGeneId(e.target.value)}
            placeholder="Gene ID (e.g., GAPDH)"
            className="w-full p-2 border rounded"
            required
          />
        </div>

        <div>
          <input
            type="text"
            value={organism}
            onChange={(e) => setOrganism(e.target.value)}
            placeholder="Organism (e.g., human)"
            className="w-full p-2 border rounded"
          />
        </div>

        <div>
          <input
            type="text"
            value={tissueType}
            onChange={(e) => setTissueType(e.target.value)}
            placeholder="Tissue Type"
            className="w-full p-2 border rounded"
          />
        </div>

        <button
          type="submit"
          disabled={isLoading || !geneId}
          className="w-full p-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {isLoading ? 'Searching...' : 'Search'}
        </button>
      </form>

      {isLoading && (
        <div className="mt-4 text-center">
          Searching for expression data...
        </div>
      )}

      {error && (
        <div className="mt-4 text-red-500">
          {error}
        </div>
      )}

      {data && (
        <div className="mt-4">
          <h3 className="text-lg font-semibold">Results</h3>
          {data.geo.length > 0 && (
            <div className="mt-2">
              <h4>GEO Data ({data.geo.length} results)</h4>
              {/* Add visualization of GEO data */}
            </div>
          )}
          {data.arrayExpress.length > 0 && (
            <div className="mt-2">
              <h4>ArrayExpress Data ({data.arrayExpress.length} results)</h4>
              {/* Add visualization of ArrayExpress data */}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ExpressionAnalysisPanel;