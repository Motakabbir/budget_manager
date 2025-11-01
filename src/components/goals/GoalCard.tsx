import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
    PiggyBank, Shield, Plane, Home, TrendingUp, Target,
    Car, GraduationCap, Heart, LineChart, MoreVertical,
    Calendar, DollarSign, CheckCircle, AlertCircle
} from 'lucide-react';
import type { EnhancedGoal } from '@/lib/services/financial-goals.service';
import { FinancialGoalsService, type GoalAnalytics } from '@/lib/services/financial-goals.service';
import { format } from 'date-fns';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface GoalCardProps {
    goal: EnhancedGoal;
    analytics: GoalAnalytics;
    onEdit?: (goal: EnhancedGoal) => void;
    onDelete?: (goal: EnhancedGoal) => void;
    onAddContribution?: (goal: EnhancedGoal) => void;
    onViewDetails?: (goal: EnhancedGoal) => void;
}

const goalIcons = {
    PiggyBank,
    Shield,
    Plane,
    Home,
    TrendingUp,
    Target,
    Car,
    GraduationCap,
    Heart,
    LineChart,
};

export function GoalCard({ goal, analytics, onEdit, onDelete, onAddContribution, onViewDetails }: GoalCardProps) {
    const Icon = goalIcons[goal.icon as keyof typeof goalIcons] || PiggyBank;

    const healthColors = {
        excellent: 'text-green-600 bg-green-50 dark:bg-green-950/20 border-green-200',
        good: 'text-blue-600 bg-blue-50 dark:bg-blue-950/20 border-blue-200',
        behind: 'text-amber-600 bg-amber-50 dark:bg-amber-950/20 border-amber-200',
        critical: 'text-red-600 bg-red-50 dark:bg-red-950/20 border-red-200',
    };

    return (
        <Card
            className="hover:shadow-lg transition-all cursor-pointer group relative"
            onClick={() => onViewDetails?.(goal)}
        >
            {/* Priority Badge */}
            {goal.priority <= 3 && (
                <div className="absolute top-3 right-3 z-10">
                    <Badge variant="secondary" className="text-xs">
                        Priority #{goal.priority}
                    </Badge>
                </div>
            )}

            <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3 flex-1">
                        <div
                            className="p-3 rounded-full"
                            style={{ backgroundColor: `${goal.color}20` }}
                        >
                            <Icon className="h-6 w-6" style={{ color: goal.color }} />
                        </div>
                        <div className="flex-1 min-w-0">
                            <CardTitle className="text-lg truncate">{goal.name}</CardTitle>
                            {goal.description && (
                                <p className="text-sm text-muted-foreground truncate mt-1">
                                    {goal.description}
                                </p>
                            )}
                        </div>
                    </div>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={(e) => {
                                e.stopPropagation();
                                onAddContribution?.(goal);
                            }}>
                                <DollarSign className="h-4 w-4 mr-2" />
                                Add Contribution
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => {
                                e.stopPropagation();
                                onEdit?.(goal);
                            }}>
                                Edit Goal
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onDelete?.(goal);
                                }}
                                className="text-red-600"
                            >
                                Delete Goal
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </CardHeader>

            <CardContent className="space-y-4">
                {/* Progress */}
                <div>
                    <div className="flex justify-between items-baseline mb-2">
                        <span className="text-2xl font-bold">
                            ${goal.current_amount.toLocaleString()}
                        </span>
                        <span className="text-sm text-muted-foreground">
                            of ${goal.target_amount.toLocaleString()}
                        </span>
                    </div>
                    <Progress
                        value={analytics.progressPercentage}
                        className="h-2"
                        style={{
                            backgroundColor: `${goal.color}20`,
                        }}
                    />
                    <div className="flex justify-between items-center mt-1">
                        <span className="text-xs text-muted-foreground">
                            {analytics.progressPercentage.toFixed(1)}% Complete
                        </span>
                        <span className="text-xs text-muted-foreground">
                            ${analytics.remainingAmount.toLocaleString()} remaining
                        </span>
                    </div>
                </div>

                {/* Key Metrics */}
                <div className="grid grid-cols-2 gap-3 text-sm">
                    {goal.deadline && (
                        <div>
                            <div className="flex items-center gap-1 text-muted-foreground mb-1">
                                <Calendar className="h-3 w-3" />
                                <span className="text-xs">Deadline</span>
                            </div>
                            <div className="font-medium">
                                {format(new Date(goal.deadline), 'MMM d, yyyy')}
                            </div>
                            {analytics.monthsUntilDeadline !== null && (
                                <div className="text-xs text-muted-foreground">
                                    {analytics.monthsUntilDeadline} months left
                                </div>
                            )}
                        </div>
                    )}

                    <div>
                        <div className="flex items-center gap-1 text-muted-foreground mb-1">
                            <DollarSign className="h-3 w-3" />
                            <span className="text-xs">Monthly Target</span>
                        </div>
                        <div className="font-medium">
                            ${analytics.requiredMonthlySavings.toFixed(0)}
                        </div>
                        {analytics.averageMonthlyContribution > 0 && (
                            <div className="text-xs text-muted-foreground">
                                Avg: ${analytics.averageMonthlyContribution.toFixed(0)}
                            </div>
                        )}
                    </div>
                </div>

                {/* Milestones Progress */}
                {analytics.milestones.length > 0 && (
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-medium text-muted-foreground">
                                Milestones
                            </span>
                            <span className="text-xs text-muted-foreground">
                                {analytics.completedMilestones} of {analytics.milestones.length}
                            </span>
                        </div>
                        <div className="flex gap-1">
                            {analytics.milestones.map((milestone) => (
                                <div
                                    key={milestone.id}
                                    className={`h-1.5 flex-1 rounded-full ${milestone.is_completed
                                            ? 'bg-green-500'
                                            : 'bg-gray-200 dark:bg-gray-700'
                                        }`}
                                    title={milestone.title}
                                />
                            ))}
                        </div>
                    </div>
                )}

                {/* Health Status */}
                <div className={`rounded-lg p-3 border ${healthColors[analytics.health]}`}>
                    <div className="flex items-start gap-2">
                        {analytics.health === 'excellent' || analytics.health === 'good' ? (
                            <CheckCircle className="h-4 w-4 shrink-0 mt-0.5" />
                        ) : (
                            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                        )}
                        <p className="text-xs flex-1">
                            {analytics.recommendation}
                        </p>
                    </div>
                </div>

                {/* Auto-Contribution Badge */}
                {goal.auto_contribute && (
                    <div className="flex items-center gap-2 text-xs">
                        <Badge variant="outline" className="text-xs">
                            <TrendingUp className="h-3 w-3 mr-1" />
                            Auto: ${goal.auto_contribute_amount} {goal.auto_contribute_frequency}
                        </Badge>
                    </div>
                )}

                {/* Action Button */}
                <Button
                    className="w-full"
                    size="sm"
                    onClick={(e) => {
                        e.stopPropagation();
                        onAddContribution?.(goal);
                    }}
                    style={{ backgroundColor: goal.color }}
                >
                    <DollarSign className="h-4 w-4 mr-2" />
                    Add Contribution
                </Button>
            </CardContent>
        </Card>
    );
}
