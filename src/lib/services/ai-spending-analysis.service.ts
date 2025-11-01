/**
 * AI-Powered Spending Analysis Service
 * 
 * Uses statistical methods and machine learning algorithms to detect
 * unusual spending patterns, predict budget overruns, and provide
 * intelligent financial insights.
 */

import type { Transaction, Category } from '@/lib/hooks/use-budget-queries';
import { 
    startOfMonth, 
    endOfMonth, 
    subMonths, 
    differenceInDays,
    eachDayOfInterval,
    format,
    isWithinInterval
} from 'date-fns';

// ==================== TYPES ====================

export interface SpendingAnomaly {
    transaction: Transaction;
    anomalyScore: number; // 0-100, higher = more unusual
    anomalyType: 'amount' | 'frequency' | 'category' | 'timing';
    confidence: number; // 0-1
    reason: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    recommendation: string;
}

export interface SpendingPattern {
    category: string;
    avgAmount: number;
    stdDeviation: number;
    minAmount: number;
    maxAmount: number;
    frequency: number;
    typicalDays: number[]; // 0-6 (Sunday-Saturday)
    typicalTimes: number[]; // 0-23 hours
}

export interface BudgetPrediction {
    category: string;
    currentSpending: number;
    budgetLimit: number;
    projectedSpending: number;
    daysRemaining: number;
    probability: number; // 0-1 probability of exceeding
    recommendedDailyLimit: number;
    alert: boolean;
    severity: 'safe' | 'warning' | 'danger' | 'critical';
}

export interface SpendingInsight {
    type: 'unusual_category' | 'unusual_amount' | 'unusual_frequency' | 'trend_change' | 'budget_risk';
    title: string;
    description: string;
    impact: 'positive' | 'negative' | 'neutral';
    confidence: number;
    actionable: boolean;
    recommendation?: string;
    data: Record<string, any>;
}

// ==================== SERVICE ====================

export class AISpendingAnalysisService {
    /**
     * Detect unusual spending patterns using statistical analysis
     */
    static detectAnomalies(
        recentTransactions: Transaction[],
        historicalTransactions: Transaction[],
        sensitivity: 'low' | 'medium' | 'high' = 'medium'
    ): SpendingAnomaly[] {
        const anomalies: SpendingAnomaly[] = [];

        // Calculate historical patterns for each category
        const patterns = this.calculateSpendingPatterns(historicalTransactions);

        // Z-score threshold based on sensitivity
        const zThreshold = sensitivity === 'low' ? 3 : sensitivity === 'medium' ? 2.5 : 2;

        // Analyze each recent transaction
        for (const transaction of recentTransactions.filter(t => t.type === 'expense')) {
            const categoryPattern = patterns.get(transaction.category?.name || 'Uncategorized');

            if (!categoryPattern) {
                // New category spending
                if (transaction.amount > 100) { // Threshold for new category alert
                    anomalies.push({
                        transaction,
                        anomalyScore: 70,
                        anomalyType: 'category',
                        confidence: 0.8,
                        reason: `First time spending in ${transaction.category?.name || 'this category'}`,
                        severity: transaction.amount > 500 ? 'high' : 'medium',
                        recommendation: `Review this new expense category and set a budget if recurring.`,
                    });
                }
                continue;
            }

            // Amount-based anomaly detection (Z-score)
            const zScore = (transaction.amount - categoryPattern.avgAmount) / categoryPattern.stdDeviation;
            const anomalyScore = Math.min(100, Math.abs(zScore) * 33.33); // Scale to 0-100

            if (Math.abs(zScore) > zThreshold) {
                const severity: 'low' | 'medium' | 'high' | 'critical' =
                    Math.abs(zScore) > 4 ? 'critical' :
                    Math.abs(zScore) > 3 ? 'high' :
                    Math.abs(zScore) > 2.5 ? 'medium' : 'low';

                anomalies.push({
                    transaction,
                    anomalyScore,
                    anomalyType: 'amount',
                    confidence: Math.min(0.95, Math.abs(zScore) / 5),
                    reason: `${transaction.amount > categoryPattern.avgAmount ? 'Much higher' : 'Much lower'} than usual ${transaction.category?.name} spending (avg: $${categoryPattern.avgAmount.toFixed(2)}, σ: ${Math.abs(zScore).toFixed(1)})`,
                    severity,
                    recommendation: transaction.amount > categoryPattern.avgAmount
                        ? `This ${transaction.category?.name} expense is ${Math.abs(zScore).toFixed(1)}x higher than your average. Verify it's legitimate.`
                        : `Unusually low spending in ${transaction.category?.name}. This could be a data entry error.`,
                });
            }

            // Frequency-based anomaly detection
            const transactionDate = new Date(transaction.date);
            const dayOfWeek = transactionDate.getDay();
            const hour = transactionDate.getHours();

            if (!categoryPattern.typicalDays.includes(dayOfWeek)) {
                anomalies.push({
                    transaction,
                    anomalyScore: 50,
                    anomalyType: 'timing',
                    confidence: 0.6,
                    reason: `Unusual day for ${transaction.category?.name} spending`,
                    severity: 'low',
                    recommendation: `You typically don't spend on ${transaction.category?.name} on ${format(transactionDate, 'EEEE')}s.`,
                });
            }
        }

        // Sort by anomaly score (highest first)
        return anomalies.sort((a, b) => b.anomalyScore - a.anomalyScore);
    }

