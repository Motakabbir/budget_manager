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
import { Plus, Pencil, Trash2, Download, CalendarIcon, PlusCircle } from 'lucide-react';
import { format } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

const COLORS = [
    '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16',
    '#22c55e', '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9',
    '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#d946ef',
    '#ec4899', '#f43f5e',
];

export default function ExpensesPage() {
    const { transactions, categories, fetchTransactions, fetchCategories, addTransaction, updateTransaction, deleteTransaction, addCategory } = useBudgetStore();
    const [loading, setLoading] = useState(true);
    const [isOpen, setIsOpen] = useState(false);
    const [showNewCategory, setShowNewCategory] = useState(false);
    const [editingTransaction, setEditingTransaction] = useState<any>(null);
    const [formData, setFormData] = useState({
        category_id: '',
        amount: '',
        description: '',
        date: new Date(),
    });
    const [newCategoryData, setNewCategoryData] = useState({
        name: '',
        color: '#ef4444',
    });

    useEffect(() => {
        const loadData = async () => {
            await Promise.all([fetchTransactions(), fetchCategories()]);
            setLoading(false);
        };
        loadData();
    }, [fetchTransactions, fetchCategories]);

    const expenseTransactions = transactions.filter((t) => t.type === 'expense');
    const expenseCategories = categories.filter((c) => c.type === 'expense');
    const totalExpenses = expenseTransactions.reduce((sum, t) => sum + t.amount, 0);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const transactionData = {
            category_id: formData.category_id,
            amount: parseFloat(formData.amount),
            description: formData.description || null,
            date: format(formData.date, 'yyyy-MM-dd'),
            type: 'expense' as const,
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

    const handleCreateCategory = async () => {
        if (!newCategoryData.name) return;

        await addCategory({
            name: newCategoryData.name,
            type: 'expense',
            color: newCategoryData.color,
            icon: null,
        });

        await fetchCategories();
        const updatedCategories = categories.filter((c) => c.type === 'expense');
        const newCategory = updatedCategories.find((c) => c.name === newCategoryData.name);

        if (newCategory) {
            setFormData({ ...formData, category_id: newCategory.id });
        }

        setShowNewCategory(false);
        setNewCategoryData({ name: '', color: '#ef4444' });
    }; const handleEdit = (transaction: any) => {
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
        const rows = expenseTransactions.map((t) => [
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
        a.download = `expenses_${format(new Date(), 'yyyy-MM-dd')}.csv`;
        a.click();
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[50vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6 p-4 sm:p-6 lg:p-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl sm:text-4xl font-bold bg-linear-to-r from-red-600 to-rose-600 bg-clip-text text-transparent">
                        Expenses
                    </h1>
                    <p className="text-muted-foreground mt-1">Track your spending</p>
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                    <Button variant="outline" onClick={exportToCSV} className="flex-1 sm:flex-none">
                        <Download className="mr-2 h-4 w-4" />
                        <span className="hidden sm:inline">Export CSV</span>
                    </Button>
                    <Dialog open={isOpen} onOpenChange={setIsOpen}>
                        <DialogTrigger asChild>
                            <Button onClick={() => {
                                setEditingTransaction(null);
                                setFormData({ category_id: '', amount: '', description: '', date: new Date() });
                                setShowNewCategory(false);
                            }} className="flex-1 sm:flex-none bg-linear-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700">
                                <Plus className="mr-2 h-4 w-4" />
                                Add Expense
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-md">
                            <DialogHeader>
                                <DialogTitle className="text-xl">
                                    {editingTransaction ? 'Edit Expense' : 'Add New Expense'}
                                </DialogTitle>
                            </DialogHeader>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="category">Expense Category</Label>
                                    {!showNewCategory ? (
                                        <div className="space-y-2">
                                            <Select
                                                value={formData.category_id}
                                                onValueChange={(value) =>
                                                    setFormData({ ...formData, category_id: value })
                                                }
                                                required={!showNewCategory}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select a category" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {expenseCategories.map((category) => (
                                                        <SelectItem key={category.id} value={category.id}>
                                                            <div className="flex items-center gap-2">
                                                                <div
                                                                    className="w-3 h-3 rounded-full"
                                                                    style={{ backgroundColor: category.color }}
                                                                />
                                                                {category.name}
                                                            </div>
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setShowNewCategory(true)}
                                                className="w-full"
                                            >
                                                <PlusCircle className="mr-2 h-4 w-4" />
                                                Create New Category
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="space-y-3 p-4 border rounded-lg bg-muted/50">
                                            <div>
                                                <Label htmlFor="newCategoryName">Category Name</Label>
                                                <Input
                                                    id="newCategoryName"
                                                    value={newCategoryData.name}
                                                    onChange={(e) => setNewCategoryData({ ...newCategoryData, name: e.target.value })}
                                                    placeholder="e.g., Food, Transport, Rent"
                                                />
                                            </div>
                                            <div>
                                                <Label>Category Color</Label>
                                                <div className="grid grid-cols-9 gap-2 mt-2">
                                                    {COLORS.map((color) => (
                                                        <button
                                                            key={color}
                                                            type="button"
                                                            className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${newCategoryData.color === color ? 'border-foreground ring-2 ring-offset-2' : 'border-transparent'
                                                                }`}
                                                            style={{ backgroundColor: color }}
                                                            onClick={() => setNewCategoryData({ ...newCategoryData, color })}
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => {
                                                        setShowNewCategory(false);
                                                        setNewCategoryData({ name: '', color: '#ef4444' });
                                                    }}
                                                    className="flex-1"
                                                >
                                                    Cancel
                                                </Button>
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    onClick={handleCreateCategory}
                                                    className="flex-1"
                                                    disabled={!newCategoryData.name}
                                                >
                                                    Create
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <Label htmlFor="amount">Amount</Label>
                                    <Input
                                        id="amount"
                                        type="number"
                                        step="0.01"
                                        placeholder="0.00"
                                        value={formData.amount}
                                        onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                        required
                                        className="text-lg"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="date">Date</Label>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button variant="outline" className="w-full justify-start text-left font-normal">
                                                <CalendarIcon className="mr-2 h-4 w-4" />
                                                {format(formData.date, 'PPP')}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0" align="start">
                                            <Calendar
                                                mode="single"
                                                selected={formData.date}
                                                onSelect={(date) => date && setFormData({ ...formData, date })}
                                                initialFocus
                                            />
                                        </PopoverContent>
                                    </Popover>
                                </div>
                                <div>
                                    <Label htmlFor="description">Description (Optional)</Label>
                                    <Input
                                        id="description"
                                        placeholder="Add a note..."
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    />
                                </div>
                                <Button type="submit" className="w-full bg-linear-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700" disabled={showNewCategory}>
                                    {editingTransaction ? 'Update Expense' : 'Add Expense'}
                                </Button>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            <Card className="overflow-hidden border-2 shadow-lg">
                <CardHeader className="bg-linear-to-r from-red-50 to-rose-50 dark:from-red-950/20 dark:to-rose-950/20">
                    <CardTitle className="flex items-center justify-between text-lg sm:text-xl">
                        <span>Total Expenses</span>
                        <span className="text-2xl sm:text-3xl font-bold text-red-600">${totalExpenses.toFixed(2)}</span>
                    </CardTitle>
                </CardHeader>
            </Card>

            <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle>Expense Transactions</CardTitle>
                </CardHeader>
                <CardContent className="p-0 sm:p-6">
                    {expenseTransactions.length === 0 ? (
                        <div className="text-center py-12">
                            <p className="text-muted-foreground">No expense transactions yet</p>
                            <p className="text-sm text-muted-foreground mt-2">Click &quot;Add Expense&quot; to get started</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-20 sm:w-auto">Date</TableHead>
                                        <TableHead className="hidden sm:table-cell">Category</TableHead>
                                        <TableHead className="hidden md:table-cell">Description</TableHead>
                                        <TableHead className="text-right">Amount</TableHead>
                                        <TableHead className="text-right w-20 sm:w-auto">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {expenseTransactions.map((transaction) => (
                                        <TableRow key={transaction.id} className="hover:bg-muted/50">
                                            <TableCell className="font-medium">
                                                {format(new Date(transaction.date), 'MMM dd, yyyy')}
                                            </TableCell>
                                            <TableCell className="hidden sm:table-cell">
                                                <div className="flex items-center gap-2">
                                                    <div
                                                        className="w-3 h-3 rounded-full"
                                                        style={{ backgroundColor: transaction.category?.color }}
                                                    />
                                                    {transaction.category?.name || 'Unknown'}
                                                </div>
                                            </TableCell>
                                            <TableCell className="hidden md:table-cell">{transaction.description || '-'}</TableCell>
                                            <TableCell className="text-right font-bold text-red-600">
                                                ${transaction.amount.toFixed(2)}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleEdit(transaction)}
                                                        className="h-8 w-8"
                                                    >
                                                        <Pencil className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleDelete(transaction.id)}
                                                        className="h-8 w-8 text-destructive"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
