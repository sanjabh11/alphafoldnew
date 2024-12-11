import React, { useEffect, useState, useCallback } from 'react';
import { ExpressionData } from '../../services/geneExpressionService';
import { DataProcessingUtils, ProcessedData } from '../../utils/dataProcessing';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, BarChart, Bar } from 'recharts';
import { BoxPlot } from './BoxPlot';
import { ArrowUpIcon, ArrowDownIcon } from 'lucide-react';

interface ExpressionViewerProps {
  data: ExpressionData[];
  normalizationMethod?: 'quantile' | 'rma' | 'tpm';
  showStatistics?: boolean;
  showVisualization?: boolean;
  onAnalysisComplete?: (results: ProcessedData) => void;
}

export const ExpressionViewer: React.FC<ExpressionViewerProps> = ({
  data,
  normalizationMethod = 'quantile',
  showStatistics = true,
  showVisualization = true,
  onAnalysisComplete
}) => {
  const [processedData, setProcessedData] = useState<ProcessedData | null>(null);
  const [selectedDataset, setSelectedDataset] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'chart' | 'heatmap'>('chart');
  const [chartType, setChartType] = useState<'line' | 'bar' | 'box'>('line');
  const [zoomLevel, setZoomLevel] = useState<number>(1);

  const processData = useCallback(() => {
    if (!data.length) return;

    const values = data[0].values;
    let normalizedValues: number[];

    switch (normalizationMethod) {
      case 'rma':
        normalizedValues = DataProcessingUtils.normalizeRMA(values);
        break;
      case 'tpm':
        const lengths = new Array(values.length).fill(1000);
        normalizedValues = DataProcessingUtils.normalizeTPM(values, lengths);
        break;
      case 'quantile':
      default:
        normalizedValues = DataProcessingUtils.normalizeQuantile(values);
    }

    const processed: ProcessedData = {
      normalizedValues,
      statistics: calculateStatistics(normalizedValues),
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

  const renderVisualization = () => {
    if (!chartData) return null;

    switch (viewMode) {
      case 'heatmap':
        return (
          <div className="relative">
            <div className="w-full h-[300px] bg-white">
              {/* Placeholder for heatmap - you'll need to implement a proper heatmap component */}
              <div className="text-center pt-8">
                Heatmap visualization coming soon
              </div>
            </div>
          </div>
        );
      case 'chart':
      default:
        return (
          <div className="relative">
            {chartType === 'line' && (
              <LineChart width={600 * zoomLevel} height={300 * zoomLevel} data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="index" label={{ value: 'Sample Index', position: 'bottom' }} />
                <YAxis label={{ value: 'Expression Level', angle: -90, position: 'left' }} />
                <Tooltip content={<CustomTooltip />} />
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
            )}
            {chartType === 'bar' && (
              <BarChart width={600 * zoomLevel} height={300 * zoomLevel} data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="index" />
                <YAxis />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar dataKey="value" fill="#8884d8" name="Normalized" />
                <Bar dataKey="original" fill="#82ca9d" name="Original" />
              </BarChart>
            )}
            {chartType === 'box' && (
              <div className="relative w-[600px] h-[300px]" style={{ 
                width: 600 * zoomLevel, 
                height: 300 * zoomLevel 
              }}>
                <BoxPlot
                  data={chartData}
                  width={600 * zoomLevel}
                  height={300 * zoomLevel}
                />
              </div>
            )}
          </div>
        );
    }
  };

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
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm">View:</label>
            <select
              className="border rounded p-1"
              value={viewMode}
              onChange={(e) => setViewMode(e.target.value as any)}
            >
              <option value="chart">Chart</option>
              <option value="heatmap">Heatmap</option>
            </select>
          </div>
          
          {viewMode === 'chart' && (
            <div className="flex items-center gap-2">
              <label className="text-sm">Type:</label>
              <select
                className="border rounded p-1"
                value={chartType}
                onChange={(e) => setChartType(e.target.value as any)}
              >
                <option value="line">Line</option>
                <option value="bar">Bar</option>
                <option value="box">Box Plot</option>
              </select>
            </div>
          )}
          
          <div className="flex items-center gap-2">
            <label className="text-sm">Zoom:</label>
            <input
              type="range"
              min="0.5"
              max="2"
              step="0.1"
              value={zoomLevel}
              onChange={(e) => setZoomLevel(parseFloat(e.target.value))}
              className="w-24"
            />
          </div>
        </div>
      </div>

      {showStatistics && processedData && (
        <div className="grid grid-cols-3 gap-4 mb-4 p-4 bg-gray-50 rounded-lg">
          <StatCard
            title="Mean"
            value={processedData.statistics.mean.toFixed(2)}
            trend={processedData.statistics.mean > 0 ? 'up' : 'down'}
          />
          <StatCard
            title="Median"
            value={processedData.statistics.median.toFixed(2)}
            trend="neutral"
          />
          <StatCard
            title="Std Dev"
            value={processedData.statistics.stdDev.toFixed(2)}
            trend="neutral"
          />
        </div>
      )}

      {showVisualization && renderVisualization()}
    </div>
  );
};

const StatCard: React.FC<{
  title: string;
  value: string;
  trend: 'up' | 'down' | 'neutral';
}> = ({ title, value, trend }) => (
  <div className="p-3 bg-white rounded-lg shadow-sm">
    <div className="text-sm text-gray-500">{title}</div>
    <div className="text-lg font-semibold flex items-center gap-1">
      {value}
      {trend === 'up' && <ArrowUpIcon className="w-4 h-4 text-green-500" />}
      {trend === 'down' && <ArrowDownIcon className="w-4 h-4 text-red-500" />}
    </div>
  </div>
);

const CustomTooltip: React.FC<any> = ({ active, payload }) => {
  if (!active || !payload?.length) return null;

  return (
    <div className="bg-white p-2 border rounded shadow-lg">
      {payload.map((item: any, index: number) => (
        <div key={index} className="flex items-center gap-2">
          <div style={{ color: item.color }}>{item.name}:</div>
          <div className="font-semibold">{item.value.toFixed(2)}</div>
        </div>
      ))}
    </div>
  );
};

const calculateStatistics = (values: number[]) => {
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const median = values.sort((a, b) => a - b)[Math.floor(values.length / 2)];
  const stdDev = Math.sqrt(
    values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length
  );

  return { mean, median, stdDev };
};
