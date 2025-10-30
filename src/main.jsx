import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from '../frontend/src/App.jsx';
import '../frontend/src/styles/theme.css';
import './index.css';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element not found');
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>
);
