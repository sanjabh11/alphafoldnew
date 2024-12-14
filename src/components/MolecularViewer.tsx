import React, { useEffect, useRef } from 'react';
import * as NGL from 'ngl';

interface MolecularViewerProps {
  pdbData: string;
  style?: React.CSSProperties;
  highlightResidues?: string[];
}

export const MolecularViewer: React.FC<MolecularViewerProps> = ({
  pdbData,
  style = { width: '100%', height: '400px' },
  highlightResidues = []
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<any>(null);

  useEffect(() => {
    if (containerRef.current && pdbData) {
      // Initialize NGL Stage
      stageRef.current = new NGL.Stage(containerRef.current);
      stageRef.current.setParameters({
        backgroundColor: 'white',
        quality: 'medium'
      });

      // Load structure from PDB data
      const blob = new Blob([pdbData], { type: 'text/plain' });
      stageRef.current.loadFile(blob, { ext: 'pdb' }).then((structure: any) => {
        // Add default representation
        structure.addRepresentation('cartoon', {
          sele: 'protein',
          color: 'chainid'
        });

        // Highlight specific residues if provided
        if (highlightResidues.length > 0) {
          structure.addRepresentation('ball+stick', {
            sele: highlightResidues.join(' or '),
            color: 'red'
          });
        }

        // Auto zoom to structure
        stageRef.current.autoView();
      });

      // Cleanup function
      return () => {
        if (stageRef.current) {
          stageRef.current.dispose();
        }
      };
    }
  }, [pdbData, highlightResidues]);

  return <div ref={containerRef} style={style} />;
};
