import type { SavingsGoal } from '@/lib/hooks/use-budget-queries';
import { differenceInDays, differenceInMonths, addMonths, addWeeks, format } from 'date-fns';

export type GoalType = 
    | 'general'
    | 'emergency_fund'
    | 'vacation'
    | 'house_down_payment'
    | 'retirement'
    | 'debt_free'
    | 'car_purchase'
    | 'education'
    | 'wedding'
    | 'investment';

export interface EnhancedGoal extends SavingsGoal {
    goal_type: GoalType;
    priority: number;
    auto_contribute: boolean;
    auto_contribute_amount: number;
    auto_contribute_frequency: 'weekly' | 'bi-weekly' | 'monthly' | 'quarterly';
    last_contribution_date: string | null;
    description: string | null;
    color: string;
    icon: string | null;
    is_completed: boolean;
    completed_at: string | null;
}

export interface GoalMilestone {
    id: string;
    goal_id: string;
    user_id: string;
    title: string;
    target_amount: number;
    is_completed: boolean;
    completed_at: string | null;
    order_index: number;
    created_at: string;
    updated_at: string;
}

export interface GoalContribution {
    id: string;
    goal_id: string;
    user_id: string;
    amount: number;
    contribution_date: string;
    is_auto: boolean;
    notes: string | null;
    created_at: string;
}

export interface GoalAnalytics {
    goal: EnhancedGoal;
    progressPercentage: number;
    remainingAmount: number;
    daysUntilDeadline: number | null;
    monthsUntilDeadline: number | null;
    requiredMonthlySavings: number;
    requiredWeeklySavings: number;
    requiredDailySavings: number;
    isOnTrack: boolean;
    projectedCompletionDate: Date | null;
    estimatedMonthsToComplete: number;
    averageMonthlyContribution: number;
    totalContributions: number;
    contributionCount: number;
    milestones: GoalMilestone[];
    nextMilestone: GoalMilestone | null;
    completedMilestones: number;
    health: 'excellent' | 'good' | 'behind' | 'critical';
    recommendation: string;
}

export interface GoalTypeInfo {
    type: GoalType;
    label: string;
    icon: string;
    color: string;
    description: string;
    recommendedAmount?: number;
    tips: string[];
}

/**
 * Financial Goals Service
 * Provides analytics, tracking, and recommendations for savings goals
 */
export class FinancialGoalsService {
    /**
     * Get goal types info as a record
     */
    private static get goalTypes(): Record<GoalType, GoalTypeInfo> {
        return {
            general: {
                type: 'general',
                label: 'General Savings',
                icon: 'PiggyBank',
                color: '#3b82f6',
                description: 'Flexible savings for any purpose',
                tips: ['Set specific targets', 'Review monthly', 'Stay consistent']
            },
            emergency_fund: {
                type: 'emergency_fund',
                label: 'Emergency Fund',
                icon: 'Shield',
                color: '#ef4444',
                description: 'Financial safety net for unexpected expenses',
                recommendedAmount: 10000,
                tips: [
                    'Aim for 3-6 months of expenses',
                    'Keep in easily accessible account',
                    'Highest priority goal',
                    'Replenish immediately after use'
                ]
            },
            vacation: {
                type: 'vacation',
                label: 'Vacation Fund',
                icon: 'Plane',
                color: '#06b6d4',
                description: 'Save for your dream vacation or travel plans',
                tips: ['Research trip costs', 'Include spending money', 'Book in advance for deals']
            },
            house_down_payment: {
                type: 'house_down_payment',
                label: 'House Down Payment',
                icon: 'Home',
                color: '#8b5cf6',
                description: 'Save for your first home or next property',
                tips: [
                    'Aim for 20% to avoid PMI',
                    'Consider closing costs',
                    'Factor in moving expenses',
                    'Research first-time buyer programs'
                ]
            },
            retirement: {
                type: 'retirement',
                label: 'Retirement Savings',
                icon: 'TrendingUp',
                color: '#10b981',
                description: 'Long-term savings for retirement security',
                tips: [
                    'Start early for compound growth',
                    'Maximize employer 401(k) match',
                    'Consider Roth IRA',
                    'Increase contributions with raises'
                ]
            },
            debt_free: {
                type: 'debt_free',
                label: 'Debt-Free Goal',
                icon: 'Target',
                color: '#f59e0b',
                description: 'Pay off debt and achieve financial freedom',
                tips: [
                    'Prioritize high-interest debt',
                    'Consider debt avalanche method',
                    'Negotiate lower interest rates',
                    'Avoid new debt'
                ]
            },
            car_purchase: {
                type: 'car_purchase',
                label: 'Car Purchase',
                icon: 'Car',
                color: '#6366f1',
                description: 'Save for your next vehicle',
                tips: [
                    'Aim for 20% down payment',
                    'Research insurance costs',
                    'Consider maintenance budget',
                    'Compare new vs. used options'
                ]
            },
            education: {
                type: 'education',
                label: 'Education Fund',
                icon: 'GraduationCap',
                color: '#ec4899',
                description: 'Save for education expenses or student loan payoff',
                tips: ['Research 529 plans', 'Apply for scholarships', 'Consider community college', 'Look into tax benefits']
            },
            wedding: {
                type: 'wedding',
                label: 'Wedding Fund',
                icon: 'Heart',
                color: '#f43f5e',
                description: 'Save for your special day',
                tips: ['Set realistic budget', 'Prioritize must-haves', 'DIY where possible', 'Consider off-season dates']
            },
            investment: {
                type: 'investment',
                label: 'Investment Fund',
                icon: 'LineChart',
                color: '#14b8a6',
                description: 'Build wealth through investments',
                tips: ['Diversify portfolio', 'Dollar-cost averaging', 'Long-term perspective', 'Rebalance regularly']
            }
        };
    }

