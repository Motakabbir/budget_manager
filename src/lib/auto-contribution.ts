import { supabase } from '@/lib/supabase/client';
import { Database } from '@/lib/supabase/database.types';

type SavingsGoal = Database['public']['Tables']['savings_goals']['Row'];

export interface AutoContributionResult {
    success: boolean;
    goalId: string;
    amount: number;
    contributionId?: string;
    error?: string;
}

export interface ProcessAutoContributionsResult {
    processed: number;
    successful: number;
    failed: number;
    totalAmount: number;
    results: AutoContributionResult[];
}

/**
 * Process auto-contributions for all goals that have auto-contribution enabled
 * This should be called periodically (e.g., daily, weekly) or when income is received
 */
export async function processAutoContributions(userId: string): Promise<ProcessAutoContributionsResult> {
    const results: AutoContributionResult[] = [];
    let totalAmount = 0;

    try {
        // Get all goals with auto-contribution enabled
        const { data: goals, error: goalsError } = await supabase
            .from('savings_goals')
            .select('*')
            .eq('user_id', userId)
            .eq('auto_contribution_enabled', true)
            .gt('auto_contribution_amount', 0);

        if (goalsError) {
            throw new Error(`Failed to fetch goals: ${goalsError.message}`);
        }

        if (!goals || goals.length === 0) {
            return {
                processed: 0,
                successful: 0,
                failed: 0,
                totalAmount: 0,
                results: []
            };
        }

        // Process each goal
        for (const goal of goals) {
            try {
                const result = await processSingleAutoContribution(goal);
                results.push(result);

                if (result.success) {
                    totalAmount += result.amount;
                }
            } catch (error) {
                results.push({
                    success: false,
                    goalId: goal.id,
                    amount: goal.auto_contribution_amount,
                    error: error instanceof Error ? error.message : 'Unknown error'
                });
            }
        }

        const successful = results.filter(r => r.success).length;
        const failed = results.filter(r => !r.success).length;

        return {
            processed: results.length,
            successful,
            failed,
            totalAmount,
            results
        };

    } catch (error) {
        throw new Error(`Auto-contribution processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

/**
 * Process auto-contribution for a single goal
 */
export async function processSingleAutoContribution(goal: SavingsGoal): Promise<AutoContributionResult> {
    try {
        // Check if contribution should be made based on frequency
        const shouldContribute = await shouldMakeContribution(goal);
        if (!shouldContribute) {
            return {
                success: false,
                goalId: goal.id,
                amount: goal.auto_contribution_amount,
                error: 'Not time for contribution yet'
            };
        }

        // Check if goal is already completed
        if (goal.current_amount >= goal.target_amount) {
            return {
                success: false,
                goalId: goal.id,
                amount: goal.auto_contribution_amount,
                error: 'Goal already completed'
            };
        }

        // Calculate contribution amount (don't exceed target)
        const remainingAmount = goal.target_amount - goal.current_amount;
        const contributionAmount = Math.min(goal.auto_contribution_amount, remainingAmount);

        // Create contribution record
        const { data: contribution, error: contributionError } = await supabase
            .from('goal_contributions')
            .insert({
                goal_id: goal.id,
                amount: contributionAmount,
                contribution_date: new Date().toISOString().split('T')[0],
                source: 'auto',
                notes: `Auto-contribution (${goal.auto_contribution_frequency})`
            })
            .select()
            .single();

        if (contributionError) {
            throw new Error(`Failed to create contribution: ${contributionError.message}`);
        }

        // Update goal current amount
        const { error: updateError } = await supabase
            .from('savings_goals')
            .update({
                current_amount: goal.current_amount + contributionAmount,
                updated_at: new Date().toISOString()
            })
            .eq('id', goal.id);

        if (updateError) {
            // Rollback contribution if goal update fails
            await supabase
                .from('goal_contributions')
                .delete()
                .eq('id', contribution.id);

            throw new Error(`Failed to update goal amount: ${updateError.message}`);
        }

        return {
            success: true,
            goalId: goal.id,
            amount: contributionAmount,
            contributionId: contribution.id
        };

    } catch (error) {
        return {
            success: false,
            goalId: goal.id,
            amount: goal.auto_contribution_amount,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}

/**
 * Check if a contribution should be made based on the goal's frequency and last contribution
 */
async function shouldMakeContribution(goal: SavingsGoal): Promise<boolean> {
    try {
        // Get the most recent auto-contribution for this goal
        const { data: lastContribution, error } = await supabase
            .from('goal_contributions')
            .select('contribution_date')
            .eq('goal_id', goal.id)
            .eq('source', 'auto')
            .order('contribution_date', { ascending: false })
            .limit(1)
            .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
            throw error;
        }

        const now = new Date();
        const lastContributionDate = lastContribution ? new Date(lastContribution.contribution_date) : null;

        // If no previous contribution, make one
        if (!lastContributionDate) {
            return true;
        }

        // Check based on frequency
        const daysSinceLastContribution = Math.floor((now.getTime() - lastContributionDate.getTime()) / (1000 * 60 * 60 * 24));

        switch (goal.auto_contribution_frequency) {
            case 'weekly':
                return daysSinceLastContribution >= 7;
            case 'bi-weekly':
                return daysSinceLastContribution >= 14;
            case 'monthly':
                return daysSinceLastContribution >= 30;
            case 'quarterly':
                return daysSinceLastContribution >= 90;
            default:
                return false;
        }

    } catch {
        return false;
    }
}

/**
 * Process auto-contributions triggered by income
 * This can be called when income is recorded to immediately contribute to goals
 */
export async function processAutoContributionsOnIncome(userId: string, _incomeAmount: number): Promise<ProcessAutoContributionsResult> {
    // For now, just process all due auto-contributions
    // In the future, this could be enhanced to allocate a percentage of income to goals
    return processAutoContributions(userId);
}

/**
 * Get auto-contribution schedule for a user
 */
export async function getAutoContributionSchedule(userId: string) {
    try {
        const { data: goals, error } = await supabase
            .from('savings_goals')
            .select(`
                id,
                name,
                auto_contribution_enabled,
                auto_contribution_amount,
                auto_contribution_frequency,
                current_amount,
                target_amount,
                goal_contributions!inner(contribution_date, source)
            `)
            .eq('user_id', userId)
            .eq('auto_contribution_enabled', true)
            .eq('goal_contributions.source', 'auto')
            .order('goal_contributions.contribution_date', { ascending: false });

        if (error) throw error;

        return goals.map(goal => ({
            goalId: goal.id,
            goalName: goal.name,
            amount: goal.auto_contribution_amount,
            frequency: goal.auto_contribution_frequency,
            progress: (goal.current_amount / goal.target_amount) * 100,
            lastContribution: goal.goal_contributions?.[0]?.contribution_date || null,
            nextContribution: calculateNextContributionDate(
                goal.goal_contributions?.[0]?.contribution_date,
                goal.auto_contribution_frequency
            )
        }));

    } catch (error) {
        throw new Error(`Failed to get auto-contribution schedule: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

/**
 * Calculate the next contribution date based on frequency and last contribution
 */
function calculateNextContributionDate(lastContributionDate: string | null, frequency: string): string {
    const baseDate = lastContributionDate ? new Date(lastContributionDate) : new Date();

    switch (frequency) {
        case 'weekly':
            baseDate.setDate(baseDate.getDate() + 7);
            break;
        case 'bi-weekly':
            baseDate.setDate(baseDate.getDate() + 14);
            break;
        case 'monthly':
            baseDate.setMonth(baseDate.getMonth() + 1);
            break;
        case 'quarterly':
            baseDate.setMonth(baseDate.getMonth() + 3);
            break;
        default:
            baseDate.setDate(baseDate.getDate() + 30); // Default to monthly
    }

    return baseDate.toISOString().split('T')[0];
}

// Export internal functions for testing
export { shouldMakeContribution };