import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
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
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Plus, RefreshCw } from 'lucide-react';
import { format, addDays, addWeeks, addMonths, addYears } from 'date-fns';
import { useCategories, useCreateRecurring } from '@/lib/hooks/use-budget-queries';
import { cn } from '@/lib/utils';

export function AddRecurringDialog() {
    const [open, setOpen] = useState(false);
    const { data: categories = [] } = useCategories();
    const createRecurring = useCreateRecurring();

    const [formData, setFormData] = useState({
        type: 'expense' as 'income' | 'expense',
        category_id: '',
        amount: '',
        description: '',
        frequency: 'monthly' as 'daily' | 'weekly' | 'bi-weekly' | 'monthly' | 'quarterly' | 'yearly',
        start_date: new Date(),
        end_date: undefined as Date | undefined,
        next_occurrence: new Date(),
    });

    const filteredCategories = categories.filter(cat => cat.type === formData.type);

    // Calculate next occurrence based on start date and frequency
    const calculateNextOccurrence = (startDate: Date, frequency: string): Date => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        if (startDate >= today) {
            return startDate;
        }

        let nextDate = new Date(startDate);
        
        while (nextDate < today) {
            switch (frequency) {
                case 'daily':
                    nextDate = addDays(nextDate, 1);
                    break;
                case 'weekly':
                    nextDate = addWeeks(nextDate, 1);
                    break;
                case 'bi-weekly':
                    nextDate = addWeeks(nextDate, 2);
                    break;
                case 'monthly':
                    nextDate = addMonths(nextDate, 1);
                    break;
                case 'quarterly':
                    nextDate = addMonths(nextDate, 3);
                    break;
                case 'yearly':
                    nextDate = addYears(nextDate, 1);
                    break;
            }
        }

        return nextDate;
    };

    const handleStartDateChange = (date: Date | undefined) => {
        if (date) {
            setFormData(prev => ({
                ...prev,
                start_date: date,
                next_occurrence: calculateNextOccurrence(date, prev.frequency),
            }));
        }
    };

    const handleFrequencyChange = (frequency: string) => {
        setFormData(prev => ({
            ...prev,
            frequency: frequency as typeof prev.frequency,
            next_occurrence: calculateNextOccurrence(prev.start_date, frequency),
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.category_id || !formData.amount) {
            return;
        }

        await createRecurring.mutateAsync({
            type: formData.type,
            category_id: formData.category_id,
            amount: parseFloat(formData.amount),
            description: formData.description || undefined,
            frequency: formData.frequency,
            start_date: format(formData.start_date, 'yyyy-MM-dd'),
            end_date: formData.end_date ? format(formData.end_date, 'yyyy-MM-dd') : undefined,
            next_occurrence: format(formData.next_occurrence, 'yyyy-MM-dd'),
        });

        // Reset form
        setFormData({
            type: 'expense',
            category_id: '',
            amount: '',
            description: '',
            frequency: 'monthly',
            start_date: new Date(),
            end_date: undefined,
            next_occurrence: new Date(),
        });
        setOpen(false);
    };

    const frequencyOptions = [
        { value: 'daily', label: 'Daily', example: 'Every day' },
        { value: 'weekly', label: 'Weekly', example: 'Every week' },
        { value: 'bi-weekly', label: 'Bi-Weekly', example: 'Every 2 weeks' },
        { value: 'monthly', label: 'Monthly', example: 'Every month' },
        { value: 'quarterly', label: 'Quarterly', example: 'Every 3 months' },
        { value: 'yearly', label: 'Yearly', example: 'Every year' },
    ];

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Recurring Transaction
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <RefreshCw className="h-5 w-5" />
                        Create Recurring Transaction
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Transaction Type */}
                    <div className="space-y-2">
                        <Label>Transaction Type</Label>
                        <Select
                            value={formData.type}
                            onValueChange={(value: 'income' | 'expense') => 
                                setFormData(prev => ({ 
                                    ...prev, 
                                    type: value,
                                    category_id: '' // Reset category when type changes
                                }))
                            }
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="expense">Expense</SelectItem>
                                <SelectItem value="income">Income</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Category */}
                    <div className="space-y-2">
                        <Label>Category *</Label>
                        <Select
                            value={formData.category_id}
                            onValueChange={(value) => setFormData(prev => ({ ...prev, category_id: value }))}
                            required
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                            <SelectContent>
                                {filteredCategories.map((category) => (
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
                    </div>

                    {/* Amount */}
                    <div className="space-y-2">
                        <Label>Amount *</Label>
                        <Input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="0.00"
                            value={formData.amount}
                            onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                            required
                        />
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                        <Label>Description</Label>
                        <Textarea
                            placeholder="e.g., Monthly rent payment"
                            value={formData.description}
                            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                            rows={2}
                        />
                    </div>

                    {/* Frequency */}
                    <div className="space-y-2">
                        <Label>Frequency *</Label>
                        <Select
                            value={formData.frequency}
                            onValueChange={handleFrequencyChange}
                            required
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {frequencyOptions.map((option) => (
                                    <SelectItem key={option.value} value={option.value}>
                                        <div className="flex flex-col items-start">
                                            <span className="font-medium">{option.label}</span>
                                            <span className="text-xs text-muted-foreground">{option.example}</span>
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Date Range */}
                    <div className="grid grid-cols-2 gap-4">
                        {/* Start Date */}
                        <div className="space-y-2">
                            <Label>Start Date *</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className={cn(
                                            'w-full justify-start text-left font-normal',
                                            !formData.start_date && 'text-muted-foreground'
                                        )}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {formData.start_date ? format(formData.start_date, 'PPP') : 'Pick a date'}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                        mode="single"
                                        selected={formData.start_date}
                                        onSelect={handleStartDateChange}
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>

                        {/* End Date */}
                        <div className="space-y-2">
                            <Label>End Date (Optional)</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className={cn(
                                            'w-full justify-start text-left font-normal',
                                            !formData.end_date && 'text-muted-foreground'
                                        )}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {formData.end_date ? format(formData.end_date, 'PPP') : 'No end date'}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                        mode="single"
                                        selected={formData.end_date}
                                        onSelect={(date) => setFormData(prev => ({ ...prev, end_date: date }))}
                                        disabled={(date) => date < formData.start_date}
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>
                    </div>

                    {/* Next Occurrence Preview */}
                    <div className="p-4 bg-muted rounded-lg">
                        <div className="text-sm font-medium mb-2">Preview:</div>
                        <div className="text-sm text-muted-foreground">
                            Next transaction will be created on{' '}
                            <span className="font-medium text-foreground">
                                {format(formData.next_occurrence, 'MMMM dd, yyyy')}
                            </span>
                        </div>
                        {formData.end_date && (
                            <div className="text-xs text-muted-foreground mt-1">
                                This will continue until {format(formData.end_date, 'MMMM dd, yyyy')}
                            </div>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-3">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button 
                            type="submit" 
                            disabled={createRecurring.isPending}
                        >
                            {createRecurring.isPending ? 'Creating...' : 'Create Recurring Transaction'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
