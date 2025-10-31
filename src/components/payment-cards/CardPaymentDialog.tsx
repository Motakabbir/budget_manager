import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
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
import { useMakeCardPayment, useBankAccounts } from '@/lib/hooks/use-budget-queries';
import type { PaymentCard } from '@/lib/hooks/use-budget-queries';
import { toast } from 'sonner';

interface CardPaymentDialogProps {
    card: PaymentCard | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function CardPaymentDialog({ card, open, onOpenChange }: CardPaymentDialogProps) {
    const [formData, setFormData] = useState({
        amount: 0,
        payment_method: 'bank_transfer' as 'bank_transfer' | 'cash' | 'check' | 'other',
        bank_account_id: '',
        notes: '',
    });

    const makePayment = useMakeCardPayment();
    const { data: accounts = [] } = useBankAccounts();
    const activeAccounts = accounts.filter((acc) => acc.is_active);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!card) return;

        if (formData.amount <= 0) {
            toast.error('Payment amount must be greater than 0');
            return;
        }

        if (card.card_type === 'credit' && formData.amount > (card.current_balance || 0)) {
            toast.error('Payment amount cannot exceed current balance');
            return;
        }

        const paymentData = {
            card_id: card.id,
            payment_amount: formData.amount,
            from_account_id: formData.bank_account_id || undefined,
            payment_method: formData.payment_method,
            notes: formData.notes || undefined,
        };

        makePayment.mutate(paymentData, {
            onSuccess: () => {
                onOpenChange(false);
                // Reset form
                setFormData({
                    amount: 0,
                    payment_method: 'bank_transfer',
                    bank_account_id: '',
                    notes: '',
                });
            },
        });
    };

    // Calculate suggested amounts for credit cards
    const minimumPayment =
        card?.card_type === 'credit' && card.current_balance && card.minimum_payment_percent
            ? (card.current_balance * card.minimum_payment_percent) / 100
            : 0;

    const fullBalance = card?.card_type === 'credit' ? card.current_balance || 0 : 0;

    const suggestedAmounts = [
        { label: 'Minimum', value: minimumPayment, show: minimumPayment > 0 },
        { label: 'Half Balance', value: fullBalance / 2, show: fullBalance > 0 },
        { label: 'Full Balance', value: fullBalance, show: fullBalance > 0 },
    ];

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Make Card Payment</DialogTitle>
                    <DialogDescription>
                        Make a payment for{' '}
                        <span className="font-semibold">{card?.card_name}</span>
                    </DialogDescription>
                </DialogHeader>

                {card && (
                    <form onSubmit={handleSubmit}>
                        <div className="grid gap-4 py-4">
                            {/* Current Balance (Credit Cards Only) */}
                            {card.card_type === 'credit' && (
                                <div className="rounded-lg bg-secondary/50 p-4 space-y-2">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-muted-foreground">
                                            Current Balance
                                        </span>
                                        <span className="text-xl font-bold">
                                            ${(card.current_balance || 0).toFixed(2)}
                                        </span>
                                    </div>

                                    {card.credit_limit && (
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-muted-foreground">Available Credit</span>
                                            <span className="font-medium">
                                                ${(card.credit_limit - (card.current_balance || 0)).toFixed(2)}
                                            </span>
                                        </div>
                                    )}

                                    {minimumPayment > 0 && (
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-muted-foreground">Minimum Payment</span>
                                            <span className="font-medium">
                                                ${minimumPayment.toFixed(2)}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Payment Amount */}
                            <div className="grid gap-2">
                                <Label htmlFor="amount">
                                    Payment Amount <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="amount"
                                    type="number"
                                    step="0.01"
                                    min="0.01"
                                    max={fullBalance || undefined}
                                    value={formData.amount || ''}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            amount: parseFloat(e.target.value) || 0,
                                        })
                                    }
                                    placeholder="0.00"
                                    required
                                />

                                {/* Quick Amount Buttons */}
                                {card.card_type === 'credit' && suggestedAmounts.some((s) => s.show) && (
                                    <div className="flex gap-2 flex-wrap">
                                        {suggestedAmounts.map(
                                            (suggested) =>
                                                suggested.show && (
                                                    <Button
                                                        key={suggested.label}
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() =>
                                                            setFormData({
                                                                ...formData,
                                                                amount: suggested.value,
                                                            })
                                                        }
                                                    >
                                                        {suggested.label} (${suggested.value.toFixed(2)})
                                                    </Button>
                                                )
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Payment Method */}
                            <div className="grid gap-2">
                                <Label htmlFor="payment_method">
                                    Payment Method <span className="text-red-500">*</span>
                                </Label>
                                <Select
                                    value={formData.payment_method}
                                    onValueChange={(
                                        value: 'bank_transfer' | 'cash' | 'check' | 'other'
                                    ) => setFormData({ ...formData, payment_method: value })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                                        <SelectItem value="cash">Cash</SelectItem>
                                        <SelectItem value="check">Check</SelectItem>
                                        <SelectItem value="other">Other</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Bank Account (if bank_transfer) */}
                            {formData.payment_method === 'bank_transfer' && (
                                <div className="grid gap-2">
                                    <Label htmlFor="bank_account_id">
                                        From Bank Account <span className="text-red-500">*</span>
                                    </Label>
                                    <Select
                                        value={formData.bank_account_id}
                                        onValueChange={(value) =>
                                            setFormData({ ...formData, bank_account_id: value })
                                        }
                                        required={formData.payment_method === 'bank_transfer'}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select account" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {activeAccounts.map((account) => (
                                                <SelectItem key={account.id} value={account.id}>
                                                    {account.account_name} ($
                                                    {(account.balance || 0).toFixed(2)})
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>

                                    {formData.bank_account_id && (
                                        <p className="text-xs text-muted-foreground">
                                            This amount will be deducted from your bank account
                                        </p>
                                    )}
                                </div>
                            )}

                            {/* Notes */}
                            <div className="grid gap-2">
                                <Label htmlFor="notes">Notes (Optional)</Label>
                                <Textarea
                                    id="notes"
                                    value={formData.notes}
                                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                                        setFormData({ ...formData, notes: e.target.value })
                                    }
                                    placeholder="Add payment details..."
                                    rows={2}
                                />
                            </div>
                        </div>

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={makePayment.isPending}>
                                {makePayment.isPending ? 'Processing...' : 'Make Payment'}
                            </Button>
                        </DialogFooter>
                    </form>
                )}
            </DialogContent>
        </Dialog>
    );
}
