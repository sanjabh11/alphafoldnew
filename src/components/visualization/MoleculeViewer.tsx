import React, { useEffect, useRef, useState } from 'react';
import { Stage } from 'ngl';
import { Download, ZoomIn, ZoomOut, RotateCw, Ruler } from 'lucide-react';
import { LoadingSpinner } from '../ui/LoadingSpinner';

interface MoleculeViewerProps {
  pdbData: string;
  format?: 'pdb' | 'mmcif' | 'mol2';
  onError?: (error: Error) => void;
}

export const MoleculeViewer: React.FC<MoleculeViewerProps> = ({
  pdbData,
  format = 'pdb',
  onError
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<any>(null);
  const [loading, setLoading] = useState(true);
  const [measuring, setMeasuring] = useState(false);
  const [selectedAtoms, setSelectedAtoms] = useState<any[]>([]);

  useEffect(() => {
    if (!containerRef.current) return;

    try {
      const stage = new Stage(containerRef.current, {
        backgroundColor: 'white',
        quality: 'medium',
        impostor: true,
        antialias: true
      });

      stageRef.current = stage;

      // Load molecule
      const blob = new Blob([pdbData], { type: 'text/plain' });
      stage.loadFile(blob, { ext: format }).then((component: any) => {
        component.addRepresentation('cartoon', {
          quality: 'high',
          colorScheme: 'chainid'
        });
        component.autoView();
        setLoading(false);
      }).catch((error: Error) => {
        onError?.(error);
        setLoading(false);
      });

      // Handle window resizing
      const handleResize = () => stage.handleResize();
      window.addEventListener('resize', handleResize);

      return () => {
        window.removeEventListener('resize', handleResize);
        stage.dispose();
      };
    } catch (error) {
      onError?.(error as Error);
      setLoading(false);
    }
  }, [pdbData, format, onError]);

  const handleMeasure = () => {
    if (!stageRef.current) return;

    setMeasuring(!measuring);
    if (!measuring) {
      stageRef.current.mouseControls.add('clickPick-left', (stage: any, pickingProxy: any) => {
        if (pickingProxy && pickingProxy.atom) {
          setSelectedAtoms(prev => [...prev, pickingProxy.atom]);
          if (selectedAtoms.length === 1) {
            // Calculate and display distance
            const distance = calculateDistance(selectedAtoms[0], pickingProxy.atom);
            console.log(`Distance: ${distance.toFixed(2)} Å`);
            setSelectedAtoms([]);
          }
        }
      });
    } else {
      stageRef.current.mouseControls.remove('clickPick-left');
      setSelectedAtoms([]);
    }
  };

  const calculateDistance = (atom1: any, atom2: any) => {
    const dx = atom1.x - atom2.x;
    const dy = atom1.y - atom2.y;
    const dz = atom1.z - atom2.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  };

  const handleExport = async () => {
    if (!stageRef.current) return;

    try {
      const blob = await stageRef.current.makeImage({
        factor: 2,
        antialias: true,
        trim: false,
        transparent: false
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'molecule.png';
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      onError?.(error as Error);
    }
  };

  return (
    <div className="relative w-full h-[600px] border rounded-lg overflow-hidden">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75">
          <LoadingSpinner />
        </div>
      )}
      
      <div ref={containerRef} className="w-full h-full" />

      <div className="absolute top-4 right-4 flex gap-2">
        <button
          onClick={() => stageRef.current?.viewer?.controls?.zoom(1.5)}
          className="p-2 bg-white rounded-full shadow hover:bg-gray-50"
          title="Zoom in"
        >
          <ZoomIn className="w-5 h-5" />
        </button>
        <button
          onClick={() => stageRef.current?.viewer?.controls?.zoom(0.5)}
          className="p-2 bg-white rounded-full shadow hover:bg-gray-50"
          title="Zoom out"
        >
          <ZoomOut className="w-5 h-5" />
        </button>
        <button
          onClick={() => stageRef.current?.autoView()}
          className="p-2 bg-white rounded-full shadow hover:bg-gray-50"
          title="Reset view"
        >
          <RotateCw className="w-5 h-5" />
        </button>
        <button
          onClick={handleMeasure}
          className={`p-2 bg-white rounded-full shadow hover:bg-gray-50 ${
            measuring ? 'text-indigo-600' : ''
          }`}
          title="Measure distance"
        >
          <Ruler className="w-5 h-5" />
        </button>
        <button
          onClick={handleExport}
          className="p-2 bg-white rounded-full shadow hover:bg-gray-50"
          title="Export view"
        >
          <Download className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};