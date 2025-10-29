'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    useCategories,
    useSavingsGoals,
    useAddSavingsGoal,
    useUpdateSavingsGoal,
    useDeleteSavingsGoal,
    useUserSettings,
    useSaveUserSettings,
    useCategoryBudgets,
    useSaveCategoryBudget,
    useDeleteCategoryBudget
} from '@/lib/hooks/use-budget-queries';
import { SettingsPageSkeleton } from '@/components/loading/LoadingSkeletons';
import { supabase } from '@/lib/supabase/client';
import { Plus, Pencil, Trash2, Target, DollarSign, CalendarIcon } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { format } from 'date-fns';
import { TransactionListSkeleton } from '@/components/loading/LoadingSkeletons';
import { Progress } from '@/components/ui/progress';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { DataManagementCard } from '@/components/settings/DataManagementCard';
import { NotificationSettings } from '@/components/settings/NotificationSettings';

type Category = {
    id: string;
    user_id: string;
    name: string;
    type: 'income' | 'expense';
    color: string;
    icon: string | null;
    created_at: string;
    updated_at: string;
};

type SavingsGoal = {
    id: string;
    user_id: string;
    name: string;
    target_amount: number;
    current_amount: number;
    deadline: string;
    created_at: string;
    updated_at: string;
};

type CategoryBudget = {
    id: string;
    user_id: string;
    category_id: string;
    amount: number;
    period: 'monthly' | 'yearly';
    created_at: string;
    updated_at: string;
    category?: Category;
};

type UserSettings = {
    id: string;
    user_id: string;
    currency: string;
    opening_balance: number;
    opening_date: string;
    created_at: string;
    updated_at: string;
};

