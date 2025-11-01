import type { Transaction } from '@/lib/hooks/use-budget-queries';
import { startOfMonth, endOfMonth, addMonths, differenceInMonths, format } from 'date-fns';

export interface MonthlyData {
    month: string;
    income: number;
    expenses: number;
    netCashFlow: number;
    balance: number;
}

export interface CashFlowProjection {
    projections: MonthlyData[];
    averageIncome: number;
    averageExpenses: number;
    averageNetCashFlow: number;
    projectedBalance: number;
    burnRate: number; // Months until balance reaches zero
    trend: 'improving' | 'stable' | 'declining';
}

export interface WhatIfScenario {
    name: string;
    description: string;
    projections: MonthlyData[];
    totalImpact: number;
    recommendation: string;
}

/**
 * Financial Forecasting Service
 * Provides cash flow projections, burn rate calculations, and what-if scenarios
 */
export class FinancialForecastingService {
    /**
     * Calculate historical monthly averages
     */
    private static calculateHistoricalAverages(
        transactions: Transaction[],
        months: number
    ): { avgIncome: number; avgExpenses: number } {
        const endDate = new Date();
        const startDate = addMonths(endDate, -months);

        const filteredTransactions = transactions.filter(t => {
            const date = new Date(t.date);
            return date >= startDate && date <= endDate;
        });

        const incomeTransactions = filteredTransactions.filter(t => t.type === 'income');
        const expenseTransactions = filteredTransactions.filter(t => t.type === 'expense');

        const totalIncome = incomeTransactions.reduce((sum, t) => sum + t.amount, 0);
        const totalExpenses = expenseTransactions.reduce((sum, t) => sum + t.amount, 0);

        return {
            avgIncome: totalIncome / months,
            avgExpenses: totalExpenses / months,
        };
    }

    /**
     * Calculate growth trend from historical data
     */
    private static calculateGrowthTrend(monthlyData: MonthlyData[]): number {
        if (monthlyData.length < 2) return 0;

        // Calculate simple linear trend
        const netCashFlows = monthlyData.map(d => d.netCashFlow);
        const n = netCashFlows.length;
        
        let sumX = 0;
        let sumY = 0;
        let sumXY = 0;
        let sumX2 = 0;

        for (let i = 0; i < n; i++) {
            sumX += i;
            sumY += netCashFlows[i];
            sumXY += i * netCashFlows[i];
            sumX2 += i * i;
        }

        const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
        return slope;
    }

    /**
     * Generate cash flow projection for future months
     * @param transactions - Historical transactions
     * @param currentBalance - Current account balance
     * @param monthsToProject - Number of months to project (3, 6, or 12)
     * @returns Cash flow projection
     */
    static generateCashFlowProjection(
        transactions: Transaction[],
        currentBalance: number,
        monthsToProject: 3 | 6 | 12 = 6
    ): CashFlowProjection {
        // Calculate historical averages from last 6 months
        const historicalMonths = Math.min(6, monthsToProject);
        const { avgIncome, avgExpenses } = this.calculateHistoricalAverages(
            transactions,
            historicalMonths
        );

        // Calculate historical monthly data for trend analysis
        const historicalData: MonthlyData[] = [];
        const endDate = new Date();
        
        for (let i = historicalMonths - 1; i >= 0; i--) {
            const monthStart = startOfMonth(addMonths(endDate, -i));
            const monthEnd = endOfMonth(monthStart);
            
            const monthTransactions = transactions.filter(t => {
                const date = new Date(t.date);
                return date >= monthStart && date <= monthEnd;
            });

            const monthIncome = monthTransactions
                .filter(t => t.type === 'income')
                .reduce((sum, t) => sum + t.amount, 0);
            
            const monthExpenses = monthTransactions
                .filter(t => t.type === 'expense')
                .reduce((sum, t) => sum + t.amount, 0);

            historicalData.push({
                month: format(monthStart, 'MMM yyyy'),
                income: monthIncome,
                expenses: monthExpenses,
                netCashFlow: monthIncome - monthExpenses,
                balance: 0, // Will calculate cumulative balance below
            });
        }

        // Calculate growth trend
        const growthTrend = this.calculateGrowthTrend(historicalData);

        // Generate future projections
        const projections: MonthlyData[] = [];
        let runningBalance = currentBalance;

        for (let i = 1; i <= monthsToProject; i++) {
            const projectionDate = addMonths(new Date(), i);
            
            // Apply growth trend to projections
            const trendAdjustment = growthTrend * i;
            const projectedIncome = avgIncome + (avgIncome * 0.02 * i); // 2% growth assumption
            const projectedExpenses = avgExpenses + (avgExpenses * 0.01 * i); // 1% inflation assumption
            
            const netCashFlow = projectedIncome - projectedExpenses + trendAdjustment;
            runningBalance += netCashFlow;

            projections.push({
                month: format(projectionDate, 'MMM yyyy'),
                income: projectedIncome,
                expenses: projectedExpenses,
                netCashFlow,
                balance: runningBalance,
            });
        }

        // Calculate burn rate (months until balance reaches zero)
        const avgNetCashFlow = avgIncome - avgExpenses;
        let burnRate = Infinity;
        
        if (avgNetCashFlow < 0) {
            burnRate = Math.abs(currentBalance / avgNetCashFlow);
        }

        // Determine trend
        let trend: 'improving' | 'stable' | 'declining' = 'stable';
        if (avgNetCashFlow > avgIncome * 0.1) {
            trend = 'improving';
        } else if (avgNetCashFlow < 0) {
            trend = 'declining';
        }

        return {
            projections,
            averageIncome: avgIncome,
            averageExpenses: avgExpenses,
            averageNetCashFlow: avgNetCashFlow,
            projectedBalance: runningBalance,
            burnRate,
            trend,
        };
    }

