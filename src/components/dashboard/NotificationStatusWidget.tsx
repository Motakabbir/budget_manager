import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bell, BellOff, Settings, CheckCircle2, XCircle } from 'lucide-react';
import { useNotificationPreferences } from '@/lib/hooks/use-notifications';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';

export function NotificationStatusWidget() {
    const { data: preferences, isLoading } = useNotificationPreferences();

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Bell className="h-5 w-5" />
                        Notification Settings
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="animate-pulse space-y-3">
                        <div className="h-4 bg-muted rounded w-3/4"></div>
                        <div className="h-4 bg-muted rounded w-1/2"></div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    const activeCount = preferences ? Object.values(preferences).filter(Boolean).length - 2 : 0; // Exclude id and user_id
    const totalSettings = 7; // Total notification types

    const isAnyActive = activeCount > 0;

    return (
        <Card className="border-2 border-blue-200 dark:border-blue-900">
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-lg">
                        {isAnyActive ? (
                            <Bell className="h-5 w-5 text-blue-600 animate-pulse" />
                        ) : (
                            <BellOff className="h-5 w-5 text-muted-foreground" />
                        )}
                        Notifications
                    </CardTitle>
                    <Badge variant={isAnyActive ? "default" : "secondary"} className={isAnyActive ? "bg-blue-600" : ""}>
                        {isAnyActive ? `${activeCount} Active` : 'Inactive'}
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2">
                            {preferences?.budget_alerts ? (
                                <CheckCircle2 className="h-4 w-4 text-green-600" />
                            ) : (
                                <XCircle className="h-4 w-4 text-muted-foreground" />
                            )}
                            Budget Alerts
                        </span>
                        <span className={preferences?.budget_alerts ? "text-green-600 font-medium" : "text-muted-foreground"}>
                            {preferences?.budget_alerts ? 'On' : 'Off'}
                        </span>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2">
                            {preferences?.goal_milestones ? (
                                <CheckCircle2 className="h-4 w-4 text-green-600" />
                            ) : (
                                <XCircle className="h-4 w-4 text-muted-foreground" />
                            )}
                            Goal Milestones
                        </span>
                        <span className={preferences?.goal_milestones ? "text-green-600 font-medium" : "text-muted-foreground"}>
                            {preferences?.goal_milestones ? 'On' : 'Off'}
                        </span>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2">
                            {preferences?.spending_insights ? (
                                <CheckCircle2 className="h-4 w-4 text-green-600" />
                            ) : (
                                <XCircle className="h-4 w-4 text-muted-foreground" />
                            )}
                            Spending Insights
                        </span>
                        <span className={preferences?.spending_insights ? "text-green-600 font-medium" : "text-muted-foreground"}>
                            {preferences?.spending_insights ? 'On' : 'Off'}
                        </span>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2">
                            {preferences?.weekly_summary ? (
                                <CheckCircle2 className="h-4 w-4 text-green-600" />
                            ) : (
                                <XCircle className="h-4 w-4 text-muted-foreground" />
                            )}
                            Weekly Summary
                        </span>
                        <span className={preferences?.weekly_summary ? "text-green-600 font-medium" : "text-muted-foreground"}>
                            {preferences?.weekly_summary ? 'On' : 'Off'}
                        </span>
                    </div>
                </div>

                <div className="pt-2 border-t">
                    <Button
                        asChild
                        variant="outline"
                        className="w-full"
                        size="sm"
                    >
                        <Link to="/settings">
                            <Settings className="h-4 w-4 mr-2" />
                            Manage Settings
                        </Link>
                    </Button>
                </div>

                {!isAnyActive && (
                    <div className="rounded-lg bg-muted p-3">
                        <p className="text-xs text-muted-foreground text-center">
                            Enable notifications to stay updated on your budget and goals
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
