import React, { useState, useEffect } from 'react';
import { geoService } from '../../services/geoService';
import { uniprotService } from '../../services/uniprotService';
import { geneExpressionService } from '../../services/geneExpressionService';
import './ProteinDataPanel.css';

interface ProteinDataPanelProps {
  geneSymbol: string;
}

export const ProteinDataPanel: React.FC<ProteinDataPanelProps> = ({ geneSymbol }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [proteinData, setProteinData] = useState<any>(null);
  const [geoData, setGeoData] = useState<any>(null);
  const [expressionData, setExpressionData] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch data in parallel
        const [proteinResult, geoResult, expressionResult] = await Promise.all([
          uniprotService.searchProtein(geneSymbol),
          geoService.searchDatasets({ term: geneSymbol }),
          geneExpressionService.searchGeneExpression(geneSymbol)
        ]);

        setProteinData(proteinResult);
        setGeoData(geoResult);
        setExpressionData(expressionResult);

      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    if (geneSymbol) {
      fetchData();
    }
  }, [geneSymbol]);

  if (!geneSymbol) {
    return <div className="protein-data-message">Please enter a gene symbol</div>;
  }

  if (loading) {
    return <div className="protein-data-loading">Loading protein data...</div>;
  }

  if (error) {
    return <div className="protein-data-error">Error: {error}</div>;
  }

  return (
    <div className="protein-data-panel">
      <h2>Protein Information: {geneSymbol}</h2>
      
      {proteinData && (
        <section className="protein-details">
          <h3>Protein Details</h3>
          <div className="data-content">
            <pre>{JSON.stringify(proteinData, null, 2)}</pre>
          </div>
        </section>
      )}

      {geoData && (
        <section className="expression-data">
          <h3>GEO Expression Data</h3>
          <div className="data-content">
            <pre>{JSON.stringify(geoData, null, 2)}</pre>
          </div>
        </section>
      )}

      {expressionData && (
        <section className="gene-expression">
          <h3>Gene Expression Data</h3>
          <div className="data-content">
            <pre>{JSON.stringify(expressionData, null, 2)}</pre>
          </div>
        </section>
      )}
    </div>
  );
}; 