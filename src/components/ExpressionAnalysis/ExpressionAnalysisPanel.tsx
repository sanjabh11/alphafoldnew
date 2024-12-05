import React, { useState, useCallback } from 'react';
import { ExpressionViewer } from './ExpressionViewer';
import { geneExpressionService, ExpressionQuery, ExpressionData } from '../../services/geneExpressionService';
import { ProcessedData } from '../../utils/dataProcessing';

interface ExpressionAnalysisPanelProps {
  geneId?: string;
  onDataProcessed?: (data: ProcessedData) => void;
  className?: string;
}

const ExpressionAnalysisPanel: React.FC<ExpressionAnalysisPanelProps> = ({
  geneId,
  onDataProcessed,
  className = ''
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expressionData, setExpressionData] = useState<ExpressionData[]>([]);
  const [query, setQuery] = useState<ExpressionQuery>({
    geneId: geneId || '',
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

    try {
      const results = await geneExpressionService.searchAllSources(query);
      setExpressionData(results);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch expression data');
    } finally {
      setIsLoading(false);
    }
  }, [query]);

  const handleQueryChange = useCallback((field: keyof ExpressionQuery, value: string) => {
    setQuery(prev => ({ ...prev, [field]: value }));
  }, []);

  return (
    <div className={`expression-analysis-panel p-4 ${className}`}>
      <div className="mb-4 space-y-2">
        <h2 className="text-xl font-bold">Gene Expression Analysis</h2>
        
        <div className="flex space-x-2">
          <input
            type="text"
            placeholder="Gene ID"
            className="border rounded px-2 py-1 flex-1"
            value={query.geneId}
            onChange={(e) => handleQueryChange('geneId', e.target.value)}
          />
          <input
            type="text"
            placeholder="Organism"
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
            className="px-4 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
            onClick={handleSearch}
            disabled={isLoading}
          >
            {isLoading ? 'Loading...' : 'Search'}
          </button>
        </div>
      </div>

      {error && (
        <div className="text-red-500 mb-4">
          {error}
        </div>
      )}

      {expressionData.length > 0 && (
        <ExpressionViewer
          data={expressionData}
          onAnalysisComplete={onDataProcessed}
        />
      )}

      {!error && expressionData.length === 0 && !isLoading && (
        <div className="text-gray-500 text-center py-8">
          No expression data available. Please search for a gene.
        </div>
      )}
    </div>
  );
};

export default ExpressionAnalysisPanel;
