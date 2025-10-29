import { useMemo } from 'react';
import { startOfMonth, endOfMonth, subMonths, format } from 'date-fns';
import type { Transaction, Category } from './use-budget-queries';

interface MonthlyData {
    month: string;
    shortMonth: string;
    income: number;
    expenses: number;
    savings: number;
    balance: number;
}

interface AnalyticsResult {
    // Monthly trend data
    monthlyData: MonthlyData[];

    // Totals
    total12MonthIncome: number;
    total12MonthExpenses: number;
    total12MonthSavings: number;

    // Averages
    averageMonthlySavings: number;
    avgMonthlyIncome: number;
    avgMonthlyExpenses: number;

    // Current month
    currentMonthIncome: number;
    currentMonthExpenses: number;
    currentMonthSavings: number;

    // Peak months
    highestExpenseMonth: MonthlyData;
    highestIncomeMonth: MonthlyData;
    bestSavingsMonth: MonthlyData;

    // Savings rate
    savingsRate: number;
}

export function useDashboardAnalytics(
    transactions: Transaction[],
    openingBalance: number = 0
): AnalyticsResult {
    return useMemo(() => {
        // Current month data
        const currentMonthStart = startOfMonth(new Date());
        const currentMonthEnd = endOfMonth(new Date());
        const currentMonthTransactions = transactions.filter((t) => {
            const transDate = new Date(t.date);
            return transDate >= currentMonthStart && transDate <= currentMonthEnd;
        });

        const currentMonthIncome = currentMonthTransactions
            .filter((t) => t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0);

        const currentMonthExpenses = currentMonthTransactions
            .filter((t) => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0);

        const currentMonthSavings = currentMonthIncome - currentMonthExpenses;

        // Monthly trend data (last 12 months)
        const monthlyData = Array.from({ length: 12 }, (_, i) => {
            const date = subMonths(new Date(), 11 - i);
            const monthStart = startOfMonth(date);
            const monthEnd = endOfMonth(date);

            const monthTransactions = transactions.filter((t) => {
                const transDate = new Date(t.date);
                return transDate >= monthStart && transDate <= monthEnd;
            });

            const income = monthTransactions
                .filter((t) => t.type === 'income')
                .reduce((sum, t) => sum + t.amount, 0);

            const expenses = monthTransactions
                .filter((t) => t.type === 'expense')
                .reduce((sum, t) => sum + t.amount, 0);

            const savings = income - expenses;

            return {
                month: format(date, 'MMM yyyy'),
                shortMonth: format(date, 'MMM'),
                income,
                expenses,
                savings,
                balance: income - expenses,
            };
        });

        // Calculate totals
        const total12MonthIncome = monthlyData.reduce((sum, month) => sum + month.income, 0);
        const total12MonthExpenses = monthlyData.reduce((sum, month) => sum + month.expenses, 0);
        const total12MonthSavings = total12MonthIncome - total12MonthExpenses;

        // Calculate averages
        const totalSavings = monthlyData.reduce((sum, month) => sum + month.savings, 0);
        const averageMonthlySavings = totalSavings / monthlyData.length;
        const avgMonthlyIncome = monthlyData.reduce((sum, m) => sum + m.income, 0) / monthlyData.length;
        const avgMonthlyExpenses = monthlyData.reduce((sum, m) => sum + m.expenses, 0) / monthlyData.length;

        // Find peak months
        const highestExpenseMonth = monthlyData.reduce((max, month) =>
            month.expenses > max.expenses ? month : max
            , monthlyData[0]);

        const highestIncomeMonth = monthlyData.reduce((max, month) =>
            month.income > max.income ? month : max
            , monthlyData[0]);

        const bestSavingsMonth = monthlyData.reduce((max, month) =>
            month.savings > max.savings ? month : max
            , monthlyData[0]);

        // Calculate savings rate
        const totalIncomeAllTime = transactions
            .filter((t) => t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0);

        const savingsRate = totalIncomeAllTime > 0 ? (totalSavings / totalIncomeAllTime) * 100 : 0;

        return {
            monthlyData,
            total12MonthIncome,
            total12MonthExpenses,
            total12MonthSavings,
            averageMonthlySavings,
            avgMonthlyIncome,
            avgMonthlyExpenses,
            currentMonthIncome,
            currentMonthExpenses,
            currentMonthSavings,
            highestExpenseMonth,
            highestIncomeMonth,
            bestSavingsMonth,
            savingsRate,
        };
    }, [transactions, openingBalance]);
}
