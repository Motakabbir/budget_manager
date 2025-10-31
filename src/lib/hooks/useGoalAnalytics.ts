import { useMemo } from 'react';
import { EnhancedSavingsGoal, GoalAnalytics, GoalTypeConfig } from '@/lib/supabase/database.types';
import { differenceInDays, differenceInMonths, addMonths } from 'date-fns';

// Goal type configurations with recommended settings
export const GOAL_TYPE_CONFIGS: Record<string, GoalTypeConfig> = {
    emergency_fund: {
        type: 'emergency_fund',
        label: 'Emergency Fund',
        description: '3-6 months of living expenses for unexpected emergencies',
        icon: 'Shield',
        default_target_amount: 10000,
        recommended_timeframe_months: 12,
        priority: 10
    },
    vacation_fund: {
        type: 'vacation_fund',
        label: 'Vacation Fund',
        description: 'Save for your dream vacation or holiday',
        icon: 'Plane',
        default_target_amount: 3000,
        recommended_timeframe_months: 6,
        priority: 7
    },
    house_down_payment: {
        type: 'house_down_payment',
        label: 'House Down Payment',
        description: 'Save for your future home purchase',
        icon: 'Home',
        default_target_amount: 50000,
        recommended_timeframe_months: 60,
        priority: 9
    },
    retirement_planning: {
        type: 'retirement_planning',
        label: 'Retirement Planning',
        description: 'Build your retirement savings',
        icon: 'PiggyBank',
        default_target_amount: 500000,
        recommended_timeframe_months: 360,
        priority: 8
    },
    debt_free_goal: {
        type: 'debt_free_goal',
        label: 'Debt-Free Goal',
        description: 'Eliminate all consumer debt',
        icon: 'CreditCard',
        default_target_amount: 25000,
        recommended_timeframe_months: 24,
        priority: 9
    },
    car_purchase: {
        type: 'car_purchase',
        label: 'Car Purchase',
        description: 'Save for your next vehicle',
        icon: 'Car',
        default_target_amount: 20000,
        recommended_timeframe_months: 18,
        priority: 6
    },
    custom: {
        type: 'custom',
        label: 'Custom Goal',
        description: 'Create your own savings goal',
        icon: 'Target',
        default_target_amount: 5000,
        recommended_timeframe_months: 12,
        priority: 5
    }
};

/**
 * Hook to calculate comprehensive analytics for a savings goal
 */
export function useGoalAnalytics(goal: EnhancedSavingsGoal): GoalAnalytics {
    return useMemo(() => {
        const remainingAmount = goal.target_amount - goal.current_amount;
        const progressPercentage = goal.target_amount > 0
            ? (goal.current_amount / goal.target_amount) * 100
            : 0;

        // Calculate time-based metrics
        let monthsToGoal: number | null = null;
        let monthlySavingsNeeded: number | null = null;
        let daysRemaining: number | null = null;

        const targetDate = goal.target_date || goal.deadline;
        if (targetDate) {
            const targetDateObj = new Date(targetDate);
            const today = new Date();

            daysRemaining = Math.max(0, differenceInDays(targetDateObj, today));
            monthsToGoal = Math.max(0, differenceInMonths(targetDateObj, today));

            if (monthsToGoal > 0 && remainingAmount > 0) {
                monthlySavingsNeeded = remainingAmount / monthsToGoal;
            }
        }

        // Determine if goal is on track
        const isOnTrack = (() => {
            if (!targetDate || !monthlySavingsNeeded) return true;

            // Calculate required monthly savings based on remaining time
            const requiredMonthly = monthlySavingsNeeded;

            // For now, assume goals with auto-contribution are on track
            // In future, could analyze contribution history
            if (goal.auto_contribution_enabled && goal.auto_contribution_amount >= requiredMonthly) {
                return true;
            }

            // If no auto-contribution, check if progress is reasonable
            const elapsedMonths = goal.target_date
                ? differenceInMonths(new Date(), new Date(goal.created_at))
                : 0;

            if (elapsedMonths > 0) {
                const expectedProgress = (elapsedMonths / (monthsToGoal || 1)) * 100;
                return progressPercentage >= (expectedProgress * 0.8); // 80% of expected progress
            }

            return true;
        })();

        // Generate suggestions for improvement
        const suggestedAdjustments: string[] = [];
        if (!isOnTrack) {
            if (!goal.auto_contribution_enabled) {
                suggestedAdjustments.push('Enable auto-contribution to stay on track');
            }
            if (monthlySavingsNeeded && goal.auto_contribution_amount < monthlySavingsNeeded) {
                suggestedAdjustments.push(`Increase auto-contribution to at least $${monthlySavingsNeeded.toFixed(2)}/month`);
            }
            if (!targetDate) {
                suggestedAdjustments.push('Set a target completion date to create a savings plan');
            }
        }

        return {
            remaining_amount: remainingAmount,
            months_to_goal: monthsToGoal,
            monthly_savings_needed: monthlySavingsNeeded,
            progress_percentage: progressPercentage,
            days_remaining: daysRemaining,
            is_on_track: isOnTrack,
            suggested_adjustments: suggestedAdjustments
        };
    }, [goal]);
}

