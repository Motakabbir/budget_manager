import { useState, useMemo } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
    AddLoanDialog,
    LoanCard,
    LoanPaymentDialog,
} from '@/components/loans';
import {
    useLoans,
    useLoanPayments,
    type Loan,
} from '@/lib/hooks/use-budget-queries';
import {
    HandCoins,
    TrendingUp,
    TrendingDown,
    DollarSign,
    AlertCircle,
    Calendar,
    ArrowDownLeft,
    ArrowUpRight,
} from 'lucide-react';
import { format } from 'date-fns';

export default function LoansPage() {
    const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);
    const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);

    const { data: loans = [], isLoading: loansLoading } = useLoans();
    const { data: payments = [], isLoading: paymentsLoading } = useLoanPayments();

    // Separate loans by type
    const loansGiven = loans.filter((loan) => loan.loan_type === 'given' && loan.status === 'active');
    const loansTaken = loans.filter((loan) => loan.loan_type === 'taken' && loan.status === 'active');
    const completedLoans = loans.filter((loan) => loan.status === 'completed');

    // Calculate loan statistics
    const loanStats = useMemo(() => {
        const stats = {
            // Loans Given (Lent out)
            givenPrincipal: 0,
            givenTotal: 0,
            givenOutstanding: 0,
            givenReceived: 0,
            // Loans Taken (Borrowed)
            takenPrincipal: 0,
            takenTotal: 0,
            takenOutstanding: 0,
            takenPaid: 0,
            // Overall
            netPosition: 0, // Positive = more lent than borrowed
            overdueCount: 0,
        };

        const now = new Date();

        loans.forEach((loan) => {
            const totalPaid = loan.total_amount - loan.outstanding_balance;
            const isOverdue = loan.due_date && new Date(loan.due_date) < now && loan.status === 'active';

            if (loan.loan_type === 'given') {
                stats.givenPrincipal += loan.principal_amount;
                stats.givenTotal += loan.total_amount;
                stats.givenOutstanding += loan.outstanding_balance;
                stats.givenReceived += totalPaid;
            } else {
                stats.takenPrincipal += loan.principal_amount;
                stats.takenTotal += loan.total_amount;
                stats.takenOutstanding += loan.outstanding_balance;
                stats.takenPaid += totalPaid;
            }

            if (isOverdue) {
                stats.overdueCount++;
            }
        });

        // Net position: what you're owed minus what you owe
        stats.netPosition = stats.givenOutstanding - stats.takenOutstanding;

        return stats;
    }, [loans]);

    // Recent payments
    const recentPayments = useMemo(() => {
        return [...payments]
            .sort(
                (a, b) =>
                    new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime()
            )
            .slice(0, 15);
    }, [payments]);

    // This month's payments
    const thisMonthPayments = useMemo(() => {
        const now = new Date();
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        return payments.filter(
            (payment) => new Date(payment.payment_date) >= firstDayOfMonth
        );
    }, [payments]);

    const totalPaidThisMonth = thisMonthPayments.reduce(
        (sum, payment) => sum + payment.payment_amount,
        0
    );

    const handleMakePayment = (loan: Loan) => {
        setSelectedLoan(loan);
        setPaymentDialogOpen(true);
    };

    if (loansLoading) {
        return (
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <Skeleton className="h-8 w-32" />
                    <Skeleton className="h-10 w-24" />
                </div>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {[1, 2, 3, 4].map((i) => (
                        <Skeleton key={i} className="h-32" />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold">Loans</h1>
                <AddLoanDialog />
            </div>

            {/* Loan Statistics */}
            {loans.length > 0 && (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {/* Loans Given Outstanding */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Loans Given (Owed to You)</CardTitle>
                            <ArrowDownLeft className="h-4 w-4 text-green-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-600">
                                ${loanStats.givenOutstanding.toLocaleString()}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                ${loanStats.givenReceived.toLocaleString()} received of ${loanStats.givenTotal.toLocaleString()} total
                            </p>
                        </CardContent>
                    </Card>

                    {/* Loans Taken Outstanding */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Loans Taken (You Owe)</CardTitle>
                            <ArrowUpRight className="h-4 w-4 text-red-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-red-600">
                                ${loanStats.takenOutstanding.toLocaleString()}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                ${loanStats.takenPaid.toLocaleString()} paid of ${loanStats.takenTotal.toLocaleString()} total
                            </p>
                        </CardContent>
                    </Card>

                    {/* Net Position */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Net Position</CardTitle>
                            {loanStats.netPosition >= 0 ? (
                                <TrendingUp className="h-4 w-4 text-green-600" />
                            ) : (
                                <TrendingDown className="h-4 w-4 text-red-600" />
                            )}
                        </CardHeader>
                        <CardContent>
                            <div
                                className={`text-2xl font-bold ${
                                    loanStats.netPosition >= 0 ? 'text-green-600' : 'text-red-600'
                                }`}
                            >
                                {loanStats.netPosition >= 0 ? '+' : ''}
                                ${loanStats.netPosition.toLocaleString()}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                {loanStats.netPosition >= 0
                                    ? 'More lent than borrowed'
                                    : 'More borrowed than lent'}
                            </p>
                        </CardContent>
                    </Card>

                    {/* This Month Payments */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">This Month Payments</CardTitle>
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                ${totalPaidThisMonth.toLocaleString()}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                {thisMonthPayments.length} payment{thisMonthPayments.length !== 1 ? 's' : ''}
                            </p>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Overdue Warning */}
            {loanStats.overdueCount > 0 && (
                <Card className="border-red-500 bg-red-50 dark:bg-red-950/20">
                    <CardContent className="flex items-center gap-3 pt-6">
                        <AlertCircle className="h-5 w-5 text-red-600" />
                        <div>
                            <p className="font-medium text-red-900 dark:text-red-100">
                                Overdue Loans
                            </p>
                            <p className="text-sm text-red-700 dark:text-red-300">
                                {loanStats.overdueCount} loan
                                {loanStats.overdueCount !== 1 ? 's are' : ' is'} past the due date.
                                Review and make payments to avoid penalties.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Tabs for Loan Types */}
            <Tabs defaultValue="given" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="given">
                        Loans Given
                        {loansGiven.length > 0 && (
                            <Badge variant="secondary" className="ml-2">
                                {loansGiven.length}
                            </Badge>
                        )}
                    </TabsTrigger>
                    <TabsTrigger value="taken">
                        Loans Taken
                        {loansTaken.length > 0 && (
                            <Badge variant="secondary" className="ml-2">
                                {loansTaken.length}
                            </Badge>
                        )}
                    </TabsTrigger>
                    <TabsTrigger value="completed">
                        Completed
                        {completedLoans.length > 0 && (
                            <Badge variant="secondary" className="ml-2">
                                {completedLoans.length}
                            </Badge>
                        )}
                    </TabsTrigger>
                    <TabsTrigger value="payments">
                        Payment History
                        {payments.length > 0 && (
                            <Badge variant="secondary" className="ml-2">
                                {payments.length}
                            </Badge>
                        )}
                    </TabsTrigger>
                </TabsList>

                {/* Loans Given Tab */}
                <TabsContent value="given" className="space-y-4">
                    {loansGiven.length === 0 ? (
                        <Card>
                            <CardContent className="flex flex-col items-center justify-center py-12">
                                <ArrowDownLeft className="h-12 w-12 text-muted-foreground mb-4" />
                                <h3 className="text-lg font-semibold mb-2">No Loans Given</h3>
                                <p className="text-sm text-muted-foreground text-center mb-4">
                                    Track money you've lent to others and receive payments
                                </p>
                                <AddLoanDialog />
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                            {loansGiven.map((loan) => (
                                <LoanCard
                                    key={loan.id}
                                    loan={loan}
                                    onMakePayment={handleMakePayment}
                                />
                            ))}
                        </div>
                    )}
                </TabsContent>

                {/* Loans Taken Tab */}
                <TabsContent value="taken" className="space-y-4">
                    {loansTaken.length === 0 ? (
                        <Card>
                            <CardContent className="flex flex-col items-center justify-center py-12">
                                <ArrowUpRight className="h-12 w-12 text-muted-foreground mb-4" />
                                <h3 className="text-lg font-semibold mb-2">No Loans Taken</h3>
                                <p className="text-sm text-muted-foreground text-center mb-4">
                                    Track money you've borrowed and manage repayments
                                </p>
                                <AddLoanDialog />
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                            {loansTaken.map((loan) => (
                                <LoanCard
                                    key={loan.id}
                                    loan={loan}
                                    onMakePayment={handleMakePayment}
                                />
                            ))}
                        </div>
                    )}
                </TabsContent>

                {/* Completed Loans Tab */}
                <TabsContent value="completed" className="space-y-4">
                    {completedLoans.length === 0 ? (
                        <Card>
                            <CardContent className="flex flex-col items-center justify-center py-12">
                                <HandCoins className="h-12 w-12 text-muted-foreground mb-4" />
                                <h3 className="text-lg font-semibold mb-2">No Completed Loans</h3>
                                <p className="text-sm text-muted-foreground text-center">
                                    Fully paid loans will appear here
                                </p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                            {completedLoans.map((loan) => (
                                <LoanCard key={loan.id} loan={loan} />
                            ))}
                        </div>
                    )}
                </TabsContent>

                {/* Payment History Tab */}
                <TabsContent value="payments" className="space-y-4">
                    {paymentsLoading ? (
                        <div className="space-y-2">
                            {[1, 2, 3].map((i) => (
                                <Skeleton key={i} className="h-16" />
                            ))}
                        </div>
                    ) : payments.length === 0 ? (
                        <Card>
                            <CardContent className="flex flex-col items-center justify-center py-12">
                                <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
                                <h3 className="text-lg font-semibold mb-2">No Payments Yet</h3>
                                <p className="text-sm text-muted-foreground text-center">
                                    Payment history will appear here once you process loan payments
                                </p>
                            </CardContent>
                        </Card>
                    ) : (
                        <Card>
                            <CardHeader>
                                <CardTitle>Recent Payments</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {recentPayments.map((payment) => {
                                        const loan = loans.find((l) => l.id === payment.loan_id);
                                        const isGiven = loan?.loan_type === 'given';
                                        return (
                                            <div
                                                key={payment.id}
                                                className="flex items-center justify-between pb-4 border-b last:border-0 last:pb-0"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div
                                                        className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                                            isGiven ? 'bg-green-100 dark:bg-green-950' : 'bg-red-100 dark:bg-red-950'
                                                        }`}
                                                    >
                                                        {isGiven ? (
                                                            <ArrowDownLeft className="w-5 h-5 text-green-600" />
                                                        ) : (
                                                            <ArrowUpRight className="w-5 h-5 text-red-600" />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="font-medium">
                                                            {loan?.party_name || 'Unknown'}
                                                        </p>
                                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                            <span>
                                                                {format(
                                                                    new Date(payment.payment_date),
                                                                    'MMM dd, yyyy'
                                                                )}
                                                            </span>
                                                            <span>•</span>
                                                            <Badge variant="outline" className="text-xs">
                                                                {isGiven ? 'Received' : 'Paid'}
                                                            </Badge>
                                                            <span>•</span>
                                                            <span className="text-xs">
                                                                Principal: ${payment.principal_paid.toFixed(2)}
                                                                {payment.interest_paid > 0 &&
                                                                    `, Interest: $${payment.interest_paid.toFixed(2)}`}
                                                            </span>
                                                        </div>
                                                        {payment.notes && (
                                                            <p className="text-xs text-muted-foreground mt-1">
                                                                {payment.notes}
                                                            </p>
                                                        )}
                                                        {payment.receipt_number && (
                                                            <p className="text-xs text-muted-foreground mt-1">
                                                                Receipt: {payment.receipt_number}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className={`font-bold ${isGiven ? 'text-green-600' : 'text-red-600'}`}>
                                                        {isGiven ? '+' : '-'}${payment.payment_amount.toFixed(2)}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        Remaining: ${payment.outstanding_after.toFixed(2)}
                                                    </p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>
            </Tabs>

            {/* Payment Dialog */}
            {selectedLoan && (
                <LoanPaymentDialog
                    loan={selectedLoan}
                    open={paymentDialogOpen}
                    onOpenChange={setPaymentDialogOpen}
                />
            )}
        </div>
    );
}
