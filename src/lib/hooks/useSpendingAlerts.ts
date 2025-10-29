import { useMemo } from 'react';
import { startOfMonth, endOfMonth, format } from 'date-fns';
import type { Transaction, Category, CategoryBudget } from './use-budget-queries';

export interface SpendingAlert {
    id: string;
    type: 'critical' | 'warning' | 'info' | 'success';
    title: string;
    message: string;
    value?: number;
    icon: string;
    category?: Category;
    actionable: boolean;
}

export function useSpendingAlerts(
    transactions: Transaction[],
    categories: Category[],
    categoryBudgets: CategoryBudget[],
    currentMonthIncome: number,
    avgMonthlyExpenses: number
): SpendingAlert[] {
    return useMemo(() => {
        const alerts: SpendingAlert[] = [];

        const currentMonthStart = startOfMonth(new Date());
        const currentMonthEnd = endOfMonth(new Date());
        const currentMonthTransactions = transactions.filter((t) => {
            const transDate = new Date(t.date);
            return transDate >= currentMonthStart && transDate <= currentMonthEnd;
        });

        const currentMonthExpenses = currentMonthTransactions
            .filter((t) => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0);

        // 1. Budget Overspending Alert
        categoryBudgets.forEach(budget => {
            if (budget.period !== 'monthly') return;

            const category = categories.find(c => c.id === budget.category_id);
            if (!category) return;

            const spent = currentMonthTransactions
                .filter(t => t.category_id === budget.category_id && t.type === 'expense')
                .reduce((sum, t) => sum + t.amount, 0);

            const percentage = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;

            if (percentage >= 100) {
                alerts.push({
                    id: `budget-over-${budget.id}`,
                    type: 'critical',
                    title: `${category.name} Budget Exceeded`,
                    message: `You've spent $${spent.toFixed(2)} of $${budget.amount.toFixed(2)} budget (${percentage.toFixed(0)}% used)`,
                    value: spent - budget.amount,
                    icon: '🚨',
                    category,
                    actionable: true,
                });
            } else if (percentage >= 90) {
                alerts.push({
                    id: `budget-warning-${budget.id}`,
                    type: 'warning',
                    title: `${category.name} Budget Almost Exceeded`,
                    message: `You've spent $${spent.toFixed(2)} of $${budget.amount.toFixed(2)} budget (${percentage.toFixed(0)}% used)`,
                    value: budget.amount - spent,
                    icon: '⚠️',
                    category,
                    actionable: true,
                });
            }
        });

        // 2. No Income This Month
        if (currentMonthIncome === 0 && new Date().getDate() > 15) {
            alerts.push({
                id: 'no-income',
                type: 'critical',
                title: 'No Income Recorded This Month',
                message: `It's ${format(new Date(), 'MMMM dd')} and no income has been recorded yet`,
                icon: '💸',
                actionable: false,
            });
        }

        // 3. High Spending Alert
        if (avgMonthlyExpenses > 0) {
            const increasePercent = ((currentMonthExpenses - avgMonthlyExpenses) / avgMonthlyExpenses) * 100;

            if (increasePercent > 30) {
                alerts.push({
                    id: 'unusual-spike',
                    type: 'critical',
                    title: 'Unusual Spending Spike Detected',
                    message: `Spending is ${increasePercent.toFixed(0)}% higher than your average ($${avgMonthlyExpenses.toFixed(2)})`,
                    value: currentMonthExpenses - avgMonthlyExpenses,
                    icon: '📈',
                    actionable: true,
                });
            } else if (increasePercent > 20) {
                alerts.push({
                    id: 'spending-increase',
                    type: 'warning',
                    title: 'Above Average Spending',
                    message: `Spending is ${increasePercent.toFixed(0)}% higher than usual this month`,
                    value: currentMonthExpenses - avgMonthlyExpenses,
                    icon: '📊',
                    actionable: true,
                });
            }
        }

        // Sort by priority
        const priorityOrder = { critical: 0, warning: 1, info: 2, success: 3 };
        return alerts.sort((a, b) => priorityOrder[a.type] - priorityOrder[b.type]);
    }, [transactions, categories, categoryBudgets, currentMonthIncome, avgMonthlyExpenses]);
}
