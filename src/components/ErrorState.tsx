// src/components/ErrorState.tsx
import React from 'react';

interface ErrorStateProps {
  message?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({ 
  message = 'An error occurred while loading the data.' 
}) => (
  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
    <p className="text-red-600 text-sm">{message}</p>
  </div>
);