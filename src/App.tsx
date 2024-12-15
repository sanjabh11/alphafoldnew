import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Navigation from './components/Navigation';
import Home from './pages/Home';
import Search from './pages/Search';
import ProteinDetail from './pages/ProteinDetail';
import ThemeToggle from './components/ThemeToggle';
import ProteinViewer from './components/ProteinViewer';
import ExpressionAnalysisPanel from './components/ExpressionAnalysis/ExpressionAnalysisPanel';
import { ProcessedData } from './utils/dataProcessing';
import { DataExplorer } from './components/DataExplorer';

const queryClient = new QueryClient();

export default function App() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [pdbData, setPdbData] = useState<string | null>(null);
  const [expressionData, setExpressionData] = useState<ProcessedData | null>(null);
  const [activeTab, setActiveTab] = useState<'structure' | 'expression'>('structure');

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  };

  const handleExpressionDataProcessed = (data: ProcessedData) => {
    setExpressionData(data);
  };

  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className={`min-h-screen ${theme}`}>
          <Navigation />
          <ThemeToggle theme={theme} onToggle={toggleTheme} />
          
          <main className="container mx-auto px-4 py-8">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/search" element={<Search />} />
              <Route path="/protein/:id" element={<ProteinDetail />} />
            </Routes>

            <div className="bg-white rounded-lg shadow-lg overflow-hidden mt-6">
              <div className="border-b">
                <nav className="flex">
                  <button
                    className={`px-4 py-2 ${activeTab === 'structure' ? 'bg-blue-500 text-white' : 'text-gray-600 hover:text-gray-800'}`}
                    onClick={() => setActiveTab('structure')}
                  >
                    Structure Analysis
                  </button>
                  <button
                    className={`px-4 py-2 ${activeTab === 'expression' ? 'bg-blue-500 text-white' : 'text-gray-600 hover:text-gray-800'}`}
                    onClick={() => setActiveTab('expression')}
                  >
                    Expression Analysis
                  </button>
                </nav>
              </div>

              <div className="p-4">
                {activeTab === 'structure' && (
                  <div className="h-[600px]">
                    {pdbData ? (
                      <ProteinViewer
                        pdbData={pdbData}
                        style={{ height: '100%', width: '100%' }}
                        showLabels
                        measurements
                        surfaceAnalysis
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-500">
                        No protein structure loaded
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'expression' && (
                  <ExpressionAnalysisPanel
                    onDataProcessed={handleExpressionDataProcessed}
                    className="h-[600px]"
                  />
                )}
              </div>
            </div>
          </main>
        </div>
      </Router>
      <div className="min-h-screen bg-gray-100">
        <header className="bg-white shadow">
          <div className="container mx-auto px-4 py-6">
            <h1 className="text-2xl font-bold text-gray-900">AlphaFold Data Explorer</h1>
          </div>
        </header>
        <main className="container mx-auto py-6">
          <DataExplorer />
        </main>
      </div>
    </QueryClientProvider>
  );
}