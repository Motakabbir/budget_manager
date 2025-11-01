import type { Transaction, BankAccount, PaymentCard, Loan } from '@/lib/hooks/use-budget-queries';
import { startOfMonth, endOfMonth, eachMonthOfInterval, format, differenceInMonths } from 'date-fns';

// Temporary types until Assets and Investments are fully implemented
interface Asset {
    id: string;
    current_value: number;
    asset_type: string;
}

interface Investment {
    id: string;
    current_value: number;
}

/**
 * Comprehensive Reports Calculation Service
 * Ensures accurate financial calculations across all report types
 */

// ==================== TYPES ====================

export interface IncomeStatementData {
    revenue: {
        total: number;
        byCategory: Record<string, number>;
        growth: number;
    };
    expenses: {
        total: number;
        byCategory: Record<string, number>;
        operating: number;
        nonOperating: number;
        growth: number;
    };
    netIncome: {
        gross: number;
        operating: number;
        net: number;
        margin: number;
    };
    comparison: {
        previousRevenue: number;
        previousExpenses: number;
        previousNet: number;
    };
}

export interface BalanceSheetData {
    assets: {
        current: {
            cash: number;
            bankAccounts: number;
            investments: number;
            total: number;
        };
        nonCurrent: {
            property: number;
            vehicles: number;
            other: number;
            total: number;
        };
        total: number;
    };
    liabilities: {
        current: {
            creditCards: number;
            shortTermLoans: number;
            total: number;
        };
        longTerm: {
            mortgages: number;
            loans: number;
            total: number;
        };
        total: number;
    };
    equity: {
        netWorth: number;
        retainedEarnings: number;
        total: number;
    };
}

export interface CashFlowData {
    operating: {
        netIncome: number;
        adjustments: number;
        total: number;
    };
    investing: {
        assetPurchases: number;
        assetSales: number;
        investments: number;
        total: number;
    };
    financing: {
        loanProceeds: number;
        loanRepayments: number;
        total: number;
    };
    netCashFlow: number;
    beginningBalance: number;
    endingBalance: number;
}

export interface NetWorthPoint {
    date: string;
    netWorth: number;
    assets: number;
    liabilities: number;
}

export interface TaxSummary {
    taxableIncome: number;
    deductibleExpenses: number;
    estimatedTax: number;
    byCategory: {
        category: string;
        amount: number;
        isTaxable: boolean;
        isDeductible: boolean;
    }[];
}

export interface SpendingPattern {
    day: string;
    amount: number;
    transactionCount: number;
}

export interface CategoryComparison {
    category: string;
    currentAmount: number;
    previousAmount: number;
    change: number;
    changePercent: number;
    trend: 'up' | 'down' | 'stable';
}

// ==================== SERVICE ====================

