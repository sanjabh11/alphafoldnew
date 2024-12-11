import React, { useState } from 'react';
import { ProteinViewer } from './ProteinViewer';

// Sample PDB data - this is a minimal example structure
const SAMPLE_PDB = `
ATOM      1  N   ALA A   1      -0.525   1.362   0.000
ATOM      2  CA  ALA A   1       0.000   0.000   0.000
ATOM      3  C   ALA A   1       1.520   0.000   0.000
ATOM      4  O   ALA A   1       2.197   0.995   0.000
ATOM      5  CB  ALA A   1      -0.507  -0.785  -1.207
ATOM      6  N   ALA A   2       2.044  -1.233   0.000
ATOM      7  CA  ALA A   2       3.479  -1.451   0.000
ATOM      8  C   ALA A   2       4.039  -0.862   1.288
ATOM      9  O   ALA A   2       5.249  -0.862   1.498
ATOM     10  CB  ALA A   2       3.779  -2.947   0.000
END
`;

export const ProteinViewerDemo: React.FC = () => {
  const [showLabels, setShowLabels] = useState(false);
  const [highlightedResidues, setHighlightedResidues] = useState<number[]>([]);
  const [hoveredResidue, setHoveredResidue] = useState<number | null>(null);
  const [style, setStyle] = useState<'cartoon' | 'spacefill' | 'ball+stick' | 'surface' | 'ribbon'>('cartoon');
  const [colorScheme, setColorScheme] = useState<'chainid' | 'residueindex' | 'sstruc' | 'bfactor' | 'resname' | 'hydrophobicity'>('chainid');

  const handleResidueClick = (residueIndex: number) => {
    setHighlightedResidues(prev => 
      prev.includes(residueIndex) 
        ? prev.filter(r => r !== residueIndex)
        : [...prev, residueIndex]
    );
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Protein Viewer Demo</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <h2 className="text-lg font-semibold mb-2">Controls</h2>
          <div className="space-y-4">
            <div>
              <label className="block mb-2">Style:</label>
              <select 
                value={style}
                onChange={(e) => setStyle(e.target.value as any)}
                className="w-full p-2 border rounded"
              >
                <option value="cartoon">Cartoon</option>
                <option value="spacefill">Spacefill</option>
                <option value="ball+stick">Ball and Stick</option>
                <option value="surface">Surface</option>
                <option value="ribbon">Ribbon</option>
              </select>
            </div>

            <div>
              <label className="block mb-2">Color Scheme:</label>
              <select 
                value={colorScheme}
                onChange={(e) => setColorScheme(e.target.value as any)}
                className="w-full p-2 border rounded"
              >
                <option value="chainid">Chain ID</option>
                <option value="residueindex">Residue Index</option>
                <option value="sstruc">Secondary Structure</option>
                <option value="bfactor">B-factor</option>
                <option value="resname">Residue Name</option>
                <option value="hydrophobicity">Hydrophobicity</option>
              </select>
            </div>

            <div>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={showLabels}
                  onChange={(e) => setShowLabels(e.target.checked)}
                  className="form-checkbox"
                />
                <span>Show Labels</span>
              </label>
            </div>
          </div>

          <div className="mt-4">
            <h3 className="font-semibold">Interaction Info:</h3>
            <p>Hovered Residue: {hoveredResidue || 'None'}</p>
            <p>Selected Residues: {highlightedResidues.join(', ') || 'None'}</p>
          </div>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-2">Features Demo</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li>Use the quality dropdown in the viewer to switch between low/medium/high quality</li>
            <li>Click the rotation button to start/stop smooth rotation</li>
            <li>Click on residues to highlight them</li>
            <li>Hover over residues to see their index</li>
            <li>Toggle labels using the checkbox</li>
            <li>Try different visualization styles and color schemes</li>
          </ul>
        </div>
      </div>

      <div className="w-full h-[600px] border rounded-lg overflow-hidden">
        <ProteinViewer
          pdbData={SAMPLE_PDB}
          height={600}
          style={style}
          colorScheme={colorScheme}
          showLabels={showLabels}
          highlightedResidues={highlightedResidues}
          onResidueClick={handleResidueClick}
          onResidueHover={setHoveredResidue}
        />
      </div>
    </div>
  );
};
