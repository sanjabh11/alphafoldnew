import { useEffect, useRef } from 'react';

export function MolstarViewer({ viewerUrl }) {
  const viewerRef = useRef(null);

  useEffect(() => {
    if (viewerRef.current) {
      // Initialize MolStar viewer here
      // Add your MolStar initialization logic
    }
  }, [viewerUrl]);

  return (
    <div 
      ref={viewerRef}
      style={{ width: '100%', height: '400px' }} // Adjust size as needed
    />
  );
} 