import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useBudgetStore } from '@/lib/store';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    LineChart,
    Line,
} from 'recharts';
import { format, startOfMonth, endOfMonth, subMonths, startOfYear, endOfYear, startOfDay, endOfDay } from 'date-fns';
import { DollarSign, TrendingUp, TrendingDown, Wallet, Download, Calendar, Filter } from 'lucide-react';
import { exportMonthlyReport } from '@/lib/utils/export';

export default function DashboardPage() {
    const { transactions, categories, fetchTransactions, fetchCategories } = useBudgetStore();
    const [loading, setLoading] = useState(true);
    const [timePeriod, setTimePeriod] = useState<'day' | 'month' | 'year' | 'all'>('month');

    useEffect(() => {
        const loadData = async () => {
            await Promise.all([fetchTransactions(), fetchCategories()]);
            setLoading(false);
        };
        loadData();
    }, [fetchTransactions, fetchCategories]);

    // Filter transactions based on time period
    const getFilteredTransactions = () => {
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
            case 'all':
            default:
                return transactions;
        }

        return transactions.filter((t) => {
            const transDate = new Date(t.date);
            return transDate >= start && transDate <= end;
        });
    };

    const filteredTransactions = getFilteredTransactions();

    // Calculate totals
    const totalIncome = filfilteredTeredTransactions
        .filter((t) => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);

    const totalExpenses = filteredTransactions
        .filter((t) => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

    const balance = totalIncome - totalExpenses;

    // Category breakdown for expenses
    const expenseCategoryData = categories
        .filter((c) => c.type === 'expense')
        .map((category) => {
            const categoryTotal = filteredTransactions
            .filter((t) => t.category_id === category.id)
            .reduce((sum, t) => sum + t.amount, 0);

        return {
            name: category.name,
            value: categoryTotal,
            color: category.color,
        };
    }).filter((item) => item.value > 0);

    // Monthly trend data (last 6 months)
    const monthlyData = Array.from({ length: 6 }, (_, i) => {
        const date = subMonths(new Date(), 5 - i);
        const monthStart = startOfMonth(date);
        const monthEnd = endOfMonth(date);

        const monthTransactions = transactions.filter((t) => {
            const transDate = new Date(t.date);
            return transDate >= monthStart && transDate <= monthEnd;
        });

        const income = monthTransactions
            .filter((t) => t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0);

        const expenses = monthTransactions
            .filter((t) => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0);

        return {
            month: format(date, 'MMM yyyy'),
            income,
            expenses,
            balance: income - expenses,
        };
    });

    const getTimePeriodLabel = () => {
        const now = new Date();
        switch (timePeriod) {
            case 'day':
                return format(now, 'MMMM dd, yyyy');
            case 'month':
                return format(now, 'MMMM yyyy');
            case 'year':
                return format(now, 'yyyy');
            case 'all':
            default:
                return 'All Time';
        }
    };

    const handleExportPDF = () => {
        exportMonthlyReport(transactions, categories);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <div className="text-center space-y-4">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary mx-auto"></div>
                    <p className="text-muted-foreground">Loading your financial data...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 p-4 sm:p-6 lg:p-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl sm:text-4xl font-bold bg-linear-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                        Dashboard
                    </h1>
                    <p className="text-muted-foreground mt-1">Overview of your finances</p>
                </div>
                <Button onClick={handleExportPDF} variant="outline" className="w-full sm:w-auto">
                    <Download className="mr-2 h-4 w-4" />
                    <span className="hidden sm:inline">Export Report (PDF)</span>
                    <span className="sm:hidden">Export</span>
                </Button>
            </div>

            {/* Time Period Filter */}
            <Card className="shadow-lg">
                <CardContent className="pt-6">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-2">
                            <Calendar className="h-5 w-5 text-muted-foreground" />
                            <div>
                                <p className="text-sm font-medium">Time Period</p>
                                <p className="text-xs text-muted-foreground">{getTimePeriodLabel()}</p>
                            </div>
                        </div>
                        <Tabs value={timePeriod} onValueChange={(value: any) => setTimePeriod(value)} className="w-full sm:w-auto">
                            <TabsList className="grid w-full grid-cols-4">
                                <TabsTrigger value="day">Today</TabsTrigger>
                                <TabsTrigger value="month">Month</TabsTrigger>
                                <TabsTrigger value="year">Year</TabsTrigger>
                                <TabsTrigger value="all">All</TabsTrigger>
                            </TabsList>
                        </Tabs>
                    </div>
                </CardContent>
            </Card>

            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="overflow-hidden border-2 shadow-lg hover:shadow-xl transition-shadow duration-300">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-linear-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
                        <CardTitle className="text-sm font-medium">Total Balance</CardTitle>
                        <Wallet className="h-5 w-5 text-blue-600" />
                    </CardHeader>
                    <CardContent className="pt-4">
                        <div className={`text-2xl sm:text-3xl font-bold ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            ${balance.toFixed(2)}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">Current balance</p>
                    </CardContent>
                </Card>

                <Card className="overflow-hidden border-2 shadow-lg hover:shadow-xl transition-shadow duration-300">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-linear-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20">
                        <CardTitle className="text-sm font-medium">Total Income</CardTitle>
                        <TrendingUp className="h-5 w-5 text-green-600" />
                    </CardHeader>
                    <CardContent className="pt-4">
                        <div className="text-2xl sm:text-3xl font-bold text-green-600">
                            ${totalIncome.toFixed(2)}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">All time income</p>
                    </CardContent>
                </Card>

                <Card className="overflow-hidden border-2 shadow-lg hover:shadow-xl transition-shadow duration-300">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-linear-to-br from-red-50 to-rose-50 dark:from-red-950/20 dark:to-rose-950/20">
                        <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
                        <TrendingDown className="h-5 w-5 text-red-600" />
                    </CardHeader>
                    <CardContent className="pt-4">
                        <div className="text-2xl sm:text-3xl font-bold text-red-600">
                            ${totalExpenses.toFixed(2)}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">All time expenses</p>
                    </CardContent>
                </Card>

                <Card className="overflow-hidden border-2 shadow-lg hover:shadow-xl transition-shadow duration-300">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-linear-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20">
                        <CardTitle className="text-sm font-medium">Transactions</CardTitle>
                        <DollarSign className="h-5 w-5 text-purple-600" />
                    </CardHeader>
                    <CardContent className="pt-4">
                        <div className="text-2xl sm:text-3xl font-bold">{filteredTransactions.length}</div>
                        <p className="text-xs text-muted-foreground mt-1">Total transactions</p>
                    </CardContent>
                </Card>
            </div>

            {/* Top Spending Categories */}
            {topCategories.length > 0 && (
                <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Filter className="h-5 w-5" />
                            Top Spending Categories
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {highestSpendingCategory && (
                                <div className="p-4 bg-red-50 dark:bg-red-950/20 rounded-lg border-2 border-red-200 dark:border-red-900">
                                    <p className="text-sm text-muted-foreground mb-1">Highest Spending</p>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div
                                                className="w-4 h-4 rounded-full"
                                                style={{ backgroundColor: highestSpendingCategory.color }}
                                            />
                                            <span className="font-semibold text-lg">{highestSpendingCategory.name}</span>
                                        </div>
                                        <span className="text-2xl font-bold text-red-600">
                                            ${highestSpendingCategory.value.toFixed(2)}
                                        </span>
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-2">
                                        {((highestSpendingCategory.value / totalExpenses) * 100).toFixed(1)}% of total expenses
                                    </p>
                                </div>
                            )}
                            <div className="space-y-3">
                                {topCategories.map((category, index) => {
                                    const percentage = (category.value / totalExpenses) * 100;
                                    return (
                                        <div key={category.name} className="space-y-2">
                                            <div className="flex items-center justify-between text-sm">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-muted-foreground w-4">{index + 1}.</span>
                                                    <div
                                                        className="w-3 h-3 rounded-full"
                                                        style={{ backgroundColor: category.color }}
                                                    />
                                                    <span className="font-medium">{category.name}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-muted-foreground">{percentage.toFixed(1)}%</span>
                                                    <span className="font-semibold">${category.value.toFixed(2)}</span>
                                                </div>
                                            </div>
                                            <div className="w-full bg-muted rounded-full h-2">
                                                <div
                                                    className="h-2 rounded-full transition-all duration-300"
                                                    style={{
                                                        width: `${percentage}%`,
                                                        backgroundColor: category.color,
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Charts */}
            <div className="grid gap-6 md:grid-cols-2">
                {/* Income vs Expenses Bar Chart */}
                <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
                    <CardHeader>
                        <CardTitle className="text-lg">Income vs Expenses</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={monthlyData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="month" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="income" fill="#22c55e" name="Income" />
                                <Bar dataKey="expenses" fill="#ef4444" name="Expenses" />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Category Breakdown Pie Chart */}
                <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
                    <CardHeader>
                        <CardTitle className="text-lg">Category Breakdown</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={categoryData}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={(entry: any) => `${entry.name}: ${(entry.percent * 100).toFixed(0)}%`}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    dataKey="value"
                                >
                                    {categoryData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Balance Trend Line Chart */}
                <Card className="md:col-span-2 shadow-lg hover:shadow-xl transition-shadow duration-300">
                    <CardHeader>
                        <CardTitle className="text-lg">Balance Trend</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={monthlyData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="month" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Line
                                    type="monotone"
                                    dataKey="balance"
                                    stroke="#3b82f6"
                                    name="Balance"
                                    strokeWidth={2}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
