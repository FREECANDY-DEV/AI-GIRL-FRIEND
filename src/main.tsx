import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Suppress annoying deprecation warnings from three.js and React DevTools
const originalWarn = console.warn;
console.warn = (...args) => {
  if (typeof args[0] === 'string' && (args[0].includes('THREE.Clock') || args[0].includes('PCFSoftShadowMap') || args[0].includes('using deprecated parameters') || args[0].includes('Download the React DevTools'))) return;
  originalWarn(...args);
};

const originalLog = console.log;
console.log = (...args) => {
  if (typeof args[0] === 'string' && args[0].includes('Download the React DevTools')) return;
  originalLog(...args);
};

const originalInfo = console.info;
console.info = (...args) => {
  if (typeof args[0] === 'string' && args[0].includes('Download the React DevTools')) return;
  originalInfo(...args);
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
