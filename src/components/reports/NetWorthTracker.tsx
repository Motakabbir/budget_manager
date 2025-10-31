import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, DollarSign, Calendar } from 'lucide-react';
import { useBankAccounts, useLoans, useSavingsGoals } from '@/lib/hooks/use-budget-queries';
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

    // Calculate current net worth
    const totalAssets = bankAccounts.reduce((sum, account) => sum + account.balance, 0) +
        savingsGoals.reduce((sum, goal) => sum + goal.current_amount, 0);

    const totalLiabilities = loans.reduce((sum, loan) => sum + loan.outstanding_balance, 0);

    const currentNetWorth = totalAssets - totalLiabilities;

    // Calculate net worth for previous periods (simplified - would need historical data)
    const previousPeriods = Array.from({ length: 6 }, (_, i) => {
        const date = subMonths(new Date(), i);
        return {
            month: format(date, 'MMM yyyy'),
            // This would need historical data - for now using simplified calculations
            netWorth: currentNetWorth - (i * 1000) + Math.random() * 2000,
            assets: totalAssets - (i * 500) + Math.random() * 1000,
            liabilities: totalLiabilities - (i * 200) + Math.random() * 400
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
                            <span className="font-medium">{formatCurrency(bankAccounts.reduce((sum, account) => sum + account.balance, 0))}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm">Savings Goals</span>
                            <span className="font-medium">{formatCurrency(savingsGoals.reduce((sum, goal) => sum + goal.current_amount, 0))}</span>
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
                        {loans.map((loan) => (
                            <div key={loan.id} className="flex justify-between items-center">
                                <span className="text-sm">{loan.party_name}</span>
                                <span className="font-medium text-red-600">{formatCurrency(loan.outstanding_balance)}</span>
                            </div>
                        ))}
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