import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    TrendingUp,
    TrendingDown,
    Calendar,
    DollarSign,
    Target,
    AlertTriangle,
    CheckCircle,
    Clock
} from 'lucide-react';
import { EnhancedSavingsGoal, GoalAnalytics } from '@/lib/supabase/database.types';
import { useGoalAnalytics, useGoalsSummary } from '@/lib/hooks/useGoalAnalytics';
import { format, differenceInDays } from 'date-fns';

interface GoalAnalyticsDashboardProps {
    goals: EnhancedSavingsGoal[];
    className?: string;
}

export function GoalAnalyticsDashboard({ goals, className }: GoalAnalyticsDashboardProps) {
    const summary = useGoalsSummary(goals);

    return (
        <div className={`space-y-6 ${className}`}>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <SummaryCard
                    title="Total Goals"
                    value={summary.total_goals}
                    icon={Target}
                    color="blue"
                />
                <SummaryCard
                    title="Active Goals"
                    value={summary.active_goals}
                    icon={Clock}
                    color="orange"
                />
                <SummaryCard
                    title="Completed Goals"
                    value={summary.completed_goals}
                    icon={CheckCircle}
                    color="green"
                />
                <SummaryCard
                    title="Overall Progress"
                    value={`${summary.overall_progress_percentage.toFixed(1)}%`}
                    icon={TrendingUp}
                    color="purple"
                />
            </div>

            {/* Goals Overview */}
            <Card>
                <CardHeader>
                    <CardTitle>Goals Overview</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {goals.map((goal) => (
                            <GoalOverviewCard key={goal.id} goal={goal} />
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Priority Goals */}
            <PriorityGoalsSection goals={goals} />

            {/* Goals Timeline */}
            <GoalsTimeline goals={goals} />
        </div>
    );
}

interface SummaryCardProps {
    title: string;
    value: string | number;
    icon: React.ElementType;
    color: 'blue' | 'green' | 'orange' | 'purple' | 'red';
}

function SummaryCard({ title, value, icon: Icon, color }: SummaryCardProps) {
    const colorClasses = {
        blue: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/20 dark:text-blue-300 dark:border-blue-800',
        green: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950/20 dark:text-green-300 dark:border-green-800',
        orange: 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/20 dark:text-orange-300 dark:border-orange-800',
        purple: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/20 dark:text-purple-300 dark:border-purple-800',
        red: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/20 dark:text-red-300 dark:border-red-800'
    };

    return (
        <Card className={colorClasses[color]}>
            <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                    <Icon className="h-8 w-8" />
                    <div>
                        <p className="text-sm font-medium">{title}</p>
                        <p className="text-2xl font-bold">{value}</p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

interface GoalOverviewCardProps {
    goal: EnhancedSavingsGoal;
}

function GoalOverviewCard({ goal }: GoalOverviewCardProps) {
    const analytics = useGoalAnalytics(goal);
    const progressPercentage = (goal.current_amount / goal.target_amount) * 100;

    const getStatusColor = () => {
        if (goal.current_amount >= goal.target_amount) return 'green';
        if (analytics.is_on_track) return 'blue';
        return 'orange';
    };

    const statusColor = getStatusColor();

    return (
        <div className="border rounded-lg p-4 space-y-3">
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <h3 className="font-semibold">{goal.name}</h3>
                    <p className="text-sm text-muted-foreground">
                        ${goal.current_amount.toLocaleString()} / ${goal.target_amount.toLocaleString()}
                    </p>
                </div>
                <Badge variant={statusColor === 'green' ? 'default' : 'secondary'}>
                    {goal.current_amount >= goal.target_amount ? 'Completed' :
                     analytics.is_on_track ? 'On Track' : 'Behind'}
                </Badge>
            </div>

            <Progress value={progressPercentage} className="h-2" />

            <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                    <span className="text-muted-foreground">Progress:</span>
                    <div className="font-medium">{progressPercentage.toFixed(1)}%</div>
                </div>
                <div>
                    <span className="text-muted-foreground">Remaining:</span>
                    <div className="font-medium">${analytics.remaining_amount.toLocaleString()}</div>
                </div>
                {analytics.monthly_savings_needed && (
                    <div>
                        <span className="text-muted-foreground">Monthly Needed:</span>
                        <div className="font-medium">${analytics.monthly_savings_needed.toFixed(2)}</div>
                    </div>
                )}
                {analytics.days_remaining && (
                    <div>
                        <span className="text-muted-foreground">Days Left:</span>
                        <div className="font-medium">{analytics.days_remaining}</div>
                    </div>
                )}
            </div>

            {!analytics.is_on_track && analytics.suggested_adjustments.length > 0 && (
                <div className="mt-3 p-3 bg-orange-50 border border-orange-200 rounded-md dark:bg-orange-950/20 dark:border-orange-800">
                    <div className="flex items-start space-x-2">
                        <AlertTriangle className="h-4 w-4 text-orange-600 mt-0.5" />
                        <div>
                            <p className="text-sm font-medium text-orange-800 dark:text-orange-200">
                                Suggestions to get back on track:
                            </p>
                            <ul className="text-sm text-orange-700 dark:text-orange-300 mt-1 space-y-1">
                                {analytics.suggested_adjustments.map((suggestion, index) => (
                                    <li key={index}>• {suggestion}</li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

interface PriorityGoalsSectionProps {
    goals: EnhancedSavingsGoal[];
}

function PriorityGoalsSection({ goals }: PriorityGoalsSectionProps) {
    // Sort goals by priority (highest first) and filter to top 3
    const priorityGoals = goals
        .filter(g => g.current_amount < g.target_amount)
        .sort((a, b) => b.priority - a.priority)
        .slice(0, 3);

    if (priorityGoals.length === 0) return null;

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    High Priority Goals
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    {priorityGoals.map((goal) => {
                        const analytics = useGoalAnalytics(goal);
                        return (
                            <div key={goal.id} className="flex items-center justify-between p-3 border rounded-lg">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="font-medium">{goal.name}</span>
                                        <Badge variant="outline">Priority {goal.priority}</Badge>
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                        ${goal.current_amount.toLocaleString()} / ${goal.target_amount.toLocaleString()}
                                        {analytics.monthly_savings_needed && (
                                            <span className="ml-2">
                                                (${analytics.monthly_savings_needed.toFixed(0)}/month needed)
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-sm font-medium">
                                        {((goal.current_amount / goal.target_amount) * 100).toFixed(1)}%
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                        {analytics.days_remaining ? `${analytics.days_remaining} days left` : 'No deadline'}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </CardContent>
        </Card>
    );
}

interface GoalsTimelineProps {
    goals: EnhancedSavingsGoal[];
}

function GoalsTimeline({ goals }: GoalsTimelineProps) {
    // Get goals with deadlines, sorted by deadline
    const goalsWithDeadlines = goals
        .filter(g => g.target_date || g.deadline)
        .sort((a, b) => {
            const dateA = new Date(a.target_date || a.deadline!);
            const dateB = new Date(b.target_date || b.deadline!);
            return dateA.getTime() - dateB.getTime();
        })
        .slice(0, 5); // Show next 5 upcoming deadlines

    if (goalsWithDeadlines.length === 0) return null;

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Upcoming Deadlines
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    {goalsWithDeadlines.map((goal) => {
                        const deadline = goal.target_date || goal.deadline!;
                        const daysUntil = differenceInDays(new Date(deadline), new Date());
                        const isOverdue = daysUntil < 0;
                        const isUrgent = daysUntil <= 7 && daysUntil >= 0;

                        return (
                            <div key={goal.id} className="flex items-center justify-between p-3 border rounded-lg">
                                <div className="flex-1">
                                    <div className="font-medium">{goal.name}</div>
                                    <div className="text-sm text-muted-foreground">
                                        {format(new Date(deadline), 'MMM dd, yyyy')}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <Badge
                                        variant={
                                            isOverdue ? 'destructive' :
                                            isUrgent ? 'default' :
                                            'secondary'
                                        }
                                    >
                                        {isOverdue ? `${Math.abs(daysUntil)} days overdue` :
                                         isUrgent ? `${daysUntil} days left` :
                                         `${daysUntil} days`}
                                    </Badge>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </CardContent>
        </Card>
    );
}