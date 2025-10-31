import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';

export type NotificationType =
    | 'budget_alert'
    | 'budget_warning'
    | 'budget_exceeded'
    | 'goal_milestone'
    | 'goal_achieved'
    | 'goal_deadline'
    | 'spending_insight'
    | 'unusual_spending_detected'
    | 'low_balance_warning'
    | 'bill_reminder_3_days'
    | 'bill_reminder_1_day'
    | 'bill_reminder_today'
    | 'credit_card_payment_due'
    | 'loan_emi_reminder'
    | 'subscription_renewal'
    | 'tip'
    | 'achievement'
    | 'weekly_summary'
    | 'monthly_report';

export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent';

export type NotificationChannel = 'in-app' | 'email' | 'sms' | 'push';

export interface Notification {
    id: string;
    user_id: string;
    type: NotificationType;
    title: string;
    message: string;
    icon?: string;
    priority: NotificationPriority;
    channel: NotificationChannel;
    is_read: boolean;
    action_url?: string;
    metadata?: Record<string, unknown>;
    scheduled_for?: string;
    sent_at?: string;
    delivery_status: 'pending' | 'sent' | 'delivered' | 'failed';
    retry_count: number;
    external_id?: string;
    created_at: string;
    read_at?: string;
    expires_at?: string;
}

export interface NotificationPreferences {
    id: string;
    user_id: string;
    budget_alerts: boolean;
    goal_milestones: boolean;
    spending_insights: boolean;
    daily_tips: boolean;
    weekly_summary: boolean;
    email_notifications: boolean;
    push_notifications: boolean;
    sms_notifications: boolean;
    sms_phone_number?: string;
    low_balance_alerts: boolean;
    unusual_spending_alerts: boolean;
    bill_reminders: boolean;
    credit_card_due: boolean;
    loan_emi_reminders: boolean;
    subscription_renewals: boolean;
    notification_schedule: {
        morning: string;
        evening: string;
    };
    quiet_hours_start: string;
    quiet_hours_end: string;
    created_at: string;
    updated_at: string;
}

// Query keys
const notificationKeys = {
    all: ['notifications'] as const,
    unread: ['notifications', 'unread'] as const,
    preferences: ['notification-preferences'] as const,
};

// Fetch all notifications
export function useNotifications() {
    return useQuery({
        queryKey: notificationKeys.all,
        queryFn: async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            const { data, error } = await supabase
                .from('notifications')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(50);

            if (error) throw error;
            return data as Notification[];
        },
    });
}

// Get unread count
export function useUnreadNotificationsCount() {
    return useQuery({
        queryKey: notificationKeys.unread,
        queryFn: async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return 0;

            const { count, error } = await supabase
                .from('notifications')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', user.id)
                .eq('is_read', false);

            if (error) throw error;
            return count || 0;
        },
    });
}

// Mark notification as read
export function useMarkNotificationAsRead() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (notificationId: string) => {
            const { error } = await supabase
                .from('notifications')
                .update({
                    is_read: true,
                    read_at: new Date().toISOString()
                })
                .eq('id', notificationId);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: notificationKeys.all });
            queryClient.invalidateQueries({ queryKey: notificationKeys.unread });
        },
    });
}

// Mark all notifications as read
export function useMarkAllNotificationsAsRead() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            const { error } = await supabase
                .from('notifications')
                .update({
                    is_read: true,
                    read_at: new Date().toISOString()
                })
                .eq('user_id', user.id)
                .eq('is_read', false);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: notificationKeys.all });
            queryClient.invalidateQueries({ queryKey: notificationKeys.unread });
        },
    });
}

// Delete notification
export function useDeleteNotification() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (notificationId: string) => {
            const { error } = await supabase
                .from('notifications')
                .delete()
                .eq('id', notificationId);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: notificationKeys.all });
            queryClient.invalidateQueries({ queryKey: notificationKeys.unread });
        },
    });
}

// Fetch notification preferences
export function useNotificationPreferences() {
    return useQuery({
        queryKey: notificationKeys.preferences,
        queryFn: async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            const { data, error } = await supabase
                .from('notification_preferences')
                .select('*')
                .eq('user_id', user.id)
                .single();

            if (error) {
                // Create default preferences if not exists
                if (error.code === 'PGRST116') {
                    const { data: newPrefs, error: createError } = await supabase
                        .from('notification_preferences')
                        .insert({
                            user_id: user.id,
                            budget_alerts: true,
                            goal_milestones: true,
                            spending_insights: true,
                            daily_tips: false,
                            weekly_summary: true,
                            email_notifications: false,
                            push_notifications: false,
                        })
                        .select()
                        .single();

                    if (createError) throw createError;
                    return newPrefs as NotificationPreferences;
                }
                throw error;
            }

            return data as NotificationPreferences;
        },
    });
}

