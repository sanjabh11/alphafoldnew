import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Dna, Search, Home, BookOpen, Database } from 'lucide-react';

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
            <NavLink to="/" icon={<Home size={20} />} text="Home" isActive={isActive('/')} />
            <NavLink to="/search" icon={<Search size={20} />} text="Search" isActive={isActive('/search')} />
            <NavLink to="/experiments" icon={<Database size={20} />} text="Experiments" isActive={isActive('/experiments')} />
            <NavLink to="/learn" icon={<BookOpen size={20} />} text="Learn" isActive={isActive('/learn')} />
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
      className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-md ${
        isActive
          ? 'text-blue-600 bg-blue-50 dark:bg-blue-900 dark:text-blue-200'
          : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-700'
      }`}
    >
      <span className="mr-2">{icon}</span>
      {text}
    </Link>
  );
}