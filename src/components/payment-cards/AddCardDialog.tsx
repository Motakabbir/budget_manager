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
import { useCreatePaymentCard, useBankAccounts } from '@/lib/hooks/use-budget-queries';
import { Plus } from 'lucide-react';

const cardTypes = [
    { value: 'debit', label: 'Debit Card' },
    { value: 'credit', label: 'Credit Card' },
] as const;

const cardNetworks = [
    'Visa',
    'Mastercard',
    'American Express',
    'Discover',
    'Diners Club',
    'JCB',
    'Other',
];

const cardColors = [
    '#6366f1', // indigo
    '#8b5cf6', // purple
    '#ec4899', // pink
    '#ef4444', // red
    '#f59e0b', // amber
    '#10b981', // emerald
    '#06b6d4', // cyan
    '#3b82f6', // blue
    '#1f2937', // gray-800
    '#d4af37', // gold
];

export function AddCardDialog() {
    const [open, setOpen] = useState(false);
    const [formData, setFormData] = useState({
        card_name: '',
        card_type: 'debit' as 'debit' | 'credit',
        card_network: '',
        last_four_digits: '',
        bank_account_id: '',
        credit_limit: 0,
        current_balance: 0,
        interest_rate: 0,
        billing_cycle_day: 1,
        payment_due_day: 25,
        minimum_payment_percent: 2.0,
        expiry_date: '',
        cardholder_name: '',
        color: cardColors[0],
        icon: 'CreditCard',
        notes: '',
    });

    const createCard = useCreatePaymentCard();
    const { data: accounts = [] } = useBankAccounts();
    const activeAccounts = accounts.filter((acc) => acc.is_active);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const cardData: any = {
            card_name: formData.card_name,
            card_type: formData.card_type,
            card_network: formData.card_network || null,
            last_four_digits: formData.last_four_digits || null,
            bank_account_id: formData.bank_account_id || null,
            current_balance: formData.card_type === 'credit' ? formData.current_balance : 0,
            expiry_date: formData.expiry_date || null,
            cardholder_name: formData.cardholder_name || null,
            color: formData.color,
            icon: formData.icon,
            is_active: true,
            notes: formData.notes || null,
        };

        // Add credit card specific fields
        if (formData.card_type === 'credit') {
            cardData.credit_limit = formData.credit_limit;
            cardData.interest_rate = formData.interest_rate || null;
            cardData.billing_cycle_day = formData.billing_cycle_day || null;
            cardData.payment_due_day = formData.payment_due_day || null;
            cardData.minimum_payment_percent = formData.minimum_payment_percent || null;
        } else {
            cardData.credit_limit = null;
            cardData.interest_rate = null;
            cardData.billing_cycle_day = null;
            cardData.payment_due_day = null;
            cardData.minimum_payment_percent = null;
        }

        createCard.mutate(cardData, {
            onSuccess: () => {
                setOpen(false);
                // Reset form
                setFormData({
                    card_name: '',
                    card_type: 'debit',
                    card_network: '',
                    last_four_digits: '',
                    bank_account_id: '',
                    credit_limit: 0,
                    current_balance: 0,
                    interest_rate: 0,
                    billing_cycle_day: 1,
                    payment_due_day: 25,
                    minimum_payment_percent: 2.0,
                    expiry_date: '',
                    cardholder_name: '',
                    color: cardColors[0],
                    icon: 'CreditCard',
                    notes: '',
                });
            },
        });
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Card
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Add Payment Card</DialogTitle>
                    <DialogDescription>
                        Add a new debit or credit card to track your spending and payments.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                        {/* Card Name */}
                        <div className="grid gap-2">
                            <Label htmlFor="card_name">
                                Card Name <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="card_name"
                                value={formData.card_name}
                                onChange={(e) =>
                                    setFormData({ ...formData, card_name: e.target.value })
                                }
                                placeholder="e.g., Chase Sapphire, Wells Fargo Debit"
                                required
                            />
                        </div>

                        {/* Card Type */}
                        <div className="grid gap-2">
                            <Label htmlFor="card_type">
                                Card Type <span className="text-red-500">*</span>
                            </Label>
                            <Select
                                value={formData.card_type}
                                onValueChange={(value: 'debit' | 'credit') =>
                                    setFormData({ ...formData, card_type: value })
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {cardTypes.map((type) => (
                                        <SelectItem key={type.value} value={type.value}>
                                            {type.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Grid: Card Network + Last 4 Digits */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="card_network">Card Network</Label>
                                <Select
                                    value={formData.card_network}
                                    onValueChange={(value) =>
                                        setFormData({ ...formData, card_network: value })
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select network" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {cardNetworks.map((network) => (
                                            <SelectItem key={network} value={network}>
                                                {network}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="last_four_digits">Last 4 Digits</Label>
                                <Input
                                    id="last_four_digits"
                                    value={formData.last_four_digits}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            last_four_digits: e.target.value,
                                        })
                                    }
                                    placeholder="1234"
                                    maxLength={4}
                                    pattern="[0-9]{4}"
                                />
                            </div>
                        </div>

                        {/* Debit Card: Link to Bank Account */}
                        {formData.card_type === 'debit' && (
                            <div className="grid gap-2">
                                <Label htmlFor="bank_account_id">Linked Bank Account (Optional)</Label>
                                <Select
                                    value={formData.bank_account_id}
                                    onValueChange={(value) =>
                                        setFormData({ ...formData, bank_account_id: value })
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select account" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {activeAccounts.map((account) => (
                                            <SelectItem key={account.id} value={account.id}>
                                                {account.account_name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        {/* Credit Card Specific Fields */}
                        {formData.card_type === 'credit' && (
                            <>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="credit_limit">
                                            Credit Limit <span className="text-red-500">*</span>
                                        </Label>
                                        <Input
                                            id="credit_limit"
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            value={formData.credit_limit || ''}
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    credit_limit: parseFloat(e.target.value) || 0,
                                                })
                                            }
                                            required
                                        />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="current_balance">Current Balance</Label>
                                        <Input
                                            id="current_balance"
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            value={formData.current_balance || ''}
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    current_balance: parseFloat(e.target.value) || 0,
                                                })
                                            }
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="interest_rate">APR %</Label>
                                        <Input
                                            id="interest_rate"
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            max="100"
                                            value={formData.interest_rate || ''}
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    interest_rate: parseFloat(e.target.value) || 0,
                                                })
                                            }
                                            placeholder="18.99"
                                        />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="billing_cycle_day">Billing Day</Label>
                                        <Input
                                            id="billing_cycle_day"
                                            type="number"
                                            min="1"
                                            max="31"
                                            value={formData.billing_cycle_day || ''}
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    billing_cycle_day: parseInt(e.target.value) || 1,
                                                })
                                            }
                                        />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="payment_due_day">Due Day</Label>
                                        <Input
                                            id="payment_due_day"
                                            type="number"
                                            min="1"
                                            max="31"
                                            value={formData.payment_due_day || ''}
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    payment_due_day: parseInt(e.target.value) || 25,
                                                })
                                            }
                                        />
                                    </div>
                                </div>
                            </>
                        )}

                        {/* Expiry Date + Cardholder Name */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="expiry_date">Expiry Date</Label>
                                <Input
                                    id="expiry_date"
                                    type="date"
                                    value={formData.expiry_date}
                                    onChange={(e) =>
                                        setFormData({ ...formData, expiry_date: e.target.value })
                                    }
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="cardholder_name">Cardholder Name</Label>
                                <Input
                                    id="cardholder_name"
                                    value={formData.cardholder_name}
                                    onChange={(e) =>
                                        setFormData({ ...formData, cardholder_name: e.target.value })
                                    }
                                    placeholder="JOHN DOE"
                                />
                            </div>
                        </div>

                        {/* Color */}
                        <div className="grid gap-2">
                            <Label>Card Color</Label>
                            <div className="flex gap-2 flex-wrap">
                                {cardColors.map((color) => (
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
                        <div className="grid gap-2">
                            <Label htmlFor="notes">Notes (Optional)</Label>
                            <Textarea
                                id="notes"
                                value={formData.notes}
                                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                                    setFormData({ ...formData, notes: e.target.value })
                                }
                                placeholder="Add any additional information..."
                                rows={2}
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={createCard.isPending}>
                            {createCard.isPending ? 'Adding...' : 'Add Card'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
