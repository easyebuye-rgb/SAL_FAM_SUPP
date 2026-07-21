import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import ConfigError from './pages/ConfigError';
import { ErrorBoundary } from './components/ErrorBoundary';
import './index.css';
import { ensureDefaultSettings } from '@/lib/db';
import { supabaseConfigError } from '@/lib/supabaseClient';

if (!supabaseConfigError) {
  ensureDefaultSettings().catch((err) => console.error('Could not create default settings:', err));
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      {supabaseConfigError ? (
        <ConfigError />
      ) : (
        <BrowserRouter>
          <App />
        </BrowserRouter>
      )}
    </ErrorBoundary>
  </React.StrictMode>
);
