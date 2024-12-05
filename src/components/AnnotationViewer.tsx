// src/components/AnnotationViewer.tsx
import React, { useState, useEffect } from 'react';
import { uniprotService } from '../services/uniprotService';
import '../styles/components/AnnotationViewer.css';

const ANNOTATION_GROUPS = [
  {
    id: 'functional',
    name: 'Functional Sites',
    types: ['Active site', 'Binding site', 'Site']
  },
  {
    id: 'variants',
    name: 'Variants',
    types: ['Natural variant', 'Mutagenesis']
  },
  {
    id: 'domains',
    name: 'Domains & Motifs',
    types: ['Domain', 'Region', 'Motif']
  },
  {
    id: 'structural',
    name: 'Structural Features',
    types: ['Helix', 'Beta strand', 'Turn']
  },
  {
    id: 'other',
    name: 'Other',
    types: ['Modified residue', 'Cross-link']
  }
];

interface AnnotationViewerProps {
  uniprotId: string;
}

const AnnotationViewer: React.FC<AnnotationViewerProps> = ({ uniprotId }) => {
  const [annotations, setAnnotations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedGroups, setExpandedGroups] = useState<string[]>([]);
  const [selectedGroup, setSelectedGroup] = useState('all');

  useEffect(() => {
    fetchAnnotations();
  }, [uniprotId]);

  const fetchAnnotations = async () => {
    try {
      setLoading(true);
      const data = await uniprotService.getAnnotations(uniprotId);
      setAnnotations(data);
    } catch (err) {
      setError('Failed to fetch annotations');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const toggleGroup = (groupId: string) => {
    setExpandedGroups(prev =>
      prev.includes(groupId)
        ? prev.filter(id => id !== groupId)
        : [...prev, groupId]
    );
  };

  const filterAnnotations = (annotations: any[], group: any) => {
    return annotations.filter(annotation => {
      const matchesSearch = searchTerm === '' ||
        annotation.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesGroup = group.types.includes(annotation.type);
      return matchesSearch && matchesGroup;
    });
  };

  return (
    <div className="annotation-viewer bg-white rounded-lg shadow-lg p-4">
      <div className="search-container mb-4">
        <input
          type="text"
          placeholder="Search annotations..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full p-2 border rounded"
        />
        <select
          value={selectedGroup}
          onChange={(e) => setSelectedGroup(e.target.value)}
          className="mt-2 w-full p-2 border rounded"
        >
          <option value="all">All Groups</option>
          {ANNOTATION_GROUPS.map(group => (
            <option key={group.id} value={group.id}>{group.name}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="text-center py-4">Loading annotations...</div>
      ) : error ? (
        <div className="text-red-500 text-center py-4">{error}</div>
      ) : (
        <div className="space-y-2">
          {ANNOTATION_GROUPS.map(group => {
            const groupAnnotations = filterAnnotations(annotations, group);
            if (groupAnnotations.length === 0) return null;

            return (
              <div key={group.id} className="annotation-group border rounded">
                <div
                  className="group-header p-3 bg-gray-50 flex justify-between items-center cursor-pointer"
                  onClick={() => toggleGroup(group.id)}
                >
                  <h3 className="font-medium">
                    {group.name} ({groupAnnotations.length})
                  </h3>
                  <span className={`transform transition-transform ${
                    expandedGroups.includes(group.id) ? 'rotate-180' : ''
                  }`}>
                    ▼
                  </span>
                </div>
                
                {expandedGroups.includes(group.id) && (
                  <div className="p-3 space-y-2">
                    {groupAnnotations.map((annotation, index) => (
                      <div key={index} className="annotation-card bg-gray-50 p-3 rounded">
                        <h4 className="font-medium">{annotation.type}</h4>
                        <p className="text-sm mt-1">{annotation.description}</p>
                        {annotation.location && (
                          <p className="text-xs text-gray-500 mt-1">
                            Position: {annotation.location.start.value} - {annotation.location.end.value}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AnnotationViewer;