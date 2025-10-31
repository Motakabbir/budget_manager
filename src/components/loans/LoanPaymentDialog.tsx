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
import {
    useMakeLoanPayment,
    useReceiveLoanPayment,
    useBankAccounts,
} from '@/lib/hooks/use-budget-queries';
import type { Loan } from '@/lib/hooks/use-budget-queries';
import { DollarSign, ArrowDownLeft, ArrowUpRight } from 'lucide-react';

interface LoanPaymentDialogProps {
    loan: Loan;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

const paymentMethods = [
    'bank_transfer',
    'cash',
    'check',
    'online_transfer',
    'mobile_payment',
    'other',
];

export function LoanPaymentDialog({ loan, open, onOpenChange }: LoanPaymentDialogProps) {
    const [formData, setFormData] = useState({
        payment_amount: '',
        account_id: '',
        payment_method: 'bank_transfer',
        payment_date: new Date().toISOString().split('T')[0],
        late_fee: '',
        notes: '',
        receipt_number: '',
    });

    const makeLoanPayment = useMakeLoanPayment();
    const receiveLoanPayment = useReceiveLoanPayment();
    const { data: accounts = [] } = useBankAccounts();
    const activeAccounts = accounts.filter((acc) => acc.is_active);

    const resetForm = () => {
        setFormData({
            payment_amount: '',
            account_id: '',
            payment_method: 'bank_transfer',
            payment_date: new Date().toISOString().split('T')[0],
            late_fee: '',
            notes: '',
            receipt_number: '',
        });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const paymentData = {
            loan_id: loan.id,
            payment_amount: parseFloat(formData.payment_amount),
            payment_method: formData.payment_method || undefined,
            payment_date: formData.payment_date || undefined,
            late_fee: formData.late_fee ? parseFloat(formData.late_fee) : 0,
            notes: formData.notes || undefined,
            receipt_number: formData.receipt_number || undefined,
        };

        if (loan.loan_type === 'taken') {
            // Making payment for a loan we borrowed
            makeLoanPayment.mutate(
                {
                    ...paymentData,
                    from_account_id: formData.account_id || undefined,
                },
                {
                    onSuccess: () => {
                        onOpenChange(false);
                        resetForm();
                    },
                }
            );
        } else {
            // Receiving payment for a loan we gave
            receiveLoanPayment.mutate(
                {
                    ...paymentData,
                    to_account_id: formData.account_id || undefined,
                },
                {
                    onSuccess: () => {
                        onOpenChange(false);
                        resetForm();
                    },
                }
            );
        }
    };

    const isPending = makeLoanPayment.isPending || receiveLoanPayment.isPending;
    const isGiven = loan.loan_type === 'given';

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        {isGiven ? (
                            <>
                                <ArrowDownLeft className="h-5 w-5 text-green-600" />
                                Receive Loan Payment
                            </>
                        ) : (
                            <>
                                <ArrowUpRight className="h-5 w-5 text-red-600" />
                                Make Loan Payment
                            </>
                        )}
                    </DialogTitle>
                    <DialogDescription>
                        {isGiven
                            ? `Record a payment received from ${loan.party_name}`
                            : `Record a payment made to ${loan.party_name}`}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Loan Summary */}
                    <div className="rounded-lg border bg-muted/50 p-4 space-y-2">
                        <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Outstanding Balance</span>
                            <span className="font-semibold text-orange-600">
                                ${loan.outstanding_balance.toLocaleString()}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Total Loan Amount</span>
                            <span className="font-semibold">
                                ${loan.total_amount.toLocaleString()}
                            </span>
                        </div>
                        {loan.interest_rate > 0 && (
                            <div className="flex justify-between">
                                <span className="text-sm text-muted-foreground">Interest Rate</span>
                                <span className="font-semibold">
                                    {loan.interest_rate}% ({loan.interest_type})
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Payment Amount */}
                    <div className="space-y-2">
                        <Label htmlFor="payment_amount">Payment Amount *</Label>
                        <div className="relative">
                            <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                                id="payment_amount"
                                type="number"
                                step="0.01"
                                min="0"
                                max={loan.outstanding_balance}
                                value={formData.payment_amount}
                                onChange={(e) =>
                                    setFormData({ ...formData, payment_amount: e.target.value })
                                }
                                className="pl-9"
                                placeholder="0.00"
                                required
                            />
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Maximum: ${loan.outstanding_balance.toLocaleString()}
                        </p>
                    </div>

                    {/* Bank Account */}
                    {activeAccounts.length > 0 && (
                        <div className="space-y-2">
                            <Label htmlFor="account_id">
                                {isGiven ? 'Deposit To Account (Optional)' : 'Pay From Account (Optional)'}
                            </Label>
                            <Select
                                value={formData.account_id}
                                onValueChange={(value) =>
                                    setFormData({ ...formData, account_id: value })
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select an account" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="">None (Cash/Other)</SelectItem>
                                    {activeAccounts.map((account) => (
                                        <SelectItem key={account.id} value={account.id}>
                                            {account.account_name} - ${account.balance.toLocaleString()}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    {/* Payment Method */}
                    <div className="space-y-2">
                        <Label htmlFor="payment_method">Payment Method</Label>
                        <Select
                            value={formData.payment_method}
                            onValueChange={(value) =>
                                setFormData({ ...formData, payment_method: value })
                            }
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {paymentMethods.map((method) => (
                                    <SelectItem key={method} value={method}>
                                        {method.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Payment Date */}
                    <div className="space-y-2">
                        <Label htmlFor="payment_date">Payment Date</Label>
                        <Input
                            id="payment_date"
                            type="date"
                            value={formData.payment_date}
                            onChange={(e) =>
                                setFormData({ ...formData, payment_date: e.target.value })
                            }
                        />
                    </div>

                    {/* Late Fee */}
                    <div className="space-y-2">
                        <Label htmlFor="late_fee">Late Fee (Optional)</Label>
                        <div className="relative">
                            <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                                id="late_fee"
                                type="number"
                                step="0.01"
                                min="0"
                                value={formData.late_fee}
                                onChange={(e) =>
                                    setFormData({ ...formData, late_fee: e.target.value })
                                }
                                className="pl-9"
                                placeholder="0.00"
                            />
                        </div>
                    </div>

                    {/* Receipt Number */}
                    <div className="space-y-2">
                        <Label htmlFor="receipt_number">Receipt Number (Optional)</Label>
                        <Input
                            id="receipt_number"
                            value={formData.receipt_number}
                            onChange={(e) =>
                                setFormData({ ...formData, receipt_number: e.target.value })
                            }
                            placeholder="e.g., REC-2025-001"
                        />
                    </div>

                    {/* Notes */}
                    <div className="space-y-2">
                        <Label htmlFor="notes">Notes (Optional)</Label>
                        <Textarea
                            id="notes"
                            value={formData.notes}
                            onChange={(e) =>
                                setFormData({ ...formData, notes: e.target.value })
                            }
                            placeholder="Additional notes..."
                            rows={2}
                        />
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isPending}>
                            {isPending
                                ? 'Processing...'
                                : isGiven
                                    ? 'Receive Payment'
                                    : 'Make Payment'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
