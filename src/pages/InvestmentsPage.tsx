/**
 * InvestmentsPage Component
 * Portfolio overview with P&L stats, investment list, and analytics
 */

import { useState } from 'react';
import { Plus, TrendingUp, DollarSign, PieChart, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { InvestmentCard, AddInvestmentDialog } from '@/components/investments';
import {
    useInvestmentsWithStats,
    usePortfolioSummary,
    useInvestmentBreakdown,
    useTopPerformers,
    useWorstPerformers,
    useDeleteInvestment,
} from '@/lib/hooks/use-investment-queries';
import type { InvestmentWithStats } from '@/lib/supabase/database.types';

export default function InvestmentsPage() {
    const [showAddDialog, setShowAddDialog] = useState(false);

    const { data: investments, isLoading } = useInvestmentsWithStats();
    const { data: summary } = usePortfolioSummary();
    const { data: breakdown } = useInvestmentBreakdown();
    const { data: topPerformers } = useTopPerformers(3);
    const { data: worstPerformers } = useWorstPerformers(3);
    const { mutate: deleteInvestment } = useDeleteInvestment();

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(amount);
    };

    const formatPercent = (percent: number) => {
        const formatted = Math.abs(percent).toFixed(2);
        return `${percent >= 0 ? '+' : '-'}${formatted}%`;
    };

    if (isLoading) {
        return (
            <div className="container mx-auto p-6 max-w-7xl">
                <div className="space-y-4">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="h-32 bg-muted animate-pulse rounded-lg" />
                    ))}
                </div>
            </div>
        );
    }

    const activeInvestments = investments?.filter(inv => inv.is_active) || [];

    return (
        <div className="container mx-auto p-6 max-w-7xl space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Investment Portfolio</h1>
                    <p className="text-muted-foreground mt-1">
                        Track your investments, monitor performance, and analyze returns
                    </p>
                </div>
                <Button onClick={() => setShowAddDialog(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Investment
                </Button>
            </div>

            {/* Portfolio Summary Cards */}
            {summary && (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Invested</CardTitle>
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{formatCurrency(summary.total_invested)}</div>
                            <p className="text-xs text-muted-foreground mt-1">
                                {summary.total_investments} investments
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Current Value</CardTitle>
                            <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{formatCurrency(summary.total_current_value)}</div>
                            <p className={`text-xs mt-1 ${summary.total_profit_loss >= 0 ? 'text-green-600' : 'text-red-600'
                                }`}>
                                {formatPercent(summary.total_profit_loss_percentage)} return
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Profit/Loss</CardTitle>
                            <TrendingUp className={`h-4 w-4 ${summary.total_profit_loss >= 0 ? 'text-green-500' : 'text-red-500'
                                }`} />
                        </CardHeader>
                        <CardContent>
                            <div className={`text-2xl font-bold ${summary.total_profit_loss >= 0 ? 'text-green-600' : 'text-red-600'
                                }`}>
                                {formatCurrency(Math.abs(summary.total_profit_loss))}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                {summary.total_profit_loss >= 0 ? 'Gain' : 'Loss'}
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Dividends</CardTitle>
                            <RefreshCw className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-blue-600">
                                {formatCurrency(summary.total_dividends)}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                Passive income
                            </p>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Investment Breakdown & Performance */}
            <div className="grid gap-6 md:grid-cols-2">
                {/* Investment Breakdown */}
                {breakdown && breakdown.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <PieChart className="h-5 w-5" />
                                Portfolio Breakdown
                            </CardTitle>
                            <CardDescription>Investment distribution by type</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {breakdown.map((item) => (
                                    <div key={item.investment_type}>
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-sm font-medium capitalize">
                                                {item.investment_type.replace('_', ' ')}
                                            </span>
                                            <span className="text-sm text-muted-foreground">
                                                {item.percentage_of_portfolio.toFixed(1)}%
                                            </span>
                                        </div>
                                        <div className="w-full bg-secondary rounded-full h-2">
                                            <div
                                                className="bg-primary h-2 rounded-full transition-all"
                                                style={{ width: `${item.percentage_of_portfolio}%` }}
                                            />
                                        </div>
                                        <div className="flex items-center justify-between mt-1">
                                            <span className="text-xs text-muted-foreground">
                                                {item.count} {item.count === 1 ? 'investment' : 'investments'}
                                            </span>
                                            <span className="text-xs font-medium">
                                                {formatCurrency(item.total_current_value)}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Top/Worst Performers */}
                <div className="space-y-4">
                    {/* Top Performers */}
                    {topPerformers && topPerformers.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-green-600">Top Performers</CardTitle>
                                <CardDescription>Highest returns</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {topPerformers.map((inv) => (
                                        <div key={inv.id} className="flex items-center justify-between">
                                            <div className="flex-1">
                                                <p className="text-sm font-medium">{inv.name}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {inv.symbol || inv.investment_type}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm font-bold text-green-600">
                                                    {formatPercent(inv.profit_loss_percentage || 0)}
                                                </p>
                                                <p className="text-xs text-green-600">
                                                    {formatCurrency(inv.profit_loss || 0)}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Worst Performers */}
                    {worstPerformers && worstPerformers.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-red-600">Needs Attention</CardTitle>
                                <CardDescription>Lowest returns</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {worstPerformers.map((inv) => (
                                        <div key={inv.id} className="flex items-center justify-between">
                                            <div className="flex-1">
                                                <p className="text-sm font-medium">{inv.name}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {inv.symbol || inv.investment_type}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm font-bold text-red-600">
                                                    {formatPercent(inv.profit_loss_percentage || 0)}
                                                </p>
                                                <p className="text-xs text-red-600">
                                                    {formatCurrency(Math.abs(inv.profit_loss || 0))}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>

            {/* Investments List */}
            <div>
                <h2 className="text-2xl font-bold mb-4">All Investments</h2>
                {activeInvestments.length === 0 ? (
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center py-12">
                            <TrendingUp className="h-12 w-12 text-muted-foreground mb-4" />
                            <h3 className="text-lg font-semibold mb-2">No investments yet</h3>
                            <p className="text-muted-foreground text-center mb-4">
                                Start building your portfolio by adding your first investment
                            </p>
                            <Button onClick={() => setShowAddDialog(true)}>
                                <Plus className="mr-2 h-4 w-4" />
                                Add Investment
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {activeInvestments.map((investment) => (
                            <InvestmentCard
                                key={investment.id}
                                investment={investment}
                                onDelete={(id) => {
                                    if (confirm('Are you sure you want to delete this investment?')) {
                                        deleteInvestment(id);
                                    }
                                }}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Add Investment Dialog */}
            <AddInvestmentDialog
                open={showAddDialog}
                onOpenChange={setShowAddDialog}
            />
        </div>
    );
}
