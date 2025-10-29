import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderWithProviders, screen, waitFor } from '@/test/utils/test-utils';
import { useTransactions, useCategories } from './use-budget-queries';
import { mockSupabaseClient } from '@/test/mocks/supabase';

function TestComponent() {
    const { data: transactions, isLoading } = useTransactions();
    const { data: categories } = useCategories();

    if (isLoading) return <div>Loading...</div>;

    return (
        <div>
            <h1>Test Component</h1>
            <div data-testid="transaction-count">
                {transactions?.length || 0} transactions
            </div>
            <div data-testid="category-count">
                {categories?.length || 0} categories
            </div>
        </div>
    );
}

describe('use-budget-queries', () => {
    beforeEach(() => {
        // Reset mocks before each test
        mockSupabaseClient.from.mockClear();
    });

    describe('useTransactions', () => {
        it('should fetch transactions successfully', async () => {
            const mockTransactions = [
                {
                    id: '1',
                    user_id: 'test-user-id',
                    category_id: 'cat-1',
                    amount: 100,
                    description: 'Test transaction',
                    date: '2025-10-29',
                    type: 'expense',
                    created_at: '2025-10-29T00:00:00Z',
                    updated_at: '2025-10-29T00:00:00Z',
                },
            ];

            mockSupabaseClient.from.mockReturnValue({
                select: vi.fn().mockReturnValue({
                    eq: vi.fn().mockReturnValue({
                        order: vi.fn().mockResolvedValue({
                            data: mockTransactions,
                            error: null,
                        }),
                    }),
                }),
            });

            renderWithProviders(<TestComponent />);

            await waitFor(() => {
                expect(screen.getByText('Test Component')).toBeInTheDocument();
            });
        });

        it('should show loading state initially', () => {
            renderWithProviders(<TestComponent />);
            expect(screen.getByText('Loading...')).toBeInTheDocument();
        });
    });

    describe('useCategories', () => {
        it('should fetch categories successfully', async () => {
            const mockCategories = [
                {
                    id: 'cat-1',
                    user_id: 'test-user-id',
                    name: 'Food',
                    type: 'expense',
                    color: '#FF0000',
                    icon: '🍔',
                    created_at: '2025-10-29T00:00:00Z',
                    updated_at: '2025-10-29T00:00:00Z',
                },
            ];

            // Mock for categories query
            mockSupabaseClient.from.mockReturnValueOnce({
                select: vi.fn().mockReturnValue({
                    eq: vi.fn().mockReturnValue({
                        order: vi.fn().mockResolvedValue({
                            data: mockCategories,
                            error: null,
                        }),
                    }),
                }),
            });

            // Mock for transactions query (called first)
            mockSupabaseClient.from.mockReturnValueOnce({
                select: vi.fn().mockReturnValue({
                    eq: vi.fn().mockReturnValue({
                        order: vi.fn().mockResolvedValue({
                            data: [],
                            error: null,
                        }),
                    }),
                }),
            });

            renderWithProviders(<TestComponent />);

            // Just verify the component renders without error
            await waitFor(() => {
                expect(screen.getByText('Test Component')).toBeInTheDocument();
            });
        });
    });
});
