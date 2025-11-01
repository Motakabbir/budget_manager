/**
 * InvestmentCard Component
 * Displays investment details with P&L, ROI, and performance metrics
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreVertical, TrendingUp, TrendingDown, DollarSign, Calendar } from 'lucide-react';
import type { InvestmentWithStats } from '@/lib/supabase/database.types';
import { calculateInvestmentStats } from '@/lib/hooks/use-investment-queries';

interface InvestmentCardProps {
    investment: InvestmentWithStats;
    onEdit?: (investment: InvestmentWithStats) => void;
    onDelete?: (id: string) => void;
    onSell?: (investment: InvestmentWithStats) => void;
    onRecordDividend?: (investment: InvestmentWithStats) => void;
}

export function InvestmentCard({
    investment,
    onEdit,
    onDelete,
    onSell,
    onRecordDividend,
}: InvestmentCardProps) {
    const stats = calculateInvestmentStats(investment);
    const isProfit = (stats.profit_loss ?? 0) >= 0;
    const hasSymbol = investment.symbol && investment.symbol.trim() !== '';

    // Format currency
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: investment.currency || 'USD',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(amount);
    };

    // Format percentage
    const formatPercent = (percent: number) => {
        const formatted = Math.abs(percent).toFixed(2);
        return `${percent >= 0 ? '+' : '-'}${formatted}%`;
    };

    // Format investment type
    const formatType = (type: string) => {
        return type
            .split('_')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    };

    return (
        <Card className={`hover:shadow-md transition-shadow ${!investment.is_active ? 'opacity-60' : ''}`}>
            <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                            <CardTitle className="text-lg font-semibold">
                                {investment.name}
                            </CardTitle>
                            {!investment.is_active && (
                                <Badge variant="secondary" className="text-xs">
                                    Sold
                                </Badge>
                            )}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            {hasSymbol && (
                                <span className="font-mono font-medium">{investment.symbol}</span>
                            )}
                            <Badge variant="outline" className="text-xs">
                                {formatType(investment.investment_type)}
                            </Badge>
                        </div>
                    </div>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            {onEdit && (
                                <DropdownMenuItem onClick={() => onEdit(stats)}>
                                    Edit Investment
                                </DropdownMenuItem>
                            )}
                            {onRecordDividend && investment.is_active && (
                                <DropdownMenuItem onClick={() => onRecordDividend(stats)}>
                                    Record Dividend
                                </DropdownMenuItem>
                            )}
                            {onSell && investment.is_active && (
                                <DropdownMenuItem onClick={() => onSell(stats)}>
                                    Sell Investment
                                </DropdownMenuItem>
                            )}
                            {onDelete && (
                                <DropdownMenuItem
                                    onClick={() => onDelete(investment.id)}
                                    className="text-destructive"
                                >
                                    Delete
                                </DropdownMenuItem>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </CardHeader>

            <CardContent className="space-y-4">
                {/* Investment Details */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <p className="text-xs text-muted-foreground mb-1">Quantity</p>
                        <p className="text-sm font-medium">
                            {investment.quantity.toLocaleString('en-US', {
                                minimumFractionDigits: 0,
                                maximumFractionDigits: 8,
                            })}
                        </p>
                    </div>
                    <div>
                        <p className="text-xs text-muted-foreground mb-1">Purchase Price</p>
                        <p className="text-sm font-medium">
                            {formatCurrency(investment.purchase_price)}
                        </p>
                    </div>
                    <div>
                        <p className="text-xs text-muted-foreground mb-1">Current Price</p>
                        <p className="text-sm font-medium">
                            {formatCurrency(investment.current_price)}
                        </p>
                    </div>
                    <div>
                        <p className="text-xs text-muted-foreground mb-1">Current Value</p>
                        <p className="text-sm font-semibold">
                            {formatCurrency(stats.current_value ?? 0)}
                        </p>
                    </div>
                </div>

                {/* Profit/Loss Section */}
                <div className="pt-3 border-t">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                            {isProfit ? (
                                <TrendingUp className="h-4 w-4 text-green-500" />
                            ) : (
                                <TrendingDown className="h-4 w-4 text-red-500" />
                            )}
                            <span className="text-xs font-medium text-muted-foreground">
                                Profit/Loss
                            </span>
                        </div>
                        <div className="text-right">
                            <p className={`text-sm font-bold ${isProfit ? 'text-green-600' : 'text-red-600'}`}>
                                {formatCurrency(Math.abs(stats.profit_loss ?? 0))}
                            </p>
                            <p className={`text-xs ${isProfit ? 'text-green-600' : 'text-red-600'}`}>
                                {formatPercent(stats.profit_loss_percentage ?? 0)}
                            </p>
                        </div>
                    </div>

                    {/* ROI (includes dividends) */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4 text-blue-500" />
                            <span className="text-xs font-medium text-muted-foreground">
                                ROI (with dividends)
                            </span>
                        </div>
                        <div className="text-right">
                            <p className={`text-sm font-bold ${(stats.roi_percentage ?? 0) >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                                {formatPercent(stats.roi_percentage ?? 0)}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Additional Info */}
                <div className="pt-3 border-t space-y-2">
                    {investment.total_dividends_received > 0 && (
                        <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">Total Dividends</span>
                            <span className="font-medium text-green-600">
                                {formatCurrency(investment.total_dividends_received)}
                            </span>
                        </div>
                    )}

                    <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1 text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            <span>Held for {stats.days_held} days</span>
                        </div>
                        {investment.platform && (
                            <span className="text-muted-foreground">via {investment.platform}</span>
                        )}
                    </div>

                    <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Purchase Date</span>
                        <span className="font-medium">
                            {new Date(investment.purchase_date).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                            })}
                        </span>
                    </div>
                </div>

                {/* Notes */}
                {investment.notes && (
                    <div className="pt-3 border-t">
                        <p className="text-xs text-muted-foreground mb-1">Notes</p>
                        <p className="text-xs">{investment.notes}</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
