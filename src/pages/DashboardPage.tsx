import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import {
    useTransactions,
    useCategories,
    useUserSettings,
    useCategoryBudgets,
    useSavingsGoals,
    type Transaction,
    type Category,
} from '@/lib/hooks/use-budget-queries';
import { DashboardSkeleton } from '@/components/loading/LoadingSkeletons';
import { NotificationStatusWidget } from '@/components/dashboard/NotificationStatusWidget';
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
import { DollarSign, TrendingUp, TrendingDown, Wallet, Download, Calendar, Filter, PiggyBank, AlertCircle, ArrowUpRight, ArrowDownRight, Target, Activity, Receipt } from 'lucide-react';
import { exportMonthlyReport } from '@/lib/utils/export';

export default function DashboardPage() {
    // React Query hooks with proper types
    const { data: transactions = [], isLoading: transactionsLoading } = useTransactions();
    const { data: categories = [], isLoading: categoriesLoading } = useCategories();
    const { data: userSettings, isLoading: settingsLoading } = useUserSettings();
    const { data: categoryBudgets = [], isLoading: budgetsLoading } = useCategoryBudgets();
    const { data: savingsGoals = [], isLoading: goalsLoading } = useSavingsGoals();

    const loading = transactionsLoading || categoriesLoading || settingsLoading || budgetsLoading || goalsLoading;

    const [timePeriod, setTimePeriod] = useState<'day' | 'month' | 'year' | 'all' | 'custom'>('month');
    const [customDateRange, setCustomDateRange] = useState<{
        from: Date | undefined;
        to: Date | undefined;
    }>({ from: undefined, to: undefined });

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

    // Expense Trend Analysis
    const expenseTrendData = monthlyData.map((month, index) => {
        // Calculate moving average (3-month window)
        const startIdx = Math.max(0, index - 2);
        const windowData = monthlyData.slice(startIdx, index + 1);
        const movingAvg = windowData.reduce((sum, m) => sum + m.expenses, 0) / windowData.length;

        // Calculate trend vs previous month
        const prevMonthExpenses = index > 0 ? monthlyData[index - 1].expenses : month.expenses;
        const monthOverMonthChange = prevMonthExpenses > 0
            ? ((month.expenses - prevMonthExpenses) / prevMonthExpenses) * 100
            : 0;

        return {
            ...month,
            movingAvg,
            monthOverMonthChange,
        };
    });

    // Calculate overall expense trend (last 6 months vs previous 6 months)
    const recentSixMonths = monthlyData.slice(-6);
    const previousSixMonths = monthlyData.slice(-12, -6);
    const recentAvgExpenses = recentSixMonths.reduce((sum, m) => sum + m.expenses, 0) / 6;
    const previousAvgExpenses = previousSixMonths.length > 0
        ? previousSixMonths.reduce((sum, m) => sum + m.expenses, 0) / previousSixMonths.length
        : recentAvgExpenses;

    const overallExpenseTrend = previousAvgExpenses > 0
        ? ((recentAvgExpenses - previousAvgExpenses) / previousAvgExpenses) * 100
        : 0;

    // Identify spending pattern
    const lastThreeMonths = expenseTrendData.slice(-3);
    const increasingMonths = lastThreeMonths.filter(m => m.monthOverMonthChange > 0).length;
    const decreasingMonths = lastThreeMonths.filter(m => m.monthOverMonthChange < 0).length;

    let spendingPattern: 'increasing' | 'decreasing' | 'stable' = 'stable';
    if (increasingMonths >= 2) spendingPattern = 'increasing';
    else if (decreasingMonths >= 2) spendingPattern = 'decreasing';

    // Category-wise trend analysis
    const categoryTrends = categories
        .filter(c => c.type === 'expense')
        .map(category => {
            const lastThreeMonthsSpending = Array.from({ length: 3 }, (_, i) => {
                const date = subMonths(new Date(), 2 - i);
                const monthStart = startOfMonth(date);
                const monthEnd = endOfMonth(date);
                const monthTransactions = transactions.filter(t => {
                    const transDate = new Date(t.date);
                    return t.category_id === category.id &&
                        t.type === 'expense' &&
                        transDate >= monthStart &&
                        transDate <= monthEnd;
                });
                return monthTransactions.reduce((sum, t) => sum + t.amount, 0);
            });

            const avgSpending = lastThreeMonthsSpending.reduce((sum, val) => sum + val, 0) / 3;
            const trend = lastThreeMonthsSpending[2] > lastThreeMonthsSpending[0] ? 'up' :
                lastThreeMonthsSpending[2] < lastThreeMonthsSpending[0] ? 'down' : 'stable';

            const changePercent = lastThreeMonthsSpending[0] > 0
                ? ((lastThreeMonthsSpending[2] - lastThreeMonthsSpending[0]) / lastThreeMonthsSpending[0]) * 100
                : 0;

            return {
                category,
                avgSpending,
                trend,
                changePercent,
                currentMonth: lastThreeMonthsSpending[2],
            };
        })
        .filter(item => item.avgSpending > 0)
        .sort((a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent));

    // Income Stability Analysis
    const incomeMonthlyValues = monthlyData.map(m => m.income);
    const avgMonthlyIncome = incomeMonthlyValues.reduce((sum, val) => sum + val, 0) / incomeMonthlyValues.length;

    // Calculate standard deviation for income
    const incomeVariance = incomeMonthlyValues.reduce((sum, val) => {
        return sum + Math.pow(val - avgMonthlyIncome, 2);
    }, 0) / incomeMonthlyValues.length;
    const incomeStdDev = Math.sqrt(incomeVariance);

    // Calculate coefficient of variation (lower is more stable)
    const incomeCoeffVariation = avgMonthlyIncome > 0 ? (incomeStdDev / avgMonthlyIncome) * 100 : 0;

    // Stability score (0-100, higher is better)
    // CV < 10% = Excellent (90-100), CV 10-20% = Good (70-89), CV 20-30% = Fair (50-69), CV > 30% = Poor (0-49)
    let stabilityScore = 0;
    if (incomeCoeffVariation < 10) {
        stabilityScore = 90 + (10 - incomeCoeffVariation);
    } else if (incomeCoeffVariation < 20) {
        stabilityScore = 70 + (20 - incomeCoeffVariation) * 2;
    } else if (incomeCoeffVariation < 30) {
        stabilityScore = 50 + (30 - incomeCoeffVariation) * 2;
    } else {
        stabilityScore = Math.max(0, 50 - (incomeCoeffVariation - 30) * 2);
    }
    stabilityScore = Math.min(100, Math.max(0, stabilityScore));

    // Determine stability rating
    let stabilityRating: 'Excellent' | 'Good' | 'Fair' | 'Poor' = 'Poor';
    if (stabilityScore >= 90) stabilityRating = 'Excellent';
    else if (stabilityScore >= 70) stabilityRating = 'Good';
    else if (stabilityScore >= 50) stabilityRating = 'Fair';

    // Income trend (increasing, decreasing, stable)
    const recentIncomeAvg = incomeMonthlyValues.slice(-6).reduce((sum, val) => sum + val, 0) / 6;
    const previousIncomeAvg = incomeMonthlyValues.slice(-12, -6).length > 0
        ? incomeMonthlyValues.slice(-12, -6).reduce((sum, val) => sum + val, 0) / incomeMonthlyValues.slice(-12, -6).length
        : recentIncomeAvg;
    const incomeTrendPercent = previousIncomeAvg > 0
        ? ((recentIncomeAvg - previousIncomeAvg) / previousIncomeAvg) * 100
        : 0;

    // Income source analysis (by category)
    const incomeSourceAnalysis = categories
        .filter(c => c.type === 'income')
        .map(category => {
            const monthlyIncomes = monthlyData.map(month => {
                const monthTransactions = transactions.filter(t => {
                    const transDate = new Date(t.date);
                    const monthStart = startOfMonth(new Date(month.month));
                    const monthEnd = endOfMonth(new Date(month.month));
                    return t.category_id === category.id &&
                        t.type === 'income' &&
                        transDate >= monthStart &&
                        transDate <= monthEnd;
                });
                return monthTransactions.reduce((sum, t) => sum + t.amount, 0);
            });

            const avgIncome = monthlyIncomes.reduce((sum, val) => sum + val, 0) / monthlyIncomes.length;
            const consistencyPercent = monthlyIncomes.filter(val => val > 0).length / monthlyIncomes.length * 100;
            const totalContribution = monthlyIncomes.reduce((sum, val) => sum + val, 0);
            const percentOfTotal = totalIncomeAllTime > 0 ? (totalContribution / totalIncomeAllTime) * 100 : 0;

            return {
                category,
                avgIncome,
                consistencyPercent,
                percentOfTotal,
                isRecurring: consistencyPercent >= 75,
            };
        })
        .filter(item => item.avgIncome > 0)
        .sort((a, b) => b.percentOfTotal - a.percentOfTotal);

    // Find most reliable income source
    const mostReliableSource = incomeSourceAnalysis.reduce((best, current) => {
        if (!best || current.consistencyPercent > best.consistencyPercent) return current;
        return best;
    }, incomeSourceAnalysis[0]);

    // Burn Rate Analysis
    // Calculate average daily, weekly, and monthly burn rate
    const recentThreeMonthsExpenses = monthlyData.slice(-3);
    const avgMonthlyBurnRate = recentThreeMonthsExpenses.reduce((sum, m) => sum + m.expenses, 0) / 3;
    const avgDailyBurnRate = avgMonthlyBurnRate / 30;
    const avgWeeklyBurnRate = avgDailyBurnRate * 7;

    // Calculate net burn rate (expenses minus income)
    const recentThreeMonthsNetBurn = recentThreeMonthsExpenses.reduce((sum, m) => sum + (m.expenses - m.income), 0) / 3;
    const isNetPositive = recentThreeMonthsNetBurn < 0; // Negative burn = saving money

    // Calculate runway (how long current balance will last)
    const currentBalance = balance;
    let daysRemaining = 0;
    let weeksRemaining = 0;
    let monthsRemaining = 0;
    let runwayStatus: 'critical' | 'warning' | 'good' | 'excellent' = 'excellent';

    if (avgDailyBurnRate > 0) {
        if (isNetPositive) {
            // If saving money, runway is infinite
            daysRemaining = Infinity;
            weeksRemaining = Infinity;
            monthsRemaining = Infinity;
            runwayStatus = 'excellent';
        } else {
            // Calculate how long balance will last at current net burn rate
            const netDailyBurn = Math.abs(recentThreeMonthsNetBurn) / 30;
            if (netDailyBurn > 0 && currentBalance > 0) {
                daysRemaining = currentBalance / netDailyBurn;
                weeksRemaining = daysRemaining / 7;
                monthsRemaining = daysRemaining / 30;

                // Determine status
                if (monthsRemaining < 1) runwayStatus = 'critical';
                else if (monthsRemaining < 3) runwayStatus = 'warning';
                else if (monthsRemaining < 6) runwayStatus = 'good';
                else runwayStatus = 'excellent';
            } else {
                daysRemaining = Infinity;
                weeksRemaining = Infinity;
                monthsRemaining = Infinity;
                runwayStatus = 'excellent';
            }
        }
    }

    // Compare current month burn to average
    const currentMonthBurn = currentMonthExpenses;
    const burnRateTrend = avgMonthlyBurnRate > 0
        ? ((currentMonthBurn - avgMonthlyBurnRate) / avgMonthlyBurnRate) * 100
        : 0;

    // Identify highest burning categories (top 3)
    const topBurnCategories = expenseCategoryData.slice(0, 3);

    // Calculate break-even point (income needed to match expenses)
    const breakEvenIncome = avgMonthlyBurnRate;
    const currentIncomeGap = avgMonthlyBurnRate - avgMonthlyIncome;

    // Savings Goals Analysis
    const goalsWithProgress = savingsGoals.map(goal => {
        const progress = goal.target_amount > 0 ? (goal.current_amount / goal.target_amount) * 100 : 0;
        const remaining = goal.target_amount - goal.current_amount;
        const isCompleted = progress >= 100;

        // Calculate time-based progress
        let daysRemaining = 0;
        let daysTotal = 0;
        let timeProgress = 0;
        let isOverdue = false;

        if (goal.deadline) {
            const now = new Date();
            const deadline = new Date(goal.deadline);
            const startDate = now; // Use current date as approximation for start

            daysTotal = 365; // Assume 1 year planning horizon
            daysRemaining = Math.floor((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

            const daysPassed = daysTotal - daysRemaining;
            timeProgress = daysTotal > 0 ? (daysPassed / daysTotal) * 100 : 0;
            isOverdue = daysRemaining < 0 && !isCompleted;
        }

        // Calculate required monthly savings
        const monthsRemaining = daysRemaining > 0 ? daysRemaining / 30 : 0;
        const requiredMonthlySavings = monthsRemaining > 0 ? remaining / monthsRemaining : remaining;

        // Determine if on track
        const isOnTrack = !goal.deadline || progress >= timeProgress || isCompleted;

        return {
            ...goal,
            progress,
            remaining,
            isCompleted,
            daysRemaining,
            timeProgress,
            isOverdue,
            requiredMonthlySavings,
            isOnTrack,
        };
    }).sort((a, b) => {
        // Sort: overdue first, then by progress (incomplete first), then by deadline
        if (a.isOverdue !== b.isOverdue) return a.isOverdue ? -1 : 1;
        if (a.isCompleted !== b.isCompleted) return a.isCompleted ? 1 : -1;
        if (a.daysRemaining !== b.daysRemaining) return a.daysRemaining - b.daysRemaining;
        return 0;
    });

    const activeGoals = goalsWithProgress.filter(g => !g.isCompleted);
    const completedGoals = goalsWithProgress.filter(g => g.isCompleted);
    const totalGoalsAmount = savingsGoals.reduce((sum, g) => sum + g.target_amount, 0);
    const totalSavedTowardsGoals = savingsGoals.reduce((sum, g) => sum + g.current_amount, 0);

    // Forecast Next Month
    // Calculate historical patterns for forecasting
    const last3Months = monthlyData.slice(-3);
    const last6Months = monthlyData.slice(-6);
    const last12Months = monthlyData;

    // Income Forecast - weighted average (more weight to recent months)
    const forecast3MonthIncome = last3Months.reduce((sum, m) => sum + m.income, 0) / 3;
    const forecast6MonthIncome = last6Months.reduce((sum, m) => sum + m.income, 0) / 6;
    const forecast12MonthIncome = last12Months.reduce((sum, m) => sum + m.income, 0) / 12;
    const forecastedIncome = (forecast3MonthIncome * 0.5) + (forecast6MonthIncome * 0.3) + (forecast12MonthIncome * 0.2);

    // Expense Forecast - weighted average
    const forecast3MonthExpenses = last3Months.reduce((sum, m) => sum + m.expenses, 0) / 3;
    const forecast6MonthExpenses = last6Months.reduce((sum, m) => sum + m.expenses, 0) / 6;
    const forecast12MonthExpenses = last12Months.reduce((sum, m) => sum + m.expenses, 0) / 12;
    const forecastedExpenses = (forecast3MonthExpenses * 0.5) + (forecast6MonthExpenses * 0.3) + (forecast12MonthExpenses * 0.2);

    // Calculate forecast confidence based on income/expense stability
    const forecastIncomeVariance = last3Months.reduce((sum, m) => sum + Math.pow(m.income - forecast3MonthIncome, 2), 0) / 3;
    const forecastIncomeStability = forecastIncomeVariance === 0 ? 100 : Math.max(0, 100 - (Math.sqrt(forecastIncomeVariance) / forecast3MonthIncome * 100));

    const forecastExpenseVariance = last3Months.reduce((sum, m) => sum + Math.pow(m.expenses - forecast3MonthExpenses, 2), 0) / 3;
    const forecastExpenseStability = forecastExpenseVariance === 0 ? 100 : Math.max(0, 100 - (Math.sqrt(forecastExpenseVariance) / forecast3MonthExpenses * 100));

    const forecastConfidence = (forecastIncomeStability + forecastExpenseStability) / 2;
    const confidenceLevel = forecastConfidence >= 80 ? 'High' : forecastConfidence >= 60 ? 'Medium' : 'Low';

    // Forecasted savings and balance
    const forecastedSavings = forecastedIncome - forecastedExpenses;
    const forecastedBalance = balance + forecastedSavings;

    // Income comparison with current month
    const incomeChangeFromCurrent = forecastedIncome - currentMonthIncome;
    const incomeChangePercent = currentMonthIncome > 0 ? (incomeChangeFromCurrent / currentMonthIncome) * 100 : 0;

    // Expense comparison with current month
    const expenseChangeFromCurrent = forecastedExpenses - currentMonthExpenses;
    const expenseChangePercent = currentMonthExpenses > 0 ? (expenseChangeFromCurrent / currentMonthExpenses) * 100 : 0;

    // Category-wise forecast (top spending categories)
    const categoryForecast = categories
        .filter(cat => cat.type === 'expense')
        .map(category => {
            const last3MonthsForCategory = last3Months.map(monthData => {
                const monthStart = startOfMonth(subMonths(new Date(), monthlyData.length - monthlyData.indexOf(monthData) - 1));
                const monthEnd = endOfMonth(monthStart);
                return filteredTransactions
                    .filter(t => t.category_id === category.id &&
                        t.type === 'expense' &&
                        new Date(t.date) >= monthStart &&
                        new Date(t.date) <= monthEnd)
                    .reduce((sum, t) => sum + t.amount, 0);
            });

            const avgSpend = last3MonthsForCategory.reduce((sum, val) => sum + val, 0) / 3;
            return {
                category,
                forecastedAmount: avgSpend,
                percentOfTotal: forecastedExpenses > 0 ? (avgSpend / forecastedExpenses) * 100 : 0,
            };
        })
        .filter(item => item.forecastedAmount > 0)
        .sort((a, b) => b.forecastedAmount - a.forecastedAmount)
        .slice(0, 5);

    // Trend direction
    const forecastTrend = forecastedSavings > currentMonthSavings ? 'improving' :
        forecastedSavings < currentMonthSavings ? 'declining' : 'stable';

    // Actionable insights
    const forecastInsights = [];
    if (forecastedSavings < 0) {
        forecastInsights.push({
            type: 'warning',
            message: `Expected deficit of $${Math.abs(forecastedSavings).toFixed(2)} next month`,
            icon: '⚠️'
        });
    }
    if (expenseChangePercent > 10) {
        forecastInsights.push({
            type: 'warning',
            message: `Expenses expected to increase by ${expenseChangePercent.toFixed(1)}%`,
            icon: '📈'
        });
    }
    if (incomeChangePercent < -10) {
        forecastInsights.push({
            type: 'warning',
            message: `Income expected to decrease by ${Math.abs(incomeChangePercent).toFixed(1)}%`,
            icon: '📉'
        });
    }
    if (forecastedSavings > currentMonthSavings && forecastedSavings > 0) {
        forecastInsights.push({
            type: 'positive',
            message: `Savings expected to improve by $${(forecastedSavings - currentMonthSavings).toFixed(2)}`,
            icon: '✅'
        });
    }
    if (forecastConfidence < 60) {
        forecastInsights.push({
            type: 'info',
            message: 'Low confidence due to irregular spending patterns',
            icon: 'ℹ️'
        });
    }

    // Recurring Transaction Detector
    // Group transactions by similar amounts and categories to detect patterns
    interface RecurringPattern {
        description: string;
        category: typeof categories[0];
        avgAmount: number;
        frequency: 'weekly' | 'bi-weekly' | 'monthly' | 'quarterly';
        transactions: typeof transactions;
        confidence: number;
        dayOfMonth?: number;
        dayOfWeek?: number;
        nextExpectedDate?: Date;
    }

    const detectRecurringTransactions = (): RecurringPattern[] => {
        const patterns: RecurringPattern[] = [];
        const groupedByCategory = new Map<string, typeof transactions>();

        // Group transactions by category and type
        filteredTransactions.forEach(t => {
            const key = `${t.category_id}-${t.type}`;
            if (!groupedByCategory.has(key)) {
                groupedByCategory.set(key, []);
            }
            groupedByCategory.get(key)?.push(t);
        });

        // Analyze each group for recurring patterns
        groupedByCategory.forEach((txns, key) => {
            if (txns.length < 3) return; // Need at least 3 transactions to detect pattern

            const category = categories.find(c => c.id === txns[0].category_id);
            if (!category) return;

            // Group by similar amounts (within 10% tolerance)
            const amountGroups = new Map<number, typeof transactions>();

            txns.forEach(t => {
                let foundGroup = false;
                amountGroups.forEach((group, avgAmount) => {
                    if (Math.abs(t.amount - avgAmount) / avgAmount <= 0.1) {
                        group.push(t);
                        foundGroup = true;
                    }
                });

                if (!foundGroup) {
                    amountGroups.set(t.amount, [t]);
                }
            });

            // Check each amount group for time-based patterns
            amountGroups.forEach((group) => {
                if (group.length < 3) return;

                const sortedDates = group.map(t => new Date(t.date)).sort((a, b) => a.getTime() - b.getTime());
                const intervals: number[] = [];

                for (let i = 1; i < sortedDates.length; i++) {
                    const daysDiff = Math.round((sortedDates[i].getTime() - sortedDates[i - 1].getTime()) / (1000 * 60 * 60 * 24));
                    intervals.push(daysDiff);
                }

                if (intervals.length === 0) return;

                const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
                const intervalVariance = intervals.reduce((sum, val) => sum + Math.pow(val - avgInterval, 2), 0) / intervals.length;
                const intervalStdDev = Math.sqrt(intervalVariance);

                // Calculate confidence based on consistency
                const confidence = Math.max(0, 100 - (intervalStdDev / avgInterval * 100));

                if (confidence < 60) return; // Skip if not confident enough

                // Determine frequency
                let frequency: RecurringPattern['frequency'];
                let dayOfMonth: number | undefined;
                let dayOfWeek: number | undefined;

                if (avgInterval >= 5 && avgInterval <= 9) {
                    frequency = 'weekly';
                    dayOfWeek = sortedDates[sortedDates.length - 1].getDay();
                } else if (avgInterval >= 12 && avgInterval <= 16) {
                    frequency = 'bi-weekly';
                    dayOfWeek = sortedDates[sortedDates.length - 1].getDay();
                } else if (avgInterval >= 25 && avgInterval <= 35) {
                    frequency = 'monthly';
                    const days = sortedDates.map(d => d.getDate());
                    dayOfMonth = Math.round(days.reduce((a, b) => a + b, 0) / days.length);
                } else if (avgInterval >= 85 && avgInterval <= 95) {
                    frequency = 'quarterly';
                    dayOfMonth = sortedDates[sortedDates.length - 1].getDate();
                } else {
                    return; // Doesn't match common patterns
                }

                // Calculate next expected date
                const lastDate = sortedDates[sortedDates.length - 1];
                let nextExpectedDate = new Date(lastDate);

                switch (frequency) {
                    case 'weekly':
                        nextExpectedDate.setDate(nextExpectedDate.getDate() + 7);
                        break;
                    case 'bi-weekly':
                        nextExpectedDate.setDate(nextExpectedDate.getDate() + 14);
                        break;
                    case 'monthly':
                        nextExpectedDate.setMonth(nextExpectedDate.getMonth() + 1);
                        if (dayOfMonth) nextExpectedDate.setDate(dayOfMonth);
                        break;
                    case 'quarterly':
                        nextExpectedDate.setMonth(nextExpectedDate.getMonth() + 3);
                        break;
                }

                const avgAmount = group.reduce((sum, t) => sum + t.amount, 0) / group.length;
                const description = group[0].description || category.name;

                patterns.push({
                    description,
                    category,
                    avgAmount,
                    frequency,
                    transactions: group,
                    confidence,
                    dayOfMonth,
                    dayOfWeek,
                    nextExpectedDate,
                });
            });
        });

        return patterns.sort((a, b) => b.confidence - a.confidence);
    };

    const recurringPatterns = detectRecurringTransactions();
    const recurringIncome = recurringPatterns.filter(p => p.category.type === 'income');
    const recurringExpenses = recurringPatterns.filter(p => p.category.type === 'expense');

    // Calculate total recurring monthly obligations
    const monthlyRecurringExpenses = recurringExpenses.reduce((sum, pattern) => {
        const multiplier = pattern.frequency === 'weekly' ? 4.33 :
            pattern.frequency === 'bi-weekly' ? 2.17 :
                pattern.frequency === 'monthly' ? 1 :
                    pattern.frequency === 'quarterly' ? 0.33 : 1;
        return sum + (pattern.avgAmount * multiplier);
    }, 0);

    const monthlyRecurringIncome = recurringIncome.reduce((sum, pattern) => {
        const multiplier = pattern.frequency === 'weekly' ? 4.33 :
            pattern.frequency === 'bi-weekly' ? 2.17 :
                pattern.frequency === 'monthly' ? 1 :
                    pattern.frequency === 'quarterly' ? 0.33 : 1;
        return sum + (pattern.avgAmount * multiplier);
    }, 0);

    // Find upcoming recurring transactions (next 30 days)
    const upcomingRecurring = recurringPatterns
        .filter(p => {
            if (!p.nextExpectedDate) return false;
            const daysUntil = Math.round((p.nextExpectedDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
            return daysUntil >= 0 && daysUntil <= 30;
        })
        .sort((a, b) => {
            if (!a.nextExpectedDate || !b.nextExpectedDate) return 0;
            return a.nextExpectedDate.getTime() - b.nextExpectedDate.getTime();
        });

    // Spending Alerts System
    interface SpendingAlert {
        id: string;
        type: 'critical' | 'warning' | 'info' | 'success';
        title: string;
        message: string;
        value?: number;
        icon: string;
        category?: typeof categories[0];
        actionable: boolean;
    }

    const generateSpendingAlerts = (): SpendingAlert[] => {
        const alerts: SpendingAlert[] = [];

        // 1. Budget Overspending Alert
        if (categoryBudgets.length > 0) {
            categoryBudgets.forEach(budget => {
                if (budget.period !== 'monthly') return;

                const category = categories.find(c => c.id === budget.category_id);
                if (!category) return;

                const spent = currentMonthTransactions
                    .filter(t => t.category_id === budget.category_id && t.type === 'expense')
                    .reduce((sum, t) => sum + t.amount, 0);

                const percentage = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;

                if (percentage >= 100) {
                    alerts.push({
                        id: `budget-over-${budget.id}`,
                        type: 'critical',
                        title: `${category.name} Budget Exceeded`,
                        message: `You've spent $${spent.toFixed(2)} of $${budget.amount.toFixed(2)} budget (${percentage.toFixed(0)}% used)`,
                        value: spent - budget.amount,
                        icon: '🚨',
                        category,
                        actionable: true,
                    });
                } else if (percentage >= 90) {
                    alerts.push({
                        id: `budget-warning-${budget.id}`,
                        type: 'warning',
                        title: `${category.name} Budget Almost Exceeded`,
                        message: `You've spent $${spent.toFixed(2)} of $${budget.amount.toFixed(2)} budget (${percentage.toFixed(0)}% used)`,
                        value: budget.amount - spent,
                        icon: '⚠️',
                        category,
                        actionable: true,
                    });
                }
            });
        }

        // 2. Unusual Spending Spike Alert
        if (monthlyData.length >= 3) {
            const last3MonthsAvg = monthlyData.slice(-4, -1).reduce((sum, m) => sum + m.expenses, 0) / 3;
            const currentExpenses = currentMonthExpenses;
            const increasePercent = last3MonthsAvg > 0 ? ((currentExpenses - last3MonthsAvg) / last3MonthsAvg) * 100 : 0;

            if (increasePercent > 30) {
                alerts.push({
                    id: 'unusual-spike',
                    type: 'critical',
                    title: 'Unusual Spending Spike Detected',
                    message: `Spending is ${increasePercent.toFixed(0)}% higher than your 3-month average ($${last3MonthsAvg.toFixed(2)})`,
                    value: currentExpenses - last3MonthsAvg,
                    icon: '📈',
                    actionable: true,
                });
            } else if (increasePercent > 20) {
                alerts.push({
                    id: 'spending-increase',
                    type: 'warning',
                    title: 'Above Average Spending',
                    message: `Spending is ${increasePercent.toFixed(0)}% higher than usual this month`,
                    value: currentExpenses - last3MonthsAvg,
                    icon: '📊',
                    actionable: true,
                });
            }
        }

        // 3. Low Balance Warning
        const daysIntoMonth = new Date().getDate();
        const estimatedMonthEndExpenses = currentMonthExpenses * (30 / daysIntoMonth);
        const projectedBalance = balance + currentMonthIncome - estimatedMonthEndExpenses;

        if (projectedBalance < 0 && balance > 0) {
            alerts.push({
                id: 'low-balance-projection',
                type: 'critical',
                title: 'Projected Negative Balance',
                message: `At current spending rate, balance may go negative by month end (projected: $${projectedBalance.toFixed(2)})`,
                value: Math.abs(projectedBalance),
                icon: '💰',
                actionable: true,
            });
        } else if (balance < monthlyRecurringExpenses && monthlyRecurringExpenses > 0) {
            alerts.push({
                id: 'low-balance-recurring',
                type: 'warning',
                title: 'Balance Below Recurring Expenses',
                message: `Current balance ($${balance.toFixed(2)}) is less than monthly recurring expenses ($${monthlyRecurringExpenses.toFixed(2)})`,
                value: monthlyRecurringExpenses - balance,
                icon: '⚡',
                actionable: true,
            });
        }

        // 4. Category Spending Spike
        categories.filter(c => c.type === 'expense').forEach(category => {
            const last3Months = monthlyData.slice(-4, -1).map(monthData => {
                const monthIndex = monthlyData.indexOf(monthData);
                const monthStart = startOfMonth(subMonths(new Date(), monthlyData.length - monthIndex - 1));
                const monthEnd = endOfMonth(monthStart);
                return filteredTransactions
                    .filter(t => t.category_id === category.id &&
                        t.type === 'expense' &&
                        new Date(t.date) >= monthStart &&
                        new Date(t.date) <= monthEnd)
                    .reduce((sum, t) => sum + t.amount, 0);
            });

            const avgSpend = last3Months.reduce((a, b) => a + b, 0) / 3;
            const currentSpend = currentMonthTransactions
                .filter(t => t.category_id === category.id && t.type === 'expense')
                .reduce((sum, t) => sum + t.amount, 0);

            if (avgSpend > 0 && currentSpend > avgSpend * 1.5) {
                alerts.push({
                    id: `category-spike-${category.id}`,
                    type: 'warning',
                    title: `High ${category.name} Spending`,
                    message: `${category.name} spending ($${currentSpend.toFixed(2)}) is 50%+ higher than average ($${avgSpend.toFixed(2)})`,
                    value: currentSpend - avgSpend,
                    icon: '🔥',
                    category,
                    actionable: true,
                });
            }
        });

        // 5. No Income This Month
        if (currentMonthIncome === 0 && new Date().getDate() > 15) {
            alerts.push({
                id: 'no-income',
                type: 'critical',
                title: 'No Income Recorded This Month',
                message: `It's ${format(new Date(), 'MMMM dd')} and no income has been recorded yet`,
                icon: '💸',
                actionable: false,
            });
        }

        // 6. Declining Income Trend
        if (incomeTrendPercent < -15) {
            alerts.push({
                id: 'declining-income',
                type: 'warning',
                title: 'Income Declining',
                message: `Income has decreased by ${Math.abs(incomeTrendPercent).toFixed(1)}% compared to previous 6 months`,
                value: Math.abs(incomeTrendPercent),
                icon: '📉',
                actionable: false,
            });
        }

        // 7. Large Single Transaction Alert
        const largeThreshold = avgMonthlyIncome * 0.2; // 20% of monthly income
        const recentLargeTransactions = currentMonthTransactions
            .filter(t => t.type === 'expense' && t.amount > largeThreshold)
            .sort((a, b) => b.amount - a.amount);

        if (recentLargeTransactions.length > 0) {
            const largest = recentLargeTransactions[0];
            const category = categories.find(c => c.id === largest.category_id);
            alerts.push({
                id: `large-transaction-${largest.id}`,
                type: 'info',
                title: 'Large Transaction Detected',
                message: `$${largest.amount.toFixed(2)} ${category?.name || 'expense'} on ${format(new Date(largest.date), 'MMM dd')}${largest.description ? `: ${largest.description}` : ''}`,
                value: largest.amount,
                icon: '💳',
                category,
                actionable: false,
            });
        }

        // 8. Positive Savings Alert
        if (currentMonthSavings > 0 && currentMonthSavings > averageMonthlySavings * 1.2) {
            alerts.push({
                id: 'great-savings',
                type: 'success',
                title: 'Excellent Savings This Month!',
                message: `You're saving $${currentMonthSavings.toFixed(2)}, which is ${((currentMonthSavings / averageMonthlySavings - 1) * 100).toFixed(0)}% more than average`,
                value: currentMonthSavings,
                icon: '🎉',
                actionable: false,
            });
        }

        // 9. Zero Spending Category (Potential Savings)
        if (monthlyData.length >= 2) {
            categories.filter(c => c.type === 'expense').forEach(category => {
                const lastMonthSpend = (() => {
                    const lastMonthIndex = monthlyData.length - 2;
                    const monthStart = startOfMonth(subMonths(new Date(), monthlyData.length - lastMonthIndex - 1));
                    const monthEnd = endOfMonth(monthStart);
                    return filteredTransactions
                        .filter(t => t.category_id === category.id &&
                            t.type === 'expense' &&
                            new Date(t.date) >= monthStart &&
                            new Date(t.date) <= monthEnd)
                        .reduce((sum, t) => sum + t.amount, 0);
                })();

                const currentSpend = currentMonthTransactions
                    .filter(t => t.category_id === category.id && t.type === 'expense')
                    .reduce((sum, t) => sum + t.amount, 0);

                if (lastMonthSpend > 50 && currentSpend === 0) {
                    alerts.push({
                        id: `zero-spending-${category.id}`,
                        type: 'success',
                        title: `No ${category.name} Spending`,
                        message: `You've avoided spending in ${category.name} this month (usually ~$${lastMonthSpend.toFixed(2)})`,
                        value: lastMonthSpend,
                        icon: '✅',
                        category,
                        actionable: false,
                    });
                }
            });
        }

        // 10. Upcoming Recurring Payments Alert
        const upcomingExpenses = upcomingRecurring
            .filter(p => p.category.type === 'expense' && p.nextExpectedDate)
            .filter(p => {
                const daysUntil = Math.round((p.nextExpectedDate!.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                return daysUntil <= 7 && daysUntil >= 0;
            });

        if (upcomingExpenses.length > 0) {
            const totalUpcoming = upcomingExpenses.reduce((sum, p) => sum + p.avgAmount, 0);
            alerts.push({
                id: 'upcoming-recurring',
                type: 'info',
                title: `${upcomingExpenses.length} Recurring Payment${upcomingExpenses.length > 1 ? 's' : ''} Due Soon`,
                message: `$${totalUpcoming.toFixed(2)} in recurring payments expected within 7 days`,
                value: totalUpcoming,
                icon: '📅',
                actionable: false,
            });
        }

        // Sort by priority: critical > warning > info > success
        const priorityOrder = { critical: 0, warning: 1, info: 2, success: 3 };
        return alerts.sort((a, b) => priorityOrder[a.type] - priorityOrder[b.type]);
    };

    const spendingAlerts = generateSpendingAlerts();
    const criticalAlerts = spendingAlerts.filter(a => a.type === 'critical');
    const warningAlerts = spendingAlerts.filter(a => a.type === 'warning');
    const infoAlerts = spendingAlerts.filter(a => a.type === 'info');
    const successAlerts = spendingAlerts.filter(a => a.type === 'success');

    // Top 5 Transactions
    const topExpenses = filteredTransactions
        .filter(t => t.type === 'expense')
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 5)
        .map(t => ({
            ...t,
            category: categories.find(c => c.id === t.category_id),
            percentOfTotal: totalExpenses > 0 ? (t.amount / totalExpenses) * 100 : 0,
        }));

    const topIncome = filteredTransactions
        .filter(t => t.type === 'income')
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 5)
        .map(t => ({
            ...t,
            category: categories.find(c => c.id === t.category_id),
            percentOfTotal: totalIncome > 0 ? (t.amount / totalIncome) * 100 : 0,
        }));

    // Recent large transactions (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentLargeTransactions = filteredTransactions
        .filter(t => new Date(t.date) >= thirtyDaysAgo)
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 10)
        .map(t => ({
            ...t,
            category: categories.find(c => c.id === t.category_id),
            daysAgo: Math.round((new Date().getTime() - new Date(t.date).getTime()) / (1000 * 60 * 60 * 24)),
        }));

    // Day-of-Week Analysis
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayShortNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    const dayOfWeekData = dayNames.map((dayName, dayIndex) => {
        const dayTransactions = filteredTransactions.filter(t => new Date(t.date).getDay() === dayIndex);
        const dayExpenses = dayTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
        const dayIncome = dayTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
        const transactionCount = dayTransactions.length;
        const avgTransactionSize = transactionCount > 0 ? (dayExpenses + dayIncome) / transactionCount : 0;

        return {
            day: dayName,
            shortDay: dayShortNames[dayIndex],
            dayIndex,
            expenses: dayExpenses,
            income: dayIncome,
            net: dayIncome - dayExpenses,
            transactionCount,
            avgTransactionSize,
            expenseCount: dayTransactions.filter(t => t.type === 'expense').length,
            incomeCount: dayTransactions.filter(t => t.type === 'income').length,
        };
    });

    // Find patterns
    const highestSpendingDay = dayOfWeekData.reduce((max, day) => day.expenses > max.expenses ? day : max, dayOfWeekData[0]);
    const lowestSpendingDay = dayOfWeekData.reduce((min, day) => day.expenses < min.expenses && day.expenses > 0 ? day : min, dayOfWeekData[0]);
    const mostActiveDay = dayOfWeekData.reduce((max, day) => day.transactionCount > max.transactionCount ? day : max, dayOfWeekData[0]);
    const highestIncomeDay = dayOfWeekData.reduce((max, day) => day.income > max.income ? day : max, dayOfWeekData[0]);

    // Calculate weekend vs weekday spending
    const weekendDays = dayOfWeekData.filter(d => d.dayIndex === 0 || d.dayIndex === 6);
    const weekdayDays = dayOfWeekData.filter(d => d.dayIndex > 0 && d.dayIndex < 6);

    const weekendExpenses = weekendDays.reduce((sum, d) => sum + d.expenses, 0);
    const weekdayExpenses = weekdayDays.reduce((sum, d) => sum + d.expenses, 0);
    const weekendAvg = weekendExpenses / 2;
    const weekdayAvg = weekdayExpenses / 5;

    // Category Comparison
    const categoryComparison = categories
        .filter(cat => cat.type === 'expense')
        .map(category => {
            // Current month data
            const currentMonthSpend = currentMonthTransactions
                .filter(t => t.category_id === category.id && t.type === 'expense')
                .reduce((sum, t) => sum + t.amount, 0);

            // Last month data
            const lastMonthStart = startOfMonth(subMonths(new Date(), 1));
            const lastMonthEnd = endOfMonth(subMonths(new Date(), 1));
            const lastMonthSpend = filteredTransactions
                .filter(t => t.category_id === category.id &&
                    t.type === 'expense' &&
                    new Date(t.date) >= lastMonthStart &&
                    new Date(t.date) <= lastMonthEnd)
                .reduce((sum, t) => sum + t.amount, 0);

            // 3-month average
            const last3MonthsSpend = monthlyData.slice(-3).map(monthData => {
                const monthIndex = monthlyData.indexOf(monthData);
                const monthStart = startOfMonth(subMonths(new Date(), monthlyData.length - monthIndex - 1));
                const monthEnd = endOfMonth(monthStart);
                return filteredTransactions
                    .filter(t => t.category_id === category.id &&
                        t.type === 'expense' &&
                        new Date(t.date) >= monthStart &&
                        new Date(t.date) <= monthEnd)
                    .reduce((sum, t) => sum + t.amount, 0);
            });
            const avg3Months = last3MonthsSpend.reduce((a, b) => a + b, 0) / 3;

            // 6-month average
            const last6MonthsSpend = monthlyData.slice(-6).map(monthData => {
                const monthIndex = monthlyData.indexOf(monthData);
                const monthStart = startOfMonth(subMonths(new Date(), monthlyData.length - monthIndex - 1));
                const monthEnd = endOfMonth(monthStart);
                return filteredTransactions
                    .filter(t => t.category_id === category.id &&
                        t.type === 'expense' &&
                        new Date(t.date) >= monthStart &&
                        new Date(t.date) <= monthEnd)
                    .reduce((sum, t) => sum + t.amount, 0);
            });
            const avg6Months = last6MonthsSpend.reduce((a, b) => a + b, 0) / 6;

            // Transaction count
            const transactionCount = currentMonthTransactions
                .filter(t => t.category_id === category.id && t.type === 'expense')
                .length;

            // Calculate trends
            const monthOverMonthChange = lastMonthSpend > 0
                ? ((currentMonthSpend - lastMonthSpend) / lastMonthSpend) * 100
                : (currentMonthSpend > 0 ? 100 : 0);

            const vs3MonthAvg = avg3Months > 0
                ? ((currentMonthSpend - avg3Months) / avg3Months) * 100
                : (currentMonthSpend > 0 ? 100 : 0);

            // Determine trend status
            let trendStatus: 'increasing' | 'decreasing' | 'stable' = 'stable';
            if (monthOverMonthChange > 10) trendStatus = 'increasing';
            else if (monthOverMonthChange < -10) trendStatus = 'decreasing';

            // Get budget if exists
            const budget = categoryBudgets.find(b => b.category_id === category.id && b.period === 'monthly');
            const budgetUtilization = budget && budget.amount > 0
                ? (currentMonthSpend / budget.amount) * 100
                : null;

            return {
                category,
                currentMonthSpend,
                lastMonthSpend,
                avg3Months,
                avg6Months,
                transactionCount,
                monthOverMonthChange,
                vs3MonthAvg,
                trendStatus,
                budget,
                budgetUtilization,
                percentOfTotal: currentMonthExpenses > 0 ? (currentMonthSpend / currentMonthExpenses) * 100 : 0,
            };
        })
        .filter(item => item.currentMonthSpend > 0 || item.lastMonthSpend > 0)
        .sort((a, b) => b.currentMonthSpend - a.currentMonthSpend);

    // Top growing categories
    const growingCategories = categoryComparison
        .filter(c => c.monthOverMonthChange > 10)
        .sort((a, b) => b.monthOverMonthChange - a.monthOverMonthChange)
        .slice(0, 3);

    // Top shrinking categories
    const shrinkingCategories = categoryComparison
        .filter(c => c.monthOverMonthChange < -10)
        .sort((a, b) => a.monthOverMonthChange - b.monthOverMonthChange)
        .slice(0, 3);

    // Average Transaction Size Analysis
    const expenseTransactions = filteredTransactions.filter(t => t.type === 'expense');
    const incomeTransactions = filteredTransactions.filter(t => t.type === 'income');

    const avgExpenseSize = expenseTransactions.length > 0
        ? expenseTransactions.reduce((sum, t) => sum + t.amount, 0) / expenseTransactions.length
        : 0;

    const avgIncomeSize = incomeTransactions.length > 0
        ? incomeTransactions.reduce((sum, t) => sum + t.amount, 0) / incomeTransactions.length
        : 0;

    // Calculate median transaction sizes
    const sortedExpenses = [...expenseTransactions].sort((a, b) => a.amount - b.amount);
    const sortedIncome = [...incomeTransactions].sort((a, b) => a.amount - b.amount);

    const medianExpenseSize = sortedExpenses.length > 0
        ? sortedExpenses.length % 2 === 0
            ? (sortedExpenses[sortedExpenses.length / 2 - 1].amount + sortedExpenses[sortedExpenses.length / 2].amount) / 2
            : sortedExpenses[Math.floor(sortedExpenses.length / 2)].amount
        : 0;

    const medianIncomeSize = sortedIncome.length > 0
        ? sortedIncome.length % 2 === 0
            ? (sortedIncome[sortedIncome.length / 2 - 1].amount + sortedIncome[sortedIncome.length / 2].amount) / 2
            : sortedIncome[Math.floor(sortedIncome.length / 2)].amount
        : 0;

    // Transaction size distribution (categorize by size)
    const expenseSizeRanges = [
        { label: 'Micro (<$10)', min: 0, max: 10, count: 0, total: 0 },
        { label: 'Small ($10-$50)', min: 10, max: 50, count: 0, total: 0 },
        { label: 'Medium ($50-$200)', min: 50, max: 200, count: 0, total: 0 },
        { label: 'Large ($200-$500)', min: 200, max: 500, count: 0, total: 0 },
        { label: 'Extra Large (>$500)', min: 500, max: Infinity, count: 0, total: 0 },
    ];

    expenseTransactions.forEach(t => {
        const range = expenseSizeRanges.find(r => t.amount >= r.min && t.amount < r.max);
        if (range) {
            range.count++;
            range.total += t.amount;
        }
    });

    // Calculate category average sizes
    const categoryAvgSizes = categories
        .filter(cat => cat.type === 'expense')
        .map(category => {
            const catTransactions = expenseTransactions.filter(t => t.category_id === category.id);
            const avgSize = catTransactions.length > 0
                ? catTransactions.reduce((sum, t) => sum + t.amount, 0) / catTransactions.length
                : 0;

            return {
                category,
                avgSize,
                transactionCount: catTransactions.length,
                totalSpent: catTransactions.reduce((sum, t) => sum + t.amount, 0),
            };
        })
        .filter(item => item.transactionCount > 0)
        .sort((a, b) => b.avgSize - a.avgSize);

    // Identify outliers (transactions > 2 std deviations from mean)
    const expenseAmounts = expenseTransactions.map(t => t.amount);
    const expenseStdDev = expenseAmounts.length > 0
        ? Math.sqrt(expenseAmounts.reduce((sum, amount) => sum + Math.pow(amount - avgExpenseSize, 2), 0) / expenseAmounts.length)
        : 0;

    const outlierThreshold = avgExpenseSize + (2 * expenseStdDev);
    const outlierTransactions = expenseTransactions
        .filter(t => t.amount > outlierThreshold)
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 5)
        .map(t => ({
            ...t,
            category: categories.find(c => c.id === t.category_id),
            deviations: (t.amount - avgExpenseSize) / expenseStdDev,
        }));

    // Monthly transaction size trends
    const monthlyAvgSizes = monthlyData.map((month, index) => {
        const monthStart = startOfMonth(subMonths(new Date(), monthlyData.length - index - 1));
        const monthEnd = endOfMonth(monthStart);
        const monthTransactions = filteredTransactions.filter(
            t => t.type === 'expense' &&
                new Date(t.date) >= monthStart &&
                new Date(t.date) <= monthEnd
        );

        const avgSize = monthTransactions.length > 0
            ? monthTransactions.reduce((sum, t) => sum + t.amount, 0) / monthTransactions.length
            : 0;

        return {
            month: month.month,
            shortMonth: month.shortMonth,
            avgSize,
            transactionCount: monthTransactions.length,
        };
    });

    // Days Until Next Income
    const recurringIncomePatterns = recurringPatterns.filter(p => p.category.type === 'income');

    // Find next expected income from recurring patterns
    const upcomingIncomeTransactions = recurringIncomePatterns
        .filter(p => p.nextExpectedDate)
        .map(p => ({
            ...p,
            daysUntil: p.nextExpectedDate
                ? Math.round((p.nextExpectedDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
                : 0,
        }))
        .filter(p => p.daysUntil >= 0)
        .sort((a, b) => a.daysUntil - b.daysUntil);

    const nextIncome = upcomingIncomeTransactions.length > 0 ? upcomingIncomeTransactions[0] : null;

    // Calculate daily burn rate for runway calculation
    const daysUntilIncome = nextIncome ? nextIncome.daysUntil : null;
    const expectedIncomeAmount = nextIncome ? nextIncome.avgAmount : 0;

    // Calculate if balance will last until next income
    const dailyBurnRate = avgDailyBurnRate;
    const balanceNeededUntilIncome = daysUntilIncome !== null ? dailyBurnRate * daysUntilIncome : 0;
    const balanceSufficient = daysUntilIncome !== null ? balance >= balanceNeededUntilIncome : true;
    const balanceAfterIncome = balance - balanceNeededUntilIncome + expectedIncomeAmount;

    // Get all income in last 3 months to determine frequency pattern
    const last3MonthsIncome = filteredTransactions.filter(t => {
        const threeMonthsAgo = new Date();
        threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
        return t.type === 'income' && new Date(t.date) >= threeMonthsAgo;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Calculate average days between income
    const daysBetweenIncome: number[] = [];
    for (let i = 0; i < last3MonthsIncome.length - 1; i++) {
        const days = Math.round(
            (new Date(last3MonthsIncome[i].date).getTime() - new Date(last3MonthsIncome[i + 1].date).getTime()) /
            (1000 * 60 * 60 * 24)
        );
        daysBetweenIncome.push(days);
    }

    const avgDaysBetweenIncome = daysBetweenIncome.length > 0
        ? daysBetweenIncome.reduce((sum, days) => sum + days, 0) / daysBetweenIncome.length
        : 30; // Default to monthly if no pattern

    // Last income received
    const lastIncomeTransaction = last3MonthsIncome.length > 0 ? last3MonthsIncome[0] : null;
    const daysSinceLastIncome = lastIncomeTransaction
        ? Math.round((new Date().getTime() - new Date(lastIncomeTransaction.date).getTime()) / (1000 * 60 * 60 * 24))
        : null;

    // Most Expensive Day Analysis
    const expensesByDay = filteredTransactions
        .filter(t => t.type === 'expense')
        .reduce((acc, t) => {
            const dateKey = format(new Date(t.date), 'yyyy-MM-dd');
            if (!acc[dateKey]) {
                acc[dateKey] = {
                    date: new Date(t.date),
                    total: 0,
                    transactions: [],
                };
            }
            acc[dateKey].total += t.amount;
            acc[dateKey].transactions.push(t);
            return acc;
        }, {} as Record<string, { date: Date; total: number; transactions: typeof filteredTransactions }>);

    const dailyExpenses = Object.values(expensesByDay).sort((a, b) => b.total - a.total);
    const mostExpensiveDay = dailyExpenses.length > 0 ? dailyExpenses[0] : null;

    // Calculate context metrics for most expensive day
    const avgDailyExpense = totalExpenses / Math.max(1,
        Math.ceil((new Date().getTime() - new Date(filteredTransactions
            .filter(t => t.type === 'expense')[0]?.date || new Date()).getTime()) / (1000 * 60 * 60 * 24))
    );

    const mostExpensiveCategories = mostExpensiveDay
        ? mostExpensiveDay.transactions
            .reduce((acc, t) => {
                const cat = categories.find(c => c.id === t.category_id);
                const catName = cat?.name || 'Uncategorized';
                if (!acc[catName]) {
                    acc[catName] = { name: catName, total: 0, count: 0, icon: cat?.icon || '💰' };
                }
                acc[catName].total += t.amount;
                acc[catName].count += 1;
                return acc;
            }, {} as Record<string, { name: string; total: number; count: number; icon: string }>)
        : {};

    const topCategoriesOnExpensiveDay = Object.values(mostExpensiveCategories)
        .sort((a, b) => b.total - a.total)
        .slice(0, 5);

    const expensiveDayPercentageOfMonthly = mostExpensiveDay
        ? (mostExpensiveDay.total / (totalExpenses || 1)) * 100
        : 0;

    const daysWithHighSpending = dailyExpenses.filter(d => d.total > avgDailyExpense * 2).length;

    // Spending Velocity Analysis
    // Calculate spending rate for last 4 weeks
    const weeklySpending: { week: string; amount: number; weekNumber: number }[] = [];
    for (let i = 0; i < 4; i++) {
        const weekStart = new Date();
        weekStart.setDate(weekStart.getDate() - (i * 7 + 7));
        const weekEnd = new Date();
        weekEnd.setDate(weekEnd.getDate() - (i * 7));

        const weekExpenses = filteredTransactions
            .filter(t => {
                const tDate = new Date(t.date);
                return t.type === 'expense' && tDate >= weekStart && tDate < weekEnd;
            })
            .reduce((sum, t) => sum + t.amount, 0);

        weeklySpending.unshift({
            week: format(weekStart, 'MMM dd'),
            amount: weekExpenses,
            weekNumber: 4 - i,
        });
    }

    // Calculate velocity (rate of change)
    const weeklyChanges = weeklySpending.slice(1).map((week, idx) => {
        const prevWeek = weeklySpending[idx];
        const change = week.amount - prevWeek.amount;
        const percentChange = prevWeek.amount > 0 ? (change / prevWeek.amount) * 100 : 0;
        return { change, percentChange };
    });

    const avgWeeklyChange = weeklyChanges.length > 0
        ? weeklyChanges.reduce((sum, w) => sum + w.change, 0) / weeklyChanges.length
        : 0;

    const avgPercentChange = weeklyChanges.length > 0
        ? weeklyChanges.reduce((sum, w) => sum + w.percentChange, 0) / weeklyChanges.length
        : 0;

    // Determine velocity trend
    const isAccelerating = avgWeeklyChange > 0;
    const velocityMagnitude = Math.abs(avgPercentChange);

    let velocityStatus: 'accelerating-high' | 'accelerating-moderate' | 'stable' | 'decelerating-moderate' | 'decelerating-high';
    if (velocityMagnitude < 5) {
        velocityStatus = 'stable';
    } else if (isAccelerating) {
        velocityStatus = velocityMagnitude > 20 ? 'accelerating-high' : 'accelerating-moderate';
    } else {
        velocityStatus = velocityMagnitude > 20 ? 'decelerating-high' : 'decelerating-moderate';
    }

    // Calculate current week spending
    const currentWeekStart = new Date();
    currentWeekStart.setDate(currentWeekStart.getDate() - 7);
    const currentWeekSpending = filteredTransactions
        .filter(t => {
            const tDate = new Date(t.date);
            return t.type === 'expense' && tDate >= currentWeekStart;
        })
        .reduce((sum, t) => sum + t.amount, 0);

    // Project next week spending based on velocity
    const projectedNextWeek = currentWeekSpending + avgWeeklyChange;

    // Calculate momentum (acceleration of acceleration)
    const recentVelocity = weeklyChanges.slice(-2).reduce((sum, w) => sum + w.change, 0) / 2;
    const earlierVelocity = weeklyChanges.slice(0, 2).reduce((sum, w) => sum + w.change, 0) / 2;
    const momentum = recentVelocity - earlierVelocity;
    const isMomentumIncreasing = momentum > 0;

    // Category Budget Health Analysis
    const categoryHealthData = categoryBudgets.map(budget => {
        const category = categories.find(c => c.id === budget.category_id);
        const spent = categoryData.find(c => c.name === category?.name)?.value || 0;
        const budgetAmount = budget.amount;
        const remaining = budgetAmount - spent;
        const percentUsed = (spent / budgetAmount) * 100;

        // Calculate health score (0-100, where 100 is perfect)
        let healthScore = 0;
        let healthStatus: 'excellent' | 'good' | 'warning' | 'critical' | 'over';

        if (percentUsed <= 50) {
            healthScore = 100;
            healthStatus = 'excellent';
        } else if (percentUsed <= 75) {
            healthScore = 100 - ((percentUsed - 50) * 2);
            healthStatus = 'good';
        } else if (percentUsed <= 90) {
            healthScore = 50 - ((percentUsed - 75) * 2);
            healthStatus = 'warning';
        } else if (percentUsed <= 100) {
            healthScore = 20 - ((percentUsed - 90) * 2);
            healthStatus = 'critical';
        } else {
            healthScore = 0;
            healthStatus = 'over';
        }

        // Calculate days remaining in budget period (assuming monthly)
        const today = new Date();
        const monthEnd = endOfMonth(today);
        const daysInMonth = monthEnd.getDate();
        const daysRemaining = monthEnd.getDate() - today.getDate();
        const daysElapsed = today.getDate();

        // Calculate ideal spending rate
        const idealSpentByNow = (budgetAmount * daysElapsed) / daysInMonth;
        const spendingPace = spent / idealSpentByNow;

        let paceStatus: 'under' | 'ontrack' | 'over';
        if (spendingPace < 0.9) {
            paceStatus = 'under';
        } else if (spendingPace <= 1.1) {
            paceStatus = 'ontrack';
        } else {
            paceStatus = 'over';
        }

        // Projected end-of-month spending based on current pace
        const dailyAverage = spent / daysElapsed;
        const projectedTotal = dailyAverage * daysInMonth;
        const projectedOverage = Math.max(0, projectedTotal - budgetAmount);

        return {
            category: category?.name || 'Unknown',
            icon: category?.icon || '💰',
            budget: budgetAmount,
            spent,
            remaining,
            percentUsed,
            healthScore,
            healthStatus,
            daysRemaining,
            spendingPace,
            paceStatus,
            projectedTotal,
            projectedOverage,
        };
    }).sort((a, b) => a.healthScore - b.healthScore); // Sort by worst health first

    const avgCategoryHealth = categoryHealthData.length > 0
        ? categoryHealthData.reduce((sum, c) => sum + c.healthScore, 0) / categoryHealthData.length
        : 100;

    const categoriesOverBudget = categoryHealthData.filter(c => c.percentUsed > 100).length;
    const categoriesAtRisk = categoryHealthData.filter(c => c.healthStatus === 'critical' || c.healthStatus === 'warning').length;
    const categoriesHealthy = categoryHealthData.filter(c => c.healthStatus === 'excellent' || c.healthStatus === 'good').length;

    // Heatmap Calendar Data (Last 90 days)
    const heatmapDays = 90;
    const heatmapStartDate = new Date();
    heatmapStartDate.setDate(heatmapStartDate.getDate() - heatmapDays);

    // Group transactions by date
    const dailySpendingMap = filteredTransactions
        .filter(t => t.type === 'expense' && new Date(t.date) >= heatmapStartDate)
        .reduce((acc, t) => {
            const dateKey = format(new Date(t.date), 'yyyy-MM-dd');
            acc[dateKey] = (acc[dateKey] || 0) + t.amount;
            return acc;
        }, {} as Record<string, number>);

    // Find max spending for normalization
    const maxDailySpending = Math.max(...Object.values(dailySpendingMap), 1);

    // Create calendar grid (last 3 months)
    const calendarData: Array<{
        date: Date;
        dateStr: string;
        amount: number;
        intensity: number;
        dayOfWeek: number;
        isToday: boolean;
        isWeekend: boolean;
    }> = [];

    for (let i = heatmapDays - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = format(date, 'yyyy-MM-dd');
        const amount = dailySpendingMap[dateStr] || 0;
        const intensity = amount > 0 ? (amount / maxDailySpending) : 0;
        const dayOfWeek = date.getDay();
        const isToday = format(date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

        calendarData.push({
            date,
            dateStr,
            amount,
            intensity,
            dayOfWeek,
            isToday,
            isWeekend,
        });
    }

    // Group by weeks for display
    type DayData = typeof calendarData[0];
    const calendarWeeks: DayData[][] = [];
    let currentWeek: DayData[] = [];

    calendarData.forEach((day, idx) => {
        if (idx === 0) {
            // Add empty cells for days before first date in first week
            for (let i = 0; i < day.dayOfWeek; i++) {
                currentWeek.push({
                    date: new Date(0),
                    dateStr: '',
                    amount: 0,
                    intensity: 0,
                    dayOfWeek: i,
                    isToday: false,
                    isWeekend: i === 0 || i === 6,
                });
            }
        }

        currentWeek.push(day);

        if (day.dayOfWeek === 6 || idx === calendarData.length - 1) {
            // Complete the week with empty cells if needed
            while (currentWeek.length < 7) {
                const emptyDayOfWeek = currentWeek.length;
                currentWeek.push({
                    date: new Date(0),
                    dateStr: '',
                    amount: 0,
                    intensity: 0,
                    dayOfWeek: emptyDayOfWeek,
                    isToday: false,
                    isWeekend: emptyDayOfWeek === 0 || emptyDayOfWeek === 6,
                });
            }
            calendarWeeks.push(currentWeek);
            currentWeek = [];
        }
    });

    // Calculate heatmap statistics
    const daysWithSpending = Object.keys(dailySpendingMap).length;
    const avgDailySpendingHeatmap = daysWithSpending > 0
        ? Object.values(dailySpendingMap).reduce((sum, v) => sum + v, 0) / daysWithSpending
        : 0;
    const highSpendingDays = Object.values(dailySpendingMap).filter(v => v > avgDailySpendingHeatmap * 1.5).length;
    const weekendSpending = calendarData
        .filter(d => d.isWeekend && d.amount > 0)
        .reduce((sum, d) => sum + d.amount, 0);
    const weekdaySpending = calendarData
        .filter(d => !d.isWeekend && d.amount > 0)
        .reduce((sum, d) => sum + d.amount, 0);

    // Waterfall Chart Data (Monthly Cash Flow)
    // Get last 6 months of data
    const waterfallMonths = 6;
    const waterfallData: Array<{
        month: string;
        income: number;
        expenses: number;
        net: number;
        runningBalance: number;
        isPositive: boolean;
    }> = [];

    let runningBalance = 0;

    for (let i = waterfallMonths - 1; i >= 0; i--) {
        const monthDate = new Date();
        monthDate.setMonth(monthDate.getMonth() - i);
        const monthStart = startOfMonth(monthDate);
        const monthEnd = endOfMonth(monthDate);

        const monthTransactions = filteredTransactions.filter(t => {
            const tDate = new Date(t.date);
            return tDate >= monthStart && tDate <= monthEnd;
        });

        const monthIncome = monthTransactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0);

        const monthExpenses = monthTransactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0);

        const monthNet = monthIncome - monthExpenses;
        runningBalance += monthNet;

        waterfallData.push({
            month: format(monthDate, 'MMM'),
            income: monthIncome,
            expenses: monthExpenses,
            net: monthNet,
            runningBalance,
            isPositive: monthNet >= 0,
        });
    }

    // Calculate waterfall statistics
    const totalInflowWaterfall = waterfallData.reduce((sum, m) => sum + m.income, 0);
    const totalOutflowWaterfall = waterfallData.reduce((sum, m) => sum + m.expenses, 0);
    const netChangeWaterfall = totalInflowWaterfall - totalOutflowWaterfall;
    const positiveMonths = waterfallData.filter(m => m.isPositive).length;
    const negativeMonths = waterfallData.filter(m => !m.isPositive).length;
    const avgMonthlyNet = waterfallData.reduce((sum, m) => sum + m.net, 0) / waterfallData.length;
    const bestMonth = waterfallData.reduce((best, month) => month.net > best.net ? month : best, waterfallData[0]);
    const worstMonth = waterfallData.reduce((worst, month) => month.net < worst.net ? month : worst, waterfallData[0]);

    // Prepare data for composed chart with bars and line
    const waterfallChartData = waterfallData.map(m => ({
        month: m.month,
        Income: m.income,
        Expenses: -m.expenses, // Negative for waterfall effect
        Balance: m.runningBalance,
        Net: m.net,
    }));

    // Sankey Diagram Data - Money Flow Visualization
    // Group income by source/category and expenses by category
    const incomeByCategory = filteredTransactions
        .filter(t => t.type === 'income')
        .reduce((acc, t) => {
            const cat = categories.find(c => c.id === t.category_id);
            const catName = cat?.name || 'Other Income';
            acc[catName] = (acc[catName] || 0) + t.amount;
            return acc;
        }, {} as Record<string, number>);

    const expenseByCategory = filteredTransactions
        .filter(t => t.type === 'expense')
        .reduce((acc, t) => {
            const cat = categories.find(c => c.id === t.category_id);
            const catName = cat?.name || 'Other Expenses';
            acc[catName] = (acc[catName] || 0) + t.amount;
            return acc;
        }, {} as Record<string, number>);

    // Create flow data
    const sankeyIncomeSources = Object.entries(incomeByCategory)
        .map(([name, amount]) => ({
            name,
            amount,
            percentage: (amount / totalIncome) * 100,
        }))
        .sort((a, b) => b.amount - a.amount);

    const sankeyExpenseCategories = Object.entries(expenseByCategory)
        .map(([name, amount]) => ({
            name,
            amount,
            percentage: (amount / totalExpenses) * 100,
        }))
        .sort((a, b) => b.amount - a.amount);

    // Calculate allocation percentages (how income is distributed)
    const savingsAmount = totalIncome - totalExpenses;
    const savingsPercentage = totalIncome > 0 ? (savingsAmount / totalIncome) * 100 : 0;
    const expensesPercentage = totalIncome > 0 ? (totalExpenses / totalIncome) * 100 : 0;

    // Get top categories for simplified view
    const topIncomeSources = sankeyIncomeSources.slice(0, 5);
    const topExpenseCategories = sankeyExpenseCategories.slice(0, 8);

    // Expense Distribution by Time of Day
    const expensesByTimeOfDay = filteredTransactions
        .filter(t => t.type === 'expense')
        .reduce((acc, t) => {
            const date = new Date(t.date);
            const hour = date.getHours();

            // Categorize by time period
            let timePeriod: 'Morning' | 'Afternoon' | 'Evening' | 'Night';
            if (hour >= 5 && hour < 12) {
                timePeriod = 'Morning';
            } else if (hour >= 12 && hour < 17) {
                timePeriod = 'Afternoon';
            } else if (hour >= 17 && hour < 22) {
                timePeriod = 'Evening';
            } else {
                timePeriod = 'Night';
            }

            if (!acc[timePeriod]) {
                acc[timePeriod] = {
                    amount: 0,
                    count: 0,
                    transactions: [],
                };
            }

            acc[timePeriod].amount += t.amount;
            acc[timePeriod].count += 1;
            acc[timePeriod].transactions.push(t);

            return acc;
        }, {} as Record<string, { amount: number; count: number; transactions: typeof filteredTransactions }>);

    // Create time distribution data
    const timeDistributionData = [
        { period: 'Morning', time: '5AM-12PM', icon: '🌅', ...expensesByTimeOfDay['Morning'] },
        { period: 'Afternoon', time: '12PM-5PM', icon: '☀️', ...expensesByTimeOfDay['Afternoon'] },
        { period: 'Evening', time: '5PM-10PM', icon: '🌆', ...expensesByTimeOfDay['Evening'] },
        { period: 'Night', time: '10PM-5AM', icon: '🌙', ...expensesByTimeOfDay['Night'] },
    ].map(period => ({
        ...period,
        amount: period.amount || 0,
        count: period.count || 0,
        transactions: period.transactions || [],
        percentage: totalExpenses > 0 ? ((period.amount || 0) / totalExpenses) * 100 : 0,
        avgTransaction: (period.count || 0) > 0 ? (period.amount || 0) / (period.count || 0) : 0,
    }));

    // Find peak spending time
    const peakSpendingTime = timeDistributionData.reduce((peak, period) =>
        period.amount > peak.amount ? period : peak
        , timeDistributionData[0]);

    const mostActiveTime = timeDistributionData.reduce((peak, period) =>
        period.count > peak.count ? period : peak
        , timeDistributionData[0]);

    // Calculate time-based statistics
    const dayTimeSpending = (timeDistributionData[0].amount + timeDistributionData[1].amount); // Morning + Afternoon
    const nightTimeSpending = (timeDistributionData[2].amount + timeDistributionData[3].amount); // Evening + Night
    const totalTimeTransactions = timeDistributionData.reduce((sum, p) => sum + p.count, 0);

    // Top categories by time period
    const categoriesByTimePeriod = timeDistributionData.map(period => {
        const categoryTotals = period.transactions.reduce((acc, t) => {
            const cat = categories.find(c => c.id === t.category_id);
            const catName = cat?.name || 'Other';
            if (!acc[catName]) {
                acc[catName] = { name: catName, amount: 0, icon: cat?.icon || '💰' };
            }
            acc[catName].amount += t.amount;
            return acc;
        }, {} as Record<string, { name: string; amount: number; icon: string }>);

        return {
            period: period.period,
            topCategories: Object.values(categoryTotals)
                .sort((a, b) => b.amount - a.amount)
                .slice(0, 3),
        };
    });

    // Transaction Timeline View (Last 30 days)
    const timelineTransactions = filteredTransactions
        .filter(t => {
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            return new Date(t.date) >= thirtyDaysAgo;
        })
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 50); // Limit to 50 most recent

    // Group transactions by date for timeline
    const timelineByDate = timelineTransactions.reduce((acc, t) => {
        const dateKey = format(new Date(t.date), 'yyyy-MM-dd');
        if (!acc[dateKey]) {
            acc[dateKey] = {
                date: new Date(t.date),
                transactions: [],
                totalIncome: 0,
                totalExpense: 0,
                netChange: 0,
            };
        }
        acc[dateKey].transactions.push(t);
        if (t.type === 'income') {
            acc[dateKey].totalIncome += t.amount;
        } else {
            acc[dateKey].totalExpense += t.amount;
        }
        acc[dateKey].netChange = acc[dateKey].totalIncome - acc[dateKey].totalExpense;
        return acc;
    }, {} as Record<string, {
        date: Date;
        transactions: typeof timelineTransactions;
        totalIncome: number;
        totalExpense: number;
        netChange: number;
    }>);

    const timelineDates = Object.values(timelineByDate).sort((a, b) =>
        b.date.getTime() - a.date.getTime()
    );

    // Calculate timeline statistics
    const timelineStats = {
        totalTransactions: timelineTransactions.length,
        incomeCount: timelineTransactions.filter(t => t.type === 'income').length,
        expenseCount: timelineTransactions.filter(t => t.type === 'expense').length,
        activeDays: timelineDates.length,
        avgPerDay: timelineDates.length > 0
            ? timelineTransactions.length / timelineDates.length
            : 0,
        largestTransaction: timelineTransactions.reduce((max, t) =>
            t.amount > max.amount ? t : max
            , timelineTransactions[0]),
    };

    // Financial Health Score (0-100)
    // Calculate comprehensive health score based on multiple factors

    // 1. Savings Rate Score (0-25 points)
    const healthSavingsRate = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0;
    const savingsScore = Math.min(25, Math.max(0, healthSavingsRate >= 20 ? 25 : healthSavingsRate >= 10 ? 20 : healthSavingsRate >= 5 ? 15 : healthSavingsRate > 0 ? 10 : 0));

    // 2. Budget Adherence Score (0-20 points)
    const budgetAdherence = categoryHealthData.length > 0
        ? categoryHealthData.filter(c => c.percentUsed <= 100).length / categoryHealthData.length * 100
        : 100;
    const budgetScore = Math.min(20, (budgetAdherence / 100) * 20);

    // 3. Spending Consistency Score (0-15 points)
    const spendingVariation = velocityMagnitude; // From velocity analysis
    const consistencyScore = Math.min(15, spendingVariation < 5 ? 15 : spendingVariation < 10 ? 12 : spendingVariation < 20 ? 8 : 5);

    // 4. Emergency Fund Score (0-15 points) - Based on runway
    const emergencyScore = monthsRemaining === Infinity ? 15 :
        monthsRemaining >= 6 ? 15 :
            monthsRemaining >= 3 ? 12 :
                monthsRemaining >= 1 ? 8 : 5;

    // 5. Income Stability Score (0-15 points)
    const healthStabilityScore = Math.min(15, (stabilityScore / 100) * 15);

    // 6. Debt/Expense Management Score (0-10 points)
    const expenseRatio = totalIncome > 0 ? (totalExpenses / totalIncome) * 100 : 100;
    const expenseScore = expenseRatio <= 50 ? 10 : expenseRatio <= 70 ? 8 : expenseRatio <= 90 ? 6 : expenseRatio < 100 ? 4 : 2;

    // Calculate total health score
    const financialHealthScore = Math.round(savingsScore + budgetScore + consistencyScore + emergencyScore + healthStabilityScore + expenseScore);

    // Determine health grade
    let healthGrade: 'Excellent' | 'Good' | 'Fair' | 'Poor' | 'Critical';
    let healthColor: string;
    let healthEmoji: string;

    if (financialHealthScore >= 85) {
        healthGrade = 'Excellent';
        healthColor = 'emerald';
        healthEmoji = '🌟';
    } else if (financialHealthScore >= 70) {
        healthGrade = 'Good';
        healthColor = 'green';
        healthEmoji = '✅';
    } else if (financialHealthScore >= 55) {
        healthGrade = 'Fair';
        healthColor = 'yellow';
        healthEmoji = '⚠️';
    } else if (financialHealthScore >= 40) {
        healthGrade = 'Poor';
        healthColor = 'orange';
        healthEmoji = '⚡';
    } else {
        healthGrade = 'Critical';
        healthColor = 'red';
        healthEmoji = '🚨';
    }

    // Score breakdown for detailed view
    const scoreBreakdown = [
        { name: 'Savings Rate', score: savingsScore, max: 25, icon: '💰', details: `${healthSavingsRate.toFixed(1)}% savings rate` },
        { name: 'Budget Adherence', score: budgetScore, max: 20, icon: '🎯', details: `${budgetAdherence.toFixed(0)}% on track` },
        { name: 'Spending Consistency', score: consistencyScore, max: 15, icon: '📊', details: `${velocityMagnitude.toFixed(1)}% variation` },
        { name: 'Emergency Fund', score: emergencyScore, max: 15, icon: '🛡️', details: monthsRemaining === Infinity ? 'Infinite runway' : `${monthsRemaining.toFixed(1)} months` },
        { name: 'Income Stability', score: healthStabilityScore, max: 15, icon: '💵', details: `${stabilityScore.toFixed(0)}/100 stability` },
        { name: 'Expense Management', score: expenseScore, max: 10, icon: '📉', details: `${expenseRatio.toFixed(0)}% of income` },
    ];

    // Generate personalized recommendations
    const healthRecommendations: string[] = [];

    if (savingsScore < 15) {
        healthRecommendations.push('Increase your savings rate to at least 10% of income for better financial security');
    }
    if (budgetScore < 15) {
        healthRecommendations.push('Review and adjust category budgets to improve adherence');
    }
    if (consistencyScore < 10) {
        healthRecommendations.push('Reduce spending variation for more predictable cash flow');
    }
    if (emergencyScore < 10) {
        healthRecommendations.push('Build emergency fund to cover at least 3-6 months of expenses');
    }
    if (healthStabilityScore < 10) {
        healthRecommendations.push('Diversify income sources to improve financial stability');
    }
    if (expenseScore < 8) {
        healthRecommendations.push('Reduce expenses to below 80% of income for sustainable finances');
    }

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
        return <DashboardSkeleton />;
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

            {/* Financial Health Score - Comprehensive Overview */}
            <Card className="shadow-2xl hover:shadow-3xl transition-shadow duration-300 border-4 border-gradient-to-r from-blue-500 to-purple-500">
                <CardHeader className="bg-linear-to-r from-blue-50 via-purple-50 to-pink-50 dark:from-blue-950/20 dark:via-purple-950/20 dark:to-pink-950/20">
                    <CardTitle className="text-xl flex items-center gap-2">
                        <Target className="h-6 w-6 text-blue-600" />
                        Financial Health Score
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                    <div className="space-y-6">
                        {/* Main Score Display */}
                        <div className={`p-8 rounded-2xl text-center border-4 ${healthColor === 'emerald' ? 'bg-linear-to-br from-emerald-100 to-green-100 dark:from-emerald-950/40 dark:to-green-950/40 border-emerald-400 dark:border-emerald-600' :
                            healthColor === 'green' ? 'bg-linear-to-br from-green-100 to-lime-100 dark:from-green-950/40 dark:to-lime-950/40 border-green-400 dark:border-green-600' :
                                healthColor === 'yellow' ? 'bg-linear-to-br from-yellow-100 to-amber-100 dark:from-yellow-950/40 dark:to-amber-950/40 border-yellow-400 dark:border-yellow-600' :
                                    healthColor === 'orange' ? 'bg-linear-to-br from-orange-100 to-red-100 dark:from-orange-950/40 dark:to-red-950/40 border-orange-400 dark:border-orange-600' :
                                        'bg-linear-to-br from-red-100 to-rose-100 dark:from-red-950/40 dark:to-rose-950/40 border-red-400 dark:border-red-600'
                            }`}>
                            <div className="text-6xl mb-4">{healthEmoji}</div>
                            <div className={`text-7xl font-black mb-4 ${healthColor === 'emerald' ? 'text-emerald-600 dark:text-emerald-400' :
                                healthColor === 'green' ? 'text-green-600 dark:text-green-400' :
                                    healthColor === 'yellow' ? 'text-yellow-600 dark:text-yellow-400' :
                                        healthColor === 'orange' ? 'text-orange-600 dark:text-orange-400' :
                                            'text-red-600 dark:text-red-400'
                                }`}>
                                {financialHealthScore}
                            </div>
                            <div className="text-sm text-muted-foreground mb-2">out of 100</div>
                            <div className={`text-3xl font-bold mb-2 ${healthColor === 'emerald' ? 'text-emerald-700 dark:text-emerald-300' :
                                healthColor === 'green' ? 'text-green-700 dark:text-green-300' :
                                    healthColor === 'yellow' ? 'text-yellow-700 dark:text-yellow-300' :
                                        healthColor === 'orange' ? 'text-orange-700 dark:text-orange-300' :
                                            'text-red-700 dark:text-red-300'
                                }`}>
                                {healthGrade}
                            </div>
                            <p className="text-sm text-muted-foreground max-w-md mx-auto">
                                {
                                    healthGrade === 'Excellent' ? 'Outstanding financial management! Keep up the excellent habits.' :
                                        healthGrade === 'Good' ? 'Strong financial foundation with room for minor improvements.' :
                                            healthGrade === 'Fair' ? 'Decent financial health but needs attention in some areas.' :
                                                healthGrade === 'Poor' ? 'Financial health needs significant improvement.' :
                                                    'Critical financial situation requiring immediate action.'
                                }
                            </p>
                        </div>

                        {/* Score Breakdown */}
                        <div>
                            <h4 className="text-sm font-semibold mb-4">Score Breakdown</h4>
                            <div className="space-y-4">
                                {scoreBreakdown.map((item, idx) => {
                                    const percentage = (item.score / item.max) * 100;
                                    return (
                                        <div key={idx} className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xl">{item.icon}</span>
                                                    <div>
                                                        <div className="text-sm font-semibold">{item.name}</div>
                                                        <div className="text-xs text-muted-foreground">{item.details}</div>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-lg font-bold">{item.score.toFixed(1)}/{item.max}</div>
                                                    <div className="text-xs text-muted-foreground">{percentage.toFixed(0)}%</div>
                                                </div>
                                            </div>
                                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                                                <div
                                                    className={`h-full transition-all duration-500 ${percentage >= 80 ? 'bg-linear-to-r from-emerald-500 to-green-500' :
                                                        percentage >= 60 ? 'bg-linear-to-r from-green-500 to-lime-500' :
                                                            percentage >= 40 ? 'bg-linear-to-r from-yellow-500 to-amber-500' :
                                                                'bg-linear-to-r from-orange-500 to-red-500'
                                                        }`}
                                                    style={{ width: `${percentage}%` }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Visual Gauge */}
                        <div>
                            <h4 className="text-sm font-semibold mb-3">Overall Health Gauge</h4>
                            <ResponsiveContainer width="100%" height={200}>
                                <RadialBarChart
                                    cx="50%"
                                    cy="50%"
                                    innerRadius="30%"
                                    outerRadius="100%"
                                    data={[{ name: 'Health Score', value: financialHealthScore, fill: `url(#healthGradient)` }]}
                                    startAngle={180}
                                    endAngle={0}
                                >
                                    <defs>
                                        <linearGradient id="healthGradient" x1="0" y1="0" x2="1" y2="0">
                                            <stop offset="0%" stopColor="#ef4444" />
                                            <stop offset="25%" stopColor="#f59e0b" />
                                            <stop offset="50%" stopColor="#eab308" />
                                            <stop offset="75%" stopColor="#22c55e" />
                                            <stop offset="100%" stopColor="#10b981" />
                                        </linearGradient>
                                    </defs>
                                    <RadialBar
                                        background
                                        dataKey="value"
                                        cornerRadius={10}
                                    />
                                </RadialBarChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Recommendations */}
                        <div className={`p-4 rounded-lg border-2 ${healthColor === 'emerald' || healthColor === 'green'
                            ? 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800'
                            : 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800'
                            }`}>
                            <p className={`text-sm font-semibold mb-3 flex items-center gap-2 ${healthColor === 'emerald' || healthColor === 'green'
                                ? 'text-blue-900 dark:text-blue-100'
                                : 'text-amber-900 dark:text-amber-100'
                                }`}>
                                <AlertCircle className="h-4 w-4" />
                                {healthRecommendations.length === 0 ? 'Keep up the great work!' : 'Recommendations to Improve'}
                            </p>
                            <ul className={`text-xs space-y-2 ${healthColor === 'emerald' || healthColor === 'green'
                                ? 'text-blue-700 dark:text-blue-300'
                                : 'text-amber-700 dark:text-amber-300'
                                }`}>
                                {healthRecommendations.length === 0 ? (
                                    <li>• Your financial health is excellent! Continue maintaining these strong habits.</li>
                                ) : (
                                    healthRecommendations.map((rec, idx) => (
                                        <li key={idx}>• {rec}</li>
                                    ))
                                )}
                            </ul>
                        </div>

                        {/* Comparison & Progress */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="p-4 rounded-lg bg-linear-to-br from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20 border border-blue-200 dark:border-blue-800">
                                <div className="text-xs text-muted-foreground mb-1">Score Range</div>
                                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                                    {healthGrade === 'Excellent' ? '85-100' :
                                        healthGrade === 'Good' ? '70-84' :
                                            healthGrade === 'Fair' ? '55-69' :
                                                healthGrade === 'Poor' ? '40-54' : '0-39'}
                                </div>
                            </div>
                            <div className="p-4 rounded-lg bg-linear-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 border border-purple-200 dark:border-purple-800">
                                <div className="text-xs text-muted-foreground mb-1">Top Category</div>
                                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                                    {scoreBreakdown.reduce((max, item) => (item.score / item.max) > (max.score / max.max) ? item : max).icon}
                                </div>
                                <div className="text-xs text-muted-foreground mt-1">
                                    {scoreBreakdown.reduce((max, item) => (item.score / item.max) > (max.score / max.max) ? item : max).name}
                                </div>
                            </div>
                            <div className="p-4 rounded-lg bg-linear-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border border-green-200 dark:border-green-800">
                                <div className="text-xs text-muted-foreground mb-1">Areas to Improve</div>
                                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                                    {scoreBreakdown.filter(item => (item.score / item.max) < 0.7).length}
                                </div>
                            </div>
                        </div>
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

            {/* Spending Alerts */}
            {spendingAlerts.length > 0 && (
                <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 border-2 border-amber-200 dark:border-amber-900">
                    <CardHeader className="bg-linear-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <AlertCircle className="h-5 w-5 text-amber-600" />
                                Smart Alerts & Insights
                            </CardTitle>
                            <div className="flex items-center gap-2">
                                {criticalAlerts.length > 0 && (
                                    <span className="px-2 py-1 text-xs rounded-full bg-red-600 text-white font-semibold">
                                        {criticalAlerts.length} Critical
                                    </span>
                                )}
                                {warningAlerts.length > 0 && (
                                    <span className="px-2 py-1 text-xs rounded-full bg-orange-600 text-white font-semibold">
                                        {warningAlerts.length} Warning
                                    </span>
                                )}
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <div className="space-y-3">
                            {spendingAlerts.map((alert) => (
                                <div
                                    key={alert.id}
                                    className={`p-4 rounded-lg border-l-4 ${alert.type === 'critical'
                                        ? 'bg-red-50 dark:bg-red-950/20 border-red-600'
                                        : alert.type === 'warning'
                                            ? 'bg-orange-50 dark:bg-orange-950/20 border-orange-600'
                                            : alert.type === 'success'
                                                ? 'bg-green-50 dark:bg-green-950/20 border-green-600'
                                                : 'bg-blue-50 dark:bg-blue-950/20 border-blue-600'
                                        }`}
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex items-start gap-3 flex-1">
                                            <span className="text-2xl">{alert.icon}</span>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h4 className={`font-semibold text-sm ${alert.type === 'critical'
                                                        ? 'text-red-900 dark:text-red-100'
                                                        : alert.type === 'warning'
                                                            ? 'text-orange-900 dark:text-orange-100'
                                                            : alert.type === 'success'
                                                                ? 'text-green-900 dark:text-green-100'
                                                                : 'text-blue-900 dark:text-blue-100'
                                                        }`}>
                                                        {alert.title}
                                                    </h4>
                                                    {alert.category && (
                                                        <div
                                                            className="w-2 h-2 rounded-full"
                                                            style={{ backgroundColor: alert.category.color }}
                                                        />
                                                    )}
                                                </div>
                                                <p className={`text-xs ${alert.type === 'critical'
                                                    ? 'text-red-700 dark:text-red-300'
                                                    : alert.type === 'warning'
                                                        ? 'text-orange-700 dark:text-orange-300'
                                                        : alert.type === 'success'
                                                            ? 'text-green-700 dark:text-green-300'
                                                            : 'text-blue-700 dark:text-blue-300'
                                                    }`}>
                                                    {alert.message}
                                                </p>
                                                {alert.actionable && (
                                                    <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                                                        <span>💡</span>
                                                        <span className="font-medium">Action Required</span>
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                        {alert.value !== undefined && (
                                            <div className="text-right">
                                                <p className={`text-lg font-bold ${alert.type === 'critical'
                                                    ? 'text-red-600'
                                                    : alert.type === 'warning'
                                                        ? 'text-orange-600'
                                                        : alert.type === 'success'
                                                            ? 'text-green-600'
                                                            : 'text-blue-600'
                                                    }`}>
                                                    ${alert.value.toFixed(2)}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Summary Footer */}
                        <div className="mt-6 pt-4 border-t grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="text-center">
                                <p className="text-2xl font-bold text-red-600">{criticalAlerts.length}</p>
                                <p className="text-xs text-muted-foreground">Critical</p>
                            </div>
                            <div className="text-center">
                                <p className="text-2xl font-bold text-orange-600">{warningAlerts.length}</p>
                                <p className="text-xs text-muted-foreground">Warnings</p>
                            </div>
                            <div className="text-center">
                                <p className="text-2xl font-bold text-blue-600">{infoAlerts.length}</p>
                                <p className="text-xs text-muted-foreground">Info</p>
                            </div>
                            <div className="text-center">
                                <p className="text-2xl font-bold text-green-600">{successAlerts.length}</p>
                                <p className="text-xs text-muted-foreground">Positive</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

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

            {/* Notification Status Widget & Savings Analytics Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <NotificationStatusWidget />

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

            {/* Days Until Next Income */}
            <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 border-2 border-indigo-200 dark:border-indigo-900">
                <CardHeader className="bg-linear-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/20 dark:to-purple-950/20">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-indigo-600" />
                        Next Income Tracker
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                    {nextIncome ? (
                        <div className="space-y-6">
                            {/* Countdown Display */}
                            <div className={`p-6 rounded-lg border-2 ${daysUntilIncome === 0 ? 'bg-green-100 dark:bg-green-950/30 border-green-400 dark:border-green-700' :
                                daysUntilIncome && daysUntilIncome <= 3 ? 'bg-blue-100 dark:bg-blue-950/30 border-blue-400 dark:border-blue-700' :
                                    daysUntilIncome && daysUntilIncome <= 7 ? 'bg-indigo-100 dark:bg-indigo-950/30 border-indigo-400 dark:border-indigo-700' :
                                        'bg-purple-100 dark:bg-purple-950/30 border-purple-400 dark:border-purple-700'
                                }`}>
                                <div className="flex items-start gap-4">
                                    <div className={`p-3 rounded-full ${daysUntilIncome === 0 ? 'bg-green-600' :
                                        daysUntilIncome && daysUntilIncome <= 3 ? 'bg-blue-600' :
                                            daysUntilIncome && daysUntilIncome <= 7 ? 'bg-indigo-600' :
                                                'bg-purple-600'
                                        }`}>
                                        <DollarSign className="h-6 w-6 text-white" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">
                                            {daysUntilIncome === 0 ? '🎉 Income Expected Today!' :
                                                daysUntilIncome === 1 ? '⏰ Income Tomorrow!' :
                                                    `📅 Next Income in ${daysUntilIncome} Days`}
                                        </p>
                                        <p className="text-4xl font-bold text-indigo-700 dark:text-indigo-300 mb-2">
                                            ${expectedIncomeAmount.toFixed(2)}
                                        </p>
                                        <div className="flex items-center gap-2 text-xs text-gray-700 dark:text-gray-300">
                                            <span>{nextIncome.description}</span>
                                            <span>•</span>
                                            <span>{nextIncome.category.name}</span>
                                            {nextIncome.nextExpectedDate && (
                                                <>
                                                    <span>•</span>
                                                    <span>{format(nextIncome.nextExpectedDate, 'MMM dd, yyyy')}</span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Balance Runway Check */}
                            <div className={`p-4 rounded-lg border-2 ${balanceSufficient
                                ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800'
                                : 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800'
                                }`}>
                                <div className="flex items-start gap-3">
                                    <div className={`p-2 rounded-full ${balanceSufficient ? 'bg-green-600' : 'bg-red-600'
                                        }`}>
                                        {balanceSufficient ? (
                                            <TrendingUp className="h-4 w-4 text-white" />
                                        ) : (
                                            <AlertCircle className="h-4 w-4 text-white" />
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <p className={`text-sm font-semibold mb-1 ${balanceSufficient
                                            ? 'text-green-900 dark:text-green-100'
                                            : 'text-red-900 dark:text-red-100'
                                            }`}>
                                            {balanceSufficient
                                                ? '✅ Balance Sufficient Until Next Income'
                                                : '⚠️ Balance May Not Last Until Next Income'}
                                        </p>
                                        <div className="grid grid-cols-2 gap-3 mt-3 text-xs">
                                            <div>
                                                <p className="text-gray-600 dark:text-gray-400">Current Balance</p>
                                                <p className="font-bold text-lg">${balance.toFixed(2)}</p>
                                            </div>
                                            <div>
                                                <p className="text-gray-600 dark:text-gray-400">Burn Until Income</p>
                                                <p className="font-bold text-lg">${balanceNeededUntilIncome.toFixed(2)}</p>
                                            </div>
                                            <div>
                                                <p className="text-gray-600 dark:text-gray-400">After Income</p>
                                                <p className={`font-bold text-lg ${balanceAfterIncome >= 0 ? 'text-green-600' : 'text-red-600'
                                                    }`}>
                                                    ${balanceAfterIncome.toFixed(2)}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-gray-600 dark:text-gray-400">Daily Burn Rate</p>
                                                <p className="font-bold text-lg">${dailyBurnRate.toFixed(2)}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Upcoming Income List */}
                            {upcomingIncomeTransactions.length > 1 && (
                                <div className="space-y-2">
                                    <h3 className="font-semibold text-sm flex items-center gap-2">
                                        <Activity className="h-4 w-4" />
                                        Upcoming Income Schedule
                                    </h3>
                                    {upcomingIncomeTransactions.slice(0, 5).map((income, index) => (
                                        <div key={index} className="flex items-center justify-between p-3 rounded-lg border hover:shadow-sm transition-shadow">
                                            <div className="flex items-center gap-3">
                                                <div
                                                    className="w-3 h-3 rounded-full"
                                                    style={{ backgroundColor: income.category.color }}
                                                />
                                                <div>
                                                    <p className="text-sm font-semibold">{income.description}</p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {income.nextExpectedDate && format(income.nextExpectedDate, 'MMM dd, yyyy')} •
                                                        {income.daysUntil === 0 ? ' Today' :
                                                            income.daysUntil === 1 ? ' Tomorrow' :
                                                                ` in ${income.daysUntil} days`}
                                                    </p>
                                                </div>
                                            </div>
                                            <p className="text-sm font-bold text-green-600">
                                                ${income.avgAmount.toFixed(2)}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Income Pattern Info */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
                                    <p className="text-xs text-muted-foreground mb-1">Last Income</p>
                                    {lastIncomeTransaction ? (
                                        <>
                                            <p className="text-lg font-bold text-blue-600">
                                                ${lastIncomeTransaction.amount.toFixed(2)}
                                            </p>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                {daysSinceLastIncome === 0 ? 'Today' :
                                                    daysSinceLastIncome === 1 ? 'Yesterday' :
                                                        `${daysSinceLastIncome} days ago`} •
                                                {format(new Date(lastIncomeTransaction.date), 'MMM dd')}
                                            </p>
                                        </>
                                    ) : (
                                        <p className="text-sm text-muted-foreground">No recent income</p>
                                    )}
                                </div>

                                <div className="p-4 rounded-lg bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800">
                                    <p className="text-xs text-muted-foreground mb-1">Average Frequency</p>
                                    <p className="text-lg font-bold text-purple-600">
                                        Every {Math.round(avgDaysBetweenIncome)} days
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Based on last 3 months
                                    </p>
                                </div>
                            </div>

                            {/* Tips */}
                            {!balanceSufficient && (
                                <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
                                    <p className="text-sm font-semibold text-amber-900 dark:text-amber-100 mb-2 flex items-center gap-2">
                                        <AlertCircle className="h-4 w-4" />
                                        Action Needed
                                    </p>
                                    <ul className="text-xs text-amber-700 dark:text-amber-300 space-y-1">
                                        <li>• Your current balance may not cover expenses until next income</li>
                                        <li>• Consider reducing spending by ${(balanceNeededUntilIncome - balance).toFixed(2)}</li>
                                        <li>• Or find additional income sources to bridge the gap</li>
                                    </ul>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="text-center py-8">
                            <Calendar className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                            <p className="text-lg font-semibold mb-2">No Recurring Income Detected</p>
                            <p className="text-sm text-muted-foreground">
                                Add recurring income transactions to track when you'll receive money next.
                                We need at least 3 similar income transactions to detect patterns.
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Most Expensive Day Analysis */}
            <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 border-2 border-rose-200 dark:border-rose-900">
                <CardHeader className="bg-linear-to-r from-rose-50 to-pink-50 dark:from-rose-950/20 dark:to-pink-950/20">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-rose-600" />
                        Most Expensive Day
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                    {mostExpensiveDay ? (
                        <div className="space-y-6">
                            {/* Main Display */}
                            <div className="text-center p-6 rounded-xl bg-linear-to-br from-rose-100 to-pink-100 dark:from-rose-950/40 dark:to-pink-950/40 border-2 border-rose-300 dark:border-rose-700">
                                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-rose-600 text-white mb-4">
                                    <Calendar className="h-8 w-8" />
                                </div>
                                <h3 className="text-2xl font-bold text-rose-900 dark:text-rose-100 mb-2">
                                    {format(mostExpensiveDay.date, 'EEEE, MMMM dd, yyyy')}
                                </h3>
                                <div className="text-4xl font-bold text-rose-600 dark:text-rose-400 mb-2">
                                    ${mostExpensiveDay.total.toFixed(2)}
                                </div>
                                <p className="text-sm text-rose-700 dark:text-rose-300">
                                    {mostExpensiveDay.transactions.length} transaction{mostExpensiveDay.transactions.length !== 1 ? 's' : ''} •
                                    {expensiveDayPercentageOfMonthly.toFixed(1)}% of total expenses
                                </p>
                            </div>

                            {/* Context Metrics */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700">
                                    <div className="text-xs text-muted-foreground mb-1">vs. Avg Daily</div>
                                    <div className="text-lg font-bold text-rose-600 dark:text-rose-400">
                                        {(mostExpensiveDay.total / avgDailyExpense).toFixed(1)}x
                                    </div>
                                </div>
                                <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700">
                                    <div className="text-xs text-muted-foreground mb-1">Transactions</div>
                                    <div className="text-lg font-bold">
                                        {mostExpensiveDay.transactions.length}
                                    </div>
                                </div>
                                <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700">
                                    <div className="text-xs text-muted-foreground mb-1">High Spending Days</div>
                                    <div className="text-lg font-bold text-orange-600 dark:text-orange-400">
                                        {daysWithHighSpending}
                                    </div>
                                </div>
                                <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700">
                                    <div className="text-xs text-muted-foreground mb-1">Avg Daily Spend</div>
                                    <div className="text-lg font-bold">
                                        ${avgDailyExpense.toFixed(2)}
                                    </div>
                                </div>
                            </div>

                            {/* Top Categories on That Day */}
                            <div>
                                <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                                    <Target className="h-4 w-4 text-rose-600" />
                                    What You Spent On
                                </h4>
                                <div className="space-y-3">
                                    {topCategoriesOnExpensiveDay.map((cat, idx) => {
                                        const percentage = (cat.total / mostExpensiveDay.total) * 100;
                                        return (
                                            <div key={idx} className="space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-lg">{cat.icon}</span>
                                                        <span className="text-sm font-medium">{cat.name}</span>
                                                        <span className="text-xs text-muted-foreground">({cat.count})</span>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="text-sm font-bold">${cat.total.toFixed(2)}</div>
                                                        <div className="text-xs text-muted-foreground">{percentage.toFixed(0)}%</div>
                                                    </div>
                                                </div>
                                                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                                                    <div
                                                        className="h-full bg-linear-to-r from-rose-500 to-pink-500 transition-all duration-500"
                                                        style={{ width: `${percentage}%` }}
                                                    />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Transaction Breakdown */}
                            <div>
                                <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                                    <Receipt className="h-4 w-4 text-rose-600" />
                                    All Transactions That Day
                                </h4>
                                <div className="max-h-64 overflow-y-auto space-y-2 border border-gray-200 dark:border-gray-700 rounded-lg p-3 bg-gray-50/50 dark:bg-gray-900/30">
                                    {mostExpensiveDay.transactions
                                        .sort((a, b) => b.amount - a.amount)
                                        .map((t, idx) => {
                                            const cat = categories.find(c => c.id === t.category_id);
                                            return (
                                                <div key={idx} className="flex items-center justify-between p-2 rounded bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 hover:border-rose-300 dark:hover:border-rose-700 transition-colors">
                                                    <div className="flex items-center gap-2 flex-1 min-w-0">
                                                        <span className="text-base shrink-0">{cat?.icon || '💰'}</span>
                                                        <div className="min-w-0 flex-1">
                                                            <div className="text-sm font-medium truncate">{t.description}</div>
                                                            <div className="text-xs text-muted-foreground">{cat?.name || 'Uncategorized'}</div>
                                                        </div>
                                                    </div>
                                                    <div className="text-sm font-bold text-rose-600 dark:text-rose-400 shrink-0 ml-3">
                                                        ${t.amount.toFixed(2)}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                </div>
                            </div>

                            {/* Insights */}
                            {mostExpensiveDay.total > avgDailyExpense * 3 && (
                                <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
                                    <p className="text-sm font-semibold text-amber-900 dark:text-amber-100 mb-2 flex items-center gap-2">
                                        <AlertCircle className="h-4 w-4" />
                                        Spending Alert
                                    </p>
                                    <ul className="text-xs text-amber-700 dark:text-amber-300 space-y-1">
                                        <li>• This day's spending was {(mostExpensiveDay.total / avgDailyExpense).toFixed(1)}x your average daily expense</li>
                                        <li>• Consider if these expenses were planned or unexpected</li>
                                        <li>• Review if similar spikes occur regularly and plan accordingly</li>
                                    </ul>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="text-center py-8">
                            <TrendingUp className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                            <p className="text-lg font-semibold mb-2">No Expense Data</p>
                            <p className="text-sm text-muted-foreground">
                                Add expense transactions to analyze your spending patterns.
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Spending Velocity */}
            <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 border-2 border-purple-200 dark:border-purple-900">
                <CardHeader className="bg-linear-to-r from-purple-50 to-violet-50 dark:from-purple-950/20 dark:to-violet-950/20">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Activity className="h-5 w-5 text-purple-600" />
                        Spending Velocity
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                    {weeklySpending.some(w => w.amount > 0) ? (
                        <div className="space-y-6">
                            {/* Velocity Status */}
                            <div className={`p-6 rounded-xl border-2 ${velocityStatus === 'accelerating-high' ? 'bg-red-100 dark:bg-red-950/30 border-red-400 dark:border-red-700' :
                                velocityStatus === 'accelerating-moderate' ? 'bg-orange-100 dark:bg-orange-950/30 border-orange-400 dark:border-orange-700' :
                                    velocityStatus === 'stable' ? 'bg-green-100 dark:bg-green-950/30 border-green-400 dark:border-green-700' :
                                        velocityStatus === 'decelerating-moderate' ? 'bg-blue-100 dark:bg-blue-950/30 border-blue-400 dark:border-blue-700' :
                                            'bg-cyan-100 dark:bg-cyan-950/30 border-cyan-400 dark:border-cyan-700'
                                }`}>
                                <div className="text-center">
                                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 ${
                                        velocityStatus.startsWith('accelerating') ? 'bg-red-600' :
                                        velocityStatus === 'stable' ? 'bg-green-600' :
                                        'bg-blue-600'
                                    } text-white">
                                        {velocityStatus.startsWith('accelerating') ? (
                                            <TrendingUp className="h-8 w-8" />
                                        ) : velocityStatus === 'stable' ? (
                                            <Target className="h-8 w-8" />
                                        ) : (
                                            <TrendingDown className="h-8 w-8" />
                                        )}
                                    </div>
                                    <h3 className={`text-2xl font-bold mb-2 ${velocityStatus === 'accelerating-high' ? 'text-red-900 dark:text-red-100' :
                                        velocityStatus === 'accelerating-moderate' ? 'text-orange-900 dark:text-orange-100' :
                                            velocityStatus === 'stable' ? 'text-green-900 dark:text-green-100' :
                                                velocityStatus === 'decelerating-moderate' ? 'text-blue-900 dark:text-blue-100' :
                                                    'text-cyan-900 dark:text-cyan-100'
                                        }`}>
                                        {
                                            velocityStatus === 'accelerating-high' ? '🚀 Rapidly Accelerating' :
                                                velocityStatus === 'accelerating-moderate' ? '📈 Accelerating' :
                                                    velocityStatus === 'stable' ? '⚖️ Stable' :
                                                        velocityStatus === 'decelerating-moderate' ? '📉 Decelerating' :
                                                            '🎯 Strongly Decelerating'
                                        }
                                    </h3>
                                    <div className={`text-4xl font-bold mb-2 ${isAccelerating ? 'text-red-600 dark:text-red-400' : 'text-blue-600 dark:text-blue-400'
                                        }`}>
                                        {isAccelerating ? '+' : ''}{avgPercentChange.toFixed(1)}%
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                        Average weekly change in spending
                                    </p>
                                </div>
                            </div>

                            {/* Weekly Spending Trend Chart */}
                            <div>
                                <h4 className="text-sm font-semibold mb-3">4-Week Spending Trend</h4>
                                <ResponsiveContainer width="100%" height={200}>
                                    <LineChart data={weeklySpending}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="week" tick={{ fontSize: 12 }} />
                                        <YAxis tick={{ fontSize: 12 }} />
                                        <Tooltip formatter={(value: number) => `$${value.toFixed(2)}`} />
                                        <Line
                                            type="monotone"
                                            dataKey="amount"
                                            stroke="#9333ea"
                                            strokeWidth={3}
                                            dot={{ fill: '#9333ea', r: 5 }}
                                            activeDot={{ r: 7 }}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>

                            {/* Velocity Metrics */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700">
                                    <div className="text-xs text-muted-foreground mb-1">This Week</div>
                                    <div className="text-lg font-bold">
                                        ${currentWeekSpending.toFixed(2)}
                                    </div>
                                </div>
                                <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700">
                                    <div className="text-xs text-muted-foreground mb-1">Avg Weekly</div>
                                    <div className="text-lg font-bold">
                                        ${(weeklySpending.reduce((sum, w) => sum + w.amount, 0) / 4).toFixed(2)}
                                    </div>
                                </div>
                                <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700">
                                    <div className="text-xs text-muted-foreground mb-1">Weekly Change</div>
                                    <div className={`text-lg font-bold ${avgWeeklyChange > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'
                                        }`}>
                                        {avgWeeklyChange > 0 ? '+' : ''}${avgWeeklyChange.toFixed(2)}
                                    </div>
                                </div>
                                <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700">
                                    <div className="text-xs text-muted-foreground mb-1">Projected Next</div>
                                    <div className="text-lg font-bold text-purple-600 dark:text-purple-400">
                                        ${Math.max(0, projectedNextWeek).toFixed(2)}
                                    </div>
                                </div>
                            </div>

                            {/* Week-over-Week Comparison */}
                            <div>
                                <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                                    <ArrowUpRight className="h-4 w-4 text-purple-600" />
                                    Week-over-Week Changes
                                </h4>
                                <div className="space-y-2">
                                    {weeklyChanges.map((change, idx) => (
                                        <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700">
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-medium">
                                                    Week {idx + 1} → Week {idx + 2}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className={`text-sm font-bold ${change.change > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'
                                                    }`}>
                                                    {change.change > 0 ? '+' : ''}${change.change.toFixed(2)}
                                                </span>
                                                <span className={`text-xs font-semibold px-2 py-1 rounded-full ${change.percentChange > 0
                                                    ? 'bg-red-100 dark:bg-red-950/30 text-red-700 dark:text-red-300'
                                                    : 'bg-green-100 dark:bg-green-950/30 text-green-700 dark:text-green-300'
                                                    }`}>
                                                    {change.percentChange > 0 ? '+' : ''}{change.percentChange.toFixed(1)}%
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Momentum Indicator */}
                            <div className={`p-4 rounded-lg border-2 ${isMomentumIncreasing
                                ? 'bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-800'
                                : 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800'
                                }`}>
                                <div className="flex items-start gap-3">
                                    <div className={`p-2 rounded-full ${isMomentumIncreasing ? 'bg-orange-600' : 'bg-blue-600'
                                        } text-white`}>
                                        <Activity className="h-4 w-4" />
                                    </div>
                                    <div>
                                        <p className={`text-sm font-semibold mb-1 ${isMomentumIncreasing
                                            ? 'text-orange-900 dark:text-orange-100'
                                            : 'text-blue-900 dark:text-blue-100'
                                            }`}>
                                            Momentum: {isMomentumIncreasing ? 'Increasing' : 'Decreasing'}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {isMomentumIncreasing
                                                ? 'Your spending rate is accelerating faster over time. Consider implementing spending controls.'
                                                : 'Your spending rate is slowing down. Good progress on controlling expenses!'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Insights & Recommendations */}
                            {velocityStatus.startsWith('accelerating') && (
                                <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
                                    <p className="text-sm font-semibold text-amber-900 dark:text-amber-100 mb-2 flex items-center gap-2">
                                        <AlertCircle className="h-4 w-4" />
                                        Spending Acceleration Detected
                                    </p>
                                    <ul className="text-xs text-amber-700 dark:text-amber-300 space-y-1">
                                        <li>• Your spending has increased by {Math.abs(avgPercentChange).toFixed(1)}% per week on average</li>
                                        <li>• At this rate, next week's spending could reach ${projectedNextWeek.toFixed(2)}</li>
                                        <li>• Review recent purchases and identify non-essential expenses to cut back</li>
                                        <li>• Set spending limits for high-velocity categories</li>
                                    </ul>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="text-center py-8">
                            <Activity className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                            <p className="text-lg font-semibold mb-2">No Spending Data</p>
                            <p className="text-sm text-muted-foreground">
                                Add more expense transactions to analyze your spending velocity trends.
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Category Budget Health */}
            <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 border-2 border-teal-200 dark:border-teal-900">
                <CardHeader className="bg-linear-to-r from-teal-50 to-cyan-50 dark:from-teal-950/20 dark:to-cyan-950/20">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Target className="h-5 w-5 text-teal-600" />
                        Category Budget Health
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                    {categoryHealthData.length > 0 ? (
                        <div className="space-y-6">
                            {/* Overall Health Summary */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                <div className={`p-4 rounded-lg border-2 ${avgCategoryHealth >= 75 ? 'bg-green-50 dark:bg-green-950/20 border-green-300 dark:border-green-700' :
                                    avgCategoryHealth >= 50 ? 'bg-yellow-50 dark:bg-yellow-950/20 border-yellow-300 dark:border-yellow-700' :
                                        'bg-red-50 dark:bg-red-950/20 border-red-300 dark:border-red-700'
                                    }`}>
                                    <div className="text-xs text-muted-foreground mb-1">Avg Health</div>
                                    <div className={`text-2xl font-bold ${avgCategoryHealth >= 75 ? 'text-green-600 dark:text-green-400' :
                                        avgCategoryHealth >= 50 ? 'text-yellow-600 dark:text-yellow-400' :
                                            'text-red-600 dark:text-red-400'
                                        }`}>
                                        {avgCategoryHealth.toFixed(0)}%
                                    </div>
                                </div>
                                <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700">
                                    <div className="text-xs text-muted-foreground mb-1">Healthy</div>
                                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                                        {categoriesHealthy}
                                    </div>
                                </div>
                                <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700">
                                    <div className="text-xs text-muted-foreground mb-1">At Risk</div>
                                    <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                                        {categoriesAtRisk}
                                    </div>
                                </div>
                                <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700">
                                    <div className="text-xs text-muted-foreground mb-1">Over Budget</div>
                                    <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                                        {categoriesOverBudget}
                                    </div>
                                </div>
                            </div>

                            {/* Category Health Details */}
                            <div className="space-y-4">
                                {categoryHealthData.map((cat, idx) => (
                                    <div key={idx} className={`p-4 rounded-lg border-2 ${cat.healthStatus === 'excellent' ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800' :
                                        cat.healthStatus === 'good' ? 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800' :
                                            cat.healthStatus === 'warning' ? 'bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-800' :
                                                cat.healthStatus === 'critical' ? 'bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-800' :
                                                    'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800'
                                        }`}>
                                        {/* Category Header */}
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="flex items-center gap-3">
                                                <span className="text-2xl">{cat.icon}</span>
                                                <div>
                                                    <h4 className="font-semibold text-lg">{cat.category}</h4>
                                                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                                                        <span className={`px-2 py-0.5 rounded-full font-semibold ${cat.healthStatus === 'excellent' ? 'bg-green-600 text-white' :
                                                            cat.healthStatus === 'good' ? 'bg-blue-600 text-white' :
                                                                cat.healthStatus === 'warning' ? 'bg-yellow-600 text-white' :
                                                                    cat.healthStatus === 'critical' ? 'bg-orange-600 text-white' :
                                                                        'bg-red-600 text-white'
                                                            }`}>
                                                            {cat.healthStatus === 'excellent' ? '✓ Excellent' :
                                                                cat.healthStatus === 'good' ? '✓ Good' :
                                                                    cat.healthStatus === 'warning' ? '⚠ Warning' :
                                                                        cat.healthStatus === 'critical' ? '⚠ Critical' :
                                                                            '✗ Over Budget'}
                                                        </span>
                                                        <span>Health: {cat.healthScore.toFixed(0)}/100</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-2xl font-bold">
                                                    {cat.percentUsed.toFixed(0)}%
                                                </div>
                                                <div className="text-xs text-muted-foreground">Used</div>
                                            </div>
                                        </div>

                                        {/* Budget Progress Bar */}
                                        <div className="mb-3">
                                            <div className="flex justify-between text-sm mb-2">
                                                <span className="font-medium">${cat.spent.toFixed(2)} spent</span>
                                                <span className="text-muted-foreground">${cat.budget.toFixed(2)} budget</span>
                                            </div>
                                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                                                <div
                                                    className={`h-full transition-all duration-500 ${cat.healthStatus === 'excellent' ? 'bg-linear-to-r from-green-500 to-emerald-500' :
                                                        cat.healthStatus === 'good' ? 'bg-linear-to-r from-blue-500 to-cyan-500' :
                                                            cat.healthStatus === 'warning' ? 'bg-linear-to-r from-yellow-500 to-amber-500' :
                                                                cat.healthStatus === 'critical' ? 'bg-linear-to-r from-orange-500 to-red-500' :
                                                                    'bg-linear-to-r from-red-600 to-rose-600'
                                                        }`}
                                                    style={{ width: `${Math.min(100, cat.percentUsed)}%` }}
                                                />
                                            </div>
                                        </div>

                                        {/* Spending Metrics Grid */}
                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
                                            <div className="text-center p-2 rounded bg-white dark:bg-gray-900/50">
                                                <div className="text-xs text-muted-foreground">Remaining</div>
                                                <div className={`text-sm font-bold ${cat.remaining > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                                                    }`}>
                                                    ${Math.abs(cat.remaining).toFixed(2)}
                                                </div>
                                            </div>
                                            <div className="text-center p-2 rounded bg-white dark:bg-gray-900/50">
                                                <div className="text-xs text-muted-foreground">Days Left</div>
                                                <div className="text-sm font-bold">
                                                    {cat.daysRemaining}
                                                </div>
                                            </div>
                                            <div className="text-center p-2 rounded bg-white dark:bg-gray-900/50">
                                                <div className="text-xs text-muted-foreground">Pace</div>
                                                <div className={`text-sm font-bold ${cat.paceStatus === 'under' ? 'text-green-600 dark:text-green-400' :
                                                    cat.paceStatus === 'ontrack' ? 'text-blue-600 dark:text-blue-400' :
                                                        'text-red-600 dark:text-red-400'
                                                    }`}>
                                                    {cat.spendingPace.toFixed(1)}x
                                                </div>
                                            </div>
                                            <div className="text-center p-2 rounded bg-white dark:bg-gray-900/50">
                                                <div className="text-xs text-muted-foreground">Projected</div>
                                                <div className={`text-sm font-bold ${cat.projectedOverage > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'
                                                    }`}>
                                                    ${cat.projectedTotal.toFixed(0)}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Alerts & Recommendations */}
                                        {(cat.healthStatus === 'critical' || cat.healthStatus === 'over' || cat.projectedOverage > 0) && (
                                            <div className={`p-3 rounded-lg border ${cat.healthStatus === 'over' ? 'bg-red-50 dark:bg-red-950/30 border-red-300 dark:border-red-700' :
                                                'bg-amber-50 dark:bg-amber-950/20 border-amber-300 dark:border-amber-700'
                                                }`}>
                                                <p className={`text-xs font-semibold mb-1 flex items-center gap-2 ${cat.healthStatus === 'over' ? 'text-red-900 dark:text-red-100' : 'text-amber-900 dark:text-amber-100'
                                                    }`}>
                                                    <AlertCircle className="h-3 w-3" />
                                                    {cat.healthStatus === 'over' ? 'Budget Exceeded!' : 'Budget Alert'}
                                                </p>
                                                <ul className={`text-xs space-y-0.5 ${cat.healthStatus === 'over' ? 'text-red-700 dark:text-red-300' : 'text-amber-700 dark:text-amber-300'
                                                    }`}>
                                                    {cat.healthStatus === 'over' && (
                                                        <li>• You've exceeded this budget by ${(cat.spent - cat.budget).toFixed(2)}</li>
                                                    )}
                                                    {cat.projectedOverage > 0 && cat.healthStatus !== 'over' && (
                                                        <li>• At current pace, you'll exceed budget by ${cat.projectedOverage.toFixed(2)}</li>
                                                    )}
                                                    {cat.paceStatus === 'over' && (
                                                        <li>• Spending {cat.spendingPace.toFixed(1)}x faster than ideal pace</li>
                                                    )}
                                                    {cat.daysRemaining > 0 && cat.remaining > 0 && (
                                                        <li>• Keep daily spending under ${(cat.remaining / cat.daysRemaining).toFixed(2)} to stay on budget</li>
                                                    )}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>

                            {/* Overall Budget Health Insights */}
                            {categoriesOverBudget > 0 && (
                                <div className="p-4 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800">
                                    <p className="text-sm font-semibold text-red-900 dark:text-red-100 mb-2 flex items-center gap-2">
                                        <AlertCircle className="h-4 w-4" />
                                        Budget Health Warning
                                    </p>
                                    <ul className="text-xs text-red-700 dark:text-red-300 space-y-1">
                                        <li>• {categoriesOverBudget} categor{categoriesOverBudget === 1 ? 'y is' : 'ies are'} over budget</li>
                                        <li>• Review spending in critical categories and adjust habits</li>
                                        <li>• Consider increasing budgets or reducing expenses in problem areas</li>
                                        {categoriesAtRisk > 0 && <li>• {categoriesAtRisk} additional categor{categoriesAtRisk === 1 ? 'y is' : 'ies are'} at risk of going over</li>}
                                    </ul>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="text-center py-8">
                            <Target className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                            <p className="text-lg font-semibold mb-2">No Budgets Set</p>
                            <p className="text-sm text-muted-foreground mb-4">
                                Set category budgets in Settings to track your spending health.
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Spending Heatmap Calendar */}
            <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 border-2 border-indigo-200 dark:border-indigo-900">
                <CardHeader className="bg-linear-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/20 dark:to-purple-950/20">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-indigo-600" />
                        Spending Heatmap (Last 90 Days)
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                    {calendarData.length > 0 ? (
                        <div className="space-y-6">
                            {/* Heatmap Statistics */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700">
                                    <div className="text-xs text-muted-foreground mb-1">Days with Spending</div>
                                    <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                                        {daysWithSpending}
                                    </div>
                                </div>
                                <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700">
                                    <div className="text-xs text-muted-foreground mb-1">Avg Daily</div>
                                    <div className="text-2xl font-bold">
                                        ${avgDailySpendingHeatmap.toFixed(0)}
                                    </div>
                                </div>
                                <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700">
                                    <div className="text-xs text-muted-foreground mb-1">High Activity Days</div>
                                    <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                                        {highSpendingDays}
                                    </div>
                                </div>
                                <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700">
                                    <div className="text-xs text-muted-foreground mb-1">Peak Day</div>
                                    <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                                        ${maxDailySpending.toFixed(0)}
                                    </div>
                                </div>
                            </div>

                            {/* Legend */}
                            <div className="flex items-center justify-between flex-wrap gap-4">
                                <div className="flex items-center gap-2 text-sm">
                                    <span className="text-muted-foreground">Intensity:</span>
                                    <div className="flex items-center gap-1">
                                        <div className="w-6 h-6 rounded border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-800" title="No spending" />
                                        <div className="w-6 h-6 rounded bg-green-200 dark:bg-green-900" title="Low" />
                                        <div className="w-6 h-6 rounded bg-yellow-300 dark:bg-yellow-700" title="Medium" />
                                        <div className="w-6 h-6 rounded bg-orange-400 dark:bg-orange-600" title="High" />
                                        <div className="w-6 h-6 rounded bg-red-500 dark:bg-red-500" title="Very High" />
                                    </div>
                                </div>
                                <div className="text-xs text-muted-foreground">
                                    Click on any day to see details
                                </div>
                            </div>

                            {/* Calendar Grid */}
                            <div className="overflow-x-auto">
                                <div className="min-w-[600px]">
                                    {/* Day Headers */}
                                    <div className="grid grid-cols-7 gap-1 mb-2">
                                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, idx) => (
                                            <div key={idx} className="text-center text-xs font-semibold text-muted-foreground p-2">
                                                {day}
                                            </div>
                                        ))}
                                    </div>

                                    {/* Calendar Weeks */}
                                    <div className="space-y-1">
                                        {calendarWeeks.map((week, weekIdx) => (
                                            <div key={weekIdx} className="grid grid-cols-7 gap-1">
                                                {week.map((day, dayIdx) => {
                                                    if (!day.dateStr) {
                                                        return <div key={dayIdx} className="aspect-square" />;
                                                    }

                                                    const getColorClass = (intensity: number) => {
                                                        if (intensity === 0) return 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600';
                                                        if (intensity <= 0.25) return 'bg-green-200 dark:bg-green-900 border-green-300 dark:border-green-700';
                                                        if (intensity <= 0.5) return 'bg-yellow-300 dark:bg-yellow-700 border-yellow-400 dark:border-yellow-600';
                                                        if (intensity <= 0.75) return 'bg-orange-400 dark:bg-orange-600 border-orange-500 dark:border-orange-500';
                                                        return 'bg-red-500 dark:bg-red-500 border-red-600 dark:border-red-600';
                                                    };

                                                    return (
                                                        <div
                                                            key={dayIdx}
                                                            className={`aspect-square rounded border-2 transition-all duration-200 hover:scale-110 hover:shadow-lg cursor-pointer relative group ${getColorClass(day.intensity)
                                                                } ${day.isToday ? 'ring-2 ring-indigo-600 ring-offset-2' : ''
                                                                }`}
                                                            title={`${format(day.date, 'MMM dd, yyyy')}${day.amount > 0 ? `\n$${day.amount.toFixed(2)}` : '\nNo spending'}`}
                                                        >
                                                            {/* Day Number */}
                                                            <div className="absolute inset-0 flex items-center justify-center">
                                                                <span className={`text-xs font-semibold ${day.intensity > 0.5 ? 'text-white' : 'text-gray-700 dark:text-gray-300'
                                                                    }`}>
                                                                    {format(day.date, 'd')}
                                                                </span>
                                                            </div>

                                                            {/* Tooltip on Hover */}
                                                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block z-10">
                                                                <div className="bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-xs rounded py-2 px-3 whitespace-nowrap shadow-lg">
                                                                    <div className="font-semibold">{format(day.date, 'EEE, MMM dd')}</div>
                                                                    <div className="mt-1">
                                                                        {day.amount > 0 ? (
                                                                            <span className="font-bold">${day.amount.toFixed(2)}</span>
                                                                        ) : (
                                                                            <span className="text-gray-400 dark:text-gray-600">No spending</span>
                                                                        )}
                                                                    </div>
                                                                    {day.isWeekend && <div className="text-gray-400 dark:text-gray-600 text-[10px] mt-0.5">Weekend</div>}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Weekday vs Weekend Analysis */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="w-3 h-3 rounded-full bg-blue-600"></div>
                                        <h4 className="text-sm font-semibold">Weekday Spending</h4>
                                    </div>
                                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-1">
                                        ${weekdaySpending.toFixed(2)}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                        Avg: ${(weekdaySpending / 65).toFixed(2)}/day
                                    </div>
                                </div>
                                <div className="p-4 rounded-lg bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="w-3 h-3 rounded-full bg-purple-600"></div>
                                        <h4 className="text-sm font-semibold">Weekend Spending</h4>
                                    </div>
                                    <div className="text-2xl font-bold text-purple-600 dark:text-purple-400 mb-1">
                                        ${weekendSpending.toFixed(2)}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                        Avg: ${(weekendSpending / 26).toFixed(2)}/day
                                    </div>
                                </div>
                            </div>

                            {/* Patterns & Insights */}
                            <div className="p-4 rounded-lg bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-800">
                                <p className="text-sm font-semibold text-indigo-900 dark:text-indigo-100 mb-2 flex items-center gap-2">
                                    <Target className="h-4 w-4" />
                                    Spending Patterns
                                </p>
                                <ul className="text-xs text-indigo-700 dark:text-indigo-300 space-y-1">
                                    <li>• You had spending activity on {daysWithSpending} out of {heatmapDays} days ({((daysWithSpending / heatmapDays) * 100).toFixed(0)}%)</li>
                                    <li>• {highSpendingDays} days had above-average spending (1.5x+ your daily average)</li>
                                    <li>• {weekendSpending > weekdaySpending ? 'Weekend' : 'Weekday'} spending is higher on average</li>
                                    {maxDailySpending > avgDailySpendingHeatmap * 3 && (
                                        <li>• Your peak spending day was {(maxDailySpending / avgDailySpendingHeatmap).toFixed(1)}x your average - review for unusual expenses</li>
                                    )}
                                </ul>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-8">
                            <Calendar className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                            <p className="text-lg font-semibold mb-2">No Spending Data</p>
                            <p className="text-sm text-muted-foreground">
                                Add expense transactions to see your spending patterns on the calendar.
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Waterfall Chart - Cash Flow Visualization */}
            <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 border-2 border-emerald-200 dark:border-emerald-900">
                <CardHeader className="bg-linear-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-emerald-600" />
                        Cash Flow Waterfall (Last {waterfallMonths} Months)
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                    {waterfallData.length > 0 && waterfallData.some(m => m.income > 0 || m.expenses > 0) ? (
                        <div className="space-y-6">
                            {/* Summary Metrics */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                <div className="p-4 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800">
                                    <div className="text-xs text-muted-foreground mb-1">Total Inflow</div>
                                    <div className="text-xl font-bold text-green-600 dark:text-green-400">
                                        +${totalInflowWaterfall.toFixed(2)}
                                    </div>
                                </div>
                                <div className="p-4 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800">
                                    <div className="text-xs text-muted-foreground mb-1">Total Outflow</div>
                                    <div className="text-xl font-bold text-red-600 dark:text-red-400">
                                        -${totalOutflowWaterfall.toFixed(2)}
                                    </div>
                                </div>
                                <div className={`p-4 rounded-lg border ${netChangeWaterfall >= 0
                                    ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800'
                                    : 'bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-800'
                                    }`}>
                                    <div className="text-xs text-muted-foreground mb-1">Net Change</div>
                                    <div className={`text-xl font-bold ${netChangeWaterfall >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-orange-600 dark:text-orange-400'
                                        }`}>
                                        {netChangeWaterfall >= 0 ? '+' : ''}${netChangeWaterfall.toFixed(2)}
                                    </div>
                                </div>
                                <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700">
                                    <div className="text-xs text-muted-foreground mb-1">Avg Monthly</div>
                                    <div className={`text-xl font-bold ${avgMonthlyNet >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                                        }`}>
                                        {avgMonthlyNet >= 0 ? '+' : ''}${avgMonthlyNet.toFixed(0)}
                                    </div>
                                </div>
                            </div>

                            {/* Waterfall Chart */}
                            <div>
                                <h4 className="text-sm font-semibold mb-3">Monthly Cash Flow</h4>
                                <ResponsiveContainer width="100%" height={350}>
                                    <ComposedChart data={waterfallChartData}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                                        <YAxis tick={{ fontSize: 12 }} />
                                        <Tooltip
                                            formatter={(value: number, name: string) => {
                                                if (name === 'Expenses') {
                                                    return [`$${Math.abs(value).toFixed(2)}`, name];
                                                }
                                                return [`$${value.toFixed(2)}`, name];
                                            }}
                                        />
                                        <Legend />
                                        <Bar dataKey="Income" fill="#10b981" radius={[8, 8, 0, 0]} />
                                        <Bar dataKey="Expenses" fill="#ef4444" radius={[8, 8, 0, 0]} />
                                        <Line
                                            type="monotone"
                                            dataKey="Balance"
                                            stroke="#6366f1"
                                            strokeWidth={3}
                                            dot={{ fill: '#6366f1', r: 5 }}
                                            activeDot={{ r: 7 }}
                                        />
                                    </ComposedChart>
                                </ResponsiveContainer>
                            </div>

                            {/* Monthly Breakdown */}
                            <div>
                                <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                                    <ArrowUpRight className="h-4 w-4 text-emerald-600" />
                                    Month-by-Month Breakdown
                                </h4>
                                <div className="space-y-2">
                                    {waterfallData.map((month, idx) => (
                                        <div key={idx} className={`p-4 rounded-lg border-2 ${month.isPositive
                                            ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800'
                                            : 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800'
                                            }`}>
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-lg font-bold">{month.month}</span>
                                                    {month.isPositive ? (
                                                        <TrendingUp className="h-4 w-4 text-green-600" />
                                                    ) : (
                                                        <TrendingDown className="h-4 w-4 text-red-600" />
                                                    )}
                                                </div>
                                                <div className={`text-xl font-bold ${month.isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                                                    }`}>
                                                    {month.net >= 0 ? '+' : ''}${month.net.toFixed(2)}
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-3 gap-4 text-sm">
                                                <div>
                                                    <div className="text-xs text-muted-foreground mb-1">Income</div>
                                                    <div className="font-semibold text-green-600 dark:text-green-400">
                                                        +${month.income.toFixed(2)}
                                                    </div>
                                                </div>
                                                <div>
                                                    <div className="text-xs text-muted-foreground mb-1">Expenses</div>
                                                    <div className="font-semibold text-red-600 dark:text-red-400">
                                                        -${month.expenses.toFixed(2)}
                                                    </div>
                                                </div>
                                                <div>
                                                    <div className="text-xs text-muted-foreground mb-1">Balance</div>
                                                    <div className="font-semibold text-indigo-600 dark:text-indigo-400">
                                                        ${month.runningBalance.toFixed(2)}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Performance Summary */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="p-4 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="p-2 rounded-full bg-green-600 text-white">
                                            <TrendingUp className="h-4 w-4" />
                                        </div>
                                        <h4 className="text-sm font-semibold">Best Month</h4>
                                    </div>
                                    <div className="text-2xl font-bold text-green-600 dark:text-green-400 mb-1">
                                        {bestMonth.month}
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                        Net: +${bestMonth.net.toFixed(2)}
                                    </div>
                                </div>
                                <div className="p-4 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="p-2 rounded-full bg-red-600 text-white">
                                            <TrendingDown className="h-4 w-4" />
                                        </div>
                                        <h4 className="text-sm font-semibold">Worst Month</h4>
                                    </div>
                                    <div className="text-2xl font-bold text-red-600 dark:text-red-400 mb-1">
                                        {worstMonth.month}
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                        Net: ${worstMonth.net.toFixed(2)}
                                    </div>
                                </div>
                            </div>

                            {/* Insights */}
                            <div className="p-4 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800">
                                <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-100 mb-2 flex items-center gap-2">
                                    <Target className="h-4 w-4" />
                                    Cash Flow Insights
                                </p>
                                <ul className="text-xs text-emerald-700 dark:text-emerald-300 space-y-1">
                                    <li>• {positiveMonths} month{positiveMonths !== 1 ? 's' : ''} with positive cash flow, {negativeMonths} with negative</li>
                                    <li>• Your running balance {netChangeWaterfall >= 0 ? 'increased' : 'decreased'} by ${Math.abs(netChangeWaterfall).toFixed(2)} over {waterfallMonths} months</li>
                                    <li>• Average monthly net: {avgMonthlyNet >= 0 ? '+' : ''}${avgMonthlyNet.toFixed(2)}</li>
                                    {positiveMonths >= waterfallMonths * 0.67 && (
                                        <li>• Strong performance! You maintained positive cash flow in most months</li>
                                    )}
                                    {negativeMonths > positiveMonths && (
                                        <li>• Consider reviewing expenses - you've had more negative months than positive</li>
                                    )}
                                    {Math.abs(bestMonth.net - worstMonth.net) > avgMonthlyNet * 2 && (
                                        <li>• High variance between best and worst months - aim for more consistent cash flow</li>
                                    )}
                                </ul>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-8">
                            <TrendingUp className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                            <p className="text-lg font-semibold mb-2">No Cash Flow Data</p>
                            <p className="text-sm text-muted-foreground">
                                Add income and expense transactions to visualize your cash flow over time.
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Sankey Flow Diagram */}
            <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 border-2 border-violet-200 dark:border-violet-900">
                <CardHeader className="bg-linear-to-r from-violet-50 to-fuchsia-50 dark:from-violet-950/20 dark:to-fuchsia-950/20">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <ArrowUpRight className="h-5 w-5 text-violet-600" />
                        Money Flow Analysis
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                    {(sankeyIncomeSources.length > 0 || sankeyExpenseCategories.length > 0) ? (
                        <div className="space-y-6">
                            {/* Flow Summary */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div className="p-4 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800">
                                    <div className="text-xs text-muted-foreground mb-1">Total Income</div>
                                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                                        ${totalIncome.toFixed(2)}
                                    </div>
                                    <div className="text-xs text-muted-foreground mt-1">
                                        {sankeyIncomeSources.length} source{sankeyIncomeSources.length !== 1 ? 's' : ''}
                                    </div>
                                </div>
                                <div className="p-4 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800">
                                    <div className="text-xs text-muted-foreground mb-1">Total Expenses</div>
                                    <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                                        ${totalExpenses.toFixed(2)}
                                    </div>
                                    <div className="text-xs text-muted-foreground mt-1">
                                        {sankeyExpenseCategories.length} categor{sankeyExpenseCategories.length !== 1 ? 'ies' : 'y'}
                                    </div>
                                </div>
                                <div className={`p-4 rounded-lg border ${savingsAmount >= 0
                                    ? 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800'
                                    : 'bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-800'
                                    }`}>
                                    <div className="text-xs text-muted-foreground mb-1">
                                        {savingsAmount >= 0 ? 'Savings' : 'Deficit'}
                                    </div>
                                    <div className={`text-2xl font-bold ${savingsAmount >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-orange-600 dark:text-orange-400'
                                        }`}>
                                        {savingsAmount >= 0 ? '+' : ''}${savingsAmount.toFixed(2)}
                                    </div>
                                    <div className="text-xs text-muted-foreground mt-1">
                                        {Math.abs(savingsPercentage).toFixed(1)}% of income
                                    </div>
                                </div>
                            </div>

                            {/* Visual Flow Diagram */}
                            <div className="space-y-4">
                                <h4 className="text-sm font-semibold">Income → Expenses Flow</h4>

                                {/* Three Column Layout */}
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                    {/* Income Sources (Left) */}
                                    <div className="space-y-2">
                                        <div className="text-xs font-semibold text-green-700 dark:text-green-400 mb-3">
                                            INCOME SOURCES
                                        </div>
                                        {topIncomeSources.map((source, idx) => {
                                            const cat = categories.find(c => c.name === source.name);
                                            return (
                                                <div key={idx} className="relative">
                                                    <div className="p-3 rounded-lg bg-green-100 dark:bg-green-950/30 border-2 border-green-300 dark:border-green-700 hover:shadow-md transition-shadow">
                                                        <div className="flex items-center justify-between mb-1">
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-base">{cat?.icon || '💰'}</span>
                                                                <span className="text-sm font-semibold truncate">{source.name}</span>
                                                            </div>
                                                            <span className="text-xs font-bold text-green-700 dark:text-green-400">
                                                                {source.percentage.toFixed(0)}%
                                                            </span>
                                                        </div>
                                                        <div className="text-lg font-bold text-green-600 dark:text-green-400">
                                                            ${source.amount.toFixed(2)}
                                                        </div>
                                                        <div className="w-full bg-green-200 dark:bg-green-900 rounded-full h-1.5 mt-2">
                                                            <div
                                                                className="h-full bg-green-600 dark:bg-green-500 rounded-full transition-all duration-500"
                                                                style={{ width: `${source.percentage}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* Center Flow Arrow */}
                                    <div className="hidden lg:flex flex-col items-center justify-center space-y-4">
                                        <div className="text-center p-6 rounded-xl bg-linear-to-br from-violet-100 to-fuchsia-100 dark:from-violet-950/40 dark:to-fuchsia-950/40 border-2 border-violet-300 dark:border-violet-700">
                                            <div className="text-xs text-muted-foreground mb-2">Total Flow</div>
                                            <div className="text-3xl font-bold text-violet-600 dark:text-violet-400 mb-2">
                                                ${totalIncome.toFixed(0)}
                                            </div>
                                            <div className="flex items-center justify-center gap-2 mb-3">
                                                <ArrowDownRight className="h-6 w-6 text-violet-600" />
                                            </div>
                                            <div className="space-y-1 text-xs">
                                                <div className="flex justify-between">
                                                    <span className="text-red-600 dark:text-red-400">Expenses:</span>
                                                    <span className="font-bold">{expensesPercentage.toFixed(1)}%</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-blue-600 dark:text-blue-400">
                                                        {savingsAmount >= 0 ? 'Savings:' : 'Deficit:'}
                                                    </span>
                                                    <span className="font-bold">{Math.abs(savingsPercentage).toFixed(1)}%</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Expense Categories (Right) */}
                                    <div className="space-y-2">
                                        <div className="text-xs font-semibold text-red-700 dark:text-red-400 mb-3">
                                            EXPENSE CATEGORIES
                                        </div>
                                        {topExpenseCategories.map((expense, idx) => {
                                            const cat = categories.find(c => c.name === expense.name);
                                            return (
                                                <div key={idx} className="relative">
                                                    <div className="p-3 rounded-lg bg-red-100 dark:bg-red-950/30 border-2 border-red-300 dark:border-red-700 hover:shadow-md transition-shadow">
                                                        <div className="flex items-center justify-between mb-1">
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-base">{cat?.icon || '💸'}</span>
                                                                <span className="text-sm font-semibold truncate">{expense.name}</span>
                                                            </div>
                                                            <span className="text-xs font-bold text-red-700 dark:text-red-400">
                                                                {expense.percentage.toFixed(0)}%
                                                            </span>
                                                        </div>
                                                        <div className="text-lg font-bold text-red-600 dark:text-red-400">
                                                            ${expense.amount.toFixed(2)}
                                                        </div>
                                                        <div className="w-full bg-red-200 dark:bg-red-900 rounded-full h-1.5 mt-2">
                                                            <div
                                                                className="h-full bg-red-600 dark:bg-red-500 rounded-full transition-all duration-500"
                                                                style={{ width: `${expense.percentage}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>

                            {/* Allocation Breakdown */}
                            <div>
                                <h4 className="text-sm font-semibold mb-3">Income Allocation</h4>
                                <div className="space-y-3">
                                    <div>
                                        <div className="flex justify-between text-sm mb-2">
                                            <span className="font-medium">To Expenses</span>
                                            <span className="font-bold text-red-600 dark:text-red-400">
                                                ${totalExpenses.toFixed(2)} ({expensesPercentage.toFixed(1)}%)
                                            </span>
                                        </div>
                                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4">
                                            <div
                                                className="h-full bg-linear-to-r from-red-500 to-rose-500 rounded-full flex items-center justify-end px-2 text-white text-xs font-semibold"
                                                style={{ width: `${Math.min(100, expensesPercentage)}%` }}
                                            >
                                                {expensesPercentage > 10 && `${expensesPercentage.toFixed(0)}%`}
                                            </div>
                                        </div>
                                    </div>
                                    <div>
                                        <div className="flex justify-between text-sm mb-2">
                                            <span className="font-medium">
                                                {savingsAmount >= 0 ? 'To Savings' : 'Deficit'}
                                            </span>
                                            <span className={`font-bold ${savingsAmount >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-orange-600 dark:text-orange-400'
                                                }`}>
                                                ${Math.abs(savingsAmount).toFixed(2)} ({Math.abs(savingsPercentage).toFixed(1)}%)
                                            </span>
                                        </div>
                                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4">
                                            <div
                                                className={`h-full rounded-full flex items-center justify-end px-2 text-white text-xs font-semibold ${savingsAmount >= 0 ? 'bg-linear-to-r from-blue-500 to-cyan-500' : 'bg-linear-to-r from-orange-500 to-red-500'
                                                    }`}
                                                style={{ width: `${Math.min(100, Math.abs(savingsPercentage))}%` }}
                                            >
                                                {Math.abs(savingsPercentage) > 10 && `${Math.abs(savingsPercentage).toFixed(0)}%`}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Flow Insights */}
                            <div className="p-4 rounded-lg bg-violet-50 dark:bg-violet-950/20 border border-violet-200 dark:border-violet-800">
                                <p className="text-sm font-semibold text-violet-900 dark:text-violet-100 mb-2 flex items-center gap-2">
                                    <Target className="h-4 w-4" />
                                    Money Flow Insights
                                </p>
                                <ul className="text-xs text-violet-700 dark:text-violet-300 space-y-1">
                                    <li>• Top income source: {topIncomeSources[0]?.name} (${topIncomeSources[0]?.amount.toFixed(2)})</li>
                                    <li>• Largest expense: {topExpenseCategories[0]?.name} (${topExpenseCategories[0]?.amount.toFixed(2)})</li>
                                    <li>• {expensesPercentage.toFixed(0)}% of income goes to expenses, {Math.abs(savingsPercentage).toFixed(0)}% {savingsAmount >= 0 ? 'saved' : 'deficit'}</li>
                                    {savingsPercentage >= 20 && (
                                        <li>• Excellent savings rate! You're saving {savingsPercentage.toFixed(0)}% of your income</li>
                                    )}
                                    {savingsPercentage < 0 && (
                                        <li>• Warning: Spending exceeds income. Review expenses to avoid debt accumulation</li>
                                    )}
                                    {expensesPercentage > 90 && savingsAmount >= 0 && (
                                        <li>• High expense ratio. Consider increasing income or reducing expenses for better savings</li>
                                    )}
                                    {topExpenseCategories[0] && topExpenseCategories[0].percentage > 40 && (
                                        <li>• {topExpenseCategories[0].name} accounts for {topExpenseCategories[0].percentage.toFixed(0)}% of expenses - consider if this is balanced</li>
                                    )}
                                </ul>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-8">
                            <ArrowUpRight className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                            <p className="text-lg font-semibold mb-2">No Flow Data</p>
                            <p className="text-sm text-muted-foreground">
                                Add income and expense transactions to visualize your money flow.
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Expense Distribution by Time of Day */}
            <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 border-2 border-amber-200 dark:border-amber-900">
                <CardHeader className="bg-linear-to-r from-amber-50 to-yellow-50 dark:from-amber-950/20 dark:to-yellow-950/20">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-amber-600" />
                        Spending by Time of Day
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                    {totalTimeTransactions > 0 ? (
                        <div className="space-y-6">
                            {/* Summary Stats */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
                                    <div className="text-xs text-muted-foreground mb-1">Peak Time</div>
                                    <div className="text-lg font-bold text-amber-600 dark:text-amber-400">
                                        {peakSpendingTime.period}
                                    </div>
                                    <div className="text-xs text-muted-foreground mt-1">
                                        ${peakSpendingTime.amount.toFixed(0)}
                                    </div>
                                </div>
                                <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700">
                                    <div className="text-xs text-muted-foreground mb-1">Most Active</div>
                                    <div className="text-lg font-bold">
                                        {mostActiveTime.period}
                                    </div>
                                    <div className="text-xs text-muted-foreground mt-1">
                                        {mostActiveTime.count} transactions
                                    </div>
                                </div>
                                <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700">
                                    <div className="text-xs text-muted-foreground mb-1">Day vs Night</div>
                                    <div className="text-lg font-bold">
                                        {dayTimeSpending > nightTimeSpending ? '☀️ Day' : '🌙 Night'}
                                    </div>
                                    <div className="text-xs text-muted-foreground mt-1">
                                        ${Math.max(dayTimeSpending, nightTimeSpending).toFixed(0)}
                                    </div>
                                </div>
                                <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700">
                                    <div className="text-xs text-muted-foreground mb-1">Avg per Period</div>
                                    <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                                        ${(totalExpenses / 4).toFixed(0)}
                                    </div>
                                </div>
                            </div>

                            {/* Time Distribution Chart */}
                            <div>
                                <h4 className="text-sm font-semibold mb-3">Spending Distribution</h4>
                                <ResponsiveContainer width="100%" height={250}>
                                    <BarChart data={timeDistributionData}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="period" tick={{ fontSize: 12 }} />
                                        <YAxis tick={{ fontSize: 12 }} />
                                        <Tooltip formatter={(value: number) => `$${value.toFixed(2)}`} />
                                        <Bar dataKey="amount" radius={[8, 8, 0, 0]}>
                                            {timeDistributionData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={[
                                                    '#fbbf24', // Morning - amber
                                                    '#f59e0b', // Afternoon - orange
                                                    '#ea580c', // Evening - deep orange
                                                    '#1e40af', // Night - blue
                                                ][index]} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>

                            {/* Detailed Time Period Breakdown */}
                            <div className="space-y-4">
                                {timeDistributionData.map((period, idx) => {
                                    const colors = [
                                        { bg: 'bg-amber-50 dark:bg-amber-950/20', border: 'border-amber-200 dark:border-amber-800', text: 'text-amber-600 dark:text-amber-400', bar: 'from-amber-400 to-yellow-500' },
                                        { bg: 'bg-orange-50 dark:bg-orange-950/20', border: 'border-orange-200 dark:border-orange-800', text: 'text-orange-600 dark:text-orange-400', bar: 'from-orange-400 to-amber-500' },
                                        { bg: 'bg-red-50 dark:bg-red-950/20', border: 'border-red-200 dark:border-red-800', text: 'text-red-600 dark:text-red-400', bar: 'from-red-500 to-orange-500' },
                                        { bg: 'bg-blue-50 dark:bg-blue-950/20', border: 'border-blue-200 dark:border-blue-800', text: 'text-blue-600 dark:text-blue-400', bar: 'from-blue-500 to-indigo-500' },
                                    ][idx];

                                    const periodCategories = categoriesByTimePeriod.find(p => p.period === period.period);

                                    return (
                                        <div key={idx} className={`p-4 rounded-lg border-2 ${colors.bg} ${colors.border}`}>
                                            <div className="flex items-center justify-between mb-3">
                                                <div className="flex items-center gap-3">
                                                    <span className="text-3xl">{period.icon}</span>
                                                    <div>
                                                        <h4 className="text-lg font-bold">{period.period}</h4>
                                                        <p className="text-xs text-muted-foreground">{period.time}</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className={`text-2xl font-bold ${colors.text}`}>
                                                        ${period.amount.toFixed(2)}
                                                    </div>
                                                    <div className="text-xs text-muted-foreground">
                                                        {period.percentage.toFixed(1)}% of total
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Progress Bar */}
                                            <div className="mb-3">
                                                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                                                    <div
                                                        className={`h-full bg-linear-to-r ${colors.bar} rounded-full transition-all duration-500`}
                                                        style={{ width: `${period.percentage}%` }}
                                                    />
                                                </div>
                                            </div>

                                            {/* Period Metrics */}
                                            <div className="grid grid-cols-3 gap-3 mb-3">
                                                <div className="text-center p-2 rounded bg-white dark:bg-gray-900/50">
                                                    <div className="text-xs text-muted-foreground">Transactions</div>
                                                    <div className="text-lg font-bold">{period.count}</div>
                                                </div>
                                                <div className="text-center p-2 rounded bg-white dark:bg-gray-900/50">
                                                    <div className="text-xs text-muted-foreground">Avg Amount</div>
                                                    <div className="text-lg font-bold">${period.avgTransaction.toFixed(2)}</div>
                                                </div>
                                                <div className="text-center p-2 rounded bg-white dark:bg-gray-900/50">
                                                    <div className="text-xs text-muted-foreground">% of Day</div>
                                                    <div className="text-lg font-bold">{period.percentage.toFixed(0)}%</div>
                                                </div>
                                            </div>

                                            {/* Top Categories for this Time Period */}
                                            {periodCategories && periodCategories.topCategories.length > 0 && (
                                                <div>
                                                    <div className="text-xs font-semibold mb-2 text-muted-foreground">Top Categories:</div>
                                                    <div className="flex flex-wrap gap-2">
                                                        {periodCategories.topCategories.map((cat, catIdx) => (
                                                            <div key={catIdx} className="flex items-center gap-1 px-2 py-1 rounded-full bg-white dark:bg-gray-900/50 text-xs">
                                                                <span>{cat.icon}</span>
                                                                <span className="font-medium">{cat.name}</span>
                                                                <span className="text-muted-foreground">${cat.amount.toFixed(0)}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Day vs Night Comparison */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="text-2xl">☀️</span>
                                        <h4 className="text-sm font-semibold">Daytime (5AM-5PM)</h4>
                                    </div>
                                    <div className="text-2xl font-bold text-amber-600 dark:text-amber-400 mb-1">
                                        ${dayTimeSpending.toFixed(2)}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                        {totalExpenses > 0 ? ((dayTimeSpending / totalExpenses) * 100).toFixed(1) : 0}% of total spending
                                    </div>
                                </div>
                                <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="text-2xl">🌙</span>
                                        <h4 className="text-sm font-semibold">Nighttime (5PM-5AM)</h4>
                                    </div>
                                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-1">
                                        ${nightTimeSpending.toFixed(2)}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                        {totalExpenses > 0 ? ((nightTimeSpending / totalExpenses) * 100).toFixed(1) : 0}% of total spending
                                    </div>
                                </div>
                            </div>

                            {/* Time-Based Insights */}
                            <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
                                <p className="text-sm font-semibold text-amber-900 dark:text-amber-100 mb-2 flex items-center gap-2">
                                    <Target className="h-4 w-4" />
                                    Time-Based Spending Insights
                                </p>
                                <ul className="text-xs text-amber-700 dark:text-amber-300 space-y-1">
                                    <li>• You spend most during {peakSpendingTime.period.toLowerCase()} ({peakSpendingTime.time})</li>
                                    <li>• Most transactions occur in the {mostActiveTime.period.toLowerCase()}</li>
                                    <li>• {dayTimeSpending > nightTimeSpending ? 'Daytime' : 'Nighttime'} spending is higher (${Math.max(dayTimeSpending, nightTimeSpending).toFixed(2)} vs ${Math.min(dayTimeSpending, nightTimeSpending).toFixed(2)})</li>
                                    {peakSpendingTime.percentage > 40 && (
                                        <li>• {peakSpendingTime.period} accounts for {peakSpendingTime.percentage.toFixed(0)}% of your spending - consider if this timing is necessary</li>
                                    )}
                                    {timeDistributionData[3].amount > 0 && timeDistributionData[3].percentage > 15 && (
                                        <li>• Late night spending is significant ({timeDistributionData[3].percentage.toFixed(0)}%) - review if these are planned expenses</li>
                                    )}
                                    <li>• Average transaction size varies from ${Math.min(...timeDistributionData.map(p => p.avgTransaction)).toFixed(2)} to ${Math.max(...timeDistributionData.map(p => p.avgTransaction)).toFixed(2)}</li>
                                </ul>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-8">
                            <Calendar className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                            <p className="text-lg font-semibold mb-2">No Time Data</p>
                            <p className="text-sm text-muted-foreground">
                                Add expense transactions with timestamps to analyze spending patterns by time of day.
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Transaction Timeline View */}
            <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 border-2 border-slate-200 dark:border-slate-900">
                <CardHeader className="bg-linear-to-r from-slate-50 to-gray-50 dark:from-slate-950/20 dark:to-gray-950/20">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Activity className="h-5 w-5 text-slate-600" />
                        Recent Transaction Timeline (Last 30 Days)
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                    {timelineTransactions.length > 0 ? (
                        <div className="space-y-6">
                            {/* Timeline Statistics */}
                            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                                <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700">
                                    <div className="text-xs text-muted-foreground mb-1">Total</div>
                                    <div className="text-2xl font-bold text-slate-600 dark:text-slate-400">
                                        {timelineStats.totalTransactions}
                                    </div>
                                </div>
                                <div className="p-4 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800">
                                    <div className="text-xs text-muted-foreground mb-1">Income</div>
                                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                                        {timelineStats.incomeCount}
                                    </div>
                                </div>
                                <div className="p-4 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800">
                                    <div className="text-xs text-muted-foreground mb-1">Expenses</div>
                                    <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                                        {timelineStats.expenseCount}
                                    </div>
                                </div>
                                <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700">
                                    <div className="text-xs text-muted-foreground mb-1">Active Days</div>
                                    <div className="text-2xl font-bold">
                                        {timelineStats.activeDays}
                                    </div>
                                </div>
                                <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700">
                                    <div className="text-xs text-muted-foreground mb-1">Avg/Day</div>
                                    <div className="text-2xl font-bold">
                                        {timelineStats.avgPerDay.toFixed(1)}
                                    </div>
                                </div>
                            </div>

                            {/* Timeline */}
                            <div className="relative">
                                {/* Timeline Line */}
                                <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-linear-to-b from-blue-500 via-purple-500 to-pink-500" />

                                {/* Timeline Items */}
                                <div className="space-y-6">
                                    {timelineDates.map((day, dayIdx) => {
                                        const isToday = format(day.date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
                                        const isYesterday = format(day.date, 'yyyy-MM-dd') === format(new Date(Date.now() - 86400000), 'yyyy-MM-dd');

                                        return (
                                            <div key={dayIdx} className="relative pl-16">
                                                {/* Date Marker */}
                                                <div className="absolute left-0 flex items-center">
                                                    <div className={`w-12 h-12 rounded-full flex items-center justify-center border-4 ${day.netChange >= 0
                                                        ? 'bg-green-500 border-green-200 dark:border-green-800'
                                                        : 'bg-red-500 border-red-200 dark:border-red-800'
                                                        } shadow-lg z-10`}>
                                                        {day.netChange >= 0 ? (
                                                            <ArrowUpRight className="h-6 w-6 text-white" />
                                                        ) : (
                                                            <ArrowDownRight className="h-6 w-6 text-white" />
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Day Content */}
                                                <div className={`rounded-lg border-2 overflow-hidden ${isToday ? 'border-blue-400 dark:border-blue-600 bg-blue-50 dark:bg-blue-950/20' :
                                                    day.netChange >= 0 ? 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/10' :
                                                        'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/10'
                                                    }`}>
                                                    {/* Day Header */}
                                                    <div className={`p-3 border-b ${isToday ? 'bg-blue-100 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800' :
                                                        day.netChange >= 0 ? 'bg-green-100 dark:bg-green-950/20 border-green-200 dark:border-green-800' :
                                                            'bg-red-100 dark:bg-red-950/20 border-red-200 dark:border-red-800'
                                                        }`}>
                                                        <div className="flex items-center justify-between">
                                                            <div>
                                                                <div className="flex items-center gap-2">
                                                                    <h4 className="font-bold text-lg">
                                                                        {format(day.date, 'EEEE, MMMM dd')}
                                                                    </h4>
                                                                    {isToday && (
                                                                        <span className="px-2 py-0.5 rounded-full bg-blue-600 text-white text-xs font-semibold">
                                                                            Today
                                                                        </span>
                                                                    )}
                                                                    {isYesterday && (
                                                                        <span className="px-2 py-0.5 rounded-full bg-gray-600 text-white text-xs font-semibold">
                                                                            Yesterday
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <div className="text-xs text-muted-foreground mt-0.5">
                                                                    {day.transactions.length} transaction{day.transactions.length !== 1 ? 's' : ''}
                                                                </div>
                                                            </div>
                                                            <div className="text-right">
                                                                <div className={`text-xl font-bold ${day.netChange >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                                                                    }`}>
                                                                    {day.netChange >= 0 ? '+' : ''}${day.netChange.toFixed(2)}
                                                                </div>
                                                                <div className="text-xs text-muted-foreground">
                                                                    Net change
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Transactions List */}
                                                    <div className="p-3 space-y-2">
                                                        {day.transactions.map((t, tIdx) => {
                                                            const cat = categories.find(c => c.id === t.category_id);
                                                            const transactionTime = format(new Date(t.date), 'h:mm a');

                                                            return (
                                                                <div
                                                                    key={tIdx}
                                                                    className={`flex items-center justify-between p-3 rounded-lg border transition-all hover:shadow-md ${t.type === 'income'
                                                                        ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800'
                                                                        : 'bg-white dark:bg-gray-900/50 border-gray-200 dark:border-gray-700'
                                                                        }`}
                                                                >
                                                                    <div className="flex items-center gap-3 flex-1 min-w-0">
                                                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${t.type === 'income'
                                                                            ? 'bg-green-100 dark:bg-green-900/30'
                                                                            : 'bg-gray-100 dark:bg-gray-800'
                                                                            }`}>
                                                                            <span className="text-lg">{cat?.icon || (t.type === 'income' ? '💰' : '💸')}</span>
                                                                        </div>
                                                                        <div className="flex-1 min-w-0">
                                                                            <div className="font-semibold truncate">{t.description}</div>
                                                                            <div className="text-xs text-muted-foreground flex items-center gap-2">
                                                                                <span>{cat?.name || 'Uncategorized'}</span>
                                                                                <span>•</span>
                                                                                <span>{transactionTime}</span>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                    <div className="text-right shrink-0 ml-3">
                                                                        <div className={`text-lg font-bold ${t.type === 'income'
                                                                            ? 'text-green-600 dark:text-green-400'
                                                                            : 'text-red-600 dark:text-red-400'
                                                                            }`}>
                                                                            {t.type === 'income' ? '+' : '-'}${t.amount.toFixed(2)}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>

                                                    {/* Day Summary */}
                                                    <div className="px-3 pb-3">
                                                        <div className="flex justify-between text-sm pt-2 border-t border-gray-200 dark:border-gray-700">
                                                            <div className="flex gap-4">
                                                                {day.totalIncome > 0 && (
                                                                    <span className="text-green-600 dark:text-green-400">
                                                                        Income: +${day.totalIncome.toFixed(2)}
                                                                    </span>
                                                                )}
                                                                {day.totalExpense > 0 && (
                                                                    <span className="text-red-600 dark:text-red-400">
                                                                        Expenses: -${day.totalExpense.toFixed(2)}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Timeline Insights */}
                            {timelineStats.largestTransaction && (
                                <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-950/20 border border-slate-200 dark:border-slate-800">
                                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-2 flex items-center gap-2">
                                        <Target className="h-4 w-4" />
                                        Timeline Highlights
                                    </p>
                                    <ul className="text-xs text-slate-700 dark:text-slate-300 space-y-1">
                                        <li>• {timelineStats.totalTransactions} transactions recorded in the last 30 days</li>
                                        <li>• Activity on {timelineStats.activeDays} out of 30 days ({((timelineStats.activeDays / 30) * 100).toFixed(0)}% active)</li>
                                        <li>• Average of {timelineStats.avgPerDay.toFixed(1)} transactions per active day</li>
                                        <li>• Largest transaction: ${timelineStats.largestTransaction.amount.toFixed(2)} ({timelineStats.largestTransaction.description})</li>
                                        {timelineStats.incomeCount > 0 && timelineStats.expenseCount > 0 && (
                                            <li>• Ratio: {timelineStats.incomeCount} income vs {timelineStats.expenseCount} expense transactions</li>
                                        )}
                                    </ul>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="text-center py-8">
                            <Activity className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                            <p className="text-lg font-semibold mb-2">No Recent Transactions</p>
                            <p className="text-sm text-muted-foreground">
                                Add transactions to see your financial timeline.
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Burn Rate Calculator */}
            <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 border-2 border-red-200 dark:border-red-900">
                <CardHeader className="bg-linear-to-r from-red-50 to-rose-50 dark:from-red-950/20 dark:to-rose-950/20">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Activity className="h-5 w-5 text-red-600" />
                        Burn Rate & Financial Runway
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                    <div className="grid gap-6">
                        {/* Runway Status */}
                        {!isNetPositive && monthsRemaining !== Infinity ? (
                            <div className={`p-6 rounded-lg border-2 ${runwayStatus === 'critical' ? 'bg-red-100 dark:bg-red-950/30 border-red-400 dark:border-red-700' :
                                runwayStatus === 'warning' ? 'bg-orange-100 dark:bg-orange-950/30 border-orange-400 dark:border-orange-700' :
                                    runwayStatus === 'good' ? 'bg-yellow-100 dark:bg-yellow-950/30 border-yellow-400 dark:border-yellow-700' :
                                        'bg-green-100 dark:bg-green-950/30 border-green-400 dark:border-green-700'
                                }`}>
                                <div className="flex items-start gap-4">
                                    <div className={`p-3 rounded-full ${runwayStatus === 'critical' ? 'bg-red-600' :
                                        runwayStatus === 'warning' ? 'bg-orange-600' :
                                            runwayStatus === 'good' ? 'bg-yellow-600' :
                                                'bg-green-600'
                                        }`}>
                                        <AlertCircle className="h-6 w-6 text-white" />
                                    </div>
                                    <div className="flex-1">
                                        <p className={`text-sm font-semibold ${runwayStatus === 'critical' ? 'text-red-900 dark:text-red-100' :
                                            runwayStatus === 'warning' ? 'text-orange-900 dark:text-orange-100' :
                                                runwayStatus === 'good' ? 'text-yellow-900 dark:text-yellow-100' :
                                                    'text-green-900 dark:text-green-100'
                                            }`}>
                                            Financial Runway: {
                                                runwayStatus === 'critical' ? '🚨 Critical' :
                                                    runwayStatus === 'warning' ? '⚠️ Warning' :
                                                        runwayStatus === 'good' ? '⏰ Limited' :
                                                            '✅ Healthy'
                                            }
                                        </p>
                                        <p className={`text-3xl font-bold mt-2 ${runwayStatus === 'critical' ? 'text-red-700 dark:text-red-300' :
                                            runwayStatus === 'warning' ? 'text-orange-700 dark:text-orange-300' :
                                                runwayStatus === 'good' ? 'text-yellow-700 dark:text-yellow-300' :
                                                    'text-green-700 dark:text-green-300'
                                            }`}>
                                            {monthsRemaining < 1
                                                ? `${Math.floor(daysRemaining)} days`
                                                : monthsRemaining < 3
                                                    ? `${monthsRemaining.toFixed(1)} months`
                                                    : `${monthsRemaining.toFixed(0)} months`}
                                        </p>
                                        <p className={`text-xs mt-2 ${runwayStatus === 'critical' ? 'text-red-700 dark:text-red-300' :
                                            runwayStatus === 'warning' ? 'text-orange-700 dark:text-orange-300' :
                                                runwayStatus === 'good' ? 'text-yellow-700 dark:text-yellow-300' :
                                                    'text-green-700 dark:text-green-300'
                                            }`}>
                                            At current spending rate, your balance will last approximately{' '}
                                            {monthsRemaining < 1 ? `${Math.floor(daysRemaining)} days` : `${monthsRemaining.toFixed(1)} months`}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="p-6 rounded-lg border-2 bg-green-100 dark:bg-green-950/30 border-green-400 dark:border-green-700">
                                <div className="flex items-start gap-4">
                                    <div className="p-3 rounded-full bg-green-600">
                                        <TrendingUp className="h-6 w-6 text-white" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-semibold text-green-900 dark:text-green-100">
                                            🎉 Positive Cash Flow!
                                        </p>
                                        <p className="text-3xl font-bold text-green-700 dark:text-green-300 mt-2">
                                            ∞ Infinite Runway
                                        </p>
                                        <p className="text-xs text-green-700 dark:text-green-300 mt-2">
                                            You-re earning more than you spend. Your balance is growing each month!
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Burn Rate Metrics */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="p-4 rounded-lg border bg-linear-to-br from-red-50 to-pink-50 dark:from-red-950/20 dark:to-pink-950/20 border-red-200 dark:border-red-800">
                                <p className="text-xs text-muted-foreground mb-1">Daily Burn Rate</p>
                                <p className="text-2xl font-bold text-red-600">
                                    ${avgDailyBurnRate.toFixed(2)}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">Per day</p>
                            </div>

                            <div className="p-4 rounded-lg border bg-linear-to-br from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20 border-orange-200 dark:border-orange-800">
                                <p className="text-xs text-muted-foreground mb-1">Weekly Burn Rate</p>
                                <p className="text-2xl font-bold text-orange-600">
                                    ${avgWeeklyBurnRate.toFixed(2)}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">Per week</p>
                            </div>

                            <div className="p-4 rounded-lg border bg-linear-to-br from-purple-50 to-fuchsia-50 dark:from-purple-950/20 dark:to-fuchsia-950/20 border-purple-200 dark:border-purple-800">
                                <p className="text-xs text-muted-foreground mb-1">Monthly Burn Rate</p>
                                <p className="text-2xl font-bold text-purple-600">
                                    ${avgMonthlyBurnRate.toFixed(2)}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">3-month avg</p>
                            </div>

                            <div className="p-4 rounded-lg border bg-linear-to-br from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20 border-blue-200 dark:border-blue-800">
                                <p className="text-xs text-muted-foreground mb-1">Current vs Avg</p>
                                <p className={`text-2xl font-bold ${burnRateTrend >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                                    {burnRateTrend >= 0 ? '+' : ''}{burnRateTrend.toFixed(1)}%
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">This month</p>
                            </div>
                        </div>

                        {/* Top Burning Categories */}
                        {topBurnCategories.length > 0 && (
                            <div className="space-y-3">
                                <h3 className="font-semibold text-sm flex items-center gap-2">
                                    <Filter className="h-4 w-4" />
                                    Highest Burn Categories
                                </h3>
                                {topBurnCategories.map((category, index) => {
                                    const burnPercent = totalExpenses > 0 ? (category.value / totalExpenses) * 100 : 0;
                                    const dailyBurn = category.value / 30;
                                    return (
                                        <div key={category.name} className="flex items-center justify-between p-3 rounded-lg border hover:shadow-md transition-shadow">
                                            <div className="flex items-center gap-3">
                                                <span className="text-lg font-bold text-muted-foreground w-6">
                                                    #{index + 1}
                                                </span>
                                                <div
                                                    className="w-3 h-3 rounded-full"
                                                    style={{ backgroundColor: category.color }}
                                                />
                                                <div>
                                                    <p className="font-medium text-sm">{category.name}</p>
                                                    <p className="text-xs text-muted-foreground">
                                                        ${dailyBurn.toFixed(2)}/day
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm font-bold text-red-600">
                                                    ${category.value.toFixed(2)}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    {burnPercent.toFixed(1)}% of spending
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {/* Break-Even Analysis */}
                        <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
                            <p className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-3 flex items-center gap-2">
                                <Target className="h-4 w-4" />
                                Break-Even Analysis
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <p className="text-xs text-muted-foreground mb-1">Income Needed to Break Even</p>
                                    <p className="text-xl font-bold text-blue-700 dark:text-blue-300">
                                        ${breakEvenIncome.toFixed(2)}/month
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground mb-1">Current Income Gap</p>
                                    <p className={`text-xl font-bold ${currentIncomeGap > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                        {currentIncomeGap > 0 ? '-' : '+'} ${Math.abs(currentIncomeGap).toFixed(2)}
                                    </p>
                                </div>
                            </div>
                            <p className="text-xs text-blue-700 dark:text-blue-300 mt-3">
                                {currentIncomeGap > 0
                                    ? `💡 Increase your income by $${currentIncomeGap.toFixed(2)}/month or reduce spending to achieve balance.`
                                    : `✅ You're earning $${Math.abs(currentIncomeGap).toFixed(2)}/month more than your expenses!`
                                }
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Income Stability Score */}
            <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 border-2 border-emerald-200 dark:border-emerald-900">
                <CardHeader className="bg-linear-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Activity className="h-5 w-5 text-emerald-600" />
                        Income Stability Analysis
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                    <div className="grid gap-6">
                        {/* Stability Score Overview */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* Main Stability Score */}
                            <div className={`p-6 rounded-lg border-2 ${stabilityScore >= 90 ? 'bg-green-50 dark:bg-green-950/20 border-green-300 dark:border-green-800' :
                                stabilityScore >= 70 ? 'bg-blue-50 dark:bg-blue-950/20 border-blue-300 dark:border-blue-800' :
                                    stabilityScore >= 50 ? 'bg-yellow-50 dark:bg-yellow-950/20 border-yellow-300 dark:border-yellow-800' :
                                        'bg-red-50 dark:bg-red-950/20 border-red-300 dark:border-red-800'
                                }`}>
                                <p className="text-xs text-muted-foreground mb-2">Stability Score</p>
                                <div className="flex items-baseline gap-2">
                                    <span className={`text-4xl font-bold ${stabilityScore >= 90 ? 'text-green-600' :
                                        stabilityScore >= 70 ? 'text-blue-600' :
                                            stabilityScore >= 50 ? 'text-yellow-600' :
                                                'text-red-600'
                                        }`}>
                                        {stabilityScore.toFixed(0)}
                                    </span>
                                    <span className="text-xl text-muted-foreground">/100</span>
                                </div>
                                <div className="mt-2 flex items-center gap-2">
                                    <span className={`text-sm font-semibold px-2 py-1 rounded ${stabilityScore >= 90 ? 'bg-green-200 dark:bg-green-900 text-green-700 dark:text-green-300' :
                                        stabilityScore >= 70 ? 'bg-blue-200 dark:bg-blue-900 text-blue-700 dark:text-blue-300' :
                                            stabilityScore >= 50 ? 'bg-yellow-200 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300' :
                                                'bg-red-200 dark:bg-red-900 text-red-700 dark:text-red-300'
                                        }`}>
                                        {stabilityRating}
                                    </span>
                                </div>
                                <p className="text-xs text-muted-foreground mt-2">
                                    {stabilityRating === 'Excellent' && '✅ Very consistent income'}
                                    {stabilityRating === 'Good' && '👍 Reliable income stream'}
                                    {stabilityRating === 'Fair' && '⚠️ Moderate variability'}
                                    {stabilityRating === 'Poor' && '⚠️ Highly variable income'}
                                </p>
                            </div>

                            {/* Income Trend */}
                            <div className="p-6 rounded-lg border bg-linear-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/20 dark:to-purple-950/20 border-indigo-200 dark:border-indigo-800">
                                <p className="text-xs text-muted-foreground mb-2">Income Trend</p>
                                <div className="flex items-center gap-2 mb-2">
                                    {incomeTrendPercent >= 5 ? (
                                        <TrendingUp className="h-6 w-6 text-green-600" />
                                    ) : incomeTrendPercent <= -5 ? (
                                        <TrendingDown className="h-6 w-6 text-red-600" />
                                    ) : (
                                        <Activity className="h-6 w-6 text-blue-600" />
                                    )}
                                    <span className={`text-2xl font-bold ${incomeTrendPercent >= 5 ? 'text-green-600' :
                                        incomeTrendPercent <= -5 ? 'text-red-600' :
                                            'text-blue-600'
                                        }`}>
                                        {incomeTrendPercent >= 0 ? '+' : ''}{incomeTrendPercent.toFixed(1)}%
                                    </span>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Last 6 months vs previous 6
                                </p>
                            </div>

                            {/* Average Monthly Income */}
                            <div className="p-6 rounded-lg border bg-linear-to-br from-cyan-50 to-sky-50 dark:from-cyan-950/20 dark:to-sky-950/20 border-cyan-200 dark:border-cyan-800">
                                <p className="text-xs text-muted-foreground mb-2">Avg Monthly Income</p>
                                <p className="text-2xl font-bold text-cyan-600 mb-2">
                                    ${avgMonthlyIncome.toFixed(2)}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    ±${incomeStdDev.toFixed(2)} variation
                                </p>
                            </div>
                        </div>

                        {/* Income Sources Analysis */}
                        <div className="space-y-3">
                            <h3 className="font-semibold text-sm flex items-center gap-2">
                                <DollarSign className="h-4 w-4" />
                                Income Sources Analysis
                            </h3>
                            {incomeSourceAnalysis.length === 0 ? (
                                <p className="text-sm text-muted-foreground text-center py-4">
                                    No income data available
                                </p>
                            ) : (
                                incomeSourceAnalysis.map((source) => (
                                    <div key={source.category.id} className="flex items-center justify-between p-4 rounded-lg border hover:shadow-md transition-shadow">
                                        <div className="flex items-center gap-3 flex-1">
                                            <div
                                                className="w-3 h-3 rounded-full"
                                                style={{ backgroundColor: source.category.color }}
                                            />
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                    <p className="font-medium text-sm">{source.category.name}</p>
                                                    {source.isRecurring && (
                                                        <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300">
                                                            Recurring
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-xs text-muted-foreground">
                                                    {source.percentOfTotal.toFixed(1)}% of total income
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-semibold text-green-600">
                                                ${source.avgIncome.toFixed(2)}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {source.consistencyPercent.toFixed(0)}% consistent
                                            </p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Most Reliable Source Highlight */}
                        {mostReliableSource && (
                            <div className="p-4 rounded-lg bg-linear-to-r from-emerald-100 to-teal-100 dark:from-emerald-900/30 dark:to-teal-900/30 border-2 border-emerald-300 dark:border-emerald-700">
                                <div className="flex items-start gap-3">
                                    <div className="p-2 rounded-full bg-emerald-600 text-white">
                                        <Target className="h-4 w-4" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-100">
                                            Most Reliable Income Source
                                        </p>
                                        <p className="text-lg font-bold text-emerald-700 dark:text-emerald-300 mt-1">
                                            {mostReliableSource.category.name}
                                        </p>
                                        <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">
                                            {mostReliableSource.consistencyPercent.toFixed(0)}% consistency •
                                            ${mostReliableSource.avgIncome.toFixed(2)}/month average
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Stability Tips */}
                        <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
                            <p className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">
                                💡 Stability Tips
                            </p>
                            <ul className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
                                {stabilityScore < 70 && (
                                    <>
                                        <li>• Consider diversifying your income sources</li>
                                        <li>• Build an emergency fund to cover income gaps</li>
                                        <li>• Look for more predictable income streams</li>
                                    </>
                                )}
                                {stabilityScore >= 70 && stabilityScore < 90 && (
                                    <>
                                        <li>• Your income is fairly stable - keep it up!</li>
                                        <li>• Consider adding passive income sources</li>
                                        <li>• Monitor any irregular income patterns</li>
                                    </>
                                )}
                                {stabilityScore >= 90 && (
                                    <>
                                        <li>• Excellent income stability!</li>
                                        <li>• You can plan long-term with confidence</li>
                                        <li>• Consider increasing investment contributions</li>
                                    </>
                                )}
                            </ul>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Budget vs Actual Comparison */}
            {categoryBudgets.length > 0 && (
                <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Target className="h-5 w-5" />
                            Budget vs Actual Spending (Current Month)
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-6">
                            {categoryBudgets
                                .filter(budget => budget.period === 'monthly')
                                .map((budget) => {
                                    const category = categories.find(c => c.id === budget.category_id);
                                    if (!category || category.type !== 'expense') return null;

                                    const actualSpent = currentMonthTransactions
                                        .filter(t => t.category_id === budget.category_id && t.type === 'expense')
                                        .reduce((sum, t) => sum + t.amount, 0);

                                    const percentage = budget.amount > 0 ? (actualSpent / budget.amount) * 100 : 0;
                                    const remaining = budget.amount - actualSpent;
                                    const isOverBudget = actualSpent > budget.amount;

                                    return (
                                        <div key={budget.id} className="space-y-3">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div
                                                        className="w-4 h-4 rounded-full"
                                                        style={{ backgroundColor: category.color }}
                                                    />
                                                    <div>
                                                        <p className="font-semibold text-sm">{category.name}</p>
                                                        <p className="text-xs text-muted-foreground">
                                                            Budget: ${budget.amount.toFixed(2)}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className={`text-lg font-bold ${isOverBudget ? 'text-red-600' : 'text-green-600'}`}>
                                                        ${actualSpent.toFixed(2)}
                                                    </p>
                                                    <p className={`text-xs ${isOverBudget ? 'text-red-600' : 'text-green-600'}`}>
                                                        {isOverBudget ? '+' : ''}{remaining.toFixed(2)} {isOverBudget ? 'over' : 'left'}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="space-y-1">
                                                <div className="flex items-center justify-between text-xs text-muted-foreground">
                                                    <span>Progress</span>
                                                    <span>{percentage.toFixed(1)}%</span>
                                                </div>
                                                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                                                    <div
                                                        className={`h-3 rounded-full transition-all duration-500 ${percentage >= 90
                                                            ? 'bg-red-500'
                                                            : percentage >= 75
                                                                ? 'bg-orange-500'
                                                                : percentage >= 50
                                                                    ? 'bg-yellow-500'
                                                                    : 'bg-green-500'
                                                            }`}
                                                        style={{
                                                            width: `${Math.min(percentage, 100)}%`,
                                                        }}
                                                    />
                                                </div>
                                                {isOverBudget && (
                                                    <div className="flex items-center gap-1 text-xs text-red-600 mt-1">
                                                        <AlertCircle className="h-3 w-3" />
                                                        <span>Over budget by {(percentage - 100).toFixed(1)}%</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                        </div>
                        {categoryBudgets.filter(b => b.period === 'monthly').length === 0 && (
                            <div className="text-center py-8 text-muted-foreground">
                                <Target className="h-12 w-12 mx-auto mb-3 opacity-50" />
                                <p>No monthly budgets set yet.</p>
                                <p className="text-xs mt-1">Go to Settings to set category budgets.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Savings Goals Tracker */}
            {savingsGoals.length > 0 && (
                <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 border-2 border-violet-200 dark:border-violet-900">
                    <CardHeader className="bg-linear-to-r from-violet-50 to-purple-50 dark:from-violet-950/20 dark:to-purple-950/20">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Target className="h-5 w-5 text-violet-600" />
                                Savings Goals Progress
                            </CardTitle>
                            <div className="text-right">
                                <p className="text-xs text-muted-foreground">Total Progress</p>
                                <p className="text-sm font-bold text-violet-600">
                                    ${totalSavedTowardsGoals.toFixed(0)} / ${totalGoalsAmount.toFixed(0)}
                                </p>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <div className="space-y-6">
                            {/* Overall Summary */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="p-4 rounded-lg border bg-linear-to-br from-violet-50 to-purple-50 dark:from-violet-950/20 dark:to-purple-950/20 border-violet-200 dark:border-violet-800">
                                    <p className="text-xs text-muted-foreground mb-1">Active Goals</p>
                                    <p className="text-3xl font-bold text-violet-600">{activeGoals.length}</p>
                                    <p className="text-xs text-muted-foreground mt-1">In progress</p>
                                </div>
                                <div className="p-4 rounded-lg border bg-linear-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-green-200 dark:border-green-800">
                                    <p className="text-xs text-muted-foreground mb-1">Completed</p>
                                    <p className="text-3xl font-bold text-green-600">{completedGoals.length}</p>
                                    <p className="text-xs text-muted-foreground mt-1">Achieved 🎉</p>
                                </div>
                                <div className="p-4 rounded-lg border bg-linear-to-br from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20 border-blue-200 dark:border-blue-800">
                                    <p className="text-xs text-muted-foreground mb-1">Total Saved</p>
                                    <p className="text-3xl font-bold text-blue-600">${totalSavedTowardsGoals.toFixed(0)}</p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        {totalGoalsAmount > 0 ? `${((totalSavedTowardsGoals / totalGoalsAmount) * 100).toFixed(1)}% overall` : 'No goals'}
                                    </p>
                                </div>
                            </div>

                            {/* Active Goals */}
                            {activeGoals.length > 0 && (
                                <div className="space-y-4">
                                    <h3 className="font-semibold text-sm flex items-center gap-2">
                                        <Activity className="h-4 w-4" />
                                        Active Goals
                                    </h3>
                                    {activeGoals.map(goal => (
                                        <div key={goal.id} className={`p-4 rounded-lg border-2 hover:shadow-md transition-all ${goal.isOverdue ? 'bg-red-50 dark:bg-red-950/20 border-red-300 dark:border-red-800' :
                                            !goal.isOnTrack ? 'bg-yellow-50 dark:bg-yellow-950/20 border-yellow-300 dark:border-yellow-800' :
                                                'bg-white dark:bg-gray-950 border-gray-200 dark:border-gray-800'
                                            }`}>
                                            <div className="flex items-start justify-between mb-3">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <h4 className="font-semibold text-lg">{goal.name}</h4>
                                                        {goal.isOverdue && (
                                                            <span className="px-2 py-0.5 text-xs rounded-full bg-red-600 text-white">
                                                                Overdue
                                                            </span>
                                                        )}
                                                        {!goal.isOnTrack && !goal.isOverdue && (
                                                            <span className="px-2 py-0.5 text-xs rounded-full bg-yellow-600 text-white">
                                                                Behind Schedule
                                                            </span>
                                                        )}
                                                    </div>
                                                    {goal.deadline && (
                                                        <p className="text-xs text-muted-foreground mt-1">
                                                            {goal.isOverdue
                                                                ? `Overdue by ${Math.abs(goal.daysRemaining)} days`
                                                                : `${goal.daysRemaining} days remaining • Due ${format(new Date(goal.deadline), 'MMM dd, yyyy')}`
                                                            }
                                                        </p>
                                                    )}
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-2xl font-bold text-violet-600">
                                                        {goal.progress.toFixed(0)}%
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        ${goal.current_amount.toFixed(0)} / ${goal.target_amount.toFixed(0)}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Progress Bar */}
                                            <div className="space-y-2 mb-3">
                                                <div className="relative">
                                                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                                                        <div
                                                            className={`h-3 rounded-full transition-all duration-500 ${goal.isOverdue ? 'bg-red-500' :
                                                                goal.progress >= 75 ? 'bg-green-500' :
                                                                    goal.progress >= 50 ? 'bg-blue-500' :
                                                                        goal.progress >= 25 ? 'bg-yellow-500' :
                                                                            'bg-orange-500'
                                                                }`}
                                                            style={{ width: `${Math.min(goal.progress, 100)}%` }}
                                                        />
                                                    </div>
                                                    {goal.deadline && goal.timeProgress < 100 && (
                                                        <div
                                                            className="absolute top-0 h-3 w-0.5 bg-gray-400 dark:bg-gray-500"
                                                            style={{ left: `${goal.timeProgress}%` }}
                                                            title="Expected progress by now"
                                                        />
                                                    )}
                                                </div>
                                                <div className="flex justify-between text-xs text-muted-foreground">
                                                    <span>$0</span>
                                                    <span>${goal.target_amount.toFixed(0)}</span>
                                                </div>
                                            </div>

                                            {/* Details Grid */}
                                            <div className="grid grid-cols-2 gap-3 pt-3 border-t">
                                                <div>
                                                    <p className="text-xs text-muted-foreground">Remaining</p>
                                                    <p className="text-sm font-semibold text-red-600">
                                                        ${goal.remaining.toFixed(2)}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-muted-foreground">Required/Month</p>
                                                    <p className="text-sm font-semibold text-blue-600">
                                                        ${goal.requiredMonthlySavings.toFixed(2)}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Completed Goals */}
                            {completedGoals.length > 0 && (
                                <div className="space-y-3">
                                    <h3 className="font-semibold text-sm flex items-center gap-2">
                                        <span className="text-green-600">✅</span>
                                        Completed Goals
                                    </h3>
                                    {completedGoals.map(goal => (
                                        <div key={goal.id} className="p-3 rounded-lg border bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="font-medium">{goal.name}</p>
                                                    <p className="text-xs text-muted-foreground">
                                                        Completed • ${goal.target_amount.toFixed(0)} achieved
                                                    </p>
                                                </div>
                                                <div className="text-3xl">🎉</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {activeGoals.length === 0 && completedGoals.length === 0 && (
                                <div className="text-center py-8 text-muted-foreground">
                                    <Target className="h-12 w-12 mx-auto mb-3 opacity-50" />
                                    <p>No savings goals yet</p>
                                    <p className="text-xs mt-1">Go to Settings to create your first savings goal</p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Forecast Next Month */}
            <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 border-2 border-indigo-200 dark:border-indigo-900">
                <CardHeader className="bg-linear-to-r from-indigo-50 to-blue-50 dark:from-indigo-950/20 dark:to-blue-950/20">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <TrendingUp className="h-5 w-5 text-indigo-600" />
                            Next Month Forecast
                        </CardTitle>
                        <div className={`px-3 py-1 rounded-full text-xs font-semibold ${confidenceLevel === 'High' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' :
                            confidenceLevel === 'Medium' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300' :
                                'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                            }`}>
                            {confidenceLevel} Confidence ({forecastConfidence.toFixed(0)}%)
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="pt-6">
                    <div className="space-y-6">
                        {/* Forecast Summary Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* Forecasted Income */}
                            <div className={`p-5 rounded-lg border-2 ${incomeChangePercent > 5 ? 'bg-green-50 dark:bg-green-950/20 border-green-300 dark:border-green-800' :
                                incomeChangePercent < -5 ? 'bg-red-50 dark:bg-red-950/20 border-red-300 dark:border-red-800' :
                                    'bg-blue-50 dark:bg-blue-950/20 border-blue-300 dark:border-blue-800'
                                }`}>
                                <div className="flex items-center justify-between mb-2">
                                    <p className="text-xs text-muted-foreground">Expected Income</p>
                                    <div className="flex items-center gap-1">
                                        {incomeChangePercent > 0 ? (
                                            <ArrowUpRight className="h-4 w-4 text-green-600" />
                                        ) : incomeChangePercent < 0 ? (
                                            <ArrowDownRight className="h-4 w-4 text-red-600" />
                                        ) : (
                                            <Activity className="h-4 w-4 text-blue-600" />
                                        )}
                                        <span className={`text-xs font-semibold ${incomeChangePercent > 0 ? 'text-green-600' :
                                            incomeChangePercent < 0 ? 'text-red-600' : 'text-blue-600'
                                            }`}>
                                            {incomeChangePercent >= 0 ? '+' : ''}{incomeChangePercent.toFixed(1)}%
                                        </span>
                                    </div>
                                </div>
                                <p className="text-3xl font-bold text-green-600 mb-1">
                                    ${forecastedIncome.toFixed(2)}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    Current: ${currentMonthIncome.toFixed(2)}
                                </p>
                            </div>

                            {/* Forecasted Expenses */}
                            <div className={`p-5 rounded-lg border-2 ${expenseChangePercent > 5 ? 'bg-red-50 dark:bg-red-950/20 border-red-300 dark:border-red-800' :
                                expenseChangePercent < -5 ? 'bg-green-50 dark:bg-green-950/20 border-green-300 dark:border-green-800' :
                                    'bg-orange-50 dark:bg-orange-950/20 border-orange-300 dark:border-orange-800'
                                }`}>
                                <div className="flex items-center justify-between mb-2">
                                    <p className="text-xs text-muted-foreground">Expected Expenses</p>
                                    <div className="flex items-center gap-1">
                                        {expenseChangePercent > 0 ? (
                                            <ArrowUpRight className="h-4 w-4 text-red-600" />
                                        ) : expenseChangePercent < 0 ? (
                                            <ArrowDownRight className="h-4 w-4 text-green-600" />
                                        ) : (
                                            <Activity className="h-4 w-4 text-orange-600" />
                                        )}
                                        <span className={`text-xs font-semibold ${expenseChangePercent > 0 ? 'text-red-600' :
                                            expenseChangePercent < 0 ? 'text-green-600' : 'text-orange-600'
                                            }`}>
                                            {expenseChangePercent >= 0 ? '+' : ''}{expenseChangePercent.toFixed(1)}%
                                        </span>
                                    </div>
                                </div>
                                <p className="text-3xl font-bold text-red-600 mb-1">
                                    ${forecastedExpenses.toFixed(2)}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    Current: ${currentMonthExpenses.toFixed(2)}
                                </p>
                            </div>

                            {/* Forecasted Savings */}
                            <div className={`p-5 rounded-lg border-2 ${forecastedSavings > 0 ? 'bg-blue-50 dark:bg-blue-950/20 border-blue-300 dark:border-blue-800' :
                                'bg-red-50 dark:bg-red-950/20 border-red-300 dark:border-red-800'
                                }`}>
                                <div className="flex items-center justify-between mb-2">
                                    <p className="text-xs text-muted-foreground">Expected Savings</p>
                                    <div className="flex items-center gap-1">
                                        {forecastTrend === 'improving' ? (
                                            <TrendingUp className="h-4 w-4 text-green-600" />
                                        ) : forecastTrend === 'declining' ? (
                                            <TrendingDown className="h-4 w-4 text-red-600" />
                                        ) : (
                                            <Activity className="h-4 w-4 text-blue-600" />
                                        )}
                                        <span className={`text-xs font-semibold ${forecastTrend === 'improving' ? 'text-green-600' :
                                            forecastTrend === 'declining' ? 'text-red-600' : 'text-blue-600'
                                            }`}>
                                            {forecastTrend === 'improving' ? '↑ Improving' :
                                                forecastTrend === 'declining' ? '↓ Declining' : '→ Stable'}
                                        </span>
                                    </div>
                                </div>
                                <p className={`text-3xl font-bold mb-1 ${forecastedSavings >= 0 ? 'text-blue-600' : 'text-red-600'
                                    }`}>
                                    ${forecastedSavings.toFixed(2)}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    Current: ${currentMonthSavings.toFixed(2)}
                                </p>
                            </div>
                        </div>

                        {/* Forecasted Balance */}
                        <div className={`p-5 rounded-lg border-2 ${forecastedBalance >= balance ? 'bg-linear-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-green-300 dark:border-green-800' :
                            'bg-linear-to-r from-red-50 to-rose-50 dark:from-red-950/20 dark:to-rose-950/20 border-red-300 dark:border-red-800'
                            }`}>
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground mb-1">Projected End-of-Month Balance</p>
                                    <p className={`text-4xl font-bold ${forecastedBalance >= 0 ? 'text-green-600' : 'text-red-600'
                                        }`}>
                                        ${forecastedBalance.toFixed(2)}
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-2">
                                        Current Balance: ${balance.toFixed(2)}
                                        <span className={`ml-2 font-semibold ${forecastedBalance >= balance ? 'text-green-600' : 'text-red-600'
                                            }`}>
                                            ({forecastedBalance >= balance ? '+' : ''}{(forecastedBalance - balance).toFixed(2)})
                                        </span>
                                    </p>
                                </div>
                                <div className="p-4 rounded-full bg-white dark:bg-gray-900">
                                    <Wallet className={`h-8 w-8 ${forecastedBalance >= balance ? 'text-green-600' : 'text-red-600'
                                        }`} />
                                </div>
                            </div>
                        </div>

                        {/* Category-wise Forecast */}
                        {categoryForecast.length > 0 && (
                            <div className="space-y-3">
                                <h3 className="font-semibold text-sm flex items-center gap-2">
                                    <Filter className="h-4 w-4" />
                                    Expected Category Spending
                                </h3>
                                {categoryForecast.map((item) => (
                                    <div key={item.category.id} className="flex items-center justify-between p-3 rounded-lg border hover:shadow-md transition-shadow">
                                        <div className="flex items-center gap-3">
                                            <div
                                                className="w-3 h-3 rounded-full"
                                                style={{ backgroundColor: item.category.color }}
                                            />
                                            <div>
                                                <p className="text-sm font-semibold">{item.category.name}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {item.percentOfTotal.toFixed(1)}% of total
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-bold text-red-600">
                                                ${item.forecastedAmount.toFixed(2)}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                avg/month
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Forecast Insights */}
                        {forecastInsights.length > 0 && (
                            <div className="space-y-2">
                                <h3 className="font-semibold text-sm flex items-center gap-2">
                                    <AlertCircle className="h-4 w-4" />
                                    Key Insights
                                </h3>
                                {forecastInsights.map((insight, index) => (
                                    <div key={index} className={`p-3 rounded-lg border-l-4 ${insight.type === 'warning' ? 'bg-orange-50 dark:bg-orange-950/20 border-orange-500' :
                                        insight.type === 'positive' ? 'bg-green-50 dark:bg-green-950/20 border-green-500' :
                                            'bg-blue-50 dark:bg-blue-950/20 border-blue-500'
                                        }`}>
                                        <p className={`text-sm ${insight.type === 'warning' ? 'text-orange-700 dark:text-orange-300' :
                                            insight.type === 'positive' ? 'text-green-700 dark:text-green-300' :
                                                'text-blue-700 dark:text-blue-300'
                                            }`}>
                                            {insight.icon} {insight.message}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Methodology Note */}
                        <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-900/30 border border-gray-200 dark:border-gray-800">
                            <p className="text-xs text-muted-foreground">
                                <span className="font-semibold">Forecast Methodology:</span> Predictions are based on weighted historical averages
                                (50% last 3 months, 30% last 6 months, 20% last 12 months). Confidence level indicates data consistency.
                                Higher confidence means more predictable patterns.
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

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

            {/* Recurring Transaction Detector */}
            {recurringPatterns.length > 0 && (
                <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 border-2 border-purple-200 dark:border-purple-900">
                    <CardHeader className="bg-linear-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Activity className="h-5 w-5 text-purple-600" />
                                Recurring Transactions Detected
                            </CardTitle>
                            <div className="text-right">
                                <p className="text-xs text-muted-foreground">Total Patterns</p>
                                <p className="text-lg font-bold text-purple-600">{recurringPatterns.length}</p>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <div className="space-y-6">
                            {/* Summary Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="p-4 rounded-lg border bg-linear-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-green-200 dark:border-green-800">
                                    <p className="text-xs text-muted-foreground mb-1">Recurring Income</p>
                                    <p className="text-3xl font-bold text-green-600">${monthlyRecurringIncome.toFixed(2)}</p>
                                    <p className="text-xs text-muted-foreground mt-1">{recurringIncome.length} pattern{recurringIncome.length !== 1 ? 's' : ''} • Monthly avg</p>
                                </div>

                                <div className="p-4 rounded-lg border bg-linear-to-br from-red-50 to-rose-50 dark:from-red-950/20 dark:to-rose-950/20 border-red-200 dark:border-red-800">
                                    <p className="text-xs text-muted-foreground mb-1">Recurring Expenses</p>
                                    <p className="text-3xl font-bold text-red-600">${monthlyRecurringExpenses.toFixed(2)}</p>
                                    <p className="text-xs text-muted-foreground mt-1">{recurringExpenses.length} pattern{recurringExpenses.length !== 1 ? 's' : ''} • Monthly avg</p>
                                </div>

                                <div className="p-4 rounded-lg border bg-linear-to-br from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20 border-blue-200 dark:border-blue-800">
                                    <p className="text-xs text-muted-foreground mb-1">Net Recurring</p>
                                    <p className={`text-3xl font-bold ${(monthlyRecurringIncome - monthlyRecurringExpenses) >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                                        ${(monthlyRecurringIncome - monthlyRecurringExpenses).toFixed(2)}
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-1">Monthly net flow</p>
                                </div>
                            </div>

                            {/* Upcoming Recurring Transactions */}
                            {upcomingRecurring.length > 0 && (
                                <div className="space-y-3">
                                    <h3 className="font-semibold text-sm flex items-center gap-2">
                                        <Calendar className="h-4 w-4" />
                                        Upcoming (Next 30 Days)
                                    </h3>
                                    <div className="space-y-2">
                                        {upcomingRecurring.slice(0, 5).map((pattern, index) => {
                                            const daysUntil = pattern.nextExpectedDate
                                                ? Math.round((pattern.nextExpectedDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
                                                : 0;
                                            const isUrgent = daysUntil <= 7;

                                            return (
                                                <div key={index} className={`p-4 rounded-lg border-2 ${isUrgent
                                                    ? 'bg-orange-50 dark:bg-orange-950/20 border-orange-300 dark:border-orange-800'
                                                    : 'bg-white dark:bg-gray-950 border-gray-200 dark:border-gray-800'
                                                    }`}>
                                                    <div className="flex items-start justify-between">
                                                        <div className="flex items-start gap-3 flex-1">
                                                            <div
                                                                className="w-3 h-3 rounded-full mt-1"
                                                                style={{ backgroundColor: pattern.category.color }}
                                                            />
                                                            <div className="flex-1">
                                                                <div className="flex items-center gap-2 mb-1">
                                                                    <p className="font-semibold text-sm">{pattern.description}</p>
                                                                    <span className={`px-2 py-0.5 text-xs rounded-full ${pattern.category.type === 'income'
                                                                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                                                                        : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                                                                        }`}>
                                                                        {pattern.category.type}
                                                                    </span>
                                                                    {isUrgent && (
                                                                        <span className="px-2 py-0.5 text-xs rounded-full bg-orange-600 text-white">
                                                                            Soon
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                                                    <span className="flex items-center gap-1">
                                                                        <Calendar className="h-3 w-3" />
                                                                        {pattern.nextExpectedDate && format(pattern.nextExpectedDate, 'MMM dd, yyyy')}
                                                                    </span>
                                                                    <span>•</span>
                                                                    <span className={isUrgent ? 'font-semibold text-orange-600' : ''}>
                                                                        {daysUntil === 0 ? 'Today' : daysUntil === 1 ? 'Tomorrow' : `in ${daysUntil} days`}
                                                                    </span>
                                                                    <span>•</span>
                                                                    <span className="capitalize">{pattern.frequency}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className={`text-lg font-bold ${pattern.category.type === 'income' ? 'text-green-600' : 'text-red-600'
                                                                }`}>
                                                                {pattern.category.type === 'income' ? '+' : '-'}${pattern.avgAmount.toFixed(2)}
                                                            </p>
                                                            <p className="text-xs text-muted-foreground">
                                                                {pattern.confidence.toFixed(0)}% confidence
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* All Recurring Patterns */}
                            <div className="space-y-3">
                                <h3 className="font-semibold text-sm flex items-center gap-2">
                                    <Filter className="h-4 w-4" />
                                    All Detected Patterns
                                </h3>
                                <div className="grid grid-cols-1 gap-3">
                                    {recurringPatterns.map((pattern, index) => {
                                        const frequencyLabel = pattern.frequency.charAt(0).toUpperCase() + pattern.frequency.slice(1);
                                        const occurrences = pattern.transactions.length;

                                        return (
                                            <div key={index} className="p-4 rounded-lg border hover:shadow-md transition-shadow">
                                                <div className="flex items-start justify-between">
                                                    <div className="flex items-start gap-3 flex-1">
                                                        <div
                                                            className="w-3 h-3 rounded-full mt-1"
                                                            style={{ backgroundColor: pattern.category.color }}
                                                        />
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <p className="font-semibold text-sm">{pattern.description}</p>
                                                                <span className={`px-2 py-0.5 text-xs rounded-full ${pattern.category.type === 'income'
                                                                    ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                                                                    : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                                                                    }`}>
                                                                    {pattern.category.type}
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                                                                <span className="font-medium text-purple-600">
                                                                    {frequencyLabel}
                                                                </span>
                                                                <span>•</span>
                                                                <span>{occurrences} occurrence{occurrences !== 1 ? 's' : ''}</span>
                                                                {pattern.dayOfMonth && (
                                                                    <>
                                                                        <span>•</span>
                                                                        <span>Day {pattern.dayOfMonth} of month</span>
                                                                    </>
                                                                )}
                                                                {pattern.dayOfWeek !== undefined && (
                                                                    <>
                                                                        <span>•</span>
                                                                        <span>{['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][pattern.dayOfWeek]}</span>
                                                                    </>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="text-right ml-4">
                                                        <p className={`text-lg font-bold ${pattern.category.type === 'income' ? 'text-green-600' : 'text-red-600'
                                                            }`}>
                                                            {pattern.category.type === 'income' ? '+' : '-'}${pattern.avgAmount.toFixed(2)}
                                                        </p>
                                                        <div className="flex items-center gap-1 mt-1">
                                                            <div className={`h-1.5 rounded-full ${pattern.confidence >= 80 ? 'bg-green-500' :
                                                                pattern.confidence >= 70 ? 'bg-blue-500' :
                                                                    'bg-yellow-500'
                                                                }`} style={{ width: `${pattern.confidence}%`, maxWidth: '60px' }}></div>
                                                            <span className="text-xs text-muted-foreground">
                                                                {pattern.confidence.toFixed(0)}%
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Info Box */}
                            <div className="p-4 rounded-lg bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800">
                                <p className="text-sm font-semibold text-purple-900 dark:text-purple-100 mb-2 flex items-center gap-2">
                                    <AlertCircle className="h-4 w-4" />
                                    About Recurring Detection
                                </p>
                                <p className="text-xs text-purple-700 dark:text-purple-300">
                                    Patterns are detected by analyzing transaction amounts, timing, and frequency.
                                    Confidence scores indicate reliability (80%+ = high confidence). Use this to identify
                                    subscriptions, bills, and regular income sources for better budget planning.
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Expense Trends Analysis */}
            <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 border-2 border-orange-200 dark:border-orange-900">
                <CardHeader className="bg-linear-to-r from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Activity className="h-5 w-5 text-orange-600" />
                        Expense Trends & Patterns
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                    <div className="grid gap-6">
                        {/* Overall Trend Summary */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className={`p-4 rounded-lg border-2 ${spendingPattern === 'increasing'
                                ? 'bg-red-50 dark:bg-red-950/20 border-red-300 dark:border-red-800'
                                : spendingPattern === 'decreasing'
                                    ? 'bg-green-50 dark:bg-green-950/20 border-green-300 dark:border-green-800'
                                    : 'bg-blue-50 dark:bg-blue-950/20 border-blue-300 dark:border-blue-800'
                                }`}>
                                <p className="text-xs text-muted-foreground mb-1">3-Month Trend</p>
                                <div className="flex items-center gap-2">
                                    {spendingPattern === 'increasing' ? (
                                        <TrendingUp className="h-6 w-6 text-red-600" />
                                    ) : spendingPattern === 'decreasing' ? (
                                        <TrendingDown className="h-6 w-6 text-green-600" />
                                    ) : (
                                        <Activity className="h-6 w-6 text-blue-600" />
                                    )}
                                    <span className={`text-xl font-bold ${spendingPattern === 'increasing' ? 'text-red-600' :
                                        spendingPattern === 'decreasing' ? 'text-green-600' : 'text-blue-600'
                                        }`}>
                                        {spendingPattern === 'increasing' ? 'Increasing' :
                                            spendingPattern === 'decreasing' ? 'Decreasing' : 'Stable'}
                                    </span>
                                </div>
                                <p className="text-xs mt-2 text-muted-foreground">
                                    {spendingPattern === 'increasing' && '⚠️ Spending is rising'}
                                    {spendingPattern === 'decreasing' && '✅ Spending is falling'}
                                    {spendingPattern === 'stable' && '📊 Spending is steady'}
                                </p>
                            </div>

                            <div className="p-4 rounded-lg border bg-linear-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 border-purple-200 dark:border-purple-800">
                                <p className="text-xs text-muted-foreground mb-1">Recent vs Previous</p>
                                <p className="text-2xl font-bold text-purple-600">
                                    {overallExpenseTrend >= 0 ? '+' : ''}{overallExpenseTrend.toFixed(1)}%
                                </p>
                                <p className="text-xs mt-2 text-muted-foreground">
                                    Last 6 months vs previous 6
                                </p>
                            </div>

                            <div className="p-4 rounded-lg border bg-linear-to-br from-cyan-50 to-blue-50 dark:from-cyan-950/20 dark:to-blue-950/20 border-cyan-200 dark:border-cyan-800">
                                <p className="text-xs text-muted-foreground mb-1">Recent Avg</p>
                                <p className="text-2xl font-bold text-cyan-600">
                                    ${recentAvgExpenses.toFixed(2)}
                                </p>
                                <p className="text-xs mt-2 text-muted-foreground">
                                    Monthly average (last 6 months)
                                </p>
                            </div>
                        </div>

                        {/* Category-wise Trends */}
                        <div className="space-y-3">
                            <h3 className="font-semibold text-sm flex items-center gap-2">
                                <Filter className="h-4 w-4" />
                                Category Trends (Last 3 Months)
                            </h3>
                            {categoryTrends.slice(0, 5).map((item) => (
                                <div key={item.category.id} className="flex items-center justify-between p-3 rounded-lg border hover:shadow-md transition-shadow">
                                    <div className="flex items-center gap-3 flex-1">
                                        <div
                                            className="w-3 h-3 rounded-full"
                                            style={{ backgroundColor: item.category.color }}
                                        />
                                        <div className="flex-1">
                                            <p className="font-medium text-sm">{item.category.name}</p>
                                            <p className="text-xs text-muted-foreground">
                                                Avg: ${item.avgSpending.toFixed(2)}/month
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="text-right">
                                            <p className="text-sm font-semibold">
                                                ${item.currentMonth.toFixed(2)}
                                            </p>
                                            <p className={`text-xs font-medium ${item.trend === 'up' ? 'text-red-600' :
                                                item.trend === 'down' ? 'text-green-600' : 'text-gray-600'
                                                }`}>
                                                {item.changePercent >= 0 ? '+' : ''}{item.changePercent.toFixed(1)}%
                                            </p>
                                        </div>
                                        {item.trend === 'up' ? (
                                            <TrendingUp className="h-5 w-5 text-red-600" />
                                        ) : item.trend === 'down' ? (
                                            <TrendingDown className="h-5 w-5 text-green-600" />
                                        ) : (
                                            <Activity className="h-5 w-5 text-gray-600" />
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Trend Chart with Moving Average */}
                        <div className="mt-4">
                            <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                                <Activity className="h-4 w-4" />
                                Expense Trend with Moving Average
                            </h3>
                            <ResponsiveContainer width="100%" height={300}>
                                <LineChart data={expenseTrendData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="shortMonth" />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    <Line
                                        type="monotone"
                                        dataKey="expenses"
                                        stroke="#ef4444"
                                        strokeWidth={2}
                                        name="Actual Expenses"
                                        dot={{ r: 4 }}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="movingAvg"
                                        stroke="#f59e0b"
                                        strokeWidth={2}
                                        strokeDasharray="5 5"
                                        name="3-Month Avg"
                                        dot={false}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
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

            {/* Top 5 Transactions */}
            <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 border-2 border-cyan-200 dark:border-cyan-900">
                <CardHeader className="bg-linear-to-r from-cyan-50 to-blue-50 dark:from-cyan-950/20 dark:to-blue-950/20">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <DollarSign className="h-5 w-5 text-cyan-600" />
                        Top 5 Transactions
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                    <div className="grid gap-6 md:grid-cols-2">
                        {/* Top 5 Expenses */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="font-semibold text-sm flex items-center gap-2">
                                    <TrendingDown className="h-4 w-4 text-red-600" />
                                    Largest Expenses
                                </h3>
                                {topExpenses.length > 0 && (
                                    <span className="text-xs text-muted-foreground">
                                        ${topExpenses.reduce((sum, t) => sum + t.amount, 0).toFixed(2)} total
                                    </span>
                                )}
                            </div>
                            {topExpenses.length > 0 ? (
                                <div className="space-y-3">
                                    {topExpenses.map((transaction, index) => (
                                        <div key={transaction.id} className="p-3 rounded-lg border hover:shadow-md transition-shadow bg-red-50/50 dark:bg-red-950/10 border-red-200 dark:border-red-900">
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="flex items-start gap-3 flex-1">
                                                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-xs font-bold">
                                                        {index + 1}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            {transaction.category && (
                                                                <div
                                                                    className="w-2 h-2 rounded-full shrink-0"
                                                                    style={{ backgroundColor: transaction.category.color }}
                                                                />
                                                            )}
                                                            <p className="font-semibold text-sm truncate">
                                                                {transaction.description || transaction.category?.name || 'Expense'}
                                                            </p>
                                                        </div>
                                                        <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                                                            <span>{transaction.category?.name}</span>
                                                            <span>•</span>
                                                            <span>{format(new Date(transaction.date), 'MMM dd, yyyy')}</span>
                                                            <span>•</span>
                                                            <span className="font-medium text-red-600">
                                                                {transaction.percentOfTotal.toFixed(1)}% of total
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="text-right shrink-0">
                                                    <p className="text-lg font-bold text-red-600">
                                                        ${transaction.amount.toFixed(2)}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8 text-muted-foreground">
                                    <TrendingDown className="h-12 w-12 mx-auto mb-3 opacity-50" />
                                    <p className="text-sm">No expense transactions</p>
                                </div>
                            )}
                        </div>

                        {/* Top 5 Income */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="font-semibold text-sm flex items-center gap-2">
                                    <TrendingUp className="h-4 w-4 text-green-600" />
                                    Largest Income
                                </h3>
                                {topIncome.length > 0 && (
                                    <span className="text-xs text-muted-foreground">
                                        ${topIncome.reduce((sum, t) => sum + t.amount, 0).toFixed(2)} total
                                    </span>
                                )}
                            </div>
                            {topIncome.length > 0 ? (
                                <div className="space-y-3">
                                    {topIncome.map((transaction, index) => (
                                        <div key={transaction.id} className="p-3 rounded-lg border hover:shadow-md transition-shadow bg-green-50/50 dark:bg-green-950/10 border-green-200 dark:border-green-900">
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="flex items-start gap-3 flex-1">
                                                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs font-bold">
                                                        {index + 1}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            {transaction.category && (
                                                                <div
                                                                    className="w-2 h-2 rounded-full shrink-0"
                                                                    style={{ backgroundColor: transaction.category.color }}
                                                                />
                                                            )}
                                                            <p className="font-semibold text-sm truncate">
                                                                {transaction.description || transaction.category?.name || 'Income'}
                                                            </p>
                                                        </div>
                                                        <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                                                            <span>{transaction.category?.name}</span>
                                                            <span>•</span>
                                                            <span>{format(new Date(transaction.date), 'MMM dd, yyyy')}</span>
                                                            <span>•</span>
                                                            <span className="font-medium text-green-600">
                                                                {transaction.percentOfTotal.toFixed(1)}% of total
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="text-right shrink-0">
                                                    <p className="text-lg font-bold text-green-600">
                                                        ${transaction.amount.toFixed(2)}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8 text-muted-foreground">
                                    <TrendingUp className="h-12 w-12 mx-auto mb-3 opacity-50" />
                                    <p className="text-sm">No income transactions</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Recent Large Transactions */}
                    {recentLargeTransactions.length > 0 && (
                        <div className="mt-6 pt-6 border-t">
                            <h3 className="font-semibold text-sm flex items-center gap-2 mb-4">
                                <Calendar className="h-4 w-4" />
                                Recent Large Transactions (Last 30 Days)
                            </h3>
                            <div className="grid grid-cols-1 gap-2">
                                {recentLargeTransactions.slice(0, 5).map((transaction) => (
                                    <div key={transaction.id} className="p-3 rounded-lg border hover:shadow-sm transition-shadow flex items-center justify-between">
                                        <div className="flex items-center gap-3 flex-1 min-w-0">
                                            {transaction.category && (
                                                <div
                                                    className="w-3 h-3 rounded-full shrink-0"
                                                    style={{ backgroundColor: transaction.category.color }}
                                                />
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium truncate">
                                                    {transaction.description || transaction.category?.name || transaction.type}
                                                </p>
                                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                    <span>{transaction.category?.name}</span>
                                                    <span>•</span>
                                                    <span>{transaction.daysAgo === 0 ? 'Today' : transaction.daysAgo === 1 ? 'Yesterday' : `${transaction.daysAgo} days ago`}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right shrink-0 ml-3">
                                            <p className={`text-sm font-bold ${transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                                                {transaction.type === 'income' ? '+' : '-'}${transaction.amount.toFixed(2)}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

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

            {/* Day-of-Week Analysis */}
            <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 border-2 border-teal-200 dark:border-teal-900">
                <CardHeader className="bg-linear-to-r from-teal-50 to-cyan-50 dark:from-teal-950/20 dark:to-cyan-950/20">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-teal-600" />
                        Day-of-Week Spending Patterns
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                    <div className="space-y-6">
                        {/* Summary Cards */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="p-4 rounded-lg border bg-linear-to-br from-red-50 to-rose-50 dark:from-red-950/20 dark:to-rose-950/20 border-red-200 dark:border-red-800">
                                <p className="text-xs text-muted-foreground mb-1">Highest Spending</p>
                                <p className="text-xl font-bold text-red-600">{highestSpendingDay.day}</p>
                                <p className="text-xs text-muted-foreground mt-1">${highestSpendingDay.expenses.toFixed(2)}</p>
                            </div>

                            <div className="p-4 rounded-lg border bg-linear-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-green-200 dark:border-green-800">
                                <p className="text-xs text-muted-foreground mb-1">Lowest Spending</p>
                                <p className="text-xl font-bold text-green-600">{lowestSpendingDay.day}</p>
                                <p className="text-xs text-muted-foreground mt-1">${lowestSpendingDay.expenses.toFixed(2)}</p>
                            </div>

                            <div className="p-4 rounded-lg border bg-linear-to-br from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20 border-blue-200 dark:border-blue-800">
                                <p className="text-xs text-muted-foreground mb-1">Most Active</p>
                                <p className="text-xl font-bold text-blue-600">{mostActiveDay.day}</p>
                                <p className="text-xs text-muted-foreground mt-1">{mostActiveDay.transactionCount} transactions</p>
                            </div>

                            <div className="p-4 rounded-lg border bg-linear-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 border-purple-200 dark:border-purple-800">
                                <p className="text-xs text-muted-foreground mb-1">Best Income Day</p>
                                <p className="text-xl font-bold text-purple-600">{highestIncomeDay.day}</p>
                                <p className="text-xs text-muted-foreground mt-1">${highestIncomeDay.income.toFixed(2)}</p>
                            </div>
                        </div>

                        {/* Day-by-Day Breakdown */}
                        <div className="space-y-3">
                            <h3 className="font-semibold text-sm flex items-center gap-2">
                                <Activity className="h-4 w-4" />
                                Daily Breakdown
                            </h3>
                            {dayOfWeekData.map((day) => {
                                const maxExpenses = Math.max(...dayOfWeekData.map(d => d.expenses));
                                const expensePercent = maxExpenses > 0 ? (day.expenses / maxExpenses) * 100 : 0;
                                const isWeekend = day.dayIndex === 0 || day.dayIndex === 6;

                                return (
                                    <div key={day.day} className={`p-4 rounded-lg border ${isWeekend
                                        ? 'bg-amber-50/50 dark:bg-amber-950/10 border-amber-200 dark:border-amber-900'
                                        : 'bg-white dark:bg-gray-950 border-gray-200 dark:border-gray-800'
                                        }`}>
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${isWeekend
                                                    ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300'
                                                    : 'bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300'
                                                    }`}>
                                                    {day.shortDay}
                                                </div>
                                                <div>
                                                    <p className="font-semibold">{day.day}</p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {day.transactionCount} transaction{day.transactionCount !== 1 ? 's' : ''}
                                                        {isWeekend && <span className="ml-2 text-amber-600">• Weekend</span>}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-lg font-bold text-red-600">${day.expenses.toFixed(2)}</p>
                                                {day.income > 0 && (
                                                    <p className="text-sm text-green-600">+${day.income.toFixed(2)}</p>
                                                )}
                                            </div>
                                        </div>

                                        {/* Expense Bar */}
                                        <div className="space-y-1">
                                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                                                <span>Spending</span>
                                                <span>{expensePercent.toFixed(0)}% of max</span>
                                            </div>
                                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                                <div
                                                    className="h-2 rounded-full bg-linear-to-r from-red-500 to-rose-500 transition-all duration-500"
                                                    style={{ width: `${expensePercent}%` }}
                                                />
                                            </div>
                                        </div>

                                        {/* Transaction Details */}
                                        {day.transactionCount > 0 && (
                                            <div className="mt-3 pt-3 border-t grid grid-cols-2 gap-3 text-xs">
                                                <div>
                                                    <p className="text-muted-foreground">Avg Transaction</p>
                                                    <p className="font-semibold">${day.avgTransactionSize.toFixed(2)}</p>
                                                </div>
                                                <div>
                                                    <p className="text-muted-foreground">Net Flow</p>
                                                    <p className={`font-semibold ${day.net >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                        {day.net >= 0 ? '+' : ''}${day.net.toFixed(2)}
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        {/* Weekend vs Weekday Comparison */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                            <div className="p-4 rounded-lg bg-linear-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-2 border-blue-200 dark:border-blue-800">
                                <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                                    <Activity className="h-4 w-4 text-blue-600" />
                                    Weekday Pattern
                                </h4>
                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <span className="text-sm text-muted-foreground">Total Spending</span>
                                        <span className="font-bold text-red-600">${weekdayExpenses.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-sm text-muted-foreground">Daily Average</span>
                                        <span className="font-bold text-blue-600">${weekdayAvg.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-sm text-muted-foreground">Days</span>
                                        <span className="font-semibold">Mon - Fri</span>
                                    </div>
                                </div>
                            </div>

                            <div className="p-4 rounded-lg bg-linear-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border-2 border-amber-200 dark:border-amber-800">
                                <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                                    <Calendar className="h-4 w-4 text-amber-600" />
                                    Weekend Pattern
                                </h4>
                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <span className="text-sm text-muted-foreground">Total Spending</span>
                                        <span className="font-bold text-red-600">${weekendExpenses.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-sm text-muted-foreground">Daily Average</span>
                                        <span className="font-bold text-amber-600">${weekendAvg.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-sm text-muted-foreground">Comparison</span>
                                        <span className={`font-semibold ${weekendAvg > weekdayAvg ? 'text-red-600' : 'text-green-600'}`}>
                                            {weekendAvg > weekdayAvg ? '+' : ''}{((weekendAvg - weekdayAvg) / weekdayAvg * 100).toFixed(0)}%
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Chart */}
                        <div className="pt-4">
                            <h3 className="font-semibold text-sm mb-4">Weekly Spending Pattern</h3>
                            <ResponsiveContainer width="100%" height={250}>
                                <BarChart data={dayOfWeekData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="shortDay" />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    <Bar dataKey="expenses" fill="#ef4444" name="Expenses" radius={[8, 8, 0, 0]} />
                                    <Bar dataKey="income" fill="#22c55e" name="Income" radius={[8, 8, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Insights */}
                        <div className="p-4 rounded-lg bg-teal-50 dark:bg-teal-950/20 border border-teal-200 dark:border-teal-800">
                            <p className="text-sm font-semibold text-teal-900 dark:text-teal-100 mb-2 flex items-center gap-2">
                                <AlertCircle className="h-4 w-4" />
                                Weekly Insights
                            </p>
                            <ul className="text-xs text-teal-700 dark:text-teal-300 space-y-1">
                                <li>• You spend most on {highestSpendingDay.day}s (${highestSpendingDay.expenses.toFixed(2)} total)</li>
                                <li>• {mostActiveDay.day} is your most active day with {mostActiveDay.transactionCount} transactions</li>
                                {weekendAvg > weekdayAvg ? (
                                    <li>• Weekend spending is {((weekendAvg - weekdayAvg) / weekdayAvg * 100).toFixed(0)}% higher than weekdays</li>
                                ) : (
                                    <li>• You spend {((weekdayAvg - weekendAvg) / weekendAvg * 100).toFixed(0)}% more on weekdays than weekends</li>
                                )}
                                {highestIncomeDay.income > 0 && (
                                    <li>• Most income received on {highestIncomeDay.day}s (${highestIncomeDay.income.toFixed(2)})</li>
                                )}
                            </ul>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Category Comparison */}
            {categoryComparison.length > 0 && (
                <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 border-2 border-emerald-200 dark:border-emerald-900">
                    <CardHeader className="bg-linear-to-r from-emerald-50 to-green-50 dark:from-emerald-950/20 dark:to-green-950/20">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Filter className="h-5 w-5 text-emerald-600" />
                            Category Comparison & Trends
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <div className="space-y-6">
                            {/* Top Insights */}
                            {(growingCategories.length > 0 || shrinkingCategories.length > 0) && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Growing Categories */}
                                    {growingCategories.length > 0 && (
                                        <div className="p-4 rounded-lg bg-red-50 dark:bg-red-950/20 border-2 border-red-200 dark:border-red-800">
                                            <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                                                <TrendingUp className="h-4 w-4 text-red-600" />
                                                Growing Expenses
                                            </h4>
                                            <div className="space-y-2">
                                                {growingCategories.map((item) => (
                                                    <div key={item.category.id} className="flex items-center justify-between">
                                                        <div className="flex items-center gap-2">
                                                            <div
                                                                className="w-2 h-2 rounded-full"
                                                                style={{ backgroundColor: item.category.color }}
                                                            />
                                                            <span className="text-sm font-medium">{item.category.name}</span>
                                                        </div>
                                                        <span className="text-sm font-bold text-red-600">
                                                            +{item.monthOverMonthChange.toFixed(0)}%
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Shrinking Categories */}
                                    {shrinkingCategories.length > 0 && (
                                        <div className="p-4 rounded-lg bg-green-50 dark:bg-green-950/20 border-2 border-green-200 dark:border-green-800">
                                            <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                                                <TrendingDown className="h-4 w-4 text-green-600" />
                                                Reduced Expenses
                                            </h4>
                                            <div className="space-y-2">
                                                {shrinkingCategories.map((item) => (
                                                    <div key={item.category.id} className="flex items-center justify-between">
                                                        <div className="flex items-center gap-2">
                                                            <div
                                                                className="w-2 h-2 rounded-full"
                                                                style={{ backgroundColor: item.category.color }}
                                                            />
                                                            <span className="text-sm font-medium">{item.category.name}</span>
                                                        </div>
                                                        <span className="text-sm font-bold text-green-600">
                                                            {item.monthOverMonthChange.toFixed(0)}%
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Detailed Category Breakdown */}
                            <div className="space-y-3">
                                <h3 className="font-semibold text-sm flex items-center gap-2">
                                    <Activity className="h-4 w-4" />
                                    Detailed Comparison
                                </h3>
                                {categoryComparison.map((item) => (
                                    <div key={item.category.id} className="p-4 rounded-lg border hover:shadow-md transition-shadow">
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="flex items-start gap-3 flex-1">
                                                <div
                                                    className="w-4 h-4 rounded-full mt-1"
                                                    style={{ backgroundColor: item.category.color }}
                                                />
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <h4 className="font-semibold">{item.category.name}</h4>
                                                        {item.trendStatus === 'increasing' && (
                                                            <span className="px-2 py-0.5 text-xs rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 flex items-center gap-1">
                                                                <TrendingUp className="h-3 w-3" />
                                                                Rising
                                                            </span>
                                                        )}
                                                        {item.trendStatus === 'decreasing' && (
                                                            <span className="px-2 py-0.5 text-xs rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 flex items-center gap-1">
                                                                <TrendingDown className="h-3 w-3" />
                                                                Falling
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-xs text-muted-foreground">
                                                        {item.transactionCount} transaction{item.transactionCount !== 1 ? 's' : ''} • {item.percentOfTotal.toFixed(1)}% of expenses
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xl font-bold text-red-600">
                                                    ${item.currentMonthSpend.toFixed(2)}
                                                </p>
                                                <p className="text-xs text-muted-foreground">This month</p>
                                            </div>
                                        </div>

                                        {/* Comparison Metrics */}
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                                            <div className="text-center p-2 rounded bg-gray-50 dark:bg-gray-900/30">
                                                <p className="text-xs text-muted-foreground">Last Month</p>
                                                <p className="text-sm font-semibold">${item.lastMonthSpend.toFixed(2)}</p>
                                            </div>
                                            <div className="text-center p-2 rounded bg-gray-50 dark:bg-gray-900/30">
                                                <p className="text-xs text-muted-foreground">3-Mo Avg</p>
                                                <p className="text-sm font-semibold">${item.avg3Months.toFixed(2)}</p>
                                            </div>
                                            <div className="text-center p-2 rounded bg-gray-50 dark:bg-gray-900/30">
                                                <p className="text-xs text-muted-foreground">6-Mo Avg</p>
                                                <p className="text-sm font-semibold">${item.avg6Months.toFixed(2)}</p>
                                            </div>
                                            <div className={`text-center p-2 rounded ${item.monthOverMonthChange > 0 ? 'bg-red-50 dark:bg-red-950/20' : 'bg-green-50 dark:bg-green-950/20'
                                                }`}>
                                                <p className="text-xs text-muted-foreground">MoM Change</p>
                                                <p className={`text-sm font-bold ${item.monthOverMonthChange > 0 ? 'text-red-600' : 'text-green-600'
                                                    }`}>
                                                    {item.monthOverMonthChange >= 0 ? '+' : ''}{item.monthOverMonthChange.toFixed(0)}%
                                                </p>
                                            </div>
                                        </div>

                                        {/* Budget Progress if exists */}
                                        {item.budget && item.budgetUtilization !== null && (
                                            <div className="space-y-1">
                                                <div className="flex items-center justify-between text-xs">
                                                    <span className="text-muted-foreground">Budget Progress</span>
                                                    <span className={`font-semibold ${item.budgetUtilization >= 100 ? 'text-red-600' :
                                                        item.budgetUtilization >= 90 ? 'text-orange-600' :
                                                            'text-green-600'
                                                        }`}>
                                                        {item.budgetUtilization.toFixed(0)}% • ${item.budget.amount.toFixed(2)} budget
                                                    </span>
                                                </div>
                                                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                                    <div
                                                        className={`h-2 rounded-full transition-all duration-500 ${item.budgetUtilization >= 100 ? 'bg-red-500' :
                                                            item.budgetUtilization >= 90 ? 'bg-orange-500' :
                                                                item.budgetUtilization >= 75 ? 'bg-yellow-500' :
                                                                    'bg-green-500'
                                                            }`}
                                                        style={{ width: `${Math.min(item.budgetUtilization, 100)}%` }}
                                                    />
                                                </div>
                                            </div>
                                        )}

                                        {/* Trend vs Average */}
                                        <div className="mt-3 pt-3 border-t">
                                            <div className="flex items-center justify-between text-xs">
                                                <span className="text-muted-foreground">vs 3-Month Average</span>
                                                <span className={`font-semibold ${item.vs3MonthAvg > 10 ? 'text-red-600' :
                                                    item.vs3MonthAvg < -10 ? 'text-green-600' :
                                                        'text-blue-600'
                                                    }`}>
                                                    {item.vs3MonthAvg >= 0 ? '+' : ''}{item.vs3MonthAvg.toFixed(0)}%
                                                    {item.vs3MonthAvg > 10 && ' above average'}
                                                    {item.vs3MonthAvg < -10 && ' below average'}
                                                    {Math.abs(item.vs3MonthAvg) <= 10 && ' near average'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Summary Stats */}
                            <div className="p-4 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800">
                                <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-100 mb-2 flex items-center gap-2">
                                    <AlertCircle className="h-4 w-4" />
                                    Category Insights
                                </p>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-emerald-700 dark:text-emerald-300">
                                    <div>
                                        <p className="text-muted-foreground mb-1">Active Categories</p>
                                        <p className="font-bold text-lg">{categoryComparison.length}</p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground mb-1">Growing</p>
                                        <p className="font-bold text-lg text-red-600">{growingCategories.length}</p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground mb-1">Shrinking</p>
                                        <p className="font-bold text-lg text-green-600">{shrinkingCategories.length}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Average Transaction Size Analysis */}
            <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 border-2 border-pink-200 dark:border-pink-900">
                <CardHeader className="bg-linear-to-r from-pink-50 to-rose-50 dark:from-pink-950/20 dark:to-rose-950/20">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <DollarSign className="h-5 w-5 text-pink-600" />
                        Transaction Size Analysis
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                    <div className="space-y-6">
                        {/* Summary Cards */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="p-4 rounded-lg border bg-linear-to-br from-red-50 to-rose-50 dark:from-red-950/20 dark:to-rose-950/20 border-red-200 dark:border-red-800">
                                <p className="text-xs text-muted-foreground mb-1">Avg Expense</p>
                                <p className="text-2xl font-bold text-red-600">${avgExpenseSize.toFixed(2)}</p>
                                <p className="text-xs text-muted-foreground mt-1">{expenseTransactions.length} transactions</p>
                            </div>

                            <div className="p-4 rounded-lg border bg-linear-to-br from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20 border-orange-200 dark:border-orange-800">
                                <p className="text-xs text-muted-foreground mb-1">Median Expense</p>
                                <p className="text-2xl font-bold text-orange-600">${medianExpenseSize.toFixed(2)}</p>
                                <p className="text-xs text-muted-foreground mt-1">Middle value</p>
                            </div>

                            <div className="p-4 rounded-lg border bg-linear-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-green-200 dark:border-green-800">
                                <p className="text-xs text-muted-foreground mb-1">Avg Income</p>
                                <p className="text-2xl font-bold text-green-600">${avgIncomeSize.toFixed(2)}</p>
                                <p className="text-xs text-muted-foreground mt-1">{incomeTransactions.length} transactions</p>
                            </div>

                            <div className="p-4 rounded-lg border bg-linear-to-br from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20 border-blue-200 dark:border-blue-800">
                                <p className="text-xs text-muted-foreground mb-1">Median Income</p>
                                <p className="text-2xl font-bold text-blue-600">${medianIncomeSize.toFixed(2)}</p>
                                <p className="text-xs text-muted-foreground mt-1">Middle value</p>
                            </div>
                        </div>

                        {/* Transaction Size Distribution */}
                        <div className="space-y-3">
                            <h3 className="font-semibold text-sm flex items-center gap-2">
                                <Activity className="h-4 w-4" />
                                Expense Size Distribution
                            </h3>
                            {expenseSizeRanges.map((range, index) => {
                                const percentOfCount = expenseTransactions.length > 0
                                    ? (range.count / expenseTransactions.length) * 100
                                    : 0;
                                const percentOfTotal = totalExpenses > 0
                                    ? (range.total / totalExpenses) * 100
                                    : 0;

                                return (
                                    <div key={index} className="p-3 rounded-lg border hover:shadow-md transition-shadow">
                                        <div className="flex items-center justify-between mb-2">
                                            <div>
                                                <p className="font-semibold text-sm">{range.label}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {range.count} transaction{range.count !== 1 ? 's' : ''} • ${range.total.toFixed(2)}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm font-bold text-pink-600">{percentOfCount.toFixed(0)}%</p>
                                                <p className="text-xs text-muted-foreground">of count</p>
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                                <div
                                                    className="h-2 rounded-full bg-linear-to-r from-pink-500 to-rose-500 transition-all duration-500"
                                                    style={{ width: `${percentOfTotal}%` }}
                                                />
                                            </div>
                                            <p className="text-xs text-muted-foreground text-right">
                                                {percentOfTotal.toFixed(1)}% of total spending
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Category Average Sizes */}
                        {categoryAvgSizes.length > 0 && (
                            <div className="space-y-3">
                                <h3 className="font-semibold text-sm flex items-center gap-2">
                                    <Filter className="h-4 w-4" />
                                    Average by Category (Top 5)
                                </h3>
                                {categoryAvgSizes.slice(0, 5).map((item) => (
                                    <div key={item.category.id} className="flex items-center justify-between p-3 rounded-lg border hover:shadow-sm transition-shadow">
                                        <div className="flex items-center gap-3 flex-1">
                                            <div
                                                className="w-3 h-3 rounded-full"
                                                style={{ backgroundColor: item.category.color }}
                                            />
                                            <div className="flex-1">
                                                <p className="text-sm font-semibold">{item.category.name}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {item.transactionCount} transaction{item.transactionCount !== 1 ? 's' : ''} •
                                                    ${item.totalSpent.toFixed(2)} total
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-lg font-bold text-pink-600">${item.avgSize.toFixed(2)}</p>
                                            <p className="text-xs text-muted-foreground">avg size</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Outlier Transactions */}
                        {outlierTransactions.length > 0 && (
                            <div className="space-y-3">
                                <h3 className="font-semibold text-sm flex items-center gap-2">
                                    <AlertCircle className="h-4 w-4" />
                                    Unusual Transactions (Outliers)
                                </h3>
                                <p className="text-xs text-muted-foreground">
                                    Transactions significantly above average (2+ standard deviations)
                                </p>
                                {outlierTransactions.map((transaction) => (
                                    <div key={transaction.id} className="p-3 rounded-lg border-l-4 border-orange-500 bg-orange-50/50 dark:bg-orange-950/10">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    {transaction.category && (
                                                        <div
                                                            className="w-2 h-2 rounded-full"
                                                            style={{ backgroundColor: transaction.category.color }}
                                                        />
                                                    )}
                                                    <p className="font-semibold text-sm">
                                                        {transaction.description || transaction.category?.name || 'Expense'}
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                    <span>{transaction.category?.name}</span>
                                                    <span>•</span>
                                                    <span>{format(new Date(transaction.date), 'MMM dd, yyyy')}</span>
                                                    <span>•</span>
                                                    <span className="font-semibold text-orange-600">
                                                        {transaction.deviations.toFixed(1)}σ above avg
                                                    </span>
                                                </div>
                                            </div>
                                            <p className="text-lg font-bold text-orange-600 ml-3">
                                                ${transaction.amount.toFixed(2)}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Monthly Trend Chart */}
                        <div className="space-y-3">
                            <h3 className="font-semibold text-sm">Average Transaction Size Trend</h3>
                            <ResponsiveContainer width="100%" height={250}>
                                <LineChart data={monthlyAvgSizes}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="shortMonth" />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    <Line
                                        type="monotone"
                                        dataKey="avgSize"
                                        stroke="#ec4899"
                                        strokeWidth={2}
                                        name="Avg Transaction Size"
                                        dot={{ r: 4 }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Insights */}
                        <div className="p-4 rounded-lg bg-pink-50 dark:bg-pink-950/20 border border-pink-200 dark:border-pink-800">
                            <p className="text-sm font-semibold text-pink-900 dark:text-pink-100 mb-2 flex items-center gap-2">
                                <AlertCircle className="h-4 w-4" />
                                Transaction Insights
                            </p>
                            <ul className="text-xs text-pink-700 dark:text-pink-300 space-y-1">
                                <li>• Your average expense is ${avgExpenseSize.toFixed(2)}, but median is ${medianExpenseSize.toFixed(2)}</li>
                                {avgExpenseSize > medianExpenseSize * 1.2 && (
                                    <li>• A few large transactions are pulling the average up</li>
                                )}
                                {categoryAvgSizes.length > 0 && (
                                    <li>• Highest avg transaction: {categoryAvgSizes[0].category.name} at ${categoryAvgSizes[0].avgSize.toFixed(2)}</li>
                                )}
                                {outlierTransactions.length > 0 && (
                                    <li>• {outlierTransactions.length} unusual transaction{outlierTransactions.length !== 1 ? 's' : ''} detected this period</li>
                                )}
                                {expenseSizeRanges[0].count > expenseTransactions.length * 0.4 && (
                                    <li>• Most transactions are small (&lt;$10), consider consolidating purchases</li>
                                )}
                            </ul>
                        </div>
                    </div>
                </CardContent>
            </Card>

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
