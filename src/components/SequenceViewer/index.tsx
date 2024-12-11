import React from 'react';

interface SequenceViewerProps {
  sequence: string;
  className?: string;
}

export const SequenceViewer: React.FC<SequenceViewerProps> = ({
  sequence,
  className = ''
}) => {
  // Format sequence into blocks of 10 characters
  const formatSequence = (seq: string): string[] => {
    const blocks: string[] = [];
    for (let i = 0; i < seq.length; i += 10) {
      blocks.push(seq.slice(i, i + 10));
    }
    return blocks;
  };

  const blocks = formatSequence(sequence);

  return (
    <div className={`sequence-viewer ${className}`}>
      <div className="font-mono text-sm bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 overflow-x-auto">
        <pre className="p-4 whitespace-pre">
          {blocks.map((block, blockIndex) => (
            <div key={blockIndex} className="flex">
              <span className="w-16 text-gray-400 select-none">
                {(blockIndex * 10 + 1).toString().padStart(4, ' ')}
              </span>
              <span className="flex-1">
                {block.split('').map((char, charIndex) => (
                  <span
                    key={charIndex}
                    className={`inline-block w-[1.1em] text-center ${
                      // Color-code amino acids by type
                      ['R', 'H', 'K'].includes(char) ? 'text-blue-600 dark:text-blue-400' :  // Basic
                      ['D', 'E'].includes(char) ? 'text-red-600 dark:text-red-400' :         // Acidic
                      ['C', 'M'].includes(char) ? 'text-yellow-600 dark:text-yellow-400' :   // Sulfur
                      ['S', 'T', 'N', 'Q'].includes(char) ? 'text-green-600 dark:text-green-400' :  // Polar
                      ['A', 'V', 'I', 'L', 'F', 'W', 'Y', 'P'].includes(char) ? 'text-purple-600 dark:text-purple-400' :  // Hydrophobic
                      'text-gray-600 dark:text-gray-400'  // Others
                    }`}
                  >
                    {char}
                  </span>
                ))}
              </span>
              {(blockIndex + 1) % 5 === 0 && blockIndex < blocks.length - 1 && (
                <div className="border-b border-gray-200 dark:border-gray-700 my-2" />
              )}
            </div>
          ))}
        </pre>
      </div>
      <div className="mt-2 flex flex-wrap gap-4 text-xs">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 bg-blue-500 rounded" />
          <span>Basic (R,H,K)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 bg-red-500 rounded" />
          <span>Acidic (D,E)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 bg-yellow-500 rounded" />
          <span>Sulfur (C,M)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 bg-green-500 rounded" />
          <span>Polar (S,T,N,Q)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 bg-purple-500 rounded" />
          <span>Hydrophobic (A,V,I,L,F,W,Y,P)</span>
        </div>
      </div>
    </div>
  );
};
