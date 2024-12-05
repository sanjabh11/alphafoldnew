// src/components/AnnotationViewer/PTMVisualization.tsx
import React from 'react';
import { Tooltip } from '../UI/Tooltip';

interface PTMProps {
  position: number;
  type: string;
  description: string;
  residue: string;
}

export const PTMVisualization: React.FC<PTMProps> = ({
  position,
  type,
  description,
  residue
}) => {
  return (
    <div className="ptm-marker relative">
      <Tooltip
        content={
          <div className="p-2">
            <p className="font-medium">{type}</p>
            <p className="text-sm">{description}</p>
            <p className="text-xs text-gray-500">Position: {position}</p>
            <p className="text-xs text-gray-500">Residue: {residue}</p>
          </div>
        }
      >
        <div 
          className={`h-2 w-2 rounded-full ${getColorForPTMType(type)}`}
          style={{ left: `${(position / totalLength) * 100}%` }}
        />
      </Tooltip>
    </div>
  );
};

// Helper function to determine PTM marker color
const getColorForPTMType = (type: string): string => {
  const colorMap: Record<string, string> = {
    'N6-succinyllysine': 'bg-blue-500',
    'Phosphorylation': 'bg-red-500',
    'Glycosylation': 'bg-green-500',
    'Acetylation': 'bg-purple-500',
    'default': 'bg-gray-500'
  };
  return colorMap[type] || colorMap.default;
};