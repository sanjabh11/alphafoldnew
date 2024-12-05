import React, { ReactNode } from 'react';

interface TooltipProps {
  content: ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

export const Tooltip: React.FC<TooltipProps> = ({
  content,
  position = 'top'
}) => {
  const positionClasses = {
    top: '-translate-y-full -top-2',
    bottom: 'translate-y-full top-2',
    left: '-translate-x-full -left-2',
    right: 'translate-x-full right-2'
  };

  return (
    <div
      className={`
        absolute z-50 
        ${positionClasses[position]}
        bg-white rounded-lg shadow-lg 
        border border-gray-200
        min-w-[200px] max-w-[300px]
        transform
        transition-opacity duration-200
      `}
    >
      {content}
      <div
        className={`
          absolute w-2 h-2 bg-white 
          transform rotate-45
          border-gray-200
          ${position === 'top' ? 'border-b border-r bottom-[-5px]' :
            position === 'bottom' ? 'border-t border-l top-[-5px]' :
            position === 'left' ? 'border-t border-r right-[-5px]' :
            'border-b border-l left-[-5px]'}
        `}
      />
    </div>
  );
};
