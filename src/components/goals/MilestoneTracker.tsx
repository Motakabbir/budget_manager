import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Circle, Target } from 'lucide-react';
import { GoalMilestone } from '@/lib/supabase/database.types';
import { format } from 'date-fns';

interface MilestoneTrackerProps {
    milestones: GoalMilestone[];
    goalProgress: number;
    className?: string;
}

export function MilestoneTracker({ milestones, goalProgress, className }: MilestoneTrackerProps) {
    // Sort milestones by percentage
    const sortedMilestones = [...milestones].sort((a, b) => a.milestone_percentage - b.milestone_percentage);

    return (
        <Card className={className}>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Milestones
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {sortedMilestones.map((milestone) => (
                        <MilestoneItem
                            key={milestone.id}
                            milestone={milestone}
                            goalProgress={goalProgress}
                        />
                    ))}
                </div>

                {sortedMilestones.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                        <Target className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p>No milestones set for this goal</p>
                        <p className="text-sm">Milestones will be created automatically</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

interface MilestoneItemProps {
    milestone: GoalMilestone;
    goalProgress: number;
}

function MilestoneItem({ milestone, goalProgress }: MilestoneItemProps) {
    const isAchieved = milestone.is_achieved;
    const isCurrent = !isAchieved && goalProgress >= milestone.milestone_percentage;

    return (
        <div className={`flex items-center space-x-3 p-3 rounded-lg border ${
            isAchieved
                ? 'bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800'
                : isCurrent
                ? 'bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-800'
                : 'bg-muted/50'
        }`}>
            <div className="flex-shrink-0">
                {isAchieved ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                    <Circle className={`h-5 w-5 ${
                        isCurrent ? 'text-blue-600' : 'text-muted-foreground'
                    }`} />
                )}
            </div>

            <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                    <h4 className={`font-medium text-sm ${
                        isAchieved ? 'text-green-800 dark:text-green-200' : ''
                    }`}>
                        {milestone.milestone_name}
                    </h4>
                    <Badge
                        variant={isAchieved ? 'default' : 'secondary'}
                        className="text-xs"
                    >
                        {milestone.milestone_percentage}%
                    </Badge>
                </div>

                <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                    <span>${milestone.target_amount.toLocaleString()}</span>
                    {isAchieved && milestone.achieved_date && (
                        <span className="text-green-600">
                            Achieved {format(new Date(milestone.achieved_date), 'MMM dd, yyyy')}
                        </span>
                    )}
                </div>

                <Progress
                    value={isAchieved ? 100 : Math.min(100, (goalProgress / milestone.milestone_percentage) * 100)}
                    className="h-1"
                />
            </div>
        </div>
    );
}

interface MilestoneProgressProps {
    milestones: GoalMilestone[];
    className?: string;
}

export function MilestoneProgress({ milestones, className }: MilestoneProgressProps) {
    const achievedCount = milestones.filter(m => m.is_achieved).length;
    const totalCount = milestones.length;
    const progressPercentage = totalCount > 0 ? (achievedCount / totalCount) * 100 : 0;

    return (
        <div className={`flex items-center space-x-2 ${className}`}>
            <div className="flex-1">
                <Progress value={progressPercentage} className="h-2" />
            </div>
            <span className="text-sm font-medium">
                {achievedCount}/{totalCount} milestones
            </span>
        </div>
    );
}

interface MilestoneCelebrationProps {
    milestone: GoalMilestone;
    onClose: () => void;
}

export function MilestoneCelebration({ milestone, onClose }: MilestoneCelebrationProps) {
    return (
        <Card className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/20">
            <CardContent className="p-6">
                <div className="text-center">
                    <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-green-800 dark:text-green-200 mb-2">
                        Milestone Achieved! 🎉
                    </h3>
                    <p className="text-green-700 dark:text-green-300 mb-4">
                        Congratulations! You've reached <strong>{milestone.milestone_name}</strong>
                    </p>
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 mb-4">
                        <div className="text-2xl font-bold text-green-600">
                            ${milestone.target_amount.toLocaleString()}
                        </div>
                        <div className="text-sm text-muted-foreground">
                            {milestone.milestone_percentage}% of your goal
                        </div>
                    </div>
                    <Button onClick={onClose} className="bg-green-600 hover:bg-green-700">
                        Continue Saving
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}