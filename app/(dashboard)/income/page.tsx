'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { useBudgetStore } from '@/lib/store';
import { Plus, Pencil, Trash2, Download } from 'lucide-react';
import { format } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

export default function IncomePage() {
    const { transactions, categories, fetchTransactions, fetchCategories, addTransaction, updateTransaction, deleteTransaction } = useBudgetStore();
    const [loading, setLoading] = useState(true);
    const [isOpen, setIsOpen] = useState(false);
    const [editingTransaction, setEditingTransaction] = useState<any>(null);
    const [formData, setFormData] = useState({
        category_id: '',
        amount: '',
        description: '',
        date: new Date(),
    });

    useEffect(() => {
        const loadData = async () => {
            await Promise.all([fetchTransactions(), fetchCategories()]);
            setLoading(false);
        };
        loadData();
    }, [fetchTransactions, fetchCategories]);

    const incomeTransactions = transactions.filter((t) => t.type === 'income');
    const incomeCategories = categories.filter((c) => c.type === 'income');
    const totalIncome = incomeTransactions.reduce((sum, t) => sum + t.amount, 0);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const transactionData = {
            category_id: formData.category_id,
            amount: parseFloat(formData.amount),
            description: formData.description || null,
            date: format(formData.date, 'yyyy-MM-dd'),
            type: 'income' as const,
        };

        if (editingTransaction) {
            await updateTransaction(editingTransaction.id, transactionData);
        } else {
            await addTransaction(transactionData);
        }

        setIsOpen(false);
        setEditingTransaction(null);
        setFormData({ category_id: '', amount: '', description: '', date: new Date() });
    };

    const handleEdit = (transaction: any) => {
        setEditingTransaction(transaction);
        setFormData({
            category_id: transaction.category_id,
            amount: transaction.amount.toString(),
            description: transaction.description || '',
            date: new Date(transaction.date),
        });
        setIsOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (confirm('Are you sure you want to delete this transaction?')) {
            await deleteTransaction(id);
        }
    };

    const exportToCSV = () => {
        const headers = ['Date', 'Category', 'Amount', 'Description'];
        const rows = incomeTransactions.map((t) => [
            format(new Date(t.date), 'yyyy-MM-dd'),
            t.category?.name || 'Unknown',
            t.amount.toFixed(2),
            t.description || '',
        ]);

        const csv = [
            headers.join(','),
            ...rows.map((row) => row.join(',')),
        ].join('\n');

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `income_${format(new Date(), 'yyyy-MM-dd')}.csv`;
        a.click();
    };

    if (loading) {
        return <div>Loading...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Income</h1>
                    <p className="text-muted-foreground">Track your income sources</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={exportToCSV}>
                        <Download className="mr-2 h-4 w-4" />
                        Export CSV
                    </Button>
                    <Dialog open={isOpen} onOpenChange={setIsOpen}>
                        <DialogTrigger asChild>
                            <Button onClick={() => {
                                setEditingTransaction(null);
                                setFormData({ category_id: '', amount: '', description: '', date: new Date() });
                            }}>
                                <Plus className="mr-2 h-4 w-4" />
                                Add Income
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>
                                    {editingTransaction ? 'Edit Income' : 'Add New Income'}
                                </DialogTitle>
                            </DialogHeader>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <Label htmlFor="category">Category</Label>
                                    <Select
                                        value={formData.category_id}
                                        onValueChange={(value) =>
                                            setFormData({ ...formData, category_id: value })
                                        }
                                        required
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select a category" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {incomeCategories.map((category) => (
                                                <SelectItem key={category.id} value={category.id}>
                                                    {category.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label htmlFor="amount">Amount</Label>
                                    <Input
                                        id="amount"
                                        type="number"
                                        step="0.01"
                                        value={formData.amount}
                                        onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                        required
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="date">Date</Label>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button variant="outline" className="w-full justify-start">
                                                {format(formData.date, 'PPP')}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0">
                                            <Calendar
                                                mode="single"
                                                selected={formData.date}
                                                onSelect={(date) => date && setFormData({ ...formData, date })}
                                            />
                                        </PopoverContent>
                                    </Popover>
                                </div>
                                <div>
                                    <Label htmlFor="description">Description (Optional)</Label>
                                    <Input
                                        id="description"
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    />
                                </div>
                                <Button type="submit" className="w-full">
                                    {editingTransaction ? 'Update Income' : 'Add Income'}
                                </Button>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                        <span>Total Income</span>
                        <span className="text-green-600">${totalIncome.toFixed(2)}</span>
                    </CardTitle>
                </CardHeader>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Income Transactions</CardTitle>
                </CardHeader>
                <CardContent>
                    {incomeTransactions.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No income transactions yet</p>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Category</TableHead>
                                    <TableHead>Description</TableHead>
                                    <TableHead className="text-right">Amount</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {incomeTransactions.map((transaction) => (
                                    <TableRow key={transaction.id}>
                                        <TableCell>
                                            {format(new Date(transaction.date), 'MMM dd, yyyy')}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <div
                                                    className="w-3 h-3 rounded-full"
                                                    style={{ backgroundColor: transaction.category?.color }}
                                                />
                                                {transaction.category?.name || 'Unknown'}
                                            </div>
                                        </TableCell>
                                        <TableCell>{transaction.description || '-'}</TableCell>
                                        <TableCell className="text-right font-medium text-green-600">
                                            ${transaction.amount.toFixed(2)}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleEdit(transaction)}
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleDelete(transaction.id)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
