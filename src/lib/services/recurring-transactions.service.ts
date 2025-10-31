import { supabase } from '@/lib/supabase/client';

/**
 * Recurring Transactions Service
 * Handles automatic creation of transactions from recurring templates
 */

export class RecurringTransactionsService {
    /**
     * Check and process all due recurring transactions
     * This should be called when the app loads or periodically
     */
    static async processDueRecurring(): Promise<{
        processed: number;
        errors: string[];
    }> {
        const errors: string[] = [];
        let processed = 0;

        try {
            // Get current user
            const { data: { user }, error: userError } = await supabase.auth.getUser();
            if (userError || !user) {
                return { processed: 0, errors: ['Not authenticated'] };
            }

            // Get all active recurring transactions where next_occurrence is today or earlier
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const { data: dueRecurring, error: fetchError } = await supabase
                .from('recurring_transactions')
                .select('*')
                .eq('user_id', user.id)
                .eq('is_active', true)
                .lte('next_occurrence', today.toISOString());

            if (fetchError) {
                errors.push(`Failed to fetch recurring transactions: ${fetchError.message}`);
                return { processed, errors };
            }

            if (!dueRecurring || dueRecurring.length === 0) {
                return { processed: 0, errors: [] };
            }

            console.log(`Found ${dueRecurring.length} due recurring transaction(s)`);

            // Process each due recurring transaction
            for (const recurring of dueRecurring) {
                try {
                    // Call the RPC function to create transaction and update next occurrence
                    const { error: rpcError } = await supabase.rpc('create_recurring_transaction', {
                        recurring_id: recurring.id,
                    });

                    if (rpcError) {
                        errors.push(`Failed to process ${recurring.description || 'recurring transaction'}: ${rpcError.message}`);
                    } else {
                        processed++;
                        console.log(`✓ Processed: ${recurring.description || 'Recurring transaction'}`);
                    }
                } catch (err) {
                    errors.push(`Error processing ${recurring.description || 'recurring transaction'}: ${err}`);
                }
            }

            return { processed, errors };
        } catch (err) {
            errors.push(`Unexpected error: ${err}`);
            return { processed, errors };
        }
    }

    /**
     * Get upcoming recurring transactions (next 7 days)
     */
    static async getUpcoming(days: number = 7): Promise<any[]> {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return [];

            const today = new Date();
            const futureDate = new Date();
            futureDate.setDate(today.getDate() + days);

            const { data, error } = await supabase
                .from('recurring_transactions')
                .select('*, category:categories(*)')
                .eq('user_id', user.id)
                .eq('is_active', true)
                .gte('next_occurrence', today.toISOString())
                .lte('next_occurrence', futureDate.toISOString())
                .order('next_occurrence', { ascending: true });

            if (error) {
                console.error('Error fetching upcoming recurring:', error);
                return [];
            }

            return data || [];
        } catch (err) {
            console.error('Error in getUpcoming:', err);
            return [];
        }
    }

    /**
     * Get statistics about recurring transactions
     */
    static async getStats(): Promise<{
        activeCount: number;
        inactiveCount: number;
        dueCount: number;
        totalMonthlyIncome: number;
        totalMonthlyExpense: number;
    }> {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                return {
                    activeCount: 0,
                    inactiveCount: 0,
                    dueCount: 0,
                    totalMonthlyIncome: 0,
                    totalMonthlyExpense: 0,
                };
            }

            const { data: recurring, error } = await supabase
                .from('recurring_transactions')
                .select('*')
                .eq('user_id', user.id);

            if (error || !recurring) {
                return {
                    activeCount: 0,
                    inactiveCount: 0,
                    dueCount: 0,
                    totalMonthlyIncome: 0,
                    totalMonthlyExpense: 0,
                };
            }

            const active = recurring.filter(r => r.is_active);
            const inactive = recurring.filter(r => !r.is_active);
            
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const due = active.filter(r => new Date(r.next_occurrence) <= today);

            // Calculate monthly totals
            const getMonthlyMultiplier = (frequency: string): number => {
                const map: Record<string, number> = {
                    'daily': 30,
                    'weekly': 4.33,
                    'bi-weekly': 2.17,
                    'monthly': 1,
                    'quarterly': 0.33,
                    'yearly': 0.08
                };
                return map[frequency] || 1;
            };

            const income = active.filter(r => r.type === 'income');
            const expense = active.filter(r => r.type === 'expense');

            const totalMonthlyIncome = income.reduce((sum, r) => 
                sum + (r.amount * getMonthlyMultiplier(r.frequency)), 0
            );

            const totalMonthlyExpense = expense.reduce((sum, r) => 
                sum + (r.amount * getMonthlyMultiplier(r.frequency)), 0
            );

            return {
                activeCount: active.length,
                inactiveCount: inactive.length,
                dueCount: due.length,
                totalMonthlyIncome,
                totalMonthlyExpense,
            };
        } catch (err) {
            console.error('Error in getStats:', err);
            return {
                activeCount: 0,
                inactiveCount: 0,
                dueCount: 0,
                totalMonthlyIncome: 0,
                totalMonthlyExpense: 0,
            };
        }
    }
}
