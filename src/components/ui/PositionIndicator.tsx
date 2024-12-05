// src/components/ui/PositionIndicator.tsx
import React from 'react';

interface PositionIndicatorProps {
  start: number;
  end: number;
  totalLength: number;
}

const PositionIndicator: React.FC<PositionIndicatorProps> = ({
  start,
  end,
  totalLength
}) => {
  return (
    <div className="position-indicator">
      <div className="position-bar">
        <div 
          className="position-marker"
          style={{
            left: `${(start / totalLength) * 100}%`,
            width: `${((end - start) / totalLength) * 100}%`
          }}
        />
      </div>
      <span className="position-text">Position: {start} - {end}</span>
    </div>
  );
};

export default PositionIndicator;