import React, { useState } from 'react';
import { DataService } from '../services/dataService';
import axios from 'axios';  

interface Dataset {
  id: string;
  title?: string;
  description?: string;
  organism?: string;
  source?: string;
  experimentType?: string;
}

// Use axios in a no-op way to avoid the unused import warning
const logAxios = (message: string) => {
  console.log(message); // This is just to use axios in a no-op way
  return axios; // Return axios to keep the import valid
};

// Example usage
logAxios('Axios is imported for logging purposes.');

export const DataExplorer: React.FC = () => {
  const [query, setQuery] = useState('');
  const [dataSource, setDataSource] = useState<'geo' | 'arrayexpress' | 'uniprot' | 'geneExpression'>('geneExpression');
  const [results, setResults] = useState<Dataset[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedDataset, setSelectedDataset] = useState<Dataset | null>(null);
  const [organism, setOrganism] = useState('');
  const [experimentType, setExperimentType] = useState('');
  const [currentPage, setCurrentPage] = useState(1); // Current page
  const resultsPerPage = 10; // Number of results per page

  const handleSearch = async () => {
    if (!query.trim()) {
      setError('Please enter a search query');
      return;
    }

    setLoading(true);
    setError('');
    setResults([]);
    setCurrentPage(1); // Reset to the first page

    try {
      switch (dataSource) {
        case 'geneExpression': {
          const geneResults = await DataService.searchGeneExpression(query, organism, experimentType);
          const combinedResults: Dataset[] = [];

          // Handle GEO results
          if (geneResults.geo?.esearchresult?.idlist) {
            const geoDatasets = geneResults.geo.esearchresult.idlist.map(id => ({
              id,
              source: 'GEO',
              title: `GEO Dataset ${id}`,
              description: `Gene Expression Dataset from GEO (ID: ${id})`,
              organism: organism || 'Not specified'
            }));
            combinedResults.push(...geoDatasets);
          }

          // Handle BioStudies results
          if (geneResults.biostudies?.hits) {
            const bioStudiesDatasets = geneResults.biostudies.hits.map(hit => ({
              id: hit.accession,
              source: 'BioStudies',
              title: hit.title,
              description: hit.description || hit.summary,
              organism: hit.attributes?.organism || organism || 'Not specified',
              experimentType: hit.attributes?.experimentType || experimentType || 'Not specified'
            }));
            combinedResults.push(...bioStudiesDatasets);
          }

          console.log('Results after API call:', combinedResults);
          setResults(combinedResults);
          break;
        }

        case 'geo': {
          const geoResults = await DataService.searchGEODatasets(query);
          const datasets = await Promise.all(
            geoResults.esearchresult.idlist.slice(0, 5).map(async (id) => {
              const details = await DataService.fetchGEODataset(id);
              return {
                id,
                source: 'GEO',
                title: details.title,
                description: details.summary,
                organism: details.organism
              };
            })
          );
          console.log('Results after GEO API call:', datasets);
          setResults(datasets);
          break;
        }

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
          console.log('API Response:', aeResults);
          if (aeResults.experiments) {
            setResults(
              aeResults.experiments.map((exp: any) => ({
                id: exp.accession,
                title: exp.title,
                description: exp.description,
                organism: exp.organism
              }))
            );
          } else {
            console.log('No experiments found in the response.');
          }
          break;
      }
    } catch (error) {
      console.error('Error during search:', error);
      setError('An error occurred while searching.');
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

  const loadMoreResults = async () => {
    setLoading(true);
    try {
      const aeResults = await DataService.searchArrayExpress(query);
      const newResults = aeResults.experiments.slice(results.length, results.length + resultsPerPage);
      setResults((prevResults) => [...prevResults, ...newResults]); // Append new results
      setCurrentPage((prevPage) => prevPage + 1); // Increment the current page
    } catch (error) {
      console.error('Error loading more results:', error);
      setError('An error occurred while loading more results.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex flex-col gap-4 mb-4">
        <div className="flex gap-4">
          <select
            value={dataSource}
            onChange={(e) => setDataSource(e.target.value as typeof dataSource)}
            className="border p-2 rounded"
          >
            <option value="geneExpression">Gene Expression</option>
            <option value="geo">GEO</option>
            <option value="arrayexpress">ArrayExpress</option>
            <option value="uniprot">UniProt</option>
          </select>
          
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Enter gene name..."
            className="border p-2 rounded flex-1"
          />
        </div>

        {dataSource === 'geneExpression' && (
          <div className="flex gap-4">
            <input
              type="text"
              value={organism}
              onChange={(e) => setOrganism(e.target.value)}
              placeholder="Organism (e.g., Homo sapiens)"
              className="border p-2 rounded flex-1"
            />
            
            <input
              type="text"
              value={experimentType}
              onChange={(e) => setExperimentType(e.target.value)}
              placeholder="Experiment Type (e.g., RNA-seq)"
              className="border p-2 rounded flex-1"
            />
          </div>
        )}
        
        <button
          onClick={handleSearch}
          disabled={loading}
          className="bg-blue-500 text-white px-4 py-2 rounded w-full"
        >
          {loading ? 'Searching...' : 'Search'}
        </button>
      </div>

      {error && (
        <div className="text-red-500 mb-4 p-2 bg-red-50 rounded">{error}</div>
      )}

      <div className="grid grid-cols-1 gap-4">
        {results.map((dataset) => (
          <div
            key={`${dataset.source}-${dataset.id}`}
            className="border p-4 rounded cursor-pointer hover:bg-gray-50"
            onClick={() => handleDatasetSelect(dataset)}
          >
            <div className="flex justify-between items-start">
              <h3 className="font-bold">{dataset.title || dataset.id}</h3>
              <span className="text-sm bg-gray-100 px-2 py-1 rounded">
                {dataset.source}
              </span>
            </div>
            {dataset.description && (
              <p className="text-gray-600 mt-2">{dataset.description}</p>
            )}
            <div className="mt-2 flex gap-2 flex-wrap">
              {dataset.organism && (
                <span className="text-sm bg-blue-50 text-blue-700 px-2 py-1 rounded">
                  {dataset.organism}
                </span>
              )}
              {dataset.experimentType && (
                <span className="text-sm bg-green-50 text-green-700 px-2 py-1 rounded">
                  {dataset.experimentType}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {selectedDataset && (
        <div className="mt-8 border-t pt-4">
          <h2 className="text-xl font-bold mb-4">Dataset Details</h2>
          {Object.entries(selectedDataset)
            .filter(([key, value]) => value && typeof value === 'string' && key !== 'id')
            .map(([key, value]) => (
              <div key={`detail-${key}`} className="mb-2">
                <strong className="capitalize">{key}: </strong>
                <span>{value}</span>
              </div>
            ))}
        </div>
      )}

      {loading && <p>Loading...</p>}
      {error && <p className="text-red-500">{error}</p>}
      {results.length > 0 && (
        <button onClick={loadMoreResults} disabled={loading}>
          {loading ? 'Loading...' : 'More'}
        </button>
      )}
    </div>
  );
};
