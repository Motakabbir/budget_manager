import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { LineChart, TrendingUp, TrendingDown, Calendar, AlertTriangle } from 'lucide-react';
import { useTransactions } from '@/lib/hooks/use-budget-queries';
import { format, startOfMonth, endOfMonth, eachMonthOfInterval, subMonths } from 'date-fns';

interface ExpenseTrendsChartsProps {
    dateRange?: {
        start: Date;
        end: Date;
    };
}

export function ExpenseTrendsCharts({ dateRange }: ExpenseTrendsChartsProps) {
    const currentMonth = {
        start: startOfMonth(new Date()),
        end: endOfMonth(new Date())
    };

    const { data: transactions = [] } = useTransactions(
        (dateRange?.start || subMonths(currentMonth.start, 11)).toISOString(), // Last 12 months
        (dateRange?.end || currentMonth.end).toISOString()
    );

    // Filter only expense transactions
    const expenseTransactions = transactions.filter(t => t.type === 'expense');

    // Group expenses by month
    const expensesByMonth = expenseTransactions.reduce((acc, transaction) => {
        const monthKey = format(new Date(transaction.date), 'yyyy-MM');
        acc[monthKey] = (acc[monthKey] || 0) + transaction.amount;
        return acc;
    }, {} as Record<string, number>);

    // Group expenses by category and month for trend analysis
    const categoryTrends = expenseTransactions.reduce((acc, transaction) => {
        const monthKey = format(new Date(transaction.date), 'yyyy-MM');
        const categoryName = transaction.category?.name || 'Uncategorized';

        if (!acc[categoryName]) {
            acc[categoryName] = {};
        }
        acc[categoryName][monthKey] = (acc[categoryName][monthKey] || 0) + transaction.amount;

        return acc;
    }, {} as Record<string, Record<string, number>>);

    // Generate monthly data for the last 12 months
    const months = eachMonthOfInterval({
        start: subMonths(currentMonth.start, 11),
        end: currentMonth.end
    });

    const monthlyData = months.map(month => ({
        month: format(month, 'MMM yyyy'),
        monthKey: format(month, 'yyyy-MM'),
        amount: expensesByMonth[format(month, 'yyyy-MM')] || 0
    }));

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
        }).format(amount);
    };

    // Calculate trend metrics
    const totalExpenses = monthlyData.reduce((sum, month) => sum + month.amount, 0);
    const averageMonthlyExpenses = totalExpenses / months.length;

    // Calculate month-over-month changes
    const monthlyChanges = monthlyData.map((month, index) => {
        if (index === 0) return { ...month, change: 0, changePercent: 0 };
        const previousAmount = monthlyData[index - 1].amount;
        const change = month.amount - previousAmount;
        const changePercent = previousAmount > 0 ? (change / previousAmount) * 100 : 0;
        return { ...month, change, changePercent };
    });

    // Identify spending trends
    const increasingMonths = monthlyChanges.filter(m => m.change > 0).length;
    const decreasingMonths = monthlyChanges.filter(m => m.change < 0).length;
    const trendDirection = increasingMonths > decreasingMonths ? 'increasing' :
        decreasingMonths > increasingMonths ? 'decreasing' : 'stable';

    // Calculate volatility (coefficient of variation)
    const monthlyAmounts = monthlyData.map(m => m.amount).filter(amount => amount > 0);
    const mean = monthlyAmounts.reduce((sum, amount) => sum + amount, 0) / monthlyAmounts.length;
    const variance = monthlyAmounts.reduce((sum, amount) => sum + Math.pow(amount - mean, 2), 0) / monthlyAmounts.length;
    const standardDeviation = Math.sqrt(variance);
    const volatility = mean > 0 ? (standardDeviation / mean) * 100 : 0;

    // Find top trending categories (most increased spending)
    const categoryMonthlyTotals = Object.entries(categoryTrends).map(([category, monthlyData]) => {
        const months = Object.keys(monthlyData);
        const firstMonth = months[0];
        const lastMonth = months[months.length - 1];
        const firstAmount = monthlyData[firstMonth] || 0;
        const lastAmount = monthlyData[lastMonth] || 0;
        const change = lastAmount - firstAmount;
        const changePercent = firstAmount > 0 ? (change / firstAmount) * 100 : 0;

        return {
            category,
            firstAmount,
            lastAmount,
            change,
            changePercent,
            total: Object.values(monthlyData).reduce((sum, amount) => sum + amount, 0)
        };
    });

    const trendingUpCategories = categoryMonthlyTotals
        .filter(cat => cat.change > 0)
        .sort((a, b) => b.changePercent - a.changePercent)
        .slice(0, 3);

    const trendingDownCategories = categoryMonthlyTotals
        .filter(cat => cat.change < 0)
        .sort((a, b) => a.changePercent - b.changePercent)
        .slice(0, 3);

    return (
        <div className="space-y-6">
            {/* Expense Trends Overview */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <LineChart className="h-5 w-5" />
                        Expense Trends Overview (Last 12 Months)
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="text-center">
                            <p className="text-sm text-muted-foreground">Total Expenses</p>
                            <p className="text-2xl font-bold text-red-600">{formatCurrency(totalExpenses)}</p>
                        </div>
                        <div className="text-center">
                            <p className="text-sm text-muted-foreground">Avg Monthly</p>
                            <p className="text-2xl font-bold text-orange-600">{formatCurrency(averageMonthlyExpenses)}</p>
                        </div>
                        <div className="text-center">
                            <p className="text-sm text-muted-foreground">Trend Direction</p>
                            <p className={`text-2xl font-bold ${trendDirection === 'increasing' ? 'text-red-600' :
                                    trendDirection === 'decreasing' ? 'text-green-600' : 'text-blue-600'
                                }`}>
                                {trendDirection === 'increasing' ? '↗️' :
                                    trendDirection === 'decreasing' ? '↘️' : '→'} {trendDirection}
                            </p>
                        </div>
                        <div className="text-center">
                            <p className="text-sm text-muted-foreground">Spending Volatility</p>
                            <p className={`text-2xl font-bold ${volatility < 20 ? 'text-green-600' :
                                    volatility < 40 ? 'text-yellow-600' : 'text-red-600'
                                }`}>
                                {volatility.toFixed(1)}%
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Monthly Expense Trend */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Calendar className="h-5 w-5" />
                        Monthly Expense Trend
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {monthlyChanges.map((month) => {
                            const percentageOfAverage = averageMonthlyExpenses > 0 ?
                                (month.amount / averageMonthlyExpenses) * 100 : 0;

                            return (
                                <div key={month.monthKey} className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <span className="w-24 text-sm font-medium">{month.month}</span>
                                        <div className="flex-1 max-w-xs">
                                            <Progress
                                                value={Math.min(percentageOfAverage, 100)}
                                                className="h-3"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-sm font-semibold min-w-[80px] text-right">
                                            {formatCurrency(month.amount)}
                                        </span>
                                        {month.change !== 0 && (
                                            <Badge
                                                variant={month.change > 0 ? "destructive" : "default"}
                                                className="text-xs flex items-center gap-1"
                                            >
                                                {month.change > 0 ? (
                                                    <TrendingUp className="h-3 w-3" />
                                                ) : (
                                                    <TrendingDown className="h-3 w-3" />
                                                )}
                                                {month.changePercent > 0 ? '+' : ''}{month.changePercent.toFixed(1)}%
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>

            {/* Category Trend Analysis */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5" />
                        Category Spending Trends
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Increasing Categories */}
                        <div>
                            <h4 className="font-medium text-red-600 mb-3 flex items-center gap-2">
                                <TrendingUp className="h-4 w-4" />
                                Spending Increasing
                            </h4>
                            <div className="space-y-3">
                                {trendingUpCategories.map((cat) => (
                                    <div key={cat.category} className="p-3 border rounded-lg">
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="font-medium text-sm">{cat.category}</span>
                                            <Badge variant="destructive" className="text-xs">
                                                +{cat.changePercent.toFixed(1)}%
                                            </Badge>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">
                                                {formatCurrency(cat.firstAmount)} → {formatCurrency(cat.lastAmount)}
                                            </span>
                                            <span className="font-medium">{formatCurrency(cat.change)}</span>
                                        </div>
                                    </div>
                                ))}
                                {trendingUpCategories.length === 0 && (
                                    <p className="text-sm text-muted-foreground text-center py-4">
                                        No categories with increasing spending
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Decreasing Categories */}
                        <div>
                            <h4 className="font-medium text-green-600 mb-3 flex items-center gap-2">
                                <TrendingDown className="h-4 w-4" />
                                Spending Decreasing
                            </h4>
                            <div className="space-y-3">
                                {trendingDownCategories.map((cat) => (
                                    <div key={cat.category} className="p-3 border rounded-lg">
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="font-medium text-sm">{cat.category}</span>
                                            <Badge variant="default" className="text-xs">
                                                {cat.changePercent.toFixed(1)}%
                                            </Badge>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">
                                                {formatCurrency(cat.firstAmount)} → {formatCurrency(cat.lastAmount)}
                                            </span>
                                            <span className="font-medium text-green-600">{formatCurrency(cat.change)}</span>
                                        </div>
                                    </div>
                                ))}
                                {trendingDownCategories.length === 0 && (
                                    <p className="text-sm text-muted-foreground text-center py-4">
                                        No categories with decreasing spending
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Spending Insights & Recommendations */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5" />
                        Spending Insights & Recommendations
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 bg-blue-50 rounded-lg">
                            <h4 className="font-medium text-blue-800 mb-2">Trend Analysis</h4>
                            <p className="text-blue-700 text-sm mb-2">
                                Your spending trend is <strong>{trendDirection}</strong> over the last 12 months
                            </p>
                            <div className="text-xs text-blue-600">
                                <p>• {increasingMonths} months with increased spending</p>
                                <p>• {decreasingMonths} months with decreased spending</p>
                                <p>• {12 - increasingMonths - decreasingMonths} months stable</p>
                            </div>
                        </div>

                        <div className="p-4 bg-yellow-50 rounded-lg">
                            <h4 className="font-medium text-yellow-800 mb-2">Volatility Assessment</h4>
                            <p className="text-yellow-700 text-sm mb-2">
                                Spending volatility: <strong>{volatility.toFixed(1)}%</strong>
                            </p>
                            <p className="text-yellow-600 text-xs">
                                {volatility < 20 ?
                                    'Your spending is very consistent month-to-month' :
                                    volatility < 40 ?
                                        'Your spending has moderate variation' :
                                        'Your spending varies significantly - consider budgeting strategies'
                                }
                            </p>
                        </div>

                        <div className="p-4 bg-red-50 rounded-lg">
                            <h4 className="font-medium text-red-800 mb-2">Areas of Concern</h4>
                            <p className="text-red-700 text-sm">
                                {trendingUpCategories.length > 0 ?
                                    `Monitor these ${trendingUpCategories.length} categories with increasing spending` :
                                    'No categories showing concerning spending increases'
                                }
                            </p>
                        </div>

                        <div className="p-4 bg-green-50 rounded-lg">
                            <h4 className="font-medium text-green-800 mb-2">Positive Changes</h4>
                            <p className="text-green-700 text-sm">
                                {trendingDownCategories.length > 0 ?
                                    `${trendingDownCategories.length} categories showing spending reduction` :
                                    'No categories with reduced spending yet'
                                }
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}