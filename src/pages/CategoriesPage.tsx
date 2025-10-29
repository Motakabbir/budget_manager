import { useState } from 'react';
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
import { useCategories, useAddCategory, useUpdateCategory, useDeleteCategory } from '@/lib/hooks/use-budget-queries';
import { CategoryListSkeleton } from '@/components/loading/LoadingSkeletons';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

type Category = {
    id: string;
    user_id: string;
    name: string;
    type: 'income' | 'expense';
    color: string;
    icon: string | null;
    created_at: string;
    updated_at: string;
};

const COLORS = [
    '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16',
    '#22c55e', '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9',
    '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#d946ef',
    '#ec4899', '#f43f5e',
];

export default function CategoriesPage() {
    // React Query hooks
    const { data: categories = [], isLoading } = useCategories() as { data: Category[], isLoading: boolean };
    const addCategoryMutation = useAddCategory();
    const updateCategoryMutation = useUpdateCategory();
    const deleteCategoryMutation = useDeleteCategory();

    const [isOpen, setIsOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<any>(null);
    const [formData, setFormData] = useState({
        name: '',
        type: 'expense' as 'income' | 'expense',
        color: '#3b82f6',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (editingCategory) {
            await updateCategoryMutation.mutateAsync({
                id: editingCategory.id,
                updates: formData,
            });
        } else {
            await addCategoryMutation.mutateAsync({ ...formData, icon: null });
        }

        setIsOpen(false);
        setEditingCategory(null);
        setFormData({ name: '', type: 'expense', color: '#3b82f6' });
    };

    const handleEdit = (category: any) => {
        setEditingCategory(category);
        setFormData({
            name: category.name,
            type: category.type,
            color: category.color,
        });
        setIsOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (confirm('Are you sure you want to delete this category?')) {
            await deleteCategoryMutation.mutateAsync(id);
        }
    };

    const incomeCategories = categories.filter((c) => c.type === 'income');
    const expenseCategories = categories.filter((c) => c.type === 'expense');

    if (isLoading) {
        return <CategoryListSkeleton />;
    }

    return (
        <div className="space-y-6 p-4 sm:p-6 lg:p-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl sm:text-4xl font-bold bg-linear-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                        Categories
                    </h1>
                    <p className="text-muted-foreground mt-1">Manage your income and expense categories</p>
                </div>
                <Dialog open={isOpen} onOpenChange={setIsOpen}>
                    <DialogTrigger asChild>
                        <Button onClick={() => {
                            setEditingCategory(null);
                            setFormData({ name: '', type: 'expense', color: '#3b82f6' });
                        }} className="w-full sm:w-auto bg-linear-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                            <Plus className="mr-2 h-4 w-4" />
                            Add Category
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>
                                {editingCategory ? 'Edit Category' : 'Add New Category'}
                            </DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <Label htmlFor="name">Category Name</Label>
                                <Input
                                    id="name"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                />
                            </div>
                            <div>
                                <Label htmlFor="type">Type</Label>
                                <Select
                                    value={formData.type}
                                    onValueChange={(value: 'income' | 'expense') =>
                                        setFormData({ ...formData, type: value })
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="income">Income</SelectItem>
                                        <SelectItem value="expense">Expense</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label>Color</Label>
                                <div className="grid grid-cols-8 gap-2 mt-2">
                                    {COLORS.map((color) => (
                                        <button
                                            key={color}
                                            type="button"
                                            className={`w-8 h-8 rounded-full border-2 ${formData.color === color ? 'border-black' : 'border-transparent'
                                                }`}
                                            style={{ backgroundColor: color }}
                                            onClick={() => setFormData({ ...formData, color })}
                                        />
                                    ))}
                                </div>
                            </div>
                            <Button type="submit" className="w-full">
                                {editingCategory ? 'Update Category' : 'Add Category'}
                            </Button>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Income Categories */}
                <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
                    <CardHeader className="bg-linear-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20">
                        <CardTitle>Income Categories</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <div className="space-y-3">
                            {incomeCategories.length === 0 ? (
                                <p className="text-sm text-muted-foreground text-center py-8">No income categories yet</p>
                            ) : (
                                incomeCategories.map((category) => (
                                    <div
                                        key={category.id}
                                        className="flex items-center justify-between p-3 rounded-lg border hover:border-green-300 hover:shadow-md transition-all duration-200"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div
                                                className="w-4 h-4 rounded-full"
                                                style={{ backgroundColor: category.color }}
                                            />
                                            <span className="font-medium">{category.name}</span>
                                            <Badge variant="outline" className="text-green-600">
                                                Income
                                            </Badge>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleEdit(category)}
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleDelete(category.id)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Expense Categories */}
                <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
                    <CardHeader className="bg-linear-to-r from-red-50 to-rose-50 dark:from-red-950/20 dark:to-rose-950/20">
                        <CardTitle>Expense Categories</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <div className="space-y-3">
                            {expenseCategories.length === 0 ? (
                                <p className="text-sm text-muted-foreground text-center py-8">No expense categories yet</p>
                            ) : (
                                expenseCategories.map((category) => (
                                    <div
                                        key={category.id}
                                        className="flex items-center justify-between p-3 rounded-lg border hover:border-red-300 hover:shadow-md transition-all duration-200"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div
                                                className="w-4 h-4 rounded-full"
                                                style={{ backgroundColor: category.color }}
                                            />
                                            <span className="font-medium">{category.name}</span>
                                            <Badge variant="outline" className="text-red-600">
                                                Expense
                                            </Badge>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleEdit(category)}
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleDelete(category.id)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
