import { formatDistanceToNow } from 'date-fns';
import { X, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { Notification } from '@/lib/hooks/use-notifications';
import { useMarkNotificationAsRead, useDeleteNotification } from '@/lib/hooks/use-notifications';
import { useNavigate } from 'react-router-dom';

interface NotificationItemProps {
    notification: Notification;
}

const priorityStyles = {
    low: 'border-l-4 border-l-blue-500',
    normal: 'border-l-4 border-l-green-500',
    high: 'border-l-4 border-l-orange-500',
    urgent: 'border-l-4 border-l-red-500',
};

export function NotificationItem({ notification }: NotificationItemProps) {
    const navigate = useNavigate();
    const { mutate: markAsRead } = useMarkNotificationAsRead();
    const { mutate: deleteNotification } = useDeleteNotification();

    const handleClick = () => {
        if (!notification.is_read) {
            markAsRead(notification.id);
        }
        if (notification.action_url) {
            navigate(notification.action_url);
        }
    };

    const handleDelete = (e: React.MouseEvent) => {
        e.stopPropagation();
        deleteNotification(notification.id);
    };

    return (
        <div
            className={cn(
                'group relative p-4 hover:bg-accent/50 cursor-pointer transition-colors',
                priorityStyles[notification.priority],
                !notification.is_read && 'bg-accent/20'
            )}
            onClick={handleClick}
        >
            <div className="flex items-start gap-3">
                {/* Icon */}
                {notification.icon && (
                    <div className="text-2xl shrink-0">
                        {notification.icon}
                    </div>
                )}

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                        <h4 className={cn(
                            'text-sm font-medium truncate',
                            !notification.is_read && 'font-semibold'
                        )}>
                            {notification.title}
                        </h4>

                        {/* Delete button */}
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                            onClick={handleDelete}
                        >
                            <X className="h-3 w-3" />
                            <span className="sr-only">Delete notification</span>
                        </Button>
                    </div>

                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {notification.message}
                    </p>

                    <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                        </span>

                        {notification.action_url && (
                            <span className="text-xs text-primary flex items-center gap-1">
                                View details
                                <ExternalLink className="h-3 w-3" />
                            </span>
                        )}
                    </div>
                </div>

                {/* Unread indicator */}
                {!notification.is_read && (
                    <div className="h-2 w-2 rounded-full bg-primary shrink-0 mt-2" />
                )}
            </div>
        </div>
    );
}
