import { useMemo } from 'react';
import type { Transaction } from './use-budget-queries';

interface FinancialMetrics {
    totalIncome: number;
    totalExpenses: number;
    balance: number;
    netChange: number;
    avgExpenseSize: number;
    avgIncomeSize: number;
    transactionCount: number;
}

export function useFinancialMetrics(
    transactions: Transaction[],
    openingBalance: number = 0
): FinancialMetrics {
    return useMemo(() => {
        const totalIncome = transactions
            .filter((t) => t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0);

        const totalExpenses = transactions
            .filter((t) => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0);

        const balance = openingBalance + totalIncome - totalExpenses;
        const netChange = totalIncome - totalExpenses;

        const expenseTransactions = transactions.filter((t) => t.type === 'expense');
        const incomeTransactions = transactions.filter((t) => t.type === 'income');

        const avgExpenseSize = expenseTransactions.length > 0
            ? expenseTransactions.reduce((sum, t) => sum + t.amount, 0) / expenseTransactions.length
            : 0;

        const avgIncomeSize = incomeTransactions.length > 0
            ? incomeTransactions.reduce((sum, t) => sum + t.amount, 0) / incomeTransactions.length
            : 0;

        return {
            totalIncome,
            totalExpenses,
            balance,
            netChange,
            avgExpenseSize,
            avgIncomeSize,
            transactionCount: transactions.length,
        };
    }, [transactions, openingBalance]);
}
