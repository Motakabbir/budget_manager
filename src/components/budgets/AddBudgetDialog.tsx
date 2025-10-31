import { useState } from 'react';
import { Plus, DollarSign, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
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
import { useCategories, useCreateBudget } from '@/lib/hooks/use-budget-queries';
import { toast } from 'sonner';

export function AddBudgetDialog() {
    const [open, setOpen] = useState(false);
    const [categoryId, setCategoryId] = useState('');
    const [amount, setAmount] = useState('');
    const [period, setPeriod] = useState<'monthly' | 'yearly'>('monthly');

    const { data: categories } = useCategories();
    const { mutate: createBudget, isPending } = useCreateBudget();

    // Filter only expense categories
    const expenseCategories = categories?.filter((c) => c.type === 'expense') || [];

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!categoryId) {
            toast.error('Please select a category');
            return;
        }

        if (!amount || parseFloat(amount) <= 0) {
            toast.error('Please enter a valid amount');
            return;
        }

        createBudget(
            {
                category_id: categoryId,
                amount: parseFloat(amount),
                period,
            },
            {
                onSuccess: () => {
                    setOpen(false);
                    resetForm();
                },
            }
        );
    };

    const resetForm = () => {
        setCategoryId('');
        setAmount('');
        setPeriod('monthly');
    };

    const handleOpenChange = (newOpen: boolean) => {
        setOpen(newOpen);
        if (!newOpen) {
            resetForm();
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Budget
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Create Budget</DialogTitle>
                    <DialogDescription>
                        Set a spending limit for a category to track your expenses.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6 mt-4">
                    {/* Category Selection */}
                    <div className="space-y-2">
                        <Label htmlFor="category">Category *</Label>
                        <Select value={categoryId} onValueChange={setCategoryId}>
                            <SelectTrigger id="category">
                                <SelectValue placeholder="Select a category" />
                            </SelectTrigger>
                            <SelectContent>
                                {expenseCategories.length === 0 ? (
                                    <div className="p-2 text-sm text-muted-foreground">
                                        No expense categories available
                                    </div>
                                ) : (
                                    expenseCategories.map((category) => (
                                        <SelectItem key={category.id} value={category.id}>
                                            <div className="flex items-center gap-2">
                                                <div
                                                    className="w-3 h-3 rounded-full"
                                                    style={{ backgroundColor: category.color }}
                                                />
                                                <span>{category.name}</span>
                                            </div>
                                        </SelectItem>
                                    ))
                                )}
                            </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">
                            Only expense categories can have budgets
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
                            Maximum amount to spend in this period
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

                    {/* Preview Section */}
                    {categoryId && amount && (
                        <div className="p-4 bg-muted rounded-lg space-y-2">
                            <p className="text-sm font-medium">Budget Summary</p>
                            <div className="text-sm text-muted-foreground space-y-1">
                                <p>
                                    Category:{' '}
                                    <span className="font-medium text-foreground">
                                        {expenseCategories.find((c) => c.id === categoryId)?.name}
                                    </span>
                                </p>
                                <p>
                                    Amount:{' '}
                                    <span className="font-medium text-foreground">
                                        ${parseFloat(amount).toLocaleString()}
                                    </span>
                                </p>
                                <p>
                                    Period:{' '}
                                    <span className="font-medium text-foreground">
                                        {period === 'monthly' ? 'Monthly' : 'Yearly'}
                                    </span>
                                </p>
                            </div>
                        </div>
                    )}

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
                        <Button type="submit" disabled={isPending || !categoryId || !amount}>
                            {isPending ? 'Creating...' : 'Create Budget'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