    /**
     * Get information about a specific goal type
     */
    static getGoalTypeInfo(type: GoalType): GoalTypeInfo {
        return this.goalTypes[type];
    }

    /**
     * Get all available goal types as an array
     */
    static getAllGoalTypes(): GoalTypeInfo[] {
        return Object.values(this.goalTypes);
    }

    /**
     * Calculate comprehensive goal analytics
     */
    static calculateGoalAnalytics(
        goal: EnhancedGoal,
        milestones: GoalMilestone[] = [],
        contributions: GoalContribution[] = []
    ): GoalAnalytics {
        const now = new Date();
        const deadline = goal.deadline ? new Date(goal.deadline) : null;
        
        // Basic progress
        const progressPercentage = goal.target_amount > 0 
            ? (goal.current_amount / goal.target_amount) * 100 
            : 0;
        const remainingAmount = Math.max(0, goal.target_amount - goal.current_amount);

        // Time calculations
        const daysUntilDeadline = deadline ? differenceInDays(deadline, now) : null;
        const monthsUntilDeadline = deadline ? differenceInMonths(deadline, now) : null;

        // Required savings calculations
        let requiredMonthlySavings = 0;
        let requiredWeeklySavings = 0;
        let requiredDailySavings = 0;

        if (deadline && monthsUntilDeadline && monthsUntilDeadline > 0 && daysUntilDeadline && daysUntilDeadline > 0) {
            requiredMonthlySavings = remainingAmount / monthsUntilDeadline;
            requiredWeeklySavings = remainingAmount / (monthsUntilDeadline * 4.33);
            requiredDailySavings = remainingAmount / daysUntilDeadline;
        }

        // Contribution analysis
        const totalContributions = goal.current_amount;
        const contributionCount = contributions.length;
        
        // Calculate average monthly contribution
        let averageMonthlyContribution = 0;
        if (contributions.length > 0) {
            const firstContribution = new Date(contributions[contributions.length - 1].contribution_date);
            const monthsSinceStart = Math.max(1, differenceInMonths(now, firstContribution));
            averageMonthlyContribution = totalContributions / monthsSinceStart;
        }

        // Projected completion
        let projectedCompletionDate: Date | null = null;
        let estimatedMonthsToComplete = 0;
        
        if (averageMonthlyContribution > 0) {
            estimatedMonthsToComplete = Math.ceil(remainingAmount / averageMonthlyContribution);
            projectedCompletionDate = addMonths(now, estimatedMonthsToComplete);
        } else if (goal.auto_contribute && goal.auto_contribute_amount > 0) {
            const monthlyEquivalent = this.getMonthlyEquivalent(
                goal.auto_contribute_amount,
                goal.auto_contribute_frequency
            );
            estimatedMonthsToComplete = Math.ceil(remainingAmount / monthlyEquivalent);
            projectedCompletionDate = addMonths(now, estimatedMonthsToComplete);
        }

        // Track progress status
        let isOnTrack = true;
        if (deadline && monthsUntilDeadline && averageMonthlyContribution > 0) {
            isOnTrack = averageMonthlyContribution >= requiredMonthlySavings;
        }

        // Milestone analysis
        const sortedMilestones = [...milestones].sort((a, b) => a.order_index - b.order_index);
        const completedMilestones = sortedMilestones.filter(m => m.is_completed).length;
        const nextMilestone = sortedMilestones.find(m => !m.is_completed) || null;

        // Health assessment
        let health: GoalAnalytics['health'] = 'good';
        if (progressPercentage >= 90) {
            health = 'excellent';
        } else if (deadline && daysUntilDeadline !== null) {
            if (daysUntilDeadline < 30 && progressPercentage < 50) {
                health = 'critical';
            } else if (!isOnTrack) {
                health = 'behind';
            }
        }

        // Generate recommendation
        const recommendation = this.generateRecommendation(
            goal,
            progressPercentage,
            isOnTrack,
            requiredMonthlySavings,
            averageMonthlyContribution,
            health
        );

        return {
            goal,
            progressPercentage,
            remainingAmount,
            daysUntilDeadline,
            monthsUntilDeadline,
            requiredMonthlySavings,
            requiredWeeklySavings,
            requiredDailySavings,
            isOnTrack,
            projectedCompletionDate,
            estimatedMonthsToComplete,
            averageMonthlyContribution,
            totalContributions,
            contributionCount,
            milestones: sortedMilestones,
            nextMilestone,
            completedMilestones,
            health,
            recommendation
        };
    }

