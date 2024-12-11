import React, { useState } from 'react';
import { alphafold3Service, PredictionRequest } from '../../services/alphafold3Service';
import { ProteinViewer } from '../ProteinViewer';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { ErrorMessage } from '../ui/ErrorMessage';

interface StructurePredictionProps {
  sequence?: string;
  onPredictionComplete?: (pdbData: string) => void;
  className?: string;
}

export const StructurePrediction: React.FC<StructurePredictionProps> = ({
  sequence,
  onPredictionComplete,
  className = ''
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [predictionResult, setPredictionResult] = useState<string | null>(null);
  const [predictionMode, setPredictionMode] = useState<'fast' | 'accurate'>('fast');

  const handlePrediction = async () => {
    if (!sequence) {
      setError('Please provide a protein sequence');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const request: PredictionRequest = {
        sequence,
        mode: predictionMode,
        options: {
          templates: true
        }
      };

      // Submit prediction
      const jobId = await alphafold3Service.submitPrediction(request);
      
      // Poll for results
      let result = await alphafold3Service.getPredictionStatus(jobId);
      while (result.status === 'pending' || result.status === 'processing') {
        await new Promise(resolve => setTimeout(resolve, 5000)); // Poll every 5 seconds
        result = await alphafold3Service.getPredictionStatus(jobId);
      }

      if (result.status === 'completed' && result.result) {
        setPredictionResult(result.result.pdbData);
        if (onPredictionComplete) {
          onPredictionComplete(result.result.pdbData);
        }
      } else {
        throw new Error('Prediction failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to predict structure');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`structure-prediction ${className}`}>
      <div className="prediction-section">
        <div className="prediction-controls">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Prediction Mode:
            </label>
            <select
              value={predictionMode}
              onChange={(e) => setPredictionMode(e.target.value as 'fast' | 'accurate')}
              className="prediction-mode-select"
              disabled={isLoading}
            >
              <option value="fast">Fast (AlphaFold-Multimer)</option>
              <option value="accurate">Accurate (Full Pipeline)</option>
            </select>
          </div>
          <button
            onClick={handlePrediction}
            disabled={isLoading || !sequence}
            className="predict-button"
          >
            {isLoading ? (
              <>
                <LoadingSpinner size="small" className="mr-2" />
                Predicting Structure...
              </>
            ) : (
              <>
                <svg
                  className="w-4 h-4 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
                Predict Structure
              </>
            )}
          </button>
        </div>

        {error && (
          <div className="error-container">
            <ErrorMessage
              message={error}
              onClose={() => setError(null)}
            />
          </div>
        )}
      </div>

      {predictionResult && (
        <div className="viewer-container">
          <ProteinViewer
            pdbData={predictionResult}
            height={500}
            className="w-full h-full"
          />
        </div>
      )}
    </div>
  );
};
