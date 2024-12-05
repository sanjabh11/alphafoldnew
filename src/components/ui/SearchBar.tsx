// src/components/ui/SearchBar.tsx
import React from 'react';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  selectedGroup: string;
  onGroupChange: (group: string) => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ 
  value, 
  onChange, 
  selectedGroup, 
  onGroupChange 
}) => {
  return (
    <div className="search-container">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search annotations..."
        className="search-input"
      />
      <select 
        className="group-filter"
        value={selectedGroup}
        onChange={(e) => onGroupChange(e.target.value)}
      >
        <option value="all">All Groups</option>
        <option value="functional">Functional Sites</option>
        <option value="variants">Variants</option>
        <option value="domains">Domains & Motifs</option>
        <option value="structural">Structural Features</option>
        <option value="other">Other</option>
      </select>
    </div>
  );
};

export default SearchBar;