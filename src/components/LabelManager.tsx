import React, { useState } from 'react';
import { Stage } from 'ngl';

interface Label {
  id: string;
  text: string;
  position: { x: number; y: number; z: number };
  residueNumber?: number;
}

interface LabelManagerProps {
  stage: Stage;
  structure: any;
  onLabelAdd?: (label: Label) => void;
  onLabelRemove?: (labelId: string) => void;
}

export const LabelManager: React.FC<LabelManagerProps> = ({
  stage,
  structure,
  onLabelAdd,
  onLabelRemove
}) => {
  const [labels, setLabels] = useState<Label[]>([]);
  const [selectedResidue, setSelectedResidue] = useState<number | null>(null);
  const [labelText, setLabelText] = useState('');

  const addLabel = () => {
    if (!selectedResidue || !labelText) return;

    const newLabel: Label = {
      id: `label-${Date.now()}`,
      text: labelText,
      position: structure.getAtomCoordinate(selectedResidue),
      residueNumber: selectedResidue
    };

    setLabels([...labels, newLabel]);
    onLabelAdd?.(newLabel);

    // Add visual label using NGL
    structure.addRepresentation('label', {
      sele: selectedResidue.toString(),
      labelType: 'text',
      labelText: labelText,
      color: '#ffffff',
      backgroundColor: '#000000',
      backgroundOpacity: 0.5
    });

    setLabelText('');
    setSelectedResidue(null);
  };

  const removeLabel = (labelId: string) => {
    const label = labels.find(l => l.id === labelId);
    if (label && label.residueNumber) {
      structure.removeRepresentation('label', label.residueNumber.toString());
    }

    setLabels(labels.filter(l => l.id !== labelId));
    onLabelRemove?.(labelId);
  };

  return (
    <div className="label-manager p-4">
      <div className="mb-4">
        <input
          type="number"
          value={selectedResidue || ''}
          onChange={e => setSelectedResidue(parseInt(e.target.value))}
          placeholder="Residue number"
          className="mr-2 p-2 border rounded"
        />
        <input
          type="text"
          value={labelText}
          onChange={e => setLabelText(e.target.value)}
          placeholder="Label text"
          className="mr-2 p-2 border rounded"
        />
        <button
          onClick={addLabel}
          className="px-4 py-2 bg-blue-500 text-white rounded"
        >
          Add Label
        </button>
      </div>

      <div className="labels-list">
        {labels.map(label => (
          <div key={label.id} className="flex items-center mb-2">
            <span className="mr-2">
              {label.text} (Residue {label.residueNumber})
            </span>
            <button
              onClick={() => removeLabel(label.id)}
              className="px-2 py-1 bg-red-500 text-white rounded"
            >
              Remove
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
