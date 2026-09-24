import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { captureRef } from './lib/referral';
import './styles/global.css';

/**
 * Whoever's link brought this visitor here, read before the first render and
 * held for the rest of the visit. Out here rather than inside a component so
 * it happens exactly once, however the tree below re-renders.
 */
captureRef();

const container = document.getElementById('root');
if (!container) throw new Error('Missing #root element');

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
