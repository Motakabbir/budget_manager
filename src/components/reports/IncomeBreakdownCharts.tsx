import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { DollarSign, TrendingUp, PieChart, Calendar } from 'lucide-react';
import { useTransactions } from '@/lib/hooks/use-budget-queries';
import { format, startOfMonth, endOfMonth, eachMonthOfInterval, startOfYear } from 'date-fns';

interface IncomeBreakdownChartsProps {
    dateRange?: {
        start: Date;
        end: Date;
    };
}

export function IncomeBreakdownCharts({ dateRange }: IncomeBreakdownChartsProps) {
    const currentMonth = {
        start: startOfMonth(new Date()),
        end: endOfMonth(new Date())
    };

    const { data: transactions = [] } = useTransactions(
        (dateRange?.start || startOfYear(new Date())).toISOString(),
        (dateRange?.end || currentMonth.end).toISOString()
    );

    // Filter only income transactions
    const incomeTransactions = transactions.filter(t => t.type === 'income');

    // Group income by category
    const incomeByCategory = incomeTransactions.reduce((acc, transaction) => {
        const categoryName = transaction.category?.name || 'Uncategorized';
        acc[categoryName] = (acc[categoryName] || 0) + transaction.amount;
        return acc;
    }, {} as Record<string, number>);

    // Group income by month for trend analysis
    const incomeByMonth = incomeTransactions.reduce((acc, transaction) => {
        const monthKey = format(new Date(transaction.date), 'yyyy-MM');
        acc[monthKey] = (acc[monthKey] || 0) + transaction.amount;
        return acc;
    }, {} as Record<string, number>);

    // Calculate monthly averages and trends
    const months = eachMonthOfInterval({
        start: startOfYear(new Date()),
        end: new Date()
    });

    const monthlyData = months.map(month => ({
        month: format(month, 'MMM yyyy'),
        monthKey: format(month, 'yyyy-MM'),
        amount: incomeByMonth[format(month, 'yyyy-MM')] || 0
    }));

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
        }).format(amount);
    };

    // Calculate totals and percentages
    const totalIncome = Object.values(incomeByCategory).reduce((sum, amount) => sum + amount, 0);
    const sortedCategories = Object.entries(incomeByCategory)
        .sort(([, a], [, b]) => b - a);

    // Calculate average monthly income
    const averageMonthlyIncome = monthlyData.reduce((sum, month) => sum + month.amount, 0) / months.length;

    // Calculate income stability (coefficient of variation)
    const monthlyAmounts = monthlyData.map(m => m.amount).filter(amount => amount > 0);
    const mean = monthlyAmounts.reduce((sum, amount) => sum + amount, 0) / monthlyAmounts.length;
    const variance = monthlyAmounts.reduce((sum, amount) => sum + Math.pow(amount - mean, 2), 0) / monthlyAmounts.length;
    const standardDeviation = Math.sqrt(variance);
    const coefficientOfVariation = mean > 0 ? (standardDeviation / mean) * 100 : 0;

    // Identify primary income sources (top 3)
    const primarySources = sortedCategories.slice(0, 3);
    const primarySourcesTotal = primarySources.reduce((sum, [, amount]) => sum + amount, 0);
    const primarySourcesPercentage = totalIncome > 0 ? (primarySourcesTotal / totalIncome) * 100 : 0;

    // Income diversity score (number of categories with meaningful contributions)
    const meaningfulCategories = sortedCategories.filter(([, amount]) => amount > totalIncome * 0.05).length;
    const diversityScore = Math.min(meaningfulCategories * 20, 100); // Max 100, 20 points per category

    return (
        <div className="space-y-6">
            {/* Income Overview */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <DollarSign className="h-5 w-5" />
                        Income Overview
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="text-center">
                            <p className="text-sm text-muted-foreground">Total Income (YTD)</p>
                            <p className="text-2xl font-bold text-green-600">{formatCurrency(totalIncome)}</p>
                        </div>
                        <div className="text-center">
                            <p className="text-sm text-muted-foreground">Avg Monthly Income</p>
                            <p className="text-2xl font-bold text-blue-600">{formatCurrency(averageMonthlyIncome)}</p>
                        </div>
                        <div className="text-center">
                            <p className="text-sm text-muted-foreground">Income Stability</p>
                            <p className={`text-2xl font-bold ${coefficientOfVariation < 20 ? 'text-green-600' : coefficientOfVariation < 40 ? 'text-yellow-600' : 'text-red-600'}`}>
                                {coefficientOfVariation.toFixed(1)}%
                            </p>
                            <p className="text-xs text-muted-foreground">
                                {coefficientOfVariation < 20 ? 'Very Stable' : coefficientOfVariation < 40 ? 'Moderate' : 'Variable'}
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Income Sources Breakdown */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <PieChart className="h-5 w-5" />
                        Income Sources Breakdown
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {sortedCategories.map(([category, amount], index) => {
                            const percentage = (amount / totalIncome) * 100;
                            const colors = ['bg-green-500', 'bg-green-400', 'bg-green-300', 'bg-emerald-400', 'bg-teal-400', 'bg-cyan-400', 'bg-blue-400', 'bg-indigo-400'];

                            return (
                                <div key={category} className="space-y-2">
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-4 h-4 rounded ${colors[index % colors.length]}`} />
                                            <span className="font-medium">{category}</span>
                                            {index < 3 && (
                                                <Badge variant="outline" className="text-xs">
                                                    Primary
                                                </Badge>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="font-semibold">{formatCurrency(amount)}</span>
                                            <span className="text-sm text-muted-foreground">({percentage.toFixed(1)}%)</span>
                                        </div>
                                    </div>
                                    <Progress value={percentage} className="h-2" />
                                </div>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>

            {/* Monthly Income Trend */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5" />
                        Monthly Income Trend
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {monthlyData.map((month, _index) => {
                            const percentageOfAverage = averageMonthlyIncome > 0 ? (month.amount / averageMonthlyIncome) * 100 : 0;
                            return (
                                <div key={month.monthKey} className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <span className="w-20 text-sm font-medium">{month.month}</span>
                                        <div className="flex-1 max-w-xs">
                                            <Progress
                                                value={Math.min(percentageOfAverage, 100)}
                                                className="h-2"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-semibold min-w-[80px] text-right">
                                            {formatCurrency(month.amount)}
                                        </span>
                                        <Badge
                                            variant={
                                                month.amount > averageMonthlyIncome * 1.1 ? "default" :
                                                    month.amount < averageMonthlyIncome * 0.9 ? "destructive" : "secondary"
                                            }
                                            className="text-xs"
                                        >
                                            {percentageOfAverage.toFixed(0)}%
                                        </Badge>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>

            {/* Income Analysis Insights */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Calendar className="h-5 w-5" />
                        Income Analysis Insights
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 bg-green-50 rounded-lg">
                            <h4 className="font-medium text-green-800 mb-2">Primary Income Sources</h4>
                            <p className="text-green-700 text-sm mb-2">
                                Your top 3 income sources account for {primarySourcesPercentage.toFixed(1)}% of total income
                            </p>
                            <div className="space-y-1">
                                {primarySources.map(([category, amount]) => (
                                    <div key={category} className="flex justify-between text-sm">
                                        <span>{category}</span>
                                        <span className="font-medium">{formatCurrency(amount)}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="p-4 bg-blue-50 rounded-lg">
                            <h4 className="font-medium text-blue-800 mb-2">Income Diversity</h4>
                            <div className="flex items-center gap-2 mb-2">
                                <Progress value={diversityScore} className="flex-1 h-2" />
                                <span className="text-sm font-medium">{diversityScore}/100</span>
                            </div>
                            <p className="text-blue-700 text-sm">
                                {meaningfulCategories} significant income sources
                                {meaningfulCategories > 3 ? ' - Well diversified!' : meaningfulCategories > 1 ? ' - Moderately diversified' : ' - Consider diversifying income sources'}
                            </p>
                        </div>

                        <div className="p-4 bg-yellow-50 rounded-lg">
                            <h4 className="font-medium text-yellow-800 mb-2">Income Stability</h4>
                            <p className="text-yellow-700 text-sm mb-2">
                                Monthly variation: {coefficientOfVariation.toFixed(1)}%
                            </p>
                            <p className="text-yellow-600 text-xs">
                                {coefficientOfVariation < 20 ?
                                    'Your income is very stable month-to-month' :
                                    coefficientOfVariation < 40 ?
                                        'Your income has moderate variation' :
                                        'Your income varies significantly - consider building stability'
                                }
                            </p>
                        </div>

                        <div className="p-4 bg-purple-50 rounded-lg">
                            <h4 className="font-medium text-purple-800 mb-2">Growth Opportunities</h4>
                            <p className="text-purple-700 text-sm">
                                {totalIncome > 0 ?
                                    `Average monthly income: ${formatCurrency(averageMonthlyIncome)}` :
                                    'No income data available'
                                }
                            </p>
                            <p className="text-purple-600 text-xs mt-1">
                                Track your income trends to identify growth opportunities
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}