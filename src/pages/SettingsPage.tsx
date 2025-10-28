'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useBudgetStore } from '@/lib/store';
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
import { Progress } from '@/components/ui/progress';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

export default function SettingsPage() {
    const { user, setUser, savingsGoals, fetchSavingsGoals, addSavingsGoal, updateSavingsGoal, deleteSavingsGoal, userSettings, fetchUserSettings, saveUserSettings } = useBudgetStore();
    const [loading, setLoading] = useState(true);
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
            await fetchSavingsGoals();
            await fetchUserSettings();
            setLoading(false);
        };
        loadData();
    }, [setUser, fetchSavingsGoals, fetchUserSettings]);

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

        await saveUserSettings({
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
            await updateSavingsGoal(editingGoal.id, goalData);
        } else {
            await addSavingsGoal(goalData);
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
            await deleteSavingsGoal(id);
        }
    };

    const handleContributeToGoal = async (goalId: string) => {
        const amount = prompt('Enter contribution amount:');
        if (amount && !isNaN(parseFloat(amount))) {
            const goal = savingsGoals.find((g) => g.id === goalId);
            if (goal) {
                await updateSavingsGoal(goalId, {
                    current_amount: goal.current_amount + parseFloat(amount),
                });
            }
        }
    };

    if (loading) {
        return <div>Loading...</div>;
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">Settings & Profile</h1>
                <p className="text-muted-foreground">Manage your account and savings goals</p>
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
        </div>
    );
}
