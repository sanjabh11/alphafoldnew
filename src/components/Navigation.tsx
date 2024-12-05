import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Dna, Search, Home, BookOpen, Settings } from 'lucide-react';

export default function Navigation() {
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white dark:bg-gray-800 shadow-md transition-colors duration-200">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="text-xl font-bold text-gray-800 dark:text-white">
            ProteinViz Pro
          </Link>
          <div className="flex space-x-4">
            <Link to="/" className="text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white">
              Home
            </Link>
            <Link to="/search" className="text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white">
              Search
            </Link>
            <Link to="/learn" className="text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white">
              Learn
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}

interface NavLinkProps {
  to: string;
  icon: React.ReactNode;
  text: string;
  isActive: boolean;
}

function NavLink({ to, icon, text, isActive }: NavLinkProps) {
  return (
    <Link
      to={to}
      className={`inline-flex items-center px-1 pt-1 text-sm font-medium ${
        isActive
          ? 'text-indigo-600 border-b-2 border-indigo-600'
          : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
      }`}
    >
      <span className="mr-2">{icon}</span>
      {text}
    </Link>
  );
}