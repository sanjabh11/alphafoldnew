import React, { useState, useCallback } from 'react';
import ExpressionViewer from './ExpressionViewer';
import { geneExpressionService, ExpressionQuery, ExpressionData } from '../../services/geneExpressionService';
import { ProcessedData } from '../../utils/dataProcessing';

interface ExpressionAnalysisPanelProps {
  geneId?: string;
  onDataProcessed?: (data: ProcessedData) => void;
  className?: string;
}

const ExpressionAnalysisPanel: React.FC<ExpressionAnalysisPanelProps> = ({
  geneId: initialGeneId,
  onDataProcessed,
  className = ''
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expressionData, setExpressionData] = useState<ExpressionData[]>([]);
  const [searchAttempted, setSearchAttempted] = useState(false);
  const [query, setQuery] = useState<ExpressionQuery>({
    geneId: initialGeneId || '',
    organism: '',
    tissueType: '',
    experimentType: ''
  });

  const handleSearch = useCallback(async () => {
    if (!query.geneId) {
      setError('Please enter a gene ID');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSearchAttempted(true);
    console.log('Starting search with query:', query);

    try {
      const { geoResults, arrayExpressResults, error: searchError } = await geneExpressionService.searchGene(query);
      
      if (searchError) {
        console.error('Search error:', searchError);
        setError(searchError);
        return;
      }

      const allResults = [...geoResults, ...arrayExpressResults];
      console.log('Combined results:', allResults);

      if (allResults.length === 0) {
        setError('No expression data found for the specified criteria');
      } else {
        setExpressionData(allResults);
      }
    } catch (err) {
      console.error('Search failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch expression data');
    } finally {
      setIsLoading(false);
    }
  }, [query]);

  const handleQueryChange = useCallback((field: keyof ExpressionQuery, value: string) => {
    setQuery(prev => ({ ...prev, [field]: value }));
    setError(null);
  }, []);

  return (
    <div className={`expression-analysis-panel p-4 ${className}`}>
      <div className="mb-4 space-y-2">
        <h2 className="text-xl font-bold">Gene Expression Analysis</h2>
        
        <div className="flex flex-col space-y-2 sm:flex-row sm:space-x-2 sm:space-y-0">
          <input
            type="text"
            placeholder="Gene ID (e.g., ARHGAP36)"
            className="border rounded px-2 py-1 flex-1"
            value={query.geneId}
            onChange={(e) => handleQueryChange('geneId', e.target.value)}
          />
          <input
            type="text"
            placeholder="Organism (e.g., human)"
            className="border rounded px-2 py-1"
            value={query.organism}
            onChange={(e) => handleQueryChange('organism', e.target.value)}
          />
          <input
            type="text"
            placeholder="Tissue Type"
            className="border rounded px-2 py-1"
            value={query.tissueType}
            onChange={(e) => handleQueryChange('tissueType', e.target.value)}
          />
          <button
            className="px-4 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleSearch}
            disabled={isLoading || !query.geneId}
          >
            {isLoading ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Searching...
              </span>
            ) : 'Search'}
          </button>
        </div>

        {error && (
          <div className="text-red-500 bg-red-50 border border-red-200 rounded p-2">
            {error}
          </div>
        )}

        {!error && searchAttempted && expressionData.length === 0 && !isLoading && (
          <div className="text-gray-500 bg-gray-50 border border-gray-200 rounded p-2">
            No expression data found. Try adjusting your search criteria.
          </div>
        )}
      </div>

      {expressionData.length > 0 && (
        <ExpressionViewer
          data={expressionData}
          onAnalysisComplete={onDataProcessed}
        />
      )}

      {!error && !searchAttempted && !isLoading && (
        <div className="text-gray-500 text-center py-8">
          Enter a gene ID and click Search to view expression data.
        </div>
      )}
    </div>
  );
};

export default ExpressionAnalysisPanel;
