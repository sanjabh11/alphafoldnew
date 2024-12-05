// src/components/StyleSelector.tsx
import React from 'react';
import { StyleOptions } from '../types/protein';
import '../styles/components/StyleSelector.css';

interface StyleSelectorProps {
  options: StyleOptions;
  onChange: (newOptions: StyleOptions) => void;
}

const StyleSelector: React.FC<StyleSelectorProps> = ({ options, onChange }) => {
  return (
    <div className="style-selector">
      <div className="style-group">
        <label>Representation</label>
        <select
          value={options.representation}
          onChange={(e) => onChange({ ...options, representation: e.target.value as StyleOptions['representation'] })}
        >
          <option value="cartoon">Cartoon</option>
          <option value="surface">Surface</option>
          <option value="ball-and-stick">Ball & Stick</option>
          <option value="ribbon">Ribbon</option>
        </select>
      </div>

      <div className="style-group">
        <label>Color Scheme</label>
        <select
          value={options.colorScheme}
          onChange={(e) => onChange({ ...options, colorScheme: e.target.value as StyleOptions['colorScheme'] })}
        >
          <option value="chainid">Chain</option>
          <option value="residue">Residue</option>
          <option value="secondary-structure">Secondary Structure</option>
          <option value="custom">Custom</option>
        </select>
      </div>

      <div className="style-group">
        <label>Opacity</label>
        <input
          type="range"
          min="0"
          max="1"
          step="0.1"
          value={options.opacity}
          onChange={(e) => onChange({ ...options, opacity: parseFloat(e.target.value) })}
        />
      </div>
    </div>
  );
};

export default StyleSelector;