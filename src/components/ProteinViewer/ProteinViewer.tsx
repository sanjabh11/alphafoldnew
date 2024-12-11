import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as NGL from 'ngl';
import './ProteinViewer.css';

interface ProteinViewerProps {
  pdbData: string;
  height?: number;
  className?: string;
  onLoad?: () => void;
  style?: 'cartoon' | 'spacefill' | 'ball+stick' | 'surface' | 'ribbon';
  colorScheme?: 'chainid' | 'residueindex' | 'sstruc' | 'bfactor' | 'resname' | 'hydrophobicity';
  showLabels?: boolean;
  highlightedResidues?: number[];
  onResidueClick?: (residueIndex: number) => void;
  onResidueHover?: (residueIndex: number | null) => void;
}

export const ProteinViewer: React.FC<ProteinViewerProps> = ({
  pdbData,
  height = 400,
  className = '',
  onLoad,
  style = 'cartoon',
  colorScheme = 'chainid',
  showLabels = false,
  highlightedResidues = [],
  onResidueClick,
  onResidueHover
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<any>(null);
  const componentRef = useRef<any>(null);
  const [isRotating, setIsRotating] = useState(false);
  const [currentQuality, setCurrentQuality] = useState<'low' | 'medium' | 'high'>('medium');

  const handleQualityChange = useCallback((quality: 'low' | 'medium' | 'high') => {
    setCurrentQuality(quality);
    if (stageRef.current) {
      stageRef.current.setParameters({
        quality,
        sampleLevel: quality === 'high' ? 2 : quality === 'medium' ? 1 : 0
      });
    }
  }, []);

  const toggleRotation = useCallback(() => {
    setIsRotating(prev => !prev);
  }, []);

  useEffect(() => {
    if (!containerRef.current || !pdbData) return;

    // Initialize NGL Stage with enhanced settings
    const stage = new NGL.Stage(containerRef.current, {
      backgroundColor: 'white',
      quality: currentQuality,
      impostor: true,
      antialias: true,
      camera: 'perspective',
      clipDist: 10,
      fogNear: 100,
      fogFar: 100,
      sampleLevel: currentQuality === 'high' ? 2 : currentQuality === 'medium' ? 1 : 0
    });
    stageRef.current = stage;

    // Load PDB data
    stage.loadFile(
      new Blob([pdbData], { type: 'text/plain' }),
      { ext: 'pdb' }
    ).then((component: any) => {
      componentRef.current = component;

      // Add main representation
      component.addRepresentation(style, {
        colorScheme: colorScheme,
        sele: 'polymer',
        quality: currentQuality
      });

      // Add backbone trace
      component.addRepresentation('backbone', {
        colorScheme: 'chainid',
        visible: true,
        opacity: 0.3
      });

      // Add labels if enabled
      if (showLabels) {
        component.addRepresentation('label', {
          sele: 'polymer',
          labelType: 'residue',
          labelText: '${resno}${resname}',
          visible: true,
          zOffset: 20
        });
      }

      // Highlight selected residues
      if (highlightedResidues.length > 0) {
        const sele = highlightedResidues.map(i => `${i}`).join(' or ');
        component.addRepresentation('ball+stick', {
          sele: sele,
          colorScheme: 'element',
          visible: true
        });
      }

      // Center and zoom to protein
      component.autoView();
      
      // Add enhanced mouse controls
      stage.mouseControls.add('drag-left', NGL.MouseActions.rotateDrag);
      stage.mouseControls.add('drag-right', NGL.MouseActions.zoomDrag);
      stage.mouseControls.add('drag-middle', NGL.MouseActions.panDrag);
      stage.mouseControls.add('scroll', NGL.MouseActions.zoomScroll);
      stage.mouseControls.add('double-click', NGL.MouseActions.zoomFocus);

      // Add click handling
      if (onResidueClick) {
        stage.signals.clicked.add((pickingProxy: any) => {
          if (pickingProxy && pickingProxy.atom) {
            const residueIndex = pickingProxy.atom.resno;
            onResidueClick(residueIndex);
          }
        });
      }

      // Add hover handling
      if (onResidueHover) {
        stage.signals.hovered.add((pickingProxy: any) => {
          if (pickingProxy && pickingProxy.atom) {
            onResidueHover(pickingProxy.atom.resno);
          } else {
            onResidueHover(null);
          }
        });
      }

      if (onLoad) onLoad();
    });

    // Handle window resize
    const handleResize = () => {
      if (stageRef.current) {
        stageRef.current.handleResize();
      }
    };
    window.addEventListener('resize', handleResize);

    // Setup rotation animation
    let animationId: number;
    const animate = () => {
      if (stageRef.current && isRotating) {
        stageRef.current.spinAnimation.rotation.y += 0.01;
        stageRef.current.viewer.requestRender();
        animationId = requestAnimationFrame(animate);
      }
    };

    // Start/stop rotation based on isRotating state
    if (isRotating) {
      animate();
    }

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
      if (stageRef.current) {
        stageRef.current.dispose();
      }
    };
  }, [pdbData, style, colorScheme, currentQuality, showLabels, highlightedResidues, onResidueClick, onResidueHover, isRotating, onLoad]);

  return (
    <div className="protein-viewer-container">
      <div
        ref={containerRef}
        className={`protein-viewer ${className}`}
        style={{ height: `${height}px` }}
      />
      <div className="protein-viewer-controls">
        <select
          value={currentQuality}
          onChange={(e) => handleQualityChange(e.target.value as 'low' | 'medium' | 'high')}
          className="quality-select"
        >
          <option value="low">Low Quality</option>
          <option value="medium">Medium Quality</option>
          <option value="high">High Quality</option>
        </select>
        <button
          onClick={toggleRotation}
          className={`rotation-toggle ${isRotating ? 'active' : ''}`}
        >
          {isRotating ? 'Stop Rotation' : 'Start Rotation'}
        </button>
      </div>
    </div>
  );
};
