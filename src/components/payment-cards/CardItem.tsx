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
import { CreditCard, MoreVertical, Trash2, Edit, Eye, EyeOff } from 'lucide-react';
import type { PaymentCard } from '@/lib/hooks/use-budget-queries';
import { useDeletePaymentCard } from '@/lib/hooks/use-budget-queries';
import { format } from 'date-fns';

interface CardItemProps {
    card: PaymentCard;
    onEdit?: (card: PaymentCard) => void;
    onMakePayment?: (card: PaymentCard) => void;
}

export function CardItem({ card, onEdit, onMakePayment }: CardItemProps) {
    const [showBalance, setShowBalance] = useState(true);
    const deleteCard = useDeletePaymentCard();

    const handleDelete = () => {
        if (
            confirm(
                `Are you sure you want to delete "${card.card_name}"? This will also delete all payment records.`
            )
        ) {
            deleteCard.mutate(card.id);
        }
    };

    const availableCredit =
        card.card_type === 'credit' && card.credit_limit
            ? card.credit_limit - (card.current_balance || 0)
            : 0;

    const creditUtilization =
        card.card_type === 'credit' && card.credit_limit
            ? ((card.current_balance || 0) / card.credit_limit) * 100
            : 0;

    const isExpiringSoon =
        card.expiry_date &&
        new Date(card.expiry_date) < new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);

    const isExpired = card.expiry_date && new Date(card.expiry_date) < new Date();

    return (
        <Card
            className="overflow-hidden transition-all hover:shadow-lg"
            style={{
                borderTop: `4px solid ${card.color}`,
            }}
        >
            <CardContent className="p-6">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div
                            className="w-12 h-12 rounded-lg flex items-center justify-center"
                            style={{ backgroundColor: card.color + '20' }}
                        >
                            <CreditCard
                                className="w-6 h-6"
                                style={{ color: card.color }}
                            />
                        </div>
                        <div>
                            <h3 className="font-semibold text-lg">{card.card_name}</h3>
                            <div className="flex items-center gap-2 mt-1">
                                <Badge variant={card.card_type === 'credit' ? 'default' : 'secondary'}>
                                    {card.card_type}
                                </Badge>
                                {card.card_network && (
                                    <span className="text-sm text-muted-foreground">
                                        {card.card_network}
                                    </span>
                                )}
                                {card.last_four_digits && (
                                    <span className="text-sm text-muted-foreground">
                                        •••• {card.last_four_digits}
                                    </span>
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
                            {card.card_type === 'credit' && onMakePayment && (
                                <DropdownMenuItem onClick={() => onMakePayment(card)}>
                                    Make Payment
                                </DropdownMenuItem>
                            )}
                            {onEdit && (
                                <DropdownMenuItem onClick={() => onEdit(card)}>
                                    <Edit className="mr-2 h-4 w-4" />
                                    Edit
                                </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                                onClick={handleDelete}
                                className="text-destructive"
                            >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                {/* Balance Section */}
                <div className="space-y-3">
                    {card.card_type === 'credit' ? (
                        <>
                            {/* Credit Card Balance */}
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">Current Balance</span>
                                <div className="flex items-center gap-2">
                                    <span className="text-xl font-bold">
                                        {showBalance
                                            ? `$${(card.current_balance || 0).toFixed(2)}`
                                            : '••••'}
                                    </span>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6"
                                        onClick={() => setShowBalance(!showBalance)}
                                    >
                                        {showBalance ? (
                                            <EyeOff className="h-3 w-3" />
                                        ) : (
                                            <Eye className="h-3 w-3" />
                                        )}
                                    </Button>
                                </div>
                            </div>

                            {/* Credit Limit */}
                            {card.credit_limit && (
                                <>
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-muted-foreground">Credit Limit</span>
                                        <span className="font-medium">
                                            ${card.credit_limit.toFixed(2)}
                                        </span>
                                    </div>

                                    {/* Available Credit */}
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-muted-foreground">Available</span>
                                        <span
                                            className="font-medium"
                                            style={{
                                                color:
                                                    availableCredit < card.credit_limit * 0.1
                                                        ? '#ef4444'
                                                        : '#10b981',
                                            }}
                                        >
                                            ${availableCredit.toFixed(2)}
                                        </span>
                                    </div>

                                    {/* Utilization Bar */}
                                    <div className="space-y-1">
                                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                                            <span>Utilization</span>
                                            <span>{creditUtilization.toFixed(1)}%</span>
                                        </div>
                                        <div className="h-2 bg-secondary rounded-full overflow-hidden">
                                            <div
                                                className="h-full transition-all"
                                                style={{
                                                    width: `${Math.min(creditUtilization, 100)}%`,
                                                    backgroundColor:
                                                        creditUtilization > 80
                                                            ? '#ef4444'
                                                            : creditUtilization > 50
                                                            ? '#f59e0b'
                                                            : card.color,
                                                }}
                                            />
                                        </div>
                                    </div>
                                </>
                            )}

                            {/* Interest Rate */}
                            {card.interest_rate && (
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">APR</span>
                                    <span className="font-medium">{card.interest_rate.toFixed(2)}%</span>
                                </div>
                            )}

                            {/* Billing Info */}
                            {(card.billing_cycle_day || card.payment_due_day) && (
                                <div className="pt-2 border-t">
                                    <div className="grid grid-cols-2 gap-2 text-xs">
                                        {card.billing_cycle_day && (
                                            <div>
                                                <span className="text-muted-foreground">Billing: </span>
                                                <span className="font-medium">Day {card.billing_cycle_day}</span>
                                            </div>
                                        )}
                                        {card.payment_due_day && (
                                            <div>
                                                <span className="text-muted-foreground">Due: </span>
                                                <span className="font-medium">Day {card.payment_due_day}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </>
                    ) : (
                        /* Debit Card - No Balance Display */
                        <div className="py-2 text-center text-sm text-muted-foreground">
                            Debit Card - Balance tracked in linked bank account
                        </div>
                    )}

                    {/* Expiry Date */}
                    {card.expiry_date && (
                        <div className="flex items-center justify-between text-sm pt-2 border-t">
                            <span className="text-muted-foreground">Expires</span>
                            <span
                                className={`font-medium ${
                                    isExpired
                                        ? 'text-red-500'
                                        : isExpiringSoon
                                        ? 'text-orange-500'
                                        : ''
                                }`}
                            >
                                {format(new Date(card.expiry_date), 'MM/yyyy')}
                                {isExpired && ' (Expired)'}
                                {!isExpired && isExpiringSoon && ' (Expiring Soon)'}
                            </span>
                        </div>
                    )}

                    {/* Cardholder Name */}
                    {card.cardholder_name && (
                        <div className="text-xs text-muted-foreground pt-1">
                            {card.cardholder_name}
                        </div>
                    )}

                    {/* Notes */}
                    {card.notes && (
                        <div className="pt-2 border-t">
                            <p className="text-xs text-muted-foreground">{card.notes}</p>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
