import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { TrendingUp, TrendingDown, DollarSign, FileText } from 'lucide-react';
import { useTransactions } from '@/lib/hooks/use-budget-queries';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';

interface IncomeStatementProps {
    dateRange?: {
        start: Date;
        end: Date;
    };
}

export function IncomeStatement({ dateRange }: IncomeStatementProps) {
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

    // Calculate income and expenses for current period
    const currentIncome = currentTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);

    const currentExpenses = currentTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

    const currentNetIncome = currentIncome - currentExpenses;

    // Calculate income and expenses for previous period
    const previousIncome = previousTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);

    const previousExpenses = previousTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

    const previousNetIncome = previousIncome - previousExpenses;

    // Calculate percentage changes
    const incomeChange = previousIncome > 0 ? ((currentIncome - previousIncome) / previousIncome) * 100 : 0;
    const expenseChange = previousExpenses > 0 ? ((currentExpenses - previousExpenses) / previousExpenses) * 100 : 0;
    const netIncomeChange = previousNetIncome !== 0 ? ((currentNetIncome - previousNetIncome) / Math.abs(previousNetIncome)) * 100 : 0;

    // Group expenses by category
    const expenseCategories = currentTransactions
        .filter(t => t.type === 'expense')
        .reduce((acc, t) => {
            const category = t.category?.name || 'Uncategorized';
            acc[category] = (acc[category] || 0) + t.amount;
            return acc;
        }, {} as Record<string, number>);

    // Group income by category
    const incomeCategories = currentTransactions
        .filter(t => t.type === 'income')
        .reduce((acc, t) => {
            const category = t.category?.name || 'Uncategorized';
            acc[category] = (acc[category] || 0) + t.amount;
            return acc;
        }, {} as Record<string, number>);

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Income Statement (Profit & Loss)
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                    For the period: {format(dateRange?.start || currentMonth.start, 'MMM dd, yyyy')} - {format(dateRange?.end || currentMonth.end, 'MMM dd, yyyy')}
                </p>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Revenue Section */}
                <div>
                    <h4 className="font-semibold text-lg mb-4 flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-green-600" />
                        Revenue
                    </h4>
                    <div className="space-y-3">
                        {Object.entries(incomeCategories).map(([category, amount]) => (
                            <div key={category} className="flex justify-between items-center py-2">
                                <span className="text-sm">{category}</span>
                                <span className="font-medium">${amount.toLocaleString()}</span>
                            </div>
                        ))}
                        <Separator />
                        <div className="flex justify-between items-center py-2 font-semibold">
                            <span>Total Revenue</span>
                            <div className="flex items-center gap-2">
                                <Badge variant={incomeChange >= 0 ? "default" : "destructive"} className="text-xs">
                                    {incomeChange >= 0 ? '+' : ''}{incomeChange.toFixed(1)}%
                                </Badge>
                                <span>${currentIncome.toLocaleString()}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <Separator />

                {/* Expenses Section */}
                <div>
                    <h4 className="font-semibold text-lg mb-4 flex items-center gap-2">
                        <TrendingDown className="h-4 w-4 text-red-600" />
                        Expenses
                    </h4>
                    <div className="space-y-3">
                        {Object.entries(expenseCategories)
                            .sort(([,a], [,b]) => b - a)
                            .map(([category, amount]) => (
                                <div key={category} className="flex justify-between items-center py-2">
                                    <span className="text-sm">{category}</span>
                                    <span className="font-medium">${amount.toLocaleString()}</span>
                                </div>
                            ))}
                        <Separator />
                        <div className="flex justify-between items-center py-2 font-semibold">
                            <span>Total Expenses</span>
                            <div className="flex items-center gap-2">
                                <Badge variant={expenseChange <= 0 ? "default" : "destructive"} className="text-xs">
                                    {expenseChange >= 0 ? '+' : ''}{expenseChange.toFixed(1)}%
                                </Badge>
                                <span>${currentExpenses.toLocaleString()}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <Separator />

                {/* Net Income Section */}
                <div className="bg-muted/50 p-4 rounded-lg">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <DollarSign className="h-5 w-5 text-blue-600" />
                            <span className="font-semibold text-lg">Net Income</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Badge
                                variant={netIncomeChange >= 0 ? "default" : "destructive"}
                                className="text-xs"
                            >
                                {netIncomeChange >= 0 ? '+' : ''}{netIncomeChange.toFixed(1)}%
                            </Badge>
                            <span className={`font-bold text-xl ${currentNetIncome >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                ${currentNetIncome.toLocaleString()}
                            </span>
                        </div>
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">
                        Previous period: ${previousNetIncome.toLocaleString()}
                    </p>
                </div>

                {/* Key Metrics */}
                <div className="grid grid-cols-2 gap-4 pt-4">
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">
                            {currentIncome > 0 ? ((currentNetIncome / currentIncome) * 100).toFixed(1) : 0}%
                        </div>
                        <div className="text-sm text-muted-foreground">Profit Margin</div>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">
                            {currentIncome > 0 ? ((currentExpenses / currentIncome) * 100).toFixed(1) : 0}%
                        </div>
                        <div className="text-sm text-muted-foreground">Expense Ratio</div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}