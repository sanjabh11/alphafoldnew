import React from 'react';
import { BarChart, Download, AlertCircle } from 'lucide-react';

interface AnalysisResult {
  confidenceScore: number;
  structureQuality: {
    resolution: number;
    rFactor: number;
    clashScore: number;
  };
  validationMetrics: {
    ramachandran: number;
    rotamer: number;
    backbone: number;
  };
}

interface ResultsDashboardProps {
  results: AnalysisResult;
  onExport: (format: 'png' | 'pdf' | 'pdb') => void;
}

export const ResultsDashboard: React.FC<ResultsDashboardProps> = ({
  results,
  onExport
}) => {
  const getQualityColor = (value: number) => {
    if (value >= 80) return 'text-green-600';
    if (value >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="bg-white rounded-lg shadow p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Analysis Results</h2>
        <div className="flex gap-2">
          <button
            onClick={() => onExport('png')}
            className="px-3 py-1 text-sm border rounded hover:bg-gray-50"
          >
            PNG
          </button>
          <button
            onClick={() => onExport('pdf')}
            className="px-3 py-1 text-sm border rounded hover:bg-gray-50"
          >
            PDF
          </button>
          <button
            onClick={() => onExport('pdb')}
            className="px-3 py-1 text-sm border rounded hover:bg-gray-50"
          >
            PDB
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Confidence Score */}
        <div className="p-4 border rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <BarChart className="w-5 h-5 text-gray-500" />
            <h3 className="font-medium">Confidence Score</h3>
          </div>
          <div className={`text-3xl font-bold ${getQualityColor(results.confidenceScore)}`}>
            {results.confidenceScore}%
          </div>
        </div>

        {/* Structure Quality */}
        <div className="p-4 border rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="w-5 h-5 text-gray-500" />
            <h3 className="font-medium">Structure Quality</h3>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Resolution</span>
              <span>{results.structureQuality.resolution}Å</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>R-factor</span>
              <span>{results.structureQuality.rFactor}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Clash Score</span>
              <span>{results.structureQuality.clashScore}</span>
            </div>
          </div>
        </div>

        {/* Validation Metrics */}
        <div className="p-4 border rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Download className="w-5 h-5 text-gray-500" />
            <h3 className="font-medium">Validation Metrics</h3>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Ramachandran</span>
              <span className={getQualityColor(results.validationMetrics.ramachandran)}>
                {results.validationMetrics.ramachandran}%
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Rotamer</span>
              <span className={getQualityColor(results.validationMetrics.rotamer)}>
                {results.validationMetrics.rotamer}%
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Backbone</span>
              <span className={getQualityColor(results.validationMetrics.backbone)}>
                {results.validationMetrics.backbone}%
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};