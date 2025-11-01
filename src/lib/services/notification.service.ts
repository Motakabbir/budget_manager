/**
 * Notification Service
 * 
 * Comprehensive service layer for managing notifications including
 * creation, fetching, updating, and smart alert generation
 */

import { supabase } from '@/lib/supabase/client';
import type { 
    Notification, 
    NotificationType, 
    NotificationPriority,
    NotificationChannel 
} from '@/lib/hooks/use-notifications';

// =====================================================
// TYPES & INTERFACES
// =====================================================

export interface CreateNotificationParams {
    type: NotificationType;
    title: string;
    message: string;
    priority?: NotificationPriority;
    channel?: NotificationChannel;
    icon?: string;
    action_url?: string;
    metadata?: Record<string, unknown>;
    scheduled_for?: string;
}

export interface UpdateNotificationParams {
    is_read?: boolean;
    delivery_status?: 'pending' | 'sent' | 'delivered' | 'failed';
    sent_at?: string;
    read_at?: string;
}

export interface NotificationFilters {
    is_read?: boolean;
    priority?: NotificationPriority;
    type?: NotificationType;
    channel?: NotificationChannel;
    limit?: number;
}

// =====================================================
// CORE NOTIFICATION FUNCTIONS
// =====================================================

/**
 * Create a new notification
 */
export async function createNotification(
    params: CreateNotificationParams
): Promise<Notification | null> {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            throw new Error('User not authenticated');
        }

        const { data, error } = await supabase
            .from('notifications')
            .insert({
                user_id: user.id,
                type: params.type,
                title: params.title,
                message: params.message,
                priority: params.priority || 'normal',
                channel: params.channel || 'in-app',
                icon: params.icon,
                action_url: params.action_url,
                metadata: params.metadata,
                scheduled_for: params.scheduled_for,
                is_read: false,
                delivery_status: 'pending',
                retry_count: 0,
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error creating notification:', error);
        return null;
    }
}

/**
 * Get all notifications for current user
 */
export async function getNotifications(
    filters?: NotificationFilters
): Promise<Notification[]> {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');

        let query = supabase
            .from('notifications')
            .select('*')
            .eq('user_id', user.id);

        // Apply filters
        if (filters?.is_read !== undefined) {
            query = query.eq('is_read', filters.is_read);
        }
        if (filters?.priority) {
            query = query.eq('priority', filters.priority);
        }
        if (filters?.type) {
            query = query.eq('type', filters.type);
        }
        if (filters?.channel) {
            query = query.eq('channel', filters.channel);
        }

        query = query
            .order('created_at', { ascending: false })
            .limit(filters?.limit || 50);

        const { data, error } = await query;
        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Error fetching notifications:', error);
        return [];
    }
}

/**
 * Get unread notification count
 */
export async function getUnreadCount(): Promise<number> {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return 0;

        const { count, error } = await supabase
            .from('notifications')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .eq('is_read', false);

        if (error) throw error;
        return count || 0;
    } catch (error) {
        console.error('Error getting unread count:', error);
        return 0;
    }
}

/**
 * Mark notification as read
 */
export async function markAsRead(notificationId: string): Promise<boolean> {
    try {
        const { error } = await supabase
            .from('notifications')
            .update({ 
                is_read: true, 
                read_at: new Date().toISOString() 
            })
            .eq('id', notificationId);

        if (error) throw error;
        return true;
    } catch (error) {
        console.error('Error marking notification as read:', error);
        return false;
    }
}

/**
 * Mark all notifications as read
 */
export async function markAllAsRead(): Promise<boolean> {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');

        const { error } = await supabase
            .from('notifications')
            .update({ 
                is_read: true, 
                read_at: new Date().toISOString() 
            })
            .eq('user_id', user.id)
            .eq('is_read', false);

        if (error) throw error;
        return true;
    } catch (error) {
        console.error('Error marking all as read:', error);
        return false;
    }
}

/**
 * Delete notification
 */
export async function deleteNotification(notificationId: string): Promise<boolean> {
    try {
        const { error } = await supabase
            .from('notifications')
            .delete()
            .eq('id', notificationId);

        if (error) throw error;
        return true;
    } catch (error) {
        console.error('Error deleting notification:', error);
        return false;
    }
}

