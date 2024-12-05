import React, { useState, useCallback, useEffect } from 'react';
import { ExpressionData } from '../../services/geneExpressionService';
import { DataProcessingUtils, ProcessedData } from '../../utils/dataProcessing';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

interface ExpressionViewerProps {
  data: ExpressionData[];
  onAnalysisComplete?: (processedData: ProcessedData) => void;
}

const ExpressionViewer: React.FC<ExpressionViewerProps> = ({ data, onAnalysisComplete }) => {
  const [selectedSource, setSelectedSource] = useState<string>('all');
  const [selectedTissue, setSelectedTissue] = useState<string>('all');
  const [normalizationMethod, setNormalizationMethod] = useState<string>('minmax');
  const [chartData, setChartData] = useState<any[]>([]);
  const [statistics, setStatistics] = useState<any>(null);

  const processData = useCallback(() => {
    try {
      let filteredData = data;
      
      // Apply filters
      if (selectedSource !== 'all') {
        filteredData = filteredData.filter(d => d.source === selectedSource);
      }
      if (selectedTissue !== 'all') {
        filteredData = filteredData.filter(d => d.metadata.tissue === selectedTissue);
      }

      // Process data for visualization
      const processed = DataProcessingUtils.processExpressionData(filteredData, {
        normalization: normalizationMethod
      });

      setChartData(processed.chartData);
      setStatistics(processed.statistics);
      onAnalysisComplete?.(processed);
    } catch (error) {
      console.error('Error processing expression data:', error);
    }
  }, [data, selectedSource, selectedTissue, normalizationMethod, onAnalysisComplete]);

  useEffect(() => {
    processData();
  }, [processData]);

  const sources = ['all', ...new Set(data.map(d => d.source))];
  const tissues = ['all', ...new Set(data.map(d => d.metadata.tissue).filter(Boolean))];

  return (
    <div className="expression-viewer space-y-4">
      <div className="flex flex-wrap gap-4 p-4 bg-gray-50 rounded-lg">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-sm font-medium text-gray-700">Data Source</label>
          <select
            value={selectedSource}
            onChange={(e) => setSelectedSource(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          >
            {sources.map(source => (
              <option key={source} value={source}>
                {source.charAt(0).toUpperCase() + source.slice(1)}
              </option>
            ))}
          </select>
        </div>

        <div className="flex-1 min-w-[200px]">
          <label className="block text-sm font-medium text-gray-700">Tissue Type</label>
          <select
            value={selectedTissue}
            onChange={(e) => setSelectedTissue(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          >
            {tissues.map(tissue => (
              <option key={tissue} value={tissue}>
                {tissue === 'all' ? 'All Tissues' : tissue}
              </option>
            ))}
          </select>
        </div>

        <div className="flex-1 min-w-[200px]">
          <label className="block text-sm font-medium text-gray-700">Normalization</label>
          <select
            value={normalizationMethod}
            onChange={(e) => setNormalizationMethod(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          >
            <option value="minmax">Min-Max</option>
            <option value="zscore">Z-Score</option>
            <option value="quantile">Quantile</option>
          </select>
        </div>
      </div>

      {chartData.length > 0 && (
        <div className="p-4 bg-white rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Expression Profile</h3>
          <div className="w-full h-[400px]">
            <LineChart
              width={800}
              height={400}
              data={chartData}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-white p-2 border rounded shadow">
                      <p className="font-semibold">{data.name}</p>
                      <p>Value: {data.value.toFixed(3)}</p>
                      <p>Source: {data.source}</p>
                      {data.tissue && <p>Tissue: {data.tissue}</p>}
                    </div>
                  );
                }
                return null;
              }} />
              <Legend />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#8884d8"
                activeDot={{ r: 8 }}
              />
            </LineChart>
          </div>
        </div>
      )}

      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4 bg-white rounded-lg shadow">
          <div className="stat-card p-4 bg-gray-50 rounded">
            <h4 className="font-semibold">Sample Statistics</h4>
            <p>Sample Size: {statistics.sampleSize}</p>
            <p>Mean: {statistics.mean.toFixed(3)}</p>
            <p>Median: {statistics.median.toFixed(3)}</p>
          </div>
          <div className="stat-card p-4 bg-gray-50 rounded">
            <h4 className="font-semibold">Distribution</h4>
            <p>Standard Deviation: {statistics.stdDev.toFixed(3)}</p>
            <p>Min: {statistics.min.toFixed(3)}</p>
            <p>Max: {statistics.max.toFixed(3)}</p>
          </div>
          <div className="stat-card p-4 bg-gray-50 rounded">
            <h4 className="font-semibold">Data Sources</h4>
            <p>Total Sources: {sources.length - 1}</p>
            <p>Total Tissues: {tissues.length - 1}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExpressionViewer;
