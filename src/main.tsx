import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { captureRef } from './lib/referral';
import './styles/global.css';

/**
 * Before the first render, and deliberately not inside a component: this
 * reads whoever's link brought the visitor here and strips it back out of the
 * address bar. Doing it here means the tidied URL is what the student sees
 * from the very first paint, and it happens exactly once however the tree
 * below re-renders.
 */
captureRef();

const container = document.getElementById('root');
if (!container) throw new Error('Missing #root element');

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