/**
 * Delete all read notifications
 */
export async function deleteAllRead(): Promise<boolean> {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');

        const { error } = await supabase
            .from('notifications')
            .delete()
            .eq('user_id', user.id)
            .eq('is_read', true);

        if (error) throw error;
        return true;
    } catch (error) {
        console.error('Error deleting read notifications:', error);
        return false;
    }
}

// =====================================================
// SMART NOTIFICATION GENERATORS
// =====================================================

/**
 * Create low balance alert
 */
export async function createLowBalanceAlert(
    accountName: string,
    currentBalance: number,
    threshold: number = 100
): Promise<Notification | null> {
    if (currentBalance > threshold) return null;

    return createNotification({
        type: 'low_balance_warning',
        title: '💰 Low Balance Alert',
        message: `Your ${accountName} account balance is $${currentBalance.toFixed(2)}. Consider transferring funds to avoid overdraft fees.`,
        priority: currentBalance < 50 ? 'urgent' : 'high',
        channel: 'in-app',
        metadata: {
            account_name: accountName,
            current_balance: currentBalance,
            threshold,
        },
    });
}

/**
 * Create unusual spending alert
 */
export async function createUnusualSpendingAlert(
    categoryName: string,
    amount: number,
    averageAmount: number,
    percentageOver: number
): Promise<Notification | null> {
    return createNotification({
        type: 'unusual_spending_detected',
        title: '🔍 Unusual Spending Detected',
        message: `We detected unusual spending of $${amount.toFixed(2)} in ${categoryName} category. This is ${percentageOver.toFixed(0)}% higher than your average of $${averageAmount.toFixed(2)}.`,
        priority: 'high',
        channel: 'in-app',
        metadata: {
            category: categoryName,
            amount,
            average_amount: averageAmount,
            percentage: percentageOver,
        },
    });
}

/**
 * Create budget exceeded alert
 */
export async function createBudgetExceededAlert(
    categoryName: string,
    spent: number,
    budget: number
): Promise<Notification | null> {
    const overAmount = spent - budget;
    const percentage = ((overAmount / budget) * 100).toFixed(0);

    return createNotification({
        type: 'budget_exceeded',
        title: '⚠️ Budget Exceeded',
        message: `You have exceeded your ${categoryName} budget by $${overAmount.toFixed(2)} (${percentage}%). Current spending: $${spent.toFixed(2)}/$${budget.toFixed(2)}.`,
        priority: 'high',
        channel: 'in-app',
        metadata: {
            category: categoryName,
            spent,
            budget,
            over_amount: overAmount,
            percentage: parseFloat(percentage),
        },
    });
}

/**
 * Create budget warning alert (80% threshold)
 */
export async function createBudgetWarningAlert(
    categoryName: string,
    spent: number,
    budget: number
): Promise<Notification | null> {
    const percentage = (spent / budget) * 100;
    if (percentage < 80) return null;

    return createNotification({
        type: 'budget_warning',
        title: '📊 Budget Warning',
        message: `You've used ${percentage.toFixed(0)}% of your ${categoryName} budget. Current spending: $${spent.toFixed(2)}/$${budget.toFixed(2)}.`,
        priority: 'normal',
        channel: 'in-app',
        metadata: {
            category: categoryName,
            spent,
            budget,
            percentage,
        },
    });
}

/**
 * Create bill reminder
 */
