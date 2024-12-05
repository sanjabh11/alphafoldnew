import React, { useState } from 'react';
import { Filter, Search as SearchIcon, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface SearchFilters {
  proteinName: string;
  sequenceLength: {
    min: number;
    max: number;
  };
  structureType: string[];
}

const initialFilters: SearchFilters = {
  proteinName: '',
  sequenceLength: {
    min: 0,
    max: 10000
  },
  structureType: []
};

export const AdvancedSearch: React.FC = () => {
  const [filters, setFilters] = useState<SearchFilters>(initialFilters);
  const [showFilters, setShowFilters] = useState(false);
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const queryParams = new URLSearchParams();
    
    if (filters.proteinName) {
      queryParams.set('name', filters.proteinName);
    }
    if (filters.sequenceLength.min > 0) {
      queryParams.set('minLength', filters.sequenceLength.min.toString());
    }
    if (filters.sequenceLength.max < 10000) {
      queryParams.set('maxLength', filters.sequenceLength.max.toString());
    }
    if (filters.structureType.length > 0) {
      queryParams.set('structures', filters.structureType.join(','));
    }

    navigate(`/search?${queryParams.toString()}`);
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <form onSubmit={handleSearch} className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={filters.proteinName}
              onChange={(e) => setFilters(prev => ({ ...prev, proteinName: e.target.value }))}
              placeholder="Search protein name..."
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          </div>
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className="p-2 border rounded-lg hover:bg-gray-50"
            aria-label="Toggle filters"
          >
            <Filter className="w-5 h-5" />
          </button>
        </div>

        {showFilters && (
          <div className="bg-white p-4 rounded-lg border space-y-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Sequence Length
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  max={filters.sequenceLength.max}
                  value={filters.sequenceLength.min}
                  onChange={(e) => setFilters(prev => ({
                    ...prev,
                    sequenceLength: {
                      ...prev.sequenceLength,
                      min: parseInt(e.target.value) || 0
                    }
                  }))}
                  className="w-24 px-2 py-1 border rounded"
                  placeholder="Min"
                />
                <span>to</span>
                <input
                  type="number"
                  min={filters.sequenceLength.min}
                  value={filters.sequenceLength.max}
                  onChange={(e) => setFilters(prev => ({
                    ...prev,
                    sequenceLength: {
                      ...prev.sequenceLength,
                      max: parseInt(e.target.value) || 10000
                    }
                  }))}
                  className="w-24 px-2 py-1 border rounded"
                  placeholder="Max"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Structure Type
              </label>
              <div className="flex flex-wrap gap-2">
                {['X-ray', 'NMR', 'Cryo-EM', 'Model'].map(type => (
                  <label key={type} className="inline-flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.structureType.includes(type)}
                      onChange={(e) => {
                        setFilters(prev => ({
                          ...prev,
                          structureType: e.target.checked
                            ? [...prev.structureType, type]
                            : prev.structureType.filter(t => t !== type)
                        }));
                      }}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="ml-2 text-sm text-gray-600">{type}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setFilters(initialFilters)}
                className="px-3 py-1 text-sm text-gray-600 hover:text-gray-900"
              >
                Reset
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                Apply Filters
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
};