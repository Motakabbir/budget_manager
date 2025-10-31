import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { BarChart3, TrendingUp, AlertTriangle, CheckCircle, Target } from 'lucide-react';
import { useTransactions, useBudgets } from '@/lib/hooks/use-budget-queries';
import { format, startOfMonth, endOfMonth } from 'date-fns';

interface BudgetVarianceChartsProps {
    dateRange?: {
        start: Date;
        end: Date;
    };
}

export function BudgetVarianceCharts({ dateRange }: BudgetVarianceChartsProps) {
    const currentMonth = {
        start: startOfMonth(new Date()),
        end: endOfMonth(new Date())
    };

    const { data: transactions = [] } = useTransactions(
        (dateRange?.start || currentMonth.start).toISOString(),
        (dateRange?.end || currentMonth.end).toISOString()
    );

    const { data: budgets = [] } = useBudgets();

    // Group actual expenses by category
    const actualExpenses = transactions
        .filter(t => t.type === 'expense')
        .reduce((acc, transaction) => {
            const categoryName = transaction.category?.name || 'Uncategorized';
            acc[categoryName] = (acc[categoryName] || 0) + transaction.amount;
            return acc;
        }, {} as Record<string, number>);

    // Create budget vs actual comparison
    const budgetComparison = budgets.map(budget => {
        const categoryName = budget.category?.name || 'Uncategorized';
        const budgetedAmount = budget.amount;
        const actualAmount = actualExpenses[categoryName] || 0;
        const variance = actualAmount - budgetedAmount;
        const variancePercent = budgetedAmount > 0 ? (variance / budgetedAmount) * 100 : 0;
        const remaining = budgetedAmount - actualAmount;

        return {
            category: categoryName,
            budgeted: budgetedAmount,
            actual: actualAmount,
            variance,
            variancePercent,
            remaining,
            status: variance > 0 ? 'over' : variance < 0 ? 'under' : 'on-track'
        };
    });

    // Add categories with actual spending but no budget
    Object.entries(actualExpenses).forEach(([categoryName, actualAmount]) => {
        const hasBudget = budgetComparison.some(comp => comp.category === categoryName);
        if (!hasBudget) {
            budgetComparison.push({
                category: categoryName,
                budgeted: 0,
                actual: actualAmount,
                variance: actualAmount,
                variancePercent: 0,
                remaining: -actualAmount,
                status: 'no-budget'
            });
        }
    });

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
        }).format(amount);
    };

    // Calculate summary statistics
    const totalBudgeted = budgetComparison.reduce((sum, comp) => sum + comp.budgeted, 0);
    const totalActual = budgetComparison.reduce((sum, comp) => sum + comp.actual, 0);
    const totalVariance = totalActual - totalBudgeted;
    const totalVariancePercent = totalBudgeted > 0 ? (totalVariance / totalBudgeted) * 100 : 0;

    // Categorize variances
    const overBudget = budgetComparison.filter(comp => comp.status === 'over');
    const underBudget = budgetComparison.filter(comp => comp.status === 'under');
    const onTrack = budgetComparison.filter(comp => comp.status === 'on-track');
    const noBudget = budgetComparison.filter(comp => comp.status === 'no-budget');

    // Sort by variance percentage (most over budget first)
    const sortedComparison = [...budgetComparison].sort((a, b) => b.variancePercent - a.variancePercent);

    return (
        <div className="space-y-6">
            {/* Budget vs Actual Overview */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Target className="h-5 w-5" />
                        Budget vs Actual Overview ({format(currentMonth.start, 'MMMM yyyy')})
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="text-center">
                            <p className="text-sm text-muted-foreground">Total Budgeted</p>
                            <p className="text-2xl font-bold text-blue-600">{formatCurrency(totalBudgeted)}</p>
                        </div>
                        <div className="text-center">
                            <p className="text-sm text-muted-foreground">Total Spent</p>
                            <p className="text-2xl font-bold text-red-600">{formatCurrency(totalActual)}</p>
                        </div>
                        <div className="text-center">
                            <p className="text-sm text-muted-foreground">Net Variance</p>
                            <p className={`text-2xl font-bold ${totalVariance >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                                {formatCurrency(Math.abs(totalVariance))}
                            </p>
                            <p className="text-xs text-muted-foreground">
                                {totalVariance >= 0 ? 'Over Budget' : 'Under Budget'}
                            </p>
                        </div>
                        <div className="text-center">
                            <p className="text-sm text-muted-foreground">Variance %</p>
                            <p className={`text-2xl font-bold ${totalVariancePercent >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                                {totalVariancePercent >= 0 ? '+' : ''}{totalVariancePercent.toFixed(1)}%
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Budget Status Summary */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="h-5 w-5" />
                        Budget Performance Summary
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center p-3 bg-red-50 rounded-lg">
                            <div className="flex items-center justify-center gap-2 mb-1">
                                <AlertTriangle className="h-4 w-4 text-red-600" />
                                <span className="text-sm font-medium text-red-800">Over Budget</span>
                            </div>
                            <p className="text-xl font-bold text-red-600">{overBudget.length}</p>
                            <p className="text-xs text-red-600">categories</p>
                        </div>

                        <div className="text-center p-3 bg-green-50 rounded-lg">
                            <div className="flex items-center justify-center gap-2 mb-1">
                                <CheckCircle className="h-4 w-4 text-green-600" />
                                <span className="text-sm font-medium text-green-800">Under Budget</span>
                            </div>
                            <p className="text-xl font-bold text-green-600">{underBudget.length}</p>
                            <p className="text-xs text-green-600">categories</p>
                        </div>

                        <div className="text-center p-3 bg-blue-50 rounded-lg">
                            <div className="flex items-center justify-center gap-2 mb-1">
                                <Target className="h-4 w-4 text-blue-600" />
                                <span className="text-sm font-medium text-blue-800">On Track</span>
                            </div>
                            <p className="text-xl font-bold text-blue-600">{onTrack.length}</p>
                            <p className="text-xs text-blue-600">categories</p>
                        </div>

                        <div className="text-center p-3 bg-yellow-50 rounded-lg">
                            <div className="flex items-center justify-center gap-2 mb-1">
                                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                                <span className="text-sm font-medium text-yellow-800">No Budget</span>
                            </div>
                            <p className="text-xl font-bold text-yellow-600">{noBudget.length}</p>
                            <p className="text-xs text-yellow-600">categories</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Category-by-Category Budget Variance */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5" />
                        Category Budget Variance
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {sortedComparison.map((comp) => {
                            const progressValue = comp.budgeted > 0 ? (comp.actual / comp.budgeted) * 100 : 100;
                            const isOverBudget = comp.actual > comp.budgeted;

                            return (
                                <div key={comp.category} className="space-y-2">
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center gap-3">
                                            <span className="font-medium">{comp.category}</span>
                                            <Badge
                                                variant={
                                                    comp.status === 'over' ? 'destructive' :
                                                        comp.status === 'under' ? 'default' :
                                                            comp.status === 'no-budget' ? 'secondary' : 'outline'
                                                }
                                                className="text-xs"
                                            >
                                                {comp.status === 'over' ? 'Over Budget' :
                                                    comp.status === 'under' ? 'Under Budget' :
                                                        comp.status === 'no-budget' ? 'No Budget Set' : 'On Track'}
                                            </Badge>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm">
                                            <span className="text-muted-foreground">
                                                {formatCurrency(comp.actual)} / {formatCurrency(comp.budgeted)}
                                            </span>
                                            {comp.variance !== 0 && (
                                                <Badge
                                                    variant={comp.variance > 0 ? "destructive" : "default"}
                                                    className="text-xs"
                                                >
                                                    {comp.variance > 0 ? '+' : ''}{formatCurrency(comp.variance)}
                                                    ({comp.variancePercent > 0 ? '+' : ''}{comp.variancePercent.toFixed(1)}%)
                                                </Badge>
                                            )}
                                        </div>
                                    </div>

                                    <div className="relative">
                                        <Progress
                                            value={Math.min(progressValue, 100)}
                                            className={`h-3 ${isOverBudget ? 'bg-red-100' : 'bg-green-100'}`}
                                        />
                                        {isOverBudget && (
                                            <div
                                                className="absolute top-0 left-0 h-3 bg-red-500 rounded-r"
                                                style={{ width: `${Math.min(progressValue - 100, 100)}%` }}
                                            />
                                        )}
                                        <div className="absolute top-0 left-0 w-full h-3 border-r-2 border-gray-400" />
                                    </div>

                                    <div className="flex justify-between text-xs text-muted-foreground">
                                        <span>0</span>
                                        <span className="font-medium">
                                            Budget: {formatCurrency(comp.budgeted)}
                                        </span>
                                        <span>
                                            {comp.remaining >= 0 ?
                                                `${formatCurrency(comp.remaining)} remaining` :
                                                `${formatCurrency(Math.abs(comp.remaining))} over`
                                            }
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>

            {/* Budget Recommendations */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5" />
                        Budget Recommendations
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 bg-red-50 rounded-lg">
                            <h4 className="font-medium text-red-800 mb-2 flex items-center gap-2">
                                <AlertTriangle className="h-4 w-4" />
                                Immediate Attention Needed
                            </h4>
                            <div className="space-y-2">
                                {overBudget.slice(0, 3).map((comp) => (
                                    <div key={comp.category} className="text-sm text-red-700">
                                        <strong>{comp.category}</strong>: {formatCurrency(comp.variance)} over budget
                                        ({comp.variancePercent.toFixed(1)}%)
                                    </div>
                                ))}
                                {overBudget.length === 0 && (
                                    <p className="text-sm text-red-600">No categories significantly over budget</p>
                                )}
                            </div>
                        </div>

                        <div className="p-4 bg-yellow-50 rounded-lg">
                            <h4 className="font-medium text-yellow-800 mb-2 flex items-center gap-2">
                                <AlertTriangle className="h-4 w-4" />
                                Budget Setup Needed
                            </h4>
                            <div className="space-y-2">
                                {noBudget.slice(0, 3).map((comp) => (
                                    <div key={comp.category} className="text-sm text-yellow-700">
                                        <strong>{comp.category}</strong>: {formatCurrency(comp.actual)} spent without budget
                                    </div>
                                ))}
                                {noBudget.length === 0 && (
                                    <p className="text-sm text-yellow-600">All spending categories have budgets set</p>
                                )}
                            </div>
                        </div>

                        <div className="p-4 bg-green-50 rounded-lg">
                            <h4 className="font-medium text-green-800 mb-2 flex items-center gap-2">
                                <CheckCircle className="h-4 w-4" />
                                Well Managed Categories
                            </h4>
                            <div className="space-y-2">
                                {underBudget.slice(0, 3).map((comp) => (
                                    <div key={comp.category} className="text-sm text-green-700">
                                        <strong>{comp.category}</strong>: {formatCurrency(Math.abs(comp.variance))} under budget
                                    </div>
                                ))}
                                {underBudget.length === 0 && (
                                    <p className="text-sm text-green-600">No categories significantly under budget</p>
                                )}
                            </div>
                        </div>

                        <div className="p-4 bg-blue-50 rounded-lg">
                            <h4 className="font-medium text-blue-800 mb-2 flex items-center gap-2">
                                <Target className="h-4 w-4" />
                                Overall Assessment
                            </h4>
                            <p className="text-sm text-blue-700">
                                {totalVariance >= 0 ?
                                    `You're ${formatCurrency(totalVariance)} over your total budget this month. Consider reviewing your spending priorities.` :
                                    `You're ${formatCurrency(Math.abs(totalVariance))} under your total budget. Great job staying within your limits!`
                                }
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}