// src/components/SequenceNavigator.tsx
import React, { useState } from 'react';

interface SequenceNavigatorProps {
  sequence: string;
  selectedResidues: number[];
  onResidueSelect: (index: number) => void;
}

const SequenceNavigator: React.FC<SequenceNavigatorProps> = ({
  sequence,
  selectedResidues,
  onResidueSelect
}) => {
  const [viewportStart, setViewportStart] = useState(0);
  const residuesPerView = 50;

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h3 className="text-lg font-semibold mb-3">Sequence</h3>
      <div className="font-mono text-sm overflow-x-auto whitespace-nowrap">
        {sequence.split('').map((residue, index) => (
          <span
            key={index}
            className={`inline-block px-1 cursor-pointer ${
              selectedResidues.includes(index) ? 'bg-blue-200' : 'hover:bg-gray-100'
            }`}
            onClick={() => onResidueSelect(index)}
          >
            {residue}
          </span>
        ))}
      </div>
      <div className="mt-2 text-sm text-gray-500">
        Click on residues to highlight them in the structure
      </div>
    </div>
  );
};

export default SequenceNavigator;