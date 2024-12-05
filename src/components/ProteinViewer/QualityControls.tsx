// src/components/ProteinViewer/QualityControls.tsx
import React from 'react';
import { Settings } from 'lucide-react';

interface QualityControlsProps {
  quality: 'low' | 'medium' | 'high';
  onQualityChange: (quality: 'low' | 'medium' | 'high') => void;
  lighting: number;
  onLightingChange: (value: number) => void;
}

export const QualityControls: React.FC<QualityControlsProps> = ({
  quality,
  onQualityChange,
  lighting,
  onLightingChange
}) => {
  return (
    <div className="absolute top-4 right-4 bg-white/90 p-2 rounded-lg shadow">
      <div className="flex flex-col gap-2">
        <select
          value={quality}
          onChange={(e) => onQualityChange(e.target.value as any)}
          className="text-sm px-2 py-1 rounded border"
        >
          <option value="low">Low Quality</option>
          <option value="medium">Medium Quality</option>
          <option value="high">High Quality</option>
        </select>
        
        <div className="flex items-center gap-2">
          <Settings className="h-4 w-4" />
          <input
            type="range"
            min="0"
            max="100"
            value={lighting}
            onChange={(e) => onLightingChange(parseInt(e.target.value))}
            className="w-24"
          />
        </div>
      </div>
    </div>
  );
};