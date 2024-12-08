// src/pages/Search.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { Protein } from '../types';

const Search: React.FC = () => {
  const [query, setQuery] = useState<string>('');
  const [proteins, setProteins] = useState<Protein[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError(null);
    setProteins([]);

    try {
      const results = await api.searchProteins(query);
      setProteins(results);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while searching');
      console.error('Search error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleProteinClick = (protein: Protein) => {
    if (protein.uniprotId) {
      navigate(`/protein/${protein.uniprotId}`);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <form onSubmit={handleSearch} className="mb-6">
        <div className="flex gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for proteins (e.g., insulin)"
            className="flex-1 p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading}
            className={`px-4 py-2 rounded text-white ${
              loading 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-blue-500 hover:bg-blue-600'
            }`}
          >
            {loading ? (
              <span className="flex items-center">
                <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Searching...
              </span>
            ) : (
              'Search'
            )}
          </button>
        </div>
      </form>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p className="font-bold">Error</p>
          <p>{error}</p>
        </div>
      )}

      {!loading && !error && proteins.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {proteins.map((protein) => (
            <div
              key={protein.id}
              onClick={() => handleProteinClick(protein)}
              className="p-4 border rounded shadow-sm hover:shadow-md transition-shadow cursor-pointer bg-white"
            >
              <h3 className="text-lg font-semibold text-gray-800 mb-2">{protein.name}</h3>
              <p className="text-sm text-gray-600 mb-2">{protein.description}</p>
              <div className="flex justify-between text-sm text-gray-500">
                <span>Length: {protein.length}</span>
                <span>{protein.organism}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && !error && proteins.length === 0 && query && (
        <div className="text-center text-gray-600 mt-8">
          <p>No proteins found matching your search.</p>
          <p className="mt-2">Try a different search term or check your spelling.</p>
        </div>
      )}
    </div>
  );
};

export default Search;