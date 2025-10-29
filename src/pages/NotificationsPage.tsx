import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Bell,
    Check,
    Filter,
    AlertCircle,
    Target,
    TrendingUp,
    Lightbulb,
    Trophy
} from 'lucide-react';
import { useNotifications, useMarkAllAsRead } from '@/lib/hooks/use-notifications';
import { NotificationItem } from '@/components/notifications/notification-item';
import { cn } from '@/lib/utils';

type NotificationFilter = 'all' | 'unread' | 'budget_alert' | 'goal_milestone' | 'tip' | 'achievement';

export default function NotificationsPage() {
    const [filter, setFilter] = useState<NotificationFilter>('all');
    const { data: notifications = [], isLoading } = useNotifications();
    const markAllAsReadMutation = useMarkAllAsRead(); const filteredNotifications = notifications.filter(notification => {
        if (filter === 'all') return true;
        if (filter === 'unread') return !notification.is_read;
        return notification.type === filter;
    });

    const unreadCount = notifications.filter(n => !n.is_read).length;
    const typeCount = (type: string) => notifications.filter(n => n.type === type).length;

    const handleMarkAllAsRead = () => {
        markAllAsReadMutation.mutate();
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'budget_alert': return <AlertCircle className="h-4 w-4" />;
            case 'goal_milestone': return <Target className="h-4 w-4" />;
            case 'spending_insight': return <TrendingUp className="h-4 w-4" />;
            case 'tip': return <Lightbulb className="h-4 w-4" />;
            case 'achievement': return <Trophy className="h-4 w-4" />;
            default: return <Bell className="h-4 w-4" />;
        }
    };

    const getTypeName = (type: string) => {
        switch (type) {
            case 'budget_alert': return 'Budget Alerts';
            case 'goal_milestone': return 'Goal Milestones';
            case 'spending_insight': return 'Spending Insights';
            case 'tip': return 'Tips';
            case 'achievement': return 'Achievements';
            default: return 'All';
        }
    };

    if (isLoading) {
        return (
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold">Notifications</h1>
                        <p className="text-muted-foreground">Stay updated with your financial activity</p>
                    </div>
                </div>
                <div className="grid gap-4">
                    {[1, 2, 3].map(i => (
                        <Card key={i}>
                            <CardContent className="p-6">
                                <div className="animate-pulse space-y-3">
                                    <div className="h-4 bg-muted rounded w-3/4"></div>
                                    <div className="h-3 bg-muted rounded w-full"></div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Notifications</h1>
                    <p className="text-muted-foreground">
                        Stay updated with your financial activity
                    </p>
                </div>
                <div className="flex gap-2">
                    {unreadCount > 0 && (
                        <Button
                            variant="outline"
                            onClick={handleMarkAllAsRead}
                            disabled={markAllAsReadMutation.isPending}
                        >
                            <Check className="h-4 w-4 mr-2" />
                            Mark all as read
                        </Button>
                    )}
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                <Card className={cn(
                    "cursor-pointer transition-colors hover:bg-accent",
                    filter === 'all' && "ring-2 ring-primary"
                )}
                    onClick={() => setFilter('all')}
                >
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">All</p>
                                <p className="text-2xl font-bold">{notifications.length}</p>
                            </div>
                            <Bell className="h-8 w-8 text-muted-foreground" />
                        </div>
                    </CardContent>
                </Card>

                <Card className={cn(
                    "cursor-pointer transition-colors hover:bg-accent",
                    filter === 'unread' && "ring-2 ring-primary"
                )}
                    onClick={() => setFilter('unread')}
                >
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Unread</p>
                                <p className="text-2xl font-bold">{unreadCount}</p>
                            </div>
                            <Badge className="h-8 w-8 flex items-center justify-center">
                                {unreadCount}
                            </Badge>
                        </div>
                    </CardContent>
                </Card>

                <Card className={cn(
                    "cursor-pointer transition-colors hover:bg-accent",
                    filter === 'budget_alert' && "ring-2 ring-primary"
                )}
                    onClick={() => setFilter('budget_alert')}
                >
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Budget</p>
                                <p className="text-2xl font-bold">{typeCount('budget_alert')}</p>
                            </div>
                            <AlertCircle className="h-8 w-8 text-orange-500" />
                        </div>
                    </CardContent>
                </Card>

                <Card className={cn(
                    "cursor-pointer transition-colors hover:bg-accent",
                    filter === 'goal_milestone' && "ring-2 ring-primary"
                )}
                    onClick={() => setFilter('goal_milestone')}
                >
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Goals</p>
                                <p className="text-2xl font-bold">{typeCount('goal_milestone')}</p>
                            </div>
                            <Target className="h-8 w-8 text-green-500" />
                        </div>
                    </CardContent>
                </Card>

                <Card className={cn(
                    "cursor-pointer transition-colors hover:bg-accent",
                    filter === 'tip' && "ring-2 ring-primary"
                )}
                    onClick={() => setFilter('tip')}
                >
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Tips</p>
                                <p className="text-2xl font-bold">{typeCount('tip')}</p>
                            </div>
                            <Lightbulb className="h-8 w-8 text-yellow-500" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Notifications List */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                {getTypeIcon(filter)}
                                {getTypeName(filter)}
                            </CardTitle>
                            <CardDescription>
                                {filteredNotifications.length} notification{filteredNotifications.length !== 1 ? 's' : ''}
                            </CardDescription>
                        </div>
                        <Button variant="ghost" size="sm">
                            <Filter className="h-4 w-4 mr-2" />
                            Filter
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    {filteredNotifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 px-4">
                            <Bell className="h-12 w-12 text-muted-foreground mb-4" />
                            <h3 className="text-lg font-semibold mb-2">No notifications</h3>
                            <p className="text-sm text-muted-foreground text-center">
                                {filter === 'unread'
                                    ? "You're all caught up! No unread notifications."
                                    : `No ${getTypeName(filter).toLowerCase()} at the moment.`
                                }
                            </p>
                        </div>
                    ) : (
                        <div className="divide-y">
                            {filteredNotifications.map((notification) => (
                                <NotificationItem
                                    key={notification.id}
                                    notification={notification}
                                />
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
