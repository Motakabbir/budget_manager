import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PieChart, Calendar, TrendingUp, DollarSign } from 'lucide-react';
import { useTransactions } from '@/lib/hooks/use-budget-queries';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, subMonths } from 'date-fns';

interface SpendingHeatmapProps {
    dateRange?: {
        start: Date;
        end: Date;
    };
}

export function SpendingHeatmap({ dateRange }: SpendingHeatmapProps) {
    const currentMonth = {
        start: startOfMonth(new Date()),
        end: endOfMonth(new Date())
    };

    const { data: transactions = [] } = useTransactions(
        (dateRange?.start || subMonths(currentMonth.start, 2)).toISOString(),
        (dateRange?.end || currentMonth.end).toISOString()
    );

    // Filter only expenses
    const expenses = transactions.filter(t => t.type === 'expense');

    // Group expenses by category
    const categorySpending = expenses.reduce((acc, transaction) => {
        const categoryName = transaction.category?.name || 'Uncategorized';
        acc[categoryName] = (acc[categoryName] || 0) + transaction.amount;
        return acc;
    }, {} as Record<string, number>);

    // Group expenses by date for calendar heatmap
    const dailySpending = expenses.reduce((acc, transaction) => {
        const date = format(new Date(transaction.date), 'yyyy-MM-dd');
        acc[date] = (acc[date] || 0) + transaction.amount;
        return acc;
    }, {} as Record<string, number>);

    // Calculate spending intensity levels
    const spendingValues = Object.values(dailySpending);
    const maxSpending = Math.max(...spendingValues, 0);
    const minSpending = Math.min(...spendingValues, 0);

    const getIntensityLevel = (amount: number) => {
        if (amount === 0) return 0;
        if (maxSpending === minSpending) return 2;
        const normalized = (amount - minSpending) / (maxSpending - minSpending);
        if (normalized < 0.33) return 1;
        if (normalized < 0.66) return 2;
        return 3;
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
        }).format(amount);
    };

    // Generate calendar data for the last 3 months
    const calendarData = [];
    for (let i = 2; i >= 0; i--) {
        const monthStart = startOfMonth(subMonths(new Date(), i));
        const monthEnd = endOfMonth(subMonths(new Date(), i));
        const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

        calendarData.push({
            month: format(monthStart, 'MMMM yyyy'),
            days: days.map(day => ({
                date: day,
                day: format(day, 'd'),
                spending: dailySpending[format(day, 'yyyy-MM-dd')] || 0,
                intensity: getIntensityLevel(dailySpending[format(day, 'yyyy-MM-dd')] || 0)
            }))
        });
    }

    // Top spending categories
    const topCategories = Object.entries(categorySpending)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5);

    const totalSpending = Object.values(categorySpending).reduce((sum, amount) => sum + amount, 0);

    return (
        <div className="space-y-6">
            {/* Spending Overview */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <PieChart className="h-5 w-5" />
                        Spending Overview
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="text-center">
                            <p className="text-sm text-muted-foreground">Total Expenses</p>
                            <p className="text-2xl font-bold text-red-600">{formatCurrency(totalSpending)}</p>
                        </div>
                        <div className="text-center">
                            <p className="text-sm text-muted-foreground">Avg Daily Spending</p>
                            <p className="text-2xl font-bold text-orange-600">
                                {formatCurrency(totalSpending / Object.keys(dailySpending).length || 0)}
                            </p>
                        </div>
                        <div className="text-center">
                            <p className="text-sm text-muted-foreground">Highest Day</p>
                            <p className="text-2xl font-bold text-red-700">{formatCurrency(maxSpending)}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Top Spending Categories */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5" />
                        Top Spending Categories
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {topCategories.map(([category, amount], index) => {
                            const percentage = (amount / totalSpending) * 100;
                            return (
                                <div key={category} className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <Badge variant="outline">{index + 1}</Badge>
                                        <span className="font-medium">{category}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-24 bg-gray-200 rounded-full h-2">
                                            <div
                                                className="bg-red-500 h-2 rounded-full"
                                                style={{ width: `${percentage}%` }}
                                            />
                                        </div>
                                        <span className="text-sm font-medium min-w-[80px] text-right">
                                            {formatCurrency(amount)}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>

            {/* Spending Calendar Heatmap */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Calendar className="h-5 w-5" />
                        Spending Calendar (Last 3 Months)
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-6">
                        {calendarData.map((monthData) => (
                            <div key={monthData.month}>
                                <h4 className="font-medium mb-3">{monthData.month}</h4>
                                <div className="grid grid-cols-7 gap-1 mb-2">
                                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                                        <div key={day} className="text-xs text-center text-muted-foreground font-medium">
                                            {day}
                                        </div>
                                    ))}
                                </div>
                                <div className="grid grid-cols-7 gap-1">
                                    {/* Add empty cells for days before the first day of the month */}
                                    {Array.from({ length: monthData.days[0].date.getDay() }).map((_, index) => (
                                        <div key={`empty-${index}`} className="aspect-square" />
                                    ))}

                                    {monthData.days.map((day) => (
                                        <div
                                            key={day.date.toISOString()}
                                            className={`
                                                aspect-square rounded-sm flex items-center justify-center text-xs cursor-pointer
                                                hover:ring-2 hover:ring-blue-300 transition-all
                                                ${day.intensity === 0 ? 'bg-gray-100' :
                                                    day.intensity === 1 ? 'bg-red-200' :
                                                        day.intensity === 2 ? 'bg-red-400' : 'bg-red-600'}
                                                ${day.intensity > 0 ? 'text-white' : 'text-gray-400'}
                                            `}
                                            title={`${format(day.date, 'MMM d, yyyy')}: ${formatCurrency(day.spending)}`}
                                        >
                                            {day.day}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Legend */}
                    <div className="flex items-center justify-center gap-4 mt-6 pt-4 border-t">
                        <span className="text-sm text-muted-foreground">Less</span>
                        <div className="flex gap-1">
                            <div className="w-4 h-4 bg-gray-100 rounded-sm" />
                            <div className="w-4 h-4 bg-red-200 rounded-sm" />
                            <div className="w-4 h-4 bg-red-400 rounded-sm" />
                            <div className="w-4 h-4 bg-red-600 rounded-sm" />
                        </div>
                        <span className="text-sm text-muted-foreground">More</span>
                    </div>
                </CardContent>
            </Card>

            {/* Spending Insights */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <DollarSign className="h-5 w-5" />
                        Spending Insights
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        <div className="p-3 bg-blue-50 rounded-lg">
                            <p className="font-medium text-blue-800">Highest Spending Day:</p>
                            <p className="text-blue-700">
                                {Object.entries(dailySpending).reduce((max, [date, amount]) =>
                                    amount > max.amount ? { date, amount } : max,
                                    { date: '', amount: 0 }
                                ).date ? format(new Date(Object.entries(dailySpending).reduce((max, [date, amount]) =>
                                    amount > max.amount ? { date, amount } : max,
                                    { date: '', amount: 0 }
                                ).date), 'MMMM d, yyyy') : 'No expenses'} - {formatCurrency(maxSpending)}
                            </p>
                        </div>
                        <div className="p-3 bg-green-50 rounded-lg">
                            <p className="font-medium text-green-800">Most Active Category:</p>
                            <p className="text-green-700">
                                {topCategories[0]?.[0] || 'No expenses'} ({formatCurrency(topCategories[0]?.[1] || 0)})
                            </p>
                        </div>
                        <div className="p-3 bg-yellow-50 rounded-lg">
                            <p className="font-medium text-yellow-800">Spending Pattern:</p>
                            <p className="text-yellow-700">
                                {Object.keys(dailySpending).length > 0 ?
                                    `Average of ${formatCurrency(totalSpending / Object.keys(dailySpending).length)} per spending day` :
                                    'No spending data available'
                                }
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}