import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Navigation.css';

const Navigation: React.FC = () => {
  const location = useLocation();

  return (
    <nav className="main-nav">
      <div className="nav-content">
        <Link to="/" className="nav-logo">
          AlphaFold Explorer
        </Link>
        <div className="nav-links">
          <Link 
            to="/experiments" 
            className={`nav-link ${location.pathname === '/experiments' ? 'active' : ''}`}
          >
            Experiments
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navigation; 