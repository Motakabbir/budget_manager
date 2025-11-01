import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTransactions, useCategories, useUserSettings } from '@/lib/hooks/use-budget-queries';
import { BudgetAllocationService } from '@/lib/services/budget-allocation.service';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, TrendingDown, AlertCircle, CheckCircle, Target } from 'lucide-react';
import { startOfMonth, endOfMonth } from 'date-fns';
import { Link } from 'react-router-dom';

export function BudgetHealthWidget() {
    const { data: transactions = [] } = useTransactions();
    const { data: categories = [] } = useCategories();
    const { data: userSettings } = useUserSettings();

    // Calculate monthly income from user settings or transactions
    const monthlyIncome = 5000; // Default, should be from settings

    const startDate = startOfMonth(new Date());
    const endDate = endOfMonth(new Date());

    const budgetSummary = BudgetAllocationService.generateBudgetSummary(
        transactions,
        categories,
        monthlyIncome,
        startDate,
        endDate
    );

    return (
        <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Budget Health (50/30/20)</CardTitle>
                {budgetSummary.isBalanced ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                    <AlertCircle className="h-4 w-4 text-amber-600" />
                )}
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    {/* Needs */}
                    <div>
                        <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-muted-foreground">Needs (50%)</span>
                            <span className={`text-xs font-medium ${budgetSummary.needsUtilization > 110 ? 'text-red-600' : 'text-green-600'}`}>
                                {budgetSummary.needsUtilization.toFixed(0)}%
                            </span>
                        </div>
                        <Progress
                            value={Math.min(budgetSummary.needsUtilization, 100)}
                            className="h-1.5"
                        />
                    </div>

                    {/* Wants */}
                    <div>
                        <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-muted-foreground">Wants (30%)</span>
                            <span className={`text-xs font-medium ${budgetSummary.wantsUtilization > 120 ? 'text-red-600' : 'text-blue-600'}`}>
                                {budgetSummary.wantsUtilization.toFixed(0)}%
                            </span>
                        </div>
                        <Progress
                            value={Math.min(budgetSummary.wantsUtilization, 100)}
                            className="h-1.5"
                        />
                    </div>

                    {/* Savings */}
                    <div>
                        <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-muted-foreground">Savings (20%)</span>
                            <span className={`text-xs font-medium ${budgetSummary.savingsUtilization < 50 ? 'text-amber-600' : 'text-green-600'}`}>
                                {budgetSummary.savingsUtilization.toFixed(0)}%
                            </span>
                        </div>
                        <Progress
                            value={Math.min(budgetSummary.savingsUtilization, 100)}
                            className="h-1.5"
                        />
                    </div>
                </div>

                <Link
                    to="/budgets-advanced"
                    className="mt-4 block text-xs text-blue-600 hover:text-blue-700 font-medium"
                >
                    View detailed budget analysis →
                </Link>
            </CardContent>
        </Card>
    );
}
