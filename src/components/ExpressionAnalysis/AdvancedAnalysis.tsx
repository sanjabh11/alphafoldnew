import React, { useState, useCallback } from 'react';
import { ExpressionData } from '../../services/geneExpressionService';
import { DataProcessingUtils } from '../../utils/dataProcessing';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ScatterChart, Scatter } from 'recharts';
import { ArrowUpIcon, ArrowDownIcon } from 'lucide-react';

interface AdvancedAnalysisProps {
  data: ExpressionData[];
  comparisonData?: ExpressionData[];
  onAnalysisComplete?: (results: any) => void;
}

export const AdvancedAnalysis: React.FC<AdvancedAnalysisProps> = ({
  data,
  comparisonData,
  onAnalysisComplete
}) => {
  const [analysisType, setAnalysisType] = useState<
    'temporal' | 'correlation' | 'clustering' | 'enrichment'
  >('temporal');
  const [results, setResults] = useState<any>(null);

  const performAnalysis = useCallback(async () => {
    let analysisResults;

    switch (analysisType) {
      case 'temporal':
        const timePoints = Array.from(
          { length: data[0].values.length },
          (_, i) => i
        );
        analysisResults = DataProcessingUtils.analyzeTemporalPattern(
          timePoints,
          data[0].values
        );
        break;

      case 'correlation':
        if (comparisonData) {
          analysisResults = DataProcessingUtils.calculateCorrelation(
            data[0].values,
            comparisonData[0].values
          );
        }
        break;

      case 'clustering':
        analysisResults = DataProcessingUtils.performClusterAnalysis(data);
        break;

      case 'enrichment':
        const genes = data.map(d => d.id);
        analysisResults = await DataProcessingUtils.performEnrichmentAnalysis(
          genes
        );
        break;
    }

    setResults(analysisResults);
    onAnalysisComplete?.(analysisResults);
  }, [analysisType, data, comparisonData, onAnalysisComplete]);

  const renderResults = () => {
    if (!results) return null;

    switch (analysisType) {
      case 'temporal':
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="font-semibold">Trend:</span>
              <span className="flex items-center gap-1">
                {results.trend}
                {results.trend === 'increasing' && (
                  <ArrowUpIcon className="w-4 h-4 text-green-500" />
                )}
                {results.trend === 'decreasing' && (
                  <ArrowDownIcon className="w-4 h-4 text-red-500" />
                )}
              </span>
            </div>
            <div>
              <span className="font-semibold">Change Points:</span>
              <div className="mt-2">
                <LineChart width={600} height={300} data={data[0].values.map((v, i) => ({ value: v, index: i }))}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="index" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="value" stroke="#8884d8" />
                  {results.changePoints.map((point, i) => (
                    <Line
                      key={i}
                      type="monotone"
                      dataKey="value"
                      stroke="red"
                      strokeWidth={2}
                      dot={false}
                      data={[
                        { index: point, value: data[0].values[point] }
                      ]}
                    />
                  ))}
                </LineChart>
              </div>
            </div>
          </div>
        );

      case 'correlation':
        if (!comparisonData) return null;
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-white rounded-lg shadow">
                <div className="text-lg font-semibold mb-2">Pearson Correlation</div>
                <div className="text-3xl">{results.pearson.toFixed(3)}</div>
              </div>
              <div className="p-4 bg-white rounded-lg shadow">
                <div className="text-lg font-semibold mb-2">Spearman Correlation</div>
                <div className="text-3xl">{results.spearman.toFixed(3)}</div>
              </div>
            </div>
            <ScatterChart width={600} height={300}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="x" name="Dataset 1" />
              <YAxis dataKey="y" name="Dataset 2" />
              <Tooltip cursor={{ strokeDasharray: '3 3' }} />
              <Scatter
                name="Values"
                data={data[0].values.map((v, i) => ({
                  x: v,
                  y: comparisonData[0].values[i]
                }))}
                fill="#8884d8"
              />
            </ScatterChart>
          </div>
        );

      case 'clustering':
        return (
          <div className="space-y-4">
            <div className="p-4 bg-white rounded-lg shadow">
              <div className="text-lg font-semibold mb-2">Silhouette Score</div>
              <div className="text-3xl">{results.silhouetteScore.toFixed(3)}</div>
            </div>
            <div className="mt-4">
              <ScatterChart width={600} height={300}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" dataKey="x" name="PC1" />
                <YAxis type="number" dataKey="y" name="PC2" />
                <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                <Scatter
                  name="Clusters"
                  data={data.map((d, i) => ({
                    x: d.values[0],
                    y: d.values[1],
                    cluster: results.clusters[i]
                  }))}
                  fill="#8884d8"
                />
              </ScatterChart>
            </div>
          </div>
        );

      case 'enrichment':
        return (
          <div className="space-y-4">
            {results.map((result: any, index: number) => (
              <div key={index} className="p-4 bg-white rounded-lg shadow">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="text-lg font-semibold">{result.term}</div>
                    <div className="text-sm text-gray-500">{result.database}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm">p-value: {result.pValue.toExponential(2)}</div>
                    <div className="text-sm">adjusted: {result.adjustedPValue.toExponential(2)}</div>
                  </div>
                </div>
                <div className="mt-2 text-sm">
                  Genes: {result.genes.join(', ')}
                </div>
              </div>
            ))}
          </div>
        );
    }
  };

  return (
    <div className="advanced-analysis p-4">
      <div className="flex justify-between items-center mb-4">
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Advanced Analysis</h3>
          <div className="flex items-center gap-2">
            <select
              className="border rounded p-1"
              value={analysisType}
              onChange={(e) => setAnalysisType(e.target.value as any)}
            >
              <option value="temporal">Temporal Pattern</option>
              <option value="correlation">Correlation Analysis</option>
              <option value="clustering">Clustering</option>
              <option value="enrichment">Enrichment Analysis</option>
            </select>
            <button
              className="px-4 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
              onClick={performAnalysis}
            >
              Analyze
            </button>
          </div>
        </div>
      </div>

      {renderResults()}
    </div>
  );
};
