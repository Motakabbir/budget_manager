import { AlertTriangle, TrendingUp, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useBudgetsNeedingAttention } from '@/lib/hooks/use-budget-alerts';
import { useNavigate } from 'react-router-dom';
import { Progress } from '@/components/ui/progress';

export function BudgetAlertsWidget() {
    const budgetsNeedingAttention = useBudgetsNeedingAttention();
    const navigate = useNavigate();

    if (budgetsNeedingAttention.length === 0) {
        return (
            <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Budget Status</CardTitle>
                    <TrendingUp className="w-4 h-4 text-green-600" />
                </CardHeader>
                <CardContent>
                    <div className="flex items-center gap-3">
                        <TrendingUp className="w-8 h-8 text-green-600" />
                        <div className="flex-1">
                            <p className="text-sm font-medium text-green-600">All budgets on track!</p>
                            <p className="text-xs text-muted-foreground mt-1">
                                Great job managing your spending
                            </p>
                        </div>
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        className="w-full mt-4"
                        onClick={() => navigate('/budgets')}
                    >
                        View Budgets
                        <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                </CardContent>
            </Card>
        );
    }

    const exceeded = budgetsNeedingAttention.filter((b) => b.status === 'exceeded');
    const warning = budgetsNeedingAttention.filter((b) => b.status === 'warning');

    return (
        <Card className="border-orange-200">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Budget Alerts</CardTitle>
                <AlertTriangle className="w-4 h-4 text-orange-600" />
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Summary */}
                <div className="flex items-center gap-3">
                    <AlertTriangle className="w-8 h-8 text-orange-600" />
                    <div className="flex-1">
                        <p className="text-sm font-medium text-orange-600">
                            {budgetsNeedingAttention.length} Budget
                            {budgetsNeedingAttention.length > 1 ? 's' : ''} Need Attention
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                            {exceeded.length > 0 && `${exceeded.length} exceeded`}
                            {exceeded.length > 0 && warning.length > 0 && ', '}
                            {warning.length > 0 && `${warning.length} at warning`}
                        </p>
                    </div>
                </div>

                {/* Budget List */}
                <div className="space-y-3">
                    {budgetsNeedingAttention.slice(0, 3).map((budget) => (
                        <div key={budget.id} className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                                <div className="flex items-center gap-2">
                                    <div
                                        className="w-2 h-2 rounded-full"
                                        style={{ backgroundColor: budget.category?.color || '#6B7280' }}
                                    />
                                    <span className="font-medium">{budget.category?.name}</span>
                                </div>
                                <span
                                    className={`text-xs font-semibold ${
                                        budget.status === 'exceeded'
                                            ? 'text-red-600'
                                            : 'text-yellow-600'
                                    }`}
                                >
                                    {budget.percentage.toFixed(0)}%
                                </span>
                            </div>
                            <Progress
                                value={Math.min(budget.percentage, 100)}
                                className={`h-1.5 ${
                                    budget.status === 'exceeded' ? 'bg-red-100' : 'bg-yellow-100'
                                }`}
                            />
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                                <span>${budget.spent.toLocaleString()} spent</span>
                                <span>${budget.amount.toLocaleString()} budget</span>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Show more button */}
                {budgetsNeedingAttention.length > 3 && (
                    <p className="text-xs text-muted-foreground text-center">
                        + {budgetsNeedingAttention.length - 3} more
                    </p>
                )}

                {/* Action Button */}
                <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => navigate('/budgets')}
                >
                    View All Budgets
                    <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
            </CardContent>
        </Card>
    );
}
