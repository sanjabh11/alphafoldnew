// src/components/SequenceAlignmentViewer.tsx
import React, { useEffect, useState } from 'react';
import { MSAViewer } from 'msa-viewer';
import { fetchHomologousSequences } from '../services/blastService';

interface SequenceData {
  id: string;
  sequence: string;
  organism: string;
  identity: number;
}

interface SequenceAlignmentViewerProps {
  proteinId: string;
  sequence: string;
  onResidueSelect?: (position: number) => void;
}

export const SequenceAlignmentViewer: React.FC<SequenceAlignmentViewerProps> = ({
  proteinId,
  sequence,
  onResidueSelect
}) => {
  const [alignments, setAlignments] = useState<SequenceData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAlignments = async () => {
      try {
        setLoading(true);
        const data = await fetchHomologousSequences(sequence);
        setAlignments(data);
      } catch (error) {
        console.error('Error loading alignments:', error);
      } finally {
        setLoading(false);
      }
    };

    loadAlignments();
  }, [sequence]);

  return (
    <div className="sequence-alignment-viewer">
      {loading ? (
        <div className="loading">Loading alignments...</div>
      ) : (
        <div className="alignment-container">
          <MSAViewer
            sequences={alignments}
            colorScheme="clustal"
            onResidueClick={(position) => onResidueSelect?.(position)}
            height={400}
            width="100%"
          />
          <div className="alignment-stats">
            {alignments.map((seq) => (
              <div key={seq.id} className="stat-row">
                <span>{seq.organism}</span>
                <span>{seq.identity}% identity</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// src/services/blastService.ts
import axios from 'axios';

const BLAST_API_URL = 'https://blast.ncbi.nlm.nih.gov/Blast.cgi';

export const fetchHomologousSequences = async (sequence: string) => {
  // Implementation depends on your backend setup
  // This is a simplified example
  const response = await axios.post(`${BLAST_API_URL}/api/blast`, {
    sequence,
    program: 'blastp',
    database: 'nr',
    limit: 10
  });

  return response.data;
};

// src/components/StructureComparison.tsx
import React, { useEffect, useState } from 'react';
import { Stage } from 'ngl';
import { alignStructures } from '../services/structureService';

interface StructureComparisonProps {
  referenceStructure: string; // PDB ID or structure data
  comparisonStructures: string[]; // Array of PDB IDs or structure data
  stage: Stage;
}

export const StructureComparison: React.FC<StructureComparisonProps> = ({
  referenceStructure,
  comparisonStructures,
  stage
}) => {
  const [alignmentResults, setAlignmentResults] = useState<any[]>([]);
  const [activeStructures, setActiveStructures] = useState<Set<string>>(new Set());

  useEffect(() => {
    const performAlignment = async () => {
      const results = await Promise.all(
        comparisonStructures.map(async (structure) => {
          return alignStructures(referenceStructure, structure);
        })
      );
      setAlignmentResults(results);
    };

    performAlignment();
  }, [referenceStructure, comparisonStructures]);

  const toggleStructure = (structureId: string) => {
    const newActive = new Set(activeStructures);
    if (newActive.has(structureId)) {
      newActive.delete(structureId);
    } else {
      newActive.add(structureId);
    }
    setActiveStructures(newActive);
    updateDisplay();
  };

  const updateDisplay = () => {
    // Update NGL viewer display based on active structures
    stage.removeAllComponents();

    // Always show reference structure
    stage.loadFile(referenceStructure, { ext: 'pdb' }).then((component) => {
      component.addRepresentation('cartoon', {
        color: 'blue',
        opacity: 0.8
      });
    });

    // Show active comparison structures
    activeStructures.forEach((structureId) => {
      const alignmentResult = alignmentResults.find(
        (result) => result.structureId === structureId
      );

      if (alignmentResult) {
        stage.loadFile(structureId, { ext: 'pdb' }).then((component) => {
          // Apply alignment transformation matrix
          component.setTransform(alignmentResult.transformationMatrix);
          component.addRepresentation('cartoon', {
            color: 'red',
            opacity: 0.5
          });
        });
      }
    });
  };

  return (
    <div className="structure-comparison">
      <div className="controls">
        <h3>Compare Structures</h3>
        {comparisonStructures.map((structureId) => (
          <div key={structureId} className="structure-toggle">
            <label>
              <input
                type="checkbox"
                checked={activeStructures.has(structureId)}
                onChange={() => toggleStructure(structureId)}
              />
              {structureId}
            </label>
            {alignmentResults.find((r) => r.structureId === structureId)?.rmsd && (
              <span className="rmsd">
                RMSD: {alignmentResults.find((r) => r.structureId === structureId)?.rmsd.toFixed(2)}Å
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

// src/services/structureService.ts
import axios from 'axios';

export const alignStructures = async (reference: string, target: string) => {
  // Implementation depends on your backend setup
  // This is a simplified example
  const response = await axios.post('/api/align-structures', {
    reference,
    target
  });

  return {
    structureId: target,
    rmsd: response.data.rmsd,
    transformationMatrix: response.data.matrix
  };
};

// src/components/DomainViewer.tsx
import React from 'react';
import { fetchDomainData } from '../services/interproService';

interface Domain {
  id: string;
  name: string;
  start: number;
  end: number;
  type: string;
  description: string;
}

interface DomainViewerProps {
  proteinId: string;
  sequence: string;
  onDomainSelect?: (domain: Domain) => void;
}

export const DomainViewer: React.FC<DomainViewerProps> = ({
  proteinId,
  sequence,
  onDomainSelect
}) => {
  const [domains, setDomains] = useState<Domain[]>([]);

  useEffect(() => {
    const loadDomains = async () => {
      const data = await fetchDomainData(proteinId);
      setDomains(data);
    };

    loadDomains();
  }, [proteinId]);

  return (
    <div className="domain-viewer">
      <div className="sequence-track">
        {/* Sequence ruler */}
        <div className="ruler">
          {Array.from({ length: Math.ceil(sequence.length / 100) }).map((_, i) => (
            <span key={i} className="ruler-mark">
              {i * 100}
            </span>
          ))}
        </div>

        {/* Domain visualization */}
        <div className="domains">
          {domains.map((domain) => (
            <div
              key={domain.id}
              className={`domain ${domain.type}`}
              style={{
                left: `${(domain.start / sequence.length) * 100}%`,
                width: `${((domain.end - domain.start) / sequence.length) * 100}%`
              }}
              onClick={() => onDomainSelect?.(domain)}
              title={domain.name}
            >
              <span className="domain-label">{domain.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Domain details */}
      <div className="domain-details">
        {domains.map((domain) => (
          <div key={domain.id} className="domain-info">
            <h4>{domain.name}</h4>
            <p>{domain.description}</p>
            <p>
              Position: {domain.start}-{domain.end}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};