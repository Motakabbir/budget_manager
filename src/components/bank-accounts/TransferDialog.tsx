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
import { Textarea } from '@/components/ui/textarea';
import { useCreateAccountTransfer, type BankAccount } from '@/lib/hooks/use-budget-queries';
import { ArrowRightLeft, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';

interface TransferDialogProps {
    accounts: BankAccount[];
    defaultFromAccount?: string;
    defaultToAccount?: string;
}

export function TransferDialog({
    accounts,
    defaultFromAccount,
    defaultToAccount,
}: TransferDialogProps) {
    const [open, setOpen] = useState(false);
    const [formData, setFormData] = useState({
        from_account_id: defaultFromAccount || '',
        to_account_id: defaultToAccount || '',
        amount: 0,
        transfer_fee: 0,
        description: '',
        date: format(new Date(), 'yyyy-MM-dd'),
    });

    const createTransfer = useCreateAccountTransfer();

    const activeAccounts = accounts.filter((acc) => acc.is_active);

    const fromAccount = activeAccounts.find((acc) => acc.id === formData.from_account_id);
    const toAccount = activeAccounts.find((acc) => acc.id === formData.to_account_id);

    const totalDeduction = formData.amount + formData.transfer_fee;
    const hasSufficientBalance = fromAccount ? fromAccount.balance >= totalDeduction : false;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!hasSufficientBalance) {
            return;
        }

        createTransfer.mutate(formData, {
            onSuccess: () => {
                setOpen(false);
                setFormData({
                    from_account_id: '',
                    to_account_id: '',
                    amount: 0,
                    transfer_fee: 0,
                    description: '',
                    date: format(new Date(), 'yyyy-MM-dd'),
                });
            },
        });
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline">
                    <ArrowRightLeft className="mr-2 h-4 w-4" />
                    Transfer Money
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle>Transfer Between Accounts</DialogTitle>
                    <DialogDescription>
                        Move money from one account to another. Transfers are instant.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                        {/* From Account */}
                        <div className="grid gap-2">
                            <Label htmlFor="from_account">
                                From Account <span className="text-red-500">*</span>
                            </Label>
                            <Select
                                value={formData.from_account_id}
                                onValueChange={(value) =>
                                    setFormData({ ...formData, from_account_id: value })
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select source account" />
                                </SelectTrigger>
                                <SelectContent>
                                    {activeAccounts.map((account) => (
                                        <SelectItem key={account.id} value={account.id}>
                                            <div className="flex items-center justify-between w-full">
                                                <span>{account.account_name}</span>
                                                <span className="text-xs text-muted-foreground ml-2">
                                                    {new Intl.NumberFormat('en-US', {
                                                        style: 'currency',
                                                        currency: account.currency,
                                                    }).format(account.balance)}
                                                </span>
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {fromAccount && (
                                <p className="text-xs text-muted-foreground">
                                    Available: {' '}
                                    {new Intl.NumberFormat('en-US', {
                                        style: 'currency',
                                        currency: fromAccount.currency,
                                    }).format(fromAccount.balance)}
                                </p>
                            )}
                        </div>

                        {/* Visual Arrow */}
                        <div className="flex justify-center py-2">
                            <ArrowRight className="h-6 w-6 text-muted-foreground" />
                        </div>

                        {/* To Account */}
                        <div className="grid gap-2">
                            <Label htmlFor="to_account">
                                To Account <span className="text-red-500">*</span>
                            </Label>
                            <Select
                                value={formData.to_account_id}
                                onValueChange={(value) =>
                                    setFormData({ ...formData, to_account_id: value })
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select destination account" />
                                </SelectTrigger>
                                <SelectContent>
                                    {activeAccounts
                                        .filter((acc) => acc.id !== formData.from_account_id)
                                        .map((account) => (
                                            <SelectItem key={account.id} value={account.id}>
                                                {account.account_name}
                                            </SelectItem>
                                        ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Amount */}
                        <div className="grid gap-2">
                            <Label htmlFor="amount">
                                Transfer Amount <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="amount"
                                type="number"
                                step="0.01"
                                min="0.01"
                                value={formData.amount || ''}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        amount: parseFloat(e.target.value) || 0,
                                    })
                                }
                                required
                            />
                        </div>

                        {/* Transfer Fee */}
                        <div className="grid gap-2">
                            <Label htmlFor="transfer_fee">Transfer Fee (Optional)</Label>
                            <Input
                                id="transfer_fee"
                                type="number"
                                step="0.01"
                                min="0"
                                value={formData.transfer_fee || ''}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        transfer_fee: parseFloat(e.target.value) || 0,
                                    })
                                }
                            />
                            <p className="text-xs text-muted-foreground">
                                Fee will be deducted from the source account
                            </p>
                        </div>

                        {/* Date */}
                        <div className="grid gap-2">
                            <Label htmlFor="date">Date</Label>
                            <Input
                                id="date"
                                type="date"
                                value={formData.date}
                                onChange={(e) =>
                                    setFormData({ ...formData, date: e.target.value })
                                }
                            />
                        </div>

                        {/* Description */}
                        <div className="grid gap-2">
                            <Label htmlFor="description">Description (Optional)</Label>
                            <Textarea
                                id="description"
                                value={formData.description}
                                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                                    setFormData({ ...formData, description: e.target.value })
                                }
                                placeholder="Add transfer notes..."
                                rows={2}
                            />
                        </div>

                        {/* Summary */}
                        {fromAccount && formData.amount > 0 && (
                            <div className="bg-muted rounded-lg p-3 space-y-1 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Transfer Amount:</span>
                                    <span className="font-medium">
                                        {new Intl.NumberFormat('en-US', {
                                            style: 'currency',
                                            currency: fromAccount.currency,
                                        }).format(formData.amount)}
                                    </span>
                                </div>
                                {formData.transfer_fee > 0 && (
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Transfer Fee:</span>
                                        <span className="font-medium">
                                            {new Intl.NumberFormat('en-US', {
                                                style: 'currency',
                                                currency: fromAccount.currency,
                                            }).format(formData.transfer_fee)}
                                        </span>
                                    </div>
                                )}
                                <div className="flex justify-between pt-1 border-t">
                                    <span className="font-semibold">Total Deduction:</span>
                                    <span className="font-semibold">
                                        {new Intl.NumberFormat('en-US', {
                                            style: 'currency',
                                            currency: fromAccount.currency,
                                        }).format(totalDeduction)}
                                    </span>
                                </div>
                                {!hasSufficientBalance && (
                                    <p className="text-red-600 text-xs mt-2">
                                        Insufficient balance in source account!
                                    </p>
                                )}
                            </div>
                        )}
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={
                                createTransfer.isPending ||
                                !formData.from_account_id ||
                                !formData.to_account_id ||
                                formData.amount <= 0 ||
                                !hasSufficientBalance
                            }
                        >
                            {createTransfer.isPending ? 'Processing...' : 'Transfer'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
