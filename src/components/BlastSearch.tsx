// src/components/BlastSearch.tsx
import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';

interface BlastSearchProps {
  sequence: string;
}

const BlastSearch: React.FC<BlastSearchProps> = ({ sequence }) => {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleBlastSearch = async () => {
    setLoading(true);
    setError(null);

    try {
      // Open NCBI BLAST in a new window with the sequence
      const blastUrl = `https://blast.ncbi.nlm.nih.gov/Blast.cgi?PAGE=Proteins&PROGRAM=blastp&QUERY=${encodeURIComponent(sequence)}`;
      window.open(blastUrl, '_blank');
    } catch (err) {
      setError('Failed to initiate BLAST search');
      console.error('BLAST search error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="blast-search mt-4 p-4 border rounded-lg">
      <h3 className="text-lg font-semibold mb-4">BLAST Search</h3>
      <div className="flex items-center space-x-4">
        <button
          onClick={handleBlastSearch}
          disabled={loading || !sequence}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
        >
          {loading ? (
            <>
              <Loader2 className="animate-spin mr-2 h-4 w-4" />
              Running BLAST...
            </>
          ) : (
            'Run BLAST Search'
          )}
        </button>
        {error && (
          <div className="text-red-500 text-sm">
            {error}
          </div>
        )}
      </div>
      <div className="text-sm text-gray-600 mt-2">
        This will open NCBI BLAST in a new window with your sequence pre-loaded.
      </div>
    </div>
  );
};

export default BlastSearch;