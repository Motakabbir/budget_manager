import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useGetAutoContributionSchedule, useProcessAutoContributions } from '@/lib/hooks/use-budget-queries';
import { format, parseISO, isAfter, addWeeks, addMonths } from 'date-fns';
import { RefreshCw, Calendar, DollarSign, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';

export function AutoContributionManager() {
    const { data: schedule, isLoading, refetch } = useGetAutoContributionSchedule();
    const processContributions = useProcessAutoContributions();

    const handleProcessContributions = async () => {
        try {
            const result = await processContributions.mutateAsync();
            if (result.successful > 0) {
                toast.success(`Processed ${result.successful} auto-contributions totaling $${result.totalAmount.toFixed(2)}`);
                refetch();
            } else {
                toast.info('No auto-contributions were due at this time');
            }
        } catch {
            toast.error('Failed to process auto-contributions');
        }
    };

    const getNextContributionDate = (lastDate: string | null, frequency: string) => {
        if (!lastDate) return new Date();

        const baseDate = parseISO(lastDate);

        switch (frequency) {
            case 'weekly':
                return addWeeks(baseDate, 1);
            case 'bi-weekly':
                return addWeeks(baseDate, 2);
            case 'monthly':
                return addMonths(baseDate, 1);
            case 'quarterly':
                return addMonths(baseDate, 3);
            default:
                return addMonths(baseDate, 1);
        }
    };

    const getStatusColor = (nextDate: Date) => {
        const now = new Date();
        const daysUntil = Math.ceil((nextDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

        if (daysUntil <= 0) return 'bg-red-500';
        if (daysUntil <= 2) return 'bg-yellow-500';
        return 'bg-green-500';
    };

    const getStatusText = (nextDate: Date) => {
        const now = new Date();
        const daysUntil = Math.ceil((nextDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

        if (daysUntil <= 0) return 'Due now';
        if (daysUntil === 1) return 'Due tomorrow';
        return `Due in ${daysUntil} days`;
    };

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <RefreshCw className="h-5 w-5 animate-spin" />
                        Auto-Contribution Manager
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-8 text-muted-foreground">
                        Loading auto-contribution schedule...
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (!schedule || schedule.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5" />
                        Auto-Contribution Manager
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-8 text-muted-foreground">
                        <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p className="text-lg font-medium mb-2">No Auto-Contributions Set Up</p>
                        <p className="text-sm">
                            Enable auto-contribution on your savings goals to automatically save money over time.
                        </p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5" />
                        Auto-Contribution Manager
                    </CardTitle>
                    <Button
                        onClick={handleProcessContributions}
                        disabled={processContributions.isPending}
                        size="sm"
                    >
                        {processContributions.isPending ? (
                            <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                            <RefreshCw className="h-4 w-4 mr-2" />
                        )}
                        Process Due Contributions
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {schedule.map((item) => {
                    const nextDate = getNextContributionDate(item.lastContribution, item.frequency);
                    const isOverdue = isAfter(new Date(), nextDate);

                    return (
                        <div key={item.goalId} className="border rounded-lg p-4 space-y-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div>
                                        <h4 className="font-medium">{item.goalName}</h4>
                                        <p className="text-sm text-muted-foreground">
                                            ${item.amount.toFixed(2)} {item.frequency}
                                        </p>
                                    </div>
                                </div>
                                <Badge
                                    variant={isOverdue ? "destructive" : "secondary"}
                                    className={getStatusColor(nextDate)}
                                >
                                    {getStatusText(nextDate)}
                                </Badge>
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span>Progress</span>
                                    <span>{item.progress.toFixed(1)}%</span>
                                </div>
                                <Progress value={Math.min(item.progress, 100)} className="h-2" />
                            </div>

                            <div className="flex items-center justify-between text-sm text-muted-foreground">
                                <div className="flex items-center gap-1">
                                    <Calendar className="h-4 w-4" />
                                    <span>
                                        Last: {item.lastContribution
                                            ? format(parseISO(item.lastContribution), 'MMM dd, yyyy')
                                            : 'Never'
                                        }
                                    </span>
                                </div>
                                <div>
                                    Next: {format(nextDate, 'MMM dd, yyyy')}
                                </div>
                            </div>
                        </div>
                    );
                })}

                <div className="pt-4 border-t">
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                            {schedule.length} active auto-contribution{schedule.length !== 1 ? 's' : ''}
                        </span>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => refetch()}
                            disabled={isLoading}
                        >
                            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}