import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Plus, Target, TrendingUp, AlertCircle, Trophy,
    DollarSign, Calendar, Filter, SortAsc
} from 'lucide-react';
import { GoalCard } from '@/components/goals/GoalCard';
import { GoalTypeSelector } from '@/components/goals/GoalTypeSelector';
import { MilestoneTracker } from '@/components/goals/MilestoneTracker';
import { useSavingsGoals, type SavingsGoal } from '@/lib/hooks/use-budget-queries';
import { FinancialGoalsService, type EnhancedGoal, type GoalMilestone } from '@/lib/services/financial-goals.service';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';

export default function FinancialGoalsPage() {
    const { data: goalsData } = useSavingsGoals();
    const [selectedGoal, setSelectedGoal] = useState<EnhancedGoal | null>(null);
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [filterType, setFilterType] = useState<string>('all');
    const [sortBy, setSortBy] = useState<'priority' | 'progress' | 'deadline'>('priority');

    // Mock data for now - will be replaced with actual data from hooks
    const goals: EnhancedGoal[] = (goalsData || []).map((goal: SavingsGoal) => ({
        ...goal,
        goal_type: 'general',
        priority: 1,
        auto_contribute: false,
        auto_contribute_amount: 0,
        auto_contribute_frequency: 'monthly' as const,
        last_contribution_date: null,
        description: null,
        color: '#3b82f6',
        icon: 'PiggyBank',
        is_completed: false,
        completed_at: null,
    }));

    const milestones: GoalMilestone[] = [];

    // Filter and sort goals
    const filteredGoals = goals.filter(goal => {
        if (filterType === 'all') return true;
        if (filterType === 'active') return !goal.is_completed;
        if (filterType === 'completed') return goal.is_completed;
        return goal.goal_type === filterType;
    });

    const sortedGoals = [...filteredGoals].sort((a, b) => {
        if (sortBy === 'priority') return a.priority - b.priority;
        if (sortBy === 'progress') {
            const progressA = (a.current_amount / a.target_amount) * 100;
            const progressB = (b.current_amount / b.target_amount) * 100;
            return progressB - progressA;
        }
        if (sortBy === 'deadline') {
            if (!a.deadline) return 1;
            if (!b.deadline) return -1;
            return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
        }
        return 0;
    });

    // Calculate overall statistics
    const totalGoals = goals.length;
    const activeGoals = goals.filter(g => !g.is_completed).length;
    const completedGoals = goals.filter(g => g.is_completed).length;
    const totalSaved = goals.reduce((sum, g) => sum + g.current_amount, 0);
    const totalTarget = goals.reduce((sum, g) => sum + g.target_amount, 0);
    const overallProgress = totalTarget > 0 ? (totalSaved / totalTarget) * 100 : 0;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Financial Goals</h1>
                    <p className="text-muted-foreground mt-1">
                        Track your progress and achieve your financial dreams
                    </p>
                </div>
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Goal
                </Button>
            </div>

            {/* Overall Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Total Goals
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between">
                            <span className="text-2xl font-bold">{totalGoals}</span>
                            <Target className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {activeGoals} active, {completedGoals} completed
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Total Saved
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between">
                            <span className="text-2xl font-bold">
                                ${totalSaved.toLocaleString()}
                            </span>
                            <DollarSign className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            of ${totalTarget.toLocaleString()} target
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Overall Progress
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between">
                            <span className="text-2xl font-bold">
                                {overallProgress.toFixed(0)}%
                            </span>
                            <TrendingUp className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Across all goals
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Milestones
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between">
                            <span className="text-2xl font-bold">{milestones.length}</span>
                            <Trophy className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {milestones.filter(m => m.is_completed).length} completed
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Filters and Controls */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="flex-1">
                            <Label className="text-xs mb-2 block">Filter by Type</Label>
                            <Select value={filterType} onValueChange={setFilterType}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Goals</SelectItem>
                                    <SelectItem value="active">Active</SelectItem>
                                    <SelectItem value="completed">Completed</SelectItem>
                                    <SelectItem value="emergency_fund">Emergency Fund</SelectItem>
                                    <SelectItem value="vacation">Vacation</SelectItem>
                                    <SelectItem value="house_down_payment">House Down Payment</SelectItem>
                                    <SelectItem value="retirement">Retirement</SelectItem>
                                    <SelectItem value="debt_free">Debt-Free</SelectItem>
                                    <SelectItem value="car_purchase">Car Purchase</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex-1">
                            <Label className="text-xs mb-2 block">Sort by</Label>
                            <Select value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="priority">Priority</SelectItem>
                                    <SelectItem value="progress">Progress</SelectItem>
                                    <SelectItem value="deadline">Deadline</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Goals List */}
            {sortedGoals.length === 0 ? (
                <Card>
                    <CardContent className="py-12">
                        <div className="text-center">
                            <Target className="h-16 w-16 mx-auto text-muted-foreground opacity-50 mb-4" />
                            <h3 className="text-lg font-medium mb-2">No goals yet</h3>
                            <p className="text-sm text-muted-foreground mb-4">
                                Create your first financial goal to start tracking your progress
                            </p>
                            <Button onClick={() => setIsCreateDialogOpen(true)}>
                                <Plus className="h-4 w-4 mr-2" />
                                Create Your First Goal
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {sortedGoals.map((goal) => {
                        const analytics = FinancialGoalsService.calculateGoalAnalytics(
                            goal,
                            milestones.filter(m => m.goal_id === goal.id),
                            []
                        );

                        return (
                            <GoalCard
                                key={goal.id}
                                goal={goal}
                                analytics={analytics}
                                onViewDetails={setSelectedGoal}
                                onEdit={(g) => {
                                    // TODO: Open edit dialog
                                    toast.info('Edit goal dialog coming soon');
                                }}
                                onDelete={(g) => {
                                    // TODO: Confirm and delete
                                    toast.info('Delete functionality coming soon');
                                }}
                                onAddContribution={(g) => {
                                    // TODO: Open contribution dialog
                                    toast.info('Add contribution dialog coming soon');
                                }}
                            />
                        );
                    })}
                </div>
            )}

            {/* Goal Details Dialog */}
            <Dialog open={!!selectedGoal} onOpenChange={(open) => !open && setSelectedGoal(null)}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    {selectedGoal && (
                        <>
                            <DialogHeader>
                                <DialogTitle className="text-2xl">{selectedGoal.name}</DialogTitle>
                                <DialogDescription>
                                    {selectedGoal.description || 'No description provided'}
                                </DialogDescription>
                            </DialogHeader>

                            <Tabs defaultValue="overview" className="mt-4">
                                <TabsList className="grid w-full grid-cols-3">
                                    <TabsTrigger value="overview">Overview</TabsTrigger>
                                    <TabsTrigger value="milestones">Milestones</TabsTrigger>
                                    <TabsTrigger value="contributions">Contributions</TabsTrigger>
                                </TabsList>

                                <TabsContent value="overview" className="space-y-4 mt-4">
                                    {/* TODO: Add detailed overview */}
                                    <Card>
                                        <CardContent className="pt-6">
                                            <p className="text-muted-foreground">
                                                Detailed analytics and insights coming soon
                                            </p>
                                        </CardContent>
                                    </Card>
                                </TabsContent>

                                <TabsContent value="milestones" className="mt-4">
                                    <MilestoneTracker
                                        goal={selectedGoal}
                                        milestones={milestones.filter(m => m.goal_id === selectedGoal.id)}
                                        onAddMilestone={() => toast.info('Add milestone dialog coming soon')}
                                        onEditMilestone={() => toast.info('Edit milestone dialog coming soon')}
                                        onDeleteMilestone={() => toast.info('Delete milestone coming soon')}
                                        onToggleComplete={() => toast.info('Toggle complete coming soon')}
                                    />
                                </TabsContent>

                                <TabsContent value="contributions" className="mt-4">
                                    <Card>
                                        <CardContent className="pt-6">
                                            <p className="text-muted-foreground">
                                                Contribution history coming soon
                                            </p>
                                        </CardContent>
                                    </Card>
                                </TabsContent>
                            </Tabs>
                        </>
                    )}
                </DialogContent>
            </Dialog>

            {/* Create Goal Dialog */}
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Create New Goal</DialogTitle>
                        <DialogDescription>
                            Set up a new financial goal to track your progress
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 mt-4">
                        <div>
                            <Label className="mb-3 block">Goal Type</Label>
                            <GoalTypeSelector
                                selectedType={null}
                                onSelect={(type) => toast.info(`Selected: ${type}`)}
                            />
                        </div>

                        {/* TODO: Add full create goal form */}
                        <div className="text-sm text-muted-foreground text-center py-4">
                            Full goal creation form coming soon
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
