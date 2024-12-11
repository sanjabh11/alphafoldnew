import React, { useState } from 'react';
import { StructurePrediction } from './StructurePrediction';
import { MeasurementTools } from './MeasurementTools';
import { SequenceViewer } from '../SequenceViewer';
import { ProteinViewerDemo } from '../ProteinViewer/ProteinViewerDemo';
import '../../styles/components/StructureAnalysis.css';

interface StructureAnalysisPanelProps {
  sequence?: string;
  className?: string;
}

export const StructureAnalysisPanel: React.FC<StructureAnalysisPanelProps> = ({
  sequence,
  className = ''
}) => {
  const [predictedStructure, setPredictedStructure] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState<'prediction' | 'analysis'>('prediction');

  const handlePredictionComplete = (pdbData: string) => {
    setPredictedStructure(pdbData);
    setSelectedTab('analysis');
  };

  return (
    <div className={`structure-analysis-panel ${className}`}>
      <div className="structure-analysis-tabs">
        <button
          className={`structure-analysis-tab ${selectedTab === 'prediction' ? 'active' : ''}`}
          onClick={() => setSelectedTab('prediction')}
        >
          Structure Prediction
        </button>
        <button
          className={`structure-analysis-tab ${selectedTab === 'analysis' ? 'active' : ''} ${!predictedStructure ? 'disabled' : ''}`}
          onClick={() => setSelectedTab('analysis')}
          disabled={!predictedStructure}
        >
          Analysis Tools
        </button>
      </div>

      {sequence && (
        <div className="sequence-section">
          <div className="sequence-header">
            <h3 className="sequence-title">Input Sequence</h3>
            <span className="text-sm text-gray-500">
              {sequence.length} amino acids
            </span>
          </div>
          <SequenceViewer sequence={sequence} />
        </div>
      )}

      <div className="content-section">
        {selectedTab === 'prediction' ? (
          <StructurePrediction
            sequence={sequence}
            onPredictionComplete={handlePredictionComplete}
          />
        ) : predictedStructure ? (
          <div className="analysis-section">
            <h3 className="text-lg font-semibold mb-4">Structure Analysis</h3>
            <MeasurementTools pdbData={predictedStructure} />
            <ProteinViewerDemo />
          </div>
        ) : null}
      </div>
    </div>
  );
};