export async function createBillReminder(
    billName: string,
    amount: number,
    dueDate: Date,
    daysUntilDue: number
): Promise<Notification | null> {
    let type: NotificationType;
    let title: string;
    let priority: NotificationPriority;
    let channel: NotificationChannel = 'in-app';

    if (daysUntilDue === 0) {
        type = 'bill_reminder_today';
        title = '📅 Bill Due Today';
        priority = 'urgent';
        channel = 'sms'; // Could be SMS if enabled
    } else if (daysUntilDue === 1) {
        type = 'bill_reminder_1_day';
        title = '📅 Bill Due Tomorrow';
        priority = 'high';
        channel = 'email';
    } else if (daysUntilDue <= 3) {
        type = 'bill_reminder_3_days';
        title = '📅 Bill Due Soon';
        priority = 'normal';
    } else {
        return null; // Don't create reminders for bills more than 3 days away
    }

    const message = daysUntilDue === 0
        ? `Your ${billName} bill of $${amount.toFixed(2)} is due today. Please make payment to avoid late fees.`
        : `Your ${billName} bill of $${amount.toFixed(2)} is due in ${daysUntilDue} day${daysUntilDue > 1 ? 's' : ''} on ${dueDate.toLocaleDateString()}.`;

    return createNotification({
        type,
        title,
        message,
        priority,
        channel,
        metadata: {
            bill_name: billName,
            amount,
            due_date: dueDate.toISOString(),
            days_until_due: daysUntilDue,
        },
    });
}

/**
 * Create credit card payment due reminder
 */
export async function createCreditCardPaymentReminder(
    cardName: string,
    amount: number,
    dueDate: Date,
    minimumPayment: number
): Promise<Notification | null> {
    return createNotification({
        type: 'credit_card_payment_due',
        title: '💳 Credit Card Payment Due',
        message: `Your ${cardName} payment of $${amount.toFixed(2)} is due on ${dueDate.toLocaleDateString()}. Minimum payment: $${minimumPayment.toFixed(2)}.`,
        priority: 'high',
        channel: 'in-app',
        metadata: {
            card_name: cardName,
            amount,
            minimum_payment: minimumPayment,
            due_date: dueDate.toISOString(),
        },
    });
}

/**
 * Create loan EMI reminder
 */
export async function createLoanEMIReminder(
    loanName: string,
    amount: number,
    dueDate: Date
): Promise<Notification | null> {
    return createNotification({
        type: 'loan_emi_reminder',
        title: '🏠 Loan EMI Due',
        message: `Your ${loanName} EMI of $${amount.toFixed(2)} is due on ${dueDate.toLocaleDateString()}.`,
        priority: 'high',
        channel: 'in-app',
        metadata: {
            loan_name: loanName,
            amount,
            due_date: dueDate.toISOString(),
        },
    });
}

/**
 * Create subscription renewal reminder
 */
export async function createSubscriptionRenewalReminder(
    serviceName: string,
    amount: number,
    renewalDate: Date
): Promise<Notification | null> {
    return createNotification({
        type: 'subscription_renewal',
        title: '🔄 Subscription Renewal Reminder',
        message: `Your ${serviceName} subscription will renew on ${renewalDate.toLocaleDateString()} for $${amount.toFixed(2)}.`,
        priority: 'normal',
        channel: 'email',
        metadata: {
            service_name: serviceName,
            amount,
            renewal_date: renewalDate.toISOString(),
        },
    });
}

/**
 * Create goal milestone alert
 */
export async function createGoalMilestoneAlert(
    goalName: string,
    currentAmount: number,
    targetAmount: number,
    percentage: number
): Promise<Notification | null> {
    // Only create for 25%, 50%, 75%, 100% milestones
    const milestones = [25, 50, 75, 100];
    if (!milestones.includes(Math.round(percentage))) return null;

    const emoji = percentage === 100 ? '🎉' : '🎯';
    const title = percentage === 100 ? 'Goal Achieved!' : 'Goal Milestone Achieved';

    return createNotification({
        type: percentage === 100 ? 'goal_achieved' : 'goal_milestone',
        title: `${emoji} ${title}`,
        message: percentage === 100
            ? `Congratulations! You've achieved your ${goalName} goal of $${targetAmount.toFixed(2)}! 🎊`
            : `Congratulations! You've reached ${percentage}% of your ${goalName} goal. Current: $${currentAmount.toFixed(2)}/${targetAmount.toFixed(2)}.`,
        priority: percentage === 100 ? 'high' : 'normal',
        channel: 'in-app',
        metadata: {
            goal_name: goalName,
            current_amount: currentAmount,
            target_amount: targetAmount,
            percentage,
        },
    });
}

/**
 * Create spending insight notification
 */
