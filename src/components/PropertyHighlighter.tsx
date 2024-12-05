import React from 'react';
import { Stage } from 'ngl';

interface PropertyHighlighterProps {
  stage: Stage;
  structure: any;
  property: 'hydrophobicity' | 'charge' | 'conservation' | 'bfactor';
  colorScheme?: Record<string, string>;
}

export const PropertyHighlighter: React.FC<PropertyHighlighterProps> = ({
  stage,
  structure,
  property,
  colorScheme
}) => {
  const defaultSchemes = {
    hydrophobicity: {
      hydrophobic: '#ff0000',
      neutral: '#ffffff',
      hydrophilic: '#0000ff'
    },
    charge: {
      positive: '#0000ff',
      neutral: '#ffffff',
      negative: '#ff0000'
    },
    conservation: {
      variable: '#ff0000',
      moderate: '#ffff00',
      conserved: '#00ff00'
    }
  };

  const applyPropertyColoring = () => {
    const scheme = colorScheme || defaultSchemes[property];

    structure.addRepresentation('cartoon', {
      color: property,
      scheme: scheme
    });
  };

  return (
    <div className="property-controls">
      <button
        onClick={applyPropertyColoring}
        className="px-4 py-2 bg-blue-500 text-white rounded"
      >
        Apply {property} coloring
      </button>
    </div>
  );
};
