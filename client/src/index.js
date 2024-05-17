import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import svgMap from 'svgmap';
import 'svgmap/dist/svgMap.min.css';

createRoot(document.getElementById('app')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);