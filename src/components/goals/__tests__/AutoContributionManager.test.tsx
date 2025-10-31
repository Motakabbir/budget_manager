import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AutoContributionManager } from '@/components/goals/AutoContributionManager';
import { useGetAutoContributionSchedule, useProcessAutoContributions } from '@/lib/hooks/use-budget-queries';

// Mock the hooks
vi.mock('@/lib/hooks/use-budget-queries', () => ({
    useGetAutoContributionSchedule: vi.fn(),
    useProcessAutoContributions: vi.fn(),
}));

describe('AutoContributionManager', () => {
    const mockSchedule = [
        {
            goalId: '1',
            goalName: 'Emergency Fund',
            amount: 100,
            frequency: 'monthly',
            progress: 50,
            lastContribution: '2025-10-01',
            nextContribution: '2025-11-01',
        },
        {
            goalId: '2',
            goalName: 'Vacation Fund',
            amount: 200,
            frequency: 'weekly',
            progress: 25,
            lastContribution: '2025-10-20',
            nextContribution: '2025-10-27',
        },
    ];

    beforeEach(() => {
        vi.clearAllMocks();
        (useGetAutoContributionSchedule as ReturnType<typeof vi.fn>).mockReturnValue({
            data: mockSchedule,
            isLoading: false,
            refetch: vi.fn(),
        });
        (useProcessAutoContributions as ReturnType<typeof vi.fn>).mockReturnValue({
            mutateAsync: vi.fn().mockResolvedValue({
                processed: 2,
                successful: 2,
                failed: 0,
                totalAmount: 300,
                results: [],
            }),
            isPending: false,
        });
    });

    it('renders the manager with schedule data', () => {
        render(<AutoContributionManager />);

        expect(screen.getByText('Auto-Contribution Manager')).toBeInTheDocument();
        expect(screen.getByText('Emergency Fund')).toBeInTheDocument();
        expect(screen.getByText('Vacation Fund')).toBeInTheDocument();
        expect(screen.getByText('Process Due Contributions')).toBeInTheDocument();
    });

    it('shows loading state', () => {
        (useGetAutoContributionSchedule as ReturnType<typeof vi.fn>).mockReturnValue({
            data: undefined,
            isLoading: true,
            refetch: vi.fn(),
        });

        render(<AutoContributionManager />);

        expect(screen.getByText('Loading auto-contribution schedule...')).toBeInTheDocument();
    });

    it('shows empty state when no auto-contributions', () => {
        (useGetAutoContributionSchedule as ReturnType<typeof vi.fn>).mockReturnValue({
            data: [],
            isLoading: false,
            refetch: vi.fn(),
        });

        render(<AutoContributionManager />);

        expect(screen.getByText('No Auto-Contributions Set Up')).toBeInTheDocument();
        expect(screen.getByText('Enable auto-contribution on your savings goals')).toBeInTheDocument();
    });

    it('displays goal information correctly', () => {
        render(<AutoContributionManager />);

        // Check Emergency Fund details
        expect(screen.getByText('$100.00 monthly')).toBeInTheDocument();
        expect(screen.getByText('50%')).toBeInTheDocument();
        expect(screen.getByText('Last: Oct 01, 2025')).toBeInTheDocument();
        expect(screen.getByText('Next: Nov 01, 2025')).toBeInTheDocument();

        // Check Vacation Fund details
        expect(screen.getByText('$200.00 weekly')).toBeInTheDocument();
        expect(screen.getByText('25%')).toBeInTheDocument();
    });

    it('shows correct status badges', () => {
        render(<AutoContributionManager />);

        // Both should show due dates (mock data shows future dates)
        expect(screen.getAllByText(/Due in/)).toHaveLength(2);
    });

    it('processes contributions when button is clicked', async () => {
        const mockMutateAsync = vi.fn().mockResolvedValue({
            processed: 2,
            successful: 2,
            failed: 0,
            totalAmount: 300,
            results: [],
        });

        (useProcessAutoContributions as ReturnType<typeof vi.fn>).mockReturnValue({
            mutateAsync: mockMutateAsync,
            isPending: false,
        });

        render(<AutoContributionManager />);

        const processButton = screen.getByText('Process Due Contributions');
        fireEvent.click(processButton);

        await waitFor(() => {
            expect(mockMutateAsync).toHaveBeenCalled();
        });
    });

    it('shows processing state', () => {
        (useProcessAutoContributions as ReturnType<typeof vi.fn>).mockReturnValue({
            mutateAsync: vi.fn(),
            isPending: true,
        });

        render(<AutoContributionManager />);

        expect(screen.getByText('Process Due Contributions')).toBeDisabled();
    });

    it('refreshes data when refresh button is clicked', () => {
        const mockRefetch = vi.fn();
        (useGetAutoContributionSchedule as ReturnType<typeof vi.fn>).mockReturnValue({
            data: mockSchedule,
            isLoading: false,
            refetch: mockRefetch,
        });

        render(<AutoContributionManager />);

        const refreshButton = screen.getByTestId('refresh-button');
        fireEvent.click(refreshButton);

        expect(mockRefetch).toHaveBeenCalled();
    });

    it('displays summary information', () => {
        render(<AutoContributionManager />);

        expect(screen.getByText('2 active auto-contributions')).toBeInTheDocument();
    });
});