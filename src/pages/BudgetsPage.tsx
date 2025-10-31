import { useState, useMemo } from 'react';
import { PageHeader } from '@/components/page-header';
import { BudgetCard, AddBudgetDialog, EditBudgetDialog } from '@/components/budgets';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useBudgetsWithSpending, useDeleteBudget } from '@/lib/hooks/use-budget-queries';
import type { BudgetWithSpending } from '@/lib/hooks/use-budget-queries';
import { 
    TrendingUp, 
    TrendingDown, 
    DollarSign, 
    AlertTriangle,
    Calendar,
    PieChart
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function BudgetsPage() {
    const [selectedBudget, setSelectedBudget] = useState<BudgetWithSpending | null>(null);
    const [editDialogOpen, setEditDialogOpen] = useState(false);

    const { data: budgetsWithSpending, isLoading } = useBudgetsWithSpending();
    const { mutate: deleteBudget } = useDeleteBudget();

    // Calculate statistics
    const stats = useMemo(() => {
        if (!budgetsWithSpending) {
            return {
                totalBudget: 0,
                totalSpent: 0,
                totalRemaining: 0,
                budgetsExceeded: 0,
                budgetsWarning: 0,
                budgetsSafe: 0,
            };
        }

        const monthly = budgetsWithSpending.filter((b) => b.period === 'monthly');

        return {
            totalBudget: monthly.reduce((sum, b) => sum + b.amount, 0),
            totalSpent: monthly.reduce((sum, b) => sum + b.spent, 0),
            totalRemaining: monthly.reduce((sum, b) => sum + b.remaining, 0),
            budgetsExceeded: budgetsWithSpending.filter((b) => b.status === 'exceeded').length,
            budgetsWarning: budgetsWithSpending.filter((b) => b.status === 'warning').length,
            budgetsSafe: budgetsWithSpending.filter((b) => b.status === 'safe').length,
        };
    }, [budgetsWithSpending]);

    // Filter budgets by period and status
    const monthlyBudgets = useMemo(
        () => budgetsWithSpending?.filter((b) => b.period === 'monthly') || [],
        [budgetsWithSpending]
    );

    const yearlyBudgets = useMemo(
        () => budgetsWithSpending?.filter((b) => b.period === 'yearly') || [],
        [budgetsWithSpending]
    );

    const exceededBudgets = useMemo(
        () => budgetsWithSpending?.filter((b) => b.status === 'exceeded') || [],
        [budgetsWithSpending]
    );

    const warningBudgets = useMemo(
        () => budgetsWithSpending?.filter((b) => b.status === 'warning') || [],
        [budgetsWithSpending]
    );

    const handleEditBudget = (budget: BudgetWithSpending) => {
        setSelectedBudget(budget);
        setEditDialogOpen(true);
    };

    const handleDeleteBudget = (id: string) => {
        deleteBudget(id);
    };

    if (isLoading) {
        return (
            <div className="space-y-6">
                <PageHeader
                    title="Budgets"
                    description="Track your spending limits and budget progress"
                />
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                    {[1, 2, 3, 4].map((i) => (
                        <Card key={i}>
                            <CardHeader>
                                <Skeleton className="h-4 w-24" />
                            </CardHeader>
                            <CardContent>
                                <Skeleton className="h-8 w-32" />
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <PageHeader
                title="Budgets"
                description="Track your spending limits and budget progress"
                actions={<AddBudgetDialog />}
            />

            {/* Statistics Cards */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                {/* Total Monthly Budget */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Monthly Budget</CardTitle>
                        <DollarSign className="w-4 h-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">${stats.totalBudget.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Total budget for current month
                        </p>
                    </CardContent>
                </Card>

                {/* Total Spent */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
                        <TrendingDown className="w-4 h-4 text-red-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">
                            ${stats.totalSpent.toLocaleString()}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {stats.totalBudget > 0
                                ? `${((stats.totalSpent / stats.totalBudget) * 100).toFixed(1)}% of budget`
                                : 'No budget set'}
                        </p>
                    </CardContent>
                </Card>

                {/* Total Remaining */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Remaining</CardTitle>
                        <TrendingUp className="w-4 h-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">
                            ${stats.totalRemaining.toLocaleString()}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Available to spend this month
                        </p>
                    </CardContent>
                </Card>

                {/* Budget Status */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Status Overview</CardTitle>
                        <PieChart className="w-4 h-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-red-600">Exceeded</span>
                                <span className="font-semibold">{stats.budgetsExceeded}</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-yellow-600">Warning</span>
                                <span className="font-semibold">{stats.budgetsWarning}</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-green-600">Safe</span>
                                <span className="font-semibold">{stats.budgetsSafe}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Alert Banner for Exceeded Budgets */}
            {exceededBudgets.length > 0 && (
                <Card className="border-red-200 bg-red-50">
                    <CardContent className="flex items-start gap-3 pt-6">
                        <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
                        <div className="flex-1">
                            <h3 className="font-semibold text-red-600">
                                {exceededBudgets.length} Budget{exceededBudgets.length > 1 ? 's' : ''} Exceeded!
                            </h3>
                            <p className="text-sm text-red-700 mt-1">
                                You've exceeded your spending limits in:{' '}
                                {exceededBudgets.map((b) => b.category?.name).join(', ')}
                            </p>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Warning Banner for At-Risk Budgets */}
            {warningBudgets.length > 0 && exceededBudgets.length === 0 && (
                <Card className="border-yellow-200 bg-yellow-50">
                    <CardContent className="flex items-start gap-3 pt-6">
                        <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                        <div className="flex-1">
                            <h3 className="font-semibold text-yellow-600">
                                {warningBudgets.length} Budget{warningBudgets.length > 1 ? 's' : ''} Need Attention
                            </h3>
                            <p className="text-sm text-yellow-700 mt-1">
                                You're approaching your limits in:{' '}
                                {warningBudgets.map((b) => b.category?.name).join(', ')}
                            </p>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Budgets Tabs */}
            <Tabs defaultValue="monthly" className="space-y-6">
                <TabsList>
                    <TabsTrigger value="monthly">
                        <Calendar className="w-4 h-4 mr-2" />
                        Monthly ({monthlyBudgets.length})
                    </TabsTrigger>
                    <TabsTrigger value="yearly">
                        <Calendar className="w-4 h-4 mr-2" />
                        Yearly ({yearlyBudgets.length})
                    </TabsTrigger>
                    <TabsTrigger value="exceeded">
                        <AlertTriangle className="w-4 h-4 mr-2" />
                        Exceeded ({exceededBudgets.length})
                    </TabsTrigger>
                    <TabsTrigger value="warning">
                        <AlertTriangle className="w-4 h-4 mr-2" />
                        Warning ({warningBudgets.length})
                    </TabsTrigger>
                </TabsList>

                {/* Monthly Budgets Tab */}
                <TabsContent value="monthly" className="space-y-6">
                    {monthlyBudgets.length === 0 ? (
                        <Card>
                            <CardContent className="flex flex-col items-center justify-center py-12">
                                <Calendar className="w-12 h-12 text-muted-foreground mb-4" />
                                <h3 className="text-lg font-semibold mb-2">No Monthly Budgets</h3>
                                <p className="text-sm text-muted-foreground text-center mb-4">
                                    Create your first monthly budget to start tracking your spending.
                                </p>
                                <AddBudgetDialog />
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {monthlyBudgets.map((budget) => (
                                <BudgetCard
                                    key={budget.id}
                                    budget={budget}
                                    onEdit={handleEditBudget}
                                    onDelete={handleDeleteBudget}
                                />
                            ))}
                        </div>
                    )}
                </TabsContent>

                {/* Yearly Budgets Tab */}
                <TabsContent value="yearly" className="space-y-6">
                    {yearlyBudgets.length === 0 ? (
                        <Card>
                            <CardContent className="flex flex-col items-center justify-center py-12">
                                <Calendar className="w-12 h-12 text-muted-foreground mb-4" />
                                <h3 className="text-lg font-semibold mb-2">No Yearly Budgets</h3>
                                <p className="text-sm text-muted-foreground text-center mb-4">
                                    Create yearly budgets for long-term expense categories.
                                </p>
                                <AddBudgetDialog />
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {yearlyBudgets.map((budget) => (
                                <BudgetCard
                                    key={budget.id}
                                    budget={budget}
                                    onEdit={handleEditBudget}
                                    onDelete={handleDeleteBudget}
                                />
                            ))}
                        </div>
                    )}
                </TabsContent>

                {/* Exceeded Budgets Tab */}
                <TabsContent value="exceeded" className="space-y-6">
                    {exceededBudgets.length === 0 ? (
                        <Card>
                            <CardContent className="flex flex-col items-center justify-center py-12">
                                <TrendingUp className="w-12 h-12 text-green-600 mb-4" />
                                <h3 className="text-lg font-semibold mb-2">Great Job!</h3>
                                <p className="text-sm text-muted-foreground text-center">
                                    You haven't exceeded any budgets. Keep up the good work!
                                </p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {exceededBudgets.map((budget) => (
                                <BudgetCard
                                    key={budget.id}
                                    budget={budget}
                                    onEdit={handleEditBudget}
                                    onDelete={handleDeleteBudget}
                                />
                            ))}
                        </div>
                    )}
                </TabsContent>

                {/* Warning Budgets Tab */}
                <TabsContent value="warning" className="space-y-6">
                    {warningBudgets.length === 0 ? (
                        <Card>
                            <CardContent className="flex flex-col items-center justify-center py-12">
                                <TrendingUp className="w-12 h-12 text-green-600 mb-4" />
                                <h3 className="text-lg font-semibold mb-2">All Clear!</h3>
                                <p className="text-sm text-muted-foreground text-center">
                                    No budgets are in the warning zone. Your spending is well-managed.
                                </p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {warningBudgets.map((budget) => (
                                <BudgetCard
                                    key={budget.id}
                                    budget={budget}
                                    onEdit={handleEditBudget}
                                    onDelete={handleDeleteBudget}
                                />
                            ))}
                        </div>
                    )}
                </TabsContent>
            </Tabs>

            {/* Edit Dialog */}
            <EditBudgetDialog
                budget={selectedBudget}
                open={editDialogOpen}
                onOpenChange={setEditDialogOpen}
            />
        </div>
    );
}
