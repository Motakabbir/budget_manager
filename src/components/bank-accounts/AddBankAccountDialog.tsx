import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useCreateBankAccount } from '@/lib/hooks/use-budget-queries';
import { Plus } from 'lucide-react';

const accountTypes = [
    { value: 'checking', label: 'Checking Account' },
    { value: 'savings', label: 'Savings Account' },
    { value: 'investment', label: 'Investment Account' },
    { value: 'cash', label: 'Cash' },
    { value: 'wallet', label: 'Wallet' },
    { value: 'other', label: 'Other' },
] as const;

const accountColors = [
    '#3b82f6', // blue
    '#10b981', // green
    '#f59e0b', // amber
    '#8b5cf6', // purple
    '#ef4444', // red
    '#06b6d4', // cyan
    '#ec4899', // pink
    '#14b8a6', // teal
];

export function AddBankAccountDialog() {
    const [open, setOpen] = useState(false);
    const [formData, setFormData] = useState({
        account_name: '',
        bank_name: '',
        account_type: 'checking' as const,
        account_number: '',
        balance: 0,
        currency: 'USD',
        color: accountColors[0],
        icon: 'Building2',
        notes: '',
    });

    const createAccount = useCreateBankAccount();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        createAccount.mutate(
            {
                ...formData,
                is_active: true,
            },
            {
                onSuccess: () => {
                    setOpen(false);
                    setFormData({
                        account_name: '',
                        bank_name: '',
                        account_type: 'checking',
                        account_number: '',
                        balance: 0,
                        currency: 'USD',
                        color: accountColors[0],
                        icon: 'Building2',
                        notes: '',
                    });
                },
            }
        );
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Account
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Add Bank Account</DialogTitle>
                    <DialogDescription>
                        Add a new bank account or cash wallet to track your finances.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                        {/* Account Name */}
                        <div className="grid gap-2">
                            <Label htmlFor="account_name">
                                Account Name <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="account_name"
                                value={formData.account_name}
                                onChange={(e) =>
                                    setFormData({ ...formData, account_name: e.target.value })
                                }
                                placeholder="e.g., Main Checking, Emergency Savings"
                                required
                            />
                        </div>

                        {/* Account Type */}
                        <div className="grid gap-2">
                            <Label htmlFor="account_type">
                                Account Type <span className="text-red-500">*</span>
                            </Label>
                            <Select
                                value={formData.account_type}
                                onValueChange={(value: any) =>
                                    setFormData({ ...formData, account_type: value })
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {accountTypes.map((type) => (
                                        <SelectItem key={type.value} value={type.value}>
                                            {type.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Bank Name */}
                        <div className="grid gap-2">
                            <Label htmlFor="bank_name">Bank Name (Optional)</Label>
                            <Input
                                id="bank_name"
                                value={formData.bank_name}
                                onChange={(e) =>
                                    setFormData({ ...formData, bank_name: e.target.value })
                                }
                                placeholder="e.g., Chase, Bank of America"
                            />
                        </div>

                        {/* Account Number */}
                        <div className="grid gap-2">
                            <Label htmlFor="account_number">
                                Account Number (Last 4 digits - Optional)
                            </Label>
                            <Input
                                id="account_number"
                                value={formData.account_number}
                                onChange={(e) =>
                                    setFormData({ ...formData, account_number: e.target.value })
                                }
                                placeholder="****1234"
                                maxLength={8}
                            />
                            <p className="text-xs text-muted-foreground">
                                For security, only store the last 4 digits (e.g., ****1234)
                            </p>
                        </div>

                        {/* Initial Balance */}
                        <div className="grid gap-2">
                            <Label htmlFor="balance">
                                Initial Balance <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="balance"
                                type="number"
                                step="0.01"
                                value={formData.balance}
                                onChange={(e) =>
                                    setFormData({ ...formData, balance: parseFloat(e.target.value) || 0 })
                                }
                                required
                            />
                        </div>

                        {/* Currency */}
                        <div className="grid gap-2">
                            <Label htmlFor="currency">Currency</Label>
                            <Input
                                id="currency"
                                value={formData.currency}
                                onChange={(e) =>
                                    setFormData({ ...formData, currency: e.target.value })
                                }
                                placeholder="USD"
                            />
                        </div>

                        {/* Color */}
                        <div className="grid gap-2">
                            <Label>Account Color</Label>
                            <div className="flex gap-2 flex-wrap">
                                {accountColors.map((color) => (
                                    <button
                                        key={color}
                                        type="button"
                                        className={`w-10 h-10 rounded-full border-2 transition-all ${
                                            formData.color === color
                                                ? 'border-primary scale-110'
                                                : 'border-transparent hover:scale-105'
                                        }`}
                                        style={{ backgroundColor: color }}
                                        onClick={() => setFormData({ ...formData, color })}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Notes */}
                        {/* Notes */}
                        <div className="grid gap-2">
                            <Label htmlFor="notes">Notes (Optional)</Label>
                            <textarea
                                id="notes"
                                value={formData.notes}
                                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                                    setFormData({ ...formData, notes: e.target.value })
                                }
                                placeholder="Add any additional information..."
                                rows={3}
                                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={createAccount.isPending}>
                            {createAccount.isPending ? 'Creating...' : 'Create Account'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
