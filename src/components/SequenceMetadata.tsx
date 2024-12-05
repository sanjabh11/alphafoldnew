// src/components/SequenceMetadata.tsx
import React from 'react';

interface SequenceMetadataProps {
  conflicts?: any[];
  alternativeSequences?: any[];
}

const SequenceMetadata: React.FC<SequenceMetadataProps> = ({
  conflicts = [],
  alternativeSequences = []
}) => {
  return (
    <div className="sequence-metadata mt-4">
      {conflicts.length > 0 && (
        <div className="mb-4">
          <h4 className="font-semibold">Sequence Conflicts</h4>
          {conflicts.map((conflict, index) => (
            <div key={index} className="text-sm text-gray-600">
              Position {conflict.position}: {conflict.description}
            </div>
          ))}
        </div>
      )}
      
      {alternativeSequences.length > 0 && (
        <div>
          <h4 className="font-semibold">Alternative Sequences</h4>
          {alternativeSequences.map((seq, index) => (
            <div key={index} className="text-sm text-gray-600">
              {seq.name}: Positions {seq.range}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SequenceMetadata;