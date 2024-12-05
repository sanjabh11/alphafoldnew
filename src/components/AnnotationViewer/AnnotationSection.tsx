// src/components/AnnotationViewer.tsx
import React, { useEffect, useState } from 'react';
import { uniprotService } from '../services/uniprotService';

interface AnnotationViewerProps {
  uniprotId: string;
}

interface UniProtAnnotation {
  type: string;
  location: {
    start: number;
    end: number;
  } | null;
  description: string;
  evidence?: string;
}

const AnnotationViewer: React.FC<AnnotationViewerProps> = ({ uniprotId }) => {
  const [annotations, setAnnotations] = useState<UniProtAnnotation[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnnotations = async () => {
      try {
        const fetchedAnnotations = await uniprotService.getAnnotations(uniprotId);
        setAnnotations(fetchedAnnotations);
      } catch (err) {
        setError('Failed to fetch protein annotations');
        console.error('Error fetching UniProt annotations:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAnnotations();
  }, [uniprotId]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  return (
    <div className="annotation-viewer">
      {annotations.map((annotation, index) => (
        <div key={index} className="annotation-card">
          <h3>{annotation.type}</h3>
          {annotation.location ? (
            <p>Position: {annotation.location.start} - {annotation.location.end}</p>
          ) : (
            <p>Position: Not specified</p>
          )}
          <p>{annotation.description}</p>
          <p>Evidence: {annotation.evidence || 'Not specified'}</p>
        </div>
      ))}
    </div>
  );
};

export default AnnotationViewer;