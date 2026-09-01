import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import '@fontsource/inter/300.css';
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/jetbrains-mono/300.css';
import '@fontsource/jetbrains-mono/400.css';
import '@fontsource/jetbrains-mono/500.css';
import App from './App.tsx';
import './index.css';
import { BusinessProvider } from './context/BusinessContext.tsx';
import { ToastProvider } from './context/ToastContext.tsx';
import { APIProvider } from '@vis.gl/react-google-maps';

// Propagate active AI model to all backend requests safely
if (typeof window !== 'undefined') {
  const originalFetch = window.fetch;
  try {
    // Try standard assignment first
    window.fetch = async (input, init) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
      if (url.startsWith('/api/') || url.includes('/api/')) {
        const activeAi = localStorage.getItem('hal_active_ai') || 'gemini';
        init = init || {};
        const headers = new Headers(init.headers || {});
        headers.set('x-active-ai', activeAi);
        init.headers = headers;
      }
      return originalFetch(input, init);
    };
  } catch (err) {
    try {
      // Fallback to defining property if read-only getter is present
      Object.defineProperty(window, 'fetch', {
        value: async (input: RequestInfo | URL, init?: RequestInit) => {
          const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
          if (url.startsWith('/api/') || url.includes('/api/')) {
            const activeAi = localStorage.getItem('hal_active_ai') || 'gemini';
            init = init || {};
            const headers = new Headers(init.headers || {});
            headers.set('x-active-ai', activeAi);
            init.headers = headers;
          }
          return originalFetch(input, init);
        },
        writable: true,
        configurable: true,
        enumerable: true
      });
    } catch (definePropertyErr) {
      console.warn("Could not intercept window.fetch globally due to environment constraints. Falling back to default fetch.", definePropertyErr);
    }
  }
}

const API_KEY =
  process.env.GOOGLE_MAPS_PLATFORM_KEY ||
  (import.meta as any).env?.VITE_GOOGLE_MAPS_PLATFORM_KEY ||
  (globalThis as any).GOOGLE_MAPS_PLATFORM_KEY ||
  '';

const isValidGoogleMapsKey = (key: string): boolean => {
  if (!key) return false;
  // Standard Google Maps API keys are 39 characters long and start with AIzaSy
  return /^AIzaSy[A-Za-z0-9_\-]{33}$/.test(key);
};

const hasValidKey = isValidGoogleMapsKey(API_KEY);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BusinessProvider>
      <ToastProvider>
        {hasValidKey ? (
          <APIProvider apiKey={API_KEY} version="weekly">
            <App />
          </APIProvider>
        ) : (
          <App />
        )}
      </ToastProvider>
    </BusinessProvider>
  </StrictMode>,
);
