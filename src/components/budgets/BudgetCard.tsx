import { useState } from 'react';
import { MoreVertical, TrendingUp, TrendingDown, AlertTriangle, Calendar, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import type { BudgetWithSpending } from '@/lib/hooks/use-budget-queries';

interface BudgetCardProps {
    budget: BudgetWithSpending;
    onEdit: (budget: BudgetWithSpending) => void;
    onDelete: (id: string) => void;
}

export function BudgetCard({ budget, onEdit, onDelete }: BudgetCardProps) {
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const getStatusColor = () => {
        switch (budget.status) {
            case 'safe':
                return 'bg-green-500';
            case 'warning':
                return 'bg-yellow-500';
            case 'exceeded':
                return 'bg-red-500';
            default:
                return 'bg-gray-500';
        }
    };

    const getStatusBadge = () => {
        switch (budget.status) {
            case 'safe':
                return <Badge className="bg-green-100 text-green-700 hover:bg-green-100">On Track</Badge>;
            case 'warning':
                return <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100">Warning</Badge>;
            case 'exceeded':
                return <Badge className="bg-red-100 text-red-700 hover:bg-red-100">Exceeded</Badge>;
            default:
                return null;
        }
    };

    const handleDelete = () => {
        if (showDeleteConfirm) {
            onDelete(budget.id);
            setShowDeleteConfirm(false);
        } else {
            setShowDeleteConfirm(true);
            setTimeout(() => setShowDeleteConfirm(false), 3000);
        }
    };

    return (
        <Card className="overflow-hidden hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3 flex-1">
                        <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: budget.category?.color || '#6B7280' }}
                        />
                        <div className="flex-1">
                            <h3 className="font-semibold text-lg">{budget.category?.name || 'Unknown Category'}</h3>
                            <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline" className="text-xs">
                                    <Calendar className="w-3 h-3 mr-1" />
                                    {budget.period === 'monthly' ? 'Monthly' : 'Yearly'}
                                </Badge>
                                {getStatusBadge()}
                            </div>
                        </div>
                    </div>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => onEdit(budget)}>
                                Edit Budget
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={handleDelete}
                                className={showDeleteConfirm ? 'bg-red-50 text-red-600' : ''}
                            >
                                {showDeleteConfirm ? 'Click again to confirm' : 'Delete Budget'}
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </CardHeader>

            <CardContent className="space-y-4">
                {/* Amount Summary */}
                <div className="grid grid-cols-3 gap-2 text-sm">
                    <div>
                        <p className="text-muted-foreground text-xs">Budget</p>
                        <p className="font-semibold">${budget.amount.toLocaleString()}</p>
                    </div>
                    <div>
                        <p className="text-muted-foreground text-xs">Spent</p>
                        <p className={`font-semibold ${budget.status === 'exceeded' ? 'text-red-600' : ''}`}>
                            ${budget.spent.toLocaleString()}
                        </p>
                    </div>
                    <div>
                        <p className="text-muted-foreground text-xs">Remaining</p>
                        <p className={`font-semibold ${budget.remaining === 0 ? 'text-red-600' : 'text-green-600'}`}>
                            ${budget.remaining.toLocaleString()}
                        </p>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Progress</span>
                        <span className={`font-semibold ${
                            budget.percentage >= 100 ? 'text-red-600' : 
                            budget.percentage >= 80 ? 'text-yellow-600' : 
                            'text-green-600'
                        }`}>
                            {budget.percentage.toFixed(1)}%
                        </span>
                    </div>
                    <Progress 
                        value={Math.min(budget.percentage, 100)} 
                        className={`h-2 ${getStatusColor()}`}
                    />
                </div>

                {/* Alert Messages */}
                {budget.status === 'exceeded' && (
                    <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5" />
                        <div className="text-sm">
                            <p className="font-semibold text-red-600">Budget Exceeded!</p>
                            <p className="text-red-700 text-xs mt-1">
                                You've exceeded your budget by ${(budget.spent - budget.amount).toLocaleString()}
                            </p>
                        </div>
                    </div>
                )}

                {budget.status === 'warning' && (
                    <div className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5" />
                        <div className="text-sm">
                            <p className="font-semibold text-yellow-600">Approaching Limit</p>
                            <p className="text-yellow-700 text-xs mt-1">
                                Only ${budget.remaining.toLocaleString()} remaining of your budget
                            </p>
                        </div>
                    </div>
                )}

                {budget.status === 'safe' && budget.percentage > 50 && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <TrendingUp className="w-4 h-4" />
                        <span>You're on track with your spending</span>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
