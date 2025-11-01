import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Receipt, FileText, Calculator, TrendingUp, TrendingDown, DollarSign, BarChart3 } from 'lucide-react';
import { useTransactions } from '@/lib/hooks/use-budget-queries';
import { format, startOfYear, endOfYear } from 'date-fns';

interface TaxReportsProps {
    dateRange?: {
        start: Date;
        end: Date;
    };
}

export function TaxReports({ dateRange }: TaxReportsProps) {
    const currentYear = {
        start: startOfYear(new Date()),
        end: endOfYear(new Date())
    };

    const { data: transactions = [] } = useTransactions(
        (dateRange?.start || currentYear.start).toISOString(),
        (dateRange?.end || currentYear.end).toISOString()
    );

    // Calculate overview metrics (same as ReportsPage)
    const currentIncome = transactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);

    const currentExpenses = transactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

    const netProfit = currentIncome - currentExpenses;
    const savingsRate = currentIncome > 0 ? ((currentIncome - currentExpenses) / currentIncome) * 100 : 0;

    // Get previous period data for comparison
    const previousYear = {
        start: startOfYear(new Date(new Date().getFullYear() - 1, 0, 1)),
        end: endOfYear(new Date(new Date().getFullYear() - 1, 0, 1))
    };

    const { data: previousTransactions = [] } = useTransactions(
        previousYear.start.toISOString(),
        previousYear.end.toISOString()
    );

    const previousIncome = previousTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);

    const previousExpenses = previousTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

    const previousNetProfit = previousIncome - previousExpenses;

    // Calculate percentage changes
    const incomeChange = previousIncome > 0 ? ((currentIncome - previousIncome) / previousIncome) * 100 : 0;
    const expenseChange = previousExpenses > 0 ? ((currentExpenses - previousExpenses) / previousExpenses) * 100 : 0;
    const profitChange = previousNetProfit !== 0 ? ((netProfit - previousNetProfit) / Math.abs(previousNetProfit)) * 100 : 0;

    // Group transactions by category and type
    const categorySummary = transactions.reduce((acc, transaction) => {
        const categoryName = transaction.category?.name || 'Uncategorized';
        const type = transaction.type;

        if (!acc[categoryName]) {
            acc[categoryName] = { income: 0, expense: 0, count: 0 };
        }

        acc[categoryName][type] += transaction.amount;
        acc[categoryName].count += 1;

        return acc;
    }, {} as Record<string, { income: number; expense: number; count: number }>);

    // Calculate tax-relevant totals
    const totalIncome = Object.values(categorySummary).reduce((sum, cat) => sum + cat.income, 0);
    const totalDeductions = Object.values(categorySummary).reduce((sum, cat) => {
        // Common tax deductions: home office, medical, charitable donations, etc.
        const deductibleCategories = ['medical', 'charity', 'home office', 'education', 'business'];
        return deductibleCategories.some(cat => cat.toLowerCase().includes(cat.toLowerCase())) ? sum + cat.expense : sum;
    }, 0);

    const totalTaxableIncome = totalIncome - totalDeductions;
    const estimatedTaxLiability = totalTaxableIncome * 0.22; // Simplified 22% effective rate

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
        }).format(amount);
    };

    // Tax categories for reporting
    const taxCategories = [
        { name: 'Business Income', categories: ['business', 'freelance', 'consulting'], type: 'income' },
        { name: 'Investment Income', categories: ['investments', 'dividends', 'interest'], type: 'income' },
        { name: 'Employee Income', categories: ['salary', 'wages', 'bonus'], type: 'income' },
        { name: 'Business Expenses', categories: ['business', 'supplies', 'travel', 'home office'], type: 'expense' },
        { name: 'Medical Expenses', categories: ['medical', 'health', 'insurance'], type: 'expense' },
        { name: 'Charitable Donations', categories: ['charity', 'donations'], type: 'expense' },
        { name: 'Education Expenses', categories: ['education', 'tuition', 'books'], type: 'expense' },
    ];

    const getTaxCategoryTotal = (taxCategory: typeof taxCategories[0]) => {
        return Object.entries(categorySummary).reduce((sum, [categoryName, data]) => {
            const matches = taxCategory.categories.some(tc =>
                categoryName.toLowerCase().includes(tc.toLowerCase())
            );
            return matches ? sum + data[taxCategory.type as keyof typeof data] : sum;
        }, 0);
    };

    return (
        <div className="space-y-6">
            {/* Overview Cards - Same as ReportsPage */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Income</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(currentIncome)}</div>
                        <p className="text-xs text-muted-foreground">
                            {incomeChange >= 0 ? '+' : ''}{incomeChange.toFixed(1)}% from last year
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(currentExpenses)}</div>
                        <p className="text-xs text-muted-foreground">
                            {expenseChange >= 0 ? '+' : ''}{expenseChange.toFixed(1)}% from last year
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className={`text-2xl font-bold ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatCurrency(netProfit)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {profitChange >= 0 ? '+' : ''}{profitChange.toFixed(1)}% from last year
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Savings Rate</CardTitle>
                        <BarChart3 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{savingsRate.toFixed(1)}%</div>
                        <p className="text-xs text-muted-foreground">
                            Target: 20%
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Tax Summary */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Calculator className="h-5 w-5" />
                        Tax Summary ({format(currentYear.start, 'yyyy')})
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="text-center">
                            <p className="text-sm text-muted-foreground">Total Income</p>
                            <p className="text-xl font-bold text-green-600">{formatCurrency(totalIncome)}</p>
                        </div>
                        <div className="text-center">
                            <p className="text-sm text-muted-foreground">Deductions</p>
                            <p className="text-xl font-bold text-blue-600">{formatCurrency(totalDeductions)}</p>
                        </div>
                        <div className="text-center">
                            <p className="text-sm text-muted-foreground">Taxable Income</p>
                            <p className="text-xl font-bold text-orange-600">{formatCurrency(totalTaxableIncome)}</p>
                        </div>
                        <div className="text-center">
                            <p className="text-sm text-muted-foreground">Est. Tax Liability</p>
                            <p className="text-xl font-bold text-red-600">{formatCurrency(estimatedTaxLiability)}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Tax Categories Breakdown */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Tax Categories Breakdown
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {taxCategories.map((taxCategory) => {
                            const amount = getTaxCategoryTotal(taxCategory);
                            if (amount === 0) return null;

                            return (
                                <div key={taxCategory.name} className="flex items-center justify-between p-3 border rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <Badge variant={taxCategory.type === 'income' ? 'default' : 'secondary'}>
                                            {taxCategory.type === 'income' ? 'Income' : 'Expense'}
                                        </Badge>
                                        <span className="font-medium">{taxCategory.name}</span>
                                    </div>
                                    <div className="text-right">
                                        <span className={`font-semibold ${taxCategory.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                                            {taxCategory.type === 'income' ? '+' : '-'}{formatCurrency(amount)}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>

            {/* All Categories Detail */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Receipt className="h-5 w-5" />
                        All Categories Detail
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {Object.entries(categorySummary)
                            .sort(([, a], [, b]) => (b.income + b.expense) - (a.income + a.expense))
                            .map(([categoryName, data]) => (
                                <div key={categoryName} className="flex items-center justify-between p-3 border rounded-lg">
                                    <div className="flex-1">
                                        <div className="font-medium">{categoryName}</div>
                                        <div className="text-sm text-muted-foreground">{data.count} transactions</div>
                                    </div>
                                    <div className="flex gap-4 text-sm">
                                        {data.income > 0 && (
                                            <div className="text-green-600">
                                                <TrendingUp className="h-4 w-4 inline mr-1" />
                                                Income: {formatCurrency(data.income)}
                                            </div>
                                        )}
                                        {data.expense > 0 && (
                                            <div className="text-red-600">
                                                <TrendingDown className="h-4 w-4 inline mr-1" />
                                                Expense: {formatCurrency(data.expense)}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                    </div>
                </CardContent>
            </Card>

            {/* Tax Preparation Notes */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Tax Preparation Notes
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3 text-sm">
                        <div className="p-3 bg-blue-50 rounded-lg">
                            <p className="font-medium text-blue-800">Important Reminders:</p>
                            <ul className="mt-2 text-blue-700 space-y-1">
                                <li>• Keep all receipts and documentation for deductible expenses</li>
                                <li>• Business expenses require proper business purpose documentation</li>
                                <li>• Medical expenses must exceed 7.5% of AGI to be deductible</li>
                                <li>• Charitable donations require written acknowledgment for amounts over $250</li>
                            </ul>
                        </div>
                        <div className="p-3 bg-yellow-50 rounded-lg">
                            <p className="font-medium text-yellow-800">Estimated Tax Calculation:</p>
                            <p className="text-yellow-700 mt-1">
                                This is a simplified estimate using a flat 22% effective tax rate.
                                Consult a tax professional for accurate calculations based on your specific situation.
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}