// Update notification preferences
export function useUpdateNotificationPreferences() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (preferences: Partial<NotificationPreferences>) => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            const { data, error } = await supabase
                .from('notification_preferences')
                .update({
                    ...preferences,
                    updated_at: new Date().toISOString(),
                })
                .eq('user_id', user.id)
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: notificationKeys.preferences });
        },
    });
}

// Create a notification
export function useCreateNotification() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (notification: Omit<Notification, 'id' | 'user_id' | 'created_at' | 'is_read' | 'delivery_status' | 'retry_count'>) => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            const { data, error } = await supabase
                .from('notifications')
                .insert({
                    ...notification,
                    user_id: user.id,
                    delivery_status: 'pending',
                    retry_count: 0,
                })
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: notificationKeys.all });
        },
    });
}

// Send notification via specific channel
export function useSendNotification() {
    return useMutation({
        mutationFn: async ({ notificationId, channel }: { notificationId: string; channel: NotificationChannel }) => {
            const { data, error } = await supabase.rpc('send_notification', {
                p_notification_id: notificationId,
                p_channel: channel,
            });

            if (error) throw error;
            return data;
        },
    });
}

// Get notification templates
export function useNotificationTemplates() {
    return useQuery({
        queryKey: ['notification-templates'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('notification_templates')
                .select('*')
                .eq('is_active', true);

            if (error) throw error;
            return data;
        },
    });
}

// Create scheduled notification
export function useCreateScheduledNotification() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (schedule: {
            template_type: string;
            schedule_config: Record<string, unknown>;
            next_run: string;
        }) => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            const { data, error } = await supabase
                .from('notification_schedules')
                .insert({
                    ...schedule,
                    user_id: user.id,
                })
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notification-schedules'] });
        },
    });
}

// Get user's scheduled notifications
export function useScheduledNotifications() {
    return useQuery({
        queryKey: ['notification-schedules'],
        queryFn: async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            const { data, error } = await supabase
                .from('notification_schedules')
                .select('*')
                .eq('user_id', user.id)
                .eq('is_active', true);

            if (error) throw error;
            return data;
        },
    });
}

// Update spending patterns (for unusual spending detection)
export function useUpdateSpendingPatterns() {
    return useMutation({
        mutationFn: async ({ categoryId, amount }: { categoryId: string; amount: number }) => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            const { data, error } = await supabase.rpc('update_spending_patterns', {
                p_user_id: user.id,
                p_category_id: categoryId,
                p_amount: amount,
            });

            if (error) throw error;
            return data;
        },
    });
}

// Detect unusual spending
export function useDetectUnusualSpending() {
    return useMutation({
        mutationFn: async ({ categoryId, amount }: { categoryId: string; amount: number }) => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            const { data, error } = await supabase.rpc('detect_unusual_spending', {
                p_user_id: user.id,
                p_category_id: categoryId,
                p_amount: amount,
            });

            if (error) throw error;
            return data as boolean;
        },
    });
}

// Get notifications by type
export function useNotificationsByType(type: NotificationType) {
    return useQuery({
        queryKey: [...notificationKeys.all, 'type', type],
        queryFn: async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            const { data, error } = await supabase
                .from('notifications')
                .select('*')
                .eq('user_id', user.id)
                .eq('type', type)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data as Notification[];
        },
    });
}

// Get unread notifications count by type
export function useUnreadNotificationsCountByType(type: NotificationType) {
    return useQuery({
        queryKey: [...notificationKeys.all, 'unread', 'type', type],
        queryFn: async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            const { count, error } = await supabase
                .from('notifications')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', user.id)
                .eq('type', type)
                .eq('is_read', false);

            if (error) throw error;
            return count || 0;
        },
    });
}

// Bulk create notifications
export function useBulkCreateNotifications() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (notifications: Omit<Notification, 'id' | 'user_id' | 'created_at' | 'is_read' | 'delivery_status' | 'retry_count'>[]) => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            const notificationsWithUser = notifications.map(notification => ({
                ...notification,
                user_id: user.id,
                delivery_status: 'pending' as const,
                retry_count: 0,
            }));

            const { data, error } = await supabase
                .from('notifications')
                .insert(notificationsWithUser)
                .select();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: notificationKeys.all });
        },
    });
}

// Aliases for convenience
export const useMarkAllAsRead = useMarkAllNotificationsAsRead;
export const useSaveNotificationPreferences = useUpdateNotificationPreferences;
