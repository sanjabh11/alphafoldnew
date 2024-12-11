import React from 'react';
import ExperimentBrowser from '../components/ExperimentData/ExperimentBrowser';

const ExperimentExplorer: React.FC = () => {
  const handleExperimentSelect = (accession: string) => {
    console.log('Selected experiment:', accession);
    // Here you can add additional functionality when an experiment is selected
  };

  return (
    <div className="container mx-auto px-4">
      <h1 className="text-2xl font-bold mb-6">Experiment Explorer</h1>
      <div className="bg-white rounded-lg shadow-lg p-6">
        <ExperimentBrowser onExperimentSelect={handleExperimentSelect} />
      </div>
    </div>
  );
};

export default ExperimentExplorer;
