import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CalendarIcon, Target, TrendingUp, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { GoalTypeSelector } from './GoalTypeSelector';
import { useGoalTypeConfig, useRecommendedSavings } from '@/lib/hooks/useGoalAnalytics';
import { Database } from '@/lib/supabase/database.types';

type SavingsGoalInsert = Database['public']['Tables']['savings_goals']['Insert'];

interface EnhancedGoalDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (goal: SavingsGoalInsert) => void;
    editingGoal?: Database['public']['Tables']['savings_goals']['Row']; // For future editing functionality
}

export function EnhancedGoalDialog({ open, onOpenChange, onSubmit, editingGoal }: EnhancedGoalDialogProps) {
    const [step, setStep] = useState(1);
    const [goalData, setGoalData] = useState<Partial<SavingsGoalInsert>>({
        goal_type: 'custom',
        priority: 5,
        auto_contribution_enabled: false,
        auto_contribution_frequency: 'monthly',
    });

    const selectedConfig = useGoalTypeConfig(goalData.goal_type || 'custom');
    const recommendedSavings = useRecommendedSavings(
        goalData.goal_type || 'custom',
        goalData.target_amount || 0,
        goalData.target_date ? Math.round((new Date(goalData.target_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24 * 30)) : 12
    );

    const handleGoalTypeSelect = (type: string) => {
        setGoalData((prev: Partial<SavingsGoalInsert>) => ({
            ...prev,
            goal_type: type as Database['public']['Tables']['savings_goals']['Row']['goal_type'],
            name: type !== 'custom' ? selectedConfig.label : prev.name,
            target_amount: type !== 'custom' ? selectedConfig.default_target_amount : prev.target_amount,
        }));
    };

    const handleNext = () => {
        if (step < 3) setStep(step + 1);
    };

    const handleBack = () => {
        if (step > 1) setStep(step - 1);
    };

    const handleSubmit = () => {
        if (!goalData.name || !goalData.target_amount) return;

        onSubmit(goalData as SavingsGoalInsert);
        handleClose();
    };

    const handleClose = () => {
        setStep(1);
        setGoalData({
            goal_type: 'custom',
            priority: 5,
            auto_contribution_enabled: false,
            auto_contribution_frequency: 'monthly',
        });
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Target className="h-5 w-5" />
                        {editingGoal ? 'Edit Savings Goal' : 'Create New Savings Goal'}
                    </DialogTitle>
                </DialogHeader>

                {/* Progress Indicator */}
                <div className="flex items-center justify-center mb-6">
                    <div className="flex items-center space-x-2">
                        {[1, 2, 3].map((stepNum) => (
                            <div key={stepNum} className="flex items-center">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                                    step >= stepNum
                                        ? 'bg-primary text-primary-foreground'
                                        : 'bg-muted text-muted-foreground'
                                }`}>
                                    {stepNum}
                                </div>
                                {stepNum < 3 && (
                                    <div className={`w-12 h-0.5 mx-2 ${
                                        step > stepNum ? 'bg-primary' : 'bg-muted'
                                    }`} />
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Step 1: Goal Type Selection */}
                {step === 1 && (
                    <div className="space-y-6">
                        <GoalTypeSelector
                            selectedType={goalData.goal_type || 'custom'}
                            onTypeSelect={handleGoalTypeSelect}
                        />

                        <div className="flex justify-end">
                            <Button onClick={handleNext}>
                                Next: Goal Details
                            </Button>
                        </div>
                    </div>
                )}

                {/* Step 2: Goal Details */}
                {step === 2 && (
                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Goal Details</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <Label htmlFor="goal_name">Goal Name</Label>
                                    <Input
                                        id="goal_name"
                                        value={goalData.name || ''}
                                        onChange={(e) => setGoalData((prev: Partial<SavingsGoalInsert>) => ({ ...prev, name: e.target.value }))}
                                        placeholder="Enter goal name"
                                        required
                                    />
                                </div>

                                <div>
                                    <Label htmlFor="target_amount">Target Amount ($)</Label>
                                    <Input
                                        id="target_amount"
                                        type="number"
                                        step="0.01"
                                        value={goalData.target_amount || ''}
                                        onChange={(e) => setGoalData((prev: Partial<SavingsGoalInsert>) => ({
                                            ...prev,
                                            target_amount: parseFloat(e.target.value) || 0
                                        }))}
                                        placeholder="0.00"
                                        required
                                    />
                                </div>

                                <div>
                                    <Label htmlFor="description">Description (Optional)</Label>
                                    <Textarea
                                        id="description"
                                        value={goalData.description || ''}
                                        onChange={(e) => setGoalData((prev: Partial<SavingsGoalInsert>) => ({ ...prev, description: e.target.value }))}
                                        placeholder="Describe your goal..."
                                        rows={3}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label>Priority Level</Label>
                                        <Select
                                            value={goalData.priority?.toString()}
                                            onValueChange={(value) => setGoalData((prev: Partial<SavingsGoalInsert>) => ({
                                                ...prev,
                                                priority: parseInt(value)
                                            }))}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="1">Low Priority (1)</SelectItem>
                                                <SelectItem value="2">2</SelectItem>
                                                <SelectItem value="3">3</SelectItem>
                                                <SelectItem value="4">4</SelectItem>
                                                <SelectItem value="5">Medium Priority (5)</SelectItem>
                                                <SelectItem value="6">6</SelectItem>
                                                <SelectItem value="7">7</SelectItem>
                                                <SelectItem value="8">High Priority (8)</SelectItem>
                                                <SelectItem value="9">9</SelectItem>
                                                <SelectItem value="10">Critical Priority (10)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div>
                                        <Label>Target Date (Optional)</Label>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button variant="outline" className="w-full justify-start">
                                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                                    {goalData.target_date
                                                        ? format(new Date(goalData.target_date), 'PPP')
                                                        : 'Select date'
                                                    }
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0">
                                                <Calendar
                                                    mode="single"
                                                    selected={goalData.target_date ? new Date(goalData.target_date) : undefined}
                                                    onSelect={(date) => setGoalData((prev: Partial<SavingsGoalInsert>) => ({
                                                        ...prev,
                                                        target_date: date?.toISOString().split('T')[0]
                                                    }))}
                                                    disabled={(date) => date < new Date()}
                                                />
                                            </PopoverContent>
                                        </Popover>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <div className="flex justify-between">
                            <Button variant="outline" onClick={handleBack}>
                                Back
                            </Button>
                            <Button onClick={handleNext}>
                                Next: Auto-Contribution
                            </Button>
                        </div>
                    </div>
                )}

                {/* Step 3: Auto-Contribution Setup */}
                {step === 3 && (
                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <TrendingUp className="h-5 w-5" />
                                    Auto-Contribution Settings
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <Label htmlFor="auto_contribution">Enable Auto-Contribution</Label>
                                        <p className="text-sm text-muted-foreground">
                                            Automatically add money to this goal from your income
                                        </p>
                                    </div>
                                    <Switch
                                        id="auto_contribution"
                                        checked={goalData.auto_contribution_enabled || false}
                                        onCheckedChange={(checked) => setGoalData((prev: Partial<SavingsGoalInsert>) => ({
                                            ...prev,
                                            auto_contribution_enabled: checked
                                        }))}
                                    />
                                </div>

                                {goalData.auto_contribution_enabled && (
                                    <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <Label htmlFor="contribution_amount">Contribution Amount ($)</Label>
                                                <Input
                                                    id="contribution_amount"
                                                    type="number"
                                                    step="0.01"
                                                    value={goalData.auto_contribution_amount || ''}
                                                    onChange={(e) => setGoalData((prev: Partial<SavingsGoalInsert>) => ({
                                                        ...prev,
                                                        auto_contribution_amount: parseFloat(e.target.value) || 0
                                                    }))}
                                                    placeholder="0.00"
                                                />
                                            </div>

                                            <div>
                                                <Label htmlFor="frequency">Frequency</Label>
                                                <Select
                                                    value={goalData.auto_contribution_frequency}
                                                    onValueChange={(value: Database['public']['Tables']['savings_goals']['Row']['auto_contribution_frequency']) => setGoalData((prev: Partial<SavingsGoalInsert>) => ({
                                                        ...prev,
                                                        auto_contribution_frequency: value
                                                    }))}
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

                                        {recommendedSavings > 0 && (
                                            <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <Clock className="h-4 w-4 text-blue-600" />
                                                    <span className="text-sm font-medium text-blue-800">
                                                        Recommended: ${recommendedSavings.toFixed(2)} {goalData.auto_contribution_frequency}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-blue-700">
                                                    Based on your goal type and timeframe, this amount will help you reach your target.
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Goal Summary</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Goal Type:</span>
                                        <Badge variant="outline">{selectedConfig.label}</Badge>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Target Amount:</span>
                                        <span className="font-medium">${goalData.target_amount?.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Priority:</span>
                                        <span className="font-medium">{goalData.priority}/10</span>
                                    </div>
                                    {goalData.target_date && (
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Target Date:</span>
                                            <span className="font-medium">
                                                {format(new Date(goalData.target_date), 'MMM dd, yyyy')}
                                            </span>
                                        </div>
                                    )}
                                    {goalData.auto_contribution_enabled && (
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Auto-Contribution:</span>
                                            <span className="font-medium">
                                                ${goalData.auto_contribution_amount} {goalData.auto_contribution_frequency}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        <div className="flex justify-between">
                            <Button variant="outline" onClick={handleBack}>
                                Back
                            </Button>
                            <Button onClick={handleSubmit} disabled={!goalData.name || !goalData.target_amount}>
                                Create Goal
                            </Button>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}