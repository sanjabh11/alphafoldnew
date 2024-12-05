// src/components/SequenceViewer.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { Loader2, Search } from 'lucide-react';

interface SequenceViewerProps {
  uniprotId: string;
  sequence?: string;
  features?: Array<{
    type: string;
    start: number;
    end: number;
    color?: string;
  }>;
}

interface SequenceChunk {
  sequence: string;
  start: number;
  end: number;
}

const SequenceViewer: React.FC<SequenceViewerProps> = ({ 
  uniprotId, 
  sequence: initialSequence, 
  features = [] 
}) => {
  const [sequence, setSequence] = useState<string>(initialSequence || '');
  const [loading, setLoading] = useState(!initialSequence);
  const [error, setError] = useState<string | null>(null);
  const [chunks, setChunks] = useState<SequenceChunk[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<number[]>([]);
  const [currentSearchIndex, setCurrentSearchIndex] = useState(0);
  const [selectedAminoAcid, setSelectedAminoAcid] = useState<string | null>(null);
  const [showProperties, setShowProperties] = useState(false);

  const chunkSize = 50; // Example chunk size

  useEffect(() => {
    if (initialSequence) {
      processSequence(initialSequence);
    }
  }, [initialSequence]);

  const processSequence = (seq: string) => {
    const newChunks: SequenceChunk[] = [];
    for (let i = 0; i < seq.length; i += chunkSize) {
      newChunks.push({
        sequence: seq.slice(i, i + chunkSize),
        start: i + 1,
        end: Math.min(i + chunkSize, seq.length)
      });
    }
    setChunks(newChunks);
  };

  const handleSearch = useCallback(() => {
    if (!searchQuery || !sequence) {
      setSearchResults([]);
      return;
    }

    const results: number[] = [];
    let index = sequence.indexOf(searchQuery.toUpperCase());
    while (index !== -1) {
      results.push(index);
      index = sequence.indexOf(searchQuery.toUpperCase(), index + 1);
    }
    setSearchResults(results);
    setCurrentSearchIndex(0);
  }, [sequence, searchQuery]);

  const getHighlightColor = (position: number) => {
    for (const feature of features) {
      if (position >= feature.start - 1 && position < feature.end) {
        return feature.color || '#FFE4B5';
      }
    }
    return undefined;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-500 p-4">
        <p className="font-semibold">Error loading sequence</p>
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="sequence-viewer p-4 border rounded-lg">
      <div className="flex items-center space-x-4 mb-4">
        <h3 className="text-lg font-semibold">Protein Sequence</h3>
        <div className="flex-1 relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Search sequence..."
            className="w-full px-4 py-2 border rounded-lg"
          />
          <button
            onClick={handleSearch}
            className="absolute right-2 top-1/2 transform -translate-y-1/2"
          >
            <Search className="h-5 w-5 text-gray-400" />
          </button>
        </div>
        {searchResults.length > 0 && (
          <div className="text-sm text-gray-600">
            {currentSearchIndex + 1} of {searchResults.length} matches
          </div>
        )}
      </div>

      <div className="sequence-container font-mono text-sm bg-white">
        {chunks.map((chunk, index) => (
          <div key={index} className="sequence-line hover:bg-gray-50">
            <span className="sequence-position mr-4 text-gray-500">
              {chunk.start.toString().padStart(4, ' ')}
            </span>
            {chunk.sequence.split('').map((aa, aaIndex) => {
              const position = chunk.start + aaIndex - 1;
              const isHighlighted = searchResults.includes(position);
              const highlightColor = getHighlightColor(position);

              return (
                <span
                  key={aaIndex}
                  className={`amino-acid ${isHighlighted ? 'bg-yellow-200' : ''}`}
                  style={{ backgroundColor: highlightColor }}
                  onMouseEnter={() => {
                    setSelectedAminoAcid(aa);
                    setShowProperties(true);
                  }}
                  onMouseLeave={() => setShowProperties(false)}
                >
                  {aa}
                </span>
              );
            })}
            <span className="sequence-position ml-4 text-gray-500">
              {chunk.end}
            </span>
          </div>
        ))}
      </div>

      {sequence && (
        <div className="sequence-stats mt-4 text-sm text-gray-600">
          <p>Total length: {sequence.length} amino acids</p>
        </div>
      )}
    </div>
  );
};

export default SequenceViewer;