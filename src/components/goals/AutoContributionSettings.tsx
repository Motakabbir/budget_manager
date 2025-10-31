import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useUpdateSavingsGoal } from '@/lib/hooks/use-budget-queries';
import { Database } from '@/lib/supabase/database.types';
import { toast } from 'sonner';
import { Settings, DollarSign, Calendar } from 'lucide-react';

type SavingsGoal = Database['public']['Tables']['savings_goals']['Row'];

interface AutoContributionSettingsProps {
    goal: SavingsGoal;
    onUpdate?: () => void;
}

export function AutoContributionSettings({ goal, onUpdate }: AutoContributionSettingsProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [settings, setSettings] = useState({
        auto_contribution_enabled: goal.auto_contribution_enabled,
        auto_contribution_amount: goal.auto_contribution_amount,
        auto_contribution_frequency: goal.auto_contribution_frequency,
    });

    const updateGoalMutation = useUpdateSavingsGoal();

    const handleSave = async () => {
        try {
            await updateGoalMutation.mutateAsync({
                id: goal.id,
                updates: settings
            });
            toast.success('Auto-contribution settings updated');
            setIsEditing(false);
            onUpdate?.();
        } catch {
            toast.error('Failed to update auto-contribution settings');
        }
    };

    const handleCancel = () => {
        setSettings({
            auto_contribution_enabled: goal.auto_contribution_enabled,
            auto_contribution_amount: goal.auto_contribution_amount,
            auto_contribution_frequency: goal.auto_contribution_frequency,
        });
        setIsEditing(false);
    };

    const getFrequencyLabel = (frequency: string) => {
        switch (frequency) {
            case 'weekly': return 'Weekly';
            case 'bi-weekly': return 'Bi-weekly';
            case 'monthly': return 'Monthly';
            case 'quarterly': return 'Quarterly';
            default: return frequency;
        }
    };

    const getEstimatedMonthlySavings = () => {
        if (!settings.auto_contribution_enabled || !settings.auto_contribution_amount) return 0;

        switch (settings.auto_contribution_frequency) {
            case 'weekly': return settings.auto_contribution_amount * 4.33; // Average weeks per month
            case 'bi-weekly': return settings.auto_contribution_amount * 2.17; // Average bi-weeks per month
            case 'monthly': return settings.auto_contribution_amount;
            case 'quarterly': return settings.auto_contribution_amount / 3;
            default: return 0;
        }
    };

    const estimatedMonthly = getEstimatedMonthlySavings();
    const remainingAmount = goal.target_amount - goal.current_amount;
    const monthsToComplete = estimatedMonthly > 0 ? Math.ceil(remainingAmount / estimatedMonthly) : 0;

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Settings className="h-5 w-5" />
                        Auto-Contribution Settings
                    </div>
                    {!isEditing && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setIsEditing(true)}
                        >
                            Edit
                        </Button>
                    )}
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {isEditing ? (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <Label htmlFor="auto_contribution">Enable Auto-Contribution</Label>
                                <p className="text-sm text-muted-foreground">
                                    Automatically add money to this goal
                                </p>
                            </div>
                            <Switch
                                id="auto_contribution"
                                checked={settings.auto_contribution_enabled}
                                onCheckedChange={(checked) =>
                                    setSettings(prev => ({ ...prev, auto_contribution_enabled: checked }))
                                }
                            />
                        </div>

                        {settings.auto_contribution_enabled && (
                            <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="amount">Contribution Amount ($)</Label>
                                        <Input
                                            id="amount"
                                            type="number"
                                            step="0.01"
                                            value={settings.auto_contribution_amount}
                                            onChange={(e) =>
                                                setSettings(prev => ({
                                                    ...prev,
                                                    auto_contribution_amount: parseFloat(e.target.value) || 0
                                                }))
                                            }
                                            placeholder="0.00"
                                        />
                                    </div>

                                    <div>
                                        <Label htmlFor="frequency">Frequency</Label>
                                        <Select
                                            value={settings.auto_contribution_frequency}
                                            onValueChange={(value: Database['public']['Tables']['savings_goals']['Row']['auto_contribution_frequency']) =>
                                                setSettings(prev => ({ ...prev, auto_contribution_frequency: value }))
                                            }
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="weekly">Weekly</SelectItem>
                                                <SelectItem value="bi-weekly">Bi-weekly</SelectItem>
                                                <SelectItem value="monthly">Monthly</SelectItem>
                                                <SelectItem value="quarterly">Quarterly</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                {estimatedMonthly > 0 && (
                                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Calendar className="h-4 w-4 text-blue-600" />
                                            <span className="text-sm font-medium text-blue-800">
                                                Estimated: ${estimatedMonthly.toFixed(2)} per month
                                            </span>
                                        </div>
                                        <p className="text-xs text-blue-700">
                                            At this rate, you'll reach your goal in approximately {monthsToComplete} month{monthsToComplete !== 1 ? 's' : ''}.
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={handleCancel}>
                                Cancel
                            </Button>
                            <Button onClick={handleSave} disabled={updateGoalMutation.isPending}>
                                Save Settings
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Auto-Contribution</span>
                            <span className={`text-sm ${goal.auto_contribution_enabled ? 'text-green-600' : 'text-muted-foreground'}`}>
                                {goal.auto_contribution_enabled ? 'Enabled' : 'Disabled'}
                            </span>
                        </div>

                        {goal.auto_contribution_enabled ? (
                            <div className="space-y-3 p-4 border rounded-lg bg-muted/50">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-muted-foreground">Amount</span>
                                    <span className="font-medium">${goal.auto_contribution_amount.toFixed(2)}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-muted-foreground">Frequency</span>
                                    <span className="font-medium">{getFrequencyLabel(goal.auto_contribution_frequency)}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-muted-foreground">Monthly Savings</span>
                                    <span className="font-medium">${estimatedMonthly.toFixed(2)}</span>
                                </div>
                                {monthsToComplete > 0 && (
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-muted-foreground">Time to Complete</span>
                                        <span className="font-medium">{monthsToComplete} month{monthsToComplete !== 1 ? 's' : ''}</span>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="text-center py-6 text-muted-foreground">
                                <DollarSign className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                <p className="text-sm">Auto-contribution is disabled</p>
                            </div>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}