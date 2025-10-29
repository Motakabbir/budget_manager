import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';
import { QueryProvider } from '@/lib/providers/query-provider';
import { Toaster } from '@/components/ui/sonner';
import ErrorBoundary from '@/components/ErrorBoundary';

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <ErrorBoundary>
            <QueryProvider>
                <BrowserRouter>
                    <App />
                    <Toaster position="top-right" richColors closeButton />
                </BrowserRouter>
            </QueryProvider>
        </ErrorBoundary>
    </React.StrictMode>,
);
