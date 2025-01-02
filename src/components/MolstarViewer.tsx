import React, { useEffect, useRef, useState } from 'react';
import { PluginConfig } from 'molstar/lib/mol-plugin/config';
import { DefaultPluginUISpec } from 'molstar/lib/mol-plugin-ui/spec';
import { type PluginUIContext } from 'molstar/lib/mol-plugin-ui/context';
import { createPluginUI } from 'molstar/lib/mol-plugin-ui/index'; 
import { PluginCommands } from 'molstar/lib/mol-plugin/commands';
import { State } from 'molstar/lib/mol-state';
import * as NGL from "ngl";

// Import styles
import 'molstar/lib/mol-plugin-ui/skin/light.scss';
import styles from '../styles/molstar.module.scss';

interface MolstarViewerProps {
  pdbId?: string;
  width?: string;
  height?: string;
  advancedConfig?: Partial<typeof PluginConfig>;
}

const MolstarViewer: React.FC<MolstarViewerProps> = ({
  pdbId = '',
  width = '100%',
  height = '600px',
  advancedConfig
}) => {
  const viewerRef = useRef<HTMLDivElement>(null);
  const pluginRef = useRef<PluginUIContext | null>(null);
  const [isLoading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!viewerRef.current) return;

    const initViewer = async () => {
      try {
        if (!pluginRef.current && viewerRef.current) {
          const plugin = await createPluginUI(viewerRef.current, {
            ...DefaultPluginUISpec({
              layout: {
                initial: {
                  isExpanded: false,
                  showControls: true,
                  controlsDisplay: 'reactive',
                  regionState: {
                    left: 'collapsed',
                    right: 'collapsed',
                    top: 'full',
                    bottom: 'collapsed'
                  }
                }
              },
              components: {
                controls: { left: true, right: true, top: true, bottom: true },
                remoteState: { autoAttach: true },
                tooltip: { showDelay: 100 }
              }
            }),
            layout: {
              initial: {
                isExpanded: false,
                showControls: true,
                controlsDisplay: 'reactive'
              }
            },
            config: [
              [PluginConfig.Viewport.ShowControls, true],
              [PluginConfig.Viewport.ShowSettings, true],
              [PluginConfig.Viewport.ShowSelectionMode, true],
              [PluginConfig.Viewport.ShowAnimation, true],
              [PluginConfig.VolumeStreaming.Enabled, true],
              [PluginConfig.Viewport.ShowTrajectoryControls, true],
              ...(advancedConfig ? Object.entries(advancedConfig) : [])
            ]
          });

          plugin.canvas3d?.setProps({
            camera: {
              mode: 'perspective',
              position: { x: 0, y: 0, z: 100 },
              target: { x: 0, y: 0, z: 0 }
            },
            renderer: {
              antialiasing: true,
              backgroundColor: 0xffffff,
              pickingAlphaThreshold: 0.5,
              picking: { enabled: true }
            }
          });

          pluginRef.current = plugin;
        }
      } catch (err) {
        console.error('Failed to initialize viewer:', err);
        setError('Failed to initialize viewer');
      }
    };

    initViewer();

    return () => {
      if (pluginRef.current) {
        pluginRef.current.dispose();
        pluginRef.current = null;
      }
    };
  }, [advancedConfig]);

  useEffect(() => {
    if (!pluginRef.current || !pdbId) return;

    const loadStructure = async () => {
      try {
        setLoading(true);
        setError('');

        const state = pluginRef.current.state.data.state;
        await PluginCommands.State.RemoveObject(state, {
          state,
          ref: state.tree.root.ref,
          removeParentGhosts: true
        });

        const pdbUrl = `https://files.rcsb.org/download/${pdbId}.pdb`;
        const data = await pluginRef.current.builders.data.download(
          { url: pdbUrl, isBinary: false },
          { state: { isGhost: true } }
        );

        const trajectory = await pluginRef.current.builders.structure.parsePdb(data, 'pdb');
        const model = await pluginRef.current.builders.structure.createModel(trajectory);
        const structure = await pluginRef.current.builders.structure.createStructure(model, { name: pdbId });

        const representations = [
          { type: 'cartoon', params: { color: 'chain-id' } },
          { type: 'ball-and-stick', params: { color: 'element', colorParams: { carbonColor: { r: 0.75, g: 0.75, b: 0.75 } } } },
          { type: 'molecular-surface', params: { alpha: 0.4, color: 'uniform', colorParams: { value: 0xCCCCCC } } }
        ];

        for (const rep of representations) {
          await pluginRef.current.builders.structure.representation.addRepresentation(structure, {
            type: rep.type,
            ...rep.params
          });
        }

        await pluginRef.current.canvas3d?.resetCamera();
        await pluginRef.current.canvas3d?.requestCameraReset({ durationMs: 1000 });
        
      } catch (err) {
        console.error(`Failed to load PDB ${pdbId}:`, err);
        setError(`Failed to load PDB ID: ${pdbId}`);
      } finally {
        setLoading(false);
      }
    };

    loadStructure();
  }, [pdbId]);

  return (
    <div className={styles.molstarContainer}>
      {isLoading && (
        <div className={styles.loadingOverlay}>
          <span>Loading structure...</span>
        </div>
      )}
      {error && (
        <div className={styles.errorMessage}>
          {error}
        </div>
      )}
      <div
        ref={viewerRef}
        style={{
          width,
          height,
          position: 'relative',
          backgroundColor: '#ffffff'
        }}
      />
    </div>
  );
};

export default MolstarViewer;