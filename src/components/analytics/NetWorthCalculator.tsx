import { usePortfolioSummary } from '@/lib/hooks/use-investment-queries';
import { useAssetsSummary } from '@/lib/hooks/use-asset-queries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Wallet, Briefcase } from 'lucide-react';
import { useMemo } from 'react';

export function NetWorthCalculator() {
    const { data: investmentsSummary, isLoading: loadingInvestments } = usePortfolioSummary();
    const { data: assetsSummary, isLoading: loadingAssets } = useAssetsSummary();

    const isLoading = loadingInvestments || loadingAssets;

    const netWorthData = useMemo(() => {
        // Assets (only investments and physical assets for now)
        const investmentsValue = investmentsSummary?.total_current_value || 0;
        const assetsValue = assetsSummary?.total_current_value || 0;

        const totalAssets = investmentsValue + assetsValue;
        const totalLiabilities = 0; // Can be expanded when bank/card/loan hooks are added
        const netWorth = totalAssets - totalLiabilities;

        return {
            assets: {
                investments: investmentsValue,
                physicalAssets: assetsValue,
                total: totalAssets,
            },
            liabilities: {
                total: totalLiabilities,
            },
            netWorth,
        };
    }, [investmentsSummary, assetsSummary]);

    const assetBreakdown = useMemo(() => {
        const total = netWorthData.assets.total;
        if (total === 0) return [];

        return [
            {
                name: 'Investments',
                value: netWorthData.assets.investments,
                percentage: (netWorthData.assets.investments / total) * 100,
                icon: Wallet,
                color: 'hsl(var(--chart-2))',
            },
            {
                name: 'Physical Assets',
                value: netWorthData.assets.physicalAssets,
                percentage: (netWorthData.assets.physicalAssets / total) * 100,
                icon: Briefcase,
                color: 'hsl(var(--chart-3))',
            },
        ].filter((item) => item.value > 0);
    }, [netWorthData]);

    const liabilityBreakdown = useMemo(() => {
        // Placeholder for future expansion
        return [];
    }, []);

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Net Worth Calculator</CardTitle>
                    <CardDescription>Your total financial position</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="h-[400px] flex items-center justify-center">
                        <div className="animate-pulse text-muted-foreground">Calculating net worth...</div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Net Worth Calculator</CardTitle>
                <CardDescription>Investments & Assets portfolio value</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Net Worth Summary */}
                <div className="p-6 bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg border-2 border-primary/20">
                    <div className="text-center space-y-2">
                        <p className="text-sm text-muted-foreground font-medium">Total Portfolio Value</p>
                        <p className="text-4xl font-bold text-green-600">
                            ${netWorthData.netWorth.toLocaleString()}
                        </p>
                        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                            <TrendingUp className="w-4 h-4 text-green-600" />
                            <span>Investments + Physical Assets</span>
                        </div>
                    </div>
                </div>

                {/* Assets Section */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <h4 className="text-sm font-semibold flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-green-600" />
                            Asset Breakdown
                        </h4>
                        <p className="text-lg font-bold text-green-600">
                            ${netWorthData.assets.total.toLocaleString()}
                        </p>
                    </div>
                    {assetBreakdown.length > 0 ? (
                        <div className="space-y-2">
                            {assetBreakdown.map((item, index) => {
                                const Icon = item.icon;
                                return (
                                    <div key={index} className="space-y-1">
                                        <div className="flex items-center justify-between text-sm">
                                            <div className="flex items-center gap-2">
                                                <Icon className="w-4 h-4" />
                                                <span className="font-medium">{item.name}</span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className="text-muted-foreground">
                                                    {item.percentage.toFixed(1)}%
                                                </span>
                                                <span className="font-semibold min-w-[6rem] text-right">
                                                    ${item.value.toLocaleString()}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                                            <div
                                                className="h-full transition-all"
                                                style={{
                                                    width: `${item.percentage}%`,
                                                    backgroundColor: item.color,
                                                }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <p className="text-sm text-muted-foreground py-4 text-center">No assets recorded</p>
                    )}
                </div>

                {/* Note about future expansion */}
                <div className="pt-4 border-t">
                    <p className="text-xs text-muted-foreground text-center">
                        Note: Full net worth calculation (including bank accounts, cards, and loans) will be available once all financial modules are integrated.
                    </p>
                </div>
            </CardContent>
        </Card>
    );
}
