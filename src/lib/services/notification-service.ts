import { supabase } from '@/lib/supabase/client';
import { NotificationType, NotificationPriority, NotificationChannel } from '@/lib/hooks/use-notifications';
import { EmailService, SMSService, PushNotificationService, EmailMessage, SMSMessage } from './notification-channels';

export interface NotificationTemplate {
    template_type: string;
    title_template: string;
    message_template: string;
    channels: NotificationChannel[];
    priority: NotificationPriority;
}

export class NotificationService {
    private static instance: NotificationService;
    private emailService: EmailService;
    private smsService: SMSService;
    private pushService: PushNotificationService;

    constructor() {
        this.emailService = new EmailService();
        this.smsService = new SMSService();
        this.pushService = new PushNotificationService();
    }

    public static getInstance(): NotificationService {
        if (!NotificationService.instance) {
            NotificationService.instance = new NotificationService();
        }
        return NotificationService.instance;
    }

    /**
     * Create a notification for a user
     */
    async createNotification(
        userId: string,
        type: NotificationType,
        title: string,
        message: string,
        options: {
            priority?: NotificationPriority;
            channel?: NotificationChannel;
            actionUrl?: string;
            metadata?: Record<string, unknown>;
            scheduledFor?: Date;
            expiresAt?: Date;
        } = {}
    ) {
        const { data, error } = await (supabase as any)
            .from('notifications')
            .insert({
                user_id: userId,
                type,
                title,
                message,
                priority: options.priority || 'normal',
                channel: options.channel || 'in-app',
                action_url: options.actionUrl,
                metadata: options.metadata,
                scheduled_for: options.scheduledFor?.toISOString(),
                expires_at: options.expiresAt?.toISOString(),
                delivery_status: 'pending',
                retry_count: 0,
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    /**
     * Create low balance warning notification
     */
    async createLowBalanceWarning(
        userId: string,
        accountName: string,
        currentBalance: number
    ) {
        return this.createNotification(
            userId,
            'low_balance_warning',
            'Low Balance Alert',
            `Your ${accountName} account balance is $${currentBalance.toFixed(2)}. Consider transferring funds to avoid overdraft fees.`,
            {
                priority: 'high',
                metadata: { accountName, currentBalance },
            }
        );
    }

    /**
     * Create unusual spending detected notification
     */
    async createUnusualSpendingAlert(
        userId: string,
        amount: number,
        category: string,
        percentage: number
    ) {
        return this.createNotification(
            userId,
            'unusual_spending_detected',
            'Unusual Spending Detected',
            `We detected unusual spending of $${amount.toFixed(2)} in ${category} category. This is ${percentage.toFixed(1)}% higher than your average.`,
            {
                priority: 'high',
                metadata: { amount, category, percentage },
            }
        );
    }

    /**
     * Create bill reminder notification
     */
    async createBillReminder(
        userId: string,
        billName: string,
        amount: number,
        dueDate: Date,
        daysUntilDue: number
    ) {
        let type: NotificationType;
        let title: string;
        let priority: NotificationPriority;

        if (daysUntilDue === 0) {
            type = 'bill_reminder_today';
            title = 'Bill Due Today';
            priority = 'urgent';
        } else if (daysUntilDue === 1) {
            type = 'bill_reminder_1_day';
            title = 'Bill Due Tomorrow';
            priority = 'high';
        } else if (daysUntilDue === 3) {
            type = 'bill_reminder_3_days';
            title = 'Bill Due Soon';
            priority = 'normal';
        } else {
            return null; // Not a reminder day
        }

        return this.createNotification(
            userId,
            type,
            title,
            `Your ${billName} bill of $${amount.toFixed(2)} is due ${daysUntilDue === 0 ? 'today' : daysUntilDue === 1 ? 'tomorrow' : `in ${daysUntilDue} days`} on ${dueDate.toLocaleDateString()}.`,
            {
                priority,
                metadata: { billName, amount, dueDate: dueDate.toISOString(), daysUntilDue },
            }
        );
    }

    /**
     * Create credit card payment due notification
     */
    async createCreditCardDueReminder(
        userId: string,
        cardName: string,
        amount: number,
        dueDate: Date
    ) {
        return this.createNotification(
            userId,
            'credit_card_payment_due',
            'Credit Card Payment Due',
            `Your ${cardName} payment of $${amount.toFixed(2)} is due on ${dueDate.toLocaleDateString()}.`,
            {
                priority: 'high',
                metadata: { cardName, amount, dueDate: dueDate.toISOString() },
            }
        );
    }

    /**
     * Create loan EMI reminder notification
     */
    async createLoanEmiReminder(
        userId: string,
        loanName: string,
        amount: number,
        dueDate: Date
    ) {
        return this.createNotification(
            userId,
            'loan_emi_reminder',
            'Loan EMI Due',
            `Your ${loanName} EMI of $${amount.toFixed(2)} is due on ${dueDate.toLocaleDateString()}.`,
            {
                priority: 'high',
                metadata: { loanName, amount, dueDate: dueDate.toISOString() },
            }
        );
    }

    /**
     * Create budget exceeded notification
     */
    async createBudgetExceededAlert(
        userId: string,
        category: string,
        spent: number,
        budget: number
    ) {
        const overAmount = spent - budget;
        return this.createNotification(
            userId,
            'budget_exceeded',
            'Budget Exceeded',
            `You have exceeded your ${category} budget by $${overAmount.toFixed(2)}. Current spending: $${spent.toFixed(2)}/$${budget.toFixed(2)}.`,
            {
                priority: 'high',
                metadata: { category, spent, budget, overAmount },
            }
        );
    }

    /**
     * Create goal milestone notification
     */
    async createGoalMilestoneNotification(
        userId: string,
        goalName: string,
        percentage: number
    ) {
        return this.createNotification(
            userId,
            'goal_milestone',
            'Goal Milestone Achieved',
            `Congratulations! You've reached ${percentage.toFixed(1)}% of your ${goalName} goal.`,
            {
                priority: 'normal',
                metadata: { goalName, percentage },
            }
        );
    }

    /**
     * Create subscription renewal reminder
     */
    async createSubscriptionRenewalReminder(
        userId: string,
        serviceName: string,
        amount: number,
        renewalDate: Date
    ) {
        return this.createNotification(
            userId,
            'subscription_renewal',
            'Subscription Renewal Reminder',
            `Your ${serviceName} subscription will renew on ${renewalDate.toLocaleDateString()} for $${amount.toFixed(2)}.`,
            {
                priority: 'normal',
                metadata: { serviceName, amount, renewalDate: renewalDate.toISOString() },
            }
        );
    }

    /**
     * Check if user should receive notification based on preferences
     */
    async shouldSendNotification(
        userId: string,
        type: NotificationType,
        channel: NotificationChannel
    ): Promise<boolean> {
        try {
            const { data: prefs, error } = await supabase
                .from('notification_preferences')
                .select('*')
                .eq('user_id', userId)
                .single();

            if (error || !prefs) return false;

            // Check if the notification type is enabled
            const typeEnabled = this.isNotificationTypeEnabled(prefs, type);
            if (!typeEnabled) return false;

            // Check if the channel is enabled
            const channelEnabled = this.isChannelEnabled(prefs, channel);
            if (!channelEnabled) return false;

            // Check quiet hours
            if (this.isQuietHour(prefs)) return false;

            return true;
        } catch {
            return false;
        }
    }

    private isNotificationTypeEnabled(prefs: Record<string, unknown>, type: NotificationType): boolean {
        switch (type) {
            case 'low_balance_warning':
                return Boolean(prefs.low_balance_alerts);
            case 'unusual_spending_detected':
                return Boolean(prefs.unusual_spending_alerts);
            case 'bill_reminder_3_days':
            case 'bill_reminder_1_day':
            case 'bill_reminder_today':
                return Boolean(prefs.bill_reminders);
            case 'credit_card_payment_due':
                return Boolean(prefs.credit_card_due);
            case 'loan_emi_reminder':
                return Boolean(prefs.loan_emi_reminders);
            case 'budget_exceeded':
                return Boolean(prefs.budget_alerts);
            case 'goal_milestone':
                return Boolean(prefs.goal_milestones);
            case 'subscription_renewal':
                return Boolean(prefs.subscription_renewals);
            case 'weekly_summary':
                return Boolean(prefs.weekly_summary);
            case 'monthly_report':
                return Boolean(prefs.weekly_summary); // Using weekly summary setting for monthly too
            default:
                return true;
        }
    }

    private isChannelEnabled(prefs: Record<string, unknown>, channel: NotificationChannel): boolean {
        switch (channel) {
            case 'email':
                return Boolean(prefs.email_notifications);
            case 'sms':
                return Boolean(prefs.sms_notifications) && Boolean(prefs.sms_phone_number);
            case 'push':
                return Boolean(prefs.push_notifications);
            case 'in-app':
                return true; // Always allow in-app notifications
            default:
                return false;
        }
    }

    private isQuietHour(prefs: Record<string, unknown>): boolean {
        const quietHoursStart = prefs.quiet_hours_start as string;
        const quietHoursEnd = prefs.quiet_hours_end as string;

        if (!quietHoursStart || !quietHoursEnd) return false;

        const now = new Date();
        const currentTime = now.getHours() * 100 + now.getMinutes();
        const startTime = this.timeToMinutes(quietHoursStart);
        const endTime = this.timeToMinutes(quietHoursEnd);

        if (startTime < endTime) {
            // Same day quiet hours
            return currentTime >= startTime && currentTime <= endTime;
        } else {
            // Overnight quiet hours
            return currentTime >= startTime || currentTime <= endTime;
        }
    }

    private timeToMinutes(timeStr: string): number {
        const [hours, minutes] = timeStr.split(':').map(Number);
        return hours * 100 + minutes;
    }

    /**
     * Send notification via specific channel (placeholder for actual implementation)
     */
    async sendViaChannel(
        notificationId: string,
        channel: NotificationChannel,
        _userId: string
    ): Promise<boolean> {
        try {
            // Get notification details
            const { data: notification, error: notifError } = await (supabase as any)
                .from('notifications')
                .select('*')
                .eq('id', notificationId)
                .single();

            if (notifError || !notification) {
                return false;
            }

            // Get user details for email/SMS
            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('email')
                .eq('id', notification.user_id)
                .single();

            if (profileError && channel !== 'in-app') {
                return false;
            }

            // Get user preferences for SMS phone number
            let phoneNumber = '';
            if (channel === 'sms') {
                const { data: prefs, error: prefsError } = await (supabase as any)
                    .from('notification_preferences')
                    .select('sms_phone_number')
                    .eq('user_id', notification.user_id)
                    .single();

                if (prefsError || !prefs?.sms_phone_number) {
                    return false;
                }
                phoneNumber = prefs.sms_phone_number;
            }

            let success = false;

            // Send via appropriate channel
            switch (channel) {
                case 'email':
                    if (profile?.email) {
                        const emailMessage: EmailMessage = {
                            to: profile.email,
                            subject: notification.title,
                            html: this.formatEmailHTML(notification),
                            text: notification.message,
                        };
                        success = await this.emailService.sendEmail(emailMessage);
                    }
                    break;
                case 'sms':
                    if (phoneNumber) {
                        const smsMessage: SMSMessage = {
                            to: phoneNumber,
                            body: `${notification.title}: ${notification.message}`,
                        };
                        success = await this.smsService.sendSMS(smsMessage);
                    }
                    break;
                case 'push':
                    // For now, just log - push notifications require subscription management
                    success = await this.pushService.sendPushNotification(null, {
                        title: notification.title,
                        body: notification.message,
                    });
                    break;
                case 'in-app':
                    // In-app notifications are already stored, just mark as sent
                    success = true;
                    break;
            }

            // Update notification status
            const { error: updateError } = await (supabase as any)
                .from('notifications')
                .update({
                    sent_at: new Date().toISOString(),
                    delivery_status: success ? 'sent' : 'failed',
                })
                .eq('id', notificationId);

            if (updateError) {
                return false;
            }

            return success;
        } catch {
            return false;
        }
    }

    /**
     * Format notification as HTML email
     */
    private formatEmailHTML(notification: { title: string; message: string; action_url?: string }): string {
        return `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <title>${notification.title}</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }
                    .container { max-width: 600px; margin: 0 auto; background-color: white; padding: 20px; border-radius: 8px; }
                    .header { color: #333; border-bottom: 2px solid #007bff; padding-bottom: 10px; margin-bottom: 20px; }
                    .content { color: #555; line-height: 1.6; }
                    .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #777; font-size: 12px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <h1 class="header">${notification.title}</h1>
                    <div class="content">
                        <p>${notification.message}</p>
                        ${notification.action_url ? `<p><a href="${notification.action_url}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">View Details</a></p>` : ''}
                    </div>
                    <div class="footer">
                        <p>This notification was sent by Budget Manager. You can manage your notification preferences in your account settings.</p>
                    </div>
                </div>
            </body>
            </html>
        `;
    }

    /**
     * Process scheduled notifications
     */
    async processScheduledNotifications(): Promise<void> {
        try {
            const now = new Date().toISOString();

            // Find notifications that are scheduled and ready to be sent
            const { data: scheduledNotifications, error } = await (supabase as any)
                .from('notifications')
                .select('*')
                .eq('status', 'scheduled')
                .lte('scheduled_for', now)
                .is('sent_at', null);

            if (error) {
                throw error;
            }

            if (!scheduledNotifications || scheduledNotifications.length === 0) {
                return;
            }

            // Process each scheduled notification
            for (const notification of scheduledNotifications) {
                try {
                    // Check if user still wants this type of notification for any channel
                    const enabledChannels = [];
                    for (const channel of notification.channels as NotificationChannel[]) {
                        const canSend = await this.shouldSendNotification(
                            notification.user_id,
                            notification.type as NotificationType,
                            channel
                        );
                        if (canSend) {
                            enabledChannels.push(channel);
                        }
                    }

                    if (enabledChannels.length > 0) {
                        // Send through enabled channels only
                        for (const channel of enabledChannels) {
                            if (channel !== 'in-app') { // In-app notifications are already created
                                await this.sendViaChannel(notification.id, channel as NotificationChannel, notification.user_id);
                            }
                        }

                        // Mark notification as processed
                        await (supabase as any)
                            .from('notifications')
                            .update({
                                status: 'sent',
                                sent_at: now,
                            })
                            .eq('id', notification.id);
                    } else {
                        // User disabled all channels for this notification type, mark as cancelled
                        await (supabase as any)
                            .from('notifications')
                            .update({
                                status: 'cancelled',
                            })
                            .eq('id', notification.id);
                    }
                } catch {
                    // Mark as failed but continue processing others
                    await (supabase as any)
                        .from('notifications')
                        .update({
                            status: 'failed',
                        })
                        .eq('id', notification.id);
                }
            }
        } catch {
            // Error processing scheduled notifications
        }
    }
}

export const notificationService = NotificationService.getInstance();