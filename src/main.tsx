import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import './ui-quality-pass.css';
import { BusinessProvider } from './context/BusinessContext.tsx';
import { ToastProvider } from './context/ToastContext.tsx';

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

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BusinessProvider>
      <ToastProvider>
        <App />
      </ToastProvider>
    </BusinessProvider>
  </StrictMode>,
);
