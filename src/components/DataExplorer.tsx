import React, { useState } from 'react';
import { DataService } from '../services/dataService';

interface Dataset {
  id: string;
  title?: string;
  description?: string;
  organism?: string;
}

export const DataExplorer: React.FC = () => {
  const [query, setQuery] = useState('');
  const [dataSource, setDataSource] = useState<'geo' | 'arrayexpress' | 'uniprot'>('geo');
  const [results, setResults] = useState<Dataset[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedDataset, setSelectedDataset] = useState<Dataset | null>(null);

  const handleSearch = async () => {
    if (!query.trim()) {
      setError('Please enter a search query');
      return;
    }

    setLoading(true);
    setError('');
    setResults([]);
    setSelectedDataset(null);

    try {
      switch (dataSource) {
        case 'uniprot':
          const uniprotResults = await DataService.searchUniProt(query);
          if (uniprotResults.results) {
            setResults(
              uniprotResults.results.map((entry: any) => ({
                id: entry.primaryAccession || entry.accession,
                title: entry.proteinDescription?.recommendedName?.fullName?.value || entry.id,
                description: entry.proteinExistence,
                organism: entry.organism?.scientificName
              }))
            );
          }
          break;

        case 'arrayexpress':
          const aeResults = await DataService.searchArrayExpress(query);
          if (aeResults.experiments) {
            setResults(
              aeResults.experiments.map((exp: any) => ({
                id: exp.accession,
                title: exp.name,
                description: exp.description,
                organism: exp.organism
              }))
            );
          }
          break;

        case 'geo':
          const geoResults = await DataService.searchGEODatasets(query);
          const datasets = await Promise.all(
            geoResults.esearchresult.idlist.slice(0, 5).map(async (id) => {
              const details = await DataService.fetchGEODataset(id);
              return {
                id,
                title: details.title,
                description: details.summary,
                organism: details.organism
              };
            })
          );
          setResults(datasets);
          break;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleDatasetSelect = async (dataset: Dataset) => {
    setSelectedDataset(dataset);
    setLoading(true);
    setError('');
    try {
      switch (dataSource) {
        case 'geo':
          const geoDetails = await DataService.getGEODatasetDetails(dataset.id);
          setSelectedDataset({ ...dataset, ...geoDetails });
          break;
        case 'arrayexpress':
          const aeDetails = await DataService.getArrayExpressExperimentDetails(dataset.id);
          setSelectedDataset({ ...dataset, ...aeDetails });
          break;
        case 'uniprot':
          const uniprotDetails = await DataService.getUniProtEntryDetails(dataset.id);
          setSelectedDataset({ ...dataset, ...uniprotDetails });
          break;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex gap-4 mb-4">
        <select
          value={dataSource}
          onChange={(e) => setDataSource(e.target.value as typeof dataSource)}
          className="border p-2 rounded"
        >
          <option value="geo">GEO</option>
          <option value="arrayexpress">ArrayExpress</option>
          <option value="uniprot">UniProt</option>
        </select>
        
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Enter search query..."
          className="border p-2 rounded flex-1"
        />
        
        <button
          onClick={handleSearch}
          disabled={loading}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          {loading ? 'Searching...' : 'Search'}
        </button>
      </div>

      {error && (
        <div className="text-red-500 mb-4">{error}</div>
      )}

      <div className="grid grid-cols-1 gap-4">
        {results.map((dataset) => (
          <div
            key={`${dataset.id}-${dataset.title}`}
            className="border p-4 rounded cursor-pointer hover:bg-gray-50"
            onClick={() => handleDatasetSelect(dataset)}
          >
            <h3 className="font-bold">{dataset.title || dataset.id}</h3>
            {dataset.description && (
              <p className="text-gray-600">{dataset.description}</p>
            )}
            {dataset.organism && (
              <p className="text-gray-500">Organism: {dataset.organism}</p>
            )}
          </div>
        ))}
      </div>

      {selectedDataset && (
        <div className="mt-8 border-t pt-4">
          <h2 className="text-xl font-bold mb-4">Dataset Details</h2>
          {Object.entries(selectedDataset)
            .filter(([key, value]) => value && typeof value === 'string')
            .map(([key, value]) => (
              <div key={`detail-${key}`} className="mb-2">
                <strong className="capitalize">{key}: </strong>
                <span>{value}</span>
              </div>
            ))}
        </div>
      )}
    </div>
  );
};
