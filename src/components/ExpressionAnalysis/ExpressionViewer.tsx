import React, { useEffect, useState, useCallback } from 'react';
import { ExpressionData } from '../../services/geneExpressionService';
import { DataProcessingUtils, ProcessedData } from '../../utils/dataProcessing';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

interface ExpressionViewerProps {
  data: ExpressionData[];
  normalizationMethod?: 'quantile' | 'rma' | 'tpm';
  showStatistics?: boolean;
  onAnalysisComplete?: (results: ProcessedData) => void;
}

export const ExpressionViewer: React.FC<ExpressionViewerProps> = ({
  data,
  normalizationMethod = 'quantile',
  showStatistics = true,
  onAnalysisComplete
}) => {
  const [processedData, setProcessedData] = useState<ProcessedData | null>(null);
  const [selectedDataset, setSelectedDataset] = useState<string | null>(null);

  const processData = useCallback(() => {
    if (!data.length) return;

    const values = data[0].values;
    let normalizedValues: number[];

    switch (normalizationMethod) {
      case 'rma':
        normalizedValues = DataProcessingUtils.normalizeRMA(values);
        break;
      case 'tpm':
        // Assuming gene lengths are available in metadata
        const lengths = new Array(values.length).fill(1000); // Default length
        normalizedValues = DataProcessingUtils.normalizeTPM(values, lengths);
        break;
      case 'quantile':
      default:
        normalizedValues = DataProcessingUtils.normalizeQuantile(values);
    }

    const processed: ProcessedData = {
      normalizedValues,
      statistics: {
        mean: normalizedValues.reduce((a, b) => a + b, 0) / normalizedValues.length,
        median: normalizedValues.sort((a, b) => a - b)[Math.floor(normalizedValues.length / 2)],
        stdDev: Math.sqrt(
          normalizedValues.reduce((a, b) => a + Math.pow(b - normalizedValues.reduce((a, b) => a + b, 0) / normalizedValues.length, 2), 0) / normalizedValues.length
        )
      },
      metadata: {
        method: normalizationMethod,
        parameters: {}
      }
    };

    setProcessedData(processed);
    onAnalysisComplete?.(processed);
  }, [data, normalizationMethod, onAnalysisComplete]);

  useEffect(() => {
    processData();
  }, [processData]);

  const chartData = processedData?.normalizedValues.map((value, index) => ({
    index,
    value,
    original: data[0].values[index]
  }));

  return (
    <div className="expression-viewer p-4">
      <div className="flex justify-between mb-4">
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Expression Analysis</h3>
          <div className="space-x-2">
            <select
              className="border rounded p-1"
              value={selectedDataset || ''}
              onChange={(e) => setSelectedDataset(e.target.value)}
            >
              <option value="">Select Dataset</option>
              {data.map((dataset, index) => (
                <option key={dataset.id} value={dataset.id}>
                  {dataset.metadata.tissue || `Dataset ${index + 1}`}
                </option>
              ))}
            </select>
            <select
              className="border rounded p-1"
              value={normalizationMethod}
              onChange={(e) => onAnalysisComplete?.({
                ...processedData!,
                metadata: { ...processedData!.metadata, method: e.target.value as any }
              })}
            >
              <option value="quantile">Quantile Normalization</option>
              <option value="rma">RMA Normalization</option>
              <option value="tpm">TPM Normalization</option>
            </select>
          </div>
        </div>
        
        {showStatistics && processedData && (
          <div className="text-sm">
            <p>Mean: {processedData.statistics.mean.toFixed(2)}</p>
            <p>Median: {processedData.statistics.median.toFixed(2)}</p>
            <p>Std Dev: {processedData.statistics.stdDev.toFixed(2)}</p>
          </div>
        )}
      </div>

      {chartData && (
        <div className="mt-4">
          <LineChart width={600} height={300} data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="index" label={{ value: 'Sample Index', position: 'bottom' }} />
            <YAxis label={{ value: 'Expression Level', angle: -90, position: 'left' }} />
            <Tooltip />
            <Legend />
            <Line
              type="monotone"
              dataKey="value"
              stroke="#8884d8"
              name="Normalized"
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="original"
              stroke="#82ca9d"
              name="Original"
              dot={false}
            />
          </LineChart>
        </div>
      )}
    </div>
  );
};
