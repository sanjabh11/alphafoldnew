import React from 'react';
import { Link } from 'react-router-dom';

const Header: React.FC = () => {
  return (
    <header className="bg-white shadow">
      <div className="container mx-auto flex justify-between items-center p-4">
        <h1 className="text-xl font-bold">My Application</h1>
        <nav>
          <Link 
            to="/"
            className="px-4 py-2 text-gray-700 hover:text-blue-500"
          >
            Home
          </Link>
          <Link 
            to="/molstar"
            className="px-4 py-2 text-gray-700 hover:text-blue-500"
          >
            Mol* Viewer
          </Link>
          {/* Add other links as needed */}
        </nav>
      </div>
    </header>
  );
};

export default Header; 