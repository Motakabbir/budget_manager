import { useState, useMemo } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
    AddCardDialog,
    CardItem,
    CardPaymentDialog,
} from '@/components/payment-cards';
import {
    usePaymentCards,
    useCardPayments,
    type PaymentCard,
} from '@/lib/hooks/use-budget-queries';
import { CreditCard, TrendingUp, DollarSign, AlertCircle, Calendar } from 'lucide-react';
import { format } from 'date-fns';

export default function CardsPage() {
    const [selectedCard, setSelectedCard] = useState<PaymentCard | null>(null);
    const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);

    const { data: cards = [], isLoading: cardsLoading } = usePaymentCards();
    const { data: payments = [], isLoading: paymentsLoading } = useCardPayments();

    // Separate cards by type
    const debitCards = cards.filter((card) => card.card_type === 'debit' && card.is_active);
    const creditCards = cards.filter((card) => card.card_type === 'credit' && card.is_active);

    // Calculate credit card statistics
    const creditStats = useMemo(() => {
        const stats = {
            totalBalance: 0,
            totalLimit: 0,
            totalAvailable: 0,
            avgUtilization: 0,
            highUtilization: 0, // Count of cards with >80% utilization
        };

        creditCards.forEach((card) => {
            if (card.credit_limit) {
                stats.totalBalance += card.current_balance || 0;
                stats.totalLimit += card.credit_limit;
                stats.totalAvailable += card.credit_limit - (card.current_balance || 0);

                const utilization =
                    card.credit_limit > 0
                        ? ((card.current_balance || 0) / card.credit_limit) * 100
                        : 0;

                if (utilization > 80) {
                    stats.highUtilization++;
                }
            }
        });

        stats.avgUtilization =
            stats.totalLimit > 0 ? (stats.totalBalance / stats.totalLimit) * 100 : 0;

        return stats;
    }, [creditCards]);

    // Recent payments
    const recentPayments = useMemo(() => {
        return [...payments]
            .sort(
                (a, b) =>
                    new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime()
            )
            .slice(0, 10);
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

    const handleMakePayment = (card: PaymentCard) => {
        setSelectedCard(card);
        setPaymentDialogOpen(true);
    };

    if (cardsLoading) {
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
                <h1 className="text-3xl font-bold">Payment Cards</h1>
                <AddCardDialog />
            </div>

            {/* Credit Card Statistics */}
            {creditCards.length > 0 && (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Credit Balance</CardTitle>
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                ${creditStats.totalBalance.toFixed(2)}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Across {creditCards.length} card{creditCards.length !== 1 ? 's' : ''}
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Available Credit</CardTitle>
                            <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-600">
                                ${creditStats.totalAvailable.toFixed(2)}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                of ${creditStats.totalLimit.toFixed(2)} total limit
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Avg Utilization</CardTitle>
                            <CreditCard className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div
                                className={`text-2xl font-bold ${
                                    creditStats.avgUtilization > 80
                                        ? 'text-red-600'
                                        : creditStats.avgUtilization > 50
                                        ? 'text-orange-600'
                                        : 'text-green-600'
                                }`}
                            >
                                {creditStats.avgUtilization.toFixed(1)}%
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Keep below 30% for best credit score
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">This Month Payments</CardTitle>
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                ${totalPaidThisMonth.toFixed(2)}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                {thisMonthPayments.length} payment{thisMonthPayments.length !== 1 ? 's' : ''}
                            </p>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* High Utilization Warning */}
            {creditStats.highUtilization > 0 && (
                <Card className="border-orange-500 bg-orange-50 dark:bg-orange-950/20">
                    <CardContent className="flex items-center gap-3 pt-6">
                        <AlertCircle className="h-5 w-5 text-orange-600" />
                        <div>
                            <p className="font-medium text-orange-900 dark:text-orange-100">
                                High Credit Utilization
                            </p>
                            <p className="text-sm text-orange-700 dark:text-orange-300">
                                {creditStats.highUtilization} card
                                {creditStats.highUtilization !== 1 ? 's have' : ' has'} utilization
                                above 80%. Consider making payments to improve your credit score.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Tabs for Card Types */}
            <Tabs defaultValue="credit" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="credit">
                        Credit Cards
                        {creditCards.length > 0 && (
                            <Badge variant="secondary" className="ml-2">
                                {creditCards.length}
                            </Badge>
                        )}
                    </TabsTrigger>
                    <TabsTrigger value="debit">
                        Debit Cards
                        {debitCards.length > 0 && (
                            <Badge variant="secondary" className="ml-2">
                                {debitCards.length}
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

                {/* Credit Cards Tab */}
                <TabsContent value="credit" className="space-y-4">
                    {creditCards.length === 0 ? (
                        <Card>
                            <CardContent className="flex flex-col items-center justify-center py-12">
                                <CreditCard className="h-12 w-12 text-muted-foreground mb-4" />
                                <h3 className="text-lg font-semibold mb-2">No Credit Cards</h3>
                                <p className="text-sm text-muted-foreground text-center mb-4">
                                    Add your first credit card to track balances and payments
                                </p>
                                <AddCardDialog />
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                            {creditCards.map((card) => (
                                <CardItem
                                    key={card.id}
                                    card={card}
                                    onMakePayment={handleMakePayment}
                                />
                            ))}
                        </div>
                    )}
                </TabsContent>

                {/* Debit Cards Tab */}
                <TabsContent value="debit" className="space-y-4">
                    {debitCards.length === 0 ? (
                        <Card>
                            <CardContent className="flex flex-col items-center justify-center py-12">
                                <CreditCard className="h-12 w-12 text-muted-foreground mb-4" />
                                <h3 className="text-lg font-semibold mb-2">No Debit Cards</h3>
                                <p className="text-sm text-muted-foreground text-center mb-4">
                                    Add your debit cards to track spending from bank accounts
                                </p>
                                <AddCardDialog />
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                            {debitCards.map((card) => (
                                <CardItem key={card.id} card={card} />
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
                                    Payment history will appear here once you make card payments
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
                                        const card = cards.find((c) => c.id === payment.card_id);
                                        return (
                                            <div
                                                key={payment.id}
                                                className="flex items-center justify-between pb-4 border-b last:border-0 last:pb-0"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div
                                                        className="w-10 h-10 rounded-lg flex items-center justify-center"
                                                        style={{
                                                            backgroundColor:
                                                                card?.color + '20' || '#6366f120',
                                                        }}
                                                    >
                                                        <CreditCard
                                                            className="w-5 h-5"
                                                            style={{
                                                                color: card?.color || '#6366f1',
                                                            }}
                                                        />
                                                    </div>
                                                    <div>
                                                        <p className="font-medium">
                                                            {card?.card_name || 'Unknown Card'}
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
                                                                {payment.payment_method?.replace('_', ' ') || 'N/A'}
                                                            </Badge>
                                                        </div>
                                                        {payment.notes && (
                                                            <p className="text-xs text-muted-foreground mt-1">
                                                                {payment.notes}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-bold text-green-600">
                                                        -${payment.payment_amount.toFixed(2)}
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
            <CardPaymentDialog
                card={selectedCard}
                open={paymentDialogOpen}
                onOpenChange={setPaymentDialogOpen}
            />
        </div>
    );
}
