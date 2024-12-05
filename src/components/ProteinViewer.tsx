// src/components/ProteinViewer.tsx
import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as NGL from 'ngl';
import { Loader2, Pause, Play, Tag, Ruler, Layers, Eye, EyeOff, Download, Share2, RotateCw } from 'lucide-react';
import { MeasurementTools } from './StructureAnalysis/MeasurementTools';
import { Measurement } from '../types/measurements';
import { AnnotationOverlay } from './AnnotationOverlay';
import { alphafold3Service } from '../services/alphafold3Service';
import './ProteinViewer.css';

interface ProteinViewerProps {
  pdbData: string;
  style?: React.CSSProperties;
  viewerStyle?: 'cartoon' | 'surface' | 'ribbon';
  colorScheme?: 'chainid' | 'element' | 'residue' | 'secondary-structure' | 'hydrophobicity' | 'conservation';
  quality?: 'low' | 'medium' | 'high';
  predictionMode?: 'fast' | 'accurate';
  showLabels?: boolean;
  measurements?: boolean;
  surfaceAnalysis?: boolean;
  onMeasurement?: (measurement: Measurement) => void;
  onAnalysisComplete?: (results: any) => void;
  annotations?: Array<{
    id: string;
    label: string;
    residueRange: [number, number];
    type: 'domain' | 'binding_site' | 'stability' | string;
    description: string;
    color?: string;
  }>;
  onAnnotationClick?: (annotation: any) => void;
}

interface MeasurementState {
  type: 'distance' | 'angle' | 'surface';
  active: boolean;
  points: number[][];
}

class CustomMouseControls {
  stage: any;
  mouse: { x: number; y: number; moving: boolean; buttons: number };
  
  constructor(stage: any) {
    this.stage = stage;
    this.mouse = {
      x: 0,
      y: 0,
      moving: false,
      buttons: 0
    };
  }

  initEventListeners() {
    const container = this.stage.viewer.container;
    const viewer = this.stage.viewer;

    const handleMouseMove = (event: MouseEvent) => {
      event.preventDefault();
      if (this.mouse.moving && this.mouse.buttons > 0) {
        const deltaX = event.clientX - this.mouse.x;
        const deltaY = event.clientY - this.mouse.y;
        
        if (this.mouse.buttons === 1) {
          viewer.controls.rotate(deltaX * 0.005, deltaY * 0.005);
        } else if (this.mouse.buttons === 2) {
          viewer.controls.zoom(deltaY * 0.1);
        } else if (this.mouse.buttons === 4) {
          viewer.controls.translate(deltaX, deltaY, 0);
        }
      }
      
      this.mouse.x = event.clientX;
      this.mouse.y = event.clientY;
    };

    const handleWheel = (event: WheelEvent) => {
      event.preventDefault();
      viewer.controls.zoom(event.deltaY * -0.001);
    };

    const handleMouseDown = (event: MouseEvent) => {
      event.preventDefault();
      this.mouse.buttons = event.buttons;
      this.mouse.moving = true;
      this.mouse.x = event.clientX;
      this.mouse.y = event.clientY;
    };

    const handleMouseUp = () => {
      this.mouse.buttons = 0;
      this.mouse.moving = false;
    };

    // Add event listeners with proper options
    container.addEventListener('mousemove', handleMouseMove, { passive: false });
    container.addEventListener('wheel', handleWheel, { passive: false });
    container.addEventListener('mousedown', handleMouseDown, { passive: false });
    container.addEventListener('mouseup', handleMouseUp);
    container.addEventListener('mouseleave', handleMouseUp);

    return () => {
      container.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('wheel', handleWheel);
      container.removeEventListener('mousedown', handleMouseDown);
      container.removeEventListener('mouseup', handleMouseUp);
      container.removeEventListener('mouseleave', handleMouseUp);
    };
  }
}

// Add utility functions for measurements
const calculateDistance = (point1: number[], point2: number[]): number => {
  const dx = point2[0] - point1[0];
  const dy = point2[1] - point1[1];
  const dz = point2[2] - point1[2];
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
};

const addDistanceLabel = (distance: number, points: number[][]) => {
  if (!points || points.length !== 2) return;

  const [point1, point2] = points;
  const midpoint = [
    (point1[0] + point2[0]) / 2,
    (point1[1] + point2[1]) / 2,
    (point1[2] + point2[2]) / 2
  ];

  // Create label element
  const label = document.createElement('div');
  label.className = 'absolute bg-white/90 px-2 py-1 rounded text-sm';
  label.textContent = `${distance.toFixed(2)} Å`;

  // Position label at midpoint
  label.style.left = `${midpoint[0]}px`;
  label.style.top = `${midpoint[1]}px`;
  label.style.transform = 'translate(-50%, -50%)';

  // Add label to container
  const container = document.querySelector('.measurement-labels');
  if (container) {
    container.appendChild(label);
  }
};