    /**
     * Convert contribution frequency to monthly equivalent
     */
    private static getMonthlyEquivalent(
        amount: number,
        frequency: 'weekly' | 'bi-weekly' | 'monthly' | 'quarterly'
    ): number {
        switch (frequency) {
            case 'weekly':
                return amount * 4.33;
            case 'bi-weekly':
                return amount * 2.17;
            case 'monthly':
                return amount;
            case 'quarterly':
                return amount / 3;
        }
    }

    /**
     * Generate personalized recommendation
     */
    private static generateRecommendation(
        goal: EnhancedGoal,
        progressPercentage: number,
        isOnTrack: boolean,
        requiredMonthlySavings: number,
        averageMonthlyContribution: number,
        health: GoalAnalytics['health']
    ): string {
        // Completed goal
        if (progressPercentage >= 100) {
            return `🎉 Congratulations! You've reached your ${goal.name} goal! Consider setting a new goal or increasing this target.`;
        }

        // Critical health
        if (health === 'critical') {
            return `🚨 Critical: You need to save $${requiredMonthlySavings.toFixed(2)}/month to meet your deadline. Consider extending the deadline or increasing contributions.`;
        }

        // Behind schedule
        if (health === 'behind') {
            const shortfall = requiredMonthlySavings - averageMonthlyContribution;
            return `⚠️ Behind Schedule: Increase monthly savings by $${shortfall.toFixed(2)} to stay on track, or adjust your deadline.`;
        }

        // On track
        if (isOnTrack && progressPercentage > 25) {
            return `✅ Great progress! Keep contributing $${averageMonthlyContribution.toFixed(2)}/month and you'll reach your goal on time.`;
        }

        // Just started
        if (progressPercentage < 10) {
            return `🎯 Just getting started! Set up auto-contributions of $${requiredMonthlySavings.toFixed(2)}/month to reach your goal.`;
        }

        // Default encouragement
        return `💪 Keep going! You're ${progressPercentage.toFixed(0)}% of the way there. Stay consistent with your contributions.`;
    }

    /**
     * Calculate next auto-contribution date
     */
    static calculateNextContributionDate(
        lastContributionDate: string | null,
        frequency: 'weekly' | 'bi-weekly' | 'monthly' | 'quarterly'
    ): Date {
        const lastDate = lastContributionDate ? new Date(lastContributionDate) : new Date();
        
        switch (frequency) {
            case 'weekly':
                return addWeeks(lastDate, 1);
            case 'bi-weekly':
                return addWeeks(lastDate, 2);
            case 'monthly':
                return addMonths(lastDate, 1);
            case 'quarterly':
                return addMonths(lastDate, 3);
        }
    }

    /**
     * Check if auto-contribution is due
     */
    static isAutoContributionDue(
        lastContributionDate: string | null,
        frequency: 'weekly' | 'bi-weekly' | 'monthly' | 'quarterly'
    ): boolean {
        const nextDate = this.calculateNextContributionDate(lastContributionDate, frequency);
        return new Date() >= nextDate;
    }

    /**
     * Sort goals by priority
     */
    static sortByPriority(goals: EnhancedGoal[]): EnhancedGoal[] {
        return [...goals].sort((a, b) => a.priority - b.priority);
    }

    /**
     * Get goals by type
     */
    static getGoalsByType(goals: EnhancedGoal[], type: GoalType): EnhancedGoal[] {
        return goals.filter(g => g.goal_type === type);
    }

    /**
     * Get active (incomplete) goals
     */
    static getActiveGoals(goals: EnhancedGoal[]): EnhancedGoal[] {
        return goals.filter(g => !g.is_completed);
    }

    /**
     * Get completed goals
     */
    static getCompletedGoals(goals: EnhancedGoal[]): EnhancedGoal[] {
        return goals.filter(g => g.is_completed);
    }

    /**
     * Calculate total savings across all goals
     */
    static calculateTotalSavings(goals: EnhancedGoal[]): {
        currentAmount: number;
        targetAmount: number;
        progressPercentage: number;
    } {
        const currentAmount = goals.reduce((sum, g) => sum + g.current_amount, 0);
        const targetAmount = goals.reduce((sum, g) => sum + g.target_amount, 0);
        const progressPercentage = targetAmount > 0 ? (currentAmount / targetAmount) * 100 : 0;

        return { currentAmount, targetAmount, progressPercentage };
    }
}
