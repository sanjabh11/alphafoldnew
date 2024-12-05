// src/components/LoadingStates/index.tsx
import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingProps {
  message?: string;
  type?: 'full' | 'inline' | 'overlay';
}

export const Loading: React.FC<LoadingProps> = ({ 
  message = 'Loading...', 
  type = 'inline' 
}) => {
  const containerClasses = {
    full: 'min-h-screen',
    inline: 'min-h-[200px]',
    overlay: 'absolute inset-0 bg-white/80'
  };

  return (
    <div className={`
      flex items-center justify-center
      ${containerClasses[type]}
    `}>
      <div className="flex flex-col items-center gap-2">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        <p className="text-sm text-gray-600">{message}</p>
      </div>
    </div>
  );
};