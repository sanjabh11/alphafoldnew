// src/components/SearchWithinPage/index.tsx
import React, { useState } from 'react';
import { Search } from 'lucide-react';

interface SearchResult {
  text: string;
  element: HTMLElement;
}

export const SearchWithinPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);

  const handleSearch = () => {
    if (!searchTerm) return;
    
    const textNodes = document.evaluate(
      "//text()[contains(translate(., 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), '" + 
      searchTerm.toLowerCase() + "')]",
      document.body,
      null,
      XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
      null
    );

    const newResults: SearchResult[] = [];
    for (let i = 0; i < textNodes.snapshotLength; i++) {
      const node = textNodes.snapshotItem(i);
      if (node?.parentElement) {
        newResults.push({
          text: node.textContent || '',
          element: node.parentElement
        });
      }
    }
    
    setResults(newResults);
    if (newResults.length > 0) {
      setCurrentIndex(0);
      scrollToResult(newResults[0].element);
    }
  };

  const scrollToResult = (element: HTMLElement) => {
    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="bg-white rounded-lg shadow-lg p-2 flex items-center gap-2">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          placeholder="Search in page..."
          className="px-2 py-1 border rounded text-sm"
        />
        <button
          onClick={handleSearch}
          className="p-1 hover:bg-gray-100 rounded"
        >
          <Search className="h-4 w-4" />
        </button>
        {results.length > 0 && (
          <span className="text-sm text-gray-500">
            {currentIndex + 1} of {results.length}
          </span>
        )}
      </div>
    </div>
  );
};