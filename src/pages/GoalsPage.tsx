
'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    useEnhancedSavingsGoals,
    useCreateEnhancedSavingsGoal,
    useUpdateEnhancedSavingsGoal,
    useDeleteSavingsGoal,
    useAddGoalContribution
} from '@/lib/hooks/use-budget-queries';
import { GOAL_TYPE_CONFIGS } from '@/lib/hooks/useGoalAnalytics';
import { SettingsPageSkeleton } from '@/components/loading/LoadingSkeletons';
import { Plus, Target, TrendingUp, Calendar, DollarSign, Trophy, Edit, Trash2, PlusCircle } from 'lucide-react';
import { format } from 'date-fns';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { EnhancedGoalDialog } from '@/components/goals/EnhancedGoalDialog';
import { GoalAnalyticsDashboard } from '@/components/goals/GoalAnalyticsDashboard';
import { MilestoneTracker } from '@/components/goals/MilestoneTracker';
import { AutoContributionManager } from '@/components/goals/AutoContributionManager';
import { Database, EnhancedSavingsGoal, CreateGoalParams } from '@/lib/supabase/database.types';
import { toast } from 'sonner';

export default function GoalsPage() {
    const { data: goals = [], isLoading } = useEnhancedSavingsGoals();
    const [selectedGoal, setSelectedGoal] = useState<EnhancedSavingsGoal | null>(null);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingGoal, setEditingGoal] = useState<EnhancedSavingsGoal | null>(null);
    const [sortBy, setSortBy] = useState<'name' | 'priority' | 'progress' | 'deadline'>('priority');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

    const createGoalMutation = useCreateEnhancedSavingsGoal();
    const updateGoalMutation = useUpdateEnhancedSavingsGoal();
    const deleteGoalMutation = useDeleteSavingsGoal();
    const addContributionMutation = useAddGoalContribution();

    const handleCreateGoal = async (goalData: Database['public']['Tables']['savings_goals']['Insert']) => {
        try {
            const input: CreateGoalParams = {
                name: goalData.name,
                target_amount: goalData.target_amount,
                deadline: goalData.target_date || undefined,
                goal_type: goalData.goal_type || 'custom',
                priority: goalData.priority || 5,
                auto_contribution_enabled: goalData.auto_contribution_enabled || false,
                auto_contribution_amount: goalData.auto_contribution_amount || 0,
                auto_contribution_frequency: goalData.auto_contribution_frequency || 'monthly',
                description: goalData.description || undefined,
                target_date: goalData.target_date || undefined,
            };

            await createGoalMutation.mutateAsync(input);
            toast.success('Savings goal created successfully!');
            setDialogOpen(false);
        } catch {
            toast.error('Failed to create savings goal. Please try again.');
        }
    };

    const handleEditGoal = (goal: EnhancedSavingsGoal) => {
        setEditingGoal(goal);
        setDialogOpen(true);
    };

    const handleUpdateGoal = async (goalData: Database['public']['Tables']['savings_goals']['Insert']) => {
        if (!editingGoal) return;

        try {
            await updateGoalMutation.mutateAsync({
                id: editingGoal.id,
                updates: {
                    name: goalData.name,
                    target_amount: goalData.target_amount,
                    deadline: goalData.target_date || undefined,
                    goal_type: goalData.goal_type || 'custom',
                    priority: goalData.priority || 5,
                    auto_contribution_enabled: goalData.auto_contribution_enabled || false,
                    auto_contribution_amount: goalData.auto_contribution_amount || 0,
                    auto_contribution_frequency: goalData.auto_contribution_frequency || 'monthly',
                    description: goalData.description || undefined,
                    target_date: goalData.target_date || undefined,
                }
            });
            toast.success('Savings goal updated successfully!');
            setDialogOpen(false);
            setEditingGoal(null);
        } catch {
            toast.error('Failed to update savings goal. Please try again.');
        }
    };

    const handleDeleteGoal = async (goalId: string) => {
        if (!confirm('Are you sure you want to delete this savings goal?')) return;

        try {
            await deleteGoalMutation.mutateAsync(goalId);
            toast.success('Savings goal deleted successfully!');
        } catch {
            toast.error('Failed to delete savings goal. Please try again.');
        }
    };

    const handleAddContribution = async (goalId: string) => {
        const amount = prompt('Enter contribution amount:');
        if (!amount || isNaN(parseFloat(amount))) return;

        try {
            await addContributionMutation.mutateAsync({
                goal_id: goalId,
                amount: parseFloat(amount),
                source: 'manual'
            });
            toast.success('Contribution added successfully!');
        } catch {
            toast.error('Failed to add contribution. Please try again.');
        }
    };

    if (isLoading) {
        return <SettingsPageSkeleton />;
    }

    const totalGoals = goals.length;
    const completedGoals = goals.filter(g => g.current_amount >= g.target_amount).length;
    const totalSaved = goals.reduce((sum, g) => sum + g.current_amount, 0);
    const totalTarget = goals.reduce((sum, g) => sum + g.target_amount, 0);

    // Sort goals
    const sortedGoals = [...goals].sort((a, b) => {
        let aValue: string | number, bValue: string | number;

        switch (sortBy) {
            case 'name':
                aValue = a.name.toLowerCase();
                bValue = b.name.toLowerCase();
                break;
            case 'priority':
                aValue = a.priority;
                bValue = b.priority;
                break;
            case 'progress':
                aValue = (a.current_amount / a.target_amount) * 100;
                bValue = (b.current_amount / b.target_amount) * 100;
                break;
            case 'deadline':
                aValue = a.target_date ? new Date(a.target_date).getTime() : Infinity;
                bValue = b.target_date ? new Date(b.target_date).getTime() : Infinity;
                break;
            default:
                return 0;
        }

        if (sortOrder === 'asc') {
            return aValue > bValue ? 1 : -1;
        } else {
            return aValue < bValue ? 1 : -1;
        }
    });

    return (
        <div className="space-y-6 p-4 sm:p-6 lg:p-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl sm:text-4xl font-bold bg-linear-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                        Financial Goals
                    </h1>
                    <p className="text-muted-foreground mt-1">Track and achieve your financial objectives</p>
                </div>
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogTrigger asChild>
                        <Button
                            onClick={() => {
                                setEditingGoal(null);
                                setDialogOpen(true);
                            }}
                            className="bg-green-600 hover:bg-green-700"
                        >
                            <Plus className="mr-2 h-4 w-4" />
                            New Goal
                        </Button>
                    </DialogTrigger>
                    <EnhancedGoalDialog
                        open={dialogOpen}
                        onOpenChange={setDialogOpen}
                        onSubmit={editingGoal ? handleUpdateGoal : handleCreateGoal}
                        editingGoal={editingGoal || undefined}
                    />
                </Dialog>
            </div>

            {/* Overview Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Goals</CardTitle>
                        <Target className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalGoals}</div>
                        <p className="text-xs text-muted-foreground">
                            {completedGoals} completed
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Saved</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">${totalSaved.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">
                            of ${totalTarget.toLocaleString()} target
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {totalGoals > 0 ? Math.round((completedGoals / totalGoals) * 100) : 0}%
                        </div>
                        <p className="text-xs text-muted-foreground">
                            goals achieved
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Goals</CardTitle>
                        <Trophy className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalGoals - completedGoals}</div>
                        <p className="text-xs text-muted-foreground">
                            in progress
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Main Content */}
            <Tabs defaultValue="overview" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="analytics">Analytics</TabsTrigger>
                    <TabsTrigger value="auto-contribution">Auto-Contribution</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4">
                    {/* Sort Controls */}
                    <div className="flex items-center gap-4">
                        <span className="text-sm font-medium">Sort by:</span>
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value as 'name' | 'priority' | 'progress' | 'deadline')}
                            className="px-3 py-1 border rounded-md text-sm"
                        >
                            <option value="priority">Priority</option>
                            <option value="name">Name</option>
                            <option value="progress">Progress</option>
                            <option value="deadline">Deadline</option>
                        </select>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                        >
                            {sortOrder === 'asc' ? '↑' : '↓'}
                        </Button>
                    </div>

                    {goals.length === 0 ? (
                        <Card>
                            <CardContent className="flex flex-col items-center justify-center py-12">
                                <Target className="h-12 w-12 text-muted-foreground mb-4" />
                                <h3 className="text-lg font-semibold mb-2">No savings goals yet</h3>
                                <p className="text-muted-foreground text-center mb-4">
                                    Create your first financial goal to start tracking your progress towards financial freedom.
                                </p>
                                <Button onClick={() => setDialogOpen(true)}>
                                    <Plus className="mr-2 h-4 w-4" />
                                    Create Your First Goal
                                </Button>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {sortedGoals.map((goal) => {
                                const progress = (goal.current_amount / goal.target_amount) * 100;
                                const goalTypeConfig = GOAL_TYPE_CONFIGS[goal.goal_type || 'custom'];

                                return (
                                    <Card key={goal.id} className="hover:shadow-md transition-shadow">
                                        <CardHeader className="pb-3">
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <CardTitle className="text-lg flex items-center gap-2">
                                                        <Target className="h-5 w-5 text-green-600" />
                                                        {goal.name}
                                                    </CardTitle>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <Badge variant="secondary" className="text-xs">
                                                            {goalTypeConfig?.label || 'Custom Goal'}
                                                        </Badge>
                                                        {goal.priority && (
                                                            <Badge variant="outline" className="text-xs">
                                                                Priority {goal.priority}
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex gap-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleEditGoal(goal)}
                                                    >
                                                        <Edit className="h-4 w-4" />
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
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            <div>
                                                <div className="flex justify-between text-sm mb-2">
                                                    <span>Progress</span>
                                                    <span className="font-medium">{progress.toFixed(1)}%</span>
                                                </div>
                                                <Progress value={progress} className="h-2" />
                                                <div className="flex justify-between text-sm text-muted-foreground mt-1">
                                                    <span>${goal.current_amount.toLocaleString()}</span>
                                                    <span>${goal.target_amount.toLocaleString()}</span>
                                                </div>
                                            </div>

                                            {goal.target_date && (
                                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                    <Calendar className="h-4 w-4" />
                                                    <span>Due: {format(new Date(goal.target_date), 'MMM dd, yyyy')}</span>
                                                </div>
                                            )}

                                            <div className="flex gap-2">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => handleAddContribution(goal.id)}
                                                    className="flex-1"
                                                >
                                                    <PlusCircle className="h-4 w-4 mr-1" />
                                                    Contribute
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => setSelectedGoal(goal)}
                                                >
                                                    Details
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="analytics">
                    <GoalAnalyticsDashboard goals={goals} />
                </TabsContent>

                <TabsContent value="auto-contribution">
                    <AutoContributionManager />
                </TabsContent>
            </Tabs>

            {/* Goal Details Dialog */}
            {selectedGoal && (
                <Dialog open={!!selectedGoal} onOpenChange={() => setSelectedGoal(null)}>
                    <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <Target className="h-5 w-5" />
                                {selectedGoal.name}
                            </DialogTitle>
                        </DialogHeader>
                        <div className="space-y-6">
                            <MilestoneTracker
                                milestones={selectedGoal.milestones || []}
                                goalProgress={(selectedGoal.current_amount / selectedGoal.target_amount) * 100}
                            />
                            {/* Additional goal details would go here */}
                        </div>
                    </DialogContent>
                </Dialog>
            )}
        </div>
    );
}

