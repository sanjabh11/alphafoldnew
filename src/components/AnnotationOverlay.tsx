import React, { useEffect, useState, useCallback } from 'react';
import * as NGL from 'ngl';
import { Stage } from 'ngl';
import { Tooltip } from './Tooltip';

interface Annotation {
  id: string;
  label: string;
  residueRange: [number, number];
  type: string;
  description: string;
  color?: string;
}

interface Position {
  x: number;
  y: number;
}

interface AnnotationOverlayProps {
  stage: Stage;
  structure: any; // NGL Structure component
  annotations: Annotation[];
  onAnnotationClick?: (annotation: Annotation) => void;
}

export const AnnotationOverlay: React.FC<AnnotationOverlayProps> = ({
  stage,
  structure,
  annotations,
  onAnnotationClick
}) => {
  const [annotationPositions, setAnnotationPositions] = useState<Map<string, Position>>(new Map());
  const [hoveredAnnotation, setHoveredAnnotation] = useState<string | null>(null);
  const [isStageReady, setIsStageReady] = useState(false);

  const updateAnnotationPositions = useCallback(() => {
    if (!structure || !stage || !isStageReady) return;
    
    const newPositions = new Map<string, Position>();
    
    annotations.forEach(annotation => {
      const [startResidue, endResidue] = annotation.residueRange;
      
      try {
        // Get the structure object from the component
        const structureObj = structure.structure || structure;
        if (!structureObj) return;

        // Create selection string for the residue range
        const selectionString = `${startResidue}-${endResidue} and .CA`;
        
        // Get atoms using the selection
        const selection = new NGL.Selection(selectionString);
        const atoms = structureObj.getAtoms(selection);
        
        if (atoms && atoms.length > 0) {
          // Calculate center of selected atoms
          const center = new Float32Array(3);
          let count = 0;
          
          for (let i = 0; i < atoms.length; i++) {
            const atom = atoms[i];
            center[0] += atom.x;
            center[1] += atom.y;
            center[2] += atom.z;
            count++;
          }
          
          if (count > 0) {
            center[0] /= count;
            center[1] /= count;
            center[2] /= count;
            
            // Project 3D coordinates to 2D screen coordinates
            const position = stage.projectPoint(center[0], center[1], center[2]);
            newPositions.set(annotation.id, {
              x: position.x,
              y: position.y
            });
          }
        }
      } catch (error) {
        console.warn(`Failed to process annotation ${annotation.id}:`, error);
      }
    });

    setAnnotationPositions(newPositions);
  }, [stage, structure, annotations, isStageReady]);

  // Initialize stage readiness
  useEffect(() => {
    if (!stage) return;

    const checkStage = () => {
      if (stage.viewer && structure) {
        setIsStageReady(true);
      } else {
        setTimeout(checkStage, 100);
      }
    };

    checkStage();
  }, [stage, structure]);

  // Set up render listener
  useEffect(() => {
    if (!stage || !isStageReady) return;

    const handleRender = () => {
      requestAnimationFrame(updateAnnotationPositions);
    };

    try {
      stage.signals.rendered.add(handleRender);
      
      // Initial update
      updateAnnotationPositions();
      
      return () => {
        if (stage?.signals?.rendered) {
          stage.signals.rendered.remove(handleRender);
        }
      };
    } catch (error) {
      console.warn('Failed to add render listener:', error);
      return undefined;
    }
  }, [stage, updateAnnotationPositions, isStageReady]);

  const handleAnnotationHover = (annotationId: string | null) => {
    setHoveredAnnotation(annotationId);
  };

  const handleAnnotationClick = (annotation: Annotation) => {
    if (!structure || !stage || !isStageReady) return;

    if (onAnnotationClick) {
      onAnnotationClick(annotation);
    }

    try {
      // Get the structure object
      const structureObj = structure.structure || structure;
      if (!structureObj) return;

      // Create selection for the annotation
      const selectionString = `${annotation.residueRange[0]}-${annotation.residueRange[1]} and .CA`;
      const selection = new NGL.Selection(selectionString);
      const atoms = structureObj.getAtoms(selection);

      if (atoms && atoms.length > 0) {
        // Calculate center
        const center = new Float32Array(3);
        let count = 0;
        
        for (let i = 0; i < atoms.length; i++) {
          const atom = atoms[i];
          center[0] += atom.x;
          center[1] += atom.y;
          center[2] += atom.z;
          count++;
        }
        
        if (count > 0) {
          center[0] /= count;
          center[1] /= count;
          center[2] /= count;
          
          // Animate to center
          stage.animationControls.zoomTo(center, 2000);
        }

        // Update representation
        structure.removeAllRepresentations();
        structure.addRepresentation('cartoon', {
          sele: 'all',
          color: 'chainid'
        });
        structure.addRepresentation('ball+stick', {
          sele: selectionString,
          color: annotation.color || '#FFD700'
        });
      }
    } catch (error) {
      console.warn('Failed to handle annotation click:', error);
    }
  };

  if (!isStageReady) {
    return null;
  }

  return (
    <div className="absolute inset-0 pointer-events-none">
      {annotations.map(annotation => {
        const position = annotationPositions.get(annotation.id);
        if (!position) return null;

        return (
          <div
            key={annotation.id}
            className="absolute pointer-events-auto"
            style={{
              left: position.x,
              top: position.y,
              transform: 'translate(-50%, -50%)'
            }}
            onMouseEnter={() => handleAnnotationHover(annotation.id)}
            onMouseLeave={() => handleAnnotationHover(null)}
            onClick={() => handleAnnotationClick(annotation)}
          >
            <div
              className={`w-3 h-3 rounded-full cursor-pointer ${
                hoveredAnnotation === annotation.id ? 'scale-150' : ''
              } transition-transform`}
              style={{ backgroundColor: annotation.color || '#FFD700' }}
            />
            {hoveredAnnotation === annotation.id && (
              <Tooltip>
                <div className="p-2">
                  <div className="font-medium">{annotation.label}</div>
                  <div className="text-sm text-gray-600">{annotation.description}</div>
                  <div className="text-xs text-gray-500">
                    Residues {annotation.residueRange[0]}-{annotation.residueRange[1]}
                  </div>
                </div>
              </Tooltip>
            )}
          </div>
        );
      })}
    </div>
  );
};