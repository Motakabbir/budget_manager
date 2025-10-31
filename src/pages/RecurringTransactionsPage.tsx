import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { 
    RefreshCw, 
    DollarSign, 
    TrendingUp, 
    TrendingDown, 
    Calendar,
    AlertCircle,
    Play,
    Pause,
    CheckCircle2
} from 'lucide-react';
import {
    useRecurringTransactions,
    useDeleteRecurring,
    useToggleRecurring,
    useCreateFromRecurring,
    RecurringTransaction
} from '@/lib/hooks/use-budget-queries';
import { RecurringCard, AddRecurringDialog, EditRecurringDialog, ProcessDueRecurringButton } from '@/components/recurring';
import { PageHeader } from '@/components/page-header';
import { format, differenceInDays } from 'date-fns';

export default function RecurringTransactionsPage() {
    const { data: recurringTransactions = [], isLoading } = useRecurringTransactions();
    const deleteRecurring = useDeleteRecurring();
    const toggleRecurring = useToggleRecurring();
    const executeRecurring = useCreateFromRecurring();

    const [editingRecurring, setEditingRecurring] = useState<RecurringTransaction | null>(null);
    const [editDialogOpen, setEditDialogOpen] = useState(false);

    // Filter recurring transactions
    const activeRecurring = recurringTransactions.filter(r => r.is_active);
    const inactiveRecurring = recurringTransactions.filter(r => !r.is_active);
    const incomeRecurring = activeRecurring.filter(r => r.type === 'income');
    const expenseRecurring = activeRecurring.filter(r => r.type === 'expense');

    // Calculate statistics
    const totalMonthlyIncome = incomeRecurring.reduce((sum, r) => {
        const multiplier = getMonthlyMultiplier(r.frequency);
        return sum + (r.amount * multiplier);
    }, 0);

    const totalMonthlyExpense = expenseRecurring.reduce((sum, r) => {
        const multiplier = getMonthlyMultiplier(r.frequency);
        return sum + (r.amount * multiplier);
    }, 0);

    const netMonthly = totalMonthlyIncome - totalMonthlyExpense;

    // Get upcoming transactions (next 7 days)
    const upcomingTransactions = activeRecurring.filter(r => {
        const daysUntil = differenceInDays(new Date(r.next_occurrence), new Date());
        return daysUntil >= 0 && daysUntil <= 7;
    }).sort((a, b) => 
        new Date(a.next_occurrence).getTime() - new Date(b.next_occurrence).getTime()
    );

    // Helper function to convert frequency to monthly multiplier
    function getMonthlyMultiplier(frequency: string): number {
        const map: Record<string, number> = {
            'daily': 30,
            'weekly': 4.33,
            'bi-weekly': 2.17,
            'monthly': 1,
            'quarterly': 0.33,
            'yearly': 0.08
        };
        return map[frequency] || 1;
    }

    const handleEdit = (recurring: RecurringTransaction) => {
        setEditingRecurring(recurring);
        setEditDialogOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (confirm('Are you sure you want to delete this recurring transaction? This cannot be undone.')) {
            await deleteRecurring.mutateAsync(id);
        }
    };

    const handleToggle = async (id: string, isActive: boolean) => {
        await toggleRecurring.mutateAsync({ id, isActive });
    };

    const handleExecute = async (id: string) => {
        if (confirm('Create a transaction from this recurring template now?')) {
            await executeRecurring.mutateAsync(id);
        }
    };

    if (isLoading) {
        return (
            <div className="space-y-6">
                <PageHeader
                    title="Recurring Transactions"
                    description="Manage automatic recurring income and expenses"
                />
                <div className="grid gap-4 md:grid-cols-4">
                    {[1, 2, 3, 4].map((i) => (
                        <Card key={i}>
                            <CardHeader className="pb-3">
                                <Skeleton className="h-4 w-24" />
                            </CardHeader>
                            <CardContent>
                                <Skeleton className="h-8 w-32" />
                            </CardContent>
                        </Card>
                    ))}
                </div>
                <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-48 w-full" />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <PageHeader
                title="Recurring Transactions"
                description="Automate your regular income and expenses"
                actions={
                    <div className="flex gap-2">
                        <ProcessDueRecurringButton />
                        <AddRecurringDialog />
                    </div>
                }
            />

            {/* Statistics Cards */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Monthly Income</CardTitle>
                        <TrendingUp className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">
                            ${totalMonthlyIncome.toFixed(2)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {incomeRecurring.length} active template{incomeRecurring.length !== 1 ? 's' : ''}
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Monthly Expenses</CardTitle>
                        <TrendingDown className="h-4 w-4 text-red-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">
                            ${totalMonthlyExpense.toFixed(2)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {expenseRecurring.length} active template{expenseRecurring.length !== 1 ? 's' : ''}
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Net Monthly</CardTitle>
                        <DollarSign className={`h-4 w-4 ${netMonthly >= 0 ? 'text-green-600' : 'text-red-600'}`} />
                    </CardHeader>
                    <CardContent>
                        <div className={`text-2xl font-bold ${netMonthly >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            ${Math.abs(netMonthly).toFixed(2)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {netMonthly >= 0 ? 'Surplus' : 'Deficit'}
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Upcoming (7 Days)</CardTitle>
                        <Calendar className="h-4 w-4 text-blue-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {upcomingTransactions.length}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Transactions scheduled
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Upcoming Transactions Alert */}
            {upcomingTransactions.length > 0 && (
                <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/20">
                    <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <AlertCircle className="h-5 w-5 text-blue-600" />
                            Upcoming Transactions
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground mb-3">
                            You have {upcomingTransactions.length} recurring transaction{upcomingTransactions.length !== 1 ? 's' : ''} scheduled in the next 7 days.
                        </p>
                        <div className="space-y-2">
                            {upcomingTransactions.slice(0, 3).map((r) => (
                                <div key={r.id} className="text-sm flex items-center justify-between p-2 bg-background rounded">
                                    <span>
                                        {r.description || 'Recurring Transaction'} - {format(new Date(r.next_occurrence), 'MMM dd')}
                                    </span>
                                    <span className={`font-medium ${r.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                                        ${r.amount.toFixed(2)}
                                    </span>
                                </div>
                            ))}
                            {upcomingTransactions.length > 3 && (
                                <div className="text-xs text-muted-foreground pl-2">
                                    +{upcomingTransactions.length - 3} more
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Tabs */}
            <Tabs defaultValue="active" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="active" className="gap-2">
                        <Play className="h-4 w-4" />
                        Active ({activeRecurring.length})
                    </TabsTrigger>
                    <TabsTrigger value="inactive" className="gap-2">
                        <Pause className="h-4 w-4" />
                        Inactive ({inactiveRecurring.length})
                    </TabsTrigger>
                    <TabsTrigger value="income" className="gap-2">
                        <TrendingUp className="h-4 w-4" />
                        Income ({incomeRecurring.length})
                    </TabsTrigger>
                    <TabsTrigger value="expense" className="gap-2">
                        <TrendingDown className="h-4 w-4" />
                        Expenses ({expenseRecurring.length})
                    </TabsTrigger>
                </TabsList>

                {/* Active Tab */}
                <TabsContent value="active" className="space-y-4">
                    {activeRecurring.length === 0 ? (
                        <Card>
                            <CardHeader>
                                <CardTitle>No Active Recurring Transactions</CardTitle>
                                <CardDescription>
                                    Create your first recurring transaction to automate regular income or expenses.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <AddRecurringDialog />
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2">
                            {activeRecurring.map((recurring) => (
                                <RecurringCard
                                    key={recurring.id}
                                    recurring={recurring}
                                    onEdit={handleEdit}
                                    onDelete={handleDelete}
                                    onToggle={handleToggle}
                                    onExecute={handleExecute}
                                />
                            ))}
                        </div>
                    )}
                </TabsContent>

                {/* Inactive Tab */}
                <TabsContent value="inactive" className="space-y-4">
                    {inactiveRecurring.length === 0 ? (
                        <Card>
                            <CardHeader>
                                <CardTitle>No Inactive Recurring Transactions</CardTitle>
                                <CardDescription>
                                    Recurring transactions you deactivate will appear here.
                                </CardDescription>
                            </CardHeader>
                        </Card>
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2">
                            {inactiveRecurring.map((recurring) => (
                                <RecurringCard
                                    key={recurring.id}
                                    recurring={recurring}
                                    onEdit={handleEdit}
                                    onDelete={handleDelete}
                                    onToggle={handleToggle}
                                />
                            ))}
                        </div>
                    )}
                </TabsContent>

                {/* Income Tab */}
                <TabsContent value="income" className="space-y-4">
                    {incomeRecurring.length === 0 ? (
                        <Card>
                            <CardHeader>
                                <CardTitle>No Recurring Income</CardTitle>
                                <CardDescription>
                                    Set up recurring income like salary, dividends, or rental income.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <AddRecurringDialog />
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="space-y-4">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                                        Total Monthly Income: ${totalMonthlyIncome.toFixed(2)}
                                    </CardTitle>
                                    <CardDescription>
                                        From {incomeRecurring.length} recurring income source{incomeRecurring.length !== 1 ? 's' : ''}
                                    </CardDescription>
                                </CardHeader>
                            </Card>
                            <div className="grid gap-4 md:grid-cols-2">
                                {incomeRecurring.map((recurring) => (
                                    <RecurringCard
                                        key={recurring.id}
                                        recurring={recurring}
                                        onEdit={handleEdit}
                                        onDelete={handleDelete}
                                        onToggle={handleToggle}
                                        onExecute={handleExecute}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </TabsContent>

                {/* Expense Tab */}
                <TabsContent value="expense" className="space-y-4">
                    {expenseRecurring.length === 0 ? (
                        <Card>
                            <CardHeader>
                                <CardTitle>No Recurring Expenses</CardTitle>
                                <CardDescription>
                                    Set up recurring expenses like rent, subscriptions, or bills.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <AddRecurringDialog />
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="space-y-4">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <AlertCircle className="h-5 w-5 text-red-600" />
                                        Total Monthly Expenses: ${totalMonthlyExpense.toFixed(2)}
                                    </CardTitle>
                                    <CardDescription>
                                        From {expenseRecurring.length} recurring expense{expenseRecurring.length !== 1 ? 's' : ''}
                                    </CardDescription>
                                </CardHeader>
                            </Card>
                            <div className="grid gap-4 md:grid-cols-2">
                                {expenseRecurring.map((recurring) => (
                                    <RecurringCard
                                        key={recurring.id}
                                        recurring={recurring}
                                        onEdit={handleEdit}
                                        onDelete={handleDelete}
                                        onToggle={handleToggle}
                                        onExecute={handleExecute}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </TabsContent>
            </Tabs>

            {/* Edit Dialog */}
            <EditRecurringDialog
                recurring={editingRecurring}
                open={editDialogOpen}
                onOpenChange={setEditDialogOpen}
            />
        </div>
    );
}