    /**
     * Calculate spending patterns from historical data
     */
    static calculateSpendingPatterns(
        transactions: Transaction[]
    ): Map<string, SpendingPattern> {
        const patterns = new Map<string, SpendingPattern>();
        const expenseTransactions = transactions.filter(t => t.type === 'expense');

        // Group by category
        const byCategory = expenseTransactions.reduce((acc, t) => {
            const category = t.category?.name || 'Uncategorized';
            if (!acc[category]) acc[category] = [];
            acc[category].push(t);
            return acc;
        }, {} as Record<string, Transaction[]>);

        // Calculate patterns for each category
        for (const [category, txns] of Object.entries(byCategory)) {
            if (txns.length < 2) continue; // Need at least 2 transactions for pattern

            const amounts = txns.map(t => t.amount);
            const avgAmount = amounts.reduce((sum, a) => sum + a, 0) / amounts.length;
            
            // Calculate standard deviation
            const variance = amounts.reduce((sum, a) => sum + Math.pow(a - avgAmount, 2), 0) / amounts.length;
            const stdDeviation = Math.sqrt(variance);

            // Typical days of week
            const dayCount = new Array(7).fill(0);
            txns.forEach(t => {
                const day = new Date(t.date).getDay();
                dayCount[day]++;
            });
            const avgDayCount = dayCount.reduce((sum, c) => sum + c, 0) / 7;
            const typicalDays = dayCount
                .map((count, day) => count > avgDayCount ? day : -1)
                .filter(day => day !== -1);

            // Typical hours (if timestamp available)
            const hourCount = new Array(24).fill(0);
            txns.forEach(t => {
                const hour = new Date(t.date).getHours();
                hourCount[hour]++;
            });
            const avgHourCount = hourCount.reduce((sum, c) => sum + c, 0) / 24;
            const typicalTimes = hourCount
                .map((count, hour) => count > avgHourCount ? hour : -1)
                .filter(hour => hour !== -1);

            patterns.set(category, {
                category,
                avgAmount,
                stdDeviation,
                minAmount: Math.min(...amounts),
                maxAmount: Math.max(...amounts),
                frequency: txns.length,
                typicalDays: typicalDays.length > 0 ? typicalDays : [0, 1, 2, 3, 4, 5, 6],
                typicalTimes: typicalTimes.length > 0 ? typicalTimes : Array.from({ length: 24 }, (_, i) => i),
            });
        }

        return patterns;
    }

