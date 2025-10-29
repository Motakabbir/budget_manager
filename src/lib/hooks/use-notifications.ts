import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';

export type NotificationType =
    | 'budget_alert'
    | 'budget_warning'
    | 'goal_milestone'
    | 'goal_achieved'
    | 'goal_deadline'
    | 'spending_insight'
    | 'tip'
    | 'achievement';

export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent';

export interface Notification {
    id: string;
    user_id: string;
    type: NotificationType;
    title: string;
    message: string;
    icon?: string;
    priority: NotificationPriority;
    is_read: boolean;
    action_url?: string;
    metadata?: Record<string, any>;
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
