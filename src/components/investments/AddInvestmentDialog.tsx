/**
 * AddInvestmentDialog Component
 * Form for adding new investments with support for 10 investment types
 */

import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useCreateInvestment } from '@/lib/hooks/use-investment-queries';
import type { InvestmentType } from '@/lib/supabase/database.types';
import { toast } from 'sonner';

interface AddInvestmentDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

const INVESTMENT_TYPES: { value: InvestmentType; label: string }[] = [
    { value: 'stock', label: 'Stock' },
    { value: 'mutual_fund', label: 'Mutual Fund' },
    { value: 'bond', label: 'Bond' },
    { value: 'crypto', label: 'Cryptocurrency' },
    { value: 'fixed_deposit', label: 'Fixed Deposit' },
    { value: 'gold', label: 'Gold' },
    { value: 'etf', label: 'ETF' },
    { value: 'reit', label: 'REIT' },
    { value: 'commodities', label: 'Commodities' },
    { value: 'other', label: 'Other' },
];

const CURRENCIES = ['USD', 'EUR', 'GBP', 'INR', 'JPY', 'CNY', 'AUD', 'CAD'];

export function AddInvestmentDialog({ open, onOpenChange }: AddInvestmentDialogProps) {
    const [investmentType, setInvestmentType] = useState<InvestmentType>('stock');
    const [name, setName] = useState('');
    const [symbol, setSymbol] = useState('');
    const [currency, setCurrency] = useState('USD');
    const [quantity, setQuantity] = useState('');
    const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0]);
    const [purchasePrice, setPurchasePrice] = useState('');
    const [currentPrice, setCurrentPrice] = useState('');
    const [platform, setPlatform] = useState('');
    const [dividendYield, setDividendYield] = useState('');
    const [notes, setNotes] = useState('');

    const { mutate: createInvestment, isPending } = useCreateInvestment();

    const resetForm = () => {
        setInvestmentType('stock');
        setName('');
        setSymbol('');
        setCurrency('USD');
        setQuantity('');
        setPurchaseDate(new Date().toISOString().split('T')[0]);
        setPurchasePrice('');
        setCurrentPrice('');
        setPlatform('');
        setDividendYield('');
        setNotes('');
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!name.trim()) {
            toast.error('Please enter investment name');
            return;
        }

        if (!quantity || parseFloat(quantity) <= 0) {
            toast.error('Please enter a valid quantity');
            return;
        }

        if (!purchasePrice || parseFloat(purchasePrice) <= 0) {
            toast.error('Please enter a valid purchase price');
            return;
        }

        if (!currentPrice || parseFloat(currentPrice) <= 0) {
            toast.error('Please enter a valid current price');
            return;
        }

        createInvestment(
            {
                investment_type: investmentType,
                name: name.trim(),
                symbol: symbol.trim() || null,
                currency,
                quantity: parseFloat(quantity),
                purchase_date: purchaseDate,
                purchase_price: parseFloat(purchasePrice),
                current_price: parseFloat(currentPrice),
                platform: platform.trim() || null,
                dividend_yield: dividendYield ? parseFloat(dividendYield) : null,
                notes: notes.trim() || null,
                // Required fields with defaults
                is_active: true,
                last_dividend_date: null,
                total_dividends_received: 0,
            },
            {
                onSuccess: () => {
                    onOpenChange(false);
                    resetForm();
                },
            }
        );
    };

    const handleClose = () => {
        resetForm();
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Add New Investment</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Investment Type */}
                    <div className="space-y-2">
                        <Label htmlFor="investment_type">Investment Type *</Label>
                        <Select
                            value={investmentType}
                            onValueChange={(value) => setInvestmentType(value as InvestmentType)}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                                {INVESTMENT_TYPES.map((type) => (
                                    <SelectItem key={type.value} value={type.value}>
                                        {type.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Name */}
                    <div className="space-y-2">
                        <Label htmlFor="name">Investment Name *</Label>
                        <Input
                            id="name"
                            placeholder="e.g., Apple Inc, Bitcoin, Gold ETF"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {/* Symbol */}
                        <div className="space-y-2">
                            <Label htmlFor="symbol">Symbol/Ticker</Label>
                            <Input
                                id="symbol"
                                placeholder="e.g., AAPL, BTC"
                                value={symbol}
                                onChange={(e) => setSymbol(e.target.value)}
                            />
                        </div>

                        {/* Currency */}
                        <div className="space-y-2">
                            <Label htmlFor="currency">Currency</Label>
                            <Select value={currency} onValueChange={setCurrency}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select currency" />
                                </SelectTrigger>
                                <SelectContent>
                                    {CURRENCIES.map((curr) => (
                                        <SelectItem key={curr} value={curr}>
                                            {curr}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {/* Quantity */}
                        <div className="space-y-2">
                            <Label htmlFor="quantity">Quantity *</Label>
                            <Input
                                id="quantity"
                                type="number"
                                step="0.00000001"
                                min="0"
                                placeholder="1.0"
                                value={quantity}
                                onChange={(e) => setQuantity(e.target.value)}
                            />
                        </div>

                        {/* Purchase Date */}
                        <div className="space-y-2">
                            <Label htmlFor="purchase_date">Purchase Date *</Label>
                            <Input
                                id="purchase_date"
                                type="date"
                                max={new Date().toISOString().split('T')[0]}
                                value={purchaseDate}
                                onChange={(e) => setPurchaseDate(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {/* Purchase Price */}
                        <div className="space-y-2">
                            <Label htmlFor="purchase_price">Purchase Price (per unit) *</Label>
                            <Input
                                id="purchase_price"
                                type="number"
                                step="0.01"
                                min="0"
                                placeholder="0.00"
                                value={purchasePrice}
                                onChange={(e) => setPurchasePrice(e.target.value)}
                            />
                        </div>

                        {/* Current Price */}
                        <div className="space-y-2">
                            <Label htmlFor="current_price">Current Price (per unit) *</Label>
                            <Input
                                id="current_price"
                                type="number"
                                step="0.01"
                                min="0"
                                placeholder="0.00"
                                value={currentPrice}
                                onChange={(e) => setCurrentPrice(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {/* Platform */}
                        <div className="space-y-2">
                            <Label htmlFor="platform">Platform/Broker</Label>
                            <Input
                                id="platform"
                                placeholder="e.g., Robinhood, Coinbase, Fidelity"
                                value={platform}
                                onChange={(e) => setPlatform(e.target.value)}
                            />
                        </div>

                        {/* Dividend Yield */}
                        <div className="space-y-2">
                            <Label htmlFor="dividend_yield">Dividend Yield (%)</Label>
                            <Input
                                id="dividend_yield"
                                type="number"
                                step="0.01"
                                min="0"
                                max="100"
                                placeholder="0.00"
                                value={dividendYield}
                                onChange={(e) => setDividendYield(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Notes */}
                    <div className="space-y-2">
                        <Label htmlFor="notes">Notes</Label>
                        <Textarea
                            id="notes"
                            placeholder="Add any additional notes about this investment..."
                            rows={3}
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                        />
                    </div>

                    <DialogFooter className="gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleClose}
                            disabled={isPending}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isPending}>
                            {isPending ? 'Adding...' : 'Add Investment'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
