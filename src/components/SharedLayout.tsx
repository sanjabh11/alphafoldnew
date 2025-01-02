import React, { useState } from 'react';
import { DataExplorer } from './DataExplorer';

interface SharedLayoutProps {
  children: React.ReactNode;
}

export const SharedLayout: React.FC<SharedLayoutProps> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<'structure' | 'expression'>('structure');

  return (
    <div className="space-y-6">
      {/* Page-specific content */}
      {children}

      {/* Analysis Tabs */}
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="border-b border-gray-200">
          <nav className="flex">
            <button
              className={`px-4 py-2 ${
                activeTab === 'structure'
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
              onClick={() => setActiveTab('structure')}
            >
              Structure Analysis
            </button>
            <button
              className={`px-4 py-2 ${
                activeTab === 'expression'
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
              onClick={() => setActiveTab('expression')}
            >
              Expression Analysis
            </button>
          </nav>
        </div>

        <div className="p-4">
          <div className="h-[400px] flex items-center justify-center text-gray-500">
            No protein structure loaded
          </div>
        </div>
      </div>

      {/* AlphaFold Data Explorer */}
      <div className="bg-gray-50 rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold mb-4">AlphaFold Data Explorer</h2>
        <div className="space-y-4">
          <div className="flex space-x-2">
            <select className="form-select rounded-md border-gray-300">
              <option>Gene Expression</option>
            </select>
            <input
              type="text"
              placeholder="Enter gene name..."
              className="form-input rounded-md border-gray-300 flex-1"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Organism (e.g., Homo sapiens)"
              className="form-input rounded-md border-gray-300"
            />
            <input
              type="text"
              placeholder="Experiment Type (e.g., RNA-seq)"
              className="form-input rounded-md border-gray-300"
            />
          </div>
          <button className="w-full bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600">
            Search
          </button>
        </div>
      </div>
    </div>
  );
};