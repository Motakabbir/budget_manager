import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, DollarSign, Calendar } from 'lucide-react';
import { useBankAccounts, useLoans, useSavingsGoals } from '@/lib/hooks/use-budget-queries';
import { useAssets } from '@/lib/hooks/use-asset-queries';
import { useInvestments } from '@/lib/hooks/use-investment-queries';
import { format, subMonths } from 'date-fns';

interface NetWorthTrackerProps {
    dateRange?: {
        start: Date;
        end: Date;
    };
}

export function NetWorthTracker({ dateRange: _dateRange }: NetWorthTrackerProps) {
    const { data: bankAccounts = [] } = useBankAccounts();
    const { data: loans = [] } = useLoans();
    const { data: savingsGoals = [] } = useSavingsGoals();
    const { data: assets = [] } = useAssets();
    const { data: investments = [] } = useInvestments();

    // Calculate current net worth
    const bankAccountsTotal = bankAccounts.reduce((sum, account) => sum + account.balance, 0);
    const savingsGoalsTotal = savingsGoals.reduce((sum, goal) => sum + goal.current_amount, 0);
    const assetsTotal = assets.filter(a => a.is_active).reduce((sum, asset) => sum + asset.current_value, 0);
    const investmentsTotal = investments
        .filter(inv => inv.is_active)
        .reduce((sum, inv) => sum + (inv.quantity * inv.current_price), 0);

    const totalAssets = bankAccountsTotal + savingsGoalsTotal + assetsTotal + investmentsTotal;

    const totalLiabilities = loans.reduce((sum: number, loan: any) => sum + loan.remaining_balance, 0);

    const currentNetWorth = totalAssets - totalLiabilities;

    // Calculate net worth for previous periods (simplified - would need historical data)
    // For now, showing estimated trend based on loan payments and average monthly changes
    const monthlyLoanPayment = loans.reduce((sum: number, loan: any) => sum + loan.monthly_payment, 0);
    const estimatedMonthlySavings = (bankAccountsTotal + savingsGoalsTotal) / 12; // Rough estimate
    const estimatedMonthlyLiabilityChange = totalLiabilities / 12; // Rough estimate of liability reduction

    const previousPeriods = Array.from({ length: 6 }, (_, i) => {
        const date = subMonths(new Date(), i);
        // Estimate historical net worth by working backwards
        const monthsAgo = i;
        const estimatedAssets = totalAssets - (estimatedMonthlySavings * monthsAgo);
        const estimatedLiabilities = totalLiabilities + (estimatedMonthlyLiabilityChange * monthsAgo);

        return {
            month: format(date, 'MMM yyyy'),
            netWorth: estimatedAssets - estimatedLiabilities,
            assets: estimatedAssets,
            liabilities: estimatedLiabilities
        };
    }).reverse();

    const netWorthChange = previousPeriods.length > 1 ?
        ((currentNetWorth - previousPeriods[0].netWorth) / Math.abs(previousPeriods[0].netWorth)) * 100 : 0;

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
        }).format(amount);
    };

    return (
        <div className="space-y-6">
            {/* Current Net Worth Summary */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5" />
                        Net Worth Overview
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="text-center">
                            <p className="text-sm text-muted-foreground">Total Assets</p>
                            <p className="text-2xl font-bold text-green-600">{formatCurrency(totalAssets)}</p>
                        </div>
                        <div className="text-center">
                            <p className="text-sm text-muted-foreground">Total Liabilities</p>
                            <p className="text-2xl font-bold text-red-600">{formatCurrency(totalLiabilities)}</p>
                        </div>
                        <div className="text-center">
                            <p className="text-sm text-muted-foreground">Net Worth</p>
                            <p className={`text-2xl font-bold ${currentNetWorth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {formatCurrency(currentNetWorth)}
                            </p>
                            <div className="flex items-center justify-center gap-1 mt-1">
                                {netWorthChange >= 0 ? (
                                    <TrendingUp className="h-4 w-4 text-green-600" />
                                ) : (
                                    <TrendingDown className="h-4 w-4 text-red-600" />
                                )}
                                <span className={`text-sm ${netWorthChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    {netWorthChange >= 0 ? '+' : ''}{netWorthChange.toFixed(1)}%
                                </span>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Net Worth Trend */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Calendar className="h-5 w-5" />
                        Net Worth Trend (Last 6 Months)
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {previousPeriods.map((period, index) => (
                            <div key={period.month} className="flex items-center justify-between p-3 border rounded-lg">
                                <div className="flex items-center gap-3">
                                    <div className="w-16 text-sm font-medium">{period.month}</div>
                                    <div className="flex gap-4 text-sm">
                                        <span className="text-green-600">Assets: {formatCurrency(period.assets)}</span>
                                        <span className="text-red-600">Liabilities: {formatCurrency(period.liabilities)}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Badge variant={period.netWorth >= 0 ? "default" : "destructive"}>
                                        {formatCurrency(period.netWorth)}
                                    </Badge>
                                    {index > 0 && (
                                        <div className="flex items-center gap-1">
                                            {period.netWorth > previousPeriods[index - 1].netWorth ? (
                                                <TrendingUp className="h-4 w-4 text-green-600" />
                                            ) : (
                                                <TrendingDown className="h-4 w-4 text-red-600" />
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Asset Breakdown */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <DollarSign className="h-5 w-5" />
                        Asset Breakdown
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        <div className="flex justify-between items-center">
                            <span className="text-sm">Bank Accounts</span>
                            <span className="font-medium">{formatCurrency(bankAccountsTotal)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm">Savings Goals</span>
                            <span className="font-medium">{formatCurrency(savingsGoalsTotal)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm">Fixed Assets</span>
                            <span className="font-medium">{formatCurrency(assetsTotal)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm">Investments</span>
                            <span className="font-medium">{formatCurrency(investmentsTotal)}</span>
                        </div>
                        <div className="border-t pt-2 flex justify-between items-center font-semibold">
                            <span>Total Assets</span>
                            <span className="text-green-600">{formatCurrency(totalAssets)}</span>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Liability Breakdown */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <TrendingDown className="h-5 w-5" />
                        Liability Breakdown
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {loans.length > 0 ? (
                            loans.map((loan: any) => (
                                <div key={loan.id} className="flex justify-between items-center">
                                    <span className="text-sm">{loan.loan_name || loan.party_name || 'Loan'}</span>
                                    <span className="font-medium text-red-600">{formatCurrency(loan.remaining_balance)}</span>
                                </div>
                            ))
                        ) : (
                            <p className="text-sm text-muted-foreground">No active loans</p>
                        )}
                        <div className="border-t pt-2 flex justify-between items-center font-semibold">
                            <span>Total Liabilities</span>
                            <span className="text-red-600">{formatCurrency(totalLiabilities)}</span>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}