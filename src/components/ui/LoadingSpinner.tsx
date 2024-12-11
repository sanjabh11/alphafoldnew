// src/components/ui/LoadingSpinner.tsx
import React from 'react';
import '../../styles/components/LoadingSpinner.css';

interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  showText?: boolean;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'medium',
  showText = false 
}) => (
  <div className={`loading-spinner loading-spinner-${size}`}>
    <div className="spinner"></div>
    {showText && <p>Loading...</p>}
  </div>
);

export { LoadingSpinner };