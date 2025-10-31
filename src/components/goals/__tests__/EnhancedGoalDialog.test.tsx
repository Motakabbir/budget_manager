import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { EnhancedGoalDialog } from '@/components/goals/EnhancedGoalDialog';
import { useGoalTypeConfig, useRecommendedSavings } from '@/lib/hooks/useGoalAnalytics';

// Mock the hooks
vi.mock('@/lib/hooks/useGoalAnalytics', () => ({
    useGoalTypeConfig: vi.fn(),
    useRecommendedSavings: vi.fn(),
}));

// Mock the GoalTypeSelector component
vi.mock('@/components/goals/GoalTypeSelector', () => ({
    GoalTypeSelector: ({ onTypeSelect }: { selectedType: string; onTypeSelect: (type: string) => void }) => (
        <div data-testid="goal-type-selector">
            <button
                data-testid="select-custom"
                onClick={() => onTypeSelect('custom')}
            >
                Custom
            </button>
            <button
                data-testid="select-emergency"
                onClick={() => onTypeSelect('emergency_fund')}
            >
                Emergency Fund
            </button>
        </div>
    ),
}));

describe('EnhancedGoalDialog', () => {
    const mockOnSubmit = vi.fn();
    const mockOnOpenChange = vi.fn();

    const defaultProps = {
        open: true,
        onOpenChange: mockOnOpenChange,
        onSubmit: mockOnSubmit,
    };

    beforeEach(() => {
        vi.clearAllMocks();
        (useGoalTypeConfig as ReturnType<typeof vi.fn>).mockReturnValue({
            label: 'Custom Goal',
            default_target_amount: 1000,
        });
        (useRecommendedSavings as ReturnType<typeof vi.fn>).mockReturnValue(50);
    });

    it('renders the dialog when open', () => {
        render(<EnhancedGoalDialog {...defaultProps} />);

        expect(screen.getByText('Create New Savings Goal')).toBeInTheDocument();
        expect(screen.getByText('Step 1')).toBeInTheDocument();
        expect(screen.getByTestId('goal-type-selector')).toBeInTheDocument();
    });

    it('does not render when closed', () => {
        render(<EnhancedGoalDialog {...defaultProps} open={false} />);

        expect(screen.queryByText('Create New Savings Goal')).not.toBeInTheDocument();
    });

    it('navigates through steps correctly', async () => {
        render(<EnhancedGoalDialog {...defaultProps} />);

        // Step 1: Goal Type Selection
        expect(screen.getByText('Step 1')).toBeInTheDocument();
        expect(screen.getByText('Next: Goal Details')).toBeInTheDocument();

        // Click Next to go to Step 2
        fireEvent.click(screen.getByText('Next: Goal Details'));

        await waitFor(() => {
            expect(screen.getByText('Step 2')).toBeInTheDocument();
            expect(screen.getByText('Goal Details')).toBeInTheDocument();
        });

        // Click Next to go to Step 3
        fireEvent.click(screen.getByText('Next: Auto-Contribution'));

        await waitFor(() => {
            expect(screen.getByText('Step 3')).toBeInTheDocument();
            expect(screen.getByText('Auto-Contribution Settings')).toBeInTheDocument();
        });
    });

    it('handles goal type selection', async () => {
        render(<EnhancedGoalDialog {...defaultProps} />);

        // Select emergency fund type
        fireEvent.click(screen.getByTestId('select-emergency'));

        // Go to next step
        fireEvent.click(screen.getByText('Next: Goal Details'));

        await waitFor(() => {
            expect(screen.getByText('Step 2')).toBeInTheDocument();
        });

        // Check if goal name is set to the selected type
        const nameInput = screen.getByDisplayValue('Custom Goal');
        expect(nameInput).toBeInTheDocument();
    });

    it('validates required fields before submission', async () => {
        render(<EnhancedGoalDialog {...defaultProps} />);

        // Navigate to final step
        fireEvent.click(screen.getByText('Next: Goal Details'));
        await waitFor(() => screen.getByText('Step 2'));

        fireEvent.click(screen.getByText('Next: Auto-Contribution'));
        await waitFor(() => screen.getByText('Step 3'));

        // Try to submit without required fields
        const submitButton = screen.getByText('Create Goal');
        expect(submitButton).toBeDisabled();
    });

    it('submits goal data correctly', async () => {
        render(<EnhancedGoalDialog {...defaultProps} />);

        // Navigate to step 2
        fireEvent.click(screen.getByText('Next: Goal Details'));
        await waitFor(() => screen.getByText('Step 2'));

        // Fill in goal details
        const nameInput = screen.getByPlaceholderText('Enter goal name');
        const amountInput = screen.getByPlaceholderText('0.00');

        fireEvent.change(nameInput, { target: { value: 'Test Goal' } });
        fireEvent.change(amountInput, { target: { value: '1000' } });

        // Navigate to step 3
        fireEvent.click(screen.getByText('Next: Auto-Contribution'));
        await waitFor(() => screen.getByText('Step 3'));

        // Submit the form
        fireEvent.click(screen.getByText('Create Goal'));

        await waitFor(() => {
            expect(mockOnSubmit).toHaveBeenCalledWith(
                expect.objectContaining({
                    name: 'Test Goal',
                    target_amount: 1000,
                    goal_type: 'custom',
                    priority: 5,
                    auto_contribution_enabled: false,
                })
            );
            expect(mockOnOpenChange).toHaveBeenCalledWith(false);
        });
    });

    it('handles auto-contribution settings', async () => {
        render(<EnhancedGoalDialog {...defaultProps} />);

        // Navigate to step 3
        fireEvent.click(screen.getByText('Next: Goal Details'));
        await waitFor(() => screen.getByText('Step 2'));

        fireEvent.click(screen.getByText('Next: Auto-Contribution'));
        await waitFor(() => screen.getByText('Step 3'));

        // Enable auto-contribution
        const toggle = screen.getByRole('switch');
        fireEvent.click(toggle);

        // Set contribution amount and frequency
        const amountInput = screen.getByPlaceholderText('0.00');
        fireEvent.change(amountInput, { target: { value: '50' } });

        // Fill required fields and submit
        fireEvent.click(screen.getByText('Back'));
        await waitFor(() => screen.getByText('Step 2'));

        const nameInput = screen.getByPlaceholderText('Enter goal name');
        const targetAmountInput = screen.getAllByPlaceholderText('0.00')[0];
        fireEvent.change(nameInput, { target: { value: 'Test Goal' } });
        fireEvent.change(targetAmountInput, { target: { value: '1000' } });

        fireEvent.click(screen.getByText('Next: Auto-Contribution'));
        await waitFor(() => screen.getByText('Step 3'));

        fireEvent.click(screen.getByText('Create Goal'));

        await waitFor(() => {
            expect(mockOnSubmit).toHaveBeenCalledWith(
                expect.objectContaining({
                    auto_contribution_enabled: true,
                    auto_contribution_amount: 50,
                    auto_contribution_frequency: 'monthly',
                })
            );
        });
    });

    it('handles back navigation', async () => {
        render(<EnhancedGoalDialog {...defaultProps} />);

        // Go to step 2
        fireEvent.click(screen.getByText('Next: Goal Details'));
        await waitFor(() => screen.getByText('Step 2'));

        // Go back to step 1
        fireEvent.click(screen.getByText('Back'));
        await waitFor(() => screen.getByText('Step 1'));
    });

    it('resets form when closed', async () => {
        render(<EnhancedGoalDialog {...defaultProps} />);

        // Navigate and make changes
        fireEvent.click(screen.getByText('Next: Goal Details'));
        await waitFor(() => screen.getByText('Step 2'));

        const nameInput = screen.getByPlaceholderText('Enter goal name');
        fireEvent.change(nameInput, { target: { value: 'Test Goal' } });

        // Close dialog
        fireEvent.click(screen.getByText('Create Goal')); // This should close it

        // Reopen dialog
        render(<EnhancedGoalDialog {...defaultProps} />);

        // Check if form is reset
        expect(screen.queryByDisplayValue('Test Goal')).not.toBeInTheDocument();
    });
});