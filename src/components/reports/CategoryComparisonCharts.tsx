import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart3, TrendingUp, PieChart, DollarSign } from 'lucide-react';
import { useTransactions } from '@/lib/hooks/use-budget-queries';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';

interface CategoryComparisonChartsProps {
    dateRange?: {
        start: Date;
        end: Date;
    };
}

export function CategoryComparisonCharts({ dateRange }: CategoryComparisonChartsProps) {
    const currentMonth = {
        start: startOfMonth(new Date()),
        end: endOfMonth(new Date())
    };

    const previousMonth = {
        start: startOfMonth(subMonths(new Date(), 1)),
        end: endOfMonth(subMonths(new Date(), 1))
    };

    const { data: currentTransactions = [] } = useTransactions(
        (dateRange?.start || currentMonth.start).toISOString(),
        (dateRange?.end || currentMonth.end).toISOString()
    );

    const { data: previousTransactions = [] } = useTransactions(
        previousMonth.start.toISOString(),
        previousMonth.end.toISOString()
    );

    // Group transactions by category and type
    const getCategoryData = (transactions: typeof currentTransactions) => {
        const expenses = transactions.filter(t => t.type === 'expense');
        const income = transactions.filter(t => t.type === 'income');

        const expenseByCategory = expenses.reduce((acc, transaction) => {
            const categoryName = transaction.category?.name || 'Uncategorized';
            acc[categoryName] = (acc[categoryName] || 0) + transaction.amount;
            return acc;
        }, {} as Record<string, number>);

        const incomeByCategory = income.reduce((acc, transaction) => {
            const categoryName = transaction.category?.name || 'Uncategorized';
            acc[categoryName] = (acc[categoryName] || 0) + transaction.amount;
            return acc;
        }, {} as Record<string, number>);

        return { expenseByCategory, incomeByCategory };
    };

    const currentData = getCategoryData(currentTransactions);
    const previousData = getCategoryData(previousTransactions);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
        }).format(amount);
    };

    // Calculate totals
    const currentExpenseTotal = Object.values(currentData.expenseByCategory).reduce((sum, amount) => sum + amount, 0);
    const previousExpenseTotal = Object.values(previousData.expenseByCategory).reduce((sum, amount) => sum + amount, 0);
    const currentIncomeTotal = Object.values(currentData.incomeByCategory).reduce((sum, amount) => sum + amount, 0);
    const previousIncomeTotal = Object.values(previousData.incomeByCategory).reduce((sum, amount) => sum + amount, 0);

    // Sort categories by current month expense amount
    const sortedExpenseCategories = Object.entries(currentData.expenseByCategory)
        .sort(([, a], [, b]) => b - a);

    const sortedIncomeCategories = Object.entries(currentData.incomeByCategory)
        .sort(([, a], [, b]) => b - a);

    // Calculate percentage changes
    const getPercentageChange = (current: number, previous: number) => {
        if (previous === 0) return current > 0 ? 100 : 0;
        return ((current - previous) / previous) * 100;
    };

    return (
        <div className="space-y-6">
            {/* Expense Category Comparison */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="h-5 w-5" />
                        Expense Category Comparison
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center text-sm">
                            <span className="font-medium">Total Expenses</span>
                            <div className="flex gap-4">
                                <span className="text-muted-foreground">
                                    {format(previousMonth.start, 'MMM yyyy')}: {formatCurrency(previousExpenseTotal)}
                                </span>
                                <span className="font-semibold">
                                    {format(currentMonth.start, 'MMM yyyy')}: {formatCurrency(currentExpenseTotal)}
                                </span>
                                <Badge variant={currentExpenseTotal > previousExpenseTotal ? "destructive" : "default"}>
                                    {currentExpenseTotal > previousExpenseTotal ? '+' : ''}
                                    {getPercentageChange(currentExpenseTotal, previousExpenseTotal).toFixed(1)}%
                                </Badge>
                            </div>
                        </div>

                        <div className="space-y-3">
                            {sortedExpenseCategories.map(([category, currentAmount]) => {
                                const previousAmount = previousData.expenseByCategory[category] || 0;
                                const percentageChange = getPercentageChange(currentAmount, previousAmount);
                                const percentageOfTotal = (currentAmount / currentExpenseTotal) * 100;

                                return (
                                    <div key={category} className="space-y-2">
                                        <div className="flex justify-between items-center">
                                            <span className="font-medium text-sm">{category}</span>
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm text-muted-foreground">
                                                    {formatCurrency(previousAmount)}
                                                </span>
                                                <span className="text-sm font-semibold">
                                                    {formatCurrency(currentAmount)}
                                                </span>
                                                <Badge
                                                    variant={percentageChange > 0 ? "destructive" : percentageChange < 0 ? "default" : "secondary"}
                                                    className="text-xs"
                                                >
                                                    {percentageChange > 0 ? '+' : ''}{percentageChange.toFixed(1)}%
                                                </Badge>
                                            </div>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-2">
                                            <div
                                                className="bg-red-500 h-2 rounded-full transition-all duration-300"
                                                style={{ width: `${percentageOfTotal}%` }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Income Category Comparison */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5" />
                        Income Category Comparison
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center text-sm">
                            <span className="font-medium">Total Income</span>
                            <div className="flex gap-4">
                                <span className="text-muted-foreground">
                                    {format(previousMonth.start, 'MMM yyyy')}: {formatCurrency(previousIncomeTotal)}
                                </span>
                                <span className="font-semibold">
                                    {format(currentMonth.start, 'MMM yyyy')}: {formatCurrency(currentIncomeTotal)}
                                </span>
                                <Badge variant={currentIncomeTotal > previousIncomeTotal ? "default" : "destructive"}>
                                    {currentIncomeTotal > previousIncomeTotal ? '+' : ''}
                                    {getPercentageChange(currentIncomeTotal, previousIncomeTotal).toFixed(1)}%
                                </Badge>
                            </div>
                        </div>

                        <div className="space-y-3">
                            {sortedIncomeCategories.map(([category, currentAmount]) => {
                                const previousAmount = previousData.incomeByCategory[category] || 0;
                                const percentageChange = getPercentageChange(currentAmount, previousAmount);
                                const percentageOfTotal = (currentAmount / currentIncomeTotal) * 100;

                                return (
                                    <div key={category} className="space-y-2">
                                        <div className="flex justify-between items-center">
                                            <span className="font-medium text-sm">{category}</span>
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm text-muted-foreground">
                                                    {formatCurrency(previousAmount)}
                                                </span>
                                                <span className="text-sm font-semibold">
                                                    {formatCurrency(currentAmount)}
                                                </span>
                                                <Badge
                                                    variant={percentageChange > 0 ? "default" : percentageChange < 0 ? "destructive" : "secondary"}
                                                    className="text-xs"
                                                >
                                                    {percentageChange > 0 ? '+' : ''}{percentageChange.toFixed(1)}%
                                                </Badge>
                                            </div>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-2">
                                            <div
                                                className="bg-green-500 h-2 rounded-full transition-all duration-300"
                                                style={{ width: `${percentageOfTotal}%` }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Category Distribution Pie Chart Visualization */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <PieChart className="h-5 w-5" />
                        Category Distribution
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Expense Distribution */}
                        <div>
                            <h4 className="font-medium mb-3 text-red-600">Expense Distribution</h4>
                            <div className="space-y-2">
                                {sortedExpenseCategories.slice(0, 6).map(([category, amount], index) => {
                                    const percentage = (amount / currentExpenseTotal) * 100;
                                    const colors = ['bg-red-500', 'bg-red-400', 'bg-red-300', 'bg-orange-400', 'bg-yellow-400', 'bg-pink-400'];
                                    return (
                                        <div key={category} className="flex items-center gap-3">
                                            <div className={`w-4 h-4 rounded ${colors[index % colors.length]}`} />
                                            <div className="flex-1 flex justify-between items-center">
                                                <span className="text-sm">{category}</span>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-medium">{formatCurrency(amount)}</span>
                                                    <span className="text-xs text-muted-foreground">({percentage.toFixed(1)}%)</span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                                {sortedExpenseCategories.length > 6 && (
                                    <div className="text-sm text-muted-foreground text-center pt-2">
                                        +{sortedExpenseCategories.length - 6} more categories
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Income Distribution */}
                        <div>
                            <h4 className="font-medium mb-3 text-green-600">Income Distribution</h4>
                            <div className="space-y-2">
                                {sortedIncomeCategories.slice(0, 6).map(([category, amount], index) => {
                                    const percentage = (amount / currentIncomeTotal) * 100;
                                    const colors = ['bg-green-500', 'bg-green-400', 'bg-green-300', 'bg-emerald-400', 'bg-teal-400', 'bg-cyan-400'];
                                    return (
                                        <div key={category} className="flex items-center gap-3">
                                            <div className={`w-4 h-4 rounded ${colors[index % colors.length]}`} />
                                            <div className="flex-1 flex justify-between items-center">
                                                <span className="text-sm">{category}</span>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-medium">{formatCurrency(amount)}</span>
                                                    <span className="text-xs text-muted-foreground">({percentage.toFixed(1)}%)</span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                                {sortedIncomeCategories.length > 6 && (
                                    <div className="text-sm text-muted-foreground text-center pt-2">
                                        +{sortedIncomeCategories.length - 6} more categories
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Key Insights */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <DollarSign className="h-5 w-5" />
                        Category Insights
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-3 bg-blue-50 rounded-lg">
                            <p className="font-medium text-blue-800">Top Expense Category</p>
                            <p className="text-blue-700 text-lg font-semibold">
                                {sortedExpenseCategories[0]?.[0] || 'No expenses'}
                            </p>
                            <p className="text-blue-600 text-sm">
                                {sortedExpenseCategories[0] ? formatCurrency(sortedExpenseCategories[0][1]) : '$0'}
                                ({sortedExpenseCategories[0] ? ((sortedExpenseCategories[0][1] / currentExpenseTotal) * 100).toFixed(1) : '0'}%)
                            </p>
                        </div>

                        <div className="p-3 bg-green-50 rounded-lg">
                            <p className="font-medium text-green-800">Top Income Source</p>
                            <p className="text-green-700 text-lg font-semibold">
                                {sortedIncomeCategories[0]?.[0] || 'No income'}
                            </p>
                            <p className="text-green-600 text-sm">
                                {sortedIncomeCategories[0] ? formatCurrency(sortedIncomeCategories[0][1]) : '$0'}
                                ({sortedIncomeCategories[0] ? ((sortedIncomeCategories[0][1] / currentIncomeTotal) * 100).toFixed(1) : '0'}%)
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}