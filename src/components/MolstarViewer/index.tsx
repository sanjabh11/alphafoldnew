// src/components/MolstarViewer/index.tsx

import { useEffect, useRef } from 'react';
import { Viewer } from '@molstar/mol-plugin-ui';
import { createPluginUI } from '@molstar/mol-plugin-ui';
import { PluginUIContext } from '@molstar/mol-plugin-ui/context';
import '@molstar/mol-plugin-ui/skin/light.scss';
import { storage } from '../../utils/storage';

interface MolstarViewerProps {
  pdbId?: string;
  height?: string | number;
}

export const MolstarViewer: React.FC<MolstarViewerProps> = ({ 
  pdbId, 
  height = '500px' 
}) => {
  const viewerRef = useRef<PluginUIContext | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const plugin = createPluginUI(containerRef.current, {
      layout: {
        initial: {
          isExpanded: false,
          showControls: true,
          showRemoteState: false,
          showStructureSourceControls: false,
          showModelProperties: false
        }
      }
    });

    viewerRef.current = plugin;

    // Restore any saved viewer state
    const savedState = storage.get(`molstar_state_${pdbId}`);
    if (savedState) {
      try {
        plugin.state.setSnapshot(savedState);
      } catch (error) {
        console.error('Error restoring viewer state:', error);
      }
    }

    return () => {
      if (viewerRef.current) {
        // Save viewer state before unmounting
        const state = viewerRef.current.state.getSnapshot();
        storage.set(`molstar_state_${pdbId}`, state);
        viewerRef.current.dispose();
      }
    };
  }, []);

  useEffect(() => {
    const loadStructure = async () => {
      if (!viewerRef.current || !pdbId) return;

      try {
        await viewerRef.current.clear();
        await viewerRef.current.loadStructure({
          url: `https://files.rcsb.org/download/${pdbId}.pdb`,
          format: 'pdb'
        });
      } catch (error) {
        console.error('Error loading structure:', error);
      }
    };

    loadStructure();
  }, [pdbId]);

  return (
    <div 
      ref={containerRef}
      style={{ 
        width: '100%', 
        height: height,
        position: 'relative'
      }} 
    />
  );
};