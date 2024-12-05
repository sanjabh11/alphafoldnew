import React from 'react';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ value, onChange }) => (
  <div className="search-container">
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Search annotations..."
      className="search-input"
    />
    <select className="group-filter">
      <option value="all">All Groups</option>
      <option value="functional">Functional Sites</option>
      <option value="variants">Variants</option>
      <option value="domains">Domains & Motifs</option>
      <option value="other">Other</option>
    </select>
  </div>
);

export default SearchBar;