export async function createSpendingInsight(
    insight: string,
    category?: string,
    amount?: number
): Promise<Notification | null> {
    return createNotification({
        type: 'spending_insight',
        title: '📊 Spending Insight',
        message: insight,
        priority: 'normal',
        channel: 'in-app',
        metadata: {
            category,
            amount,
        },
    });
}

/**
 * Create weekly summary notification
 */
export async function createWeeklySummary(
    income: number,
    expenses: number,
    net: number,
    savingsRate: number
): Promise<Notification | null> {
    return createNotification({
        type: 'weekly_summary',
        title: '📈 Weekly Financial Summary',
        message: `This week: Income $${income.toFixed(2)}, Expenses $${expenses.toFixed(2)}, Net $${net.toFixed(2)}. You're ${savingsRate.toFixed(0)}% towards your savings goal.`,
        priority: 'low',
        channel: 'email',
        metadata: {
            income,
            expenses,
            net,
            savings_rate: savingsRate,
        },
    });
}

/**
 * Create monthly report notification
 */
export async function createMonthlyReport(
    income: number,
    expenses: number,
    savings: number,
    netWorthChange: number
): Promise<Notification | null> {
    return createNotification({
        type: 'monthly_report',
        title: '📊 Monthly Financial Report',
        message: `Monthly summary: Total income $${income.toFixed(2)}, expenses $${expenses.toFixed(2)}, savings $${savings.toFixed(2)}. Net worth ${netWorthChange >= 0 ? 'increased' : 'decreased'} ${Math.abs(netWorthChange).toFixed(0)}%.`,
        priority: 'normal',
        channel: 'email',
        metadata: {
            income,
            expenses,
            savings,
            net_worth_change: netWorthChange,
        },
    });
}

// =====================================================
// BATCH OPERATIONS
// =====================================================

/**
 * Check and create budget alerts for all budgets
 */
export async function checkAllBudgetAlerts(): Promise<void> {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Fetch all budgets with current spending
        const { data: budgets } = await supabase
            .from('budgets')
            .select('*')
            .eq('user_id', user.id)
            .eq('is_active', true);

        if (!budgets) return;

        for (const budget of budgets) {
            const spent = budget.spent || 0;
            const limit = budget.limit;
            const percentage = (spent / limit) * 100;

            if (percentage >= 100) {
                await createBudgetExceededAlert(budget.category_name, spent, limit);
            } else if (percentage >= 80) {
                await createBudgetWarningAlert(budget.category_name, spent, limit);
            }
        }
    } catch (error) {
        console.error('Error checking budget alerts:', error);
    }
}

/**
 * Check and create bill reminders for upcoming bills
 */
export async function checkUpcomingBills(): Promise<void> {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const now = new Date();
        const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

        // Fetch unpaid bills due within 3 days
        const { data: bills } = await supabase
            .from('bills')
            .select('*')
            .eq('user_id', user.id)
            .eq('is_paid', false)
            .gte('due_date', now.toISOString())
            .lte('due_date', threeDaysFromNow.toISOString());

        if (!bills) return;

        for (const bill of bills) {
            const dueDate = new Date(bill.due_date);
            const daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
            
            await createBillReminder(bill.bill_name, bill.amount, dueDate, daysUntilDue);
        }
    } catch (error) {
        console.error('Error checking upcoming bills:', error);
    }
}

export const notificationService = {
    // Core operations
    create: createNotification,
    getAll: getNotifications,
    getUnreadCount,
    markAsRead,
    markAllAsRead,
    delete: deleteNotification,
    deleteAllRead,
    
    // Smart alerts
    lowBalance: createLowBalanceAlert,
    unusualSpending: createUnusualSpendingAlert,
    budgetExceeded: createBudgetExceededAlert,
    budgetWarning: createBudgetWarningAlert,
    billReminder: createBillReminder,
    creditCardPayment: createCreditCardPaymentReminder,
    loanEMI: createLoanEMIReminder,
    subscriptionRenewal: createSubscriptionRenewalReminder,
    goalMilestone: createGoalMilestoneAlert,
    spendingInsight: createSpendingInsight,
    weeklySummary: createWeeklySummary,
    monthlyReport: createMonthlyReport,
    
    // Batch operations
    checkAllBudgetAlerts,
    checkUpcomingBills,
};

export default notificationService;
