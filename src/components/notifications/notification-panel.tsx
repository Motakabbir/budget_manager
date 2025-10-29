import { Bell, Check, Settings, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
    DropdownMenuItem,
    DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { NotificationItem } from './notification-item';
import {
    useNotifications,
    useUnreadNotificationsCount,
    useMarkAllNotificationsAsRead
} from '@/lib/hooks/use-notifications';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export function NotificationPanel() {
    const navigate = useNavigate();
    const [open, setOpen] = useState(false);
    const { data: notifications = [], isLoading } = useNotifications();
    const { data: unreadCount = 0 } = useUnreadNotificationsCount();
    const { mutate: markAllAsRead } = useMarkAllNotificationsAsRead();

    const unreadNotifications = notifications.filter(n => !n.is_read);
    const readNotifications = notifications.filter(n => n.is_read);

    const handleMarkAllAsRead = () => {
        markAllAsRead();
    };

    return (
        <DropdownMenu open={open} onOpenChange={setOpen}>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="relative hover:bg-accent"
                >
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <Badge
                            variant="destructive"
                            className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs animate-pulse"
                        >
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </Badge>
                    )}
                    <span className="sr-only">Notifications</span>
                </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
                align="end"
                className="w-[400px] md:w-[480px] p-0"
                sideOffset={8}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b">
                    <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-lg">Notifications</h3>
                        {unreadCount > 0 && (
                            <Badge variant="secondary">
                                {unreadCount} new
                            </Badge>
                        )}
                    </div>

                    <div className="flex items-center gap-1">
                        {unreadCount > 0 && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleMarkAllAsRead}
                                className="h-8 text-xs"
                            >
                                <Check className="h-3 w-3 mr-1" />
                                Mark all read
                            </Button>
                        )}

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <Settings className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => {
                                    setOpen(false);
                                    navigate('/settings?tab=notifications');
                                }}>
                                    <Settings className="h-4 w-4 mr-2" />
                                    Notification Settings
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                    className="text-destructive"
                                    onClick={handleMarkAllAsRead}
                                >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Clear all
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>

                {/* Tabs */}
                <Tabs defaultValue="all" className="w-full">
                    <div className="px-4 pt-2">
                        <TabsList className="w-full grid grid-cols-3">
                            <TabsTrigger value="all" className="text-xs">
                                All ({notifications.length})
                            </TabsTrigger>
                            <TabsTrigger value="unread" className="text-xs">
                                Unread ({unreadNotifications.length})
                            </TabsTrigger>
                            <TabsTrigger value="read" className="text-xs">
                                Read ({readNotifications.length})
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    {/* All Notifications */}
                    <TabsContent value="all" className="m-0">
                        <ScrollArea className="h-[400px]">
                            {isLoading ? (
                                <div className="flex items-center justify-center h-40">
                                    <p className="text-sm text-muted-foreground">Loading...</p>
                                </div>
                            ) : notifications.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-40 gap-2">
                                    <Bell className="h-8 w-8 text-muted-foreground/50" />
                                    <p className="text-sm text-muted-foreground">No notifications yet</p>
                                </div>
                            ) : (
                                <div className="divide-y">
                                    {notifications.map((notification) => (
                                        <NotificationItem
                                            key={notification.id}
                                            notification={notification}
                                        />
                                    ))}
                                </div>
                            )}
                        </ScrollArea>
                    </TabsContent>

                    {/* Unread Notifications */}
                    <TabsContent value="unread" className="m-0">
                        <ScrollArea className="h-[400px]">
                            {unreadNotifications.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-40 gap-2">
                                    <Check className="h-8 w-8 text-green-500" />
                                    <p className="text-sm text-muted-foreground">All caught up!</p>
                                </div>
                            ) : (
                                <div className="divide-y">
                                    {unreadNotifications.map((notification) => (
                                        <NotificationItem
                                            key={notification.id}
                                            notification={notification}
                                        />
                                    ))}
                                </div>
                            )}
                        </ScrollArea>
                    </TabsContent>

                    {/* Read Notifications */}
                    <TabsContent value="read" className="m-0">
                        <ScrollArea className="h-[400px]">
                            {readNotifications.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-40 gap-2">
                                    <Bell className="h-8 w-8 text-muted-foreground/50" />
                                    <p className="text-sm text-muted-foreground">No read notifications</p>
                                </div>
                            ) : (
                                <div className="divide-y">
                                    {readNotifications.map((notification) => (
                                        <NotificationItem
                                            key={notification.id}
                                            notification={notification}
                                        />
                                    ))}
                                </div>
                            )}
                        </ScrollArea>
                    </TabsContent>
                </Tabs>

                <Separator />

                {/* Footer */}
                <div className="p-2">
                    <Button
                        variant="ghost"
                        className="w-full justify-center text-sm"
                        onClick={() => {
                            setOpen(false);
                            navigate('/notifications');
                        }}
                    >
                        View all notifications
                    </Button>
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