    /**
     * Predict budget overruns using linear regression
     */
    static predictBudgetStatus(
        currentMonthTransactions: Transaction[],
        budgets: { category_id: string; amount: number; category?: Category }[]
    ): BudgetPrediction[] {
        const predictions: BudgetPrediction[] = [];
        const now = new Date();
        const monthStart = startOfMonth(now);
        const monthEnd = endOfMonth(now);
        const daysPassed = differenceInDays(now, monthStart) + 1;
        const totalDays = differenceInDays(monthEnd, monthStart) + 1;
        const daysRemaining = totalDays - daysPassed;

        for (const budget of budgets) {
            const categoryTransactions = currentMonthTransactions.filter(
                t => t.category_id === budget.category_id && t.type === 'expense'
            );

            const currentSpending = categoryTransactions.reduce((sum, t) => sum + t.amount, 0);
            
            // Linear projection based on current rate
            const dailyRate = currentSpending / daysPassed;
            const projectedSpending = dailyRate * totalDays;

            // Calculate probability of exceeding budget (using sigmoid function)
            const excessRatio = (projectedSpending - budget.amount) / budget.amount;
            const probability = 1 / (1 + Math.exp(-5 * excessRatio)); // Sigmoid with k=5

            // Recommended daily limit to stay within budget
            const remainingBudget = Math.max(0, budget.amount - currentSpending);
            const recommendedDailyLimit = daysRemaining > 0 ? remainingBudget / daysRemaining : 0;

            // Determine severity
            const utilizationPercent = (currentSpending / budget.amount) * 100;
            const severity: 'safe' | 'warning' | 'danger' | 'critical' =
                utilizationPercent > 100 ? 'critical' :
                probability > 0.8 ? 'danger' :
                probability > 0.5 ? 'warning' : 'safe';

            predictions.push({
                category: budget.category?.name || 'Unknown',
                currentSpending,
                budgetLimit: budget.amount,
                projectedSpending,
                daysRemaining,
                probability,
                recommendedDailyLimit,
                alert: probability > 0.5,
                severity,
            });
        }

        // Sort by probability (highest risk first)
        return predictions.sort((a, b) => b.probability - a.probability);
    }