const ProteinViewer: React.FC<ProteinViewerProps> = ({ 
  pdbData, 
  style,
  viewerStyle = 'cartoon',
  colorScheme = 'chainid',
  quality = 'medium',
  predictionMode = 'fast',
  showLabels = false,
  measurements = false,
  surfaceAnalysis = false,
  onMeasurement,
  onAnalysisComplete,
  annotations,
  onAnnotationClick
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<any>(null);
  const componentRef = useRef<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const animationRef = useRef<number | null>(null);
  const [currentColorScheme, setCurrentColorScheme] = useState(colorScheme);
  const [currentQuality, setCurrentQuality] = useState(quality);
  const [showingLabels, setShowingLabels] = useState(showLabels);
  const [rotationSpeed, setRotationSpeed] = useState(0.01);
  const [measurementState, setMeasurementState] = useState<MeasurementState>({
    type: 'distance',
    active: false,
    points: []
  });
  const [surfaceVisible, setSurfaceVisible] = useState(false);
  const [mouseState, setMouseState] = useState({
    x: 0,
    y: 0,
    moving: false,
    buttons: 0
  });
  const [isAnimating, setIsAnimating] = useState(false);
  const [animationSpeed, setAnimationSpeed] = useState(0.5);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResults, setAnalysisResults] = useState<any>(null);
  const [showSurface, setShowSurface] = useState(false);
  const [analysisMode, setAnalysisMode] = useState<'domain' | 'binding' | 'stability' | null>(null);
  const [viewerControls, setViewerControls] = useState({
    rotate: false,
    autoRotateSpeed: 1,
    zoomLevel: 1,
    highlightedResidues: new Set<number>()
  });

  const handleMouseMove = useCallback((event: MouseEvent) => {
    if (!stageRef.current?.viewer?.controls) return;

    event.preventDefault();
    if (mouseState.moving && mouseState.buttons > 0) {
      const deltaX = event.clientX - mouseState.x;
      const deltaY = event.clientY - mouseState.y;
      
      const controls = stageRef.current.viewer.controls;
      if (mouseState.buttons === 1) {
        controls.rotate(deltaX * 0.005, deltaY * 0.005);
      } else if (mouseState.buttons === 2) {
        controls.zoom(deltaY * 0.1);
      } else if (mouseState.buttons === 4) {
        controls.translate(deltaX, deltaY, 0);
      }
    }

    setMouseState(prev => ({
      ...prev,
      x: event.clientX,
      y: event.clientY
    }));
  }, [mouseState]);

  const handleMouseDown = (event: MouseEvent) => {
    event.preventDefault();
    setMouseState(prev => ({
      ...prev,
      buttons: event.buttons,
      moving: true,
      x: event.clientX,
      y: event.clientY
    }));
  };

  const handleMouseUp = () => {
    setMouseState(prev => ({
      ...prev,
      buttons: 0,
      moving: false
    }));
  };

  // Modify the initialization effect
  useEffect(() => {
    let mounted = true;
    let stage: any = null;
    let cleanup: (() => void) | null = null;

    const initViewer = async () => {
      if (!containerRef.current || !pdbData) {
        setError('No PDB data available');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Clean PDB data before loading
        const cleanedPDB = pdbData
          .split('\n')
          .filter(line => line.trim().length > 0)
          .join('\n');

        // Create NGL Stage with updated parameters
        stage = new NGL.Stage(containerRef.current, {
          backgroundColor: 'white',
          quality: currentQuality,
          antialias: true,
          webgl: true,
          impostor: true,
          camera: 'perspective',
          clipDist: 10,
          fogNear: 100,
          fogFar: 100,
          cameraType: 'perspective',
          sampleLevel: currentQuality === 'high' ? 2 : currentQuality === 'medium' ? 1 : 0
        });

        // Initialize controls
        stage.mouseControls.add('drag-rotate', () => true);
        stage.mouseControls.add('scroll-zoom', () => true);
        stage.mouseControls.add('drag-pan', () => true);

        // Wait for stage initialization
        await new Promise(resolve => setTimeout(resolve, 100));

        stageRef.current = stage;
        
        // Initialize custom controls after stage is ready
        const controls = new CustomMouseControls(stage);
        cleanup = controls.initEventListeners();

        // Create a blob with the cleaned PDB data
        const blob = new Blob([cleanedPDB], { type: 'text/plain' });
        const file = new File([blob], 'structure.pdb', { type: 'text/plain' });

        try {
          // Load structure with specific parameters
          const component = await stage.loadFile(file, { 
            ext: 'pdb',
            firstModelOnly: true,
            asTrajectory: false
          });

          componentRef.current = component;

          // Update representation with new options
          componentRef.current.removeAllRepresentations();
          
          const representationParams = {
            quality: currentQuality,
            colorScheme: currentColorScheme,
            showLabels: showingLabels ? 'all' : 'none'
          };

          // Add main structure representation
          switch (viewerStyle) {
            case 'surface':
              componentRef.current.addRepresentation('surface', {
                ...representationParams,
                opacity: 0.7,
                colorScheme: currentColorScheme
              });
              break;
            case 'ball+stick':
              componentRef.current.addRepresentation('ball+stick', {
                ...representationParams,
                multipleBond: true,
                colorScheme: currentColorScheme === 'chainid' ? 'element' : currentColorScheme
              });
              break;
            case 'ribbon':
              componentRef.current.addRepresentation('ribbon', {
                ...representationParams,
                colorScheme: currentColorScheme
              });
              break;
            case 'cartoon':
            default:
              componentRef.current.addRepresentation('cartoon', {
                ...representationParams,
                colorScheme: currentColorScheme
              });
          }

          // Add annotation highlights if there are annotations
          if (annotations && annotations.length > 0) {
            annotations.forEach(annotation => {
              const [startResidue, endResidue] = annotation.residueRange;
              const selectionString = `${startResidue}-${endResidue}:A`;

              // Add highlight representation for the annotation
              componentRef.current.addRepresentation(viewerStyle === 'surface' ? 'surface' : 'cartoon', {
                sele: selectionString,
                color: annotation.color || '#FFD700',
                opacity: viewerStyle === 'surface' ? 0.7 : 1,
                quality: currentQuality
              });

              // Add ball+stick representation for better visibility
              componentRef.current.addRepresentation('ball+stick', {
                sele: selectionString + ' and sidechainAttached',
                color: annotation.color || '#FFD700',
                aspectRatio: 1.5,
                multipleBond: true,
                quality: currentQuality
              });
            });
          }

          componentRef.current.autoView();
          setLoading(false);
        } catch (err) {
          console.error('Error loading structure:', err);
          throw new Error('Failed to load structure file');
        }
      } catch (err) {
        console.error('Error initializing viewer:', err);
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Failed to load structure');
          setLoading(false);
        }
      }
    };

    initViewer();

    return () => {
      mounted = false;
      if (cleanup) cleanup();
      if (stageRef.current) {
        stageRef.current.dispose();
        stageRef.current = null;
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
    };
  }, [pdbData, viewerStyle, currentColorScheme, currentQuality, showingLabels]);

  // Separate animation effect
  useEffect(() => {
    if (!stageRef.current) return;

    let animationId: number | null = null;
    const stage = stageRef.current;

    const animate = () => {
      if (isAnimating && stage) {
        stage.spinAnimation.axis.set(0, 1, 0);
        stage.spinAnimation.angle = animationSpeed;
        stage.viewer.requestRender();
        animationId = requestAnimationFrame(animate);
      }
    };

    if (isAnimating) {
      stage.setParameters({ impostor: true });
      stage.spinAnimation.axis.set(0, 1, 0);
      animate();
    } else {
      if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
      }
      if (stage.spinAnimation) {
        stage.spinAnimation.angle = 0;
      }
    }

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [isAnimating, animationSpeed]);

  const handleMeasurement = useCallback((measurement: Measurement) => {
    if (onMeasurement) {
      onMeasurement(measurement);
    }
    
    // Add visual representation of measurement
    if (measurement.type === 'distance') {
      const shape = new NGL.Shape('measurement-' + measurement.id);
      shape.addCylinder(
        measurement.points[0],
        measurement.points[1],
        [0.5, 0.5, 1],
        0.1
      );
      const shapeComp = stageRef.current.addComponentFromObject(shape);
      shapeComp.addRepresentation('buffer');
    }
  }, [onMeasurement]);

  const toggleSurfaceAnalysis = () => {
    if (!componentRef.current) return;
    
    if (surfaceVisible) {
      componentRef.current.removeRepresentation('surface');
    } else {
      componentRef.current.addRepresentation('surface', {
        opacity: 0.7,
        colorScheme: 'hydrophobicity',
        surfaceType: 'sas'
      });
    }
    setSurfaceVisible(!surfaceVisible);
  };

  const handleAnnotationClick = useCallback((annotation: any) => {
    if (!componentRef.current || !stageRef.current) return;

    // Get the residue range
    const [startResidue, endResidue] = annotation.residueRange;
    const selectionString = `${startResidue}-${endResidue}:A`;

    // Center view on the selected residues
    componentRef.current.autoView(selectionString, 2000);

    // Create a temporary highlight effect
    const shape = new NGL.Shape('highlight-' + annotation.id);
    const selection = new NGL.Selection(selectionString);
    const atoms = componentRef.current.structure.getAtomSetWithinSelection(selection);
    const positions = atoms.atomCenter();
    
    shape.addSphere(positions, [1, 0.8, 0], 3);
    const shapeComp = stageRef.current.addComponentFromObject(shape);
    shapeComp.addRepresentation('buffer');

    // Remove highlight after animation
    setTimeout(() => {
      stageRef.current?.removeComponent(shapeComp);
    }, 2000);

    // Call the onAnnotationClick callback if provided
    if (onAnnotationClick) {
      onAnnotationClick(annotation);
    }
  }, [onAnnotationClick]);

  useEffect(() => {
    if (!stageRef.current || !annotations) return;

    const stage = stageRef.current;
    
    // Add picking event handler
    const pickingProxy = stage.mouseControls.add('clickPick-left', (stage: any, pickingProxy: any) => {
      if (pickingProxy && annotations) {
        const residueIndex = pickingProxy.getResidueIndex();
        // Find if the clicked residue is part of any annotation
        const clickedAnnotation = annotations.find(
          annotation => residueIndex >= annotation.residueRange[0] && 
                       residueIndex <= annotation.residueRange[1]
        );
        
        if (clickedAnnotation) {
          handleAnnotationClick(clickedAnnotation);
        }
      }
    });

    return () => {
      if (stage.mouseControls) {
        stage.mouseControls.remove('clickPick-left');
      }
    };
  }, [annotations, handleAnnotationClick]);

  const analyzeStructure = useCallback(async () => {
    if (!stageRef.current || !pdbData) return;
    
    setIsAnalyzing(true);
    try {
      const results = await alphafold3Service.analyzePrediction(pdbData, {
        includeDomains: true,
        includeBindingSites: true,
        includeStability: true
      });
      setAnalysisResults(results);
      
      // Update visualization with analysis results
      if (results.domains) {
        results.domains.forEach((domain: any) => {
          // Add domain visualization logic
        });
      }
    } catch (error) {
      console.error('Error analyzing structure:', error);
    } finally {
      setIsAnalyzing(false);
    }
  }, [pdbData, stageRef]);

  const toggleSurface = useCallback(() => {
    if (!stageRef.current || !componentRef.current) return;
    
    setShowSurface(prev => {
      const newValue = !prev;
      if (newValue) {
        componentRef.current.addRepresentation('surface', {
          opacity: 0.7,
          colorScheme: currentColorScheme
        });
      } else {
        // Remove surface representation
        const surfaceReps = componentRef.current.reprList.filter(
          (rep: any) => rep.parameters.type === 'surface'
        );
        surfaceReps.forEach((rep: any) => componentRef.current.removeRepresentation(rep));
      }
      return newValue;
    });
  }, [stageRef, componentRef, currentColorScheme]);

  const performDomainAnalysis = useCallback(async () => {
    if (!stageRef.current || !componentRef.current) return;
    
    setAnalysisMode('domain');
    // Implementation of domain analysis
    const domains = await analyzeDomainStructure(componentRef.current);
    setAnalysisResults({ type: 'domain', data: domains });
    onAnalysisComplete?.({ type: 'domain', data: domains });
  }, [stageRef, componentRef, onAnalysisComplete]);

  const performBindingSiteAnalysis = useCallback(async () => {
    if (!stageRef.current || !componentRef.current) return;
    
    setAnalysisMode('binding');
    // Implementation of binding site prediction
    const bindingSites = await predictBindingSites(componentRef.current);
    setAnalysisResults({ type: 'binding', data: bindingSites });
    onAnalysisComplete?.({ type: 'binding', data: bindingSites });
  }, [stageRef, componentRef, onAnalysisComplete]);

  const performStabilityAnalysis = useCallback(async () => {
    if (!stageRef.current || !componentRef.current) return;
    
    setAnalysisMode('stability');
    // Implementation of stability assessment
    const stabilityData = await assessStability(componentRef.current);
    setAnalysisResults({ type: 'stability', data: stabilityData });
    onAnalysisComplete?.({ type: 'stability', data: stabilityData });
  }, [stageRef, componentRef, onAnalysisComplete]);

  const toggleAutoRotate = useCallback(() => {
    if (!stageRef.current) return;
    setViewerControls(prev => {
      const newRotate = !prev.rotate;
      stageRef.current.toggleSpin();
      return { ...prev, rotate: newRotate };
    });
  }, [stageRef]);

  const handleZoom = useCallback((delta: number) => {
    if (!stageRef.current) return;
    setViewerControls(prev => {
      const newZoom = Math.max(0.1, Math.min(5, prev.zoomLevel + delta));
      stageRef.current.camera.zoom(newZoom);
      return { ...prev, zoomLevel: newZoom };
    });
  }, [stageRef]);

  const highlightResidues = useCallback((residues: number[]) => {
    if (!componentRef.current) return;
    
    setViewerControls(prev => {
      const newHighlighted = new Set(residues);
      componentRef.current.setSelection(
        residues.map(r => `${r}`).join(' or ')
      );
      return { ...prev, highlightedResidues: newHighlighted };
    });
  }, [componentRef]);

  return (
    <div className="protein-viewer-container relative" style={style}>
      {/* Existing viewer container */}
      <div ref={containerRef} className="w-full h-full" />

      {/* Enhanced control panel */}
      <div className="absolute top-4 right-4 flex flex-col space-y-2">
        <div className="bg-white shadow-lg rounded-lg p-2 space-y-2">
          {/* View controls */}
          <button
            onClick={toggleAutoRotate}
            className={`p-2 rounded ${viewerControls.rotate ? 'bg-blue-100' : 'hover:bg-gray-100'}`}
            title="Auto Rotate"
          >
            <RotateCw className="h-5 w-5" />
          </button>
          
          <button
            onClick={() => handleZoom(0.1)}
            className="p-2 rounded hover:bg-gray-100"
            title="Zoom In"
          >
            +
          </button>
          
          <button
            onClick={() => handleZoom(-0.1)}
            className="p-2 rounded hover:bg-gray-100"
            title="Zoom Out"
          >
            -
          </button>
        </div>

        {/* Analysis controls */}
        <div className="bg-white shadow-lg rounded-lg p-2 space-y-2">
          <button
            onClick={performDomainAnalysis}
            className={`p-2 rounded ${analysisMode === 'domain' ? 'bg-blue-100' : 'hover:bg-gray-100'}`}
            title="Domain Analysis"
          >
            <Tag className="h-5 w-5" />
          </button>
          
          <button
            onClick={performBindingSiteAnalysis}
            className={`p-2 rounded ${analysisMode === 'binding' ? 'bg-blue-100' : 'hover:bg-gray-100'}`}
            title="Binding Site Analysis"
          >
            <Layers className="h-5 w-5" />
          </button>
          
          <button
            onClick={performStabilityAnalysis}
            className={`p-2 rounded ${analysisMode === 'stability' ? 'bg-blue-100' : 'hover:bg-gray-100'}`}
            title="Stability Analysis"
          >
            <Eye className="h-5 w-5" />
          </button>
        </div>

        {/* Export options */}
        <div className="bg-white shadow-lg rounded-lg p-2 space-y-2">
          <button
            onClick={() => {/* Implement download */}}
            className="p-2 rounded hover:bg-gray-100"
            title="Download"
          >
            <Download className="h-5 w-5" />
          </button>
          
          <button
            onClick={() => {/* Implement share */}}
            className="p-2 rounded hover:bg-gray-100"
            title="Share"
          >
            <Share2 className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Analysis results overlay */}
      {analysisResults && (
        <div className="absolute bottom-4 left-4 bg-white shadow-lg rounded-lg p-4 max-w-md">
          <h3 className="text-lg font-semibold mb-2">
            {analysisMode === 'domain' && 'Domain Analysis'}
            {analysisMode === 'binding' && 'Binding Site Prediction'}
            {analysisMode === 'stability' && 'Stability Assessment'}
          </h3>
          {/* Render analysis results based on type */}
          {/* Implementation of results display */}
        </div>
      )}
      
      {/* Add AnnotationOverlay */}
      {stageRef.current && componentRef.current && annotations && (
        <AnnotationOverlay
          stage={stageRef.current}
          structure={componentRef.current}
          annotations={annotations}
          onAnnotationClick={onAnnotationClick}
        />
      )}
      
      {/* Keep existing loading and error states */}
      
      {stageRef.current && (
        <MeasurementTools
          stage={stageRef.current}
          onMeasurement={handleMeasurement}
        />
      )}
    </div>
  );
};

export default ProteinViewer;