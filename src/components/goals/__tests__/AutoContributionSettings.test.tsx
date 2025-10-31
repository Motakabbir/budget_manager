import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AutoContributionSettings } from '@/components/goals/AutoContributionSettings';
import { useUpdateSavingsGoal } from '@/lib/hooks/use-budget-queries';

// Mock the hooks
vi.mock('@/lib/hooks/use-budget-queries', () => ({
    useUpdateSavingsGoal: vi.fn(),
}));

describe('AutoContributionSettings', () => {
    const mockGoal = {
        id: '1',
        user_id: 'user-1',
        name: 'Emergency Fund',
        target_amount: 1000,
        current_amount: 500,
        deadline: null,
        goal_type: 'emergency_fund' as const,
        priority: 5,
        auto_contribution_enabled: false,
        auto_contribution_amount: 0,
        auto_contribution_frequency: 'monthly' as const,
        description: null,
        target_date: null,
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
    };

    const mockUpdateGoal = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        (useUpdateSavingsGoal as ReturnType<typeof vi.fn>).mockReturnValue({
            mutateAsync: mockUpdateGoal,
            isPending: false,
        });
    });

    it('renders in view mode by default', () => {
        render(<AutoContributionSettings goal={mockGoal} />);

        expect(screen.getByText('Auto-Contribution Settings')).toBeInTheDocument();
        expect(screen.getByText('Disabled')).toBeInTheDocument();
        expect(screen.getByText('Edit')).toBeInTheDocument();
    });

    it('shows enabled status when auto-contribution is enabled', () => {
        const enabledGoal = { ...mockGoal, auto_contribution_enabled: true, auto_contribution_amount: 100 };
        render(<AutoContributionSettings goal={enabledGoal} />);

        expect(screen.getByText('Enabled')).toBeInTheDocument();
        expect(screen.getByText('$100.00')).toBeInTheDocument();
        expect(screen.getByText('Monthly')).toBeInTheDocument();
    });

    it('switches to edit mode when Edit button is clicked', () => {
        render(<AutoContributionSettings goal={mockGoal} />);

        fireEvent.click(screen.getByText('Edit'));

        expect(screen.getByText('Enable Auto-Contribution')).toBeInTheDocument();
        expect(screen.getByText('Save Settings')).toBeInTheDocument();
        expect(screen.getByText('Cancel')).toBeInTheDocument();
    });

    it('toggles auto-contribution switch', () => {
        render(<AutoContributionSettings goal={mockGoal} />);

        fireEvent.click(screen.getByText('Edit'));

        const toggle = screen.getByRole('switch');
        expect(toggle).not.toBeChecked();

        fireEvent.click(toggle);
        expect(toggle).toBeChecked();
    });

    it('shows auto-contribution form when enabled', () => {
        render(<AutoContributionSettings goal={mockGoal} />);

        fireEvent.click(screen.getByText('Edit'));
        fireEvent.click(screen.getByRole('switch'));

        expect(screen.getByPlaceholderText('0.00')).toBeInTheDocument();
        expect(screen.getByText('Monthly')).toBeInTheDocument();
    });

    it('updates contribution amount', () => {
        render(<AutoContributionSettings goal={mockGoal} />);

        fireEvent.click(screen.getByText('Edit'));
        fireEvent.click(screen.getByRole('switch'));

        const amountInput = screen.getByPlaceholderText('0.00');
        fireEvent.change(amountInput, { target: { value: '150' } });

        expect(amountInput).toHaveValue(150);
    });

    it('updates contribution frequency', () => {
        render(<AutoContributionSettings goal={mockGoal} />);

        fireEvent.click(screen.getByText('Edit'));
        fireEvent.click(screen.getByRole('switch'));

        const frequencySelect = screen.getByText('Monthly');
        fireEvent.click(frequencySelect);

        // Select weekly option
        fireEvent.click(screen.getByText('Weekly'));

        expect(screen.getByText('Weekly')).toBeInTheDocument();
    });

    it('calculates and displays monthly savings estimate', () => {
        render(<AutoContributionSettings goal={mockGoal} />);

        fireEvent.click(screen.getByText('Edit'));
        fireEvent.click(screen.getByRole('switch'));

        const amountInput = screen.getByPlaceholderText('0.00');
        fireEvent.change(amountInput, { target: { value: '100' } });

        expect(screen.getByText('Estimated: $100.00 per month')).toBeInTheDocument();
    });

    it('calculates completion time', () => {
        const goalWithProgress = { ...mockGoal, current_amount: 200 };
        render(<AutoContributionSettings goal={goalWithProgress} />);

        fireEvent.click(screen.getByText('Edit'));
        fireEvent.click(screen.getByRole('switch'));

        const amountInput = screen.getByPlaceholderText('0.00');
        fireEvent.change(amountInput, { target: { value: '200' } });

        expect(screen.getByText(/approximately 4 months/)).toBeInTheDocument();
    });

    it('saves settings when Save button is clicked', async () => {
        mockUpdateGoal.mockResolvedValue({});

        render(<AutoContributionSettings goal={mockGoal} />);

        fireEvent.click(screen.getByText('Edit'));
        fireEvent.click(screen.getByRole('switch'));

        const amountInput = screen.getByPlaceholderText('0.00');
        fireEvent.change(amountInput, { target: { value: '100' } });

        fireEvent.click(screen.getByText('Save Settings'));

        await waitFor(() => {
            expect(mockUpdateGoal).toHaveBeenCalledWith({
                id: '1',
                updates: {
                    auto_contribution_enabled: true,
                    auto_contribution_amount: 100,
                    auto_contribution_frequency: 'monthly',
                },
            });
        });
    });

    it('cancels editing when Cancel button is clicked', () => {
        render(<AutoContributionSettings goal={mockGoal} />);

        fireEvent.click(screen.getByText('Edit'));
        fireEvent.click(screen.getByRole('switch'));

        fireEvent.click(screen.getByText('Cancel'));

        expect(screen.getByText('Disabled')).toBeInTheDocument();
        expect(screen.queryByText('Save Settings')).not.toBeInTheDocument();
    });

    it('shows loading state during save', () => {
        (useUpdateSavingsGoal as ReturnType<typeof vi.fn>).mockReturnValue({
            mutateAsync: mockUpdateGoal,
            isPending: true,
        });

        render(<AutoContributionSettings goal={mockGoal} />);

        fireEvent.click(screen.getByText('Edit'));

        expect(screen.getByText('Save Settings')).toBeDisabled();
    });

    it('calls onUpdate callback after successful save', async () => {
        mockUpdateGoal.mockResolvedValue({});
        const mockOnUpdate = vi.fn();

        render(<AutoContributionSettings goal={mockGoal} onUpdate={mockOnUpdate} />);

        fireEvent.click(screen.getByText('Edit'));
        fireEvent.click(screen.getByText('Save Settings'));

        await waitFor(() => {
            expect(mockOnUpdate).toHaveBeenCalled();
        });
    });
});