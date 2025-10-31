import { useEffect, useCallback } from 'react';
import { RecurringTransactionsService } from '@/lib/services/recurring-transactions.service';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/hooks/use-budget-queries';

/**
 * Hook to automatically process due recurring transactions
 * Runs on mount and can be manually triggered
 */
export function useRecurringAutoProcess() {
    const queryClient = useQueryClient();

    const processRecurring = useCallback(async (silent: boolean = false) => {
        try {
            const result = await RecurringTransactionsService.processDueRecurring();

            if (result.processed > 0) {
                // Invalidate queries to refresh data
                queryClient.invalidateQueries({ queryKey: queryKeys.recurringTransactions });
                queryClient.invalidateQueries({ queryKey: queryKeys.transactions() });

                if (!silent) {
                    toast.success(
                        `${result.processed} recurring transaction${result.processed > 1 ? 's' : ''} created`,
                        {
                            description: 'Your recurring transactions have been processed automatically.',
                            duration: 5000,
                        }
                    );
                }
            }

            if (result.errors.length > 0 && !silent) {
                console.error('Recurring processing errors:', result.errors);
                toast.error('Some recurring transactions failed', {
                    description: 'Check console for details.',
                    duration: 5000,
                });
            }

            return result;
        } catch (error) {
            console.error('Error processing recurring transactions:', error);
            if (!silent) {
                toast.error('Failed to process recurring transactions');
            }
            return { processed: 0, errors: [String(error)] };
        }
    }, [queryClient]);

    // Auto-process on mount
    useEffect(() => {
        // Small delay to allow auth to settle
        const timer = setTimeout(() => {
            processRecurring(true); // Silent on initial load
        }, 2000);

        return () => clearTimeout(timer);
    }, [processRecurring]);

    return {
        processRecurring,
    };
}

/**
 * Hook to check for due recurring transactions without processing
 * Useful for showing notifications/badges
 */
export function useRecurringDueCount() {
    const checkDue = useCallback(async () => {
        try {
            const stats = await RecurringTransactionsService.getStats();
            return stats.dueCount;
        } catch (error) {
            console.error('Error checking due recurring:', error);
            return 0;
        }
    }, []);

    return { checkDue };
}
