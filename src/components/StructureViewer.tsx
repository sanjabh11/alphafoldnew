// src/components/StructureViewer.tsx
import React, { useEffect, useRef } from 'react';
import * as NGL from 'ngl';

interface StructureViewerProps {
  structureUrl: string;
}

const StructureViewer: React.FC<StructureViewerProps> = ({ structureUrl }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<any>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Create NGL Stage object
    const stage = new NGL.Stage(containerRef.current, { backgroundColor: 'white' });
    stageRef.current = stage;

    // Handle window resizing
    const handleResize = () => stage.handleResize();
    window.addEventListener('resize', handleResize);

    // Load structure
    stage.loadFile(structureUrl, { defaultRepresentation: true })
      .then((component: any) => {
        // Add cartoon representation
        component.addRepresentation('cartoon', {
          colorScheme: 'chainid',
          smoothSheet: true
        });
        
        // Add ball+stick representation for ligands
        component.addRepresentation('ball+stick', {
          sele: 'ligand',
          colorScheme: 'element'
        });
        
        // Center and zoom to structure
        component.autoView();
      })
      .catch((error: any) => {
        console.error('Error loading structure:', error);
      });

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      if (stageRef.current) {
        stageRef.current.dispose();
      }
    };
  }, [structureUrl]);

  return (
    <div 
      ref={containerRef} 
      style={{ 
        width: '100%', 
        height: '600px',
        position: 'relative',
        backgroundColor: '#ffffff'
      }}
    />
  );
};

export default StructureViewer;