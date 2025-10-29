import { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';

// Create a custom render function that includes all providers
function createTestQueryClient() {
    return new QueryClient({
        defaultOptions: {
            queries: {
                retry: false,
                gcTime: 0,
                staleTime: 0,
            },
            mutations: {
                retry: false,
            },
        },
    });
}

interface AllTheProvidersProps {
    children: React.ReactNode;
}

export function AllTheProviders({ children }: AllTheProvidersProps) {
    const testQueryClient = createTestQueryClient();

    return (
        <QueryClientProvider client={testQueryClient}>
            <BrowserRouter>{children}</BrowserRouter>
        </QueryClientProvider>
    );
}

export function renderWithProviders(
    ui: ReactElement,
    options?: Omit<RenderOptions, 'wrapper'>
) {
    return render(ui, { wrapper: AllTheProviders, ...options });
}

// Re-export everything from testing library
export * from '@testing-library/react';
export { renderWithProviders as render };
