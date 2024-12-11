import React, { useState, useCallback, useEffect } from 'react';
import { ExpressionViewer } from './ExpressionViewer';
import { geneExpressionService, ExpressionQuery, ExpressionData } from '../../services/geneExpressionService';
import { ProcessedData } from '../../utils/dataProcessing';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { ErrorMessage } from '../ui/ErrorMessage';
import { RefreshIcon } from '../ui/icons/RefreshIcon';

interface ExpressionAnalysisPanelProps {
  geneId?: string;
  onDataProcessed?: (data: ProcessedData) => void;
  className?: string;
}

interface AdvancedOptions {
  dataSource: string;
  minSamples: number;
}

const ExpressionAnalysisPanel: React.FC<ExpressionAnalysisPanelProps> = ({
  geneId,
  onDataProcessed,
  className = ''
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expressionData, setExpressionData] = useState<ExpressionData[]>([]);
  const [dataTimestamp, setDataTimestamp] = useState<number | null>(null);
  const [query, setQuery] = useState<ExpressionQuery>({
    geneId: geneId || '',
    organism: '',
    tissueType: '',
    experimentType: ''
  });
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [advancedOptions, setAdvancedOptions] = useState<AdvancedOptions>({
    dataSource: 'all',
    minSamples: 1
  });

  const handleSearch = useCallback(async (forceRefresh = false) => {
    if (!query.geneId) {
      setError('Please enter a gene ID');
      return;
    }

    if (isLoading || isRefreshing) return;

    const loadingState = forceRefresh ? setIsRefreshing : setIsLoading;
    loadingState(true);
    setError(null);

    try {
      const { geoResults, arrayExpressResults, error: searchError } = await geneExpressionService.searchGene(query);
      
      const combinedResults = [...geoResults, ...arrayExpressResults];
      setExpressionData(combinedResults);
      setDataTimestamp(Date.now());
      
      if (searchError) {
        setError(searchError);
      }
    } catch (err) {
      if (err instanceof Error && err.message.includes('rate limit')) {
        setError('Rate limit reached. Please wait a moment before trying again.');
      } else {
        setError(err instanceof Error ? err.message : 'Failed to fetch expression data');
      }
    } finally {
      loadingState(false);
    }
  }, [query, isLoading, isRefreshing]);

  const handleQueryChange = useCallback((field: keyof ExpressionQuery, value: string) => {
    setQuery(prev => ({ ...prev, [field]: value }));
  }, []);

  const getDataFreshness = () => {
    if (!dataTimestamp) return null;
    const minutes = Math.floor((Date.now() - dataTimestamp) / 60000);
    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes} minutes ago`;
    return `${Math.floor(minutes / 60)} hours ago`;
  };

  useEffect(() => {
    if (geneId && geneId !== query.geneId) {
      setQuery(prev => ({ ...prev, geneId }));
    }
  }, [geneId]);

  return (
    <div className={`expression-analysis-panel p-4 ${className}`}>
      <div className="mb-4 space-y-2">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold">Gene Expression Analysis</h2>
          <div className="flex items-center gap-2">
            <select
              className="border rounded px-2 py-1"
              value={query.experimentType}
              onChange={(e) => handleQueryChange('experimentType', e.target.value)}
              disabled={isLoading || isRefreshing}
            >
              <option value="">All Experiments</option>
              <option value="RNA-seq">RNA-seq</option>
              <option value="microarray">Microarray</option>
              <option value="qPCR">qPCR</option>
            </select>
            <button
              className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
              onClick={() => setShowAdvanced(!showAdvanced)}
              disabled={isLoading || isRefreshing}
            >
              Advanced
            </button>
          </div>
        </div>
        
        <div className="flex space-x-2">
          <input
            type="text"
            placeholder="Gene ID"
            className="border rounded px-2 py-1 flex-1"
            value={query.geneId}
            onChange={(e) => handleQueryChange('geneId', e.target.value)}
            disabled={isLoading || isRefreshing}
          />
          <input
            type="text"
            placeholder="Organism"
            className="border rounded px-2 py-1"
            value={query.organism}
            onChange={(e) => handleQueryChange('organism', e.target.value)}
            disabled={isLoading || isRefreshing}
          />
          <input
            type="text"
            placeholder="Tissue Type"
            className="border rounded px-2 py-1"
            value={query.tissueType}
            onChange={(e) => handleQueryChange('tissueType', e.target.value)}
            disabled={isLoading || isRefreshing}
          />
          <button
            className="px-4 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 flex items-center gap-2"
            onClick={() => handleSearch(false)}
            disabled={isLoading || isRefreshing || !query.geneId}
          >
            {isLoading ? (
              <LoadingSpinner size="small" />
            ) : (
              'Search'
            )}
          </button>
        </div>

        {showAdvanced && (
          <div className="mt-2 p-2 border rounded">
            <h3 className="font-semibold mb-2">Advanced Options</h3>
            <div className="flex space-x-4">
              <div>
                <label className="block text-sm">Data Source</label>
                <select
                  className="border rounded px-2 py-1"
                  value={advancedOptions.dataSource}
                  onChange={(e) => setAdvancedOptions(prev => ({ ...prev, dataSource: e.target.value }))}
                  disabled={isLoading || isRefreshing}
                >
                  <option value="all">All Sources</option>
                  <option value="geo">GEO Only</option>
                  <option value="arrayexpress">ArrayExpress Only</option>
                </select>
              </div>
              <div>
                <label className="block text-sm">Minimum Samples</label>
                <input
                  type="number"
                  className="border rounded px-2 py-1 w-20"
                  value={advancedOptions.minSamples}
                  onChange={(e) => setAdvancedOptions(prev => ({ ...prev, minSamples: parseInt(e.target.value) || 1 }))}
                  min="1"
                  disabled={isLoading || isRefreshing}
                />
              </div>
            </div>
          </div>
        )}

        {error && (
          <ErrorMessage message={error} onClose={() => setError(null)} />
        )}

        {dataTimestamp && (
          <div className="flex items-center justify-between text-sm text-gray-500 mt-2">
            <span>Last updated: {getDataFreshness()}</span>
            <button
              className="flex items-center gap-1 text-blue-500 hover:text-blue-600 disabled:opacity-50"
              onClick={() => handleSearch(true)}
              disabled={isLoading || isRefreshing}
            >
              <RefreshIcon className={isRefreshing ? 'animate-spin' : ''} />
              Refresh
            </button>
          </div>
        )}
      </div>

      {expressionData.length > 0 ? (
        <ExpressionViewer
          data={expressionData}
          options={advancedOptions}
          onDataProcessed={onDataProcessed}
        />
      ) : !isLoading && !error ? (
        <div className="text-center text-gray-500 py-8">
          No expression data available. Please search for a gene.
        </div>
      ) : null}
    </div>
  );
};

export default ExpressionAnalysisPanel;