    /**
     * Calculate burn rate (months until money runs out)
     */
    static calculateBurnRate(
        currentBalance: number,
        monthlyExpenses: number,
        monthlyIncome: number
    ): number {
        const netCashFlow = monthlyIncome - monthlyExpenses;
        
        if (netCashFlow >= 0) {
            return Infinity; // Not burning money
        }

        return Math.abs(currentBalance / netCashFlow);
    }

    /**
     * What-if scenario: Salary increase
     */
    static scenarioSalaryIncrease(
        baseProjection: CashFlowProjection,
        increaseAmount: number,
        startMonth: number = 0
    ): WhatIfScenario {
        const projections = baseProjection.projections.map((month, index) => {
            if (index >= startMonth) {
                return {
                    ...month,
                    income: month.income + increaseAmount,
                    netCashFlow: month.netCashFlow + increaseAmount,
                    balance: month.balance + (increaseAmount * (index - startMonth + 1)),
                };
            }
            return month;
        });

        const totalImpact = increaseAmount * (projections.length - startMonth);

        return {
            name: 'Salary Increase',
            description: `Impact of $${increaseAmount.toFixed(2)} monthly income increase`,
            projections,
            totalImpact,
            recommendation: totalImpact > 0 
                ? `This would improve your financial position by $${totalImpact.toFixed(2)} over the projection period.`
                : 'Consider negotiating for a raise or exploring additional income sources.',
        };
    }

    /**
     * What-if scenario: Loan payoff
     */
    static scenarioLoanPayoff(
        baseProjection: CashFlowProjection,
        loanPayment: number,
        remainingMonths: number
    ): WhatIfScenario {
        const projections = baseProjection.projections.map((month, index) => {
            if (index < remainingMonths) {
                // During loan repayment
                return month;
            } else {
                // After loan is paid off
                const monthsSincePayoff = index - remainingMonths + 1;
                return {
                    ...month,
                    expenses: month.expenses - loanPayment,
                    netCashFlow: month.netCashFlow + loanPayment,
                    balance: month.balance + (loanPayment * monthsSincePayoff),
                };
            }
        });

        const payoffMonth = remainingMonths < projections.length 
            ? projections[remainingMonths].month 
            : 'beyond projection period';
        
        const totalImpact = loanPayment * (projections.length - remainingMonths);

        return {
            name: 'Loan Payoff',
            description: `Impact of completing loan payments by ${payoffMonth}`,
            projections,
            totalImpact: Math.max(0, totalImpact),
            recommendation: `After paying off your loan, you'll free up $${loanPayment.toFixed(2)}/month, improving your position by $${Math.max(0, totalImpact).toFixed(2)}.`,
        };
    }

