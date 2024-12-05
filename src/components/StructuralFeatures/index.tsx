// src/components/StructuralFeatures/index.tsx
import React from 'react';
import { Tooltip } from '../UI/Tooltip';

interface FeatureProps {
  type: 'helix' | 'strand' | 'turn';
  start: number;
  end: number;
  description?: string;
}

export const StructuralFeature: React.FC<FeatureProps> = ({
  type,
  start,
  end,
  description
}) => {
  const getFeatureStyle = (type: string) => {
    const styles = {
      helix: 'bg-red-200 border-red-300',
      strand: 'bg-blue-200 border-blue-300',
      turn: 'bg-green-200 border-green-300'
    };
    return styles[type as keyof typeof styles] || '';
  };

  return (
    <Tooltip
      content={
        <div className="p-2">
          <p className="font-medium capitalize">{type}</p>
          <p className="text-sm">Position: {start}-{end}</p>
          {description && (
            <p className="text-xs text-gray-600">{description}</p>
          )}
        </div>
      }
    >
      <div 
        className={`
          h-4 rounded-sm border
          ${getFeatureStyle(type)}
        `}
        style={{
          width: `${((end - start + 1) / 1019) * 100}%`,
          marginLeft: `${(start / 1019) * 100}%`
        }}
      />
    </Tooltip>
  );
};