export default function SettingsPage() {
    // React Query hooks
    const { data: savingsGoals = [], isLoading: goalsLoading } = useSavingsGoals() as { data: SavingsGoal[], isLoading: boolean };
    const { data: userSettings, isLoading: settingsLoading } = useUserSettings() as { data: UserSettings | null, isLoading: boolean };
    const { data: categories = [], isLoading: categoriesLoading } = useCategories() as { data: Category[], isLoading: boolean };
    const { data: categoryBudgets = [], isLoading: budgetsLoading } = useCategoryBudgets() as { data: CategoryBudget[], isLoading: boolean };

    const addSavingsGoalMutation = useAddSavingsGoal();
    const updateSavingsGoalMutation = useUpdateSavingsGoal();
    const deleteSavingsGoalMutation = useDeleteSavingsGoal();
    const saveUserSettingsMutation = useSaveUserSettings();
    const saveCategoryBudgetMutation = useSaveCategoryBudget();
    const deleteCategoryBudgetMutation = useDeleteCategoryBudget();

    const loading = goalsLoading || settingsLoading || categoriesLoading || budgetsLoading;

    const [user, setUser] = useState<any>(null);
    const [profileData, setProfileData] = useState({
        full_name: '',
        email: '',
    });
    const [openingBalanceData, setOpeningBalanceData] = useState({
        opening_balance: '0',
        opening_date: new Date(),
    });
    const [isGoalDialogOpen, setIsGoalDialogOpen] = useState(false);
    const [editingGoal, setEditingGoal] = useState<any>(null);
    const [goalFormData, setGoalFormData] = useState({
        name: '',
        target_amount: '',
        deadline: new Date(),
    });
    const [isBudgetDialogOpen, setIsBudgetDialogOpen] = useState(false);
    const [editingBudget, setEditingBudget] = useState<any>(null);
    const [budgetFormData, setBudgetFormData] = useState({
        category_id: '',
        amount: '',
        period: 'monthly' as 'monthly' | 'yearly',
    });

    useEffect(() => {
        const loadData = async () => {
            const { data: { user: authUser } } = await supabase.auth.getUser();
            if (authUser) {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', authUser.id)
                    .single();

                if (profile) {
                    setUser(profile);
                    setProfileData({
                        full_name: profile.full_name || '',
                        email: profile.email,
                    });
                }
            }
        };
        loadData();
    }, []);

    // Update opening balance form when settings are loaded
    useEffect(() => {
        if (userSettings) {
            setOpeningBalanceData({
                opening_balance: userSettings.opening_balance.toString(),
                opening_date: new Date(userSettings.opening_date),
            });
        }
    }, [userSettings]);

    const handleProfileUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (!authUser) return;

        await supabase
            .from('profiles')
            .update({ full_name: profileData.full_name })
            .eq('id', authUser.id);

        alert('Profile updated successfully!');
    };

    const handleOpeningBalanceSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        await saveUserSettingsMutation.mutateAsync({
            opening_balance: parseFloat(openingBalanceData.opening_balance),
            opening_date: format(openingBalanceData.opening_date, 'yyyy-MM-dd'),
        });

        alert('Opening balance saved successfully!');
    };

    const handleGoalSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const goalData = {
            name: goalFormData.name,
            target_amount: parseFloat(goalFormData.target_amount),
            deadline: format(goalFormData.deadline, 'yyyy-MM-dd'),
        };

        if (editingGoal) {
            await updateSavingsGoalMutation.mutateAsync({ id: editingGoal.id, updates: goalData });
        } else {
            await addSavingsGoalMutation.mutateAsync(goalData);
        }

        setIsGoalDialogOpen(false);
        setEditingGoal(null);
        setGoalFormData({ name: '', target_amount: '', deadline: new Date() });
    };

    const handleEditGoal = (goal: any) => {
        setEditingGoal(goal);
        setGoalFormData({
            name: goal.name,
            target_amount: goal.target_amount.toString(),
            deadline: new Date(goal.deadline || new Date()),
        });
        setIsGoalDialogOpen(true);
    };

    const handleDeleteGoal = async (id: string) => {
        if (confirm('Are you sure you want to delete this savings goal?')) {
            await deleteSavingsGoalMutation.mutateAsync(id);
        }
    };

    const handleContributeToGoal = async (goalId: string) => {
        const amount = prompt('Enter contribution amount:');
        if (amount && !isNaN(parseFloat(amount))) {
            const goal = savingsGoals.find((g) => g.id === goalId);
            if (goal) {
                await updateSavingsGoalMutation.mutateAsync({
                    id: goalId,
                    updates: {
                        current_amount: goal.current_amount + parseFloat(amount),
                    },
                });
            }
        }
    };

    const handleBudgetSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        await saveCategoryBudgetMutation.mutateAsync({
            category_id: budgetFormData.category_id,
            amount: parseFloat(budgetFormData.amount),
            period: budgetFormData.period,
        });

        setIsBudgetDialogOpen(false);
        setBudgetFormData({ category_id: '', amount: '', period: 'monthly' });
    };

    const handleDeleteBudget = async (id: string) => {
        if (confirm('Are you sure you want to delete this budget?')) {
            await deleteCategoryBudgetMutation.mutateAsync(id);
        }
    };

    if (loading) {
        return <SettingsPageSkeleton />;
    }

    return (

        <div className="space-y-6 p-4 sm:p-6 lg:p-8">
            <div>
                <h1 className="text-3xl sm:text-4xl font-bold bg-linear-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                    Settings & Profile
                </h1>
                <p className="text-muted-foreground mt-1">Manage your account and savings goals</p>
            </div>
            <div className="grid gap-6 md:grid-cols-2">
                {/* Profile Card */}
                <Card>
                    <CardHeader>
                        <CardTitle>Profile Information</CardTitle>
                        <CardDescription>Update your personal details</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleProfileUpdate} className="space-y-4">
                            <div>
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={profileData.email}
                                    disabled
                                />
                            </div>
                            <div>
                                <Label htmlFor="full_name">Full Name</Label>
                                <Input
                                    id="full_name"
                                    value={profileData.full_name}
                                    onChange={(e) =>
                                        setProfileData({ ...profileData, full_name: e.target.value })
                                    }
                                />
                            </div>
                            <Button type="submit" className="w-full">
                                Update Profile
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {/* Opening Balance Card */}
                <Card className="border-2 border-green-200 dark:border-green-900">
                    <CardHeader className="bg-linear-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20">
                        <CardTitle className="flex items-center gap-2">
                            <DollarSign className="h-5 w-5 text-green-600" />
                            Account Opening Balance
                        </CardTitle>
                        <CardDescription>Set your initial account balance</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <form onSubmit={handleOpeningBalanceSubmit} className="space-y-4">
                            <div>
                                <Label htmlFor="opening_balance">Opening Balance ($)</Label>
                                <Input
                                    id="opening_balance"
                                    type="number"
                                    step="0.01"
                                    value={openingBalanceData.opening_balance}
                                    onChange={(e) =>
                                        setOpeningBalanceData({ ...openingBalanceData, opening_balance: e.target.value })
                                    }
                                    placeholder="0.00"
                                    required
                                />
                            </div>
                            <div>
                                <Label htmlFor="opening_date">Opening Date</Label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button variant="outline" className="w-full justify-start">
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {format(openingBalanceData.opening_date, 'PPP')}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar
                                            mode="single"
                                            selected={openingBalanceData.opening_date}
                                            onSelect={(date) => date && setOpeningBalanceData({ ...openingBalanceData, opening_date: date })}
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                            </div>
                            <Button type="submit" className="w-full bg-green-600 hover:bg-green-700">
                                {userSettings ? 'Update Opening Balance' : 'Set Opening Balance'}
                            </Button>
                            {userSettings && (
                                <p className="text-xs text-muted-foreground text-center">
                                    Current: ${userSettings.opening_balance.toFixed(2)} (since {format(new Date(userSettings.opening_date), 'MMM dd, yyyy')})
                                </p>
                            )}
                        </form>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2">

                {/* Account Actions */}
                <Card>
                    <CardHeader>
                        <CardTitle>Account Actions</CardTitle>
                        <CardDescription>Manage your account</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Button
                            variant="outline"
                            className="w-full"
                            onClick={async () => {
                                const newPassword = prompt('Enter new password:');
                                if (newPassword) {
                                    await supabase.auth.updateUser({ password: newPassword });
                                    alert('Password updated successfully!');
                                }
                            }}
                        >
                            Change Password
                        </Button>
                        <Button
                            variant="destructive"
                            className="w-full"
                            onClick={async () => {
                                if (confirm('Are you sure you want to sign out?')) {
                                    await supabase.auth.signOut();
                                    window.location.href = '/';
                                }
                            }}
                        >
                            Sign Out
                        </Button>
                    </CardContent>
                </Card>

                {/* Data Management */}
                <DataManagementCard />
            </div>

            {/* Savings Goals */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Savings Goals</CardTitle>
                            <CardDescription>Track your financial targets</CardDescription>
                        </div>
                        <Dialog open={isGoalDialogOpen} onOpenChange={setIsGoalDialogOpen}>
                            <DialogTrigger asChild>
                                <Button onClick={() => {
                                    setEditingGoal(null);
                                    setGoalFormData({ name: '', target_amount: '', deadline: new Date() });
                                }}>
                                    <Plus className="mr-2 h-4 w-4" />
                                    Add Goal
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>
                                        {editingGoal ? 'Edit Savings Goal' : 'Add New Savings Goal'}
                                    </DialogTitle>
                                </DialogHeader>
                                <form onSubmit={handleGoalSubmit} className="space-y-4">
                                    <div>
                                        <Label htmlFor="goal_name">Goal Name</Label>
                                        <Input
                                            id="goal_name"
                                            value={goalFormData.name}
                                            onChange={(e) =>
                                                setGoalFormData({ ...goalFormData, name: e.target.value })
                                            }
                                            required
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="target_amount">Target Amount</Label>
                                        <Input
                                            id="target_amount"
                                            type="number"
                                            step="0.01"
                                            value={goalFormData.target_amount}
                                            onChange={(e) =>
                                                setGoalFormData({ ...goalFormData, target_amount: e.target.value })
                                            }
                                            required
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="deadline">Deadline</Label>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button variant="outline" className="w-full justify-start">
                                                    {format(goalFormData.deadline, 'PPP')}
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0">
                                                <Calendar
                                                    mode="single"
                                                    selected={goalFormData.deadline}
                                                    onSelect={(date) => date && setGoalFormData({ ...goalFormData, deadline: date })}
                                                />
                                            </PopoverContent>
                                        </Popover>
                                    </div>
                                    <Button type="submit" className="w-full">
                                        {editingGoal ? 'Update Goal' : 'Add Goal'}
                                    </Button>
                                </form>
                            </DialogContent>
                        </Dialog>
                    </div>
                </CardHeader>
                <CardContent>
                    {savingsGoals.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No savings goals yet</p>
                    ) : (
                        <div className="space-y-4">
                            {savingsGoals.map((goal) => {
                                const progress = (goal.current_amount / goal.target_amount) * 100;
                                return (
                                    <div key={goal.id} className="border rounded-lg p-4 space-y-3">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <h3 className="font-semibold flex items-center gap-2">
                                                    <Target className="h-4 w-4" />
                                                    {goal.name}
                                                </h3>
                                                <p className="text-sm text-muted-foreground">
                                                    ${goal.current_amount.toFixed(2)} / ${goal.target_amount.toFixed(2)}
                                                </p>
                                                {goal.deadline && (
                                                    <p className="text-xs text-muted-foreground">
                                                        Deadline: {format(new Date(goal.deadline), 'MMM dd, yyyy')}
                                                    </p>
                                                )}
                                            </div>
                                            <div className="flex gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleEditGoal(goal)}
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleDeleteGoal(goal.id)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                        <Progress value={progress} className="h-2" />
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-medium">{progress.toFixed(1)}% complete</span>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => handleContributeToGoal(goal.id)}
                                            >
                                                Add Contribution
                                            </Button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Category Budgets */}
            <Card className="border-2 border-purple-200 dark:border-purple-900">
                <CardHeader className="bg-linear-to-r from-purple-50 to-indigo-50 dark:from-purple-950/20 dark:to-indigo-950/20">
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <Target className="h-5 w-5 text-purple-600" />
                                Category Budgets
                            </CardTitle>
                            <CardDescription>Set monthly or yearly budgets for expense categories</CardDescription>
                        </div>
                        <Dialog open={isBudgetDialogOpen} onOpenChange={setIsBudgetDialogOpen}>
                            <DialogTrigger asChild>
                                <Button
                                    className="bg-purple-600 hover:bg-purple-700"
                                    onClick={() => {
                                        setEditingBudget(null);
                                        setBudgetFormData({ category_id: '', amount: '', period: 'monthly' });
                                    }}
                                >
                                    <Plus className="mr-2 h-4 w-4" />
                                    Add Budget
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Set Category Budget</DialogTitle>
                                </DialogHeader>
                                <form onSubmit={handleBudgetSubmit} className="space-y-4">
                                    <div>
                                        <Label htmlFor="category">Category</Label>
                                        <select
                                            id="category"
                                            className="w-full px-3 py-2 border rounded-md"
                                            value={budgetFormData.category_id}
                                            onChange={(e) =>
                                                setBudgetFormData({ ...budgetFormData, category_id: e.target.value })
                                            }
                                            required
                                        >
                                            <option value="">Select a category</option>
                                            {categories
                                                .filter((c) => c.type === 'expense')
                                                .map((category) => (
                                                    <option key={category.id} value={category.id}>
                                                        {category.name}
                                                    </option>
                                                ))}
                                        </select>
                                    </div>
                                    <div>
                                        <Label htmlFor="budget_amount">Budget Amount ($)</Label>
                                        <Input
                                            id="budget_amount"
                                            type="number"
                                            step="0.01"
                                            value={budgetFormData.amount}
                                            onChange={(e) =>
                                                setBudgetFormData({ ...budgetFormData, amount: e.target.value })
                                            }
                                            placeholder="0.00"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="period">Period</Label>
                                        <select
                                            id="period"
                                            className="w-full px-3 py-2 border rounded-md"
                                            value={budgetFormData.period}
                                            onChange={(e) =>
                                                setBudgetFormData({ ...budgetFormData, period: e.target.value as 'monthly' | 'yearly' })
                                            }
                                        >
                                            <option value="monthly">Monthly</option>
                                            <option value="yearly">Yearly</option>
                                        </select>
                                    </div>
                                    <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700">
                                        Set Budget
                                    </Button>
                                </form>
                            </DialogContent>
                        </Dialog>
                    </div>
                </CardHeader>
                <CardContent className="pt-6">
                    {categoryBudgets.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            <Target className="h-12 w-12 mx-auto mb-3 opacity-50" />
                            <p>No budgets set yet</p>
                            <p className="text-xs mt-1">Click "Add Budget" to set spending limits for your categories</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {categoryBudgets.map((budget) => {
                                const category = categories.find((c) => c.id === budget.category_id);
                                if (!category) return null;

                                return (
                                    <div
                                        key={budget.id}
                                        className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div
                                                    className="w-4 h-4 rounded-full"
                                                    style={{ backgroundColor: category.color }}
                                                />
                                                <div>
                                                    <h3 className="font-semibold">{category.name}</h3>
                                                    <p className="text-sm text-muted-foreground">
                                                        ${budget.amount.toFixed(2)} / {budget.period}
                                                    </p>
                                                </div>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleDeleteBudget(budget.id)}
                                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Notification Preferences */}
            <NotificationSettings />
        </div>
    );
}
