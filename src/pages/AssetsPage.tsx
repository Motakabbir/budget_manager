/**
 * AssetsPage Component
 * Asset tracking with depreciation monitoring, insurance alerts, and analytics
 */

import { useState } from 'react';
import { Plus, Building2, TrendingDown, Shield, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AssetCard, AddAssetDialog } from '@/components/assets';
import {
    useAssetsWithStats,
    useAssetsSummary,
    useAssetBreakdown,
    useAssetsNeedingAttention,
    useMostValuableAssets,
    useDeleteAsset,
} from '@/lib/hooks/use-asset-queries';

export default function AssetsPage() {
    const [showAddDialog, setShowAddDialog] = useState(false);
    
    const { data: assets, isLoading } = useAssetsWithStats();
    const { data: summary } = useAssetsSummary();
    const { data: breakdown } = useAssetBreakdown();
    const { data: needsAttention } = useAssetsNeedingAttention();
    const { data: mostValuable } = useMostValuableAssets(3);
    const { mutate: deleteAsset } = useDeleteAsset();

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(amount);
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

    const activeAssets = assets?.filter(asset => asset.is_active) || [];

    return (
        <div className="container mx-auto p-6 max-w-7xl space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Assets</h1>
                    <p className="text-muted-foreground mt-1">
                        Track your assets, monitor depreciation, and manage insurance
                    </p>
                </div>
                <Button onClick={() => setShowAddDialog(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Asset
                </Button>
            </div>

            {/* Assets Summary Cards */}
            {summary && (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Assets</CardTitle>
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{summary.total_assets}</div>
                            <p className="text-xs text-muted-foreground mt-1">
                                Active assets
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Current Value</CardTitle>
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{formatCurrency(summary.total_current_value)}</div>
                            <p className="text-xs text-muted-foreground mt-1">
                                Total worth
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Depreciation</CardTitle>
                            <TrendingDown className="h-4 w-4 text-orange-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-orange-600">
                                {formatCurrency(summary.total_depreciation)}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                Value decrease
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Insured Assets</CardTitle>
                            <Shield className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-blue-600">
                                {summary.assets_insured_count}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                {formatCurrency(summary.total_insured_value)} covered
                            </p>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Asset Breakdown & Attention Needed */}
            <div className="grid gap-6 md:grid-cols-2">
                {/* Asset Breakdown */}
                {breakdown && breakdown.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Asset Breakdown</CardTitle>
                            <CardDescription>Asset distribution by type</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {breakdown.map((item) => (
                                    <div key={item.asset_type}>
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-sm font-medium capitalize">
                                                {item.asset_type}
                                            </span>
                                            <span className="text-sm text-muted-foreground">
                                                {item.percentage_of_total.toFixed(1)}%
                                            </span>
                                        </div>
                                        <div className="w-full bg-secondary rounded-full h-2">
                                            <div
                                                className="bg-primary h-2 rounded-full transition-all"
                                                style={{ width: `${item.percentage_of_total}%` }}
                                            />
                                        </div>
                                        <div className="flex items-center justify-between mt-1">
                                            <span className="text-xs text-muted-foreground">
                                                {item.count} {item.count === 1 ? 'asset' : 'assets'}
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

                {/* Attention Needed & Most Valuable */}
                <div className="space-y-4">
                    {/* Attention Needed */}
                    {needsAttention && needsAttention.length > 0 && (
                        <Card className="border-yellow-200">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-yellow-600">
                                    <AlertTriangle className="h-5 w-5" />
                                    Needs Attention
                                </CardTitle>
                                <CardDescription>Expired or expiring coverage</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {needsAttention.slice(0, 5).map((asset) => (
                                        <div key={asset.id} className="flex items-center justify-between">
                                            <div className="flex-1">
                                                <p className="text-sm font-medium">{asset.name}</p>
                                                <div className="flex gap-2 mt-1">
                                                    {asset.insurance_status === 'expired' && (
                                                        <Badge variant="destructive" className="text-xs">
                                                            Insurance Expired
                                                        </Badge>
                                                    )}
                                                    {asset.insurance_status === 'expiring_soon' && (
                                                        <Badge variant="secondary" className="text-xs">
                                                            Insurance Expiring
                                                        </Badge>
                                                    )}
                                                    {asset.warranty_status === 'expired' && (
                                                        <Badge variant="destructive" className="text-xs">
                                                            Warranty Expired
                                                        </Badge>
                                                    )}
                                                    {asset.warranty_status === 'expiring_soon' && (
                                                        <Badge variant="secondary" className="text-xs">
                                                            Warranty Expiring
                                                        </Badge>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Most Valuable */}
                    {mostValuable && mostValuable.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Most Valuable Assets</CardTitle>
                                <CardDescription>Top assets by value</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {mostValuable.map((asset) => (
                                        <div key={asset.id} className="flex items-center justify-between">
                                            <div className="flex-1">
                                                <p className="text-sm font-medium">{asset.name}</p>
                                                <p className="text-xs text-muted-foreground capitalize">
                                                    {asset.asset_type}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm font-bold">
                                                    {formatCurrency(asset.current_value)}
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

            {/* Assets List */}
            <div>
                <h2 className="text-2xl font-bold mb-4">All Assets</h2>
                {activeAssets.length === 0 ? (
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center py-12">
                            <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
                            <h3 className="text-lg font-semibold mb-2">No assets yet</h3>
                            <p className="text-muted-foreground text-center mb-4">
                                Start tracking your assets by adding your first one
                            </p>
                            <Button onClick={() => setShowAddDialog(true)}>
                                <Plus className="mr-2 h-4 w-4" />
                                Add Asset
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {activeAssets.map((asset) => (
                            <AssetCard
                                key={asset.id}
                                asset={asset}
                                onDelete={(id) => {
                                    if (confirm('Are you sure you want to delete this asset?')) {
                                        deleteAsset(id);
                                    }
                                }}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Add Asset Dialog */}
            <AddAssetDialog
                open={showAddDialog}
                onOpenChange={setShowAddDialog}
            />
        </div>
    );
}
