/**
 * AssetCard Component
 * Displays asset details with depreciation, insurance, and warranty tracking
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
import {
    MoreVertical,
    TrendingDown,
    Shield,
    ShieldAlert,
    ShieldCheck,
    Calendar,
    AlertTriangle,
} from 'lucide-react';
import type { AssetWithStats } from '@/lib/supabase/database.types';
import { calculateAssetStats } from '@/lib/hooks/use-asset-queries';

interface AssetCardProps {
    asset: AssetWithStats;
    onEdit?: (asset: AssetWithStats) => void;
    onDelete?: (id: string) => void;
    onSell?: (asset: AssetWithStats) => void;
    onUpdateInsurance?: (asset: AssetWithStats) => void;
}

export function AssetCard({
    asset,
    onEdit,
    onDelete,
    onSell,
    onUpdateInsurance,
}: AssetCardProps) {
    const stats = calculateAssetStats(asset);

    // Format currency
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(amount);
    };

    // Format asset type
    const formatType = (type: string) => {
        return type
            .split('_')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    };

    // Get insurance icon and color
    const getInsuranceIndicator = () => {
        switch (stats.insurance_status) {
            case 'valid':
                return { icon: ShieldCheck, color: 'text-green-500', label: 'Insured' };
            case 'expiring_soon':
                return { icon: ShieldAlert, color: 'text-yellow-500', label: 'Expiring Soon' };
            case 'expired':
                return { icon: AlertTriangle, color: 'text-red-500', label: 'Expired' };
            default:
                return { icon: Shield, color: 'text-gray-400', label: 'Not Insured' };
        }
    };

    const insuranceIndicator = getInsuranceIndicator();
    const InsuranceIcon = insuranceIndicator.icon;

    return (
        <Card className={`hover:shadow-md transition-shadow ${!asset.is_active ? 'opacity-60' : ''}`}>
            <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                            <CardTitle className="text-lg font-semibold">
                                {asset.name}
                            </CardTitle>
                            {!asset.is_active && (
                                <Badge variant="secondary" className="text-xs">
                                    Sold
                                </Badge>
                            )}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Badge variant="outline" className="text-xs">
                                {formatType(asset.asset_type)}
                            </Badge>
                            {asset.brand && (
                                <span className="text-xs">{asset.brand}</span>
                            )}
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
                                    Edit Asset
                                </DropdownMenuItem>
                            )}
                            {onUpdateInsurance && asset.is_active && (
                                <DropdownMenuItem onClick={() => onUpdateInsurance(stats)}>
                                    Update Insurance
                                </DropdownMenuItem>
                            )}
                            {onSell && asset.is_active && (
                                <DropdownMenuItem onClick={() => onSell(stats)}>
                                    Sell Asset
                                </DropdownMenuItem>
                            )}
                            {onDelete && (
                                <DropdownMenuItem
                                    onClick={() => onDelete(asset.id)}
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
                {/* Asset Details */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <p className="text-xs text-muted-foreground mb-1">Purchase Price</p>
                        <p className="text-sm font-medium">
                            {formatCurrency(asset.purchase_price)}
                        </p>
                    </div>
                    <div>
                        <p className="text-xs text-muted-foreground mb-1">Current Value</p>
                        <p className="text-sm font-semibold">
                            {formatCurrency(asset.current_value)}
                        </p>
                    </div>
                    {asset.condition && (
                        <div>
                            <p className="text-xs text-muted-foreground mb-1">Condition</p>
                            <Badge
                                variant={asset.condition === 'excellent' ? 'default' : 'secondary'}
                                className="text-xs"
                            >
                                {asset.condition.charAt(0).toUpperCase() + asset.condition.slice(1)}
                            </Badge>
                        </div>
                    )}
                    <div>
                        <p className="text-xs text-muted-foreground mb-1">Age</p>
                        <p className="text-sm font-medium">
                            {(stats.age_years ?? 0) > 0
                                ? `${stats.age_years}y ${stats.age_months}m`
                                : `${stats.age_months}m`
                            }
                        </p>
                    </div>
                </div>

                {/* Depreciation Section */}
                <div className="pt-3 border-t">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                            <TrendingDown className="h-4 w-4 text-orange-500" />
                            <span className="text-xs font-medium text-muted-foreground">
                                Total Depreciation
                            </span>
                        </div>
                        <div className="text-right">
                            <p className="text-sm font-bold text-orange-600">
                                {formatCurrency(stats.total_depreciation ?? 0)}
                            </p>
                            <p className="text-xs text-orange-600">
                                {(stats.depreciation_percentage ?? 0).toFixed(1)}%
                            </p>
                        </div>
                    </div>

                    {(stats.avg_annual_depreciation ?? 0) > 0 && (
                        <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">Avg. Annual Depreciation</span>
                            <span className="font-medium">
                                {formatCurrency(stats.avg_annual_depreciation ?? 0)}
                            </span>
                        </div>
                    )}
                </div>

                {/* Insurance & Warranty Section */}
                <div className="pt-3 border-t space-y-2">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <InsuranceIcon className={`h-4 w-4 ${insuranceIndicator.color}`} />
                            <span className="text-xs font-medium text-muted-foreground">
                                Insurance
                            </span>
                        </div>
                        <Badge
                            variant={stats.insurance_status === 'valid' ? 'default' : 'secondary'}
                            className="text-xs"
                        >
                            {insuranceIndicator.label}
                        </Badge>
                    </div>

                    {asset.insurance_expiry_date && asset.is_insured && (
                        <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">Expires</span>
                            <span className={`font-medium ${stats.insurance_status === 'expiring_soon' ? 'text-yellow-600' :
                                    stats.insurance_status === 'expired' ? 'text-red-600' :
                                        'text-green-600'
                                }`}>
                                {new Date(asset.insurance_expiry_date).toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric',
                                })}
                            </span>
                        </div>
                    )}

                    {asset.warranty_expiry_date && (
                        <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">Warranty</span>
                            <Badge
                                variant={stats.warranty_status === 'valid' ? 'default' : 'secondary'}
                                className="text-xs"
                            >
                                {stats.warranty_status === 'valid' ? 'Active' :
                                    stats.warranty_status === 'expiring_soon' ? 'Expiring Soon' :
                                        stats.warranty_status === 'expired' ? 'Expired' :
                                            'None'}
                            </Badge>
                        </div>
                    )}
                </div>

                {/* Asset-Specific Info */}
                <div className="pt-3 border-t space-y-2">
                    {/* Property specifics */}
                    {asset.asset_type === 'property' && asset.property_address && (
                        <div className="text-xs">
                            <span className="text-muted-foreground">Address: </span>
                            <span className="font-medium">{asset.property_address}</span>
                        </div>
                    )}
                    {asset.property_size_sqft && (
                        <div className="text-xs">
                            <span className="text-muted-foreground">Size: </span>
                            <span className="font-medium">{asset.property_size_sqft.toLocaleString()} sq ft</span>
                        </div>
                    )}

                    {/* Vehicle specifics */}
                    {asset.asset_type === 'vehicle' && (
                        <>
                            {asset.vehicle_make && asset.vehicle_year && (
                                <div className="text-xs">
                                    <span className="text-muted-foreground">Vehicle: </span>
                                    <span className="font-medium">{asset.vehicle_year} {asset.vehicle_make}</span>
                                </div>
                            )}
                            {asset.vehicle_mileage && (
                                <div className="text-xs">
                                    <span className="text-muted-foreground">Mileage: </span>
                                    <span className="font-medium">{asset.vehicle_mileage.toLocaleString()} miles</span>
                                </div>
                            )}
                        </>
                    )}

                    {/* General info */}
                    {asset.serial_number && (
                        <div className="text-xs">
                            <span className="text-muted-foreground">Serial: </span>
                            <span className="font-mono font-medium text-[10px]">{asset.serial_number}</span>
                        </div>
                    )}

                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        <span>Purchased {new Date(asset.purchase_date).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                        })}</span>
                    </div>
                </div>

                {/* Sale Info */}
                {!asset.is_active && asset.sale_price && stats.sale_profit_loss !== null && (
                    <div className="pt-3 border-t">
                        <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">Sale Price</span>
                            <span className="font-medium">{formatCurrency(asset.sale_price)}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">Sale Profit/Loss</span>
                            <span className={`font-bold ${(stats.sale_profit_loss ?? 0) >= 0 ? 'text-green-600' : 'text-red-600'
                                }`}>
                                {(stats.sale_profit_loss ?? 0) >= 0 ? '+' : ''}
                                {formatCurrency(stats.sale_profit_loss ?? 0)}
                            </span>
                        </div>
                    </div>
                )}

                {/* Notes */}
                {asset.notes && (
                    <div className="pt-3 border-t">
                        <p className="text-xs text-muted-foreground mb-1">Notes</p>
                        <p className="text-xs">{asset.notes}</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
