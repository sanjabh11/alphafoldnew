import React, { useEffect, useState } from 'react';
import { fetchFunctionalAnnotations } from '../services/annotationService';

const ProteinDetail: React.FC<{ accession: string }> = ({ accession }) => {
  const [annotations, setAnnotations] = useState([]);

  useEffect(() => {
    const loadAnnotations = async () => {
      const data = await fetchFunctionalAnnotations(accession);
      setAnnotations(data);
    };

    loadAnnotations();
  }, [accession]);

  return (
    <div>
      <h2>Functional Annotations</h2>
      <ul>
        {annotations.map((annotation) => (
          <li key={annotation.id}>{annotation.description}</li>
        ))}
      </ul>
    </div>
  );
};

export default ProteinDetail; 