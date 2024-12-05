// src/components/ChainControls.tsx
import React from 'react';
import { ChainInfo } from '../types/protein';
import '../styles/components/ChainControls.css';

interface ChainControlsProps {
  chains: ChainInfo[];
  onToggleChain: (chainId: string) => void;
  onChangeColor: (chainId: string, color: string) => void;
}

const ChainControls: React.FC<ChainControlsProps> = ({ 
  chains, 
  onToggleChain, 
  onChangeColor 
}) => {
  return (
    <div className="chain-controls">
      <h3>Chains</h3>
      {chains.map((chain) => (
        <div key={chain.id} className="chain-item">
          <div className="chain-header">
            <input
              type="checkbox"
              checked={chain.visible}
              onChange={() => onToggleChain(chain.id)}
            />
            <span className="chain-id">Chain {chain.id}</span>
          </div>
          <div className="chain-options">
            <input
              type="color"
              value={chain.color}
              onChange={(e) => onChangeColor(chain.id, e.target.value)}
            />
            <span className="chain-description">{chain.description}</span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ChainControls;