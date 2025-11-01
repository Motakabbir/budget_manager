/**
 * NotificationsPage Component
 * 
 * Comprehensive notification center with filtering, marking, and deletion
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Bell,
    CheckCheck,
    Trash2,
    AlertTriangle,
    TrendingUp,
    CreditCard,
    Target,
    Calendar,
    DollarSign,
    RefreshCw,
    Filter,
    Check,
    X,
    Clock,
    Mail,
    Smartphone,
    Info,
} from 'lucide-react';
import {
    useNotifications,
    useUnreadNotificationsCount,
    useMarkNotificationAsRead,
    useMarkAllNotificationsAsRead,
    useDeleteNotification,
    type Notification,
    type NotificationPriority,
} from '@/lib/hooks/use-notifications';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

// Icon mapping for notification types
const notificationIcons: Record<string, React.ComponentType<{ className?: string }>> = {
    budget_alert: AlertTriangle,
    budget_warning: AlertTriangle,
    budget_exceeded: AlertTriangle,
    goal_milestone: Target,
    goal_achieved: Target,
    goal_deadline: Target,
    spending_insight: TrendingUp,
    unusual_spending_detected: AlertTriangle,
    low_balance_warning: DollarSign,
    bill_reminder_3_days: Calendar,
    bill_reminder_1_day: Calendar,
    bill_reminder_today: Calendar,
    credit_card_payment_due: CreditCard,
    loan_emi_reminder: DollarSign,
    subscription_renewal: RefreshCw,
    tip: Info,
    achievement: Target,
    weekly_summary: TrendingUp,
    monthly_report: TrendingUp,
};

// Priority colors
const priorityColors: Record<NotificationPriority, string> = {
    urgent: 'bg-red-500',
    high: 'bg-orange-500',
    normal: 'bg-blue-500',
    low: 'bg-gray-500',
};

// Channel icons
const channelIcons: Record<string, React.ComponentType<{ className?: string }>> = {
    'in-app': Bell,
    email: Mail,
    sms: Smartphone,
    push: Bell,
};

export default function NotificationsPage() {
    const [activeTab, setActiveTab] = useState<'all' | 'unread' | 'read'>('all');
    const [filterPriority, setFilterPriority] = useState<string>('all');
    const [filterType, setFilterType] = useState<string>('all');

    const { data: notifications, isLoading } = useNotifications();
    const { data: unreadCount } = useUnreadNotificationsCount();
    const { mutate: markAsRead } = useMarkNotificationAsRead();
    const { mutate: markAllAsRead, isPending: isMarkingAll } = useMarkAllNotificationsAsRead();
    const { mutate: deleteNotification, isPending: isDeleting } = useDeleteNotification();

    // Filter notifications based on active tab and filters
    const filteredNotifications = notifications?.filter((notification) => {
        // Tab filter
        if (activeTab === 'unread' && notification.is_read) return false;
        if (activeTab === 'read' && !notification.is_read) return false;

        // Priority filter
        if (filterPriority !== 'all' && notification.priority !== filterPriority) return false;

        // Type filter
        if (filterType !== 'all' && notification.type !== filterType) return false;

        return true;
    });

    const handleMarkAsRead = (id: string) => {
        markAsRead(id, {
            onSuccess: () => {
                toast.success('Notification marked as read');
            },
            onError: () => {
                toast.error('Failed to mark notification as read');
            },
        });
    };

    const handleMarkAllAsRead = () => {
        markAllAsRead(undefined, {
            onSuccess: () => {
                toast.success('All notifications marked as read');
            },
            onError: () => {
                toast.error('Failed to mark all notifications as read');
            },
        });
    };

    const handleDelete = (id: string) => {
        deleteNotification(id, {
            onSuccess: () => {
                toast.success('Notification deleted');
            },
            onError: () => {
                toast.error('Failed to delete notification');
            },
        });
    };

    const getNotificationIcon = (type: string) => {
        const IconComponent = notificationIcons[type] || Bell;
        return IconComponent;
    };

    const getChannelIcon = (channel: string) => {
        const IconComponent = channelIcons[channel] || Bell;
        return IconComponent;
    };

    const formatTimeAgo = (date: string) => {
        try {
            return formatDistanceToNow(new Date(date), { addSuffix: true });
        } catch {
            return 'Recently';
        }
    };

    if (isLoading) {
        return (
            <div className="container mx-auto p-6 max-w-7xl">
                <div className="space-y-4">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />
                    ))}
                </div>
            </div>
        );
    }

    const unreadNotifications = notifications?.filter((n) => !n.is_read) || [];
    const readNotifications = notifications?.filter((n) => n.is_read) || [];

    return (
        <div className="container mx-auto p-6 max-w-7xl space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                        <Bell className="h-8 w-8" />
                        Notifications
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Stay updated with your financial alerts and insights
                    </p>
                </div>
                {unreadCount! > 0 && (
                    <Button
                        onClick={handleMarkAllAsRead}
                        disabled={isMarkingAll}
                        variant="outline"
                    >
                        <CheckCheck className="mr-2 h-4 w-4" />
                        Mark All as Read ({unreadCount})
                    </Button>
                )}
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Notifications</CardTitle>
                        <Bell className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{notifications?.length || 0}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Unread</CardTitle>
                        <AlertTriangle className="h-4 w-4 text-orange-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-orange-600">
                            {unreadNotifications.length}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Read</CardTitle>
                        <Check className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">
                            {readNotifications.length}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Filter className="h-5 w-5" />
                        Filters
                    </CardTitle>
                    <CardDescription>Filter notifications by priority and type</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1">
                        <label className="text-sm font-medium mb-2 block">Priority</label>
                        <Select value={filterPriority} onValueChange={setFilterPriority}>
                            <SelectTrigger>
                                <SelectValue placeholder="All Priorities" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Priorities</SelectItem>
                                <SelectItem value="urgent">Urgent</SelectItem>
                                <SelectItem value="high">High</SelectItem>
                                <SelectItem value="normal">Normal</SelectItem>
                                <SelectItem value="low">Low</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex-1">
                        <label className="text-sm font-medium mb-2 block">Type</label>
                        <Select value={filterType} onValueChange={setFilterType}>
                            <SelectTrigger>
                                <SelectValue placeholder="All Types" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Types</SelectItem>
                                <SelectItem value="budget_alert">Budget Alerts</SelectItem>
                                <SelectItem value="unusual_spending_detected">Unusual Spending</SelectItem>
                                <SelectItem value="low_balance_warning">Low Balance</SelectItem>
                                <SelectItem value="bill_reminder_today">Bill Reminders</SelectItem>
                                <SelectItem value="credit_card_payment_due">Card Payments</SelectItem>
                                <SelectItem value="loan_emi_reminder">Loan EMI</SelectItem>
                                <SelectItem value="goal_milestone">Goal Milestones</SelectItem>
                                <SelectItem value="subscription_renewal">Subscriptions</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Notifications List with Tabs */}
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="all">
                        All ({notifications?.length || 0})
                    </TabsTrigger>
                    <TabsTrigger value="unread">
                        Unread ({unreadNotifications.length})
                    </TabsTrigger>
                    <TabsTrigger value="read">
                        Read ({readNotifications.length})
                    </TabsTrigger>
                </TabsList>

                <TabsContent value={activeTab} className="space-y-4 mt-4">
                    {!filteredNotifications || filteredNotifications.length === 0 ? (
                        <Card>
                            <CardContent className="flex flex-col items-center justify-center py-12">
                                <Bell className="h-12 w-12 text-muted-foreground mb-4" />
                                <h3 className="text-lg font-semibold mb-2">No notifications</h3>
                                <p className="text-muted-foreground text-center">
                                    {activeTab === 'unread'
                                        ? "You're all caught up! No unread notifications."
                                        : activeTab === 'read'
                                            ? 'No read notifications yet.'
                                            : 'No notifications to display.'}
                                </p>
                            </CardContent>
                        </Card>
                    ) : (
                        filteredNotifications.map((notification) => (
                            <NotificationCard
                                key={notification.id}
                                notification={notification}
                                onMarkAsRead={handleMarkAsRead}
                                onDelete={handleDelete}
                                getIcon={getNotificationIcon}
                                getChannelIcon={getChannelIcon}
                                formatTimeAgo={formatTimeAgo}
                                isDeleting={isDeleting}
                            />
                        ))
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
}

// Notification Card Component
interface NotificationCardProps {
    notification: Notification;
    onMarkAsRead: (id: string) => void;
    onDelete: (id: string) => void;
    getIcon: (type: string) => React.ComponentType<{ className?: string }>;
    getChannelIcon: (channel: string) => React.ComponentType<{ className?: string }>;
    formatTimeAgo: (date: string) => string;
    isDeleting: boolean;
}

function NotificationCard({
    notification,
    onMarkAsRead,
    onDelete,
    getIcon,
    getChannelIcon,
    formatTimeAgo,
    isDeleting,
}: NotificationCardProps) {
    const Icon = getIcon(notification.type);
    const ChannelIcon = getChannelIcon(notification.channel);

    return (
        <Card
            className={cn(
                'transition-all hover:shadow-md',
                !notification.is_read && 'border-l-4 border-l-blue-500 bg-blue-50/50 dark:bg-blue-950/20'
            )}
        >
            <CardContent className="p-4 sm:p-6">
                <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div
                        className={cn(
                            'p-2 rounded-lg shrink-0',
                            notification.priority === 'urgent' && 'bg-red-100 dark:bg-red-950',
                            notification.priority === 'high' && 'bg-orange-100 dark:bg-orange-950',
                            notification.priority === 'normal' && 'bg-blue-100 dark:bg-blue-950',
                            notification.priority === 'low' && 'bg-gray-100 dark:bg-gray-800'
                        )}
                    >
                        <Icon
                            className={cn(
                                'h-5 w-5',
                                notification.priority === 'urgent' && 'text-red-600',
                                notification.priority === 'high' && 'text-orange-600',
                                notification.priority === 'normal' && 'text-blue-600',
                                notification.priority === 'low' && 'text-gray-600'
                            )}
                        />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="flex-1">
                                <h3 className="font-semibold text-base mb-1">{notification.title}</h3>
                                <div className="flex flex-wrap items-center gap-2 mb-2">
                                    <Badge
                                        variant="secondary"
                                        className={cn('text-xs', priorityColors[notification.priority])}
                                    >
                                        {notification.priority.toUpperCase()}
                                    </Badge>
                                    <Badge variant="outline" className="text-xs">
                                        <ChannelIcon className="h-3 w-3 mr-1" />
                                        {notification.channel}
                                    </Badge>
                                    {!notification.is_read && (
                                        <Badge variant="default" className="text-xs bg-blue-500">
                                            New
                                        </Badge>
                                    )}
                                </div>
                            </div>
                        </div>

                        <p className="text-sm text-muted-foreground mb-3">{notification.message}</p>

                        <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center text-xs text-muted-foreground">
                                <Clock className="h-3 w-3 mr-1" />
                                {formatTimeAgo(notification.created_at)}
                            </div>

                            <div className="flex items-center gap-2">
                                {!notification.is_read && (
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => onMarkAsRead(notification.id)}
                                    >
                                        <Check className="h-4 w-4 mr-1" />
                                        Mark Read
                                    </Button>
                                )}
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => onDelete(notification.id)}
                                    disabled={isDeleting}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}