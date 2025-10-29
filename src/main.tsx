import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';
import { QueryProvider } from '@/lib/providers/query-provider';
import { ThemeProvider } from '@/lib/providers/theme-provider';
import { Toaster } from '@/components/ui/sonner';
import ErrorBoundary from '@/components/ErrorBoundary';
import { initSentry } from '@/lib/sentry';

// Initialize Sentry error monitoring
initSentry();

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <ErrorBoundary>
            <ThemeProvider defaultTheme="system" storageKey="budget-manager-theme">
                <QueryProvider>
                    <BrowserRouter>
                        <App />
                        <Toaster position="top-right" richColors closeButton />
                    </BrowserRouter>
                </QueryProvider>
            </ThemeProvider>
        </ErrorBoundary>
    </React.StrictMode>,
);
