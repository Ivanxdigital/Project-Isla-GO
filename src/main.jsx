import React, { Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import './index.css';
import './styles/shadcn.css';
import './i18n.js';
import emailjs from '@emailjs/browser';
import ErrorBoundary from './components/ErrorBoundary.jsx';

// Initialize EmailJS with your public key
emailjs.init(import.meta.env.VITE_EMAILJS_PUBLIC_KEY);

// Global error handler for undefined showConfirmModal
if (typeof window !== 'undefined') {
  window.showConfirmModal = window.showConfirmModal || function() {
    console.warn('showConfirmModal was called but is not defined');
    return false;
  };
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <Suspense fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      }>
        <BrowserRouter basename="/">
          <App />
        </BrowserRouter>
      </Suspense>
    </ErrorBoundary>
  </React.StrictMode>
);