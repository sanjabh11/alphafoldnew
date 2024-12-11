// src/components/ui/ErrorMessage.tsx
import React from 'react';
import '../../styles/components/ErrorMessage.css';

interface ErrorMessageProps {
  message: string;
  type?: 'error' | 'warning' | 'info';
  onRetry?: () => void;
  onClose?: () => void;
  className?: string;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({ 
  message, 
  type = 'error',
  onRetry,
  onClose,
  className = ''
}) => (
  <div className={`error-message error-message-${type} ${className}`}>
    <div className="error-content">
      <p>{message}</p>
      <div className="error-actions">
        {onRetry && (
          <button 
            onClick={onRetry}
            className="retry-button"
          >
            Retry
          </button>
        )}
        {onClose && (
          <button 
            onClick={onClose}
            className="close-button"
            aria-label="Close"
          >
            ×
          </button>
        )}
      </div>
    </div>
  </div>
);

export { ErrorMessage };