    /**
     * Generate actionable spending insights
     */
    static generateInsights(
        currentTransactions: Transaction[],
        previousTransactions: Transaction[],
        budgetPredictions: BudgetPrediction[]
    ): SpendingInsight[] {
        const insights: SpendingInsight[] = [];

        // Insight 1: Budget Risk Alerts
        const atRiskBudgets = budgetPredictions.filter(p => p.alert);
        for (const pred of atRiskBudgets) {
            insights.push({
                type: 'budget_risk',
                title: `${pred.category} Budget at Risk`,
                description: `You're projected to spend $${pred.projectedSpending.toFixed(0)} this month, exceeding your $${pred.budgetLimit} budget by ${((pred.probability * 100).toFixed(0))}%.`,
                impact: 'negative',
                confidence: pred.probability,
                actionable: true,
                recommendation: `Limit daily spending to $${pred.recommendedDailyLimit.toFixed(2)} for the remaining ${pred.daysRemaining} days.`,
                data: pred,
            });
        }

        // Insight 2: Spending Trend Changes
        const currentByCategory = this.groupByCategory(currentTransactions);
        const previousByCategory = this.groupByCategory(previousTransactions);

        for (const [category, currentAmount] of currentByCategory.entries()) {
            const previousAmount = previousByCategory.get(category) || 0;
            const change = currentAmount - previousAmount;
            const changePercent = previousAmount > 0 ? (change / previousAmount) * 100 : 0;

            if (Math.abs(changePercent) > 30) { // Significant change threshold
                insights.push({
                    type: 'trend_change',
                    title: `${changePercent > 0 ? 'Increased' : 'Decreased'} ${category} Spending`,
                    description: `Your ${category} spending is ${Math.abs(changePercent).toFixed(0)}% ${changePercent > 0 ? 'higher' : 'lower'} than last month ($${currentAmount.toFixed(0)} vs $${previousAmount.toFixed(0)}).`,
                    impact: changePercent > 0 ? 'negative' : 'positive',
                    confidence: Math.min(0.9, Math.abs(changePercent) / 100),
                    actionable: changePercent > 0,
                    recommendation: changePercent > 0 
                        ? `Review recent ${category} expenses to identify the cause of increase.`
                        : undefined,
                    data: { category, currentAmount, previousAmount, change, changePercent },
                });
            }
        }

        // Insight 3: Unusual Category Usage
        for (const [category, amount] of currentByCategory.entries()) {
            if (!previousByCategory.has(category) && amount > 100) {
                insights.push({
                    type: 'unusual_category',
                    title: `New Spending Category: ${category}`,
                    description: `You've spent $${amount.toFixed(0)} in ${category}, which is a new category for you.`,
                    impact: 'neutral',
                    confidence: 0.7,
                    actionable: true,
                    recommendation: `Consider setting a budget for ${category} if this will be a recurring expense.`,
                    data: { category, amount },
                });
            }
        }

        // Insight 4: Frequency Anomalies
        const currentFrequency = currentTransactions.filter(t => t.type === 'expense').length;
        const previousFrequency = previousTransactions.filter(t => t.type === 'expense').length;
        const frequencyChange = ((currentFrequency - previousFrequency) / previousFrequency) * 100;

        if (Math.abs(frequencyChange) > 50 && previousFrequency > 0) {
            insights.push({
                type: 'unusual_frequency',
                title: `${frequencyChange > 0 ? 'More' : 'Fewer'} Transactions`,
                description: `You've made ${currentFrequency} transactions this month compared to ${previousFrequency} last month (${Math.abs(frequencyChange).toFixed(0)}% ${frequencyChange > 0 ? 'increase' : 'decrease'}).`,
                impact: 'neutral',
                confidence: 0.6,
                actionable: false,
                data: { currentFrequency, previousFrequency, frequencyChange },
            });
        }

        // Sort by confidence and impact
        return insights.sort((a, b) => {
            if (a.impact === 'negative' && b.impact !== 'negative') return -1;
            if (b.impact === 'negative' && a.impact !== 'negative') return 1;
            return b.confidence - a.confidence;
        });
    }

    /**
     * Detect low balance warnings
     */
    static detectLowBalanceWarnings(
        balance: number,
        averageMonthlyExpenses: number,
        thresholdDays: number = 7
    ): { warning: boolean; severity: 'low' | 'medium' | 'high'; daysLeft: number; message: string } | null {
        if (averageMonthlyExpenses === 0) return null;

        const dailyExpense = averageMonthlyExpenses / 30;
        const daysLeft = Math.floor(balance / dailyExpense);

        if (daysLeft <= thresholdDays) {
            const severity: 'low' | 'medium' | 'high' =
                daysLeft <= 2 ? 'high' :
                daysLeft <= 5 ? 'medium' : 'low';

            return {
                warning: true,
                severity,
                daysLeft,
                message: `Your current balance ($${balance.toFixed(2)}) will last approximately ${daysLeft} days based on your spending pattern.`,
            };
        }

        return null;
    }

    /**
     * Helper: Group transactions by category
     */
    private static groupByCategory(transactions: Transaction[]): Map<string, number> {
        const grouped = new Map<string, number>();
        
        transactions
            .filter(t => t.type === 'expense')
            .forEach(t => {
                const category = t.category?.name || 'Uncategorized';
                grouped.set(category, (grouped.get(category) || 0) + t.amount);
            });

        return grouped;
    }

    /**
     * Calculate confidence score for anomaly detection
     */
    static calculateConfidenceScore(
        historicalDataPoints: number,
        zScore: number,
        consistencyScore: number
    ): number {
        // More historical data = higher confidence
        const dataConfidence = Math.min(1, historicalDataPoints / 100);
        
        // Higher z-score = higher confidence in anomaly
        const anomalyConfidence = Math.min(1, Math.abs(zScore) / 5);
        
        // Weighted average
        return (dataConfidence * 0.3 + anomalyConfidence * 0.5 + consistencyScore * 0.2);
    }
}
