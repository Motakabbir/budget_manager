import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, Circle, Plus, Edit2, Trash2, Trophy } from 'lucide-react';
import type { GoalMilestone, EnhancedGoal } from '@/lib/services/financial-goals.service';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface MilestoneTrackerProps {
    goal: EnhancedGoal;
    milestones: GoalMilestone[];
    onAddMilestone?: () => void;
    onEditMilestone?: (milestone: GoalMilestone) => void;
    onDeleteMilestone?: (milestone: GoalMilestone) => void;
    onToggleComplete?: (milestone: GoalMilestone) => void;
}

export function MilestoneTracker({
    goal,
    milestones,
    onAddMilestone,
    onEditMilestone,
    onDeleteMilestone,
    onToggleComplete,
}: MilestoneTrackerProps) {
    const sortedMilestones = [...milestones].sort((a, b) => a.order_index - b.order_index);
    const completedCount = sortedMilestones.filter(m => m.is_completed).length;
    const progressPercentage = milestones.length > 0
        ? (completedCount / milestones.length) * 100
        : 0;

    if (milestones.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">Milestones</CardTitle>
                        <Button size="sm" onClick={onAddMilestone}>
                            <Plus className="h-4 w-4 mr-2" />
                            Add Milestone
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-8 text-muted-foreground">
                        <Trophy className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <p className="text-sm">No milestones yet</p>
                        <p className="text-xs mt-1">Break your goal into smaller achievements</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div className="flex-1">
                        <CardTitle className="text-lg">Milestones</CardTitle>
                        <div className="flex items-center gap-3 mt-2">
                            <Progress value={progressPercentage} className="h-2 flex-1" />
                            <span className="text-sm text-muted-foreground whitespace-nowrap">
                                {completedCount} of {milestones.length}
                            </span>
                        </div>
                    </div>
                    <Button size="sm" onClick={onAddMilestone}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                <div className="space-y-1">
                    {sortedMilestones.map((milestone, index) => {
                        const isCompleted = milestone.is_completed;
                        const currentProgress = (goal.current_amount / milestone.target_amount) * 100;
                        const isReached = goal.current_amount >= milestone.target_amount;

                        return (
                            <div
                                key={milestone.id}
                                className={cn(
                                    "group relative p-4 rounded-lg border transition-all",
                                    isCompleted && "bg-green-50 dark:bg-green-950/20 border-green-200",
                                    !isCompleted && isReached && "bg-blue-50 dark:bg-blue-950/20 border-blue-200",
                                    !isCompleted && !isReached && "bg-muted/30"
                                )}
                            >
                                {/* Connecting Line */}
                                {index < sortedMilestones.length - 1 && (
                                    <div
                                        className={cn(
                                            "absolute left-[19px] top-[52px] w-0.5 h-[calc(100%+4px)]",
                                            isCompleted ? "bg-green-400" : "bg-gray-300 dark:bg-gray-600"
                                        )}
                                    />
                                )}

                                <div className="flex items-start gap-3">
                                    {/* Status Icon */}
                                    <button
                                        onClick={() => onToggleComplete?.(milestone)}
                                        className="relative z-10 shrink-0 mt-0.5"
                                    >
                                        {isCompleted ? (
                                            <CheckCircle className="h-8 w-8 text-green-600 fill-green-100" />
                                        ) : isReached ? (
                                            <Circle className="h-8 w-8 text-blue-600 fill-blue-100" />
                                        ) : (
                                            <Circle className="h-8 w-8 text-gray-400" />
                                        )}
                                    </button>

                                    {/* Milestone Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-2 mb-2">
                                            <div className="flex-1">
                                                <h4 className={cn(
                                                    "font-medium",
                                                    isCompleted && "line-through text-muted-foreground"
                                                )}>
                                                    {milestone.title}
                                                </h4>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <Badge variant="outline" className="text-xs">
                                                        ${milestone.target_amount.toLocaleString()}
                                                    </Badge>
                                                    {isCompleted && milestone.completed_at && (
                                                        <span className="text-xs text-muted-foreground">
                                                            Completed {format(new Date(milestone.completed_at), 'MMM d, yyyy')}
                                                        </span>
                                                    )}
                                                    {!isCompleted && isReached && (
                                                        <Badge variant="secondary" className="text-xs">
                                                            Ready to complete!
                                                        </Badge>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Action Buttons */}
                                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-7 w-7"
                                                    onClick={() => onEditMilestone?.(milestone)}
                                                >
                                                    <Edit2 className="h-3 w-3" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-7 w-7 text-red-600"
                                                    onClick={() => onDeleteMilestone?.(milestone)}
                                                >
                                                    <Trash2 className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        </div>

                                        {/* Progress Bar for Incomplete Milestones */}
                                        {!isCompleted && (
                                            <div className="mt-2">
                                                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                                                    <span>${goal.current_amount.toLocaleString()}</span>
                                                    <span>{Math.min(currentProgress, 100).toFixed(0)}%</span>
                                                </div>
                                                <Progress
                                                    value={Math.min(currentProgress, 100)}
                                                    className="h-1.5"
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Celebration Badge for First Completion */}
                                {isCompleted && milestone.order_index === 0 && (
                                    <div className="absolute top-2 right-2">
                                        <Trophy className="h-4 w-4 text-yellow-600" />
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Completion Message */}
                {completedCount === milestones.length && milestones.length > 0 && (
                    <div className="mt-4 p-3 rounded-lg bg-green-100 dark:bg-green-950/30 border border-green-200 text-center">
                        <Trophy className="h-6 w-6 mx-auto mb-2 text-green-600" />
                        <p className="text-sm font-medium text-green-800 dark:text-green-200">
                            All milestones completed! 🎉
                        </p>
                        <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                            Keep going to reach your goal of ${goal.target_amount.toLocaleString()}
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
