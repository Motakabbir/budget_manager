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
import { useCreateLoan, useBankAccounts } from '@/lib/hooks/use-budget-queries';
import { Plus } from 'lucide-react';

const loanTypes = [
    { value: 'given', label: 'Loan Given (Lent)' },
    { value: 'taken', label: 'Loan Taken (Borrowed)' },
] as const;

const interestTypes = [
    { value: 'none', label: 'No Interest' },
    { value: 'simple', label: 'Simple Interest' },
    { value: 'compound', label: 'Compound Interest' },
] as const;

const paymentFrequencies = [
    { value: 'one-time', label: 'One-Time Payment' },
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'bi-weekly', label: 'Bi-Weekly' },
    { value: 'monthly', label: 'Monthly' },
    { value: 'quarterly', label: 'Quarterly' },
    { value: 'semi-annually', label: 'Semi-Annually' },
    { value: 'yearly', label: 'Yearly' },
] as const;

export function AddLoanDialog() {
    const [open, setOpen] = useState(false);
    const [formData, setFormData] = useState({
        loan_type: 'given' as 'given' | 'taken',
        party_name: '',
        party_contact: '',
        principal_amount: '',
        interest_rate: '',
        interest_type: 'none' as 'simple' | 'compound' | 'none',
        start_date: new Date().toISOString().split('T')[0],
        due_date: '',
        payment_frequency: 'monthly' as 'one-time' | 'daily' | 'weekly' | 'bi-weekly' | 'monthly' | 'quarterly' | 'semi-annually' | 'yearly',
        next_payment_date: '',
        loan_account_id: '',
        purpose: '',
        collateral: '',
        notes: '',
    });

    const createLoan = useCreateLoan();
    const { data: accounts = [] } = useBankAccounts();
    const activeAccounts = accounts.filter((acc) => acc.is_active);

    const resetForm = () => {
        setFormData({
            loan_type: 'given',
            party_name: '',
            party_contact: '',
            principal_amount: '',
            interest_rate: '',
            interest_type: 'none',
            start_date: new Date().toISOString().split('T')[0],
            due_date: '',
            payment_frequency: 'monthly',
            next_payment_date: '',
            loan_account_id: '',
            purpose: '',
            collateral: '',
            notes: '',
        });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const loanData: any = {
            loan_type: formData.loan_type,
            party_name: formData.party_name,
            party_contact: formData.party_contact || null,
            principal_amount: parseFloat(formData.principal_amount),
            interest_rate: formData.interest_type === 'none' ? 0 : parseFloat(formData.interest_rate || '0'),
            interest_type: formData.interest_type,
            start_date: formData.start_date,
            due_date: formData.due_date || null,
            payment_frequency: formData.payment_frequency,
            next_payment_date: formData.next_payment_date || null,
            status: 'active',
            loan_account_id: formData.loan_account_id || null,
            purpose: formData.purpose || null,
            collateral: formData.collateral || null,
            documents: null,
            notes: formData.notes || null,
        };

        createLoan.mutate(loanData, {
            onSuccess: () => {
                setOpen(false);
                resetForm();
            },
        });
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Loan
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Add New Loan</DialogTitle>
                    <DialogDescription>
                        Record a new loan that you have given (lent) or taken (borrowed).
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Loan Type */}
                    <div className="space-y-2">
                        <Label htmlFor="loan_type">Loan Type *</Label>
                        <Select
                            value={formData.loan_type}
                            onValueChange={(value: 'given' | 'taken') =>
                                setFormData({ ...formData, loan_type: value })
                            }
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {loanTypes.map((type) => (
                                    <SelectItem key={type.value} value={type.value}>
                                        {type.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">
                            {formData.loan_type === 'given'
                                ? 'You lent money to someone'
                                : 'You borrowed money from someone'}
                        </p>
                    </div>

                    {/* Party Details */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="party_name">
                                {formData.loan_type === 'given' ? 'Borrower Name' : 'Lender Name'} *
                            </Label>
                            <Input
                                id="party_name"
                                value={formData.party_name}
                                onChange={(e) =>
                                    setFormData({ ...formData, party_name: e.target.value })
                                }
                                placeholder="Enter name"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="party_contact">Contact (Optional)</Label>
                            <Input
                                id="party_contact"
                                value={formData.party_contact}
                                onChange={(e) =>
                                    setFormData({ ...formData, party_contact: e.target.value })
                                }
                                placeholder="Phone or email"
                            />
                        </div>
                    </div>

                    {/* Loan Amount */}
                    <div className="space-y-2">
                        <Label htmlFor="principal_amount">Principal Amount *</Label>
                        <Input
                            id="principal_amount"
                            type="number"
                            step="0.01"
                            min="0"
                            value={formData.principal_amount}
                            onChange={(e) =>
                                setFormData({ ...formData, principal_amount: e.target.value })
                            }
                            placeholder="0.00"
                            required
                        />
                    </div>

                    {/* Interest Details */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="interest_type">Interest Type</Label>
                            <Select
                                value={formData.interest_type}
                                onValueChange={(value: 'simple' | 'compound' | 'none') =>
                                    setFormData({ ...formData, interest_type: value })
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {interestTypes.map((type) => (
                                        <SelectItem key={type.value} value={type.value}>
                                            {type.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        {formData.interest_type !== 'none' && (
                            <div className="space-y-2">
                                <Label htmlFor="interest_rate">Interest Rate (%) *</Label>
                                <Input
                                    id="interest_rate"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    max="100"
                                    value={formData.interest_rate}
                                    onChange={(e) =>
                                        setFormData({ ...formData, interest_rate: e.target.value })
                                    }
                                    placeholder="0.00"
                                    required
                                />
                            </div>
                        )}
                    </div>

                    {/* Dates */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="start_date">Start Date *</Label>
                            <Input
                                id="start_date"
                                type="date"
                                value={formData.start_date}
                                onChange={(e) =>
                                    setFormData({ ...formData, start_date: e.target.value })
                                }
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="due_date">Due Date (Optional)</Label>
                            <Input
                                id="due_date"
                                type="date"
                                value={formData.due_date}
                                onChange={(e) =>
                                    setFormData({ ...formData, due_date: e.target.value })
                                }
                            />
                        </div>
                    </div>

                    {/* Payment Schedule */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="payment_frequency">Payment Frequency</Label>
                            <Select
                                value={formData.payment_frequency}
                                onValueChange={(value: any) =>
                                    setFormData({ ...formData, payment_frequency: value })
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {paymentFrequencies.map((freq) => (
                                        <SelectItem key={freq.value} value={freq.value}>
                                            {freq.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="next_payment_date">Next Payment Date (Optional)</Label>
                            <Input
                                id="next_payment_date"
                                type="date"
                                value={formData.next_payment_date}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        next_payment_date: e.target.value,
                                    })
                                }
                            />
                        </div>
                    </div>

                    {/* Bank Account */}
                    {activeAccounts.length > 0 && (
                        <div className="space-y-2">
                            <Label htmlFor="loan_account_id">Linked Bank Account (Optional)</Label>
                            <Select
                                value={formData.loan_account_id}
                                onValueChange={(value) =>
                                    setFormData({ ...formData, loan_account_id: value })
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select an account" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="">None</SelectItem>
                                    {activeAccounts.map((account) => (
                                        <SelectItem key={account.id} value={account.id}>
                                            {account.account_name} - ${account.balance.toLocaleString()}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    {/* Purpose */}
                    <div className="space-y-2">
                        <Label htmlFor="purpose">Purpose (Optional)</Label>
                        <Input
                            id="purpose"
                            value={formData.purpose}
                            onChange={(e) =>
                                setFormData({ ...formData, purpose: e.target.value })
                            }
                            placeholder="e.g., Business expansion, Medical emergency"
                        />
                    </div>

                    {/* Collateral */}
                    <div className="space-y-2">
                        <Label htmlFor="collateral">Collateral (Optional)</Label>
                        <Input
                            id="collateral"
                            value={formData.collateral}
                            onChange={(e) =>
                                setFormData({ ...formData, collateral: e.target.value })
                            }
                            placeholder="e.g., Property deed, Vehicle"
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
                            placeholder="Additional information..."
                            rows={3}
                        />
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={createLoan.isPending}>
                            {createLoan.isPending ? 'Creating...' : 'Create Loan'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
