import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
    HandCoins,
    MoreVertical,
    Trash2,
    Edit,
    Calendar,
    User,
    TrendingUp,
    DollarSign,
    Clock,
} from 'lucide-react';
import type { Loan } from '@/lib/hooks/use-budget-queries';
import { useDeleteLoan } from '@/lib/hooks/use-budget-queries';
import { format } from 'date-fns';

interface LoanCardProps {
    loan: Loan;
    onEdit?: (loan: Loan) => void;
    onMakePayment?: (loan: Loan) => void;
}

export function LoanCard({ loan, onEdit, onMakePayment }: LoanCardProps) {
    const deleteLoan = useDeleteLoan();

    const handleDelete = () => {
        if (
            confirm(
                `Are you sure you want to delete the loan "${loan.party_name}"? This will also delete all payment records.`
            )
        ) {
            deleteLoan.mutate(loan.id);
        }
    };

    // Calculate progress percentage
    const totalPaid = loan.total_amount - loan.outstanding_balance;
    const progressPercent = loan.total_amount > 0 ? (totalPaid / loan.total_amount) * 100 : 0;

    // Status badge variant
    const getStatusVariant = (status: string) => {
        switch (status) {
            case 'active':
                return 'default';
            case 'completed':
                return 'secondary';
            case 'defaulted':
                return 'destructive';
            case 'cancelled':
                return 'outline';
            default:
                return 'default';
        }
    };

    // Check if overdue
    const isOverdue = loan.due_date && new Date(loan.due_date) < new Date() && loan.status === 'active';

    return (
        <Card
            className="overflow-hidden transition-all hover:shadow-lg"
            style={{
                borderTop: `4px solid ${loan.loan_type === 'given' ? '#10b981' : '#ef4444'}`,
            }}
        >
            <CardContent className="p-6">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div
                            className="w-12 h-12 rounded-lg flex items-center justify-center"
                            style={{
                                backgroundColor:
                                    loan.loan_type === 'given' ? '#10b98120' : '#ef444420',
                            }}
                        >
                            <HandCoins
                                className="w-6 h-6"
                                style={{
                                    color: loan.loan_type === 'given' ? '#10b981' : '#ef4444',
                                }}
                            />
                        </div>
                        <div>
                            <h3 className="font-semibold text-lg">{loan.party_name}</h3>
                            <div className="flex items-center gap-2 mt-1">
                                <Badge
                                    variant={
                                        loan.loan_type === 'given' ? 'default' : 'secondary'
                                    }
                                >
                                    {loan.loan_type === 'given' ? 'Lent' : 'Borrowed'}
                                </Badge>
                                <Badge variant={getStatusVariant(loan.status)}>
                                    {loan.status}
                                </Badge>
                                {isOverdue && (
                                    <Badge variant="destructive">Overdue</Badge>
                                )}
                            </div>
                        </div>
                    </div>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                                <MoreVertical className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            {loan.status === 'active' && onMakePayment && (
                                <DropdownMenuItem onClick={() => onMakePayment(loan)}>
                                    <DollarSign className="mr-2 h-4 w-4" />
                                    {loan.loan_type === 'given' ? 'Receive Payment' : 'Make Payment'}
                                </DropdownMenuItem>
                            )}
                            {onEdit && (
                                <DropdownMenuItem onClick={() => onEdit(loan)}>
                                    <Edit className="mr-2 h-4 w-4" />
                                    Edit
                                </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                                onClick={handleDelete}
                                className="text-destructive focus:text-destructive"
                            >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                {/* Loan Details Grid */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                        <p className="text-sm text-muted-foreground">Principal Amount</p>
                        <p className="text-lg font-semibold">
                            ${loan.principal_amount.toLocaleString()}
                        </p>
                    </div>
                    <div>
                        <p className="text-sm text-muted-foreground">Total Amount</p>
                        <p className="text-lg font-semibold">
                            ${loan.total_amount.toLocaleString()}
                        </p>
                    </div>
                    <div>
                        <p className="text-sm text-muted-foreground">Outstanding</p>
                        <p className="text-lg font-semibold text-orange-600">
                            ${loan.outstanding_balance.toLocaleString()}
                        </p>
                    </div>
                    <div>
                        <p className="text-sm text-muted-foreground">Paid</p>
                        <p className="text-lg font-semibold text-green-600">
                            ${totalPaid.toLocaleString()}
                        </p>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-4">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-muted-foreground">Payment Progress</span>
                        <span className="text-sm font-medium">{progressPercent.toFixed(1)}%</span>
                    </div>
                    <Progress value={progressPercent} className="h-2" />
                </div>

                {/* Additional Info */}
                <div className="space-y-2 text-sm">
                    {loan.interest_rate > 0 && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <TrendingUp className="h-4 w-4" />
                            <span>
                                {loan.interest_rate}% {loan.interest_type} interest
                            </span>
                        </div>
                    )}
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>Started: {format(new Date(loan.start_date), 'MMM dd, yyyy')}</span>
                    </div>
                    {loan.due_date && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <Clock className="h-4 w-4" />
                            <span className={isOverdue ? 'text-destructive font-medium' : ''}>
                                Due: {format(new Date(loan.due_date), 'MMM dd, yyyy')}
                            </span>
                        </div>
                    )}
                    {loan.next_payment_date && loan.status === 'active' && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            <span>
                                Next Payment: {format(new Date(loan.next_payment_date), 'MMM dd, yyyy')}
                            </span>
                        </div>
                    )}
                    {loan.party_contact && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <User className="h-4 w-4" />
                            <span>{loan.party_contact}</span>
                        </div>
                    )}
                    {loan.purpose && (
                        <div className="text-muted-foreground">
                            <p className="font-medium">Purpose:</p>
                            <p className="text-xs">{loan.purpose}</p>
                        </div>
                    )}
                </div>

                {/* Action Button */}
                {loan.status === 'active' && onMakePayment && (
                    <Button
                        className="w-full mt-4"
                        variant="outline"
                        onClick={() => onMakePayment(loan)}
                    >
                        <DollarSign className="mr-2 h-4 w-4" />
                        {loan.loan_type === 'given' ? 'Receive Payment' : 'Make Payment'}
                    </Button>
                )}
            </CardContent>
        </Card>
    );
}
