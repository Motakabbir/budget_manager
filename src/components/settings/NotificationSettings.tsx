import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Bell, Save } from 'lucide-react';
import { toast } from 'sonner';
import { useNotificationPreferences, useSaveNotificationPreferences } from '@/lib/hooks/use-notifications';

export function NotificationSettings() {
    const { data: preferences, isLoading } = useNotificationPreferences();
    const savePreferencesMutation = useSaveNotificationPreferences();

    const [settings, setSettings] = useState({
        budget_alerts: preferences?.budget_alerts ?? true,
        goal_milestones: preferences?.goal_milestones ?? true,
        spending_insights: preferences?.spending_insights ?? true,
        daily_tips: preferences?.daily_tips ?? false,
        weekly_summary: preferences?.weekly_summary ?? true,
        email_notifications: preferences?.email_notifications ?? false,
        push_notifications: preferences?.push_notifications ?? false,
    });

    // Update settings when preferences load
    if (preferences && !isLoading) {
        if (settings.budget_alerts !== preferences.budget_alerts) {
            setSettings({
                budget_alerts: preferences.budget_alerts,
                goal_milestones: preferences.goal_milestones,
                spending_insights: preferences.spending_insights,
                daily_tips: preferences.daily_tips,
                weekly_summary: preferences.weekly_summary,
                email_notifications: preferences.email_notifications,
                push_notifications: preferences.push_notifications,
            });
        }
    }

    const handleToggle = (key: keyof typeof settings) => {
        setSettings(prev => ({
            ...prev,
            [key]: !prev[key]
        }));
    };

    const handleSave = () => {
        savePreferencesMutation.mutate(settings, {
            onSuccess: () => {
                toast.success('Notification preferences saved');
            },
            onError: () => {
                toast.error('Failed to save preferences');
            }
        });
    };

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Bell className="h-5 w-5" />
                        Notification Preferences
                    </CardTitle>
                    <CardDescription>Loading preferences...</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="animate-pulse space-y-4">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="flex items-center justify-between py-3">
                                <div className="space-y-2">
                                    <div className="h-4 bg-muted rounded w-32"></div>
                                    <div className="h-3 bg-muted rounded w-48"></div>
                                </div>
                                <div className="h-6 w-11 bg-muted rounded-full"></div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Bell className="h-5 w-5" />
                    Notification Preferences
                </CardTitle>
                <CardDescription>
                    Manage how and when you receive notifications
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* In-App Notifications */}
                <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                        In-App Notifications
                    </h3>

                    <div className="flex items-center justify-between py-3 border-b">
                        <div className="space-y-0.5">
                            <Label htmlFor="budget_alerts" className="text-base font-medium">
                                Budget Alerts
                            </Label>
                            <p className="text-sm text-muted-foreground">
                                Get notified when you're approaching or exceeding your budget limits
                            </p>
                        </div>
                        <Switch
                            id="budget_alerts"
                            checked={settings.budget_alerts}
                            onCheckedChange={() => handleToggle('budget_alerts')}
                        />
                    </div>

                    <div className="flex items-center justify-between py-3 border-b">
                        <div className="space-y-0.5">
                            <Label htmlFor="goal_milestones" className="text-base font-medium">
                                Goal Milestones
                            </Label>
                            <p className="text-sm text-muted-foreground">
                                Celebrate when you reach savings goal milestones
                            </p>
                        </div>
                        <Switch
                            id="goal_milestones"
                            checked={settings.goal_milestones}
                            onCheckedChange={() => handleToggle('goal_milestones')}
                        />
                    </div>

                    <div className="flex items-center justify-between py-3 border-b">
                        <div className="space-y-0.5">
                            <Label htmlFor="spending_insights" className="text-base font-medium">
                                Spending Insights
                            </Label>
                            <p className="text-sm text-muted-foreground">
                                Receive insights about your spending patterns and trends
                            </p>
                        </div>
                        <Switch
                            id="spending_insights"
                            checked={settings.spending_insights}
                            onCheckedChange={() => handleToggle('spending_insights')}
                        />
                    </div>

                    <div className="flex items-center justify-between py-3 border-b">
                        <div className="space-y-0.5">
                            <Label htmlFor="daily_tips" className="text-base font-medium">
                                Daily Financial Tips
                            </Label>
                            <p className="text-sm text-muted-foreground">
                                Get helpful financial tips and advice daily
                            </p>
                        </div>
                        <Switch
                            id="daily_tips"
                            checked={settings.daily_tips}
                            onCheckedChange={() => handleToggle('daily_tips')}
                        />
                    </div>

                    <div className="flex items-center justify-between py-3">
                        <div className="space-y-0.5">
                            <Label htmlFor="weekly_summary" className="text-base font-medium">
                                Weekly Summary
                            </Label>
                            <p className="text-sm text-muted-foreground">
                                Receive a weekly summary of your financial activity
                            </p>
                        </div>
                        <Switch
                            id="weekly_summary"
                            checked={settings.weekly_summary}
                            onCheckedChange={() => handleToggle('weekly_summary')}
                        />
                    </div>
                </div>

                {/* External Notifications */}
                <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                        External Notifications
                    </h3>

                    <div className="flex items-center justify-between py-3 border-b">
                        <div className="space-y-0.5">
                            <Label htmlFor="email_notifications" className="text-base font-medium">
                                Email Notifications
                            </Label>
                            <p className="text-sm text-muted-foreground">
                                Receive important notifications via email
                            </p>
                        </div>
                        <Switch
                            id="email_notifications"
                            checked={settings.email_notifications}
                            onCheckedChange={() => handleToggle('email_notifications')}
                        />
                    </div>

                    <div className="flex items-center justify-between py-3">
                        <div className="space-y-0.5">
                            <Label htmlFor="push_notifications" className="text-base font-medium">
                                Push Notifications
                            </Label>
                            <p className="text-sm text-muted-foreground">
                                Receive push notifications on your device
                            </p>
                        </div>
                        <Switch
                            id="push_notifications"
                            checked={settings.push_notifications}
                            onCheckedChange={() => handleToggle('push_notifications')}
                        />
                    </div>
                </div>

                {/* Save Button */}
                <div className="pt-4">
                    <Button
                        onClick={handleSave}
                        disabled={savePreferencesMutation.isPending}
                        className="w-full md:w-auto"
                    >
                        <Save className="h-4 w-4 mr-2" />
                        {savePreferencesMutation.isPending ? 'Saving...' : 'Save Preferences'}
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