    /**
     * What-if scenario: Expense reduction
     */
    static scenarioExpenseReduction(
        baseProjection: CashFlowProjection,
        reductionAmount: number,
        category: string
    ): WhatIfScenario {
        const projections = baseProjection.projections.map((month, index) => ({
            ...month,
            expenses: month.expenses - reductionAmount,
            netCashFlow: month.netCashFlow + reductionAmount,
            balance: month.balance + (reductionAmount * (index + 1)),
        }));

        const totalImpact = reductionAmount * projections.length;

        return {
            name: 'Expense Reduction',
            description: `Impact of reducing ${category} by $${reductionAmount.toFixed(2)}/month`,
            projections,
            totalImpact,
            recommendation: `Cutting ${category} expenses would save you $${totalImpact.toFixed(2)} over the projection period. Consider alternatives or optimizations.`,
        };
    }

    /**
     * What-if scenario: New recurring expense
     */
    static scenarioNewExpense(
        baseProjection: CashFlowProjection,
        newExpenseAmount: number,
        expenseName: string
    ): WhatIfScenario {
        const projections = baseProjection.projections.map((month, index) => ({
            ...month,
            expenses: month.expenses + newExpenseAmount,
            netCashFlow: month.netCashFlow - newExpenseAmount,
            balance: month.balance - (newExpenseAmount * (index + 1)),
        }));

        const totalImpact = -newExpenseAmount * projections.length;

        return {
            name: 'New Expense',
            description: `Impact of adding ${expenseName} at $${newExpenseAmount.toFixed(2)}/month`,
            projections,
            totalImpact,
            recommendation: totalImpact < 0 
                ? `This expense would reduce your savings by $${Math.abs(totalImpact).toFixed(2)}. Ensure it fits your budget.`
                : 'Review if this expense aligns with your financial goals.',
        };
    }

    /**
     * What-if scenario: Emergency fund building
     */
    static scenarioEmergencyFund(
        baseProjection: CashFlowProjection,
        monthlySavings: number,
        targetAmount: number
    ): WhatIfScenario {
        let accumulatedSavings = 0;
        const projections = baseProjection.projections.map((month, index) => {
            accumulatedSavings += monthlySavings;
            const isFunded = accumulatedSavings >= targetAmount;
            
            return {
                ...month,
                expenses: month.expenses + (isFunded ? 0 : monthlySavings),
                netCashFlow: month.netCashFlow - (isFunded ? 0 : monthlySavings),
                balance: month.balance - Math.min(accumulatedSavings, targetAmount),
            };
        });

        const monthsToTarget = Math.ceil(targetAmount / monthlySavings);
        const totalImpact = -Math.min(targetAmount, monthlySavings * projections.length);

        return {
            name: 'Emergency Fund',
            description: `Building $${targetAmount.toFixed(2)} emergency fund at $${monthlySavings.toFixed(2)}/month`,
            projections,
            totalImpact,
            recommendation: monthsToTarget <= projections.length
                ? `You can reach your emergency fund goal in ${monthsToTarget} months. This provides crucial financial security.`
                : `At this rate, it will take ${monthsToTarget} months to reach your goal. Consider increasing monthly contributions if possible.`,
        };
    }

    /**
     * Compare multiple scenarios
     */
    static compareScenarios(scenarios: WhatIfScenario[]): {
        bestCase: WhatIfScenario;
        worstCase: WhatIfScenario;
        summary: string;
    } {
        const bestCase = scenarios.reduce((best, scenario) => 
            scenario.totalImpact > best.totalImpact ? scenario : best
        );

        const worstCase = scenarios.reduce((worst, scenario) => 
            scenario.totalImpact < worst.totalImpact ? scenario : worst
        );

        const summary = `Best scenario: ${bestCase.name} (+$${bestCase.totalImpact.toFixed(2)}). Worst scenario: ${worstCase.name} ($${worstCase.totalImpact.toFixed(2)}).`;

        return { bestCase, worstCase, summary };
    }
}
