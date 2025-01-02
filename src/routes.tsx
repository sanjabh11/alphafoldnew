import React from 'react';
import { createBrowserRouter } from 'react-router-dom';
import ExperimentsPage from './pages/ExperimentsPage';

export const router = createBrowserRouter([
  {
    path: '/experiments',
    element: <ExperimentsPage />,
  },
  // ... other routes
]); 