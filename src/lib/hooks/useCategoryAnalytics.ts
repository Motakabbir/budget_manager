import { useMemo } from 'react';
import type { Transaction, Category } from './use-budget-queries';

interface CategoryBreakdown {
    name: string;
    value: number;
    color: string;
    percentage?: number;
}

interface CategoryAnalyticsResult {
    expenseCategoryData: CategoryBreakdown[];
    incomeCategoryData: CategoryBreakdown[];
    topCategories: CategoryBreakdown[];
    highestSpendingCategory: CategoryBreakdown | undefined;
}

export function useCategoryAnalytics(
    transactions: Transaction[],
    categories: Category[]
): CategoryAnalyticsResult {
    return useMemo(() => {
        const totalExpenses = transactions
            .filter((t) => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0);

        const totalIncome = transactions
            .filter((t) => t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0);

        // Expense category breakdown
        const expenseCategoryData = categories
            .filter((c) => c.type === 'expense')
            .map((category) => {
                const categoryTotal = transactions
                    .filter((t) => t.category_id === category.id && t.type === 'expense')
                    .reduce((sum, t) => sum + t.amount, 0);

                return {
                    name: category.name,
                    value: categoryTotal,
                    color: category.color,
                };
            })
            .filter((item) => item.value > 0)
            .sort((a, b) => b.value - a.value);

        // Top spending categories
        const topCategories = expenseCategoryData.slice(0, 5);
        const highestSpendingCategory = expenseCategoryData[0];

        // Income category breakdown
        const incomeCategoryData = categories
            .filter((c) => c.type === 'income')
            .map((category) => {
                const categoryTotal = transactions
                    .filter((t) => t.category_id === category.id && t.type === 'income')
                    .reduce((sum, t) => sum + t.amount, 0);

                return {
                    name: category.name,
                    value: categoryTotal,
                    color: category.color,
                    percentage: totalIncome > 0 ? (categoryTotal / totalIncome) * 100 : 0,
                };
            })
            .filter((item) => item.value > 0)
            .sort((a, b) => b.value - a.value);

        return {
            expenseCategoryData,
            incomeCategoryData,
            topCategories,
            highestSpendingCategory,
        };
    }, [transactions, categories]);
}
