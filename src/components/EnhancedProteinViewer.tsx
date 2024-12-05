// src/components/EnhancedProteinViewer.tsx
import React from 'react';
import ProteinViewer from './ProteinViewer';
import StyleSelector from './StyleSelector';
import ChainControls from './ChainControls';
import SequenceNavigator from './SequenceNavigator';
import StructureDownload from './StructureDownload';

interface EnhancedProteinViewerProps {
  pdbData: string;
  uniprotId: string;
  sequence?: string;
}

const EnhancedProteinViewer: React.FC<EnhancedProteinViewerProps> = ({
  pdbData,
  uniprotId,
  sequence
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {/* Main viewer (3/4 width on desktop) */}
      <div className="md:col-span-3">
        <ProteinViewer pdbData={pdbData} />
      </div>

      {/* Controls panel (1/4 width on desktop) */}
      <div className="space-y-4">
        <StructureDownload 
          uniprotId={uniprotId}
          onDownload={async (format) => {
            // Implementation here
          }}
        />
        
        {sequence && (
          <SequenceNavigator
            sequence={sequence}
            selectedResidues={[]}
            onResidueSelect={() => {}}
          />
        )}
      </div>
    </div>
  );
};

export default EnhancedProteinViewer;