import { useState, useEffect } from 'react';
import { DollarSign, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useUpdateBudget } from '@/lib/hooks/use-budget-queries';
import type { BudgetWithSpending } from '@/lib/hooks/use-budget-queries';
import { toast } from 'sonner';

interface EditBudgetDialogProps {
    budget: BudgetWithSpending | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function EditBudgetDialog({ budget, open, onOpenChange }: EditBudgetDialogProps) {
    const [amount, setAmount] = useState('');
    const [period, setPeriod] = useState<'monthly' | 'yearly'>('monthly');

    const { mutate: updateBudget, isPending } = useUpdateBudget();

    useEffect(() => {
        if (budget) {
            setAmount(budget.amount.toString());
            setPeriod(budget.period);
        }
    }, [budget]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!budget) return;

        if (!amount || parseFloat(amount) <= 0) {
            toast.error('Please enter a valid amount');
            return;
        }

        updateBudget(
            {
                id: budget.id,
                updates: {
                    amount: parseFloat(amount),
                    period,
                },
            },
            {
                onSuccess: () => {
                    onOpenChange(false);
                },
            }
        );
    };

    const handleOpenChange = (newOpen: boolean) => {
        onOpenChange(newOpen);
        if (!newOpen && budget) {
            // Reset form to original values
            setAmount(budget.amount.toString());
            setPeriod(budget.period);
        }
    };

    if (!budget) return null;

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Edit Budget</DialogTitle>
                    <DialogDescription>
                        Update the spending limit for {budget.category?.name}.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6 mt-4">
                    {/* Category Display (Read-only) */}
                    <div className="space-y-2">
                        <Label>Category</Label>
                        <div className="flex items-center gap-3 p-3 border rounded-lg bg-muted">
                            <div
                                className="w-4 h-4 rounded-full"
                                style={{ backgroundColor: budget.category?.color || '#6B7280' }}
                            />
                            <span className="font-medium">{budget.category?.name}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Category cannot be changed for existing budgets
                        </p>
                    </div>

                    {/* Amount Input */}
                    <div className="space-y-2">
                        <Label htmlFor="amount">Budget Amount *</Label>
                        <div className="relative">
                            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                                id="amount"
                                type="number"
                                step="0.01"
                                min="0.01"
                                placeholder="0.00"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                className="pl-9"
                                required
                            />
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Current budget: ${budget.amount.toLocaleString()}
                        </p>
                    </div>

                    {/* Period Selection */}
                    <div className="space-y-2">
                        <Label htmlFor="period">Budget Period *</Label>
                        <Select value={period} onValueChange={(value: 'monthly' | 'yearly') => setPeriod(value)}>
                            <SelectTrigger id="period">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="monthly">
                                    <div className="flex items-center gap-2">
                                        <Calendar className="w-4 h-4" />
                                        <div>
                                            <p className="font-medium">Monthly</p>
                                            <p className="text-xs text-muted-foreground">
                                                Budget resets each month
                                            </p>
                                        </div>
                                    </div>
                                </SelectItem>
                                <SelectItem value="yearly">
                                    <div className="flex items-center gap-2">
                                        <Calendar className="w-4 h-4" />
                                        <div>
                                            <p className="font-medium">Yearly</p>
                                            <p className="text-xs text-muted-foreground">
                                                Budget resets each year
                                            </p>
                                        </div>
                                    </div>
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Current Spending Info */}
                    <div className="p-4 bg-muted rounded-lg space-y-2">
                        <p className="text-sm font-medium">Current Period Spending</p>
                        <div className="text-sm text-muted-foreground space-y-1">
                            <p>
                                Spent:{' '}
                                <span className={`font-medium ${
                                    budget.status === 'exceeded' ? 'text-red-600' : 'text-foreground'
                                }`}>
                                    ${budget.spent.toLocaleString()}
                                </span>
                            </p>
                            <p>
                                Remaining:{' '}
                                <span className={`font-medium ${
                                    budget.remaining === 0 ? 'text-red-600' : 'text-green-600'
                                }`}>
                                    ${budget.remaining.toLocaleString()}
                                </span>
                            </p>
                            <p>
                                Usage:{' '}
                                <span className={`font-medium ${
                                    budget.percentage >= 100 ? 'text-red-600' : 
                                    budget.percentage >= 80 ? 'text-yellow-600' : 
                                    'text-green-600'
                                }`}>
                                    {budget.percentage.toFixed(1)}%
                                </span>
                            </p>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-end gap-3">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => handleOpenChange(false)}
                            disabled={isPending}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isPending || !amount}>
                            {isPending ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