export class ReportsCalculationService {
    /**
     * Calculate Income Statement (Profit & Loss)
     */
    static calculateIncomeStatement(
        transactions: Transaction[],
        previousTransactions: Transaction[] = []
    ): IncomeStatementData {
        // Current period revenue
        const revenueTransactions = transactions.filter(t => t.type === 'income');
        const totalRevenue = revenueTransactions.reduce((sum, t) => sum + t.amount, 0);
        const revenueByCategory = this.groupByCategory(revenueTransactions);

        // Current period expenses
        const expenseTransactions = transactions.filter(t => t.type === 'expense');
        const totalExpenses = expenseTransactions.reduce((sum, t) => sum + t.amount, 0);
        const expensesByCategory = this.groupByCategory(expenseTransactions);

        // Classify operating vs non-operating expenses
        const operatingCategories = ['Housing', 'Transportation', 'Food', 'Utilities', 'Healthcare', 'Insurance'];
        const operatingExpenses = expenseTransactions
            .filter(t => operatingCategories.includes(t.category?.name || ''))
            .reduce((sum, t) => sum + t.amount, 0);
        const nonOperatingExpenses = totalExpenses - operatingExpenses;

        // Previous period for comparison
        const previousRevenue = previousTransactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0);
        const previousExpenses = previousTransactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0);
        const previousNet = previousRevenue - previousExpenses;

        // Calculate growth rates
        const revenueGrowth = previousRevenue > 0 
            ? ((totalRevenue - previousRevenue) / previousRevenue) * 100 
            : 0;
        const expenseGrowth = previousExpenses > 0 
            ? ((totalExpenses - previousExpenses) / previousExpenses) * 100 
            : 0;

        // Net income calculations
        const grossIncome = totalRevenue - totalExpenses;
        const operatingIncome = totalRevenue - operatingExpenses;
        const netIncome = grossIncome;
        const netMargin = totalRevenue > 0 ? (netIncome / totalRevenue) * 100 : 0;

        return {
            revenue: {
                total: totalRevenue,
                byCategory: revenueByCategory,
                growth: revenueGrowth,
            },
            expenses: {
                total: totalExpenses,
                byCategory: expensesByCategory,
                operating: operatingExpenses,
                nonOperating: nonOperatingExpenses,
                growth: expenseGrowth,
            },
            netIncome: {
                gross: grossIncome,
                operating: operatingIncome,
                net: netIncome,
                margin: netMargin,
            },
            comparison: {
                previousRevenue,
                previousExpenses,
                previousNet,
            },
        };
    }

    /**
     * Calculate Balance Sheet
     */
    static calculateBalanceSheet(
        bankAccounts: BankAccount[] = [],
        cards: PaymentCard[] = [],
        loans: Loan[] = [],
        assets: Asset[] = [],
        investments: Investment[] = [],
        transactions: Transaction[] = []
    ): BalanceSheetData {
        // ASSETS

        // Current Assets
        const cashOnHand = 0; // Could be tracked separately
        const bankAccountsTotal = bankAccounts.reduce((sum, acc) => sum + acc.balance, 0);
        const investmentsTotal = investments.reduce((sum, inv) => sum + inv.current_value, 0);
        const currentAssetsTotal = cashOnHand + bankAccountsTotal + investmentsTotal;

        // Non-Current Assets
        const propertyAssets = assets.filter(a => a.asset_type === 'real_estate');
        const vehicleAssets = assets.filter(a => a.asset_type === 'vehicle');
        const otherAssets = assets.filter(a => !['real_estate', 'vehicle'].includes(a.asset_type));

        const propertyTotal = propertyAssets.reduce((sum, a) => sum + a.current_value, 0);
        const vehicleTotal = vehicleAssets.reduce((sum, a) => sum + a.current_value, 0);
        const otherTotal = otherAssets.reduce((sum, a) => sum + a.current_value, 0);
        const nonCurrentAssetsTotal = propertyTotal + vehicleTotal + otherTotal;

        const totalAssets = currentAssetsTotal + nonCurrentAssetsTotal;

        // LIABILITIES

        // Current Liabilities (due within 1 year)
        const creditCardsTotal = cards.reduce((sum, card) => sum + card.current_balance, 0);
        const shortTermLoansTotal = loans
            .filter(l => l.loan_type === 'taken' && l.payment_frequency !== 'yearly')
            .reduce((sum, l) => sum + l.outstanding_balance, 0);
        const currentLiabilitiesTotal = creditCardsTotal + shortTermLoansTotal;

        // Long-Term Liabilities  
        const longTermLoansTotal = loans
            .filter(l => l.loan_type === 'taken' && l.payment_frequency === 'yearly')
            .reduce((sum, l) => sum + l.outstanding_balance, 0);
        const mortgagesTotal = 0; // Separate mortgage tracking can be added
        const longTermLiabilitiesTotal = mortgagesTotal + longTermLoansTotal;

        const totalLiabilities = currentLiabilitiesTotal + longTermLiabilitiesTotal;

        // EQUITY
        const netWorth = totalAssets - totalLiabilities;
        
        // Retained earnings = cumulative net income
        const retainedEarnings = transactions.reduce((sum, t) => {
            return t.type === 'income' ? sum + t.amount : sum - t.amount;
        }, 0);

        return {
            assets: {
                current: {
                    cash: cashOnHand,
                    bankAccounts: bankAccountsTotal,
                    investments: investmentsTotal,
                    total: currentAssetsTotal,
                },
                nonCurrent: {
                    property: propertyTotal,
                    vehicles: vehicleTotal,
                    other: otherTotal,
                    total: nonCurrentAssetsTotal,
                },
                total: totalAssets,
            },
            liabilities: {
                current: {
                    creditCards: creditCardsTotal,
                    shortTermLoans: shortTermLoansTotal,
                    total: currentLiabilitiesTotal,
                },
                longTerm: {
                    mortgages: mortgagesTotal,
                    loans: longTermLoansTotal,
                    total: longTermLiabilitiesTotal,
                },
                total: totalLiabilities,
            },
            equity: {
                netWorth,
                retainedEarnings,
                total: netWorth,
            },
        };
    }

    /**
     * Calculate Cash Flow Statement
     */
    static calculateCashFlow(
        transactions: Transaction[],
        loanPayments: any[] = [],
        assetTransactions: any[] = [],
        beginningBalance: number = 0
    ): CashFlowData {
        // Operating Activities
        const income = transactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0);
        const expenses = transactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0);
        const netIncome = income - expenses;
        
        // Adjustments for non-cash items (depreciation, etc.)
        const adjustments = 0; // Could track depreciation separately
        
        const operatingCashFlow = netIncome + adjustments;

        // Investing Activities
        const assetPurchases = assetTransactions
            .filter((a: any) => a.type === 'purchase')
            .reduce((sum: number, a: any) => sum + a.amount, 0);
        const assetSales = assetTransactions
            .filter((a: any) => a.type === 'sale')
            .reduce((sum: number, a: any) => sum + a.amount, 0);
        const investmentChanges = 0; // Net investment additions/withdrawals
        
        const investingCashFlow = assetSales - assetPurchases + investmentChanges;

        // Financing Activities
        const loanProceeds = loanPayments
            .filter((l: any) => l.type === 'disbursement')
            .reduce((sum: number, l: any) => sum + l.amount, 0);
        const loanRepayments = loanPayments
            .filter((l: any) => l.type === 'payment')
            .reduce((sum: number, l: any) => sum + l.amount, 0);
        
        const financingCashFlow = loanProceeds - loanRepayments;

        // Net Cash Flow
        const netCashFlow = operatingCashFlow + investingCashFlow + financingCashFlow;
        const endingBalance = beginningBalance + netCashFlow;

        return {
            operating: {
                netIncome,
                adjustments,
                total: operatingCashFlow,
            },
            investing: {
                assetPurchases: -assetPurchases,
                assetSales,
                investments: investmentChanges,
                total: investingCashFlow,
            },
            financing: {
                loanProceeds,
                loanRepayments: -loanRepayments,
                total: financingCashFlow,
            },
            netCashFlow,
            beginningBalance,
            endingBalance,
        };
    }

    /**
     * Calculate Net Worth over time
     */
    static calculateNetWorthHistory(
        transactions: Transaction[],
        bankAccounts: BankAccount[],
        cards: PaymentCard[],
        loans: Loan[],
        assets: Asset[],
        investments: Investment[],
        months: number = 12
    ): NetWorthPoint[] {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setMonth(startDate.getMonth() - months);

        const monthlyPoints: NetWorthPoint[] = [];
        const monthsList = eachMonthOfInterval({ start: startDate, end: endDate });

        for (const month of monthsList) {
            const monthStart = startOfMonth(month);
            const monthEnd = endOfMonth(month);

            // Filter transactions up to this month
            const relevantTransactions = transactions.filter(t => 
                new Date(t.date) <= monthEnd
            );

            // Calculate balance sheet for this point in time
            const balanceSheet = this.calculateBalanceSheet(
                bankAccounts,
                cards,
                loans,
                assets,
                investments,
                relevantTransactions
            );

            monthlyPoints.push({
                date: format(month, 'MMM yyyy'),
                netWorth: balanceSheet.equity.netWorth,
                assets: balanceSheet.assets.total,
                liabilities: balanceSheet.liabilities.total,
            });
        }

        return monthlyPoints;
    }

    /**
     * Calculate Tax Summary
     */
    static calculateTaxSummary(
        transactions: Transaction[]
    ): TaxSummary {
        // Tax-relevant categories
        const taxableIncomeCategories = ['Salary', 'Freelance', 'Business Income', 'Interest', 'Dividends'];
        const deductibleExpenseCategories = ['Healthcare', 'Education', 'Charitable Donations', 'Business Expenses'];

        const taxableIncome = transactions
            .filter(t => t.type === 'income' && taxableIncomeCategories.includes(t.category?.name || ''))
            .reduce((sum, t) => sum + t.amount, 0);

        const deductibleExpenses = transactions
            .filter(t => t.type === 'expense' && deductibleExpenseCategories.includes(t.category?.name || ''))
            .reduce((sum, t) => sum + t.amount, 0);

        // Simplified tax estimation (would need actual tax brackets)
        const taxableAmount = Math.max(0, taxableIncome - deductibleExpenses);
        const estimatedTax = taxableAmount * 0.22; // Simplified 22% rate

        const byCategory = transactions.map(t => ({
            category: t.category?.name || 'Uncategorized',
            amount: t.amount,
            isTaxable: t.type === 'income' && taxableIncomeCategories.includes(t.category?.name || ''),
            isDeductible: t.type === 'expense' && deductibleExpenseCategories.includes(t.category?.name || ''),
        }));

        return {
            taxableIncome,
            deductibleExpenses,
            estimatedTax,
            byCategory,
        };
    }

    /**
     * Calculate Spending Patterns for Heatmap
     */
    static calculateSpendingPatterns(
        transactions: Transaction[],
        groupBy: 'day' | 'week' | 'month' = 'day'
    ): SpendingPattern[] {
        const patterns = new Map<string, { amount: number; count: number }>();

        transactions
            .filter(t => t.type === 'expense')
            .forEach(t => {
                const date = new Date(t.date);
                let key: string;

                if (groupBy === 'day') {
                    key = format(date, 'yyyy-MM-dd');
                } else if (groupBy === 'week') {
                    key = format(date, 'yyyy-ww');
                } else {
                    key = format(date, 'yyyy-MM');
                }

                const existing = patterns.get(key) || { amount: 0, count: 0 };
                patterns.set(key, {
                    amount: existing.amount + t.amount,
                    count: existing.count + 1,
                });
            });

        return Array.from(patterns.entries()).map(([day, data]) => ({
            day,
            amount: data.amount,
            transactionCount: data.count,
        }));
    }

    /**
     * Calculate Category Comparisons
     */
    static calculateCategoryComparisons(
        currentTransactions: Transaction[],
        previousTransactions: Transaction[]
    ): CategoryComparison[] {
        const currentByCategory = this.groupByCategory(currentTransactions);
        const previousByCategory = this.groupByCategory(previousTransactions);

        const allCategories = new Set([
            ...Object.keys(currentByCategory),
            ...Object.keys(previousByCategory),
        ]);

        return Array.from(allCategories).map(category => {
            const currentAmount = currentByCategory[category] || 0;
            const previousAmount = previousByCategory[category] || 0;
            const change = currentAmount - previousAmount;
            const changePercent = previousAmount > 0 
                ? (change / previousAmount) * 100 
                : 0;

            let trend: 'up' | 'down' | 'stable' = 'stable';
            if (Math.abs(changePercent) > 5) {
                trend = changePercent > 0 ? 'up' : 'down';
            }

            return {
                category,
                currentAmount,
                previousAmount,
                change,
                changePercent,
                trend,
            };
        }).sort((a, b) => b.currentAmount - a.currentAmount);
    }

    /**
     * Helper: Group transactions by category
     */
    private static groupByCategory(transactions: Transaction[]): Record<string, number> {
        return transactions.reduce((acc, t) => {
            const category = t.category?.name || 'Uncategorized';
            acc[category] = (acc[category] || 0) + t.amount;
            return acc;
        }, {} as Record<string, number>);
    }

    /**
     * Format currency
     */
    static formatCurrency(amount: number, currency: string = 'USD'): string {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency,
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(amount);
    }

    /**
     * Format percentage
     */
    static formatPercentage(value: number, decimals: number = 1): string {
        return `${value >= 0 ? '+' : ''}${value.toFixed(decimals)}%`;
    }
}
