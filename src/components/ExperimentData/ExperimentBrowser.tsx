import React, { useState, useEffect } from 'react';
import { ArrayExpressService } from '../../services/arrayExpressService';
import { StorageService } from '../../services/storage';

interface ExperimentBrowserProps {
  onExperimentSelect?: (accession: string) => void;
}

const ExperimentBrowser: React.FC<ExperimentBrowserProps> = ({ onExperimentSelect }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [species, setSpecies] = useState('');
  const [experiments, setExperiments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedExperiment, setSelectedExperiment] = useState<any>(null);

  const storage = new StorageService();
  const arrayExpressService = new ArrayExpressService(storage);

  useEffect(() => {
    storage.initDB();
  }, []);

  const handleSearch = async () => {
    if (!searchQuery) return;

    setLoading(true);
    setError(null);
    try {
      const results = await arrayExpressService.searchExperiments(searchQuery, species);
      setExperiments(results);
    } catch (err) {
      setError('Failed to fetch experiments. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleExperimentClick = async (accession: string) => {
    try {
      const details = await arrayExpressService.getExperimentDetails(accession);
      setSelectedExperiment(details);
      if (onExperimentSelect) {
        onExperimentSelect(accession);
      }
    } catch (err) {
      console.error('Error fetching experiment details:', err);
      setError('Failed to fetch experiment details');
    }
  };

  return (
    <div className="p-4">
      <div className="mb-4">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search experiments..."
          className="p-2 border rounded mr-2"
        />
        <input
          type="text"
          value={species}
          onChange={(e) => setSpecies(e.target.value)}
          placeholder="Species (optional)"
          className="p-2 border rounded mr-2"
        />
        <button
          onClick={handleSearch}
          disabled={loading}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          {loading ? 'Searching...' : 'Search'}
        </button>
      </div>

      {error && (
        <div className="text-red-500 mb-4">{error}</div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="border rounded p-4">
          <h3 className="text-lg font-semibold mb-4">Experiments</h3>
          {experiments.map((exp) => (
            <div
              key={exp.accession}
              onClick={() => handleExperimentClick(exp.accession)}
              className="p-2 hover:bg-gray-100 cursor-pointer border-b"
            >
              <h4 className="font-medium">{exp.title}</h4>
              <p className="text-sm text-gray-600">{exp.accession}</p>
              <p className="text-sm">{exp.organism}</p>
            </div>
          ))}
        </div>

        {selectedExperiment && (
          <div className="border rounded p-4">
            <h3 className="text-lg font-semibold mb-4">Experiment Details</h3>
            <h4 className="font-medium">{selectedExperiment.title}</h4>
            <p className="text-sm mb-2">{selectedExperiment.description}</p>
            <div className="mt-4">
              <h5 className="font-medium">Files:</h5>
              <ul className="list-disc pl-4">
                {selectedExperiment.files.map((file: any, index: number) => (
                  <li key={index} className="text-sm">
                    <a
                      href={file.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:underline"
                    >
                      {file.name} ({file.type})
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            <div className="mt-4">
              <h5 className="font-medium">Protocols:</h5>
              <ul className="list-disc pl-4">
                {selectedExperiment.protocols.map((protocol: string, index: number) => (
                  <li key={index} className="text-sm">
                    {protocol}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExperimentBrowser;
