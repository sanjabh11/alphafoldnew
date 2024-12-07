// src/components/ExpressionAnalysis/ExpressionAnalysisPanel.tsx
import React, { useState, useCallback, useEffect } from 'react';
import { geneExpressionService, PathwayAnalysisResult, CoexpressionNetwork } from '../../services/geneExpressionService';

const ExpressionAnalysisPanel: React.FC = () => {
  const [geneId, setGeneId] = useState('');
  const [organism, setOrganism] = useState('');
  const [tissueType, setTissueType] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'expression' | 'pathway' | 'coexpression'>('expression');
  const [pathwayData, setPathwayData] = useState<PathwayAnalysisResult[]>([]);
  const [networkData, setNetworkData] = useState<CoexpressionNetwork | null>(null);
  const [correlationThreshold, setCorrelationThreshold] = useState(0.7);

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

  const handlePathwayAnalysis = async () => {
    if (!geneId) return;
    setIsLoading(true);
    setError(null);

    try {
      const results = await geneExpressionService.analyzePathways([geneId]);
      setPathwayData(results);
    } catch (err) {
      console.error('Pathway analysis failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to analyze pathways');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCoexpressionAnalysis = async () => {
    if (!geneId) return;
    setIsLoading(true);
    setError(null);

    try {
      const network = await geneExpressionService.getCoexpressionNetwork(geneId, correlationThreshold);
      setNetworkData(network);
    } catch (err) {
      console.error('Coexpression analysis failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate coexpression network');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'pathway' && geneId && !pathwayData.length) {
      handlePathwayAnalysis();
    } else if (activeTab === 'coexpression' && geneId && !networkData) {
      handleCoexpressionAnalysis();
    }
  }, [activeTab, geneId]);

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Gene Expression Analysis</h2>

      <div className="mb-4">
        <div className="flex space-x-2 mb-4">
          <button
            onClick={() => setActiveTab('expression')}
            className={`px-4 py-2 rounded ${
              activeTab === 'expression' ? 'bg-blue-500 text-white' : 'bg-gray-200'
            }`}
          >
            Expression
          </button>
          <button
            onClick={() => setActiveTab('pathway')}
            className={`px-4 py-2 rounded ${
              activeTab === 'pathway' ? 'bg-blue-500 text-white' : 'bg-gray-200'
            }`}
          >
            Pathway Analysis
          </button>
          <button
            onClick={() => setActiveTab('coexpression')}
            className={`px-4 py-2 rounded ${
              activeTab === 'coexpression' ? 'bg-blue-500 text-white' : 'bg-gray-200'
            }`}
          >
            Coexpression Network
          </button>
        </div>

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

        {error && (
          <div className="mt-4 p-4 bg-red-100 text-red-700 rounded">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="mt-4 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-2">Loading...</p>
          </div>
        ) : (
          <div className="mt-4">
            {activeTab === 'expression' && data && (
              <div className="space-y-4">
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

            {activeTab === 'pathway' && pathwayData.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Pathway Analysis Results</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Pathway
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          P-Value
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Fold Change
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {pathwayData.map((pathway) => (
                        <tr key={pathway.pathwayId}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{pathway.name}</div>
                            <div className="text-sm text-gray-500">{pathway.pathwayId}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{pathway.pValue.toExponential(2)}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{pathway.foldChange.toFixed(2)}</div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'coexpression' && networkData && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Coexpression Network</h3>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700">
                    Correlation Threshold
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={correlationThreshold}
                    onChange={(e) => setCorrelationThreshold(parseFloat(e.target.value))}
                    className="mt-1 block w-full"
                  />
                  <span className="text-sm text-gray-500">{correlationThreshold}</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Gene
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Correlation Score
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {networkData.nodes.map((node) => (
                        <tr key={node.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{node.name}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{node.score.toFixed(3)}</div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ExpressionAnalysisPanel;