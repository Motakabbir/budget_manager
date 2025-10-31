import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
    MoreVertical, 
    Play, 
    Pause, 
    Edit, 
    Trash2, 
    Calendar, 
    TrendingUp, 
    TrendingDown,
    RefreshCw,
    Clock
} from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { RecurringTransaction } from '@/lib/hooks/use-budget-queries';
import { format, addDays, addWeeks, addMonths, addYears, differenceInDays } from 'date-fns';

interface RecurringCardProps {
    recurring: RecurringTransaction;
    onEdit?: (recurring: RecurringTransaction) => void;
    onDelete?: (id: string) => void;
    onToggle?: (id: string, isActive: boolean) => void;
    onExecute?: (id: string) => void;
}

export function RecurringCard({ 
    recurring, 
    onEdit, 
    onDelete, 
    onToggle,
    onExecute 
}: RecurringCardProps) {
    const isIncome = recurring.type === 'income';
    const isActive = recurring.is_active;

    // Calculate days until next occurrence
    const nextDate = new Date(recurring.next_occurrence);
    const today = new Date();
    const daysUntil = differenceInDays(nextDate, today);

    // Get frequency display text
    const getFrequencyText = (frequency: string) => {
        const map: Record<string, string> = {
            'daily': 'Daily',
            'weekly': 'Weekly',
            'bi-weekly': 'Bi-Weekly',
            'monthly': 'Monthly',
            'quarterly': 'Quarterly',
            'yearly': 'Yearly'
        };
        return map[frequency] || frequency;
    };

    // Get next few occurrences preview
    const getNextOccurrences = (startDate: Date, frequency: string, count: number = 3) => {
        const dates: Date[] = [];
        let currentDate = startDate;

        for (let i = 0; i < count; i++) {
            dates.push(new Date(currentDate));
            
            switch (frequency) {
                case 'daily':
                    currentDate = addDays(currentDate, 1);
                    break;
                case 'weekly':
                    currentDate = addWeeks(currentDate, 1);
                    break;
                case 'bi-weekly':
                    currentDate = addWeeks(currentDate, 2);
                    break;
                case 'monthly':
                    currentDate = addMonths(currentDate, 1);
                    break;
                case 'quarterly':
                    currentDate = addMonths(currentDate, 3);
                    break;
                case 'yearly':
                    currentDate = addYears(currentDate, 1);
                    break;
            }

            // Stop if we've passed the end date
            if (recurring.end_date && currentDate > new Date(recurring.end_date)) {
                break;
            }
        }

        return dates;
    };

    const nextOccurrences = getNextOccurrences(nextDate, recurring.frequency);

    return (
        <Card className={`overflow-hidden transition-all hover:shadow-md ${
            !isActive ? 'opacity-60' : ''
        }`}>
            <CardHeader className={`pb-3 ${
                isIncome 
                    ? 'bg-green-50 dark:bg-green-950/20 border-b-2 border-green-200 dark:border-green-900' 
                    : 'bg-red-50 dark:bg-red-950/20 border-b-2 border-red-200 dark:border-red-900'
            }`}>
                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                            {isIncome ? (
                                <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
                            ) : (
                                <TrendingDown className="h-5 w-5 text-red-600 dark:text-red-400" />
                            )}
                            <h3 className="font-semibold text-lg">
                                {recurring.description || 'Recurring Transaction'}
                            </h3>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant={isIncome ? 'default' : 'destructive'}>
                                {isIncome ? 'Income' : 'Expense'}
                            </Badge>
                            <Badge variant="outline" className="gap-1">
                                <RefreshCw className="h-3 w-3" />
                                {getFrequencyText(recurring.frequency)}
                            </Badge>
                            <Badge 
                                variant={isActive ? 'default' : 'secondary'}
                                className={isActive ? 'bg-green-600' : ''}
                            >
                                {isActive ? 'Active' : 'Inactive'}
                            </Badge>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className={`text-2xl font-bold ${
                            isIncome ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                        }`}>
                            ${recurring.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <MoreVertical className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                {isActive && onExecute && (
                                    <>
                                        <DropdownMenuItem onClick={() => onExecute(recurring.id)}>
                                            <Play className="mr-2 h-4 w-4" />
                                            Create Transaction Now
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                    </>
                                )}
                                {onEdit && (
                                    <DropdownMenuItem onClick={() => onEdit(recurring)}>
                                        <Edit className="mr-2 h-4 w-4" />
                                        Edit
                                    </DropdownMenuItem>
                                )}
                                {onToggle && (
                                    <DropdownMenuItem onClick={() => onToggle(recurring.id, !isActive)}>
                                        {isActive ? (
                                            <>
                                                <Pause className="mr-2 h-4 w-4" />
                                                Deactivate
                                            </>
                                        ) : (
                                            <>
                                                <Play className="mr-2 h-4 w-4" />
                                                Activate
                                            </>
                                        )}
                                    </DropdownMenuItem>
                                )}
                                {onDelete && (
                                    <>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem 
                                            onClick={() => onDelete(recurring.id)}
                                            className="text-red-600 dark:text-red-400"
                                        >
                                            <Trash2 className="mr-2 h-4 w-4" />
                                            Delete
                                        </DropdownMenuItem>
                                    </>
                                )}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="pt-4 space-y-4">
                {/* Category */}
                {recurring.category && (
                    <div className="flex items-center gap-2">
                        <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: recurring.category.color }}
                        />
                        <span className="text-sm font-medium">{recurring.category.name}</span>
                    </div>
                )}

                {/* Next Occurrence */}
                <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>Next occurrence:</span>
                    </div>
                    <div className="font-medium">
                        {format(nextDate, 'MMM dd, yyyy')}
                        {daysUntil === 0 && <span className="text-orange-600 ml-2">(Today)</span>}
                        {daysUntil === 1 && <span className="text-orange-600 ml-2">(Tomorrow)</span>}
                        {daysUntil > 1 && daysUntil <= 7 && (
                            <span className="text-blue-600 ml-2">(in {daysUntil} days)</span>
                        )}
                    </div>
                </div>

                {/* Date Range */}
                <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>Period:</span>
                    </div>
                    <div className="text-right">
                        <div>{format(new Date(recurring.start_date), 'MMM dd, yyyy')}</div>
                        <div className="text-xs text-muted-foreground">
                            {recurring.end_date 
                                ? `until ${format(new Date(recurring.end_date), 'MMM dd, yyyy')}`
                                : 'No end date'
                            }
                        </div>
                    </div>
                </div>

                {/* Upcoming Occurrences Preview */}
                {isActive && nextOccurrences.length > 0 && (
                    <div className="pt-3 border-t">
                        <div className="text-xs font-medium text-muted-foreground mb-2">
                            Upcoming Transactions:
                        </div>
                        <div className="space-y-1">
                            {nextOccurrences.slice(0, 3).map((date, index) => (
                                <div key={index} className="flex items-center justify-between text-xs">
                                    <span className="text-muted-foreground">
                                        {format(date, 'MMM dd, yyyy')}
                                    </span>
                                    <span className={`font-medium ${
                                        isIncome ? 'text-green-600' : 'text-red-600'
                                    }`}>
                                        ${recurring.amount.toFixed(2)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
