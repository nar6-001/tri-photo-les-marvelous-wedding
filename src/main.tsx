import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

window.addEventListener('error', (event) => {
  fetch('/api/debug-log', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      type: 'onerror',
      message: event.message,
      source: event.filename,
      line: event.lineno,
      col: event.colno,
      error: event.error?.stack || event.error?.toString() || 'No stack'
    })
  }).catch(() => {});
});

const originalConsoleError = console.error;
console.error = (...args) => {
  originalConsoleError(...args);
  const message = args.map(arg => {
    if (arg instanceof Error) return arg.stack || arg.message;
    if (typeof arg === 'object') {
      try { return JSON.stringify(arg); } catch { return String(arg); }
    }
    return String(arg);
  }).join(' ');
  fetch('/api/debug-log', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      type: 'console.error',
      message
    })
  }).catch(() => {});
};

window.addEventListener('unhandledrejection', (event) => {
  fetch('/api/debug-log', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      type: 'unhandledrejection',
      message: event.reason?.message || 'Unhandled Rejection',
      error: event.reason?.stack || event.reason?.toString() || 'No stack'
    })
  }).catch(() => {});
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
