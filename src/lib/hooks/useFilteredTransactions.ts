import { useMemo } from 'react';
import { startOfMonth, endOfMonth, startOfYear, endOfYear, startOfDay, endOfDay } from 'date-fns';
import type { Transaction } from './use-budget-queries';

export type TimePeriod = 'day' | 'month' | 'year' | 'all' | 'custom';

interface CustomDateRange {
    from: Date | undefined;
    to: Date | undefined;
}

export function useFilteredTransactions(
    transactions: Transaction[],
    timePeriod: TimePeriod,
    customDateRange?: CustomDateRange
): Transaction[] {
    return useMemo(() => {
        if (timePeriod === 'all') {
            return transactions;
        }

        const now = new Date();
        let start: Date;
        let end: Date;

        switch (timePeriod) {
            case 'day':
                start = startOfDay(now);
                end = endOfDay(now);
                break;
            case 'month':
                start = startOfMonth(now);
                end = endOfMonth(now);
                break;
            case 'year':
                start = startOfYear(now);
                end = endOfYear(now);
                break;
            case 'custom':
                if (!customDateRange?.from) return transactions;
                start = startOfDay(customDateRange.from);
                end = customDateRange.to ? endOfDay(customDateRange.to) : endOfDay(customDateRange.from);
                break;
            default:
                return transactions;
        }

        return transactions.filter((t) => {
            const transDate = new Date(t.date);
            return transDate >= start && transDate <= end;
        });
    }, [transactions, timePeriod, customDateRange]);
}
