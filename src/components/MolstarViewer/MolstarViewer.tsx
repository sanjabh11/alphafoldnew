import React, { useEffect, useRef, useState } from 'react';
import { createPluginUI } from 'molstar/lib/mol-plugin-ui';
import { DefaultPluginUISpec } from 'molstar/lib/mol-plugin-ui/spec';
import { PluginUIContext } from 'molstar/lib/mol-plugin-ui/context';
import { PluginConfig } from 'molstar/lib/mol-plugin/config';
import 'molstar/lib/mol-plugin-ui/skin/light.scss';
import '../../styles/molstar.css';

interface MolstarViewerProps {
  pdbId?: string;
  height?: string;
  width?: string;
  className?: string;
  onError?: (error: string) => void;
}

const MolstarViewer: React.FC<MolstarViewerProps> = ({
  pdbId = '1cbs',
  height = '600px',
  width = '100%',
  className = '',
  onError
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const pluginRef = useRef<PluginUIContext | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('MolstarViewer mounted');
    console.log('Container ref:', containerRef.current);
    if (containerRef.current) {
      const { width, height } = containerRef.current.getBoundingClientRect();
      console.log('Container dimensions:', { width, height });
    }
    return () => {
      console.log('MolstarViewer unmounted');
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      console.log('Initializing Molstar viewer...');
      if (!containerRef.current || pluginRef.current) return;
      setLoading(true);
      setError(null);

      try {
        console.log('Creating plugin UI...');
        const plugin = await createPluginUI(containerRef.current, {
          ...DefaultPluginUISpec({
            layout: {
              initial: {
                isExpanded: false,
                showControls: true,
                controlsDisplay: 'reactive'
              }
            }
          }),
          config: [
            [PluginConfig.Viewport.ShowControls, true],
            [PluginConfig.Viewport.ShowSettings, true],
            [PluginConfig.Viewport.ShowSelectionMode, true],
            [PluginConfig.Viewport.ShowAnimation, true]
          ]
        });

        console.log('Plugin UI created successfully');

        if (!mounted) {
          plugin.dispose();
          return;
        }

        pluginRef.current = plugin;

        if (pdbId) {
          console.log('Loading structure:', pdbId);
          const url = `https://files.rcsb.org/download/${pdbId}.pdb`;
          const data = await plugin.builders.data.download({ url });
          const trajectory = await plugin.builders.structure.parseTrajectory(data, 'pdb');
          await plugin.builders.structure.hierarchy.applyPreset(trajectory, 'default');
          console.log('Structure loaded successfully');
        }
        setLoading(false);
      } catch (err) {
        console.error('Error initializing Molstar:', err);
        const errorMessage = err instanceof Error ? err.message : 'Failed to load structure';
        setError(errorMessage);
        onError?.(errorMessage);
        setLoading(false);
      }
    };

    init();

    return () => {
      mounted = false;
      if (pluginRef.current) {
        pluginRef.current.dispose();
        pluginRef.current = null;
      }
    };
  }, [pdbId, onError]);

  return (
    <div
      className={`molstar-container ${className}`}
      style={{ 
        position: 'relative',
        width,
        height,
        minHeight: '400px',
        border: '1px solid #ccc'
      }}
    >
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75">
          <div className="text-gray-600">Loading structure...</div>
        </div>
      )}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-white">
          <div className="text-red-600">{error}</div>
        </div>
      )}
      <div 
        ref={containerRef} 
        className="molstar-viewer" 
        style={{ 
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: '#f5f5f5'
        }}
      />
    </div>
  );
};

export default MolstarViewer; 