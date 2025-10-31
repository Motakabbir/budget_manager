import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
    Bell,
    Mail,
    Smartphone,
    Monitor,
    Clock,
    AlertTriangle,
    CreditCard,
    Home,
    Target,
    TrendingUp,
    Calendar,
    Save,
    Moon,
    Sun
} from 'lucide-react';
import { useNotificationPreferences, useUpdateNotificationPreferences } from '@/lib/hooks/use-notifications';
import { toast } from 'sonner';

export default function NotificationPreferencesPage() {
    const { data: preferences, isLoading } = useNotificationPreferences();
    const { mutate: updatePreferences, isPending } = useUpdateNotificationPreferences();

    const [localPreferences, setLocalPreferences] = useState({
        // Smart Alerts
        low_balance_alerts: true,
        unusual_spending_alerts: true,
        bill_reminders: true,
        credit_card_due: true,
        loan_emi_reminders: true,
        budget_alerts: true,
        goal_milestones: true,
        subscription_renewals: true,

        // Summary Reports
        spending_insights: true,
        daily_tips: false,
        weekly_summary: true,

        // Channels
        email_notifications: false,
        push_notifications: false,
        sms_notifications: false,
        sms_phone_number: '',

        // Schedule
        notification_schedule: { morning: '09:00', evening: '18:00' },
        quiet_hours_start: '22:00',
        quiet_hours_end: '08:00',
    });

    // Update local preferences when data loads
    React.useEffect(() => {
        if (preferences) {
            setLocalPreferences({
                low_balance_alerts: preferences.low_balance_alerts ?? true,
                unusual_spending_alerts: preferences.unusual_spending_alerts ?? true,
                bill_reminders: preferences.bill_reminders ?? true,
                credit_card_due: preferences.credit_card_due ?? true,
                loan_emi_reminders: preferences.loan_emi_reminders ?? true,
                budget_alerts: preferences.budget_alerts ?? true,
                goal_milestones: preferences.goal_milestones ?? true,
                subscription_renewals: preferences.subscription_renewals ?? true,
                spending_insights: preferences.spending_insights ?? true,
                daily_tips: preferences.daily_tips ?? false,
                weekly_summary: preferences.weekly_summary ?? true,
                email_notifications: preferences.email_notifications ?? false,
                push_notifications: preferences.push_notifications ?? false,
                sms_notifications: preferences.sms_notifications ?? false,
                sms_phone_number: preferences.sms_phone_number ?? '',
                notification_schedule: preferences.notification_schedule ?? { morning: '09:00', evening: '18:00' },
                quiet_hours_start: preferences.quiet_hours_start ?? '22:00',
                quiet_hours_end: preferences.quiet_hours_end ?? '08:00',
            });
        }
    }, [preferences]);

    const handleSave = () => {
        updatePreferences(localPreferences, {
            onSuccess: () => {
                toast.success('Preferences saved successfully!');
            },
            onError: (_error) => {
                toast.error('Failed to save notification preferences. Please try again.');
            },
        });
    };

    const handlePreferenceChange = (key: string, value: unknown) => {
        setLocalPreferences(prev => ({
            ...prev,
            [key]: value,
        }));
    };

    if (isLoading) {
        return (
            <div className="space-y-6 p-4 sm:p-6 lg:p-8">
                <div className="animate-pulse space-y-4">
                    <div className="h-8 bg-gray-200 rounded w-1/3"></div>
                    <div className="h-64 bg-gray-200 rounded"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 p-4 sm:p-6 lg:p-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl sm:text-4xl font-bold bg-linear-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                        Notification Preferences
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Customize how and when you receive notifications
                    </p>
                </div>
                <Button
                    onClick={handleSave}
                    disabled={isPending}
                    className="flex items-center gap-2"
                >
                    <Save className="h-4 w-4" />
                    {isPending ? 'Saving...' : 'Save Preferences'}
                </Button>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
                {/* Smart Alerts */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-orange-500" />
                            Smart Alerts
                        </CardTitle>
                        <CardDescription>
                            Intelligent notifications to help you stay on top of your finances
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <TrendingUp className="h-4 w-4 text-red-500" />
                                <div>
                                    <Label htmlFor="low-balance" className="text-sm font-medium">
                                        Low Balance Warnings
                                    </Label>
                                    <p className="text-xs text-muted-foreground">
                                        Alert when account balance drops below threshold
                                    </p>
                                </div>
                            </div>
                            <Switch
                                id="low-balance"
                                checked={localPreferences.low_balance_alerts}
                                onCheckedChange={(checked) => handlePreferenceChange('low_balance_alerts', checked)}
                            />
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <AlertTriangle className="h-4 w-4 text-yellow-500" />
                                <div>
                                    <Label htmlFor="unusual-spending" className="text-sm font-medium">
                                        Unusual Spending Detection
                                    </Label>
                                    <p className="text-xs text-muted-foreground">
                                        AI-powered alerts for suspicious transactions
                                    </p>
                                </div>
                            </div>
                            <Switch
                                id="unusual-spending"
                                checked={localPreferences.unusual_spending_alerts}
                                onCheckedChange={(checked) => handlePreferenceChange('unusual_spending_alerts', checked)}
                            />
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Calendar className="h-4 w-4 text-blue-500" />
                                <div>
                                    <Label htmlFor="bill-reminders" className="text-sm font-medium">
                                        Bill Payment Reminders
                                    </Label>
                                    <p className="text-xs text-muted-foreground">
                                        Reminders 3 days, 1 day, and on due date
                                    </p>
                                </div>
                            </div>
                            <Switch
                                id="bill-reminders"
                                checked={localPreferences.bill_reminders}
                                onCheckedChange={(checked) => handlePreferenceChange('bill_reminders', checked)}
                            />
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <CreditCard className="h-4 w-4 text-purple-500" />
                                <div>
                                    <Label htmlFor="credit-card-due" className="text-sm font-medium">
                                        Credit Card Due Dates
                                    </Label>
                                    <p className="text-xs text-muted-foreground">
                                        Payment due date reminders
                                    </p>
                                </div>
                            </div>
                            <Switch
                                id="credit-card-due"
                                checked={localPreferences.credit_card_due}
                                onCheckedChange={(checked) => handlePreferenceChange('credit_card_due', checked)}
                            />
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Home className="h-4 w-4 text-green-500" />
                                <div>
                                    <Label htmlFor="loan-reminders" className="text-sm font-medium">
                                        Loan EMI Reminders
                                    </Label>
                                    <p className="text-xs text-muted-foreground">
                                        Monthly payment due date alerts
                                    </p>
                                </div>
                            </div>
                            <Switch
                                id="loan-reminders"
                                checked={localPreferences.loan_emi_reminders}
                                onCheckedChange={(checked) => handlePreferenceChange('loan_emi_reminders', checked)}
                            />
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Target className="h-4 w-4 text-indigo-500" />
                                <div>
                                    <Label htmlFor="budget-alerts" className="text-sm font-medium">
                                        Budget Exceeded Alerts
                                    </Label>
                                    <p className="text-xs text-muted-foreground">
                                        When spending exceeds budget limits
                                    </p>
                                </div>
                            </div>
                            <Switch
                                id="budget-alerts"
                                checked={localPreferences.budget_alerts}
                                onCheckedChange={(checked) => handlePreferenceChange('budget_alerts', checked)}
                            />
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Target className="h-4 w-4 text-pink-500" />
                                <div>
                                    <Label htmlFor="goal-milestones" className="text-sm font-medium">
                                        Goal Milestones
                                    </Label>
                                    <p className="text-xs text-muted-foreground">
                                        Progress updates on savings goals
                                    </p>
                                </div>
                            </div>
                            <Switch
                                id="goal-milestones"
                                checked={localPreferences.goal_milestones}
                                onCheckedChange={(checked) => handlePreferenceChange('goal_milestones', checked)}
                            />
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Calendar className="h-4 w-4 text-cyan-500" />
                                <div>
                                    <Label htmlFor="subscription-renewals" className="text-sm font-medium">
                                        Subscription Renewals
                                    </Label>
                                    <p className="text-xs text-muted-foreground">
                                        Upcoming subscription renewal reminders
                                    </p>
                                </div>
                            </div>
                            <Switch
                                id="subscription-renewals"
                                checked={localPreferences.subscription_renewals}
                                onCheckedChange={(checked) => handlePreferenceChange('subscription_renewals', checked)}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Summary Reports */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <TrendingUp className="h-5 w-5 text-blue-500" />
                            Summary Reports
                        </CardTitle>
                        <CardDescription>
                            Regular financial insights and summaries
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <TrendingUp className="h-4 w-4 text-green-500" />
                                <div>
                                    <Label htmlFor="spending-insights" className="text-sm font-medium">
                                        Spending Insights
                                    </Label>
                                    <p className="text-xs text-muted-foreground">
                                        Weekly spending pattern analysis
                                    </p>
                                </div>
                            </div>
                            <Switch
                                id="spending-insights"
                                checked={localPreferences.spending_insights}
                                onCheckedChange={(checked) => handlePreferenceChange('spending_insights', checked)}
                            />
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Sun className="h-4 w-4 text-yellow-500" />
                                <div>
                                    <Label htmlFor="daily-tips" className="text-sm font-medium">
                                        Daily Financial Tips
                                    </Label>
                                    <p className="text-xs text-muted-foreground">
                                        Helpful money management advice
                                    </p>
                                </div>
                            </div>
                            <Switch
                                id="daily-tips"
                                checked={localPreferences.daily_tips}
                                onCheckedChange={(checked) => handlePreferenceChange('daily_tips', checked)}
                            />
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Calendar className="h-4 w-4 text-indigo-500" />
                                <div>
                                    <Label htmlFor="weekly-summary" className="text-sm font-medium">
                                        Weekly Summary
                                    </Label>
                                    <p className="text-xs text-muted-foreground">
                                        Weekly financial overview report
                                    </p>
                                </div>
                            </div>
                            <Switch
                                id="weekly-summary"
                                checked={localPreferences.weekly_summary}
                                onCheckedChange={(checked) => handlePreferenceChange('weekly_summary', checked)}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Notification Channels */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Bell className="h-5 w-5 text-purple-500" />
                            Notification Channels
                        </CardTitle>
                        <CardDescription>
                            Choose how you want to receive notifications
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Monitor className="h-4 w-4 text-blue-500" />
                                <div>
                                    <Label className="text-sm font-medium">In-App Notifications</Label>
                                    <p className="text-xs text-muted-foreground">
                                        Notifications within the app
                                    </p>
                                </div>
                            </div>
                            <Badge variant="secondary">Always On</Badge>
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Mail className="h-4 w-4 text-red-500" />
                                <div>
                                    <Label htmlFor="email-notifications" className="text-sm font-medium">
                                        Email Notifications
                                    </Label>
                                    <p className="text-xs text-muted-foreground">
                                        Receive notifications via email
                                    </p>
                                </div>
                            </div>
                            <Switch
                                id="email-notifications"
                                checked={localPreferences.email_notifications}
                                onCheckedChange={(checked) => handlePreferenceChange('email_notifications', checked)}
                            />
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Smartphone className="h-4 w-4 text-green-500" />
                                <div>
                                    <Label htmlFor="push-notifications" className="text-sm font-medium">
                                        Push Notifications
                                    </Label>
                                    <p className="text-xs text-muted-foreground">
                                        Browser push notifications
                                    </p>
                                </div>
                            </div>
                            <Switch
                                id="push-notifications"
                                checked={localPreferences.push_notifications}
                                onCheckedChange={(checked) => handlePreferenceChange('push_notifications', checked)}
                            />
                        </div>

                        <Separator />

                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Smartphone className="h-4 w-4 text-orange-500" />
                                    <div>
                                        <Label htmlFor="sms-notifications" className="text-sm font-medium">
                                            SMS Notifications
                                        </Label>
                                        <p className="text-xs text-muted-foreground">
                                            Critical alerts via SMS
                                        </p>
                                    </div>
                                </div>
                                <Switch
                                    id="sms-notifications"
                                    checked={localPreferences.sms_notifications}
                                    onCheckedChange={(checked) => handlePreferenceChange('sms_notifications', checked)}
                                />
                            </div>

                            {localPreferences.sms_notifications && (
                                <div className="ml-7 space-y-2">
                                    <Label htmlFor="sms-phone" className="text-sm">
                                        Phone Number
                                    </Label>
                                    <Input
                                        id="sms-phone"
                                        type="tel"
                                        placeholder="+1 (555) 123-4567"
                                        value={localPreferences.sms_phone_number}
                                        onChange={(e) => handlePreferenceChange('sms_phone_number', e.target.value)}
                                        className="max-w-xs"
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Required for SMS notifications. Standard rates may apply.
                                    </p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Schedule & Quiet Hours */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Clock className="h-5 w-5 text-indigo-500" />
                            Schedule & Quiet Hours
                        </CardTitle>
                        <CardDescription>
                            Control when you receive notifications
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-4">
                            <Label className="text-sm font-medium">Preferred Notification Times</Label>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="morning-time" className="text-xs text-muted-foreground">
                                        Morning
                                    </Label>
                                    <Input
                                        id="morning-time"
                                        type="time"
                                        value={localPreferences.notification_schedule.morning}
                                        onChange={(e) => handlePreferenceChange('notification_schedule', {
                                            ...localPreferences.notification_schedule,
                                            morning: e.target.value
                                        })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="evening-time" className="text-xs text-muted-foreground">
                                        Evening
                                    </Label>
                                    <Input
                                        id="evening-time"
                                        type="time"
                                        value={localPreferences.notification_schedule.evening}
                                        onChange={(e) => handlePreferenceChange('notification_schedule', {
                                            ...localPreferences.notification_schedule,
                                            evening: e.target.value
                                        })}
                                    />
                                </div>
                            </div>
                        </div>

                        <Separator />

                        <div className="space-y-4">
                            <Label className="text-sm font-medium">Quiet Hours</Label>
                            <p className="text-xs text-muted-foreground">
                                Pause non-urgent notifications during these hours
                            </p>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="quiet-start" className="text-xs text-muted-foreground">
                                        Start Time
                                    </Label>
                                    <Input
                                        id="quiet-start"
                                        type="time"
                                        value={localPreferences.quiet_hours_start}
                                        onChange={(e) => handlePreferenceChange('quiet_hours_start', e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="quiet-end" className="text-xs text-muted-foreground">
                                        End Time
                                    </Label>
                                    <Input
                                        id="quiet-end"
                                        type="time"
                                        value={localPreferences.quiet_hours_end}
                                        onChange={(e) => handlePreferenceChange('quiet_hours_end', e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                            <Moon className="h-4 w-4 text-slate-500" />
                            <p className="text-xs text-muted-foreground">
                                During quiet hours, only urgent notifications (like payment due dates) will be sent.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}