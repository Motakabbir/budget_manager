import { useInvestmentsWithStats } from '@/lib/hooks/use-investment-queries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { useMemo } from 'react';

export function ROITracker() {
    const { data: investments, isLoading } = useInvestmentsWithStats();

    const roiData = useMemo(() => {
        if (!investments) return [];
        
        return investments
            .filter((inv) => inv.is_active)
            .map((inv) => {
                const totalInvested = inv.purchase_price * inv.quantity;
                const currentValue = inv.current_value || totalInvested;
                const profitLoss = currentValue - totalInvested + (inv.total_dividends_received || 0);
                const roi = totalInvested > 0 ? (profitLoss / totalInvested) * 100 : 0;
                const daysHeld = inv.days_held || 0;
                const annualizedROI = daysHeld > 0 ? (roi / daysHeld) * 365 : roi;

                return {
                    id: inv.id,
                    name: inv.name,
                    type: inv.investment_type,
                    totalInvested,
                    currentValue,
                    profitLoss,
                    roi,
                    annualizedROI,
                    daysHeld,
                    purchaseDate: inv.purchase_date,
                };
            })
            .sort((a, b) => b.roi - a.roi); // Sort by ROI descending
    }, [investments]);

    const summary = useMemo(() => {
        if (!roiData.length) return null;

        const totalInvested = roiData.reduce((sum, inv) => sum + inv.totalInvested, 0);
        const totalCurrentValue = roiData.reduce((sum, inv) => sum + inv.currentValue, 0);
        const totalProfitLoss = totalCurrentValue - totalInvested;
        const overallROI = totalInvested > 0 ? (totalProfitLoss / totalInvested) * 100 : 0;

        const winners = roiData.filter((inv) => inv.roi > 0).length;
        const losers = roiData.filter((inv) => inv.roi < 0).length;
        const neutral = roiData.filter((inv) => inv.roi === 0).length;

        return {
            totalInvested,
            totalCurrentValue,
            totalProfitLoss,
            overallROI,
            winners,
            losers,
            neutral,
            count: roiData.length,
        };
    }, [roiData]);

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>ROI Tracker</CardTitle>
                    <CardDescription>Return on Investment analysis</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="h-[300px] flex items-center justify-center">
                        <div className="animate-pulse text-muted-foreground">Loading data...</div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (!roiData.length) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>ROI Tracker</CardTitle>
                    <CardDescription>Return on Investment analysis</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="h-[300px] flex items-center justify-center">
                        <p className="text-sm text-muted-foreground">No active investments to track</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>ROI Tracker</CardTitle>
                <CardDescription>Return on Investment analysis for {summary?.count} active investments</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Summary Stats */}
                {summary && (
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-muted/50 rounded-lg">
                        <div>
                            <p className="text-xs text-muted-foreground">Overall ROI</p>
                            <p className={`text-2xl font-bold ${summary.overallROI >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {summary.overallROI >= 0 ? '+' : ''}{summary.overallROI.toFixed(2)}%
                            </p>
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground">Total P&L</p>
                            <p className={`text-2xl font-bold ${summary.totalProfitLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {summary.totalProfitLoss >= 0 ? '+' : ''}${summary.totalProfitLoss.toLocaleString()}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground">Winners</p>
                            <p className="text-2xl font-bold text-green-600">{summary.winners}</p>
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground">Losers</p>
                            <p className="text-2xl font-bold text-red-600">{summary.losers}</p>
                        </div>
                    </div>
                )}

                {/* ROI List */}
                <div className="space-y-2">
                    <h4 className="text-sm font-medium text-muted-foreground">Investment Performance</h4>
                    <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                        {roiData.map((inv) => (
                            <div
                                key={inv.id}
                                className="flex items-center justify-between gap-4 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                            >
                                <div className="flex items-center gap-3 min-w-0 flex-1">
                                    {inv.roi > 0 ? (
                                        <TrendingUp className="w-4 h-4 text-green-600 flex-shrink-0" />
                                    ) : inv.roi < 0 ? (
                                        <TrendingDown className="w-4 h-4 text-red-600 flex-shrink-0" />
                                    ) : (
                                        <Minus className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                                    )}
                                    <div className="min-w-0 flex-1">
                                        <p className="font-medium truncate">{inv.name}</p>
                                        <p className="text-xs text-muted-foreground capitalize">
                                            {inv.type.replace(/_/g, ' ')} · {inv.daysHeld} days
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 flex-shrink-0">
                                    <div className="text-right">
                                        <p className={`text-sm font-semibold ${inv.roi >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                            {inv.roi >= 0 ? '+' : ''}{inv.roi.toFixed(2)}%
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {inv.profitLoss >= 0 ? '+' : ''}${inv.profitLoss.toLocaleString()}
                                        </p>
                                    </div>
                                    <div className="text-right min-w-[5rem]">
                                        <p className="text-xs text-muted-foreground">Annualized</p>
                                        <p className={`text-sm font-medium ${inv.annualizedROI >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                            {inv.annualizedROI >= 0 ? '+' : ''}{inv.annualizedROI.toFixed(2)}%
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
