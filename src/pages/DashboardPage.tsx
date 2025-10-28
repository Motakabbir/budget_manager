import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
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
    AreaChart,
    Area,
    RadialBarChart,
    RadialBar,
    ComposedChart,
} from 'recharts';
import { format, startOfMonth, endOfMonth, subMonths, startOfYear, endOfYear, startOfDay, endOfDay } from 'date-fns';
import { DollarSign, TrendingUp, TrendingDown, Wallet, Download, Calendar, Filter, PiggyBank, AlertCircle, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { exportMonthlyReport } from '@/lib/utils/export';

export default function DashboardPage() {
    const { transactions, categories, fetchTransactions, fetchCategories, userSettings, fetchUserSettings } = useBudgetStore();
    const [loading, setLoading] = useState(true);
    const [timePeriod, setTimePeriod] = useState<'day' | 'month' | 'year' | 'all' | 'custom'>('month');
    const [customDateRange, setCustomDateRange] = useState<{
        from: Date | undefined;
        to: Date | undefined;
    }>({ from: undefined, to: undefined });

    useEffect(() => {
        const loadData = async () => {
            await Promise.all([fetchTransactions(), fetchCategories(), fetchUserSettings()]);
            setLoading(false);
        };
        loadData();
    }, [fetchTransactions, fetchCategories, fetchUserSettings]);

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
            case 'custom':
                if (!customDateRange.from) return transactions;
                start = startOfDay(customDateRange.from);
                end = customDateRange.to ? endOfDay(customDateRange.to) : endOfDay(customDateRange.from);
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
    const totalIncome = filteredTransactions
        .filter((t) => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);

    const totalExpenses = filteredTransactions
        .filter((t) => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

    const openingBalance = userSettings?.opening_balance || 0;
    const balance = openingBalance + totalIncome - totalExpenses;
    const netChange = totalIncome - totalExpenses;

    // Category breakdown for expenses
    const expenseCategoryData = categories
        .filter((c) => c.type === 'expense')
        .map((category) => {
            const categoryTotal = filteredTransactions
                .filter((t) => t.category_id === category.id && t.type === 'expense')
                .reduce((sum, t) => sum + t.amount, 0);

            return {
                name: category.name,
                value: categoryTotal,
                color: category.color,
            };
        })
        .filter((item) => item.value > 0)
        .sort((a, b) => b.value - a.value);

    // Top spending categories
    const topCategories = expenseCategoryData.slice(0, 5);
    const highestSpendingCategory = expenseCategoryData[0];

    // Category breakdown for pie chart (all categories with transactions)
    const categoryData = categories.map((category) => {
        const categoryTotal = filteredTransactions
            .filter((t) => t.category_id === category.id)
            .reduce((sum, t) => sum + t.amount, 0);

        return {
            name: category.name,
            value: categoryTotal,
            color: category.color,
        };
    }).filter((item) => item.value > 0);

    // Current month data
    const currentMonthStart = startOfMonth(new Date());
    const currentMonthEnd = endOfMonth(new Date());
    const currentMonthTransactions = transactions.filter((t) => {
        const transDate = new Date(t.date);
        return transDate >= currentMonthStart && transDate <= currentMonthEnd;
    });

    const currentMonthIncome = currentMonthTransactions
        .filter((t) => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);

    const currentMonthExpenses = currentMonthTransactions
        .filter((t) => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

    const currentMonthSavings = currentMonthIncome - currentMonthExpenses;

    // Monthly trend data (last 12 months)
    const monthlyData = Array.from({ length: 12 }, (_, i) => {
        const date = subMonths(new Date(), 11 - i);
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

        const savings = income - expenses;

        return {
            month: format(date, 'MMM yyyy'),
            shortMonth: format(date, 'MMM'),
            income,
            expenses,
            savings,
            balance: income - expenses,
        };
    });

    // Calculate overall savings and analytics
    const totalSavings = monthlyData.reduce((sum, month) => sum + month.savings, 0);
    const averageMonthlySavings = totalSavings / monthlyData.length;

    // 12-month totals
    const total12MonthIncome = monthlyData.reduce((sum, month) => sum + month.income, 0);
    const total12MonthExpenses = monthlyData.reduce((sum, month) => sum + month.expenses, 0);
    const total12MonthSavings = total12MonthIncome - total12MonthExpenses;

    // Find month with highest expense
    const highestExpenseMonth = monthlyData.reduce((max, month) =>
        month.expenses > max.expenses ? month : max
        , monthlyData[0]);

    // Find month with highest income
    const highestIncomeMonth = monthlyData.reduce((max, month) =>
        month.income > max.income ? month : max
        , monthlyData[0]);

    // Find month with best savings
    const bestSavingsMonth = monthlyData.reduce((max, month) =>
        month.savings > max.savings ? month : max
        , monthlyData[0]);

    // Calculate savings rate
    const totalIncomeAllTime = transactions
        .filter((t) => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);

    const savingsRate = totalIncomeAllTime > 0 ? (totalSavings / totalIncomeAllTime) * 100 : 0;

    // Income breakdown by category
    const incomeCategoryData = categories
        .filter((c) => c.type === 'income')
        .map((category) => {
            const categoryTotal = filteredTransactions
                .filter((t) => t.category_id === category.id && t.type === 'income')
                .reduce((sum, t) => sum + t.amount, 0);

            return {
                name: category.name,
                value: categoryTotal,
                color: category.color,
                percentage: totalIncome > 0 ? (categoryTotal / totalIncome) * 100 : 0,
            };
        })
        .filter((item) => item.value > 0)
        .sort((a, b) => b.value - a.value);

    // Cumulative balance over time
    const cumulativeData: Array<typeof monthlyData[0] & { cumulativeBalance: number }> = [];
    monthlyData.forEach((month, index) => {
        const previousBalance = index === 0 ? openingBalance : cumulativeData[index - 1].cumulativeBalance;
        const cumulativeBalance = previousBalance + month.savings;
        cumulativeData.push({
            ...month,
            cumulativeBalance,
        });
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
            case 'custom':
                if (customDateRange.from) {
                    const from = format(customDateRange.from, 'MMM dd, yyyy');
                    const to = customDateRange.to ? format(customDateRange.to, 'MMM dd, yyyy') : from;
                    return `${from} - ${to}`;
                }
                return 'Select Date Range';
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
                        <Tabs value={timePeriod} onValueChange={(value) => setTimePeriod(value as typeof timePeriod)} className="w-full sm:w-auto">
                            <TabsList className="grid w-full grid-cols-5">
                                <TabsTrigger value="day">Today</TabsTrigger>
                                <TabsTrigger value="month">Month</TabsTrigger>
                                <TabsTrigger value="year">Year</TabsTrigger>
                                <TabsTrigger value="custom">Custom</TabsTrigger>
                                <TabsTrigger value="all">All</TabsTrigger>
                            </TabsList>
                        </Tabs>
                    </div>
                    {timePeriod === 'custom' && (
                        <div className="mt-4 pt-4 border-t">
                            <Label className="text-sm font-medium mb-3 block">Select Date Range</Label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <Label className="text-xs text-muted-foreground mb-2 block">From Date</Label>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button variant="outline" className="w-full justify-start text-left font-normal">
                                                <Calendar className="mr-2 h-4 w-4" />
                                                {customDateRange.from ? format(customDateRange.from, 'PPP') : 'Pick start date'}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0" align="start">
                                            <CalendarComponent
                                                mode="single"
                                                selected={customDateRange.from}
                                                onSelect={(date) => setCustomDateRange({ ...customDateRange, from: date })}
                                                initialFocus
                                            />
                                        </PopoverContent>
                                    </Popover>
                                </div>
                                <div>
                                    <Label className="text-xs text-muted-foreground mb-2 block">To Date</Label>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button variant="outline" className="w-full justify-start text-left font-normal">
                                                <Calendar className="mr-2 h-4 w-4" />
                                                {customDateRange.to ? format(customDateRange.to, 'PPP') : 'Pick end date'}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0" align="start">
                                            <CalendarComponent
                                                mode="single"
                                                selected={customDateRange.to}
                                                onSelect={(date) => setCustomDateRange({ ...customDateRange, to: date })}
                                                disabled={(date) => customDateRange.from ? date < customDateRange.from : false}
                                                initialFocus
                                            />
                                        </PopoverContent>
                                    </Popover>
                                </div>
                            </div>
                            {customDateRange.from && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="mt-3 w-full"
                                    onClick={() => setCustomDateRange({ from: undefined, to: undefined })}
                                >
                                    Clear Date Range
                                </Button>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* 12 Months Summary Cards */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card className="overflow-hidden border-2 shadow-lg hover:shadow-xl transition-shadow duration-300">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-linear-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20">
                        <CardTitle className="text-sm font-medium">12-Month Income</CardTitle>
                        <TrendingUp className="h-5 w-5 text-green-600" />
                    </CardHeader>
                    <CardContent className="pt-4">
                        <div className="text-2xl sm:text-3xl font-bold text-green-600">
                            ${total12MonthIncome.toFixed(2)}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Avg: ${(total12MonthIncome / 12).toFixed(2)}/month
                        </p>
                        <div className="mt-2 flex items-center gap-1 text-xs text-green-600">
                            <ArrowUpRight className="h-3 w-3" />
                            Last 12 months total
                        </div>
                    </CardContent>
                </Card>

                <Card className="overflow-hidden border-2 shadow-lg hover:shadow-xl transition-shadow duration-300">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-linear-to-br from-red-50 to-rose-50 dark:from-red-950/20 dark:to-rose-950/20">
                        <CardTitle className="text-sm font-medium">12-Month Expenses</CardTitle>
                        <TrendingDown className="h-5 w-5 text-red-600" />
                    </CardHeader>
                    <CardContent className="pt-4">
                        <div className="text-2xl sm:text-3xl font-bold text-red-600">
                            ${total12MonthExpenses.toFixed(2)}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Avg: ${(total12MonthExpenses / 12).toFixed(2)}/month
                        </p>
                        <div className="mt-2 flex items-center gap-1 text-xs text-red-600">
                            <ArrowDownRight className="h-3 w-3" />
                            Last 12 months total
                        </div>
                    </CardContent>
                </Card>

                <Card className="overflow-hidden border-2 shadow-lg hover:shadow-xl transition-shadow duration-300">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-linear-to-br from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20">
                        <CardTitle className="text-sm font-medium">12-Month Savings</CardTitle>
                        <PiggyBank className="h-5 w-5 text-blue-600" />
                    </CardHeader>
                    <CardContent className="pt-4">
                        <div className={`text-2xl sm:text-3xl font-bold ${total12MonthSavings >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                            ${total12MonthSavings.toFixed(2)}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Avg: ${(total12MonthSavings / 12).toFixed(2)}/month
                        </p>
                        <div className="mt-2 flex items-center gap-1 text-xs text-blue-600">
                            <PiggyBank className="h-3 w-3" />
                            {((total12MonthSavings / total12MonthIncome) * 100).toFixed(1)}% savings rate
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Month-wise Breakdown Cards (Last 12 Months) */}
            <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Calendar className="h-5 w-5" />
                        Monthly Breakdown (Last 12 Months)
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {monthlyData.map((month, index) => {
                            const savingsPositive = month.savings >= 0;
                            return (
                                <Card key={index} className="overflow-hidden border shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105">
                                    <CardHeader className="pb-3 bg-linear-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
                                        <CardTitle className="text-sm font-semibold text-center">
                                            {month.month}
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="pt-4 space-y-2">
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="text-muted-foreground flex items-center gap-1">
                                                <ArrowUpRight className="h-3 w-3 text-green-600" />
                                                Income
                                            </span>
                                            <span className="font-semibold text-green-600">
                                                ${month.income.toFixed(2)}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="text-muted-foreground flex items-center gap-1">
                                                <ArrowDownRight className="h-3 w-3 text-red-600" />
                                                Expenses
                                            </span>
                                            <span className="font-semibold text-red-600">
                                                ${month.expenses.toFixed(2)}
                                            </span>
                                        </div>
                                        <div className="pt-2 border-t">
                                            <div className="flex items-center justify-between text-xs">
                                                <span className="text-muted-foreground flex items-center gap-1">
                                                    <PiggyBank className="h-3 w-3" />
                                                    Savings
                                                </span>
                                                <span className={`font-bold ${savingsPositive ? 'text-blue-600' : 'text-red-600'}`}>
                                                    ${month.savings.toFixed(2)}
                                                </span>
                                            </div>
                                            {month.income > 0 && (
                                                <div className="mt-2">
                                                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                                                        <div
                                                            className={`h-1.5 rounded-full ${savingsPositive ? 'bg-blue-600' : 'bg-red-600'}`}
                                                            style={{
                                                                width: `${Math.min(Math.abs((month.savings / month.income) * 100), 100)}%`,
                                                            }}
                                                        />
                                                    </div>
                                                    <p className="text-xs text-muted-foreground text-center mt-1">
                                                        {((month.savings / month.income) * 100).toFixed(0)}% rate
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>

            {/* Current Month Summary */}
            <Card className="overflow-hidden border-2 shadow-lg hover:shadow-xl transition-shadow duration-300 bg-linear-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-blue-950/20 dark:via-purple-950/20 dark:to-pink-950/20">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-xl">
                        <Calendar className="h-5 w-5" />
                        Current Month - {format(new Date(), 'MMMM yyyy')}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="space-y-1">
                            <p className="text-sm text-muted-foreground">Income</p>
                            <p className="text-2xl font-bold text-green-600 flex items-center gap-1">
                                <ArrowUpRight className="h-5 w-5" />
                                ${currentMonthIncome.toFixed(2)}
                            </p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-sm text-muted-foreground">Expenses</p>
                            <p className="text-2xl font-bold text-red-600 flex items-center gap-1">
                                <ArrowDownRight className="h-5 w-5" />
                                ${currentMonthExpenses.toFixed(2)}
                            </p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-sm text-muted-foreground">Savings</p>
                            <p className={`text-2xl font-bold flex items-center gap-1 ${currentMonthSavings >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                <PiggyBank className="h-5 w-5" />
                                ${currentMonthSavings.toFixed(2)}
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="overflow-hidden border-2 shadow-lg hover:shadow-xl transition-shadow duration-300">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-linear-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
                        <CardTitle className="text-sm font-medium">Current Balance</CardTitle>
                        <Wallet className="h-5 w-5 text-blue-600" />
                    </CardHeader>
                    <CardContent className="pt-4">
                        <div className={`text-2xl sm:text-3xl font-bold ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            ${balance.toFixed(2)}
                        </div>
                        <div className="flex items-center justify-between mt-2">
                            <p className="text-xs text-muted-foreground">Opening: ${openingBalance.toFixed(2)}</p>
                            <p className={`text-xs font-medium ${netChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {netChange >= 0 ? '+' : ''}{netChange.toFixed(2)}
                            </p>
                        </div>
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

            {/* Savings Analytics Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card className="overflow-hidden border-2 shadow-lg hover:shadow-xl transition-shadow duration-300">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-linear-to-br from-green-50 to-teal-50 dark:from-green-950/20 dark:to-teal-950/20">
                        <CardTitle className="text-sm font-medium">Total Savings (12 months)</CardTitle>
                        <PiggyBank className="h-5 w-5 text-green-600" />
                    </CardHeader>
                    <CardContent className="pt-4">
                        <div className={`text-2xl sm:text-3xl font-bold ${totalSavings >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            ${totalSavings.toFixed(2)}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">Avg: ${averageMonthlySavings.toFixed(2)}/month</p>
                    </CardContent>
                </Card>

                <Card className="overflow-hidden border-2 shadow-lg hover:shadow-xl transition-shadow duration-300">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-linear-to-br from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20">
                        <CardTitle className="text-sm font-medium">Savings Rate</CardTitle>
                        <TrendingUp className="h-5 w-5 text-blue-600" />
                    </CardHeader>
                    <CardContent className="pt-4">
                        <div className="text-2xl sm:text-3xl font-bold text-blue-600">
                            {savingsRate.toFixed(1)}%
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">Of total income saved</p>
                    </CardContent>
                </Card>

                <Card className="overflow-hidden border-2 shadow-lg hover:shadow-xl transition-shadow duration-300">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-linear-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20">
                        <CardTitle className="text-sm font-medium">Best Savings Month</CardTitle>
                        <Wallet className="h-5 w-5 text-amber-600" />
                    </CardHeader>
                    <CardContent className="pt-4">
                        <div className="text-2xl sm:text-3xl font-bold text-amber-600">
                            ${bestSavingsMonth.savings.toFixed(2)}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{bestSavingsMonth.month}</p>
                    </CardContent>
                </Card>
            </div>

            {/* Monthly Insights */}
            <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <AlertCircle className="h-5 w-5" />
                        Monthly Insights (Last 12 Months)
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="p-4 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-900">
                            <p className="text-sm text-muted-foreground mb-2">Highest Expense Month</p>
                            <p className="text-xl font-bold text-red-600">{highestExpenseMonth.month}</p>
                            <p className="text-2xl font-bold text-red-600 mt-1">${highestExpenseMonth.expenses.toFixed(2)}</p>
                            <p className="text-xs text-muted-foreground mt-2">⚠️ Peak spending period</p>
                        </div>
                        <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-900">
                            <p className="text-sm text-muted-foreground mb-2">Highest Income Month</p>
                            <p className="text-xl font-bold text-green-600">{highestIncomeMonth.month}</p>
                            <p className="text-2xl font-bold text-green-600 mt-1">${highestIncomeMonth.income.toFixed(2)}</p>
                            <p className="text-xs text-muted-foreground mt-2">💰 Best earning period</p>
                        </div>
                        <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-900">
                            <p className="text-sm text-muted-foreground mb-2">Average Monthly Flow</p>
                            <p className="text-sm text-green-600 font-semibold">Income: ${(monthlyData.reduce((sum, m) => sum + m.income, 0) / 12).toFixed(2)}</p>
                            <p className="text-sm text-red-600 font-semibold">Expenses: ${(monthlyData.reduce((sum, m) => sum + m.expenses, 0) / 12).toFixed(2)}</p>
                            <p className="text-xs text-muted-foreground mt-2">📊 12-month average</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

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
                        <CardTitle className="text-lg">Income vs Expenses (Last 12 Months)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={monthlyData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="shortMonth" />
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
                                    label
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

                {/* Savings Trend Line Chart */}
                <Card className="md:col-span-2 shadow-lg hover:shadow-xl transition-shadow duration-300">
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <PiggyBank className="h-5 w-5" />
                            Monthly Savings Trend (Last 12 Months)
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={monthlyData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="shortMonth" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Line
                                    type="monotone"
                                    dataKey="income"
                                    stroke="#22c55e"
                                    name="Income"
                                    strokeWidth={2}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="expenses"
                                    stroke="#ef4444"
                                    name="Expenses"
                                    strokeWidth={2}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="savings"
                                    stroke="#3b82f6"
                                    name="Savings"
                                    strokeWidth={3}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            {/* Additional Comprehensive Charts */}
            <div className="grid gap-6 md:grid-cols-2">
                {/* Income Category Distribution - Radial Bar Chart */}
                {incomeCategoryData.length > 0 && (
                    <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <TrendingUp className="h-5 w-5 text-green-600" />
                                Income Sources
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={300}>
                                <RadialBarChart
                                    cx="50%"
                                    cy="50%"
                                    innerRadius="10%"
                                    outerRadius="90%"
                                    data={incomeCategoryData.slice(0, 5)}
                                >
                                    <RadialBar
                                        label={{ position: 'insideStart', fill: '#fff' }}
                                        background
                                        dataKey="value"
                                    >
                                        {incomeCategoryData.slice(0, 5).map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </RadialBar>
                                    <Legend iconSize={10} layout="vertical" verticalAlign="middle" align="right" />
                                    <Tooltip />
                                </RadialBarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                )}

                {/* Expense Category Distribution - Donut Chart */}
                {expenseCategoryData.length > 0 && (
                    <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <TrendingDown className="h-5 w-5 text-red-600" />
                                Expense Distribution
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={300}>
                                <PieChart>
                                    <Pie
                                        data={expenseCategoryData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={100}
                                        fill="#8884d8"
                                        dataKey="value"
                                        label
                                    >
                                        {expenseCategoryData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Full Width Charts */}
            <div className="grid gap-6">
                {/* Cumulative Balance Growth - Area Chart */}
                <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Wallet className="h-5 w-5 text-blue-600" />
                            Cumulative Balance Growth (Last 12 Months)
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={350}>
                            <AreaChart data={cumulativeData}>
                                <defs>
                                    <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="shortMonth" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Area
                                    type="monotone"
                                    dataKey="cumulativeBalance"
                                    stroke="#3b82f6"
                                    fillOpacity={1}
                                    fill="url(#colorBalance)"
                                    name="Cumulative Balance"
                                    strokeWidth={3}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Stacked Monthly Breakdown - Composed Chart */}
                <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Filter className="h-5 w-5" />
                            Monthly Financial Breakdown (Last 12 Months)
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={350}>
                            <ComposedChart data={monthlyData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="shortMonth" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="income" stackId="a" fill="#22c55e" name="Income" />
                                <Bar dataKey="expenses" stackId="b" fill="#ef4444" name="Expenses" />
                                <Line
                                    type="monotone"
                                    dataKey="savings"
                                    stroke="#3b82f6"
                                    strokeWidth={3}
                                    name="Net Savings"
                                    dot={{ r: 4 }}
                                />
                            </ComposedChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Income vs Expense Comparison Area Chart */}
                <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <ArrowUpRight className="h-5 w-5 text-green-600" />
                            <ArrowDownRight className="h-5 w-5 text-red-600" />
                            Income vs Expense Flow
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={350}>
                            <AreaChart data={monthlyData}>
                                <defs>
                                    <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#22c55e" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="#22c55e" stopOpacity={0.1} />
                                    </linearGradient>
                                    <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0.1} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="shortMonth" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Area
                                    type="monotone"
                                    dataKey="income"
                                    stroke="#22c55e"
                                    fillOpacity={1}
                                    fill="url(#colorIncome)"
                                    name="Income"
                                    strokeWidth={2}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="expenses"
                                    stroke="#ef4444"
                                    fillOpacity={1}
                                    fill="url(#colorExpense)"
                                    name="Expenses"
                                    strokeWidth={2}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