/**
 * Hook to calculate analytics for multiple goals
 */
export function useGoalsSummary(goals: EnhancedSavingsGoal[]) {
    return useMemo(() => {
        const totalGoals = goals.length;
        const activeGoals = goals.filter(g => g.current_amount < g.target_amount).length;
        const completedGoals = goals.filter(g => g.current_amount >= g.target_amount).length;
        const totalTargetAmount = goals.reduce((sum, g) => sum + g.target_amount, 0);
        const totalCurrentAmount = goals.reduce((sum, g) => sum + g.current_amount, 0);
        const overallProgressPercentage = totalTargetAmount > 0
            ? (totalCurrentAmount / totalTargetAmount) * 100
            : 0;

        // Count goals that are on track vs behind
        let goalsOnTrack = 0;
        let goalsBehindSchedule = 0;

        goals.forEach(goal => {
            const analytics = useGoalAnalytics(goal);
            if (analytics.is_on_track) {
                goalsOnTrack++;
            } else {
                goalsBehindSchedule++;
            }
        });

        return {
            total_goals: totalGoals,
            active_goals: activeGoals,
            completed_goals: completedGoals,
            total_target_amount: totalTargetAmount,
            total_current_amount: totalCurrentAmount,
            overall_progress_percentage: overallProgressPercentage,
            goals_on_track: goalsOnTrack,
            goals_behind_schedule: goalsBehindSchedule
        };
    }, [goals]);
}

/**
 * Hook to get goal type configuration
 */
export function useGoalTypeConfig(goalType: string): GoalTypeConfig {
    return GOAL_TYPE_CONFIGS[goalType] || GOAL_TYPE_CONFIGS.custom;
}

/**
 * Hook to calculate recommended savings amount based on goal type and timeframe
 */
export function useRecommendedSavings(
    goalType: string,
    targetAmount: number,
    timeframeMonths: number
): number {
    const monthlySavings = timeframeMonths > 0 ? targetAmount / timeframeMonths : 0;

    // Adjust based on goal type priority and typical constraints
    const config = useGoalTypeConfig(goalType);
    const priorityMultiplier = config.priority / 10; // 0.5 to 1.0

    return Math.round(monthlySavings * priorityMultiplier * 100) / 100;
}

/**
 * Hook to suggest optimal goal settings based on user profile
 */
export function useGoalSuggestions(userIncome?: number, existingGoals?: EnhancedSavingsGoal[]) {
    return useMemo(() => {
        const suggestions: Array<{
            type: string;
            reason: string;
            recommended_amount: number;
            timeframe_months: number;
        }> = [];

        // Emergency fund suggestion (if not already exists)
        const hasEmergencyFund = existingGoals?.some(g => g.goal_type === 'emergency_fund');
        if (!hasEmergencyFund) {
            const emergencyAmount = userIncome ? userIncome * 6 : 10000; // 6 months of income
            suggestions.push({
                type: 'emergency_fund',
                reason: 'Essential safety net for unexpected expenses',
                recommended_amount: emergencyAmount,
                timeframe_months: 12
            });
        }

        // Debt-free goal suggestion
        const hasDebtFreeGoal = existingGoals?.some(g => g.goal_type === 'debt_free_goal');
        if (!hasDebtFreeGoal) {
            suggestions.push({
                type: 'debt_free_goal',
                reason: 'Eliminate high-interest consumer debt',
                recommended_amount: 15000,
                timeframe_months: 18
            });
        }

        // Retirement planning suggestion
        const hasRetirementGoal = existingGoals?.some(g => g.goal_type === 'retirement_planning');
        if (!hasRetirementGoal && userIncome) {
            const retirementAmount = userIncome * 500; // Rough retirement multiple
            suggestions.push({
                type: 'retirement_planning',
                reason: 'Start building long-term retirement savings',
                recommended_amount: retirementAmount,
                timeframe_months: 360 // 30 years
            });
        }

        return suggestions;
    }, [userIncome, existingGoals]);
}